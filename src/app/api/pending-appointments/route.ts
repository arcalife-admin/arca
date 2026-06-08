export { dynamic } from '@/lib/api-config'

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const pendingAppointments = await prisma.pendingAppointment.findMany({
      include: {
        patient: true,
        doctor: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(pendingAppointments);
  } catch (error) {
    console.error('Error fetching pending appointments:', error);
    return NextResponse.json(
      { error: 'Încărcarea programărilor în așteptare a eșuat' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const pendingAppointment = await prisma.pendingAppointment.create({
      data: {
        startTime: new Date(data.startTime),
        endTime: new Date(data.endTime),
        duration: data.duration || 30,
        type: typeof data.type === 'string' ? data.type : data.type?.name || '',
        status: 'PENDING',
        notes: data.notes,
        patientId: data.patientId,
        practitionerId: data.practitionerId || null,
        priority: data.priority || 'medium',
      },
      include: {
        patient: true,
        doctor: true,
      },
    });

    return NextResponse.json(pendingAppointment);
  } catch (error) {
    console.error('Error creating pending appointment:', error);
    return NextResponse.json(
      { error: 'Crearea programării în așteptare a eșuat' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json();
    const pendingAppointment = await prisma.pendingAppointment.update({
      where: { id: data.id },
      data: {
        startTime: new Date(data.startTime),
        endTime: new Date(data.endTime),
        duration: data.duration,
        type: typeof data.type === 'string' ? data.type : data.type?.name || '',
        status: data.status,
        notes: data.notes,
        patientId: data.patientId,
        practitionerId: data.practitionerId || null,
      },
      include: {
        patient: true,
        doctor: true,
      },
    });

    return NextResponse.json(pendingAppointment);
  } catch (error) {
    console.error('Error updating pending appointment:', error);
    return NextResponse.json(
      { error: 'Actualizarea programării în așteptare a eșuat' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID-ul programării în așteptare este obligatoriu' },
        { status: 400 }
      );
    }

    await prisma.pendingAppointment.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting pending appointment:', error);
    return NextResponse.json(
      { error: 'Ștergerea programării în așteptare a eșuat' },
      { status: 500 }
    );
  }
} 