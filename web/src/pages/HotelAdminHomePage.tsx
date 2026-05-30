import { useCallback, useEffect, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { getHotel, type Hotel } from '../api'
import { EditHotelModal } from '../components/EditHotelModal'
import { UserMenu } from '../components/UserMenu'
import {
  ArrowRightIcon,
  BellIcon,
  ChatIcon,
  EditIcon,
  EyeIcon,
  HotelIcon,
  InRoomDiningIcon,
  ServicesIcon,
  PeopleIcon,
} from '../components/icons/ServiceIcons'
import { useAuth } from '../hooks/useAuth'
import { useHotelAdminNotifications } from '../hooks/useHotelAdminNotifications'
import type {
  AdminNotificationItem,
  AdminNotificationKind,
} from '../hooks/useHotelAdminNotifications'
import { can } from '../lib/permissions'

export function HotelAdminHomePage() {
  const { hotelId: hotelIdParam } = useParams<{ hotelId: string }>()
  const hotelId = Number(hotelIdParam)
  const navigate = useNavigate()
  const auth = useAuth()

  const [hotel, setHotel] = useState<Hotel | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingHotel, setEditingHotel] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const notifications = useHotelAdminNotifications(hotelId || 0)

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
      title: 'Chỉnh sửa thông tin',
      description:
        'Cập nhật tên khách sạn, liên hệ, địa chỉ, giới thiệu, logo, banner và thư viện ảnh.',
      buttonLabel: 'Sửa thông tin',
      icon: EditIcon,
      tone: 'bg-violet-50 text-violet-700 border-violet-100',
      onClick: () => setEditingHotel(true),
      disabled: !hotel,
      permission: 'hotel:manage' as const,
    },
    {
      title: 'Chat với khách',
      description: 'Theo dõi hội thoại, trả lời yêu cầu và cập nhật trạng thái đặt phòng.',
      buttonLabel: 'Mở chat',
      icon: ChatIcon,
      tone: 'bg-indigo-50 text-indigo-700 border-indigo-100',
      onClick: () => navigate(`/admin/${hotelId}/chat`),
      permission: 'chat:handle' as const,
    },
    {
      title: 'Quản lý đơn hàng',
      description: 'Xem đơn món mới, cập nhật trạng thái xử lý và chỉnh thực đơn.',
      buttonLabel: 'Mở đơn hàng',
      icon: InRoomDiningIcon,
      tone: 'bg-orange-50 text-orange-700 border-orange-100',
      onClick: () => navigate(`/admin/${hotelId}/food-order`),
      permission: 'orders:view' as const,
    },
    {
      title: 'Thêm dịch vụ',
      description: 'Tạo dịch vụ mới, sửa nội dung đa ngôn ngữ và sắp xếp trang khách.',
      buttonLabel: 'Quản lý dịch vụ',
      icon: ServicesIcon,
      tone: 'bg-emerald-50 text-primary border-emerald-100',
      onClick: () => navigate(`/admin/${hotelId}/services`),
      permission: 'services:manage' as const,
    },
    {
      title: 'Nhân viên',
      description: 'Tạo tài khoản, phân vai trò, khóa/mở và đặt lại mật khẩu cho nhân viên.',
      buttonLabel: 'Quản lý nhân viên',
      icon: PeopleIcon,
      tone: 'bg-cyan-50 text-cyan-700 border-cyan-100',
      onClick: () => navigate(`/admin/${hotelId}/staff`),
      permission: 'users:manage' as const,
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
  ].filter((action) => !action.permission || can(auth?.user, action.permission))

  return (
    <div className="min-h-screen bg-background-warm">
      <header className="glass-nav sticky top-0 z-30 px-4 sm:px-8 lg:px-16 xl:px-20 py-4 sm:py-5">
        <div className="max-w-[88rem] mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
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
            <NotificationBell
              open={notificationsOpen}
              onToggle={() => setNotificationsOpen((prev) => !prev)}
              onClose={() => setNotificationsOpen(false)}
              chatUnread={notifications.chatUnread}
              pendingOrders={notifications.pendingOrders}
              total={notifications.total}
              items={notifications.items}
              permission={notifications.permission}
              onEnableBrowserNotifications={notifications.enableBrowserNotifications}
              onClearRecent={notifications.clearRecent}
              onOpenChat={() => {
                setNotificationsOpen(false)
                navigate(`/admin/${hotelId}/chat`)
              }}
              onOpenOrders={() => {
                setNotificationsOpen(false)
                navigate(`/admin/${hotelId}/food-order`)
              }}
            />
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
        <div className="max-w-[88rem] mx-auto flex flex-col gap-6">
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
            <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
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

      <EditHotelModal
        open={editingHotel}
        hotel={hotel}
        onClose={() => setEditingHotel(false)}
        onSaved={(saved) => {
          setHotel(saved)
          setEditingHotel(false)
        }}
      />
    </div>
  )
}

function NotificationBell({
  open,
  onToggle,
  onClose,
  chatUnread,
  pendingOrders,
  total,
  items,
  permission,
  onEnableBrowserNotifications,
  onClearRecent,
  onOpenChat,
  onOpenOrders,
}: {
  open: boolean
  onToggle: () => void
  onClose: () => void
  chatUnread: number
  pendingOrders: number
  total: number
  items: AdminNotificationItem[]
  permission: NotificationPermission
  onEnableBrowserNotifications: () => void
  onClearRecent: () => void
  onOpenChat: () => void
  onOpenOrders: () => void
}) {
  const notificationGroups = (['chat', 'order'] as AdminNotificationKind[])
    .map((kind) => ({
      kind,
      meta: getNotificationMeta(kind),
      items: items.filter((item) => item.kind === kind),
    }))
    .filter((group) => group.items.length > 0)

  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggle}
        className="relative w-10 h-10 rounded-xl bg-white border border-border text-text-muted hover:bg-gray-50 hover:text-primary flex items-center justify-center cursor-pointer transition-colors"
        aria-label={total > 0 ? `Thông báo (${total})` : 'Thông báo'}
      >
        <BellIcon className="w-5 h-5" />
        {total > 0 ? (
          <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center shadow-soft">
            {total > 99 ? '99+' : total}
          </span>
        ) : null}
      </button>

      {open ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-30 cursor-default"
            aria-label="Đóng thông báo"
            onClick={onClose}
          />
          <div className="absolute right-0 top-12 z-40 w-[min(28rem,calc(100vw-2rem))] bg-white border border-border rounded-2xl shadow-modal overflow-hidden">
            <div className="px-4 py-3 border-b border-border-light flex items-center justify-between gap-3">
              <div>
                <p className="text-[13.5px] font-semibold text-text">Thông báo</p>
                <p className="text-[11.5px] text-text-light">
                  {total > 0 ? `${total} mục cần xử lý` : 'Không có mục mới'}
                </p>
              </div>
              {items.length > 0 ? (
                <button
                  type="button"
                  onClick={onClearRecent}
                  className="text-[11.5px] font-medium text-text-light hover:text-text cursor-pointer"
                >
                  Xoá gần đây
                </button>
              ) : null}
            </div>

            <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-2 border-b border-border-light">
              <button
                type="button"
                onClick={onOpenChat}
                className="rounded-xl border border-border-light bg-indigo-50/50 hover:bg-indigo-50 px-3 py-2.5 text-left cursor-pointer transition-colors"
              >
                <span className="flex items-center gap-1.5 text-[12px] font-semibold text-indigo-700">
                  <ChatIcon className="w-4 h-4" />
                  Chat
                </span>
                <span className="block text-lg font-bold text-text mt-1">{chatUnread}</span>
                <span className="block text-[11px] text-text-light">tin chưa đọc</span>
              </button>
              <button
                type="button"
                onClick={onOpenOrders}
                className="rounded-xl border border-border-light bg-orange-50/60 hover:bg-orange-50 px-3 py-2.5 text-left cursor-pointer transition-colors"
              >
                <span className="flex items-center gap-1.5 text-[12px] font-semibold text-orange-700">
                  <InRoomDiningIcon className="w-4 h-4" />
                  Đơn hàng
                </span>
                <span className="block text-lg font-bold text-text mt-1">{pendingOrders}</span>
                <span className="block text-[11px] text-text-light">đơn chờ xử lý</span>
              </button>
            </div>

            {permission !== 'granted' ? (
              <div className="px-3 py-2 border-b border-border-light bg-gray-50">
                <button
                  type="button"
                  onClick={onEnableBrowserNotifications}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-border text-[12.5px] font-medium text-text-muted hover:text-primary hover:border-primary/30 cursor-pointer transition-colors"
                >
                  Bật thông báo trình duyệt
                </button>
              </div>
            ) : null}

            <div className="max-h-80 overflow-y-auto">
              {items.length === 0 ? (
                <p className="px-4 py-6 text-center text-[13px] text-text-light">
                  Chưa có thông báo gần đây
                </p>
              ) : (
                <div className="py-1">
                  {notificationGroups.map((group) => (
                    <section
                      key={group.kind}
                      className="border-b border-border-light last:border-b-0"
                    >
                      <div className="flex items-center justify-between gap-3 px-4 pb-1.5 pt-3">
                        <span className="inline-flex items-center gap-2">
                          <span
                            className={`flex h-7 w-7 items-center justify-center rounded-lg ${group.meta.tone}`}
                          >
                            <group.meta.Icon className="h-3.5 w-3.5" />
                          </span>
                          <span className="text-[12px] font-bold text-text">
                            {group.meta.label}
                          </span>
                        </span>
                        <span className="rounded-full bg-gray-50 px-2 py-0.5 text-[11px] font-semibold text-text-light">
                          {group.items.length}
                        </span>
                      </div>
                      <ul role="list" className="divide-y divide-border-light">
                        {group.items.map((item) => {
                          const meta = getNotificationMeta(item.kind)
                          return (
                            <li key={item.id}>
                              <button
                                type="button"
                                onClick={item.kind === 'chat' ? onOpenChat : onOpenOrders}
                                className="w-full px-4 py-3 text-left hover:bg-gray-50 cursor-pointer transition-colors"
                              >
                                <span className="flex items-start gap-2.5">
                                  <span
                                    className={`mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${meta.tone}`}
                                  >
                                    <meta.Icon className="w-3.5 h-3.5" />
                                  </span>
                                  <span className="min-w-0 flex-1">
                                    <span className="flex flex-wrap items-center gap-2">
                                      <span className="block text-[13px] font-semibold text-text line-clamp-1">
                                        {item.title}
                                      </span>
                                      <span
                                        className={`rounded-full px-2 py-0.5 text-[10.5px] font-semibold ${meta.badge}`}
                                      >
                                        {meta.shortLabel}
                                      </span>
                                    </span>
                                    <span className="block text-[12px] text-text-muted line-clamp-2 mt-0.5">
                                      {item.body}
                                    </span>
                                    <span className="block text-[10.5px] text-text-lighter mt-1">
                                      {new Date(item.createdAt).toLocaleTimeString('vi-VN', {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                      })}
                                    </span>
                                  </span>
                                </span>
                              </button>
                            </li>
                          )
                        })}
                      </ul>
                    </section>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      ) : null}
    </div>
  )
}

function getNotificationMeta(kind: AdminNotificationKind) {
  if (kind === 'chat') {
    return {
      label: 'Tin nhắn khách',
      shortLabel: 'Chat',
      tone: 'bg-indigo-50 text-indigo-700',
      badge: 'bg-indigo-50 text-indigo-700',
      Icon: ChatIcon,
    }
  }

  return {
    label: 'Đơn hàng',
    shortLabel: 'Đơn',
    tone: 'bg-orange-50 text-orange-700',
    badge: 'bg-orange-50 text-orange-700',
    Icon: InRoomDiningIcon,
  }
}
