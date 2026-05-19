import { useEffect, useRef, useState } from 'react'
import { updateHotel, type Hotel, type UpdateHotelInput } from '../api'
import { CloseIcon } from './icons/ServiceIcons'
import { GalleryUploader } from './GalleryUploader'
import { ImageUploader } from './ImageUploader'

interface EditHotelModalProps {
  open: boolean
  hotel: Hotel | null
  onClose: () => void
  onSaved: (hotel: Hotel) => void
}

interface FormState {
  name: string
  phone: string
  email: string
  address: string
  description: string
  logo_url: string | null
  banner_url: string | null
  gallery: string[]
}

const blankForm: FormState = {
  name: '',
  phone: '',
  email: '',
  address: '',
  description: '',
  logo_url: null,
  banner_url: null,
  gallery: [],
}

/**
 * Edit-hotel modal with full image management.
 *
 * Logo and banner use single-image `ImageUploader` tiles; the gallery uses
 * `GalleryUploader` for the multi-photo intro grid. Both write Cloudinary
 * URLs straight into form state, so when the admin clicks "Lưu" the PATCH
 * payload contains finished hosted URLs — no upload-on-submit dance needed.
 */
export function EditHotelModal({ open, hotel, onClose, onSaved }: EditHotelModalProps) {
  const [form, setForm] = useState<FormState>(blankForm)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const firstInputRef = useRef<HTMLInputElement>(null)

  // Hydrate the form whenever a different hotel is opened.
  useEffect(() => {
    if (!open || !hotel) return
    let cancelled = false
    void Promise.resolve().then(() => {
      if (cancelled) return
      setForm({
        name: hotel.name,
        phone: hotel.phone ?? '',
        email: hotel.email ?? '',
        address: hotel.address ?? '',
        description: hotel.description ?? '',
        logo_url: hotel.logo_url,
        banner_url: hotel.banner_url,
        gallery: hotel.gallery ?? [],
      })
      setError(null)
      setSubmitting(false)
    })
    const t = window.setTimeout(() => firstInputRef.current?.focus(), 50)
    return () => {
      cancelled = true
      window.clearTimeout(t)
    }
  }, [open, hotel])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !submitting) onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, submitting, onClose])

  if (!open || !hotel) return null

  const updateField =
    (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) {
      setError('Vui lòng nhập tên cơ sở')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const payload: UpdateHotelInput = {
        name: form.name.trim(),
        phone: form.phone.trim() || undefined,
        email: form.email.trim() || undefined,
        address: form.address.trim() || undefined,
        description: form.description.trim() || undefined,
        logo_url: form.logo_url ?? '',
        banner_url: form.banner_url ?? '',
        gallery: form.gallery,
      }
      const saved = await updateHotel(hotel.id, payload)
      onSaved(saved)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không lưu được cơ sở'
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-hotel-title"
      onClick={() => !submitting && onClose()}
    >
      <div
        className="w-full max-w-3xl bg-white rounded-3xl shadow-modal max-h-[92vh] flex flex-col animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-border-light flex items-center justify-between flex-shrink-0">
          <div className="min-w-0">
            <h2
              id="edit-hotel-title"
              className="text-lg font-bold text-text truncate"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              Chỉnh sửa cơ sở
            </h2>
            <p className="text-[12.5px] text-text-light mt-0.5 truncate">/{hotel.slug}</p>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            className="w-9 h-9 rounded-xl text-text-muted hover:bg-gray-100 flex items-center justify-center cursor-pointer disabled:opacity-50 transition-colors flex-shrink-0"
            aria-label="Đóng"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto px-6 py-5 space-y-6 min-h-0"
        >
          {error ? (
            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-[13px] text-red-700">
              {error}
            </div>
          ) : null}

          {/* Basic info */}
          <section className="space-y-3">
            <h3 className="text-[12px] font-semibold uppercase tracking-wide text-text-light">
              Thông tin cơ sở
            </h3>
            <Field label="Tên cơ sở" required>
              <input
                ref={firstInputRef}
                type="text"
                value={form.name}
                onChange={updateField('name')}
                className={inputClass}
                required
              />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Số điện thoại">
                <input
                  type="text"
                  value={form.phone}
                  onChange={updateField('phone')}
                  className={inputClass}
                />
              </Field>
              <Field label="Email cơ sở">
                <input
                  type="email"
                  value={form.email}
                  onChange={updateField('email')}
                  className={inputClass}
                />
              </Field>
            </div>
            <Field label="Địa chỉ">
              <input
                type="text"
                value={form.address}
                onChange={updateField('address')}
                className={inputClass}
              />
            </Field>
            <Field label="Giới thiệu">
              <textarea
                rows={3}
                value={form.description}
                onChange={updateField('description')}
                placeholder="Khách sạn 5 sao, dịch vụ cao cấp…"
                className={`${inputClass} resize-y`}
              />
            </Field>
          </section>

          {/* Branding images */}
          <section className="space-y-3">
            <h3 className="text-[12px] font-semibold uppercase tracking-wide text-text-light">
              Hình ảnh thương hiệu
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-1">
                <span className="block text-[12.5px] font-medium text-text-muted mb-1.5">Logo</span>
                <ImageUploader
                  value={form.logo_url}
                  onChange={(next) => setForm((p) => ({ ...p, logo_url: next }))}
                  folder="hotels"
                  aspect="square"
                  ariaLabel="Tải logo cơ sở"
                  hint="Hiển thị ở header và danh sách"
                />
              </div>
              <div className="sm:col-span-2">
                <span className="block text-[12.5px] font-medium text-text-muted mb-1.5">
                  Ảnh bìa (banner)
                </span>
                <ImageUploader
                  value={form.banner_url}
                  onChange={(next) => setForm((p) => ({ ...p, banner_url: next }))}
                  folder="hotels"
                  aspect="wide"
                  ariaLabel="Tải ảnh bìa"
                  hint="Hiển thị ở đầu trang khách (tỉ lệ 16:9)"
                />
              </div>
            </div>
          </section>

          {/* Gallery */}
          <section className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-[12px] font-semibold uppercase tracking-wide text-text-light">
                Ảnh giới thiệu
              </h3>
              <span className="text-[11.5px] text-text-light">{form.gallery.length} / 12 ảnh</span>
            </div>
            <GalleryUploader
              value={form.gallery}
              onChange={(next) => setForm((p) => ({ ...p, gallery: next }))}
              folder="hotels"
              max={12}
              hint="Kéo thả để sắp xếp lại thứ tự — ảnh đầu tiên hiển thị nổi bật nhất"
            />
          </section>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border-light flex items-center justify-end gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2.5 rounded-xl text-[13.5px] font-medium text-text-muted hover:bg-gray-100 disabled:opacity-50 cursor-pointer transition-colors"
          >
            Huỷ
          </button>
          <button
            type="submit"
            disabled={submitting || !form.name.trim()}
            onClick={handleSubmit}
            className="px-5 py-2.5 rounded-xl text-[13.5px] font-semibold text-white gradient-primary shadow-card hover:shadow-card-hover disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all"
          >
            {submitting ? 'Đang lưu…' : 'Lưu thay đổi'}
          </button>
        </div>
      </div>
    </div>
  )
}

const inputClass =
  'w-full px-3.5 py-2.5 rounded-xl bg-gray-50 text-[14px] focus:outline-none focus:ring-2 focus:ring-primary/30 focus:bg-white border border-border-light focus:border-primary/40 transition-all placeholder:text-text-lighter'

function Field({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="block text-[12.5px] font-medium text-text-muted mb-1.5">
        {label}
        {required ? <span className="text-red-500"> *</span> : null}
      </span>
      {children}
    </label>
  )
}
