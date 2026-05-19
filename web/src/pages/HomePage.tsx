import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getHotels } from '../api'
import type { Hotel } from '../api'
import { HeroBanner } from '../components/HeroBanner'
import { HotelCard } from '../components/HotelCard'
import { ServicesGrid } from '../components/ServicesGrid'
import { ChatButton } from '../components/ChatButton'
import { ChatWindow } from '../components/ChatWindow'
import { TopHeader } from '../components/TopHeader'
import { useAuth } from '../hooks/useAuth'

export function HomePage() {
  const navigate = useNavigate()
  const auth = useAuth()
  const [hotels, setHotels] = useState<Hotel[]>([])
  const [, setLoading] = useState(true)
  const [lang, setLang] = useState<'VN' | 'EN'>('VN')
  const [chatOpen, setChatOpen] = useState(false)

  useEffect(() => {
    async function loadHotels() {
      try {
        const data = await getHotels()
        setHotels(data)
      } catch (err) {
        console.error('Failed to load hotels:', err)
      } finally {
        setLoading(false)
      }
    }
    loadHotels()
  }, [])

  const handleHotelClick = (hotel: Hotel) => {
    navigate(`/hotel/${hotel.slug}`)
  }

  const handleServiceClick = (service: string) => {
    console.log(`Service clicked: ${service}`)
  }

  // Pick a hotel to open the chat with — first hotel by default
  const featuredHotel = hotels[0] ?? null

  return (
    <div className="min-h-screen bg-background-warm">
      {/* Top header with greeting + language switcher */}
      <TopHeader
        greeting={lang === 'VN' ? 'Xin chào!' : 'Hello!'}
        subtitle={
          lang === 'VN' ? 'Chào mừng quý khách đến với khách sạn' : 'Welcome to our hotel services'
        }
        lang={lang}
        onLangChange={setLang}
      />

      <main className="px-4 sm:px-8 lg:px-16 xl:px-20 py-8 sm:py-12">
        <div className="max-w-6xl mx-auto flex flex-col gap-8 sm:gap-10">
          {/* Hero Banner */}
          <HeroBanner />

          {/* Hotel List or Default Card */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[15px] font-semibold text-text">
                {lang === 'VN' ? 'Cơ sở khách sạn' : 'Hotels'}
              </h2>
              <AdminLink lang={lang} auth={auth} onNavigate={navigate} />
            </div>
            {hotels.length > 0 ? (
              <div className="space-y-3">
                {hotels.map((hotel) => (
                  <HotelCard
                    key={hotel.id}
                    name={hotel.name}
                    address={hotel.address || ''}
                    onClick={() => handleHotelClick(hotel)}
                  />
                ))}
              </div>
            ) : (
              <HotelCard
                name="Grand Luxury Hotel & Spa"
                address="123 Đường ABC, Quận 1, TP.HCM"
                onClick={() => {}}
              />
            )}
          </div>

          {/* Services Grid */}
          <ServicesGrid onServiceClick={handleServiceClick} />
        </div>
      </main>

      {/* Floating chat button */}
      <ChatButton onClick={() => featuredHotel && setChatOpen(true)} badge={null} />

      {/* Chat Window */}
      {chatOpen && featuredHotel ? (
        <ChatWindow
          hotelId={featuredHotel.id}
          hotelName={featuredHotel.name}
          onClose={() => setChatOpen(false)}
        />
      ) : null}
    </div>
  )
}

/**
 * Inline link in the hotels section that points to the right destination
 * for the current viewer:
 *
 *  - Logged-out → /login
 *  - System admin → /admin (root dashboard)
 *  - Hotel user → /admin/{their-hotel}/chat (their inbox)
 */
function AdminLink({
  lang,
  auth,
  onNavigate,
}: {
  lang: 'VN' | 'EN'
  auth: ReturnType<typeof useAuth>
  onNavigate: (path: string) => void
}) {
  if (!auth) {
    return (
      <button
        onClick={() => onNavigate('/login')}
        className="text-[12.5px] font-medium text-primary hover:underline cursor-pointer"
      >
        {lang === 'VN' ? 'Đăng nhập quản trị →' : 'Admin login →'}
      </button>
    )
  }

  if (auth.user.scope === 'system') {
    return (
      <button
        onClick={() => onNavigate('/admin')}
        className="text-[12.5px] font-medium text-primary hover:underline cursor-pointer"
      >
        {lang === 'VN' ? 'Quản trị hệ thống →' : 'System admin →'}
      </button>
    )
  }

  // Hotel-scoped user — link straight to their own dashboard.
  if (auth.user.hotel_id) {
    return (
      <button
        onClick={() => onNavigate(`/admin/${auth.user.hotel_id}`)}
        className="text-[12.5px] font-medium text-primary hover:underline cursor-pointer"
      >
        {lang === 'VN' ? 'Vào dashboard →' : 'Open dashboard →'}
      </button>
    )
  }

  return null
}
