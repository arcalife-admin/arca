import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';

// GET /api/families/[familyHeadCode] - Get a specific family group
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const familyHeadCode = params.id;

    // Get all patients in this family
    const familyMembers = await prisma.patient.findMany({
      where: {
        familyHeadCode: familyHeadCode,
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
      orderBy: { familyPosition: 'asc' }
    });

    if (familyMembers.length === 0) {
      return NextResponse.json({ error: 'Family not found' }, { status: 404 });
    }

    return NextResponse.json({
      familyHeadCode,
      patients: familyMembers,
      membersCount: familyMembers.length
    });

  } catch (error) {
    console.error('Error fetching family:', error);
    return NextResponse.json(
      { error: 'Failed to fetch family' },
      { status: 500 }
    );
  }
}

// PUT /api/families/[familyHeadCode] - Add patient to family
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const familyHeadCode = params.id;
    const { patientCode } = await request.json();

    if (!patientCode) {
      return NextResponse.json(
        { error: 'Patient code is required' },
        { status: 400 }
      );
    }

    // Check if patient exists and is not already in a family
    const patient = await prisma.patient.findFirst({
      where: {
        patientCode: patientCode,
        organizationId: session.user.organizationId,
        isDisabled: false,
        familyHeadCode: null // Not already in a family
      }
    });

    if (!patient) {
      return NextResponse.json(
        { error: 'Patient not found or already in a family' },
        { status: 404 }
      );
    }

    // Get current family members to determine the next position
    const currentMembers = await prisma.patient.findMany({
      where: {
        familyHeadCode: familyHeadCode,
        organizationId: session.user.organizationId,
        isDisabled: false
      },
      orderBy: { familyPosition: 'desc' },
      take: 1
    });

    const nextPosition = currentMembers.length > 0
      ? (currentMembers[0].familyPosition || 0) + 1
      : 1;

    const newPatientCode = `${familyHeadCode}-${nextPosition}`;

    // Add patient to family
    const updatedPatient = await prisma.patient.update({
      where: { id: patient.id },
      data: {
        patientCode: newPatientCode,
        familyHeadCode: familyHeadCode,
        familyPosition: nextPosition
      }
    });

    return NextResponse.json({
      message: 'Patient added to family successfully',
      patient: {
        id: updatedPatient.id,
        patientCode: updatedPatient.patientCode,
        firstName: updatedPatient.firstName,
        lastName: updatedPatient.lastName,
        familyPosition: updatedPatient.familyPosition
      }
    });

  } catch (error) {
    console.error('Error adding patient to family:', error);
    return NextResponse.json(
      { error: 'Failed to add patient to family' },
      { status: 500 }
    );
  }
}

// DELETE /api/families/[familyHeadCode] - Remove patient from family or delete family
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const familyHeadCode = params.id;
    const url = new URL(request.url);
    const patientCode = url.searchParams.get('patientCode');

    if (patientCode) {
      // Remove specific patient from family
      const patient = await prisma.patient.findFirst({
        where: {
          patientCode: patientCode,
          familyHeadCode: familyHeadCode,
          organizationId: session.user.organizationId
        }
      });

      if (!patient) {
        return NextResponse.json(
          { error: 'Patient not found in family' },
          { status: 404 }
        );
      }

      // Revert patient to individual status with original code
      const originalCode = patient.familyHeadCode || patient.patientCode.split('-')[0];

      await prisma.patient.update({
        where: { id: patient.id },
        data: {
          patientCode: originalCode,
          familyHeadCode: null,
          familyPosition: null
        }
      });

      // Reorganize remaining family members
      const remainingMembers = await prisma.patient.findMany({
        where: {
          familyHeadCode: familyHeadCode,
          organizationId: session.user.organizationId,
          isDisabled: false
        },
        orderBy: { familyPosition: 'asc' }
      });

      // Update positions for remaining members
      await prisma.$transaction(async (tx) => {
        for (let i = 0; i < remainingMembers.length; i++) {
          const member = remainingMembers[i];
          const newPosition = i + 1;
          const newCode = `${familyHeadCode}-${newPosition}`;

          await tx.patient.update({
            where: { id: member.id },
            data: {
              patientCode: newCode,
              familyPosition: newPosition
            }
          });
        }
      });

      return NextResponse.json({
        message: 'Patient removed from family successfully'
      });

    } else {
      // Delete entire family (revert all members to individual status)
      const familyMembers = await prisma.patient.findMany({
        where: {
          familyHeadCode: familyHeadCode,
          organizationId: session.user.organizationId
        }
      });

      if (familyMembers.length === 0) {
        return NextResponse.json({ error: 'Family not found' }, { status: 404 });
      }

      // Revert all members to individual status
      await prisma.$transaction(async (tx) => {
        for (const member of familyMembers) {
          const originalCode = member.familyHeadCode || member.patientCode.split('-')[0];

          await tx.patient.update({
            where: { id: member.id },
            data: {
              patientCode: originalCode,
              familyHeadCode: null,
              familyPosition: null
            }
          });
        }
      });

      return NextResponse.json({
        message: 'Family deleted successfully',
        membersReverted: familyMembers.length
      });
    }

  } catch (error) {
    console.error('Error deleting family/patient:', error);
    return NextResponse.json(
      { error: 'Failed to delete family/patient' },
      { status: 500 }
    );
  }
} 