import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createChatSession, getChatMessages, getChatSessionByToken, markSessionRead } from '../api'
import type { ChatMessage, ChatSession } from '../api'
import { useChatSocket } from '../hooks/useChatSocket'
import { getLanguage } from '../lib/languages'
import { t } from '../lib/i18n'
import { LanguagePicker } from './chat/LanguagePicker'
import { BookingForm, type BookingFormValue } from './chat/BookingForm'
import { MessageBubble, type DisplayMessage } from './chat/MessageBubble'
import { TypingIndicator } from './chat/TypingIndicator'
import { ConnectionBanner, ConnectionDot } from './chat/ConnectionBanner'
import { QuickReplies } from './chat/QuickReplies'
import { SkeletonList } from './chat/SkeletonMessage'
import { CloseIcon, ImageIcon, SendIcon, SmileIcon, SparkleIcon } from './icons/ServiceIcons'

interface ChatWindowProps {
  hotelId: number
  hotelName: string
  onClose: () => void
}

type Step = 'language' | 'form' | 'chat'

export function ChatWindow({ hotelId, hotelName, onClose }: ChatWindowProps) {
  const [step, setStep] = useState<Step>('language')
  const [language, setLanguage] = useState<string | null>(null)
  const [session, setSession] = useState<ChatSession | null>(null)
  const [messages, setMessages] = useState<DisplayMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [staffTyping, setStaffTyping] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const lang = language ?? 'en'

  // -----------------------------------------------------------------------
  // Try to resume an existing session for this hotel + language pair.
  // -----------------------------------------------------------------------
  useEffect(() => {
    if (!language || step !== 'language') return
    const storageKey = `chat_session_${hotelId}_${language}`
    const token = localStorage.getItem(storageKey)
    if (!token) return

    let cancelled = false
    const resume = async () => {
      setLoading(true)
      try {
        const s = await getChatSessionByToken(token)
        if (cancelled) return
        if (s.status === 'CLOSED') {
          localStorage.removeItem(storageKey)
          return
        }
        const msgs = await getChatMessages(s.id)
        if (cancelled) return
        setSession(s)
        setMessages(msgs)
        setStep('chat')
      } catch {
        localStorage.removeItem(storageKey)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void resume()

    return () => {
      cancelled = true
    }
  }, [language, hotelId, step])

  // -----------------------------------------------------------------------
  // Realtime socket
  // -----------------------------------------------------------------------
  const handleNewMessage = useCallback((msg: ChatMessage) => {
    setMessages((prev) => {
      // Reconcile optimistic copy if client_message_id matches
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

  const handleTyping = useCallback(
    (data: { sessionId: number; sender_type: 'CUSTOMER' | 'STAFF'; isTyping: boolean }) => {
      if (data.sender_type === 'STAFF') setStaffTyping(data.isTyping)
    },
    [],
  )

  const handleMessagesRead = useCallback(
    (data: { sessionId: number; by: 'customer' | 'staff' }) => {
      if (data.by !== 'staff') return
      // Staff opened the conversation — mark our (CUSTOMER) outgoing messages as read
      setMessages((prev) =>
        prev.map((m) =>
          m.sender_type === 'CUSTOMER' && !m.is_read
            ? { ...m, is_read: true, status: 'READ', read_at: new Date().toISOString() }
            : m,
        ),
      )
    },
    [],
  )

  const {
    connection,
    sendMessage: socketSend,
    emitTyping,
    markRead,
  } = useChatSocket({
    sessionId: session?.id ?? null,
    role: 'customer',
    onNewMessage: handleNewMessage,
    onTyping: handleTyping,
    onMessagesRead: handleMessagesRead,
  })

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, staffTyping])

  // Mark staff messages as read when chat is open and online.
  // Wrapped in async function so setState calls happen after a microtask
  // (React 19 strict-mode rule).
  useEffect(() => {
    if (step !== 'chat' || connection !== 'online' || !session) return
    const hasUnreadStaff = messages.some(
      (m) => m.sender_type === 'STAFF' && !m.is_read && m.message_type !== 'SYSTEM',
    )
    if (!hasUnreadStaff) return

    let cancelled = false
    const run = async () => {
      try {
        markRead()
        await markSessionRead(session.id, 'customer').catch(() => undefined)
        if (cancelled) return
        setMessages((prev) =>
          prev.map((m) => (m.sender_type === 'STAFF' && !m.is_read ? { ...m, is_read: true } : m)),
        )
      } catch (err) {
        console.error('Failed to mark messages read:', err)
      }
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [step, connection, session, messages, markRead])

  // Auto-focus input on entering chat
  useEffect(() => {
    if (step === 'chat') setTimeout(() => inputRef.current?.focus(), 250)
  }, [step])

  // Typing emit (debounced)
  const typingTimerRef = useRef<number | null>(null)
  useEffect(() => {
    if (step !== 'chat') return
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
  }, [input, step, emitTyping])

  // -----------------------------------------------------------------------
  // Step transitions
  // -----------------------------------------------------------------------
  const handleLanguageContinue = () => {
    if (!language) return
    if (session) {
      setStep('chat')
    } else {
      setStep('form')
    }
  }

  const handleSubmitForm = async (formValue: BookingFormValue) => {
    if (!language) return
    setCreating(true)
    setCreateError(null)
    try {
      const newSession = await createChatSession({
        hotel_id: hotelId,
        customer_language: language,
        ...formValue,
      })
      localStorage.setItem(`chat_session_${hotelId}_${language}`, newSession.customer_token)
      setSession(newSession)
      setLoadingMessages(true)
      const msgs = await getChatMessages(newSession.id)
      setMessages(msgs)
      setLoadingMessages(false)
      setStep('chat')
    } catch (err) {
      console.error('Failed to create session:', err)
      setCreateError((err as Error).message ?? 'Could not start the chat. Please try again.')
    } finally {
      setCreating(false)
    }
  }

  const handleSkipForm = async () => {
    if (!language) return
    setCreating(true)
    setCreateError(null)
    try {
      const newSession = await createChatSession({
        hotel_id: hotelId,
        customer_language: language,
      })
      localStorage.setItem(`chat_session_${hotelId}_${language}`, newSession.customer_token)
      setSession(newSession)
      setLoadingMessages(true)
      const msgs = await getChatMessages(newSession.id)
      setMessages(msgs)
      setLoadingMessages(false)
      setStep('chat')
    } catch (err) {
      setCreateError((err as Error).message ?? 'Could not start the chat. Please try again.')
    } finally {
      setCreating(false)
    }
  }

  // -----------------------------------------------------------------------
  // Sending
  // -----------------------------------------------------------------------
  const performSend = useCallback(
    (text: string, opts?: { messageType?: 'TEXT' | 'IMAGE'; imageUrl?: string }) => {
      if (!session || !language) return
      const trimmed = text.trim()
      if (!trimmed && !opts?.imageUrl) return

      const clientId = `c_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
      const optimistic: DisplayMessage = {
        id: -Date.now(),
        session_id: session.id,
        sender_type: 'CUSTOMER',
        message_type: opts?.messageType ?? 'TEXT',
        source_language: language,
        target_language: 'vi',
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
        sessionId: session.id,
        message: trimmed,
        source_language: language,
        sender_type: 'CUSTOMER',
        client_message_id: clientId,
        message_type: opts?.messageType,
        image_url: opts?.imageUrl,
      })

      // Connection-down safety net: mark as failed after 8s
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
    [session, language, socketSend],
  )

  const handleSend = () => {
    performSend(input)
    setInput('')
    emitTyping(false)
  }

  const handleQuickReply = (label: string) => {
    performSend(label)
  }

  const handleAttachClick = () => fileInputRef.current?.click()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    // For demo: read as data URL. Production would upload to S3/R2 first.
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

  const handleClose = () => {
    emitTyping(false)
    onClose()
  }

  // -----------------------------------------------------------------------
  // Quick replies (localized)
  // -----------------------------------------------------------------------
  const quickReplies = useMemo(
    () => [
      { key: 'book', label: t(lang, 'qr.want_to_book'), icon: '🛏️' },
      { key: 'rooms', label: t(lang, 'qr.available_rooms'), icon: '🏨' },
      { key: 'late', label: t(lang, 'qr.late_checkin'), icon: '🌙' },
      { key: 'airport', label: t(lang, 'qr.airport_pickup'), icon: '✈️' },
      { key: 'breakfast', label: t(lang, 'qr.breakfast'), icon: '🥐' },
      { key: 'cancel', label: t(lang, 'qr.cancel_policy'), icon: '📋' },
    ],
    [lang],
  )

  const showQuickReplies =
    step === 'chat' &&
    !staffTyping &&
    messages.filter((m) => m.message_type !== 'SYSTEM' && m.sender_type === 'CUSTOMER').length === 0

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------
  const headerLang = language ? getLanguage(language) : null

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-end sm:justify-end">
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm sm:bg-transparent sm:backdrop-blur-0"
        onClick={handleClose}
        aria-label="Close"
      />

      <div
        className="relative w-full h-full sm:w-[420px] sm:h-[680px] sm:max-h-[calc(100vh-3rem)] sm:mr-6 sm:mb-6 bg-white sm:rounded-3xl overflow-hidden flex flex-col animate-slide-up shadow-modal sm:border sm:border-border-light"
        role="dialog"
        aria-label="Hotel chat"
      >
        {/* Header */}
        <header className="gradient-primary text-white px-5 py-3.5 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center flex-shrink-0 ring-1 ring-white/20">
              <SparkleIcon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-[15px] leading-tight truncate">
                {step === 'language' ? t('en', 'chat.title') : t(lang, 'chat.title')}
              </p>
              <p className="text-[11.5px] text-white/80 mt-0.5 truncate flex items-center gap-1.5">
                {step === 'chat' ? (
                  <>
                    <ConnectionDot state={connection} />
                    <span>
                      {connection === 'online'
                        ? t(lang, 'chat.online')
                        : connection === 'reconnecting' || connection === 'connecting'
                          ? t(lang, 'chat.reconnecting')
                          : t(lang, 'chat.offline')}
                    </span>
                    {headerLang ? (
                      <>
                        <span className="text-white/40">·</span>
                        <span aria-hidden>{headerLang.flag}</span>
                        <span>{headerLang.nativeName}</span>
                      </>
                    ) : null}
                  </>
                ) : (
                  hotelName
                )}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors duration-200 cursor-pointer flex-shrink-0"
            aria-label={t(lang, 'common.close')}
          >
            <CloseIcon />
          </button>
        </header>

        {/* Connection banner */}
        {step === 'chat' ? (
          <ConnectionBanner
            state={connection}
            labels={{
              offline: t(lang, 'chat.offline'),
              reconnecting: t(lang, 'chat.reconnecting'),
            }}
          />
        ) : null}

        {/* Body */}
        {step === 'language' ? (
          <>
            <LanguagePicker
              selected={language}
              onSelect={setLanguage}
              onContinue={handleLanguageContinue}
              hotelName={hotelName}
            />
            {loading ? (
              <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center">
                <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : null}
          </>
        ) : step === 'form' ? (
          <>
            <BookingForm
              language={lang}
              loading={creating}
              onSubmit={handleSubmitForm}
              onSkip={handleSkipForm}
              onBack={() => setStep('language')}
            />
            {createError ? (
              <div className="px-5 pb-3 -mt-2">
                <div className="text-[12px] text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
                  {createError}
                </div>
              </div>
            ) : null}
          </>
        ) : (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-gray-50/60">
              {loadingMessages ? <SkeletonList /> : null}
              {messages.map((msg) => (
                <MessageBubble
                  key={`${msg.id}_${msg.client_message_id ?? ''}`}
                  message={msg}
                  viewer="customer"
                  labels={{
                    sending: t(lang, 'status.sending'),
                    sent: t(lang, 'status.sent'),
                    delivered: t(lang, 'status.delivered'),
                    read: t(lang, 'status.read'),
                    failed: t(lang, 'status.failed'),
                    retry: t(lang, 'chat.retry'),
                    showOriginal: t(lang, 'chat.show_original'),
                    hideOriginal: t(lang, 'chat.hide_original'),
                    translating: t(lang, 'chat.translating'),
                    translationFailed: t(lang, 'chat.translation_failed'),
                    translatedBadge: t(lang, 'badge.translated'),
                    you: t(lang, 'common.you'),
                    staff: t(lang, 'common.staff'),
                  }}
                  onRetry={handleRetry}
                />
              ))}

              {staffTyping ? (
                <TypingIndicator
                  label={t(lang, 'common.staff') + ' ' + t(lang, 'typing.indicator')}
                  variant="guest"
                />
              ) : null}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick replies */}
            {showQuickReplies ? (
              <div className="px-3 pb-2 pt-1">
                <QuickReplies replies={quickReplies} onSelect={handleQuickReply} variant="guest" />
              </div>
            ) : null}

            {/* Composer */}
            <div className="flex-shrink-0 border-t border-border-light bg-white px-3 py-2.5">
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileChange}
              />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAttachClick}
                  className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center text-text-muted cursor-pointer flex-shrink-0 transition-colors duration-200"
                  aria-label={t(lang, 'chat.attach_image')}
                >
                  <ImageIcon className="w-5 h-5" />
                </button>
                <div className="flex-1 relative min-w-0">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSend()
                      }
                    }}
                    rows={1}
                    placeholder={t(lang, 'chat.input_placeholder')}
                    className="block w-full h-11 max-h-[120px] resize-none px-4 py-3 rounded-2xl bg-gray-100 text-[14px] leading-5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white border border-transparent focus:border-primary/30 transition-all placeholder:text-text-lighter pr-10 overflow-y-auto"
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full hover:bg-gray-200 flex items-center justify-center text-text-muted cursor-pointer transition-colors"
                    aria-label="Add emoji"
                  >
                    <SmileIcon className="w-4 h-4" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={!input.trim()}
                  className="w-11 h-11 rounded-full gradient-primary text-white flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer hover:shadow-card-hover transition-all duration-200 flex-shrink-0 active:scale-95"
                  aria-label={t(lang, 'chat.send')}
                >
                  <SendIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
