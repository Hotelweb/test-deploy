import { ChevronDownIcon, HotelIcon } from './icons/ServiceIcons'

interface HotelCardProps {
  name: string
  address: string
  onClick?: () => void
}

export function HotelCard({ name, address, onClick }: HotelCardProps) {
  return (
    <button
      onClick={onClick}
      className="w-full glass-card glass-card-hover rounded-2xl px-5 py-4 flex items-center gap-4 cursor-pointer focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 text-left"
      aria-label={`View details for ${name}`}
    >
      {/* Hotel icon */}
      <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-primary flex-shrink-0">
        <HotelIcon className="w-6 h-6" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-text text-[15px] leading-tight truncate">{name}</h3>
        <p className="text-text-light text-[13px] mt-1 truncate">{address}</p>
      </div>

      {/* Chevron */}
      <div className="flex-shrink-0 text-text-lighter">
        <ChevronDownIcon className="w-5 h-5" />
      </div>
    </button>
  )
}
