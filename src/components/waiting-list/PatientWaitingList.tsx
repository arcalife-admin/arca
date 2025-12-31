'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { WaitingListEntry } from '@/types/waiting-list';
import { useState, useEffect } from 'react';
import { Calendar, Plus, ArrowRight, Edit } from 'lucide-react';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { treatmentTypes } from '@/data/treatmentTypes';
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

export default function PatientWaitingList({
  patientId,
  onCreateEntry,
  limit = 5,
  showCreateButton = true
}: PatientWaitingListProps) {
  const { toast } = useToast();
  const router = useRouter();
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
      if (!response.ok) throw new Error('Failed to fetch waiting list');
      const data: WaitingListEntry[] = await response.json();
      const filtered = data.filter((e) => e.patientId === patientId);
      setEntries(filtered.slice(0, limit));
    } catch (err) {
      console.error(err);
      setError('Failed to load waiting list');
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

      if (!response.ok) throw new Error('Failed to move to pending');

      toast({
        title: 'Success',
        description: 'Appointment moved to pending list',
      });

      fetchEntries(); // Refresh
      setShowDetailModal(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to move appointment to pending',
        variant: 'destructive',
      });
    } finally {
      setMovingToPending(false);
    }
  };

  const getAppointmentColor = (typeName: string) => {
    const type = treatmentTypes.find(t => t.name === typeName);
    return type?.color || '#888888';
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Waiting List</CardTitle>
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
          <CardTitle className="text-lg">Waiting List</CardTitle>
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
            <CardTitle className="text-lg">Waiting List ({entries.length})</CardTitle>
            {showCreateButton && onCreateEntry && (
              <Button size="sm" onClick={onCreateEntry}>
                <Plus className="w-4 h-4 mr-1" />
                New Entry
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {entries.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-muted-foreground mb-4">No waiting list entries for this patient.</p>
              {showCreateButton && onCreateEntry && (
                <Button variant="outline" onClick={onCreateEntry}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Entry
                </Button>
              )}
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
                          {entry.waitingAppointment ? entry.waitingAppointment.type : 'Waiting list'}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={statusColors[entry.status]} variant="secondary">
                          {entry.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {entry.practitioner.firstName} {entry.practitioner.lastName}
                        </span>
                        {entry.waitingAppointment?.duration && (
                          <span className="text-xs text-muted-foreground">
                            {entry.waitingAppointment.duration}min
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
                    View All Entries
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
                  <DialogTitle>Waiting List Entry</DialogTitle>
                </div>
                <Button variant="outline" size="sm" onClick={handleEditEntry}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              </div>
            </DialogHeader>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Status:</span>
                <Badge className={statusColors[selectedEntry.status]} variant="secondary">
                  {selectedEntry.status}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Practitioner:</span>
                <span className="text-sm">
                  {selectedEntry.practitioner.firstName} {selectedEntry.practitioner.lastName}
                </span>
              </div>

              {selectedEntry.waitingAppointment && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Appointment Type:</span>
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: getAppointmentColor(selectedEntry.waitingAppointment.type) }}
                      />
                      <span className="text-sm">{selectedEntry.waitingAppointment.type}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Duration:</span>
                    <span className="text-sm">{selectedEntry.waitingAppointment.duration} minutes</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Priority:</span>
                    <Badge variant="outline">{selectedEntry.waitingAppointment.priority}</Badge>
                  </div>

                  {selectedEntry.waitingAppointment.startTime && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Preferred Time:</span>
                      <span className="text-sm">
                        {format(new Date(selectedEntry.waitingAppointment.startTime), 'MMM dd, yyyy HH:mm')}
                      </span>
                    </div>
                  )}

                  {selectedEntry.waitingAppointment.notes && (
                    <div>
                      <span className="text-sm font-medium">Appointment Notes:</span>
                      <p className="text-sm text-muted-foreground mt-1">
                        {selectedEntry.waitingAppointment.notes}
                      </p>
                    </div>
                  )}
                </>
              )}

              {selectedEntry.notes && (
                <div>
                  <span className="text-sm font-medium">Entry Notes:</span>
                  <p className="text-sm text-muted-foreground mt-1">{selectedEntry.notes}</p>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Created:</span>
                <span className="text-sm text-muted-foreground">
                  {format(new Date(selectedEntry.createdAt), 'MMM dd, yyyy')}
                </span>
              </div>
            </div>

            <DialogFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setShowDetailModal(false)}>
                Close
              </Button>
              {selectedEntry.waitingAppointment && selectedEntry.status === 'ACTIVE' && (
                <Button
                  onClick={handleMoveToPending}
                  disabled={movingToPending}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <ArrowRight className="w-4 h-4 mr-2" />
                  {movingToPending ? 'Moving...' : 'Move to Pending'}
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
} 