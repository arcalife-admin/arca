import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkConflictingProcedures() {
  try {
    console.log('🔍 Checking for conflicting dental procedures...');

    // Get all dental procedures with tooth numbers
    const procedures = await prisma.dentalProcedure.findMany({
      where: {
        toothNumber: {
          not: null
        }
      },
      include: {
        code: true,
        patient: true
      }
    });

    console.log(`🔍 Found ${procedures.length} procedures with tooth numbers`);

    // Group by patient, tooth, and code
    const groupedProcedures = {};
    procedures.forEach(procedure => {
      const key = `${procedure.patientId}_${procedure.toothNumber}_${procedure.codeId}`;
      if (!groupedProcedures[key]) {
        groupedProcedures[key] = [];
      }
      groupedProcedures[key].push(procedure);
    });

    // Find duplicates
    let conflictCount = 0;
    for (const [key, procedures] of Object.entries(groupedProcedures)) {
      if (procedures.length > 1) {
        const [patientId, toothNumber, codeId] = key.split('_');
        console.log(`⚠️  CONFLICT: ${procedures.length} procedures for patient ${patientId}, tooth ${toothNumber}, code ${procedures[0].code.code}`);

        procedures.forEach((proc, index) => {
          console.log(`  ${index + 1}. ID: ${proc.id}, Date: ${proc.date}, Status: ${proc.status}, Notes: ${proc.notes}`);
        });

        conflictCount++;
      }
    }

    if (conflictCount === 0) {
      console.log('✅ No conflicting procedures found');
    } else {
      console.log(`⚠️  Found ${conflictCount} conflicts`);
    }

    // Check specifically for scaling procedures
    const scalingProcedures = procedures.filter(p => p.code.code === 'T021' || p.code.code === 'T022');
    console.log(`🔍 Found ${scalingProcedures.length} scaling procedures (T021/T022)`);

    scalingProcedures.forEach(proc => {
      console.log(`  Tooth ${proc.toothNumber}: ${proc.code.code} - ${proc.notes} (${proc.status})`);
    });

  } catch (error) {
    console.error('❌ Error checking procedures:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkConflictingProcedures(); 