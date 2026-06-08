export { dynamic } from '@/lib/api-config'

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';

// GET /api/families - Get all family groups for the organization
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Neautorizat' }, { status: 401 });
    }

    // Get all patients with family information
    const patients = await prisma.patient.findMany({
      where: {
        organizationId: session.user.organizationId,
        isDisabled: false
      },
      select: {
        id: true,
        patientCode: true,
        firstName: true,
        lastName: true,
        dateOfBirth: true,
        email: true,
        phone: true,
        familyHeadCode: true,
        familyPosition: true,
        isDisabled: true
      },
      orderBy: [
        { familyHeadCode: 'asc' },
        { familyPosition: 'asc' },
        { patientCode: 'asc' }
      ]
    });

    // Group patients by family
    const familyGroups: Record<string, any> = {};
    const individualPatients: any[] = [];

    patients.forEach(patient => {
      if (patient.familyHeadCode) {
        // Patient is part of a family
        if (!familyGroups[patient.familyHeadCode]) {
          familyGroups[patient.familyHeadCode] = {
            familyHeadCode: patient.familyHeadCode,
            patients: []
          };
        }
        familyGroups[patient.familyHeadCode].patients.push(patient);
      } else {
        // Individual patient
        individualPatients.push(patient);
      }
    });

    return NextResponse.json({
      familyGroups: Object.values(familyGroups),
      individualPatients,
      totalFamilies: Object.keys(familyGroups).length,
      totalIndividuals: individualPatients.length
    });

  } catch (error) {
    console.error('Error fetching families:', error);
    return NextResponse.json(
      { error: 'Încărcarea familiilor a eșuat' },
      { status: 500 }
    );
  }
}

// POST /api/families - Create a family by linking patients
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Neautorizat' }, { status: 401 });
    }

    const { patientCodes } = await request.json();

    if (!patientCodes || !Array.isArray(patientCodes) || patientCodes.length < 2) {
      return NextResponse.json(
        { error: 'Sunt necesare cel puțin 2 coduri de pacient pentru a crea o familie' },
        { status: 400 }
      );
    }

    // Get patients by their codes
    const patients = await prisma.patient.findMany({
      where: {
        patientCode: { in: patientCodes },
        organizationId: session.user.organizationId,
        isDisabled: false
      },
      orderBy: { patientCode: 'asc' }
    });

    if (patients.length !== patientCodes.length) {
      return NextResponse.json(
        { error: 'Unul sau mai multe coduri de pacient nu au fost găsite' },
        { status: 404 }
      );
    }

    // Check if any patients are already in families
    const patientsInFamilies = patients.filter(p => p.familyHeadCode);
    if (patientsInFamilies.length > 0) {
      return NextResponse.json(
        { error: 'Unii pacienți sunt deja în familii' },
        { status: 400 }
      );
    }

    // Use the lowest patient code as the family head code
    const sortedPatients = patients.sort((a, b) => parseInt(a.patientCode) - parseInt(b.patientCode));
    const familyHeadCode = sortedPatients[0].patientCode;

    // Update all patients with family information and new codes
    await prisma.$transaction(async (tx) => {
      for (let i = 0; i < sortedPatients.length; i++) {
        const patient = sortedPatients[i];
        const familyPosition = i + 1;
        const newPatientCode = `${familyHeadCode}-${familyPosition}`;

        await tx.patient.update({
          where: { id: patient.id },
          data: {
            patientCode: newPatientCode,
            familyHeadCode: familyHeadCode,
            familyPosition: familyPosition
          }
        });
      }
    });

    return NextResponse.json({
      message: 'Familia a fost creată cu succes',
      familyHeadCode,
      membersCount: sortedPatients.length
    });

  } catch (error) {
    console.error('Error creating family:', error);
    return NextResponse.json(
      { error: 'Crearea familiei a eșuat' },
      { status: 500 }
    );
  }
} 