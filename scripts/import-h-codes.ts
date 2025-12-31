import { PrismaClient } from '@prisma/client';
import { H_CODES } from '../src/data/dental-codes/h-codes';

const prisma = new PrismaClient();

async function importHCodes() {
  console.log('Starting import of H-codes (Surgical Procedures)...');

  try {
    // Delete existing H-codes
    await prisma.dentalCode.deleteMany({
      where: {
        code: {
          startsWith: 'H'
        }
      }
    });

    console.log('Existing H-codes deleted.');

    // Import new H-codes
    const createdCodes = await prisma.dentalCode.createMany({
      data: H_CODES.map(code => ({
        code: code.code,
        description: code.description,
        category: 'Surgical Procedures',
        section: 'H',
        subSection: 'Surgical Procedures',
        patientType: 'Adult',
        requirements: code.explanation ? {
          notes: [code.explanation],
          conditions: [
            ...(code.maxRoots ? [`Maximum ${code.maxRoots} roots per element`] : []),
            ...(code.requiresQuadrant ? ['Must be in same quadrant as previous extraction'] : [])
          ],
          includedServices: [
            ...(code.code === 'H38' ? [
              'Removal of receptor tooth/teeth if needed',
              'Wound bed preparation',
              'Transplantation and suturing',
              'Anesthesia',
              'Foramen mentale exposure if needed',
              'Oral hygiene instructions',
              'Two weeks post-operative care'
            ] : []),
            ...(code.code === 'H39' ? [
              'Removal of receptor tooth/teeth if needed',
              'Wound bed preparation',
              'Transplantation and suturing',
              'Anesthesia',
              'Two weeks post-operative care'
            ] : []),
            ...(code.code === 'H36' ? [
              'Complaint registration',
              'Medical history taking',
              'Prosthetic assessment',
              'Documentation of findings'
            ] : []),
            ...(code.code === 'H37' ? [
              'Extensive medical history',
              'Bone measurements',
              'Study model impressions if needed',
              'Template/guide fabrication if needed',
              'Treatment planning'
            ] : [])
          ]
        } : {}
      }))
    });

    console.log(`Successfully imported ${createdCodes.count} H-codes.`);
  } catch (error) {
    console.error('Error importing H-codes:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the import if this script is executed directly
if (require.main === module) {
  importHCodes()
    .then(() => console.log('H-codes import completed.'))
    .catch(error => {
      console.error('Failed to import H-codes:', error);
      process.exit(1);
    });
} 