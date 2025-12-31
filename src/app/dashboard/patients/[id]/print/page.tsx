'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { DentalChart } from '@/components/dental/DentalChart'
import PeriodontalChart from '@/components/dental/PeriodontalChart'
import { DentalChartData, PeriodontalChartData } from '@/types/dental'

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  email?: string;
  phone?: string;
  address: { display_name: string };
  bsn: string;
  patientCode: string;
}

interface DentalProcedure {
  id: string;
  date: string;
  toothNumber?: number;
  status: string;
  notes?: string;
  code: {
    code: string;
    description: string;
  };
}

interface PatientImage {
  id: string;
  url: string;
  createdAt: string;
  type: string;
  name: string;
}

const DEFAULT_SECTIONS = [
  'patientInfo',
  'dentalChart',
  'periodontalChart',
  'historyTreatments',
  'currentTreatments',
  'planTreatments',
  'xrayImages',
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
  const [procedures, setProcedures] = useState<DentalProcedure[]>([]);
  const [images, setImages] = useState<PatientImage[]>([]);
  const [dentalChart, setDentalChart] = useState<DentalChartData | null>(null);
  const [periodontalChart, setPeriodontalChart] = useState<PeriodontalChartData | null>(null);

  // Fetch primary data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [patientRes, procRes, imgRes, dentalRes] = await Promise.all([
          fetch(`/api/patients/${patientId}`),
          fetch(`/api/patients/${patientId}/dental-procedures`),
          fetch(`/api/patients/${patientId}/images`),
          fetch(`/api/patients/${patientId}/dental`),
        ]);

        if (patientRes.ok) setPatient(await patientRes.json());
        if (procRes.ok) setProcedures(await procRes.json());
        if (imgRes.ok) setImages(await imgRes.json());

        if (dentalRes.ok) {
          const dentalData = await dentalRes.json();
          setDentalChart(dentalData.dentalChart || null);
          setPeriodontalChart(dentalData.periodontalChart || null);
        }
      } catch (err) {
        console.error('Failed to load print data', err);
      }
    };
    fetchData();
  }, [patientId]);

  // Auto trigger print once everything is loaded
  useEffect(() => {
    if (patient && (dentalChart || !includedSections.includes('dentalChart')) && (periodontalChart || !includedSections.includes('periodontalChart'))) {
      // Slight delay to ensure DOM finished rendering
      const timer = setTimeout(() => {
        window.print();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [patient, dentalChart, periodontalChart, includedSections]);

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

  const sortedImages = [...images].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const printStyles = `@media print { .page-break { page-break-after: always; } .no-print { display: none !important; } }`;

  return (
    <div className="p-6 text-sm">
      <style>{printStyles}</style>
      {/* Non-print back button */}
      <div className="mb-4 print:hidden">
        <Button variant="outline" size="sm" onClick={() => router.back()}>Back</Button>
      </div>

      {/* Page 1 – patient info, dental & perio charts (placeholders) */}
      {(includedSections.includes('patientInfo') || includedSections.includes('dentalChart') || includedSections.includes('periodontalChart')) && (
        <div className="page-break">
          {includedSections.includes('patientInfo') && (
            <section className="mb-4">
              <h2 className="text-lg font-semibold mb-2">Patient Information</h2>
              <div className="space-y-1">
                <div><strong>Name: </strong>{patient.firstName} {patient.lastName}</div>
                <div><strong>Patient code: </strong>{patient.patientCode}</div>
                <div><strong>BSN: </strong>{patient.bsn}</div>
                <div><strong>DOB: </strong>{new Date(patient.dateOfBirth).toLocaleDateString()}</div>
                <div><strong>Gender: </strong>{patient.gender}</div>
                {patient.email && <div><strong>Email: </strong>{patient.email}</div>}
                {patient.phone && <div><strong>Phone: </strong>{patient.phone}</div>}
                <div><strong>Address: </strong>{patient.address.display_name}</div>
              </div>
            </section>
          )}

          {includedSections.includes('dentalChart') && dentalChart && (
            <section className="mb-4">
              <h2 className="text-lg font-semibold mb-2">Dental Chart</h2>
              <DentalChart
                procedures={procedures}
                toothTypes={dentalChart?.toothTypes || {}}
                readOnly
                activeTool={null}
                onToolChange={() => { }}
                patientId={patientId}
                onProcedureDeleted={() => { }}
                onProcedureCreated={() => { }}
                currentStatus="PENDING"
              />
            </section>
          )}

          {includedSections.includes('periodontalChart') && periodontalChart && (
            <section>
              <h2 className="text-lg font-semibold mb-2">Periodontal Chart</h2>
              <PeriodontalChart
                initialData={periodontalChart}
                dentalChartData={dentalChart ?? undefined}
                readOnly
                onSave={() => { }}
              />
            </section>
          )}
        </div>
      )}

      {/* Treatments */}
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
          <h2 className="text-lg font-semibold mb-2">Planned Treatments</h2>
          <TreatmentTable procedures={planProcedures} />
        </div>
      )}

      {/* Images */}
      {includedSections.includes('xrayImages') && sortedImages.length > 0 && (
        <div className="page-break">
          <h2 className="text-lg font-semibold mb-2">Images / X-rays</h2>
          <div className="grid grid-cols-2 gap-4">
            {sortedImages.map((img) => (
              <div key={img.id} className="break-inside-avoid">
                <img src={img.url} alt={img.name} className="w-full h-auto border" />
                <div className="text-xs mt-1">{new Date(img.createdAt).toLocaleDateString()} – {img.name}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

interface TreatmentTableProps {
  procedures: DentalProcedure[];
}

function TreatmentTable({ procedures }: TreatmentTableProps) {
  return (
    <table className="w-full border text-xs">
      <thead>
        <tr className="bg-gray-100">
          <th className="border px-2 py-1 text-left">Date</th>
          <th className="border px-2 py-1 text-left">Code</th>
          <th className="border px-2 py-1 text-left">Description</th>
          <th className="border px-2 py-1 text-left">Tooth</th>
          <th className="border px-2 py-1 text-left">Notes</th>
        </tr>
      </thead>
      <tbody>
        {procedures.map((p) => (
          <tr key={p.id}>
            <td className="border px-2 py-1 whitespace-nowrap">{new Date(p.date).toLocaleDateString()}</td>
            <td className="border px-2 py-1">{p.code.code}</td>
            <td className="border px-2 py-1">{p.code.description}</td>
            <td className="border px-2 py-1 text-center">{p.toothNumber ?? '-'}</td>
            <td className="border px-2 py-1">{p.notes || ''}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
} 