import { useEffect, useMemo } from 'react'
import type { HotelService } from '../api'
import { LANGUAGES } from '../lib/languages'
import { getIconEntry, isIconUrl } from '../lib/serviceCatalog'
import { CloseIcon } from './icons/ServiceIcons'
import { MarkdownContent } from './MarkdownContent'

interface ServiceDetailModalProps {
  open: boolean
  service: HotelService | null
  /**
   * Currently active UI language (so we can pick the matching translation
   * from the bundled `service.translations` array without another request).
   */
  language?: string
  onClose: () => void
}

/**
 * Customer-facing "tap a service to read more" modal.
 *
 * The list endpoint returns the full set of translations per service, so we
 * resolve the right one client-side and fall back gracefully (requested →
 * English → first available). This keeps it snappy when a guest toggles the
 * UI language without re-fetching.
 */
export function ServiceDetailModal({ open, service, language, onClose }: ServiceDetailModalProps) {
  // Close on Escape
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const resolved = useMemo(() => {
    if (!service) return null
    const translations = service.translations ?? []
    const picked =
      (language && translations.find((t) => t.language === language)) ||
      translations.find((t) => t.language === 'en') ||
      translations[0]

    return {
      title: picked?.title || service.title || '',
      description: picked?.description || service.description || '',
      langCode: picked?.language ?? service.language ?? '',
    }
  }, [service, language])

  if (!open || !service || !resolved) return null

  const langMeta = LANGUAGES.find((l) => l.code === resolved.langCode)
  const iconEntry = getIconEntry(service.icon_url)
  const legacyIconUrl = !iconEntry && isIconUrl(service.icon_url) ? service.icon_url : null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="service-detail-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-white rounded-3xl shadow-modal max-h-[92vh] flex flex-col animate-scale-in overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Banner image (if any) */}
        {service.image_url ? (
          <div className="relative w-full h-48 sm:h-56 flex-shrink-0 bg-gray-100">
            <img
              src={service.image_url}
              alt={resolved.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/90 hover:bg-white text-text flex items-center justify-center cursor-pointer shadow-soft transition-colors backdrop-blur"
              aria-label="Đóng"
            >
              <CloseIcon className="w-5 h-5" />
            </button>
            <div className="absolute bottom-4 left-5 right-5">
              <h2
                id="service-detail-title"
                className="text-white text-xl sm:text-2xl font-bold drop-shadow-md"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                {resolved.title}
              </h2>
            </div>
          </div>
        ) : (
          <div className="px-6 pt-5 pb-3 border-b border-border-light flex items-start justify-between gap-3 flex-shrink-0">
            <div className="min-w-0">
              {iconEntry ? (
                <span className="inline-flex w-10 h-10 rounded-xl bg-emerald-50 text-primary items-center justify-center mb-3">
                  <iconEntry.Icon className="w-5 h-5" />
                </span>
              ) : legacyIconUrl ? (
                <img
                  src={legacyIconUrl}
                  alt=""
                  className="w-10 h-10 rounded-xl mb-3 object-cover"
                />
              ) : null}
              <h2
                id="service-detail-title"
                className="text-xl font-bold text-text leading-tight"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                {resolved.title}
              </h2>
              {langMeta ? (
                <p className="text-[12px] text-text-light mt-1">
                  <span aria-hidden>{langMeta.flag}</span> {langMeta.nativeName}
                </p>
              ) : null}
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl text-text-muted hover:bg-gray-100 flex items-center justify-center cursor-pointer transition-colors flex-shrink-0"
              aria-label="Đóng"
            >
              <CloseIcon className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 min-h-0">
          {resolved.description.trim() ? (
            <MarkdownContent content={resolved.description} />
          ) : (
            <p className="text-text-light italic text-[14px]">
              Chưa có mô tả chi tiết cho dịch vụ này.
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-border-light flex items-center justify-end flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-[13px] font-medium text-text-muted hover:bg-gray-100 cursor-pointer transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  )
}
