import type { FoodOrder, FoodOrderStatus } from '../../../../api'
import { InRoomDiningIcon } from '../../../../components/icons/ServiceIcons'
import { ORDER_FILTERS, type OrderFilter } from '../consts'
import { OrderCard } from './OrderCard'

interface OrdersPanelProps {
  orders: FoodOrder[]
  filter: OrderFilter
  counts: Record<OrderFilter, number>
  onFilterChange: (filter: OrderFilter) => void
  onAction: (order: FoodOrder, status: FoodOrderStatus) => void
}

export function OrdersPanel({
  orders,
  filter,
  counts,
  onFilterChange,
  onAction,
}: OrdersPanelProps) {
  return (
    <div className="space-y-4">
      <section className="glass-card rounded-2xl p-4 sm:p-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-text">Đơn hàng</h2>
            <p className="text-[12.5px] text-text-light mt-1">
              Theo dõi đơn mới, nhận đơn và đánh dấu đã giao từ một màn hình.
            </p>
          </div>
          <div className="grid grid-cols-3 sm:flex gap-2">
            {ORDER_FILTERS.map((item) => {
              const active = filter === item.key
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => onFilterChange(item.key)}
                  className={`min-h-14 rounded-xl px-3 py-2 text-left cursor-pointer border transition-all ${
                    active
                      ? 'border-primary bg-primary text-white shadow-card'
                      : 'border-border-light bg-white hover:border-primary/30'
                  }`}
                >
                  <span className="block text-[11px] font-semibold opacity-80">{item.label}</span>
                  <span
                    className={`inline-flex mt-1 min-w-6 h-6 px-1.5 rounded-full text-[12px] font-bold items-center justify-center ${
                      active ? 'bg-white/20 text-white' : item.tone
                    }`}
                  >
                    {counts[item.key]}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </section>

      {orders.length === 0 ? (
        <div className="glass-card rounded-2xl text-center py-16 px-6">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-orange-50 text-orange-700 flex items-center justify-center">
            <InRoomDiningIcon className="w-7 h-7" />
          </div>
          <p className="text-text font-semibold mt-4">Chưa có đơn hàng phù hợp</p>
          <p className="text-text-light text-[13px] mt-1">Chọn bộ lọc khác hoặc chờ đơn mới.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} onAction={onAction} />
          ))}
        </div>
      )}
    </div>
  )
}
