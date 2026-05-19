// Service Icons - Clean line icons matching Figma design
// Each icon uses currentColor so the parent tile can set the color

type IconProps = { className?: string }

const baseProps = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

// Translation / Languages (A文 letters)
export const TranslateIcon = ({ className = 'w-6 h-6' }: IconProps = {}) => (
  <svg viewBox="0 0 24 24" className={className} {...baseProps}>
    <path d="m5 8 6 6" />
    <path d="m4 14 6-6 2-3" />
    <path d="M2 5h12" />
    <path d="M7 2h1" />
    <path d="m22 22-5-10-5 10" />
    <path d="M14 18h6" />
  </svg>
)

// Reception / Concierge (bell)
export const FrontOfficeIcon = ({ className = 'w-6 h-6' }: IconProps = {}) => (
  <svg viewBox="0 0 24 24" className={className} {...baseProps}>
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    <path d="M12 4V2" />
  </svg>
)

// Room Service (door / key)
export const RoomServiceIcon = ({ className = 'w-6 h-6' }: IconProps = {}) => (
  <svg viewBox="0 0 24 24" className={className} {...baseProps}>
    <path d="M14 12V8.6c0-.6-.5-1.6-1-2C12 6 11 5 9 5H6.5C5.7 5 5 5.7 5 6.5v15.5h9V18" />
    <path d="M9 14h.01" />
    <circle cx="18" cy="14" r="3" />
    <path d="M21 14v4" />
  </svg>
)

// Restaurant (utensils)
export const RestaurantIcon = ({ className = 'w-6 h-6' }: IconProps = {}) => (
  <svg viewBox="0 0 24 24" className={className} {...baseProps}>
    <path d="M3 2v7c0 1.1.9 2 2 2h2c1.1 0 2-.9 2-2V2" />
    <path d="M7 2v20" />
    <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
  </svg>
)

// In-room dining (room service tray)
export const InRoomDiningIcon = ({ className = 'w-6 h-6' }: IconProps = {}) => (
  <svg viewBox="0 0 24 24" className={className} {...baseProps}>
    <path d="M5 12h14" />
    <path d="M5 12a7 7 0 0 1 14 0" />
    <path d="M3 17h18" />
    <path d="M12 5V3" />
  </svg>
)

// Special offer (gift / percentage)
export const SpecialOfferIcon = ({ className = 'w-6 h-6' }: IconProps = {}) => (
  <svg viewBox="0 0 24 24" className={className} {...baseProps}>
    <path d="m9 14 6-6" />
    <circle cx="9.5" cy="8.5" r=".5" fill="currentColor" />
    <circle cx="14.5" cy="13.5" r=".5" fill="currentColor" />
    <rect x="3" y="3" width="18" height="18" rx="2" />
  </svg>
)

// Facilities / WiFi
export const FacilitiesIcon = ({ className = 'w-6 h-6' }: IconProps = {}) => (
  <svg viewBox="0 0 24 24" className={className} {...baseProps}>
    <path d="M5 13a10 10 0 0 1 14 0" />
    <path d="M8.5 16.5a5 5 0 0 1 7 0" />
    <path d="M2 8.82a15 15 0 0 1 20 0" />
    <line x1="12" x2="12.01" y1="20" y2="20" />
  </svg>
)

// Laundry (shirt)
export const LaundryIcon = ({ className = 'w-6 h-6' }: IconProps = {}) => (
  <svg viewBox="0 0 24 24" className={className} {...baseProps}>
    <path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z" />
  </svg>
)

// Spa (leaf / lotus)
export const SpaIcon = ({ className = 'w-6 h-6' }: IconProps = {}) => (
  <svg viewBox="0 0 24 24" className={className} {...baseProps}>
    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
    <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
  </svg>
)

// Motorbike
export const MotorbikeIcon = ({ className = 'w-6 h-6' }: IconProps = {}) => (
  <svg viewBox="0 0 24 24" className={className} {...baseProps}>
    <circle cx="6" cy="17" r="4" />
    <circle cx="18" cy="17" r="4" />
    <path d="M9 12h2.5l1.7-3.4a1 1 0 0 1 .9-.6h2a1 1 0 0 1 .9 1.4L15 12h3" />
    <path d="M5 9h6" />
  </svg>
)

// Airport shuttle (plane)
export const AirportShuttleIcon = ({ className = 'w-6 h-6' }: IconProps = {}) => (
  <svg viewBox="0 0 24 24" className={className} {...baseProps}>
    <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
  </svg>
)

// Tour ticket
export const TourTicketIcon = ({ className = 'w-6 h-6' }: IconProps = {}) => (
  <svg viewBox="0 0 24 24" className={className} {...baseProps}>
    <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
    <path d="M13 5v2" />
    <path d="M13 17v2" />
    <path d="M13 11v2" />
  </svg>
)

// Customer feedback (chat with heart/star)
export const CustomerFeedbackIcon = ({ className = 'w-6 h-6' }: IconProps = {}) => (
  <svg viewBox="0 0 24 24" className={className} {...baseProps}>
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    <path d="m12 7 1.5 3 3.5.5-2.5 2.5.5 3.5-3-1.5-3 1.5.5-3.5L7 10.5l3.5-.5z" />
  </svg>
)

// In-room guide (book/info)
export const InRoomGuideIcon = ({ className = 'w-6 h-6' }: IconProps = {}) => (
  <svg viewBox="0 0 24 24" className={className} {...baseProps}>
    <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
    <path d="M9 7h6" />
    <path d="M9 11h6" />
  </svg>
)

// Social media
export const SocialMediaIcon = ({ className = 'w-6 h-6' }: IconProps = {}) => (
  <svg viewBox="0 0 24 24" className={className} {...baseProps}>
    <rect width="20" height="20" x="2" y="2" rx="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
)

// Hotel info
export const HotelInfoIcon = ({ className = 'w-6 h-6' }: IconProps = {}) => (
  <svg viewBox="0 0 24 24" className={className} {...baseProps}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 16v-4" />
    <path d="M12 8h.01" />
  </svg>
)

// Hotel rules (book)
export const HotelRulesIcon = ({ className = 'w-6 h-6' }: IconProps = {}) => (
  <svg viewBox="0 0 24 24" className={className} {...baseProps}>
    <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20" />
  </svg>
)

// Pets (paw)
export const PetsIcon = ({ className = 'w-6 h-6' }: IconProps = {}) => (
  <svg viewBox="0 0 24 24" className={className} {...baseProps}>
    <circle cx="11" cy="4" r="2" />
    <circle cx="18" cy="8" r="2" />
    <circle cx="4" cy="8" r="2" />
    <circle cx="14.8" cy="14.6" r="2" />
    <path d="M9 11.5a3.97 3.97 0 0 0-2.86 1.27c-.74.94-1.31 2.32-1.31 3.93C4.83 18.5 6 19 7 19c2 0 3-2 4-2s2 2 4 2c1 0 2.17-.5 2.17-2.3 0-1.61-.57-2.99-1.31-3.93A3.97 3.97 0 0 0 13 11.5h-4z" />
  </svg>
)

// Bar / Lounge
export const BarLoungeIcon = ({ className = 'w-6 h-6' }: IconProps = {}) => (
  <svg viewBox="0 0 24 24" className={className} {...baseProps}>
    <path d="M8 22h8" />
    <path d="M12 11v11" />
    <path d="m19 3-7 8-7-8Z" />
  </svg>
)

// Gym / Pool
export const GymPoolIcon = ({ className = 'w-6 h-6' }: IconProps = {}) => (
  <svg viewBox="0 0 24 24" className={className} {...baseProps}>
    <path d="M14.4 14.4 9.6 9.6" />
    <path d="M18.657 21.485a2 2 0 1 1-2.829-2.828l-1.767 1.768a2 2 0 1 1-2.829-2.829l6.364-6.364a2 2 0 1 1 2.829 2.829l-1.768 1.767a2 2 0 1 1 2.828 2.829z" />
    <path d="m21.5 21.5-1.4-1.4" />
    <path d="M3.9 3.9 2.5 2.5" />
    <path d="M6.404 12.768a2 2 0 1 1-2.829-2.829l1.768-1.767a2 2 0 1 1-2.828-2.829l2.828-2.828a2 2 0 1 1 2.829 2.828l1.767-1.768a2 2 0 1 1 2.829 2.829z" />
  </svg>
)

// Cleaning / Housekeeping
export const HousekeepingIcon = ({ className = 'w-6 h-6' }: IconProps = {}) => (
  <svg viewBox="0 0 24 24" className={className} {...baseProps}>
    <path d="M16 22 7 13l3-3 9 9-3 3Z" />
    <path d="M5 11 1 7l3-3 4 4" />
    <path d="m6 18 1 1" />
    <path d="m12 12 1 1" />
  </svg>
)

// Chat / Message
export const ChatIcon = ({ className = 'w-6 h-6' }: IconProps = {}) => (
  <svg viewBox="0 0 24 24" className={className} {...baseProps}>
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
)

// Arrows
export const ArrowRightIcon = ({ className = 'w-5 h-5' }: IconProps = {}) => (
  <svg viewBox="0 0 24 24" className={className} {...baseProps}>
    <path d="m9 18 6-6-6-6" />
  </svg>
)

export const ChevronDownIcon = ({ className = 'w-5 h-5' }: IconProps = {}) => (
  <svg viewBox="0 0 24 24" className={className} {...baseProps}>
    <path d="m6 9 6 6 6-6" />
  </svg>
)

export const ArrowLeftIcon = ({ className = 'w-6 h-6' }: IconProps = {}) => (
  <svg viewBox="0 0 24 24" className={className} {...baseProps}>
    <path d="m15 18-6-6 6-6" />
  </svg>
)

export const BackArrowIcon = ArrowLeftIcon

export const GlobeIcon = ({ className = 'w-4 h-4' }: IconProps = {}) => (
  <svg viewBox="0 0 24 24" className={className} {...baseProps}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
    <path d="M2 12h20" />
  </svg>
)

export const CloseIcon = ({ className = 'w-5 h-5' }: IconProps = {}) => (
  <svg viewBox="0 0 24 24" className={className} {...baseProps}>
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
)

export const SendIcon = ({ className = 'w-5 h-5' }: IconProps = {}) => (
  <svg viewBox="0 0 24 24" className={className} {...baseProps}>
    <path d="m22 2-7 20-4-9-9-4Z" />
    <path d="M22 2 11 13" />
  </svg>
)

export const SearchIcon = ({ className = 'w-4 h-4' }: IconProps = {}) => (
  <svg viewBox="0 0 24 24" className={className} {...baseProps}>
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.3-4.3" />
  </svg>
)

export const PhoneIcon = ({ className = 'w-5 h-5' }: IconProps = {}) => (
  <svg viewBox="0 0 24 24" className={className} {...baseProps}>
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
)

export const VideoIcon = ({ className = 'w-5 h-5' }: IconProps = {}) => (
  <svg viewBox="0 0 24 24" className={className} {...baseProps}>
    <path d="m22 8-6 4 6 4V8Z" />
    <rect width="14" height="12" x="2" y="6" rx="2" />
  </svg>
)

export const MoreIcon = ({ className = 'w-5 h-5' }: IconProps = {}) => (
  <svg viewBox="0 0 24 24" className={className} {...baseProps}>
    <circle cx="12" cy="12" r="1" fill="currentColor" />
    <circle cx="12" cy="5" r="1" fill="currentColor" />
    <circle cx="12" cy="19" r="1" fill="currentColor" />
  </svg>
)

export const PaperclipIcon = ({ className = 'w-5 h-5' }: IconProps = {}) => (
  <svg viewBox="0 0 24 24" className={className} {...baseProps}>
    <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 17.93 8.8l-8.58 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
  </svg>
)

export const ImageIcon = ({ className = 'w-5 h-5' }: IconProps = {}) => (
  <svg viewBox="0 0 24 24" className={className} {...baseProps}>
    <rect width="18" height="18" x="3" y="3" rx="2" />
    <circle cx="9" cy="9" r="2" />
    <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
  </svg>
)

export const SmileIcon = ({ className = 'w-5 h-5' }: IconProps = {}) => (
  <svg viewBox="0 0 24 24" className={className} {...baseProps}>
    <circle cx="12" cy="12" r="10" />
    <path d="M8 14s1.5 2 4 2 4-2 4-2" />
    <line x1="9" x2="9.01" y1="9" y2="9" />
    <line x1="15" x2="15.01" y1="9" y2="9" />
  </svg>
)

export const PlusIcon = ({ className = 'w-5 h-5' }: IconProps = {}) => (
  <svg viewBox="0 0 24 24" className={className} {...baseProps}>
    <path d="M5 12h14" />
    <path d="M12 5v14" />
  </svg>
)

export const HotelIcon = ({ className = 'w-5 h-5' }: IconProps = {}) => (
  <svg viewBox="0 0 24 24" className={className} {...baseProps}>
    <path d="M10 22v-6.57" />
    <path d="M12 11h.01" />
    <path d="M12 7h.01" />
    <path d="M14 15.43V22" />
    <path d="M15 16a5 5 0 0 0-6 0" />
    <path d="M16 11h.01" />
    <path d="M16 7h.01" />
    <path d="M8 11h.01" />
    <path d="M8 7h.01" />
    <rect x="4" y="2" width="16" height="20" rx="2" />
  </svg>
)

export const SparkleIcon = ({ className = 'w-5 h-5' }: IconProps = {}) => (
  <svg viewBox="0 0 24 24" className={className} {...baseProps}>
    <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
  </svg>
)

// ----- Chat-specific extras --------------------------------------------------

export const CheckIcon = ({ className = 'w-4 h-4' }: IconProps = {}) => (
  <svg viewBox="0 0 24 24" className={className} {...baseProps}>
    <path d="M20 6 9 17l-5-5" />
  </svg>
)

export const CheckDoubleIcon = ({ className = 'w-4 h-4' }: IconProps = {}) => (
  <svg viewBox="0 0 24 24" className={className} {...baseProps}>
    <path d="m2 12 5 5L18 6" />
    <path d="m11 17 6.5-6.5" />
    <path d="M16 12.5 22 6" />
  </svg>
)

export const ClockIcon = ({ className = 'w-4 h-4' }: IconProps = {}) => (
  <svg viewBox="0 0 24 24" className={className} {...baseProps}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v6l4 2" />
  </svg>
)

export const AlertIcon = ({ className = 'w-4 h-4' }: IconProps = {}) => (
  <svg viewBox="0 0 24 24" className={className} {...baseProps}>
    <path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3z" />
    <path d="M12 9v4" />
    <path d="M12 17h.01" />
  </svg>
)

export const SignalIcon = ({ className = 'w-4 h-4' }: IconProps = {}) => (
  <svg viewBox="0 0 24 24" className={className} {...baseProps}>
    <path d="M2 20h.01" />
    <path d="M7 20v-4" />
    <path d="M12 20v-8" />
    <path d="M17 20V8" />
    <path d="M22 4v16" />
  </svg>
)

export const SignalOffIcon = ({ className = 'w-4 h-4' }: IconProps = {}) => (
  <svg viewBox="0 0 24 24" className={className} {...baseProps}>
    <path d="m2 2 20 20" />
    <path d="M5 12.55a11 11 0 0 1 5.17-2.39" />
    <path d="M1.42 9a16 16 0 0 1 4.7-2.88" />
    <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
    <path d="M12 20h.01" />
  </svg>
)

export const TemplateIcon = ({ className = 'w-4 h-4' }: IconProps = {}) => (
  <svg viewBox="0 0 24 24" className={className} {...baseProps}>
    <rect width="18" height="7" x="3" y="3" rx="1" />
    <rect width="9" height="7" x="3" y="14" rx="1" />
    <rect width="5" height="7" x="16" y="14" rx="1" />
  </svg>
)

export const FilterIcon = ({ className = 'w-4 h-4' }: IconProps = {}) => (
  <svg viewBox="0 0 24 24" className={className} {...baseProps}>
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
  </svg>
)

export const BellIcon = ({ className = 'w-5 h-5' }: IconProps = {}) => (
  <svg viewBox="0 0 24 24" className={className} {...baseProps}>
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
  </svg>
)

export const BellOffIcon = ({ className = 'w-5 h-5' }: IconProps = {}) => (
  <svg viewBox="0 0 24 24" className={className} {...baseProps}>
    <path d="M8.7 3A6 6 0 0 1 18 8a21.3 21.3 0 0 0 .6 5" />
    <path d="M17 17H3s3-2 3-9a4.7 4.7 0 0 1 .3-1.7" />
    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    <path d="m2 2 20 20" />
  </svg>
)

export const TranslateBubbleIcon = ({ className = 'w-4 h-4' }: IconProps = {}) => (
  <svg viewBox="0 0 24 24" className={className} {...baseProps}>
    <path d="M5 8h6" />
    <path d="M8 5v3" />
    <path d="M5 11s1 5 6 5 6-5 6-5" />
    <path d="m13 18 4 4 4-4" />
    <path d="M21 22v-9" />
  </svg>
)

export const RefreshIcon = ({ className = 'w-4 h-4' }: IconProps = {}) => (
  <svg viewBox="0 0 24 24" className={className} {...baseProps}>
    <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
    <path d="M21 3v5h-5" />
    <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
    <path d="M3 21v-5h5" />
  </svg>
)

export const UserCircleIcon = ({ className = 'w-5 h-5' }: IconProps = {}) => (
  <svg viewBox="0 0 24 24" className={className} {...baseProps}>
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="10" r="3" />
    <path d="M7 20.7a8 8 0 0 1 10 0" />
  </svg>
)

export const CalendarIcon = ({ className = 'w-4 h-4' }: IconProps = {}) => (
  <svg viewBox="0 0 24 24" className={className} {...baseProps}>
    <rect width="18" height="18" x="3" y="4" rx="2" />
    <path d="M16 2v4" />
    <path d="M8 2v4" />
    <path d="M3 10h18" />
  </svg>
)

export const TagIcon = ({ className = 'w-4 h-4' }: IconProps = {}) => (
  <svg viewBox="0 0 24 24" className={className} {...baseProps}>
    <path d="M12.59 13.41 20 6 14 6V0L12.59 13.41z" />
    <path d="M2 14a8 8 0 0 0 8 8l1.41-1.41a1 1 0 0 0 .29-.71V14H2z" />
  </svg>
)

export const VolumeIcon = ({ className = 'w-4 h-4' }: IconProps = {}) => (
  <svg viewBox="0 0 24 24" className={className} {...baseProps}>
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
  </svg>
)

export const VolumeOffIcon = ({ className = 'w-4 h-4' }: IconProps = {}) => (
  <svg viewBox="0 0 24 24" className={className} {...baseProps}>
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <line x1="22" x2="16" y1="9" y2="15" />
    <line x1="16" x2="22" y1="9" y2="15" />
  </svg>
)

// Edit / pencil
export const EditIcon = ({ className = 'w-4 h-4' }: IconProps = {}) => (
  <svg viewBox="0 0 24 24" className={className} {...baseProps}>
    <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" />
  </svg>
)

// Trash / delete
export const TrashIcon = ({ className = 'w-4 h-4' }: IconProps = {}) => (
  <svg viewBox="0 0 24 24" className={className} {...baseProps}>
    <path d="M3 6h18" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <path d="M10 11v6" />
    <path d="M14 11v6" />
  </svg>
)

// Settings / gear
export const SettingsIcon = ({ className = 'w-4 h-4' }: IconProps = {}) => (
  <svg viewBox="0 0 24 24" className={className} {...baseProps}>
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
)

// Eye (visibility / preview)
export const EyeIcon = ({ className = 'w-4 h-4' }: IconProps = {}) => (
  <svg viewBox="0 0 24 24" className={className} {...baseProps}>
    <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
    <circle cx="12" cy="12" r="3" />
  </svg>
)

// Drag handle (grip)
export const GripIcon = ({ className = 'w-4 h-4' }: IconProps = {}) => (
  <svg viewBox="0 0 24 24" className={className} {...baseProps}>
    <circle cx="9" cy="5" r="1" fill="currentColor" />
    <circle cx="9" cy="12" r="1" fill="currentColor" />
    <circle cx="9" cy="19" r="1" fill="currentColor" />
    <circle cx="15" cy="5" r="1" fill="currentColor" />
    <circle cx="15" cy="12" r="1" fill="currentColor" />
    <circle cx="15" cy="19" r="1" fill="currentColor" />
  </svg>
)

// Image placeholder for empty image_url state
export const ImagePlaceholderIcon = ({ className = 'w-5 h-5' }: IconProps = {}) => (
  <svg viewBox="0 0 24 24" className={className} {...baseProps}>
    <rect width="18" height="18" x="3" y="3" rx="2" />
    <circle cx="9" cy="9" r="2" />
    <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
  </svg>
)

// Services management — concierge bell with sparkles, distinct from
// FrontOfficeIcon / RoomServiceIcon used elsewhere.
export const ServicesIcon = ({ className = 'w-4 h-4' }: IconProps = {}) => (
  <svg viewBox="0 0 24 24" className={className} {...baseProps}>
    <rect x="3" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="3" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" />
    <rect x="14" y="14" width="7" height="7" rx="1.5" />
  </svg>
)
