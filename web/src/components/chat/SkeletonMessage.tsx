interface SkeletonMessageProps {
  align?: 'left' | 'right'
}

export function SkeletonMessage({ align = 'left' }: SkeletonMessageProps) {
  return (
    <div className={`flex ${align === 'right' ? 'justify-end' : 'justify-start'}`}>
      <div className="max-w-[78%] space-y-1.5">
        <div className="h-4 w-44 rounded-xl bg-gray-200 animate-shimmer" />
        <div className="h-4 w-28 rounded-xl bg-gray-200 animate-shimmer" />
      </div>
    </div>
  )
}

export function SkeletonList() {
  return (
    <div className="space-y-3 px-4 py-4" aria-hidden>
      <SkeletonMessage align="left" />
      <SkeletonMessage align="right" />
      <SkeletonMessage align="left" />
    </div>
  )
}
