import type { HotelService } from '../api'
import { getIconEntry, isIconUrl } from '../lib/serviceCatalog'
import { ServiceItem, type ServiceTone } from './ServiceItem'
import { HotelInfoIcon } from './icons/ServiceIcons'

const ICON_CLS = 'w-6 h-6'

const fallbackTones: ServiceTone[] = [
  'blue',
  'green',
  'purple',
  'orange',
  'pink',
  'indigo',
  'teal',
  'amber',
]

interface HotelDetailServicesProps {
  services: HotelService[]
  onServiceClick?: (service: HotelService) => void
}

/**
 * Render the customer-facing tile grid.
 *
 * Icons are resolved in this order:
 *   1. The catalogue key stored in `service.icon_url` (set by the new admin
 *      icon picker) — drives both the SVG and the default tone wash.
 *   2. A legacy free-form image URL — rendered via a thumbnail.
 *   3. A neutral placeholder so older rows that have nothing don't break
 *      the layout. The fallback tone cycles through a colour palette so
 *      the grid still looks lively.
 */
export function HotelDetailServices({ services, onServiceClick }: HotelDetailServicesProps) {
  return (
    <section aria-label="Hotel services">
      <h3 className="text-xl sm:text-2xl font-bold text-text tracking-tight mb-5">
        Dịch vụ khách sạn
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {services.map((service, idx) => {
          const entry = getIconEntry(service.icon_url)

          let icon: React.ReactNode
          let tone: ServiceTone
          if (entry) {
            icon = <entry.Icon className={ICON_CLS} />
            tone = entry.tone
          } else if (isIconUrl(service.icon_url)) {
            // Legacy URL — show as a tiny image so older rows still render.
            icon = (
              <img src={service.icon_url ?? ''} alt="" className="w-6 h-6 object-cover rounded" />
            )
            tone = fallbackTones[idx % fallbackTones.length]
          } else {
            icon = <HotelInfoIcon className={ICON_CLS} />
            tone = fallbackTones[idx % fallbackTones.length]
          }

          return (
            <ServiceItem
              key={service.id}
              icon={icon}
              label={service.title}
              description={service.description ?? undefined}
              tone={tone}
              onClick={() => onServiceClick?.(service)}
            />
          )
        })}
      </div>
    </section>
  )
}
