interface MenuMetricProps {
  label: string
  value: number
  muted?: boolean
}

export function MenuMetric({ label, value, muted }: MenuMetricProps) {
  return (
    <div className="rounded-xl bg-white border border-border-light px-3 py-2 min-w-20">
      <p className="text-[10.5px] font-semibold uppercase tracking-wide text-text-light">{label}</p>
      <p className={`text-lg font-bold mt-0.5 ${muted ? 'text-text-muted' : 'text-text'}`}>
        {value}
      </p>
    </div>
  )
}
