'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
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
import { Switch } from '@/components/ui/switch';
import { X, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { CreateWaitingListEntryData } from '@/types/waiting-list';
import { useAppointmentProcedureTypes } from '@/hooks/useAppointmentProcedureTypes';

const EMPTY_FORM_DATA = {
  patientId: '',
  practitionerId: '',
  notes: '',
  includeWaitingAppointment: false,
  appointmentTypeId: '',
  appointmentDuration: 30,
  appointmentNotes: '',
  appointmentPriority: 'medium',
  appointmentStartTime: '',
  appointmentEndTime: '',
};

interface WaitingListFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateWaitingListEntryData) => Promise<void>;
  patients: Array<{ id: string; firstName: string; lastName: string; patientCode: string }>;
  practitioners: Array<{ id: string; firstName: string; lastName: string; role: string }>;
  isLoading: boolean;
  initialPatientId?: string;
}

export default function WaitingListFormModal({
  isOpen,
  onClose,
  onSubmit,
  patients,
  practitioners,
  isLoading,
  initialPatientId,
}: WaitingListFormModalProps) {
  const { toast } = useToast();
  const { procedureTypes, loading: loadingProcedureTypes } = useAppointmentProcedureTypes();
  const [formData, setFormData] = useState(EMPTY_FORM_DATA);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        ...EMPTY_FORM_DATA,
        patientId: initialPatientId ?? '',
        includeWaitingAppointment: Boolean(initialPatientId),
      });
    }
  }, [isOpen, initialPatientId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.patientId || !formData.practitionerId) {
      toast({
        title: 'Eroare',
        description: 'Selectați pacientul și practicianul',
        variant: 'destructive',
      });
      return;
    }

    const submitData: CreateWaitingListEntryData = {
      patientId: formData.patientId,
      practitionerId: formData.practitionerId,
      notes: formData.notes.trim() || undefined,
    };

    const selectedProcedure = procedureTypes.find(
      (type) => type.id === formData.appointmentTypeId
    );

    if (formData.includeWaitingAppointment && selectedProcedure) {
      submitData.waitingAppointment = {
        type: selectedProcedure.name,
        duration: formData.appointmentDuration,
        notes: formData.appointmentNotes.trim() || undefined,
        priority: formData.appointmentPriority,
        startTime: formData.appointmentStartTime ? new Date(formData.appointmentStartTime) : undefined,
        endTime: formData.appointmentEndTime ? new Date(formData.appointmentEndTime) : undefined,
      };
    }

    try {
      await onSubmit(submitData);
      onClose();
    } catch (error) {
      // Error handling is done in the parent component
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adaugă pacient în lista de așteptare</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label>Pacient *</Label>
            <Select
              value={formData.patientId}
              onValueChange={(value) => setFormData(prev => ({ ...prev, patientId: value }))}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selectați un pacient" />
              </SelectTrigger>
              <SelectContent>
                {patients.map((patient) => (
                  <SelectItem key={patient.id} value={patient.id}>
                    {patient.firstName} {patient.lastName} ({patient.patientCode})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Practician *</Label>
            <Select
              value={formData.practitionerId}
              onValueChange={(value) => setFormData(prev => ({ ...prev, practitionerId: value }))}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selectați un practician" />
              </SelectTrigger>
              <SelectContent>
                {practitioners.map((practitioner) => (
                  <SelectItem key={practitioner.id} value={practitioner.id}>
                    {practitioner.firstName} {practitioner.lastName} ({practitioner.role})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Notițe</Label>
            <Textarea
              placeholder="Motivul adăugării în lista de așteptare..."
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              disabled={isLoading}
              rows={3}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              checked={formData.includeWaitingAppointment}
              onCheckedChange={(checked) =>
                setFormData(prev => ({ ...prev, includeWaitingAppointment: checked }))
              }
              disabled={isLoading}
            />
            <Label>Include programare în așteptare</Label>
          </div>

          {formData.includeWaitingAppointment && (
            <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
              <h4 className="font-medium">Detalii programare în așteptare</h4>

              <div className="space-y-2">
                <Label>Tip programare *</Label>
                <Select
                  value={formData.appointmentTypeId}
                  onValueChange={(value) => {
                    const type = procedureTypes.find((t) => t.id === value);
                    setFormData(prev => ({
                      ...prev,
                      appointmentTypeId: value,
                      appointmentDuration: type?.duration || 30
                    }));
                  }}
                  disabled={isLoading || loadingProcedureTypes}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={loadingProcedureTypes ? 'Se încarcă procedurile...' : 'Selectați tipul programării'} />
                  </SelectTrigger>
                  <SelectContent>
                    {procedureTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        <div className="flex items-center space-x-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: type.color }}
                          />
                          <span>{type.description} ({type.duration} min)</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Durată (minute)</Label>
                <Input
                  type="number"
                  min="5"
                  max="480"
                  step={5}
                  value={formData.appointmentDuration}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    appointmentDuration: parseInt(e.target.value) || 30
                  }))}
                  disabled={isLoading}
                />
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Anulează
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Adaugă în lista de așteptare
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 