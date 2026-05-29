export enum ChatSocketClientEvent {
  JoinSession = 'joinSession',
  LeaveSession = 'leaveSession',
  JoinHotel = 'joinHotel',
  JoinOrder = 'joinOrder',
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
}

export enum ChatSocketRoomPrefix {
  Session = 'session',
  Hotel = 'hotel',
  Order = 'order',
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
} as const;
