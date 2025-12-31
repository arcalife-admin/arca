'use client';

import React, { useState } from 'react';
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
import { treatmentTypes } from '@/data/treatmentTypes';

interface WaitingListFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateWaitingListEntryData) => Promise<void>;
  patients: Array<{ id: string; firstName: string; lastName: string; patientCode: string }>;
  practitioners: Array<{ id: string; firstName: string; lastName: string; role: string }>;
  isLoading: boolean;
}

export default function WaitingListFormModal({
  isOpen,
  onClose,
  onSubmit,
  patients,
  practitioners,
  isLoading,
}: WaitingListFormModalProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    patientId: '',
    practitionerId: '',
    notes: '',
    includeWaitingAppointment: false,
    appointmentType: '',
    appointmentDuration: 30,
    appointmentNotes: '',
    appointmentPriority: 'medium',
    appointmentStartTime: '',
    appointmentEndTime: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.patientId || !formData.practitionerId) {
      toast({
        title: 'Error',
        description: 'Please select both patient and practitioner',
        variant: 'destructive',
      });
      return;
    }

    const submitData: CreateWaitingListEntryData = {
      patientId: formData.patientId,
      practitionerId: formData.practitionerId,
      notes: formData.notes.trim() || undefined,
    };

    if (formData.includeWaitingAppointment && formData.appointmentType) {
      submitData.waitingAppointment = {
        type: formData.appointmentType,
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
          <DialogTitle>Add Patient to Waiting List</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label>Patient *</Label>
            <Select
              value={formData.patientId}
              onValueChange={(value) => setFormData(prev => ({ ...prev, patientId: value }))}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a patient" />
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
            <Label>Practitioner *</Label>
            <Select
              value={formData.practitionerId}
              onValueChange={(value) => setFormData(prev => ({ ...prev, practitionerId: value }))}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a practitioner" />
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
            <Label>Notes</Label>
            <Textarea
              placeholder="Reason for waiting list..."
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
            <Label>Include waiting appointment</Label>
          </div>

          {formData.includeWaitingAppointment && (
            <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
              <h4 className="font-medium">Waiting Appointment Details</h4>

              <div className="space-y-2">
                <Label>Appointment Type *</Label>
                <Select
                  value={formData.appointmentType}
                  onValueChange={(value) => {
                    const type = treatmentTypes.find(t => t.name === value);
                    setFormData(prev => ({
                      ...prev,
                      appointmentType: value,
                      appointmentDuration: type?.duration || 30
                    }));
                  }}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select appointment type" />
                  </SelectTrigger>
                  <SelectContent>
                    {treatmentTypes.map((type) => (
                      <SelectItem key={type.name} value={type.name}>
                        {type.name} ({type.duration} min)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Duration (minutes)</Label>
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
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Add to Waiting List
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 