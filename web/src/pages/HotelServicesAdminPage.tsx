import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  deleteService,
  getHotel,
  getHotelServicesAdmin,
  type AdminHotelService,
  type Hotel,
} from '../api'
import { ServiceFormModal } from '../components/ServiceFormModal'
import { ServiceDetailModal } from '../components/ServiceDetailModal'
import { UserMenu } from '../components/UserMenu'
import { getIconEntry, isIconUrl } from '../lib/serviceCatalog'
import {
  ArrowLeftIcon,
  EditIcon,
  EyeIcon,
  ImagePlaceholderIcon,
  PlusIcon,
  SearchIcon,
  TrashIcon,
} from '../components/icons/ServiceIcons'

type ModalState =
  | { kind: 'closed' }
  | { kind: 'create' }
  | { kind: 'edit'; service: AdminHotelService }
  | { kind: 'preview'; service: AdminHotelService }

/**
 * Admin screen for managing the list of services attached to a hotel.
 *
 * - System admins land here from the root admin dashboard.
 * - Hotel admins reach it from their hotel dashboard.
 *
 * Permissions are enforced at the route level (`<RequireAuth>`) and again on
 * the backend, so this page only worries about UX: list / search / sort,
 * open the form modal, soft-delete with confirmation.
 */
export function HotelServicesAdminPage() {
  const { hotelId: hotelIdParam } = useParams<{ hotelId: string }>()
  const hotelId = Number(hotelIdParam)
  const navigate = useNavigate()

  const [hotel, setHotel] = useState<Hotel | null>(null)
  const [services, setServices] = useState<AdminHotelService[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState<ModalState>({ kind: 'closed' })
  const [deletingId, setDeletingId] = useState<number | null>(null)

  // -------------------------------------------------------------------------
  // Data loading
  // -------------------------------------------------------------------------
  const loadAll = useCallback(async () => {
    if (!hotelId) return
    setLoading(true)
    setError(null)
    try {
      const [h, list] = await Promise.all([getHotel(hotelId), getHotelServicesAdmin(hotelId)])
      setHotel(h)
      setServices(list)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không tải được danh sách dịch vụ'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [hotelId])

  // Defer through a microtask so React 19 doesn't flag the synchronous
  // setState inside the effect body.
  useEffect(() => {
    let cancelled = false
    void Promise.resolve().then(() => {
      if (!cancelled) void loadAll()
    })
    return () => {
      cancelled = true
    }
  }, [loadAll])

  // -------------------------------------------------------------------------
  // Filtering — search across all translations so admins can find a service
  // by its English title even if the active tab is Vietnamese.
  // -------------------------------------------------------------------------
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return services
    return services.filter((s) => {
      const inTranslations = s.translations.some(
        (t) => t.title.toLowerCase().includes(q) || (t.description ?? '').toLowerCase().includes(q),
      )
      const inMain = s.title.toLowerCase().includes(q)
      return inTranslations || inMain
    })
  }, [services, search])

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------
  const handleSaved = (saved: AdminHotelService) => {
    setServices((prev) => {
      const idx = prev.findIndex((s) => s.id === saved.id)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = saved
        return next.sort(compareServices)
      }
      return [...prev, saved].sort(compareServices)
    })
    setModal({ kind: 'closed' })
  }

  const handleDelete = async (service: AdminHotelService) => {
    const ok = window.confirm(
      `Xoá dịch vụ "${service.title || `#${service.id}`}"?\n\n` +
        `Dịch vụ sẽ được đánh dấu đã xoá và ẩn khỏi trang khách.`,
    )
    if (!ok) return

    setDeletingId(service.id)
    try {
      await deleteService(service.id)
      setServices((prev) => prev.filter((s) => s.id !== service.id))
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không xoá được dịch vụ'
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
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => navigate(`/admin/${hotelId}`)}
              className="w-9 h-9 rounded-xl text-text-muted hover:bg-gray-100 flex items-center justify-center cursor-pointer transition-colors flex-shrink-0"
              aria-label="Quay lại"
            >
              <ArrowLeftIcon className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <h1
                className="text-xl sm:text-2xl font-bold text-text tracking-tight truncate"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                Quản lý dịch vụ
              </h1>
              <p className="text-[12.5px] text-text-light mt-0.5 truncate">
                {hotel ? hotel.name : 'Đang tải...'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setModal({ kind: 'create' })}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13.5px] font-semibold text-white gradient-primary shadow-card hover:shadow-card-hover cursor-pointer transition-all"
            >
              <PlusIcon className="w-4 h-4" />
              Thêm dịch vụ
            </button>
            <UserMenu size="sm" />
          </div>
        </div>
      </header>

      <main className="px-4 sm:px-8 lg:px-16 xl:px-20 py-8 sm:py-10">
        <div className="max-w-6xl mx-auto flex flex-col gap-6">
          {/* Stats + search */}
          <div className="flex flex-wrap items-center gap-3 justify-between">
            <div className="flex items-center gap-2 text-[13.5px] text-text-muted">
              <span>
                <strong className="text-text font-semibold">{services.length}</strong> dịch vụ
              </span>
              <span className="text-text-lighter">·</span>
              <span>
                <strong className="text-text font-semibold">
                  {services.filter((s) => s.is_active).length}
                </strong>{' '}
                đang hiển thị
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
                placeholder="Tìm theo tên hoặc nội dung…"
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
            <EmptyState
              hasSearch={Boolean(search.trim())}
              onAdd={() => setModal({ kind: 'create' })}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((service) => (
                <ServiceAdminCard
                  key={service.id}
                  service={service}
                  hotelId={hotelId}
                  deleting={deletingId === service.id}
                  onPreview={() => setModal({ kind: 'preview', service })}
                  onEdit={() => setModal({ kind: 'edit', service })}
                  onDelete={() => handleDelete(service)}
                  onManageOrders={() => navigate(`/admin/${hotelId}/food-order`)}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Modals */}
      <ServiceFormModal
        open={modal.kind === 'create' || modal.kind === 'edit'}
        mode={modal.kind === 'edit' ? 'edit' : 'create'}
        hotelId={hotelId}
        service={modal.kind === 'edit' ? modal.service : null}
        onClose={() => setModal({ kind: 'closed' })}
        onSaved={handleSaved}
      />

      <ServiceDetailModal
        open={modal.kind === 'preview'}
        service={modal.kind === 'preview' ? modal.service : null}
        language={modal.kind === 'preview' ? modal.service.language : undefined}
        onClose={() => setModal({ kind: 'closed' })}
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function compareServices(a: AdminHotelService, b: AdminHotelService) {
  const so = (a.sort_order ?? 0) - (b.sort_order ?? 0)
  if (so !== 0) return so
  return a.id - b.id
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface ServiceAdminCardProps {
  service: AdminHotelService
  hotelId: number
  deleting: boolean
  onPreview: () => void
  onEdit: () => void
  onDelete: () => void
  onManageOrders: () => void
}

function ServiceAdminCard({
  service,
  deleting,
  onPreview,
  onEdit,
  onDelete,
  onManageOrders,
}: ServiceAdminCardProps) {
  const languages = service.translations.map((t) => t.language).join(', ')
  const iconEntry = getIconEntry(service.icon_url)
  const legacyIconUrl = !iconEntry && isIconUrl(service.icon_url) ? service.icon_url : null

  return (
    <article
      className={`glass-card glass-card-hover rounded-2xl overflow-hidden flex flex-col ${
        service.is_active ? '' : 'opacity-60'
      }`}
    >
      {/* Image header */}
      <div className="relative w-full h-36 bg-gray-100 flex-shrink-0">
        {service.image_url ? (
          <img src={service.image_url} alt={service.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-text-lighter">
            <ImagePlaceholderIcon className="w-8 h-8" />
          </div>
        )}
        {!service.is_active ? (
          <span className="absolute top-2 left-2 inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-gray-900/80 text-white backdrop-blur">
            Đã ẩn
          </span>
        ) : null}
        {iconEntry ? (
          <span className="absolute top-2 right-2 w-9 h-9 rounded-xl bg-white/95 shadow-soft flex items-center justify-center text-text">
            <iconEntry.Icon className="w-4.5 h-4.5" />
          </span>
        ) : legacyIconUrl ? (
          <span className="absolute top-2 right-2 w-9 h-9 rounded-xl bg-white/95 shadow-soft flex items-center justify-center overflow-hidden">
            <img src={legacyIconUrl} alt="" className="w-full h-full object-cover" />
          </span>
        ) : null}
      </div>

      {/* Body */}
      <div className="px-4 py-3 flex-1 flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <h2 className="font-semibold text-text text-[15px] leading-tight line-clamp-2 flex-1">
            {service.title || <span className="italic text-text-light">Chưa có tiêu đề</span>}
          </h2>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-emerald-50 text-emerald-700 flex-shrink-0">
            #{service.sort_order ?? 0}
          </span>
        </div>
        <p className="text-[12px] text-text-light line-clamp-2 min-h-[2em]">
          {service.description ? stripMarkdown(service.description) : 'Chưa có mô tả'}
        </p>
        <div className="flex items-center gap-2 text-[11px] text-text-light flex-wrap">
          <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-gray-100 font-mono uppercase">
            {languages || '—'}
          </span>
          {service.service_type === 'food_order' ? (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-orange-50 text-orange-700 font-semibold">
              Đặt món
            </span>
          ) : null}
        </div>
      </div>

      {/* Actions */}
      <div className="px-3 py-2.5 border-t border-border-light flex items-center justify-between gap-1 flex-shrink-0 bg-gray-50/40 flex-wrap">
        {service.service_type === 'food_order' ? (
          <button
            onClick={onManageOrders}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[12px] font-medium text-orange-700 hover:bg-orange-50 cursor-pointer transition-colors"
          >
            Quản lý đơn
          </button>
        ) : (
          <button
            onClick={onPreview}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[12px] font-medium text-text-muted hover:bg-white cursor-pointer transition-colors"
          >
            <EyeIcon className="w-3.5 h-3.5" />
            Xem
          </button>
        )}
        <div className="flex items-center gap-1">
          <button
            onClick={onEdit}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[12px] font-medium text-indigo-700 hover:bg-indigo-50 cursor-pointer transition-colors"
          >
            <EditIcon className="w-3.5 h-3.5" />
            Sửa
          </button>
          <button
            onClick={onDelete}
            disabled={deleting}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[12px] font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
            aria-label={`Xoá dịch vụ ${service.title}`}
          >
            {deleting ? (
              <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <TrashIcon className="w-3.5 h-3.5" />
            )}
            Xoá
          </button>
        </div>
      </div>
    </article>
  )
}

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin mb-3" />
      <p className="text-text-muted text-sm">Đang tải dịch vụ…</p>
    </div>
  )
}

function EmptyState({ hasSearch, onAdd }: { hasSearch: boolean; onAdd: () => void }) {
  return (
    <div className="text-center py-20 px-6 glass-card rounded-3xl">
      <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-emerald-50 text-primary flex items-center justify-center">
        <ImagePlaceholderIcon className="w-8 h-8" />
      </div>
      <p className="text-text font-semibold text-[15px]">
        {hasSearch ? 'Không tìm thấy dịch vụ phù hợp' : 'Chưa có dịch vụ nào'}
      </p>
      <p className="text-text-light text-[13px] mt-1">
        {hasSearch
          ? 'Thử từ khoá khác hoặc xoá bộ lọc tìm kiếm'
          : 'Thêm dịch vụ đầu tiên — khách có thể click vào để xem mô tả Markdown'}
      </p>
      {!hasSearch ? (
        <button
          onClick={onAdd}
          className="inline-flex items-center gap-1.5 mt-5 px-4 py-2.5 rounded-xl text-[13.5px] font-semibold text-white gradient-primary shadow-card hover:shadow-card-hover cursor-pointer transition-all"
        >
          <PlusIcon className="w-4 h-4" />
          Thêm dịch vụ
        </button>
      ) : null}
    </div>
  )
}

/**
 * Quick preview of a markdown body — strip the most common syntax so a card
 * teaser doesn't show raw `##` or `**`. Not exhaustive, just enough for the
 * teaser line.
 */
function stripMarkdown(md: string): string {
  return md
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    .replace(/!\[[^\]]*\]\([^)]+\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^>\s?/gm, '')
    .replace(/^[-*+]\s+/gm, '')
    .replace(/^\d+\.\s+/gm, '')
    .replace(/\s+/g, ' ')
    .trim()
}
