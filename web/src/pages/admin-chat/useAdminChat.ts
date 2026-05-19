import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { getChatMessages, getHotel, getHotelSessions, markSessionRead } from '../../api'
import type { ChatMessage, ChatSession, Hotel } from '../../api'
import type { DisplayMessage } from '../../components/chat/MessageBubble'
import { useChatSocket } from '../../hooks/useChatSocket'
import {
  playNotificationSound,
  requestNotificationPermission,
  showBrowserNotification,
} from '../../lib/notifications'
import { ADMIN_LANG, FILTERS, STAFF_USER_ID, type FilterKey } from './constants'

export function useAdminChat(hotelId: number) {
  const [hotel, setHotel] = useState<Hotel | null>(null)
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [activeSession, setActiveSession] = useState<ChatSession | null>(null)
  const [messages, setMessages] = useState<DisplayMessage[]>([])
  const [input, setInput] = useState('')
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<FilterKey>('all')
  const [loading, setLoading] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [showOriginal, setShowOriginal] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [notifEnabled, setNotifEnabled] = useState<NotificationPermission>('default')
  const [guestTyping, setGuestTyping] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const activeSessionIdRef = useRef<number | null>(null)

  useEffect(() => {
    activeSessionIdRef.current = activeSession?.id ?? null
  }, [activeSession?.id])

  useEffect(() => {
    if (!hotelId) return
    let cancelled = false

    const load = async () => {
      try {
        const [h, s] = await Promise.all([getHotel(hotelId), getHotelSessions(hotelId)])
        if (cancelled) return
        setHotel(h)
        setSessions(s)
      } catch (err) {
        console.error('Failed to load admin dashboard:', err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()

    return () => {
      cancelled = true
    }
  }, [hotelId])

  useEffect(() => {
    if (typeof Notification === 'undefined') return
    const sync = () => setNotifEnabled(Notification.permission)
    sync()
    window.addEventListener('focus', sync)
    return () => window.removeEventListener('focus', sync)
  }, [])

  const handleNewMessage = useCallback((msg: ChatMessage) => {
    if (msg.session_id !== activeSessionIdRef.current) return
    setMessages((prev) => {
      if (msg.client_message_id) {
        const idx = prev.findIndex(
          (m) => m._optimistic && m.client_message_id === msg.client_message_id,
        )
        if (idx >= 0) {
          const next = [...prev]
          next[idx] = msg
          return next
        }
      }
      if (prev.some((m) => m.id === msg.id)) return prev
      return [...prev, msg]
    })
  }, [])

  const handleSessionUpdate = useCallback(
    (data: { sessionId: number; message: ChatMessage; session: ChatSession }) => {
      setSessions((prev) => {
        const idx = prev.findIndex((s) => s.id === data.sessionId)
        if (idx >= 0) {
          const next = [...prev]
          next[idx] = data.session
          next.sort((a, b) => {
            const ta = a.last_message_at ? new Date(a.last_message_at).getTime() : 0
            const tb = b.last_message_at ? new Date(b.last_message_at).getTime() : 0
            return tb - ta
          })
          return next
        }
        return [data.session, ...prev]
      })

      if (
        data.message.sender_type === 'CUSTOMER' &&
        data.message.session_id !== activeSessionIdRef.current
      ) {
        if (soundEnabled) playNotificationSound()
        const guestName = data.session.customer_name || `Khách #${data.session.id}`
        const previewText =
          data.message.translated_message ?? data.message.original_message ?? '...'
        showBrowserNotification(`Tin nhắn mới · ${guestName}`, previewText, {
          tag: `chat-${data.session.id}`,
        })
      }
    },
    [soundEnabled],
  )

  const handleTyping = useCallback(
    (data: { sessionId: number; sender_type: 'CUSTOMER' | 'STAFF'; isTyping: boolean }) => {
      if (data.sessionId !== activeSessionIdRef.current) return
      if (data.sender_type === 'CUSTOMER') setGuestTyping(data.isTyping)
    },
    [],
  )

  const handleMessagesRead = useCallback(
    (data: { sessionId: number; by: 'customer' | 'staff' }) => {
      if (data.sessionId !== activeSessionIdRef.current) return
      if (data.by !== 'customer') return
      setMessages((prev) =>
        prev.map((m) =>
          m.sender_type === 'STAFF' && !m.is_read
            ? { ...m, is_read: true, status: 'READ', read_at: new Date().toISOString() }
            : m,
        ),
      )
    },
    [],
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
      if (activeSession?.id === data.sessionId) setActiveSession(data.session)
    },
    [activeSession?.id],
  )

  const {
    connection,
    sendMessage: socketSend,
    emitTyping,
    markRead,
  } = useChatSocket({
    sessionId: activeSession?.id ?? null,
    hotelId,
    role: 'staff',
    onNewMessage: handleNewMessage,
    onTyping: handleTyping,
    onMessagesRead: handleMessagesRead,
    onSessionUpdate: handleSessionUpdate,
    onSessionUnreadUpdate: handleSessionUnreadUpdate,
    onSessionStatusChanged: handleSessionStatusChanged,
  })

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, guestTyping])

  useEffect(() => {
    if (!activeSession) return
    const hasUnread = messages.some(
      (m) => m.sender_type === 'CUSTOMER' && !m.is_read && m.message_type !== 'SYSTEM',
    )
    if (!hasUnread) return
    if (connection !== 'online') return

    let cancelled = false
    const run = async () => {
      try {
        markRead()
        await markSessionRead(activeSession.id, 'staff').catch(() => undefined)
        if (cancelled) return
        setMessages((prev) =>
          prev.map((m) =>
            m.sender_type === 'CUSTOMER' && !m.is_read ? { ...m, is_read: true } : m,
          ),
        )
        setSessions((prev) =>
          prev.map((s) => (s.id === activeSession.id ? { ...s, unread_count: 0 } : s)),
        )
      } catch (err) {
        console.error('Failed to mark messages read:', err)
      }
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [activeSession, messages, connection, markRead])

  const handleSelectSession = useCallback(async (session: ChatSession) => {
    setActiveSession(session)
    setMessages([])
    setLoadingMessages(true)
    setGuestTyping(false)
    try {
      const msgs = await getChatMessages(session.id)
      setMessages(msgs)
    } catch (err) {
      console.error('Failed to load messages:', err)
    } finally {
      setLoadingMessages(false)
      setTimeout(() => inputRef.current?.focus(), 200)
    }
  }, [])

  const performSend = useCallback(
    (text: string, opts?: { messageType?: 'TEXT' | 'IMAGE'; imageUrl?: string }) => {
      if (!activeSession) return
      const trimmed = text.trim()
      if (!trimmed && !opts?.imageUrl) return

      const clientId = `s_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
      const optimistic: DisplayMessage = {
        id: -Date.now(),
        session_id: activeSession.id,
        sender_type: 'STAFF',
        message_type: opts?.messageType ?? 'TEXT',
        source_language: ADMIN_LANG,
        target_language: activeSession.customer_language,
        original_message: trimmed || null,
        translated_message: null,
        translation_status: 'PENDING',
        translation_provider: null,
        translation_duration_ms: null,
        image_url: opts?.imageUrl ?? null,
        status: 'SENDING',
        client_message_id: clientId,
        is_read: false,
        read_at: null,
        created_at: new Date().toISOString(),
        _optimistic: true,
      }
      setMessages((prev) => [...prev, optimistic])

      socketSend({
        sessionId: activeSession.id,
        message: trimmed,
        source_language: ADMIN_LANG,
        sender_type: 'STAFF',
        sender_user_id: STAFF_USER_ID,
        client_message_id: clientId,
        message_type: opts?.messageType,
        image_url: opts?.imageUrl,
      })

      if (activeSession.status === 'OPEN') {
        setActiveSession({ ...activeSession, status: 'ASSIGNED' })
        setSessions((prev) =>
          prev.map((s) => (s.id === activeSession.id ? { ...s, status: 'ASSIGNED' } : s)),
        )
      }

      window.setTimeout(() => {
        setMessages((prev) =>
          prev.map((m) =>
            m.client_message_id === clientId && m._optimistic
              ? { ...m, _failed: true, _optimistic: false, status: 'FAILED' }
              : m,
          ),
        )
      }, 8000)
    },
    [activeSession, socketSend],
  )

  const handleSend = () => {
    performSend(input)
    setInput('')
    emitTyping(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleAttachClick = () => fileInputRef.current?.click()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      performSend('', { messageType: 'IMAGE', imageUrl: dataUrl })
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const handleRetry = (msg: DisplayMessage) => {
    setMessages((prev) => prev.filter((m) => m.client_message_id !== msg.client_message_id))
    performSend(msg.original_message ?? '', {
      messageType: msg.message_type === 'IMAGE' ? 'IMAGE' : 'TEXT',
      imageUrl: msg.image_url ?? undefined,
    })
  }

  const typingTimerRef = useRef<number | null>(null)
  useEffect(() => {
    if (!activeSession) return
    if (input.trim().length === 0) {
      emitTyping(false)
      return
    }
    emitTyping(true)
    if (typingTimerRef.current) window.clearTimeout(typingTimerRef.current)
    typingTimerRef.current = window.setTimeout(() => emitTyping(false), 1500)
    return () => {
      if (typingTimerRef.current) window.clearTimeout(typingTimerRef.current)
    }
  }, [input, activeSession, emitTyping])

  const filteredSessions = useMemo(() => {
    let out = sessions
    const filterDef = FILTERS.find((f) => f.key === filter)
    if (filterDef?.statuses) {
      out = out.filter((s) => filterDef.statuses!.includes(s.status))
    }
    const q = search.trim().toLowerCase()
    if (q) {
      out = out.filter((s) => {
        const name = (s.customer_name ?? `Khách #${s.id}`).toLowerCase()
        const phone = (s.customer_phone ?? '').toLowerCase()
        const email = (s.customer_email ?? '').toLowerCase()
        const room = (s.room_number ?? '').toLowerCase()
        return name.includes(q) || phone.includes(q) || email.includes(q) || room.includes(q)
      })
    }
    return out
  }, [sessions, search, filter])

  const filterCounts = useMemo(() => {
    const counts: Record<FilterKey, number> = {
      all: sessions.length,
      active: 0,
      waiting: 0,
      booked: 0,
      closed: 0,
    }
    for (const s of sessions) {
      if (s.status === 'OPEN') counts.waiting++
      else if (s.status === 'ASSIGNED') counts.active++
      else if (s.status === 'BOOKED') counts.booked++
      else if (s.status === 'CLOSED') counts.closed++
    }
    return counts
  }, [sessions])

  const totalUnread = useMemo(
    () => sessions.reduce((sum, s) => sum + (s.unread_count ?? 0), 0),
    [sessions],
  )

  useEffect(() => {
    if (totalUnread > 0) {
      document.title = `(${totalUnread}) Khách sạn · Trò chuyện`
    } else {
      document.title = 'Khách sạn · Trò chuyện'
    }
  }, [totalUnread])

  const toggleNotifications = async () => {
    const result = await requestNotificationPermission()
    setNotifEnabled(result)
  }

  return {
    hotel,
    loading,
    activeSession,
    setActiveSession,
    messages,
    input,
    setInput,
    search,
    setSearch,
    filter,
    setFilter,
    loadingMessages,
    showOriginal,
    setShowOriginal,
    soundEnabled,
    setSoundEnabled,
    notifEnabled,
    guestTyping,
    connection,
    messagesEndRef,
    inputRef,
    fileInputRef,
    filteredSessions,
    filterCounts,
    handleSelectSession,
    handleSend,
    handleKeyDown,
    handleAttachClick,
    handleFileChange,
    handleRetry,
    toggleNotifications,
  }
}
