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
    return <AccessDeniedScreen reason="Bạn không có quyền truy cập trang này" />
  }

  if (
    typeof hotelId === 'number' &&
    auth.user.scope === 'hotel' &&
    auth.user.hotel_id !== hotelId
  ) {
    return <AccessDeniedScreen reason="Bạn không thuộc cơ sở này" />
  }

  return <>{children}</>
}

export function AccessDeniedScreen({ reason }: { reason: string }) {
  const auth = useAuth()
  const dashboardPath =
    auth?.user.scope === 'system'
      ? '/admin'
      : auth?.user.hotel_id
        ? `/admin/${auth.user.hotel_id}`
        : '/login'

  return (
    <div className="min-h-screen bg-background-warm px-4 py-8 sm:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-[88rem] items-center justify-center">
        <section className="w-full max-w-xl rounded-3xl border border-border-light bg-white p-6 text-center shadow-elevated sm:p-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center">
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
          <h1 className="text-text font-bold text-xl">Không có quyền truy cập</h1>
          <p className="text-text-muted text-sm mt-2 leading-relaxed">{reason}</p>
          <Link
            to={dashboardPath}
            className="inline-flex mt-6 h-11 items-center justify-center rounded-xl bg-primary px-4 text-[13.5px] font-semibold text-white hover:bg-primary-dark transition-colors"
          >
            Về dashboard
          </Link>
        </section>
      </div>
    </div>
  )
}
