import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'

export interface PrintOptions {
  includePatientInfo: boolean
  includeDentalChart: boolean
  includePeriodontalChart: boolean
  includeHistoryTreatments: boolean
  includeCurrentTreatments: boolean
  includePlanTreatments: boolean
  includeXrayImages: boolean
}

interface PrintOptionsModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  options: PrintOptions
  setOptions: (opts: PrintOptions) => void
  onPrint: () => void
  /** Whether the patient has a saved periodontal chart. If false, the corresponding option will be hidden */
  hasPeriodontalChart?: boolean
}

export const PrintOptionsModal: React.FC<PrintOptionsModalProps> = ({ isOpen, onOpenChange, options, setOptions, onPrint, hasPeriodontalChart = true }) => {
  const handleToggle = (key: keyof PrintOptions, value: boolean) => {
    setOptions({ ...options, [key]: value })
  }

  // Human-readable labels by key
  const labels: Record<keyof PrintOptions, string> = {
    includePatientInfo: 'Patient information',
    includeDentalChart: 'Dental chart',
    includePeriodontalChart: 'Periodontal chart',
    includeHistoryTreatments: 'Treatment history tab',
    includeCurrentTreatments: 'Current treatment tab',
    includePlanTreatments: 'Plan treatment tab',
    includeXrayImages: 'X-rays / Images',
  }

  // Filter out the periodontal chart option if the patient has none saved
  const optionKeys = (Object.keys(options) as (keyof PrintOptions)[]).filter((k) =>
    hasPeriodontalChart || k !== 'includePeriodontalChart'
  )

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Print patient card</DialogTitle>
          <DialogDescription>Select the sections you want to include</DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-2">
          {optionKeys.map((key) => (
            <div key={key} className="flex items-center gap-2">
              <Checkbox id={key} checked={options[key]} onCheckedChange={(v) => handleToggle(key, v as boolean)} />
              <label htmlFor={key} className="text-sm select-none cursor-pointer">
                {labels[key]}
              </label>
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onPrint}>Print</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 