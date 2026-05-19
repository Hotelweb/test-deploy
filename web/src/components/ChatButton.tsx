import { ChatIcon } from './icons/ServiceIcons'

interface ChatButtonProps {
  onClick?: () => void
  badge?: number | null
}

export function ChatButton({ onClick, badge = 3 }: ChatButtonProps) {
  return (
    <button
      onClick={onClick}
      className="fixed z-50 bottom-6 right-6 w-14 h-14 sm:w-16 sm:h-16 rounded-full gradient-primary text-white flex items-center justify-center cursor-pointer transition-transform duration-200 hover:scale-105 active:scale-95 shadow-fab focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      aria-label={badge ? `Open chat (${badge} unread messages)` : 'Open chat support'}
    >
      <ChatIcon className="w-6 h-6 sm:w-7 sm:h-7" />

      {/* Notification badge */}
      {badge && badge > 0 ? (
        <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-[11px] font-bold flex items-center justify-center ring-2 ring-white">
          {badge > 9 ? '9+' : badge}
        </span>
      ) : null}
    </button>
  )
}
