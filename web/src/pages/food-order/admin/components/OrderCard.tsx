import type { FoodOrder, FoodOrderStatus } from '../../../../api'
import { CheckIcon, InRoomDiningIcon } from '../../../../components/icons/ServiceIcons'
import { formatVnd } from '../../../../lib/currency'
import { STATUS_CLASS, STATUS_LABEL } from '../consts'
import { InfoPill } from './InfoPill'

interface OrderCardProps {
  order: FoodOrder
  onAction: (order: FoodOrder, status: FoodOrderStatus) => void
}

export function OrderCard({ order, onAction }: OrderCardProps) {
  const itemCount = order.items.reduce((sum, line) => sum + line.quantity, 0)
  const createdAt = new Date(order.created_at)

  return (
    <article className="glass-card glass-card-hover rounded-2xl p-4 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-orange-50 text-orange-700">
              <InRoomDiningIcon className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-bold text-text leading-tight">Đơn #{order.id}</h3>
              <p className="text-[12px] text-text-light mt-0.5">
                {createdAt.toLocaleString('vi-VN', {
                  hour: '2-digit',
                  minute: '2-digit',
                  day: '2-digit',
                  month: '2-digit',
                })}
              </p>
            </div>
          </div>
        </div>
        <span
          className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${STATUS_CLASS[order.status]}`}
        >
          {STATUS_LABEL[order.status]}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <InfoPill label="Phòng" value={order.room_number || '—'} />
        <InfoPill label="Khách" value={order.customer_name || 'Khách lẻ'} />
        <InfoPill label="Số món" value={`${itemCount} món`} />
        <InfoPill label="Tổng tiền" value={formatVnd(order.total_amount)} strong />
      </div>

      <div className="rounded-xl bg-gray-50 border border-border-light overflow-hidden">
        <ul className="divide-y divide-border-light" role="list">
          {order.items.map((line) => (
            <li key={line.id} className="flex items-start justify-between gap-3 px-3 py-2.5">
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-text truncate">{line.item_name}</p>
                <p className="text-[11.5px] text-text-light mt-0.5">
                  {line.quantity} x {formatVnd(line.unit_price)}
                </p>
              </div>
              <span className="text-[13px] font-bold text-text flex-shrink-0">
                {formatVnd(line.line_total)}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {order.note ? (
        <p className="rounded-xl bg-amber-50 text-amber-800 px-3 py-2 text-[12px]">
          Ghi chú: {order.note}
        </p>
      ) : null}
      {order.rejected_reason ? (
        <p className="rounded-xl bg-red-50 text-red-700 px-3 py-2 text-[12px]">
          Lý do từ chối: {order.rejected_reason}
        </p>
      ) : null}

      {order.status === 'PENDING' ? (
        <div className="grid grid-cols-2 gap-2 mt-auto">
          <button
            type="button"
            onClick={() => onAction(order, 'ACCEPTED')}
            className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-primary text-white text-[13px] font-semibold cursor-pointer shadow-card hover:shadow-card-hover transition-all"
          >
            <CheckIcon className="w-4 h-4" />
            Chấp nhận
          </button>
          <button
            type="button"
            onClick={() => onAction(order, 'REJECTED')}
            className="py-2.5 rounded-xl bg-red-50 text-red-700 text-[13px] font-semibold cursor-pointer hover:bg-red-100 transition-colors"
          >
            Từ chối
          </button>
        </div>
      ) : order.status === 'ACCEPTED' ? (
        <button
          type="button"
          onClick={() => onAction(order, 'COMPLETED')}
          className="w-full mt-auto flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-emerald-600 text-white text-[13px] font-semibold cursor-pointer shadow-card hover:shadow-card-hover transition-all"
        >
          <CheckIcon className="w-4 h-4" />
          Đánh dấu đã giao
        </button>
      ) : null}
    </article>
  )
}
