import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function assignPatientCodes() {
  console.log('Starting patient code assignment...');

  try {
    // Get all patients ordered by creation date
    const patients = await prisma.patient.findMany({
      orderBy: {
        createdAt: 'asc'
      }
    });

    console.log(`Found ${patients.length} patients to assign codes to`);

    // Assign sequential codes starting from 1
    for (let i = 0; i < patients.length; i++) {
      const patientCode = (i + 1).toString();

      // Update patient with their new code
      await prisma.patient.update({
        where: { id: patients[i].id },
        data: { patientCode: patientCode }
      });

      console.log(`Assigned code ${patientCode} to patient ${patients[i].firstName} ${patients[i].lastName}`);
    }

    console.log('Patient code assignment completed successfully!');
  } catch (error) {
    console.error('Error assigning patient codes:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
assignPatientCodes()
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  }); 