export const ChatSocketClientEvent = {
  JoinSession: 'joinSession',
  LeaveSession: 'leaveSession',
  JoinHotel: 'joinHotel',
  JoinOrder: 'joinOrder',
  SendMessage: 'sendMessage',
  Typing: 'typing',
  MarkRead: 'markRead',
  UpdateSessionStatus: 'updateSessionStatus',
} as const

export const ChatSocketServerEvent = {
  NewMessage: 'newMessage',
  Typing: 'typing',
  MessagesRead: 'messagesRead',
  SessionUpdate: 'sessionUpdate',
  SessionUnreadUpdate: 'sessionUnreadUpdate',
  SessionStatusChanged: 'sessionStatusChanged',
  OrderCreated: 'orderCreated',
  OrderStatusChanged: 'orderStatusChanged',
} as const

export const ChatSocketRole = {
  Customer: 'customer',
  Staff: 'staff',
} as const

export type ChatSocketRole = (typeof ChatSocketRole)[keyof typeof ChatSocketRole]

export const ChatReadActor = {
  Customer: 'customer',
  Staff: 'staff',
} as const

export type ChatReadActor = (typeof ChatReadActor)[keyof typeof ChatReadActor]

export const ChatSenderType = {
  Customer: 'CUSTOMER',
  Staff: 'STAFF',
} as const

export type ChatSenderType = (typeof ChatSenderType)[keyof typeof ChatSenderType]

export const ChatMessageTypeValue = {
  Text: 'TEXT',
  Image: 'IMAGE',
  System: 'SYSTEM',
  Order: 'ORDER',
} as const

export type ChatMessageTypeValue = (typeof ChatMessageTypeValue)[keyof typeof ChatMessageTypeValue]

export type ChatOutboundMessageType =
  | typeof ChatMessageTypeValue.Text
  | typeof ChatMessageTypeValue.Image

export const ChatMessageStatusValue = {
  Sending: 'SENDING',
  Sent: 'SENT',
  Delivered: 'DELIVERED',
  Read: 'READ',
  Failed: 'FAILED',
} as const

export const ChatTranslationStatusValue = {
  Pending: 'PENDING',
  Translated: 'TRANSLATED',
  Failed: 'FAILED',
  Skipped: 'SKIPPED',
} as const
