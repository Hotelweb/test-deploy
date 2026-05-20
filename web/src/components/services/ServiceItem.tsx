import type { ReactNode } from 'react'

export type ServiceTone =
  | 'blue'
  | 'orange'
  | 'green'
  | 'purple'
  | 'red'
  | 'yellow'
  | 'indigo'
  | 'pink'
  | 'teal'
  | 'emerald'
  | 'sky'
  | 'violet'
  | 'rose'
  | 'amber'
  | 'lime'
  | 'fuchsia'
  | 'cyan'
  | 'slate'

interface ServiceItemProps {
  icon: ReactNode
  label: string
  description?: string
  tone?: ServiceTone
  onClick?: () => void
}

// Tone -> bg + icon color (matches Figma palette)
const toneStyles: Record<ServiceTone, { bg: string; icon: string }> = {
  blue: { bg: 'bg-blue-100', icon: 'text-blue-600' },
  orange: { bg: 'bg-orange-100', icon: 'text-orange-600' },
  green: { bg: 'bg-green-100', icon: 'text-green-600' },
  purple: { bg: 'bg-purple-100', icon: 'text-purple-600' },
  red: { bg: 'bg-red-100', icon: 'text-red-600' },
  yellow: { bg: 'bg-yellow-100', icon: 'text-yellow-700' },
  indigo: { bg: 'bg-indigo-100', icon: 'text-indigo-600' },
  pink: { bg: 'bg-pink-100', icon: 'text-pink-600' },
  teal: { bg: 'bg-teal-100', icon: 'text-teal-600' },
  emerald: { bg: 'bg-emerald-100', icon: 'text-emerald-600' },
  sky: { bg: 'bg-sky-100', icon: 'text-sky-600' },
  violet: { bg: 'bg-violet-100', icon: 'text-violet-600' },
  rose: { bg: 'bg-rose-100', icon: 'text-rose-600' },
  amber: { bg: 'bg-amber-100', icon: 'text-amber-700' },
  lime: { bg: 'bg-lime-100', icon: 'text-lime-700' },
  fuchsia: { bg: 'bg-fuchsia-100', icon: 'text-fuchsia-600' },
  cyan: { bg: 'bg-cyan-100', icon: 'text-cyan-600' },
  slate: { bg: 'bg-slate-100', icon: 'text-slate-600' },
}

export function ServiceItem({
  icon,
  label,
  description,
  tone = 'blue',
  onClick,
}: ServiceItemProps) {
  const t = toneStyles[tone]
  return (
    <button
      onClick={onClick}
      className="group glass-card glass-card-hover rounded-2xl p-5 flex flex-col items-start gap-4 cursor-pointer focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 text-left w-full h-full"
      aria-label={label}
    >
      {/* Colored icon tile */}
      <div
        className={`w-12 h-12 rounded-xl flex items-center justify-center ${t.bg} ${t.icon} transition-colors duration-200`}
      >
        {icon}
      </div>

      {/* Text content */}
      <div className="flex-1 min-w-0 w-full">
        <h4 className="font-semibold text-text text-[15px] leading-tight group-hover:text-primary transition-colors duration-200">
          {label}
        </h4>
        {description ? (
          <p className="text-text-light text-[12px] mt-1 leading-snug line-clamp-2">
            {description}
          </p>
        ) : null}
      </div>
    </button>
  )
}
