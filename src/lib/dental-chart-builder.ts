import { DentalProcedure } from '@/types/dental';

// Helper: determine tooth type
function getToothType(toothId: number): 'molar' | 'premolar' | 'anterior' {
  // Molar: 16-18, 26-28, 36-38, 46-48
  if ((toothId >= 16 && toothId <= 18) || (toothId >= 26 && toothId <= 28) || (toothId >= 36 && toothId <= 38) || (toothId >= 46 && toothId <= 48)) return 'molar';
  // Premolar: 14-15, 24-25, 34-35, 44-45
  if ((toothId >= 14 && toothId <= 15) || (toothId >= 24 && toothId <= 25) || (toothId >= 34 && toothId <= 35) || (toothId >= 44 && toothId <= 45)) return 'premolar';
  // Anterior: 11-13, 21-23, 31-33, 41-43
  if ((toothId >= 11 && toothId <= 13) || (toothId >= 21 && toothId <= 23) || (toothId >= 31 && toothId <= 33) || (toothId >= 41 && toothId <= 43)) return 'anterior';
  return 'anterior';
}

export interface DentalChartData {
  teeth: Record<number, {
    isDisabled?: boolean;
    isImplant?: boolean;
    wholeTooth?: string | {
      type: string;
      material?: string;
      creationStatus?: string;
      bridgeId?: string;
      role?: string;
      originalState?: string;
    };
    surfaces?: Record<string, string>;
    zones?: Record<string, string>;
    procedures?: Array<{
      type: string;
      surface: string;
      date: string;
    }>;
  }>;
  toothTypes?: Record<number, string>;
}

/**
 * SIMPLE: Build dental chart from procedures using subSurfaces and fillingMaterial
 * Disabled teeth are now stored as invisible procedures in the database
 */
export function proceduresToToothData(procedures: DentalProcedure[], toothTypes: Record<number, string> = {}, savedDentalChart?: any) {
  const toothData: Record<number, any> = {};

  // No need to preserve disabled teeth from saved data - they are now stored as procedures

  // Process regular procedures
  procedures.forEach(procedure => {
    const toothNumber = procedure.toothNumber;
    if (!toothNumber) return;

    // Skip disabled procedures - they are handled separately
    if (procedure.code.code === 'DISABLED') {
      return;
    }

    if (!toothData[toothNumber]) {
      toothData[toothNumber] = {
        zones: {},
        procedures: []
      };
    }

    // Add procedure to tooth
    toothData[toothNumber].procedures.push({
      type: procedure.code.code,
      surface: procedure.subSurfaces?.[0] || 'occlusal',
      date: procedure.date
    });

    // Handle crown and bridge procedures (R24/R34/R40/R45) - they don't have subSurfaces but should still be processed
    if (procedure.code.code === 'R24' || procedure.code.code === 'R34' || procedure.code.code === 'R40' || procedure.code.code === 'R45') {
      const status = procedure.status === 'IN_PROGRESS' ? 'current' :
        procedure.status === 'COMPLETED' ? 'history' : 'pending';

      let material = 'porcelain';
      if (procedure.notes?.toLowerCase().includes('gold')) material = 'gold';

      // Check if this is a bridge procedure by looking for bridge ID in notes
      const bridgeIdMatch = procedure.notes?.match(/bridge[- ]([^:\s]+)/i);
      const isBridge = bridgeIdMatch || procedure.notes?.toLowerCase().includes('bridge');
      const bridgeId = bridgeIdMatch ? bridgeIdMatch[1] : null;

      // Determine role (abutment/pontic) from notes
      let role = 'abutment';
      if (procedure.notes?.toLowerCase().includes('pontic')) {
        role = 'pontic';
      } else if (procedure.notes?.toLowerCase().includes('abutment')) {
        role = 'abutment';
      }

      // Check if this is a main bridge procedure (starts with "MAIN:")
      const isMainBridge = procedure.notes?.startsWith('MAIN:');



      toothData[toothNumber].wholeTooth = {
        type: 'crown',
        material,
        creationStatus: status,
        ...(isBridge && bridgeId && {
          bridgeId,
          role,
          isMainBridge
        })
      };
    }
    // Color zones based on procedure type and subsurfaces
    else if (procedure.subSurfaces && procedure.subSurfaces.length > 0) {
      procedure.subSurfaces.forEach(surface => {
        const status = procedure.status === 'IN_PROGRESS' ? 'current' :
          procedure.status === 'COMPLETED' ? 'history' : 'pending';

        if (procedure.code.code.startsWith('V')) {
          // Fillings always set the color
          const material = procedure.fillingMaterial || 'composite';
          toothData[toothNumber].zones[surface] = `filling-${status}-${material}`;
        } else {
          // Other procedures: only set if not already set by a filling
          if (!toothData[toothNumber].zones[surface] || !toothData[toothNumber].zones[surface].startsWith('filling-')) {
            if (procedure.code.code.startsWith('H')) {
              // Extractions
              toothData[toothNumber].wholeTooth = {
                type: 'extraction',
                creationStatus: status
              };
              toothData[toothNumber].zones[surface] = 'extraction';
            } else if (procedure.code.code.startsWith('V3') || procedure.code.code.startsWith('V35')) {
              // Sealings
              toothData[toothNumber].zones[surface] = `sealing-${status}`;
            } else if (procedure.code.code === 'T021' || procedure.code.code === 'T022') {
              // Scaling
              toothData[toothNumber].zones[surface] = `scaling-${status}-${procedure.code.code}`;
            } else {
              // Other procedures
              toothData[toothNumber].zones[surface] = `${procedure.code.code}-${status}`;
            }
          }
        }
      });
    } else if (procedure.code.code.startsWith('V3') || procedure.code.code.startsWith('V35')) {
      // Handle sealing procedures even when subSurfaces is empty
      const status = procedure.status === 'IN_PROGRESS' ? 'current' :
        procedure.status === 'COMPLETED' ? 'history' : 'pending';

      const toothType = getToothType(toothNumber);

      if (toothType === 'molar') {
        // Molar: color all four occlusal subsurfaces
        toothData[toothNumber].zones['occlusal-1'] = `sealing-${status}`;
        toothData[toothNumber].zones['occlusal-2'] = `sealing-${status}`;
        toothData[toothNumber].zones['occlusal-3'] = `sealing-${status}`;
        toothData[toothNumber].zones['occlusal-4'] = `sealing-${status}`;
      } else {
        // Premolar and anterior: color single occlusal surface
        toothData[toothNumber].zones['occlusal'] = `sealing-${status}`;
      }
    } else if (procedure.code.code === 'T021' || procedure.code.code === 'T022') {
      // Scaling procedures should not affect tooth appearance - just store the procedure
      // No special coloring or zones for scaling codes
      if (!toothData[toothNumber].procedures) {
        toothData[toothNumber].procedures = [];
      }
      toothData[toothNumber].procedures.push({
        type: procedure.code.code,
        surface: 'scaling',
        date: new Date().toISOString()
      });
    }
  });

  // Process disabled teeth procedures (invisible procedures)
  // Track processed disabled teeth to prevent duplicates
  const processedDisabledTeeth = new Set();

  procedures.forEach(procedure => {
    if (procedure.code?.code === 'DISABLED' && procedure.toothNumber) {
      const toothNumber = procedure.toothNumber;

      // Skip if this tooth is already a bridge pontic - pontics should not be disabled
      const existingToothData = toothData[toothNumber];
      if (existingToothData?.wholeTooth?.role === 'pontic') {
        return;
      }

      // Skip if we've already processed this disabled tooth (prevent duplicates)
      if (processedDisabledTeeth.has(toothNumber)) {
        console.log(`🔍 Skipping duplicate DISABLED procedure for tooth ${toothNumber}`);
        return;
      }

      processedDisabledTeeth.add(toothNumber);

      if (!toothData[toothNumber]) {
        toothData[toothNumber] = {
          zones: {},
          procedures: []
        };
      }

      // Mark tooth as disabled
      toothData[toothNumber].isDisabled = true;

      // Color all subsurfaces gray for disabled tooth
      const toothType = getToothType(toothNumber);
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

      // Color all subsurfaces gray
      allSubsurfaces.forEach(subsurface => {
        toothData[toothNumber].zones[subsurface] = 'disabled';
      });
    }
  });

  return toothData;
}

// Remove the complex buildDentalChartFromProcedures function - we don't need it
// Remove updateDentalChartFromProcedures function - we don't need it 