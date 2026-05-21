import type { FoodOrderAnalytics, FoodOrderStats, FoodOrderStatus } from '../../../../api'
import { formatVnd } from '../../../../lib/currency'
import type { OrderFilter } from '../consts'
import { OrderAnalyticsCharts } from './OrderAnalyticsCharts'

interface StatsPanelProps {
  stats: FoodOrderStats
  analytics: FoodOrderAnalytics | null
  onOpenOrders: (filter: OrderFilter) => void
}

export function StatsPanel({ stats, analytics, onOpenOrders }: StatsPanelProps) {
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
    {
      label: 'Đã huỷ',
      value: stats.cancelled_orders,
      filter: 'CANCELLED',
      className: 'text-gray-700 bg-gray-100',
      barClassName: 'bg-gray-400',
    },
  ]

  const completionRate =
    stats.total_orders > 0 ? (stats.completed_orders / stats.total_orders) * 100 : 0
  const rejectionRate =
    stats.total_orders > 0
      ? ((stats.rejected_orders + stats.cancelled_orders) / stats.total_orders) * 100
      : 0
  const activeOrders = stats.pending_orders + stats.accepted_orders
  const avgOrderValue = stats.total_orders > 0 ? stats.total_revenue / stats.total_orders : 0
  const todayRevenueShare =
    stats.total_revenue > 0 ? Math.min(100, (stats.revenue_today / stats.total_revenue) * 100) : 0

  const kpis: {
    label: string
    value: string
    hint: string
    filter: OrderFilter
    accent: string
  }[] = [
    {
      label: 'Tổng đơn',
      value: String(stats.total_orders),
      hint: 'Mở tất cả đơn hàng',
      filter: 'all',
      accent: 'bg-stone-900 text-white',
    },
    {
      label: 'Đang xử lý',
      value: String(activeOrders),
      hint: `${stats.pending_orders} chờ, ${stats.accepted_orders} đã nhận`,
      filter: 'PENDING',
      accent: 'bg-amber-500 text-white',
    },
    {
      label: 'Đơn hôm nay',
      value: String(stats.orders_today),
      hint: 'Mở danh sách đơn mới nhất',
      filter: 'all',
      accent: 'bg-sky-600 text-white',
    },
    {
      label: 'Hoàn thành',
      value: String(stats.completed_orders),
      hint: `${completionRate.toFixed(0)}% tổng số đơn`,
      filter: 'COMPLETED',
      accent: 'bg-emerald-600 text-white',
    },
    {
      label: 'Doanh thu ghi nhận',
      value: formatVnd(stats.total_revenue),
      hint: 'Từ đơn đã chấp nhận / hoàn thành',
      filter: 'ACCEPTED',
      accent: 'bg-cyan-700 text-white',
    },
    {
      label: 'Giá trị TB',
      value: formatVnd(avgOrderValue),
      hint: 'Doanh thu / tổng số đơn',
      filter: 'all',
      accent: 'bg-rose-600 text-white',
    },
  ]

  const insightRows = [
    {
      label: 'Tỉ lệ hoàn thành',
      value: `${completionRate.toFixed(0)}%`,
      description: `${stats.completed_orders}/${stats.total_orders} đơn`,
      bar: completionRate,
      className: 'bg-emerald-500',
    },
    {
      label: 'Tỉ lệ từ chối / huỷ',
      value: `${rejectionRate.toFixed(0)}%`,
      description: `${stats.rejected_orders + stats.cancelled_orders} đơn không phục vụ`,
      bar: rejectionRate,
      className: 'bg-red-500',
    },
    {
      label: 'Doanh thu hôm nay',
      value: formatVnd(stats.revenue_today),
      description: `${todayRevenueShare.toFixed(0)}% tổng doanh thu`,
      bar: todayRevenueShare,
      className: 'bg-sky-500',
    },
  ]
  const maxStatus = Math.max(...statusRows.map((row) => row.value), 1)

  return (
    <div className="space-y-4">
      <OrderAnalyticsCharts analytics={analytics} />

      <section className="grid grid-cols-1 xl:grid-cols-[1.15fr_0.85fr] gap-4">
        <div className="relative overflow-hidden rounded-2xl bg-[#18201b] p-5 sm:p-6 text-white shadow-card">
          <div className="absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_top_right,rgba(125,211,252,0.22),transparent_55%)]" />
          <div className="relative">
            <p className="text-[12px] font-semibold uppercase tracking-wide text-white/65">
              Tổng quan order
            </p>
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-5 sm:items-end">
              <div>
                <p className="text-[13px] text-white/65">Đơn cần theo dõi</p>
                <h2 className="mt-1 text-4xl sm:text-5xl font-bold leading-none">{activeOrders}</h2>
                <p className="mt-3 max-w-xl text-[13px] leading-6 text-white/70">
                  {stats.pending_orders} đơn chờ xác nhận, {stats.accepted_orders} đơn đang chuẩn
                  bị. Doanh thu hôm nay: {formatVnd(stats.revenue_today)}.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:w-64">
                <button
                  type="button"
                  onClick={() => onOpenOrders('PENDING')}
                  className="rounded-xl bg-white text-[#18201b] px-3 py-3 text-left cursor-pointer hover:bg-sky-50 transition-colors"
                >
                  <span className="block text-[11px] font-semibold text-text-light">Chờ xử lý</span>
                  <span className="block text-2xl font-bold">{stats.pending_orders}</span>
                </button>
                <button
                  type="button"
                  onClick={() => onOpenOrders('ACCEPTED')}
                  className="rounded-xl bg-white/10 border border-white/15 px-3 py-3 text-left cursor-pointer hover:bg-white/15 transition-colors"
                >
                  <span className="block text-[11px] font-semibold text-white/65">Đã nhận</span>
                  <span className="block text-2xl font-bold">{stats.accepted_orders}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[12px] font-semibold uppercase tracking-wide text-text-light">
                Sức khoẻ vận hành
              </p>
              <p className="mt-1 text-sm text-text-muted">Tỉ lệ và xu hướng chính</p>
            </div>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-[12px] font-bold text-emerald-800">
              {completionRate.toFixed(0)}%
            </span>
          </div>
          <div className="mt-5 space-y-4">
            {insightRows.map((row) => (
              <div key={row.label}>
                <div className="flex items-baseline justify-between gap-3">
                  <div>
                    <p className="text-[13px] font-bold text-text">{row.label}</p>
                    <p className="text-[11.5px] text-text-light mt-0.5">{row.description}</p>
                  </div>
                  <span className="text-[13px] font-bold text-text">{row.value}</span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${row.className}`}
                    style={{ width: `${Math.min(100, row.bar)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {kpis.map((kpi) => (
          <button
            key={kpi.label}
            type="button"
            onClick={() => onOpenOrders(kpi.filter)}
            className="group rounded-2xl border border-border-light bg-white p-4 text-left shadow-soft hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-card cursor-pointer transition-all"
          >
            <span className={`inline-flex h-2.5 w-10 rounded-full ${kpi.accent}`} />
            <span className="mt-3 block text-[12px] font-semibold uppercase tracking-wide text-text-light">
              {kpi.label}
            </span>
            <span className="block text-2xl font-bold mt-1 break-words text-text">{kpi.value}</span>
            <span className="block text-[12px] text-text-muted mt-2">{kpi.hint}</span>
          </button>
        ))}
      </section>

      <section className="glass-card rounded-2xl p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-5">
          <div>
            <h3 className="text-[16px] font-bold text-text">Phân bổ trạng thái</h3>
            <p className="text-[12.5px] text-text-light mt-1">
              Bấm vào từng dòng để lọc nhanh lịch sử đơn hàng.
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
