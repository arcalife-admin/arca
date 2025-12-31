import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

interface DentalProcedure {
  id: string;
  date: string;
  notes?: string;
  code: {
    code: string;
    description: string;
  };
  practitioner?: {
    firstName: string;
    lastName: string;
  };
}

interface ToothModalProps {
  tooth: {
    id: number;
    data: {
      procedures?: Array<{
        type: string;
        surface: string;
        date: string;
      }>;
    };
  };
  patientId: string;
  onClose: () => void;
  onRemoveProcedure: (id: number, surface: string) => void;
}

export function ToothModal({ tooth, patientId, onClose, onRemoveProcedure }: ToothModalProps) {
  const { id, data } = tooth;
  const [dbProcedures, setDbProcedures] = useState<DentalProcedure[]>([]);
  const [loading, setLoading] = useState(true);

  // Extract surface information from notes field
  const extractSurfacesFromNotes = (notes: string): string => {
    if (!notes) return '';

    // Look for pattern like "(mesial, lingual)" or "(d, o, b)"
    const surfaceMatch = notes.match(/\(([^)]+)\)/);
    if (surfaceMatch) {
      return surfaceMatch[1];
    }

    // Look for "surface" mentions
    if (notes.toLowerCase().includes('surface')) {
      return notes.split(' ').slice(-3, -1).join(' ') || '';
    }

    return '';
  };

  // Fetch dental procedures from database for this tooth
  useEffect(() => {
    const fetchProcedures = async () => {
      try {
        const response = await fetch(`/api/patients/${patientId}/dental-procedures`);
        if (response.ok) {
          const procedures = await response.json();
          // Filter procedures for this specific tooth
          const toothProcedures = procedures.filter((proc: any) => proc.toothNumber === id);
          setDbProcedures(toothProcedures);
        }
      } catch (error) {
        console.error('Error fetching dental procedures:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProcedures();
  }, [patientId, id]);

  // Define types for different procedure sources
  type ChartProcedure = {
    id: string;
    type: string;
    surface: string;
    date: string;
    source: 'chart';
  };

  type DatabaseProcedure = {
    id: string;
    type: string;
    surface: string;
    date: string;
    source: 'database';
    code: string;
    practitioner?: {
      firstName: string;
      lastName: string;
    };
  };

  type CombinedProcedure = ChartProcedure | DatabaseProcedure;

  // Combine local chart procedures with database procedures
  const allProcedures: CombinedProcedure[] = [
    // Local chart procedures
    ...(data?.procedures || []).map(proc => ({
      id: `local-${proc.type}-${proc.surface}`,
      type: proc.type,
      surface: proc.surface,
      date: proc.date,
      source: 'chart' as const
    })),
    // Database procedures
    ...dbProcedures.map(proc => ({
      id: proc.id,
      type: proc.code.description,
      surface: extractSurfacesFromNotes(proc.notes || ''),
      date: proc.date,
      source: 'database' as const,
      code: proc.code.code,
      practitioner: proc.practitioner
    }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-lg w-full">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Tooth {id} History</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {loading ? (
            <p className="text-gray-500 text-sm">Loading procedures...</p>
          ) : allProcedures.length > 0 ? (
            allProcedures.map((proc) => (
              <div
                key={proc.id}
                className="p-3 border rounded-md text-sm"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-medium">
                      {proc.source === 'database' && 'code' in proc && proc.code && (
                        <span className="text-blue-600 mr-2">{proc.code}</span>
                      )}
                      {proc.type}
                    </p>
                    {proc.surface && (
                      <p className="text-gray-600 mt-1">
                        <span className="font-medium">Surfaces:</span> {proc.surface}
                      </p>
                    )}
                    {proc.source === 'database' && 'practitioner' in proc && proc.practitioner && (
                      <p className="text-gray-500 text-xs mt-1">
                        by {proc.practitioner.firstName} {proc.practitioner.lastName}
                      </p>
                    )}
                    <p className="text-gray-400 text-xs mt-2">
                      {new Date(proc.date).toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={() => onRemoveProcedure(id, proc.surface || 'unknown')}
                    className="text-red-500 text-xs hover:underline ml-3"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-sm">No procedures found for this tooth.</p>
          )}
        </div>
        <DialogFooter>
          <button
            onClick={onClose}
            className="mt-4 inline-flex justify-center px-4 py-2 bg-gray-200 text-sm font-medium rounded-md hover:bg-gray-300"
          >
            Close
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 