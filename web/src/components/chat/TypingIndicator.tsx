interface TypingIndicatorProps {
  /** Optional label shown next to the dots, e.g. "Hotel team is typing" */
  label?: string
  /** Visual variant — guest (sage green) vs admin (indigo) */
  variant?: 'guest' | 'admin'
}

export function TypingIndicator({ label, variant = 'guest' }: TypingIndicatorProps) {
  const dotColor = variant === 'guest' ? 'bg-emerald-500' : 'bg-indigo-500'

  return (
    <div className="flex items-end gap-2 animate-fade-in" aria-live="polite">
      <div className="flex items-center gap-1 bg-white border border-border-light rounded-2xl rounded-bl-sm px-3 py-2.5 shadow-soft">
        <span
          className={`w-1.5 h-1.5 rounded-full ${dotColor} animate-bounce`}
          style={{ animationDelay: '0ms', animationDuration: '900ms' }}
        />
        <span
          className={`w-1.5 h-1.5 rounded-full ${dotColor} animate-bounce`}
          style={{ animationDelay: '150ms', animationDuration: '900ms' }}
        />
        <span
          className={`w-1.5 h-1.5 rounded-full ${dotColor} animate-bounce`}
          style={{ animationDelay: '300ms', animationDuration: '900ms' }}
        />
      </div>
      {label ? <span className="text-[11px] text-text-light pl-1 mb-1">{label}</span> : null}
    </div>
  )
}
