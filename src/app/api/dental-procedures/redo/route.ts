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

  console.log('REDO DEBUG: Starting redo process for user:', userId, 'org:', organizationId);

  // Use a transaction to atomically find and mark the undo log
  const result = await prisma.$transaction(async (tx) => {
    // Find the most recent undo action log for this user/org that hasn't been processed yet
    const lastUndoLog = await tx.activityLog.findFirst({
      where: {
        userId,
        organizationId,
        action: {
          in: ['UNDO_CREATE_DENTAL_PROCEDURE', 'UNDO_DELETE_DENTAL_PROCEDURE', 'UNDO_UPDATE_DENTAL_PROCEDURE']
        },
        // Make sure we haven't already processed this log for redo
        description: {
          not: {
            contains: 'REDO_PROCESSED'
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    });

    console.log('REDO DEBUG: Found lastUndoLog:', lastUndoLog?.action, 'entityId:', lastUndoLog?.entityId, 'logId:', lastUndoLog?.id);

    if (!lastUndoLog) {
      console.log('REDO DEBUG: No undo log found');
      throw new Error('NO_UNDO_LOG');
    }

    // Immediately mark this log as being processed for redo to prevent duplicate processing
    // Use updateMany to avoid errors if the record was already deleted
    const updateResult = await tx.activityLog.updateMany({
      where: {
        id: lastUndoLog.id,
        description: {
          not: {
            contains: 'REDO_PROCESSED'
          }
        }
      },
      data: { description: `${lastUndoLog.description} [REDO_PROCESSED]` }
    });

    // If no records were updated, it means another request already processed this log
    if (updateResult.count === 0) {
      console.log('REDO DEBUG: Log was already processed by another request');
      throw new Error('ALREADY_PROCESSED');
    }

    console.log('REDO DEBUG: Marked log as processed');

    let result = null;
    let redoAction = '';

    if (lastUndoLog.action === 'UNDO_CREATE_DENTAL_PROCEDURE') {
      console.log('REDO DEBUG: Processing UNDO_CREATE_DENTAL_PROCEDURE');
      // Redo add: re-create the procedure
      const details = lastUndoLog.details as any;
      const originalLog = details?.originalLog;
      console.log('REDO DEBUG: originalLog:', originalLog);

      if (!originalLog) {
        console.log('REDO DEBUG: No original log found');
        throw new Error('NO_ORIGINAL_DATA');
      }

      // Extract only the data fields, excluding nested objects and ID
      const procedureData = originalLog.details?.after || {};
      console.log('REDO DEBUG: Original procedure data:', procedureData);

      const { code, practitioner, id, createdAt, updatedAt, ...cleanData } = procedureData;
      console.log('REDO DEBUG: Clean data for creation:', cleanData);

      // Special handling for sealing procedures (V35) to ensure proper grouping with V30
      if (cleanData.codeId) {
        const dentalCode = await tx.dentalCode.findUnique({
          where: { id: cleanData.codeId }
        });

        if (dentalCode?.code === 'V35') {
          console.log('REDO DEBUG: Detected V35 sealing procedure, checking for V30 grouping');

          // Find existing V30 for the same patient on the same day
          const existingV30 = await tx.dentalProcedure.findFirst({
            where: {
              patientId: cleanData.patientId,
              code: {
                code: 'V30'
              },
              date: {
                gte: new Date(new Date().setHours(0, 0, 0, 0)),
                lt: new Date(new Date().setHours(23, 59, 59, 999))
              }
            },
            include: {
              code: true
            }
          });

          if (existingV30) {
            console.log('REDO DEBUG: Found existing V30, using same timestamp for grouping:', existingV30.id);
            cleanData.date = existingV30.date;
          } else {
            console.log('REDO DEBUG: No existing V30 found, using original timestamp');
          }
        }
      }

      const procedure = await tx.dentalProcedure.create({
        data: cleanData,
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
      console.log('REDO DEBUG: Successfully created procedure:', procedure.id);
      result = procedure;
      redoAction = LOG_ACTIONS.CREATE_DENTAL_PROCEDURE;
    } else if (lastUndoLog.action === 'UNDO_DELETE_DENTAL_PROCEDURE') {
      console.log('REDO DEBUG: Processing UNDO_DELETE_DENTAL_PROCEDURE');
      // Redo delete: delete the procedure again
      const procedure = await tx.dentalProcedure.findUnique({ where: { id: lastUndoLog.entityId! } });
      console.log('REDO DEBUG: Found procedure to delete:', procedure?.id);

      if (!procedure) {
        console.log('REDO DEBUG: Procedure not found for deletion');
        throw new Error('PROCEDURE_NOT_FOUND');
      }

      // Create backup before deletion
      await tx.procedureBackup.deleteMany({});
      await tx.procedureBackup.create({
        data: {
          procedureId: procedure.id,
          organizationId,
          backupType: 'delete',
          data: procedure,
        },
      });
      console.log('REDO DEBUG: Created backup for deletion');

      await tx.dentalProcedure.delete({ where: { id: lastUndoLog.entityId! } });
      console.log('REDO DEBUG: Successfully deleted procedure');
      redoAction = LOG_ACTIONS.DELETE_DENTAL_PROCEDURE;
    } else if (lastUndoLog.action === 'UNDO_UPDATE_DENTAL_PROCEDURE') {
      console.log('REDO DEBUG: Processing UNDO_UPDATE_DENTAL_PROCEDURE');
      // Redo edit: re-apply the original edit
      const details = lastUndoLog.details as any;
      const originalLog = details?.originalLog;
      console.log('REDO DEBUG: originalLog for update:', originalLog);

      if (!originalLog) {
        console.log('REDO DEBUG: No original log found for update');
        throw new Error('NO_ORIGINAL_DATA');
      }

      const allowedFields = [
        'date', 'notes', 'status', 'quantity', 'cost', 'toothNumber', 'practitionerId', 'subSurfaces', 'fillingMaterial', 'invoiceEmail', 'invoicePrinted', 'isPaid', 'paidAt', 'paymentAmount', 'paymentMethod'
      ];

      // Extract only the data fields, excluding nested objects
      const procedureData = originalLog.details?.after || {};
      console.log('REDO DEBUG: Original procedure data for update:', procedureData);

      const { code, practitioner, id, createdAt, updatedAt, ...cleanData } = procedureData;
      console.log('REDO DEBUG: Clean data for update:', cleanData);

      const updateData = Object.fromEntries(
        Object.entries(cleanData).filter(([key]) => allowedFields.includes(key))
      );
      console.log('REDO DEBUG: Final update data:', updateData);

      const updated = await tx.dentalProcedure.update({
        where: { id: lastUndoLog.entityId! },
        data: updateData,
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
      console.log('REDO DEBUG: Successfully updated procedure:', updated.id);
      result = updated;
      redoAction = LOG_ACTIONS.UPDATE_DENTAL_PROCEDURE;
    } else if (lastUndoLog.action === 'UNDO_CREATE_BRIDGE_PROCEDURES') {
      console.log('REDO DEBUG: Processing UNDO_CREATE_BRIDGE_PROCEDURES');
      // Redo bridge creation: re-create all bridge procedures
      const details = lastUndoLog.details as any;
      const originalLog = details?.originalLog;
      console.log('REDO DEBUG: originalLog for bridge:', originalLog);

      if (!originalLog) {
        console.log('REDO DEBUG: No original log found for bridge');
        throw new Error('NO_ORIGINAL_DATA');
      }

      // Extract the original procedure data
      const procedureData = originalLog.details?.after || {};
      console.log('REDO DEBUG: Original bridge procedure data:', procedureData);

      const { code, practitioner, id, createdAt, updatedAt, ...cleanData } = procedureData;
      console.log('REDO DEBUG: Clean bridge data for creation:', cleanData);

      // Re-create the bridge procedure
      const procedure = await tx.dentalProcedure.create({
        data: cleanData,
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
      console.log('REDO DEBUG: Successfully recreated bridge procedure:', procedure.id);
      result = procedure;
      redoAction = LOG_ACTIONS.CREATE_DENTAL_PROCEDURE;
    } else {
      console.log('REDO DEBUG: Unsupported action:', lastUndoLog.action);
      throw new Error('UNSUPPORTED_ACTION');
    }

    // Remove the undo log entry
    await tx.activityLog.delete({ where: { id: lastUndoLog.id } });
    console.log('REDO DEBUG: Removed undo log entry');

    return { result, redoAction, lastUndoLog };
  }).catch(error => {
    if (error.message === 'ALREADY_PROCESSED') {
      console.log('REDO DEBUG: Log was already processed by another request (expected)');
      return NextResponse.json({ error: 'Action already processed by another request', code: 'ALREADY_PROCESSED' }, { status: 409 });
    } else {
      console.error('REDO DEBUG: Transaction error:', error);
    }

    if (error.message === 'NO_UNDO_LOG') {
      return NextResponse.json({ error: 'No actions to redo', code: 'NO_UNDO_LOG' }, { status: 400 });
    } else if (error.message === 'NO_ORIGINAL_DATA') {
      return NextResponse.json({ error: 'No original data found for redo', code: 'NO_ORIGINAL_DATA' }, { status: 400 });
    } else if (error.message === 'PROCEDURE_NOT_FOUND') {
      return NextResponse.json({ error: 'Procedure not found for redo', code: 'PROCEDURE_NOT_FOUND' }, { status: 404 });
    } else if (error.message === 'UNSUPPORTED_ACTION') {
      return NextResponse.json({ error: 'Unsupported action for redo', code: 'UNSUPPORTED_ACTION' }, { status: 400 });
    } else {
      return NextResponse.json({ error: 'Failed to process redo', code: 'PROCESSING_FAILED', details: error }, { status: 500 });
    }
  });

  // If we got an error response, return it
  if (result instanceof NextResponse) {
    return result;
  }

  // Log the redo action
  try {
    await logActivity({
      action: result.redoAction,
      entityType: ENTITY_TYPES.DENTAL_PROCEDURE,
      entityId: result.lastUndoLog.entityId!,
      description: `Redo action: ${result.lastUndoLog.action}`,
      details: { originalUndoLog: result.lastUndoLog },
      patientId: result.lastUndoLog.patientId,
    }, {
      userId,
      organizationId,
      ipAddress: request.headers.get('x-forwarded-for') || '',
      userAgent: request.headers.get('user-agent') || '',
    });
    console.log('REDO DEBUG: Logged redo action');
  } catch (error) {
    console.error('REDO DEBUG: Error logging redo action:', error);
    // Continue even if logging fails
  }

  console.log('REDO DEBUG: Redo completed successfully');
  return NextResponse.json({ success: true, result: result.result });
} 