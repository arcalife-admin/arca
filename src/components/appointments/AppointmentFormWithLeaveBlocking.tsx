'use client'

import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Alert,
  AlertDescription,
} from '@/components/ui/alert'
import {
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  User,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import {
  fetchLeaveBlocks,
  validateAppointmentAgainstLeave,
  LeaveBlock,
} from '@/lib/calendar-leave-integration'

interface AppointmentFormProps {
  selectedDate?: Date
  selectedPractitionerId?: string
  onSubmit?: (appointment: any) => void
  onCancel?: () => void
}

export default function AppointmentFormWithLeaveBlocking({
  selectedDate,
  selectedPractitionerId,
  onSubmit,
  onCancel
}: AppointmentFormProps) {
  const { data: session } = useSession()
  const { toast } = useToast()

  // Form state
  const [patient, setPatient] = useState('')
  const [practitionerId, setPractitionerId] = useState(selectedPractitionerId || '')
  const [date, setDate] = useState(selectedDate ? selectedDate.toISOString().split('T')[0] : '')
  const [startTime, setStartTime] = useState('')
  const [duration, setDuration] = useState(30)
  const [treatmentType, setTreatmentType] = useState('')
  const [notes, setNotes] = useState('')

  // Leave blocking state
  const [leaveBlocks, setLeaveBlocks] = useState<LeaveBlock[]>([])
  const [validationError, setValidationError] = useState<string | null>(null)
  const [isValidating, setIsValidating] = useState(false)
  const [blockedBy, setBlockedBy] = useState<LeaveBlock | null>(null)

  // Data state
  const [patients, setPatients] = useState<any[]>([])
  const [practitioners, setPractitioners] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Load initial data
  useEffect(() => {
    fetchInitialData()
  }, [])

  // Validate appointment against leave whenever relevant fields change
  useEffect(() => {
    if (date && startTime && practitionerId) {
      validateAppointment()
    } else {
      setValidationError(null)
      setBlockedBy(null)
    }
  }, [date, startTime, duration, practitionerId, leaveBlocks])

  const fetchInitialData = async () => {
    try {
      // Fetch leave blocks
      const blocks = await fetchLeaveBlocks()
      setLeaveBlocks(blocks)

      // Fetch patients and practitioners (you would implement these APIs)
      const [patientsRes, practitionersRes] = await Promise.all([
        fetch('/api/patients'),
        fetch('/api/practitioners'),
      ])

      if (patientsRes.ok) {
        const patientsData = await patientsRes.json()
        setPatients(patientsData)
      }

      if (practitionersRes.ok) {
        const practitionersData = await practitionersRes.json()
        setPractitioners(practitionersData)
      }
    } catch (error) {
      console.error('Error fetching initial data:', error)
      toast({
        title: 'Error',
        description: 'Failed to load appointment data.',
        variant: 'destructive',
      })
    }
  }

  const validateAppointment = () => {
    if (!date || !startTime || !practitionerId) return

    setIsValidating(true)

    try {
      const appointmentDate = new Date(date)
      const [hours, minutes] = startTime.split(':').map(Number)

      const startDateTime = new Date(appointmentDate)
      startDateTime.setHours(hours, minutes, 0, 0)

      const endDateTime = new Date(startDateTime)
      endDateTime.setMinutes(endDateTime.getMinutes() + duration)

      const validation = validateAppointmentAgainstLeave(
        appointmentDate,
        startDateTime,
        endDateTime,
        practitionerId,
        leaveBlocks
      )

      if (!validation.isValid) {
        setValidationError(validation.error || 'Appointment conflicts with approved leave')
        // Find the blocking leave for display
        const blocking = leaveBlocks.find(block => {
          if (block.resourceId !== practitionerId) return false

          if (block.isPartialDay && block.startTime && block.endTime) {
            const blockStart = new Date(block.start)
            const [blockStartHour, blockStartMinute] = block.startTime.split(':').map(Number)
            blockStart.setHours(blockStartHour, blockStartMinute, 0, 0)

            const blockEnd = new Date(block.start)
            const [blockEndHour, blockEndMinute] = block.endTime.split(':').map(Number)
            blockEnd.setHours(blockEndHour, blockEndMinute, 0, 0)

            return appointmentDate.toDateString() === block.start.toDateString() &&
              ((startDateTime >= blockStart && startDateTime < blockEnd) ||
                (endDateTime > blockStart && endDateTime <= blockEnd) ||
                (startDateTime <= blockStart && endDateTime >= blockEnd))
          } else {
            return appointmentDate >= block.start && appointmentDate <= block.end
          }
        })
        setBlockedBy(blocking || null)
      } else {
        setValidationError(null)
        setBlockedBy(null)
      }
    } catch (error) {
      console.error('Error validating appointment:', error)
      setValidationError('Error validating appointment against leave requests')
    } finally {
      setIsValidating(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (validationError) {
      toast({
        title: 'Cannot Create Appointment',
        description: validationError,
        variant: 'destructive',
      })
      return
    }

    if (!patient || !practitionerId || !date || !startTime) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)

    try {
      const appointmentDate = new Date(date)
      const [hours, minutes] = startTime.split(':').map(Number)

      const startDateTime = new Date(appointmentDate)
      startDateTime.setHours(hours, minutes, 0, 0)

      const endDateTime = new Date(startDateTime)
      endDateTime.setMinutes(endDateTime.getMinutes() + duration)

      const appointmentData = {
        patientId: patient,
        practitionerId,
        startTime: startDateTime,
        endTime: endDateTime,
        duration,
        treatmentType,
        notes,
      }

      // Submit to your appointment creation API
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(appointmentData),
      })

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Appointment created successfully.',
        })

        if (onSubmit) {
          onSubmit(appointmentData)
        }
      } else {
        const error = await response.json()
        toast({
          title: 'Error',
          description: error.error || 'Failed to create appointment.',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error creating appointment:', error)
      toast({
        title: 'Error',
        description: 'Failed to create appointment. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getEndTime = () => {
    if (!startTime) return ''
    const [hours, minutes] = startTime.split(':').map(Number)
    const start = new Date()
    start.setHours(hours, minutes, 0, 0)
    const end = new Date(start.getTime() + duration * 60000)
    return end.toTimeString().slice(0, 5)
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Calendar className="h-5 w-5" />
          <span>Schedule Appointment</span>
          {isValidating && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Validation Error Alert */}
          {validationError && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p>{validationError}</p>
                  {blockedBy && (
                    <div className="text-sm bg-red-50 p-2 rounded">
                      <p><strong>Blocked by:</strong> {blockedBy.userName} - {blockedBy.leaveType.toLowerCase().replace('_', ' ')}</p>
                      {blockedBy.isPartialDay ? (
                        <p><strong>Time:</strong> {blockedBy.startTime} - {blockedBy.endTime}</p>
                      ) : (
                        <p><strong>Duration:</strong> {blockedBy.start.toLocaleDateString()} - {blockedBy.end.toLocaleDateString()}</p>
                      )}
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Success Validation */}
          {!validationError && date && startTime && practitionerId && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Time slot is available for appointment.
              </AlertDescription>
            </Alert>
          )}

          {/* Patient Selection */}
          <div className="space-y-2">
            <Label htmlFor="patient">
              Patient <span className="text-red-500">*</span>
            </Label>
            <Select value={patient} onValueChange={setPatient}>
              <SelectTrigger>
                <SelectValue placeholder="Select patient" />
              </SelectTrigger>
              <SelectContent>
                {patients.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.firstName} {p.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Practitioner Selection */}
          <div className="space-y-2">
            <Label htmlFor="practitioner">
              Practitioner <span className="text-red-500">*</span>
            </Label>
            <Select value={practitionerId} onValueChange={setPractitionerId}>
              <SelectTrigger>
                <SelectValue placeholder="Select practitioner" />
              </SelectTrigger>
              <SelectContent>
                {practitioners.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4" />
                      <span>{p.firstName} {p.lastName} - {p.role}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">
                Date <span className="text-red-500">*</span>
              </Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="startTime">
                Start Time <span className="text-red-500">*</span>
              </Label>
              <Input
                id="startTime"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <Label htmlFor="duration">Duration (minutes)</Label>
            <Select value={duration.toString()} onValueChange={(value) => setDuration(Number(value))}>
              <SelectTrigger>
                <SelectValue placeholder="Select duration" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15">15 minutes</SelectItem>
                <SelectItem value="30">30 minutes</SelectItem>
                <SelectItem value="45">45 minutes</SelectItem>
                <SelectItem value="60">1 hour</SelectItem>
                <SelectItem value="90">1.5 hours</SelectItem>
                <SelectItem value="120">2 hours</SelectItem>
              </SelectContent>
            </Select>
            {startTime && (
              <p className="text-sm text-gray-500">
                <Clock className="h-3 w-3 inline mr-1" />
                End time: {getEndTime()}
              </p>
            )}
          </div>

          {/* Treatment Type */}
          <div className="space-y-2">
            <Label htmlFor="treatmentType">Treatment Type</Label>
            <Input
              id="treatmentType"
              value={treatmentType}
              onChange={(e) => setTreatmentType(e.target.value)}
              placeholder="e.g., Cleaning, Consultation, Filling"
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Input
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes..."
            />
          </div>

          {/* Leave Information Display */}
          {practitionerId && leaveBlocks.some(block => block.resourceId === practitionerId) && (
            <div className="p-3 bg-yellow-50 rounded-lg">
              <h4 className="font-medium text-yellow-800 mb-2">Upcoming Leave for Selected Practitioner:</h4>
              <div className="space-y-1 text-sm text-yellow-700">
                {leaveBlocks
                  .filter(block => block.resourceId === practitionerId && block.start >= new Date())
                  .slice(0, 3)
                  .map(block => (
                    <div key={block.id}>
                      <strong>{block.leaveType.toLowerCase().replace('_', ' ')}:</strong> {' '}
                      {block.isPartialDay
                        ? `${block.start.toLocaleDateString()} (${block.startTime} - ${block.endTime})`
                        : `${block.start.toLocaleDateString()} - ${block.end.toLocaleDateString()}`
                      }
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              disabled={isLoading || !!validationError}
              className="min-w-[120px]"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating...
                </div>
              ) : (
                'Create Appointment'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
} 