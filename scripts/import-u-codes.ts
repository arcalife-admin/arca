import { PrismaClient } from '@prisma/client';
import { uCodes } from '../src/data/dental-codes/u-codes';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting U-codes import...');

  for (const code of uCodes) {
    await prisma.dentalCode.upsert({
      where: { code: code.code },
      update: {
        description: code.description,
        category: 'SPECIAL_CARE',
        section: 'U',
        subSection: 'Special Care',
        patientType: 'Adult',
        requirements: code.requirements || {},
      },
      create: {
        code: code.code,
        description: code.description,
        category: 'SPECIAL_CARE',
        section: 'U',
        subSection: 'Special Care',
        patientType: 'Adult',
        requirements: code.requirements || {},
      }
    });
  }

  console.log('U-codes import completed successfully');
}

main()
  .catch((e) => {
    console.error('Error during U-codes import:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 