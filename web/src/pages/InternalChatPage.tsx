import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  getHotel,
  getHotelUsers,
  getInternalMessages,
  getStaffInternalConversations,
  getStaffInternalMessages,
  markInternalConversationRead,
  markStaffInternalConversationRead,
  sendInternalMessage,
  sendStaffInternalMessage,
  type Hotel,
  type HotelUser,
  type InternalChatConversation,
  type InternalChatMessage,
} from '../api'
import {
  ArrowLeftIcon,
  SearchIcon,
  SendIcon,
  UserCircleIcon,
} from '../components/icons/ServiceIcons'
import { useAuth } from '../hooks/useAuth'
import { useChatSocket } from '../hooks/useChatSocket'
import { ChatSocketRole } from '../lib/socketEvents'
import { roleLabel } from '../lib/permissions'

export function InternalChatPage() {
  const { hotelId: hotelIdParam } = useParams<{ hotelId: string }>()
  const hotelId = Number(hotelIdParam)
  const navigate = useNavigate()
  const auth = useAuth()

  const [hotel, setHotel] = useState<Hotel | null>(null)
  const [staff, setStaff] = useState<HotelUser[]>([])
  const [staffConversations, setStaffConversations] = useState<InternalChatConversation[]>([])
  const [messages, setMessages] = useState<InternalChatMessage[]>([])
  const [activePeerId, setActivePeerId] = useState<number | null>(null)
  const [staffSearch, setStaffSearch] = useState('')
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const endRef = useRef<HTMLDivElement | null>(null)

  const load = useCallback(async () => {
    if (!hotelId) return
    setLoading(true)
    setError(null)
    try {
      const [hotelData, messageData] = await Promise.all([
        getHotel(hotelId),
        getInternalMessages(hotelId),
      ])
      setHotel(hotelData)
      setMessages(messageData)
      if (auth?.user.scope === 'hotel') {
        const [users, conversations] = await Promise.all([
          getHotelUsers(hotelId),
          getStaffInternalConversations(hotelId),
        ])
        setStaff(users.filter((user) => user.id !== auth.user.id && user.is_active))
        setStaffConversations(conversations)
      }
      await markInternalConversationRead(hotelId).catch(() => undefined)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không tải được chat nội bộ')
    } finally {
      setLoading(false)
    }
  }, [auth?.user, hotelId])

  const filteredStaff = useMemo(
    () => filterStaffByNameOrRole(staff, staffSearch),
    [staff, staffSearch],
  )

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages.length])

  useChatSocket({
    hotelId,
    joinSystem: auth?.user.scope === 'system',
    role: ChatSocketRole.Staff,
    onInternalMessage: ({ message }) => {
      if (message.hotel_id !== hotelId) return
      if (activePeerId) {
        const belongsToActivePeer =
          message.sender_user_id === activePeerId || message.sender_user_id === auth?.user.id
        if (!belongsToActivePeer) return
      } else if (message.sender_scope === 'hotel' && message.sender_user_id !== auth?.user.id) {
        return
      }
      setMessages((prev) =>
        prev.some((item) => item.id === message.id) ? prev : [...prev, message],
      )
      if (activePeerId) {
        void markStaffInternalConversationRead(hotelId, activePeerId).catch(() => undefined)
      } else {
        void markInternalConversationRead(hotelId).catch(() => undefined)
      }
    },
  })

  const loadSystemConversation = async () => {
    setActivePeerId(null)
    setLoading(true)
    try {
      const data = await getInternalMessages(hotelId)
      setMessages(data)
      await markInternalConversationRead(hotelId).catch(() => undefined)
    } finally {
      setLoading(false)
    }
  }

  const loadStaffConversation = async (peerUserId: number) => {
    setActivePeerId(peerUserId)
    setLoading(true)
    try {
      const data = await getStaffInternalMessages(hotelId, peerUserId)
      setMessages(data)
      await markStaffInternalConversationRead(hotelId, peerUserId).catch(() => undefined)
      const conversations = await getStaffInternalConversations(hotelId).catch(() => [])
      setStaffConversations(conversations)
    } finally {
      setLoading(false)
    }
  }

  const handleSend = async () => {
    const text = input.trim()
    if (!text || sending) return
    setSending(true)
    setInput('')
    try {
      const result = activePeerId
        ? await sendStaffInternalMessage(hotelId, activePeerId, text)
        : await sendInternalMessage(hotelId, text)
      setMessages((prev) =>
        prev.some((item) => item.id === result.message.id) ? prev : [...prev, result.message],
      )
    } catch (err) {
      setInput(text)
      setError(err instanceof Error ? err.message : 'Không gửi được tin nhắn')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="h-[100dvh] bg-background-warm flex flex-col">
      <header className="glass-nav px-4 sm:px-8 py-4 border-b border-border-light">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => navigate(`/admin/${hotelId}`)}
              className="w-10 h-10 rounded-xl bg-white border border-border text-text-muted hover:text-primary hover:bg-gray-50 flex items-center justify-center cursor-pointer transition-colors"
              aria-label="Quay lại"
            >
              <ArrowLeftIcon className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-bold text-text truncate">Chat nội bộ</h1>
              <p className="text-[12.5px] text-text-light truncate">
                {hotel?.name ?? 'Khách sạn'} ·{' '}
                {activePeerId ? activePeerName(staff, activePeerId) : 'System admin'}
              </p>
            </div>
          </div>
          <span className="hidden sm:inline-flex rounded-full bg-emerald-50 px-3 py-1 text-[12px] font-semibold text-primary">
            {auth?.user.scope === 'system' ? 'System admin' : 'Hotel admin'}
          </span>
        </div>
      </header>

      <main className="flex-1 min-h-0 px-4 sm:px-8 py-4">
        <div className="max-w-6xl mx-auto h-full bg-white border border-border-light rounded-2xl shadow-soft grid grid-cols-1 md:grid-cols-[18rem_minmax(0,1fr)] overflow-hidden">
          {auth?.user.scope === 'hotel' ? (
            <aside className="border-b md:border-b-0 md:border-r border-border-light bg-gray-50/60 p-3 overflow-y-auto">
              <button
                type="button"
                onClick={() => void loadSystemConversation()}
                className={`w-full rounded-xl px-3 py-2.5 text-left cursor-pointer transition-colors ${
                  activePeerId === null
                    ? 'bg-white border border-primary/25 text-primary shadow-soft'
                    : 'hover:bg-white border border-transparent text-text'
                }`}
              >
                <span className="block text-[13px] font-bold">System admin</span>
                <span className="block text-[11.5px] text-text-light">Hỗ trợ hệ thống</span>
              </button>
              <div className="mt-3 mb-2 px-1 text-[11px] font-bold uppercase tracking-wide text-text-light">
                Nhân viên
              </div>
              <div className="relative mb-2">
                <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-lighter pointer-events-none" />
                <input
                  type="search"
                  value={staffSearch}
                  onChange={(event) => setStaffSearch(event.target.value)}
                  placeholder="Tìm tên hoặc role"
                  className="h-10 w-full rounded-xl border border-border-light bg-white pl-9 pr-3 text-[12.5px] text-text outline-none transition-colors placeholder:text-text-lighter focus:border-primary/35 focus:ring-2 focus:ring-primary/15"
                />
              </div>
              <div className="space-y-1.5">
                {filteredStaff.map((user) => {
                  const unread = getStaffUnread(staffConversations, user.id, auth.user.id)
                  return (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => void loadStaffConversation(user.id)}
                      className={`relative w-full rounded-xl px-3 py-2.5 text-left cursor-pointer transition-colors ${
                        activePeerId === user.id
                          ? 'bg-white border border-primary/25 text-primary shadow-soft'
                          : 'hover:bg-white border border-transparent text-text'
                      }`}
                    >
                      <span className="block text-[13px] font-bold truncate">{user.full_name}</span>
                      <span className="block text-[11.5px] text-text-light truncate">
                        {getUserRoleLabels(user)}
                      </span>
                      {unread > 0 ? (
                        <span className="absolute right-2.5 top-2.5 min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                          {unread > 99 ? '99+' : unread}
                        </span>
                      ) : null}
                    </button>
                  )
                })}
                {staff.length > 0 && filteredStaff.length === 0 ? (
                  <p className="px-2 py-3 text-[12px] text-text-light">
                    Không tìm thấy nhân viên phù hợp.
                  </p>
                ) : null}
              </div>
            </aside>
          ) : null}

          <section className="min-h-0 flex flex-col overflow-hidden">
          {error ? (
            <div className="mx-4 mt-4 rounded-xl bg-red-50 border border-red-200 px-3 py-2 text-[13px] text-red-700">
              {error}
            </div>
          ) : null}

          <div className="flex-1 overflow-y-auto p-4 sm:p-5">
            {loading ? (
              <div className="h-full flex items-center justify-center">
                <div className="w-9 h-9 border-3 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : messages.length === 0 ? (
              <div className="h-full flex items-center justify-center text-center px-6">
                <div>
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
                    <UserCircleIcon className="w-7 h-7" />
                  </div>
                  <p className="mt-3 text-[14px] font-semibold text-text">Chưa có tin nhắn</p>
                  <p className="mt-1 text-[12.5px] text-text-light">
                    Bắt đầu trao đổi giữa quản trị khách sạn và system admin.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((message) => {
                  const mine = activePeerId
                    ? message.sender_user_id === auth?.user.id
                    : message.sender_scope === auth?.user.scope
                  return (
                    <div
                      key={message.id}
                      className={`flex ${mine ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 ${
                          mine
                            ? 'bg-primary text-white rounded-br-md'
                            : 'bg-gray-50 text-text border border-border-light rounded-bl-md'
                        }`}
                      >
                        <div
                          className={`text-[11px] mb-1 ${mine ? 'text-white/75' : 'text-text-light'}`}
                        >
                          {message.sender_scope === 'system' ? 'System admin' : 'Hotel admin'} ·{' '}
                          {new Date(message.created_at).toLocaleTimeString('vi-VN', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                        <p className="text-[13.5px] leading-relaxed whitespace-pre-wrap break-words">
                          {message.message}
                        </p>
                      </div>
                    </div>
                  )
                })}
                <div ref={endRef} />
              </div>
            )}
          </div>

          <div className="border-t border-border-light p-3 sm:p-4 bg-white">
            <div className="flex items-end gap-2">
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault()
                    void handleSend()
                  }
                }}
                rows={1}
                placeholder="Nhập tin nhắn..."
                className="min-h-11 max-h-32 flex-1 resize-none rounded-xl border border-border bg-gray-50 px-3 py-2.5 text-[13.5px] text-text outline-none focus:bg-white focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
              />
              <button
                type="button"
                onClick={() => void handleSend()}
                disabled={!input.trim() || sending}
                className="w-11 h-11 rounded-xl gradient-primary text-white flex items-center justify-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                aria-label="Gửi tin nhắn"
              >
                {sending ? (
                  <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                ) : (
                  <SendIcon className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
          </section>
        </div>
      </main>
    </div>
  )
}

function activePeerName(staff: HotelUser[], peerUserId: number) {
  return staff.find((user) => user.id === peerUserId)?.full_name ?? 'Nhân viên'
}

function getUserRoleLabels(user: HotelUser) {
  const roles = user.roles?.length ? user.roles : [user.role]
  return roles.map((role) => roleLabel(role)).join(', ')
}

function filterStaffByNameOrRole(staff: HotelUser[], query: string) {
  const q = query.trim().toLowerCase()
  if (!q) return staff
  return staff.filter((user) => {
    const roles = user.roles?.length ? user.roles : [user.role]
    const haystack = [
      user.full_name,
      user.email,
      ...roles,
      ...roles.map((role) => roleLabel(role)),
    ]
      .join(' ')
      .toLowerCase()

    return haystack.includes(q)
  })
}

function getStaffUnread(
  conversations: InternalChatConversation[],
  peerUserId: number,
  currentUserId: number,
) {
  const conversation = conversations.find(
    (item) =>
      item.conversation_type === 'HOTEL_STAFF' &&
      ((item.participant_a_user_id === currentUserId &&
        item.participant_b_user_id === peerUserId) ||
        (item.participant_b_user_id === currentUserId &&
          item.participant_a_user_id === peerUserId)),
  )
  if (!conversation) return 0
  return currentUserId === conversation.participant_a_user_id
    ? conversation.unread_participant_a_count
    : conversation.unread_participant_b_count
}
