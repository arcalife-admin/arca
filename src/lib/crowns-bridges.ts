// Helper utilities for crown and bridge procedures
import { CrownMaterial } from '@/contexts/CrownBridgeOptionsContext';

export type BridgeRole = 'abutment' | 'pontic';

export interface BridgeTeeth {
  [toothNumber: number]: BridgeRole;
}

export async function getCrownCode(material: CrownMaterial) {
  // R24 = porcelain crown, R34 = gold crown
  const code = material === 'porcelain' ? 'R24' : 'R34';
  try {
    const res = await fetch(`/api/dental-codes?search=${code}`);
    const all = await res.json();
    return all.find((c: any) => c.code === code);
  } catch {
    return null;
  }
}

export async function getPonticCode(material: CrownMaterial) {
  // R40 = porcelain pontic, R45 = gold pontic
  const code = material === 'porcelain' ? 'R40' : 'R45';
  try {
    const res = await fetch(`/api/dental-codes?search=${code}`);
    const all = await res.json();
    return all.find((c: any) => c.code === code);
  } catch {
    return null;
  }
}

export async function getFiveOrMoreAbutmentCode() {
  // R49 = 5 or more abutments
  try {
    const res = await fetch(`/api/dental-codes?search=R49`);
    const all = await res.json();
    return all.find((c: any) => c.code === 'R49');
  } catch {
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

export function analyzeBridgeTeeth(bridgeTeeth: BridgeTeeth): {
  abutments: number[];
  pontics: number[];
  needsFiveOrMoreCode: boolean;
  bridgeType: string;
  complexity: 'simple' | 'moderate' | 'complex';
  totalUnits: number;
} {
  const abutments: number[] = [];
  const pontics: number[] = [];

  for (const [toothNum, role] of Object.entries(bridgeTeeth)) {
    const num = parseInt(toothNum);
    if (role === 'abutment') {
      abutments.push(num);
    } else if (role === 'pontic') {
      pontics.push(num);
    }
  }

  const sortedAbutments = abutments.sort((a, b) => a - b);
  const sortedPontics = pontics.sort((a, b) => a - b);
  const totalUnits = abutments.length + pontics.length;

  // Determine bridge type
  let bridgeType = '';
  if (totalUnits === 3 && abutments.length === 2 && pontics.length === 1) {
    bridgeType = '3-unit bridge';
  } else if (totalUnits === 4 && abutments.length === 2 && pontics.length === 2) {
    bridgeType = '4-unit bridge';
  } else if (totalUnits >= 5) {
    bridgeType = `${totalUnits}-unit extended bridge`;
  } else {
    bridgeType = `${totalUnits}-unit bridge`;
  }

  // Determine complexity
  let complexity: 'simple' | 'moderate' | 'complex' = 'simple';
  if (totalUnits >= 5 || abutments.length >= 4) {
    complexity = 'complex';
  } else if (totalUnits === 4 || pontics.length >= 2) {
    complexity = 'moderate';
  }

  return {
    abutments: sortedAbutments,
    pontics: sortedPontics,
    needsFiveOrMoreCode: abutments.length >= 5,
    bridgeType,
    complexity,
    totalUnits,
  };
}

export async function createBridgeProcedures(
  patientId: string,
  bridgeTeeth: BridgeTeeth,
  material: CrownMaterial,
  bridgeId: string,
  options: { retention: boolean; anesthesia: boolean; c022: boolean },
  status: string = 'IN_PROGRESS'
): Promise<any[]> {
  const { abutments, pontics, needsFiveOrMoreCode, bridgeType, complexity, totalUnits } = analyzeBridgeTeeth(bridgeTeeth);
  const createdProcedures: any[] = [];

  // Check for existing R24/R34/R40/R45 procedures to prevent duplicates
  const existingProceduresResponse = await fetch(`/api/patients/${patientId}/dental-procedures`);
  const existingProcedures = await existingProceduresResponse.json();

  // Filter out teeth that already have crown/pontic procedures in ANY status
  const teethWithExistingCrownProcedures = new Set(
    existingProcedures
      .filter((p: any) => p.code.code === 'R24' || p.code.code === 'R34' || p.code.code === 'R40' || p.code.code === 'R45')
      .map((p: any) => p.toothNumber)
  );

  const filteredAbutments = abutments.filter(toothNum => !teethWithExistingCrownProcedures.has(toothNum));
  const filteredPontics = pontics.filter(toothNum => !teethWithExistingCrownProcedures.has(toothNum));

  if (filteredAbutments.length === 0 && filteredPontics.length === 0) {
    console.log('All teeth in bridge already have crown/pontic procedures, skipping bridge creation');
    return createdProcedures;
  }

  // Create main bridge procedure on the first abutment
  const crownCode = await getCrownCode(material);
  if (crownCode && filteredAbutments.length > 0) {
    const firstAbutment = filteredAbutments[0];

    // Build comprehensive notes for the main procedure
    let mainNotes = `MAIN: ${bridgeType} ${bridgeId} - ${material} crown abutment (first) for ${totalUnits} units [${complexity}]`;

    // Add additional codes to the main procedure notes if selected
    const additionalCodes = [];
    if (options.retention) additionalCodes.push('R14');
    if (options.anesthesia) additionalCodes.push('A10');
    if (options.c022) additionalCodes.push('C022');
    if (needsFiveOrMoreCode) additionalCodes.push('R49');

    if (additionalCodes.length > 0) {
      mainNotes += ` | Includes: ${additionalCodes.join(', ')}`;
    }

    const mainProcedure = await createDentalProcedure(
      patientId,
      crownCode.id,
      firstAbutment,
      mainNotes,
      status
    );
    createdProcedures.push(mainProcedure);
  }

  // Create additional abutment procedures (excluding the first one)
  if (crownCode) {
    for (let i = 1; i < filteredAbutments.length; i++) {
      const toothNum = filteredAbutments[i];
      const position = i === filteredAbutments.length - 1 ? 'last' : 'middle';

      // Build comprehensive notes for additional abutments
      let notes = `BRIDGE-${bridgeId}: ${material} crown abutment (${position}) for ${bridgeType} on tooth ${toothNum} [${complexity}]`;

      // Add additional codes to the abutment procedure notes if selected
      const additionalCodes = [];
      if (options.retention) additionalCodes.push('R14');
      if (options.anesthesia) additionalCodes.push('A10');
      if (options.c022) additionalCodes.push('C022');

      if (additionalCodes.length > 0) {
        notes += ` | Includes: ${additionalCodes.join(', ')}`;
      }

      const abutmentProcedure = await createDentalProcedure(
        patientId,
        crownCode.id,
        toothNum,
        notes,
        status
      );
      createdProcedures.push(abutmentProcedure);
    }
  }

  // Create pontic procedures with enhanced descriptions
  const ponticCode = await getPonticCode(material);
  if (ponticCode) {
    for (const toothNum of filteredPontics) {
      let notes = `BRIDGE-${bridgeId}: ${material} pontic for ${bridgeType} replacing tooth ${toothNum} [${complexity}]`;

      // Add additional codes to pontic procedure notes if selected
      const additionalCodes = [];
      if (options.anesthesia) additionalCodes.push('A10');
      if (options.c022) additionalCodes.push('C022');

      if (additionalCodes.length > 0) {
        notes += ` | Includes: ${additionalCodes.join(', ')}`;
      }

      const ponticProcedure = await createDentalProcedure(
        patientId,
        ponticCode.id,
        toothNum,
        notes,
        status
      );
      createdProcedures.push(ponticProcedure);
    }
  }

  return createdProcedures;
} 