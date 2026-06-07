import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'

export interface PrintOptions {
  includePatientInfo: boolean
  includeHistoryTreatments: boolean
  includeCurrentTreatments: boolean
  includePlanTreatments: boolean
  includeBeforeAfterImages: boolean
}

interface PrintOptionsModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  options: PrintOptions
  setOptions: (opts: PrintOptions) => void
  onPrint: () => void
}

const labels: Record<keyof PrintOptions, string> = {
  includePatientInfo: 'Informații pacient',
  includeHistoryTreatments: 'Istoric tratamente',
  includeCurrentTreatments: 'Tratamente curente',
  includePlanTreatments: 'Plan de tratament',
  includeBeforeAfterImages: 'Fotografii înainte și după',
}

export const PrintOptionsModal: React.FC<PrintOptionsModalProps> = ({
  isOpen,
  onOpenChange,
  options,
  setOptions,
  onPrint,
}) => {
  const handleToggle = (key: keyof PrintOptions, value: boolean) => {
    setOptions({ ...options, [key]: value })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tipărește fișa pacientului</DialogTitle>
          <DialogDescription>Selectați secțiunile pe care doriți să le includeți</DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-2">
          {(Object.keys(options) as (keyof PrintOptions)[]).map((key) => (
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
            Anulare
          </Button>
          <Button onClick={onPrint}>Tipărește</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
