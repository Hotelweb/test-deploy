import { useCallback, useEffect, useMemo, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import {
  createHotelUser,
  getHotel,
  getHotelUsers,
  updateHotelUser,
  type Hotel,
  type HotelUser,
} from '../api'
import { UserMenu } from '../components/UserMenu'
import { AccessDeniedScreen } from '../components/RequireAuth'
import {
  ArrowLeftIcon,
  CheckIcon,
  ChevronDownIcon,
  MoreIcon,
  PlusIcon,
} from '../components/icons/ServiceIcons'
import { useAuth } from '../hooks/useAuth'
import type { HotelStaffRole } from '../lib/auth'
import { can, roleLabel } from '../lib/permissions'

const STAFF_ROLES: HotelStaffRole[] = [
  'hotel_admin',
  'manager',
  'reception',
  'cashier',
  'fnb_staff',
  'kitchen_staff',
  'customer_care',
  'content_manager',
]

const ROLE_HELPER: Record<HotelStaffRole, string> = {
  hotel_admin: 'toàn quyền quản trị khách sạn và nhân viên',
  manager: 'xem báo cáo và điều phối vận hành',
  reception: 'tiếp nhận khách, xem đơn và xử lý chat',
  cashier: 'theo dõi đơn hàng, doanh thu và thanh toán',
  fnb_staff: 'xử lý đơn món ăn và đồ uống',
  kitchen_staff: 'nhận đơn bếp và cập nhật trạng thái chế biến',
  customer_care: 'phụ trách hội thoại và yêu cầu của khách',
  content_manager: 'quản lý dịch vụ, menu và nội dung hiển thị',
}

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(-2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

function normalizeRoles(
  roles?: HotelStaffRole[] | null,
  fallback?: HotelStaffRole,
): HotelStaffRole[] {
  const unique = Array.from(
    new Set((roles?.length ? roles : fallback ? [fallback] : []).filter(Boolean)),
  )
  return unique.length > 0 ? unique : ['reception']
}

function roleSummary(roles: HotelStaffRole[]) {
  if (roles.length === 1) return roleLabel(roles[0])
  return `${roles.length} vai trò`
}

type StaffFormState = {
  full_name: string
  email: string
  password: string
  roles: HotelStaffRole[]
}

const emptyForm: StaffFormState = {
  full_name: '',
  email: '',
  password: '',
  roles: ['reception'],
}

export function StaffManagementPage() {
  const { hotelId: hotelIdParam } = useParams<{ hotelId: string }>()
  const hotelId = Number(hotelIdParam)
  const navigate = useNavigate()
  const auth = useAuth()
  const [hotel, setHotel] = useState<Hotel | null>(null)
  const [staff, setStaff] = useState<HotelUser[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<StaffFormState>(emptyForm)
  const [openActionsUserId, setOpenActionsUserId] = useState<number | null>(null)

  const allowed = can(auth?.user, 'users:manage')

  const load = useCallback(async () => {
    if (!hotelId || !allowed) return
    setLoading(true)
    try {
      const [h, users] = await Promise.all([getHotel(hotelId), getHotelUsers(hotelId)])
      setHotel(h)
      setStaff(users)
    } finally {
      setLoading(false)
    }
  }, [hotelId, allowed])

  useEffect(() => {
    // This effect owns the page data fetch after auth and route params are known.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
  }, [load])

  const activeCount = useMemo(() => staff.filter((user) => user.is_active).length, [staff])

  if (!hotelId) return <Navigate to="/admin" replace />
  if (!allowed) return <AccessDeniedScreen reason="Bạn không có quyền quản lý nhân viên." />

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!form.email.trim() || !form.full_name.trim() || !form.password.trim()) return
    setSaving(true)
    try {
      const created = await createHotelUser({
        hotel_id: hotelId,
        email: form.email.trim(),
        full_name: form.full_name.trim(),
        password: form.password,
        role: form.roles[0],
        roles: form.roles,
      })
      setStaff((prev) => [created, ...prev])
      setForm(emptyForm)
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Không tạo được nhân viên')
    } finally {
      setSaving(false)
    }
  }

  const patchStaff = async (user: HotelUser, data: Parameters<typeof updateHotelUser>[1]) => {
    try {
      const updated = await updateHotelUser(user.id, data)
      setStaff((prev) => prev.map((item) => (item.id === user.id ? updated : item)))
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Không cập nhật được nhân viên')
    }
  }

  return (
    <div className="min-h-screen bg-background-warm">
      <header className="sticky top-0 z-30 border-b border-border-light bg-white/92 backdrop-blur px-4 sm:px-8 py-4">
        <div className="max-w-[88rem] mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => navigate(`/admin/${hotelId}`)}
              className="w-10 h-10 rounded-xl border border-border-light bg-white text-text-muted hover:bg-gray-50 flex items-center justify-center"
              aria-label="Quay lại"
            >
              <ArrowLeftIcon className="w-4 h-4" />
            </button>
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-text">Quản lý nhân viên</h1>
              <p className="text-[12px] text-text-light truncate">
                {hotel?.name ?? 'Khách sạn'} · {activeCount}/{staff.length} đang hoạt động
              </p>
            </div>
          </div>
          <UserMenu size="sm" />
        </div>
      </header>

      <main className="max-w-[88rem] mx-auto px-4 sm:px-8 lg:px-12 py-6 grid grid-cols-1 lg:grid-cols-[22rem_minmax(0,1fr)] gap-5">
        <form
          onSubmit={handleCreate}
          className="rounded-2xl border border-border-light bg-white p-4 sm:p-5 h-fit shadow-soft"
        >
          <div className="flex items-center gap-2 mb-4">
            <span className="w-9 h-9 rounded-xl bg-primary text-white flex items-center justify-center">
              <PlusIcon className="w-4 h-4" />
            </span>
            <div>
              <h2 className="text-[15px] font-bold text-text">Thêm nhân viên</h2>
              <p className="text-[11.5px] text-text-light">Gán vai trò khách sạn cơ bản.</p>
            </div>
          </div>

          <label className="block text-[12px] font-semibold text-text-muted mb-1">Họ tên</label>
          <input
            value={form.full_name}
            onChange={(e) => setForm((prev) => ({ ...prev, full_name: e.target.value }))}
            className="w-full h-10 rounded-xl border border-border-light px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />

          <label className="block text-[12px] font-semibold text-text-muted mt-3 mb-1">Email</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
            className="w-full h-10 rounded-xl border border-border-light px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />

          <label className="block text-[12px] font-semibold text-text-muted mt-3 mb-1">
            Mật khẩu tạm
          </label>
          <input
            type="password"
            minLength={6}
            value={form.password}
            onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
            className="w-full h-10 rounded-xl border border-border-light px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />

          <RoleSelect
            id="new-staff-role"
            label="Vai trò"
            value={form.roles}
            onChange={(roles) => setForm((prev) => ({ ...prev, roles }))}
            className="mt-3"
          />

          <button
            type="submit"
            disabled={saving}
            className="mt-4 w-full h-10 rounded-xl bg-primary text-white text-[13px] font-bold cursor-pointer transition-colors duration-200 hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
          >
            Tạo nhân viên
          </button>
        </form>

        <section className="rounded-2xl border border-border-light bg-white overflow-visible min-w-0 shadow-soft">
          <div className="px-4 py-3 border-b border-border-light sm:flex sm:items-center sm:justify-between sm:gap-3">
            <div>
              <h2 className="text-[15px] font-bold text-text">Danh sách nhân viên</h2>
              <p className="text-[11.5px] text-text-light mt-0.5">
                Có thể đổi vai trò, khóa/mở tài khoản và đặt lại mật khẩu tạm.
              </p>
            </div>
            <span className="mt-2 sm:mt-0 inline-flex h-8 items-center rounded-full bg-primary/8 px-3 text-[12px] font-bold text-primary">
              {staff.length} nhân viên
            </span>
          </div>

          {loading ? (
            <div className="py-16 flex justify-center">
              <div className="w-9 h-9 border-3 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : staff.length === 0 ? (
            <p className="p-6 text-sm text-text-light">Chưa có nhân viên.</p>
          ) : (
            <ul role="list" className="divide-y divide-border-light">
              {staff.map((user) => (
                <li
                  key={user.id}
                  className="p-4 transition-colors duration-200 hover:bg-background/70"
                >
                  <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(17rem,21rem)_3rem] xl:items-center">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-[12px] font-extrabold text-primary">
                        {getInitials(user.full_name) || 'NV'}
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-bold text-text break-words leading-snug">
                            {user.full_name}
                          </p>
                          <span
                            className={`inline-flex h-6 items-center rounded-full px-2 text-[11px] font-bold ${
                              user.is_active
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-gray-100 text-text-muted'
                            }`}
                          >
                            {user.is_active ? 'Hoạt động' : 'Đã khóa'}
                          </span>
                        </div>
                        <p className="text-[12px] text-text-light break-all mt-0.5">{user.email}</p>
                        <p className="text-[11px] text-text-lighter mt-1 break-words">
                          Đăng nhập gần nhất:{' '}
                          {user.last_login_at
                            ? new Date(user.last_login_at).toLocaleString('vi-VN')
                            : 'Chưa đăng nhập'}
                        </p>
                      </div>
                    </div>

                    <RoleSelect
                      id={`staff-role-${user.id}`}
                      value={normalizeRoles(user.roles, user.role)}
                      onChange={(roles) => void patchStaff(user, { role: roles[0], roles })}
                      compact
                    />

                    <StaffActionsMenu
                      user={user}
                      open={openActionsUserId === user.id}
                      onOpenChange={(open) => setOpenActionsUserId(open ? user.id : null)}
                      onToggleActive={() => void patchStaff(user, { is_active: !user.is_active })}
                      onResetPassword={() => {
                        const password = window.prompt('Mật khẩu tạm mới (tối thiểu 6 ký tự):')
                        if (password && password.length >= 6) void patchStaff(user, { password })
                      }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  )
}

function StaffActionsMenu({
  user,
  open,
  onOpenChange,
  onToggleActive,
  onResetPassword,
}: {
  user: HotelUser
  open: boolean
  onOpenChange: (open: boolean) => void
  onToggleActive: () => void
  onResetPassword: () => void
}) {
  return (
    <div
      className="relative flex justify-start xl:justify-end"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) onOpenChange(false)
      }}
    >
      <button
        type="button"
        onClick={() => onOpenChange(!open)}
        className="flex h-10 w-10 items-center justify-center rounded-xl border border-border-light bg-white text-text-muted hover:border-primary/30 hover:bg-primary/5 hover:text-primary cursor-pointer transition-colors"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Mở hành động cho ${user.full_name}`}
      >
        <MoreIcon className="h-4 w-4" />
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute left-0 top-11 z-50 w-48 overflow-hidden rounded-2xl border border-border-light bg-white shadow-elevated xl:left-auto xl:right-0"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              onOpenChange(false)
              onToggleActive()
            }}
            className={`flex w-full items-center gap-2 px-3.5 py-2.5 text-left text-[13px] font-semibold cursor-pointer transition-colors ${
              user.is_active
                ? 'text-emerald-700 hover:bg-emerald-50'
                : 'text-text-muted hover:bg-gray-50'
            }`}
          >
            {user.is_active ? 'Khóa tài khoản' : 'Mở tài khoản'}
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              onOpenChange(false)
              onResetPassword()
            }}
            className="flex w-full items-center gap-2 px-3.5 py-2.5 text-left text-[13px] font-semibold text-text-muted hover:bg-primary/5 hover:text-primary cursor-pointer transition-colors"
          >
            Reset mật khẩu
          </button>
        </div>
      ) : null}
    </div>
  )
}

function RoleSelect({
  id,
  label,
  value,
  onChange,
  compact = false,
  className = '',
}: {
  id: string
  label?: string
  value: HotelStaffRole[]
  onChange: (roles: HotelStaffRole[]) => void
  compact?: boolean
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const selectedRoles = normalizeRoles(value)
  const selectedLabel = roleSummary(selectedRoles)
  const selectedDescriptions = selectedRoles.map((role) => ROLE_HELPER[role]).join(' · ')

  const toggleRole = (role: HotelStaffRole) => {
    const next = selectedRoles.includes(role)
      ? selectedRoles.filter((item) => item !== role)
      : [...selectedRoles, role]

    onChange(next.length > 0 ? next : selectedRoles)
  }

  return (
    <div
      className={`relative min-w-0 ${className}`}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false)
      }}
    >
      {label ? (
        <label htmlFor={id} className="block text-[12px] font-semibold text-text-muted mb-1">
          {label}
        </label>
      ) : null}
      <button
        id={id}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        onKeyDown={(event) => {
          if (event.key === 'Escape') setOpen(false)
        }}
        className="flex h-11 w-full min-w-0 items-center justify-between gap-3 rounded-xl border border-border-light bg-white px-3 text-left text-[13px] text-text shadow-soft cursor-pointer transition-colors duration-200 hover:border-primary/30 hover:bg-primary/3 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30"
      >
        <span className="min-w-0">
          <span className="block truncate font-bold">{selectedLabel}</span>
          {!compact ? (
            <span className="block truncate text-[11px] font-medium text-text-light">
              {selectedDescriptions}
            </span>
          ) : null}
        </span>
        <ChevronDownIcon
          className={`h-4 w-4 shrink-0 text-text-light transition-transform duration-200 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>
      {open ? (
        <div
          role="listbox"
          aria-labelledby={id}
          className="absolute left-0 right-0 z-40 mt-2 max-h-72 overflow-y-auto rounded-xl border border-border bg-white p-1.5 shadow-elevated"
        >
          {STAFF_ROLES.map((role) => {
            const selected = selectedRoles.includes(role)

            return (
              <button
                key={role}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => {
                  toggleRole(role)
                }}
                className={`flex w-full min-w-0 items-start gap-2 rounded-lg px-2.5 py-2 text-left cursor-pointer transition-colors duration-200 ${
                  selected ? 'bg-primary/8 text-primary' : 'text-text hover:bg-background-warm'
                }`}
              >
                <span
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                    selected ? 'bg-primary text-white' : 'border border-border-light bg-white'
                  }`}
                >
                  {selected ? <CheckIcon className="h-3.5 w-3.5" /> : null}
                </span>
                <span className="min-w-0">
                  <span className="block text-[13px] font-bold leading-snug">
                    {roleLabel(role)}
                  </span>
                  <span className="block text-[11px] leading-snug text-text-light">
                    {ROLE_HELPER[role]}
                  </span>
                </span>
              </button>
            )
          })}
        </div>
      ) : null}
      <p
        className={`mt-1.5 text-text-light leading-snug break-words ${
          compact ? 'text-[11px]' : 'text-[11.5px]'
        }`}
      >
        {compact
          ? selectedRoles.map((role) => `${roleLabel(role)}: ${ROLE_HELPER[role]}`).join(' · ')
          : selectedDescriptions}
      </p>
    </div>
  )
}
