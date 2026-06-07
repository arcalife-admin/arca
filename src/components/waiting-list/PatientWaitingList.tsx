'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { WaitingListEntry } from '@/types/waiting-list';
import { useState, useEffect } from 'react';
import { Calendar, Plus, ArrowRight, Edit } from 'lucide-react';
import { format } from 'date-fns';
import { dateFnsLocale } from '@/lib/date-locale';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAppointmentProcedureTypes } from '@/hooks/useAppointmentProcedureTypes';
import { resolveAppointmentType } from '@/lib/appointment-procedure-types';
import { useRouter } from 'next/navigation';

interface PatientWaitingListProps {
  patientId: string;
  onCreateEntry?: () => void;
  limit?: number;
  showCreateButton?: boolean;
}

const statusColors: Record<string, string> = {
  ACTIVE: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-gray-100 text-gray-800'
};

const statusLabels: Record<string, string> = {
  ACTIVE: 'Activ',
  COMPLETED: 'Finalizat',
  CANCELLED: 'Anulat',
};

const priorityLabels: Record<string, string> = {
  low: 'Scăzută',
  medium: 'Medie',
  high: 'Ridicată',
  urgent: 'Urgentă',
  LOW: 'Scăzută',
  MEDIUM: 'Medie',
  HIGH: 'Ridicată',
  URGENT: 'Urgentă',
};

export default function PatientWaitingList({
  patientId,
  onCreateEntry,
  limit = 5,
  showCreateButton = true
}: PatientWaitingListProps) {
  const { toast } = useToast();
  const router = useRouter();
  const { procedureTypes } = useAppointmentProcedureTypes();
  const [entries, setEntries] = useState<WaitingListEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<WaitingListEntry | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [movingToPending, setMovingToPending] = useState(false);

  const fetchEntries = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/waiting-list');
      if (!response.ok) throw new Error('Încărcarea listei de așteptare a eșuat');
      const data: WaitingListEntry[] = await response.json();
      const filtered = data.filter((e) => e.patientId === patientId);
      setEntries(filtered.slice(0, limit));
    } catch (err) {
      console.error(err);
      setError('Încărcarea listei de așteptare a eșuat');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, [patientId]);

  const handleEntryClick = (entry: WaitingListEntry) => {
    setSelectedEntry(entry);
    setShowDetailModal(true);
  };

  const handleEditEntry = () => {
    if (!selectedEntry) return;

    // Navigate to tasks page with waiting list view and practitioner selected
    const url = `/dashboard/tasks?view=waiting-list&practitionerId=${selectedEntry.practitionerId}`;
    router.push(url);
  };

  const handleMoveToPending = async () => {
    if (!selectedEntry?.waitingAppointment) return;

    setMovingToPending(true);
    try {
      const response = await fetch('/api/waiting-list/move-to-pending', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          waitingAppointmentId: selectedEntry.waitingAppointment.id,
        }),
      });

      if (!response.ok) throw new Error('Mutarea la programări în așteptare a eșuat');

      toast({
        title: 'Succes',
        description: 'Programarea a fost mutată la programări în așteptare',
      });

      fetchEntries(); // Refresh
      setShowDetailModal(false);
    } catch (error) {
      toast({
        title: 'Eroare',
        description: 'Mutarea programării la programări în așteptare a eșuat',
        variant: 'destructive',
      });
    } finally {
      setMovingToPending(false);
    }
  };

  const getAppointmentColor = (typeName: string) => {
    const type = resolveAppointmentType(typeName, procedureTypes);
    return type?.color || '#888888';
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Listă de așteptare</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Listă de așteptare</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Listă de așteptare ({entries.length})</CardTitle>
            {showCreateButton && onCreateEntry && (
              <Button size="sm" onClick={onCreateEntry}>
                <Plus className="w-4 h-4 mr-1" />
                Intrare nouă
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {entries.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-muted-foreground">Nu există intrări în lista de așteptare pentru acest pacient.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {entries.map((entry) => (
                <div
                  key={entry.id}
                  className="border rounded-lg p-3 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => handleEntryClick(entry)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        {entry.waitingAppointment && (
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: getAppointmentColor(entry.waitingAppointment.type) }}
                          />
                        )}
                        <span className="font-medium text-sm truncate">
                          {entry.waitingAppointment ? entry.waitingAppointment.type : 'Listă de așteptare'}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={statusColors[entry.status]} variant="secondary">
                          {statusLabels[entry.status] || entry.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {entry.practitioner.firstName} {entry.practitioner.lastName}
                        </span>
                        {entry.waitingAppointment?.duration && (
                          <span className="text-xs text-muted-foreground">
                            {entry.waitingAppointment.duration} min
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {entries.length >= limit && (
                <div className="text-center pt-2">
                  <Button variant="ghost" size="sm" onClick={onCreateEntry}>
                    Vezi toate intrările
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Waiting List Detail Modal */}
      {selectedEntry && (
        <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <div className="flex items-start justify-between">
                <div>
                  <DialogTitle>Intrare listă de așteptare</DialogTitle>
                </div>
                <Button variant="outline" size="sm" onClick={handleEditEntry}>
                  <Edit className="w-4 h-4 mr-2" />
                  Editează
                </Button>
              </div>
            </DialogHeader>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Stare:</span>
                <Badge className={statusColors[selectedEntry.status]} variant="secondary">
                  {statusLabels[selectedEntry.status] || selectedEntry.status}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Practician:</span>
                <span className="text-sm">
                  {selectedEntry.practitioner.firstName} {selectedEntry.practitioner.lastName}
                </span>
              </div>

              {selectedEntry.waitingAppointment && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Tip programare:</span>
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: getAppointmentColor(selectedEntry.waitingAppointment.type) }}
                      />
                      <span className="text-sm">{selectedEntry.waitingAppointment.type}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Durată:</span>
                    <span className="text-sm">{selectedEntry.waitingAppointment.duration} minute</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Prioritate:</span>
                    <Badge variant="outline">{priorityLabels[selectedEntry.waitingAppointment.priority] || selectedEntry.waitingAppointment.priority}</Badge>
                  </div>

                  {selectedEntry.waitingAppointment.startTime && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Oră preferată:</span>
                      <span className="text-sm">
                        {format(new Date(selectedEntry.waitingAppointment.startTime), 'd MMM yyyy HH:mm', { locale: dateFnsLocale })}
                      </span>
                    </div>
                  )}

                  {selectedEntry.waitingAppointment.notes && (
                    <div>
                      <span className="text-sm font-medium">Notițe programare:</span>
                      <p className="text-sm text-muted-foreground mt-1">
                        {selectedEntry.waitingAppointment.notes}
                      </p>
                    </div>
                  )}
                </>
              )}

              {selectedEntry.notes && (
                <div>
                  <span className="text-sm font-medium">Notițe intrare:</span>
                  <p className="text-sm text-muted-foreground mt-1">{selectedEntry.notes}</p>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Creat:</span>
                <span className="text-sm text-muted-foreground">
                  {format(new Date(selectedEntry.createdAt), 'd MMM yyyy', { locale: dateFnsLocale })}
                </span>
              </div>
            </div>

            <DialogFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setShowDetailModal(false)}>
                Închide
              </Button>
              {selectedEntry.waitingAppointment && selectedEntry.status === 'ACTIVE' && (
                <Button
                  onClick={handleMoveToPending}
                  disabled={movingToPending}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <ArrowRight className="w-4 h-4 mr-2" />
                  {movingToPending ? 'Se mută...' : 'Mută la programări în așteptare'}
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
} 