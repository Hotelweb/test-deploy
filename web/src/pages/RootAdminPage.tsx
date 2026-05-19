import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { deleteHotel, getHotels, getHotelUsers } from '../api'
import type { CreateHotelResponse, Hotel, HotelUser } from '../api'
import { AddHotelModal } from '../components/AddHotelModal'
import { EditHotelModal } from '../components/EditHotelModal'
import { UserMenu } from '../components/UserMenu'
import {
  ChatIcon,
  CloseIcon,
  EditIcon,
  HotelIcon,
  PlusIcon,
  SearchIcon,
  ServicesIcon,
  UserCircleIcon,
} from '../components/icons/ServiceIcons'

interface NewHotelToast {
  id: number
  hotel: CreateHotelResponse['hotel']
  manager: CreateHotelResponse['manager']
  qrPageUrl: string
}

export function RootAdminPage() {
  const navigate = useNavigate()

  const [hotels, setHotels] = useState<Hotel[]>([])
  const [usersByHotel, setUsersByHotel] = useState<Record<number, HotelUser[]>>({})
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingHotel, setEditingHotel] = useState<Hotel | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [newToast, setNewToast] = useState<NewHotelToast | null>(null)

  // -------------------------------------------------------------------------
  // Data loading
  // -------------------------------------------------------------------------
  const loadHotels = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const list = await getHotels()
      setHotels(list)

      // Load users for each hotel in parallel; tolerate per-hotel failures.
      const entries = await Promise.all(
        list.map(async (h): Promise<[number, HotelUser[]]> => {
          try {
            const users = await getHotelUsers(h.id)
            return [h.id, users]
          } catch {
            return [h.id, []]
          }
        }),
      )
      const map: Record<number, HotelUser[]> = {}
      for (const [hotelId, users] of entries) map[hotelId] = users
      setUsersByHotel(map)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không tải được danh sách cơ sở'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [])

  // Initial load. We defer the call through a microtask so the synchronous
  // `setLoading(true)` inside loadHotels doesn't violate React 19's
  // no-setState-in-effect rule.
  useEffect(() => {
    let cancelled = false
    void Promise.resolve().then(() => {
      if (!cancelled) void loadHotels()
    })
    return () => {
      cancelled = true
    }
  }, [loadHotels])

  // -------------------------------------------------------------------------
  // Filtering
  // -------------------------------------------------------------------------
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return hotels
    return hotels.filter((h) => {
      const name = h.name.toLowerCase()
      const slug = h.slug.toLowerCase()
      const address = (h.address ?? '').toLowerCase()
      return name.includes(q) || slug.includes(q) || address.includes(q)
    })
  }, [hotels, search])

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------
  const handleCreated = (result: CreateHotelResponse) => {
    setShowAddModal(false)
    setNewToast({
      id: result.hotel.id,
      hotel: result.hotel,
      manager: result.manager,
      qrPageUrl: result.qr_page_url,
    })
    void loadHotels()
  }

  const handleDelete = async (hotel: Hotel) => {
    const ok = window.confirm(
      `Xoá cơ sở "${hotel.name}"?\n\nCơ sở sẽ được đánh dấu ngừng hoạt động và ẩn khỏi danh sách công khai. Lịch sử trò chuyện và dữ liệu liên quan vẫn được giữ lại.`,
    )
    if (!ok) return

    setDeletingId(hotel.id)
    try {
      await deleteHotel(hotel.id)
      setHotels((prev) => prev.filter((h) => h.id !== hotel.id))
      setUsersByHotel((prev) => {
        const next = { ...prev }
        delete next[hotel.id]
        return next
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không xoá được cơ sở'
      window.alert(message)
    } finally {
      setDeletingId(null)
    }
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-background-warm">
      {/* Header */}
      <header className="glass-nav sticky top-0 z-30 px-4 sm:px-8 lg:px-16 xl:px-20 py-5">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <h1
              className="text-2xl sm:text-3xl font-bold text-text tracking-tight"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              Bảng điều khiển hệ thống
            </h1>
            <p className="text-sm text-text-light mt-1">
              Quản lý các cơ sở khách sạn và quản trị viên
            </p>
          </div>
          <div className="flex items-center justify-end gap-2 flex-wrap">
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13.5px] font-semibold text-white gradient-primary shadow-card hover:shadow-card-hover cursor-pointer transition-all"
            >
              <PlusIcon className="w-4 h-4" />
              Thêm cơ sở
            </button>
            <UserMenu size="sm" subtitle="Quản trị hệ thống" />
          </div>
        </div>
      </header>

      <main className="px-4 sm:px-8 lg:px-16 xl:px-20 py-8 sm:py-10">
        <div className="max-w-6xl mx-auto flex flex-col gap-6">
          {/* Stats + search */}
          <div className="flex flex-wrap items-center gap-3 justify-between">
            <div className="flex items-center gap-2 text-[13.5px] text-text-muted">
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-50 text-primary">
                <HotelIcon className="w-4 h-4" />
              </span>
              <span>
                <strong className="text-text font-semibold">{hotels.length}</strong> cơ sở đang hoạt
                động
              </span>
            </div>
            <div className="relative w-full sm:w-80">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-lighter pointer-events-none">
                <SearchIcon className="w-4 h-4" />
              </span>
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm theo tên, slug, địa chỉ…"
                className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-white text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/30 focus:bg-white border border-border focus:border-primary/40 transition-all placeholder:text-text-lighter shadow-soft"
              />
            </div>
          </div>

          {/* Error */}
          {error ? (
            <div className="rounded-2xl bg-red-50 border border-red-200 px-4 py-3 text-[13px] text-red-700">
              {error}
            </div>
          ) : null}

          {/* List */}
          {loading ? (
            <LoadingState />
          ) : filtered.length === 0 ? (
            <EmptyState hasSearch={Boolean(search.trim())} onAdd={() => setShowAddModal(true)} />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filtered.map((hotel) => (
                <HotelAdminCard
                  key={hotel.id}
                  hotel={hotel}
                  users={usersByHotel[hotel.id] ?? []}
                  deleting={deletingId === hotel.id}
                  onEdit={() => setEditingHotel(hotel)}
                  onOpenPublic={() => navigate(`/hotel/${hotel.slug}`)}
                  onOpenDashboard={() => navigate(`/admin/${hotel.id}`)}
                  onOpenServices={() => navigate(`/admin/${hotel.id}/services`)}
                  onOpenUserDashboard={() => navigate(`/admin/${hotel.id}`)}
                  onDelete={() => handleDelete(hotel)}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Add hotel modal */}
      <AddHotelModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onCreated={handleCreated}
      />

      {/* Edit hotel modal — handles branding + intro gallery */}
      <EditHotelModal
        open={editingHotel !== null}
        hotel={editingHotel}
        onClose={() => setEditingHotel(null)}
        onSaved={(saved) => {
          setHotels((prev) => prev.map((h) => (h.id === saved.id ? saved : h)))
          setEditingHotel(null)
        }}
      />

      {/* Newly created hotel toast (shows manager credentials) */}
      {newToast ? <NewHotelToastCard toast={newToast} onClose={() => setNewToast(null)} /> : null}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface HotelAdminCardProps {
  hotel: Hotel
  users: HotelUser[]
  deleting: boolean
  onEdit: () => void
  onOpenPublic: () => void
  onOpenDashboard: () => void
  onOpenServices: () => void
  onOpenUserDashboard: (user: HotelUser) => void
  onDelete: () => void
}

function HotelAdminCard({
  hotel,
  users,
  deleting,
  onEdit,
  onOpenPublic,
  onOpenDashboard,
  onOpenServices,
  onOpenUserDashboard,
  onDelete,
}: HotelAdminCardProps) {
  const admins = users.filter((u) => u.is_active)

  return (
    <article className="glass-card glass-card-hover rounded-2xl p-5 flex flex-col gap-4">
      {/* Top: identity + delete */}
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-primary flex-shrink-0 overflow-hidden">
          {hotel.logo_url ? (
            <img src={hotel.logo_url} alt={hotel.name} className="w-full h-full object-cover" />
          ) : (
            <HotelIcon className="w-6 h-6" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-text text-[16px] leading-tight truncate">
            {hotel.name}
          </h2>
          <p className="text-[12.5px] text-text-light mt-0.5 truncate">/{hotel.slug}</p>
          {hotel.address ? (
            <p className="text-[12.5px] text-text-muted mt-1 line-clamp-1">{hotel.address}</p>
          ) : null}
        </div>
        <button
          onClick={onDelete}
          disabled={deleting}
          className="w-9 h-9 rounded-xl text-text-muted hover:bg-red-50 hover:text-red-600 flex items-center justify-center cursor-pointer disabled:opacity-50 transition-colors flex-shrink-0"
          aria-label={`Xoá cơ sở ${hotel.name}`}
          title="Xoá cơ sở"
        >
          {deleting ? (
            <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : (
            <TrashIcon className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Quick nav buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={onOpenDashboard}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[12.5px] font-medium text-white gradient-indigo shadow-card hover:shadow-card-hover cursor-pointer transition-all"
        >
          <ChatIcon className="w-4 h-4" />
          Mở dashboard
        </button>
        <button
          onClick={onOpenServices}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[12.5px] font-medium text-text bg-white border border-border hover:border-primary/40 hover:bg-emerald-50/50 cursor-pointer transition-all"
        >
          <ServicesIcon className="w-4 h-4" />
          Quản lý dịch vụ
        </button>
        <button
          onClick={onEdit}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[12.5px] font-medium text-text bg-white border border-border hover:border-primary/40 hover:bg-emerald-50/50 cursor-pointer transition-all"
        >
          <EditIcon className="w-4 h-4" />
          Chỉnh sửa
        </button>
        <button
          onClick={onOpenPublic}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[12.5px] font-medium text-text-muted bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors"
        >
          Trang công khai
        </button>
      </div>

      {/* Admins */}
      <div className="border-t border-border-light pt-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-[11.5px] font-semibold uppercase tracking-wide text-text-light">
            Quản trị viên ({admins.length})
          </h3>
        </div>
        {admins.length === 0 ? (
          <p className="text-[12.5px] text-text-light italic">Chưa có quản trị viên</p>
        ) : (
          <ul className="flex flex-col gap-1.5" role="list">
            {admins.map((user) => (
              <UserRow key={user.id} user={user} onClick={() => onOpenUserDashboard(user)} />
            ))}
          </ul>
        )}
      </div>
    </article>
  )
}

function UserRow({ user, onClick }: { user: HotelUser; onClick: () => void }) {
  return (
    <li>
      <button
        onClick={onClick}
        className="w-full flex items-center gap-3 px-3 py-2 rounded-xl bg-white hover:bg-indigo-50/50 border border-border-light hover:border-indigo-200 cursor-pointer transition-all text-left group"
      >
        <span className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
          {user.avatar_url ? (
            <img
              src={user.avatar_url}
              alt={user.full_name}
              className="w-full h-full object-cover rounded-full"
            />
          ) : (
            <UserCircleIcon className="w-5 h-5" />
          )}
        </span>
        <span className="flex-1 min-w-0">
          <span className="block text-[13px] font-medium text-text truncate">{user.full_name}</span>
          <span className="block text-[11.5px] text-text-light truncate">{user.email}</span>
        </span>
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-indigo-50 text-indigo-700 flex-shrink-0">
          Quản trị viên
        </span>
        <span className="text-[11.5px] font-medium text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          Mở →
        </span>
      </button>
    </li>
  )
}

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin mb-3" />
      <p className="text-text-muted text-sm">Đang tải danh sách cơ sở…</p>
    </div>
  )
}

function EmptyState({ hasSearch, onAdd }: { hasSearch: boolean; onAdd: () => void }) {
  return (
    <div className="text-center py-20 px-6 glass-card rounded-3xl">
      <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-emerald-50 text-primary flex items-center justify-center">
        <HotelIcon className="w-8 h-8" />
      </div>
      <p className="text-text font-semibold text-[15px]">
        {hasSearch ? 'Không tìm thấy cơ sở phù hợp' : 'Chưa có cơ sở nào'}
      </p>
      <p className="text-text-light text-[13px] mt-1">
        {hasSearch
          ? 'Thử dùng từ khoá khác hoặc xoá bộ lọc tìm kiếm'
          : 'Bắt đầu bằng cách thêm cơ sở khách sạn đầu tiên'}
      </p>
      {!hasSearch ? (
        <button
          onClick={onAdd}
          className="inline-flex items-center gap-1.5 mt-5 px-4 py-2.5 rounded-xl text-[13.5px] font-semibold text-white gradient-primary shadow-card hover:shadow-card-hover cursor-pointer transition-all"
        >
          <PlusIcon className="w-4 h-4" />
          Thêm cơ sở
        </button>
      ) : null}
    </div>
  )
}

function NewHotelToastCard({ toast, onClose }: { toast: NewHotelToast; onClose: () => void }) {
  return (
    <div className="fixed bottom-6 right-6 z-40 max-w-sm w-[calc(100%-3rem)] bg-white rounded-2xl shadow-modal border border-emerald-200 overflow-hidden animate-slide-up">
      <div className="px-4 py-3 bg-emerald-50 flex items-center justify-between">
        <p className="text-[13px] font-semibold text-emerald-800">Đã tạo cơ sở thành công</p>
        <button
          onClick={onClose}
          className="w-7 h-7 rounded-lg text-emerald-700 hover:bg-emerald-100 flex items-center justify-center cursor-pointer transition-colors"
          aria-label="Đóng"
        >
          <CloseIcon className="w-4 h-4" />
        </button>
      </div>
      <div className="px-4 py-3 space-y-2">
        <p className="text-[13.5px] font-semibold text-text">{toast.hotel.name}</p>
        <div className="text-[12.5px] text-text-muted space-y-1">
          <KeyValue label="Email quản trị" value={toast.manager.email} />
          {toast.manager.default_password ? (
            <KeyValue label="Mật khẩu mặc định" value={toast.manager.default_password} mono />
          ) : null}
          <KeyValue label="Trang công khai" value={toast.qrPageUrl} />
        </div>
        {toast.manager.default_password ? (
          <p className="text-[11.5px] text-amber-700 bg-amber-50 rounded-lg px-2.5 py-1.5">
            Lưu lại mật khẩu này — sẽ không hiển thị lại
          </p>
        ) : null}
      </div>
    </div>
  )
}

function KeyValue({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="text-text-light flex-shrink-0">{label}:</span>
      <span
        className={`text-text font-medium truncate ${mono ? 'font-mono text-[12px]' : ''}`}
        title={value}
      >
        {value}
      </span>
    </div>
  )
}

// Trash icon (kept local — not used elsewhere yet)
function TrashIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 6h18" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  )
}
