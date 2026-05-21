import type { FoodOrder, FoodOrderStatus } from '../../../../api'
import { CheckIcon, InRoomDiningIcon } from '../../../../components/icons/ServiceIcons'
import { formatVnd } from '../../../../lib/currency'
import { STATUS_CLASS, STATUS_LABEL } from '../consts'
import { InfoPill } from './InfoPill'

interface OrderCardProps {
  order: FoodOrder
  onAction: (order: FoodOrder, status: FoodOrderStatus) => void
  onOpen: (order: FoodOrder) => void
}

export function OrderCard({ order, onAction, onOpen }: OrderCardProps) {
  const itemCount = order.items.reduce((sum, line) => sum + line.quantity, 0)
  const createdAt = new Date(order.created_at)
  const createdLabel = createdAt.toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  const itemSummary = order.items
    .slice(0, 3)
    .map((line) => `${line.quantity}x ${line.item_name}`)
    .join(', ')
  const remainingItems = Math.max(0, order.items.length - 3)

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={() => onOpen(order)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onOpen(order)
        }
      }}
      className="group rounded-2xl border border-border-light bg-white px-3 py-3 shadow-soft cursor-pointer transition-all hover:border-primary/25 hover:shadow-card focus:outline-none focus:ring-2 focus:ring-primary/30"
    >
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(13rem,0.85fr)_minmax(16rem,1.25fr)_8rem_8rem_auto] lg:items-center">
        <div className="flex min-w-0 items-start gap-3">
          <span className="inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-700">
            <InRoomDiningIcon className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-bold leading-tight text-text">#{order.id}</h3>
              <span
                className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${STATUS_CLASS[order.status]}`}
              >
                {STATUS_LABEL[order.status]}
              </span>
            </div>
            <p className="mt-1 truncate text-[12px] text-text-light">{createdLabel}</p>
          </div>
        </div>

        <div className="min-w-0">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:block">
            <div className="min-w-0">
              <p className="text-[10.5px] font-semibold uppercase tracking-wide text-text-light">
                Khách / phòng
              </p>
              <p className="mt-0.5 truncate text-[13px] font-bold text-text">
                {order.customer_name || 'Khách lẻ'}
                {order.room_number ? ` · P.${order.room_number}` : ''}
              </p>
            </div>
            <div className="min-w-0 lg:mt-1">
              <p className="truncate text-[12px] text-text-light">{order.customer_phone || '—'}</p>
            </div>
            <div className="col-span-2 min-w-0 sm:col-span-1 lg:mt-1">
              <p className="truncate text-[12px] text-text-muted">
                {itemSummary || 'Chưa có món'}
                {remainingItems > 0 ? `, +${remainingItems} món` : ''}
              </p>
            </div>
          </div>
        </div>

        <div>
          <p className="text-[10.5px] font-semibold uppercase tracking-wide text-text-light">
            Số món
          </p>
          <p className="mt-0.5 text-[13px] font-bold text-text">{itemCount} món</p>
        </div>

        <div>
          <p className="text-[10.5px] font-semibold uppercase tracking-wide text-text-light">
            Tổng tiền
          </p>
          <p className="mt-0.5 text-[14px] font-bold text-primary">
            {formatVnd(order.total_amount)}
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-start gap-2 lg:justify-end">
          {order.note ? (
            <span className="rounded-full bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-800">
              Ghi chú
            </span>
          ) : null}
          {order.rejected_reason ? (
            <span className="rounded-full bg-red-50 px-2 py-1 text-[11px] font-semibold text-red-700">
              Từ chối
            </span>
          ) : null}
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              onOpen(order)
            }}
            className="h-9 rounded-xl border border-border-light px-3 text-[12px] font-bold text-text-muted cursor-pointer hover:border-primary/30 hover:text-primary"
          >
            Chi tiết
          </button>
        </div>
      </div>

      {order.status === 'PENDING' || order.status === 'ACCEPTED' ? (
        <div className="mt-3 flex flex-col gap-2 border-t border-border-light pt-3 sm:flex-row lg:ml-[3.25rem]">
          {order.status === 'PENDING' ? (
            <>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation()
                  onAction(order, 'ACCEPTED')
                }}
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-primary px-3 text-[13px] font-semibold text-white shadow-card cursor-pointer hover:shadow-card-hover"
              >
                <CheckIcon className="h-4 w-4" />
                Chấp nhận
              </button>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation()
                  onAction(order, 'REJECTED')
                }}
                className="h-9 rounded-xl bg-red-50 px-3 text-[13px] font-semibold text-red-700 cursor-pointer hover:bg-red-100"
              >
                Từ chối
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation()
                onAction(order, 'COMPLETED')
              }}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3 text-[13px] font-semibold text-white shadow-card cursor-pointer hover:shadow-card-hover"
            >
              <CheckIcon className="h-4 w-4" />
              Đánh dấu đã giao
            </button>
          )}
        </div>
      ) : null}
    </article>
  )
}

interface OrderDetailModalProps {
  order: FoodOrder
  onClose: () => void
  onAction: (order: FoodOrder, status: FoodOrderStatus) => void
}

export function OrderDetailModal({ order, onClose, onAction }: OrderDetailModalProps) {
  const itemCount = order.items.reduce((sum, line) => sum + line.quantity, 0)
  const createdLabel = new Date(order.created_at).toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  const updatedLabel = new Date(order.updated_at).toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/35 p-0 sm:p-4">
      <div className="w-full sm:max-w-3xl max-h-[92vh] overflow-hidden rounded-t-2xl sm:rounded-2xl bg-white shadow-modal animate-slide-up">
        <header className="flex items-start justify-between gap-4 border-b border-border-light px-5 py-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold text-text">Đơn #{order.id}</h2>
              <span
                className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${STATUS_CLASS[order.status]}`}
              >
                {STATUS_LABEL[order.status]}
              </span>
            </div>
            <p className="mt-1 text-[12px] text-text-light">Tạo lúc {createdLabel}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-9 w-9 rounded-xl border border-border-light text-text-muted hover:bg-gray-50 cursor-pointer"
            aria-label="Đóng chi tiết đơn"
          >
            ×
          </button>
        </header>

        <div className="max-h-[calc(92vh-74px)] overflow-y-auto p-5 space-y-5">
          <section className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <InfoPill label="Phòng" value={order.room_number || '—'} />
            <InfoPill label="Khách" value={order.customer_name || 'Khách lẻ'} />
            <InfoPill label="Số điện thoại" value={order.customer_phone || '—'} />
            <InfoPill label="Mã dịch vụ" value={order.service_id ? `#${order.service_id}` : '—'} />
            <InfoPill label="Mã khách sạn" value={`#${order.hotel_id}`} />
            <InfoPill label="Số món" value={`${itemCount} món`} />
            <InfoPill label="Cập nhật" value={updatedLabel} />
            <InfoPill label="Tổng tiền" value={formatVnd(order.total_amount)} strong />
          </section>

          <section className="rounded-2xl border border-border-light overflow-hidden">
            <div className="bg-gray-50 px-4 py-3">
              <h3 className="text-[14px] font-bold text-text">Món đã đặt</h3>
            </div>
            <ul className="divide-y divide-border-light" role="list">
              {order.items.map((line) => (
                <li
                  key={line.id}
                  className="grid grid-cols-[1fr_auto] gap-3 px-4 py-3 sm:grid-cols-[1fr_6rem_7rem]"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-text truncate">{line.item_name}</p>
                    <p className="mt-0.5 text-[12px] text-text-light">
                      {line.category === 'drink' ? 'Đồ uống' : 'Món ăn'}
                      {line.menu_item_id ? ` · Món #${line.menu_item_id}` : ''}
                    </p>
                  </div>
                  <p className="text-right text-[13px] text-text-muted">
                    {line.quantity} x {formatVnd(line.unit_price)}
                  </p>
                  <p className="col-span-2 text-right text-[14px] font-bold text-text sm:col-span-1">
                    {formatVnd(line.line_total)}
                  </p>
                </li>
              ))}
            </ul>
          </section>

          {order.note ? (
            <section className="rounded-2xl bg-amber-50 px-4 py-3 text-[13px] text-amber-900">
              <span className="font-bold">Ghi chú: </span>
              {order.note}
            </section>
          ) : null}

          {order.rejected_reason ? (
            <section className="rounded-2xl bg-red-50 px-4 py-3 text-[13px] text-red-800">
              <span className="font-bold">Lý do từ chối: </span>
              {order.rejected_reason}
            </section>
          ) : null}

          {order.status === 'PENDING' || order.status === 'ACCEPTED' ? (
            <div className="flex flex-col sm:flex-row gap-2 border-t border-border-light pt-4">
              {order.status === 'PENDING' ? (
                <>
                  <button
                    type="button"
                    onClick={() => onAction(order, 'ACCEPTED')}
                    className="flex-1 rounded-xl bg-primary px-4 py-3 text-[13px] font-bold text-white shadow-card hover:shadow-card-hover cursor-pointer"
                  >
                    Chấp nhận đơn
                  </button>
                  <button
                    type="button"
                    onClick={() => onAction(order, 'REJECTED')}
                    className="flex-1 rounded-xl bg-red-50 px-4 py-3 text-[13px] font-bold text-red-700 hover:bg-red-100 cursor-pointer"
                  >
                    Từ chối đơn
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => onAction(order, 'COMPLETED')}
                  className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-[13px] font-bold text-white shadow-card hover:shadow-card-hover cursor-pointer"
                >
                  Đánh dấu đã giao
                </button>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
