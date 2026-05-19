import { ICON_CATALOG, getIconEntry, isIconUrl } from '../lib/serviceCatalog'
import { ImagePlaceholderIcon } from './icons/ServiceIcons'

interface IconPickerProps {
  value: string | null | undefined
  onChange: (next: string | null) => void
}

const TONE_BG: Record<string, string> = {
  blue: 'bg-blue-100 text-blue-600',
  orange: 'bg-orange-100 text-orange-600',
  green: 'bg-green-100 text-green-600',
  purple: 'bg-purple-100 text-purple-600',
  red: 'bg-red-100 text-red-600',
  yellow: 'bg-yellow-100 text-yellow-700',
  indigo: 'bg-indigo-100 text-indigo-600',
  pink: 'bg-pink-100 text-pink-600',
  teal: 'bg-teal-100 text-teal-600',
  emerald: 'bg-emerald-100 text-emerald-600',
  sky: 'bg-sky-100 text-sky-600',
  violet: 'bg-violet-100 text-violet-600',
  rose: 'bg-rose-100 text-rose-600',
  amber: 'bg-amber-100 text-amber-700',
  lime: 'bg-lime-100 text-lime-700',
  fuchsia: 'bg-fuchsia-100 text-fuchsia-600',
  cyan: 'bg-cyan-100 text-cyan-600',
  slate: 'bg-slate-100 text-slate-600',
}

/**
 * Visual picker for the catalogue of bundled service icons.
 *
 * The component writes the **catalog key** (e.g. `"spa"`) to `value` —
 * `services.icon_url` is reused as a generic identifier column. Legacy rows
 * that still contain a real URL are recognised by `isIconUrl()` and shown
 * as a thumbnail preview with a "remove" affordance.
 */
export function IconPicker({ value, onChange }: IconPickerProps) {
  const selected = getIconEntry(value)
  const legacyUrl = !selected && isIconUrl(value) ? value : null

  return (
    <div className="space-y-2">
      {legacyUrl ? (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-50 border border-amber-200 text-[12px] text-amber-800">
          <img src={legacyUrl} alt="" className="w-7 h-7 rounded-lg object-cover flex-shrink-0" />
          <span className="flex-1 truncate">URL biểu tượng cũ — chọn icon mới để thay thế</span>
          <button
            type="button"
            onClick={() => onChange(null)}
            className="text-[11.5px] text-amber-700 hover:text-amber-900 font-medium cursor-pointer flex-shrink-0"
          >
            Xoá
          </button>
        </div>
      ) : null}

      <div className="grid grid-cols-6 sm:grid-cols-7 gap-2 p-3 rounded-xl bg-gray-50 border border-border-light">
        {/* Empty / no icon option — first so admins know they can opt out. */}
        <IconChoice label="Không" selected={!selected && !legacyUrl} onClick={() => onChange(null)}>
          <ImagePlaceholderIcon className="w-5 h-5 text-text-lighter" />
        </IconChoice>

        {ICON_CATALOG.map((entry) => {
          const isActive = selected?.key === entry.key
          const tone = TONE_BG[entry.tone] ?? TONE_BG.blue
          return (
            <IconChoice
              key={entry.key}
              label={entry.label}
              selected={isActive}
              tone={tone}
              onClick={() => onChange(entry.key)}
            >
              <entry.Icon className="w-5 h-5" />
            </IconChoice>
          )
        })}
      </div>

      {selected ? (
        <p className="text-[11.5px] text-text-light">
          Đã chọn: <strong className="text-text">{selected.label}</strong>
        </p>
      ) : (
        <p className="text-[11.5px] text-text-light">
          Chưa chọn — dịch vụ sẽ hiển thị với biểu tượng mặc định
        </p>
      )}
    </div>
  )
}

function IconChoice({
  selected,
  label,
  tone,
  onClick,
  children,
}: {
  selected: boolean
  label: string
  tone?: string
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      aria-pressed={selected}
      className={`group aspect-square rounded-xl flex items-center justify-center transition-all cursor-pointer ${
        selected
          ? 'ring-2 ring-primary ring-offset-2 ring-offset-gray-50 bg-white shadow-card'
          : `${tone ?? 'bg-white text-text-lighter'} hover:scale-105`
      }`}
    >
      {children}
    </button>
  )
}
