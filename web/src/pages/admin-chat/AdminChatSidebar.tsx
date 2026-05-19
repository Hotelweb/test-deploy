import type { ChatSession, Hotel } from '../../api'
import { UserMenu } from '../../components/UserMenu'
import {
  ArrowLeftIcon,
  BellIcon,
  BellOffIcon,
  PlusIcon,
  SearchIcon,
  VolumeIcon,
  VolumeOffIcon,
} from '../../components/icons/ServiceIcons'
import { FILTERS, type FilterKey } from './constants'
import { SessionListItem } from './SessionListItem'

type AdminChatSidebarProps = {
  hotel: Hotel | null
  search: string
  onSearchChange: (value: string) => void
  filter: FilterKey
  onFilterChange: (key: FilterKey) => void
  filterCounts: Record<FilterKey, number>
  filteredSessions: ChatSession[]
  activeSessionId: number | undefined
  onSelectSession: (session: ChatSession) => void
  soundEnabled: boolean
  onSoundToggle: () => void
  notifEnabled: NotificationPermission
  onToggleNotifications: () => void
  onBack: () => void
  hiddenOnMobile?: boolean
}

export function AdminChatSidebar({
  hotel,
  search,
  onSearchChange,
  filter,
  onFilterChange,
  filterCounts,
  filteredSessions,
  activeSessionId,
  onSelectSession,
  soundEnabled,
  onSoundToggle,
  notifEnabled,
  onToggleNotifications,
  onBack,
  hiddenOnMobile,
}: AdminChatSidebarProps) {
  return (
    <aside
      className={`w-full md:w-[400px] bg-white border-r border-border-light flex-col flex-shrink-0 ${
        hiddenOnMobile ? 'hidden md:flex' : 'flex'
      }`}
    >
      <div className="px-4 pt-4 pb-3 border-b border-border-light flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-xl text-text-muted bg-white border border-border-light hover:bg-gray-50 flex items-center justify-center cursor-pointer transition-colors flex-shrink-0"
            aria-label="Quay lại trang quản trị"
            title="Quay lại trang quản trị"
          >
            <ArrowLeftIcon className="w-4 h-4" />
          </button>
          <UserMenu size="sm" />
        </div>
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <h1 className="text-[18px] font-bold text-text leading-tight">Hộp thư</h1>
            {hotel ? (
              <p className="text-[11.5px] text-text-light truncate mt-0.5">{hotel.name}</p>
            ) : null}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={onSoundToggle}
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors duration-200 cursor-pointer ${
                soundEnabled
                  ? 'text-text-muted hover:bg-gray-100'
                  : 'text-text-lighter hover:bg-gray-100'
              }`}
              aria-label={soundEnabled ? 'Tắt âm thanh' : 'Bật âm thanh'}
              title={soundEnabled ? 'Tắt âm thanh' : 'Bật âm thanh'}
            >
              {soundEnabled ? (
                <VolumeIcon className="w-4 h-4" />
              ) : (
                <VolumeOffIcon className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={onToggleNotifications}
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors duration-200 cursor-pointer ${
                notifEnabled === 'granted'
                  ? 'text-emerald-600 hover:bg-emerald-50'
                  : 'text-text-muted hover:bg-gray-100'
              }`}
              aria-label="Thông báo trình duyệt"
              title={notifEnabled === 'granted' ? 'Thông báo đã bật' : 'Bật thông báo trình duyệt'}
            >
              {notifEnabled === 'granted' ? (
                <BellIcon className="w-4 h-4" />
              ) : (
                <BellOffIcon className="w-4 h-4" />
              )}
            </button>
            <button
              className="w-9 h-9 rounded-xl gradient-indigo text-white flex items-center justify-center hover:shadow-card transition-all duration-200 cursor-pointer"
              aria-label="Cuộc trò chuyện mới"
            >
              <PlusIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-lighter pointer-events-none">
            <SearchIcon className="w-4 h-4" />
          </span>
          <input
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Tìm theo tên, SĐT, phòng…"
            className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-gray-50 text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:bg-white border border-border-light focus:border-indigo-300 transition-all placeholder:text-text-lighter"
          />
        </div>

        <div className="flex gap-1 overflow-x-auto -mx-1 px-1 pb-1 scrollbar-none">
          {FILTERS.map((f) => {
            const count = filterCounts[f.key]
            const isActive = filter === f.key
            return (
              <button
                key={f.key}
                onClick={() => onFilterChange(f.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium whitespace-nowrap transition-all duration-200 cursor-pointer flex-shrink-0 ${
                  isActive
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-text-muted hover:bg-gray-200'
                }`}
              >
                {f.label}
                {count > 0 ? (
                  <span
                    className={`text-[10.5px] font-bold rounded-full px-1.5 py-0 ${
                      isActive ? 'bg-white/25 text-white' : 'bg-white text-text-muted'
                    }`}
                  >
                    {count}
                  </span>
                ) : null}
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filteredSessions.length === 0 ? (
          <div className="p-6 text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-gray-50 flex items-center justify-center text-text-lighter">
              <SearchIcon className="w-6 h-6" />
            </div>
            <p className="text-[13px] text-text-muted font-medium">
              {search ? 'Không có kết quả' : 'Chưa có cuộc trò chuyện'}
            </p>
            <p className="text-[11.5px] text-text-lighter mt-1">
              {search ? 'Thử từ khóa khác' : 'Đang chờ khách liên hệ'}
            </p>
          </div>
        ) : (
          <ul className="p-2 flex flex-col gap-1" role="list">
            {filteredSessions.map((session) => (
              <SessionListItem
                key={session.id}
                session={session}
                isActive={activeSessionId === session.id}
                onClick={() => onSelectSession(session)}
              />
            ))}
          </ul>
        )}
      </div>
    </aside>
  )
}
