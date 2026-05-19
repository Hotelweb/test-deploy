import type { ReactNode } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import type { AuthScope } from '../lib/auth'

interface RequireAuthProps {
  /** Restrict access to one or more scopes. Empty = any logged-in user. */
  scopes?: AuthScope[]
  /**
   * For hotel-scoped routes that key off a `:hotelId` URL param, system admins
   * can always access (they own the world); hotel users may only access their
   * own hotel. Pass the matched hotel id here to enforce that.
   */
  hotelId?: number
  children: ReactNode
}

/**
 * Route guard. Sends unauthenticated users to /login and stashes the path
 * they tried to visit in `state.from` so the login page can bounce them back.
 *
 * Authorisation is two-layered:
 *   1. Scope check — does the user belong to one of the allowed realms?
 *   2. Hotel match — when both `scopes` includes 'hotel' and a `hotelId` is
 *      given, hotel-scoped users must match that exact hotel.
 */
export function RequireAuth({ scopes, hotelId, children }: RequireAuthProps) {
  const auth = useAuth()
  const location = useLocation()

  if (!auth) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  }

  if (scopes && scopes.length > 0 && !scopes.includes(auth.user.scope)) {
    return <ForbiddenScreen reason="Bạn không có quyền truy cập trang này" />
  }

  if (
    typeof hotelId === 'number' &&
    auth.user.scope === 'hotel' &&
    auth.user.hotel_id !== hotelId
  ) {
    return <ForbiddenScreen reason="Bạn không thuộc cơ sở này" />
  }

  return <>{children}</>
}

function ForbiddenScreen({ reason }: { reason: string }) {
  const auth = useAuth()
  const dashboardPath =
    auth?.user.scope === 'system'
      ? '/admin'
      : auth?.user.hotel_id
        ? `/admin/${auth.user.hotel_id}`
        : '/login'

  return (
    <div className="min-h-screen flex items-center justify-center bg-background-warm px-6">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center">
          <svg
            viewBox="0 0 24 24"
            className="w-8 h-8"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M4.93 4.93l14.14 14.14" />
          </svg>
        </div>
        <h1 className="text-text font-bold text-lg">Không có quyền truy cập</h1>
        <p className="text-text-muted text-sm mt-1">{reason}</p>
        <Link
          to={dashboardPath}
          className="inline-block mt-5 px-4 py-2 rounded-xl text-[13.5px] font-medium text-text-muted bg-white border border-border hover:bg-gray-50 transition-colors"
        >
          Về dashboard
        </Link>
      </div>
    </div>
  )
}
