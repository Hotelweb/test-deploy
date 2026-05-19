import { useCallback, useEffect, useRef, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import { API_BASE } from '../api'
import type { ChatMessage, ChatSession } from '../api'
import { getToken } from '../lib/auth'

export type ConnectionState = 'connecting' | 'online' | 'offline' | 'reconnecting'

export interface UseChatSocketOptions {
  /** Session id to subscribe to (guest mode). */
  sessionId?: number | null
  /** Hotel id to subscribe to (admin dashboard mode). */
  hotelId?: number | null
  /** Role identifier passed when joining the session room. */
  role?: 'customer' | 'staff'
  /** Optional callbacks. */
  onNewMessage?: (msg: ChatMessage) => void
  onTyping?: (data: {
    sessionId: number
    sender_type: 'CUSTOMER' | 'STAFF'
    isTyping: boolean
  }) => void
  onMessagesRead?: (data: { sessionId: number; by: 'customer' | 'staff' }) => void
  onSessionUpdate?: (data: {
    sessionId: number
    message: ChatMessage
    session: ChatSession
  }) => void
  onSessionUnreadUpdate?: (data: { sessionId: number; unread_count: number }) => void
  onSessionStatusChanged?: (data: { sessionId: number; session: ChatSession }) => void
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
  sender_type: 'CUSTOMER' | 'STAFF'
  sender_user_id?: number
  client_message_id?: string
  message_type?: 'TEXT' | 'IMAGE'
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
    role,
    onNewMessage,
    onTyping,
    onMessagesRead,
    onSessionUpdate,
    onSessionUnreadUpdate,
    onSessionStatusChanged,
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
  })
  useEffect(() => {
    cbRef.current = {
      onNewMessage,
      onTyping,
      onMessagesRead,
      onSessionUpdate,
      onSessionUnreadUpdate,
      onSessionStatusChanged,
    }
  }, [
    onNewMessage,
    onTyping,
    onMessagesRead,
    onSessionUpdate,
    onSessionUnreadUpdate,
    onSessionStatusChanged,
  ])

  useEffect(() => {
    const staffToken = role === 'staff' ? getToken() : null
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
      if (sessionId) socket.emit('joinSession', { sessionId, role })
      if (hotelId) socket.emit('joinHotel', { hotelId })
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

    socket.on('newMessage', (msg: ChatMessage) => cbRef.current.onNewMessage?.(msg))
    socket.on('typing', (data) => cbRef.current.onTyping?.(data))
    socket.on('messagesRead', (data) => cbRef.current.onMessagesRead?.(data))
    socket.on('sessionUpdate', (data) => cbRef.current.onSessionUpdate?.(data))
    socket.on('sessionUnreadUpdate', (data) => cbRef.current.onSessionUnreadUpdate?.(data))
    socket.on('sessionStatusChanged', (data) => cbRef.current.onSessionStatusChanged?.(data))

    return () => {
      socket.removeAllListeners()
      socket.disconnect()
      socketRef.current = null
    }
  }, [sessionId, hotelId, role])

  const sendMessage = useCallback((payload: SendMessagePayload) => {
    socketRef.current?.emit('sendMessage', payload)
  }, [])

  const emitTyping = useCallback(
    (isTyping: boolean) => {
      if (!sessionId || !role) return
      socketRef.current?.emit('typing', {
        sessionId,
        isTyping,
        sender_type: role === 'customer' ? 'CUSTOMER' : 'STAFF',
      })
    },
    [sessionId, role],
  )

  const markRead = useCallback(() => {
    if (!sessionId || !role) return
    socketRef.current?.emit('markRead', { sessionId, by: role })
  }, [sessionId, role])

  return {
    connection,
    sendMessage,
    emitTyping,
    markRead,
  }
}
