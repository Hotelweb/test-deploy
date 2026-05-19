import { useEffect, useRef, useState, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { updateHotelUser } from '../api'
import { useAuth } from '../hooks/useAuth'
import { clearAuth, setAuth } from '../lib/auth'
import { ImageUploader } from './ImageUploader'
import { CloseIcon, EditIcon, UserCircleIcon } from './icons/ServiceIcons'

interface UserMenuProps {
  /** Optional secondary line under the user name (e.g. role label). */
  subtitle?: string
  /** Visual size: `sm` for tight headers, `md` for full pages. */
  size?: 'sm' | 'md'
}

/**
 * Compact user pill with a dropdown menu containing the logout action.
 * Used in admin pages so any logged-in user can sign out.
 */
export function UserMenu({ subtitle, size = 'md' }: UserMenuProps) {
  const auth = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Close on outside click and on Escape
  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('mousedown', onClick)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('mousedown', onClick)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  if (!auth) return null

  const handleLogout = () => {
    setOpen(false)
    clearAuth()
    navigate('/login', { replace: true })
  }

  const handleEdit = () => {
    setOpen(false)
    setEditing(true)
  }

  const isSmall = size === 'sm'

  return (
    <>
      <div className="relative" ref={containerRef}>
        <button
          onClick={() => setOpen((v) => !v)}
          className={`flex items-center gap-2 rounded-xl bg-white border border-border-light hover:bg-gray-50 cursor-pointer transition-colors ${
            isSmall ? 'px-2 py-1.5' : 'px-3 py-2'
          }`}
          aria-haspopup="menu"
          aria-expanded={open}
        >
          <span
            className={`rounded-full bg-emerald-50 text-primary flex items-center justify-center flex-shrink-0 ${
              isSmall ? 'w-6 h-6' : 'w-7 h-7'
            }`}
          >
            {auth.user.avatar_url ? (
              <img
                src={auth.user.avatar_url}
                alt={auth.user.full_name}
                className="w-full h-full object-cover rounded-full"
              />
            ) : (
              <UserCircleIcon className={isSmall ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
            )}
          </span>
          <span className="hidden sm:flex flex-col text-left min-w-0">
            <span
              className={`font-medium text-text truncate max-w-[140px] ${
                isSmall ? 'text-[12px]' : 'text-[12.5px]'
              }`}
            >
              {auth.user.full_name}
            </span>
            {subtitle ? (
              <span className="text-[10.5px] text-text-light truncate max-w-[140px]">
                {subtitle}
              </span>
            ) : null}
          </span>
          <svg
            viewBox="0 0 24 24"
            className={`text-text-lighter ${isSmall ? 'w-3 h-3' : 'w-3.5 h-3.5'}`}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>

        {open ? (
          <div
            role="menu"
            className="absolute left-0 sm:left-auto sm:right-0 top-full mt-2 w-56 max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-elevated border border-border-light overflow-hidden z-50 animate-scale-in"
          >
            <div className="px-4 py-3 border-b border-border-light">
              <p className="text-[13px] font-semibold text-text truncate">{auth.user.full_name}</p>
              <p className="text-[11.5px] text-text-light truncate">{auth.user.email}</p>
            </div>
            {auth.user.scope === 'hotel' ? (
              <button
                role="menuitem"
                onClick={handleEdit}
                className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-text hover:bg-gray-50 cursor-pointer transition-colors flex items-center gap-2"
              >
                <EditIcon className="w-4 h-4" />
                Cập nhật người dùng
              </button>
            ) : null}
            <button
              role="menuitem"
              onClick={handleLogout}
              className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-red-600 hover:bg-red-50 cursor-pointer transition-colors flex items-center gap-2"
            >
              <svg
                viewBox="0 0 24 24"
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Đăng xuất
            </button>
          </div>
        ) : null}
      </div>

      {editing && typeof document !== 'undefined'
        ? createPortal(<EditCurrentUserModal onClose={() => setEditing(false)} />, document.body)
        : null}
    </>
  )
}

function EditCurrentUserModal({ onClose }: { onClose: () => void }) {
  const auth = useAuth()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!auth) return
    let cancelled = false
    void Promise.resolve().then(() => {
      if (cancelled) return
      setFullName(auth.user.full_name)
      setEmail(auth.user.email)
      setAvatarUrl(auth.user.avatar_url ?? '')
      setPassword('')
      setError(null)
      setSubmitting(false)
    })
    return () => {
      cancelled = true
    }
  }, [auth])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !submitting) onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, submitting])

  if (!auth || auth.user.scope !== 'hotel') return null

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    const trimmedName = fullName.trim()
    const trimmedEmail = email.trim()
    const trimmedAvatar = avatarUrl.trim()
    const trimmedPassword = password.trim()

    if (!trimmedName) {
      setError('Vui lòng nhập họ tên')
      return
    }
    if (!trimmedEmail) {
      setError('Vui lòng nhập email')
      return
    }
    if (trimmedPassword && trimmedPassword.length < 6) {
      setError('Mật khẩu mới phải có ít nhất 6 ký tự')
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      const updated = await updateHotelUser(auth.user.id, {
        full_name: trimmedName,
        email: trimmedEmail,
        avatar_url: trimmedAvatar || undefined,
        ...(trimmedPassword ? { password: trimmedPassword } : {}),
      })

      setAuth({
        token: auth.token,
        user: {
          ...auth.user,
          email: updated.email,
          full_name: updated.full_name,
          avatar_url: updated.avatar_url,
          is_active: updated.is_active,
        },
      })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không cập nhật được tài khoản')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] overflow-y-auto bg-black/40 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-current-user-title"
      onClick={() => !submitting && onClose()}
    >
      <div className="min-h-full flex items-start justify-center p-4 sm:py-8">
        <div
          className="w-full max-w-3xl bg-white rounded-3xl shadow-modal max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-4rem)] flex flex-col animate-scale-in"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-6 py-4 border-b border-border-light flex items-center justify-between flex-shrink-0">
            <div>
              <h2
                id="edit-current-user-title"
                className="text-lg font-bold text-text"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                Cập nhật người dùng
              </h2>
              <p className="text-[12.5px] text-text-light mt-0.5">
                Cập nhật thông tin người dùng hiện tại
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="w-9 h-9 rounded-xl text-text-muted hover:bg-gray-100 flex items-center justify-center cursor-pointer disabled:opacity-50 transition-colors"
              aria-label="Đóng"
            >
              <CloseIcon className="w-5 h-5" />
            </button>
          </div>

          <form
            id="edit-current-user-form"
            onSubmit={handleSubmit}
            className="flex-1 overflow-y-auto px-6 py-5 space-y-6 min-h-0"
          >
            {error ? (
              <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-[13px] text-red-700">
                {error}
              </div>
            ) : null}

            <section className="space-y-3">
              <h3 className="text-[12px] font-semibold uppercase tracking-wide text-text-light">
                Thông tin tài khoản
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Họ tên" required>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className={inputClass}
                    autoComplete="name"
                    required
                  />
                </Field>

                <Field label="Email" required>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={inputClass}
                    autoComplete="email"
                    required
                  />
                </Field>
              </div>

              <div>
                <span className="block text-[12.5px] font-medium text-text-muted mb-1.5">
                  Avatar
                </span>
                <ImageUploader
                  value={avatarUrl || null}
                  onChange={(next) => setAvatarUrl(next ?? '')}
                  folder="misc"
                  aspect="square"
                  ariaLabel="Chọn avatar người dùng"
                  hint="Bấm hoặc kéo ảnh vào đây để cập nhật avatar"
                />
              </div>

              <Field label="Mật khẩu mới" hint="Để trống nếu không đổi mật khẩu">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputClass}
                  autoComplete="new-password"
                  minLength={6}
                />
              </Field>
            </section>
          </form>

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
              form="edit-current-user-form"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl text-[13.5px] font-semibold text-white gradient-primary shadow-card hover:shadow-card-hover disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all"
            >
              {submitting ? 'Đang cập nhật...' : 'Cập nhật'}
            </button>
          </div>
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
  hint,
  children,
}: {
  label: string
  required?: boolean
  hint?: string
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="block text-[12.5px] font-medium text-text-muted mb-1.5">
        {label}
        {required ? <span className="text-red-500"> *</span> : null}
      </span>
      {children}
      {hint ? <span className="block text-[11.5px] text-text-light mt-1">{hint}</span> : null}
    </label>
  )
}
