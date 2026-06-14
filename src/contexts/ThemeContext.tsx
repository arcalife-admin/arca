'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useSession } from 'next-auth/react'
import { apiErrors } from '@/lib/api-errors'
import { applyThemeToDOM, DEFAULT_THEME_VALUES, pickThemeValues, toThemeValues, type ThemeValues } from '@/lib/theme'
import type { PersonalThemeSettings } from '@/types/theme'

export interface OrganizationThemeSettings {
  id: string
  organizationId: string
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
  createdAt: string
  updatedAt: string
}

interface ThemeContextType {
  themeSettings: OrganizationThemeSettings | null
  personalThemeSettings: PersonalThemeSettings | null
  effectiveTheme: ThemeValues
  isLoading: boolean
  updateTheme: (settings: Partial<OrganizationThemeSettings>) => Promise<void>
  resetOrganizationTheme: () => Promise<void>
  updatePersonalTheme: (settings: Partial<PersonalThemeSettings>) => Promise<PersonalThemeSettings>
  resetPersonalTheme: () => Promise<void>
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

function applyEffectiveTheme(
  organizationTheme: OrganizationThemeSettings | null,
  personalTheme: PersonalThemeSettings | null
) {
  const base = organizationTheme ? toThemeValues(organizationTheme) : DEFAULT_THEME_VALUES
  const effective = personalTheme ? { ...base, ...toThemeValues(personalTheme) } : base
  applyThemeToDOM(effective)
  return effective
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const { data: session, status } = useSession()
  const [themeSettings, setThemeSettings] = useState<OrganizationThemeSettings | null>(null)
  const [personalThemeSettings, setPersonalThemeSettings] = useState<PersonalThemeSettings | null>(null)
  const [effectiveTheme, setEffectiveTheme] = useState<ThemeValues>(DEFAULT_THEME_VALUES)
  const [isLoading, setIsLoading] = useState(true)

  const applyTheme = (settings: OrganizationThemeSettings) => {
    const effective = applyEffectiveTheme(settings, personalThemeSettings)
    setEffectiveTheme(effective)
  }

  const updateTheme = async (updates: Partial<OrganizationThemeSettings>) => {
    if (!session?.user?.organizationId || session.user.role !== 'ORGANIZATION_OWNER') {
      throw new Error('Neautorizat — Doar proprietarii organizației pot actualiza tema')
    }

    const response = await fetch('/api/organization-theme', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(pickThemeValues(updates as Record<string, unknown>)),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || apiErrors.failedToUpdate)
    }

    const updatedSettings = await response.json()
    setThemeSettings(updatedSettings)
    const effective = applyEffectiveTheme(updatedSettings, personalThemeSettings)
    setEffectiveTheme(effective)
  }

  const resetOrganizationTheme = async () => {
    if (!session?.user?.organizationId || session.user.role !== 'ORGANIZATION_OWNER') {
      throw new Error('Neautorizat — Doar proprietarii organizației pot actualiza tema')
    }

    const response = await fetch('/api/organization-theme', {
      method: 'DELETE',
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Resetarea setărilor temei organizației a eșuat')
    }

    const updatedSettings = await response.json()
    setThemeSettings(updatedSettings)
    const effective = applyEffectiveTheme(updatedSettings, personalThemeSettings)
    setEffectiveTheme(effective)
  }

  const updatePersonalTheme = async (updates: Partial<PersonalThemeSettings>) => {
    if (!session?.user?.id) {
      throw new Error('Neautorizat')
    }

    const response = await fetch('/api/personal-theme', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(pickThemeValues(updates as Record<string, unknown>)),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || apiErrors.failedToUpdate)
    }

    const updatedSettings = await response.json()
    setPersonalThemeSettings(updatedSettings)
    const effective = applyEffectiveTheme(themeSettings, updatedSettings)
    setEffectiveTheme(effective)
    return updatedSettings
  }

  const resetPersonalTheme = async () => {
    if (!session?.user?.id) {
      throw new Error('Neautorizat')
    }

    const response = await fetch('/api/personal-theme', {
      method: 'DELETE',
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Resetarea setărilor temei personale a eșuat')
    }

    setPersonalThemeSettings(null)
    const effective = applyEffectiveTheme(themeSettings, null)
    setEffectiveTheme(effective)
  }

  useEffect(() => {
    const loadAllThemes = async () => {
      if (status !== 'authenticated' || !session?.user?.id) {
        if (status === 'unauthenticated') {
          setIsLoading(false)
        }
        return
      }

      setIsLoading(true)

      let organizationTheme: OrganizationThemeSettings | null = null

      if (session.user.organizationId) {
        try {
          const response = await fetch('/api/organization-theme')
          if (response.ok) {
            organizationTheme = await response.json()
            setThemeSettings(organizationTheme)
          }
        } catch (error) {
          console.error('Failed to load theme settings:', error)
        }
      }

      let personalTheme: PersonalThemeSettings | null = null
      try {
        const response = await fetch('/api/personal-theme')
        if (response.ok) {
          personalTheme = await response.json()
          setPersonalThemeSettings(personalTheme)
        }
      } catch (error) {
        console.error('Failed to load personal theme settings:', error)
      }

      const effective = applyEffectiveTheme(organizationTheme, personalTheme)
      setEffectiveTheme(effective)
      setIsLoading(false)
    }

    loadAllThemes()
  }, [session?.user?.id, session?.user?.organizationId, status])

  return (
    <ThemeContext.Provider
      value={{
        themeSettings,
        personalThemeSettings,
        effectiveTheme,
        isLoading,
        updateTheme,
        resetOrganizationTheme,
        updatePersonalTheme,
        resetPersonalTheme,
        applyTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}
