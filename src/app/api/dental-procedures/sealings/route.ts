import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';

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

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { toothNumbers, patientId, currentStatus = 'PENDING' } = await request.json();

    console.log('createSealingProcedures called with:', { toothNumbers, patientId, currentStatus });

    const procedures = [];

    // Sort tooth numbers to ensure consistent ordering
    const sortedToothNumbers = [...toothNumbers].sort((a: number, b: number) => a - b);
    console.log('Sorted tooth numbers:', sortedToothNumbers);

    // Use single timestamp for all procedures in this session for proper grouping
    const sessionTimestamp = new Date().toISOString();

    // Check if V30 already exists today for this patient
    const today = new Date().toISOString().split('T')[0];
    let hasV30Today = false;
    let allProcedures: any[] = [];
    let isRedoScenario = false;

    try {
      // Get all procedures for this patient
      allProcedures = await prisma.dentalProcedure.findMany({
        where: { patientId },
        include: { code: true },
        orderBy: { date: 'desc' },
      });

      hasV30Today = allProcedures.some((p: any) => {
        if (p.code.code !== 'V30') return false;
        const procedureDate = p.date.toISOString().split('T')[0];
        return procedureDate === today;
      });

      console.log('V30 exists today:', hasV30Today);

      // Check if we're in a redo scenario by looking for recent V30 procedures
      // If there's a V30 created in the last few seconds, we should use V35 for all teeth
      const recentV30 = allProcedures.find((p: any) => {
        if (p.code.code !== 'V30') return false;
        const procedureDate = new Date(p.date);
        const now = new Date();
        const timeDiff = now.getTime() - procedureDate.getTime();
        return timeDiff < 5000; // Within last 5 seconds
      });

      if (recentV30) {
        console.log('Detected redo scenario - V30 created recently:', recentV30.id);
        isRedoScenario = true;
      }
    } catch (error) {
      console.error('Error checking for existing V30 or redo scenario:', error);
    }

    for (let i = 0; i < sortedToothNumbers.length; i++) {
      const toothNumber = sortedToothNumbers[i];

      // Determine if this should be V30 or V35
      // In redo scenario, always use V35 to avoid creating duplicate V30s
      // Otherwise, V30 only if this is the first tooth AND no V30 exists today
      const shouldUseV30 = !isRedoScenario && i === 0 && !hasV30Today;
      const code = shouldUseV30 ? 'V30' : 'V35';

      console.log(`Processing tooth ${toothNumber}, shouldUseV30: ${shouldUseV30}, isRedoScenario: ${isRedoScenario}, using code: ${code}`);

      // Get the appropriate sealing code
      const sealingCode = await prisma.dentalCode.findFirst({
        where: { code }
      });

      if (!sealingCode) {
        throw new Error(`Failed to find sealing code ${code}`);
      }

      console.log('Sealing code found:', sealingCode);

      // Determine subsurfaces based on tooth type
      const toothType = getToothType(toothNumber);
      let subSurfaces: string[] = [];

      if (toothType === 'molar') {
        // Molar: seal all four occlusal subsurfaces
        subSurfaces = ['occlusal-1', 'occlusal-2', 'occlusal-3', 'occlusal-4'];
      } else {
        // Premolar and anterior: seal single occlusal surface
        subSurfaces = ['occlusal'];
      }

      // Create the main sealing procedure
      const sealingProcedure = await prisma.dentalProcedure.create({
        data: {
          patientId,
          codeId: sealingCode.id,
          toothNumber,
          notes: `Fissuurlak ${shouldUseV30 ? 'eerste element' : 'volgende element'}`,
          status: currentStatus,
          date: new Date(sessionTimestamp),
          subSurfaces: subSurfaces,
        },
        include: {
          code: true,
        },
      });

      console.log('Created procedure:', sealingProcedure);
      procedures.push(sealingProcedure);

      // After creating V30, mark that V30 exists today for subsequent teeth
      if (shouldUseV30) {
        hasV30Today = true;
      }
    }

    return NextResponse.json(procedures);
  } catch (error) {
    console.error('Error creating sealing procedures:', error);
    return NextResponse.json(
      { error: 'Failed to create sealing procedures' },
      { status: 500 }
    );
  }
} 