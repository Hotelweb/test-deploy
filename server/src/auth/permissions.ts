import { ForbiddenException } from '@nestjs/common';
import type { TokenPayload } from './token.service.js';
import { HotelStaffRole } from '../hotel-users/entities/hotel-user.entity.js';

export type StaffPermission =
  | 'orders:view'
  | 'orders:update'
  | 'services:manage'
  | 'chat:handle'
  | 'reports:view'
  | 'users:manage';

const ROLE_PERMISSIONS: Record<HotelStaffRole, StaffPermission[]> = {
  [HotelStaffRole.HOTEL_ADMIN]: [
    'orders:view',
    'orders:update',
    'services:manage',
    'chat:handle',
    'reports:view',
    'users:manage',
  ],
  [HotelStaffRole.MANAGER]: [
    'orders:view',
    'orders:update',
    'services:manage',
    'chat:handle',
    'reports:view',
  ],
  [HotelStaffRole.RECEPTION]: ['orders:view', 'chat:handle'],
  [HotelStaffRole.CASHIER]: ['orders:view', 'orders:update', 'reports:view'],
  [HotelStaffRole.FNB_STAFF]: ['orders:view', 'orders:update'],
  [HotelStaffRole.KITCHEN_STAFF]: ['orders:view', 'orders:update'],
  [HotelStaffRole.CUSTOMER_CARE]: ['chat:handle'],
  [HotelStaffRole.CONTENT_MANAGER]: ['services:manage'],
};

export function hasPermission(
  user: TokenPayload,
  permission: StaffPermission,
): boolean {
  if (user.scope === 'system') return true;
  const role = (user.role as HotelStaffRole | undefined) ?? HotelStaffRole.HOTEL_ADMIN;
  return Boolean(role && ROLE_PERMISSIONS[role]?.includes(permission));
}

export function assertPermission(
  user: TokenPayload,
  permission: StaffPermission,
): void {
  if (!hasPermission(user, permission)) {
    throw new ForbiddenException(`Missing permission: ${permission}`);
  }
}

export function getPermissionsForRole(role: HotelStaffRole): StaffPermission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}
