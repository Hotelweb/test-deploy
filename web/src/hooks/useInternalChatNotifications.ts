import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  getInternalConversations,
  getStaffInternalConversations,
  type InternalChatConversation,
} from '../api'
import { useChatSocket } from './useChatSocket'
import { ChatSocketRole } from '../lib/socketEvents'
import { useAuth } from './useAuth'

export function useInternalChatNotifications(hotelId?: number) {
  const auth = useAuth()
  const [conversations, setConversations] = useState<InternalChatConversation[]>([])

  const load = useCallback(async () => {
    const [systemList, staffList] = await Promise.all([
      getInternalConversations(hotelId),
      auth?.user.scope === 'hotel' && hotelId
        ? getStaffInternalConversations(hotelId)
        : Promise.resolve([]),
    ])
    const list = [...systemList, ...staffList]
    setConversations(list)
  }, [auth?.user.scope, hotelId])

  useEffect(() => {
    void load().catch(() => undefined)
    const timer = window.setInterval(() => {
      void load()
        .then(() => undefined)
        .catch(() => undefined)
    }, 30000)
    return () => {
      window.clearInterval(timer)
    }
  }, [load])

  useChatSocket({
    hotelId: auth?.user.scope === 'hotel' ? auth.user.hotel_id : undefined,
    joinSystem: auth?.user.scope === 'system',
    role: ChatSocketRole.Staff,
    onInternalMessage: ({ conversation }) => {
      setConversations((prev) =>
        upsertConversation(prev, normalizeConversation(conversation, auth?.user)),
      )
    },
    onInternalConversationRead: ({ conversation }) => {
      setConversations((prev) =>
        upsertConversation(prev, normalizeConversation(conversation, auth?.user)),
      )
    },
  })

  const totalUnread = useMemo(
    () => conversations.reduce((sum, item) => sum + (item.unread_count ?? 0), 0),
    [conversations],
  )

  const unreadByHotel = useMemo(() => {
    const map: Record<number, number> = {}
    for (const item of conversations) map[item.hotel_id] = item.unread_count ?? 0
    return map
  }, [conversations])

  return { conversations, totalUnread, unreadByHotel, reload: load }
}

function normalizeConversation(
  conversation: InternalChatConversation,
  user: { id: number; scope: 'system' | 'hotel' } | undefined,
) {
  if (conversation.conversation_type === 'HOTEL_STAFF') {
    return {
      ...conversation,
      unread_count:
        user?.id === conversation.participant_a_user_id
          ? conversation.unread_participant_a_count
          : user?.id === conversation.participant_b_user_id
            ? conversation.unread_participant_b_count
            : 0,
    }
  }

  return {
    ...conversation,
    unread_count:
      user?.scope === 'system'
        ? conversation.unread_system_count
        : conversation.unread_hotel_count,
  }
}

function upsertConversation(
  conversations: InternalChatConversation[],
  nextConversation: InternalChatConversation,
) {
  const next = conversations.some((item) => item.id === nextConversation.id)
    ? conversations.map((item) => (item.id === nextConversation.id ? nextConversation : item))
    : [nextConversation, ...conversations]

  return next.sort((a, b) => {
    const ta = a.last_message_at ? new Date(a.last_message_at).getTime() : 0
    const tb = b.last_message_at ? new Date(b.last_message_at).getTime() : 0
    return tb - ta
  })
}
