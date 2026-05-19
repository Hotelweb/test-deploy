import { useEffect, useRef, useState } from 'react'
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

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.lineTo(x + width - radius, y)
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
  ctx.lineTo(x + width, y + height - radius)
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
  ctx.lineTo(x + radius, y + height)
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
  ctx.lineTo(x, y + radius)
  ctx.quadraticCurveTo(x, y, x + radius, y)
  ctx.closePath()
}

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
  const qrRef = useRef<SVGSVGElement | null>(null)

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
  const downloadQr = () => {
    const svg = qrRef.current
    if (!svg) return
    const serializer = new XMLSerializer()
    const source = serializer.serializeToString(svg)
    const svgBlob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(svgBlob)
    const image = new Image()
    image.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = 900
      canvas.height = 1200
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        URL.revokeObjectURL(url)
        return
      }

      const wrapText = (
        text: string,
        x: number,
        y: number,
        maxWidth: number,
        lineHeight: number,
      ) => {
        const words = text.split(/\s+/)
        let line = ''
        let cursorY = y
        for (const word of words) {
          const testLine = line ? `${line} ${word}` : word
          if (ctx.measureText(testLine).width > maxWidth && line) {
            ctx.fillText(line, x, cursorY)
            line = word
            cursorY += lineHeight
          } else {
            line = testLine
          }
        }
        if (line) ctx.fillText(line, x, cursorY)
        return cursorY + lineHeight
      }

      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      ctx.fillStyle = '#F6F8F4'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = '#ffffff'
      roundRect(ctx, 70, 70, 760, 1060, 36)
      ctx.fill()

      ctx.textAlign = 'center'
      ctx.fillStyle = '#1F2A1D'
      ctx.font = 'bold 46px Arial, sans-serif'
      const nextY = wrapText(hotel.name, canvas.width / 2, 160, 680, 56)

      if (hotel.address) {
        ctx.fillStyle = '#687365'
        ctx.font = '26px Arial, sans-serif'
        wrapText(hotel.address, canvas.width / 2, nextY + 8, 680, 34)
      }

      ctx.fillStyle = '#ffffff'
      roundRect(ctx, 190, 360, 520, 520, 28)
      ctx.fill()
      ctx.strokeStyle = '#E3E8DE'
      ctx.lineWidth = 3
      ctx.stroke()
      ctx.drawImage(image, 220, 390, 460, 460)

      ctx.fillStyle = '#2D5016'
      ctx.font = 'bold 28px Arial, sans-serif'
      ctx.fillText(
        lang === 'VN' ? 'Quét mã để xem dịch vụ' : 'Scan to view services',
        canvas.width / 2,
        945,
      )

      ctx.fillStyle = '#687365'
      ctx.font = '22px Arial, sans-serif'
      wrapText(hotelPageUrl, canvas.width / 2, 1000, 680, 30)
      URL.revokeObjectURL(url)

      const link = document.createElement('a')
      link.href = canvas.toDataURL('image/png')
      link.download = `${hotel.slug}-qr.png`
      link.click()
    }
    image.src = url
  }

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
              <div className="bg-white p-2 rounded-2xl shadow-elevated border border-border-light">
                <QRCodeSVG
                  value={hotelPageUrl}
                  size={80}
                  level="M"
                  bgColor="#ffffff"
                  fgColor="#2D5016"
                />
                <button
                  type="button"
                  onClick={downloadQr}
                  className="mt-2 w-full px-2 py-1.5 rounded-xl bg-primary text-white text-[11px] font-semibold hover:bg-primary-dark cursor-pointer transition-colors"
                >
                  Tải QR
                </button>
              </div>
            </div>
          </div>

          <section className="md:hidden glass-card rounded-2xl p-4 flex items-center gap-4">
            <div className="bg-white p-2 rounded-2xl border border-border-light shadow-soft flex-shrink-0">
              <QRCodeSVG
                ref={qrRef}
                value={hotelPageUrl}
                size={88}
                level="M"
                bgColor="#ffffff"
                fgColor="#2D5016"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold text-text">
                {lang === 'VN' ? 'Mã QR khách sạn' : 'Hotel QR code'}
              </p>
              <p className="text-[12px] text-text-light mt-1 line-clamp-2">
                {lang === 'VN'
                  ? 'Quét hoặc tải mã để mở lại trang dịch vụ.'
                  : 'Scan or download this code to reopen the services page.'}
              </p>
              <button
                type="button"
                onClick={downloadQr}
                className="mt-3 px-3 py-2 rounded-xl bg-primary text-white text-[12px] font-semibold cursor-pointer"
              >
                {lang === 'VN' ? 'Tải QR' : 'Download QR'}
              </button>
            </div>
          </section>

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
