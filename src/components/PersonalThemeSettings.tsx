'use client'

import React, { useState, useEffect } from 'react'
import { PersonalThemeSettings as PersonalThemeSettingsType } from '@/types/theme'
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
      <h4 className="font-semibold text-lg text-gray-800">Live Preview</h4>

      {/* Buttons Preview */}
      <div className="border rounded-lg p-4 space-y-3 bg-white shadow-sm">
        <h5 className="font-medium text-sm text-gray-600">Buttons</h5>
        <div className="space-y-3">
          <button
            className="w-full px-4 py-2 rounded text-white font-medium"
            style={{
              backgroundColor: formData.primaryColor || '#3b82f6',
              color: formData.primaryForeground || '#ffffff',
              borderRadius: `${formData.borderRadius || '6'}px`,
            }}
          >
            Primary Button
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
            Secondary Button
          </button>
        </div>
      </div>

      {/* Typography Preview */}
      <div className="border rounded-lg p-4 space-y-3 bg-white shadow-sm">
        <h5 className="font-medium text-sm text-gray-600">Typography</h5>
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
            Large Heading
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
            Subheading Style
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
            This is body text showing how paragraphs look with your selected font family.
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
            Small muted text for captions.
          </p>
        </div>
      </div>

      {/* Status Colors Preview */}
      <div className="border rounded-lg p-4 space-y-3 bg-white shadow-sm">
        <h5 className="font-medium text-sm text-gray-600">Status Colors</h5>
        <div className="space-y-2">
          <Badge
            className="w-full justify-center"
            style={{ backgroundColor: formData.successColor || '#10b981', color: '#ffffff' }}
          >
            Success
          </Badge>
          <Badge
            className="w-full justify-center"
            style={{ backgroundColor: formData.warningColor || '#f59e0b', color: '#ffffff' }}
          >
            Warning
          </Badge>
          <Badge
            className="w-full justify-center"
            style={{ backgroundColor: formData.errorColor || '#ef4444', color: '#ffffff' }}
          >
            Error
          </Badge>
          <Badge
            className="w-full justify-center"
            style={{ backgroundColor: formData.infoColor || '#3b82f6', color: '#ffffff' }}
          >
            Info
          </Badge>
        </div>
      </div>
    </div>
  )
}

export default function PersonalThemeSettings() {
  const [themeSettings, setThemeSettings] = useState<PersonalThemeSettingsType | null>(null)
  const [formData, setFormData] = useState<Partial<PersonalThemeSettingsType>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  // Load personal theme settings
  const loadThemeSettings = async () => {
    try {
      const response = await fetch('/api/personal-theme')
      if (response.ok) {
        const settings = await response.json()
        setThemeSettings(settings)
        setFormData(settings)
      }
    } catch (error) {
      console.error('Failed to load personal theme settings:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Initialize settings
  useEffect(() => {
    loadThemeSettings()
  }, [])

  // Track changes
  useEffect(() => {
    if (themeSettings) {
      const hasChanged = JSON.stringify(formData) !== JSON.stringify(themeSettings)
      setHasChanges(hasChanged)
    }
  }, [formData, themeSettings])

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
      const response = await fetch('/api/personal-theme', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const updatedSettings = await response.json()
        setThemeSettings(updatedSettings)
        setFormData(updatedSettings)
        setHasChanges(false)

        toast({
          title: 'Success',
          description: 'Your personal theme settings have been saved successfully',
        })
      } else {
        const error = await response.json()
        toast({
          title: 'Error',
          description: error.message || 'Failed to save theme settings',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Failed to save theme:', error)
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = () => {
    if (themeSettings) {
      setFormData(themeSettings)
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
          <h2 className="text-2xl font-bold text-gray-900">Personal Theme Settings</h2>
          <p className="text-gray-600">Customize your personal interface appearance</p>
        </div>
        <div className="flex space-x-3">
          {hasChanges && (
            <Button variant="outline" onClick={handleReset}>
              Reset
            </Button>
          )}
          <Button
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {/* Theme Settings with Live Preview */}
      <div className="flex gap-6">
        {/* Settings Tabs - Left Side */}
        <div className="flex-[2]">
          <Tabs defaultValue="colors" className="w-full">
            <TabsList className="grid grid-cols-3 w-full max-w-md">
              <TabsTrigger value="colors">Colors</TabsTrigger>
              <TabsTrigger value="typography">Typography</TabsTrigger>
              <TabsTrigger value="layout">Layout</TabsTrigger>
            </TabsList>

            <TabsContent value="colors" className="mt-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Color Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                  {/* Primary Colors */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-800">Primary Colors</h4>
                    <ColorInput
                      label="Primary Color"
                      value={formData.primaryColor || '#3b82f6'}
                      onChange={(value) => handleInputChange('primaryColor', value)}
                      description="Main brand color"
                    />
                    <ColorInput
                      label="Primary Foreground"
                      value={formData.primaryForeground || '#ffffff'}
                      onChange={(value) => handleInputChange('primaryForeground', value)}
                      description="Text on primary"
                    />
                    <ColorInput
                      label="Secondary Color"
                      value={formData.secondaryColor || '#f1f5f9'}
                      onChange={(value) => handleInputChange('secondaryColor', value)}
                      description="Secondary buttons"
                    />
                    <ColorInput
                      label="Secondary Foreground"
                      value={formData.secondaryForeground || '#0f172a'}
                      onChange={(value) => handleInputChange('secondaryForeground', value)}
                      description="Text on secondary"
                    />
                    <ColorInput
                      label="Accent Color"
                      value={formData.accentColor || '#10b981'}
                      onChange={(value) => handleInputChange('accentColor', value)}
                      description="Highlights"
                    />
                  </div>

                  {/* Background Colors */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-800">Background Colors</h4>
                    <ColorInput
                      label="Background"
                      value={formData.backgroundColor || '#ffffff'}
                      onChange={(value) => handleInputChange('backgroundColor', value)}
                      description="Main background"
                    />
                    <ColorInput
                      label="Surface Color"
                      value={formData.surfaceColor || '#f8fafc'}
                      onChange={(value) => handleInputChange('surfaceColor', value)}
                      description="Cards and panels"
                    />
                    <ColorInput
                      label="Border Color"
                      value={formData.borderColor || '#e2e8f0'}
                      onChange={(value) => handleInputChange('borderColor', value)}
                      description="Borders"
                    />
                  </div>

                  {/* Text Colors */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-800">Text Colors</h4>
                    <ColorInput
                      label="Primary Text"
                      value={formData.textPrimary || '#0f172a'}
                      onChange={(value) => handleInputChange('textPrimary', value)}
                      description="Main text"
                    />
                    <ColorInput
                      label="Secondary Text"
                      value={formData.textSecondary || '#64748b'}
                      onChange={(value) => handleInputChange('textSecondary', value)}
                      description="Secondary info"
                    />
                    <ColorInput
                      label="Muted Text"
                      value={formData.textMuted || '#94a3b8'}
                      onChange={(value) => handleInputChange('textMuted', value)}
                      description="Disabled text"
                    />
                  </div>

                  {/* Status Colors */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-800">Status Colors</h4>
                    <ColorInput
                      label="Success"
                      value={formData.successColor || '#10b981'}
                      onChange={(value) => handleInputChange('successColor', value)}
                    />
                    <ColorInput
                      label="Warning"
                      value={formData.warningColor || '#f59e0b'}
                      onChange={(value) => handleInputChange('warningColor', value)}
                    />
                    <ColorInput
                      label="Error"
                      value={formData.errorColor || '#ef4444'}
                      onChange={(value) => handleInputChange('errorColor', value)}
                    />
                    <ColorInput
                      label="Info"
                      value={formData.infoColor || '#3b82f6'}
                      onChange={(value) => handleInputChange('infoColor', value)}
                    />
                  </div>

                </div>
              </Card>
            </TabsContent>

            <TabsContent value="typography" className="mt-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Typography Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                  <div className="space-y-4">
                    <div>
                      <Label>Font Family</Label>
                      <select
                        value={formData.fontFamily || 'Inter'}
                        onChange={(e) => handleInputChange('fontFamily', e.target.value)}
                        className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
                      >
                        <optgroup label="Sans-Serif">
                          <option value="Inter">Inter (Default)</option>
                          <option value="Arial">Arial</option>
                          <option value="Helvetica">Helvetica</option>
                          <option value="Roboto">Roboto</option>
                          <option value="Open Sans">Open Sans</option>
                          <option value="Lato">Lato</option>
                          <option value="Montserrat">Montserrat</option>
                          <option value="Poppins">Poppins</option>
                        </optgroup>
                        <optgroup label="Serif">
                          <option value="Georgia">Georgia</option>
                          <option value="Times New Roman">Times New Roman</option>
                          <option value="Merriweather">Merriweather</option>
                        </optgroup>
                      </select>
                    </div>

                    <div>
                      <Label>Base Font Size (px)</Label>
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
                      <Label>Line Height</Label>
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
                      <Label>Border Radius (px)</Label>
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
                <h3 className="text-lg font-semibold mb-4">Layout Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                  <div className="space-y-4">
                    <div>
                      <Label>Button Size</Label>
                      <select
                        value={formData.buttonSize || 'md'}
                        onChange={(e) => handleInputChange('buttonSize', e.target.value)}
                        className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
                      >
                        <option value="sm">Small</option>
                        <option value="md">Medium</option>
                        <option value="lg">Large</option>
                      </select>
                    </div>

                    <div>
                      <Label>Input Size</Label>
                      <select
                        value={formData.inputSize || 'md'}
                        onChange={(e) => handleInputChange('inputSize', e.target.value)}
                        className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
                      >
                        <option value="sm">Small</option>
                        <option value="md">Medium</option>
                        <option value="lg">Large</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label>Shadow Level</Label>
                      <select
                        value={formData.shadowLevel || 'md'}
                        onChange={(e) => handleInputChange('shadowLevel', e.target.value)}
                        className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
                      >
                        <option value="none">None</option>
                        <option value="sm">Small</option>
                        <option value="md">Medium</option>
                        <option value="lg">Large</option>
                        <option value="xl">Extra Large</option>
                      </select>
                    </div>

                    <div>
                      <Label>Icon Size (px)</Label>
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