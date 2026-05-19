import { useSyncExternalStore } from 'react'
import type { AuthState } from '../lib/auth'
import { getAuth, subscribeAuth } from '../lib/auth'

/**
 * Snapshot cache so `useSyncExternalStore` returns a stable reference between
 * subscriber notifications. React requires the snapshot getter to return the
 * same reference until a real change has happened, otherwise it loops.
 */
let cachedSnapshot: AuthState | null | undefined

function getSnapshot(): AuthState | null {
  if (cachedSnapshot === undefined) {
    cachedSnapshot = getAuth()
  }
  return cachedSnapshot
}

function subscribe(onChange: () => void): () => void {
  return subscribeAuth((next) => {
    // Only invalidate the cache (and trigger a re-render) when the meaningful
    // contents have changed. This prevents repeated emits of equivalent state
    // from cascading renders across the tree.
    if (!isSameAuth(cachedSnapshot ?? null, next)) {
      cachedSnapshot = next
      onChange()
    }
  })
}

function isSameAuth(a: AuthState | null, b: AuthState | null): boolean {
  if (a === b) return true
  if (!a || !b) return false
  return (
    a.token === b.token &&
    a.user.id === b.user.id &&
    a.user.scope === b.user.scope &&
    a.user.hotel_id === b.user.hotel_id &&
    a.user.email === b.user.email &&
    a.user.full_name === b.user.full_name &&
    a.user.avatar_url === b.user.avatar_url &&
    a.user.is_active === b.user.is_active
  )
}

/**
 * Subscribe a component to the global auth state. Re-renders when the user
 * logs in / out (including from a different browser tab).
 */
export function useAuth(): AuthState | null {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}
