'use client'

import React, { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  AESTHETIC_PROCEDURE_OPTIONS,
  BREAST_SIZE_CC_OPTIONS,
  BREAST_SIZE_CUP_OPTIONS,
  TIME_AGO_OPTIONS,
  getProcedureOption,
  procedureHasSize,
} from '@/data/aesthetic-procedure-options'
import {
  createEmptyEntry,
  type AestheticProcedureEntry,
  type PatientAestheticProfile,
} from '@/types/patient-aesthetic-profile'

const TIME_AGO_LABELS_RO: Record<string, string> = {
  lt_6_months: '< 6 luni',
  '6_12_months': '6–12 luni',
  '1_2_years': '1–2 ani',
  '2_5_years': '2–5 ani',
  '5_10_years': '5–10 ani',
  '10_plus_years': '10+ ani',
  unknown: 'Necunoscut',
}

interface PatientGoalsHistoryModalProps {
  isOpen: boolean
  onClose: () => void
  patientId: string
  initialProfile: PatientAestheticProfile
  visitReason?: string
  onSaved: () => void
}

function EntryRow({
  entry,
  showTimeAgo,
  onChange,
  onRemove,
}: {
  entry: AestheticProcedureEntry
  showTimeAgo: boolean
  onChange: (updated: AestheticProcedureEntry) => void
  onRemove: () => void
}) {
  const hasSize = procedureHasSize(entry.procedureKey)

  const handleProcedureChange = (key: string) => {
    const option = getProcedureOption(key)
    onChange({
      ...entry,
      procedureKey: key,
      procedureLabel: option?.label ?? key,
      sizeCc: option?.hasSize ? entry.sizeCc : undefined,
      sizeCup: option?.hasSize ? entry.sizeCup : undefined,
    })
  }

  return (
    <div className="grid grid-cols-[1fr_auto] gap-2 p-3 rounded-lg border bg-gray-50">
      <div className="space-y-2">
        <div>
          <Label className="text-xs">Procedură</Label>
          <Select value={entry.procedureKey || undefined} onValueChange={handleProcedureChange}>
            <SelectTrigger className="h-8 text-sm">
              <SelectValue placeholder="Selectați procedura" />
            </SelectTrigger>
            <SelectContent>
              {AESTHETIC_PROCEDURE_OPTIONS.map((opt) => (
                <SelectItem key={opt.key} value={opt.key}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {hasSize && (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Dimensiune (cc)</Label>
              <Select
                value={entry.sizeCc || undefined}
                onValueChange={(v) => onChange({ ...entry, sizeCc: v })}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="cc" />
                </SelectTrigger>
                <SelectContent>
                  {BREAST_SIZE_CC_OPTIONS.map((cc) => (
                    <SelectItem key={cc} value={cc}>
                      {cc} cc
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Mărime cupă</Label>
              <Select
                value={entry.sizeCup || undefined}
                onValueChange={(v) => onChange({ ...entry, sizeCup: v })}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="Cupă" />
                </SelectTrigger>
                <SelectContent>
                  {BREAST_SIZE_CUP_OPTIONS.map((cup) => (
                    <SelectItem key={cup} value={cup}>
                      {cup}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {showTimeAgo && (
          <div>
            <Label className="text-xs">Acum cât timp</Label>
            <Select
              value={entry.timeAgo || undefined}
              onValueChange={(v) => onChange({ ...entry, timeAgo: v })}
            >
              <SelectTrigger className="h-8 text-sm">
                <SelectValue placeholder="Selectați perioada" />
              </SelectTrigger>
              <SelectContent>
                {TIME_AGO_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {TIME_AGO_LABELS_RO[opt.value] ?? opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div>
          <Label className="text-xs">Notițe (opțional)</Label>
          <Input
            className="h-8 text-sm"
            value={entry.notes ?? ''}
            onChange={(e) => onChange({ ...entry, notes: e.target.value || undefined })}
            placeholder="Detalii suplimentare"
          />
        </div>
      </div>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onRemove}
        className="h-8 w-8 p-0 text-red-500 hover:text-red-700 self-start"
        title="Elimină intrarea"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  )
}

export function PatientGoalsHistoryModal({
  isOpen,
  onClose,
  patientId,
  initialProfile,
  visitReason,
  onSaved,
}: PatientGoalsHistoryModalProps) {
  const [history, setHistory] = useState<AestheticProcedureEntry[]>([])
  const [goals, setGoals] = useState<AestheticProcedureEntry[]>([])
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setHistory(initialProfile.history.length > 0 ? [...initialProfile.history] : [])
      setGoals(initialProfile.goals.length > 0 ? [...initialProfile.goals] : [])
    }
  }, [isOpen, initialProfile])

  const updateEntry = (
    list: AestheticProcedureEntry[],
    setList: React.Dispatch<React.SetStateAction<AestheticProcedureEntry[]>>,
    id: string,
    updated: AestheticProcedureEntry
  ) => {
    setList(list.map((e) => (e.id === id ? updated : e)))
  }

  const removeEntry = (
    list: AestheticProcedureEntry[],
    setList: React.Dispatch<React.SetStateAction<AestheticProcedureEntry[]>>,
    id: string
  ) => {
    setList(list.filter((e) => e.id !== id))
  }

  const handleSave = async () => {
    const validHistory = history.filter((e) => e.procedureKey)
    const validGoals = goals.filter((e) => e.procedureKey)

    setIsSaving(true)
    try {
      const response = await fetch(`/api/patients/${patientId}/aesthetic-profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          aestheticProfile: {
            history: validHistory,
            goals: validGoals,
          },
        }),
      })

      if (!response.ok) {
        throw new Error('Salvarea')
      }

      toast.success('Obiective și istoric salvate')
      onSaved()
    } catch {
      toast.error('Salvarea obiectivelor și istoricului a eșuat')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Obiective și istoric</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-red-700">Proceduri anterioare</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={() => setHistory((prev) => [...prev, createEmptyEntry()])}
              >
                <Plus className="h-3 w-3 mr-1" />
                Adaugă
              </Button>
            </div>
            {history.length === 0 ? (
              <p className="text-xs text-gray-400 italic">Nicio intrare în istoric</p>
            ) : (
              <div className="space-y-2">
                {history.map((entry) => (
                  <EntryRow
                    key={entry.id}
                    entry={entry}
                    showTimeAgo
                    onChange={(updated) => updateEntry(history, setHistory, entry.id, updated)}
                    onRemove={() => removeEntry(history, setHistory, entry.id)}
                  />
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-green-700">Obiective și dorințe</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={() => setGoals((prev) => [...prev, createEmptyEntry()])}
              >
                <Plus className="h-3 w-3 mr-1" />
                Adaugă
              </Button>
            </div>
            {goals.length === 0 && visitReason && (
              <p className="text-xs text-gray-500 italic mb-2 px-1">
                Din formularul de primire: &ldquo;{visitReason}&rdquo;
              </p>
            )}
            {goals.length === 0 ? (
              <p className="text-xs text-gray-400 italic">Nicio intrare de obiective</p>
            ) : (
              <div className="space-y-2">
                {goals.map((entry) => (
                  <EntryRow
                    key={entry.id}
                    entry={entry}
                    showTimeAgo={false}
                    onChange={(updated) => updateEntry(goals, setGoals, entry.id, updated)}
                    onRemove={() => removeEntry(goals, setGoals, entry.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Anulează
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Se salvează...' : 'Salvează'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
