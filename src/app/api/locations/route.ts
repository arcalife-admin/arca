export { dynamic } from '@/lib/api-config'

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Neautorizat' }, { status: 401 });
    }

    const locations = await prisma.location.findMany({
      where: {
        organizationId: session.user.organizationId,
      },
      include: {
        _count: {
          select: {
            equipment: true,
            repairRequests: true,
          },
        },
        contactPersons: {
          include: {
            contactPerson: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json(locations);
  } catch (error) {
    console.error('Error fetching locations:', error);
    return NextResponse.json(
      { error: 'Încărcarea locațiilor a eșuat' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Neautorizat' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, color } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Numele locației este obligatoriu' },
        { status: 400 }
      );
    }

    const location = await prisma.location.create({
      data: {
        name,
        description: description || null,
        color: color || '#3B82F6',
        organizationId: session.user.organizationId,
      },
    });

    return NextResponse.json(location, { status: 201 });
  } catch (error) {
    console.error('Error creating location:', error);
    return NextResponse.json(
      { error: 'Crearea locației a eșuat' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Neautorizat' }, { status: 401 });
    }

    const body = await request.json();
    const { id, name, description, color } = body;

    if (!id || !name) {
      return NextResponse.json(
        { error: 'ID-ul și numele locației sunt obligatorii' },
        { status: 400 }
      );
    }

    // Verify location exists and belongs to organization
    const existingLocation = await prisma.location.findFirst({
      where: {
        id,
        organizationId: session.user.organizationId,
      },
    });

    if (!existingLocation) {
      return NextResponse.json(
        { error: 'Locația nu a fost găsită' },
        { status: 404 }
      );
    }

    const location = await prisma.location.update({
      where: { id },
      data: {
        name,
        description: description || null,
        color: color || '#3B82F6',
      },
    });

    return NextResponse.json(location);
  } catch (error) {
    console.error('Error updating location:', error);
    return NextResponse.json(
      { error: 'Actualizarea locației a eșuat' },
      { status: 500 }
    );
  }
} 