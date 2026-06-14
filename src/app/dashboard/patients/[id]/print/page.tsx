'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  email?: string;
  phone?: string;
  address: { display_name: string };
  cnp: string;
  patientCode: string;
}

interface SurgicalProcedure {
  id: string;
  date: string;
  status: string;
  notes?: string;
  bodyArea?: string | null;
  code: {
    code: string;
    description: string;
  };
}

interface PatientImage {
  id: string;
  url: string;
  createdAt?: string;
  dateTaken?: string;
  type: string;
  name?: string;
}

const DEFAULT_SECTIONS = [
  'patientInfo',
  'historyTreatments',
  'currentTreatments',
  'planTreatments',
  'beforeAfterImages',
] as const;

type SectionKey = typeof DEFAULT_SECTIONS[number];

export default function PrintPatientCardPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const patientId = params.id as string;

  const includedSections: SectionKey[] = useMemo(() => {
    const sectionsParam = searchParams.get('sections');
    if (!sectionsParam) return [...DEFAULT_SECTIONS];
    return sectionsParam.split(',').filter(Boolean) as SectionKey[];
  }, [searchParams]);

  const [patient, setPatient] = useState<Patient | null>(null);
  const [procedures, setProcedures] = useState<SurgicalProcedure[]>([]);
  const [images, setImages] = useState<PatientImage[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [patientRes, procRes, imgRes] = await Promise.all([
          fetch(`/api/patients/${patientId}`),
          fetch(`/api/patients/${patientId}/surgical-procedures`),
          fetch(`/api/patients/${patientId}/images`),
        ]);

        if (patientRes.ok) setPatient(await patientRes.json());
        if (procRes.ok) setProcedures(await procRes.json());
        if (imgRes.ok) setImages(await imgRes.json());
      } catch (err) {
        console.error('Failed to load print data', err);
      }
    };
    fetchData();
  }, [patientId]);

  useEffect(() => {
    if (patient) {
      const timer = setTimeout(() => window.print(), 500);
      return () => clearTimeout(timer);
    }
  }, [patient]);

  if (!patient) {
    return (
      <div className="p-4 flex flex-col items-center">
        <p>Loading print view…</p>
        <Button variant="outline" size="sm" onClick={() => router.back()} className="mt-2 print:hidden">
          Back
        </Button>
      </div>
    );
  }

  const historyProcedures = procedures.filter((p) => p.status === 'COMPLETED');
  const currentProcedures = procedures.filter((p) => p.status === 'IN_PROGRESS');
  const planProcedures = procedures.filter((p) => p.status === 'PENDING');
  const sortedImages = [...images].sort((a, b) => {
    const dateA = new Date(a.dateTaken || a.createdAt || 0).getTime();
    const dateB = new Date(b.dateTaken || b.createdAt || 0).getTime();
    return dateB - dateA;
  });
  const beforeImages = sortedImages.filter((img) => img.type === 'BEFORE_PHOTO');
  const afterImages = sortedImages.filter((img) => img.type === 'AFTER_PHOTO');
  const printStyles = `@media print { .page-break { page-break-after: always; } .no-print { display: none !important; } }`;

  return (
    <div className="p-6 text-sm">
      <style>{printStyles}</style>
      <div className="mb-4 print:hidden">
        <Button variant="outline" size="sm" onClick={() => router.back()}>Back</Button>
      </div>

      {includedSections.includes('patientInfo') && (
        <section className="mb-4 page-break">
          <h2 className="text-lg font-semibold mb-2">Patient Information</h2>
          <div className="space-y-1">
            <div><strong>Name: </strong>{patient.firstName} {patient.lastName}</div>
            <div><strong>Patient code: </strong>{patient.patientCode}</div>
            <div><strong>CNP: </strong>{patient.cnp}</div>
            <div><strong>DOB: </strong>{new Date(patient.dateOfBirth).toLocaleDateString()}</div>
            <div><strong>Gender: </strong>{patient.gender}</div>
            {patient.email && <div><strong>Email: </strong>{patient.email}</div>}
            {patient.phone && <div><strong>Phone: </strong>{patient.phone}</div>}
            <div><strong>Address: </strong>{patient.address.display_name}</div>
          </div>
        </section>
      )}

      {includedSections.includes('historyTreatments') && historyProcedures.length > 0 && (
        <div className="page-break">
          <h2 className="text-lg font-semibold mb-2">Treatment History</h2>
          <TreatmentTable procedures={historyProcedures} />
        </div>
      )}

      {includedSections.includes('currentTreatments') && currentProcedures.length > 0 && (
        <div className="page-break">
          <h2 className="text-lg font-semibold mb-2">Current Treatments</h2>
          <TreatmentTable procedures={currentProcedures} />
        </div>
      )}

      {includedSections.includes('planTreatments') && planProcedures.length > 0 && (
        <div className="page-break">
          <h2 className="text-lg font-semibold mb-2">Treatment Plan</h2>
          <TreatmentTable procedures={planProcedures} />
        </div>
      )}

      {(includedSections.includes('beforeAfterImages') || includedSections.includes('xrayImages' as SectionKey)) &&
        (beforeImages.length > 0 || afterImages.length > 0) && (
        <div>
          <h2 className="text-lg font-semibold mb-2">Before & After Photos</h2>
          {beforeImages.length > 0 && (
            <div className="mb-4">
              <h3 className="font-medium mb-2">Before</h3>
              <div className="grid grid-cols-2 gap-4">
                {beforeImages.map((img) => (
                  <div key={img.id} className="border p-2">
                    <img src={img.url} alt="Before" className="w-full h-auto" />
                    <p className="text-xs mt-1">{new Date(img.dateTaken || img.createdAt || '').toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          {afterImages.length > 0 && (
            <div>
              <h3 className="font-medium mb-2">After</h3>
              <div className="grid grid-cols-2 gap-4">
                {afterImages.map((img) => (
                  <div key={img.id} className="border p-2">
                    <img src={img.url} alt="After" className="w-full h-auto" />
                    <p className="text-xs mt-1">{new Date(img.dateTaken || img.createdAt || '').toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TreatmentTable({ procedures }: { procedures: SurgicalProcedure[] }) {
  return (
    <table className="w-full border-collapse text-xs">
      <thead>
        <tr className="border-b">
          <th className="text-left p-1">Date</th>
          <th className="text-left p-1">Code</th>
          <th className="text-left p-1">Description</th>
          <th className="text-left p-1">Area</th>
        </tr>
      </thead>
      <tbody>
        {procedures.map((p) => (
          <tr key={p.id} className="border-b">
            <td className="p-1">{new Date(p.date).toLocaleDateString()}</td>
            <td className="p-1">{p.code.code}</td>
            <td className="p-1">{p.code.description}</td>
            <td className="p-1 capitalize">{p.bodyArea || '—'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
