import type { FoodOrderStats, FoodOrderStatus } from '../../../../api'
import { formatVnd } from '../../../../lib/currency'
import type { OrderFilter } from '../consts'

interface StatsPanelProps {
  stats: FoodOrderStats
  onOpenOrders: (filter: OrderFilter) => void
}

export function StatsPanel({ stats, onOpenOrders }: StatsPanelProps) {
  const statusRows: {
    label: string
    value: number
    filter: FoodOrderStatus
    className: string
    barClassName: string
  }[] = [
    {
      label: 'Chờ xử lý',
      value: stats.pending_orders,
      filter: 'PENDING',
      className: 'text-amber-800 bg-amber-50',
      barClassName: 'bg-amber-500',
    },
    {
      label: 'Đã chấp nhận',
      value: stats.accepted_orders,
      filter: 'ACCEPTED',
      className: 'text-blue-800 bg-blue-50',
      barClassName: 'bg-blue-500',
    },
    {
      label: 'Hoàn thành',
      value: stats.completed_orders,
      filter: 'COMPLETED',
      className: 'text-emerald-800 bg-emerald-50',
      barClassName: 'bg-emerald-500',
    },
    {
      label: 'Đã từ chối',
      value: stats.rejected_orders,
      filter: 'REJECTED',
      className: 'text-red-800 bg-red-50',
      barClassName: 'bg-red-500',
    },
  ]

  const kpis: {
    label: string
    value: string
    hint: string
    filter: OrderFilter
    tone: string
  }[] = [
    {
      label: 'Tổng đơn',
      value: String(stats.total_orders),
      hint: 'Mở tất cả đơn hàng',
      filter: 'all',
      tone: 'from-slate-900 to-slate-700 text-white',
    },
    {
      label: 'Chờ xử lý',
      value: String(stats.pending_orders),
      hint: 'Xem đơn cần xử lý',
      filter: 'PENDING',
      tone: 'from-amber-500 to-orange-500 text-white',
    },
    {
      label: 'Đơn hôm nay',
      value: String(stats.orders_today),
      hint: 'Mở danh sách đơn mới nhất',
      filter: 'all',
      tone: 'from-sky-500 to-blue-600 text-white',
    },
    {
      label: 'Hoàn thành',
      value: String(stats.completed_orders),
      hint: 'Xem đơn đã giao',
      filter: 'COMPLETED',
      tone: 'from-emerald-500 to-teal-600 text-white',
    },
    {
      label: 'Doanh thu',
      value: formatVnd(stats.total_revenue),
      hint: 'Từ đơn đã chấp nhận / hoàn thành',
      filter: 'ACCEPTED',
      tone: 'from-violet-600 to-indigo-600 text-white',
    },
    {
      label: 'Hôm nay',
      value: formatVnd(stats.revenue_today),
      hint: 'Doanh thu ghi nhận hôm nay',
      filter: 'all',
      tone: 'from-rose-500 to-pink-600 text-white',
    },
  ]
  const maxStatus = Math.max(...statusRows.map((row) => row.value), 1)
  const actionableOrders = stats.pending_orders + stats.accepted_orders

  return (
    <div className="space-y-5">
      <section className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-4">
        <div className="glass-card rounded-2xl p-5 sm:p-6">
          <p className="text-[12px] font-semibold uppercase tracking-wide text-primary">
            Tổng quan vận hành
          </p>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mt-2">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-text">
                {actionableOrders} mục đang cần theo dõi
              </h2>
              <p className="text-sm text-text-muted mt-2 max-w-xl">
                Bấm vào từng chỉ số để mở ngay danh sách đơn tương ứng.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onOpenOrders('PENDING')}
              className="px-4 py-2.5 rounded-xl bg-primary text-white text-[13px] font-semibold cursor-pointer shadow-card hover:shadow-card-hover transition-all"
            >
              Xử lý đơn chờ
            </button>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 sm:p-6">
          <p className="text-[12px] font-semibold uppercase tracking-wide text-text-light">
            Doanh thu hôm nay
          </p>
          <p className="text-3xl font-bold text-text mt-2">{formatVnd(stats.revenue_today)}</p>
          <div className="mt-4 h-2 rounded-full bg-gray-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-primary"
              style={{
                width: `${Math.min(
                  100,
                  stats.total_revenue > 0 ? (stats.revenue_today / stats.total_revenue) * 100 : 0,
                )}%`,
              }}
            />
          </div>
          <p className="text-[12px] text-text-light mt-2">
            Tổng doanh thu: {formatVnd(stats.total_revenue)}
          </p>
        </div>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {kpis.map((kpi) => (
          <button
            key={kpi.label}
            type="button"
            onClick={() => onOpenOrders(kpi.filter)}
            className={`rounded-2xl p-4 text-left bg-gradient-to-br ${kpi.tone} shadow-card hover:shadow-card-hover hover:-translate-y-0.5 cursor-pointer transition-all`}
          >
            <span className="block text-[12px] font-semibold opacity-80">{kpi.label}</span>
            <span className="block text-2xl font-bold mt-2 break-words">{kpi.value}</span>
            <span className="block text-[12px] opacity-80 mt-2">{kpi.hint}</span>
          </button>
        ))}
      </section>

      <section className="glass-card rounded-2xl p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-5">
          <div>
            <h3 className="text-[16px] font-bold text-text">Phân bổ trạng thái đơn</h3>
            <p className="text-[12.5px] text-text-light mt-1">
              Bấm vào từng dòng để lọc danh sách đơn hàng.
            </p>
          </div>
          <span className="text-[12px] font-semibold text-text-muted bg-gray-50 rounded-full px-3 py-1">
            {stats.total_orders} đơn
          </span>
        </div>

        <div className="space-y-3">
          {statusRows.map((row) => {
            const percent = stats.total_orders > 0 ? (row.value / stats.total_orders) * 100 : 0
            const width = (row.value / maxStatus) * 100
            return (
              <button
                key={row.filter}
                type="button"
                onClick={() => onOpenOrders(row.filter)}
                className="w-full grid grid-cols-[7.5rem_1fr_3.5rem] sm:grid-cols-[9rem_1fr_4.5rem] items-center gap-3 text-left rounded-xl hover:bg-gray-50 px-2 py-2 cursor-pointer transition-colors"
              >
                <span
                  className={`inline-flex w-fit max-w-full px-2.5 py-1 rounded-full text-[11.5px] font-semibold ${row.className}`}
                >
                  {row.label}
                </span>
                <span className="h-3 rounded-full bg-gray-100 overflow-hidden">
                  <span
                    className={`block h-full rounded-full ${row.barClassName}`}
                    style={{ width: `${width}%` }}
                  />
                </span>
                <span className="text-right">
                  <span className="block text-[13px] font-bold text-text">{row.value}</span>
                  <span className="block text-[10.5px] text-text-light">{percent.toFixed(0)}%</span>
                </span>
              </button>
            )
          })}
        </div>
      </section>
    </div>
  )
}
