export function DateDivider({ label }: { label: string }) {
  return (
    <div className="flex justify-center py-2">
      <span className="bg-gray-100 text-text-light text-[11px] font-medium px-3 py-1 rounded-full">
        {label}
      </span>
    </div>
  )
}
