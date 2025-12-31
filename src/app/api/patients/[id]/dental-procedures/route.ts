import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { logActivity, LOG_ACTIONS, ENTITY_TYPES } from '@/lib/activity-logger';

// GET - Fetch all dental procedures for a patient
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const procedures = await prisma.dentalProcedure.findMany({
      where: {
        patientId: params.id,
      },
      // @ts-ignore - practitioner relation exists after migration
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

// POST - Create a new dental procedure
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
      toothNumber,
      quantity = 1,
      cost,
      jaw,
      surface,
      quadrant,
      timeMultiplier,
      surfaces,
      roots,
      elements,
      sessions,
      jawHalf,
      sextant,
      technicalCosts,
      materialCosts,
      subSurfaces = [],
      fillingMaterial = 'composite'
    } = body;

    // Validate required fields
    if (!codeId || !date) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify the dental code exists
    const dentalCode = await prisma.dentalCode.findUnique({
      where: { id: codeId },
    });

    if (!dentalCode) {
      return NextResponse.json(
        { error: 'Dental code not found' },
        { status: 404 }
      );
    }

    // Get patient information to check WLZ status
    const patient = await prisma.patient.findUnique({
      where: { id: params.id }
    }) as any;

    if (!patient) {
      return NextResponse.json(
        { error: 'Patient not found' },
        { status: 404 }
      );
    }

    // Calculate cost with WLZ logic
    let finalCost: number | null = null;

    // Determine if current code is U35 (time unit) – keep pricing for this code even for WLZ patients
    const isU35Code = dentalCode.code?.toLowerCase() === 'u35';

    if (patient.isLongTermCareAct && !isU35Code) {
      // WLZ patient – all procedures except U35 are free of charge
      finalCost = 0;
    } else if (typeof cost === 'number') {
      // Explicit cost sent from client – trust it when not overridden by WLZ logic
      finalCost = cost;
    } else {
      // Derive cost from dental code definition
      let calculatedCost = 0;

      if (dentalCode.rate && typeof dentalCode.rate === 'number') {
        calculatedCost = dentalCode.rate;
      } else if (dentalCode.points) {
        calculatedCost = dentalCode.points * 7.59; // Convert points to euros
      }

      // Apply quantity multiplier when relevant
      calculatedCost *= quantity;

      finalCost = Math.round(calculatedCost * 100) / 100;
    }

    // Get current user session to set practitionerId (optional)
    const session = await getServerSession(authOptions);

    // Create the dental procedure
    const procedure = await prisma.dentalProcedure.create({
      data: {
        patientId: params.id,
        codeId,
        date: new Date(date),
        notes,
        status,
        // @ts-ignore - toothNumber exists after migration
        toothNumber: toothNumber ? parseInt(toothNumber) : null,
        // @ts-ignore - practitionerId exists after migration
        practitionerId: session?.user?.id || null,
        // @ts-ignore - quantity field for procedures
        quantity: quantity || 1,
        // Persist calculated cost (null handled by Prisma default if field absent)
        cost: finalCost,
        // @ts-ignore - subSurfaces and fillingMaterial fields exist after migration
        subSurfaces: subSurfaces || [],
        fillingMaterial: fillingMaterial || 'composite',
        // @ts-ignore - additional fields (jaw, surfaces, etc.) can be added later as needed
      },
      // @ts-ignore - practitioner relation exists after migration
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
    if (session?.user?.id) {
      await logActivity({
        action: LOG_ACTIONS.CREATE_DENTAL_PROCEDURE,
        entityType: ENTITY_TYPES.DENTAL_PROCEDURE,
        entityId: procedure.id,
        description: `Created dental procedure for patient ${params.id}`,
        details: { after: procedure, source: body.source || 'unknown' },
        patientId: params.id,
      }, {
        userId: session.user.id,
        organizationId: session.user.organizationId,
        ipAddress: request.headers.get('x-forwarded-for') || '',
        userAgent: request.headers.get('user-agent') || '',
      });
    }

    return NextResponse.json({ procedure });
  } catch (error) {
    console.error('Error creating dental procedure:', error);
    return NextResponse.json(
      { error: 'Failed to create dental procedure' },
      { status: 500 }
    );
  }
} 