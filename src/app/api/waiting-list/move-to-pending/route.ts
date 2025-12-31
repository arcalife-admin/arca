import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const { waitingAppointmentId, practitionerId } = data;

    // Get the waiting appointment
    const waitingAppointment = await prisma.waitingAppointment.findUnique({
      where: { id: waitingAppointmentId },
      include: {
        patient: true,
        waitingListEntry: true,
      },
    });

    if (!waitingAppointment) {
      return NextResponse.json(
        { error: 'Waiting appointment not found' },
        { status: 404 }
      );
    }

    // Create pending appointment
    const pendingAppointment = await prisma.pendingAppointment.create({
      data: {
        patientId: waitingAppointment.patientId,
        practitionerId: practitionerId || null,
        startTime: waitingAppointment.startTime,
        endTime: waitingAppointment.endTime,
        duration: waitingAppointment.duration,
        type: waitingAppointment.type,
        status: 'PENDING',
        notes: waitingAppointment.notes,
        priority: waitingAppointment.priority,
        requestedBy: session.user.id,
      },
      include: {
        patient: true,
        doctor: true,
      },
    });

    // Remove the waiting appointment from the waiting list entry
    if (waitingAppointment.waitingListEntry) {
      await prisma.waitingListEntry.update({
        where: { id: waitingAppointment.waitingListEntry.id },
        data: {
          waitingAppointmentId: null,
        },
      });
    }

    // Delete the waiting appointment
    await prisma.waitingAppointment.delete({
      where: { id: waitingAppointmentId },
    });

    return NextResponse.json(pendingAppointment);
  } catch (error) {
    console.error('Error moving waiting appointment to pending:', error);
    return NextResponse.json(
      { error: 'Failed to move waiting appointment to pending' },
      { status: 500 }
    );
  }
} 