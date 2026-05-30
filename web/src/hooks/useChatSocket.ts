import { useCallback, useEffect, useRef, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import { API_BASE } from '../api'
import type { ChatMessage, ChatSession, MessageType } from '../api'
import type { FoodOrder, InternalChatConversation, InternalChatMessage } from '../api'
import { getToken } from '../lib/auth'
import {
  ChatReadActor,
  ChatSenderType,
  ChatSocketClientEvent,
  ChatSocketRole,
  ChatSocketServerEvent,
  type ChatOutboundMessageType,
  type ChatSocketRole as ChatSocketRoleValue,
} from '../lib/socketEvents'

export type ConnectionState = 'connecting' | 'online' | 'offline' | 'reconnecting'

export interface UseChatSocketOptions {
  /** Session id to subscribe to (guest mode). */
  sessionId?: number | null
  /** Hotel id to subscribe to (admin dashboard mode). */
  hotelId?: number | null
  /** Subscribe to system-admin wide events. */
  joinSystem?: boolean
  /** Role identifier passed when joining the session room. */
  role?: ChatSocketRoleValue
  /** Optional callbacks. */
  onNewMessage?: (msg: ChatMessage) => void
  onTyping?: (data: { sessionId: number; sender_type: ChatSenderType; isTyping: boolean }) => void
  onMessagesRead?: (data: { sessionId: number; by: ChatReadActor }) => void
  onSessionUpdate?: (data: {
    sessionId: number
    message: ChatMessage
    session: ChatSession
  }) => void
  onSessionUnreadUpdate?: (data: { sessionId: number; unread_count: number }) => void
  onSessionStatusChanged?: (data: { sessionId: number; session: ChatSession }) => void
  onOrderCreated?: (data: { orderId: number; order: FoodOrder }) => void
  onOrderStatusChanged?: (data: { orderId: number; order: FoodOrder }) => void
  onInternalMessage?: (data: {
    conversation: InternalChatConversation
    message: InternalChatMessage
  }) => void
  onInternalConversationRead?: (data: { conversation: InternalChatConversation }) => void
}

export interface UseChatSocketResult {
  connection: ConnectionState
  sendMessage: (payload: SendMessagePayload) => void
  emitTyping: (isTyping: boolean) => void
  markRead: () => void
}

export interface SendMessagePayload {
  sessionId: number
  message: string
  source_language: string
  sender_type: ChatSenderType
  sender_user_id?: number
  client_message_id?: string
  message_type?: Extract<MessageType, ChatOutboundMessageType>
  image_url?: string
}

/**
 * Manages a single websocket connection to the chat namespace.
 *
 * - Joins both session and hotel rooms (depending on which ids are provided)
 * - Tracks connection state for the UI banner
 * - Re-joins rooms automatically after reconnect
 * - Provides helpers to emit typing / mark-read / send-message events
 */
export function useChatSocket(options: UseChatSocketOptions): UseChatSocketResult {
  const {
    sessionId,
    hotelId,
    joinSystem,
    role,
    onNewMessage,
    onTyping,
    onMessagesRead,
    onSessionUpdate,
    onSessionUnreadUpdate,
    onSessionStatusChanged,
    onOrderCreated,
    onOrderStatusChanged,
    onInternalMessage,
    onInternalConversationRead,
  } = options

  const [connection, setConnection] = useState<ConnectionState>('connecting')
  const socketRef = useRef<Socket | null>(null)

  // Keep latest callbacks in a ref so the connection effect doesn't re-run
  // every time a parent passes a new function reference. The ref is updated
  // in a layout-independent effect (never during render — React 19 rule).
  const cbRef = useRef({
    onNewMessage,
    onTyping,
    onMessagesRead,
    onSessionUpdate,
    onSessionUnreadUpdate,
    onSessionStatusChanged,
    onOrderCreated,
    onOrderStatusChanged,
    onInternalMessage,
    onInternalConversationRead,
  })
  useEffect(() => {
    cbRef.current = {
      onNewMessage,
      onTyping,
      onMessagesRead,
      onSessionUpdate,
      onSessionUnreadUpdate,
      onSessionStatusChanged,
      onOrderCreated,
      onOrderStatusChanged,
      onInternalMessage,
      onInternalConversationRead,
    }
  }, [
    onNewMessage,
    onTyping,
    onMessagesRead,
    onSessionUpdate,
    onSessionUnreadUpdate,
    onSessionStatusChanged,
    onOrderCreated,
    onOrderStatusChanged,
    onInternalMessage,
    onInternalConversationRead,
  ])

  useEffect(() => {
    const staffToken = role === ChatSocketRole.Staff ? getToken() : null
    const socket = io(`${API_BASE}/chat`, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 800,
      reconnectionDelayMax: 4000,
      timeout: 8000,
      auth: staffToken ? { token: staffToken } : {},
    })
    socketRef.current = socket

    const joinRooms = () => {
      if (sessionId) socket.emit(ChatSocketClientEvent.JoinSession, { sessionId, role })
      if (hotelId) socket.emit(ChatSocketClientEvent.JoinHotel, { hotelId })
      if (joinSystem) socket.emit(ChatSocketClientEvent.JoinSystem)
    }

    socket.on('connect', () => {
      setConnection('online')
      joinRooms()
    })
    socket.on('disconnect', () => setConnection('offline'))
    socket.on('reconnect_attempt', () => setConnection('reconnecting'))
    socket.on('reconnect', () => {
      setConnection('online')
      joinRooms()
    })
    socket.on('connect_error', () => setConnection('reconnecting'))

    socket.on(ChatSocketServerEvent.NewMessage, (msg: ChatMessage) =>
      cbRef.current.onNewMessage?.(msg),
    )
    socket.on(ChatSocketServerEvent.Typing, (data) => cbRef.current.onTyping?.(data))
    socket.on(ChatSocketServerEvent.MessagesRead, (data) => cbRef.current.onMessagesRead?.(data))
    socket.on(ChatSocketServerEvent.SessionUpdate, (data) => cbRef.current.onSessionUpdate?.(data))
    socket.on(ChatSocketServerEvent.SessionUnreadUpdate, (data) =>
      cbRef.current.onSessionUnreadUpdate?.(data),
    )
    socket.on(ChatSocketServerEvent.SessionStatusChanged, (data) =>
      cbRef.current.onSessionStatusChanged?.(data),
    )
    socket.on(ChatSocketServerEvent.OrderCreated, (data) => cbRef.current.onOrderCreated?.(data))
    socket.on(ChatSocketServerEvent.OrderStatusChanged, (data) =>
      cbRef.current.onOrderStatusChanged?.(data),
    )
    socket.on(ChatSocketServerEvent.InternalMessage, (data) =>
      cbRef.current.onInternalMessage?.(data),
    )
    socket.on(ChatSocketServerEvent.InternalConversationRead, (data) =>
      cbRef.current.onInternalConversationRead?.(data),
    )

    return () => {
      socket.removeAllListeners()
      socket.disconnect()
      socketRef.current = null
    }
  }, [sessionId, hotelId, joinSystem, role])

  const sendMessage = useCallback((payload: SendMessagePayload) => {
    socketRef.current?.emit(ChatSocketClientEvent.SendMessage, payload)
  }, [])

  const emitTyping = useCallback(
    (isTyping: boolean) => {
      if (!sessionId || !role) return
      socketRef.current?.emit(ChatSocketClientEvent.Typing, {
        sessionId,
        isTyping,
        sender_type:
          role === ChatSocketRole.Customer ? ChatSenderType.Customer : ChatSenderType.Staff,
      })
    },
    [sessionId, role],
  )

  const markRead = useCallback(() => {
    if (!sessionId || !role) return
    socketRef.current?.emit(ChatSocketClientEvent.MarkRead, { sessionId, by: role })
  }, [sessionId, role])

  return {
    connection,
    sendMessage,
    emitTyping,
    markRead,
  }
}
