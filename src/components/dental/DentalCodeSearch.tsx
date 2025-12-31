import React, { useState, useEffect, useRef } from 'react'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ConfirmationModal } from '@/components/ui/confirmation-modal'
import { ToothSelectionModal } from './ToothSelectionModal'
import { SurfaceSelectionModal } from './SurfaceSelectionModal'
import { getSubsurfacesForMainSurface } from './DentalChart';
import FluorideModal, { FluorideFlavor } from './FluorideModal';
import FluorideFlavorSettingsModal from './FluorideFlavorSettingsModal';

interface DentalCode {
  id: string
  code: string
  description: string
  points: number | null
  rate: number | null
  category: string
  requirements?: {
    requiresTooth?: boolean
    [key: string]: any
  }
}

interface DentalCodeSearchProps {
  onSelect: (code: DentalCode) => void
  className?: string
  patientId?: string // Add patientId for direct procedure creation
  currentStatus?: string // Current treatment tab status (PENDING, IN_PROGRESS, COMPLETED)
  onProcedureCreated?: (procedure?: any) => void // Callback to refresh data after procedure creation
  organizationId: string // Add organizationId prop
}

// Surface mapping for dental notation to proper dental surface names
const SURFACE_MAPPING = {
  'o': 'occlusal',  // occlusal surface (center)
  'd': 'distal',    // distal surface
  'm': 'mesial',    // mesial surface  
  'b': 'buccal',    // buccal surface
  'l': 'lingual',   // lingual surface (will be adjusted for upper teeth)
  'f': 'buccal',    // facial = buccal
  'p': 'lingual',   // palatal (will be adjusted for upper teeth)
  'i': 'occlusal',  // incisal -> occlusal for front teeth
  'c': 'occlusal'   // cervical -> occlusal
}

// Function to get correct surface name based on tooth quadrant
const getCorrectSurfaceName = (surface: string, toothNumber: number): string => {
  if (surface === 'lingual') {
    // Upper teeth (quadrants 1 & 2): use 'palatal' 
    // Lower teeth (quadrants 3 & 4): use 'lingual'
    const quadrant = Math.floor(toothNumber / 10)
    if (quadrant === 1 || quadrant === 2) {
      return 'palatal'
    }
  }
  return surface
}

// No visual mapping needed - use actual dental surface names
// The Tooth component will handle mapping to visual segments

// V-code mapping by surface count and material type
const FILLING_CODES = {
  1: {
    amalgam: 'V71',
    glasionomeer: 'V81',
    composite: 'V91'
  },
  2: {
    amalgam: 'V72',
    glasionomeer: 'V82',
    composite: 'V92'
  },
  3: {
    amalgam: 'V73',
    glasionomeer: 'V83',
    composite: 'V93'
  },
  4: {
    amalgam: 'V74',
    glasionomeer: 'V84',
    composite: 'V94'
  }
}

export function DentalCodeSearch({ onSelect, className, patientId, currentStatus = 'PENDING', onProcedureCreated, organizationId }: DentalCodeSearchProps) {
  const [query, setQuery] = useState('')
  const [codes, setCodes] = useState<DentalCode[]>([])
  const [open, setOpen] = useState(false)
  const [anesthesiaModal, setAnesthesiaModal] = useState(false)
  const [pendingFillingData, setPendingFillingData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // New state for direct code entry workflow
  const [showToothSelection, setShowToothSelection] = useState(false)
  const [showSurfaceSelection, setShowSurfaceSelection] = useState(false)
  const [selectedCode, setSelectedCode] = useState<DentalCode | null>(null)
  const [selectedTeeth, setSelectedTeeth] = useState<number[]>([])
  const [currentToothIndex, setCurrentToothIndex] = useState(0)
  const [materialType, setMaterialType] = useState<'composite' | 'glasionomeer' | 'amalgam'>('composite') // Track material type
  const [allToothData, setAllToothData] = useState<Array<{
    tooth: number
    surfaces: string[]
    anesthesia: boolean
    carpules: number
    c022: boolean
  }>>([])

  // New: Material selection modal for single filling notation
  const [showMaterialModal, setShowMaterialModal] = useState(false)
  const [pendingMaterialData, setPendingMaterialData] = useState<any>(null)
  const [showC022Modal, setShowC022Modal] = useState(false)
  const [pendingC022Data, setPendingC022Data] = useState<any>(null)

  // Remove old multi-step modal state
  const [showFillingOptionsModal, setShowFillingOptionsModal] = useState(false)
  const [pendingFillingOptions, setPendingFillingOptions] = useState<any>(null)
  const [fillingOptions, setFillingOptions] = useState({
    material: 'composite' as 'composite' | 'glasionomeer' | 'amalgam',
    anesthesia: false,
    c022: false,
  })

  const historyMode = currentStatus === 'COMPLETED'

  // Parse filling notation like "17dob" -> tooth 17, surfaces d,o,b
  const parseFillingNotation = (input: string) => {
    const match = input.match(/^(\d{1,2})([dobmlipfc]+)$/i)
    if (!match) return null

    const [, toothNumber, surfaceString] = match
    const tooth = parseInt(toothNumber)

    // Validate tooth number (FDI notation)
    const validTeeth = [
      ...Array.from({ length: 8 }, (_, i) => 11 + i), // 11-18
      ...Array.from({ length: 8 }, (_, i) => 21 + i), // 21-28  
      ...Array.from({ length: 8 }, (_, i) => 31 + i), // 31-38
      ...Array.from({ length: 8 }, (_, i) => 41 + i), // 41-48
      ...Array.from({ length: 5 }, (_, i) => 51 + i), // 51-55
      ...Array.from({ length: 5 }, (_, i) => 61 + i), // 61-65
      ...Array.from({ length: 5 }, (_, i) => 71 + i), // 71-75
      ...Array.from({ length: 5 }, (_, i) => 81 + i), // 81-85
    ]

    if (!validTeeth.includes(tooth)) return null

    // Parse surfaces and correct them based on tooth quadrant
    const rawSurfaces = [...surfaceString.toLowerCase()].map(s => SURFACE_MAPPING[s]).filter(Boolean)
    if (rawSurfaces.length === 0) return null

    const surfaces = rawSurfaces.map(surface => getCorrectSurfaceName(surface, tooth))

    return {
      tooth,
      surfaces,
      surfaceCount: surfaces.length
    }
  }

  // Check if input is a material type pattern (v9, v8, v7, v91, v92, v93, v94, v81, v82, v83, v84, v71, v72, v73, v74)
  const checkMaterialTypePattern = (input: string) => {
    const materialPattern = /^v([987])([1-4])?$/i
    const match = input.match(materialPattern)

    if (match) {
      const materialCode = match[1]
      switch (materialCode) {
        case '9': return 'composite'
        case '8': return 'glasionomeer'
        case '7': return 'amalgam'
        default: return null
      }
    }

    return null
  }

  // Check if input is a tooth-specific material type pattern (18v9, 34v7, 26v92, etc.)
  const checkToothSpecificPattern = (input: string) => {
    const toothMaterialPattern = /^(\d{1,2})v([987])([1-4])?$/i
    const match = input.match(toothMaterialPattern)

    if (!match) return null

    const [, toothNumber, materialCode] = match
    const tooth = parseInt(toothNumber)

    // Validate tooth number (FDI notation)
    const validTeeth = [
      ...Array.from({ length: 8 }, (_, i) => 11 + i), // 11-18
      ...Array.from({ length: 8 }, (_, i) => 21 + i), // 21-28  
      ...Array.from({ length: 8 }, (_, i) => 31 + i), // 31-38
      ...Array.from({ length: 8 }, (_, i) => 41 + i), // 41-48
      ...Array.from({ length: 5 }, (_, i) => 51 + i), // 51-55
      ...Array.from({ length: 5 }, (_, i) => 61 + i), // 61-65
      ...Array.from({ length: 5 }, (_, i) => 71 + i), // 71-75
      ...Array.from({ length: 5 }, (_, i) => 81 + i), // 81-85
    ]

    if (!validTeeth.includes(tooth)) return null

    let materialType: 'composite' | 'glasionomeer' | 'amalgam'
    switch (materialCode) {
      case '9': materialType = 'composite'; break
      case '8': materialType = 'glasionomeer'; break
      case '7': materialType = 'amalgam'; break
      default: return null
    }

    return {
      tooth,
      materialType
    }
  }

  // Check if input is a direct code entry (like "v93")
  const checkDirectCodeEntry = async (input: string) => {
    const codePattern = /^[a-zA-Z]\d+$/i // Pattern like V93, C022, etc.
    if (!codePattern.test(input)) return null

    try {
      const response = await fetch(`/api/dental-codes?search=${input.toUpperCase()}`)
      const data = await response.json()
      const exactMatch = data.find((code: DentalCode) => code.code.toLowerCase() === input.toLowerCase())

      if (exactMatch && exactMatch.requirements?.requiresTooth) {
        return exactMatch
      }
    } catch (error) {
      console.error('Error checking direct code entry:', error)
    }

    return null
  }

  // Search for dental codes
  const searchCodes = async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setCodes([])
      return
    }

    try {
      const response = await fetch(`/api/dental-codes?search=${searchTerm}`)
      const data = await response.json()
      setCodes(data)
    } catch (error) {
      console.error('Error searching codes:', error)
      setCodes([])
    }
  }

  // Get anesthesia code
  const getAnesthesiaCode = async () => {
    try {
      const response = await fetch('/api/dental-codes?search=A10')
      const data = await response.json()
      return data.find((code: DentalCode) => code.code === 'A10')
    } catch {
      return null
    }
  }

  // Get C022 code
  const getC022Code = async () => {
    try {
      const response = await fetch('/api/dental-codes?search=C022')
      const data = await response.json()
      return data.find((code: DentalCode) => code.code === 'C022')
    } catch {
      return null
    }
  }

  // Create dental procedure
  const createDentalProcedure = async (patientId: string, codeId: string, toothNumber: number, notes: string, status: string = 'PENDING', subSurfaces?: string[], fillingMaterial?: string) => {
    const response = await fetch(`/api/patients/${patientId}/dental-procedures`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        codeId,
        toothNumber,
        notes,
        status,
        date: new Date().toISOString().split('T')[0],
        subSurfaces: subSurfaces || [],
        fillingMaterial: fillingMaterial || 'composite',
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create dental procedure');
    }

    const result = await response.json();
    return result.procedure; // Return the procedure data for undo stack
  }

  // Update dental chart - FIXED to properly update visual data
  const updateDentalChart = async (toothNumber: number, surfaces: string[], procedureType: string) => {
    if (!patientId) return

    try {
      // Get current dental data
      const dentalResponse = await fetch(`/api/patients/${patientId}/dental`)
      if (!dentalResponse.ok) throw new Error('Failed to fetch dental data')

      const dentalData = await dentalResponse.json()
      const currentChart = dentalData.dentalChart || { teeth: {}, toothTypes: {} }

      // Update dental chart for the tooth using actual dental surface names
      const updatedChart = {
        ...currentChart,
        teeth: {
          ...currentChart.teeth,
          [toothNumber]: {
            ...currentChart.teeth?.[toothNumber],
            surfaces: {
              ...currentChart.teeth?.[toothNumber]?.surfaces,
              ...surfaces.reduce((acc, surface) => ({ ...acc, [surface]: procedureType }), {})
            },
            // Remove procedures array - we don't want duplicate entries
            // The actual procedure records are stored in the database via createDentalProcedure
          }
        }
      }

      // Update dental chart via the dental API
      await fetch(`/api/patients/${patientId}/dental`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dentalChart: updatedChart
        })
      })

    } catch (error) {
      console.error('Error updating dental chart:', error)
    }
  }

  // Get appropriate V-code based on surface count and material type
  const getFillingCode = async (surfaceCount: number, material: string = 'composite') => {
    const maxSurfaces = Math.min(surfaceCount, 4)
    const codeKey = FILLING_CODES[maxSurfaces]?.[material] || FILLING_CODES[maxSurfaces]?.composite

    if (!codeKey) return null

    try {
      const response = await fetch(`/api/dental-codes?search=${codeKey}`)
      const data = await response.json()
      return data.find((code: DentalCode) => code.code === codeKey)
    } catch {
      return null
    }
  }

  const getFillingNote = (tooth: number, surfaces: string[]) => {
    const surfaceMap: Record<string, string> = {
      occlusal: 'o',
      distal: 'd',
      mesial: 'm',
      buccal: 'b',
      palatal: 'l',
      lingual: 'l',
    };
    const codes = surfaces.map(s => surfaceMap[s] || s[0]).join('');
    return `${tooth}${codes}`;
  };

  // Handle input changes and special parsing
  const handleInputChange = (value: string) => {
    setQuery(value)
    setOpen(true)

    if (value.length > 1) {
      // Check for filling notation first
      const fillingMatch = parseFillingNotation(value)
      if (fillingMatch) {
        // Handle filling notation as before
        return
      }

      // Check for tooth-specific material type pattern (18v9, 34v7, 26v92, etc.)
      const toothSpecificMatch = checkToothSpecificPattern(value)
      if (toothSpecificMatch) {
        // Don't show normal search results for tooth-specific patterns
        setCodes([])
        setOpen(false)
        return
      }

      // Check for material type pattern (v9, v8, v7, v91, v92, v93, etc.)
      const materialTypeMatch = checkMaterialTypePattern(value)
      if (materialTypeMatch) {
        // Don't show normal search results for material type patterns
        setCodes([])
        setOpen(false)
        return
      }

      // Normal search behavior
      searchCodes(value)
    } else {
      searchCodes(value)
    }
  }

  // Handle key press events
  const handleKeyPress = async (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && query.trim()) {
      e.preventDefault()

      // Check for filling notation first
      const fillingMatch = parseFillingNotation(query)
      if (fillingMatch) {
        if (historyMode && patientId) {
          // Directly add completed filling without any modals
          try {
            const fillingCode = await getFillingCode(fillingMatch.surfaceCount)
            if (fillingCode) {
              // Notes as [toothnumber][mainsurfaces]
              const surfaceMap: Record<string, string> = {
                occlusal: 'o',
                distal: 'd',
                mesial: 'm',
                buccal: 'b',
                palatal: 'l',
                lingual: 'l',
              };
              const codes = fillingMatch.surfaces.map(s => surfaceMap[s] || s[0]).join('');
              const notes = `${fillingMatch.tooth}${codes}`;
              await createDentalProcedure(patientId!, fillingCode.id, fillingMatch.tooth, notes, currentStatus, fillingMatch.surfaces, 'composite')
              // Update chart with completed color - default to composite for history entries
              const chartProcedureType = `filling-history-composite`;
              await updateDentalChart(fillingMatch.tooth, fillingMatch.surfaces, chartProcedureType)
              toast.success('Historic filling added')
              onProcedureCreated && onProcedureCreated()
            } else {
              toast.error('Could not find appropriate filling code')
            }
          } catch {
            toast.error('Failed to add historic filling')
          }
        } else if (patientId) {
          setPendingFillingOptions(fillingMatch)
          setShowFillingOptionsModal(true)
          setFillingOptions({ material: 'composite', anesthesia: false, c022: false })
        } else {
          toast(`Detected filling: Tooth ${fillingMatch.tooth}, ${fillingMatch.surfaceCount} surfaces (${fillingMatch.surfaces.join(', ')})`)
        }
        return
      }

      // Check for tooth-specific material type pattern (18v9, 34v7, 26v92, etc.)
      const toothSpecificMatch = checkToothSpecificPattern(query)
      if (toothSpecificMatch) {
        setMaterialType(toothSpecificMatch.materialType)
        setSelectedCode({
          id: '',
          code: query.toUpperCase(),
          description: `${toothSpecificMatch.materialType.charAt(0).toUpperCase() + toothSpecificMatch.materialType.slice(1)} filling`,
          points: null,
          rate: null,
          category: 'Fillings',
          requirements: { requiresTooth: true }
        })
        // Auto-select the tooth and skip tooth selection modal
        setSelectedTeeth([toothSpecificMatch.tooth])
        setCurrentToothIndex(0)
        setAllToothData([])
        setShowSurfaceSelection(true)
        setQuery('')
        setOpen(false)
        return
      }

      // Check for material type pattern (v9, v8, v7, v91, v92, v93, etc.)
      const materialTypeMatch = checkMaterialTypePattern(query)
      if (materialTypeMatch) {
        setMaterialType(materialTypeMatch)
        setSelectedCode({
          id: '',
          code: query.toUpperCase(),
          description: `${materialTypeMatch.charAt(0).toUpperCase() + materialTypeMatch.slice(1)} filling`,
          points: null,
          rate: null,
          category: 'Fillings',
          requirements: { requiresTooth: true }
        })
        setShowToothSelection(true)
        setQuery('')
        setOpen(false)
        return
      }

      // Check for direct code entry
      const codeMatch = await checkDirectCodeEntry(query)
      if (codeMatch) {
        setSelectedCode(codeMatch)
        setShowToothSelection(true)
        setQuery('')
        setOpen(false)
        return
      }

      // Handle exact code matches from search results
      if (codes.length > 0) {
        const exactMatch = codes.find(code => code.code.toLowerCase() === query.toLowerCase())
        if (exactMatch) {
          onSelect(exactMatch)
          setQuery('')
          setOpen(false)
        }
      }
    }
  }

  // Handle tooth selection completion
  const handleToothSelectionComplete = (teeth: number[]) => {
    setSelectedTeeth(teeth)
    setCurrentToothIndex(0)
    setAllToothData([])
    setShowToothSelection(false)
    setShowSurfaceSelection(true)
  }

  // Handle surface selection for current tooth
  const handleSurfaceSelectionComplete = (data: {
    surfaces: string[]
    anesthesia: boolean
    carpules: number
    c022: boolean
  }) => {
    const newToothData = {
      tooth: selectedTeeth[currentToothIndex],
      ...data
    }

    const updatedAllToothData = [...allToothData, newToothData]
    setAllToothData(updatedAllToothData)

    // Check if we have more teeth to process
    if (currentToothIndex < selectedTeeth.length - 1) {
      setCurrentToothIndex(currentToothIndex + 1)
      // Surface selection modal will show the next tooth
    } else {
      // All teeth processed, save all procedures
      setShowSurfaceSelection(false)
      saveAllProcedures(updatedAllToothData)
    }
  }

  // Save all procedures from the workflow
  const saveAllProcedures = async (toothDataArray: typeof allToothData) => {
    if (!patientId || !selectedCode) return

    setLoading(true)
    try {
      for (const toothData of toothDataArray) {

        // Create V-code procedure based on surface count and material type
        const surfaceCount = toothData.surfaces.length
        const fillingCode = await getFillingCode(surfaceCount, materialType)

        if (fillingCode) {
          const materialTypeDisplay = materialType === 'glasionomeer' ? 'glass ionomer' : materialType
          const fillingNotes = getFillingNote(toothData.tooth, toothData.surfaces);
          const createdProcedure = await createDentalProcedure(patientId!, fillingCode.id, toothData.tooth, fillingNotes, currentStatus, toothData.surfaces, materialType)

          // Pass the created procedure to the callback for undo stack population
          if (onProcedureCreated) {
            onProcedureCreated(createdProcedure);
          }

          // Determine chart procedure type based on current status for coloring in chart
          const creationStatus = currentStatus === 'IN_PROGRESS' ? 'current'
            : currentStatus === 'COMPLETED' ? 'history'
              : 'pending';
          const chartProcedureType = `filling-${creationStatus}-${materialType}`;
          await updateDentalChart(toothData.tooth, toothData.surfaces, chartProcedureType)
        }

        // Add anesthesia if selected
        if (toothData.anesthesia) {
          const anesthesiaCode = await getAnesthesiaCode()

          if (anesthesiaCode) {
            const anesthesiaNotes = `Local anesthesia for tooth ${toothData.tooth} (${toothData.carpules} carpules)`
            try {
              const anesthesiaProcedure = await createDentalProcedure(patientId!, anesthesiaCode.id, toothData.tooth, anesthesiaNotes, currentStatus)
              if (onProcedureCreated) {
                onProcedureCreated(anesthesiaProcedure);
              }
            } catch (error) {
              console.error('Error creating anesthesia procedure:', error)
            }
          }
        }

        // Add C022 if selected
        if (toothData.c022) {
          const c022Code = await getC022Code()

          if (c022Code) {
            const c022Notes = `C022 procedure for tooth ${toothData.tooth}`
            try {
              const c022Procedure = await createDentalProcedure(patientId!, c022Code.id, toothData.tooth, c022Notes, currentStatus)
              if (onProcedureCreated) {
                onProcedureCreated(c022Procedure);
              }
            } catch (error) {
              console.error('Error creating C022 procedure:', error)
            }
          }
        }
      }

      const totalTeeth = toothDataArray.length
      toast(`Successfully added procedures for ${totalTeeth} tooth${totalTeeth > 1 ? 'es' : ''}`)

      // Reset state
      resetWorkflowState()

      // Refresh data if callback provided
      if (onProcedureCreated) {
        onProcedureCreated()
      }

    } catch (error) {
      console.error('Error in saveAllProcedures:', error)
      toast.error('Failed to create procedures')
    } finally {
      setLoading(false)
    }
  }

  // Reset workflow state
  const resetWorkflowState = () => {
    setSelectedCode(null)
    setSelectedTeeth([])
    setCurrentToothIndex(0)
    setMaterialType('composite')
    setAllToothData([])
    setShowToothSelection(false)
    setShowSurfaceSelection(false)
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const listener = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', listener)
    return () => document.removeEventListener('mousedown', listener)
  }, [])

  // Handle filling procedure creation (for existing filling notation workflow)
  // This function is now replaced by handleFillingOptionsConfirm
  // const handleFillingProcedure = async (fillingData: any, withAnesthesia: boolean, selectedMaterial?: 'composite' | 'glasionomeer' | 'amalgam', withC022?: boolean) => {
  //   setLoading(true)
  //   try {
  //     const { tooth, surfaces, surfaceCount } = fillingData
  //     const material = selectedMaterial || 'composite'
  //     // Create filling procedure
  //     const fillingCode = await getFillingCode(surfaceCount, material)
  //     if (!fillingCode) {
  //       toast.error('Could not find appropriate filling code')
  //       return
  //     }
  //     // Notes as [toothnumber][mainsurfaces] (e.g., 38mod)
  //     const surfaceMap: Record<string, string> = {
  //       occlusal: 'o',
  //       distal: 'd',
  //       mesial: 'm',
  //       buccal: 'b',
  //       palatal: 'l',
  //       lingual: 'l',
  //     };
  //     const codes = surfaces.map(s => surfaceMap[s] || s[0]).join('');
  //     const fillingNotes = `${tooth}${codes}`;
  //     await createDentalProcedure(patientId!, fillingCode.id, tooth, fillingNotes, currentStatus, surfaces, material)
  //     // Create anesthesia procedure if requested
  //     if (withAnesthesia) {
  //       const anesthesiaCode = await getAnesthesiaCode()
  //       if (anesthesiaCode) {
  //         const anesthesiaNotes = `Local anesthesia for tooth ${tooth}`
  //         await createDentalProcedure(patientId!, anesthesiaCode.id, tooth, anesthesiaNotes, currentStatus)
  //       }
  //     }
  //     // Add C022 if selected
  //     if (withC022) {
  //       const c022Code = await getC022Code()
  //       if (c022Code) {
  //         const c022Notes = `C022 procedure for tooth ${tooth}`
  //         await createDentalProcedure(patientId!, c022Code.id, tooth, c022Notes, currentStatus)
  //       }
  //     }
  //     // Update dental chart with status-specific filling type for correct color rendering
  //     const creationStatus = currentStatus === 'IN_PROGRESS' ? 'current'
  //       : currentStatus === 'COMPLETED' ? 'history'
  //         : 'pending';
  //     const chartProcedureType = `filling-${creationStatus}-${material}`;
  //     await updateDentalChart(tooth, surfaces, chartProcedureType)
  //     toast(`Filling recorded: Tooth ${tooth} (${surfaces.join(', ')}) - ${fillingCode.code}${withAnesthesia ? ' with anesthesia' : ''}${withC022 ? ' + C022' : ''}`)
  //     // Clear query
  //     setQuery('')
  //     setOpen(false)
  //     // Refresh data if callback provided
  //     if (onProcedureCreated) {
  //       onProcedureCreated()
  //     }
  //   } catch (error) {
  //     toast.error('Failed to create procedure')
  //   } finally {
  //     setLoading(false)
  //     setPendingFillingData(null)
  //     setAnesthesiaModal(false)
  //     setShowMaterialModal(false)
  //     setShowC022Modal(false)
  //   }
  // }

  // Remove old handleAnesthesiaConfirm, handleMaterialSelect, handleC022Confirm, etc.

  // New: handle filling options modal confirm
  const handleFillingOptionsConfirm = async () => {
    if (!pendingFillingOptions) return
    setLoading(true)
    try {
      const { tooth, surfaces, surfaceCount } = pendingFillingOptions
      const { material, anesthesia, c022 } = fillingOptions
      const fillingCode = await getFillingCode(surfaceCount, material)
      if (!fillingCode) {
        toast.error('Could not find appropriate filling code')
        return
      }
      // Notes as [toothnumber][mainsurfaces]
      const surfaceMap: Record<string, string> = {
        occlusal: 'o',
        distal: 'd',
        mesial: 'm',
        buccal: 'b',
        palatal: 'l',
        lingual: 'l',
      };
      const codes = surfaces.map(s => surfaceMap[s] || s[0]).join('');
      const fillingNotes = `${tooth}${codes}`;
      // Get all subsurfaces for each main surface
      let allSubsurfaces: string[] = [];
      for (const mainSurface of surfaces) {
        allSubsurfaces.push(...getSubsurfacesForMainSurface(mainSurface, tooth));
      }
      const uniqueSubsurfaces = [...new Set(allSubsurfaces)];
      const createdProcedure = await createDentalProcedure(patientId!, fillingCode.id, tooth, fillingNotes, currentStatus, uniqueSubsurfaces, material)
      if (onProcedureCreated) {
        onProcedureCreated(createdProcedure);
      }
      if (anesthesia) {
        const anesthesiaCode = await getAnesthesiaCode()
        if (anesthesiaCode) {
          const anesthesiaNotes = `Local anesthesia for tooth ${tooth}`
          const anesthesiaProcedure = await createDentalProcedure(patientId!, anesthesiaCode.id, tooth, anesthesiaNotes, currentStatus)
          if (onProcedureCreated) {
            onProcedureCreated(anesthesiaProcedure);
          }
        }
      }
      if (c022) {
        const c022Code = await getC022Code()
        if (c022Code) {
          const c022Notes = `C022 procedure for tooth ${tooth}`
          const c022Procedure = await createDentalProcedure(patientId!, c022Code.id, tooth, c022Notes, currentStatus)
          if (onProcedureCreated) {
            onProcedureCreated(c022Procedure);
          }
        }
      }
      const creationStatus = currentStatus === 'IN_PROGRESS' ? 'current'
        : currentStatus === 'COMPLETED' ? 'history'
          : 'pending';
      const chartProcedureType = `filling-${creationStatus}-${material}`;
      await updateDentalChart(tooth, uniqueSubsurfaces, chartProcedureType)
      toast(`Filling recorded: Tooth ${tooth} (${surfaces.join(', ')}) - ${fillingCode.code}${anesthesia ? ' with anesthesia' : ''}${c022 ? ' + C022' : ''}`)
      setQuery('')
      setOpen(false)
      if (onProcedureCreated) {
        onProcedureCreated()
      }
    } catch (error) {
      toast.error('Failed to create procedure')
    } finally {
      setLoading(false)
      setPendingFillingOptions(null)
      setShowFillingOptionsModal(false)
      setFillingOptions({ material: 'composite', anesthesia: false, c022: false })
    }
  }

  // Handle anesthesia modal confirmation
  // This function is now replaced by handleFillingOptionsConfirm
  // const handleAnesthesiaConfirm = () => {
  //   setShowMaterialModal(true)
  //   setPendingMaterialData(pendingFillingData)
  //   setAnesthesiaModal(false)
  // }

  // Handle anesthesia modal close/cancel
  // This function is now replaced by handleFillingOptionsConfirm
  // const handleAnesthesiaModalClose = (open: boolean) => {
  //   if (!open) {
  //     setShowMaterialModal(true)
  //     setPendingMaterialData(pendingFillingData)
  //     setAnesthesiaModal(false)
  //   }
  // }

  // Handle material selection modal
  // This function is now replaced by handleFillingOptionsConfirm
  // const handleMaterialSelect = (material: 'composite' | 'glasionomeer' | 'amalgam') => {
  //   setMaterialType(material)
  //   setShowMaterialModal(false)
  //   setShowC022Modal(true)
  //   setPendingC022Data({ ...pendingMaterialData, material })
  // }

  // Handle C022 modal
  // This function is now replaced by handleFillingOptionsConfirm
  // const handleC022Confirm = () => {
  //   handleFillingProcedure(pendingC022Data, true, materialType, true)
  // }
  // const handleC022Cancel = () => {
  //   handleFillingProcedure(pendingC022Data, true, materialType, false)
  // }

  const [showFluorideModal, setShowFluorideModal] = useState(false);
  const [showFlavorSettings, setShowFlavorSettings] = useState(false);
  const [fluorideFlavors, setFluorideFlavors] = useState<FluorideFlavor[]>([]);
  const [fluorideLoading, setFluorideLoading] = useState(false);

  const fetchFluorideFlavors = async () => {
    setFluorideLoading(true);
    try {
      const res = await fetch(`/api/fluoride-flavors?organizationId=${organizationId}`);
      const data = await res.json();
      setFluorideFlavors(data);
    } finally {
      setFluorideLoading(false);
    }
  };

  // Trigger modal when M40 is typed
  useEffect(() => {
    if (query.trim().toLowerCase() === 'm40') {
      fetchFluorideFlavors();
      setShowFluorideModal(true);
    }
  }, [query]);

  const handleFluorideQuickButton = () => {
    fetchFluorideFlavors();
    setShowFluorideModal(true);
  };

  const handleFluorideSave = async ({ jaws, flavor }: { jaws: string[]; flavor: FluorideFlavor }) => {
    if (!patientId) return;
    setFluorideLoading(true);
    try {
      for (const jaw of jaws) {
        const notes = `${flavor.name} for ${jaws.length === 2 ? 'upper & lower' : jaw} jaw`;
        // Find M40 code
        const res = await fetch('/api/dental-codes?search=M40');
        const codes = await res.json();
        const m40 = codes.find((c: any) => c.code === 'M40');
        if (m40) {
          await createDentalProcedure(patientId, m40.id, null, notes, currentStatus);
        }
      }
      toast.success('Fluoride added');
      setShowFluorideModal(false);
      onProcedureCreated && onProcedureCreated();
    } catch {
      toast.error('Failed to add fluoride');
    } finally {
      setFluorideLoading(false);
    }
  };

  return (
    <div className={cn("relative", className)} ref={containerRef}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          placeholder="Search dental codes or use notation (e.g., 17dob for surfaces, v9 for composite, v8 for glass ionomer, v7 for amalgam)..."
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyPress}
          className="pl-10"
          disabled={loading}
        />
      </div>

      {/* Regular search results dropdown */}
      {open && codes.length > 0 && (
        <div className="absolute z-50 w-full bg-white border border-gray-200 rounded-md shadow-lg mt-1 max-h-60 overflow-y-auto">
          {codes.map((code) => (
            <div
              key={code.id}
              className="px-4 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
              onClick={() => {
                onSelect(code)
                setQuery('')
                setOpen(false)
              }}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-blue-600">{code.code}</span>
                    <span className="text-sm text-gray-500">{code.category}</span>
                  </div>
                  <p className="text-sm text-gray-700 mt-1">{code.description}</p>
                </div>
                {code.points && (
                  <span className="text-sm text-gray-500 ml-2">{code.points} pts</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Anesthesia confirmation modal for existing filling notation */}
      {/* This modal is now replaced by the single filling options modal */}
      {/* <ConfirmationModal
        open={anesthesiaModal}
        onOpenChange={handleAnesthesiaModalClose}
        onConfirm={handleAnesthesiaConfirm}
        title="Add Anesthesia?"
        description={`Would you like to add local anesthesia for the filling on tooth ${pendingFillingData?.tooth}?`}
        confirmText="Yes, with anesthesia"
        cancelText="No anesthesia"
        variant="default"
        icon="info"
        loading={loading}
      /> */}
      {/* Material selection modal */}
      {/* This modal is now replaced by the single filling options modal */}
      {/* {showMaterialModal && (
        <Dialog open={showMaterialModal} onOpenChange={setShowMaterialModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Select Filling Material</DialogTitle>
              <DialogDescription>
                Which material was used for the filling on tooth {pendingMaterialData?.tooth}?
              </DialogDescription>
            </DialogHeader>
            <div className="flex gap-2 mt-4">
              <Button variant={materialType === 'composite' ? 'default' : 'outline'} onClick={() => handleMaterialSelect('composite')}>Composite</Button>
              <Button variant={materialType === 'glasionomeer' ? 'default' : 'outline'} onClick={() => handleMaterialSelect('glasionomeer')}>Glass Ionomer</Button>
              <Button variant={materialType === 'amalgam' ? 'default' : 'outline'} onClick={() => handleMaterialSelect('amalgam')}>Amalgam</Button>
            </div>
          </DialogContent>
        </Dialog>
      )} */}
      {/* C022 selection modal */}
      {/* This modal is now replaced by the single filling options modal */}
      {/* {showC022Modal && (
        <Dialog open={showC022Modal} onOpenChange={setShowC022Modal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add C022?</DialogTitle>
              <DialogDescription>
                Was a C022 procedure performed for tooth {pendingC022Data?.tooth}?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="default" onClick={handleC022Confirm}>Yes, add C022</Button>
              <Button variant="outline" onClick={handleC022Cancel}>No, just filling</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )} */}

      {/* Tooth Selection Modal */}
      <ToothSelectionModal
        isOpen={showToothSelection}
        onClose={() => setShowToothSelection(false)}
        onComplete={handleToothSelectionComplete}
        codeDescription={selectedCode?.description || ''}
      />

      {/* Surface Selection Modal */}
      <SurfaceSelectionModal
        isOpen={showSurfaceSelection}
        onClose={() => {
          setShowSurfaceSelection(false)
          resetWorkflowState()
        }}
        onComplete={handleSurfaceSelectionComplete}
        toothNumber={selectedTeeth[currentToothIndex] || 0}
        currentIndex={currentToothIndex}
        totalTeeth={selectedTeeth.length}
        codeDescription={selectedCode?.description || ''}
      />

      {/* Single Filling Options Modal */}
      {showFillingOptionsModal && (
        <Dialog open={showFillingOptionsModal} onOpenChange={setShowFillingOptionsModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Filling Details</DialogTitle>
              <DialogDescription>
                Please specify the details for the filling on tooth {pendingFillingOptions?.tooth}:
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-4 mt-2">
              <div>
                <div className="font-medium mb-1">Material</div>
                <div className="flex gap-2">
                  <Button variant={fillingOptions.material === 'composite' ? 'default' : 'outline'} onClick={() => setFillingOptions(o => ({ ...o, material: 'composite' }))}>Composite</Button>
                  <Button variant={fillingOptions.material === 'glasionomeer' ? 'default' : 'outline'} onClick={() => setFillingOptions(o => ({ ...o, material: 'glasionomeer' }))}>Glass Ionomer</Button>
                  <Button variant={fillingOptions.material === 'amalgam' ? 'default' : 'outline'} onClick={() => setFillingOptions(o => ({ ...o, material: 'amalgam' }))}>Amalgam</Button>
                </div>
              </div>
              <div>
                <div className="font-medium mb-1">Anesthesia</div>
                <div className="flex gap-2">
                  <Button variant={fillingOptions.anesthesia ? 'default' : 'outline'} onClick={() => setFillingOptions(o => ({ ...o, anesthesia: true }))}>Yes</Button>
                  <Button variant={!fillingOptions.anesthesia ? 'default' : 'outline'} onClick={() => setFillingOptions(o => ({ ...o, anesthesia: false }))}>No</Button>
                </div>
              </div>
              <div>
                <div className="font-medium mb-1">C022 Procedure</div>
                <div className="flex gap-2">
                  <Button variant={fillingOptions.c022 ? 'default' : 'outline'} onClick={() => setFillingOptions(o => ({ ...o, c022: true }))}>Yes</Button>
                  <Button variant={!fillingOptions.c022 ? 'default' : 'outline'} onClick={() => setFillingOptions(o => ({ ...o, c022: false }))}>No</Button>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleFillingOptionsConfirm}>{loading ? 'Saving...' : 'Save'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Add a quick button for M40 somewhere in the UI, e.g. */}
      {/* <Button size="sm" variant="outline" onClick={handleFluorideQuickButton}>M40</Button> */}

      <FluorideModal
        isOpen={showFluorideModal}
        onClose={() => setShowFluorideModal(false)}
        onSave={handleFluorideSave}
        flavors={fluorideFlavors}
        onOpenSettings={() => setShowFlavorSettings(true)}
      />
      <FluorideFlavorSettingsModal
        isOpen={showFlavorSettings}
        onClose={() => setShowFlavorSettings(false)}
        organizationId={organizationId}
      />
    </div>
  )
} 