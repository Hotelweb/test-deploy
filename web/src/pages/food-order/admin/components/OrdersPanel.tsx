import { useState } from 'react'
import type { FoodOrder, FoodOrderStatus, PaginatedResponse } from '../../../../api'
import { InRoomDiningIcon } from '../../../../components/icons/ServiceIcons'
import { ORDER_FILTERS, type OrderFilter } from '../consts'
import { OrderCard, OrderDetailModal } from './OrderCard'

interface OrdersPanelProps {
  orders: FoodOrder[]
  filter: OrderFilter
  counts: Record<OrderFilter, number>
  meta: PaginatedResponse<FoodOrder>['meta'] | null
  page: number
  loading: boolean
  onFilterChange: (filter: OrderFilter) => void
  onPageChange: (page: number) => void
  onAction: (order: FoodOrder, status: FoodOrderStatus) => void
  onAssignToMe: (order: FoodOrder) => void
}

export function OrdersPanel({
  orders,
  filter,
  counts,
  meta,
  page,
  loading,
  onFilterChange,
  onPageChange,
  onAction,
  onAssignToMe,
}: OrdersPanelProps) {
  const [selectedOrder, setSelectedOrder] = useState<FoodOrder | null>(null)
  const totalCount = meta?.total_count ?? counts[filter]
  const totalPages = meta?.total_pages ?? 1
  const start = totalCount === 0 ? 0 : (page - 1) * (meta?.per_page ?? 20) + 1
  const end = totalCount === 0 ? 0 : Math.min(start + orders.length - 1, totalCount)

  return (
    <div className="space-y-4">
      <section className="glass-card rounded-2xl p-4 sm:p-5">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-text">Lịch sử đơn hàng</h2>
            <p className="text-[12.5px] text-text-light mt-1">
              Danh sách gọn để quét nhanh. Bấm vào từng đơn để xem đầy đủ thông tin.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 xl:flex gap-2 xl:flex-shrink-0">
            {ORDER_FILTERS.map((item) => {
              const active = filter === item.key
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => onFilterChange(item.key)}
                  className={`min-h-14 min-w-0 xl:w-[5.25rem] rounded-xl px-3 py-2 text-left cursor-pointer border transition-all ${
                    active
                      ? 'border-primary bg-primary text-white shadow-card'
                      : 'border-border-light bg-white hover:border-primary/30'
                  }`}
                >
                  <span className="block text-[11px] font-semibold opacity-80 leading-tight">
                    {item.label}
                  </span>
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

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-1">
        <p className="text-[12.5px] text-text-light">
          {loading
            ? 'Đang tải đơn hàng...'
            : totalCount > 0
              ? `Hiển thị ${start}-${end} trong ${totalCount} đơn`
              : 'Không có đơn hàng trong bộ lọc này'}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={loading || page <= 1}
            onClick={() => onPageChange(page - 1)}
            className="h-9 px-3 rounded-xl border border-border-light bg-white text-[13px] font-semibold text-text-muted disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer hover:border-primary/30"
          >
            Trước
          </button>
          <span className="min-w-20 text-center text-[12.5px] font-semibold text-text">
            {page}/{totalPages}
          </span>
          <button
            type="button"
            disabled={loading || page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            className="h-9 px-3 rounded-xl border border-border-light bg-white text-[13px] font-semibold text-text-muted disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer hover:border-primary/30"
          >
            Sau
          </button>
        </div>
      </div>

      {loading ? (
        <div className="glass-card rounded-2xl text-center py-16 px-6">
          <div className="w-10 h-10 mx-auto rounded-full border-3 border-primary border-t-transparent animate-spin" />
          <p className="text-text-light text-[13px] mt-3">Đang tải lịch sử đơn hàng</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="glass-card rounded-2xl text-center py-16 px-6">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-orange-50 text-orange-700 flex items-center justify-center">
            <InRoomDiningIcon className="w-7 h-7" />
          </div>
          <p className="text-text font-semibold mt-4">Chưa có đơn hàng phù hợp</p>
          <p className="text-text-light text-[13px] mt-1">Chọn bộ lọc khác hoặc chờ đơn mới.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {orders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onOpen={setSelectedOrder}
              onAction={onAction}
              onAssignToMe={onAssignToMe}
            />
          ))}
        </div>
      )}

      {selectedOrder ? (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onAction={(order, status) => {
            onAction(order, status)
            setSelectedOrder(null)
          }}
          onAssignToMe={onAssignToMe}
        />
      ) : null}
    </div>
  )
}
