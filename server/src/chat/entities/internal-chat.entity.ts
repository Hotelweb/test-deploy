import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Hotel } from '../../hotels/entities/hotel.entity.js';
import { HotelUser } from '../../hotel-users/entities/hotel-user.entity.js';

export enum InternalConversationType {
  SYSTEM_HOTEL = 'SYSTEM_HOTEL',
  HOTEL_STAFF = 'HOTEL_STAFF',
}

export enum InternalMessageSenderScope {
  SYSTEM = 'system',
  HOTEL = 'hotel',
}

@Entity('internal_chat_conversations')
@Index(['hotel_id', 'conversation_type'])
export class InternalChatConversation {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ type: 'bigint' })
  hotel_id: number;

  @Column({
    type: 'enum',
    enum: InternalConversationType,
    enumName: 'internal_conversation_type',
    default: InternalConversationType.SYSTEM_HOTEL,
  })
  conversation_type: InternalConversationType;

  @Column({ type: 'bigint', nullable: true })
  participant_a_user_id: number | null;

  @Column({ type: 'bigint', nullable: true })
  participant_b_user_id: number | null;

  @Column({ type: 'int', default: 0 })
  unread_system_count: number;

  @Column({ type: 'int', default: 0 })
  unread_hotel_count: number;

  @Column({ type: 'int', default: 0 })
  unread_participant_a_count: number;

  @Column({ type: 'int', default: 0 })
  unread_participant_b_count: number;

  @Column({ type: 'text', nullable: true })
  last_message_preview: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  last_message_at: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  @ManyToOne(() => Hotel)
  @JoinColumn({ name: 'hotel_id' })
  hotel: Hotel;

  @ManyToOne(() => HotelUser, { nullable: true })
  @JoinColumn({ name: 'participant_a_user_id' })
  participant_a_user: HotelUser | null;

  @ManyToOne(() => HotelUser, { nullable: true })
  @JoinColumn({ name: 'participant_b_user_id' })
  participant_b_user: HotelUser | null;
}

@Entity('internal_chat_messages')
export class InternalChatMessage {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ type: 'bigint' })
  conversation_id: number;

  @Column({ type: 'bigint' })
  hotel_id: number;

  @Column({
    type: 'enum',
    enum: InternalMessageSenderScope,
    enumName: 'internal_message_sender_scope',
  })
  sender_scope: InternalMessageSenderScope;

  @Column({ type: 'bigint' })
  sender_user_id: number;

  @Column({ type: 'varchar', length: 255 })
  sender_email: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'boolean', default: false })
  is_read_by_system: boolean;

  @Column({ type: 'boolean', default: false })
  is_read_by_hotel: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  read_by_system_at: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  read_by_hotel_at: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @ManyToOne(() => InternalChatConversation)
  @JoinColumn({ name: 'conversation_id' })
  conversation: InternalChatConversation;
}
