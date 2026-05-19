/**
 * Tiny auth state helper.
 *
 * Persists the access token + minimal user info in localStorage so reloads
 * keep the user logged in. Components subscribe via `subscribeAuth` to react
 * to login/logout from anywhere in the tree without a global state library.
 */

export type AuthScope = 'system' | 'hotel'

export interface AuthUser {
  id: number
  email: string
  full_name: string
  scope: AuthScope
  hotel_id?: number
  avatar_url?: string | null
  is_active: boolean
}

export interface AuthState {
  token: string
  user: AuthUser
}

const TOKEN_KEY = 'a25.auth.token'
const USER_KEY = 'a25.auth.user'

type Listener = (state: AuthState | null) => void
const listeners = new Set<Listener>()

function readState(): AuthState | null {
  // SSR / non-browser safety net.
  if (typeof window === 'undefined') return null
  try {
    const token = window.localStorage.getItem(TOKEN_KEY)
    const userRaw = window.localStorage.getItem(USER_KEY)
    if (!token || !userRaw) return null
    const user = JSON.parse(userRaw) as AuthUser
    return { token, user }
  } catch {
    return null
  }
}

export function getAuth(): AuthState | null {
  return readState()
}

export function getToken(): string | null {
  return readState()?.token ?? null
}

export function setAuth(state: AuthState) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(TOKEN_KEY, state.token)
  window.localStorage.setItem(USER_KEY, JSON.stringify(state.user))
  emit(state)
}

export function clearAuth() {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(TOKEN_KEY)
  window.localStorage.removeItem(USER_KEY)
  emit(null)
}

/**
 * Subscribe to auth state changes. Returns an unsubscribe function.
 *
 * The listener is *not* invoked synchronously during subscribe — callers
 * must read the initial state with `getAuth()` themselves. This avoids the
 * React 19 "synchronous setState during subscribe" warning that triggered
 * cascade re-renders inside `useAuth`.
 */
export function subscribeAuth(listener: Listener): () => void {
  listeners.add(listener)

  // Cross-tab sync: when another tab logs in/out, broadcast the new state
  // through the same listener pool.
  const onStorage = (event: StorageEvent) => {
    if (event.key === TOKEN_KEY || event.key === USER_KEY) {
      listener(readState())
    }
  }
  window.addEventListener('storage', onStorage)

  return () => {
    listeners.delete(listener)
    window.removeEventListener('storage', onStorage)
  }
}

function emit(state: AuthState | null) {
  for (const listener of listeners) listener(state)
}
