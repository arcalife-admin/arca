import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { logActivity, LOG_ACTIONS, ENTITY_TYPES } from '@/lib/activity-logger';

// PUT - Update a dental procedure
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
    const { date, notes, status, quantity } = body;

    // Fetch pre-edit procedure for backup and logging
    const preEdit = await prisma.dentalProcedure.findUnique({
      where: { id: params.procedureId },
    });

    // Save pre-edit to ProcedureBackup (type 'edit')
    if (preEdit) {
      // Delete any existing backup row first
      await prisma.procedureBackup.deleteMany({});
      await prisma.procedureBackup.create({
        data: {
          procedureId: params.procedureId,
          organizationId: session.user.organizationId,
          backupType: 'edit',
          data: preEdit,
        },
      });
    }

    // Update the dental procedure
    const procedure = await prisma.dentalProcedure.update({
      where: {
        id: params.procedureId,
        patientId: params.id, // Ensure the procedure belongs to the patient
      },
      data: {
        ...(date && { date: new Date(date) }),
        ...(notes !== undefined && { notes }),
        ...(status && { status }),
        ...(quantity !== undefined && { quantity }),
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

    // Log edit in manager log system
    await logActivity({
      action: LOG_ACTIONS.UPDATE_DENTAL_PROCEDURE,
      entityType: ENTITY_TYPES.DENTAL_PROCEDURE,
      entityId: procedure.id,
      description: `Edited dental procedure for patient ${params.id}`,
      details: { before: preEdit, after: procedure, source: body.source || 'unknown' },
      patientId: params.id,
    }, {
      userId: session.user.id,
      organizationId: session.user.organizationId,
      ipAddress: request.headers.get('x-forwarded-for') || '',
      userAgent: request.headers.get('user-agent') || '',
    });

    return NextResponse.json(procedure);
  } catch (error) {
    console.error('Error updating dental procedure:', error);
    return NextResponse.json(
      { error: 'Failed to update dental procedure' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a dental procedure
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
    const toDelete = await prisma.dentalProcedure.findUnique({
      where: { id: params.procedureId },
    });
    // Save to ProcedureBackup (type 'delete')
    if (toDelete) {
      // Delete any existing backup row first
      await prisma.procedureBackup.deleteMany({});
      await prisma.procedureBackup.create({
        data: {
          procedureId: params.procedureId,
          organizationId: session.user.organizationId,
          backupType: 'delete',
          data: toDelete,
        },
      });
    }
    // Delete the dental procedure
    await prisma.dentalProcedure.delete({
      where: {
        id: params.procedureId,
        patientId: params.id, // Ensure the procedure belongs to the patient
      },
    });
    // Log deletion in manager log system
    await logActivity({
      action: LOG_ACTIONS.DELETE_DENTAL_PROCEDURE,
      entityType: ENTITY_TYPES.DENTAL_PROCEDURE,
      entityId: params.procedureId,
      description: `Deleted dental procedure for patient ${params.id}`,
      details: { before: toDelete, source: 'unknown' },
      patientId: params.id,
    }, {
      userId: session.user.id,
      organizationId: session.user.organizationId,
      ipAddress: request.headers.get('x-forwarded-for') || '',
      userAgent: request.headers.get('user-agent') || '',
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting dental procedure:', error);
    return NextResponse.json(
      { error: 'Failed to delete dental procedure' },
      { status: 500 }
    );
  }
} 