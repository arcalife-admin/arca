'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Card } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { treatmentTypes } from '@/data/treatmentTypes'
import { cn } from '@/lib/utils'
import { useSession } from 'next-auth/react'

// Define types for practitioners to avoid TypeScript errors
interface Practitioner {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
}

// New component specifically for the wizard
function NewAppointmentForm({
  isPendingMode,
  initialData,
  ...props
}: {
  isPendingMode: boolean;
  initialData?: any;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filteredPatients: any[];
  selectedPatient: string;
  setSelectedPatient: (id: string) => void;
  editingPatient: boolean;
  setEditingPatient: (editing: boolean) => void;
  selectedType: any;
  handleTypeChange: (id: string) => void;
  selectedPractitioner: string;
  setSelectedPractitioner: (id: string) => void;
  startTime: Date;
  setStartTime: (date: Date) => void;
  duration: number;
  setDuration: (duration: number) => void;
  notes: string;
  setNotes: (notes: string) => void;
  practitioners: Practitioner[];
  treatmentTypes: any[];
  onCancel: () => void;
  formatDateForInput: (date: Date) => string;
  showTreatmentTypes: boolean;
  setShowTreatmentTypes: (show: boolean) => void;
  selectedIndex: number;
  setSelectedIndex: (index: number) => void;
  handleKeyDown: (e: React.KeyboardEvent, patients: any[]) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="patient">Patient</Label>
        <div className="relative">
          {props.editingPatient ? (
            <>
              <input
                type="text"
                id="patient"
                placeholder="Search patients..."
                value={props.searchQuery}
                onChange={(e) => {
                  props.setSearchQuery(e.target.value);
                  props.setSelectedIndex(-1);
                }}
                onKeyDown={(e) => props.handleKeyDown(e, props.filteredPatients)}
                className={cn(
                  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
                  "file:border-0 file:bg-transparent file:text-sm file:font-medium",
                  "placeholder:text-muted-foreground",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  "disabled:cursor-not-allowed disabled:opacity-50",
                  "w-full"
                )}
                autoFocus
              />
              {props.searchQuery && props.filteredPatients.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                  {props.filteredPatients.map((patient: any, index: number) => (
                    <div
                      key={patient.id}
                      className={`px-4 py-2 cursor-pointer flex justify-between items-center ${index === props.selectedIndex ? 'bg-blue-50' : 'hover:bg-gray-100'
                        }`}
                      onClick={() => {
                        props.setSelectedPatient(patient.id);
                        props.setSearchQuery(patient.name);
                        props.setEditingPatient(false);
                        props.setSelectedIndex(-1);
                      }}
                    >
                      <span>
                        {patient.name} <span className="text-xs text-gray-500">({patient.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString() : '-'})</span>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div
              className="w-full px-3 py-2 border rounded-md bg-white text-gray-900 cursor-pointer hover:bg-gray-50"
              onClick={() => {
                props.setEditingPatient(true);
                props.setSearchQuery('');
              }}
            >
              {props.searchQuery || 'Select a patient...'}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="treatment-type">Treatment Type</Label>
        <div className="relative">
          <div
            className="w-full p-2 border rounded bg-white cursor-pointer flex items-center justify-between"
            onClick={() => props.setShowTreatmentTypes(!props.showTreatmentTypes)}
          >
            <span className="flex items-center gap-2">
              {props.selectedType ? (
                <>
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: props.selectedType.color }}
                  />
                  {props.selectedType.name}
                </>
              ) : (
                'Select treatment type'
              )}
            </span>
            <span className="text-gray-500">▼</span>
          </div>
          {props.showTreatmentTypes && (
            <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
              {props.treatmentTypes.map((type: any) => (
                <div
                  key={type.id}
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center gap-2"
                  onClick={() => {
                    props.handleTypeChange(type.id);
                    props.setShowTreatmentTypes(false);
                  }}
                >
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: type.color }}
                  />
                  {type.name}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {!isPendingMode && (
        <div className="space-y-2">
          <Label htmlFor="practitioner">Practitioner</Label>
          <select
            value={props.selectedPractitioner}
            onChange={(e) => props.setSelectedPractitioner(e.target.value)}
            className="w-full p-2 border rounded"
          >
            <option value="">Select practitioner</option>
            {props.practitioners && props.practitioners.length > 0 ? props.practitioners.map((practitioner) => (
              <option key={practitioner.id} value={practitioner.id}>
                {practitioner.firstName || ''} {practitioner.lastName || ''}
              </option>
            )) : <option value="" disabled>No practitioners available</option>}
          </select>
        </div>
      )}

      {!isPendingMode && (
        <div className="space-y-2">
          <Label htmlFor="start-time">Start Time</Label>
          <Input
            id="start-time"
            type="datetime-local"
            value={props.formatDateForInput(props.startTime)}
            onChange={(e) => props.setStartTime(new Date(e.target.value))}
          />
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="duration">Duration (minutes)</Label>
        <Input
          id="duration"
          type="number"
          value={props.duration}
          onChange={(e) => props.setDuration(Number(e.target.value))}
          min={5}
          step={5}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <textarea
          id="notes"
          placeholder="Add any additional notes..."
          value={props.notes}
          onChange={e => props.setNotes(e.target.value)}
          className="w-full p-2 border rounded"
        />
      </div>

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={props.onCancel}
          className="px-4 py-2 border rounded"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!props.selectedType || !props.selectedPatient || (!isPendingMode && !props.selectedPractitioner)}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
        >
          Create Appointment
        </button>
      </div>
    </div>
  );
}

const NewAppointmentWizard = () => {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [error, setError] = useState('')
  const [isPendingAppointment, setIsPendingAppointment] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPatient, setSelectedPatient] = useState('')
  const [selectedType, setSelectedType] = useState<any>(null)
  const [selectedPractitioner, setSelectedPractitioner] = useState('')
  const [startTime, setStartTime] = useState(new Date())
  const [duration, setDuration] = useState(30)
  const [notes, setNotes] = useState('')
  const [editingPatient, setEditingPatient] = useState(true)
  const [showTreatmentTypes, setShowTreatmentTypes] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      console.log('User not authenticated, redirecting to login');
      toast.error('Please log in to access this page');
      router.push('/login');
    }
  }, [status, router]);

  // Fetch patients
  const { data: patients = [] } = useQuery({
    queryKey: ['patients'],
    queryFn: async () => {
      const response = await fetch('/api/patients')
      if (!response.ok) {
        throw new Error('Failed to fetch patients')
      }
      const data = await response.json()
      return data.map((patient: any) => ({
        ...patient,
        name: `${patient.firstName} ${patient.lastName}`
      }))
    },
  })

  // Fetch practitioners with proper error handling - only when user is authenticated
  const { data: practitioners = [] } = useQuery({
    queryKey: ['practitioners', status],
    queryFn: async () => {
      // Don't attempt to fetch if not authenticated
      if (status !== 'authenticated') {
        console.log('Not authenticated, skipping practitioner fetch');
        return [];
      }

      try {
        const headers = new Headers();
        headers.append('Content-Type', 'application/json');
        // Add CSRF token if available
        const csrfToken = document.cookie.split('; ')
          .find(row => row.startsWith('next-auth.csrf-token='))
          ?.split('=')[1];
        if (csrfToken) {
          headers.append('X-CSRF-Token', csrfToken);
        }

        const response = await fetch('/api/practitioners', { headers });

        if (!response.ok) {
          console.error('Failed to fetch practitioners:', response.status);
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to fetch practitioners');
        }

        const data = await response.json();
        console.log('Fetched practitioners data:', data);
        return data;
      } catch (error) {
        console.error('Error in practitioners fetch:', error);
        toast.error('Failed to load practitioners. Please make sure you are logged in.');
        return [];
      }
    },
    enabled: status === 'authenticated',
    retry: 3,
    retryDelay: 1000,
    refetchOnWindowFocus: false
  })

  // Effect to log practitioner data for debugging
  useEffect(() => {
    console.log('Current practitioners state:', practitioners);
  }, [practitioners])

  const filteredPatients = patients.filter((patient: any) => {
    const search = searchQuery.trim().toLowerCase();
    return !search || [
      patient.name,
      patient.email || '',
      patient.phone,
      patient.address || '',
      patient.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString() : '',
    ].some((field) => String(field || '').toLowerCase().includes(search));
  });

  const createAppointment = useMutation({
    mutationFn: async (data: any) => {
      const endpoint = isPendingAppointment
        ? '/api/pending-appointments'
        : '/api/appointments'

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to create appointment')
      }

      return response.json()
    },
    onSuccess: () => {
      toast.success('Appointment created successfully')
      const redirectPath = isPendingAppointment
        ? '/dashboard/appointments?tab=pending'
        : '/dashboard/appointments'
      router.push(redirectPath)
    },
    onError: (error: Error) => {
      setError(error.message)
      toast.error('Failed to create appointment')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedType || !selectedPatient || (!isPendingAppointment && !selectedPractitioner)) return;

    const appointmentData = {
      type: selectedType,
      patientId: selectedPatient,
      practitionerId: isPendingAppointment ? null : selectedPractitioner,
      startTime: isPendingAppointment ? null : startTime,
      endTime: isPendingAppointment ? null : new Date(startTime.getTime() + duration * 60000),
      duration: duration,
      notes,
      status: isPendingAppointment ? 'PENDING' : 'SCHEDULED'
    };

    createAppointment.mutate(appointmentData);
  };

  const handleCancel = () => {
    router.push('/dashboard/appointments')
  }

  const handleTypeChange = (typeId: string) => {
    const type = treatmentTypes.find(t => t.id === typeId);
    if (type) {
      setSelectedType(type);
      setDuration(type.duration);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, patients: any[]) => {
    if (!patients.length) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev < patients.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < patients.length) {
          const patient = patients[selectedIndex];
          setSelectedPatient(patient.id);
          setSearchQuery(patient.name);
          setEditingPatient(false);
          setSelectedIndex(-1);
        }
        break;
      case 'Escape':
        setEditingPatient(false);
        setSelectedIndex(-1);
        break;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">New Appointment</h1>
        <p className="mt-1 text-sm text-gray-500">
          Schedule a new appointment for a patient
        </p>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Error
              </h3>
              <div className="mt-2 text-sm text-red-700">
                {error}
              </div>
            </div>
          </div>
        </div>
      )}

      <Card className="p-6">
        <div className="mb-6 flex items-center space-x-2">
          <Checkbox
            id="pendingAppointment"
            checked={isPendingAppointment}
            onCheckedChange={(checked) => setIsPendingAppointment(checked === true)}
          />
          <Label htmlFor="pendingAppointment">
            Add to pending appointments (no practitioner assigned yet)
          </Label>
        </div>

        <form onSubmit={handleSubmit}>

          <NewAppointmentForm
            isPendingMode={isPendingAppointment}
            initialData={null}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            filteredPatients={filteredPatients}
            selectedPatient={selectedPatient}
            setSelectedPatient={setSelectedPatient}
            editingPatient={editingPatient}
            setEditingPatient={setEditingPatient}
            selectedType={selectedType}
            handleTypeChange={handleTypeChange}
            selectedPractitioner={selectedPractitioner}
            setSelectedPractitioner={setSelectedPractitioner}
            startTime={startTime}
            setStartTime={setStartTime}
            duration={duration}
            setDuration={setDuration}
            notes={notes}
            setNotes={setNotes}
            practitioners={practitioners}
            treatmentTypes={treatmentTypes}
            onCancel={handleCancel}
            formatDateForInput={(date: Date) => {
              const dateObj = date instanceof Date ? date : new Date(date);
              if (isNaN(dateObj.getTime())) return '';
              const year = dateObj.getFullYear();
              const month = String(dateObj.getMonth() + 1).padStart(2, '0');
              const day = String(dateObj.getDate()).padStart(2, '0');
              const hours = String(dateObj.getHours()).padStart(2, '0');
              const minutes = String(dateObj.getMinutes()).padStart(2, '0');
              return `${year}-${month}-${day}T${hours}:${minutes}`;
            }}
            showTreatmentTypes={showTreatmentTypes}
            setShowTreatmentTypes={setShowTreatmentTypes}
            selectedIndex={selectedIndex}
            setSelectedIndex={setSelectedIndex}
            handleKeyDown={handleKeyDown}
          />
        </form>
      </Card>
    </div>
  )
}

export default NewAppointmentWizard