import { UserMenu } from '../../../../components/UserMenu'
import { ArrowLeftIcon } from '../../../../components/icons/ServiceIcons'

interface FoodOrderAdminHeaderProps {
  hotelName?: string
  pendingCount: number
  onBack: () => void
}

export function FoodOrderAdminHeader({
  hotelName,
  pendingCount,
  onBack,
}: FoodOrderAdminHeaderProps) {
  return (
    <header className="glass-nav sticky top-0 z-30 px-4 sm:px-8 py-5">
      <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-xl text-text-muted hover:bg-gray-100 flex items-center justify-center cursor-pointer"
            aria-label="Quay lại"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-text truncate">Đặt đồ ăn & nước uống</h1>
            <p className="text-[12px] text-text-light truncate">{hotelName}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {pendingCount > 0 ? (
            <span className="px-2.5 py-1 rounded-full bg-red-500 text-white text-[11px] font-bold">
              {pendingCount} đơn mới
            </span>
          ) : null}
          <UserMenu size="sm" />
        </div>
      </div>
    </header>
  )
}
