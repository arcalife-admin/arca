import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const practitionerId = searchParams.get('practitionerId');
    const includeCompleted = searchParams.get('includeCompleted') === 'true';

    // Get waiting list entries with patient counts grouped by practitioner
    const whereClause: any = {
      status: includeCompleted ? undefined : 'ACTIVE',
    };

    if (practitionerId) {
      whereClause.practitionerId = practitionerId;
    }

    const waitingListEntries = await prisma.waitingListEntry.findMany({
      where: whereClause,
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
          },
        },
        practitioner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        waitingAppointment: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(waitingListEntries);
  } catch (error) {
    console.error('Error fetching waiting list:', error);
    return NextResponse.json(
      { error: 'Failed to fetch waiting list' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const { patientId, practitionerId, notes, waitingAppointment } = data;

    // Create waiting appointment if provided
    let waitingAppointmentId = null;
    if (waitingAppointment) {
      const createdWaitingAppointment = await prisma.waitingAppointment.create({
        data: {
          patientId,
          type: waitingAppointment.type,
          duration: waitingAppointment.duration,
          notes: waitingAppointment.notes,
          priority: waitingAppointment.priority || 'medium',
          startTime: waitingAppointment.startTime ? new Date(waitingAppointment.startTime) : null,
          endTime: waitingAppointment.endTime ? new Date(waitingAppointment.endTime) : null,
          createdBy: session.user.id,
        },
      });
      waitingAppointmentId = createdWaitingAppointment.id;
    }

    // Create waiting list entry
    const waitingListEntry = await prisma.waitingListEntry.create({
      data: {
        patientId,
        practitionerId,
        notes,
        createdBy: session.user.id,
        waitingAppointmentId,
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
          },
        },
        practitioner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        waitingAppointment: true,
      },
    });

    return NextResponse.json(waitingListEntry);
  } catch (error) {
    console.error('Error creating waiting list entry:', error);
    return NextResponse.json(
      { error: 'Failed to create waiting list entry' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const { id, notes, status, waitingAppointment } = data;

    // Update waiting appointment if provided
    if (waitingAppointment && data.waitingAppointmentId) {
      await prisma.waitingAppointment.update({
        where: { id: data.waitingAppointmentId },
        data: {
          type: waitingAppointment.type,
          duration: waitingAppointment.duration,
          notes: waitingAppointment.notes,
          priority: waitingAppointment.priority,
          startTime: waitingAppointment.startTime ? new Date(waitingAppointment.startTime) : null,
          endTime: waitingAppointment.endTime ? new Date(waitingAppointment.endTime) : null,
        },
      });
    }

    // Update waiting list entry
    const waitingListEntry = await prisma.waitingListEntry.update({
      where: { id },
      data: {
        notes,
        status,
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
          },
        },
        practitioner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        waitingAppointment: true,
      },
    });

    return NextResponse.json(waitingListEntry);
  } catch (error) {
    console.error('Error updating waiting list entry:', error);
    return NextResponse.json(
      { error: 'Failed to update waiting list entry' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Waiting list entry ID is required' },
        { status: 400 }
      );
    }

    // Get the entry to check if it has a waiting appointment
    const entry = await prisma.waitingListEntry.findUnique({
      where: { id },
      include: { waitingAppointment: true },
    });

    // Delete waiting appointment if it exists
    if (entry?.waitingAppointmentId) {
      await prisma.waitingAppointment.delete({
        where: { id: entry.waitingAppointmentId },
      });
    }

    // Delete waiting list entry
    await prisma.waitingListEntry.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting waiting list entry:', error);
    return NextResponse.json(
      { error: 'Failed to delete waiting list entry' },
      { status: 500 }
    );
  }
} 