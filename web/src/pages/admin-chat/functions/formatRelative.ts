export function formatRelative(iso: string | null): string {
  if (!iso) return ''
  const date = new Date(iso)
  const diffMs = Date.now() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return 'vừa xong'
  if (diffMins < 60) return `${diffMins} phút`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours} giờ`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) return `${diffDays} ngày`
  return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })
}
