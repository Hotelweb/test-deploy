import type { MenuItem } from '../../../../api'
import { MenuCard } from './MenuCard'

interface MenuSectionProps {
  title: string
  items: MenuItem[]
  onEdit: (item: MenuItem) => void
  onDelete: (item: MenuItem) => void
}

export function MenuSection({ title, items, onEdit, onDelete }: MenuSectionProps) {
  if (items.length === 0) return null

  return (
    <section>
      <div className="flex items-center justify-between gap-3 mb-3">
        <h3 className="text-[14px] font-bold text-text">{title}</h3>
        <span className="text-[12px] font-semibold text-text-light bg-white border border-border-light rounded-full px-2.5 py-1">
          {items.length} món
        </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {items.map((item) => (
          <MenuCard key={item.id} item={item} onEdit={onEdit} onDelete={onDelete} />
        ))}
      </div>
    </section>
  )
}
