/**
 * Lightweight browser notifications + sound for the admin chat.
 *
 * - Sound: tiny synthesized "ding" via Web Audio so we don't need an asset
 *   file. Falls back silently if Web Audio is unavailable.
 * - Browser: only fires when permission has been granted.
 */

let audioCtx: AudioContext | null = null

export function ensureAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (audioCtx) return audioCtx
  try {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return null
    audioCtx = new Ctor()
    return audioCtx
  } catch {
    return null
  }
}

/**
 * Plays a soft two-tone notification sound.
 */
export function playNotificationSound() {
  const ctx = ensureAudioContext()
  if (!ctx) return
  try {
    const now = ctx.currentTime
    const playTone = (freq: number, start: number, duration: number, gainPeak = 0.18) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, now + start)
      gain.gain.setValueAtTime(0, now + start)
      gain.gain.linearRampToValueAtTime(gainPeak, now + start + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + start + duration)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now + start)
      osc.stop(now + start + duration)
    }
    playTone(880, 0, 0.18) // A5
    playTone(1175, 0.12, 0.22) // D6
  } catch {
    // ignored
  }
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || typeof Notification === 'undefined') {
    return 'denied'
  }
  if (Notification.permission === 'granted' || Notification.permission === 'denied') {
    return Notification.permission
  }
  try {
    return await Notification.requestPermission()
  } catch {
    return 'denied'
  }
}

export function showBrowserNotification(
  title: string,
  body: string,
  options?: { tag?: string; onClick?: () => void },
) {
  if (typeof window === 'undefined' || typeof Notification === 'undefined') return
  if (Notification.permission !== 'granted') return
  if (typeof document !== 'undefined' && document.visibilityState === 'visible') return // don't notify when tab is focused
  try {
    const notif = new Notification(title, {
      body,
      tag: options?.tag,
      icon: '/favicon.svg',
    })
    if (options?.onClick) {
      notif.onclick = () => {
        window.focus()
        options.onClick?.()
        notif.close()
      }
    }
  } catch {
    // ignored
  }
}
