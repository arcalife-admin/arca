import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { logActivity, LOG_ACTIONS, ENTITY_TYPES } from '@/lib/activity-logger';

export async function POST(request: Request) {
  // Extract body and codeId before try block so it's available in catch
  const body = await request.json();
  const { patientId, codeId, toothNumber, timeSpent, surfaces, notes, cost, status, date } = body;

  try {
    // Validate required fields
    if (!patientId || !codeId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get the dental code to determine the procedure type
    const dentalCode = await prisma.dentalCode.findUnique({
      where: { id: codeId },
    });

    if (!dentalCode) {
      return NextResponse.json(
        { error: 'Invalid dental code' },
        { status: 400 }
      );
    }

    const session = await getServerSession(authOptions);

    // Create the procedure
    const procedure = await prisma.dentalProcedure.create({
      data: {
        patientId: String(patientId),
        codeId: String(codeId),
        date: date ? new Date(date) : new Date(),
        notes,
        status: status || 'PENDING',
        // @ts-ignore - toothNumber exists in schema
        toothNumber: toothNumber ? parseInt(toothNumber) : null,
        // @ts-ignore - practitionerId exists after migration
        practitionerId: session?.user?.id || null,
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
      } as any,
    });

    // Log creation in manager log system
    await logActivity({
      action: LOG_ACTIONS.CREATE_DENTAL_PROCEDURE,
      entityType: ENTITY_TYPES.DENTAL_PROCEDURE,
      entityId: procedure.id,
      description: `Created dental procedure for patient ${patientId}`,
      details: { after: procedure, source: body.source || 'unknown' },
      patientId: patientId,
    }, {
      userId: session.user.id,
      organizationId: session.user.organizationId,
      ipAddress: request.headers.get('x-forwarded-for') || '',
      userAgent: request.headers.get('user-agent') || '',
    });

    return NextResponse.json(procedure);
  } catch (error) {
    console.error('Error creating dental procedure:', error);

    // Handle unique constraint violation for disabled procedures
    if (error.code === 'P2002' && error.meta?.target?.includes('patientId_toothNumber_codeId')) {
      // Check if this is a disabled procedure
      const dentalCode = await prisma.dentalCode.findUnique({
        where: { id: codeId },
      });

      if (dentalCode?.code === 'DISABLED') {
        console.log(`🔍 Unique constraint violation for DISABLED procedure on tooth ${toothNumber}`);
        return NextResponse.json(
          { error: 'Tooth is already disabled' },
          { status: 409 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to create dental procedure' },
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

    const procedures = await prisma.dentalProcedure.findMany({
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
      } as any,
      orderBy: {
        date: 'asc',
      },
    });

    return NextResponse.json(procedures);
  } catch (error) {
    console.error('Error fetching dental procedures:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dental procedures' },
      { status: 500 }
    );
  }
} 