import { LANGUAGES } from '../../lib/languages'
import { t } from '../../lib/i18n'
import { ArrowRightIcon, GlobeIcon } from '../icons/ServiceIcons'

interface LanguagePickerProps {
  selected: string | null
  onSelect: (code: string) => void
  onContinue: () => void
  hotelName: string
}

export function LanguagePicker({ selected, onSelect, onContinue, hotelName }: LanguagePickerProps) {
  // Show titles in the selected language for live preview, fallback to English
  const lang = selected ?? 'en'

  return (
    <div className="flex-1 flex flex-col overflow-y-auto bg-gradient-to-b from-white to-gray-50/60">
      <div className="px-6 pt-7 pb-4 text-center">
        <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-primary">
          <GlobeIcon className="w-6 h-6" />
        </div>
        <h3 className="text-lg sm:text-xl font-bold text-text leading-tight">
          {t(lang, 'lang.title')}
        </h3>
        <p className="text-[13px] sm:text-sm text-text-light mt-1.5 max-w-[280px] mx-auto leading-relaxed">
          {t(lang, 'lang.subtitle')}
        </p>
      </div>

      <div className="flex-1 px-5 pb-3">
        <ul className="grid grid-cols-1 gap-2" role="listbox" aria-label="Language selection">
          {LANGUAGES.map((l) => {
            const isActive = selected === l.code
            return (
              <li key={l.code}>
                <button
                  type="button"
                  role="option"
                  aria-selected={isActive}
                  onClick={() => onSelect(l.code)}
                  className={`w-full flex items-center gap-3 p-3 rounded-2xl border transition-all duration-200 text-left cursor-pointer ${
                    isActive
                      ? 'bg-emerald-50 border-emerald-300 shadow-soft'
                      : 'bg-white border-border-light hover:border-emerald-200 hover:shadow-soft'
                  }`}
                >
                  <span className="text-2xl select-none" aria-hidden>
                    {l.flag}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[14px] text-text leading-tight">
                      {l.nativeName}
                    </p>
                    <p className="text-[12px] text-text-light mt-0.5">{l.name}</p>
                  </div>
                  {isActive ? (
                    <span
                      className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center flex-shrink-0"
                      aria-hidden
                    >
                      <svg
                        viewBox="0 0 24 24"
                        className="w-3 h-3"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                    </span>
                  ) : null}
                </button>
              </li>
            )
          })}
        </ul>
      </div>

      <div className="px-5 pb-5 pt-2 sticky bottom-0 bg-gradient-to-t from-white via-white to-transparent">
        <button
          onClick={onContinue}
          disabled={!selected}
          className="w-full h-12 rounded-2xl gradient-primary text-white font-semibold text-[15px] flex items-center justify-center gap-2 hover:shadow-card-hover transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer active:scale-[0.99]"
        >
          {t(lang, 'lang.continue')}
          <ArrowRightIcon className="w-4 h-4" />
        </button>
        <p className="text-[11px] text-text-lighter text-center mt-2.5 leading-snug">{hotelName}</p>
      </div>
    </div>
  )
}
