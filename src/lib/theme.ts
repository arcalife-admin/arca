export interface ThemeValues {
  primaryColor: string
  primaryForeground: string
  secondaryColor: string
  secondaryForeground: string
  accentColor: string
  accentForeground: string
  backgroundColor: string
  surfaceColor: string
  borderColor: string
  textPrimary: string
  textSecondary: string
  textMuted: string
  successColor: string
  warningColor: string
  errorColor: string
  infoColor: string
  fontFamily: string
  headingFontFamily: string
  fontSize: string
  headingScale: string
  lineHeight: string
  letterSpacing: string
  borderRadius: string
  spacing: string
  maxWidth: string
  sidebarWidth: string
  buttonSize: string
  inputSize: string
  avatarSize: string
  iconSize: string
  shadowLevel: string
  animationSpeed: string
  calendarTodayBg: string
  calendarAccentBg: string
  customVariables?: Record<string, string>
}

export const THEME_VALUE_KEYS = [
  'primaryColor',
  'primaryForeground',
  'secondaryColor',
  'secondaryForeground',
  'accentColor',
  'accentForeground',
  'backgroundColor',
  'surfaceColor',
  'borderColor',
  'textPrimary',
  'textSecondary',
  'textMuted',
  'successColor',
  'warningColor',
  'errorColor',
  'infoColor',
  'fontFamily',
  'headingFontFamily',
  'fontSize',
  'headingScale',
  'lineHeight',
  'letterSpacing',
  'borderRadius',
  'spacing',
  'maxWidth',
  'sidebarWidth',
  'buttonSize',
  'inputSize',
  'avatarSize',
  'iconSize',
  'shadowLevel',
  'animationSpeed',
  'calendarTodayBg',
  'calendarAccentBg',
  'customVariables',
] as const satisfies readonly (keyof ThemeValues)[]

export function pickThemeValues(
  settings: Record<string, unknown> | null | undefined
): Partial<ThemeValues> {
  if (!settings) return {}

  const picked: Partial<ThemeValues> = {}
  for (const key of THEME_VALUE_KEYS) {
    const value = settings[key]
    if (value !== undefined && value !== null) {
      ;(picked as Record<string, unknown>)[key] = value
    }
  }
  return picked
}

export const DEFAULT_THEME_VALUES: ThemeValues = {
  primaryColor: '#ef4444',
  primaryForeground: '#ffffff',
  secondaryColor: '#f1f5f9',
  secondaryForeground: '#0f172a',
  accentColor: '#10b981',
  accentForeground: '#ffffff',
  backgroundColor: '#ffffff',
  surfaceColor: '#f8fafc',
  borderColor: '#e2e8f0',
  textPrimary: '#0f172a',
  textSecondary: '#64748b',
  textMuted: '#94a3b8',
  successColor: '#10b981',
  warningColor: '#f59e0b',
  errorColor: '#ef4444',
  infoColor: '#ef4444',
  fontFamily: 'Inter',
  headingFontFamily: 'Inter',
  fontSize: '14',
  headingScale: '1.25',
  lineHeight: '1.5',
  letterSpacing: '0',
  borderRadius: '6',
  spacing: '1',
  maxWidth: '1200',
  sidebarWidth: '280',
  buttonSize: 'md',
  inputSize: 'md',
  avatarSize: 'md',
  iconSize: '20',
  shadowLevel: 'md',
  animationSpeed: '200',
  calendarTodayBg: '#ddd6fe',
  calendarAccentBg: '#f3f4f6',
}

/** Convert #rrggbb to shadcn/Tailwind HSL token format: "H S% L%" */
export function hexToHslToken(hex: string): string {
  const normalized = hex.replace(/^#/, '')
  if (normalized.length !== 3 && normalized.length !== 6) {
    return '0 0% 0%'
  }

  const full =
    normalized.length === 3
      ? normalized
          .split('')
          .map((char) => char + char)
          .join('')
      : normalized

  const r = parseInt(full.slice(0, 2), 16) / 255
  const g = parseInt(full.slice(2, 4), 16) / 255
  const b = parseInt(full.slice(4, 6), 16) / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2

  if (max === min) {
    return `0 0% ${(l * 100).toFixed(1)}%`
  }

  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h = 0

  switch (max) {
    case r:
      h = ((g - b) / d + (g < b ? 6 : 0)) / 6
      break
    case g:
      h = ((b - r) / d + 2) / 6
      break
    default:
      h = ((r - g) / d + 4) / 6
      break
  }

  return `${(h * 360).toFixed(1)} ${(s * 100).toFixed(1)}% ${(l * 100).toFixed(1)}%`
}

function applyShadcnThemeTokens(root: HTMLElement, values: ThemeValues) {
  // shadcn/ui + Tailwind components use hsl(var(--primary)), not --org-primary
  root.style.setProperty('--primary', hexToHslToken(values.primaryColor))
  root.style.setProperty('--primary-foreground', hexToHslToken(values.primaryForeground))
  root.style.setProperty('--secondary', hexToHslToken(values.secondaryColor))
  root.style.setProperty('--secondary-foreground', hexToHslToken(values.secondaryForeground))
  root.style.setProperty('--background', hexToHslToken(values.backgroundColor))
  root.style.setProperty('--foreground', hexToHslToken(values.textPrimary))
  root.style.setProperty('--card', hexToHslToken(values.surfaceColor))
  root.style.setProperty('--card-foreground', hexToHslToken(values.textPrimary))
  root.style.setProperty('--popover', hexToHslToken(values.backgroundColor))
  root.style.setProperty('--popover-foreground', hexToHslToken(values.textPrimary))
  root.style.setProperty('--muted', hexToHslToken(values.secondaryColor))
  root.style.setProperty('--muted-foreground', hexToHslToken(values.textMuted))
  root.style.setProperty('--accent', hexToHslToken(values.accentColor))
  root.style.setProperty('--accent-foreground', hexToHslToken(values.accentForeground))
  root.style.setProperty('--destructive', hexToHslToken(values.errorColor))
  root.style.setProperty('--destructive-foreground', hexToHslToken(values.primaryForeground))
  root.style.setProperty('--border', hexToHslToken(values.borderColor))
  root.style.setProperty('--input', hexToHslToken(values.borderColor))
  root.style.setProperty('--ring', hexToHslToken(values.primaryColor))
  root.style.setProperty('--radius', `${values.borderRadius}px`)
}

export function applyThemeToDOM(settings: Partial<ThemeValues>) {
  if (typeof document === 'undefined') return

  const root = document.documentElement
  const values = { ...DEFAULT_THEME_VALUES, ...settings }

  root.style.setProperty('--org-primary', values.primaryColor)
  root.style.setProperty('--org-primary-foreground', values.primaryForeground)
  root.style.setProperty('--org-secondary', values.secondaryColor)
  root.style.setProperty('--org-secondary-foreground', values.secondaryForeground)
  root.style.setProperty('--org-accent', values.accentColor)
  root.style.setProperty('--org-accent-foreground', values.accentForeground)

  root.style.setProperty('--org-background', values.backgroundColor)
  root.style.setProperty('--org-surface', values.surfaceColor)
  root.style.setProperty('--org-border', values.borderColor)

  root.style.setProperty('--org-text-primary', values.textPrimary)
  root.style.setProperty('--org-text-secondary', values.textSecondary)
  root.style.setProperty('--org-text-muted', values.textMuted)

  root.style.setProperty('--org-success', values.successColor)
  root.style.setProperty('--org-warning', values.warningColor)
  root.style.setProperty('--org-error', values.errorColor)
  root.style.setProperty('--org-info', values.infoColor)

  root.style.setProperty('--org-font-family', values.fontFamily)
  root.style.setProperty('--org-heading-font-family', values.headingFontFamily)
  root.style.setProperty('--org-font-size', `${values.fontSize}px`)
  root.style.setProperty('--org-heading-scale', values.headingScale)
  root.style.setProperty('--org-line-height', values.lineHeight)
  root.style.setProperty('--org-letter-spacing', `${values.letterSpacing}em`)

  root.style.setProperty('--org-border-radius', `${values.borderRadius}px`)
  root.style.setProperty('--org-spacing', values.spacing)
  root.style.setProperty('--org-max-width', `${values.maxWidth}px`)
  root.style.setProperty('--org-sidebar-width', `${values.sidebarWidth}px`)

  const sizeMap = { sm: '0.875rem', md: '1rem', lg: '1.125rem' }
  const paddingMap = { sm: '0.375rem 0.75rem', md: '0.5rem 1rem', lg: '0.75rem 1.5rem' }

  root.style.setProperty(
    '--org-button-font-size',
    sizeMap[values.buttonSize as keyof typeof sizeMap] || sizeMap.md
  )
  root.style.setProperty(
    '--org-button-padding',
    paddingMap[values.buttonSize as keyof typeof paddingMap] || paddingMap.md
  )
  root.style.setProperty(
    '--org-input-font-size',
    sizeMap[values.inputSize as keyof typeof sizeMap] || sizeMap.md
  )
  root.style.setProperty(
    '--org-input-padding',
    paddingMap[values.inputSize as keyof typeof paddingMap] || paddingMap.md
  )
  root.style.setProperty('--org-icon-size', `${values.iconSize}px`)

  const shadowMap = {
    none: 'none',
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  }
  root.style.setProperty(
    '--org-shadow',
    shadowMap[values.shadowLevel as keyof typeof shadowMap] || shadowMap.md
  )
  root.style.setProperty('--org-animation-speed', `${values.animationSpeed}ms`)

  root.style.setProperty('--calendar-today-bg', values.calendarTodayBg)
  root.style.setProperty('--calendar-accent-bg', values.calendarAccentBg)

  if (values.customVariables) {
    Object.entries(values.customVariables).forEach(([key, value]) => {
      root.style.setProperty(`--org-${key}`, value)
    })
  }

  applyShadcnThemeTokens(root, values)
}

export function toThemeValues(
  settings: Partial<ThemeValues> | Record<string, unknown> | null | undefined
): ThemeValues {
  return { ...DEFAULT_THEME_VALUES, ...pickThemeValues(settings as Record<string, unknown>) }
}
