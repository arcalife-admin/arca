import { PrismaClient } from '@prisma/client';
import { yCodes } from '../src/data/dental-codes/y-codes';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting Y-codes import...');

  for (const code of yCodes) {
    await prisma.dentalCode.upsert({
      where: { code: code.code },
      update: {
        description: code.description,
        category: 'INFORMATION_SERVICES',
        section: 'Y',
        subSection: 'Information Services',
        patientType: 'Adult',
        requirements: code.requirements || {},
      },
      create: {
        code: code.code,
        description: code.description,
        category: 'INFORMATION_SERVICES',
        section: 'Y',
        subSection: 'Information Services',
        patientType: 'Adult',
        requirements: code.requirements || {},
      }
    });
  }

  console.log('Y-codes import completed successfully');
}

main()
  .catch((e) => {
    console.error('Error during Y-codes import:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 