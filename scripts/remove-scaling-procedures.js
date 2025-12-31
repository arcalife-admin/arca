import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function removeScalingProcedures() {
  try {
    console.log('🔍 Removing scaling procedures (T021/T022)...');

    // Get scaling procedures
    const scalingProcedures = await prisma.dentalProcedure.findMany({
      where: {
        code: {
          code: {
            in: ['T021', 'T022']
          }
        }
      },
      include: {
        code: true
      }
    });

    console.log(`🔍 Found ${scalingProcedures.length} scaling procedures`);

    if (scalingProcedures.length === 0) {
      console.log('✅ No scaling procedures to remove');
      return;
    }

    // Delete each scaling procedure
    for (const procedure of scalingProcedures) {
      console.log(`🗑️  Deleting ${procedure.code.code} procedure on tooth ${procedure.toothNumber} (${procedure.id})`);
      await prisma.dentalProcedure.delete({
        where: { id: procedure.id }
      });
    }

    console.log(`✅ Removed ${scalingProcedures.length} scaling procedures`);

  } catch (error) {
    console.error('❌ Error removing scaling procedures:', error);
  } finally {
    await prisma.$disconnect();
  }
}

removeScalingProcedures(); 