import type { FoodOrderStatus } from '../../../api'

export type Tab = 'stats' | 'orders' | 'menu'
export type OrderFilter = FoodOrderStatus | 'all'

export const STATUS_LABEL: Record<FoodOrderStatus, string> = {
  PENDING: 'Chờ xử lý',
  ACCEPTED: 'Đã chấp nhận',
  REJECTED: 'Đã từ chối',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã huỷ',
}

export const STATUS_CLASS: Record<FoodOrderStatus, string> = {
  PENDING: 'bg-amber-50 text-amber-800',
  ACCEPTED: 'bg-blue-50 text-blue-800',
  REJECTED: 'bg-red-50 text-red-800',
  COMPLETED: 'bg-emerald-50 text-emerald-800',
  CANCELLED: 'bg-gray-100 text-gray-600',
}

export const ORDER_FILTERS: { key: OrderFilter; label: string; tone: string }[] = [
  { key: 'all', label: 'Tất cả', tone: 'bg-gray-100 text-text' },
  { key: 'PENDING', label: 'Chờ xử lý', tone: 'bg-amber-50 text-amber-800' },
  { key: 'ACCEPTED', label: 'Đã nhận', tone: 'bg-blue-50 text-blue-800' },
  { key: 'COMPLETED', label: 'Đã giao', tone: 'bg-emerald-50 text-emerald-800' },
  { key: 'REJECTED', label: 'Từ chối', tone: 'bg-red-50 text-red-800' },
  { key: 'CANCELLED', label: 'Đã huỷ', tone: 'bg-gray-100 text-gray-600' },
]

export const TABS: { key: Tab; label: string }[] = [
  { key: 'stats', label: 'Thống kê' },
  { key: 'orders', label: 'Đơn hàng' },
  { key: 'menu', label: 'Thực đơn' },
]
