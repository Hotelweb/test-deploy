export enum ChatSocketClientEvent {
  JoinSession = 'joinSession',
  LeaveSession = 'leaveSession',
  JoinHotel = 'joinHotel',
  JoinOrder = 'joinOrder',
  JoinSystem = 'joinSystem',
  SendMessage = 'sendMessage',
  Typing = 'typing',
  MarkRead = 'markRead',
  UpdateSessionStatus = 'updateSessionStatus',
}

export enum ChatSocketServerEvent {
  JoinedSession = 'joinedSession',
  LeftSession = 'leftSession',
  JoinedHotel = 'joinedHotel',
  JoinedOrder = 'joinedOrder',
  JoinedSystem = 'joinedSystem',
  NewMessage = 'newMessage',
  MessageSent = 'messageSent',
  Typing = 'typing',
  MessagesRead = 'messagesRead',
  MarkedRead = 'markedRead',
  SessionUpdate = 'sessionUpdate',
  SessionUnreadUpdate = 'sessionUnreadUpdate',
  SessionStatusChanged = 'sessionStatusChanged',
  OrderCreated = 'orderCreated',
  OrderStatusChanged = 'orderStatusChanged',
  InternalMessage = 'internalMessage',
  InternalConversationRead = 'internalConversationRead',
}

export enum ChatSocketRoomPrefix {
  Session = 'session',
  Hotel = 'hotel',
  Order = 'order',
  System = 'system',
}

export enum ChatSocketRole {
  Customer = 'customer',
  Staff = 'staff',
}

export enum ChatReadActor {
  Customer = 'customer',
  Staff = 'staff',
}

export const chatSocketRoom = {
  session: (sessionId: number) =>
    `${ChatSocketRoomPrefix.Session}_${sessionId}`,
  hotel: (hotelId: number) => `${ChatSocketRoomPrefix.Hotel}_${hotelId}`,
  order: (orderId: number) => `${ChatSocketRoomPrefix.Order}_${orderId}`,
  system: () => `${ChatSocketRoomPrefix.System}_admins`,
} as const;
