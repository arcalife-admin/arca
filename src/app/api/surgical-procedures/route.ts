import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { logActivity, LOG_ACTIONS, ENTITY_TYPES } from '@/lib/activity-logger';

export async function POST(request: Request) {
  const body = await request.json();
  const { patientId, codeId, bodyArea, procedureType, anesthesiaType, notes, cost, status, date } = body;

  try {
    // Validate required fields
    if (!patientId || !codeId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get the surgical procedure code
    const surgicalCode = await prisma.surgicalProcedureCode.findUnique({
      where: { id: codeId },
    });

    if (!surgicalCode) {
      return NextResponse.json(
        { error: 'Invalid surgical procedure code' },
        { status: 400 }
      );
    }

    const session = await getServerSession(authOptions);

    // Create the procedure
    const procedure = await prisma.surgicalProcedure.create({
      data: {
        patientId: String(patientId),
        codeId: String(codeId),
        date: date ? new Date(date) : new Date(),
        notes,
        status: status || 'PENDING',
        practitionerId: session?.user?.id || null,
        bodyArea: bodyArea || null,
        procedureType: procedureType || null,
        anesthesiaType: anesthesiaType || null,
        cost: cost || null,
      },
      include: {
        code: true,
        practitioner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Log creation in manager log system
    if (session?.user?.id) {
      await logActivity({
        action: LOG_ACTIONS.CREATE_SURGICAL_PROCEDURE,
        entityType: ENTITY_TYPES.SURGICAL_PROCEDURE,
        entityId: procedure.id,
        description: `Created surgical procedure for patient ${patientId}`,
        details: { after: procedure, source: body.source || 'unknown' },
        patientId: patientId,
      }, {
        userId: session.user.id,
        organizationId: session.user.organizationId || '',
        ipAddress: request.headers.get('x-forwarded-for') || '',
        userAgent: request.headers.get('user-agent') || '',
      });
    }

    return NextResponse.json(procedure);
  } catch (error) {
    console.error('Error creating surgical procedure:', error);
    return NextResponse.json(
      { error: 'Failed to create surgical procedure' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');

    if (!patientId) {
      return NextResponse.json(
        { error: 'Patient ID is required' },
        { status: 400 }
      );
    }

    const procedures = await prisma.surgicalProcedure.findMany({
      where: { patientId },
      include: {
        code: true,
        practitioner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        date: 'asc',
      },
    });

    return NextResponse.json(procedures);
  } catch (error) {
    console.error('Error fetching surgical procedures:', error);
    return NextResponse.json(
      { error: 'Failed to fetch surgical procedures' },
      { status: 500 }
    );
  }
}

