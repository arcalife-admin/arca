'use client';

import { useState, useEffect } from 'react';
import { Appointment, AppointmentType } from '@/types/appointment';
import { treatmentTypes } from '@/data/treatmentTypes';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface Patient {
  id: string;
  name: string;
  dateOfBirth?: string;
  gender?: string;
  email?: string;
  phone?: string;
  address?: string;
  bsn?: string;
  country?: string;
}

interface AppointmentFormProps {
  initialData?: Partial<Appointment>;
  onSubmit: (appointment: Partial<Appointment>) => void;
  onCancel: () => void;
  patients: Patient[];
  selectedDate?: Date | null;
  initialPractitionerId?: string | null;
  practitioners?: { id: string; firstName: string; lastName: string }[];
  isPendingMode?: boolean;
}

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

function PatientInfoModal({ patient, onClose }: { patient: any, onClose: () => void }) {
  if (!patient) return null;
  const gender = patient.gender ? patient.gender.charAt(0) + patient.gender.slice(1).toLowerCase() : '-';
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg p-6 min-w-[320px] max-w-[90vw] relative">
        <button className="absolute top-2 right-2 text-gray-500 hover:text-gray-700" onClick={onClose}>&times;</button>
        <h2 className="text-lg font-semibold mb-2">Patient Info</h2>
        <div className="space-y-1">
          <div><b>Name:</b> {patient.name}</div>
          <div><b>Date of Birth:</b> {new Date(patient.dateOfBirth).toLocaleDateString()}</div>
          <div><b>Gender:</b> {gender}</div>
          <div><b>Email:</b> {patient.email || '-'}</div>
          <div><b>Phone:</b> {patient.phone || '-'}</div>
          <div><b>Address:</b> {patient.address || '-'}</div>
          <div><b>BSN:</b> {patient.bsn || '-'}</div>
          <div><b>Country:</b> {patient.country || '-'}</div>
        </div>
      </div>
    </div>
  );
}

function normalizeDate(dateString: string): string[] {
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
  const compact = [
    `${day}${month}${year2}`,
    `${month}${day}${year2}`,
    `${day}${month}${year}`,
    `${month}${day}${year}`,
  ];
  return [us, gb, iso, ...compact];
}

function getTypeObject(type: any) {
  if (!type) return undefined;
  if (typeof type === 'string') {
    return treatmentTypes.find(t => t.name === type || t.id === type);
  }
  return type;
}

export function AppointmentForm({
  initialData,
  onSubmit,
  onCancel,
  patients,
  selectedDate,
  initialPractitionerId,
  practitioners,
  isPendingMode = false
}: AppointmentFormProps) {
  const [selectedType, setSelectedType] = useState<AppointmentType | undefined>(
    getTypeObject(initialData?.type)
  );
  const [selectedPatient, setSelectedPatient] = useState<string>(
    initialData?.patientId || ''
  );
  const [selectedPractitioner, setSelectedPractitioner] = useState<string>(
    initialData?.practitionerId || initialPractitionerId || practitioners[0]?.id || ''
  );
  const [startTime, setStartTime] = useState<Date>(() => {
    if (initialData?.startTime) {
      return new Date(initialData.startTime);
    }
    if (selectedDate) {
      return new Date(selectedDate);
    }
    return new Date();
  });
  const [duration, setDuration] = useState<number>(
    initialData?.duration ||
    (initialData?.startTime && initialData?.endTime
      ? Math.round((new Date(initialData.endTime).getTime() - new Date(initialData.startTime).getTime()) / 60000)
      : 30)
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [tooltipPatient, setTooltipPatient] = useState<any | null>(null);
  const [editingPatient, setEditingPatient] = useState<boolean>(!initialData?.patientId);
  const [notes, setNotes] = useState(initialData?.notes || '');

  const filteredPatients = patients.filter((patient) => {
    const search = searchQuery.trim().toLowerCase();
    return !search || [
      patient.name,
      patient.email || '',
      patient.phone,
      patient.address || '',
      ...(patient.dateOfBirth ? normalizeDate(patient.dateOfBirth).map((d) => d.toLowerCase()) : []),
    ].some((field) => String(field || '').toLowerCase().includes(search));
  });

  useEffect(() => {
    if (selectedDate && !initialData?.startTime) {
      setStartTime(selectedDate);
    }
  }, [selectedDate, initialData]);

  const selectedPatientObj = patients.find((p) => p.id === selectedPatient);

  const handleTypeChange = (typeId: string) => {
    const type = treatmentTypes.find(t => t.id === typeId);
    if (type) {
      setSelectedType(type);
      setDuration(type.duration);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedType || !selectedPatient || (!isPendingMode && !selectedPractitioner)) return;

    const endTime = new Date(startTime.getTime() + duration * 60000);

    onSubmit({
      ...initialData,
      type: selectedType,
      patientId: selectedPatient,
      practitionerId: isPendingMode ? null : selectedPractitioner,
      startTime,
      endTime,
      notes,
    });
  };

  return (
    <Card className="p-6">
      <form id="appointment-form" onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="patient">Patient</Label>
          <div className="relative">
            {editingPatient || !selectedPatientObj ? (
              <>
                <Input
                  type="text"
                  placeholder="Search patients..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full"
                />
                <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                  {filteredPatients.map((patient) => (
                    <div
                      key={patient.id}
                      className="p-2 hover:bg-gray-100 cursor-pointer flex justify-between items-center"
                      onClick={() => {
                        setSelectedPatient(patient.id);
                        setEditingPatient(false);
                        setSearchQuery('');
                      }}
                    >
                      <span>{patient.name}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setTooltipPatient(patient);
                        }}
                      >
                        ℹ️
                      </Button>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-between p-2 border rounded-md">
                <span>{selectedPatientObj.name}</span>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setTooltipPatient(selectedPatientObj)}
                  >
                    ℹ️
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingPatient(true)}
                  >
                    ✏️
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="type">Appointment Type</Label>
          <Select value={selectedType?.id} onValueChange={handleTypeChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              {treatmentTypes.map((type) => (
                <SelectItem key={type.id} value={type.id}>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: type.color }}
                    />
                    {type.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {!isPendingMode && (
          <div className="space-y-2">
            <Label htmlFor="practitioner">Practitioner</Label>
            <Select value={selectedPractitioner} onValueChange={setSelectedPractitioner}>
              <SelectTrigger>
                <SelectValue placeholder="Select practitioner" />
              </SelectTrigger>
              <SelectContent>
                {(practitioners).map((practitioner) => (
                  <SelectItem key={practitioner.id} value={practitioner.id}>
                    {practitioner.firstName} {practitioner.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

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

        <div className="space-y-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any notes here..."
          />
        </div>
      </form>

      {tooltipPatient && (
        <PatientInfoModal
          patient={tooltipPatient}
          onClose={() => setTooltipPatient(null)}
        />
      )}
    </Card>
  );
} 