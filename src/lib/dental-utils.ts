import { prisma } from './prisma';
import { getToothType } from './utils';

/**
 * Syncs the dentalChart JSON for a patient from their dentalProcedures.
 * - Fetches all dental procedures for the patient
 * - Builds a new dentalChart JSON object (teeth, surfaces, procedures, etc.)
 * - Updates the patient.dentalChart field in the database
 * - Returns the new dentalChart object
 */
export async function syncDentalChartFromProcedures(patientId: string) {
  // Fetch all procedures for the patient
  const procedures = await prisma.dentalProcedure.findMany({
    where: { patientId },
    include: { code: true },
    orderBy: { date: 'asc' },
  });

  // Build the dentalChart JSON structure
  const teeth: any = {};
  for (const proc of procedures) {
    if (!proc.toothNumber) continue;
    const fdi = proc.toothNumber;
    if (!teeth[fdi]) {
      teeth[fdi] = { surfaces: {}, zones: {}, procedures: [] };
    }

    // Fillings (V-codes)
    if (proc.code.code.startsWith('V')) {
      // Use subSurfaces array and fillingMaterial from the procedure
      const surfaces = proc.subSurfaces || [];
      const material = proc.fillingMaterial || 'composite';

      // If no subSurfaces specified, default to occlusal
      if (surfaces.length === 0) {
        surfaces.push('occlusal');
      }

      // Determine creation status based on procedure status
      const creationStatus = proc.status === 'IN_PROGRESS' ? 'current'
        : proc.status === 'COMPLETED' ? 'history'
          : 'pending';

      // Apply filling to each surface AND zone (both are needed for visual rendering)
      surfaces.forEach(surface => {
        const procedureType = `filling-${creationStatus}-${material}`;
        teeth[fdi].surfaces[surface] = procedureType;
        teeth[fdi].zones[surface] = procedureType;
      });

      teeth[fdi].procedures.push({
        type: `filling-${creationStatus}-${material}`,
        surface: surfaces.join(', '),
        date: proc.date,
      });
    }
    // Crowns (R-codes)
    else if (proc.code.code.startsWith('R')) {
      // Determine creation status based on procedure status
      const creationStatus = proc.status === 'IN_PROGRESS' ? 'current'
        : proc.status === 'COMPLETED' ? 'history'
          : 'pending';

      // Extract material from notes or default to porcelain
      let material = 'porcelain';
      if (proc.notes) {
        if (proc.notes.includes('gold')) material = 'gold';
        else if (proc.notes.includes('porcelain')) material = 'porcelain';
      }

      teeth[fdi].wholeTooth = {
        type: 'crown',
        material: material,
        creationStatus: creationStatus,
      };
      teeth[fdi].procedures.push({
        type: 'crown',
        surface: 'whole',
        date: proc.date,
      });
    }
    // Extractions (H-codes)
    else if (proc.code.code.startsWith('H')) {
      teeth[fdi].wholeTooth = 'extraction';

      // Color all subsurfaces red for extraction
      const toothType = getToothType(fdi);
      const allSubsurfaces = [];

      if (toothType === 'molar') {
        // Molar subsurfaces
        allSubsurfaces.push(
          'buccal-1', 'buccal-2', 'cervical-buccal-1', 'cervical-buccal-2', 'triangle-3', 'triangle-4',
          'lingual-1', 'lingual-2', 'cervical-lingual-1', 'cervical-lingual-2', 'triangle-1', 'triangle-2',
          'occlusal-1', 'occlusal-2', 'occlusal-3', 'occlusal-4',
          'interdental-mesial', 'interdental-distal'
        );
      } else if (toothType === 'premolar') {
        // Premolar subsurfaces
        allSubsurfaces.push(
          'buccal', 'cervical-buccal', 'triangle-3', 'triangle-4',
          'lingual', 'cervical-lingual', 'triangle-1', 'triangle-2',
          'occlusal',
          'interdental-mesial', 'interdental-distal'
        );
      } else {
        // Anterior subsurfaces
        allSubsurfaces.push(
          'buccal', 'cervical-buccal', 'triangle-3', 'triangle-4',
          'lingual', 'cervical-lingual', 'triangle-1', 'triangle-2',
          'occlusal',
          'interdental-mesial', 'interdental-distal'
        );
      }

      // Color all subsurfaces red
      allSubsurfaces.forEach(subsurface => {
        teeth[fdi].zones[subsurface] = 'extraction';
      });

      teeth[fdi].procedures.push({
        type: 'extraction',
        surface: 'whole',
        date: proc.date,
      });
    }
    // Add more types as needed
  }

  const dentalChart = { teeth, toothTypes: {} };
  await prisma.patient.update({
    where: { id: patientId },
    data: { dentalChart },
  });
  return dentalChart;
} 