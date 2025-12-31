'use client';

import { useState, useEffect } from 'react';
import { Appointment, AppointmentType, PatientWithCode, FamilyGroup, FamilyAppointmentRequest, ReservationRequest } from '@/types/appointment';
import { treatmentTypes } from '@/data/treatmentTypes';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Users, Calendar, Clock, Palette } from 'lucide-react';

interface EnhancedAppointmentFormProps {
  initialData?: Partial<Appointment>;
  onSubmit: (data: any) => void;
  onCancel: () => void;
  patients: PatientWithCode[];
  familyGroups: FamilyGroup[];
  selectedDate?: Date | null;
  initialPractitionerId?: string | null;
  practitioners?: { id: string; firstName: string; lastName: string }[];
  isPendingMode?: boolean;
}

type AppointmentMode = 'regular' | 'family' | 'reservation';

function formatDateForInput(date: Date | string): string {
  const dateObj = date instanceof Date ? date : new Date(date);
  if (isNaN(dateObj.getTime())) {
    console.error('Invalid date:', date);
    return '';
  }
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  const hours = String(dateObj.getHours()).padStart(2, '0');
  const minutes = String(dateObj.getMinutes()).padStart(2, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function normalizeDateLocal(dateString: string): string[] {
  if (!dateString) return [];
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return [dateString];
  const us = date.toLocaleDateString('en-US');
  const gb = date.toLocaleDateString('en-GB');
  const iso = date.toISOString().slice(0, 10);
  const pad = (n: number) => n.toString().padStart(2, '0');
  const day = pad(date.getDate());
  const month = pad(date.getMonth() + 1);
  const year = date.getFullYear().toString();
  const year2 = year.slice(-2);
  return [us, gb, iso, `${day}${month}${year2}`, `${month}${day}${year2}`, `${day}${month}${year}`, `${month}${day}${year}`];
}

export function EnhancedAppointmentForm({
  initialData,
  onSubmit,
  onCancel,
  patients,
  familyGroups,
  selectedDate,
  initialPractitionerId,
  practitioners = [],
  isPendingMode = false
}: EnhancedAppointmentFormProps) {
  const [appointmentMode, setAppointmentMode] = useState<AppointmentMode>(() => {
    // Initialize appointment mode based on initial data
    if (initialData?.appointmentType === 'FAMILY') {
      console.log('Initial appointment mode: family');
      return 'family';
    } else if (initialData?.appointmentType === 'RESERVATION' || initialData?.isReservation) {
      console.log('Initial appointment mode: reservation');
      return 'reservation';
    }
    console.log('Initial appointment mode: regular');
    return 'regular';
  });
  const [selectedType, setSelectedType] = useState<AppointmentType | undefined>(() => {
    // Handle different formats of initialData.type
    if (!initialData?.type) return undefined;

    if (typeof initialData.type === 'string') {
      // If it's a string, find the matching treatment type by name only
      return treatmentTypes.find(t => t.name === (initialData.type as unknown as string));
    } else if (typeof initialData.type === 'object' && initialData.type !== null) {
      // If it's already an object, use it directly
      return initialData.type as AppointmentType;
    }

    return undefined;
  });
  const [selectedPatient, setSelectedPatient] = useState<string>(
    initialData?.patientId || ''
  );
  const [selectedPractitioner, setSelectedPractitioner] = useState<string>(() => {
    // Priority: existing appointment's practitioner > initial practitioner > first available practitioner
    return initialData?.practitionerId || initialPractitionerId || practitioners[0]?.id || '';
  });
  const [startTime, setStartTime] = useState<Date>(() => {
    if (initialData?.startTime) {
      return new Date(initialData.startTime);
    }
    if (selectedDate) {
      return new Date(selectedDate);
    }
    return new Date();
  });
  const [duration, setDuration] = useState<number>(() => {
    // If we have initial data with duration, use that
    if (initialData?.duration) return initialData.duration;

    // If we have a selected type, use its duration
    if (selectedType?.duration) return selectedType.duration;

    // Default to 30 minutes
    return 30;
  });
  const [notes, setNotes] = useState(initialData?.notes || '');

  // Family appointment specific states
  const [selectedFamilyHeadCode, setSelectedFamilyHeadCode] = useState<string>('');
  const [selectedFamilyMembers, setSelectedFamilyMembers] = useState<string[]>([]);
  const [familySearch, setFamilySearch] = useState('');

  // Reservation specific states
  const [reservationColor, setReservationColor] = useState<string>(() => {
    // Initialize with existing reservation color if editing a reservation
    if (initialData?.reservationColor) {
      console.log('Initial reservation color from props:', initialData.reservationColor);
      return initialData.reservationColor;
    }
    return '#3b82f6';
  });
  const [reservationPatient, setReservationPatient] = useState<string>(() => {
    // Initialize with existing patient for reservation if editing
    if (initialData?.patientId && (initialData.isReservation || initialData.appointmentType === 'RESERVATION')) {
      console.log('Initial reservation patient from props:', initialData.patientId);
      return initialData.patientId;
    }
    return '';
  });

  // Get all individual patients (not in families) plus all patients for reservations
  const individualPatients = patients.filter(p => !p.familyHeadCode);
  const allPatients = patients; // For reservations, show all patients

  const [editingPatient, setEditingPatient] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const filteredPatients = patients.filter((p) => {
    const search = searchQuery.trim().toLowerCase();
    if (!search) return true;
    return [
      p.firstName + ' ' + p.lastName,
      p.patientCode,
      p.email || '',
      p.phone || '',
      ...(p.dateOfBirth ? normalizeDateLocal(typeof p.dateOfBirth === 'string' ? p.dateOfBirth : new Date(p.dateOfBirth).toISOString()).map((d) => d.toLowerCase()) : []),
    ].some((field) => String(field || '').toLowerCase().includes(search));
  });

  useEffect(() => {
    if (selectedDate && !initialData?.startTime) {
      setStartTime(selectedDate);
    }
  }, [selectedDate, initialData]);

  // Update duration when selectedType changes (but only if not editing existing appointment)
  useEffect(() => {
    if (selectedType?.duration && !initialData?.id) {
      setDuration(selectedType.duration);
    }
  }, [selectedType, initialData?.id]);

  // Update selectedPractitioner when initialPractitionerId changes (when practitioner selection is hidden)
  useEffect(() => {
    if (initialPractitionerId && !initialData?.practitionerId) {
      setSelectedPractitioner(initialPractitionerId);
    }
  }, [initialPractitionerId, initialData?.practitionerId]);

  useEffect(() => {
    console.log('Form initialization debug:', {
      initialData,
      appointmentType: initialData?.appointmentType,
      isReservation: initialData?.isReservation,
      reservationColor: initialData?.reservationColor,
      allFields: initialData
    });

    // Clear all modes first
    setAppointmentMode('regular');

    if (initialData?.appointmentType === 'FAMILY') {
      console.log('Setting family appointment mode');
      setAppointmentMode('family');
    } else if (initialData?.appointmentType === 'RESERVATION' || initialData?.isReservation) {
      console.log('Setting reservation appointment mode');
      setAppointmentMode('reservation');

      // Set reservation color
      if (initialData.reservationColor) {
        console.log('Setting reservation color from initialData:', initialData.reservationColor);
        setReservationColor(initialData.reservationColor);
      }

      // Set reservation patient if connected
      if (initialData.patientId) {
        console.log('Setting reservation patient from initialData:', initialData.patientId);
        setReservationPatient(initialData.patientId);
      }
    }
  }, [initialData]);

  const handleTypeChange = (typeId: string) => {
    const type = treatmentTypes.find(t => t.id === typeId);
    if (type) {
      setSelectedType(type);
      setDuration(type.duration);
    }
  };

  const handleFamilyChange = (familyHeadCode: string) => {
    setSelectedFamilyHeadCode(familyHeadCode);
    setSelectedFamilyMembers([]);
    const family = familyGroups.find(f => f.familyHeadCode === familyHeadCode);
    if (family && family.patients.length > 0) {
      // Auto-select all family members
      setSelectedFamilyMembers(family.patients.map(p => p.patientCode));
    }
  };

  const toggleFamilyMember = (patientCode: string) => {
    setSelectedFamilyMembers(prev =>
      prev.includes(patientCode)
        ? prev.filter(code => code !== patientCode)
        : [...prev, patientCode]
    );
  };

  const getSelectedFamily = () => familyGroups.find(f => f.familyHeadCode === selectedFamilyHeadCode);
  const selectedFamilyData = getSelectedFamily();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();



    if (appointmentMode === 'family') {
      if (!selectedType || !selectedFamilyHeadCode || selectedFamilyMembers.length === 0 || !selectedPractitioner) {
        console.log('Family appointment validation failed:', {
          selectedType: !!selectedType,
          selectedFamilyHeadCode: !!selectedFamilyHeadCode,
          selectedFamilyMembers: selectedFamilyMembers.length,
          selectedPractitioner: !!selectedPractitioner
        });
        return;
      }

      const familyRequest: FamilyAppointmentRequest = {
        familyHeadCode: selectedFamilyHeadCode,
        selectedPatientCodes: selectedFamilyMembers,
        practitionerId: selectedPractitioner,
        startTime,
        duration,
        type: selectedType,
        notes,
      };

      console.log('Submitting family appointment:', {
        familyRequest,
        selectedFamilyMembers,
        fullSubmissionData: {
          isFamilyAppointment: true,
          familyAppointmentRequest: familyRequest,
        }
      });

      onSubmit({
        isFamilyAppointment: true,
        familyAppointmentRequest: familyRequest,
      });
    } else if (appointmentMode === 'reservation') {
      if (!selectedPractitioner) return;

      const reservationRequest: ReservationRequest = {
        practitionerId: selectedPractitioner,
        startTime,
        duration,
        notes,
        reservationColor,
        patientId: reservationPatient && reservationPatient !== 'none' ? reservationPatient : undefined,
      };

      console.log('Submitting reservation with color:', {
        reservationColor,
        reservationRequest,
        fullSubmissionData: {
          isReservation: true,
          reservationRequest: reservationRequest,
        }
      });

      onSubmit({
        isReservation: true,
        reservationRequest: reservationRequest,
      });
    } else {
      // Regular appointment
      if (!selectedType || !selectedPatient || (!isPendingMode && !selectedPractitioner)) return;

      const endTime = new Date(startTime.getTime() + duration * 60000);

      onSubmit({
        ...initialData,
        type: selectedType,
        patientId: selectedPatient,
        practitionerId: isPendingMode ? null : selectedPractitioner,
        startTime,
        endTime,
        duration,
        notes,
      });
    }
  };

  return (
    <Card className="p-6 max-w-2xl mx-auto">
      <form id="appointment-form" onSubmit={handleSubmit} className="space-y-6">
        {/* Appointment Type Selection */}
        <div className="space-y-4">
          <Label className="text-lg font-semibold">Appointment Type</Label>
          <div className="grid grid-cols-3 gap-4">
            <Card
              className={`p-4 cursor-pointer border-2 transition-colors ${appointmentMode === 'regular' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
              onClick={() => setAppointmentMode('regular')}
            >
              <div className="flex flex-col items-center space-y-2">
                <Calendar className="h-8 w-8" />
                <span className="font-medium">Regular</span>
                {/* <span className="text-sm text-gray-500 text-center">Standard patient appointment</span> */}
              </div>
            </Card>

            <Card
              className={`p-4 cursor-pointer border-2 transition-colors ${appointmentMode === 'family' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
              onClick={() => setAppointmentMode('family')}
            >
              <div className="flex flex-col items-center space-y-2">
                <Users className="h-8 w-8" />
                <span className="font-medium">Family</span>
                {/* <span className="text-sm text-gray-500 text-center">Multiple family members</span> */}
              </div>
            </Card>

            <Card
              className={`p-4 cursor-pointer border-2 transition-colors ${appointmentMode === 'reservation' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
              onClick={() => setAppointmentMode('reservation')}
            >
              <div className="flex flex-col items-center space-y-2">
                <Clock className="h-8 w-8" />
                <span className="font-medium">Reservation</span>
                {/* <span className="text-sm text-gray-500 text-center">Block time slot</span> */}
              </div>
            </Card>
          </div>
        </div>

        {/* Treatment Type */}
        {appointmentMode !== 'reservation' && (
          <div className="space-y-2">
            <Label htmlFor="type">Treatment Type</Label>
            <Select value={selectedType?.id || ''} onValueChange={handleTypeChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select treatment type" />
              </SelectTrigger>
              <SelectContent>
                {treatmentTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: type.color }}
                      />
                      <span>{type.name} ({type.duration}min)</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Patient Selection for Regular Appointments (searchable) */}
        {appointmentMode === 'regular' && (
          <div className="space-y-2">
            <Label htmlFor="patient">Patient</Label>
            {selectedPatient ? (
              <div className="flex items-center justify-between p-2 border rounded-md">
                <span>{patients.find(p => p.id === selectedPatient)?.firstName} {patients.find(p => p.id === selectedPatient)?.lastName}</span>
                <Button type="button" variant="ghost" size="sm" onClick={() => setSelectedPatient('')}>Change</Button>
              </div>
            ) : (
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search patients..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full"
                />
                {searchQuery && (
                  <div className="absolute z-20 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                    <div className="p-2 hover:bg-gray-100 cursor-pointer" onClick={() => { setSelectedPatient('') }}>No patient</div>
                    {filteredPatients.map((patient) => (
                      <div
                        key={patient.id}
                        className="p-2 hover:bg-gray-100 cursor-pointer"
                        onClick={() => { setSelectedPatient(patient.id) }}
                      >
                        {patient.patientCode}: {patient.firstName} {patient.lastName}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Family Selection for Family Appointments */}
        {appointmentMode === 'family' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="familySearch">Select Family</Label>
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search families or patients..."
                  value={familySearch}
                  onChange={(e) => setFamilySearch(e.target.value)}
                />
                {familySearch && (
                  <div className="absolute z-20 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                    {familyGroups.flatMap(fam => {
                      const search = familySearch.toLowerCase();
                      const matchesFamilyCode = fam.familyHeadCode.toLowerCase().includes(search);

                      const matchingPatients = fam.patients.filter(p => [
                        p.firstName + ' ' + p.lastName,
                        p.patientCode,
                        p.email || '',
                        p.phone || ''
                      ].some(field => String(field).toLowerCase().includes(search)));

                      if (!matchesFamilyCode && matchingPatients.length === 0) return [];

                      // Build result entries
                      const entries = [] as JSX.Element[];
                      if (matchesFamilyCode) {
                        entries.push(
                          <div key={`fam-${fam.familyHeadCode}`} className="p-2 font-medium bg-gray-50 cursor-pointer hover:bg-gray-100" onClick={() => { handleFamilyChange(fam.familyHeadCode); setFamilySearch(''); }}>
                            Family {fam.familyHeadCode} ({fam.patients.length} members)
                          </div>
                        );
                      }
                      matchingPatients.forEach(pt => {
                        entries.push(
                          <div key={`pt-${pt.id}`} className="pl-4 pr-2 py-1 hover:bg-gray-100 cursor-pointer" onClick={() => { handleFamilyChange(fam.familyHeadCode); setFamilySearch(''); }}>
                            {pt.patientCode}: {pt.firstName} {pt.lastName} <span className="text-xs text-gray-500">(Family {fam.familyHeadCode})</span>
                          </div>
                        );
                      });
                      return entries;
                    })}
                  </div>
                )}
              </div>
            </div>

            {selectedFamilyData && (
              <div className="space-y-2">
                <Label>Select Family Members</Label>
                <div className="space-y-2 max-h-32 overflow-y-auto border rounded p-3">
                  {selectedFamilyData.patients.map((patient) => (
                    <div key={patient.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`member-${patient.id}`}
                        checked={selectedFamilyMembers.includes(patient.patientCode)}
                        onCheckedChange={() => toggleFamilyMember(patient.patientCode)}
                      />
                      <Label
                        htmlFor={`member-${patient.id}`}
                        className="cursor-pointer flex-1"
                      >
                        {patient.patientCode}: {patient.firstName} {patient.lastName}
                      </Label>
                    </div>
                  ))}
                </div>
                {selectedFamilyMembers.length > 0 && (
                  <p className="text-sm text-gray-600">
                    Selected: {selectedFamilyMembers.length} members
                    {duration > 0 && ` (Total time: ${selectedFamilyMembers.length * duration} minutes)`}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Reservation Settings */}
        {appointmentMode === 'reservation' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reservationColor">Reservation Color</Label>
              <div className="flex items-center space-x-2">
                <Input
                  type="color"
                  value={reservationColor}
                  onChange={(e) => setReservationColor(e.target.value)}
                  className="w-12 h-10 p-1 rounded"
                />
                <span className="text-sm text-gray-600">Choose a color for this reservation</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Optional Patient (for patient-related reservations)</Label>
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search patients..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full"
                />
                {searchQuery && (
                  <div className="absolute z-20 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                    <div className="p-2 hover:bg-gray-100 cursor-pointer" onClick={() => { setReservationPatient('none'); setSearchQuery(''); }}>No patient</div>
                    {filteredPatients.map((patient) => (
                      <div
                        key={patient.id}
                        className="p-2 hover:bg-gray-100 cursor-pointer"
                        onClick={() => { setReservationPatient(patient.id); setSearchQuery(''); }}
                      >
                        {patient.patientCode}: {patient.firstName} {patient.lastName}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {reservationPatient && reservationPatient !== 'none' && (
                <p className="text-sm text-gray-600">Selected: {patients.find(p => p.id === reservationPatient)?.firstName} {patients.find(p => p.id === reservationPatient)?.lastName}</p>
              )}
            </div>
          </div>
        )}

        {/* Practitioner Selection
        {!isPendingMode && (
          <div className="space-y-2">
            <Label htmlFor="practitioner">Practitioner</Label>
            <Select value={selectedPractitioner} onValueChange={setSelectedPractitioner}>
              <SelectTrigger>
                <SelectValue placeholder="Select practitioner" />
              </SelectTrigger>
              <SelectContent>
                {practitioners.map((practitioner) => (
                  <SelectItem key={practitioner.id} value={practitioner.id}>
                    {practitioner.firstName} {practitioner.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
                 )} */}

        {/* Debug: Show selected practitioner when dropdown is hidden */}
        {!isPendingMode && selectedPractitioner && (
          <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
            Practitioner: {practitioners.find(p => p.id === selectedPractitioner)?.firstName} {practitioners.find(p => p.id === selectedPractitioner)?.lastName}
          </div>
        )}

        {/* Date and Time */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="startTime">Start Time</Label>
            <Input
              type="datetime-local"
              value={formatDateForInput(startTime)}
              onChange={(e) => setStartTime(new Date(e.target.value))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration">Duration (minutes)</Label>
            <Input
              type="number"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              min={5}
              step={5}
            />
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any notes here..."
            rows={3}
          />
        </div>

        {/* Action Buttons - Handled by parent component with emoji buttons
        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">
            {appointmentMode === 'family' ? 'Create Family Appointments' :
              appointmentMode === 'reservation' ? 'Create Reservation' :
                initialData?.id ? 'Save Appointment' : 'Create Appointment'}
          </Button>
        </div> */}
      </form>
    </Card>
  );
} 