import { useCallback, useEffect, useRef, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import { API_BASE, getChatSessionByToken, type ChatMessage, type FoodOrder } from '../api'

const GUEST_ORDER_IDS_KEY = 'guest_order_ids'
const GUEST_NOTIFICATION_EVENT = 'guest-notification-targets-changed'

interface FavicoInstance {
  badge: (count: number) => void
  reset?: () => void
}

declare global {
  interface Window {
    Favico?: new (options?: {
      animation?: string
      bgColor?: string
      textColor?: string
    }) => FavicoInstance
  }
}

type GuestTargets = {
  sessionIds: number[]
  orderIds: number[]
}

export async function ensureGuestNotificationPermission() {
  if (typeof window === 'undefined') return
  if (!('Notification' in window)) return
  if (Notification.permission !== 'default') return

  try {
    await Notification.requestPermission()
  } catch {
    // Browsers may reject if permission cannot be requested in this context.
  }
}

export function rememberGuestOrder(orderId: number) {
  if (typeof window === 'undefined') return
  const current = readGuestOrderIds()
  if (!current.includes(orderId)) {
    localStorage.setItem(GUEST_ORDER_IDS_KEY, JSON.stringify([...current, orderId]))
  }
  window.dispatchEvent(new Event(GUEST_NOTIFICATION_EVENT))
}

export function rememberGuestSession(hotelId: number, language: string, token: string) {
  if (typeof window === 'undefined') return
  localStorage.setItem(`chat_session_${hotelId}_${language}`, token)
  window.dispatchEvent(new Event(GUEST_NOTIFICATION_EVENT))
}

export function useGuestFaviconNotifications(enabled = true) {
  const [targets, setTargets] = useState<GuestTargets>({ sessionIds: [], orderIds: [] })
  const [badgeCount, setBadgeCount] = useState(0)
  const favicoRef = useRef<FavicoInstance | null>(null)
  const originalTitleRef = useRef<string | null>(null)
  const incrementBadge = useCallback(() => {
    if (document.visibilityState === 'visible') return
    setBadgeCount((count) => count + 1)
  }, [])

  const notifyGuest = useCallback((title: string, body: string) => {
    if (document.visibilityState === 'visible') return
    if (!('Notification' in window) || Notification.permission !== 'granted') return

    const notification = new Notification(title, {
      body,
      icon: '/favicon.svg',
      tag: 'a25-guest-update',
    })

    notification.onclick = () => {
      window.focus()
      notification.close()
    }
  }, [])

  useEffect(() => {
    originalTitleRef.current = document.title
    if (window.Favico) {
      favicoRef.current = new window.Favico({
        animation: 'popFade',
        bgColor: '#2e6729',
        textColor: '#ffffff',
      })
    }
  }, [])

  useEffect(() => {
    favicoRef.current?.badge(badgeCount)
    if (!originalTitleRef.current) return
    document.title =
      badgeCount > 0 ? `(${badgeCount}) ${originalTitleRef.current}` : originalTitleRef.current
  }, [badgeCount])

  useEffect(() => {
    const reset = () => {
      if (document.visibilityState !== 'visible') return
      setBadgeCount(0)
      favicoRef.current?.reset?.()
    }

    document.addEventListener('visibilitychange', reset)
    window.addEventListener('focus', reset)
    return () => {
      document.removeEventListener('visibilitychange', reset)
      window.removeEventListener('focus', reset)
    }
  }, [])

  useEffect(() => {
    if (!enabled) {
      queueMicrotask(() => setBadgeCount(0))
      return
    }

    let cancelled = false

    const refreshTargets = async () => {
      const sessionIds = await resolveGuestSessionIds()
      const orderIds = readGuestOrderIds()
      if (!cancelled) setTargets({ sessionIds, orderIds })
    }

    void refreshTargets()
    window.addEventListener('storage', refreshTargets)
    window.addEventListener(GUEST_NOTIFICATION_EVENT, refreshTargets)

    return () => {
      cancelled = true
      window.removeEventListener('storage', refreshTargets)
      window.removeEventListener(GUEST_NOTIFICATION_EVENT, refreshTargets)
    }
  }, [enabled])

  useEffect(() => {
    if (!enabled) return
    if (targets.sessionIds.length === 0 && targets.orderIds.length === 0) return

    let socket: Socket | null = null
    const connectTimer = window.setTimeout(() => {
      socket = io(`${API_BASE}/chat`, {
        transports: ['websocket'],
        reconnection: true,
        reconnectionDelay: 800,
        reconnectionDelayMax: 4000,
        timeout: 8000,
      })

      const joinTargets = () => {
        targets.sessionIds.forEach((sessionId) => {
          socket?.emit('joinSession', { sessionId, role: 'customer' })
        })
        targets.orderIds.forEach((orderId) => {
          socket?.emit('joinOrder', { orderId })
        })
      }

      socket.on('connect', joinTargets)
      socket.on('reconnect', joinTargets)
      socket.on('newMessage', (message: ChatMessage) => {
        if (message.sender_type === 'STAFF' && message.message_type !== 'SYSTEM') {
          incrementBadge()
          notifyGuest(
            'A25 Hotel',
            message.translated_message || message.original_message || 'You have a new message',
          )
        }
      })
      socket.on('orderStatusChanged', (data: GuestOrderNotification) => {
        incrementBadge()
        notifyGuest('A25 Hotel', getOrderStatusMessage(data.order))
      })
    }, 0)

    return () => {
      window.clearTimeout(connectTimer)
      socket?.removeAllListeners()
      socket?.disconnect()
    }
  }, [enabled, targets, incrementBadge, notifyGuest])
}

function getOrderStatusMessage(order: FoodOrder) {
  const statusText: Record<FoodOrder['status'], string> = {
    PENDING: 'Your order is pending confirmation.',
    ACCEPTED: 'Your order has been accepted.',
    REJECTED: order.rejected_reason
      ? `Your order was rejected: ${order.rejected_reason}`
      : 'Your order was rejected.',
    COMPLETED: 'Your order has been completed.',
    CANCELLED: 'Your order was cancelled.',
  }

  return `Order #${order.id}: ${statusText[order.status]}`
}

async function resolveGuestSessionIds(): Promise<number[]> {
  const tokens = Object.entries(localStorage)
    .filter(([key, token]) => key.startsWith('chat_session_') && token)
    .map(([key, token]) => ({ key, token }))

  const sessions = await Promise.all(
    tokens.map(async ({ key, token }) => {
      try {
        const session = await getChatSessionByToken(token)
        if (session.status === 'CLOSED') {
          localStorage.removeItem(key)
          return null
        }
        return Number(session.id)
      } catch {
        localStorage.removeItem(key)
        return null
      }
    }),
  )

  return [...new Set(sessions.filter((id): id is number => id !== null))]
}

function readGuestOrderIds(): number[] {
  try {
    const raw = localStorage.getItem(GUEST_ORDER_IDS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return [
      ...new Set(parsed.map((id) => Number(id)).filter((id) => Number.isInteger(id) && id > 0)),
    ]
  } catch {
    return []
  }
}

export type GuestOrderNotification = { orderId: number; order: FoodOrder }
