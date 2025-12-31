import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Appointment } from '@/types/appointment';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';

// Helper function to validate session and get user data
async function validateSession() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    throw new Error('Unauthorized - No valid session');
  }

  // Ensure we have the required user data
  if (!session.user.organizationId) {
    throw new Error('Unauthorized - Missing organization ID');
  }

  return session;
}



export async function GET(request: Request) {
  try {
    // Validate session for security
    await validateSession();

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const practitionerId = searchParams.get('practitionerId');

    const appointments = await db.executeWithRetry(async () => {
      const prisma = db.getPrismaClient();
      return await prisma.appointment.findMany({
        where: {
          ...((startDate || endDate) && {
            startTime: {
              ...(startDate && { gte: new Date(startDate) }),
              ...(endDate && { lte: new Date(endDate) })
            }
          }),
          ...(practitionerId ? { practitionerId } : {}),
        },
        include: {
          patient: true,
          practitioner: true,
        },
      });
    });

    return NextResponse.json(appointments);
  } catch (error) {
    console.error('Error fetching appointments:', error);

    // Return appropriate error response
    if (error instanceof Error) {
      if (error.message.includes('Unauthorized')) {
        return NextResponse.json({ error: error.message }, { status: 401 });
      }
    }

    return NextResponse.json(
      { error: 'Failed to fetch appointments' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    // Validate session for security
    await validateSession();

    const data = await request.json();

    // Batch creation: if data is an array, create all appointments in a transaction
    if (Array.isArray(data)) {
      const created = await db.executeWithRetry(async () => {
        const prisma = db.getPrismaClient();
        return await prisma.$transaction(
          data.map(appt =>
            prisma.appointment.create({
              data: {
                startTime: new Date(appt.startTime),
                endTime: new Date(appt.endTime),
                duration: appt.duration,
                type: typeof appt.type === 'string' ? appt.type : appt.type?.name || '',
                status: appt.status || 'SCHEDULED',
                notes: appt.notes,
                patientId: appt.patientId,
                practitionerId: appt.practitionerId,
                appointmentType: appt.appointmentType || 'REGULAR',
                isReservation: appt.isReservation || false,
                isFamilyAppointment: appt.isFamilyAppointment || false,
              },
              include: {
                patient: true,
                practitioner: true,
              },
            })
          )
        );
      });
      return NextResponse.json(created);
    }

    // Handle family appointments - create multiple appointments
    if (data.isFamilyAppointment && data.familyAppointmentRequest) {
      const { familyAppointmentRequest } = data;
      const familyAppointmentId = `family_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Convert patient codes to patient IDs
      const patients = await db.executeWithRetry(async () => {
        const prisma = db.getPrismaClient();
        return await prisma.patient.findMany({
          where: {
            patientCode: { in: familyAppointmentRequest.selectedPatientCodes }
          },
          select: { id: true, patientCode: true }
        });
      });

      if (patients.length !== familyAppointmentRequest.selectedPatientCodes.length) {
        return NextResponse.json(
          { error: 'One or more patient codes not found' },
          { status: 404 }
        );
      }

      const appointments = [];
      let currentStartTime = new Date(familyAppointmentRequest.startTime);

      // Create appointments in the order of the selected patient codes
      for (const patientCode of familyAppointmentRequest.selectedPatientCodes) {
        const patient = patients.find(p => p.patientCode === patientCode);
        if (!patient) continue;

        const endTime = new Date(currentStartTime.getTime() + familyAppointmentRequest.duration * 60000);

        const appointment = await db.executeWithRetry(async () => {
          const prisma = db.getPrismaClient();
          return await prisma.appointment.create({
            data: {
              startTime: currentStartTime,
              endTime: endTime,
              duration: familyAppointmentRequest.duration,
              type: typeof familyAppointmentRequest.type === 'string' ? familyAppointmentRequest.type : familyAppointmentRequest.type?.name || '',
              status: 'SCHEDULED',
              notes: familyAppointmentRequest.notes,
              patientId: patient.id,
              practitionerId: familyAppointmentRequest.practitionerId,
              appointmentType: 'FAMILY',
              isFamilyAppointment: true,
              familyAppointmentId: familyAppointmentId,
            },
            include: {
              patient: true,
              practitioner: true,
            },
          });
        });

        appointments.push(appointment);
        // Move start time for next appointment
        currentStartTime = endTime;
      }

      return NextResponse.json(appointments);
    }

    // Handle reservation appointments
    if (data.isReservation && data.reservationRequest) {
      const { reservationRequest } = data;
      const appointment = await db.executeWithRetry(async () => {
        const prisma = db.getPrismaClient();
        return await prisma.appointment.create({
          data: {
            startTime: new Date(reservationRequest.startTime),
            endTime: new Date(new Date(reservationRequest.startTime).getTime() + reservationRequest.duration * 60000),
            duration: reservationRequest.duration,
            type: 'Reservation',
            status: 'SCHEDULED',
            notes: reservationRequest.notes,
            patientId: reservationRequest.patientId || null, // Optional patient
            practitionerId: reservationRequest.practitionerId,
            appointmentType: 'RESERVATION',
            isReservation: true,
            reservationColor: reservationRequest.reservationColor,
          },
          include: {
            patient: true,
            practitioner: true,
          },
        });
      });

      return NextResponse.json(appointment);
    }

    // Handle regular appointments
    const appointment = await db.executeWithRetry(async () => {
      const prisma = db.getPrismaClient();
      return await prisma.appointment.create({
        data: {
          startTime: new Date(data.startTime),
          endTime: new Date(data.endTime),
          duration: data.duration,
          type: typeof data.type === 'string' ? data.type : data.type?.name || '',
          status: data.status || 'SCHEDULED',
          notes: data.notes,
          patientId: data.patientId,
          practitionerId: data.practitionerId,
          appointmentType: 'REGULAR',
          isReservation: false,
          isFamilyAppointment: false,
        },
        include: {
          patient: true,
          practitioner: true,
        },
      });
    });

    return NextResponse.json(appointment);
  } catch (error) {
    console.error('Error creating appointment:', error);

    // Return appropriate error response
    if (error instanceof Error) {
      if (error.message.includes('Unauthorized')) {
        return NextResponse.json({ error: error.message }, { status: 401 });
      }
    }

    return NextResponse.json(
      { error: 'Failed to create appointment' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    // Validate session for security
    await validateSession();

    const data = await request.json();

    const updateData: any = {
      startTime: new Date(data.startTime),
      endTime: new Date(data.endTime),
      duration: data.duration,
      type: typeof data.type === 'string' ? data.type : data.type?.name || '',
      status: data.status,
      notes: data.notes,
      practitionerId: data.practitionerId,
    };

    // Handle optional patientId for reservations
    if (data.patientId !== undefined) {
      updateData.patientId = data.patientId;
    }

    // Handle reservation color updates
    if (data.reservationColor !== undefined) {
      updateData.reservationColor = data.reservationColor;
    }

    const appointment = await db.executeWithRetry(async () => {
      const prisma = db.getPrismaClient();
      return await prisma.appointment.update({
        where: { id: data.id },
        data: updateData,
        include: {
          patient: true,
          practitioner: true,
        },
      });
    });

    return NextResponse.json(appointment);
  } catch (error) {
    console.error('Error updating appointment:', error);

    // Return appropriate error response
    if (error instanceof Error) {
      if (error.message.includes('Unauthorized')) {
        return NextResponse.json({ error: error.message }, { status: 401 });
      }
    }

    return NextResponse.json(
      { error: 'Failed to update appointment' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    // Validate session for security
    await validateSession();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const deleteFamilyGroup = searchParams.get('deleteFamilyGroup') === 'true';

    if (!id) {
      return NextResponse.json(
        { error: 'Appointment ID is required' },
        { status: 400 }
      );
    }

    // If it's a family appointment and deleteFamilyGroup is true, delete all related appointments
    if (deleteFamilyGroup) {
      const appointment = await db.executeWithRetry(async () => {
        const prisma = db.getPrismaClient();
        return await prisma.appointment.findUnique({
          where: { id },
          select: { familyAppointmentId: true, isFamilyAppointment: true }
        });
      });

      if (appointment?.isFamilyAppointment && appointment.familyAppointmentId) {
        await db.executeWithRetry(async () => {
          const prisma = db.getPrismaClient();
          return await prisma.appointment.deleteMany({
            where: { familyAppointmentId: appointment.familyAppointmentId },
          });
        });

        return NextResponse.json({ success: true, deletedCount: 'family-group' });
      }
    }

    // Delete single appointment
    await db.executeWithRetry(async () => {
      const prisma = db.getPrismaClient();
      return await prisma.appointment.delete({
        where: { id },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting appointment:', error);

    // Return appropriate error response
    if (error instanceof Error) {
      if (error.message.includes('Unauthorized')) {
        return NextResponse.json({ error: error.message }, { status: 401 });
      }
    }

    return NextResponse.json(
      { error: 'Failed to delete appointment' },
      { status: 500 }
    );
  }
} 