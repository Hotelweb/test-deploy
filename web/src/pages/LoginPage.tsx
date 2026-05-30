import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { login as loginApi } from '../api'
import { setAuth } from '../lib/auth'
import { useAuth } from '../hooks/useAuth'
import { EyeIcon } from '../components/icons/ServiceIcons'

interface LocationState {
  from?: string
}

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const auth = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
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
    <div className="min-h-screen bg-background-warm px-4 py-8 sm:py-10">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-6xl items-center justify-center">
        <div className="w-full max-w-[30rem]">
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
            <p className="text-text-light text-sm mt-1">
              Vào bảng điều khiển dành cho quản trị viên
            </p>
          </div>

          <div className="bg-white rounded-3xl shadow-elevated border border-border-light overflow-hidden">
            <div className="border-b border-border-light px-6 py-4">
              <p className="text-[13px] font-semibold text-text">Tài khoản quản trị</p>
              <p className="text-[12px] text-text-light mt-0.5">
                Hệ thống tự nhận diện quyền truy cập sau khi đăng nhập.
              </p>
            </div>

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
                  placeholder="admin@system.com hoặc manager@hotel.vn"
                  className={inputClass}
                  required
                  autoFocus
                />
              </Field>

              <Field label="Mật khẩu">
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    placeholder="Nhập mật khẩu"
                    className={`${inputClass} pr-12`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-text-light hover:bg-gray-100 hover:text-text cursor-pointer transition-colors"
                    aria-label={showPassword ? 'Ẩn mật khẩu' : 'Xem mật khẩu'}
                    aria-pressed={showPassword}
                  >
                    {showPassword ? <EyeOffIcon /> : <EyeIcon className="w-4 h-4" />}
                  </button>
                </div>
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
            Liên hệ quản trị nếu chưa có tài khoản hoặc cần đặt lại mật khẩu.
          </p>
        </div>
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

function EyeOffIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m2 2 20 20" />
      <path d="M10.7 5.08A10.8 10.8 0 0 1 12 5c5 0 8.5 4.2 9.94 6.65a1 1 0 0 1 0 .7 16.9 16.9 0 0 1-3.24 4.18" />
      <path d="M6.61 6.61A16.6 16.6 0 0 0 2.06 11.65a1 1 0 0 0 0 .7C3.5 14.8 7 19 12 19a10.7 10.7 0 0 0 4.22-.86" />
      <path d="M9.88 9.88a3 3 0 0 0 4.24 4.24" />
    </svg>
  )
}
