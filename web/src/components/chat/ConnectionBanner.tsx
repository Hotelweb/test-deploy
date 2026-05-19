import type { ConnectionState } from '../../hooks/useChatSocket'
import { SignalIcon, SignalOffIcon, RefreshIcon } from '../icons/ServiceIcons'

interface ConnectionBannerProps {
  state: ConnectionState
  /** Localized label strings */
  labels?: {
    online?: string
    offline?: string
    reconnecting?: string
  }
}

export function ConnectionBanner({ state, labels }: ConnectionBannerProps) {
  if (state === 'online') return null

  if (state === 'reconnecting' || state === 'connecting') {
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border-b border-amber-100 text-amber-700 text-xs font-medium animate-fade-in">
        <RefreshIcon className="w-3.5 h-3.5 animate-spin" />
        <span>{labels?.reconnecting ?? 'Reconnecting…'}</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-red-50 border-b border-red-100 text-red-700 text-xs font-medium animate-fade-in">
      <SignalOffIcon className="w-3.5 h-3.5" />
      <span>{labels?.offline ?? 'You are offline. Messages will send when reconnected.'}</span>
    </div>
  )
}

export function ConnectionDot({ state }: { state: ConnectionState }) {
  const colors: Record<ConnectionState, string> = {
    online: 'bg-emerald-500',
    connecting: 'bg-amber-500',
    reconnecting: 'bg-amber-500',
    offline: 'bg-red-500',
  }
  return (
    <span className="inline-flex items-center" aria-hidden>
      <span
        className={`w-1.5 h-1.5 rounded-full ${colors[state]} ${state === 'online' ? 'animate-pulse-soft' : ''}`}
      />
      {state === 'online' ? <SignalIcon className="hidden" /> : null}
    </span>
  )
}
