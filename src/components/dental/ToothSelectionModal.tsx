import React, { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface ToothSelectionModalProps {
  isOpen: boolean
  onClose: () => void
  onComplete: (teeth: number[]) => void
  codeDescription: string
}

export function ToothSelectionModal({ isOpen, onClose, onComplete, codeDescription }: ToothSelectionModalProps) {
  const [teethInput, setTeethInput] = useState('')
  const [selectedTeeth, setSelectedTeeth] = useState<number[]>([])
  const [error, setError] = useState('')

  // Validate tooth numbers (FDI notation)
  const isValidTooth = (toothNumber: number): boolean => {
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
    return validTeeth.includes(toothNumber)
  }

  const handleInputChange = (value: string) => {
    setTeethInput(value)
    setError('')

    if (value.trim()) {
      const teeth = value.split(',').map(t => parseInt(t.trim())).filter(n => !isNaN(n))
      const validTeeth = teeth.filter(isValidTooth)
      const invalidTeeth = teeth.filter(t => !isValidTooth(t))

      if (invalidTeeth.length > 0) {
        setError(`Invalid tooth numbers: ${invalidTeeth.join(', ')}`)
        setSelectedTeeth([])
      } else {
        setSelectedTeeth(validTeeth)
      }
    } else {
      setSelectedTeeth([])
    }
  }

  const handleSubmit = () => {
    if (selectedTeeth.length === 0) {
      setError('Please enter at least one valid tooth number')
      return
    }

    onComplete(selectedTeeth)
    handleClose()
  }

  const handleClose = () => {
    setTeethInput('')
    setSelectedTeeth([])
    setError('')
    onClose()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Select Teeth</DialogTitle>
          <DialogDescription>
            Which teeth would you like to apply "{codeDescription}" to?
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="teeth-input">
              Tooth Numbers (FDI notation)
            </Label>
            <Input
              id="teeth-input"
              placeholder="Enter tooth numbers separated by commas (e.g., 17, 16, 15)"
              value={teethInput}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              className={error ? 'border-red-500' : ''}
            />
            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}
          </div>

          {selectedTeeth.length > 0 && (
            <div className="space-y-2">
              <Label>Selected Teeth:</Label>
              <div className="flex flex-wrap gap-2">
                {selectedTeeth.map(tooth => (
                  <span
                    key={tooth}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                  >
                    {tooth}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="text-xs text-gray-500">
            <p><strong>FDI Notation:</strong></p>
            <p>• Permanent teeth: 11-18, 21-28, 31-38, 41-48</p>
            <p>• Primary teeth: 51-55, 61-65, 71-75, 81-85</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={selectedTeeth.length === 0}
          >
            Continue ({selectedTeeth.length} tooth{selectedTeeth.length !== 1 ? 'es' : ''})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 