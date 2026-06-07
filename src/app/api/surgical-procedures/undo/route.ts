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

  let lastLog = null;
  const entityId = request.headers.get('x-entity-id');
  if (entityId) {
    lastLog = await prisma.activityLog.findFirst({
      where: {
        userId,
        organizationId,
        entityType: ENTITY_TYPES.SURGICAL_PROCEDURE,
        entityId,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  if (!lastLog) {
    lastLog = await prisma.activityLog.findFirst({
      where: {
        userId,
        organizationId,
        entityType: ENTITY_TYPES.SURGICAL_PROCEDURE,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  if (!lastLog) {
    return NextResponse.json({ error: 'Nu există acțiuni de anulat', code: 'NO_LOG' }, { status: 400 });
  }

  let result = null;
  let undoAction = '';
  let backup = null;

  if (lastLog.action === LOG_ACTIONS.CREATE_SURGICAL_PROCEDURE) {
    const procedure = await prisma.surgicalProcedure.findUnique({ where: { id: lastLog.entityId! } });
    if (!procedure) {
      return NextResponse.json(
        { error: 'Procedura nu a fost găsită', code: 'PROCEDURE_NOT_FOUND', details: { entityId: lastLog.entityId } },
        { status: 404 }
      );
    }
    await prisma.surgicalProcedure.delete({ where: { id: lastLog.entityId! } });
    undoAction = 'UNDO_CREATE_SURGICAL_PROCEDURE';
  } else if (lastLog.action === LOG_ACTIONS.DELETE_SURGICAL_PROCEDURE) {
    backup = await prisma.procedureBackup.findFirst();
    if (!backup) {
      return NextResponse.json(
        { error: 'Nu s-a găsit copie de rezervă pentru procedura ștearsă', code: 'NO_BACKUP_DELETE', details: { entityId: lastLog.entityId } },
        { status: 400 }
      );
    }
    const restored = await prisma.surgicalProcedure.create({
      data: Object.fromEntries(
        Object.entries(backup.data as Record<string, unknown>).filter(([key]) =>
          SURGICAL_ALLOWED_FIELDS.includes(key)
        )
      ) as Parameters<typeof prisma.surgicalProcedure.create>[0]['data'],
    });
    result = restored;
    undoAction = 'UNDO_DELETE_SURGICAL_PROCEDURE';
    await prisma.procedureBackup.deleteMany({});
  } else if (lastLog.action === LOG_ACTIONS.UPDATE_SURGICAL_PROCEDURE) {
    backup = await prisma.procedureBackup.findFirst();
    if (!backup) {
      return NextResponse.json(
        { error: 'Nu s-a găsit copie de rezervă pentru procedura editată', code: 'NO_BACKUP_EDIT', details: { entityId: lastLog.entityId } },
        { status: 400 }
      );
    }
    const updateData = Object.fromEntries(
      Object.entries(backup.data as Record<string, unknown>).filter(([key]) =>
        SURGICAL_ALLOWED_FIELDS.includes(key)
      )
    );
    const restored = await prisma.surgicalProcedure.update({
      where: { id: lastLog.entityId! },
      data: updateData,
    });
    result = restored;
    undoAction = 'UNDO_UPDATE_SURGICAL_PROCEDURE';
    await prisma.procedureBackup.deleteMany({});
  } else {
    return NextResponse.json(
      { error: 'Acțiune neacceptată pentru anulare', code: 'UNSUPPORTED_ACTION', details: { action: lastLog.action } },
      { status: 400 }
    );
  }

  await prisma.activityLog.delete({ where: { id: lastLog.id } });

  await logActivity(
    {
      action: undoAction,
      entityType: ENTITY_TYPES.SURGICAL_PROCEDURE,
      entityId: lastLog.entityId!,
      description: `Undo action: ${lastLog.action}`,
      details: { originalLog: lastLog, backup },
      patientId: lastLog.patientId,
    },
    {
      userId,
      organizationId,
      ipAddress: request.headers.get('x-forwarded-for') || '',
      userAgent: request.headers.get('user-agent') || '',
    }
  );

  return NextResponse.json({ success: true, result });
}
