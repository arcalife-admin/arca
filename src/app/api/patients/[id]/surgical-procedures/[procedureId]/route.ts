import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { logActivity, LOG_ACTIONS, ENTITY_TYPES } from '@/lib/activity-logger';

// PUT - Update a surgical procedure
export async function PUT(
  request: Request,
  { params }: { params: { id: string; procedureId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body = await request.json();
    const { date, notes, status, quantity, cost, bodyArea, procedureType, anesthesiaType } = body;

    // Fetch pre-edit procedure for backup and logging
    const preEdit = await prisma.surgicalProcedure.findUnique({
      where: { id: params.procedureId },
    });

    // Save pre-edit to ProcedureBackup (type 'edit')
    if (preEdit) {
      // Delete any existing backup row first
      await prisma.procedureBackup.deleteMany({});
      await prisma.procedureBackup.create({
        data: {
          procedureId: params.procedureId,
          organizationId: session.user.organizationId || '',
          backupType: 'edit',
          data: preEdit as any,
        },
      });
    }

    // Update the surgical procedure
    const procedure = await prisma.surgicalProcedure.update({
      where: {
        id: params.procedureId,
        patientId: params.id, // Ensure the procedure belongs to the patient
      },
      data: {
        ...(date && { date: new Date(date) }),
        ...(notes !== undefined && { notes }),
        ...(status && { status }),
        ...(quantity !== undefined && { quantity }),
        ...(cost !== undefined && { cost }),
        ...(bodyArea !== undefined && { bodyArea }),
        ...(procedureType !== undefined && { procedureType }),
        ...(anesthesiaType !== undefined && { anesthesiaType }),
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

    // Log edit in manager log system
    await logActivity({
      action: LOG_ACTIONS.UPDATE_SURGICAL_PROCEDURE,
      entityType: ENTITY_TYPES.SURGICAL_PROCEDURE,
      entityId: procedure.id,
      description: `Edited surgical procedure for patient ${params.id}`,
      details: { before: preEdit, after: procedure, source: body.source || 'unknown' },
      patientId: params.id,
    }, {
      userId: session.user.id,
      organizationId: session.user.organizationId || '',
      ipAddress: request.headers.get('x-forwarded-for') || '',
      userAgent: request.headers.get('user-agent') || '',
    });

    return NextResponse.json(procedure);
  } catch (error) {
    console.error('Error updating surgical procedure:', error);
    return NextResponse.json(
      { error: 'Failed to update surgical procedure' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a surgical procedure
export async function DELETE(
  request: Request,
  { params }: { params: { id: string; procedureId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // Fetch procedure for backup and logging
    const toDelete = await prisma.surgicalProcedure.findUnique({
      where: { id: params.procedureId },
    });
    // Save to ProcedureBackup (type 'delete')
    if (toDelete) {
      // Delete any existing backup row first
      await prisma.procedureBackup.deleteMany({});
      await prisma.procedureBackup.create({
        data: {
          procedureId: params.procedureId,
          organizationId: session.user.organizationId || '',
          backupType: 'delete',
          data: toDelete as any,
        },
      });
    }
    // Delete the surgical procedure
    await prisma.surgicalProcedure.delete({
      where: {
        id: params.procedureId,
        patientId: params.id, // Ensure the procedure belongs to the patient
      },
    });
    // Log deletion in manager log system
    await logActivity({
      action: LOG_ACTIONS.DELETE_SURGICAL_PROCEDURE,
      entityType: ENTITY_TYPES.SURGICAL_PROCEDURE,
      entityId: params.procedureId,
      description: `Deleted surgical procedure for patient ${params.id}`,
      details: { before: toDelete, source: 'unknown' },
      patientId: params.id,
    }, {
      userId: session.user.id,
      organizationId: session.user.organizationId || '',
      ipAddress: request.headers.get('x-forwarded-for') || '',
      userAgent: request.headers.get('user-agent') || '',
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting surgical procedure:', error);
    return NextResponse.json(
      { error: 'Failed to delete surgical procedure' },
      { status: 500 }
    );
  }
}

