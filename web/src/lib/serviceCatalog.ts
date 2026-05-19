import {
  AirportShuttleIcon,
  BarLoungeIcon,
  CustomerFeedbackIcon,
  FacilitiesIcon,
  FrontOfficeIcon,
  GymPoolIcon,
  HotelInfoIcon,
  HotelRulesIcon,
  HousekeepingIcon,
  InRoomDiningIcon,
  InRoomGuideIcon,
  LaundryIcon,
  MotorbikeIcon,
  PetsIcon,
  RestaurantIcon,
  RoomServiceIcon,
  SocialMediaIcon,
  SpaIcon,
  SpecialOfferIcon,
  TourTicketIcon,
  TranslateIcon,
} from '../components/icons/ServiceIcons'
import type { ServiceTone } from '../components/ServiceItem'
import type { ServiceLanguage } from '../api'

/**
 * The icon catalog is a closed set of 21 SVG components shipped with the
 * frontend. The backend stores only the **key** (e.g. "spa") in `services.icon_url`
 * — that field used to take an arbitrary URL but we repurpose it here so
 * admins don't have to host their own asset somewhere just to pick a tile.
 *
 * `tone` is the default colour wash used in the customer card grid; the
 * admin can override it later but the preset-fill flow needs a sensible
 * default to seed the picker.
 */
export interface IconCatalogEntry {
  /** Stable identifier persisted to the backend (in `services.icon_url`). */
  key: string
  /** Vietnamese label shown in the admin icon picker. */
  label: string
  /** Default tone used when this icon is first selected. */
  tone: ServiceTone
  /** Renderer — every entry uses a fixed React component so we don't ship
   * arbitrary URLs to customers. */
  Icon: (props: { className?: string }) => React.JSX.Element
}

export const ICON_CATALOG: IconCatalogEntry[] = [
  { key: 'front-office', label: 'Lễ tân', tone: 'green', Icon: FrontOfficeIcon },
  { key: 'room-service', label: 'Dịch vụ phòng', tone: 'purple', Icon: RoomServiceIcon },
  { key: 'housekeeping', label: 'Dọn phòng', tone: 'amber', Icon: HousekeepingIcon },
  { key: 'restaurant', label: 'Nhà hàng', tone: 'red', Icon: RestaurantIcon },
  { key: 'in-room-dining', label: 'Ăn tại phòng', tone: 'orange', Icon: InRoomDiningIcon },
  { key: 'bar-lounge', label: 'Bar / Lounge', tone: 'cyan', Icon: BarLoungeIcon },
  { key: 'spa', label: 'Spa & Massage', tone: 'emerald', Icon: SpaIcon },
  { key: 'gym-pool', label: 'Gym & Hồ bơi', tone: 'teal', Icon: GymPoolIcon },
  { key: 'facilities', label: 'Tiện ích', tone: 'indigo', Icon: FacilitiesIcon },
  { key: 'laundry', label: 'Giặt ủi', tone: 'rose', Icon: LaundryIcon },
  { key: 'motorbike', label: 'Thuê xe máy', tone: 'indigo', Icon: MotorbikeIcon },
  { key: 'airport-transfer', label: 'Đưa đón sân bay', tone: 'sky', Icon: AirportShuttleIcon },
  { key: 'tour', label: 'Tour & Vé', tone: 'violet', Icon: TourTicketIcon },
  { key: 'special-offer', label: 'Ưu đãi đặc biệt', tone: 'pink', Icon: SpecialOfferIcon },
  { key: 'feedback', label: 'Góp ý', tone: 'fuchsia', Icon: CustomerFeedbackIcon },
  { key: 'in-room-guide', label: 'Hướng dẫn tiện ích', tone: 'blue', Icon: InRoomGuideIcon },
  { key: 'hotel-info', label: 'Thông tin khách sạn', tone: 'lime', Icon: HotelInfoIcon },
  { key: 'hotel-rules', label: 'Nội quy', tone: 'slate', Icon: HotelRulesIcon },
  { key: 'pets', label: 'Thú cưng', tone: 'yellow', Icon: PetsIcon },
  { key: 'social', label: 'Mạng xã hội', tone: 'pink', Icon: SocialMediaIcon },
  { key: 'translate', label: 'Hướng dẫn dịch', tone: 'blue', Icon: TranslateIcon },
]

const ICON_BY_KEY = new Map(ICON_CATALOG.map((e) => [e.key, e]))

/**
 * Look up an icon entry by its stored key. Returns `undefined` for legacy
 * URL-style values so callers can fall back to rendering a plain `<img>`.
 */
export function getIconEntry(key: string | null | undefined): IconCatalogEntry | undefined {
  if (!key) return undefined
  return ICON_BY_KEY.get(key)
}

/**
 * `services.icon_url` historically accepted free-form URLs. Anything starting
 * with `http(s)://` or `/` is treated as such — every other string is looked
 * up in the catalog above. This keeps existing rows working while the new
 * picker writes catalog keys.
 */
export function isIconUrl(value: string | null | undefined): boolean {
  if (!value) return false
  return /^(https?:\/\/|\/)/.test(value)
}

// ---------------------------------------------------------------------------
// Service presets — quick-start templates the admin can pick to seed a new
// service with a sensible icon, tone, multi-language title, and default
// markdown description.
// ---------------------------------------------------------------------------

export interface ServicePresetTranslation {
  language: ServiceLanguage
  title: string
  description: string
}

export interface ServicePreset {
  /** Stable id for picker state. */
  id: string
  /** Catalog key — drives both the icon + the default tone. */
  iconKey: string
  /** Header label in the picker (Vietnamese). */
  label: string
  /** One-line summary explaining what the preset is for. */
  hint: string
  /** When `food_order`, guests open the menu ordering page instead of a modal. */
  serviceType?: 'content' | 'food_order'
  /** Pre-filled translations. Vietnamese + English are always included so
   * the customer view falls back gracefully. */
  translations: ServicePresetTranslation[]
}

/**
 * Curated catalogue of common hotel services. Each entry is a starting
 * point — the admin tweaks operating hours, prices, and contact details
 * before publishing. Markdown is intentionally lightweight (headings + lists
 * + the occasional bold word) so the customer modal renders cleanly even on
 * a phone.
 */
export const SERVICE_PRESETS: ServicePreset[] = [
  {
    id: 'food-order',
    iconKey: 'in-room-dining',
    label: 'Đặt đồ ăn & nước uống',
    hint: 'Menu online — khách chọn món, admin nhận đơn',
    serviceType: 'food_order',
    translations: [
      {
        language: 'vi',
        title: 'Đặt đồ ăn & nước uống',
        description:
          '## Đặt món tận phòng\n\nChọn món từ menu, điền số phòng và gửi đơn. Nhân viên sẽ xác nhận và giao đến phòng của quý khách.\n\n> Thời gian phục vụ: **6:00 – 22:30** hàng ngày',
      },
      {
        language: 'en',
        title: 'Food & Drinks Order',
        description:
          '## In-room dining\n\nBrowse the menu, enter your room number, and submit your order. Our team will confirm and deliver to your room.\n\n> Service hours: **6:00 AM – 10:30 PM** daily',
      },
    ],
  },
  {
    id: 'front-office',
    iconKey: 'front-office',
    label: 'Lễ tân 24/7',
    hint: 'Quầy lễ tân, hỗ trợ check-in / check-out, đổi phòng',
    translations: [
      {
        language: 'vi',
        title: 'Lễ tân',
        description:
          '## Quầy lễ tân 24/7\n\nLễ tân luôn sẵn sàng hỗ trợ quý khách:\n\n- **Check-in:** từ 14:00\n- **Check-out:** trước 12:00\n- Đổi phòng, gửi đồ, đặt báo thức\n- Thông tin du lịch, đặt taxi\n\n> Liên hệ: bấm phím **0** trên điện thoại phòng',
      },
      {
        language: 'en',
        title: 'Front Office',
        description:
          '## 24/7 Front Office\n\nOur reception team is here to help:\n\n- **Check-in:** from 2:00 PM\n- **Check-out:** before 12:00 PM\n- Room changes, luggage storage, wake-up calls\n- Travel information, taxi booking\n\n> Dial **0** on your room phone for assistance.',
      },
    ],
  },
  {
    id: 'room-service',
    iconKey: 'room-service',
    label: 'Dịch vụ phòng',
    hint: 'Đồ ăn / nước uống đem lên phòng',
    translations: [
      {
        language: 'vi',
        title: 'Dịch vụ phòng',
        description:
          '## Dịch vụ phòng\n\nMenu phục vụ tận phòng cả ngày:\n\n- **Bữa sáng:** 6:00 - 10:30\n- **Bữa trưa & tối:** 11:00 - 22:30\n- **Đêm khuya:** 22:30 - 6:00 (menu rút gọn)\n\nĐặt món qua ứng dụng phòng hoặc gọi nội bộ **3**.',
      },
      {
        language: 'en',
        title: 'Room Service',
        description:
          '## In-Room Dining\n\nFull menu delivered to your door:\n\n- **Breakfast:** 6:00 AM - 10:30 AM\n- **Lunch & Dinner:** 11:00 AM - 10:30 PM\n- **Late night:** 10:30 PM - 6:00 AM (limited menu)\n\nOrder via the in-room tablet or dial **3**.',
      },
    ],
  },
  {
    id: 'housekeeping',
    iconKey: 'housekeeping',
    label: 'Dọn phòng',
    hint: 'Dọn phòng hằng ngày, thay khăn, bổ sung amenities',
    translations: [
      {
        language: 'vi',
        title: 'Dọn phòng',
        description:
          '## Dọn phòng\n\n- **Dọn hằng ngày:** 9:00 - 16:00\n- Thay khăn, bổ sung amenities miễn phí\n- Yêu cầu thêm gối / chăn / nước uống\n\nTreo bảng *"Vui lòng dọn phòng"* hoặc gọi lễ tân.',
      },
      {
        language: 'en',
        title: 'Housekeeping',
        description:
          '## Housekeeping\n\n- **Daily service:** 9:00 AM - 4:00 PM\n- Towel change & complimentary amenities refill\n- Extra pillows, blankets, or water on request\n\nHang the *"Please make up the room"* sign or call reception.',
      },
    ],
  },
  {
    id: 'restaurant',
    iconKey: 'restaurant',
    label: 'Nhà hàng',
    hint: 'Nhà hàng phục vụ tại sảnh, buffet sáng',
    translations: [
      {
        language: 'vi',
        title: 'Nhà hàng',
        description:
          '## Nhà hàng\n\nPhục vụ ẩm thực Á - Âu tại tầng trệt:\n\n- **Buffet sáng:** 6:30 - 10:00\n- **À la carte trưa / tối:** 11:30 - 22:00\n- Đặt bàn qua lễ tân để giữ chỗ\n\n> Trẻ dưới 6 tuổi miễn phí buffet sáng.',
      },
      {
        language: 'en',
        title: 'Restaurant',
        description:
          '## Restaurant\n\nAsian and European cuisine on the ground floor:\n\n- **Breakfast buffet:** 6:30 AM - 10:00 AM\n- **À la carte lunch & dinner:** 11:30 AM - 10:00 PM\n- Reserve a table through reception\n\n> Children under 6 dine free at breakfast.',
      },
    ],
  },
  {
    id: 'in-room-dining',
    iconKey: 'in-room-dining',
    label: 'Ăn tại phòng',
    hint: 'Set buffet sáng / bữa nhẹ tận phòng',
    translations: [
      {
        language: 'vi',
        title: 'Ăn tại phòng',
        description:
          '## Ăn tại phòng\n\n- Đặt qua menu để trên bàn hoặc gọi nội bộ **3**\n- Phụ thu phục vụ phòng: **10%** giá menu\n- Trả khay sau khi dùng tại bàn ngoài hành lang',
      },
      {
        language: 'en',
        title: 'In-Room Dining',
        description:
          '## In-Room Dining\n\n- Order from the in-room menu or dial **3**\n- A **10%** service charge applies\n- Leave the tray on the corridor table after dining',
      },
    ],
  },
  {
    id: 'bar-lounge',
    iconKey: 'bar-lounge',
    label: 'Bar & Lounge',
    hint: 'Quầy bar, lounge, happy hour',
    translations: [
      {
        language: 'vi',
        title: 'Bar & Lounge',
        description:
          '## Sky Bar\n\n- **Mở cửa:** 16:00 - 24:00\n- **Happy hour:** 17:00 - 19:00 (giảm 30%)\n- Cocktail signature, wine list quốc tế\n- Live music tối thứ 6 & 7',
      },
      {
        language: 'en',
        title: 'Bar & Lounge',
        description:
          '## Sky Bar\n\n- **Open:** 4:00 PM - 12:00 AM\n- **Happy hour:** 5:00 PM - 7:00 PM (30% off)\n- Signature cocktails & international wine list\n- Live music on Friday & Saturday nights',
      },
    ],
  },
  {
    id: 'spa',
    iconKey: 'spa',
    label: 'Spa & Massage',
    hint: 'Liệu trình thư giãn, đặt lịch',
    translations: [
      {
        language: 'vi',
        title: 'Spa & Massage',
        description:
          '## Spa cao cấp\n\n- **Mở cửa:** 9:00 - 22:00\n- Massage toàn thân, body scrub, xông hơi\n- Đặt lịch trước ít nhất 60 phút\n- Khách lưu trú giảm **15%**\n\nLiên hệ lễ tân để đặt lịch.',
      },
      {
        language: 'en',
        title: 'Spa & Massage',
        description:
          '## Premium Spa\n\n- **Open:** 9:00 AM - 10:00 PM\n- Body massage, scrub, steam & sauna\n- Reservations at least 60 minutes in advance\n- **15% off** for in-house guests\n\nContact reception to book.',
      },
    ],
  },
  {
    id: 'gym-pool',
    iconKey: 'gym-pool',
    label: 'Gym & Hồ bơi',
    hint: 'Phòng tập, hồ bơi, giờ mở',
    translations: [
      {
        language: 'vi',
        title: 'Gym & Hồ bơi',
        description:
          '## Gym & Hồ bơi\n\n- **Gym:** 5:00 - 23:00, miễn phí cho khách lưu trú\n- **Hồ bơi:** 6:00 - 21:00\n- Khăn tắm và nước uống miễn phí\n- Trẻ em dưới 12 tuổi cần có người lớn đi cùng',
      },
      {
        language: 'en',
        title: 'Gym & Pool',
        description:
          '## Gym & Pool\n\n- **Gym:** 5:00 AM - 11:00 PM, free for in-house guests\n- **Pool:** 6:00 AM - 9:00 PM\n- Complimentary towels & drinking water\n- Children under 12 must be accompanied by an adult',
      },
    ],
  },
  {
    id: 'laundry',
    iconKey: 'laundry',
    label: 'Giặt ủi',
    hint: 'Giặt ủi tự chọn, giặt nhanh',
    translations: [
      {
        language: 'vi',
        title: 'Giặt ủi',
        description:
          '## Giặt ủi\n\n- Bỏ đồ vào túi giặt sẵn trong tủ\n- **Trước 9:00:** trả trong ngày\n- **Sau 9:00:** trả sáng hôm sau\n- Phụ phí giặt nhanh **+50%** (4 giờ)',
      },
      {
        language: 'en',
        title: 'Laundry',
        description:
          '## Laundry\n\n- Use the laundry bag in your closet\n- **Before 9:00 AM:** same-day return\n- **After 9:00 AM:** next morning\n- Express service (4 hours): **+50%** surcharge',
      },
    ],
  },
  {
    id: 'airport-transfer',
    iconKey: 'airport-transfer',
    label: 'Đưa đón sân bay',
    hint: 'Xe đưa đón / shuttle sân bay',
    translations: [
      {
        language: 'vi',
        title: 'Đưa đón sân bay',
        description:
          '## Đưa đón sân bay\n\nDịch vụ xe riêng đưa đón theo lịch chuyến bay:\n\n- Sedan 4 chỗ: liên hệ giá\n- SUV 7 chỗ: liên hệ giá\n- Vui lòng đặt **trước ít nhất 6 giờ**\n\nLiên hệ lễ tân kèm số chuyến bay & giờ.',
      },
      {
        language: 'en',
        title: 'Airport Transfer',
        description:
          '## Airport Transfer\n\nPrivate transfer aligned with your flight schedule:\n\n- 4-seat sedan: ask reception for pricing\n- 7-seat SUV: ask reception for pricing\n- Please book **at least 6 hours in advance**\n\nContact reception with your flight number and arrival time.',
      },
    ],
  },
  {
    id: 'motorbike',
    iconKey: 'motorbike',
    label: 'Thuê xe máy',
    hint: 'Thuê xe máy, ô tô',
    translations: [
      {
        language: 'vi',
        title: 'Thuê xe máy',
        description:
          '## Thuê xe máy\n\n- **Xe số:** 150,000đ / ngày\n- **Xe tay ga:** 200,000đ / ngày\n- Đã bao gồm 1 mũ bảo hiểm\n- Cần đặt cọc CMND / hộ chiếu\n\nLiên hệ lễ tân để xem xe có sẵn.',
      },
      {
        language: 'en',
        title: 'Motorbike Rental',
        description:
          '## Motorbike Rental\n\n- **Manual:** 150,000 VND / day\n- **Automatic scooter:** 200,000 VND / day\n- One helmet included\n- ID / passport deposit required\n\nAsk reception about availability.',
      },
    ],
  },
  {
    id: 'tour',
    iconKey: 'tour',
    label: 'Tour & Vé',
    hint: 'Đặt tour, vé tham quan',
    translations: [
      {
        language: 'vi',
        title: 'Tour & Vé',
        description:
          '## Tour & Vé tham quan\n\n- City tour nửa ngày & cả ngày\n- Vé tham quan các điểm nổi bật trong thành phố\n- Tour ngoài thành phố (1-3 ngày)\n- Hướng dẫn viên tiếng Anh / Việt\n\nLễ tân tư vấn miễn phí.',
      },
      {
        language: 'en',
        title: 'Tours & Tickets',
        description:
          '## Tours & Tickets\n\n- Half-day & full-day city tours\n- Tickets to popular attractions\n- Multi-day excursions (1-3 days)\n- English / Vietnamese-speaking guides\n\nFree consultation at reception.',
      },
    ],
  },
  {
    id: 'special-offer',
    iconKey: 'special-offer',
    label: 'Ưu đãi & Thành viên',
    hint: 'Ưu đãi đặc biệt, chương trình thành viên',
    translations: [
      {
        language: 'vi',
        title: 'Ưu đãi đặc biệt',
        description:
          '## Ưu đãi đặc biệt\n\n- Giảm **10%** F&B cho khách lưu trú từ 3 đêm\n- Tặng **1 lần massage 30 phút** khi đặt 5 đêm\n- Đăng ký thành viên để nhận ưu đãi sinh nhật\n\nLiên hệ lễ tân để biết thêm.',
      },
      {
        language: 'en',
        title: 'Special Offers',
        description:
          '## Special Offers\n\n- **10% off** dining for stays of 3+ nights\n- **Free 30-minute massage** with a 5-night stay\n- Sign up for our membership for birthday perks\n\nAsk reception for details.',
      },
    ],
  },
  {
    id: 'hotel-info',
    iconKey: 'hotel-info',
    label: 'Thông tin khách sạn',
    hint: 'Giờ giấc, wifi, dịch vụ chung',
    translations: [
      {
        language: 'vi',
        title: 'Thông tin khách sạn',
        description:
          '## Thông tin chung\n\n- **Wifi miễn phí:** SSID `Hotel-Guest` · password tại lễ tân\n- **Bữa sáng:** 6:30 - 10:00 tại nhà hàng tầng trệt\n- **Bãi đỗ xe:** miễn phí cho khách\n- **Y tế:** liên hệ lễ tân, có hỗ trợ 24/7',
      },
      {
        language: 'en',
        title: 'Hotel Information',
        description:
          '## General Information\n\n- **Free Wi-Fi:** SSID `Hotel-Guest` · password at reception\n- **Breakfast:** 6:30 AM - 10:00 AM, ground-floor restaurant\n- **Parking:** complimentary for guests\n- **Medical assistance:** 24/7 via reception',
      },
    ],
  },
  {
    id: 'hotel-rules',
    iconKey: 'hotel-rules',
    label: 'Nội quy',
    hint: 'Nội quy chung, an toàn',
    translations: [
      {
        language: 'vi',
        title: 'Nội quy khách sạn',
        description:
          '## Nội quy\n\n- Giờ yên lặng: **22:00 - 7:00**\n- Cấm hút thuốc trong phòng (phụ phí 2,000,000đ)\n- Khách viếng cần đăng ký tại lễ tân\n- Vui lòng tắt thiết bị điện khi ra khỏi phòng',
      },
      {
        language: 'en',
        title: 'Hotel Rules',
        description:
          '## House Rules\n\n- Quiet hours: **10:00 PM - 7:00 AM**\n- No smoking in rooms (2,000,000 VND fine)\n- Visitors must register at reception\n- Please turn off appliances when leaving the room',
      },
    ],
  },
  {
    id: 'feedback',
    iconKey: 'feedback',
    label: 'Góp ý',
    hint: 'Form góp ý, đánh giá',
    translations: [
      {
        language: 'vi',
        title: 'Góp ý của quý khách',
        description:
          '## Chúng tôi muốn lắng nghe\n\nMọi góp ý giúp chúng tôi phục vụ tốt hơn:\n\n- Trò chuyện trực tiếp qua nút chat\n- Email: feedback@hotel.com\n- Đánh giá trên Google / TripAdvisor\n\n> Cảm ơn quý khách đã chọn lưu trú cùng chúng tôi.',
      },
      {
        language: 'en',
        title: 'Customer Feedback',
        description:
          '## We Value Your Feedback\n\nYour feedback helps us serve you better:\n\n- Use the chat button to talk to us\n- Email: feedback@hotel.com\n- Review us on Google / TripAdvisor\n\n> Thank you for choosing to stay with us.',
      },
    ],
  },
  {
    id: 'in-room-guide',
    iconKey: 'in-room-guide',
    label: 'Hướng dẫn tiện ích phòng',
    hint: 'Hướng dẫn dùng điều hoà, TV, két',
    translations: [
      {
        language: 'vi',
        title: 'Hướng dẫn tiện ích phòng',
        description:
          '## Hướng dẫn tiện ích phòng\n\n- **Điều hoà:** điều khiển trên đầu giường\n- **TV thông minh:** Netflix / YouTube khả dụng\n- **Két sắt:** đặt mã 4 số · ấn `#` để khoá\n- **Bình đun siêu tốc & trà cà phê:** trong tủ\n\nLiên hệ lễ tân nếu có thắc mắc.',
      },
      {
        language: 'en',
        title: 'In-Room Guide',
        description:
          '## In-Room Guide\n\n- **AC:** bedside remote\n- **Smart TV:** Netflix / YouTube available\n- **Safe:** set a 4-digit code · press `#` to lock\n- **Kettle, tea & coffee:** in the cabinet\n\nReception is happy to help.',
      },
    ],
  },
  {
    id: 'pets',
    iconKey: 'pets',
    label: 'Thú cưng',
    hint: 'Chính sách thú cưng',
    translations: [
      {
        language: 'vi',
        title: 'Thú cưng',
        description:
          '## Chính sách thú cưng\n\n- Cho phép thú cưng nhỏ (dưới 10kg)\n- Phụ phí vệ sinh **300,000đ / đêm**\n- Cần thông báo trước khi đặt phòng\n- Không được để thú cưng một mình trong phòng',
      },
      {
        language: 'en',
        title: 'Pets',
        description:
          '## Pet Policy\n\n- Small pets allowed (under 10 kg)\n- Cleaning fee: **300,000 VND / night**\n- Please notify us when booking\n- Pets cannot be left alone in the room',
      },
    ],
  },
  {
    id: 'social',
    iconKey: 'social',
    label: 'Mạng xã hội',
    hint: 'Facebook, Instagram, TikTok',
    translations: [
      {
        language: 'vi',
        title: 'Theo dõi chúng tôi',
        description:
          '## Mạng xã hội\n\n- [Facebook](https://facebook.com)\n- [Instagram](https://instagram.com)\n- [TikTok](https://tiktok.com)\n\nGắn thẻ chúng tôi khi đăng ảnh — biết đâu sẽ được tặng quà nhỏ!',
      },
      {
        language: 'en',
        title: 'Follow Us',
        description:
          '## Social Media\n\n- [Facebook](https://facebook.com)\n- [Instagram](https://instagram.com)\n- [TikTok](https://tiktok.com)\n\nTag us in your photos for a chance at a small surprise!',
      },
    ],
  },
]
