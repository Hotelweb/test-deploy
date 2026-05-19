import { useState } from 'react'
import { SERVICE_PRESETS, getIconEntry, type ServicePreset } from '../lib/serviceCatalog'
import { SparkleIcon } from './icons/ServiceIcons'

interface ServicePresetPickerProps {
  /**
   * Triggered when the admin picks a preset. The form modal merges the
   * preset translations + icon key into its draft state.
   */
  onPick: (preset: ServicePreset) => void
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
 * Quick-start tray. Collapsed by default to keep the form short for admins
 * who already know what they want; expanded reveals a grid of common hotel
 * services (lễ tân, spa, đưa đón sân bay…) that pre-fill the form.
 */
export function ServicePresetPicker({ onPick }: ServicePresetPickerProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-2 px-3.5 py-2.5 text-left cursor-pointer hover:bg-emerald-50 transition-colors"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2 min-w-0">
          <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
            <SparkleIcon className="w-4 h-4" />
          </span>
          <span className="min-w-0">
            <span className="block text-[13px] font-semibold text-emerald-900 leading-tight">
              Mẫu dịch vụ có sẵn
            </span>
            <span className="block text-[11.5px] text-emerald-800/80 truncate">
              Chọn để tự điền tiêu đề, mô tả Markdown và biểu tượng
            </span>
          </span>
        </span>
        <svg
          viewBox="0 0 24 24"
          className={`w-4 h-4 text-emerald-700 flex-shrink-0 transition-transform ${
            open ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open ? (
        <div className="px-3 pb-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {SERVICE_PRESETS.map((preset) => (
              <PresetCard
                key={preset.id}
                preset={preset}
                onPick={() => {
                  onPick(preset)
                  setOpen(false)
                }}
              />
            ))}
          </div>
          <p className="text-[11.5px] text-emerald-800/70 mt-2.5 leading-snug">
            Bạn có thể chỉnh sửa toàn bộ nội dung sau khi áp dụng mẫu.
          </p>
        </div>
      ) : null}
    </div>
  )
}

function PresetCard({ preset, onPick }: { preset: ServicePreset; onPick: () => void }) {
  const iconEntry = getIconEntry(preset.iconKey)
  const tone = iconEntry ? (TONE_BG[iconEntry.tone] ?? TONE_BG.blue) : TONE_BG.blue

  return (
    <button
      type="button"
      onClick={onPick}
      className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-white border border-emerald-100 hover:border-emerald-300 hover:shadow-soft text-left cursor-pointer transition-all group"
    >
      <span className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${tone}`}>
        {iconEntry ? <iconEntry.Icon className="w-4.5 h-4.5" /> : null}
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-[12.5px] font-semibold text-text leading-tight truncate">
          {preset.label}
        </span>
        <span className="block text-[11px] text-text-light leading-snug line-clamp-1 mt-0.5">
          {preset.hint}
        </span>
      </span>
    </button>
  )
}
