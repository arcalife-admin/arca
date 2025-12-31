import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { AppointmentStatusMetadata, APPOINTMENT_STATUS_CONFIGS } from '@/types/appointment-status';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();
    const { status, mergeWithNotes, importantNote }: {
      status: AppointmentStatusMetadata;
      mergeWithNotes?: boolean;
      importantNote?: string;
    } = body;

    // Validate status type
    if (!status || !APPOINTMENT_STATUS_CONFIGS[status.type]) {
      return NextResponse.json({ error: 'Invalid status type' }, { status: 400 });
    }

    const config = APPOINTMENT_STATUS_CONFIGS[status.type];

    // Validate required inputs
    if (config.requiresInput) {
      if (config.inputType === 'minutes' && (!status.minutesLate || status.minutesLate <= 0)) {
        return NextResponse.json({ error: 'Minutes late is required for running late status' }, { status: 400 });
      }
      if (config.inputType === 'note' && (!status.importantNote || status.importantNote.trim() === '')) {
        return NextResponse.json({ error: 'Important note is required for important status' }, { status: 400 });
      }
    }

    // Verify appointment exists and user has access
    const existingAppointment = await prisma.appointment.findFirst({
      where: {
        id: id,
        practitioner: {
          organizationId: session.user.organizationId
        }
      },
      include: {
        patient: true,
        practitioner: true
      }
    });

    if (!existingAppointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    // Prepare status data with timestamp
    const statusData: AppointmentStatusMetadata = {
      ...status,
      timestamp: new Date()
    };

    // Prepare update data
    const updateData: any = {
      appointmentStatus: statusData as any, // Prisma Json type
      updatedAt: new Date()
    };

    // If this is an important status and we need to merge with notes
    if (mergeWithNotes && importantNote && status.type === 'important') {
      const currentNotes = existingAppointment.notes || '';
      const newNotes = currentNotes
        ? `${currentNotes}\n\n[IMPORTANT] ${importantNote}`
        : `[IMPORTANT] ${importantNote}`;
      updateData.notes = newNotes;
    }

    // Update appointment status (and notes if merging)
    const updatedAppointment = await prisma.appointment.update({
      where: { id: id },
      data: updateData,
      include: {
        patient: true,
        practitioner: true
      }
    });

    return NextResponse.json({
      success: true,
      appointment: updatedAppointment,
      statusConfig: config
    });

  } catch (error) {
    console.error('Error updating appointment status:', error);
    return NextResponse.json(
      { error: 'Failed to update appointment status' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    // Get the clearNotes option from request body
    let clearNotes = false;
    try {
      const body = await request.json();
      clearNotes = body.clearNotes || false;
    } catch {
      // If no body or parsing fails, default to false
      clearNotes = false;
    }

    // Verify appointment exists and user has access
    const existingAppointment = await prisma.appointment.findFirst({
      where: {
        id: id,
        practitioner: {
          organizationId: session.user.organizationId
        }
      }
    });

    if (!existingAppointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    // Prepare update data
    const updateData: any = {
      appointmentStatus: null,
      updatedAt: new Date()
    };

    // If clearing notes and the appointment has important notes, remove them
    if (clearNotes && existingAppointment.notes) {
      const currentNotes = existingAppointment.notes;
      // Remove lines that start with [IMPORTANT]
      const cleanedNotes = currentNotes
        .split('\n')
        .filter(line => !line.trim().startsWith('[IMPORTANT]'))
        .join('\n')
        .trim();

      updateData.notes = cleanedNotes || null;
    }

    // Clear appointment status (and optionally notes)
    const updatedAppointment = await prisma.appointment.update({
      where: { id: id },
      data: updateData,
      include: {
        patient: true,
        practitioner: true
      }
    });

    return NextResponse.json({
      success: true,
      appointment: updatedAppointment
    });

  } catch (error) {
    console.error('Error clearing appointment status:', error);
    return NextResponse.json(
      { error: 'Failed to clear appointment status' },
      { status: 500 }
    );
  }
} 