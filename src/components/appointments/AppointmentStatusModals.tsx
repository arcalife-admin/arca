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
      setError('Introduceți un număr valid de minute (1-999)');
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
            Pacientul întârzie
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Cu câte minute întârzie <strong>{patientName}</strong>?
          </p>

          <div className="space-y-2">
            <Label htmlFor="minutes">Minute întârziere</Label>
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
              placeholder="Introduceți minutele..."
              className="w-full"
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Anulare
          </Button>
          <Button onClick={handleConfirm} className="bg-orange-500 hover:bg-orange-600">
            Setare status
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
      setError('Introduceți o notă importantă');
      return;
    }

    if (note.length > 500) {
      setError('Nota trebuie să aibă maximum 500 de caractere');
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
            Alertă importantă
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Adăugați o notă importantă pentru programarea pacientului <strong>{patientName}</strong>:
          </p>

          <div className="space-y-2">
            <Label htmlFor="note">Notă importantă</Label>
            <Textarea
              id="note"
              value={note}
              onChange={(e) => {
                setNote(e.target.value);
                setError('');
              }}
              placeholder="Introduceți o notă importantă vizibilă la trecerea cursorului..."
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
            Anulare
          </Button>
          <Button onClick={handleConfirm} className="bg-red-500 hover:bg-red-600">
            Setare alertă
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
            Setați statusul pentru <strong>{patientName}</strong> la „{config.label}"?
          </p>
          <p className="text-xs text-gray-500">
            {config.description}
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Anulare
          </Button>
          <Button
            onClick={handleConfirm}
            style={{ backgroundColor: config.color }}
            className="text-white hover:opacity-90"
          >
            Confirmare
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
            Ștergere status important
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Sigur doriți să ștergeți statusul important pentru <strong>{patientName}</strong>?
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
              Ștergeți și notițele importante din programare
            </label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Anulare
          </Button>
          <Button onClick={handleConfirm} className="bg-red-500 hover:bg-red-600">
            Ștergere status
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 