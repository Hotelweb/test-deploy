import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { TokenPayload } from '../auth/token.service.js';
import { assertHotelAccess } from '../auth/hotel-access.js';
import { HotelUser } from '../hotel-users/entities/hotel-user.entity.js';
import {
  InternalConversationType,
  InternalChatConversation,
  InternalChatMessage,
  InternalMessageSenderScope,
} from './entities/internal-chat.entity.js';

export interface InternalConversationSummary extends InternalChatConversation {
  unread_count: number;
}

@Injectable()
export class InternalChatService {
  constructor(
    @InjectRepository(InternalChatConversation)
    private readonly conversationRepo: Repository<InternalChatConversation>,
    @InjectRepository(InternalChatMessage)
    private readonly messageRepo: Repository<InternalChatMessage>,
    @InjectRepository(HotelUser)
    private readonly hotelUserRepo: Repository<HotelUser>,
  ) {}

  async getOrCreateConversation(
    hotelId: number,
  ): Promise<InternalChatConversation> {
    const existing = await this.conversationRepo.findOne({
      where: {
        hotel_id: hotelId,
        conversation_type: InternalConversationType.SYSTEM_HOTEL,
      },
      relations: { hotel: true },
    });
    if (existing) return existing;

    const created = this.conversationRepo.create({
      hotel_id: hotelId,
      conversation_type: InternalConversationType.SYSTEM_HOTEL,
    });
    return this.conversationRepo.save(created);
  }

  async getOrCreateStaffConversation(
    hotelId: number,
    user: TokenPayload,
    peerUserId: number,
  ): Promise<InternalChatConversation> {
    this.assertHotelUser(user, hotelId);
    if (user.sub === peerUserId) {
      throw new ForbiddenException('Cannot start a conversation with yourself');
    }

    const peer = await this.hotelUserRepo.findOne({
      where: { id: peerUserId, hotel_id: hotelId, is_active: true },
    });
    if (!peer) throw new NotFoundException('Staff member not found');

    const [participantA, participantB] = [user.sub, peerUserId].sort(
      (a, b) => a - b,
    );
    const existing = await this.conversationRepo.findOne({
      where: {
        hotel_id: hotelId,
        conversation_type: InternalConversationType.HOTEL_STAFF,
        participant_a_user_id: participantA,
        participant_b_user_id: participantB,
      },
      relations: {
        hotel: true,
        participant_a_user: true,
        participant_b_user: true,
      },
    });
    if (existing) return existing;

    return this.conversationRepo.save(
      this.conversationRepo.create({
        hotel_id: hotelId,
        conversation_type: InternalConversationType.HOTEL_STAFF,
        participant_a_user_id: participantA,
        participant_b_user_id: participantB,
      }),
    );
  }

  async listSummaries(
    user: TokenPayload,
    hotelId?: number,
  ): Promise<InternalConversationSummary[]> {
    if (hotelId) assertHotelAccess(user, hotelId);
    if (user.scope === 'hotel' && !user.hotel_id) {
      throw new ForbiddenException('Hotel account is missing hotel_id');
    }

    const qb = this.conversationRepo
      .createQueryBuilder('conversation')
      .leftJoinAndSelect('conversation.hotel', 'hotel')
      .where('conversation.conversation_type = :type', {
        type: InternalConversationType.SYSTEM_HOTEL,
      })
      .orderBy('conversation.last_message_at', 'DESC', 'NULLS LAST')
      .addOrderBy('conversation.created_at', 'DESC');

    if (user.scope === 'hotel') {
      qb.andWhere('conversation.hotel_id = :hotelId', { hotelId: user.hotel_id });
    } else if (hotelId) {
      qb.andWhere('conversation.hotel_id = :hotelId', { hotelId });
    }

    const conversations = await qb.getMany();
    return conversations.map((conversation) =>
      this.withUnreadCount(conversation, user),
    );
  }

  async listStaffSummaries(
    hotelId: number,
    user: TokenPayload,
  ): Promise<InternalConversationSummary[]> {
    this.assertHotelUser(user, hotelId);
    const conversations = await this.conversationRepo
      .createQueryBuilder('conversation')
      .leftJoinAndSelect('conversation.participant_a_user', 'participant_a_user')
      .leftJoinAndSelect('conversation.participant_b_user', 'participant_b_user')
      .where('conversation.hotel_id = :hotelId', { hotelId })
      .andWhere('conversation.conversation_type = :type', {
        type: InternalConversationType.HOTEL_STAFF,
      })
      .andWhere(
        '(conversation.participant_a_user_id = :userId OR conversation.participant_b_user_id = :userId)',
        { userId: user.sub },
      )
      .orderBy('conversation.last_message_at', 'DESC', 'NULLS LAST')
      .addOrderBy('conversation.created_at', 'DESC')
      .getMany();

    return conversations.map((conversation) =>
      this.withUnreadCount(conversation, user),
    );
  }

  async getMessages(
    hotelId: number,
    user: TokenPayload,
  ): Promise<InternalChatMessage[]> {
    assertHotelAccess(user, hotelId);
    const conversation = await this.getOrCreateConversation(hotelId);
    return this.messageRepo.find({
      where: { conversation_id: conversation.id },
      order: { created_at: 'ASC' },
    });
  }

  async getStaffMessages(
    hotelId: number,
    user: TokenPayload,
    peerUserId: number,
  ): Promise<InternalChatMessage[]> {
    const conversation = await this.getOrCreateStaffConversation(
      hotelId,
      user,
      peerUserId,
    );
    return this.messageRepo.find({
      where: { conversation_id: conversation.id },
      order: { created_at: 'ASC' },
    });
  }

  async sendMessage(
    hotelId: number,
    user: TokenPayload,
    text: string,
  ): Promise<{ conversation: InternalConversationSummary; message: InternalChatMessage }> {
    assertHotelAccess(user, hotelId);
    const message = text.trim();
    if (!message) throw new ForbiddenException('Message cannot be empty');

    const conversation = await this.getOrCreateConversation(hotelId);
    const senderScope =
      user.scope === 'system'
        ? InternalMessageSenderScope.SYSTEM
        : InternalMessageSenderScope.HOTEL;

    const saved = await this.messageRepo.save(
      this.messageRepo.create({
        conversation_id: conversation.id,
        hotel_id: hotelId,
        sender_scope: senderScope,
        sender_user_id: user.sub,
        sender_email: user.email,
        message,
        is_read_by_system: user.scope === 'system',
        is_read_by_hotel: user.scope === 'hotel',
        read_by_system_at: user.scope === 'system' ? new Date() : null,
        read_by_hotel_at: user.scope === 'hotel' ? new Date() : null,
      }),
    );

    conversation.last_message_preview =
      message.length > 180 ? `${message.slice(0, 177)}...` : message;
    conversation.last_message_at = new Date();
    if (user.scope === 'system') {
      conversation.unread_hotel_count = (conversation.unread_hotel_count ?? 0) + 1;
    } else {
      conversation.unread_system_count =
        (conversation.unread_system_count ?? 0) + 1;
    }
    const updated = await this.conversationRepo.save(conversation);

    return {
      conversation: this.withUnreadCount(updated, user),
      message: saved,
    };
  }

  async sendStaffMessage(
    hotelId: number,
    user: TokenPayload,
    peerUserId: number,
    text: string,
  ): Promise<{ conversation: InternalConversationSummary; message: InternalChatMessage }> {
    const message = text.trim();
    if (!message) throw new ForbiddenException('Message cannot be empty');

    const conversation = await this.getOrCreateStaffConversation(
      hotelId,
      user,
      peerUserId,
    );
    const saved = await this.messageRepo.save(
      this.messageRepo.create({
        conversation_id: conversation.id,
        hotel_id: hotelId,
        sender_scope: InternalMessageSenderScope.HOTEL,
        sender_user_id: user.sub,
        sender_email: user.email,
        message,
        is_read_by_hotel: true,
        read_by_hotel_at: new Date(),
      }),
    );

    conversation.last_message_preview =
      message.length > 180 ? `${message.slice(0, 177)}...` : message;
    conversation.last_message_at = new Date();
    if (user.sub === conversation.participant_a_user_id) {
      conversation.unread_participant_b_count =
        (conversation.unread_participant_b_count ?? 0) + 1;
    } else {
      conversation.unread_participant_a_count =
        (conversation.unread_participant_a_count ?? 0) + 1;
    }
    const updated = await this.conversationRepo.save(conversation);

    return {
      conversation: this.withUnreadCount(updated, user),
      message: saved,
    };
  }

  async markRead(
    hotelId: number,
    user: TokenPayload,
  ): Promise<InternalConversationSummary> {
    assertHotelAccess(user, hotelId);
    const conversation = await this.conversationRepo.findOne({
      where: {
        hotel_id: hotelId,
        conversation_type: InternalConversationType.SYSTEM_HOTEL,
      },
      relations: { hotel: true },
    });
    if (!conversation) {
      throw new NotFoundException('Internal conversation not found');
    }

    const now = new Date();
    if (user.scope === 'system') {
      await this.messageRepo.update(
        {
          conversation_id: conversation.id,
          sender_scope: InternalMessageSenderScope.HOTEL,
          is_read_by_system: false,
        },
        { is_read_by_system: true, read_by_system_at: now },
      );
      conversation.unread_system_count = 0;
    } else {
      await this.messageRepo.update(
        {
          conversation_id: conversation.id,
          sender_scope: InternalMessageSenderScope.SYSTEM,
          is_read_by_hotel: false,
        },
        { is_read_by_hotel: true, read_by_hotel_at: now },
      );
      conversation.unread_hotel_count = 0;
    }

    const saved = await this.conversationRepo.save(conversation);
    return this.withUnreadCount(saved, user);
  }

  async markStaffRead(
    hotelId: number,
    user: TokenPayload,
    peerUserId: number,
  ): Promise<InternalConversationSummary> {
    const conversation = await this.getOrCreateStaffConversation(
      hotelId,
      user,
      peerUserId,
    );

    await this.messageRepo
      .createQueryBuilder()
      .update(InternalChatMessage)
      .set({
        is_read_by_hotel: true,
        read_by_hotel_at: () => 'NOW()',
      })
      .where('conversation_id = :conversationId', {
        conversationId: conversation.id,
      })
      .andWhere('sender_user_id <> :userId', { userId: user.sub })
      .andWhere('is_read_by_hotel = FALSE')
      .execute();

    if (user.sub === conversation.participant_a_user_id) {
      conversation.unread_participant_a_count = 0;
    } else {
      conversation.unread_participant_b_count = 0;
    }

    const saved = await this.conversationRepo.save(conversation);
    return this.withUnreadCount(saved, user);
  }

  private withUnreadCount(
    conversation: InternalChatConversation,
    user: TokenPayload,
  ): InternalConversationSummary {
    return {
      ...conversation,
      unread_count: this.getUnreadCount(conversation, user),
    };
  }

  private getUnreadCount(
    conversation: InternalChatConversation,
    user: TokenPayload,
  ): number {
    if (conversation.conversation_type === InternalConversationType.SYSTEM_HOTEL) {
      return user.scope === 'system'
        ? conversation.unread_system_count
        : conversation.unread_hotel_count;
    }
    if (user.scope !== 'hotel') return 0;
    if (user.sub === conversation.participant_a_user_id) {
      return conversation.unread_participant_a_count;
    }
    if (user.sub === conversation.participant_b_user_id) {
      return conversation.unread_participant_b_count;
    }
    return 0;
  }

  private assertHotelUser(user: TokenPayload, hotelId: number): void {
    if (user.scope !== 'hotel') {
      throw new ForbiddenException('Hotel staff authentication required');
    }
    assertHotelAccess(user, hotelId);
  }
}
