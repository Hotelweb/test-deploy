import { useEffect, useState } from 'react'
import { updateHotel, type Hotel, type HotelThemeColors, type HotelThemeMode } from '../api'
import {
  applyHotelTheme,
  normalizeThemeConfig,
  THEME_PRESETS,
  type NormalizedHotelThemeConfig,
} from '../lib/theme'
import { CheckIcon, ChevronDownIcon, CloseIcon, PaletteIcon } from './icons/ServiceIcons'

interface HotelThemeCustomizerProps {
  hotel: Hotel | null
  open: boolean
  onToggle: () => void
  onClose: () => void
  onSaved: (hotel: Hotel) => void
}

const themeColorFields: { key: keyof HotelThemeColors; label: string }[] = [
  { key: 'primary', label: 'Màu chính' },
  { key: 'secondary', label: 'Màu phụ' },
  { key: 'accent', label: 'Màu nhấn' },
  { key: 'background', label: 'Nền' },
  { key: 'surface', label: 'Bề mặt' },
  { key: 'text', label: 'Chữ' },
]

const modeOptions: { value: HotelThemeMode; label: string; description: string }[] = [
  { value: 'system', label: 'Theo thiết bị', description: 'Tự đổi theo cài đặt máy của khách' },
  { value: 'light', label: 'Luôn sáng', description: 'Giao diện sáng cố định' },
  { value: 'dark', label: 'Luôn tối', description: 'Giao diện tối cố định' },
]

export function HotelThemeCustomizer({
  hotel,
  open,
  onToggle,
  onClose,
  onSaved,
}: HotelThemeCustomizerProps) {
  const [draft, setDraft] = useState(() => normalizeThemeConfig(null))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!hotel) return
    setDraft(normalizeThemeConfig(hotel.theme_config))
    setError(null)
  }, [hotel])

  useEffect(() => {
    if (!open) return
    applyHotelTheme(draft)
  }, [draft, open])

  const handleSave = async () => {
    if (!hotel) return
    setSaving(true)
    setError(null)
    try {
      const saved = await updateHotel(hotel.id, { theme_config: draft })
      onSaved(saved)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không lưu được giao diện')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggle}
        disabled={!hotel || saving}
        className={`relative w-10 h-10 rounded-xl border flex items-center justify-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
          open
            ? 'bg-primary text-white border-primary'
            : 'bg-white text-text-muted border-border hover:bg-gray-50 hover:text-primary'
        }`}
        aria-label="Tùy chỉnh giao diện"
        aria-expanded={open}
      >
        <PaletteIcon className="w-5 h-5" />
      </button>

      {open && hotel ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-30 cursor-default"
            aria-label="Đóng tùy chỉnh giao diện"
            onClick={onClose}
          />
          <div className="absolute right-0 top-12 z-40 w-[min(24rem,calc(100vw-2rem))] rounded-2xl border border-border bg-white shadow-modal animate-scale-in overflow-hidden">
            <div className="flex items-start justify-between gap-3 border-b border-border-light px-4 py-3">
              <div className="min-w-0">
                <p className="text-[13.5px] font-bold text-text">Giao diện khách sạn</p>
                <p className="mt-0.5 truncate text-[11.5px] text-text-light">
                  Áp dụng cho trang khách, QR, chat và quản trị
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-text-light hover:bg-gray-100 hover:text-text cursor-pointer transition-colors"
                aria-label="Đóng"
              >
                <CloseIcon className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-[min(70vh,34rem)] overflow-y-auto px-4 py-4 space-y-4">
              {error ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700">
                  {error}
                </div>
              ) : null}

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Chế độ sáng/tối">
                  <SmoothDropdown
                    value={draft.mode}
                    options={modeOptions}
                    onChange={(value) =>
                      setDraft((prev) => ({ ...prev, mode: value as HotelThemeMode }))
                    }
                  />
                </Field>

                <Field label="Bộ màu nhanh">
                  <SmoothDropdown
                    value={draft.preset}
                    options={THEME_PRESETS.map((preset) => ({
                      value: preset.id,
                      label: preset.name,
                      colors: [
                        preset.colors.primary,
                        preset.colors.secondary,
                        preset.colors.accent,
                      ],
                    }))}
                    onChange={(value) => {
                      const preset = THEME_PRESETS.find((item) => item.id === value)
                      if (!preset) return
                      setDraft((prev) => ({
                        ...prev,
                        preset: preset.id,
                        colors: preset.colors,
                      }))
                    }}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {themeColorFields.map((field) => (
                  <ColorField
                    key={field.key}
                    label={field.label}
                    value={draft.colors[field.key] ?? '#000000'}
                    onChange={(value) =>
                      setDraft((prev) => ({
                        ...prev,
                        colors: { ...prev.colors, [field.key]: value },
                      }))
                    }
                  />
                ))}
              </div>

              <ThemePreview hotelName={hotel.name} theme={draft} />
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-border-light px-4 py-3">
              <button
                type="button"
                onClick={() => {
                  setDraft(normalizeThemeConfig(hotel.theme_config))
                  applyHotelTheme(hotel.theme_config)
                  onClose()
                }}
                disabled={saving}
                className="px-3.5 py-2 rounded-xl text-[12.5px] font-medium text-text-muted hover:bg-gray-100 disabled:opacity-50 cursor-pointer transition-colors"
              >
                Huỷ
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 rounded-xl text-[12.5px] font-semibold text-white gradient-primary shadow-card hover:shadow-card-hover disabled:opacity-50 cursor-pointer transition-all"
              >
                {saving ? 'Đang lưu...' : 'Lưu giao diện'}
              </button>
            </div>
          </div>
        </>
      ) : null}
    </div>
  )
}

function ThemePreview({
  hotelName,
  theme,
}: {
  hotelName: string
  theme: NormalizedHotelThemeConfig
}) {
  return (
    <div className="rounded-2xl border border-border-light bg-background-warm p-3">
      <div
        className="rounded-2xl border p-4 shadow-soft"
        style={{
          background: theme.colors.surface,
          borderColor: theme.colors.primary,
          color: theme.colors.text,
        }}
      >
        <p className="text-[11px] font-semibold uppercase tracking-wide opacity-70">Preview</p>
        <p className="mt-1 text-base font-bold">{hotelName}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {(['primary', 'secondary', 'accent'] as const).map((key) => (
            <span
              key={key}
              className="rounded-full px-3 py-1.5 text-[12px] font-semibold text-white"
              style={{ background: theme.colors[key] }}
            >
              {key}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

interface DropdownOption {
  value: string
  label: string
  description?: string
  colors?: string[]
}

function SmoothDropdown({
  value,
  options,
  onChange,
}: {
  value: string
  options: DropdownOption[]
  onChange: (value: string) => void
}) {
  const [open, setOpen] = useState(false)
  const selected = options.find((option) => option.value === value) ?? options[0]

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        onBlur={(event) => {
          if (!event.currentTarget.parentElement?.contains(event.relatedTarget as Node | null)) {
            setOpen(false)
          }
        }}
        className={`group flex min-h-11 w-full items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5 text-left text-[14px] shadow-soft cursor-pointer transition-all duration-200 ${
          open
            ? 'border-primary/40 bg-white ring-2 ring-primary/15'
            : 'border-border-light bg-gray-50 hover:border-primary/25 hover:bg-white'
        }`}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="flex min-w-0 items-center gap-2.5">
          {selected.colors ? <PaletteSwatches colors={selected.colors} /> : null}
          <span className="min-w-0">
            <span className="block truncate font-semibold text-text">{selected.label}</span>
            {selected.description ? (
              <span className="mt-0.5 block truncate text-[11px] text-text-light">
                {selected.description}
              </span>
            ) : null}
          </span>
        </span>
        <ChevronDownIcon
          className={`h-4 w-4 flex-shrink-0 text-text-light transition-transform duration-200 ${
            open ? 'rotate-180 text-primary' : 'group-hover:text-primary'
          }`}
        />
      </button>

      {open ? (
        <div
          className="absolute left-0 right-0 top-[calc(100%+0.375rem)] z-50 overflow-hidden rounded-xl border border-border bg-white p-1.5 shadow-modal animate-scale-in"
          role="listbox"
        >
          {options.map((option) => {
            const selectedOption = option.value === value
            return (
              <button
                key={option.value}
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  onChange(option.value)
                  setOpen(false)
                }}
                className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left cursor-pointer transition-colors duration-150 ${
                  selectedOption
                    ? 'bg-primary/10 text-primary'
                    : 'text-text-muted hover:bg-gray-50 hover:text-text'
                }`}
                role="option"
                aria-selected={selectedOption}
              >
                <span className="flex min-w-0 items-center gap-2.5">
                  {option.colors ? <PaletteSwatches colors={option.colors} /> : null}
                  <span className="min-w-0">
                    <span className="block truncate text-[13px] font-semibold">{option.label}</span>
                    {option.description ? (
                      <span className="mt-0.5 block truncate text-[11px] opacity-75">
                        {option.description}
                      </span>
                    ) : null}
                  </span>
                </span>
                {selectedOption ? <CheckIcon className="h-4 w-4 flex-shrink-0" /> : null}
              </button>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}

function PaletteSwatches({ colors }: { colors: string[] }) {
  return (
    <span className="flex h-6 w-9 flex-shrink-0 overflow-hidden rounded-lg border border-white shadow-soft">
      {colors.map((color) => (
        <span key={color} className="h-full flex-1" style={{ background: color }} />
      ))}
    </span>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="block">
      <span className="block text-[12.5px] font-medium text-text-muted mb-1.5">{label}</span>
      {children}
    </div>
  )
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <label className="block">
      <span className="block text-[12.5px] font-medium text-text-muted mb-1.5">{label}</span>
      <span className="flex items-center gap-2 rounded-xl bg-gray-50 border border-border-light px-2 py-2 focus-within:ring-2 focus-within:ring-primary/30 focus-within:bg-white focus-within:border-primary/40 transition-all">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 w-10 rounded-lg border border-border bg-transparent cursor-pointer"
          aria-label={label}
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          pattern="#[0-9a-fA-F]{6}"
          className="min-w-0 flex-1 bg-transparent text-[14px] font-medium text-text focus:outline-none"
        />
      </span>
    </label>
  )
}
