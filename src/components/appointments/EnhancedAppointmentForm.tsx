'use client';

import { useState, useEffect } from 'react';
import { Appointment, AppointmentType, PatientWithCode, ReservationRequest } from '@/types/appointment';
import { useAppointmentProcedureTypes } from '@/hooks/useAppointmentProcedureTypes';
import { resolveAppointmentType } from '@/lib/appointment-procedure-types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar, Clock } from 'lucide-react';

interface EnhancedAppointmentFormProps {
  initialData?: Partial<Appointment>;
  onSubmit: (data: any) => void;
  onCancel: () => void;
  patients: PatientWithCode[];
  selectedDate?: Date | null;
  initialPractitionerId?: string | null;
  practitioners?: { id: string; firstName: string; lastName: string }[];
  isPendingMode?: boolean;
}

type AppointmentMode = 'regular' | 'reservation';

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
  const us = date.toLocaleDateString('ro-RO');
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
  selectedDate,
  initialPractitionerId,
  practitioners = [],
  isPendingMode = false
}: EnhancedAppointmentFormProps) {
  const { procedureTypes, loading: loadingProcedureTypes } = useAppointmentProcedureTypes();

  const [appointmentMode, setAppointmentMode] = useState<AppointmentMode>(() => {
    if (initialData?.appointmentType === 'RESERVATION' || initialData?.isReservation) {
      return 'reservation';
    }
    return 'regular';
  });
  const [selectedType, setSelectedType] = useState<AppointmentType | undefined>();
  const [selectedPatient, setSelectedPatient] = useState<string>(
    initialData?.patientId || ''
  );
  const [selectedPractitioner, setSelectedPractitioner] = useState<string>(() => {
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
    if (initialData?.duration) return initialData.duration;
    if (selectedType?.duration) return selectedType.duration;
    return 30;
  });
  const [notes, setNotes] = useState(initialData?.notes || '');

  const [reservationColor, setReservationColor] = useState<string>(() => {
    if (initialData?.reservationColor) {
      return initialData.reservationColor;
    }
    return '#3b82f6';
  });
  const [reservationPatient, setReservationPatient] = useState<string>(() => {
    if (initialData?.patientId && (initialData.isReservation || initialData.appointmentType === 'RESERVATION')) {
      return initialData.patientId;
    }
    return '';
  });

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
    if (!initialData?.type || procedureTypes.length === 0) return;

    const resolved = resolveAppointmentType(initialData.type, procedureTypes);
    if (resolved) {
      setSelectedType(resolved);
    }
  }, [initialData?.type, procedureTypes]);

  useEffect(() => {
    if (selectedDate && !initialData?.startTime) {
      setStartTime(selectedDate);
    }
  }, [selectedDate, initialData]);

  useEffect(() => {
    if (selectedType?.duration && !initialData?.id) {
      setDuration(selectedType.duration);
    }
  }, [selectedType, initialData?.id]);

  useEffect(() => {
    if (initialPractitionerId && !initialData?.practitionerId) {
      setSelectedPractitioner(initialPractitionerId);
    }
  }, [initialPractitionerId, initialData?.practitionerId]);

  useEffect(() => {
    if (initialData?.appointmentType === 'RESERVATION' || initialData?.isReservation) {
      setAppointmentMode('reservation');

      if (initialData.reservationColor) {
        setReservationColor(initialData.reservationColor);
      }

      if (initialData.patientId) {
        setReservationPatient(initialData.patientId);
      }
    } else {
      setAppointmentMode('regular');
    }
  }, [initialData]);

  const handleTypeChange = (typeId: string) => {
    const type = procedureTypes.find((t) => t.id === typeId);
    if (type) {
      setSelectedType(type);
      setDuration(type.duration);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (appointmentMode === 'reservation') {
      if (!selectedPractitioner) return;

      const reservationRequest: ReservationRequest = {
        practitionerId: selectedPractitioner,
        startTime,
        duration,
        notes,
        reservationColor,
        patientId: reservationPatient && reservationPatient !== 'none' ? reservationPatient : undefined,
      };

      onSubmit({
        isReservation: true,
        reservationRequest,
      });
    } else {
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
        <div className="space-y-4">
          <Label className="text-lg font-semibold">Tip programare</Label>
          <div className="grid grid-cols-2 gap-4">
            <Card
              className={`p-4 cursor-pointer border-2 transition-colors ${appointmentMode === 'regular' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
              onClick={() => setAppointmentMode('regular')}
            >
              <div className="flex flex-col items-center space-y-2">
                <Calendar className="h-8 w-8" />
                <span className="font-medium">Standard</span>
              </div>
            </Card>

            <Card
              className={`p-4 cursor-pointer border-2 transition-colors ${appointmentMode === 'reservation' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
              onClick={() => setAppointmentMode('reservation')}
            >
              <div className="flex flex-col items-center space-y-2">
                <Clock className="h-8 w-8" />
                <span className="font-medium">Rezervare</span>
              </div>
            </Card>
          </div>
        </div>

        {appointmentMode !== 'reservation' && (
          <div className="space-y-2">
            <Label htmlFor="type">Procedură</Label>
            <Select
              value={selectedType?.id || ''}
              onValueChange={handleTypeChange}
              disabled={loadingProcedureTypes}
            >
              <SelectTrigger>
                <SelectValue placeholder={loadingProcedureTypes ? 'Se încarcă procedurile...' : 'Selectați procedura'} />
              </SelectTrigger>
              <SelectContent>
                {procedureTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: type.color }}
                      />
                      <span>{type.description} ({type.duration}min)</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {appointmentMode === 'regular' && (
          <div className="space-y-2">
            <Label htmlFor="patient">Pacient</Label>
            {selectedPatient ? (
              <div className="flex items-center justify-between p-2 border rounded-md">
                <span>{patients.find(p => p.id === selectedPatient)?.firstName} {patients.find(p => p.id === selectedPatient)?.lastName}</span>
                <Button type="button" variant="ghost" size="sm" onClick={() => setSelectedPatient('')}>Schimbare</Button>
              </div>
            ) : (
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Căutați pacienți..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full"
                />
                {searchQuery && (
                  <div className="absolute z-20 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                    <div className="p-2 hover:bg-gray-100 cursor-pointer" onClick={() => { setSelectedPatient('') }}>Fără pacient</div>
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

        {appointmentMode === 'reservation' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reservationColor">Culoare rezervare</Label>
              <div className="flex items-center space-x-2">
                <Input
                  type="color"
                  value={reservationColor}
                  onChange={(e) => setReservationColor(e.target.value)}
                  className="w-12 h-10 p-1 rounded"
                />
                <span className="text-sm text-gray-600">Alegeți o culoare pentru această rezervare</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Pacient opțional (pentru rezervări legate de pacient)</Label>
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Căutați pacienți..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full"
                />
                {searchQuery && (
                  <div className="absolute z-20 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                    <div className="p-2 hover:bg-gray-100 cursor-pointer" onClick={() => { setReservationPatient('none'); setSearchQuery(''); }}>Fără pacient</div>
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
                <p className="text-sm text-gray-600">Selectat: {patients.find(p => p.id === reservationPatient)?.firstName} {patients.find(p => p.id === reservationPatient)?.lastName}</p>
              )}
            </div>
          </div>
        )}

        {!isPendingMode && selectedPractitioner && (
          <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
            Practician: {practitioners.find(p => p.id === selectedPractitioner)?.firstName} {practitioners.find(p => p.id === selectedPractitioner)?.lastName}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="startTime">Ora de început</Label>
            <Input
              type="datetime-local"
              value={formatDateForInput(startTime)}
              onChange={(e) => setStartTime(new Date(e.target.value))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration">Durată (minute)</Label>
            <Input
              type="number"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              min={5}
              step={5}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Notițe</Label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Adăugați notițe aici..."
            rows={3}
          />
        </div>
      </form>
    </Card>
  );
}
