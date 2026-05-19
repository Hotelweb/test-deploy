import { useCallback, useEffect, useState } from 'react'
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
import { ArrowLeftIcon, PlusIcon, TrashIcon } from '../components/icons/ServiceIcons'
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

        {tab === 'stats' && stats ? <StatsPanel stats={stats} /> : null}
        {tab === 'orders' ? (
          <OrdersPanel
            orders={filteredOrders}
            filter={orderFilter}
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

function StatsPanel({ stats }: { stats: FoodOrderStats }) {
  const cards = [
    { label: 'Tổng đơn', value: String(stats.total_orders) },
    { label: 'Chờ xử lý', value: String(stats.pending_orders) },
    { label: 'Đơn hôm nay', value: String(stats.orders_today) },
    { label: 'Doanh thu', value: formatVnd(stats.total_revenue) },
    { label: 'Doanh thu hôm nay', value: formatVnd(stats.revenue_today) },
    { label: 'Hoàn thành', value: String(stats.completed_orders) },
  ]
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
      {cards.map((c) => (
        <div key={c.label} className="glass-card rounded-2xl p-4">
          <p className="text-[12px] text-text-muted">{c.label}</p>
          <p className="text-xl font-bold text-text mt-1">{c.value}</p>
        </div>
      ))}
    </div>
  )
}

function OrdersPanel({
  orders,
  filter,
  onFilterChange,
  onAction,
}: {
  orders: FoodOrder[]
  filter: FoodOrderStatus | 'all'
  onFilterChange: (f: FoodOrderStatus | 'all') => void
  onAction: (o: FoodOrder, s: FoodOrderStatus) => void
}) {
  const filters: { key: FoodOrderStatus | 'all'; label: string }[] = [
    { key: 'all', label: 'Tất cả' },
    { key: 'PENDING', label: 'Chờ' },
    { key: 'ACCEPTED', label: 'Chấp nhận' },
    { key: 'COMPLETED', label: 'Xong' },
    { key: 'REJECTED', label: 'Từ chối' },
  ]
  return (
    <div>
      <div className="flex gap-2 flex-wrap mb-4">
        {filters.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => onFilterChange(f.key)}
            className={`px-3 py-1.5 rounded-lg text-[12px] font-medium cursor-pointer ${
              filter === f.key ? 'bg-primary text-white' : 'bg-white border border-border'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>
      {orders.length === 0 ? (
        <p className="text-center text-text-muted py-12 text-sm">Chưa có đơn hàng</p>
      ) : (
        <div className="space-y-3">
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
  return (
    <article className="glass-card rounded-2xl p-4">
      <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
        <div>
          <span className="font-bold text-text">#{order.id}</span>
          <span className="text-text-muted text-[13px] ml-2">Phòng {order.room_number || '—'}</span>
          {order.customer_name ? (
            <span className="text-text-muted text-[13px] ml-2">· {order.customer_name}</span>
          ) : null}
        </div>
        <span
          className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${STATUS_CLASS[order.status]}`}
        >
          {STATUS_LABEL[order.status]}
        </span>
      </div>
      <ul className="text-[13px] text-text-muted space-y-1 mb-3">
        {order.items.map((line) => (
          <li key={line.id}>
            {line.quantity}× {line.item_name} — {formatVnd(line.line_total)}
          </li>
        ))}
      </ul>
      {order.note ? (
        <p className="text-[12px] text-text-light mb-2 italic">Ghi chú: {order.note}</p>
      ) : null}
      {order.rejected_reason ? (
        <p className="text-[12px] text-red-600 mb-2">Lý do từ chối: {order.rejected_reason}</p>
      ) : null}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border-light">
        <span className="font-bold text-primary">{formatVnd(order.total_amount)}</span>
        <span className="text-[11px] text-text-lighter">
          {new Date(order.created_at).toLocaleString('vi-VN')}
        </span>
      </div>
      {order.status === 'PENDING' ? (
        <div className="flex gap-2 mt-3">
          <button
            type="button"
            onClick={() => onAction(order, 'ACCEPTED')}
            className="flex-1 py-2 rounded-xl bg-primary text-white text-[13px] font-semibold cursor-pointer"
          >
            Chấp nhận
          </button>
          <button
            type="button"
            onClick={() => onAction(order, 'REJECTED')}
            className="flex-1 py-2 rounded-xl bg-red-50 text-red-700 text-[13px] font-semibold cursor-pointer"
          >
            Từ chối
          </button>
        </div>
      ) : order.status === 'ACCEPTED' ? (
        <button
          type="button"
          onClick={() => onAction(order, 'COMPLETED')}
          className="w-full mt-3 py-2 rounded-xl bg-emerald-600 text-white text-[13px] font-semibold cursor-pointer"
        >
          Đánh dấu đã giao
        </button>
      ) : null}
    </article>
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
  return (
    <div>
      <div className="flex justify-end mb-4">
        <button
          type="button"
          onClick={onAdd}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-white gradient-primary text-[13px] font-semibold cursor-pointer"
        >
          <PlusIcon className="w-4 h-4" />
          Thêm món
        </button>
      </div>
      {items.length === 0 ? (
        <p className="text-center text-text-muted py-12">
          Chưa có món. Thêm món đồ ăn hoặc nước uống.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <article key={item.id} className="glass-card rounded-2xl overflow-hidden">
              <div className="h-32 bg-gray-100">
                {item.image_url ? (
                  <img src={item.image_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl">
                    {item.category === 'drink' ? '🥤' : '🍽️'}
                  </div>
                )}
              </div>
              <div className="p-3">
                <div className="flex justify-between gap-2">
                  <h3 className="font-semibold text-[14px] text-text">{item.name}</h3>
                  <span className="text-primary font-bold text-[13px]">
                    {formatVnd(item.price)}
                  </span>
                </div>
                <p className="text-[11px] text-text-light mt-1">
                  {item.category === 'drink' ? 'Nước uống' : 'Đồ ăn'}
                  {!item.is_available ? ' · Đã ẩn' : ''}
                </p>
                <div className="flex gap-2 mt-3">
                  <button
                    type="button"
                    onClick={() => onEdit(item)}
                    className="flex-1 py-1.5 rounded-lg text-[12px] font-medium bg-indigo-50 text-indigo-700 cursor-pointer"
                  >
                    Sửa
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(item)}
                    className="px-2 py-1.5 rounded-lg text-red-600 hover:bg-red-50 cursor-pointer"
                    aria-label="Xoá"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
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
