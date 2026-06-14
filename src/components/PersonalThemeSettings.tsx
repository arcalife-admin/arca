'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { PersonalThemeSettings as PersonalThemeSettingsType } from '@/types/theme'
import { useTheme } from '@/contexts/ThemeContext'
import { DEFAULT_THEME_VALUES, applyThemeToDOM, toThemeValues } from '@/lib/theme'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from '@/hooks/use-toast'

function ColorInput({
  label,
  value,
  onChange,
  description
}: {
  label: string
  value: string
  onChange: (value: string) => void
  description?: string
}) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      <div className="flex items-center space-x-3">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-12 h-8 rounded border cursor-pointer"
        />
        <Input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 font-mono text-sm"
          placeholder="#000000"
        />
      </div>
      {description && (
        <p className="text-xs text-gray-500">{description}</p>
      )}
    </div>
  )
}

// Vertical Live Preview Component
function LivePreview({ formData }: { formData: Partial<PersonalThemeSettingsType> }) {
  return (
    <div className="space-y-6 sticky top-4">
      <h4 className="font-semibold text-lg text-gray-800">Previzualizare live</h4>

      {/* Buttons Preview */}
      <div className="border rounded-lg p-4 space-y-3 bg-white shadow-sm">
        <h5 className="font-medium text-sm text-gray-600">Butoane</h5>
        <div className="space-y-3">
          <button
            className="w-full px-4 py-2 rounded text-white font-medium"
            style={{
              backgroundColor: formData.primaryColor || DEFAULT_THEME_VALUES.primaryColor,
              color: formData.primaryForeground || '#ffffff',
              borderRadius: `${formData.borderRadius || '6'}px`,
            }}
          >
            Buton principal
          </button>
          <button
            className="w-full px-4 py-2 rounded border font-medium"
            style={{
              backgroundColor: formData.secondaryColor || '#f1f5f9',
              color: formData.secondaryForeground || '#0f172a',
              borderColor: formData.borderColor || '#e2e8f0',
              borderRadius: `${formData.borderRadius || '6'}px`,
            }}
          >
            Buton secundar
          </button>
        </div>
      </div>

      {/* Typography Preview */}
      <div className="border rounded-lg p-4 space-y-3 bg-white shadow-sm">
        <h5 className="font-medium text-sm text-gray-600">Tipografie</h5>
        <div
          className="p-4 rounded border space-y-3"
          style={{
            backgroundColor: formData.surfaceColor || '#f8fafc',
            borderColor: formData.borderColor || '#e2e8f0',
            borderRadius: `${formData.borderRadius || '6'}px`,
          }}
        >
          <h2
            style={{
              color: formData.textPrimary || '#0f172a',
              fontFamily: formData.headingFontFamily || 'Inter',
              fontSize: `${(parseFloat(formData.fontSize || '14') * parseFloat(formData.headingScale || '1.25') * 2)}px`,
              fontWeight: 'bold',
              margin: 0,
              lineHeight: formData.lineHeight || '1.5',
            }}
          >
            Titlu mare
          </h2>
          <h4
            style={{
              color: formData.textPrimary || '#0f172a',
              fontFamily: formData.headingFontFamily || 'Inter',
              fontSize: `${(parseFloat(formData.fontSize || '14') * parseFloat(formData.headingScale || '1.25'))}px`,
              fontWeight: '600',
              margin: 0,
              lineHeight: formData.lineHeight || '1.5',
            }}
          >
            Subtitlu
          </h4>
          <p
            style={{
              color: formData.textSecondary || '#64748b',
              fontFamily: formData.fontFamily || 'Inter',
              fontSize: `${formData.fontSize || '14'}px`,
              lineHeight: formData.lineHeight || '1.5',
              margin: 0,
            }}
          >
            Acesta este textul corpului, care arată cum arată paragrafele cu familia de fonturi selectată.
          </p>
          <p
            style={{
              color: formData.textMuted || '#94a3b8',
              fontFamily: formData.fontFamily || 'Inter',
              fontSize: `${parseFloat(formData.fontSize || '14') * 0.875}px`,
              lineHeight: formData.lineHeight || '1.5',
              margin: 0,
            }}
          >
            Text estompat mic pentru subtitluri.
          </p>
        </div>
      </div>

      {/* Status Colors Preview */}
      <div className="border rounded-lg p-4 space-y-3 bg-white shadow-sm">
        <h5 className="font-medium text-sm text-gray-600">Culori de stare</h5>
        <div className="space-y-2">
          <Badge
            className="w-full justify-center"
            style={{ backgroundColor: formData.successColor || '#10b981', color: '#ffffff' }}
          >
            Succes
          </Badge>
          <Badge
            className="w-full justify-center"
            style={{ backgroundColor: formData.warningColor || '#f59e0b', color: '#ffffff' }}
          >
            Avertisment
          </Badge>
          <Badge
            className="w-full justify-center"
            style={{ backgroundColor: formData.errorColor || '#ef4444', color: '#ffffff' }}
          >
            Eroare
          </Badge>
          <Badge
            className="w-full justify-center"
            style={{ backgroundColor: formData.infoColor || DEFAULT_THEME_VALUES.infoColor, color: '#ffffff' }}
          >
            Informare
          </Badge>
        </div>
      </div>
    </div>
  )
}

export default function PersonalThemeSettings() {
  const {
    personalThemeSettings,
    effectiveTheme,
    isLoading,
    updatePersonalTheme,
    resetPersonalTheme,
  } = useTheme()

  const savedFormBaseline = useMemo(() => {
    if (personalThemeSettings) {
      return toThemeValues(personalThemeSettings)
    }
    return DEFAULT_THEME_VALUES
  }, [personalThemeSettings])

  const [formData, setFormData] = useState<Partial<PersonalThemeSettingsType>>(savedFormBaseline)
  const [isSaving, setIsSaving] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    setFormData(savedFormBaseline)
  }, [savedFormBaseline])

  useEffect(() => {
    const hasChanged = JSON.stringify(formData) !== JSON.stringify(savedFormBaseline)
    setHasChanges(hasChanged)
  }, [formData, savedFormBaseline])

  // Live-apply theme while editing; restore saved theme on unmount
  useEffect(() => {
    applyThemeToDOM(formData)
    return () => applyThemeToDOM(effectiveTheme)
  }, [formData, effectiveTheme])

  const handleInputChange = (field: keyof PersonalThemeSettingsType, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSave = async () => {
    if (!hasChanges) return

    setIsSaving(true)
    try {
      const updatedSettings = await updatePersonalTheme(formData)
      setFormData(toThemeValues(updatedSettings))
      setHasChanges(false)

      toast({
        title: 'Succes',
        description: 'Setările temei personale au fost salvate cu succes',
      })
    } catch (error) {
      console.error('Failed to save theme:', error)
      toast({
        title: 'Eroare',
        description: error instanceof Error ? error.message : 'A apărut o eroare neașteptată',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDiscardChanges = () => {
    setFormData(savedFormBaseline)
  }

  const handleResetToDefaults = async () => {
    setIsResetting(true)
    try {
      await resetPersonalTheme()
      setFormData(DEFAULT_THEME_VALUES)
      setHasChanges(false)

      toast({
        title: 'Succes',
        description: 'Tema personală a fost resetată la valorile implicite',
      })
    } catch (error) {
      console.error('Failed to reset theme:', error)
      toast({
        title: 'Eroare',
        description: error instanceof Error ? error.message : 'A apărut o eroare neașteptată',
        variant: 'destructive',
      })
    } finally {
      setIsResetting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Setări temă personală</h2>
          <p className="text-gray-600">Personalizați aspectul interfeței dvs.</p>
        </div>
        <div className="flex space-x-3">
          {hasChanges && (
            <Button variant="outline" onClick={handleDiscardChanges}>
              Anulează
            </Button>
          )}
          <Button
            variant="outline"
            onClick={handleResetToDefaults}
            disabled={
              isResetting ||
              isSaving ||
              (!personalThemeSettings &&
                JSON.stringify(formData) === JSON.stringify(DEFAULT_THEME_VALUES))
            }
          >
            {isResetting ? 'Se resetează...' : 'Resetează la implicit'}
          </Button>
          <Button
            onClick={handleSave}
            disabled={!hasChanges || isSaving || isResetting}
          >
            {isSaving ? 'Se salvează...' : 'Salvează modificările'}
          </Button>
        </div>
      </div>

      {/* Theme Settings with Live Preview */}
      <div className="flex gap-6">
        {/* Settings Tabs - Left Side */}
        <div className="flex-[2]">
          <Tabs defaultValue="colors" className="w-full">
            <TabsList className="grid grid-cols-3 w-full max-w-md">
              <TabsTrigger value="colors">Culori</TabsTrigger>
              <TabsTrigger value="typography">Tipografie</TabsTrigger>
              <TabsTrigger value="layout">Aspect</TabsTrigger>
            </TabsList>

            <TabsContent value="colors" className="mt-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Setări culori</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                  {/* Primary Colors */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-800">Culori principale</h4>
                    <ColorInput
                      label="Culoare principală"
                      value={formData.primaryColor || DEFAULT_THEME_VALUES.primaryColor}
                      onChange={(value) => handleInputChange('primaryColor', value)}
                      description="Culoarea principală a brandului"
                    />
                    <ColorInput
                      label="Text pe principal"
                      value={formData.primaryForeground || '#ffffff'}
                      onChange={(value) => handleInputChange('primaryForeground', value)}
                      description="Text pe culoarea principală"
                    />
                    <ColorInput
                      label="Culoare secundară"
                      value={formData.secondaryColor || '#f1f5f9'}
                      onChange={(value) => handleInputChange('secondaryColor', value)}
                      description="Butoane secundare"
                    />
                    <ColorInput
                      label="Text pe secundar"
                      value={formData.secondaryForeground || '#0f172a'}
                      onChange={(value) => handleInputChange('secondaryForeground', value)}
                      description="Text pe culoarea secundară"
                    />
                    <ColorInput
                      label="Culoare de accent"
                      value={formData.accentColor || '#10b981'}
                      onChange={(value) => handleInputChange('accentColor', value)}
                      description="Evidențieri"
                    />
                  </div>

                  {/* Background Colors */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-800">Culori de fundal</h4>
                    <ColorInput
                      label="Fundal"
                      value={formData.backgroundColor || '#ffffff'}
                      onChange={(value) => handleInputChange('backgroundColor', value)}
                      description="Fundal principal"
                    />
                    <ColorInput
                      label="Culoare suprafață"
                      value={formData.surfaceColor || '#f8fafc'}
                      onChange={(value) => handleInputChange('surfaceColor', value)}
                      description="Carduri și panouri"
                    />
                    <ColorInput
                      label="Culoare bordură"
                      value={formData.borderColor || '#e2e8f0'}
                      onChange={(value) => handleInputChange('borderColor', value)}
                      description="Borduri"
                    />
                  </div>

                  {/* Text Colors */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-800">Culori text</h4>
                    <ColorInput
                      label="Text principal"
                      value={formData.textPrimary || '#0f172a'}
                      onChange={(value) => handleInputChange('textPrimary', value)}
                      description="Text principal"
                    />
                    <ColorInput
                      label="Text secundar"
                      value={formData.textSecondary || '#64748b'}
                      onChange={(value) => handleInputChange('textSecondary', value)}
                      description="Informații secundare"
                    />
                    <ColorInput
                      label="Text estompat"
                      value={formData.textMuted || '#94a3b8'}
                      onChange={(value) => handleInputChange('textMuted', value)}
                      description="Text dezactivat"
                    />
                  </div>

                  {/* Status Colors */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-800">Culori de stare</h4>
                    <ColorInput
                      label="Succes"
                      value={formData.successColor || '#10b981'}
                      onChange={(value) => handleInputChange('successColor', value)}
                    />
                    <ColorInput
                      label="Avertisment"
                      value={formData.warningColor || '#f59e0b'}
                      onChange={(value) => handleInputChange('warningColor', value)}
                    />
                    <ColorInput
                      label="Eroare"
                      value={formData.errorColor || '#ef4444'}
                      onChange={(value) => handleInputChange('errorColor', value)}
                    />
                    <ColorInput
                      label="Informare"
                      value={formData.infoColor || DEFAULT_THEME_VALUES.infoColor}
                      onChange={(value) => handleInputChange('infoColor', value)}
                    />
                  </div>

                </div>
              </Card>
            </TabsContent>

            <TabsContent value="typography" className="mt-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Setări tipografie</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                  <div className="space-y-4">
                    <div>
                      <Label>Familie font</Label>
                      <select
                        value={formData.fontFamily || 'Inter'}
                        onChange={(e) => handleInputChange('fontFamily', e.target.value)}
                        className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
                      >
                        <optgroup label="Fără serif">
                          <option value="Inter">Inter (implicit)</option>
                          <option value="Arial">Arial</option>
                          <option value="Helvetica">Helvetica</option>
                          <option value="Roboto">Roboto</option>
                          <option value="Open Sans">Open Sans</option>
                          <option value="Lato">Lato</option>
                          <option value="Montserrat">Montserrat</option>
                          <option value="Poppins">Poppins</option>
                        </optgroup>
                        <optgroup label="Cu serif">
                          <option value="Georgia">Georgia</option>
                          <option value="Times New Roman">Times New Roman</option>
                          <option value="Merriweather">Merriweather</option>
                        </optgroup>
                      </select>
                    </div>

                    <div>
                      <Label>Dimensiune font de bază (px)</Label>
                      <Input
                        type="number"
                        value={formData.fontSize || '14'}
                        onChange={(e) => handleInputChange('fontSize', e.target.value)}
                        min="10"
                        max="24"
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label>Înălțime rând</Label>
                      <Input
                        type="number"
                        step={0.1}
                        value={formData.lineHeight || '1.5'}
                        onChange={(e) => handleInputChange('lineHeight', e.target.value)}
                        min="1"
                        max="3"
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label>Rază colțuri (px)</Label>
                      <Input
                        type="number"
                        value={formData.borderRadius || '6'}
                        onChange={(e) => handleInputChange('borderRadius', e.target.value)}
                        min="0"
                        max="50"
                        className="mt-1"
                      />
                    </div>
                  </div>

                </div>
              </Card>
            </TabsContent>

            <TabsContent value="layout" className="mt-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Setări aspect</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                  <div className="space-y-4">
                    <div>
                      <Label>Dimensiune buton</Label>
                      <select
                        value={formData.buttonSize || 'md'}
                        onChange={(e) => handleInputChange('buttonSize', e.target.value)}
                        className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
                      >
                        <option value="sm">Mic</option>
                        <option value="md">Mediu</option>
                        <option value="lg">Mare</option>
                      </select>
                    </div>

                    <div>
                      <Label>Dimensiune câmp</Label>
                      <select
                        value={formData.inputSize || 'md'}
                        onChange={(e) => handleInputChange('inputSize', e.target.value)}
                        className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
                      >
                        <option value="sm">Mic</option>
                        <option value="md">Mediu</option>
                        <option value="lg">Mare</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label>Nivel umbră</Label>
                      <select
                        value={formData.shadowLevel || 'md'}
                        onChange={(e) => handleInputChange('shadowLevel', e.target.value)}
                        className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
                      >
                        <option value="none">Fără</option>
                        <option value="sm">Mic</option>
                        <option value="md">Mediu</option>
                        <option value="lg">Mare</option>
                        <option value="xl">Foarte mare</option>
                      </select>
                    </div>

                    <div>
                      <Label>Dimensiune pictogramă (px)</Label>
                      <Input
                        type="number"
                        value={formData.iconSize || '20'}
                        onChange={(e) => handleInputChange('iconSize', e.target.value)}
                        min="12"
                        max="48"
                        className="mt-1"
                      />
                    </div>
                  </div>

                </div>
              </Card>
            </TabsContent>

          </Tabs>
        </div>

        {/* Live Preview - Right Side (Always Visible) */}
        <div className="flex-1">
          <LivePreview formData={formData} />
        </div>
      </div>
    </div>
  )
} 