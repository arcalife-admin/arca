'use client';

import { useEffect, useState } from 'react';
import { AppointmentType } from '@/types/appointment';
import {
  procedureCodesToAppointmentTypes,
  SurgicalProcedureCodeRecord,
} from '@/lib/appointment-procedure-types';

export function useAppointmentProcedureTypes() {
  const [procedureTypes, setProcedureTypes] = useState<AppointmentType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchProcedureTypes() {
      try {
        const response = await fetch('/api/surgical-procedure-codes');
        if (!response.ok) throw new Error('Failed to fetch procedure codes');

        const codes = (await response.json()) as SurgicalProcedureCodeRecord[];
        if (!cancelled) {
          setProcedureTypes(procedureCodesToAppointmentTypes(codes));
        }
      } catch (error) {
        console.error('Error fetching appointment procedure types:', error);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchProcedureTypes();

    return () => {
      cancelled = true;
    };
  }, []);

  return { procedureTypes, loading };
}
