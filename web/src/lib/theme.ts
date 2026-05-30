import type { HotelThemeConfig, HotelThemeMode } from '../api'

export interface ThemePreset {
  id: string
  name: string
  colors: Required<NonNullable<HotelThemeConfig['colors']>>
}

export interface NormalizedHotelThemeConfig {
  mode: HotelThemeMode
  preset: string
  colors: Required<NonNullable<HotelThemeConfig['colors']>>
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'emerald-gold',
    name: 'Emerald Gold',
    colors: {
      primary: '#2d5016',
      secondary: '#8b9d83',
      accent: '#d4af37',
      background: '#fafaf9',
      surface: '#ffffff',
      text: '#111827',
    },
  },
  {
    id: 'navy-gold',
    name: 'Navy Gold',
    colors: {
      primary: '#1e3a8a',
      secondary: '#3b82f6',
      accent: '#ca8a04',
      background: '#f8fafc',
      surface: '#ffffff',
      text: '#0f172a',
    },
  },
  {
    id: 'rose-charcoal',
    name: 'Rose Charcoal',
    colors: {
      primary: '#9f1239',
      secondary: '#fb7185',
      accent: '#b45309',
      background: '#fff7f7',
      surface: '#ffffff',
      text: '#1f2937',
    },
  },
  {
    id: 'coastal-teal',
    name: 'Coastal Teal',
    colors: {
      primary: '#0f766e',
      secondary: '#38bdf8',
      accent: '#f59e0b',
      background: '#f0fdfa',
      surface: '#ffffff',
      text: '#0f172a',
    },
  },
]

const DEFAULT_PRESET = THEME_PRESETS[0]
const HEX_COLOR = /^#[0-9a-f]{6}$/i

export function normalizeThemeConfig(config?: HotelThemeConfig | null): NormalizedHotelThemeConfig {
  const preset = THEME_PRESETS.find((item) => item.id === config?.preset) ?? DEFAULT_PRESET
  const colors = {
    ...preset.colors,
    ...Object.fromEntries(
      Object.entries(config?.colors ?? {}).filter(([, value]) => isHexColor(value)),
    ),
  } as Required<NonNullable<HotelThemeConfig['colors']>>

  return {
    mode: config?.mode === 'light' || config?.mode === 'dark' ? config.mode : 'system',
    preset: preset.id,
    colors,
  }
}

export function resolveThemeMode(mode: HotelThemeMode = 'system'): 'light' | 'dark' {
  if (mode === 'light' || mode === 'dark') return mode
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function applyHotelTheme(config?: HotelThemeConfig | null) {
  const normalized = normalizeThemeConfig(config)
  const mode = resolveThemeMode(normalized.mode)
  const root = document.documentElement
  const palette =
    mode === 'dark' ? toDarkPalette(normalized.colors) : toLightPalette(normalized.colors)

  root.dataset.themeMode = mode
  root.style.setProperty('--color-primary', palette.primary)
  root.style.setProperty(
    '--color-primary-light',
    mix(palette.primary, '#ffffff', mode === 'dark' ? 0.26 : 0.36),
  )
  root.style.setProperty('--color-primary-dark', mix(palette.primary, '#000000', 0.24))
  root.style.setProperty('--color-secondary', palette.secondary)
  root.style.setProperty('--color-accent', palette.accent)
  root.style.setProperty(
    '--color-accent-light',
    mix(palette.accent, '#ffffff', mode === 'dark' ? 0.22 : 0.34),
  )
  root.style.setProperty('--color-background', palette.background)
  root.style.setProperty('--color-background-warm', palette.backgroundWarm)
  root.style.setProperty('--color-surface', palette.surface)
  root.style.setProperty('--color-surface-glass', palette.surfaceGlass)
  root.style.setProperty('--color-text', palette.text)
  root.style.setProperty('--color-text-muted', palette.textMuted)
  root.style.setProperty('--color-text-light', palette.textLight)
  root.style.setProperty('--color-text-lighter', palette.textLighter)
  root.style.setProperty('--color-border', palette.border)
  root.style.setProperty('--color-border-light', palette.borderLight)
  root.style.setProperty('--color-border-lighter', palette.borderLighter)
}

export function resetHotelTheme() {
  const root = document.documentElement
  root.removeAttribute('data-theme-mode')
  ;[
    '--color-primary',
    '--color-primary-light',
    '--color-primary-dark',
    '--color-secondary',
    '--color-accent',
    '--color-accent-light',
    '--color-background',
    '--color-background-warm',
    '--color-surface',
    '--color-surface-glass',
    '--color-text',
    '--color-text-muted',
    '--color-text-light',
    '--color-text-lighter',
    '--color-border',
    '--color-border-light',
    '--color-border-lighter',
  ].forEach((name) => root.style.removeProperty(name))
}

export function isHexColor(value: unknown): value is string {
  return typeof value === 'string' && HEX_COLOR.test(value)
}

function toLightPalette(colors: Required<NonNullable<HotelThemeConfig['colors']>>) {
  return {
    ...colors,
    backgroundWarm: mix(colors.background, colors.primary, 0.04),
    surfaceGlass: 'rgba(255, 255, 255, 0.9)',
    textMuted: mix(colors.text, colors.background, 0.28),
    textLight: mix(colors.text, colors.background, 0.42),
    textLighter: mix(colors.text, colors.background, 0.6),
    border: mix(colors.text, colors.background, 0.86),
    borderLight: mix(colors.text, colors.background, 0.92),
    borderLighter: mix(colors.text, colors.background, 0.96),
  }
}

function toDarkPalette(colors: Required<NonNullable<HotelThemeConfig['colors']>>) {
  const darkBackground = mix(colors.primary, '#020617', 0.78)
  const darkSurface = mix(colors.primary, '#0f172a', 0.7)
  return {
    primary: mix(colors.primary, '#ffffff', 0.28),
    secondary: mix(colors.secondary, '#ffffff', 0.22),
    accent: mix(colors.accent, '#ffffff', 0.16),
    background: darkBackground,
    backgroundWarm: mix(darkBackground, '#000000', 0.16),
    surface: darkSurface,
    surfaceGlass: 'rgba(15, 23, 42, 0.88)',
    text: '#f8fafc',
    textMuted: '#cbd5e1',
    textLight: '#94a3b8',
    textLighter: '#64748b',
    border: 'rgba(148, 163, 184, 0.28)',
    borderLight: 'rgba(148, 163, 184, 0.18)',
    borderLighter: 'rgba(148, 163, 184, 0.12)',
  }
}

function mix(hexA: string, hexB: string, weightB: number) {
  const a = parseHex(hexA)
  const b = parseHex(hexB)
  const weightA = 1 - weightB
  return `#${[0, 1, 2]
    .map((i) =>
      Math.round(a[i] * weightA + b[i] * weightB)
        .toString(16)
        .padStart(2, '0'),
    )
    .join('')}`
}

function parseHex(hex: string) {
  return [1, 3, 5].map((start) => parseInt(hex.slice(start, start + 2), 16))
}
