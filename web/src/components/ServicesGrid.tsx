import type { ReactNode } from 'react'
import { ServiceItem, type ServiceTone } from './ServiceItem'
import {
  TranslateIcon,
  FrontOfficeIcon,
  RoomServiceIcon,
  RestaurantIcon,
  InRoomDiningIcon,
  SpecialOfferIcon,
  FacilitiesIcon,
  LaundryIcon,
  SpaIcon,
  MotorbikeIcon,
  AirportShuttleIcon,
  TourTicketIcon,
} from './icons/ServiceIcons'

interface ServicesGridProps {
  onServiceClick?: (service: string) => void
}

interface ServiceDef {
  key: string
  icon: ReactNode
  label: string
  description: string
  tone: ServiceTone
}

const ICON_CLS = 'w-6 h-6'

const services: ServiceDef[] = [
  {
    key: 'translate',
    icon: <TranslateIcon className={ICON_CLS} />,
    label: 'Hướng dẫn dịch',
    description: 'Dịch vụ phiên dịch',
    tone: 'blue',
  },
  {
    key: 'reception',
    icon: <FrontOfficeIcon className={ICON_CLS} />,
    label: 'Lễ tân',
    description: 'Hỗ trợ 24/7',
    tone: 'purple',
  },
  {
    key: 'room-service',
    icon: <RoomServiceIcon className={ICON_CLS} />,
    label: 'Dịch vụ phòng',
    description: 'Phục vụ tại phòng',
    tone: 'green',
  },
  {
    key: 'restaurant',
    icon: <RestaurantIcon className={ICON_CLS} />,
    label: 'Nhà hàng',
    description: 'Ẩm thực cao cấp',
    tone: 'orange',
  },
  {
    key: 'in-room-dining',
    icon: <InRoomDiningIcon className={ICON_CLS} />,
    label: 'Ăn tại phòng',
    description: 'Giao đồ ăn',
    tone: 'red',
  },
  {
    key: 'special-offer',
    icon: <SpecialOfferIcon className={ICON_CLS} />,
    label: 'Ưu đãi đặc biệt',
    description: 'Khuyến mãi',
    tone: 'pink',
  },
  {
    key: 'facilities',
    icon: <FacilitiesIcon className={ICON_CLS} />,
    label: 'Tiện ích',
    description: 'WiFi, Gym, Pool',
    tone: 'indigo',
  },
  {
    key: 'laundry',
    icon: <LaundryIcon className={ICON_CLS} />,
    label: 'Giặt ủi',
    description: 'Dịch vụ giặt',
    tone: 'yellow',
  },
  {
    key: 'spa',
    icon: <SpaIcon className={ICON_CLS} />,
    label: 'Spa',
    description: 'Thư giãn massage',
    tone: 'emerald',
  },
  {
    key: 'motorbike',
    icon: <MotorbikeIcon className={ICON_CLS} />,
    label: 'Thuê xe máy',
    description: 'Di chuyển tiện lợi',
    tone: 'amber',
  },
  {
    key: 'airport-shuttle',
    icon: <AirportShuttleIcon className={ICON_CLS} />,
    label: 'Đưa đón sân bay',
    description: 'Transfer service',
    tone: 'sky',
  },
  {
    key: 'tour',
    icon: <TourTicketIcon className={ICON_CLS} />,
    label: 'Tour/Vé',
    description: 'Đặt tour du lịch',
    tone: 'violet',
  },
]

export function ServicesGrid({ onServiceClick }: ServicesGridProps) {
  return (
    <section aria-label="Hotel services">
      <h3 className="text-xl sm:text-2xl font-bold text-text tracking-tight mb-5">
        Dịch vụ khách sạn
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {services.map((service) => (
          <ServiceItem
            key={service.key}
            icon={service.icon}
            label={service.label}
            description={service.description}
            tone={service.tone}
            onClick={() => onServiceClick?.(service.label)}
          />
        ))}
      </div>
    </section>
  )
}
