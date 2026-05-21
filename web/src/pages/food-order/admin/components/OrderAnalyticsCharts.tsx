import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
  type ChartOptions,
} from 'chart.js'
import { Bar, Doughnut, Line } from 'react-chartjs-2'
import type React from 'react'
import type { FoodOrderAnalytics } from '../../../../api'
import { formatVnd } from '../../../../lib/currency'

ChartJS.register(
  ArcElement,
  BarElement,
  CategoryScale,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
)

interface OrderAnalyticsChartsProps {
  analytics: FoodOrderAnalytics | null
}

const CHART_COLORS = {
  green: '#2f6f4f',
  ink: '#18201b',
  amber: '#f59e0b',
  sky: '#0284c7',
  rose: '#e11d48',
  gray: '#94a3b8',
}

export function OrderAnalyticsCharts({ analytics }: OrderAnalyticsChartsProps) {
  if (!analytics) {
    return (
      <section className="glass-card rounded-2xl p-6 text-center">
        <div className="mx-auto h-10 w-10 rounded-full border-3 border-primary border-t-transparent animate-spin" />
        <p className="mt-3 text-[13px] text-text-light">Đang tải biểu đồ đơn hàng</p>
      </section>
    )
  }

  const hasData =
    analytics.top_items_by_quantity.length > 0 ||
    analytics.top_items_by_revenue.length > 0 ||
    analytics.orders_by_hour.some((row) => row.order_count > 0)

  if (!hasData) {
    return (
      <section className="glass-card rounded-2xl p-6 text-center">
        <p className="font-bold text-text">Chưa đủ dữ liệu để vẽ biểu đồ</p>
        <p className="mt-1 text-[13px] text-text-light">
          Khi có đơn hàng, hệ thống sẽ hiển thị món bán chạy, doanh thu và khung giờ cao điểm.
        </p>
      </section>
    )
  }

  const quantityLabels = analytics.top_items_by_quantity.map((item) => item.item_name)
  const revenueLabels = analytics.top_items_by_revenue.map((item) => item.item_name)
  const hourlyLabels = analytics.orders_by_hour.map((row) => `${row.hour}:00`)
  const categoryLabels = analytics.category_breakdown.map((row) =>
    row.category === 'drink' ? 'Đồ uống' : 'Món ăn',
  )

  const barOptions: ChartOptions<'bar'> = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => `${Number(context.parsed.x ?? 0).toLocaleString('vi-VN')} lượt`,
        },
      },
    },
    scales: {
      x: { beginAtZero: true, grid: { color: '#eef2f1' }, ticks: { precision: 0 } },
      y: { grid: { display: false } },
    },
  }

  const revenueOptions: ChartOptions<'bar'> = {
    ...barOptions,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => formatVnd(Number(context.parsed.x ?? 0)),
        },
      },
    },
  }

  const lineOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { intersect: false, mode: 'index' },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => `${Number(context.parsed.y ?? 0).toLocaleString('vi-VN')} đơn`,
        },
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { maxTicksLimit: 8 } },
      y: { beginAtZero: true, grid: { color: '#eef2f1' }, ticks: { precision: 0 } },
    },
  }

  const doughnutOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '68%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: { boxWidth: 10, boxHeight: 10, usePointStyle: true },
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const value = Number(context.raw ?? 0)
            return `${context.label}: ${value.toLocaleString('vi-VN')} món`
          },
        },
      },
    },
  }

  const peakHourLabel = analytics.peak_hour
    ? `${analytics.peak_hour.hour}:00 - ${analytics.peak_hour.hour + 1}:00`
    : 'Chưa có'

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="text-[18px] font-bold text-text">Phân tích món & thời điểm đặt</h3>
          <p className="mt-1 text-[13px] text-text-light">
            Dữ liệu được backend tổng hợp sẵn, dùng Chart.js để admin xem xu hướng nhanh.
          </p>
        </div>
        <div className="rounded-2xl bg-[#18201b] px-4 py-3 text-white shadow-soft">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-white/60">
            Giờ cao điểm
          </p>
          <p className="mt-1 text-[15px] font-bold">{peakHourLabel}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <ChartCard title="Món được đặt nhiều nhất" hint="Theo tổng số lượng món">
          <Bar
            options={barOptions}
            data={{
              labels: quantityLabels,
              datasets: [
                {
                  data: analytics.top_items_by_quantity.map((item) => item.quantity),
                  backgroundColor: CHART_COLORS.green,
                  borderRadius: 8,
                  barThickness: 18,
                },
              ],
            }}
          />
        </ChartCard>

        <ChartCard title="Món tạo doanh thu cao nhất" hint="Tính trên đơn đã nhận / hoàn thành">
          <Bar
            options={revenueOptions}
            data={{
              labels: revenueLabels,
              datasets: [
                {
                  data: analytics.top_items_by_revenue.map((item) => item.total_revenue),
                  backgroundColor: CHART_COLORS.sky,
                  borderRadius: 8,
                  barThickness: 18,
                },
              ],
            }}
          />
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.3fr_0.7fr] gap-4">
        <ChartCard title="Khung giờ hay đặt nhất" hint="Số đơn theo giờ, múi giờ Việt Nam">
          <Line
            options={lineOptions}
            data={{
              labels: hourlyLabels,
              datasets: [
                {
                  data: analytics.orders_by_hour.map((row) => row.order_count),
                  borderColor: CHART_COLORS.ink,
                  backgroundColor: 'rgba(47, 111, 79, 0.14)',
                  borderWidth: 2,
                  pointRadius: 2,
                  pointHoverRadius: 5,
                  fill: true,
                  tension: 0.35,
                },
              ],
            }}
          />
        </ChartCard>

        <ChartCard title="Cơ cấu món" hint="Food / drink theo số lượng">
          <Doughnut
            options={doughnutOptions}
            data={{
              labels: categoryLabels,
              datasets: [
                {
                  data: analytics.category_breakdown.map((row) => row.quantity),
                  backgroundColor: [CHART_COLORS.green, CHART_COLORS.amber, CHART_COLORS.gray],
                  borderColor: '#ffffff',
                  borderWidth: 4,
                },
              ],
            }}
          />
        </ChartCard>
      </div>
    </section>
  )
}

function ChartCard({
  title,
  hint,
  children,
}: {
  title: string
  hint: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border border-border-light bg-white p-4 shadow-soft">
      <div className="mb-4">
        <h4 className="text-[15px] font-bold text-text">{title}</h4>
        <p className="mt-1 text-[12px] text-text-light">{hint}</p>
      </div>
      <div className="h-72">{children}</div>
    </div>
  )
}
