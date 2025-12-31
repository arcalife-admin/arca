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
        title: 'Error',
        description: 'Missing schedule or day information',
        variant: 'destructive',
      })
      return
    }

    if (!selectedPractitioner && !selectedRoom) {
      toast({
        title: 'Error',
        description: 'Please select either a practitioner or room',
        variant: 'destructive',
      })
      return
    }

    if (!isUnavailable && (!startTime || !endTime)) {
      toast({
        title: 'Error',
        description: 'Please provide start and end times',
        variant: 'destructive',
      })
      return
    }

    if (!isUnavailable && startTime >= endTime) {
      toast({
        title: 'Error',
        description: 'End time must be after start time',
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
          title: 'Success',
          description: isUnavailable
            ? `${selectedDayOfWeek} marked as unavailable`
            : `${selectedDayOfWeek} hours updated successfully`,
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
        title: 'Error',
        description: `Failed to save ${selectedDayOfWeek} override: ${error.message}`,
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
            Weekly Schedule Override
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Day Display */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
            <div className="flex items-center gap-2 text-purple-700">
              <Calendar className="h-4 w-4" />
              <span className="font-medium">Every {selectedDayOfWeek}</span>
            </div>
            <div className="text-purple-600 text-sm mt-1">
              This will apply to all {selectedDayOfWeek}s in the schedule period
            </div>
            {selectedRoomNumber && (
              <div className="flex items-center gap-2 text-purple-600 mt-1">
                <Home className="h-4 w-4" />
                <span className="text-sm">Room {selectedRoomNumber}</span>
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
            <Label htmlFor="practitioner">Practitioner (Optional)</Label>
            <Select value={selectedPractitioner} onValueChange={(val) => setSelectedPractitioner(val === 'none' ? '' : val)}>
              <SelectTrigger>
                <SelectValue placeholder="Select practitioner (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None (apply to all rooms)</SelectItem>
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
              <Label htmlFor="room">Room (Optional)</Label>
              <Select value={selectedRoom} onValueChange={(val) => setSelectedRoom(val === 'none' ? '' : val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select room (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">All rooms</SelectItem>
                  {Array.from({ length: roomCount }, (_, i) => (
                    <SelectItem key={i + 1} value={(i + 1).toString()}>
                      Room {i + 1}
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
              <Label htmlFor="unavailable">Mark all {selectedDayOfWeek}s as Unavailable</Label>
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
                <span className="font-medium">{selectedDayOfWeek} Working Hours</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start-time">Start Time</Label>
                  <Input
                    id="start-time"
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="end-time">End Time</Label>
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
              Reason {isUnavailable ? '(Required for unavailability)' : '(Optional)'}
            </Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={
                isUnavailable
                  ? `Why are all ${selectedDayOfWeek}s unavailable? (e.g., weekly meeting, maintenance day)`
                  : `Why do ${selectedDayOfWeek}s need different hours? (e.g., half day, extended hours)`
              }
              className="resize-none"
              rows={3}
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading || (isUnavailable && !reason)}
              className="flex-1"
            >
              {loading ? (
                'Saving...'
              ) : isUnavailable ? (
                `Mark ${selectedDayOfWeek}s Unavailable`
              ) : (
                `Set ${selectedDayOfWeek} Hours`
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 