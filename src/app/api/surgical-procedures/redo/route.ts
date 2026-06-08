export { dynamic } from '@/lib/api-config'

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { LOG_ACTIONS, ENTITY_TYPES, logActivity } from '@/lib/activity-logger';

const SURGICAL_ALLOWED_FIELDS = [
  'patientId',
  'codeId',
  'date',
  'notes',
  'status',
  'quantity',
  'cost',
  'bodyArea',
  'procedureType',
  'anesthesiaType',
  'practitionerId',
  'invoiceEmail',
  'invoicePrinted',
  'isPaid',
  'paidAt',
  'paymentAmount',
  'paymentMethod',
];

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Neautorizat', code: 'UNAUTHORIZED' }, { status: 401 });
  }

  const userId = session.user.id;
  const organizationId = session.user.organizationId;

  const result = await prisma.$transaction(async (tx) => {
    const lastUndoLog = await tx.activityLog.findFirst({
      where: {
        userId,
        organizationId,
        action: {
          in: [
            'UNDO_CREATE_SURGICAL_PROCEDURE',
            'UNDO_DELETE_SURGICAL_PROCEDURE',
            'UNDO_UPDATE_SURGICAL_PROCEDURE',
          ],
        },
        description: { not: { contains: 'REDO_PROCESSED' } },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!lastUndoLog) {
      throw new Error('NO_UNDO_LOG');
    }

    const updateResult = await tx.activityLog.updateMany({
      where: {
        id: lastUndoLog.id,
        description: { not: { contains: 'REDO_PROCESSED' } },
      },
      data: { description: `${lastUndoLog.description} [REDO_PROCESSED]` },
    });

    if (updateResult.count === 0) {
      throw new Error('ALREADY_PROCESSED');
    }

    let redoResult = null;
    let redoAction = '';
    const details = lastUndoLog.details as Record<string, unknown> | null;
    const originalLog = details?.originalLog as { details?: { after?: Record<string, unknown> } } | undefined;

    if (lastUndoLog.action === 'UNDO_CREATE_SURGICAL_PROCEDURE') {
      if (!originalLog) throw new Error('NO_ORIGINAL_DATA');
      const procedureData = originalLog.details?.after || {};
      const { code, practitioner, id, createdAt, updatedAt, ...cleanData } = procedureData;
      const procedure = await tx.surgicalProcedure.create({
        data: Object.fromEntries(
          Object.entries(cleanData).filter(([key]) => SURGICAL_ALLOWED_FIELDS.includes(key))
        ) as Parameters<typeof tx.surgicalProcedure.create>[0]['data'],
        include: {
          code: true,
          practitioner: { select: { id: true, firstName: true, lastName: true } },
        },
      });
      redoResult = procedure;
      redoAction = LOG_ACTIONS.CREATE_SURGICAL_PROCEDURE;
    } else if (lastUndoLog.action === 'UNDO_DELETE_SURGICAL_PROCEDURE') {
      const procedure = await tx.surgicalProcedure.findUnique({ where: { id: lastUndoLog.entityId! } });
      if (!procedure) throw new Error('PROCEDURE_NOT_FOUND');

      await tx.procedureBackup.deleteMany({});
      await tx.procedureBackup.create({
        data: {
          procedureId: procedure.id,
          organizationId,
          backupType: 'delete',
          data: procedure,
        },
      });
      await tx.surgicalProcedure.delete({ where: { id: lastUndoLog.entityId! } });
      redoAction = LOG_ACTIONS.DELETE_SURGICAL_PROCEDURE;
    } else if (lastUndoLog.action === 'UNDO_UPDATE_SURGICAL_PROCEDURE') {
      if (!originalLog) throw new Error('NO_ORIGINAL_DATA');
      const procedureData = originalLog.details?.after || {};
      const { code, practitioner, id, createdAt, updatedAt, ...cleanData } = procedureData;
      const updateData = Object.fromEntries(
        Object.entries(cleanData).filter(([key]) => SURGICAL_ALLOWED_FIELDS.includes(key))
      );
      const updated = await tx.surgicalProcedure.update({
        where: { id: lastUndoLog.entityId! },
        data: updateData,
        include: {
          code: true,
          practitioner: { select: { id: true, firstName: true, lastName: true } },
        },
      });
      redoResult = updated;
      redoAction = LOG_ACTIONS.UPDATE_SURGICAL_PROCEDURE;
    } else {
      throw new Error('UNSUPPORTED_ACTION');
    }

    await tx.activityLog.delete({ where: { id: lastUndoLog.id } });

    return { redoResult, redoAction, lastUndoLog };
  }).catch((error: Error) => {
    if (error.message === 'ALREADY_PROCESSED') {
      return NextResponse.json(
        { error: 'Acțiunea a fost deja procesată de o altă cerere', code: 'ALREADY_PROCESSED' },
        { status: 409 }
      );
    }
    if (error.message === 'NO_UNDO_LOG') {
      return NextResponse.json({ error: 'Nu există acțiuni de refăcut', code: 'NO_UNDO_LOG' }, { status: 400 });
    }
    if (error.message === 'NO_ORIGINAL_DATA') {
      return NextResponse.json({ error: 'Nu s-au găsit date originale pentru refacere', code: 'NO_ORIGINAL_DATA' }, { status: 400 });
    }
    if (error.message === 'PROCEDURE_NOT_FOUND') {
      return NextResponse.json({ error: 'Procedura nu a fost găsită pentru refacere', code: 'PROCEDURE_NOT_FOUND' }, { status: 404 });
    }
    if (error.message === 'UNSUPPORTED_ACTION') {
      return NextResponse.json({ error: 'Acțiune neacceptată pentru refacere', code: 'UNSUPPORTED_ACTION' }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'Procesarea refacerii a eșuat', code: 'PROCESSING_FAILED', details: String(error) },
      { status: 500 }
    );
  });

  if (result instanceof NextResponse) {
    return result;
  }

  await logActivity(
    {
      action: result.redoAction,
      entityType: ENTITY_TYPES.SURGICAL_PROCEDURE,
      entityId: result.lastUndoLog.entityId!,
      description: `Redo action: ${result.lastUndoLog.action}`,
      details: { originalUndoLog: result.lastUndoLog },
      patientId: result.lastUndoLog.patientId,
    },
    {
      userId,
      organizationId,
      ipAddress: request.headers.get('x-forwarded-for') || '',
      userAgent: request.headers.get('user-agent') || '',
    }
  );

  return NextResponse.json({ success: true, result: result.redoResult });
}
