// Helper utilities for extraction procedures
import { ExtractionType } from '@/contexts/ExtractionOptionsContext';

export interface ExtractionCode {
  id: string;
  code: string;
  description: string;
  rate: number;
  points: number;
}

// Get the appropriate H-code based on extraction type
export async function getExtractionCode(type: ExtractionType): Promise<ExtractionCode | null> {
  try {
    const response = await fetch('/api/dental-codes');
    if (!response.ok) throw new Error('Failed to fetch dental codes');

    const codes = await response.json();

    let targetCode: string;

    switch (type) {
      case 'simple':
        targetCode = 'H11'; // Trekken tand of kies
        break;
      case 'surgical':
        targetCode = 'H35'; // Moeizaam trekken tand of kies met behulp van chirurgie
        break;
      case 'hemisection':
        targetCode = 'H33'; // Hemisectie van een molaar
        break;
      case 'impacted':
        targetCode = 'H34'; // Vrijleggen ingesloten tand of kies ter bevordering van de doorbraak
        break;
      default:
        targetCode = 'H11';
    }

    const extractionCode = codes.find((code: any) => code.code === targetCode);

    if (!extractionCode) {
      console.warn(`Extraction code ${targetCode} not found`);
      return null;
    }

    return {
      id: extractionCode.id,
      code: extractionCode.code,
      description: extractionCode.description,
      rate: extractionCode.rate || 0,
      points: extractionCode.points || 0,
    };
  } catch (error) {
    console.error('Error fetching extraction code:', error);
    return null;
  }
}

// Get code by exact code string (for additional procedures)
export async function getCodeByExact(codeString: string): Promise<ExtractionCode | null> {
  try {
    const response = await fetch('/api/dental-codes');
    if (!response.ok) throw new Error('Failed to fetch dental codes');

    const codes = await response.json();
    const code = codes.find((c: any) => c.code === codeString);

    if (!code) {
      console.warn(`Code ${codeString} not found`);
      return null;
    }

    return {
      id: code.id,
      code: code.code,
      description: code.description,
      rate: code.rate || 0,
      points: code.points || 0,
    };
  } catch (error) {
    console.error('Error fetching code:', error);
    return null;
  }
}

// Create a dental procedure in the database
export async function createDentalProcedure(
  patientId: string,
  codeId: string,
  toothNumber: number,
  notes: string,
  status: string = 'PENDING',
  subSurfaces?: string[],
  fillingMaterial?: string
): Promise<any> {
  const response = await fetch(`/api/patients/${patientId}/dental-procedures`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      codeId,
      toothNumber,
      notes,
      status,
      date: new Date().toISOString().split('T')[0],
      subSurfaces: subSurfaces || [],
      fillingMaterial: fillingMaterial || 'composite',
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to create dental procedure');
  }

  const result = await response.json();
  return result.procedure; // Return the procedure data for undo stack
}

// Create extraction procedures with related codes
export async function createExtractionProcedures(
  patientId: string,
  toothNumber: number,
  extractionType: ExtractionType,
  options: {
    suturing?: boolean;
    anesthesia?: boolean;
    c022?: boolean;
  },
  status: string = 'PENDING'
): Promise<any[]> {
  const createdProcedures: any[] = [];

  try {
    // Helper to get all subsurfaces for a tooth
    function getAllSubsurfaces(toothNumber: number): string[] {
      // Molar: 16-18, 26-28, 36-38, 46-48
      if ((toothNumber >= 16 && toothNumber <= 18) || (toothNumber >= 26 && toothNumber <= 28) ||
        (toothNumber >= 36 && toothNumber <= 38) || (toothNumber >= 46 && toothNumber <= 48)) {
        return [
          'buccal-1', 'buccal-2', 'cervical-buccal-1', 'cervical-buccal-2', 'triangle-3', 'triangle-4',
          'lingual-1', 'lingual-2', 'cervical-lingual-1', 'cervical-lingual-2', 'triangle-1', 'triangle-2',
          'occlusal-1', 'occlusal-2', 'occlusal-3', 'occlusal-4',
          'interdental-mesial', 'interdental-distal'
        ];
      }
      // Premolar: 14-15, 24-25, 34-35, 44-45
      if ((toothNumber >= 14 && toothNumber <= 15) || (toothNumber >= 24 && toothNumber <= 25) ||
        (toothNumber >= 34 && toothNumber <= 35) || (toothNumber >= 44 && toothNumber <= 45)) {
        return [
          'buccal', 'cervical-buccal', 'triangle-3', 'triangle-4',
          'lingual', 'cervical-lingual', 'triangle-1', 'triangle-2',
          'occlusal',
          'interdental-mesial', 'interdental-distal'
        ];
      }
      // Anterior: 11-13, 21-23, 31-33, 41-43
      return [
        'buccal', 'cervical-buccal', 'triangle-3', 'triangle-4',
        'lingual', 'cervical-lingual', 'triangle-1', 'triangle-2',
        'occlusal',
        'interdental-mesial', 'interdental-distal'
      ];
    }

    // Create main extraction procedure
    const extractionCode = await getExtractionCode(extractionType);
    if (extractionCode) {
      const extractionDescription = `${extractionCode.description} - tooth ${toothNumber}`;
      const extractionProcedure = await createDentalProcedure(
        patientId,
        extractionCode.id,
        toothNumber,
        extractionDescription,
        status,
        getAllSubsurfaces(toothNumber) // <-- Save all subsurfaces!
      );
      createdProcedures.push(extractionProcedure);
    }

    // Add suturing material cost if needed (H21)
    if (options.suturing && extractionType !== 'simple') {
      const h21 = await getCodeByExact('H21');
      if (h21) {
        const suturingProcedure = await createDentalProcedure(
          patientId,
          h21.id,
          toothNumber,
          'Kosten hechtmateriaal',
          status
        );
        createdProcedures.push(suturingProcedure);
      }

      // Add suturing procedure (H26) for complex cases
      const h26 = await getCodeByExact('H26');
      if (h26) {
        const h26Procedure = await createDentalProcedure(
          patientId,
          h26.id,
          toothNumber,
          'Hechten weke delen',
          status
        );
        createdProcedures.push(h26Procedure);
      }
    }

    // Add anesthesia if selected
    if (options.anesthesia) {
      const a10 = await getCodeByExact('A10');
      if (a10) {
        const anesthesiaProcedure = await createDentalProcedure(
          patientId,
          a10.id,
          toothNumber,
          'Local anesthesia',
          status
        );
        createdProcedures.push(anesthesiaProcedure);
      }
    }

    // Add C022 if selected
    if (options.c022) {
      const c022 = await getCodeByExact('C022');
      if (c022) {
        const c022Procedure = await createDentalProcedure(
          patientId,
          c022.id,
          toothNumber,
          'C022',
          status
        );
        createdProcedures.push(c022Procedure);
      }
    }

    return createdProcedures;
  } catch (error) {
    console.error('Error creating extraction procedures:', error);
    throw error;
  }
}

// Get extraction type label for display
export function getExtractionTypeLabel(type: ExtractionType): string {
  switch (type) {
    case 'simple':
      return 'Simple Extraction';
    case 'surgical':
      return 'Surgical Extraction';
    case 'hemisection':
      return 'Hemisection';
    case 'impacted':
      return 'Impacted Tooth';
    default:
      return 'Extraction';
  }
}

// Get extraction type icon/emoji
export function getExtractionTypeIcon(type: ExtractionType): string {
  switch (type) {
    case 'simple':
      return '🦷';
    case 'surgical':
      return '⚕️';
    case 'hemisection':
      return '✂️';
    case 'impacted':
      return '🔍';
    default:
      return '🦷';
  }
} 