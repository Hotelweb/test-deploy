export interface Language {
  code: string
  name: string
  nativeName: string
  flag: string
}

export const LANGUAGES: Language[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
  { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷' },
  { code: 'th', name: 'Thai', nativeName: 'ไทย', flag: '🇹🇭' },
]

export const DEFAULT_LANGUAGE = 'vi'

export const LANGUAGE_BY_CODE: Record<string, Language> = LANGUAGES.reduce(
  (acc, lang) => {
    acc[lang.code] = lang
    return acc
  },
  {} as Record<string, Language>,
)

export function detectPreferredLanguage(): string {
  if (typeof navigator === 'undefined') return DEFAULT_LANGUAGE

  const browserLanguages = navigator.languages?.length
    ? navigator.languages
    : [navigator.language].filter(Boolean)

  for (const browserLanguage of browserLanguages) {
    const normalized = browserLanguage.toLowerCase()
    const primaryCode = normalized.split('-')[0]
    const supported = LANGUAGE_BY_CODE[normalized] ?? LANGUAGE_BY_CODE[primaryCode]

    if (supported) return supported.code
  }

  return DEFAULT_LANGUAGE
}

export function getLanguage(code: string): Language {
  return (
    LANGUAGE_BY_CODE[code] ?? {
      code,
      name: code,
      nativeName: code,
      flag: '🌐',
    }
  )
}
