'use client'

import React, { useState } from 'react'
import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import {
  Button,
} from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
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
  Checkbox,
} from '@/components/ui/checkbox'
import {
  Calendar,
  Clock,
  Plus,
  Send,
  AlertCircle,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

// Leave types
const LEAVE_TYPES = [
  { value: 'VACATION', label: 'Concediu de odihnă' },
  { value: 'SICK_LEAVE', label: 'Concediu medical' },
  { value: 'PERSONAL', label: 'Concediu personal' },
  { value: 'MATERNITY', label: 'Concediu de maternitate' },
  { value: 'PATERNITY', label: 'Concediu de paternitate' },
  { value: 'BEREAVEMENT', label: 'Concediu de deces' },
  { value: 'JURY_DUTY', label: 'Serviciu în instanță' },
  { value: 'MILITARY', label: 'Concediu militar' },
  { value: 'STUDY', label: 'Concediu de studii' },
  { value: 'UNPAID', label: 'Concediu fără plată' },
  { value: 'OTHER', label: 'Altele' },
]

interface LeaveRequestFormProps {
  onSubmit?: () => void
}

export default function LeaveRequestForm({ onSubmit }: LeaveRequestFormProps) {
  const { data: session } = useSession()
  const { toast } = useToast()

  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [leaveType, setLeaveType] = useState('')
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
      newErrors.title = 'Titlul este obligatoriu'
    }

    if (!leaveType) {
      newErrors.leaveType = 'Tipul concediului este obligatoriu'
    }

    if (!startDate) {
      newErrors.startDate = 'Data de început este obligatorie'
    }

    if (!endDate) {
      newErrors.endDate = 'Data de sfârșit este obligatorie'
    }

    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      newErrors.endDate = 'Data de sfârșit trebuie să fie după data de început'
    }

    if (isPartialDay) {
      if (!startTime) {
        newErrors.startTime = 'Ora de început este obligatorie pentru zile parțiale'
      }
      if (!endTime) {
        newErrors.endTime = 'Ora de sfârșit este obligatorie pentru zile parțiale'
      }
      if (startTime && endTime && startTime >= endTime) {
        newErrors.endTime = 'Ora de sfârșit trebuie să fie după ora de început'
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
      // Calculate partial day hours
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
      const response = await fetch('/api/leave-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          leaveType,
          startDate,
          endDate,
          isPartialDay,
          startTime: isPartialDay ? startTime : undefined,
          endTime: isPartialDay ? endTime : undefined,
        }),
      })

      if (response.ok) {
        toast({
          title: 'Succes',
          description: 'Cererea de concediu a fost trimisă cu succes. Veți fi notificat când este analizată.',
        })

        // Reset form
        setTitle('')
        setDescription('')
        setLeaveType('')
        setStartDate('')
        setEndDate('')
        setIsPartialDay(false)
        setStartTime('')
        setEndTime('')
        setErrors({})
        setIsOpen(false)

        if (onSubmit) {
          onSubmit()
        }
      } else {
        const error = await response.json()
        toast({
          title: 'Eroare',
          description: error.error || 'Trimiterea cererii de concediu a eșuat.',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error submitting leave request:', error)
      toast({
        title: 'Eroare',
        description: 'Trimiterea cererii de concediu a eșuat. Încercați din nou.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setTitle('')
    setDescription('')
    setLeaveType('')
    setStartDate('')
    setEndDate('')
    setIsPartialDay(false)
    setStartTime('')
    setEndTime('')
    setErrors({})
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open)
      if (!open) {
        resetForm()
      }
    }}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Solicită concediu
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Trimite cerere de concediu</DialogTitle>
          <div className="text-sm text-gray-500">
            Completați toate informațiile obligatorii pentru cererea de concediu.
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">
              Titlu cerere <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="ex.: Concediu de odihnă, consult medical etc."
              className={errors.title ? 'border-red-500' : ''}
            />
            {errors.title && (
              <p className="text-sm text-red-500 flex items-center">
                <AlertCircle className="h-3 w-3 mr-1" />
                {errors.title}
              </p>
            )}
          </div>

          {/* Leave Type */}
          <div className="space-y-2">
            <Label htmlFor="leaveType">
              Tip concediu <span className="text-red-500">*</span>
            </Label>
            <Select value={leaveType} onValueChange={setLeaveType}>
              <SelectTrigger className={errors.leaveType ? 'border-red-500' : ''}>
                <SelectValue placeholder="Selectați tipul de concediu" />
              </SelectTrigger>
              <SelectContent>
                {LEAVE_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.leaveType && (
              <p className="text-sm text-red-500 flex items-center">
                <AlertCircle className="h-3 w-3 mr-1" />
                {errors.leaveType}
              </p>
            )}
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">
                Data de început <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className={`pl-10 ${errors.startDate ? 'border-red-500' : ''}`}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              {errors.startDate && (
                <p className="text-sm text-red-500 flex items-center">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {errors.startDate}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">
                Data de sfârșit <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className={`pl-10 ${errors.endDate ? 'border-red-500' : ''}`}
                  min={startDate || new Date().toISOString().split('T')[0]}
                />
              </div>
              {errors.endDate && (
                <p className="text-sm text-red-500 flex items-center">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {errors.endDate}
                </p>
              )}
            </div>
          </div>

          {/* Partial Day Option */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="partialDay"
              checked={isPartialDay}
              onCheckedChange={(checked) => setIsPartialDay(checked as boolean)}
            />
            <Label htmlFor="partialDay" className="text-sm font-medium">
              Cerere pentru zi parțială
            </Label>
          </div>

          {/* Time fields for partial days */}
          {isPartialDay && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg">
              <div className="space-y-2">
                <Label htmlFor="startTime">
                  Ora de început <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="startTime"
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className={`pl-10 ${errors.startTime ? 'border-red-500' : ''}`}
                  />
                </div>
                {errors.startTime && (
                  <p className="text-sm text-red-500 flex items-center">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {errors.startTime}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="endTime">
                  Ora de sfârșit <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="endTime"
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className={`pl-10 ${errors.endTime ? 'border-red-500' : ''}`}
                  />
                </div>
                {errors.endTime && (
                  <p className="text-sm text-red-500 flex items-center">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {errors.endTime}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Duration Display */}
          {startDate && endDate && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600">
                <strong>Durată:</strong> {calculateDays()} {calculateDays() === 1 ? 'zi' : 'zile'}
              </div>
            </div>
          )}

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">
              Descriere <span className="text-gray-400">(opțional)</span>
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalii suplimentare despre cererea de concediu..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isLoading}
            >
              Anulare
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="min-w-[120px]"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Se trimite...
                </div>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Trimite cererea
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
