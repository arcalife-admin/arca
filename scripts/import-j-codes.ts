import { PrismaClient } from '@prisma/client';
import { jCodes } from '../src/data/dental-codes/j-codes';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting J-codes import...');

  for (const code of jCodes) {
    await prisma.dentalCode.upsert({
      where: { code: code.code },
      update: {
        description: code.description,
        category: 'IMPLANTS',
        section: 'J',
        subSection: 'Implants',
        patientType: 'Adult',
        requirements: code.requirements || {},
      },
      create: {
        code: code.code,
        description: code.description,
        category: 'IMPLANTS',
        section: 'J',
        subSection: 'Implants',
        patientType: 'Adult',
        requirements: code.requirements || {},
      }
    });
  }

  console.log('J-codes import completed successfully');
}

main()
  .catch((e) => {
    console.error('Error during J-codes import:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 