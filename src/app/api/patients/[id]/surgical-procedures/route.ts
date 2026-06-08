export { dynamic } from '@/lib/api-config'

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { logActivity, LOG_ACTIONS, ENTITY_TYPES } from '@/lib/activity-logger';
import { resolveProcedurePrice, calculateProcedureCost } from '@/lib/procedure-pricing';

// GET - Fetch all surgical procedures for a patient
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const procedures = await prisma.surgicalProcedure.findMany({
      where: {
        patientId: params.id,
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
      orderBy: {
        date: 'asc',
      },
    });

    return NextResponse.json(procedures);
  } catch (error) {
    console.error('Error fetching surgical procedures:', error);
    return NextResponse.json(
      { error: 'Încărcarea procedurilor chirurgicale a eșuat' },
      { status: 500 }
    );
  }
}

// POST - Create a new surgical procedure
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const {
      codeId,
      date,
      notes,
      status = 'PENDING',
      quantity = 1,
      cost,
      bodyArea,
      procedureType,
      anesthesiaType,
    } = body;

    // Validate required fields
    if (!codeId || !date) {
      return NextResponse.json(
        { error: 'Câmpuri obligatorii lipsă' },
        { status: 400 }
      );
    }

    // Verify the surgical procedure code exists
    const surgicalCode = await prisma.surgicalProcedureCode.findUnique({
      where: { id: codeId },
    });

    if (!surgicalCode) {
      return NextResponse.json(
        { error: 'Codul procedurii chirurgicale nu a fost găsit' },
        { status: 404 }
      );
    }

    // Get patient information
    const patient = await prisma.patient.findUnique({
      where: { id: params.id }
    });

    if (!patient) {
      return NextResponse.json(
        { error: 'Pacientul nu a fost găsit' },
        { status: 404 }
      );
    }

    // Calculate cost
    const session = await getServerSession(authOptions);
    let finalCost: number | null = null;

    if (typeof cost === 'number') {
      finalCost = cost;
    } else {
      const unitPrice = await resolveProcedurePrice(
        session?.user?.id,
        codeId,
        surgicalCode.price
      );
      finalCost = calculateProcedureCost(unitPrice, quantity);
    }

    // Create the surgical procedure
    const procedure = await prisma.surgicalProcedure.create({
      data: {
        patientId: params.id,
        codeId,
        date: new Date(date),
        notes,
        status,
        practitionerId: session?.user?.id || null,
        quantity: quantity || 1,
        cost: finalCost,
        bodyArea: bodyArea || null,
        procedureType: procedureType || null,
        anesthesiaType: anesthesiaType || null,
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
        description: `Created surgical procedure for patient ${params.id}`,
        details: { after: procedure, source: body.source || 'unknown' },
        patientId: params.id,
      }, {
        userId: session.user.id,
        organizationId: session.user.organizationId || '',
        ipAddress: request.headers.get('x-forwarded-for') || '',
        userAgent: request.headers.get('user-agent') || '',
      });
    }

    return NextResponse.json({ procedure });
  } catch (error) {
    console.error('Error creating surgical procedure:', error);
    return NextResponse.json(
      { error: 'Crearea procedurii chirurgicale a eșuat' },
      { status: 500 }
    );
  }
}

