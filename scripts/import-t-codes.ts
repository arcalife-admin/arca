import { PrismaClient } from '@prisma/client';
import { tCodes } from '../src/data/dental-codes/t-codes';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting T-codes import...');

  for (const code of tCodes) {
    await prisma.dentalCode.upsert({
      where: { code: code.code },
      update: {
        description: code.description,
        category: 'PERIODONTAL',
        section: 'T',
        subSection: 'Periodontal',
        patientType: 'Adult',
        requirements: code.requirements || {},
      },
      create: {
        code: code.code,
        description: code.description,
        category: 'PERIODONTAL',
        section: 'T',
        subSection: 'Periodontal',
        patientType: 'Adult',
        requirements: code.requirements || {},
      }
    });
  }

  console.log('T-codes import completed successfully');
}

main()
  .catch((e) => {
    console.error('Error during T-codes import:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 