import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { LOG_ACTIONS, ENTITY_TYPES, logActivity } from '@/lib/activity-logger';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
  }
  const userId = session.user.id;
  const organizationId = session.user.organizationId;

  // Find the last dental procedure log for this user/org and entityId (procedure)
  let lastLog = null;
  if (request.headers.get('x-entity-id')) {
    // If a specific procedure is targeted
    lastLog = await prisma.activityLog.findFirst({
      where: {
        userId,
        organizationId,
        entityType: ENTITY_TYPES.DENTAL_PROCEDURE,
        entityId: request.headers.get('x-entity-id'),
      },
      orderBy: { createdAt: 'desc' },
    });
  }
  if (!lastLog) {
    // Fallback: most recent log for user/org
    lastLog = await prisma.activityLog.findFirst({
      where: {
        userId,
        organizationId,
        entityType: ENTITY_TYPES.DENTAL_PROCEDURE,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
  if (!lastLog) {
    return NextResponse.json({ error: 'No actions to undo', code: 'NO_LOG' }, { status: 400 });
  }

  let result = null;
  let undoAction = '';
  let backup = null;

  if (lastLog.action === LOG_ACTIONS.CREATE_DENTAL_PROCEDURE) {
    // Undo add: delete the procedure
    const procedure = await prisma.dentalProcedure.findUnique({ where: { id: lastLog.entityId! } });
    if (!procedure) {
      console.error('UNDO ERROR: Procedure not found for deletion. entityId:', lastLog.entityId);
      return NextResponse.json({ error: 'Procedure not found for undo (add)', code: 'PROCEDURE_NOT_FOUND', details: { entityId: lastLog.entityId } }, { status: 404 });
    }

    // Check if this is a bridge procedure
    if (procedure.notes?.includes('bridge')) {
      // Extract bridge ID from the notes - handle multiple formats
      const bridgeIdMatch = procedure.notes?.match(/bridge[- ]([^\s]+)/i) ||
        procedure.notes?.match(/BRIDGE-bridge-([^\s]+)/i) ||
        procedure.notes?.match(/BRIDGE-bridge-bridge-([^\s]+)/i);
      if (bridgeIdMatch) {
        const bridgeId = bridgeIdMatch[1];

        // Find all procedures that belong to the same bridge
        const bridgeProcedures = await prisma.dentalProcedure.findMany({
          where: {
            patientId: procedure.patientId,
            OR: [
              { notes: { contains: `bridge-${bridgeId}` } },
              { notes: { contains: `bridge ${bridgeId}` } },
              { notes: { contains: `BRIDGE-${bridgeId}` } },
              { notes: { contains: `BRIDGE-bridge-${bridgeId}` } },
              { notes: { contains: `BRIDGE-bridge-bridge-${bridgeId}` } }
            ]
          }
        });

        if (bridgeProcedures.length > 1) {
          // Delete all bridge procedures together
          await prisma.dentalProcedure.deleteMany({
            where: {
              id: { in: bridgeProcedures.map(p => p.id) }
            }
          });
          undoAction = 'UNDO_CREATE_BRIDGE_PROCEDURES';
        } else {
          // Single bridge procedure, delete normally
          await prisma.dentalProcedure.delete({ where: { id: lastLog.entityId! } });
          undoAction = 'UNDO_CREATE_DENTAL_PROCEDURE';
        }
      } else {
        // Bridge procedure without clear ID, delete normally
        await prisma.dentalProcedure.delete({ where: { id: lastLog.entityId! } });
        undoAction = 'UNDO_CREATE_DENTAL_PROCEDURE';
      }
    } else {
      // Non-bridge procedure, delete normally
      await prisma.dentalProcedure.delete({ where: { id: lastLog.entityId! } });
      undoAction = 'UNDO_CREATE_DENTAL_PROCEDURE';
    }
  } else if (lastLog.action === LOG_ACTIONS.DELETE_DENTAL_PROCEDURE) {
    // Undo delete: restore from backup
    backup = await prisma.procedureBackup.findFirst();
    if (!backup) {
      return NextResponse.json({ error: 'No backup found for deleted procedure', code: 'NO_BACKUP_DELETE', details: { entityId: lastLog.entityId } }, { status: 400 });
    }
    // Restore the procedure
    const restored = await prisma.dentalProcedure.create({ data: backup.data });
    result = restored;
    undoAction = 'UNDO_DELETE_DENTAL_PROCEDURE';
    // If it's a filling, update the dental chart
    if (backup.data.subSurfaces && backup.data.subSurfaces.length > 0 && backup.data.fillingMaterial) {
      // Fetch current dental chart
      const patientId = backup.data.patientId;
      const toothNumber = backup.data.toothNumber;
      const subSurfaces = backup.data.subSurfaces;
      const material = backup.data.fillingMaterial;
      // Fetch current chart
      const chartRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/patients/${patientId}/dental`, { method: 'GET' });
      const chartData = chartRes.ok ? await chartRes.json() : {};
      const currentChart = chartData.dentalChart || { teeth: {} };
      // Update chart for the tooth
      const updatedChart = { ...currentChart };
      if (!updatedChart.teeth) updatedChart.teeth = {};
      if (!updatedChart.teeth[toothNumber]) updatedChart.teeth[toothNumber] = { zones: {}, procedures: [] };
      subSurfaces.forEach((surface) => {
        updatedChart.teeth[toothNumber].zones = updatedChart.teeth[toothNumber].zones || {};
        updatedChart.teeth[toothNumber].zones[surface] = `filling-current-${material}`;
      });
      // Save updated chart
      await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/patients/${patientId}/dental`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dentalChart: updatedChart })
      });
    }
    // Delete the backup after restore
    await prisma.procedureBackup.deleteMany({});
  } else if (lastLog.action === LOG_ACTIONS.UPDATE_DENTAL_PROCEDURE) {
    // Undo edit: restore pre-edit from backup
    backup = await prisma.procedureBackup.findFirst();
    if (!backup) {
      return NextResponse.json({ error: 'No backup found for edited procedure', code: 'NO_BACKUP_EDIT', details: { entityId: lastLog.entityId } }, { status: 400 });
    }
    // Restore all relevant fields
    const allowedFields = [
      'date', 'notes', 'status', 'quantity', 'cost', 'toothNumber', 'practitionerId', 'subSurfaces', 'fillingMaterial', 'invoiceEmail', 'invoicePrinted', 'isPaid', 'paidAt', 'paymentAmount', 'paymentMethod'
    ];
    const updateData = Object.fromEntries(
      Object.entries(backup.data).filter(([key]) => allowedFields.includes(key))
    );
    const restored = await prisma.dentalProcedure.update({
      where: { id: lastLog.entityId! },
      data: updateData,
    });
    result = restored;
    undoAction = 'UNDO_UPDATE_DENTAL_PROCEDURE';
    // If it's a filling, update the dental chart
    if (backup.data.subSurfaces && backup.data.subSurfaces.length > 0 && backup.data.fillingMaterial) {
      const patientId = backup.data.patientId;
      const toothNumber = backup.data.toothNumber;
      const subSurfaces = backup.data.subSurfaces;
      const material = backup.data.fillingMaterial;
      // Fetch current chart
      const chartRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/patients/${patientId}/dental`, { method: 'GET' });
      const chartData = chartRes.ok ? await chartRes.json() : {};
      const currentChart = chartData.dentalChart || { teeth: {} };
      // Update chart for the tooth
      const updatedChart = { ...currentChart };
      if (!updatedChart.teeth) updatedChart.teeth = {};
      if (!updatedChart.teeth[toothNumber]) updatedChart.teeth[toothNumber] = { zones: {}, procedures: [] };
      subSurfaces.forEach((surface) => {
        updatedChart.teeth[toothNumber].zones = updatedChart.teeth[toothNumber].zones || {};
        updatedChart.teeth[toothNumber].zones[surface] = `filling-current-${material}`;
      });
      // Save updated chart
      await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/patients/${patientId}/dental`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dentalChart: updatedChart })
      });
    }
    // Delete the backup after restore
    await prisma.procedureBackup.deleteMany({});
  } else {
    return NextResponse.json({ error: 'Unsupported action for undo', code: 'UNSUPPORTED_ACTION', details: { action: lastLog.action } }, { status: 400 });
  }

  // Remove the last log entry
  await prisma.activityLog.delete({ where: { id: lastLog.id } });

  // Log the undo action
  await logActivity({
    action: undoAction,
    entityType: ENTITY_TYPES.DENTAL_PROCEDURE,
    entityId: lastLog.entityId!,
    description: `Undo action: ${lastLog.action}`,
    details: { originalLog: lastLog, backup },
    patientId: lastLog.patientId,
  }, {
    userId,
    organizationId,
    ipAddress: request.headers.get('x-forwarded-for') || '',
    userAgent: request.headers.get('user-agent') || '',
  });

  return NextResponse.json({ success: true, result });
} 