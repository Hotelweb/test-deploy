interface InfoPillProps {
  label: string
  value: string
  strong?: boolean
}

export function InfoPill({ label, value, strong }: InfoPillProps) {
  return (
    <div className="rounded-xl bg-white border border-border-light px-3 py-2 min-w-0">
      <p className="text-[10.5px] font-semibold uppercase tracking-wide text-text-light">{label}</p>
      <p
        className={`text-[13px] truncate mt-0.5 ${
          strong ? 'font-bold text-primary' : 'font-semibold text-text'
        }`}
      >
        {value}
      </p>
    </div>
  )
}
