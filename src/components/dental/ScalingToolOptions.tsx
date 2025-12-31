import React, { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

import { createDentalProcedure } from '@/lib/fillings'

interface ScalingToolOptionsProps {
  selectedCode: 'T021' | 'T022'
  setSelectedCode: (code: 'T021' | 'T022') => void
  patientId: string
  currentStatus: string
  onProcedureAdded: () => void
}

export default function ScalingToolOptions({ selectedCode, setSelectedCode, patientId, currentStatus, onProcedureAdded }: ScalingToolOptionsProps) {
  const [showExtras, setShowExtras] = React.useState(false)
  const [anesthesiaCount, setAnesthesiaCount] = useState(1)

  const options = [
    { code: 'T021', description: 'Complex scaling (multi-root >6 mm, single >8 mm)' },
    { code: 'T022', description: 'Standard scaling (multi-root 4-5 mm, single 4-7 mm)' }
  ] as const

  const toggleExtras = () => setShowExtras(prev => !prev)

  // Quick add helper
  const quickAdd = async (code: string, qty: number = 1) => {
    const res = await fetch(`/api/dental-codes?search=${code.toLowerCase()}`)
    if (!res.ok) return
    const list = await res.json()
    const found = list.find((c: any) => c.code.toUpperCase() === code)
    if (!found) return
    if (code === 'A10') {
      // Use quantity for A10
      await fetch(`/api/patients/${patientId}/dental-procedures`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId,
          codeId: found.id,
          toothNumber: 0,
          notes: 'Local anesthesia',
          status: currentStatus,
          date: new Date().toISOString().split('T')[0],
          quantity: qty
        })
      })
    } else {
      // Single procedure for other codes
      await createDentalProcedure(patientId, found.id, 0, code, currentStatus)
    }
    onProcedureAdded()
  }

  return (
    <Card className="fixed bottom-4 right-4 w-96 p-6 bg-gradient-to-tr from-sky-50/90 to-indigo-50/90 shadow-2xl border-2 border-sky-200 rounded-xl z-50 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-sky-700">Scaling tool</h3>
        <Button size="icon" variant="ghost" onClick={toggleExtras} title="Add related procedures">
          {showExtras ? '−' : '+'}
        </Button>
      </div>

      {/* Code selector */}
      <div className="grid grid-cols-1 gap-3">
        {options.map(opt => (
          <Button
            key={opt.code}
            variant="outline"
            className={`justify-start h-auto p-3 text-left transition-colors ${selectedCode === opt.code
              ? opt.code === 'T021'
                ? 'bg-orange-500 text-white border-orange-500 hover:bg-orange-600'
                : 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700'
              : 'hover:bg-gray-50'
              }`}
            onClick={() => setSelectedCode(opt.code)}
          >
            <div className="flex flex-col">
              <span className="font-bold text-base">{opt.code}</span>
              <span className={`text-xs leading-snug ${selectedCode === opt.code ? 'opacity-90' : 'opacity-80'
                }`}>{opt.description}</span>
            </div>
          </Button>
        ))}
      </div>

      {/* Extras panel */}
      {showExtras && (
        <div className="space-y-4 bg-white/60 p-4 rounded-lg border border-indigo-200">
          <h4 className="font-medium text-indigo-700 mb-2">Related procedures</h4>

          {/* Anesthesia */}
          <div className="flex items-center gap-3">
            <label htmlFor="anesthesia" className="text-sm font-medium w-28">A10 units</label>
            <input
              id="anesthesia"
              type="number"
              min={1}
              className="w-20 rounded border px-2 py-1 text-sm"
              value={anesthesiaCount}
              onChange={e => setAnesthesiaCount(Math.max(1, parseInt(e.target.value) || 1))}
            />
            <Button size="sm" onClick={() => quickAdd('A10', anesthesiaCount)}>Add</Button>
          </div>

          {/* Basic T codes */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Include codes:</p>
            <div className="flex flex-wrap gap-2">
              {['T012', 'T032'].map(code => (
                <Button key={code} size="sm" variant="outline" onClick={() => quickAdd(code)}>{code}</Button>
              ))}
            </div>
          </div>

          {/* Choice group */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Select one:</p>
            <div className="flex flex-wrap gap-2">
              {['T042', 'T043', 'T044'].map(code => (
                <Button key={code} size="sm" variant="outline" onClick={() => quickAdd(code)}>{code}</Button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="text-xs text-sky-700 bg-sky-100 p-2 rounded leading-relaxed">
        💡 Select scaling code, then click or drag over teeth.
        <div className="mt-2 space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-500"></div>
            <span className="font-semibold">T021</span> - Complex scaling (orange)
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-600"></div>
            <span className="font-semibold">T022</span> - Standard scaling (blue)
          </div>
        </div>
        <div className="mt-2 text-xs opacity-80">
          Existing scaling procedures are shown as colored dots on teeth when the scaling tool is active.
        </div>
      </div>
    </Card>
  )
} 