import type { AuthUser, HotelStaffRole } from './auth'

export type StaffPermission =
  | 'orders:view'
  | 'orders:update'
  | 'hotel:manage'
  | 'services:manage'
  | 'chat:handle'
  | 'reports:view'
  | 'users:manage'

const ROLE_PERMISSIONS: Record<HotelStaffRole, StaffPermission[]> = {
  hotel_admin: [
    'orders:view',
    'orders:update',
    'hotel:manage',
    'services:manage',
    'chat:handle',
    'reports:view',
    'users:manage',
  ],
  manager: [
    'orders:view',
    'orders:update',
    'hotel:manage',
    'services:manage',
    'chat:handle',
    'reports:view',
  ],
  reception: ['orders:view', 'chat:handle'],
  cashier: ['orders:view', 'orders:update', 'reports:view'],
  fnb_staff: ['orders:view', 'orders:update'],
  kitchen_staff: ['orders:view', 'orders:update'],
  customer_care: ['chat:handle'],
  content_manager: ['services:manage'],
}

export function can(user: AuthUser | undefined | null, permission: StaffPermission): boolean {
  if (!user) return false
  if (user.scope === 'system') return true
  const roles = getUserRoles(user)
  return roles.some((role) => ROLE_PERMISSIONS[role]?.includes(permission))
}

export function roleLabel(role?: HotelStaffRole): string {
  const labels: Record<HotelStaffRole, string> = {
    hotel_admin: 'Hotel Admin',
    reception: 'Reception',
    cashier: 'Cashier',
    fnb_staff: 'F&B Staff',
    kitchen_staff: 'Kitchen',
    customer_care: 'Customer Care',
    content_manager: 'Content Manager',
    manager: 'Manager',
  }
  return role ? labels[role] : 'Staff'
}

export function roleLabels(roles?: HotelStaffRole[]): string {
  return roles?.length ? roles.map((role) => roleLabel(role)).join(', ') : 'Staff'
}

export function getUserRoles(user: AuthUser): HotelStaffRole[] {
  return user.roles?.length ? user.roles : user.role ? [user.role] : []
}
