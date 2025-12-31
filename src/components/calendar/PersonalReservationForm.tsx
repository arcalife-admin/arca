'use client'

import React, { useState } from 'react'
import { useSession } from 'next-auth/react'
import { addDays, differenceInCalendarDays } from 'date-fns'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/use-toast'
import { Plus, Check, Calendar, Clock } from 'lucide-react'

interface PersonalReservationFormProps {
  onSubmit?: () => void
}

export default function PersonalReservationForm({ onSubmit }: PersonalReservationFormProps) {
  const { data: session } = useSession()
  const { toast } = useToast()

  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Form state (matching LeaveRequestForm)
  const [title, setTitle] = useState('Blocked Time')
  const [description, setDescription] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [isPartialDay, setIsPartialDay] = useState(false)
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')

  // Form validation
  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {}

    if (!title.trim()) {
      newErrors.title = 'Title is required'
    }

    if (!startDate) {
      newErrors.startDate = 'Start date is required'
    }

    if (!endDate) {
      newErrors.endDate = 'End date is required'
    }

    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      newErrors.endDate = 'End date must be after start date'
    }

    if (isPartialDay) {
      if (!startTime) {
        newErrors.startTime = 'Start time is required for partial days'
      }
      if (!endTime) {
        newErrors.endTime = 'End time is required for partial days'
      }
      if (startTime && endTime && startTime >= endTime) {
        newErrors.endTime = 'End time must be after start time'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const calculateDays = () => {
    if (!startDate || !endDate) return 0

    const start = new Date(startDate)
    const end = new Date(endDate)
    const diffTime = Math.abs(end.getTime() - start.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1

    if (isPartialDay && startDate === endDate) {
      if (startTime && endTime) {
        const startHour = parseInt(startTime.split(':')[0])
        const startMin = parseInt(startTime.split(':')[1])
        const endHour = parseInt(endTime.split(':')[0])
        const endMin = parseInt(endTime.split(':')[1])

        const totalMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin)
        const totalHours = totalMinutes / 60
        return Math.round((totalHours / 8) * 100) / 100 // Assuming 8-hour workday
      }
      return 0.5
    }

    return diffDays
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    try {
      // Create the leave request using the same API
      const response = await fetch('/api/leave-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || 'Personal blocked time',
          leaveType: 'PERSONAL', // Use PERSONAL type for blocked times
          startDate,
          endDate,
          isPartialDay,
          startTime: isPartialDay ? startTime : undefined,
          endTime: isPartialDay ? endTime : undefined,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create blocked time')
      }

      const leaveRequest = await response.json()

      // Auto-approve the blocked time (bypass manager approval)
      const approvalResponse = await fetch('/api/leave-requests', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          leaveRequestId: leaveRequest.id,
          type: 'review',
          action: 'APPROVE',
          reviewComments: 'Auto-approved personal blocked time',
        }),
      })

      if (!approvalResponse.ok) {
        // If auto-approval fails, still consider it a success since the request was created
        console.warn('Auto-approval failed, but blocked time was created')
      }

      toast({
        title: 'Success',
        description: 'Blocked time added successfully.',
      })

      // Reset form
      setTitle('Blocked Time')
      setDescription('')
      setStartDate('')
      setEndDate('')
      setIsPartialDay(false)
      setStartTime('')
      setEndTime('')
      setErrors({})
      setOpen(false)

      // Refresh calendar and parent data
      if (onSubmit) {
        onSubmit()
      }

      // Emit refresh event for calendar
      window.dispatchEvent(new CustomEvent('leave_requests_refresh'))

    } catch (error) {
      console.error('Error creating blocked time:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create blocked time. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setTitle('Blocked Time')
    setDescription('')
    setStartDate('')
    setEndDate('')
    setIsPartialDay(false)
    setStartTime('')
    setEndTime('')
    setErrors({})
  }

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      setOpen(newOpen)
      if (!newOpen) {
        resetForm()
      }
    }}>
      <DialogTrigger asChild>
        <Button className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          Add Blocked Time
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Personal Blocked Time</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Personal appointment, Doctor visit, etc."
              className={errors.title ? 'border-red-500' : ''}
            />
            {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Additional details about this blocked time..."
              rows={3}
            />
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date *</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value)
                  if (!endDate) {
                    setEndDate(e.target.value)
                  }
                }}
                className={errors.startDate ? 'border-red-500' : ''}
              />
              {errors.startDate && <p className="text-sm text-red-500">{errors.startDate}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">End Date *</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate}
                className={errors.endDate ? 'border-red-500' : ''}
              />
              {errors.endDate && <p className="text-sm text-red-500">{errors.endDate}</p>}
            </div>
          </div>

          {/* Partial Day Option */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isPartialDay"
              checked={isPartialDay}
              onCheckedChange={(checked) => setIsPartialDay(checked === true)}
            />
            <Label htmlFor="isPartialDay" className="text-sm">
              This is a partial day (specify time range)
            </Label>
          </div>

          {/* Time Range (if partial day) */}
          {isPartialDay && (
            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="space-y-2">
                <Label htmlFor="startTime">Start Time *</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className={errors.startTime ? 'border-red-500' : ''}
                />
                {errors.startTime && <p className="text-sm text-red-500">{errors.startTime}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="endTime">End Time *</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className={errors.endTime ? 'border-red-500' : ''}
                />
                {errors.endTime && <p className="text-sm text-red-500">{errors.endTime}</p>}
              </div>
            </div>
          )}

          {/* Duration Summary */}
          {startDate && endDate && (
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center text-sm text-blue-700">
                <Calendar className="h-4 w-4 mr-2" />
                Duration: {calculateDays()} day{calculateDays() !== 1 ? 's' : ''}
                {isPartialDay && startTime && endTime && (
                  <>
                    <Clock className="h-4 w-4 ml-4 mr-2" />
                    {startTime} - {endTime}
                  </>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Add Blocked Time
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 