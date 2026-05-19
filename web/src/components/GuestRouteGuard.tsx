import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { isGuestPublicPath } from '../lib/routes'

interface GuestRouteGuardProps {
  children: ReactNode
}

/**
 * Blocks unauthenticated visitors from every route except guest hotel pages
 * and /login. Logged-in staff may still open hotel pages (preview / QR link).
 */
export function GuestRouteGuard({ children }: GuestRouteGuardProps) {
  const auth = useAuth()
  const location = useLocation()
  const path = location.pathname

  if (!auth) {
    if (isGuestPublicPath(path) || path === '/login' || path === '/') {
      return <>{children}</>
    }
    if (path.startsWith('/admin')) {
      return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
    }
    return <Navigate to="/" replace state={{ blocked: path }} />
  }

  return <>{children}</>
}

/** Redirect `/` to the right dashboard for logged-in staff. */
export function RootRedirect() {
  const auth = useAuth()

  if (!auth) {
    return <GuestLanding />
  }

  if (auth.user.scope === 'system') {
    return <Navigate to="/admin" replace />
  }

  if (auth.user.hotel_id) {
    return <Navigate to={`/admin/${auth.user.hotel_id}`} replace />
  }

  return <Navigate to="/login" replace />
}

function GuestLanding() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background-warm px-6">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl gradient-primary flex items-center justify-center text-white shadow-elevated">
          <svg
            viewBox="0 0 24 24"
            className="w-8 h-8"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 21h18M5 21V7l8-4 8 4v14M9 21v-6h6v6" />
          </svg>
        </div>
        <h1
          className="text-xl font-bold text-text tracking-tight"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          A25 Hotel Services
        </h1>
        <p className="text-text-muted text-sm mt-2 leading-relaxed">
          Quét mã QR tại khách sạn để mở trang dịch vụ. Liên hệ lễ tân nếu bạn cần hỗ trợ.
        </p>
        <a
          href="/login"
          className="inline-block mt-6 text-[12.5px] font-medium text-primary hover:underline"
        >
          Đăng nhập quản trị →
        </a>
      </div>
    </div>
  )
}
