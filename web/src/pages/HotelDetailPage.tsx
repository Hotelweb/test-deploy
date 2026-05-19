import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { getHotelBySlug, getHotelServices } from '../api'
import type { Hotel, HotelService } from '../api'
import { HotelCard } from '../components/HotelCard'
import { ChatButton } from '../components/ChatButton'
import { ChatWindow } from '../components/ChatWindow'
import { HotelDetailServices } from '../components/HotelDetailServices'
import { HotelGallery } from '../components/HotelGallery'
import { ServiceDetailModal } from '../components/ServiceDetailModal'
import { TopHeader } from '../components/TopHeader'
import heroImage from '../assets/hero.png'

export function HotelDetailPage() {
  const navigate = useNavigate()
  const { slug } = useParams<{ slug: string }>()
  const [hotel, setHotel] = useState<Hotel | null>(null)
  const [services, setServices] = useState<HotelService[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showChat, setShowChat] = useState(false)
  const [lang, setLang] = useState<'VN' | 'EN'>('VN')
  const [activeService, setActiveService] = useState<HotelService | null>(null)

  useEffect(() => {
    if (!slug) return

    async function loadHotel() {
      try {
        setLoading(true)
        const hotelData = await getHotelBySlug(slug!)
        setHotel(hotelData)

        const servicesData = await getHotelServices(hotelData.id, lang === 'VN' ? 'vi' : 'en')
        setServices(servicesData)
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to load hotel'
        setError(message)
      } finally {
        setLoading(false)
      }
    }

    loadHotel()
  }, [slug, lang])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-warm">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-text-muted text-sm">Loading hotel...</p>
        </div>
      </div>
    )
  }

  if (error || !hotel) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-warm">
        <div className="text-center px-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-50 flex items-center justify-center">
            <svg
              viewBox="0 0 24 24"
              className="w-8 h-8 text-red-400"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path
                d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <p className="text-text text-lg font-semibold mb-1">Hotel not found</p>
          <p className="text-text-muted text-sm">
            {error || 'The link may be invalid or the hotel is inactive.'}
          </p>
        </div>
      </div>
    )
  }

  const hotelPageUrl = `${window.location.origin}/hotel/${hotel.slug}`

  return (
    <div className="min-h-screen bg-background-warm">
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
          {/* Hero Image */}
          <div className="relative w-full overflow-hidden rounded-3xl shadow-elevated">
            <img
              src={hotel.banner_url || heroImage}
              alt={`${hotel.name} - Hotel banner`}
              className="w-full h-[260px] sm:h-[320px] md:h-[400px] object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />

            {/* QR Code - desktop only */}
            <div className="absolute top-5 right-5 z-10 hidden md:block">
              <div className="w-24 h-24 bg-white p-2 rounded-2xl shadow-elevated border border-border-light">
                <QRCodeSVG
                  value={hotelPageUrl}
                  size={80}
                  level="M"
                  bgColor="#ffffff"
                  fgColor="#2D5016"
                />
              </div>
            </div>
          </div>

          {/* Hotel Info Card */}
          <HotelCard name={hotel.name} address={hotel.address || ''} onClick={() => {}} />

          {/* Hotel description */}
          {hotel.description ? (
            <section
              aria-label={lang === 'VN' ? 'Giới thiệu' : 'About'}
              className="glass-card rounded-3xl p-5 sm:p-6"
            >
              <h3 className="text-lg sm:text-xl font-bold text-text mb-2">
                {lang === 'VN' ? 'Giới thiệu' : 'About this hotel'}
              </h3>
              <p className="text-[14px] sm:text-[15px] text-text-muted leading-relaxed whitespace-pre-line">
                {hotel.description}
              </p>
            </section>
          ) : null}

          {/* Intro gallery — Cloudinary-hosted photos curated by the admin */}
          {hotel.gallery && hotel.gallery.length > 0 ? (
            <HotelGallery
              images={hotel.gallery}
              heading={lang === 'VN' ? 'Hình ảnh giới thiệu' : 'Gallery'}
            />
          ) : null}

          {/* Services */}
          {services.length > 0 ? (
            <HotelDetailServices
              services={services}
              onServiceClick={(s) => {
                if (s.service_type === 'food_order') {
                  navigate(`/hotel/${hotel.slug}/order/${s.id}`)
                } else {
                  setActiveService(s)
                }
              }}
            />
          ) : (
            <div className="text-center py-10">
              <p className="text-text-light text-sm">No services available</p>
            </div>
          )}
        </div>
      </main>

      {/* Floating chat button */}
      <ChatButton onClick={() => setShowChat(true)} badge={null} />

      {/* Chat Window */}
      {showChat ? (
        <ChatWindow hotelId={hotel.id} hotelName={hotel.name} onClose={() => setShowChat(false)} />
      ) : null}

      {/* Service detail modal — guests tap a service tile to read its markdown body */}
      <ServiceDetailModal
        open={activeService !== null}
        service={activeService}
        language={lang === 'VN' ? 'vi' : 'en'}
        onClose={() => setActiveService(null)}
      />
    </div>
  )
}
