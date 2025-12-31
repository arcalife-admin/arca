// Enhanced PeriodontalChart.tsx with Placeholders for Surface Labels
import React, { useState, useEffect, useRef, useMemo } from 'react'
import { Card } from '../ui/card'
import { Input } from '../ui/input'
import { Button } from '../ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '../ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../ui/dialog'
import { Textarea } from '../ui/textarea'
import { DentalChartData } from '@/types/dental'
import { HelpCircle, FileText } from 'lucide-react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../ui/popover'

export interface PeriodontalMeasurements {
  pocketDepth: number | null | undefined
  recession: number | null | undefined
  bleeding: boolean
  suppuration: boolean
  plaque: boolean
  furcation: number | null
}

export interface ToothMeasurements {
  buccal: {
    distal: PeriodontalMeasurements
    middle: PeriodontalMeasurements
    mesial: PeriodontalMeasurements
  }
  lingual: {
    distal: PeriodontalMeasurements
    middle: PeriodontalMeasurements
    mesial: PeriodontalMeasurements
  }
  mobility: number | null
  notes: string
  isImplant: boolean
  isDisabled: boolean
}

export type PeriodontalChartType = 'INITIAL_ASSESSMENT' | 'REASSESSMENT' | 'MAINTENANCE' | 'TREATMENT_PLANNING' | 'POST_TREATMENT' | 'OTHER'

interface PeriodontalChartProps {
  initialData?: {
    date: string
    teeth: Record<number, ToothMeasurements>
    chartType?: PeriodontalChartType
    isExplicitlySaved?: boolean
  }
  dentalChartData?: DentalChartData
  onSave: (data: {
    date: string;
    teeth: Record<number, ToothMeasurements>;
    chartType: PeriodontalChartType;
    isExplicitlySaved: boolean;
  }) => void
  onAutoSave?: (data: {
    date: string;
    teeth: Record<number, ToothMeasurements>;
    chartType?: PeriodontalChartType;
    isExplicitlySaved: boolean;
  }) => void
  readOnly?: boolean
  settings?: any
  onSettingsChange?: (settings: any) => void
  mode?: 'edit' | 'view' | 'comparison'
}

const ADULT_TEETH = {
  upper: [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28],
  lower: [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38],
}

// Define which teeth can have furcations and where
const FURCATION_SITES = {
  // Upper molars: buccal & distal-lingual & mesial-lingual
  18: ['b', 'dl', 'ml'],
  17: ['b', 'dl', 'ml'],
  16: ['b', 'dl', 'ml'],
  26: ['b', 'dl', 'ml'],
  27: ['b', 'dl', 'ml'],
  28: ['b', 'dl', 'ml'],
  // Upper premolars: distal-lingual & mesial-lingual only
  14: ['dl', 'ml'],
  24: ['dl', 'ml'],
  // Lower molars: buccal & lingual
  38: ['b', 'l'],
  37: ['b', 'l'],
  36: ['b', 'l'],
  46: ['b', 'l'],
  47: ['b', 'l'],
  48: ['b', 'l'],
}

const createDefaultMeasurements = (): PeriodontalMeasurements => ({
  pocketDepth: null,
  recession: null,
  bleeding: false,
  suppuration: false,
  plaque: false,
  furcation: null
})

const createDefaultTooth = (isDisabled: boolean = false, isImplant: boolean = false): ToothMeasurements => ({
  buccal: {
    distal: createDefaultMeasurements(),
    middle: createDefaultMeasurements(),
    mesial: createDefaultMeasurements(),
  },
  lingual: {
    distal: createDefaultMeasurements(),
    middle: createDefaultMeasurements(),
    mesial: createDefaultMeasurements(),
  },
  mobility: null,
  notes: '',
  isImplant,
  isDisabled
})

const defaultSettings = {
  keybinds: {
    bleeding: 'b',
    suppuration: 'n',
    extended: ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o'],
  }
}

export default function PeriodontalChart({
  initialData,
  dentalChartData,
  onSave,
  onAutoSave,
  readOnly = false,
  settings = defaultSettings,
  onSettingsChange
}: PeriodontalChartProps) {
  const [chartData, setChartData] = useState<Record<number, ToothMeasurements>>(() => {
    const initial = initialData?.teeth || {}
    const filled: Record<number, ToothMeasurements> = {}

    for (const tooth of [...ADULT_TEETH.upper, ...ADULT_TEETH.lower]) {
      const dentalToothData = dentalChartData?.teeth[tooth]

      // Check all possible ways a tooth can be marked as disabled/extracted
      const isDisabled = dentalToothData?.isDisabled ||
        (dentalToothData?.surfaces ?
          Object.values(dentalToothData.surfaces).some(surface =>
            surface === 'disabled' || surface === 'extraction'
          ) : false) ||
        (dentalToothData?.procedures?.some(proc =>
          proc.type === 'disabled' || proc.type === 'extraction'
        ) ?? false)

      // Check all possible ways a tooth can be marked as an implant
      const isImplant = dentalToothData?.wholeTooth === 'implant' ||
        (dentalToothData?.surfaces ?
          Object.values(dentalToothData.surfaces).some(surface =>
            surface === 'implant'
          ) : false) ||
        (dentalToothData?.procedures?.some(proc =>
          proc.type === 'implant'
        ) ?? false)

      if (initial[tooth]) {
        // Preserve existing data but ensure isDisabled and isImplant are set correctly from dental chart
        filled[tooth] = {
          ...initial[tooth],
          isDisabled,
          isImplant
        }
      } else {
        // Create new tooth data with correct disabled and implant status from dental chart
        filled[tooth] = createDefaultTooth(isDisabled, isImplant)
      }
    }
    return filled
  })

  const [modifiers, setModifiers] = useState({ bleeding: false, suppuration: false, plaque: false })
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null)
  const [isNotesDialogOpen, setIsNotesDialogOpen] = useState(false)
  const [tempNotes, setTempNotes] = useState('')
  const [plaquePercentage, setPlaquePercentage] = useState(0)
  const [bleedingPercentage, setBleedingPercentage] = useState(0)
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false)
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false)
  const [selectedChartType, setSelectedChartType] = useState<PeriodontalChartType>('INITIAL_ASSESSMENT')
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({})
  const latestChartData = useRef<Record<number, ToothMeasurements>>({})

  // Simple auto-save function
  const triggerAutoSave = () => {
    if (onAutoSave) {
      console.log('Auto-saving periodontal chart...')
      onAutoSave({
        date: new Date().toISOString(),
        teeth: chartData,
        isExplicitlySaved: false
      })
    }
  }

  useEffect(() => {
    const keysPressed = new Set<string>()
    let modifiersState = { bleeding: false, suppuration: false, plaque: false }

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase()

      // Handle modifier keys (B, N, P) - only on keydown
      if (['b', 'n', 'p'].includes(key) && !e.shiftKey) {
        const wasPressed = keysPressed.has(key)

        // Toggle the key (if already pressed, remove it; if not pressed, add it)
        if (wasPressed) {
          keysPressed.delete(key)
        } else {
          keysPressed.add(key)
        }

        // Update modifiers state
        const newModifiers = {
          bleeding: keysPressed.has('b'),
          suppuration: keysPressed.has('n'),
          plaque: keysPressed.has('p')
        }

        modifiersState = newModifiers
        setModifiers(newModifiers)
        console.log(`Modifier toggled: ${key.toUpperCase()} - ${newModifiers}`)
      }

      // Handle Shift + modifier to undo
      if (e.shiftKey && ['b', 'n', 'p'].includes(key)) {
        e.preventDefault()
        keysPressed.delete(key)
        const newModifiers = {
          bleeding: keysPressed.has('b'),
          suppuration: keysPressed.has('n'),
          plaque: keysPressed.has('p')
        }
        modifiersState = newModifiers
        setModifiers(newModifiers)
        console.log(`Shift + ${key.toUpperCase()} - Removed modifier`)

        // Remove the modifier from the currently focused input if there is one
        const currentInput = document.activeElement as HTMLInputElement
        if (currentInput && currentInput.classList.contains('periodontal-input')) {
          const currentKey = currentInput.getAttribute('data-input-key')
          if (currentKey) {
            const [tooth, side, site, field] = currentKey.split('-')
            const currentValue = chartData[parseInt(tooth)]?.[side as 'buccal' | 'lingual']?.[site as 'distal' | 'middle' | 'mesial']?.[field as 'pocketDepth' | 'recession' | 'plaque']

            // Remove the specific modifier from the current input
            const updatedModifiers = {
              bleeding: key === 'b' ? false : undefined,
              suppuration: key === 'n' ? false : undefined,
              plaque: key === 'p' ? false : undefined
            }

            console.log(`Removing ${key.toUpperCase()} from ${currentKey}`)

            handleChange(
              parseInt(tooth),
              side as 'buccal' | 'lingual',
              site as 'distal' | 'middle' | 'mesial',
              field as 'pocketDepth' | 'recession' | 'plaque',
              currentValue !== null && currentValue !== undefined ? currentValue : null,
              updatedModifiers
            )
          }
        }
      }

      // Handle Escape to clear all
      if (e.key === 'Escape') {
        keysPressed.clear()
        modifiersState = { bleeding: false, suppuration: false, plaque: false }
        setModifiers(modifiersState)
      }

      // Handle arrow key navigation
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        const currentInput = document.activeElement as HTMLInputElement
        if (currentInput && currentInput.classList.contains('periodontal-input')) {
          e.preventDefault()
          const currentKey = currentInput.getAttribute('data-input-key')
          if (currentKey) {
            // Use the same navigation logic as number input
            const keys = originalFocusOrder
            const currentIndex = keys.indexOf(currentKey)
            let nextKey: string | undefined

            if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
              nextKey = keys[currentIndex + 1]
            } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
              nextKey = keys[currentIndex - 1]
            }

            if (nextKey) {
              console.log(`Navigation: ${currentKey} -> ${nextKey} (${e.key})`)
              const nextInput = inputRefs.current[nextKey]
              if (nextInput) {
                nextInput.focus()
              }
            }
          }
        }
      }

      // Handle space key for navigation
      if (e.key === ' ') {
        const currentInput = document.activeElement as HTMLInputElement
        if (currentInput && currentInput.classList.contains('periodontal-input')) {
          e.preventDefault()
          const currentKey = currentInput.getAttribute('data-input-key')
          if (currentKey) {
            // Check current modifier state
            const currentModifiers = {
              bleeding: keysPressed.has('b'),
              suppuration: keysPressed.has('n'),
              plaque: keysPressed.has('p')
            }

            console.log('Space pressed with modifiers:', currentModifiers)

            // Apply current modifiers to the current input before moving
            if (currentModifiers.bleeding || currentModifiers.suppuration || currentModifiers.plaque) {
              const [tooth, side, site, field] = currentKey.split('-')
              const currentValue = chartData[parseInt(tooth)]?.[side as 'buccal' | 'lingual']?.[site as 'distal' | 'middle' | 'mesial']?.[field as 'pocketDepth' | 'recession' | 'plaque']

              console.log(`Applying modifiers to ${currentKey}:`, currentModifiers)

              // Apply modifiers - always apply them regardless of existing value
              const modifiersToApply = {
                bleeding: currentModifiers.bleeding ? true : undefined,
                suppuration: currentModifiers.suppuration ? true : undefined,
                plaque: currentModifiers.plaque ? true : undefined
              }

              // Apply modifiers even if there's no existing value
              handleChange(
                parseInt(tooth),
                side as 'buccal' | 'lingual',
                site as 'distal' | 'middle' | 'mesial',
                field as 'pocketDepth' | 'recession' | 'plaque',
                currentValue !== null && currentValue !== undefined ? currentValue : null,
                modifiersToApply
              )
            }

            // Use the original focus order for space navigation
            const keys = originalFocusOrder
            const currentIndex = keys.indexOf(currentKey)
            const nextKey = keys[currentIndex + 1]
            if (nextKey) {
              console.log(`Space Navigation: ${currentKey} -> ${nextKey}`)
              const nextInput = inputRefs.current[nextKey]
              if (nextInput) {
                nextInput.focus()
              }
            }
          }
        }
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      // Only handle non-modifier keys in keyup
      // Modifiers are handled entirely in keydown for toggle behavior
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])



  useEffect(() => {
    // Find first available tooth in Q1
    const firstAvailableTooth = quadrantSpecific.Q1.find(tooth => !chartData[tooth]?.isDisabled);
    if (firstAvailableTooth) {
      const firstInput = inputRefs.current[`${firstAvailableTooth}-buccal-distal-recession`];
      if (firstInput) {
        firstInput.focus();
      }
    }
  }, [])

  // Calculate percentages when chartData changes
  useEffect(() => {
    calculatePercentages(chartData)
  }, [chartData])

  // Calculate percentages for plaque and bleeding
  const calculatePercentages = (data: Record<number, ToothMeasurements>) => {
    let plaqueSurfaces = 0
    let bleedingSurfaces = 0
    let totalSurfaces = 0

    Object.values(data).forEach(tooth => {
      if (!tooth.isDisabled) {
        totalSurfaces += 6 // 3 buccal + 3 lingual surfaces per tooth

        // Count buccal surfaces
        if (tooth.buccal.distal.plaque) plaqueSurfaces++
        if (tooth.buccal.middle.plaque) plaqueSurfaces++
        if (tooth.buccal.mesial.plaque) plaqueSurfaces++
        if (tooth.buccal.distal.bleeding) bleedingSurfaces++
        if (tooth.buccal.middle.bleeding) bleedingSurfaces++
        if (tooth.buccal.mesial.bleeding) bleedingSurfaces++

        // Count lingual surfaces
        if (tooth.lingual.distal.plaque) plaqueSurfaces++
        if (tooth.lingual.middle.plaque) plaqueSurfaces++
        if (tooth.lingual.mesial.plaque) plaqueSurfaces++
        if (tooth.lingual.distal.bleeding) bleedingSurfaces++
        if (tooth.lingual.middle.bleeding) bleedingSurfaces++
        if (tooth.lingual.mesial.bleeding) bleedingSurfaces++
      }
    })

    const newPlaquePercentage = totalSurfaces > 0 ? (plaqueSurfaces / totalSurfaces) * 100 : 0
    const newBleedingPercentage = totalSurfaces > 0 ? (bleedingSurfaces / totalSurfaces) * 100 : 0

    setPlaquePercentage(Math.round(newPlaquePercentage))
    setBleedingPercentage(Math.round(newBleedingPercentage))
  }

  const handleChange = (
    tooth: number,
    side: 'buccal' | 'lingual',
    site: 'distal' | 'middle' | 'mesial',
    field: 'pocketDepth' | 'recession' | 'plaque' | 'furcation',
    value: number | boolean,
    keyState: { bleeding: boolean; suppuration: boolean; plaque: boolean }
  ) => {
    console.log(`handleChange called: tooth=${tooth}, side=${side}, site=${site}, field=${field}, value=${value}`)
    setChartData(prev => {
      const prevTooth = prev[tooth] ?? createDefaultTooth()
      const prevSite = prevTooth[side][site] ?? createDefaultMeasurements()

      // Get existing modifiers for this surface
      const existingBleeding = prevSite.bleeding
      const existingSuppuration = prevSite.suppuration
      const existingPlaque = prevSite.plaque

      // Start with existing modifiers - PRESERVE THEM BY DEFAULT
      let bleeding = existingBleeding
      let suppuration = existingSuppuration
      let plaque = existingPlaque

      // Rule 1: IF b was already filled and n is active, overwrite b with n
      if (existingBleeding && keyState.suppuration === true) {
        bleeding = false
        suppuration = true
      }
      // Rule 2: IF n was already filled and b is active, overwrite n with b
      else if (existingSuppuration && keyState.bleeding === true) {
        suppuration = false
        bleeding = true
      }
      // Rule 3: Handle shift + key combinations to remove specific modifiers
      else if (keyState.bleeding === false || keyState.suppuration === false || keyState.plaque === false) {
        // This indicates shift + key was pressed to remove specific modifiers
        // Only remove the ones that are explicitly false, keep others
        if (keyState.bleeding === false) bleeding = false
        if (keyState.suppuration === false) suppuration = false
        if (keyState.plaque === false) plaque = false
      }
      // Rule 4: Handle new modifier activations (only when explicitly setting them)
      else if (keyState.bleeding === true || keyState.suppuration === true || keyState.plaque === true) {
        // Only apply new modifiers if they are explicitly true
        if (keyState.bleeding === true) {
          bleeding = true
          suppuration = false // Clear suppuration when setting bleeding
        }
        if (keyState.suppuration === true) {
          suppuration = true
          bleeding = false // Clear bleeding when setting suppuration
        }
        if (keyState.plaque === true) {
          plaque = true
        }
      }
      // Rule 5: If no modifiers are being set (undefined), preserve existing ones
      // This is the key fix - when adding numbers, don't reset modifiers unless explicitly told to

      const newMeasurements = {
        ...prevSite,
        [field]: field === 'furcation' ? Math.min(Math.max(value as number, 0), 3) : value,
        bleeding,
        suppuration,
        plaque
      }

      const newData = {
        ...prev,
        [tooth]: {
          ...prevTooth,
          [side]: {
            ...prevTooth[side],
            [site]: newMeasurements
          }
        }
      }

      return newData
    })

    // Auto-save immediately after any change
    triggerAutoSave()
  }

  const quadrantSpecific = {
    Q1: [18, 17, 16, 15, 14, 13, 12, 11],
    Q2: [28, 27, 26, 25, 24, 23, 22, 21],
    Q3: [38, 37, 36, 35, 34, 33, 32, 31],
    Q4: [48, 47, 46, 45, 44, 43, 42, 41]
  }

  // Memoize filtered quadrant arrays
  const activeQuadrants = useMemo(() => ({
    Q1: quadrantSpecific.Q1.filter(t => !chartData[t]?.isDisabled),
    Q2: quadrantSpecific.Q2.filter(t => !chartData[t]?.isDisabled),
    Q3: quadrantSpecific.Q3.filter(t => !chartData[t]?.isDisabled),
    Q4: quadrantSpecific.Q4.filter(t => !chartData[t]?.isDisabled)
  }), [chartData])

  const siteOrder = (tooth: number): ('distal' | 'middle' | 'mesial')[] => {
    const isQ2Q3 = [...quadrantSpecific.Q2, ...quadrantSpecific.Q3].includes(tooth)
    return isQ2Q3 ? ['mesial', 'middle', 'distal'] : ['distal', 'middle', 'mesial']
  }

  const orderFields = (field: 'pocketDepth' | 'recession' | 'plaque') => {
    let keys: string[] = []
    // Use memoized filtered quadrant arrays
    const activeQ1 = activeQuadrants.Q1
    const activeQ2 = activeQuadrants.Q2
    const activeQ3 = activeQuadrants.Q3
    const activeQ4 = activeQuadrants.Q4

    const firstRecessionOrder = [
      ...activeQ1.map(t => ({ tooth: t, side: 'buccal' })),
      ...activeQ2.map(t => ({ tooth: t, side: 'lingual' })),
      ...activeQ3.map(t => ({ tooth: t, side: 'lingual' })),
      ...activeQ4.map(t => ({ tooth: t, side: 'buccal' })),
    ]
    const secondRecessionOrder = [
      ...activeQ1.map(t => ({ tooth: t, side: 'lingual' })),
      ...activeQ2.map(t => ({ tooth: t, side: 'buccal' })),
      ...activeQ3.map(t => ({ tooth: t, side: 'buccal' })),
      ...activeQ4.map(t => ({ tooth: t, side: 'lingual' })),
    ]
    const firstPocketDepthOrder = [
      ...activeQ1.map(t => ({ tooth: t, side: 'buccal' })),
      ...activeQ2.map(t => ({ tooth: t, side: 'lingual' })),
      ...activeQ3.map(t => ({ tooth: t, side: 'lingual' })),
      ...activeQ4.map(t => ({ tooth: t, side: 'buccal' })),
    ]
    const secondPocketDepthOrder = [
      ...activeQ1.map(t => ({ tooth: t, side: 'lingual' })),
      ...activeQ2.map(t => ({ tooth: t, side: 'buccal' })),
      ...activeQ3.map(t => ({ tooth: t, side: 'buccal' })),
      ...activeQ4.map(t => ({ tooth: t, side: 'lingual' })),
    ]
    const fullOrder = field === 'recession' ? [...firstRecessionOrder, ...secondRecessionOrder] : [...firstPocketDepthOrder, ...secondPocketDepthOrder]
    fullOrder.forEach(({ tooth, side }) => {
      ['distal', 'middle', 'mesial'].forEach(site => {
        keys.push(`${tooth}-${side}-${site}-${field}`)
      })
    })
    return keys
  }

  const originalFocusOrder = useMemo(() => [
    ...orderFields('recession'),
    ...orderFields('pocketDepth'),
    ...orderFields('plaque')
  ], [chartData])

  const renderInputRow = (tooth: number, side: 'buccal' | 'lingual', field: 'pocketDepth' | 'recession' | 'plaque') => {
    return (
      <div className="flex space-x-1 mb-0.5">
        {siteOrder(tooth).map(site => {
          const key = `${tooth}-${side}-${site}-${field}`
          const measurements = chartData[tooth]?.[side]?.[site]
          const value = measurements?.[field]
          const bg = field === 'pocketDepth' ?
            (measurements?.bleeding ? 'bg-red-100' :
              measurements?.suppuration ? 'bg-amber-100' : '') :
            field === 'plaque' && measurements?.plaque ? 'bg-sky-100' : ''
          const border = field === 'plaque' ? 'border-sky-500 border-2' :
            field === 'recession' ? 'border-amber-500 border-2' :
              field === 'pocketDepth' ? 'border-rose-500 border-2' : ''

          if (field === 'plaque') {
            return (
              <div
                key={key}
                ref={(el) => { inputRefs.current[key] = el as any }}
                className={`w-6 h-6 text-center text-sm rounded ${border} ${bg} m-0 p-0 cursor-pointer ${readOnly ? 'opacity-50' : ''}`}
                onClick={() => {
                  if (!readOnly) {
                    handleChange(tooth, side, site, field, !measurements?.plaque, {
                      bleeding: modifiers.bleeding,
                      suppuration: modifiers.suppuration,
                      plaque: modifiers.plaque
                    })
                  }
                }}
              />
            )
          }

          const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, keyState: { bleeding: boolean; suppuration: boolean; plaque: boolean }) => {
            const char = e.target.value.slice(-1).toLowerCase();
            let val: number | null = null;
            if (!isNaN(Number(char))) val = Number(char);
            else {
              const extended = ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o'];
              const idx = extended.indexOf(char);
              if (idx !== -1) val = 10 + idx;
            }
            if (val !== null) {
              handleChange(tooth, side, site as any, field, val, keyState);
              const keys = originalFocusOrder;
              const currentIndex = keys.indexOf(key);
              const nextKey = keys[currentIndex + 1];
              const nextInput = inputRefs.current[nextKey];
              if (nextInput) {
                setTimeout(() => nextInput.focus(), 0);
              }
            }
          }

          return (
            <Input
              key={key}
              ref={(el) => { inputRefs.current[key] = el }}
              inputMode="numeric"
              type="text"
              value={value === 0 ? '' : value?.toString() || ''}
              onChange={(e) => {
                // Only pass modifiers if they are explicitly active, otherwise pass undefined
                const keyState = {
                  bleeding: modifiers.bleeding ? true : undefined,
                  suppuration: modifiers.suppuration ? true : undefined,
                  plaque: modifiers.plaque ? true : undefined
                };
                handleInputChange(e, keyState);
              }}
              onFocus={(e) => {
                const element = e.currentTarget;
                const keyState = {
                  bleeding: modifiers.bleeding ? true : undefined,
                  suppuration: modifiers.suppuration ? true : undefined,
                  plaque: modifiers.plaque ? true : undefined
                };

                const handleKeyChange = (evt: KeyboardEvent) => {
                  if (evt.key === 'b' || evt.key === 'n' || evt.key === 'p') {
                    keyState.bleeding = evt.key === 'b' ? (evt.type === 'keydown' ? true : undefined) : keyState.bleeding;
                    keyState.suppuration = evt.key === 'n' ? (evt.type === 'keydown' ? true : undefined) : keyState.suppuration;
                    keyState.plaque = evt.key === 'p' ? (evt.type === 'keydown' ? true : undefined) : keyState.plaque;
                  }
                };

                window.addEventListener('keydown', handleKeyChange);
                window.addEventListener('keyup', handleKeyChange);

                element.onblur = () => {
                  window.removeEventListener('keydown', handleKeyChange);
                  window.removeEventListener('keyup', handleKeyChange);
                };

                element.oninput = (evt) => {
                  if (evt.target instanceof HTMLInputElement) {
                    handleInputChange({ target: evt.target } as React.ChangeEvent<HTMLInputElement>, keyState);
                  }
                };
              }}
              disabled={readOnly}
              className={`w-6 h-6 text-center text-sm rounded ${border} ${bg} m-0 p-0 periodontal-input`}
              data-input-key={key}
            />
          )
        })}
      </div>
    )
  }

  const handleContextMenuAction = (tooth: number, action: 'implant' | 'notes') => {
    if (action === 'implant') {
      setChartData(prev => ({
        ...prev,
        [tooth]: {
          ...prev[tooth],
          isImplant: !prev[tooth]?.isImplant
        }
      }))
      // Auto-save for implant changes
      triggerAutoSave()
    } else if (action === 'notes') {
      setSelectedTooth(tooth)
      setTempNotes(chartData[tooth]?.notes || '')
      setIsNotesDialogOpen(true)
    }
  }

  const handleSaveNotes = () => {
    if (selectedTooth !== null) {
      const updatedChartData = {
        ...chartData,
        [selectedTooth]: {
          ...chartData[selectedTooth],
          notes: tempNotes
        }
      }
      setChartData(updatedChartData)
      setIsNotesDialogOpen(false)
      // Auto-save for notes changes
      triggerAutoSave()
    }
  }

  const handleMobilityChange = (tooth: number, value: string) => {
    const mobilityValue = value === '' ? null : Math.min(Math.max(parseInt(value, 10), 1), 3)
    if (mobilityValue === null || !isNaN(mobilityValue)) {
      setChartData(prev => ({
        ...prev,
        [tooth]: {
          ...prev[tooth],
          mobility: mobilityValue
        }
      }))
      // Auto-save for mobility changes
      triggerAutoSave()
    }
  }

  const handleFurcationChange = (
    tooth: number,
    site: string,
    value: string
  ) => {
    const furcationValue = value === '' ? null : Math.min(Math.max(parseInt(value, 10), 0), 3)
    if (furcationValue === null || !isNaN(furcationValue)) {
      setChartData(prev => {
        const updatedTooth = { ...prev[tooth] }
        if (site === 'b') {
          updatedTooth.buccal.middle.furcation = furcationValue
        } else if (site === 'l') {
          updatedTooth.lingual.middle.furcation = furcationValue
        } else if (site === 'dl') {
          updatedTooth.lingual.distal.furcation = furcationValue
        } else if (site === 'ml') {
          updatedTooth.lingual.mesial.furcation = furcationValue
        }
        return {
          ...prev,
          [tooth]: updatedTooth
        }
      })
      // Auto-save for furcation changes
      triggerAutoSave()
    }
  }

  const renderFurcation = (tooth: number, site: string) => {
    if (!FURCATION_SITES[tooth]?.includes(site)) {
      // Return empty div with same height to maintain spacing
      return <div className="h-6" />
    }

    const toothData = chartData[tooth]
    let furcationValue = null
    if (site === 'b') {
      furcationValue = toothData?.buccal?.middle?.furcation
    } else if (site === 'l') {
      furcationValue = toothData?.lingual?.middle?.furcation
    } else if (site === 'dl') {
      furcationValue = toothData?.lingual?.distal?.furcation
    } else if (site === 'ml') {
      furcationValue = toothData?.lingual?.mesial?.furcation
    }

    return (
      <div className="flex space-x-1">
        <Input
          type="text"
          inputMode="numeric"
          value={furcationValue === null ? '' : furcationValue.toString()}
          onChange={(e) => handleFurcationChange(tooth, site, e.target.value)}
          className="w-6 h-6 text-[10px] text-center p-0 mx-2 mb-0.5 border-violet-500 border-2 rounded"
          disabled={readOnly}
        />
      </div>
    )
  }

  const renderMobility = (tooth: number, position: 'top' | 'bottom') => {
    const toothData = chartData[tooth]
    return (
      <div className={`flex items-center w-full ${position === 'top' ? 'mb-1' : 'mt-1'}`}>
        <div className="flex items-center w-full">
          <Input
            type="text"
            inputMode="numeric"
            value={toothData?.mobility === null ? '' : toothData.mobility.toString()}
            onChange={(e) => handleMobilityChange(tooth, e.target.value)}
            className="w-[4.5rem] h-6 text-[10px] text-center p-0 mx-2.5 border-emerald-500 border-2 rounded"
            disabled={readOnly}
          />
        </div>
      </div>
    )
  }

  const renderTooth = (tooth: number) => {
    const toothData = chartData[tooth]

    // Safety check - if toothData doesn't exist, create a default one
    if (!toothData) {
      const dentalToothData = dentalChartData?.teeth[tooth]
      const isDisabled = dentalToothData?.isDisabled ||
        (dentalToothData?.surfaces ?
          Object.values(dentalToothData.surfaces).some(surface =>
            surface === 'disabled' || surface === 'extraction'
          ) : false) ||
        (dentalToothData?.procedures?.some(proc =>
          proc.type === 'disabled' || proc.type === 'extraction'
        ) ?? false)
      const isImplant = dentalToothData?.wholeTooth === 'implant' ||
        (dentalToothData?.surfaces ?
          Object.values(dentalToothData.surfaces).some(surface =>
            surface === 'implant'
          ) : false) ||
        (dentalToothData?.procedures?.some(proc =>
          proc.type === 'implant'
        ) ?? false)

      const defaultTooth = createDefaultTooth(isDisabled, isImplant)
      setChartData(prev => ({ ...prev, [tooth]: defaultTooth }))
      return renderTooth(tooth) // Recursive call with the new data
    }

    // If tooth is disabled (extracted), render just the tooth number
    if (toothData.isDisabled) {
      return (
        <div className="flex flex-col items-center justify-center h-full relative opacity-25">
          <span className="text-xs font-bold text-blue-900">{tooth}</span>
        </div>
      )
    }

    const hasNotes = toothData.notes && toothData.notes.length > 0
    const toothBg = toothData.isImplant ? 'bg-emerald-50' : ''

    return (
      <div
        className={`flex flex-col items-center relative ${toothBg}`}
        onContextMenu={(e) => {
          e.preventDefault()
          setSelectedTooth(tooth)
          handleContextMenuAction(tooth, 'notes')
        }}
      >
        {ADULT_TEETH.upper.includes(tooth) ? (
          <>
            {renderMobility(tooth, 'top')}
            <div className="flex space-x-1">{renderFurcation(tooth, 'b')}</div>
            {renderInputRow(tooth, 'buccal', 'plaque')}
            {renderInputRow(tooth, 'buccal', 'recession')}
            {renderInputRow(tooth, 'buccal', 'pocketDepth')}
            <div className="flex items-center gap-1">
              <span className="text-xs font-bold text-blue-900">{tooth}</span>
              {hasNotes && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <FileText className="w-3 h-3 text-blue-600 cursor-pointer" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs whitespace-pre-wrap">{toothData.notes}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
            {renderInputRow(tooth, 'lingual', 'pocketDepth')}
            {renderInputRow(tooth, 'lingual', 'recession')}
            {renderInputRow(tooth, 'lingual', 'plaque')}
            <div className="flex space-x-4">
              {renderFurcation(tooth, 'dl')}
              {renderFurcation(tooth, 'ml')}
            </div>
          </>
        ) : (
          <>
            <div className="flex space-x-1">{renderFurcation(tooth, 'l')}</div>
            {renderInputRow(tooth, 'lingual', 'plaque')}
            {renderInputRow(tooth, 'lingual', 'recession')}
            {renderInputRow(tooth, 'lingual', 'pocketDepth')}
            <div className="flex items-center gap-1">
              <span className="text-xs font-bold text-blue-900">{tooth}</span>
              {hasNotes && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <FileText className="w-3 h-3 text-blue-600 cursor-pointer" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs whitespace-pre-wrap">{toothData.notes}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
            {renderInputRow(tooth, 'buccal', 'pocketDepth')}
            {renderInputRow(tooth, 'buccal', 'recession')}
            {renderInputRow(tooth, 'buccal', 'plaque')}
            <div className="flex space-x-1">{renderFurcation(tooth, 'b')}</div>
            {renderMobility(tooth, 'bottom')}
          </>
        )}
      </div>
    )
  }

  // Function to render a group of teeth with proper keys
  const renderTeethGroup = (teeth: number[]) => {
    return teeth.map(tooth => (
      <div key={tooth} className="flex flex-col">
        {renderTooth(tooth)}
      </div>
    ));
  };

  return (
    <>
      <Card className="p-2 w-full">
        <div className="space-y-1.5">
          <div className="flex justify-between items-center mb-2">
            <div className="text-sm">
              <span className="font-semibold">Plaque: </span>
              <span className="text-blue-600">{plaquePercentage}%</span>
              <span className="mx-4 font-semibold">Bleeding: </span>
              <span className="text-red-600">{bleedingPercentage}%</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm">
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 border-2 border-sky-500 rounded"></div>
                  <span>Plaque</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 border-2 border-amber-500 rounded"></div>
                  <span>Recession</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 border-2 border-rose-500 rounded"></div>
                  <span>Pocket Depth</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 border-2 border-violet-500 rounded"></div>
                  <span>Furcation</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 border-2 border-emerald-500 rounded"></div>
                  <span>Mobility</span>
                </div>
                <div className="flex items-center gap-1">
                  <FileText className="w-4 h-4 text-blue-600"></FileText>
                  <span>Notes</span>
                </div>
              </div>

              {/* Active Modifiers Display */}
              {(modifiers.bleeding || modifiers.suppuration || modifiers.plaque) && (
                <div className="flex items-center gap-2 text-sm bg-yellow-50 px-3 py-1 rounded-md border">
                  <span className="font-medium">Active:</span>
                  {modifiers.bleeding && (
                    <button
                      onClick={() => setModifiers(prev => ({ ...prev, bleeding: false }))}
                      className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-xs hover:bg-red-200 cursor-pointer"
                      title="Click to clear bleeding"
                    >
                      Bleeding
                    </button>
                  )}
                  {modifiers.suppuration && (
                    <button
                      onClick={() => setModifiers(prev => ({ ...prev, suppuration: false }))}
                      className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded text-xs hover:bg-amber-200 cursor-pointer"
                      title="Click to clear suppuration"
                    >
                      Suppuration
                    </button>
                  )}
                  {modifiers.plaque && (
                    <button
                      onClick={() => setModifiers(prev => ({ ...prev, plaque: false }))}
                      className="bg-sky-100 text-sky-700 px-2 py-0.5 rounded text-xs hover:bg-sky-200 cursor-pointer"
                      title="Click to clear plaque"
                    >
                      Plaque
                    </button>
                  )}
                  <span className="text-gray-500 text-xs">(Press ESC to clear all)</span>
                </div>
              )}
              <Popover>
                <PopoverTrigger>
                  <HelpCircle className="h-5 w-5 text-gray-500 hover:text-gray-700 cursor-pointer" />
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <div className="space-y-2">
                    <h4 className="font-medium">Keyboard Shortcuts</h4>
                    <div className="text-sm space-y-1">
                      <p><kbd className="px-1 bg-gray-100 rounded">B</kbd> - Toggle Bleeding (can overwrite N)</p>
                      <p><kbd className="px-1 bg-gray-100 rounded">N</kbd> - Toggle Suppuration (can overwrite B)</p>
                      <p><kbd className="px-1 bg-gray-100 rounded">P</kbd> - Toggle Plaque</p>
                      <p><kbd className="px-1 bg-gray-100 rounded">Shift + B/N/P</kbd> - Undo Bleeding/Suppuration/Plaque</p>
                      <p><kbd className="px-1 bg-gray-100 rounded">ESC</kbd> - Clear all modifiers</p>
                      <p><kbd className="px-1 bg-gray-100 rounded">← →</kbd> - Navigate between sites (d↔b↔m, moves to next tooth)</p>
                      <p><kbd className="px-1 bg-gray-100 rounded">↑ ↓</kbd> - Navigate between fields (vertical)</p>
                      <p><kbd className="px-1 bg-gray-100 rounded">Space</kbd> - Move to next input (preserves values)</p>
                      <p>Numbers <kbd className="px-1 bg-gray-100 rounded">0-9</kbd> - Set measurement value</p>
                      <p>Extended values:</p>
                      <div className="ml-4">
                        <p><kbd className="px-1 bg-gray-100 rounded">Q</kbd> = 10</p>
                        <p><kbd className="px-1 bg-gray-100 rounded">W</kbd> = 11</p>
                        <p><kbd className="px-1 bg-gray-100 rounded">E</kbd> = 12</p>
                        <p><kbd className="px-1 bg-gray-100 rounded">R</kbd> = 13</p>
                        <p><kbd className="px-1 bg-gray-100 rounded">T</kbd> = 14</p>
                        <p><kbd className="px-1 bg-gray-100 rounded">Y</kbd> = 15</p>
                        <p><kbd className="px-1 bg-gray-100 rounded">U</kbd> = 16</p>
                        <p><kbd className="px-1 bg-gray-100 rounded">I</kbd> = 17</p>
                        <p><kbd className="px-1 bg-gray-100 rounded">O</kbd> = 18</p>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t">
                      <h4 className="font-medium">Mouse Controls</h4>
                      <div className="text-sm space-y-1">
                        <p><kbd className="px-1 bg-gray-100 rounded">Right Click</kbd> on tooth - Add/Edit Notes</p>
                        <p><kbd className="px-1 bg-gray-100 rounded">Left Click</kbd> - Select input boxes</p>
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <div className="grid grid-cols-[repeat(17,minmax(0,1fr))] border-b border-gray-400 w-full pb-1">
            {renderTeethGroup(ADULT_TEETH.upper.slice(0, 8))}
            <div key="upper-separator" className="col-span-1 bg-gray-400 w-px h-full mx-auto" style={{ gridColumn: '9 / span 1' }} />
            {renderTeethGroup(ADULT_TEETH.upper.slice(8))}
          </div>
          <div className="grid grid-cols-[repeat(17,minmax(0,1fr))] w-full">
            {renderTeethGroup(ADULT_TEETH.lower.slice(0, 8))}
            <div key="lower-separator" className="col-span-1 bg-gray-400 w-px h-full mx-auto" style={{ gridColumn: '9 / span 1' }} />
            {renderTeethGroup(ADULT_TEETH.lower.slice(8))}
          </div>
          {!readOnly && (
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsResetDialogOpen(true)}
              >
                Reset Chart
              </Button>
              <Button onClick={() => setIsSaveDialogOpen(true)}>Save Chart</Button>
            </div>
          )}
        </div>
      </Card>

      <Dialog open={isNotesDialogOpen} onOpenChange={setIsNotesDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedTooth ? `Notes for Tooth ${selectedTooth}` : 'Notes'}</DialogTitle>
          </DialogHeader>
          <Textarea
            value={tempNotes}
            onChange={(e) => setTempNotes(e.target.value)}
            placeholder="Enter notes here..."
            className="min-h-[100px]"
          />
          <DialogFooter>
            <Button onClick={handleSaveNotes}>Save Notes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Save Chart Dialog */}
      <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Periodontal Chart</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Chart Type</label>
              <select
                value={selectedChartType}
                onChange={(e) => setSelectedChartType(e.target.value as PeriodontalChartType)}
                className="w-full mt-1 p-2 border rounded-md"
              >
                <option value="INITIAL_ASSESSMENT">Initial Assessment</option>
                <option value="REASSESSMENT">Reassessment</option>
                <option value="MAINTENANCE">Maintenance</option>
                <option value="TREATMENT_PLANNING">Treatment Planning</option>
                <option value="POST_TREATMENT">Post Treatment</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSaveDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              onSave({
                date: new Date().toISOString(),
                teeth: chartData,
                chartType: selectedChartType,
                isExplicitlySaved: true
              })
              setIsSaveDialogOpen(false)
              setHasUnsavedChanges(false)
            }}>
              Save Chart
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Chart Dialog */}
      <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Periodontal Chart</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-gray-600">
              Are you sure you want to reset the periodontal chart? This will clear all measurements and cannot be undone.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsResetDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                // Reset chart data but preserve dental chart structure
                const resetData: Record<number, ToothMeasurements> = {}

                // Re-initialize with dental chart data to preserve disabled/extracted teeth
                for (const tooth of [...ADULT_TEETH.upper, ...ADULT_TEETH.lower]) {
                  const dentalToothData = dentalChartData?.teeth[tooth]

                  // Check all possible ways a tooth can be marked as disabled/extracted
                  const isDisabled = dentalToothData?.isDisabled ||
                    (dentalToothData?.surfaces ?
                      Object.values(dentalToothData.surfaces).some(surface =>
                        surface === 'disabled' || surface === 'extraction'
                      ) : false) ||
                    (dentalToothData?.procedures?.some(proc =>
                      proc.type === 'disabled' || proc.type === 'extraction'
                    ) ?? false)

                  // Check all possible ways a tooth can be marked as an implant
                  const isImplant = dentalToothData?.wholeTooth === 'implant' ||
                    (dentalToothData?.surfaces ?
                      Object.values(dentalToothData.surfaces).some(surface =>
                        surface === 'implant'
                      ) : false) ||
                    (dentalToothData?.procedures?.some(proc =>
                      proc.type === 'implant'
                    ) ?? false)

                  resetData[tooth] = createDefaultTooth(isDisabled, isImplant)
                }

                setChartData(resetData)
                if (onAutoSave) {
                  onAutoSave({
                    date: new Date().toISOString(),
                    teeth: resetData,
                    isExplicitlySaved: false
                  })
                }
                setIsResetDialogOpen(false)
              }}
            >
              Reset Chart
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
