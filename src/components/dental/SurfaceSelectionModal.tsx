import React, { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Tooth } from './Tooth'

interface SurfaceSelectionModalProps {
  isOpen: boolean
  onClose: () => void
  onComplete: (data: {
    surfaces: string[]
    anesthesia: boolean
    carpules: number
    c022: boolean
  }) => void
  toothNumber: number
  currentIndex: number
  totalTeeth: number
  codeDescription: string
}

export function SurfaceSelectionModal({
  isOpen,
  onClose,
  onComplete,
  toothNumber,
  currentIndex,
  totalTeeth,
  codeDescription
}: SurfaceSelectionModalProps) {
  const [selectedSurfaces, setSelectedSurfaces] = useState<string[]>([])
  const [anesthesia, setAnesthesia] = useState(false)
  const [carpules, setCarpules] = useState(1)
  const [c022, setC022] = useState(false)
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);

  // Check if it's a primary tooth
  const isPrimary = toothNumber >= 51 && toothNumber <= 85

  // Mock tooth status for the zoomed tooth
  const toothStatus = {
    surfaces: selectedSurfaces.reduce((acc, surface) => ({
      ...acc,
      [surface]: 'filling'
    }), {}),
    isDisabled: false,
    wholeTooth: null
  }

  const handleSurfaceClick = (toothId: number, surface: string) => {
    setSelectedSurfaces(prev => {
      if (prev.includes(surface)) {
        // Remove surface if already selected
        return prev.filter(s => s !== surface)
      } else {
        // Add surface if not selected
        return [...prev, surface]
      }
    })
  }

  const handleSubmit = () => {
    if (selectedSurfaces.length === 0) {
      // You could show an error message here
      return
    }

    onComplete({
      surfaces: selectedSurfaces,
      anesthesia,
      carpules,
      c022
    })

    // Reset form
    setSelectedSurfaces([])
    setAnesthesia(false)
    setCarpules(1)
    setC022(false)
  }

  const handleClose = () => {
    setSelectedSurfaces([])
    setAnesthesia(false)
    setCarpules(1)
    setC022(false)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            Configure Tooth {toothNumber}
            {totalTeeth > 1 && ` (${currentIndex + 1} of ${totalTeeth})`}
          </DialogTitle>
          <DialogDescription>
            Click on tooth surfaces to select them for "{codeDescription}". The final V-code will be determined by the number of surfaces selected.
          </DialogDescription>
        </DialogHeader>

        <div className="py-6 space-y-6">
          {/* Zoomed Tooth Component */}
          <div className="flex flex-col items-center space-y-4 relative">
            <div className="text-sm font-medium text-gray-700">
              Select surfaces by clicking on them:
            </div>

            {/* Container for the zoomed tooth - make it larger */}
            <div className="transform scale-150 origin-center relative">
              <Tooth
                id={toothNumber}
                status={toothStatus}
                onClick={handleSurfaceClick}
                onRightClick={() => { }} // No right click in this context
                isPrimary={isPrimary}
                isDragging={false}
                activeTool="filling" // Always use filling tool for surface selection
                hoveredZone={hoveredZone}
                setHoveredZone={setHoveredZone}
              />
              {/* Tooltip overlay for zone name */}
              {hoveredZone && (
                <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-full bg-white text-xs px-2 py-1 rounded shadow border z-20">
                  {hoveredZone.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                </div>
              )}
            </div>

            {/* Selected surfaces indicator */}
            {selectedSurfaces.length > 0 && (
              <div className="flex flex-wrap gap-2 justify-center">
                <span className="text-sm text-gray-600">Selected surfaces:</span>
                {selectedSurfaces.map(surface => (
                  <span
                    key={surface}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"
                  >
                    {surface}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Additional Options */}
          <div className="space-y-4 border-t pt-4">
            <h4 className="font-medium text-gray-900">Additional Options</h4>

            {/* Anesthesia */}
            <div className="flex items-center space-x-3">
              <Checkbox
                id="anesthesia"
                checked={anesthesia}
                onCheckedChange={(checked) => setAnesthesia(checked as boolean)}
              />
              <Label htmlFor="anesthesia" className="flex-1">
                Local anesthesia required
              </Label>
              {anesthesia && (
                <div className="flex items-center space-x-2">
                  <Label htmlFor="carpules" className="text-sm">
                    Carpules:
                  </Label>
                  <Input
                    id="carpules"
                    type="number"
                    min="1"
                    max="5"
                    value={carpules}
                    onChange={(e) => setCarpules(parseInt(e.target.value) || 1)}
                    className="w-16 h-8"
                  />
                </div>
              )}
            </div>

            {/* C022 */}
            <div className="flex items-center space-x-3">
              <Checkbox
                id="c022"
                checked={c022}
                onCheckedChange={(checked) => setC022(checked as boolean)}
              />
              <Label htmlFor="c022" className="flex-1">
                Add C022 procedure
              </Label>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={selectedSurfaces.length === 0}
          >
            {(() => {
              const maxSurfaces = Math.min(selectedSurfaces.length, 4)
              const materialCode = codeDescription.toLowerCase().includes('composite') ? '9' : codeDescription.toLowerCase().includes('glass') ? '8' : '7'
              const surfaceText = `${selectedSurfaces.length} surface${selectedSurfaces.length !== 1 ? 's' : ''}`
              const codeText = `V${materialCode}${maxSurfaces}`

              return totalTeeth > 1 && currentIndex < totalTeeth - 1
                ? `Next Tooth (${surfaceText} = ${codeText})`
                : `Save All (${surfaceText} = ${codeText})`
            })()}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 