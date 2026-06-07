"use client"

import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Button,
} from '@/components/ui/button'
import {
  Input,
} from '@/components/ui/input'
import {
  Label,
} from '@/components/ui/label'
import {
  Textarea,
} from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Switch,
} from '@/components/ui/switch'
import { useToast } from '@/hooks/use-toast'
import {
  Clock,
  UserX,
  Repeat,
  User,
  Home,
  Calendar,
} from 'lucide-react'

interface Practitioner {
  id: string
  firstName: string
  lastName: string
}

interface DayOfWeekOverrideModalProps {
  isOpen: boolean
  onClose: () => void
  scheduleId: string | null
  selectedDayOfWeek: string
  selectedRoomNumber?: number
  selectedPractitionerId?: string
  practitioners: Practitioner[]
  roomCount: number
  initialStartTime?: string
  initialEndTime?: string
  onOverrideCreated: () => void
}

const WEEKDAY_LABELS: Record<string, string> = {
  Monday: 'luni',
  Tuesday: 'marți',
  Wednesday: 'miercuri',
  Thursday: 'joi',
  Friday: 'vineri',
  Saturday: 'sâmbătă',
  Sunday: 'duminică',
}

const WEEKDAY_LABELS_CAP: Record<string, string> = {
  Monday: 'Luni',
  Tuesday: 'Marți',
  Wednesday: 'Miercuri',
  Thursday: 'Joi',
  Friday: 'Vineri',
  Saturday: 'Sâmbătă',
  Sunday: 'Duminică',
}

export default function DayOfWeekOverrideModal({
  isOpen,
  onClose,
  scheduleId,
  selectedDayOfWeek,
  selectedRoomNumber,
  selectedPractitionerId,
  practitioners,
  roomCount,
  initialStartTime,
  initialEndTime,
  onOverrideCreated,
}: DayOfWeekOverrideModalProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const dayLabel = WEEKDAY_LABELS[selectedDayOfWeek] ?? selectedDayOfWeek
  const dayLabelCap = WEEKDAY_LABELS_CAP[selectedDayOfWeek] ?? selectedDayOfWeek

  // Form state
  const [isUnavailable, setIsUnavailable] = useState(false)
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('17:00')
  const [reason, setReason] = useState('')
  const [selectedPractitioner, setSelectedPractitioner] = useState('')
  const [selectedRoom, setSelectedRoom] = useState('')

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setIsUnavailable(false)
      setStartTime(initialStartTime || '09:00')
      setEndTime(initialEndTime || '17:00')
      setReason('')

      // Pre-populate if we have context
      if (selectedPractitionerId) {
        setSelectedPractitioner(selectedPractitionerId)
      } else {
        setSelectedPractitioner('')
      }

      if (selectedRoomNumber) {
        setSelectedRoom(selectedRoomNumber.toString())
      } else {
        setSelectedRoom('')
      }
    }
  }, [isOpen, selectedPractitionerId, selectedRoomNumber])

  const handleSubmit = async () => {
    if (!scheduleId || !selectedDayOfWeek) {
      toast({
        title: 'Eroare',
        description: 'Lipsesc informațiile despre program sau zi',
        variant: 'destructive',
      })
      return
    }

    if (!selectedPractitioner && !selectedRoom) {
      toast({
        title: 'Eroare',
        description: 'Selectați un practician sau un cabinet',
        variant: 'destructive',
      })
      return
    }

    if (!isUnavailable && (!startTime || !endTime)) {
      toast({
        title: 'Eroare',
        description: 'Introduceți ora de început și ora de sfârșit',
        variant: 'destructive',
      })
      return
    }

    if (!isUnavailable && startTime >= endTime) {
      toast({
        title: 'Eroare',
        description: 'Ora de sfârșit trebuie să fie după ora de început',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)

    try {
      // For now, we'll store this as a room assignment modification
      // In a real implementation, you might want to create a separate table for recurring overrides
      const response = await fetch('/api/clinic-schedule/day-of-week-overrides', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scheduleId,
          dayOfWeek: selectedDayOfWeek,
          roomNumber: selectedRoom ? parseInt(selectedRoom) : undefined,
          practitionerId: selectedPractitioner || undefined,
          startTime: isUnavailable ? undefined : startTime,
          endTime: isUnavailable ? undefined : endTime,
          isUnavailable,
          reason: reason || undefined,
        }),
      })

      if (response.ok) {
        toast({
          title: 'Succes',
          description: isUnavailable
            ? `${dayLabelCap} a fost marcată ca indisponibilă`
            : `Programul pentru ${dayLabel} a fost actualizat cu succes`,
        })
        onOverrideCreated()
        onClose()
      } else {
        const error = await response.json()
        throw new Error(error.message || 'Failed to save recurring override')
      }
    } catch (error) {
      console.error('Error saving recurring override:', error)
      toast({
        title: 'Eroare',
        description: `Salvarea excepției pentru ${dayLabel} a eșuat: ${error.message}`,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const getSelectedPractitionerName = () => {
    if (!selectedPractitioner) return null
    const practitioner = practitioners.find(p => p.id === selectedPractitioner)
    return practitioner ? `${practitioner.firstName} ${practitioner.lastName}` : null
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Repeat className="h-5 w-5" />
            Excepție program săptămânal
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Day Display */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
            <div className="flex items-center gap-2 text-purple-700">
              <Calendar className="h-4 w-4" />
              <span className="font-medium">În fiecare {dayLabel}</span>
            </div>
            <div className="text-purple-600 text-sm mt-1">
              Se va aplica tuturor zilelor de {dayLabel} din perioada programului
            </div>
            {selectedRoomNumber && (
              <div className="flex items-center gap-2 text-purple-600 mt-1">
                <Home className="h-4 w-4" />
                <span className="text-sm">Cabinet {selectedRoomNumber}</span>
              </div>
            )}
            {getSelectedPractitionerName() && (
              <div className="flex items-center gap-2 text-purple-600 mt-1">
                <User className="h-4 w-4" />
                <span className="text-sm">{getSelectedPractitionerName()}</span>
              </div>
            )}
          </div>

          {/* Practitioner Selection (optional, prefilled if provided) */}
          <div>
            <Label htmlFor="practitioner">Practician (opțional)</Label>
            <Select value={selectedPractitioner} onValueChange={(val) => setSelectedPractitioner(val === 'none' ? '' : val)}>
              <SelectTrigger>
                <SelectValue placeholder="Selectați practicianul (opțional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Niciunul (se aplică tuturor cabinetelor)</SelectItem>
                {practitioners.map((practitioner) => (
                  <SelectItem key={practitioner.id} value={practitioner.id}>
                    {practitioner.firstName} {practitioner.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Room Selection (if not pre-selected) */}
          {!selectedRoomNumber && !selectedPractitioner && (
            <div>
              <Label htmlFor="room">Cabinet (opțional)</Label>
              <Select value={selectedRoom} onValueChange={(val) => setSelectedRoom(val === 'none' ? '' : val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selectați cabinetul (opțional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Toate cabinetele</SelectItem>
                  {Array.from({ length: roomCount }, (_, i) => (
                    <SelectItem key={i + 1} value={(i + 1).toString()}>
                      Cabinet {i + 1}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Unavailable Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UserX className="h-4 w-4 text-red-500" />
              <Label htmlFor="unavailable">Marchează toate zilele de {dayLabel} ca indisponibile</Label>
            </div>
            <Switch
              id="unavailable"
              checked={isUnavailable}
              onCheckedChange={setIsUnavailable}
            />
          </div>

          {/* Custom Times (if not unavailable) */}
          {!isUnavailable && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-green-600">
                <Clock className="h-4 w-4" />
                <span className="font-medium">Program de lucru — {dayLabelCap}</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start-time">Ora de început</Label>
                  <Input
                    id="start-time"
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="end-time">Ora de sfârșit</Label>
                  <Input
                    id="end-time"
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Reason */}
          <div>
            <Label htmlFor="reason">
              Motiv {isUnavailable ? '(obligatoriu pentru indisponibilitate)' : '(opțional)'}
            </Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={
                isUnavailable
                  ? `De ce sunt toate zilele de ${dayLabel} indisponibile? (ex.: ședință săptămânală, zi de mentenanță)`
                  : `De ce au zilele de ${dayLabel} un program diferit? (ex.: jumătate de zi, program prelungit)`
              }
              className="resize-none"
              rows={3}
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Anulare
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading || (isUnavailable && !reason)}
              className="flex-1"
            >
              {loading ? (
                'Se salvează...'
              ) : isUnavailable ? (
                `Marchează ${dayLabelCap} indisponibile`
              ) : (
                `Setează programul pentru ${dayLabelCap}`
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
