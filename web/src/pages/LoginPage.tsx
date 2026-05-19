import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { login as loginApi } from '../api'
import { setAuth } from '../lib/auth'
import { useAuth } from '../hooks/useAuth'

type Tab = 'system' | 'hotel'

interface LocationState {
  from?: string
}

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const auth = useAuth()
  const [tab, setTab] = useState<Tab>('system')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Where to send the user after a successful login. Falls back to a sensible
  // default for each scope when the visitor came directly to /login.
  const fromPath = (location.state as LocationState | null)?.from

  // Already logged in? Bounce them to wherever they belong. We track whether
  // we've already navigated so a stable auth object doesn't trigger repeat
  // navigations on every render.
  const navigatedRef = useRef(false)
  useEffect(() => {
    if (!auth) {
      navigatedRef.current = false
      return
    }
    if (navigatedRef.current) return
    navigatedRef.current = true
    const target =
      fromPath ??
      (auth.user.scope === 'system'
        ? '/admin'
        : auth.user.hotel_id
          ? `/admin/${auth.user.hotel_id}`
          : '/admin')
    navigate(target, { replace: true })
  }, [auth, fromPath, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password) {
      setError('Vui lòng nhập đầy đủ email và mật khẩu')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const result = await loginApi({
        email: email.trim(),
        password,
        scope: tab,
      })
      setAuth({ token: result.access_token, user: result.user })
      // Effect above will navigate once the auth state propagates.
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Đăng nhập thất bại'
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background-warm px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl gradient-primary flex items-center justify-center text-white shadow-elevated">
            <svg
              viewBox="0 0 24 24"
              className="w-7 h-7"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <h1
            className="text-2xl font-bold text-text tracking-tight"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Đăng nhập
          </h1>
          <p className="text-text-light text-sm mt-1">Vào bảng điều khiển dành cho quản trị viên</p>
        </div>

        <div className="bg-white rounded-3xl shadow-elevated border border-border-light overflow-hidden">
          {/* Tabs */}
          <div className="grid grid-cols-2 border-b border-border-light">
            <TabButton
              active={tab === 'system'}
              onClick={() => setTab('system')}
              label="Quản trị hệ thống"
              hint="Root admin"
            />
            <TabButton
              active={tab === 'hotel'}
              onClick={() => setTab('hotel')}
              label="Quản trị cơ sở"
              hint="Nhân viên khách sạn"
            />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-6 py-6 space-y-4">
            {error ? (
              <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-[13px] text-red-700">
                {error}
              </div>
            ) : null}

            <Field label="Email">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                placeholder={tab === 'system' ? 'admin@system.com' : 'manager@hotel.vn'}
                className={inputClass}
                required
                autoFocus
              />
            </Field>

            <Field label="Mật khẩu">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                placeholder="••••••••"
                className={inputClass}
                required
              />
            </Field>

            <button
              type="submit"
              disabled={submitting}
              className="w-full px-5 py-3 rounded-xl text-[14px] font-semibold text-white gradient-primary shadow-card hover:shadow-card-hover disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all"
            >
              {submitting ? 'Đang đăng nhập…' : 'Đăng nhập'}
            </button>

            <button
              type="button"
              onClick={() => navigate(-1)}
              className="w-full text-center text-[12.5px] text-text-light hover:text-text-muted cursor-pointer transition-colors"
            >
              ← Quay lại
            </button>
          </form>
        </div>

        <p className="text-center text-[11.5px] text-text-lighter mt-5">
          {tab === 'system'
            ? 'Tài khoản root chỉ dùng cho quản trị toàn hệ thống'
            : 'Liên hệ quản trị nếu chưa có tài khoản nhân viên'}
        </p>
      </div>
    </div>
  )
}

const inputClass =
  'w-full px-3.5 py-2.5 rounded-xl bg-gray-50 text-[14px] focus:outline-none focus:ring-2 focus:ring-primary/30 focus:bg-white border border-border-light focus:border-primary/40 transition-all placeholder:text-text-lighter'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[12.5px] font-medium text-text-muted mb-1.5">{label}</span>
      {children}
    </label>
  )
}

function TabButton({
  active,
  onClick,
  label,
  hint,
}: {
  active: boolean
  onClick: () => void
  label: string
  hint: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-3 text-left transition-colors cursor-pointer ${
        active ? 'bg-white text-primary' : 'bg-gray-50/60 text-text-muted hover:bg-gray-50'
      }`}
      aria-pressed={active}
    >
      <span className="block text-[13px] font-semibold">{label}</span>
      <span
        className={`block text-[11px] mt-0.5 ${active ? 'text-primary/70' : 'text-text-lighter'}`}
      >
        {hint}
      </span>
    </button>
  )
}
