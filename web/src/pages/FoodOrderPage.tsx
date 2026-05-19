import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  createFoodOrder,
  getHotelBySlug,
  getPublicMenu,
  type Hotel,
  type MenuCategory,
  type MenuItem,
} from '../api'
import { TopHeader } from '../components/TopHeader'
import { formatVnd } from '../lib/currency'

type CartLine = { item: MenuItem; quantity: number }

export function FoodOrderPage() {
  const { slug, serviceId } = useParams<{ slug: string; serviceId: string }>()
  const [hotel, setHotel] = useState<Hotel | null>(null)
  const [menu, setMenu] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lang, setLang] = useState<'VN' | 'EN'>('VN')
  const [category, setCategory] = useState<MenuCategory | 'all'>('all')
  const [cart, setCart] = useState<CartLine[]>([])
  const [cartOpen, setCartOpen] = useState(false)
  const [roomNumber, setRoomNumber] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [orderSuccess, setOrderSuccess] = useState<number | null>(null)

  const apiLang = lang === 'VN' ? 'vi' : 'en'

  useEffect(() => {
    if (!slug) return
    let cancelled = false

    async function load() {
      try {
        setLoading(true)
        const h = await getHotelBySlug(slug!)
        const items = await getPublicMenu(h.id, apiLang)
        if (!cancelled) {
          setHotel(h)
          setMenu(items)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Không tải được menu')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [slug, apiLang])

  const filtered = useMemo(() => {
    if (category === 'all') return menu
    return menu.filter((m) => m.category === category)
  }, [menu, category])

  const cartTotal = useMemo(
    () => cart.reduce((sum, line) => sum + line.item.price * line.quantity, 0),
    [cart],
  )

  const cartCount = useMemo(() => cart.reduce((sum, line) => sum + line.quantity, 0), [cart])

  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const idx = prev.findIndex((l) => l.item.id === item.id)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = { ...next[idx], quantity: next[idx].quantity + 1 }
        return next
      }
      return [...prev, { item, quantity: 1 }]
    })
  }

  const updateQty = (itemId: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((l) =>
          l.item.id === itemId ? { ...l, quantity: Math.max(0, l.quantity + delta) } : l,
        )
        .filter((l) => l.quantity > 0),
    )
  }

  const handleSubmit = async () => {
    if (!hotel || cart.length === 0) return
    if (!roomNumber.trim()) {
      window.alert(lang === 'VN' ? 'Vui lòng nhập số phòng' : 'Please enter your room number')
      return
    }
    setSubmitting(true)
    try {
      const order = await createFoodOrder({
        hotel_id: hotel.id,
        service_id: serviceId ? Number(serviceId) : undefined,
        room_number: roomNumber.trim(),
        customer_name: customerName.trim() || undefined,
        customer_phone: customerPhone.trim() || undefined,
        note: note.trim() || undefined,
        items: cart.map((l) => ({ menu_item_id: l.item.id, quantity: l.quantity })),
      })
      setOrderSuccess(order.id)
      setCart([])
      setCartOpen(false)
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Không gửi được đơn')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background-warm flex items-center justify-center">
        <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error || !hotel) {
    return (
      <div className="min-h-screen bg-background-warm flex items-center justify-center px-6">
        <div className="text-center">
          <p className="text-text font-semibold">{error || 'Không tìm thấy khách sạn'}</p>
          <Link to="/" className="mt-4 inline-block text-primary text-sm font-medium">
            {lang === 'VN' ? 'Về trang chủ' : 'Back home'}
          </Link>
        </div>
      </div>
    )
  }

  if (orderSuccess) {
    return (
      <div className="min-h-screen bg-background-warm">
        <TopHeader
          greeting={lang === 'VN' ? 'Đặt hàng thành công!' : 'Order placed!'}
          subtitle={hotel.name}
          lang={lang}
          onLangChange={setLang}
        />
        <main className="px-4 sm:px-8 py-12 max-w-lg mx-auto text-center">
          <SuccessCard orderId={orderSuccess} lang={lang} slug={hotel.slug} />
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background-warm pb-28">
      <TopHeader
        greeting={lang === 'VN' ? 'Đặt món' : 'Order food & drinks'}
        subtitle={hotel.name}
        lang={lang}
        onLangChange={setLang}
      />

      <main className="px-4 sm:px-8 lg:px-16 xl:px-20 py-6 max-w-3xl mx-auto">
        <Link
          to={`/hotel/${hotel.slug}`}
          className="inline-flex items-center gap-1 text-[13px] text-text-muted hover:text-primary mb-4"
        >
          ← {lang === 'VN' ? 'Quay lại dịch vụ' : 'Back to services'}
        </Link>

        <CategoryTabs category={category} setCategory={setCategory} lang={lang} />

        {filtered.length === 0 ? (
          <div className="glass-card rounded-2xl p-8 text-center text-text-muted text-sm mt-4">
            {lang === 'VN' ? 'Chưa có món trong danh mục này' : 'No items in this category'}
          </div>
        ) : (
          <div className="flex flex-col gap-3 mt-4">
            {filtered.map((item) => (
              <MenuItemCard key={item.id} item={item} lang={lang} onAdd={() => addToCart(item)} />
            ))}
          </div>
        )}
      </main>

      {cartCount > 0 ? (
        <div className="fixed bottom-0 inset-x-0 z-40 px-4 pb-4 sm:pb-6 pointer-events-none">
          <div className="max-w-3xl mx-auto pointer-events-auto">
            <button
              type="button"
              onClick={() => setCartOpen(true)}
              className="w-full flex items-center justify-between px-5 py-3.5 rounded-2xl text-white gradient-primary shadow-elevated cursor-pointer"
            >
              <span className="font-semibold text-[14px]">
                {lang === 'VN' ? 'Giỏ hàng' : 'Cart'} ({cartCount})
              </span>
              <span className="font-bold text-[15px]">{formatVnd(cartTotal)}</span>
            </button>
          </div>
        </div>
      ) : null}

      {cartOpen ? (
        <CartDrawer
          cart={cart}
          lang={lang}
          roomNumber={roomNumber}
          customerName={customerName}
          customerPhone={customerPhone}
          note={note}
          submitting={submitting}
          cartTotal={cartTotal}
          onClose={() => setCartOpen(false)}
          onUpdateQty={updateQty}
          onRoomChange={setRoomNumber}
          onNameChange={setCustomerName}
          onPhoneChange={setCustomerPhone}
          onNoteChange={setNote}
          onSubmit={handleSubmit}
        />
      ) : null}
    </div>
  )
}

function CategoryTabs({
  category,
  setCategory,
  lang,
}: {
  category: MenuCategory | 'all'
  setCategory: (c: MenuCategory | 'all') => void
  lang: 'VN' | 'EN'
}) {
  const tabs: { key: MenuCategory | 'all'; label: string }[] = [
    { key: 'all', label: lang === 'VN' ? 'Tất cả' : 'All' },
    { key: 'food', label: lang === 'VN' ? 'Đồ ăn' : 'Food' },
    { key: 'drink', label: lang === 'VN' ? 'Nước uống' : 'Drinks' },
  ]
  return (
    <div className="flex gap-2 flex-wrap">
      {tabs.map((t) => (
        <button
          key={t.key}
          type="button"
          onClick={() => setCategory(t.key)}
          className={`px-4 py-2 rounded-xl text-[13px] font-medium transition-colors cursor-pointer ${
            category === t.key
              ? 'bg-primary text-white shadow-card'
              : 'bg-white text-text-muted border border-border hover:bg-gray-50'
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}

function MenuItemCard({
  item,
  lang,
  onAdd,
}: {
  item: MenuItem
  lang: 'VN' | 'EN'
  onAdd: () => void
}) {
  return (
    <article className="glass-card rounded-2xl overflow-hidden flex gap-0 sm:gap-0">
      <div className="w-24 sm:w-28 flex-shrink-0 bg-gray-100">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.name}
            className="w-full h-full min-h-[88px] object-cover"
          />
        ) : (
          <div className="w-full h-full min-h-[88px] flex items-center justify-center text-2xl">
            {item.category === 'drink' ? '🥤' : '🍽️'}
          </div>
        )}
      </div>
      <div className="flex-1 p-3 sm:p-4 flex flex-col justify-between min-w-0">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-text text-[15px] leading-tight">{item.name}</h3>
            <span className="text-primary font-bold text-[14px] flex-shrink-0">
              {formatVnd(item.price)}
            </span>
          </div>
          {item.description ? (
            <p className="text-[12px] text-text-muted mt-1 line-clamp-2">{item.description}</p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={onAdd}
          className="mt-2 self-start px-3 py-1.5 rounded-lg text-[12px] font-semibold text-white gradient-primary cursor-pointer"
        >
          + {lang === 'VN' ? 'Thêm' : 'Add'}
        </button>
      </div>
    </article>
  )
}

function CartDrawer({
  cart,
  lang,
  roomNumber,
  customerName,
  customerPhone,
  note,
  submitting,
  cartTotal,
  onClose,
  onUpdateQty,
  onRoomChange,
  onNameChange,
  onPhoneChange,
  onNoteChange,
  onSubmit,
}: {
  cart: CartLine[]
  lang: 'VN' | 'EN'
  roomNumber: string
  customerName: string
  customerPhone: string
  note: string
  submitting: boolean
  cartTotal: number
  onClose: () => void
  onUpdateQty: (id: number, delta: number) => void
  onRoomChange: (v: string) => void
  onNameChange: (v: string) => void
  onPhoneChange: (v: string) => void
  onNoteChange: (v: string) => void
  onSubmit: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <button
        type="button"
        className="absolute inset-0 bg-black/40 cursor-pointer"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-t-3xl shadow-elevated max-h-[90vh] flex flex-col">
        <div className="px-5 py-4 border-b border-border-light flex items-center justify-between">
          <h2 className="font-bold text-text text-lg">
            {lang === 'VN' ? 'Giỏ hàng' : 'Your cart'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-text-muted text-sm cursor-pointer"
          >
            {lang === 'VN' ? 'Đóng' : 'Close'}
          </button>
        </div>
        <div className="overflow-y-auto flex-1 px-5 py-3 space-y-3">
          {cart.map((line) => (
            <div key={line.item.id} className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-text text-[14px] truncate">{line.item.name}</p>
                <p className="text-[12px] text-text-muted">{formatVnd(line.item.price)}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onUpdateQty(line.item.id, -1)}
                  className="w-8 h-8 rounded-lg border border-border text-text cursor-pointer"
                >
                  −
                </button>
                <span className="w-6 text-center font-semibold text-sm">{line.quantity}</span>
                <button
                  type="button"
                  onClick={() => onUpdateQty(line.item.id, 1)}
                  className="w-8 h-8 rounded-lg border border-border text-text cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>
          ))}
          <div className="pt-2 space-y-2 border-t border-border-light">
            <input
              value={roomNumber}
              onChange={(e) => onRoomChange(e.target.value)}
              placeholder={lang === 'VN' ? 'Số phòng *' : 'Room number *'}
              className="w-full px-3 py-2.5 rounded-xl border border-border text-[14px] focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <input
              value={customerName}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder={lang === 'VN' ? 'Tên khách' : 'Your name'}
              className="w-full px-3 py-2.5 rounded-xl border border-border text-[14px] focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <input
              value={customerPhone}
              onChange={(e) => onPhoneChange(e.target.value)}
              placeholder={lang === 'VN' ? 'Số điện thoại' : 'Phone'}
              className="w-full px-3 py-2.5 rounded-xl border border-border text-[14px] focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <textarea
              value={note}
              onChange={(e) => onNoteChange(e.target.value)}
              placeholder={lang === 'VN' ? 'Ghi chú (không cay, ít đá…)' : 'Notes'}
              rows={2}
              className="w-full px-3 py-2.5 rounded-xl border border-border text-[14px] focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
            />
          </div>
        </div>
        <div className="px-5 py-4 border-t border-border-light">
          <div className="flex justify-between mb-3 font-bold text-text">
            <span>{lang === 'VN' ? 'Tổng cộng' : 'Total'}</span>
            <span className="text-primary">{formatVnd(cartTotal)}</span>
          </div>
          <button
            type="button"
            disabled={submitting}
            onClick={onSubmit}
            className="w-full py-3 rounded-xl text-white font-semibold gradient-primary disabled:opacity-60 cursor-pointer"
          >
            {submitting
              ? lang === 'VN'
                ? 'Đang gửi…'
                : 'Submitting…'
              : lang === 'VN'
                ? 'Đặt hàng'
                : 'Place order'}
          </button>
        </div>
      </div>
    </div>
  )
}

function SuccessCard({
  orderId,
  lang,
  slug,
}: {
  orderId: number
  lang: 'VN' | 'EN'
  slug: string
}) {
  return (
    <div className="glass-card rounded-3xl p-8">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-100 flex items-center justify-center text-3xl">
        ✓
      </div>
      <h2 className="text-xl font-bold text-text mb-2">
        {lang === 'VN' ? 'Đơn đã gửi!' : 'Order submitted!'}
      </h2>
      <p className="text-text-muted text-[14px] mb-1">
        {lang === 'VN' ? 'Mã đơn hàng' : 'Order ID'}: <strong>#{orderId}</strong>
      </p>
      <p className="text-text-muted text-[13px] mb-6">
        {lang === 'VN'
          ? 'Nhân viên sẽ xác nhận và giao món đến phòng của quý khách.'
          : 'Our team will confirm and deliver to your room.'}
      </p>
      <Link
        to={`/hotel/${slug}`}
        className="inline-block px-5 py-2.5 rounded-xl text-white font-semibold gradient-primary"
      >
        {lang === 'VN' ? 'Về trang dịch vụ' : 'Back to services'}
      </Link>
    </div>
  )
}
