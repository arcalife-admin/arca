// Helper: determine tooth type
export function getToothType(toothId: number): 'molar' | 'premolar' | 'anterior' {
  // Molar: 16-18, 26-28, 36-38, 46-48
  if ((toothId >= 16 && toothId <= 18) || (toothId >= 26 && toothId <= 28) || (toothId >= 36 && toothId <= 38) || (toothId >= 46 && toothId <= 48)) return 'molar';
  // Premolar: 14-15, 24-25, 34-35, 44-45
  if ((toothId >= 14 && toothId <= 15) || (toothId >= 24 && toothId <= 25) || (toothId >= 34 && toothId <= 35) || (toothId >= 44 && toothId <= 45)) return 'premolar';
  // Anterior: 11-13, 21-23, 31-33, 41-43
  if ((toothId >= 11 && toothId <= 13) || (toothId >= 21 && toothId <= 23) || (toothId >= 31 && toothId <= 33) || (toothId >= 41 && toothId <= 43)) return 'anterior';
  return 'anterior';
}

// Create sealing procedures with proper V30/V35 logic
export async function createSealingProcedures(
  toothNumbers: number[],
  patientId: string,
  currentStatus: string = 'PENDING'
) {
  console.log('createSealingProcedures called with:', { toothNumbers, patientId, currentStatus });

  try {
    const response = await fetch('/api/dental-procedures/sealings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ toothNumbers, patientId, currentStatus }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API error response:', errorText);
      throw new Error(`Failed to create sealing procedures: ${response.status} ${errorText}`);
    }

    const procedures = await response.json();
    console.log('Created procedures:', procedures);
    return procedures;
  } catch (error) {
    console.error('Error creating sealing procedures:', error);
    throw error;
  }
} 