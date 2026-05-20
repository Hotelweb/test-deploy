export function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' }) {
  const initial = (name || 'K').charAt(0).toUpperCase()
  const sz = size === 'sm' ? 'w-9 h-9 text-[13px]' : 'w-10 h-10 text-[14px]'
  const colors = [
    'bg-gradient-to-br from-indigo-500 to-purple-500',
    'bg-gradient-to-br from-pink-500 to-rose-500',
    'bg-gradient-to-br from-amber-500 to-orange-500',
    'bg-gradient-to-br from-emerald-500 to-teal-500',
    'bg-gradient-to-br from-blue-500 to-sky-500',
    'bg-gradient-to-br from-rose-500 to-red-500',
    'bg-gradient-to-br from-violet-500 to-fuchsia-500',
  ]
  const colorIdx = (name?.charCodeAt(0) ?? 0) % colors.length
  return (
    <div
      className={`${sz} ${colors[colorIdx]} rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0`}
      aria-hidden
    >
      {initial}
    </div>
  )
}
