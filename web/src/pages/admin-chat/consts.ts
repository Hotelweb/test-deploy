import type { ChatSessionStatus } from '../../api'

export const STAFF_USER_ID = 1
export const ADMIN_LANG = 'vi'

export type FilterKey = 'all' | 'active' | 'waiting' | 'resolved' | 'closed'

export const FILTERS: { key: FilterKey; label: string; statuses?: ChatSessionStatus[] }[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'active', label: 'Đang xử lý', statuses: ['ASSIGNED'] },
  { key: 'waiting', label: 'Đang chờ', statuses: ['OPEN', 'PENDING'] },
  { key: 'resolved', label: 'Đã xử lý', statuses: ['RESOLVED', 'BOOKED'] },
  { key: 'closed', label: 'Đã đóng', statuses: ['CLOSED'] },
]
