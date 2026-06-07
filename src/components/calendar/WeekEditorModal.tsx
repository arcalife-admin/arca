'use client'

import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Button,
} from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Input,
} from '@/components/ui/input'
import {
  Badge,
} from '@/components/ui/badge'
import {
  Textarea,
} from '@/components/ui/textarea'
import {
  Switch,
} from '@/components/ui/switch'
import {
  Label,
} from '@/components/ui/label'
import { Plus, Trash2, Clock, User } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Practitioner {
  id: string
  firstName: string
  lastName: string
}

interface RoomShift {
  id?: string
  roomNumber?: number
  practitionerId: string
  sidePractitionerId?: string
  startTime: string
  endTime: string
  dayOfWeek?: string
  date?: string
  priority: number
  isOverride: boolean
  reason?: string
  practitioner?: Practitioner
  sidePractitioner?: Practitioner
}

interface WeekEditorModalProps {
  isOpen: boolean
  onClose: () => void
  roomNumber: number
  practitioners: Practitioner[]
  existingShifts: RoomShift[]
  onSaveShifts: (shifts: RoomShift[]) => Promise<void>
}

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

const WEEKDAY_LABELS: Record<string, string> = {
  Monday: 'Luni',
  Tuesday: 'Marți',
  Wednesday: 'Miercuri',
  Thursday: 'Joi',
  Friday: 'Vineri',
  Saturday: 'Sâmbătă',
  Sunday: 'Duminică',
}

export default function WeekEditorModal({
  isOpen,
  onClose,
  roomNumber,
  practitioners,
  existingShifts,
  onSaveShifts,
}: WeekEditorModalProps) {
  const { toast } = useToast()
  const [shifts, setShifts] = useState<Record<string, RoomShift[]>>({})
  const [showAddShiftDialog, setShowAddShiftDialog] = useState(false)
  const [selectedDay, setSelectedDay] = useState('Monday')
  const [isSaving, setIsSaving] = useState(false)

  // Initialize shifts from existing data
  useEffect(() => {
    if (isOpen) {
      const shiftsByDay: Record<string, RoomShift[]> = {}

      // Initialize empty arrays for all days
      WEEKDAYS.forEach(day => {
        shiftsByDay[day] = []
      })

      // Group existing shifts by day of week
      existingShifts
        .filter(shift => shift.dayOfWeek) // Only recurring weekly shifts
        .forEach(shift => {
          if (shift.dayOfWeek && shiftsByDay[shift.dayOfWeek]) {
            shiftsByDay[shift.dayOfWeek].push(shift)
          }
        })

      setShifts(shiftsByDay)
    }
  }, [isOpen, existingShifts])

  const addShift = (day: string, shiftData: Omit<RoomShift, 'dayOfWeek'>) => {
    const newShift: RoomShift = {
      ...shiftData,
      dayOfWeek: day,
      id: `temp-${Date.now()}-${Math.random()}`, // Temporary ID for new shifts
    }

    setShifts(prev => ({
      ...prev,
      [day]: [...(prev[day] || []), newShift].sort((a, b) => a.startTime.localeCompare(b.startTime))
    }))
  }

  const removeShift = (day: string, shiftIndex: number) => {
    setShifts(prev => ({
      ...prev,
      [day]: prev[day].filter((_, index) => index !== shiftIndex)
    }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      // Flatten all shifts into a single array
      const allShifts = WEEKDAYS.flatMap(day =>
        (shifts[day] || []).map(shift => ({
          ...shift,
          dayOfWeek: day,
        }))
      )

      await onSaveShifts(allShifts)
      toast({ title: 'Succes', description: 'Programul săptămânal a fost salvat cu succes' })
      onClose()
    } catch (error) {
      console.error('Error saving shifts:', error)
      toast({ title: 'Eroare', description: 'Salvarea programului săptămânal a eșuat', variant: 'destructive' })
    } finally {
      setIsSaving(false)
    }
  }

  const getShiftConflicts = (day: string, newShift: RoomShift) => {
    const dayShifts = shifts[day] || []
    return dayShifts.filter(shift => {
      // Check if time ranges overlap
      return (
        (newShift.startTime >= shift.startTime && newShift.startTime < shift.endTime) ||
        (newShift.endTime > shift.startTime && newShift.endTime <= shift.endTime) ||
        (newShift.startTime <= shift.startTime && newShift.endTime >= shift.endTime)
      )
    })
  }

  const getPractitionerName = (practitionerId: string) => {
    const practitioner = practitioners.find(p => p.id === practitionerId)
    return practitioner ? `${practitioner.firstName} ${practitioner.lastName}` : 'Necunoscut'
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Editor program săptămânal - Cabinet {roomNumber}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Week Overview Table */}
            <div className="border rounded-lg overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-24">Zi</TableHead>
                    <TableHead>Schimburi</TableHead>
                    <TableHead className="w-20">Acțiuni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {WEEKDAYS.map(day => {
                    const dayShifts = shifts[day] || []
                    return (
                      <TableRow key={day}>
                        <TableCell className="font-medium">
                          {WEEKDAY_LABELS[day] ?? day}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-2">
                            {dayShifts.length === 0 ? (
                              <div className="text-gray-500 text-sm">Niciun schimb programat</div>
                            ) : (
                              dayShifts.map((shift, index) => (
                                <div
                                  key={index}
                                  className="flex items-center justify-between p-2 bg-gray-50 rounded border"
                                >
                                  <div className="flex-1">
                                    <div className="font-medium text-sm">
                                      <User className="h-3 w-3 inline mr-1" />
                                      {getPractitionerName(shift.practitionerId)}
                                      {shift.sidePractitionerId && (
                                        <span className="text-gray-600">
                                          {' '}+ {getPractitionerName(shift.sidePractitionerId)}
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-sm text-gray-600">
                                      <Clock className="h-3 w-3 inline mr-1" />
                                      {shift.startTime} - {shift.endTime}
                                      {shift.isOverride && (
                                        <Badge variant="secondary" className="ml-2 text-xs">
                                          Excepție
                                        </Badge>
                                      )}
                                      {shift.priority > 0 && (
                                        <Badge variant="outline" className="ml-2 text-xs">
                                          Prioritate: {shift.priority}
                                        </Badge>
                                      )}
                                    </div>
                                    {shift.reason && (
                                      <div className="text-xs text-gray-500 italic mt-1">
                                        {shift.reason}
                                      </div>
                                    )}
                                  </div>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => removeShift(day, index)}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              ))
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedDay(day)
                              setShowAddShiftDialog(true)
                            }}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Adaugă
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Summary */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Rezumat</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="text-blue-700 font-medium">Total schimburi</div>
                  <div className="text-blue-600">
                    {WEEKDAYS.reduce((sum, day) => sum + (shifts[day]?.length || 0), 0)}
                  </div>
                </div>
                <div>
                  <div className="text-blue-700 font-medium">Zile acoperite</div>
                  <div className="text-blue-600">
                    {WEEKDAYS.filter(day => (shifts[day]?.length || 0) > 0).length} / 7
                  </div>
                </div>
                <div>
                  <div className="text-blue-700 font-medium">Schimburi cu excepție</div>
                  <div className="text-blue-600">
                    {WEEKDAYS.reduce((sum, day) => sum + (shifts[day]?.filter(s => s.isOverride).length || 0), 0)}
                  </div>
                </div>
                <div>
                  <div className="text-blue-700 font-medium">Practicieni unici</div>
                  <div className="text-blue-600">
                    {new Set(
                      WEEKDAYS.flatMap(day =>
                        (shifts[day] || []).flatMap(s => [s.practitionerId, s.sidePractitionerId].filter(Boolean))
                      )
                    ).size}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Anulare
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Se salvează...' : 'Salvează programul săptămânal'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Shift Dialog */}
      <AddShiftToWeekDialog
        isOpen={showAddShiftDialog}
        onClose={() => setShowAddShiftDialog(false)}
        day={selectedDay}
        practitioners={practitioners}
        onAddShift={(shiftData) => {
          const conflicts = getShiftConflicts(selectedDay, { ...shiftData, dayOfWeek: selectedDay })
          if (conflicts.length > 0 && !shiftData.isOverride) {
            toast({
              title: 'Conflict de program',
              description: `Acest schimb se suprapune cu schimburile existente. Folosiți „Excepție" dacă este intenționat.`,
              variant: 'destructive'
            })
            return
          }
          addShift(selectedDay, shiftData)
          setShowAddShiftDialog(false)
          toast({
            title: 'Schimb adăugat',
            description: `Schimb adăugat pentru ${WEEKDAY_LABELS[selectedDay] ?? selectedDay}`
          })
        }}
      />
    </>
  )
}

// Add Shift to Week Dialog Component
function AddShiftToWeekDialog({
  isOpen,
  onClose,
  day,
  practitioners,
  onAddShift,
}: {
  isOpen: boolean
  onClose: () => void
  day: string
  practitioners: Practitioner[]
  onAddShift: (shiftData: Omit<RoomShift, 'dayOfWeek'>) => void
}) {
  const [practitionerId, setPractitionerId] = useState('')
  const [sidePractitionerId, setSidePractitionerId] = useState('')
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('17:00')
  const [priority, setPriority] = useState(0)
  const [isOverride, setIsOverride] = useState(false)
  const [reason, setReason] = useState('')

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      setPractitionerId('')
      setSidePractitionerId('')
      setStartTime('09:00')
      setEndTime('17:00')
      setPriority(0)
      setIsOverride(false)
      setReason('')
    }
  }, [isOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!practitionerId || startTime >= endTime) {
      return
    }

    onAddShift({
      practitionerId,
      sidePractitionerId: sidePractitionerId || undefined,
      startTime,
      endTime,
      priority,
      isOverride,
      reason: reason || undefined,
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Adaugă schimb pentru {WEEKDAY_LABELS[day] ?? day}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="practitioner">Practician principal</Label>
            <Select value={practitionerId} onValueChange={setPractitionerId}>
              <SelectTrigger>
                <SelectValue placeholder="Selectați practicianul" />
              </SelectTrigger>
              <SelectContent>
                {practitioners.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.firstName} {p.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="sidePractitioner">Practician secundar (opțional)</Label>
            <Select value={sidePractitionerId} onValueChange={setSidePractitionerId}>
              <SelectTrigger>
                <SelectValue placeholder="Niciunul" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Niciunul</SelectItem>
                {practitioners
                  .filter(p => p.id !== practitionerId)
                  .map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.firstName} {p.lastName}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="startTime">Ora de început</Label>
              <Input
                id="startTime"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="endTime">Ora de sfârșit</Label>
              <Input
                id="endTime"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="priority">Prioritate (0-10)</Label>
            <Input
              id="priority"
              type="number"
              value={priority}
              onChange={(e) => setPriority(Number(e.target.value))}
              min="0"
              max="10"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch checked={isOverride} onCheckedChange={setIsOverride} />
            <Label>Înlocuiește schimburile existente</Label>
          </div>

          {isOverride && (
            <div>
              <Label htmlFor="reason">Motiv</Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="De ce este necesară această excepție?"
              />
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Anulare
            </Button>
            <Button type="submit" disabled={!practitionerId || startTime >= endTime}>
              Adaugă schimb
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 