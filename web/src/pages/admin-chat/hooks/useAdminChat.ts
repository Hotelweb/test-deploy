import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  assignChatSession,
  getChatMessages,
  getHotel,
  getHotelSessions,
  getHotelUsers,
  markSessionRead,
  updateSessionStatus,
} from '../../../api'
import type { ChatMessage, ChatSession, Hotel, HotelUser } from '../../../api'
import type { DisplayMessage } from '../../../components/messages/MessageBubble'
import { useChatSocket } from '../../../hooks/useChatSocket'
import {
  playNotificationSound,
  requestNotificationPermission,
  showBrowserNotification,
} from '../../../lib/notifications'
import {
  ChatMessageStatusValue,
  ChatMessageTypeValue,
  ChatReadActor,
  ChatSenderType,
  ChatSocketRole,
  ChatTranslationStatusValue,
  type ChatOutboundMessageType,
} from '../../../lib/socketEvents'
import { ADMIN_LANG, FILTERS, STAFF_USER_ID, type FilterKey } from '../consts'

export function useAdminChat(hotelId: number, enabled = true) {
  const [hotel, setHotel] = useState<Hotel | null>(null)
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [staff, setStaff] = useState<HotelUser[]>([])
  const [activeSession, setActiveSession] = useState<ChatSession | null>(null)
  const [messages, setMessages] = useState<DisplayMessage[]>([])
  const [input, setInput] = useState('')
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<FilterKey>('all')
  const [loading, setLoading] = useState(enabled)
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
    if (!hotelId || !enabled) {
      setLoading(false)
      return
    }
    let cancelled = false

    const load = async () => {
      try {
        const [h, s, users] = await Promise.all([
          getHotel(hotelId),
          getHotelSessions(hotelId),
          getHotelUsers(hotelId).catch(() => []),
        ])
        if (cancelled) return
        setHotel(h)
        setSessions(s)
        setStaff(users)
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
  }, [enabled, hotelId])

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
        data.message.sender_type === ChatSenderType.Customer &&
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
    (data: { sessionId: number; sender_type: ChatSenderType; isTyping: boolean }) => {
      if (data.sessionId !== activeSessionIdRef.current) return
      if (data.sender_type === ChatSenderType.Customer) setGuestTyping(data.isTyping)
    },
    [],
  )

  const handleMessagesRead = useCallback((data: { sessionId: number; by: ChatReadActor }) => {
    if (data.sessionId !== activeSessionIdRef.current) return
    if (data.by !== ChatReadActor.Customer) return
    setMessages((prev) =>
      prev.map((m) =>
        m.sender_type === ChatSenderType.Staff && !m.is_read
          ? {
              ...m,
              is_read: true,
              status: ChatMessageStatusValue.Read,
              read_at: new Date().toISOString(),
            }
          : m,
      ),
    )
  }, [])

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
    hotelId: enabled ? hotelId : null,
    role: ChatSocketRole.Staff,
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
      (m) =>
        m.sender_type === ChatSenderType.Customer &&
        !m.is_read &&
        m.message_type !== ChatMessageTypeValue.System,
    )
    if (!hasUnread) return
    if (connection !== 'online') return

    let cancelled = false
    const run = async () => {
      try {
        markRead()
        await markSessionRead(activeSession.id, ChatReadActor.Staff).catch(() => undefined)
        if (cancelled) return
        setMessages((prev) =>
          prev.map((m) =>
            m.sender_type === ChatSenderType.Customer && !m.is_read ? { ...m, is_read: true } : m,
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
    (text: string, opts?: { messageType?: ChatOutboundMessageType; imageUrl?: string }) => {
      if (!activeSession) return
      const trimmed = text.trim()
      if (!trimmed && !opts?.imageUrl) return

      const clientId = `s_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
      const optimistic: DisplayMessage = {
        id: -Date.now(),
        session_id: activeSession.id,
        sender_type: ChatSenderType.Staff,
        message_type: opts?.messageType ?? ChatMessageTypeValue.Text,
        source_language: ADMIN_LANG,
        target_language: activeSession.customer_language,
        original_message: trimmed || null,
        translated_message: null,
        translation_status: ChatTranslationStatusValue.Pending,
        translation_provider: null,
        translation_duration_ms: null,
        image_url: opts?.imageUrl ?? null,
        status: ChatMessageStatusValue.Sending,
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
        sender_type: ChatSenderType.Staff,
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
              ? { ...m, _failed: true, _optimistic: false, status: ChatMessageStatusValue.Failed }
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
      performSend('', { messageType: ChatMessageTypeValue.Image, imageUrl: dataUrl })
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const handleRetry = (msg: DisplayMessage) => {
    setMessages((prev) => prev.filter((m) => m.client_message_id !== msg.client_message_id))
    performSend(msg.original_message ?? '', {
      messageType:
        msg.message_type === ChatMessageTypeValue.Image
          ? ChatMessageTypeValue.Image
          : ChatMessageTypeValue.Text,
      imageUrl: msg.image_url ?? undefined,
    })
  }

  const handleAssignSession = async (staffId: number | null) => {
    if (!activeSession) return
    const updated = await assignChatSession(activeSession.id, {
      assigned_to_user_id: staffId,
      assigned_group: staffId ? undefined : 'customer_care',
    })
    setActiveSession(updated)
    setSessions((prev) => prev.map((s) => (s.id === updated.id ? updated : s)))
  }

  const handleResolveSession = async () => {
    if (!activeSession) return
    const updated = await updateSessionStatus(activeSession.id, 'RESOLVED')
    setActiveSession(updated)
    setSessions((prev) => prev.map((s) => (s.id === updated.id ? updated : s)))
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
      resolved: 0,
      closed: 0,
    }
    for (const s of sessions) {
      if (s.status === 'OPEN' || s.status === 'PENDING') counts.waiting++
      else if (s.status === 'ASSIGNED') counts.active++
      else if (s.status === 'BOOKED' || s.status === 'RESOLVED') counts.resolved++
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
    staff,
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
    handleAssignSession,
    handleResolveSession,
    toggleNotifications,
  }
}
