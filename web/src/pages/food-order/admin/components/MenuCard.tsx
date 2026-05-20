import type { MenuItem } from '../../../../api'
import {
  EditIcon,
  ImagePlaceholderIcon,
  TagIcon,
  TrashIcon,
} from '../../../../components/icons/ServiceIcons'
import { formatVnd } from '../../../../lib/currency'

interface MenuCardProps {
  item: MenuItem
  onEdit: (item: MenuItem) => void
  onDelete: (item: MenuItem) => void
}

export function MenuCard({ item, onEdit, onDelete }: MenuCardProps) {
  return (
    <article className="glass-card glass-card-hover rounded-2xl overflow-hidden flex flex-col">
      <div className="relative aspect-[4/3] bg-gray-100">
        {item.image_url ? (
          <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-text-lighter">
            <ImagePlaceholderIcon className="w-10 h-10" />
          </div>
        )}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-white/95 text-[11px] font-semibold text-text shadow-soft">
            <TagIcon className="w-3 h-3" />
            {item.category === 'drink' ? 'Nước uống' : 'Đồ ăn'}
          </span>
          {!item.is_available ? (
            <span className="inline-flex px-2 py-1 rounded-full bg-gray-900/80 text-white text-[11px] font-semibold">
              Đang ẩn
            </span>
          ) : null}
        </div>
      </div>
      <div className="p-4 flex flex-col gap-3 flex-1">
        <div className="min-w-0">
          <h3 className="font-bold text-[15px] text-text line-clamp-1">{item.name}</h3>
          {item.name_en ? (
            <p className="text-[12px] text-text-light mt-0.5 line-clamp-1">{item.name_en}</p>
          ) : null}
          {item.description ? (
            <p className="text-[12.5px] text-text-muted leading-relaxed mt-2 line-clamp-2">
              {item.description}
            </p>
          ) : null}
        </div>

        <div className="flex items-center justify-between gap-3 mt-auto pt-3 border-t border-border-light">
          <div>
            <p className="text-[10.5px] font-semibold uppercase tracking-wide text-text-light">
              Giá
            </p>
            <p className="text-[15px] font-bold text-primary">{formatVnd(item.price)}</p>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onEdit(item)}
              className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 flex items-center justify-center cursor-pointer transition-colors"
              aria-label={`Sửa món ${item.name}`}
            >
              <EditIcon className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onDelete(item)}
              className="w-9 h-9 rounded-xl text-red-600 hover:bg-red-50 flex items-center justify-center cursor-pointer transition-colors"
              aria-label={`Xoá món ${item.name}`}
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </article>
  )
}
