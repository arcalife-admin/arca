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
      toast({ title: 'Success', description: 'Week schedule saved successfully' })
      onClose()
    } catch (error) {
      console.error('Error saving shifts:', error)
      toast({ title: 'Error', description: 'Failed to save week schedule', variant: 'destructive' })
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
    return practitioner ? `${practitioner.firstName} ${practitioner.lastName}` : 'Unknown'
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Week Schedule Editor - Room {roomNumber}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Week Overview Table */}
            <div className="border rounded-lg overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-24">Day</TableHead>
                    <TableHead>Shifts</TableHead>
                    <TableHead className="w-20">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {WEEKDAYS.map(day => {
                    const dayShifts = shifts[day] || []
                    return (
                      <TableRow key={day}>
                        <TableCell className="font-medium">
                          {day}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-2">
                            {dayShifts.length === 0 ? (
                              <div className="text-gray-500 text-sm">No shifts scheduled</div>
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
                                          Override
                                        </Badge>
                                      )}
                                      {shift.priority > 0 && (
                                        <Badge variant="outline" className="ml-2 text-xs">
                                          Priority: {shift.priority}
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
                            Add
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
              <h4 className="font-medium text-blue-900 mb-2">Summary</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="text-blue-700 font-medium">Total Shifts</div>
                  <div className="text-blue-600">
                    {WEEKDAYS.reduce((sum, day) => sum + (shifts[day]?.length || 0), 0)}
                  </div>
                </div>
                <div>
                  <div className="text-blue-700 font-medium">Days Covered</div>
                  <div className="text-blue-600">
                    {WEEKDAYS.filter(day => (shifts[day]?.length || 0) > 0).length} / 7
                  </div>
                </div>
                <div>
                  <div className="text-blue-700 font-medium">Override Shifts</div>
                  <div className="text-blue-600">
                    {WEEKDAYS.reduce((sum, day) => sum + (shifts[day]?.filter(s => s.isOverride).length || 0), 0)}
                  </div>
                </div>
                <div>
                  <div className="text-blue-700 font-medium">Unique Practitioners</div>
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
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Week Schedule'}
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
              title: 'Time Conflict',
              description: `This shift overlaps with existing shifts. Use "Override" if intentional.`,
              variant: 'destructive'
            })
            return
          }
          addShift(selectedDay, shiftData)
          setShowAddShiftDialog(false)
          toast({
            title: 'Shift Added',
            description: `Added shift for ${selectedDay}`
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
          <DialogTitle>Add Shift for {day}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="practitioner">Main Practitioner</Label>
            <Select value={practitionerId} onValueChange={setPractitionerId}>
              <SelectTrigger>
                <SelectValue placeholder="Select practitioner" />
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
            <Label htmlFor="sidePractitioner">Side Practitioner (Optional)</Label>
            <Select value={sidePractitionerId} onValueChange={setSidePractitionerId}>
              <SelectTrigger>
                <SelectValue placeholder="None" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">None</SelectItem>
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
              <Label htmlFor="startTime">Start Time</Label>
              <Input
                id="startTime"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="endTime">End Time</Label>
              <Input
                id="endTime"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="priority">Priority (0-10)</Label>
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
            <Label>Override existing shifts</Label>
          </div>

          {isOverride && (
            <div>
              <Label htmlFor="reason">Reason</Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Why is this override needed?"
              />
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!practitionerId || startTime >= endTime}>
              Add Shift
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 