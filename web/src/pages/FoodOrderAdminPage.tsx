import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  createMenuItem,
  deleteMenuItem,
  getAdminFoodOrders,
  getAdminMenu,
  getFoodOrderStats,
  getHotel,
  getPendingOrderCount,
  updateFoodOrderStatus,
  updateMenuItem,
  type FoodOrder,
  type FoodOrderStats,
  type FoodOrderStatus,
  type Hotel,
  type MenuCategory,
  type MenuItem,
} from '../api'
import { ImageUploader } from '../components/ImageUploader'
import { UserMenu } from '../components/UserMenu'
import {
  ArrowLeftIcon,
  CheckIcon,
  EditIcon,
  ImagePlaceholderIcon,
  InRoomDiningIcon,
  PlusIcon,
  TagIcon,
  TrashIcon,
} from '../components/icons/ServiceIcons'
import { formatVnd } from '../lib/currency'
import { playNotificationSound } from '../lib/notifications'

type Tab = 'stats' | 'orders' | 'menu'

const STATUS_LABEL: Record<FoodOrderStatus, string> = {
  PENDING: 'Chờ xử lý',
  ACCEPTED: 'Đã chấp nhận',
  REJECTED: 'Đã từ chối',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã huỷ',
}

const STATUS_CLASS: Record<FoodOrderStatus, string> = {
  PENDING: 'bg-amber-50 text-amber-800',
  ACCEPTED: 'bg-blue-50 text-blue-800',
  REJECTED: 'bg-red-50 text-red-800',
  COMPLETED: 'bg-emerald-50 text-emerald-800',
  CANCELLED: 'bg-gray-100 text-gray-600',
}

export function FoodOrderAdminPage() {
  const { hotelId: hotelIdParam } = useParams<{ hotelId: string }>()
  const hotelId = Number(hotelIdParam)
  const navigate = useNavigate()

  const [hotel, setHotel] = useState<Hotel | null>(null)
  const [tab, setTab] = useState<Tab>('orders')
  const [stats, setStats] = useState<FoodOrderStats | null>(null)
  const [orders, setOrders] = useState<FoodOrder[]>([])
  const [menu, setMenu] = useState<MenuItem[]>([])
  const [pendingCount, setPendingCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [orderFilter, setOrderFilter] = useState<FoodOrderStatus | 'all'>('all')
  const [menuModal, setMenuModal] = useState<
    { mode: 'create' } | { mode: 'edit'; item: MenuItem } | null
  >(null)

  const orderCounts = useMemo(
    () => ({
      all: orders.length,
      PENDING: orders.filter((order) => order.status === 'PENDING').length,
      ACCEPTED: orders.filter((order) => order.status === 'ACCEPTED').length,
      COMPLETED: orders.filter((order) => order.status === 'COMPLETED').length,
      REJECTED: orders.filter((order) => order.status === 'REJECTED').length,
      CANCELLED: orders.filter((order) => order.status === 'CANCELLED').length,
    }),
    [orders],
  )

  const loadAll = useCallback(async () => {
    if (!hotelId) return
    try {
      const [h, s, o, m, p] = await Promise.all([
        getHotel(hotelId),
        getFoodOrderStats(hotelId),
        getAdminFoodOrders(hotelId),
        getAdminMenu(hotelId),
        getPendingOrderCount(hotelId),
      ])
      setHotel(h)
      setStats(s)
      setOrders(o)
      setMenu(m)
      setPendingCount(p)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [hotelId])

  useEffect(() => {
    let cancelled = false
    void Promise.resolve().then(() => {
      if (!cancelled) void loadAll()
    })
    const id = window.setInterval(() => {
      void (async () => {
        try {
          const [o, p, s] = await Promise.all([
            getAdminFoodOrders(hotelId),
            getPendingOrderCount(hotelId),
            getFoodOrderStats(hotelId),
          ])
          setPendingCount((prev) => {
            if (p > prev && prev > 0) playNotificationSound()
            return p
          })
          setOrders(o)
          setStats(s)
        } catch {
          // ignore poll errors
        }
      })()
    }, 15000)
    return () => {
      cancelled = true
      window.clearInterval(id)
    }
  }, [hotelId, loadAll])

  const filteredOrders =
    orderFilter === 'all' ? orders : orders.filter((o) => o.status === orderFilter)

  const handleOrderAction = async (order: FoodOrder, status: FoodOrderStatus) => {
    let rejected_reason: string | undefined
    if (status === 'REJECTED') {
      const reason = window.prompt('Lý do từ chối đơn hàng:')
      if (!reason?.trim()) return
      rejected_reason = reason.trim()
    }
    try {
      const updated = await updateFoodOrderStatus(order.id, { status, rejected_reason })
      setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)))
      const s = await getFoodOrderStats(hotelId)
      setStats(s)
      const p = await getPendingOrderCount(hotelId)
      setPendingCount(p)
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Không cập nhật được')
    }
  }

  const handleDeleteMenu = async (item: MenuItem) => {
    if (!window.confirm(`Xoá món "${item.name}"?`)) return
    try {
      await deleteMenuItem(item.id)
      setMenu((prev) => prev.filter((m) => m.id !== item.id))
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Không xoá được')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background-warm flex items-center justify-center">
        <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background-warm">
      <header className="glass-nav sticky top-0 z-30 px-4 sm:px-8 py-5">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => navigate(`/admin/${hotelId}`)}
              className="w-9 h-9 rounded-xl text-text-muted hover:bg-gray-100 flex items-center justify-center cursor-pointer"
              aria-label="Quay lại"
            >
              <ArrowLeftIcon className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-text truncate">Đặt đồ ăn & nước uống</h1>
              <p className="text-[12px] text-text-light truncate">{hotel?.name}</p>
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

      <main className="px-4 sm:px-8 py-6 max-w-6xl mx-auto">
        <div className="flex gap-2 flex-wrap mb-6">
          {(
            [
              ['stats', 'Thống kê'],
              ['orders', 'Đơn hàng'],
              ['menu', 'Thực đơn'],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`px-4 py-2 rounded-xl text-[13px] font-medium cursor-pointer ${
                tab === key
                  ? 'bg-primary text-white'
                  : 'bg-white border border-border text-text-muted'
              }`}
            >
              {label}
              {key === 'orders' && pendingCount > 0 ? ` (${pendingCount})` : ''}
            </button>
          ))}
        </div>

        {tab === 'stats' && stats ? (
          <StatsPanel
            stats={stats}
            onOpenOrders={(filter) => {
              setOrderFilter(filter)
              setTab('orders')
            }}
          />
        ) : null}
        {tab === 'orders' ? (
          <OrdersPanel
            orders={filteredOrders}
            filter={orderFilter}
            counts={orderCounts}
            onFilterChange={setOrderFilter}
            onAction={handleOrderAction}
          />
        ) : null}
        {tab === 'menu' ? (
          <MenuPanel
            items={menu}
            onAdd={() => setMenuModal({ mode: 'create' })}
            onEdit={(item) => setMenuModal({ mode: 'edit', item })}
            onDelete={handleDeleteMenu}
          />
        ) : null}
      </main>

      {menuModal ? (
        <MenuItemModal
          hotelId={hotelId}
          mode={menuModal.mode}
          item={menuModal.mode === 'edit' ? menuModal.item : null}
          onClose={() => setMenuModal(null)}
          onSaved={(saved) => {
            setMenu((prev) => {
              const idx = prev.findIndex((m) => m.id === saved.id)
              if (idx >= 0) {
                const next = [...prev]
                next[idx] = saved
                return next
              }
              return [...prev, saved]
            })
            setMenuModal(null)
          }}
        />
      ) : null}
    </div>
  )
}

function StatsPanel({
  stats,
  onOpenOrders,
}: {
  stats: FoodOrderStats
  onOpenOrders: (filter: FoodOrderStatus | 'all') => void
}) {
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
    filter: FoodOrderStatus | 'all'
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

function OrdersPanel({
  orders,
  filter,
  counts,
  onFilterChange,
  onAction,
}: {
  orders: FoodOrder[]
  filter: FoodOrderStatus | 'all'
  counts: Record<FoodOrderStatus | 'all', number>
  onFilterChange: (f: FoodOrderStatus | 'all') => void
  onAction: (o: FoodOrder, s: FoodOrderStatus) => void
}) {
  const filters: { key: FoodOrderStatus | 'all'; label: string; tone: string }[] = [
    { key: 'all', label: 'Tất cả', tone: 'bg-gray-100 text-text' },
    { key: 'PENDING', label: 'Chờ xử lý', tone: 'bg-amber-50 text-amber-800' },
    { key: 'ACCEPTED', label: 'Đã nhận', tone: 'bg-blue-50 text-blue-800' },
    { key: 'COMPLETED', label: 'Đã giao', tone: 'bg-emerald-50 text-emerald-800' },
    { key: 'REJECTED', label: 'Từ chối', tone: 'bg-red-50 text-red-800' },
    { key: 'CANCELLED', label: 'Đã huỷ', tone: 'bg-gray-100 text-gray-600' },
  ]
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
            {filters.map((f) => {
              const active = filter === f.key
              return (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => onFilterChange(f.key)}
                  className={`min-h-14 rounded-xl px-3 py-2 text-left cursor-pointer border transition-all ${
                    active
                      ? 'border-primary bg-primary text-white shadow-card'
                      : 'border-border-light bg-white hover:border-primary/30'
                  }`}
                >
                  <span className="block text-[11px] font-semibold opacity-80">{f.label}</span>
                  <span
                    className={`inline-flex mt-1 min-w-6 h-6 px-1.5 rounded-full text-[12px] font-bold items-center justify-center ${
                      active ? 'bg-white/20 text-white' : f.tone
                    }`}
                  >
                    {counts[f.key]}
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

function OrderCard({
  order,
  onAction,
}: {
  order: FoodOrder
  onAction: (o: FoodOrder, s: FoodOrderStatus) => void
}) {
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

function InfoPill({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="rounded-xl bg-white border border-border-light px-3 py-2 min-w-0">
      <p className="text-[10.5px] font-semibold uppercase tracking-wide text-text-light">{label}</p>
      <p
        className={`text-[13px] truncate mt-0.5 ${strong ? 'font-bold text-primary' : 'font-semibold text-text'}`}
      >
        {value}
      </p>
    </div>
  )
}

function MenuPanel({
  items,
  onAdd,
  onEdit,
  onDelete,
}: {
  items: MenuItem[]
  onAdd: () => void
  onEdit: (item: MenuItem) => void
  onDelete: (item: MenuItem) => void
}) {
  const foodItems = items.filter((item) => item.category === 'food')
  const drinkItems = items.filter((item) => item.category === 'drink')
  const hiddenItems = items.filter((item) => !item.is_available).length

  return (
    <div className="space-y-5">
      <section className="glass-card rounded-2xl p-4 sm:p-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-text">Thực đơn</h2>
            <p className="text-[12.5px] text-text-light mt-1">
              Quản lý món đang bán, giá hiển thị và ảnh minh hoạ cho khách đặt.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <MenuMetric label="Tổng món" value={items.length} />
            <MenuMetric label="Đồ ăn" value={foodItems.length} />
            <MenuMetric label="Nước uống" value={drinkItems.length} />
            <MenuMetric label="Đang ẩn" value={hiddenItems} muted />
            <button
              type="button"
              onClick={onAdd}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-white gradient-primary text-[13px] font-semibold cursor-pointer shadow-card hover:shadow-card-hover transition-all"
            >
              <PlusIcon className="w-4 h-4" />
              Thêm món
            </button>
          </div>
        </div>
      </section>

      {items.length === 0 ? (
        <div className="glass-card rounded-2xl text-center py-16 px-6">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-50 text-primary flex items-center justify-center">
            <InRoomDiningIcon className="w-7 h-7" />
          </div>
          <p className="text-text font-semibold mt-4">Chưa có món trong thực đơn</p>
          <p className="text-text-light text-[13px] mt-1">
            Thêm món đồ ăn hoặc nước uống đầu tiên để khách có thể đặt.
          </p>
          <button
            type="button"
            onClick={onAdd}
            className="inline-flex items-center gap-1.5 mt-5 px-4 py-2.5 rounded-xl text-white gradient-primary text-[13px] font-semibold cursor-pointer"
          >
            <PlusIcon className="w-4 h-4" />
            Thêm món
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          <MenuSection title="Đồ ăn" items={foodItems} onEdit={onEdit} onDelete={onDelete} />
          <MenuSection title="Nước uống" items={drinkItems} onEdit={onEdit} onDelete={onDelete} />
        </div>
      )}
    </div>
  )
}

function MenuMetric({ label, value, muted }: { label: string; value: number; muted?: boolean }) {
  return (
    <div className="rounded-xl bg-white border border-border-light px-3 py-2 min-w-20">
      <p className="text-[10.5px] font-semibold uppercase tracking-wide text-text-light">{label}</p>
      <p className={`text-lg font-bold mt-0.5 ${muted ? 'text-text-muted' : 'text-text'}`}>
        {value}
      </p>
    </div>
  )
}

function MenuSection({
  title,
  items,
  onEdit,
  onDelete,
}: {
  title: string
  items: MenuItem[]
  onEdit: (item: MenuItem) => void
  onDelete: (item: MenuItem) => void
}) {
  if (items.length === 0) return null
  return (
    <section>
      <div className="flex items-center justify-between gap-3 mb-3">
        <h3 className="text-[14px] font-bold text-text">{title}</h3>
        <span className="text-[12px] font-semibold text-text-light bg-white border border-border-light rounded-full px-2.5 py-1">
          {items.length} món
        </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {items.map((item) => (
          <MenuCard key={item.id} item={item} onEdit={onEdit} onDelete={onDelete} />
        ))}
      </div>
    </section>
  )
}

function MenuCard({
  item,
  onEdit,
  onDelete,
}: {
  item: MenuItem
  onEdit: (item: MenuItem) => void
  onDelete: (item: MenuItem) => void
}) {
  return (
    <article className="glass-card glass-card-hover rounded-2xl overflow-hidden flex flex-col">
      <div className="relative aspect-[4/3] bg-gray-100">
        {item.image_url ? (
          <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-text-lighter">
            <ImagePlaceholderIcon className="w-10 h-10" />
          </div>
        )}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-white/95 text-[11px] font-semibold text-text shadow-soft">
            <TagIcon className="w-3 h-3" />
            {item.category === 'drink' ? 'Nước uống' : 'Đồ ăn'}
          </span>
          {!item.is_available ? (
            <span className="inline-flex px-2 py-1 rounded-full bg-gray-900/80 text-white text-[11px] font-semibold">
              Đang ẩn
            </span>
          ) : null}
        </div>
      </div>
      <div className="p-4 flex flex-col gap-3 flex-1">
        <div className="min-w-0">
          <h3 className="font-bold text-[15px] text-text line-clamp-1">{item.name}</h3>
          {item.name_en ? (
            <p className="text-[12px] text-text-light mt-0.5 line-clamp-1">{item.name_en}</p>
          ) : null}
          {item.description ? (
            <p className="text-[12.5px] text-text-muted leading-relaxed mt-2 line-clamp-2">
              {item.description}
            </p>
          ) : null}
        </div>

        <div className="flex items-center justify-between gap-3 mt-auto pt-3 border-t border-border-light">
          <div>
            <p className="text-[10.5px] font-semibold uppercase tracking-wide text-text-light">
              Giá
            </p>
            <p className="text-[15px] font-bold text-primary">{formatVnd(item.price)}</p>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onEdit(item)}
              className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 flex items-center justify-center cursor-pointer transition-colors"
              aria-label={`Sửa món ${item.name}`}
            >
              <EditIcon className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onDelete(item)}
              className="w-9 h-9 rounded-xl text-red-600 hover:bg-red-50 flex items-center justify-center cursor-pointer transition-colors"
              aria-label={`Xoá món ${item.name}`}
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </article>
  )
}

function MenuItemModal({
  hotelId,
  mode,
  item,
  onClose,
  onSaved,
}: {
  hotelId: number
  mode: 'create' | 'edit'
  item: MenuItem | null
  onClose: () => void
  onSaved: (item: MenuItem) => void
}) {
  const [name, setName] = useState(item?.name ?? '')
  const [nameEn, setNameEn] = useState(item?.name_en ?? '')
  const [description, setDescription] = useState(item?.description ?? '')
  const [price, setPrice] = useState(item?.price ?? 0)
  const [category, setCategory] = useState<MenuCategory>(item?.category ?? 'food')
  const [imageUrl, setImageUrl] = useState(item?.image_url ?? '')
  const [isAvailable, setIsAvailable] = useState(item?.is_available ?? true)
  const [sortOrder, setSortOrder] = useState(item?.sort_order ?? 0)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setSubmitting(true)
    try {
      const payload = {
        name: name.trim(),
        name_en: nameEn.trim() || undefined,
        description: description.trim() || undefined,
        price: Number(price),
        category,
        image_url: imageUrl || undefined,
        is_available: isAvailable,
        sort_order: sortOrder,
      }
      const saved =
        mode === 'edit' && item
          ? await updateMenuItem(item.id, payload)
          : await createMenuItem({ hotel_id: hotelId, ...payload })
      onSaved(saved)
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Lỗi lưu món')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-label="Close"
      />
      <form
        onSubmit={handleSubmit}
        className="relative bg-white rounded-2xl shadow-elevated w-full max-w-md max-h-[90vh] overflow-y-auto p-5 space-y-3"
      >
        <h2 className="font-bold text-lg text-text">
          {mode === 'create' ? 'Thêm món' : 'Sửa món'}
        </h2>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as MenuCategory)}
          className="w-full px-3 py-2 rounded-xl border border-border text-[14px]"
        >
          <option value="food">Đồ ăn</option>
          <option value="drink">Nước uống</option>
        </select>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Tên món (Tiếng Việt) *"
          className="w-full px-3 py-2 rounded-xl border border-border text-[14px]"
          required
        />
        <input
          value={nameEn}
          onChange={(e) => setNameEn(e.target.value)}
          placeholder="Tên tiếng Anh"
          className="w-full px-3 py-2 rounded-xl border border-border text-[14px]"
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Mô tả"
          rows={2}
          className="w-full px-3 py-2 rounded-xl border border-border text-[14px] resize-none"
        />
        <input
          type="number"
          min={0}
          value={price}
          onChange={(e) => setPrice(Number(e.target.value))}
          placeholder="Giá (VNĐ)"
          className="w-full px-3 py-2 rounded-xl border border-border text-[14px]"
          required
        />
        <ImageUploader
          value={imageUrl}
          onChange={(next) => setImageUrl(next ?? '')}
          folder="menu"
          ariaLabel="Ảnh món"
          hint="Ảnh món ăn / nước uống"
        />
        <label className="flex items-center gap-2 text-[13px]">
          <input
            type="checkbox"
            checked={isAvailable}
            onChange={(e) => setIsAvailable(e.target.checked)}
          />
          Hiển thị cho khách
        </label>
        <input
          type="number"
          value={sortOrder}
          onChange={(e) => setSortOrder(Number(e.target.value))}
          placeholder="Thứ tự"
          className="w-full px-3 py-2 rounded-xl border border-border text-[14px]"
        />
        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-border text-[14px] cursor-pointer"
          >
            Huỷ
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 py-2.5 rounded-xl text-white gradient-primary font-semibold text-[14px] disabled:opacity-60 cursor-pointer"
          >
            {submitting ? 'Đang lưu…' : 'Lưu'}
          </button>
        </div>
      </form>
    </div>
  )
}
