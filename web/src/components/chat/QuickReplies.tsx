interface QuickReply {
  key: string
  label: string
  icon?: string
}

interface QuickRepliesProps {
  replies: QuickReply[]
  onSelect: (label: string) => void
  variant?: 'guest' | 'admin'
}

export function QuickReplies({ replies, onSelect, variant = 'guest' }: QuickRepliesProps) {
  const baseColor =
    variant === 'guest'
      ? 'bg-emerald-50 text-primary border-emerald-100 hover:bg-emerald-100/80 hover:border-emerald-200'
      : 'bg-indigo-50 text-indigo-700 border-indigo-100 hover:bg-indigo-100/80 hover:border-indigo-200'

  return (
    <div className="flex flex-wrap gap-1.5 px-1" role="listbox" aria-label="Quick replies">
      {replies.map((r) => (
        <button
          key={r.key}
          onClick={() => onSelect(r.label)}
          className={`text-[12.5px] font-medium px-3 py-1.5 rounded-full border ${baseColor} transition-all duration-200 hover:shadow-soft active:scale-95 cursor-pointer`}
        >
          {r.icon ? <span className="mr-1">{r.icon}</span> : null}
          {r.label}
        </button>
      ))}
    </div>
  )
}
