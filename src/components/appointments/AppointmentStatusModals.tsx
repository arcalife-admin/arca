import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AppointmentStatusType, AppointmentStatusMetadata, APPOINTMENT_STATUS_CONFIGS } from '@/types/appointment-status';

interface RunningLateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (minutes: number) => void;
  patientName: string;
}

export function RunningLateModal({ isOpen, onClose, onConfirm, patientName }: RunningLateModalProps) {
  const [minutes, setMinutes] = useState<string>('');
  const [error, setError] = useState<string>('');

  const handleConfirm = () => {
    const minutesNum = parseInt(minutes);
    if (isNaN(minutesNum) || minutesNum <= 0 || minutesNum > 999) {
      setError('Please enter a valid number of minutes (1-999)');
      return;
    }

    onConfirm(minutesNum);
    setMinutes('');
    setError('');
    onClose();
  };

  const handleClose = () => {
    setMinutes('');
    setError('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-lg">⏰</span>
            Patient Running Late
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            How many minutes is <strong>{patientName}</strong> running late?
          </p>

          <div className="space-y-2">
            <Label htmlFor="minutes">Minutes Late</Label>
            <Input
              id="minutes"
              type="number"
              min="1"
              max="999"
              value={minutes}
              onChange={(e) => {
                setMinutes(e.target.value);
                setError('');
              }}
              placeholder="Enter minutes..."
              className="w-full"
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} className="bg-orange-500 hover:bg-orange-600">
            Set Status
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface ImportantNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (note: string) => void;
  patientName: string;
}

export function ImportantNoteModal({ isOpen, onClose, onConfirm, patientName }: ImportantNoteModalProps) {
  const [note, setNote] = useState<string>('');
  const [error, setError] = useState<string>('');

  const handleConfirm = () => {
    if (!note || note.trim() === '') {
      setError('Please enter an important note');
      return;
    }

    if (note.length > 500) {
      setError('Note must be 500 characters or less');
      return;
    }

    onConfirm(note.trim());
    setNote('');
    setError('');
    onClose();
  };

  const handleClose = () => {
    setNote('');
    setError('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-lg">⚠️</span>
            Important Alert
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Add an important note for <strong>{patientName}</strong>'s appointment:
          </p>

          <div className="space-y-2">
            <Label htmlFor="note">Important Note</Label>
            <Textarea
              id="note"
              value={note}
              onChange={(e) => {
                setNote(e.target.value);
                setError('');
              }}
              placeholder="Enter important note that will be visible on hover..."
              className="w-full min-h-[100px] resize-none"
              maxLength={500}
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>{error && <span className="text-red-500">{error}</span>}</span>
              <span>{note.length}/500</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} className="bg-red-500 hover:bg-red-600">
            Set Alert
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface StatusConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  statusType: AppointmentStatusType;
  patientName: string;
}

export function StatusConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  statusType,
  patientName
}: StatusConfirmationModalProps) {
  const config = APPOINTMENT_STATUS_CONFIGS[statusType];

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-lg">{config.icon}</span>
            {config.label}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Set status for <strong>{patientName}</strong> to "{config.label}"?
          </p>
          <p className="text-xs text-gray-500">
            {config.description}
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            style={{ backgroundColor: config.color }}
            className="text-white hover:opacity-90"
          >
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface ClearImportantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (clearNotes: boolean) => void;
  patientName: string;
}

export function ClearImportantModal({ isOpen, onClose, onConfirm, patientName }: ClearImportantModalProps) {
  const [clearNotes, setClearNotes] = useState<boolean>(false);

  const handleConfirm = () => {
    onConfirm(clearNotes);
    setClearNotes(false);
    onClose();
  };

  const handleClose = () => {
    setClearNotes(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-lg">⚠️</span>
            Clear Important Status
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Are you sure you want to clear the important status for <strong>{patientName}</strong>?
          </p>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="clearNotes"
              checked={clearNotes}
              onChange={(e) => setClearNotes(e.target.checked)}
              className="rounded border-gray-300"
            />
            <label htmlFor="clearNotes" className="text-sm text-gray-700">
              Also remove important notes from appointment
            </label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} className="bg-red-500 hover:bg-red-600">
            Clear Status
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 