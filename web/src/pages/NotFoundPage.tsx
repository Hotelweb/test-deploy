import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeftIcon, HotelIcon, SearchIcon } from '../components/icons/ServiceIcons'
import { useAuth } from '../hooks/useAuth'

export function NotFoundPage() {
  const auth = useAuth()
  const navigate = useNavigate()
  const dashboardPath =
    auth?.user.scope === 'system'
      ? '/admin'
      : auth?.user.hotel_id
        ? `/admin/${auth.user.hotel_id}`
        : '/'

  return (
    <main className="min-h-screen bg-background-warm px-4 py-8 sm:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-[88rem] items-center justify-center">
        <section className="w-full max-w-2xl rounded-3xl border border-border-light bg-white p-6 shadow-elevated sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-primary text-white shadow-card">
              <SearchIcon className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[12px] font-semibold uppercase tracking-wide text-primary">404</p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-text sm:text-3xl">
                Không tìm thấy trang
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-text-muted">
                Đường dẫn này không khả dụng hoặc đã được thay đổi. Quay lại trang trước hoặc mở
                bảng điều khiển phù hợp với tài khoản hiện tại.
              </p>
              <div className="mt-6 flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-white px-4 text-[13px] font-semibold text-text-muted hover:border-primary/30 hover:text-primary cursor-pointer transition-colors"
                >
                  <ArrowLeftIcon className="h-4 w-4" />
                  Quay lại
                </button>
                <Link
                  to={dashboardPath}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-[13px] font-semibold text-white hover:bg-primary-dark transition-colors"
                >
                  <HotelIcon className="h-4 w-4" />
                  Mở bảng điều khiển
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
