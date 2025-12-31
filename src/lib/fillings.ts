// Helper utilities for filling procedures
import { FillingMaterial } from '@/contexts/FillingOptionsContext';

export async function getFillingCode(material: FillingMaterial, surfaceCount: number) {
  const materialCodeMap: Record<FillingMaterial, string> = {
    composite: 'V9',
    glasionomeer: 'V8',
    amalgam: 'V7',
  };
  const prefix = materialCodeMap[material];
  const code = `${prefix}${surfaceCount}`; // e.g. V93

  try {
    const res = await fetch(`/api/dental-codes?search=${code}`);
    const all = await res.json();
    const found = all.find((c: any) => c.code === code);
    return found;
  } catch (error) {
    console.error('🎯 Error getting filling code:', error);
    return null;
  }
}

export async function getCodeByExact(code: string) {
  try {
    const res = await fetch(`/api/dental-codes?search=${code}`);
    const all = await res.json();
    return all.find((c: any) => c.code === code);
  } catch {
    return null;
  }
}

export async function createDentalProcedure(patientId: string, codeId: string, toothNumber: number, notes: string, status: string = 'IN_PROGRESS', subSurfaces?: string[], fillingMaterial?: string) {

  const requestBody = {
    codeId,
    toothNumber,
    notes,
    status,
    date: new Date().toISOString().split('T')[0],
    subSurfaces: subSurfaces || [],
    fillingMaterial: fillingMaterial || 'composite',
  };

  const response = await fetch(`/api/patients/${patientId}/dental-procedures`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('🎯 Failed to create dental procedure:', response.status, errorText);
    throw new Error(`Failed to create dental procedure: ${response.status} ${errorText}`);
  }

  const result = await response.json();
  return result.procedure; // Return the procedure data for undo stack
} 