import type { FoodOrderStatus } from '../../../api'

export type Tab = 'stats' | 'orders' | 'menu'
export type OrderFilter = FoodOrderStatus | 'all'

export const STATUS_LABEL: Record<FoodOrderStatus, string> = {
  new: 'Mới',
  accepted: 'Đã nhận',
  preparing: 'Đang chuẩn bị',
  delivering: 'Đang giao',
  completed: 'Hoàn thành',
  cancelled: 'Đã huỷ',
  rejected: 'Đã từ chối',
}

export const STATUS_CLASS: Record<FoodOrderStatus, string> = {
  new: 'bg-amber-50 text-amber-800',
  accepted: 'bg-blue-50 text-blue-800',
  preparing: 'bg-indigo-50 text-indigo-800',
  delivering: 'bg-cyan-50 text-cyan-800',
  completed: 'bg-emerald-50 text-emerald-800',
  cancelled: 'bg-gray-100 text-gray-600',
  rejected: 'bg-red-50 text-red-800',
}

export const ORDER_FILTERS: { key: OrderFilter; label: string; tone: string }[] = [
  { key: 'all', label: 'Tất cả', tone: 'bg-gray-100 text-text' },
  { key: 'new', label: 'Mới', tone: 'bg-amber-50 text-amber-800' },
  { key: 'accepted', label: 'Đã nhận', tone: 'bg-blue-50 text-blue-800' },
  { key: 'preparing', label: 'Chuẩn bị', tone: 'bg-indigo-50 text-indigo-800' },
  { key: 'delivering', label: 'Đang giao', tone: 'bg-cyan-50 text-cyan-800' },
  { key: 'completed', label: 'Hoàn thành', tone: 'bg-emerald-50 text-emerald-800' },
  { key: 'rejected', label: 'Từ chối', tone: 'bg-red-50 text-red-800' },
  { key: 'cancelled', label: 'Đã huỷ', tone: 'bg-gray-100 text-gray-600' },
]

export const TABS: { key: Tab; label: string }[] = [
  { key: 'stats', label: 'Thống kê' },
  { key: 'orders', label: 'Đơn hàng' },
  { key: 'menu', label: 'Thực đơn' },
]
