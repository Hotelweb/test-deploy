import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger, UnauthorizedException } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service.js';
import {
  ChatSessionStatus,
  MessageSenderType,
  MessageType,
} from './entities/chat.entity.js';
import { TokenService, type TokenPayload } from '../auth/token.service.js';
import { assertHotelAccess } from '../auth/hotel-access.js';
import type { FoodOrderView } from '../food-order/food-order.service.js';
import type { InternalChatMessage } from './entities/internal-chat.entity.js';
import type { InternalConversationSummary } from './internal-chat.service.js';
import {
  chatSocketRoom,
  ChatSocketClientEvent,
  ChatReadActor,
  ChatSocketRole,
  ChatSocketServerEvent,
} from './socket-events.js';

interface SocketData {
  role?: ChatSocketRole;
  user?: TokenPayload;
}

type TypedSocket = Socket<
  Record<string, unknown>,
  Record<string, unknown>,
  Record<string, unknown>,
  SocketData
>;

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);

  constructor(
    private readonly chatService: ChatService,
    private readonly tokenService: TokenService,
  ) {}

  handleConnection(client: TypedSocket) {
    const auth = client.handshake.auth as { token?: unknown } | undefined;
    const raw = auth?.token;
    if (typeof raw === 'string' && raw.length > 0) {
      try {
        client.data.user = this.tokenService.verify(raw);
      } catch {
        this.logger.warn(`Invalid socket token for ${client.id}`);
      }
    }
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  private requireStaff(client: TypedSocket): TokenPayload {
    const user = client.data.user;
    if (!user) {
      throw new UnauthorizedException('Staff authentication required');
    }
    return user;
  }

  // ---------------------------------------------------------------------------
  // Rooms
  // ---------------------------------------------------------------------------

  @SubscribeMessage(ChatSocketClientEvent.JoinSession)
  async handleJoinSession(
    @ConnectedSocket() client: TypedSocket,
    @MessageBody() data: { sessionId: number; role?: ChatSocketRole },
  ) {
    if (data.role === ChatSocketRole.Staff) {
      const user = this.requireStaff(client);
      const session = await this.chatService.getSession(data.sessionId);
      assertHotelAccess(user, Number(session.hotel_id));
    }

    const room = chatSocketRoom.session(data.sessionId);
    void client.join(room);
    if (data.role) client.data.role = data.role;
    return {
      event: ChatSocketServerEvent.JoinedSession,
      data: { sessionId: data.sessionId },
    };
  }

  @SubscribeMessage(ChatSocketClientEvent.LeaveSession)
  handleLeaveSession(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { sessionId: number },
  ) {
    const room = chatSocketRoom.session(data.sessionId);
    void client.leave(room);
    return {
      event: ChatSocketServerEvent.LeftSession,
      data: { sessionId: data.sessionId },
    };
  }

  @SubscribeMessage(ChatSocketClientEvent.JoinHotel)
  handleJoinHotel(
    @ConnectedSocket() client: TypedSocket,
    @MessageBody() data: { hotelId: number },
  ) {
    const user = this.requireStaff(client);
    assertHotelAccess(user, data.hotelId);
    const room = chatSocketRoom.hotel(data.hotelId);
    void client.join(room);
    return {
      event: ChatSocketServerEvent.JoinedHotel,
      data: { hotelId: data.hotelId },
    };
  }

  @SubscribeMessage(ChatSocketClientEvent.JoinOrder)
  handleJoinOrder(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { orderId: number },
  ) {
    const room = chatSocketRoom.order(data.orderId);
    void client.join(room);
    return {
      event: ChatSocketServerEvent.JoinedOrder,
      data: { orderId: data.orderId },
    };
  }

  @SubscribeMessage(ChatSocketClientEvent.JoinSystem)
  handleJoinSystem(@ConnectedSocket() client: TypedSocket) {
    const user = this.requireStaff(client);
    if (user.scope !== 'system') {
      throw new UnauthorizedException('System admin authentication required');
    }
    void client.join(chatSocketRoom.system());
    return {
      event: ChatSocketServerEvent.JoinedSystem,
      data: {},
    };
  }

  // ---------------------------------------------------------------------------
  // Messaging
  // ---------------------------------------------------------------------------

  @SubscribeMessage(ChatSocketClientEvent.SendMessage)
  async handleSendMessage(
    @ConnectedSocket() client: TypedSocket,
    @MessageBody()
    data: {
      sessionId: number;
      message: string;
      source_language: string;
      sender_type: MessageSenderType;
      sender_user_id?: number;
      client_message_id?: string;
      message_type?: MessageType.TEXT | MessageType.IMAGE;
      image_url?: string;
    },
  ) {
    const savedMessage =
      data.sender_type === MessageSenderType.CUSTOMER
        ? await this.chatService.sendCustomerMessage(data.sessionId, {
            message: data.message,
            source_language: data.source_language,
            message_type: data.message_type,
            image_url: data.image_url,
            client_message_id: data.client_message_id,
          })
        : await this.sendStaffMessage(client, data);

    const room = chatSocketRoom.session(data.sessionId);
    this.server.to(room).emit(ChatSocketServerEvent.NewMessage, savedMessage);

    const session = await this.chatService.getSession(data.sessionId);
    this.server
      .to(chatSocketRoom.hotel(Number(session.hotel_id)))
      .emit(ChatSocketServerEvent.SessionUpdate, {
        sessionId: data.sessionId,
        message: savedMessage,
        session,
      });

    return { event: ChatSocketServerEvent.MessageSent, data: savedMessage };
  }

  private async sendStaffMessage(
    client: TypedSocket,
    data: {
      sessionId: number;
      message: string;
      source_language: string;
      client_message_id?: string;
      message_type?: MessageType.TEXT | MessageType.IMAGE;
      image_url?: string;
    },
  ) {
    const user = this.requireStaff(client);
    const session = await this.chatService.getSession(data.sessionId);
    assertHotelAccess(user, Number(session.hotel_id));
    return this.chatService.sendStaffMessage(data.sessionId, user.sub, {
      message: data.message,
      source_language: data.source_language,
      message_type: data.message_type,
      image_url: data.image_url,
      client_message_id: data.client_message_id,
    });
  }

  // ---------------------------------------------------------------------------
  // Typing
  // ---------------------------------------------------------------------------

  @SubscribeMessage(ChatSocketClientEvent.Typing)
  async handleTyping(
    @ConnectedSocket() client: TypedSocket,
    @MessageBody()
    data: {
      sessionId: number;
      sender_type: MessageSenderType;
      isTyping: boolean;
    },
  ) {
    if (data.sender_type === MessageSenderType.STAFF) {
      const user = this.requireStaff(client);
      const session = await this.chatService.getSession(data.sessionId);
      assertHotelAccess(user, Number(session.hotel_id));
    }

    const room = chatSocketRoom.session(data.sessionId);
    (client as Socket).to(room).emit(ChatSocketServerEvent.Typing, {
      sessionId: data.sessionId,
      sender_type: data.sender_type,
      isTyping: data.isTyping,
    });
  }

  // ---------------------------------------------------------------------------
  // Read receipts
  // ---------------------------------------------------------------------------

  @SubscribeMessage(ChatSocketClientEvent.MarkRead)
  async handleMarkRead(
    @ConnectedSocket() client: TypedSocket,
    @MessageBody()
    data: { sessionId: number; by: ChatReadActor },
  ) {
    if (data.by === ChatReadActor.Staff) {
      const user = this.requireStaff(client);
      const session = await this.chatService.getSession(data.sessionId);
      assertHotelAccess(user, Number(session.hotel_id));
    }

    const result = await this.chatService.markMessagesRead(
      data.sessionId,
      data.by,
    );
    const room = chatSocketRoom.session(data.sessionId);
    this.server.to(room).emit(ChatSocketServerEvent.MessagesRead, {
      sessionId: data.sessionId,
      by: data.by,
      updated: result.updated,
    });

    const session = await this.chatService.getSession(data.sessionId);
    this.server
      .to(chatSocketRoom.hotel(Number(session.hotel_id)))
      .emit(ChatSocketServerEvent.SessionUnreadUpdate, {
        sessionId: data.sessionId,
        unread_count: session.unread_count,
      });

    return { event: ChatSocketServerEvent.MarkedRead, data: result };
  }

  // ---------------------------------------------------------------------------
  // Session status
  // ---------------------------------------------------------------------------

  @SubscribeMessage(ChatSocketClientEvent.UpdateSessionStatus)
  async handleUpdateStatus(
    @ConnectedSocket() client: TypedSocket,
    @MessageBody() data: { sessionId: number; status: ChatSessionStatus },
  ) {
    const user = this.requireStaff(client);
    const existing = await this.chatService.getSession(data.sessionId);
    assertHotelAccess(user, Number(existing.hotel_id));

    const session = await this.chatService.updateSessionStatus(
      data.sessionId,
      data.status,
    );
    this.server
      .to(chatSocketRoom.hotel(Number(session.hotel_id)))
      .emit(ChatSocketServerEvent.SessionStatusChanged, {
        sessionId: data.sessionId,
        session,
      });
    this.server
      .to(chatSocketRoom.session(data.sessionId))
      .emit(ChatSocketServerEvent.SessionStatusChanged, {
        sessionId: data.sessionId,
        session,
      });
  }

  emitOrderStatusChanged(order: FoodOrderView) {
    this.server
      .to(chatSocketRoom.order(order.id))
      .emit(ChatSocketServerEvent.OrderStatusChanged, {
        orderId: order.id,
        order,
      });
    this.server
      .to(chatSocketRoom.hotel(order.hotel_id))
      .emit(ChatSocketServerEvent.OrderStatusChanged, {
        orderId: order.id,
        order,
      });
  }

  emitOrderCreated(order: FoodOrderView) {
    this.server
      .to(chatSocketRoom.hotel(order.hotel_id))
      .emit(ChatSocketServerEvent.OrderCreated, {
        orderId: order.id,
        order,
      });
  }

  emitInternalMessage(
    hotelId: number,
    data: {
      conversation: InternalConversationSummary;
      message: InternalChatMessage;
    },
  ) {
    this.server
      .to(chatSocketRoom.hotel(hotelId))
      .emit(ChatSocketServerEvent.InternalMessage, data);
    this.server
      .to(chatSocketRoom.system())
      .emit(ChatSocketServerEvent.InternalMessage, data);
  }

  emitInternalConversationRead(
    hotelId: number,
    conversation: InternalConversationSummary,
  ) {
    this.server
      .to(chatSocketRoom.hotel(hotelId))
      .emit(ChatSocketServerEvent.InternalConversationRead, { conversation });
    this.server
      .to(chatSocketRoom.system())
      .emit(ChatSocketServerEvent.InternalConversationRead, { conversation });
  }
}
