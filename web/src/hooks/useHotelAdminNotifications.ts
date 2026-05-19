import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { getHotelSessions, getPendingOrderCount } from '../api'
import type { ChatMessage, ChatSession } from '../api'
import { useChatSocket } from './useChatSocket'
import {
  playNotificationSound,
  requestNotificationPermission,
  showBrowserNotification,
} from '../lib/notifications'

export type AdminNotificationKind = 'chat' | 'order'

export interface AdminNotificationItem {
  id: string
  kind: AdminNotificationKind
  title: string
  body: string
  createdAt: string
}

export function useHotelAdminNotifications(hotelId: number) {
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [pendingOrders, setPendingOrders] = useState(0)
  const [items, setItems] = useState<AdminNotificationItem[]>([])
  const [permission, setPermission] = useState<NotificationPermission>('default')

  const initializedRef = useRef(false)
  const pendingOrdersRef = useRef(0)

  useEffect(() => {
    if (typeof Notification === 'undefined') return
    const sync = () => setPermission(Notification.permission)
    sync()
    window.addEventListener('focus', sync)
    return () => window.removeEventListener('focus', sync)
  }, [])

  const addItem = useCallback((item: Omit<AdminNotificationItem, 'createdAt'>) => {
    setItems((prev) =>
      [
        { ...item, createdAt: new Date().toISOString() },
        ...prev.filter((existing) => existing.id !== item.id),
      ].slice(0, 8),
    )
  }, [])

  const loadCounts = useCallback(async () => {
    if (!hotelId) return
    const [chatSessions, orderCount] = await Promise.all([
      getHotelSessions(hotelId),
      getPendingOrderCount(hotelId),
    ])
    setSessions(chatSessions)
    setPendingOrders(orderCount)
    pendingOrdersRef.current = orderCount
    initializedRef.current = true
  }, [hotelId])

  useEffect(() => {
    if (!hotelId) return
    let cancelled = false
    void Promise.resolve()
      .then(loadCounts)
      .catch(() => undefined)

    const pollOrders = window.setInterval(() => {
      void getPendingOrderCount(hotelId)
        .then((count) => {
          if (cancelled) return
          const previous = pendingOrdersRef.current
          setPendingOrders(count)
          pendingOrdersRef.current = count
          if (initializedRef.current && count > previous) {
            const delta = count - previous
            playNotificationSound()
            addItem({
              id: `order-${Date.now()}`,
              kind: 'order',
              title: delta === 1 ? 'Có đơn hàng mới' : `Có ${delta} đơn hàng mới`,
              body: `${count} đơn đang chờ xử lý`,
            })
            showBrowserNotification('Có đơn hàng mới', `${count} đơn đang chờ xử lý`, {
              tag: `orders-${hotelId}`,
            })
          }
        })
        .catch(() => undefined)
    }, 15000)

    const pollChat = window.setInterval(() => {
      void getHotelSessions(hotelId)
        .then((next) => {
          if (!cancelled) setSessions(next)
        })
        .catch(() => undefined)
    }, 30000)

    return () => {
      cancelled = true
      window.clearInterval(pollOrders)
      window.clearInterval(pollChat)
    }
  }, [addItem, hotelId, loadCounts])

  const handleSessionUpdate = useCallback(
    (data: { sessionId: number; message: ChatMessage; session: ChatSession }) => {
      setSessions((prev) => {
        const idx = prev.findIndex((s) => s.id === data.sessionId)
        const next = idx >= 0 ? [...prev] : [data.session, ...prev]
        if (idx >= 0) next[idx] = data.session
        next.sort((a, b) => {
          const ta = a.last_message_at ? new Date(a.last_message_at).getTime() : 0
          const tb = b.last_message_at ? new Date(b.last_message_at).getTime() : 0
          return tb - ta
        })
        return next
      })

      if (data.message.sender_type !== 'CUSTOMER') return
      const guestName = data.session.customer_name || `Khách #${data.session.id}`
      const preview =
        data.message.translated_message ?? data.message.original_message ?? 'Tin nhắn mới'
      playNotificationSound()
      addItem({
        id: `chat-${data.message.id}`,
        kind: 'chat',
        title: `Tin nhắn mới từ ${guestName}`,
        body: preview,
      })
      showBrowserNotification(`Tin nhắn mới · ${guestName}`, preview, {
        tag: `chat-${data.session.id}`,
      })
    },
    [addItem],
  )

  const handleSessionUnreadUpdate = useCallback(
    (data: { sessionId: number; unread_count: number }) => {
      setSessions((prev) =>
        prev.map((s) => (s.id === data.sessionId ? { ...s, unread_count: data.unread_count } : s)),
      )
    },
    [],
  )

  const handleSessionStatusChanged = useCallback(
    (data: { sessionId: number; session: ChatSession }) => {
      setSessions((prev) => prev.map((s) => (s.id === data.sessionId ? data.session : s)))
    },
    [],
  )

  useChatSocket({
    hotelId: hotelId || null,
    role: 'staff',
    onSessionUpdate: handleSessionUpdate,
    onSessionUnreadUpdate: handleSessionUnreadUpdate,
    onSessionStatusChanged: handleSessionStatusChanged,
  })

  const chatUnread = useMemo(
    () => sessions.reduce((sum, session) => sum + (session.unread_count ?? 0), 0),
    [sessions],
  )

  const total = chatUnread + pendingOrders

  const enableBrowserNotifications = useCallback(async () => {
    const result = await requestNotificationPermission()
    setPermission(result)
  }, [])

  const clearRecent = useCallback(() => setItems([]), [])

  return {
    chatUnread,
    pendingOrders,
    total,
    items,
    permission,
    enableBrowserNotifications,
    clearRecent,
  }
}
