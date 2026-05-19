import { useEffect, useMemo, useRef, useState } from 'react'
import {
  createService,
  updateService,
  type AdminHotelService,
  type CreateServiceInput,
  type ServiceLanguage,
  type ServiceTranslationInput,
  type ServiceType,
  type UpdateServiceInput,
} from '../api'
import { LANGUAGES } from '../lib/languages'
import type { ServicePreset } from '../lib/serviceCatalog'
import { CloseIcon, PlusIcon } from './icons/ServiceIcons'
import { IconPicker } from './IconPicker'
import { ImageUploader } from './ImageUploader'
import { MarkdownEditor } from './MarkdownEditor'
import { ServicePresetPicker } from './ServicePresetPicker'

type ServiceFormMode = 'create' | 'edit'

interface ServiceFormModalProps {
  open: boolean
  mode: ServiceFormMode
  hotelId: number
  /** When mode === 'edit', the service to populate the form with. */
  service?: AdminHotelService | null
  onClose: () => void
  onSaved: (saved: AdminHotelService) => void
}

const SUPPORTED_LANGUAGES = LANGUAGES.map((l) => l.code as ServiceLanguage)
const DEFAULT_LANG: ServiceLanguage = 'vi'
const FALLBACK_LANG: ServiceLanguage = 'en'

interface TranslationDraft {
  language: ServiceLanguage
  title: string
  description: string
}

/**
 * Modal for creating or editing a service.
 *
 * Multi-language is handled via a tab strip — the admin picks which languages
 * to author. Vietnamese is on by default and English is added next when the
 * admin clicks "Thêm ngôn ngữ" (the customer view falls back to English).
 *
 * Description uses our `MarkdownEditor` so admins get formatting + a live
 * preview without leaving the modal.
 */
export function ServiceFormModal({
  open,
  mode,
  hotelId,
  service,
  onClose,
  onSaved,
}: ServiceFormModalProps) {
  const [iconUrl, setIconUrl] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [sortOrder, setSortOrder] = useState<number>(0)
  const [isActive, setIsActive] = useState(true)
  const [serviceType, setServiceType] = useState<ServiceType>('content')
  const [translations, setTranslations] = useState<TranslationDraft[]>([])
  const [activeLang, setActiveLang] = useState<ServiceLanguage>(DEFAULT_LANG)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const formBodyRef = useRef<HTMLFormElement>(null)

  // -------------------------------------------------------------------------
  // Initialise form whenever the modal opens with new data
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (!open) return
    let cancelled = false
    void Promise.resolve().then(() => {
      if (cancelled) return

      setError(null)
      setSubmitting(false)

      if (mode === 'edit' && service) {
        setIconUrl(service.icon_url ?? '')
        setImageUrl(service.image_url ?? '')
        setSortOrder(service.sort_order ?? 0)
        setIsActive(service.is_active ?? true)
        setServiceType(service.service_type ?? 'content')
        const drafts: TranslationDraft[] = service.translations.length
          ? service.translations.map((t) => ({
              language: t.language as ServiceLanguage,
              title: t.title,
              description: t.description ?? '',
            }))
          : [{ language: DEFAULT_LANG, title: '', description: '' }]
        setTranslations(drafts)
        setActiveLang(drafts[0].language)
      } else {
        setIconUrl('')
        setImageUrl('')
        setSortOrder(0)
        setIsActive(true)
        setServiceType('content')
        setTranslations([{ language: DEFAULT_LANG, title: '', description: '' }])
        setActiveLang(DEFAULT_LANG)
      }
    })

    const t = window.setTimeout(() => {
      formBodyRef.current?.scrollTo({ top: 0 })
    }, 0)
    return () => {
      cancelled = true
      window.clearTimeout(t)
    }
  }, [open, mode, service])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !submitting) onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, submitting, onClose])

  // -------------------------------------------------------------------------
  // Translation helpers
  // -------------------------------------------------------------------------
  const activeDraft = useMemo(
    () => translations.find((t) => t.language === activeLang) ?? null,
    [translations, activeLang],
  )

  const remainingLanguages = useMemo(
    () => SUPPORTED_LANGUAGES.filter((code) => !translations.some((t) => t.language === code)),
    [translations],
  )

  const updateActiveDraft = (patch: Partial<TranslationDraft>) => {
    setTranslations((prev) => prev.map((t) => (t.language === activeLang ? { ...t, ...patch } : t)))
  }

  const addLanguage = (code: ServiceLanguage) => {
    setTranslations((prev) => [...prev, { language: code, title: '', description: '' }])
    setActiveLang(code)
  }

  const removeLanguage = (code: ServiceLanguage) => {
    if (translations.length <= 1) return
    setTranslations((prev) => {
      const next = prev.filter((t) => t.language !== code)
      // If we removed the active tab, jump to the first remaining one.
      if (code === activeLang) setActiveLang(next[0]?.language ?? DEFAULT_LANG)
      return next
    })
  }

  /**
   * Apply a preset: overlay the icon + translations onto the current draft.
   *
   * - Icon key replaces the current icon (admins picked the preset for it).
   * - Each preset translation either replaces an existing same-language
   *   draft or is appended. Preset languages take precedence so the
   *   pre-written markdown shows up instantly.
   * - Other meta (sort_order, is_active, image_url) is left untouched so
   *   admins can apply a preset mid-edit without losing their config.
   */
  const applyPreset = (preset: ServicePreset) => {
    setIconUrl(preset.iconKey)
    setTranslations((prev) => {
      const merged = new Map<string, TranslationDraft>()
      for (const t of prev) merged.set(t.language, t)
      for (const t of preset.translations) {
        merged.set(t.language, {
          language: t.language,
          title: t.title,
          description: t.description,
        })
      }
      return Array.from(merged.values())
    })
    // Jump to the first language the preset provides so the admin sees the
    // freshly populated content immediately.
    const firstPresetLang = preset.translations[0]?.language
    if (firstPresetLang) setActiveLang(firstPresetLang)
    if (preset.serviceType) setServiceType(preset.serviceType)
  }

  // -------------------------------------------------------------------------
  // Submit
  // -------------------------------------------------------------------------
  const validate = (): string | null => {
    if (translations.length === 0) return 'Cần ít nhất một ngôn ngữ'
    for (const t of translations) {
      if (!t.title.trim()) {
        const langLabel = LANGUAGES.find((l) => l.code === t.language)?.nativeName ?? t.language
        return `Vui lòng nhập tiêu đề cho ngôn ngữ ${langLabel}`
      }
      if (t.title.length > 200) {
        return `Tiêu đề không vượt quá 200 ký tự`
      }
    }
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const validation = validate()
    if (validation) {
      setError(validation)
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      const payloadTranslations: ServiceTranslationInput[] = translations.map((t) => ({
        language: t.language,
        title: t.title.trim(),
        description: t.description.trim() || undefined,
      }))

      let saved: AdminHotelService
      if (mode === 'edit' && service) {
        const updateBody: UpdateServiceInput = {
          icon_url: iconUrl.trim() || undefined,
          image_url: imageUrl.trim() || undefined,
          sort_order: Number.isFinite(sortOrder) ? sortOrder : 0,
          is_active: isActive,
          service_type: serviceType,
          translations: payloadTranslations,
        }
        saved = await updateService(service.id, updateBody)
      } else {
        const createBody: CreateServiceInput = {
          hotel_id: hotelId,
          icon_url: iconUrl.trim() || undefined,
          image_url: imageUrl.trim() || undefined,
          sort_order: Number.isFinite(sortOrder) ? sortOrder : 0,
          is_active: isActive,
          service_type: serviceType,
          translations: payloadTranslations,
        }
        saved = await createService(createBody)
      }

      onSaved(saved)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không lưu được dịch vụ'
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="service-form-title"
      onClick={() => !submitting && onClose()}
    >
      <div
        className="w-full max-w-3xl bg-white rounded-3xl shadow-modal max-h-[92vh] flex flex-col animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-border-light flex items-center justify-between flex-shrink-0">
          <div>
            <h2
              id="service-form-title"
              className="text-lg font-bold text-text"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              {mode === 'edit' ? 'Chỉnh sửa dịch vụ' : 'Thêm dịch vụ mới'}
            </h2>
            <p className="text-[12.5px] text-text-light mt-0.5">
              {mode === 'edit'
                ? 'Cập nhật thông tin và nội dung mô tả Markdown'
                : 'Tạo dịch vụ và viết mô tả bằng Markdown cho khách'}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            className="w-9 h-9 rounded-xl text-text-muted hover:bg-gray-100 flex items-center justify-center cursor-pointer disabled:opacity-50 transition-colors"
            aria-label="Đóng"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form
          ref={formBodyRef}
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto px-6 py-5 space-y-6 min-h-0"
        >
          {error ? (
            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-[13px] text-red-700">
              {error}
            </div>
          ) : null}

          {/* Preset picker — only shown when creating to avoid surprising
              the admin by overwriting carefully-edited content. */}
          {mode === 'create' ? <ServicePresetPicker onPick={applyPreset} /> : null}

          {/* Meta */}
          <section className="space-y-3">
            <h3 className="text-[12px] font-semibold uppercase tracking-wide text-text-light">
              Hiển thị
            </h3>

            <div>
              <span className="block text-[12.5px] font-medium text-text-muted mb-1.5">
                Biểu tượng
              </span>
              <IconPicker value={iconUrl || null} onChange={(next) => setIconUrl(next ?? '')} />
            </div>

            <div>
              <span className="block text-[12.5px] font-medium text-text-muted mb-1.5">
                Ảnh bìa (tuỳ chọn)
              </span>
              <ImageUploader
                value={imageUrl || null}
                onChange={(next) => setImageUrl(next ?? '')}
                folder="services"
                aspect="wide"
                ariaLabel="Tải ảnh bìa dịch vụ"
                hint="Hiển thị ở đầu modal chi tiết khi khách bấm vào dịch vụ"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Thứ tự hiển thị (số nhỏ lên trước)">
                <input
                  type="number"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(Number(e.target.value) || 0)}
                  className={inputClass}
                  min={0}
                />
              </Field>
              <Field label="Loại dịch vụ">
                <select
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value as ServiceType)}
                  className={inputClass}
                >
                  <option value="content">Nội dung (modal mô tả)</option>
                  <option value="food_order">Đặt đồ ăn & nước uống</option>
                </select>
              </Field>
              <label className="flex items-end gap-2 pb-1.5 cursor-pointer select-none sm:col-span-2">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 rounded border-border accent-primary cursor-pointer"
                />
                <span className="text-[13px] text-text-muted">Hiển thị dịch vụ này cho khách</span>
              </label>
            </div>
          </section>

          {/* Translations */}
          <section className="space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <h3 className="text-[12px] font-semibold uppercase tracking-wide text-text-light">
                Nội dung theo ngôn ngữ
              </h3>
              {remainingLanguages.length > 0 ? (
                <LanguagePickerMenu
                  languages={remainingLanguages}
                  onPick={addLanguage}
                  disabled={submitting}
                />
              ) : null}
            </div>

            {/* Language tabs */}
            <div className="flex items-center gap-1 overflow-x-auto -mx-1 px-1 pb-1 scrollbar-none">
              {translations.map((t) => {
                const lang = LANGUAGES.find((l) => l.code === t.language)
                const isActiveTab = t.language === activeLang
                const canRemove = translations.length > 1
                return (
                  <div
                    key={t.language}
                    className={`flex items-center rounded-full transition-all flex-shrink-0 ${
                      isActiveTab ? 'bg-primary text-white' : 'bg-gray-100 text-text-muted'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setActiveLang(t.language)}
                      className="flex items-center gap-1.5 pl-3 pr-2 py-1.5 text-[12px] font-medium whitespace-nowrap cursor-pointer"
                    >
                      <span aria-hidden>{lang?.flag ?? '🌐'}</span>
                      <span>{lang?.nativeName ?? t.language}</span>
                      {t.language === FALLBACK_LANG ? (
                        <span
                          className={`text-[10px] font-semibold rounded-full px-1.5 py-0 ${
                            isActiveTab ? 'bg-white/25 text-white' : 'bg-white text-text-muted'
                          }`}
                        >
                          mặc định
                        </span>
                      ) : null}
                    </button>
                    {canRemove ? (
                      <button
                        type="button"
                        onClick={() => removeLanguage(t.language)}
                        className={`w-7 h-7 rounded-full flex items-center justify-center cursor-pointer ${
                          isActiveTab
                            ? 'text-white/80 hover:text-white hover:bg-white/15'
                            : 'text-text-light hover:text-red-600 hover:bg-red-50'
                        }`}
                        aria-label={`Xoá ngôn ngữ ${lang?.nativeName ?? t.language}`}
                      >
                        <CloseIcon className="w-3.5 h-3.5" />
                      </button>
                    ) : null}
                  </div>
                )
              })}
            </div>

            {activeDraft ? (
              <div className="space-y-3">
                <Field label="Tiêu đề" required>
                  <input
                    type="text"
                    value={activeDraft.title}
                    onChange={(e) => updateActiveDraft({ title: e.target.value })}
                    placeholder="Spa & Massage"
                    className={inputClass}
                    maxLength={200}
                    required
                  />
                </Field>
                <Field
                  label="Mô tả (Markdown)"
                  hint="Hỗ trợ định dạng: tiêu đề (##), danh sách (-), liên kết, bảng, in đậm, in nghiêng"
                >
                  <MarkdownEditor
                    value={activeDraft.description}
                    onChange={(next) => updateActiveDraft({ description: next })}
                    rows={10}
                    placeholder="## Spa cao cấp&#10;&#10;Mở cửa 9:00 - 22:00&#10;&#10;- Massage toàn thân&#10;- Xông hơi"
                    ariaLabel="Mô tả dịch vụ"
                  />
                </Field>
              </div>
            ) : null}
          </section>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border-light flex items-center justify-end gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2.5 rounded-xl text-[13.5px] font-medium text-text-muted hover:bg-gray-100 disabled:opacity-50 cursor-pointer transition-colors"
          >
            Huỷ
          </button>
          <button
            type="submit"
            disabled={submitting}
            onClick={handleSubmit}
            className="px-5 py-2.5 rounded-xl text-[13.5px] font-semibold text-white gradient-primary shadow-card hover:shadow-card-hover disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all"
          >
            {submitting ? 'Đang lưu…' : mode === 'edit' ? 'Lưu thay đổi' : 'Tạo dịch vụ'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function LanguagePickerMenu({
  languages,
  onPick,
  disabled,
}: {
  languages: ServiceLanguage[]
  onPick: (code: ServiceLanguage) => void
  disabled?: boolean
}) {
  const [open, setOpen] = useState(false)

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const onClick = () => setOpen(false)
    window.addEventListener('click', onClick)
    return () => window.removeEventListener('click', onClick)
  }, [open])

  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={disabled}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium bg-gray-100 text-text-muted hover:bg-gray-200 cursor-pointer disabled:opacity-50 transition-colors"
      >
        <PlusIcon className="w-3.5 h-3.5" />
        Thêm ngôn ngữ
      </button>
      {open ? (
        <div className="absolute right-0 mt-1 w-44 bg-white rounded-xl shadow-modal border border-border-light py-1 z-10 animate-scale-in">
          {languages.map((code) => {
            const lang = LANGUAGES.find((l) => l.code === code)
            return (
              <button
                key={code}
                type="button"
                onClick={() => {
                  onPick(code)
                  setOpen(false)
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-[13px] text-text hover:bg-gray-50 cursor-pointer text-left"
              >
                <span aria-hidden>{lang?.flag ?? '🌐'}</span>
                <span>{lang?.nativeName ?? code}</span>
              </button>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}

const inputClass =
  'w-full px-3.5 py-2.5 rounded-xl bg-gray-50 text-[14px] focus:outline-none focus:ring-2 focus:ring-primary/30 focus:bg-white border border-border-light focus:border-primary/40 transition-all placeholder:text-text-lighter'

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string
  required?: boolean
  hint?: string
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="block text-[12.5px] font-medium text-text-muted mb-1.5">
        {label}
        {required ? <span className="text-red-500"> *</span> : null}
      </span>
      {children}
      {hint ? <span className="block text-[11.5px] text-text-light mt-1">{hint}</span> : null}
    </label>
  )
}
