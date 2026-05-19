import type { ChatSession } from '../../api'
import { getLanguage } from '../../lib/languages'
import { Avatar } from './Avatar'
import { formatRelative } from './utils'

export function SessionListItem({
  session,
  isActive,
  onClick,
}: {
  session: ChatSession
  isActive: boolean
  onClick: () => void
}) {
  const lang = getLanguage(session.customer_language)
  const name = session.customer_name || `Khách #${session.id}`
  const timeAgo = formatRelative(session.last_message_at ?? session.created_at)
  const unread = session.unread_count ?? 0

  const statusTone =
    session.status === 'OPEN'
      ? 'bg-amber-400'
      : session.status === 'ASSIGNED'
        ? 'bg-blue-500'
        : session.status === 'BOOKED'
          ? 'bg-emerald-500'
          : 'bg-gray-300'

  return (
    <li>
      <button
        onClick={onClick}
        className={`w-full text-left p-2.5 rounded-xl transition-all duration-200 cursor-pointer ${
          isActive ? 'bg-indigo-50 ring-1 ring-indigo-200' : 'hover:bg-gray-50'
        }`}
      >
        <div className="flex items-start gap-3">
          <div className="relative flex-shrink-0">
            <Avatar name={name} size="sm" />
            <span
              className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ring-2 ring-white ${statusTone}`}
              aria-hidden
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <p
                className={`text-[13.5px] truncate ${
                  unread > 0 ? 'font-bold text-text' : 'font-semibold text-text'
                }`}
              >
                {name}
              </p>
              <span className="text-[10.5px] text-text-lighter flex-shrink-0">{timeAgo}</span>
            </div>
            <div className="flex items-center justify-between gap-2 mt-0.5">
              <p className="text-[11.5px] text-text-light truncate flex items-center gap-1">
                <span aria-hidden>{lang.flag}</span>
                {session.customer_country || lang.nativeName}
              </p>
              {unread > 0 ? (
                <span className="bg-indigo-600 text-white text-[10px] font-bold rounded-full px-1.5 min-w-[18px] h-[18px] inline-flex items-center justify-center">
                  {unread > 99 ? '99+' : unread}
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </button>
    </li>
  )
}
