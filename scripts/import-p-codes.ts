import { PrismaClient } from '@prisma/client';
import { pCodes } from '../src/data/dental-codes/p-codes';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting P-codes import...');

  for (const code of pCodes) {
    await prisma.dentalCode.upsert({
      where: { code: code.code },
      update: {
        description: code.description,
        category: 'PROSTHETICS',
        section: 'P',
        subSection: 'Prosthetics',
        patientType: 'Adult',
        requirements: code.requirements || {},
      },
      create: {
        code: code.code,
        description: code.description,
        category: 'PROSTHETICS',
        section: 'P',
        subSection: 'Prosthetics',
        patientType: 'Adult',
        requirements: code.requirements || {},
      }
    });
  }

  console.log('P-codes import completed successfully');
}

main()
  .catch((e) => {
    console.error('Error during P-codes import:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 