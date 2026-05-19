import { useCallback, useEffect, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { getHotel, type Hotel } from '../api'
import { UserMenu } from '../components/UserMenu'
import {
  ArrowRightIcon,
  ChatIcon,
  EyeIcon,
  HotelIcon,
  InRoomDiningIcon,
  ServicesIcon,
} from '../components/icons/ServiceIcons'
import { useAuth } from '../hooks/useAuth'

export function HotelAdminHomePage() {
  const { hotelId: hotelIdParam } = useParams<{ hotelId: string }>()
  const hotelId = Number(hotelIdParam)
  const navigate = useNavigate()
  const auth = useAuth()

  const [hotel, setHotel] = useState<Hotel | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadHotel = useCallback(async () => {
    if (!hotelId) return
    setLoading(true)
    setError(null)
    try {
      const data = await getHotel(hotelId)
      setHotel(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không tải được thông tin khách sạn')
    } finally {
      setLoading(false)
    }
  }, [hotelId])

  useEffect(() => {
    let cancelled = false
    void Promise.resolve().then(() => {
      if (!cancelled) void loadHotel()
    })
    return () => {
      cancelled = true
    }
  }, [loadHotel])

  if (!hotelId) return <Navigate to="/admin" replace />

  const actions = [
    {
      title: 'Chat với khách',
      description: 'Theo dõi hội thoại, trả lời yêu cầu và cập nhật trạng thái đặt phòng.',
      buttonLabel: 'Mở chat',
      icon: ChatIcon,
      tone: 'bg-indigo-50 text-indigo-700 border-indigo-100',
      onClick: () => navigate(`/admin/${hotelId}/chat`),
    },
    {
      title: 'Quản lý đơn hàng',
      description: 'Xem đơn món mới, cập nhật trạng thái xử lý và chỉnh thực đơn.',
      buttonLabel: 'Mở đơn hàng',
      icon: InRoomDiningIcon,
      tone: 'bg-orange-50 text-orange-700 border-orange-100',
      onClick: () => navigate(`/admin/${hotelId}/food-order`),
    },
    {
      title: 'Thêm dịch vụ',
      description: 'Tạo dịch vụ mới, sửa nội dung đa ngôn ngữ và sắp xếp trang khách.',
      buttonLabel: 'Quản lý dịch vụ',
      icon: ServicesIcon,
      tone: 'bg-emerald-50 text-primary border-emerald-100',
      onClick: () => navigate(`/admin/${hotelId}/services`),
    },
    {
      title: 'Xem trang khách',
      description: 'Kiểm tra giao diện khách đang thấy qua QR code của khách sạn.',
      buttonLabel: 'Xem trang',
      icon: EyeIcon,
      tone: 'bg-sky-50 text-sky-700 border-sky-100',
      onClick: () => hotel && navigate(`/hotel/${hotel.slug}`),
      disabled: !hotel,
    },
  ]

  return (
    <div className="min-h-screen bg-background-warm">
      <header className="glass-nav sticky top-0 z-30 px-4 sm:px-8 lg:px-16 xl:px-20 py-4 sm:py-5">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0 w-full sm:w-auto">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-primary flex items-center justify-center flex-shrink-0 overflow-hidden">
              {hotel?.logo_url ? (
                <img src={hotel.logo_url} alt={hotel.name} className="w-full h-full object-cover" />
              ) : (
                <HotelIcon className="w-5 h-5" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h1
                className="text-[19px] sm:text-2xl font-bold text-text tracking-tight leading-tight"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                Trang quản trị khách sạn
              </h1>
              <p className="text-[12.5px] text-text-light mt-0.5 truncate">
                {hotel?.name ?? (loading ? 'Đang tải...' : 'Khách sạn')}
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
            {auth?.user.scope === 'system' ? (
              <button
                type="button"
                onClick={() => navigate('/admin')}
                className="px-3.5 py-2 rounded-xl text-[13px] font-medium text-text-muted bg-white border border-border hover:bg-gray-50 cursor-pointer transition-colors"
              >
                Tất cả cơ sở
              </button>
            ) : null}
            <UserMenu size="sm" subtitle="Quản trị khách sạn" />
          </div>
        </div>
      </header>

      <main className="px-4 sm:px-8 lg:px-16 xl:px-20 py-8 sm:py-10">
        <div className="max-w-6xl mx-auto flex flex-col gap-6">
          {error ? (
            <div className="rounded-2xl bg-red-50 border border-red-200 px-4 py-3 text-[13px] text-red-700">
              {error}
            </div>
          ) : null}

          <section className="glass-card rounded-2xl p-5 sm:p-6">
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
              <div className="min-w-0">
                <p className="text-[12px] font-semibold uppercase tracking-wide text-primary">
                  Hotel admin
                </p>
                <h2 className="text-2xl sm:text-3xl font-bold text-text tracking-tight mt-1">
                  {hotel?.name ?? 'Quản lý vận hành khách sạn'}
                </h2>
                <p className="text-sm text-text-muted mt-2 max-w-2xl leading-relaxed">
                  Chọn nhanh khu vực cần xử lý: tin nhắn khách, đơn hàng, dịch vụ hiển thị trên
                  trang QR, hoặc mở trang khách để kiểm tra nội dung.
                </p>
              </div>
            </div>
          </section>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-text-muted text-sm">Đang tải trang quản trị...</p>
            </div>
          ) : (
            <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {actions.map((action) => (
                <button
                  key={action.title}
                  type="button"
                  onClick={action.onClick}
                  disabled={action.disabled}
                  className="glass-card glass-card-hover rounded-2xl p-5 text-left cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                >
                  <span
                    className={`w-12 h-12 rounded-xl border flex items-center justify-center ${action.tone}`}
                  >
                    <action.icon className="w-5 h-5" />
                  </span>
                  <span className="block text-[16px] font-semibold text-text mt-4">
                    {action.title}
                  </span>
                  <span className="block text-[13px] text-text-muted leading-relaxed mt-1 min-h-10">
                    {action.description}
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-primary mt-4">
                    {action.buttonLabel}
                    <ArrowRightIcon className="w-4 h-4" />
                  </span>
                </button>
              ))}
            </section>
          )}
        </div>
      </main>
    </div>
  )
}
