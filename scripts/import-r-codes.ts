import { PrismaClient } from '@prisma/client';
import { R_CODES } from '../src/data/dental-codes/r-codes';

const prisma = new PrismaClient();

async function importRCodes() {
  console.log('Starting import of R-codes (Crowns and Bridges)...');

  try {
    // Delete existing R-codes
    await prisma.dentalCode.deleteMany({
      where: {
        code: {
          startsWith: 'R'
        }
      }
    });

    console.log('Existing R-codes deleted.');

    // Import new R-codes
    const createdCodes = await prisma.dentalCode.createMany({
      data: R_CODES.map(code => ({
        code: code.code,
        description: code.description,
        category: 'Crowns and Bridges',
        section: 'R',
        subSection: 'Crowns and Bridges',
        patientType: 'Adult',
        requirements: code.explanation ? {
          notes: [code.explanation],
          conditions: [
            ...(code.requiresElements ? [`Requires exactly ${code.requiresElements} elements`] : []),
            ...(code.maxElements ? [`Maximum ${code.maxElements} elements`] : []),
            ...(code.minElements ? [`Minimum ${code.minElements} elements`] : []),
            ...(code.requiresImplant ? ['Requires implant'] : []),
            ...(code.isPontic ? ['Is pontic element'] : []),
            ...(code.canBeUsedAsPontic ? ['Can be used as pontic'] : [])
          ]
        } : {}
      }))
    });

    console.log(`Successfully imported ${createdCodes.count} R-codes.`);
  } catch (error) {
    console.error('Error importing R-codes:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the import if this script is executed directly
if (require.main === module) {
  importRCodes()
    .then(() => console.log('R-codes import completed.'))
    .catch(error => {
      console.error('Failed to import R-codes:', error);
      process.exit(1);
    });
} 