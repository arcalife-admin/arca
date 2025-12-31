import { PrismaClient } from '@prisma/client';
import { G_CODES } from '../src/data/dental-codes/g-codes';

const prisma = new PrismaClient();

async function importGCodes() {
  console.log('Starting import of G-codes (Jaw Treatment)...');

  try {
    // Delete existing G-codes
    await prisma.dentalCode.deleteMany({
      where: {
        code: {
          startsWith: 'G'
        }
      }
    });

    console.log('Existing G-codes deleted.');

    // Import new G-codes
    const createdCodes = await prisma.dentalCode.createMany({
      data: G_CODES.map(code => ({
        code: code.code,
        description: code.description,
        category: 'Jaw Treatment',
        section: 'G',
        subSection: 'Jaw Treatment',
        patientType: 'Adult',
        requirements: code.explanation ? {
          notes: [code.explanation],
          conditions: [
            ...(Array.isArray(code.requirements?.conditions) ? code.requirements.conditions : [])
          ],
          includedServices: [
            // Add specific included services based on the code
            ...(code.code === 'G21' ? [
              'Registration of complaint',
              'Medical, dental and psychosocial anamnesis',
              'Movement examination',
              'Documentation of findings',
              'Work diagnosis formulation'
            ] : []),
            ...(code.code === 'G22' ? [
              'Dentoalveolar cause investigation',
              'Complete DC-TMD as1 examination',
              'DC-TMD as2 questionnaires',
              'Medical consultation if needed',
              'Diagnosis and treatment planning'
            ] : []),
            ...(code.code === 'G62' ? [
              'Digital impressions',
              'Bite registration',
              'Splint placement',
              'Minor corrections',
              'Usage instructions'
            ] : []),
            ...(code.code === 'G71' ? [
              'Digital impressions',
              'Registration',
              'Device placement',
              'Minor corrections',
              'Usage instructions',
              'Two months aftercare'
            ] : [])
          ]
        } : {}
      }))
    });

    console.log(`Successfully imported ${createdCodes.count} G-codes.`);
  } catch (error) {
    console.error('Error importing G-codes:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the import if this script is executed directly
if (require.main === module) {
  importGCodes()
    .then(() => console.log('G-codes import completed.'))
    .catch(error => {
      console.error('Failed to import G-codes:', error);
      process.exit(1);
    });
} 