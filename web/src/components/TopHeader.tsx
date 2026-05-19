import { GlobeIcon } from './icons/ServiceIcons'

type Lang = 'VN' | 'EN'

interface TopHeaderProps {
  greeting?: string
  subtitle?: string
  lang?: Lang
  onLangChange?: (lang: Lang) => void
}

export function TopHeader({
  greeting = 'Xin chào!',
  subtitle = 'Chào mừng quý khách đến với khách sạn',
  lang = 'VN',
  onLangChange,
}: TopHeaderProps) {
  return (
    <header className="glass-nav sticky top-0 z-30 px-4 sm:px-8 lg:px-16 xl:px-20 py-5">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h1
            className="text-2xl sm:text-3xl font-bold text-text tracking-tight truncate"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            {greeting}
          </h1>
          <p className="text-sm text-text-light mt-1 truncate">{subtitle}</p>
        </div>

        {/* Language switcher pill */}
        <div className="flex items-center gap-1 bg-white border border-border rounded-full p-1 shadow-soft flex-shrink-0">
          <button
            onClick={() => onLangChange?.('VN')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors duration-200 cursor-pointer ${
              lang === 'VN' ? 'bg-primary text-white' : 'text-text-muted hover:text-text'
            }`}
            aria-pressed={lang === 'VN'}
          >
            <GlobeIcon className="w-3.5 h-3.5" />
            VN
          </button>
          <button
            onClick={() => onLangChange?.('EN')}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors duration-200 cursor-pointer ${
              lang === 'EN' ? 'bg-primary text-white' : 'text-text-muted hover:text-text'
            }`}
            aria-pressed={lang === 'EN'}
          >
            EN
          </button>
        </div>
      </div>
    </header>
  )
}
