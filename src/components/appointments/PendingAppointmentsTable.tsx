'use client'

import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ConfirmationModal } from '@/components/ui/confirmation-modal'
import { Draggable } from 'react-beautiful-dnd'
import {
  CalendarIcon,
  Clock,
  User,
  Calendar,
  ClipboardList,
  Trash2
} from 'lucide-react'
import { treatmentTypes } from '@/data/treatmentTypes'

interface PendingAppointmentsTableProps {
  onAddToPractitioner: (appointment: any, practitionerId: string) => void
}

const PendingAppointmentsTable = ({ onAddToPractitioner }: PendingAppointmentsTableProps) => {
  const queryClient = useQueryClient()
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [appointmentToDelete, setAppointmentToDelete] = useState<any>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // Fetch pending appointments
  const { data: pendingAppointments = [], isLoading } = useQuery({
    queryKey: ['pendingAppointments'],
    queryFn: async () => {
      const response = await fetch('/api/pending-appointments')
      if (!response.ok) {
        throw new Error('Failed to fetch pending appointments')
      }
      return response.json()
    }
  })

  // Fetch practitioners for the dropdown
  const { data: practitioners = [] } = useQuery({
    queryKey: ['practitioners'],
    queryFn: async () => {
      const response = await fetch('/api/practitioners')
      if (!response.ok) {
        throw new Error('Failed to fetch practitioners')
      }
      return response.json()
    }
  })

  // Delete a pending appointment
  const deletePendingAppointment = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/pending-appointments?id=${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete pending appointment')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingAppointments'] })
      toast.success('Appointment removed successfully')
      setShowDeleteModal(false)
      setAppointmentToDelete(null)
    },
    onError: () => {
      toast.error('Failed to remove appointment')
    },
    onSettled: () => {
      setDeleteLoading(false)
    }
  })

  const handleDeleteAppointment = (appointment: any) => {
    setAppointmentToDelete(appointment)
    setShowDeleteModal(true)
  }

  const handleConfirmDelete = () => {
    if (appointmentToDelete) {
      setDeleteLoading(true)
      deletePendingAppointment.mutate(appointmentToDelete.id)
    }
  }

  // Format date in a readable way
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(date)
  }

  // Get the color for the appointment type
  const getTypeColor = (typeName: string) => {
    const type = treatmentTypes.find(t => t.name === typeName)
    return type?.color || '#888888'
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pending Appointments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center">Loading...</div>
        </CardContent>
      </Card>
    )
  }

  if (pendingAppointments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pending Appointments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 text-center text-gray-500">
            No pending appointments
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ClipboardList size={18} />
          Pending Appointments ({pendingAppointments.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {pendingAppointments.map((appointment: any, index: number) => (
            <Draggable
              key={appointment.id}
              draggableId={appointment.id}
              index={index}
            >
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.draggableProps}
                  {...provided.dragHandleProps}
                  className="p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-400 cursor-grab active:cursor-grabbing shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: getTypeColor(appointment.type) }}
                        />
                        <span className="font-medium">{appointment.type}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <User size={14} />
                        <span>{appointment.patient?.firstName} {appointment.patient?.lastName}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar size={14} />
                        <span>{formatDate(appointment.startTime)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock size={14} />
                        <span>{appointment.duration} minutes</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <select
                        className="rounded-md border border-gray-300 text-sm py-1"
                        onChange={(e) => {
                          if (e.target.value) {
                            onAddToPractitioner(appointment, e.target.value)
                          }
                        }}
                        value=""
                      >
                        <option value="">Assign to...</option>
                        {practitioners.map((practitioner: any) => (
                          <option key={practitioner.id} value={practitioner.id}>
                            {practitioner.name}
                          </option>
                        ))}
                      </select>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500 hover:text-red-700"
                        onClick={() => handleDeleteAppointment(appointment)}
                      >
                        <Trash2 size={18} />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </Draggable>
          ))}
        </div>
      </CardContent>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        open={showDeleteModal}
        onOpenChange={setShowDeleteModal}
        title="Delete Appointment"
        description={`Are you sure you want to delete the appointment for ${appointmentToDelete?.patient?.firstName} ${appointmentToDelete?.patient?.lastName} on ${appointmentToDelete ? formatDate(appointmentToDelete.startTime) : ''}? This action cannot be undone.`}
        confirmText="Delete Appointment"
        cancelText="Cancel"
        variant="destructive"
        icon="delete"
        onConfirm={handleConfirmDelete}
        loading={deleteLoading}
      />
    </Card>
  )
}

export default PendingAppointmentsTable 