import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, useLocation, useParams } from 'react-router-dom'
import { GuestRouteGuard, RootRedirect } from './components/GuestRouteGuard'
import { RequireAuth } from './components/RequireAuth'
import { useGuestFaviconNotifications } from './hooks/useGuestFaviconNotifications'

const HotelDetailPage = lazy(() =>
  import('./pages/HotelDetailPage').then(({ HotelDetailPage }) => ({ default: HotelDetailPage })),
)
const FoodOrderPage = lazy(() =>
  import('./pages/food-order/FoodOrderPage').then(({ FoodOrderPage }) => ({
    default: FoodOrderPage,
  })),
)
const LoginPage = lazy(() =>
  import('./pages/LoginPage').then(({ LoginPage }) => ({ default: LoginPage })),
)
const RootAdminPage = lazy(() =>
  import('./pages/RootAdminPage').then(({ RootAdminPage }) => ({ default: RootAdminPage })),
)
const HotelAdminHomePage = lazy(() =>
  import('./pages/HotelAdminHomePage').then(({ HotelAdminHomePage }) => ({
    default: HotelAdminHomePage,
  })),
)
const AdminChatPage = lazy(() =>
  import('./pages/AdminChatPage').then(({ AdminChatPage }) => ({ default: AdminChatPage })),
)
const HotelServicesAdminPage = lazy(() =>
  import('./pages/HotelServicesAdminPage').then(({ HotelServicesAdminPage }) => ({
    default: HotelServicesAdminPage,
  })),
)
const FoodOrderAdminPage = lazy(() =>
  import('./pages/food-order/admin/FoodOrderAdminPage').then(({ FoodOrderAdminPage }) => ({
    default: FoodOrderAdminPage,
  })),
)
const StaffManagementPage = lazy(() =>
  import('./pages/StaffManagementPage').then(({ StaffManagementPage }) => ({
    default: StaffManagementPage,
  })),
)
const InternalChatPage = lazy(() =>
  import('./pages/InternalChatPage').then(({ InternalChatPage }) => ({
    default: InternalChatPage,
  })),
)
const NotFoundPage = lazy(() =>
  import('./pages/NotFoundPage').then(({ NotFoundPage }) => ({ default: NotFoundPage })),
)

function App() {
  return (
    <BrowserRouter>
      <GuestFaviconNotifications />
      <GuestRouteGuard>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<RootRedirect />} />
            <Route path="/hotel/:slug" element={<HotelDetailPage />} />
            <Route path="/hotel/:slug/order/:serviceId" element={<FoodOrderPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/admin"
              element={
                <RequireAuth scopes={['system']}>
                  <RootAdminPage />
                </RequireAuth>
              }
            />
            <Route path="/admin/:hotelId" element={<HotelAdminHomeRoute />} />
            <Route path="/admin/:hotelId/chat" element={<AdminChatRoute />} />
            <Route path="/admin/:hotelId/services" element={<HotelServicesAdminRoute />} />
            <Route path="/admin/:hotelId/food-order" element={<FoodOrderAdminRoute />} />
            <Route path="/admin/:hotelId/staff" element={<StaffManagementRoute />} />
            <Route path="/admin/:hotelId/internal-chat" element={<InternalChatRoute />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </GuestRouteGuard>
    </BrowserRouter>
  )
}

function GuestFaviconNotifications() {
  const location = useLocation()
  useGuestFaviconNotifications(!location.pathname.startsWith('/admin'))
  return null
}

function RouteFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background-warm">
      <div className="h-10 w-10 rounded-full border-3 border-primary border-t-transparent animate-spin" />
    </div>
  )
}

function HotelAdminHomeRoute() {
  const { hotelId } = useParams<{ hotelId: string }>()
  const parsed = hotelId ? Number(hotelId) : undefined
  return (
    <RequireAuth scopes={['system', 'hotel']} hotelId={parsed}>
      <HotelAdminHomePage />
    </RequireAuth>
  )
}

/**
 * AdminChatPage uses :hotelId from the URL, so we read it here and feed it
 * into RequireAuth. System admins always pass; hotel users must match the
 * specific hotel they belong to.
 */
function AdminChatRoute() {
  const { hotelId } = useParams<{ hotelId: string }>()
  const parsed = hotelId ? Number(hotelId) : undefined
  return (
    <RequireAuth scopes={['system', 'hotel']} hotelId={parsed}>
      <AdminChatPage />
    </RequireAuth>
  )
}

/**
 * Same pattern as AdminChatRoute — read the hotel id from the URL and gate
 * access. System admins manage any hotel's services; hotel admins are pinned
 * to their own hotel.
 */
function HotelServicesAdminRoute() {
  const { hotelId } = useParams<{ hotelId: string }>()
  const parsed = hotelId ? Number(hotelId) : undefined
  return (
    <RequireAuth scopes={['system', 'hotel']} hotelId={parsed}>
      <HotelServicesAdminPage />
    </RequireAuth>
  )
}

function FoodOrderAdminRoute() {
  const { hotelId } = useParams<{ hotelId: string }>()
  const parsed = hotelId ? Number(hotelId) : undefined
  return (
    <RequireAuth scopes={['system', 'hotel']} hotelId={parsed}>
      <FoodOrderAdminPage />
    </RequireAuth>
  )
}

function StaffManagementRoute() {
  const { hotelId } = useParams<{ hotelId: string }>()
  const parsed = hotelId ? Number(hotelId) : undefined
  return (
    <RequireAuth scopes={['system', 'hotel']} hotelId={parsed}>
      <StaffManagementPage />
    </RequireAuth>
  )
}

function InternalChatRoute() {
  const { hotelId } = useParams<{ hotelId: string }>()
  const parsed = hotelId ? Number(hotelId) : undefined
  return (
    <RequireAuth scopes={['system', 'hotel']} hotelId={parsed}>
      <InternalChatPage />
    </RequireAuth>
  )
}

export default App
