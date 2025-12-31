'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useSession } from 'next-auth/react'

export interface OrganizationThemeSettings {
  id: string
  organizationId: string

  // Colors - Primary Theme
  primaryColor: string
  primaryForeground: string
  secondaryColor: string
  secondaryForeground: string
  accentColor: string
  accentForeground: string

  // Background Colors
  backgroundColor: string
  surfaceColor: string
  borderColor: string

  // Text Colors
  textPrimary: string
  textSecondary: string
  textMuted: string

  // State Colors
  successColor: string
  warningColor: string
  errorColor: string
  infoColor: string

  // Typography
  fontFamily: string
  headingFontFamily: string
  fontSize: string
  headingScale: string
  lineHeight: string
  letterSpacing: string

  // Spacing & Layout
  borderRadius: string
  spacing: string
  maxWidth: string
  sidebarWidth: string

  // Component Sizes
  buttonSize: string
  inputSize: string
  avatarSize: string
  iconSize: string

  // Shadows & Effects
  shadowLevel: string
  animationSpeed: string

  // Calendar Specific
  calendarTodayBg: string
  calendarAccentBg: string

  // Custom CSS Variables
  customVariables?: Record<string, string>

  // Metadata
  createdAt: string
  updatedAt: string
}

interface ThemeContextType {
  themeSettings: OrganizationThemeSettings | null
  isLoading: boolean
  updateTheme: (settings: Partial<OrganizationThemeSettings>) => Promise<void>
  applyTheme: (settings: OrganizationThemeSettings) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

interface ThemeProviderProps {
  children: ReactNode
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const { data: session, status } = useSession()
  const [themeSettings, setThemeSettings] = useState<OrganizationThemeSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Function to apply theme settings to CSS custom properties
  const applyTheme = (settings: OrganizationThemeSettings) => {
    if (typeof document === 'undefined') return

    const root = document.documentElement

    // Colors
    root.style.setProperty('--org-primary', settings.primaryColor)
    root.style.setProperty('--org-primary-foreground', settings.primaryForeground)
    root.style.setProperty('--org-secondary', settings.secondaryColor)
    root.style.setProperty('--org-secondary-foreground', settings.secondaryForeground)
    root.style.setProperty('--org-accent', settings.accentColor)
    root.style.setProperty('--org-accent-foreground', settings.accentForeground)

    // Backgrounds
    root.style.setProperty('--org-background', settings.backgroundColor)
    root.style.setProperty('--org-surface', settings.surfaceColor)
    root.style.setProperty('--org-border', settings.borderColor)

    // Text Colors
    root.style.setProperty('--org-text-primary', settings.textPrimary)
    root.style.setProperty('--org-text-secondary', settings.textSecondary)
    root.style.setProperty('--org-text-muted', settings.textMuted)

    // State Colors
    root.style.setProperty('--org-success', settings.successColor)
    root.style.setProperty('--org-warning', settings.warningColor)
    root.style.setProperty('--org-error', settings.errorColor)
    root.style.setProperty('--org-info', settings.infoColor)

    // Typography
    root.style.setProperty('--org-font-family', settings.fontFamily)
    root.style.setProperty('--org-heading-font-family', settings.headingFontFamily)
    root.style.setProperty('--org-font-size', `${settings.fontSize}px`)
    root.style.setProperty('--org-heading-scale', settings.headingScale)
    root.style.setProperty('--org-line-height', settings.lineHeight)
    root.style.setProperty('--org-letter-spacing', `${settings.letterSpacing}em`)

    // Spacing & Layout
    root.style.setProperty('--org-border-radius', `${settings.borderRadius}px`)
    root.style.setProperty('--org-spacing', settings.spacing)
    root.style.setProperty('--org-max-width', `${settings.maxWidth}px`)
    root.style.setProperty('--org-sidebar-width', `${settings.sidebarWidth}px`)

    // Component Sizes
    const sizeMap = { sm: '0.875rem', md: '1rem', lg: '1.125rem' }
    const paddingMap = { sm: '0.375rem 0.75rem', md: '0.5rem 1rem', lg: '0.75rem 1.5rem' }

    root.style.setProperty('--org-button-font-size', sizeMap[settings.buttonSize as keyof typeof sizeMap] || sizeMap.md)
    root.style.setProperty('--org-button-padding', paddingMap[settings.buttonSize as keyof typeof paddingMap] || paddingMap.md)
    root.style.setProperty('--org-input-font-size', sizeMap[settings.inputSize as keyof typeof sizeMap] || sizeMap.md)
    root.style.setProperty('--org-input-padding', paddingMap[settings.inputSize as keyof typeof paddingMap] || paddingMap.md)
    root.style.setProperty('--org-icon-size', `${settings.iconSize}px`)

    // Shadows
    const shadowMap = {
      none: 'none',
      sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
      md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
      lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
      xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    }
    root.style.setProperty('--org-shadow', shadowMap[settings.shadowLevel as keyof typeof shadowMap] || shadowMap.md)
    root.style.setProperty('--org-animation-speed', `${settings.animationSpeed}ms`)

    // Calendar Specific
    root.style.setProperty('--calendar-today-bg', settings.calendarTodayBg)
    root.style.setProperty('--calendar-accent-bg', settings.calendarAccentBg)

    // Apply custom CSS variables
    if (settings.customVariables) {
      Object.entries(settings.customVariables).forEach(([key, value]) => {
        root.style.setProperty(`--org-${key}`, value)
      })
    }

    // Note: We don't apply font-family to document.body to preserve the user's existing fonts
    // Font changes are only visible in theme previews and opt-in components
  }

  // Load theme settings from API
  const loadThemeSettings = async () => {
    if (!session?.user?.organizationId) {
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/organization-theme')
      if (response.ok) {
        const settings = await response.json()
        setThemeSettings(settings)
        applyTheme(settings)
      }
    } catch (error) {
      console.error('Failed to load theme settings:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Update theme settings
  const updateTheme = async (updates: Partial<OrganizationThemeSettings>) => {
    if (!session?.user?.organizationId || session.user.role !== 'ORGANIZATION_OWNER') {
      throw new Error('Unauthorized - Only organization owners can update themes')
    }

    try {
      const response = await fetch('/api/organization-theme', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to update theme')
      }

      const updatedSettings = await response.json()
      setThemeSettings(updatedSettings)
      applyTheme(updatedSettings)
    } catch (error) {
      console.error('Failed to update theme:', error)
      throw error
    }
  }

  // Load theme settings when session changes
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.organizationId) {
      loadThemeSettings()
    } else if (status === 'unauthenticated') {
      setIsLoading(false)
    }
  }, [session, status])

  return (
    <ThemeContext.Provider
      value={{
        themeSettings,
        isLoading,
        updateTheme,
        applyTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
} 