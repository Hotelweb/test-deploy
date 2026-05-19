import { useEffect, useRef, useState } from 'react'
import { createHotel } from '../api'
import type { CreateHotelInput, CreateHotelResponse } from '../api'
import { CloseIcon } from './icons/ServiceIcons'

interface AddHotelModalProps {
  open: boolean
  onClose: () => void
  onCreated: (result: CreateHotelResponse) => void
}

const initialForm: CreateHotelInput = {
  name: '',
  phone: '',
  email: '',
  address: '',
  description: '',
  manager_email: '',
  manager_password: '',
  manager_name: '',
}

export function AddHotelModal({ open, onClose, onCreated }: AddHotelModalProps) {
  const [form, setForm] = useState<CreateHotelInput>(initialForm)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const firstInputRef = useRef<HTMLInputElement>(null)

  // Reset state on open and focus the first field. We defer state updates
  // through a microtask so React 19 doesn't flag synchronous setState in effect.
  useEffect(() => {
    if (!open) return
    let cancelled = false
    void Promise.resolve().then(() => {
      if (cancelled) return
      setForm(initialForm)
      setError(null)
      setSubmitting(false)
    })
    const t = window.setTimeout(() => firstInputRef.current?.focus(), 50)
    return () => {
      cancelled = true
      window.clearTimeout(t)
    }
  }, [open])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !submitting) onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, submitting, onClose])

  if (!open) return null

  const update =
    (field: keyof CreateHotelInput) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
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
      // Send only non-empty fields so the backend can use defaults
      const payload: CreateHotelInput = { name: form.name.trim() }
      if (form.phone?.trim()) payload.phone = form.phone.trim()
      if (form.email?.trim()) payload.email = form.email.trim()
      if (form.address?.trim()) payload.address = form.address.trim()
      if (form.description?.trim()) payload.description = form.description.trim()
      if (form.manager_email?.trim()) payload.manager_email = form.manager_email.trim()
      if (form.manager_password?.trim()) payload.manager_password = form.manager_password.trim()
      if (form.manager_name?.trim()) payload.manager_name = form.manager_name.trim()

      const result = await createHotel(payload)
      onCreated(result)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không tạo được cơ sở'
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
      aria-labelledby="add-hotel-title"
      onClick={() => !submitting && onClose()}
    >
      <div
        className="w-full max-w-xl bg-white rounded-3xl shadow-modal max-h-[90vh] flex flex-col animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-border-light flex items-center justify-between flex-shrink-0">
          <div>
            <h2
              id="add-hotel-title"
              className="text-lg font-bold text-text"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              Thêm cơ sở mới
            </h2>
            <p className="text-[12.5px] text-text-light mt-0.5">
              Hệ thống sẽ tự tạo tài khoản quản trị viên cho cơ sở này
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            className="w-9 h-9 rounded-xl text-text-muted hover:bg-gray-100 flex items-center justify-center cursor-pointer disabled:opacity-50 transition-colors"
            aria-label="Đóng"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {error ? (
            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-[13px] text-red-700">
              {error}
            </div>
          ) : null}

          <section className="space-y-3">
            <h3 className="text-[12px] font-semibold uppercase tracking-wide text-text-light">
              Thông tin cơ sở
            </h3>
            <Field label="Tên cơ sở" required>
              <input
                ref={firstInputRef}
                type="text"
                value={form.name}
                onChange={update('name')}
                placeholder="Grand Palace Hotel"
                className={inputClass}
                required
              />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Số điện thoại">
                <input
                  type="text"
                  value={form.phone}
                  onChange={update('phone')}
                  placeholder="+84-28-1234-5678"
                  className={inputClass}
                />
              </Field>
              <Field label="Email cơ sở">
                <input
                  type="email"
                  value={form.email}
                  onChange={update('email')}
                  placeholder="info@hotel.vn"
                  className={inputClass}
                />
              </Field>
            </div>
            <Field label="Địa chỉ">
              <input
                type="text"
                value={form.address}
                onChange={update('address')}
                placeholder="123 Đường ABC, Quận 1, TP.HCM"
                className={inputClass}
              />
            </Field>
            <Field label="Mô tả ngắn">
              <textarea
                rows={2}
                value={form.description}
                onChange={update('description')}
                placeholder="Khách sạn 5 sao, dịch vụ cao cấp…"
                className={`${inputClass} resize-none`}
              />
            </Field>
          </section>

          <section className="space-y-3">
            <h3 className="text-[12px] font-semibold uppercase tracking-wide text-text-light">
              Tài khoản quản trị viên (tuỳ chọn)
            </h3>
            <p className="text-[12px] text-text-light -mt-1">
              Để trống nếu muốn hệ thống tự sinh email và mật khẩu mặc định
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Email quản trị">
                <input
                  type="email"
                  value={form.manager_email}
                  onChange={update('manager_email')}
                  placeholder="manager@hotel.vn"
                  className={inputClass}
                />
              </Field>
              <Field label="Mật khẩu (tối thiểu 6 ký tự)">
                <input
                  type="text"
                  value={form.manager_password}
                  onChange={update('manager_password')}
                  placeholder="Để trống để tự sinh"
                  className={inputClass}
                />
              </Field>
            </div>
            <Field label="Tên quản trị viên">
              <input
                type="text"
                value={form.manager_name}
                onChange={update('manager_name')}
                placeholder="Nguyễn Văn A"
                className={inputClass}
              />
            </Field>
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
            {submitting ? 'Đang tạo…' : 'Tạo cơ sở'}
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
