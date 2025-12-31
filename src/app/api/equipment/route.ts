import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const locationId = searchParams.get('locationId');
    const category = searchParams.get('category');

    const where: any = {
      organizationId: session.user.organizationId,
    };

    if (locationId) {
      where.locationId = locationId;
    }

    if (category) {
      where.category = category;
    }

    const equipment = await prisma.equipment.findMany({
      where,
      include: {
        location: true,
        _count: {
          select: {
            repairRequests: true,
          },
        },
      },
      orderBy: [
        { location: { name: 'asc' } },
        { name: 'asc' },
      ],
    });

    return NextResponse.json(equipment);
  } catch (error) {
    console.error('Error fetching equipment:', error);
    return NextResponse.json(
      { error: 'Failed to fetch equipment' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      description,
      brand,
      model,
      serialNumber,
      purchaseDate,
      warrantyExpiry,
      category,
      locationId
    } = body;

    if (!name || !category || !locationId) {
      return NextResponse.json(
        { error: 'Name, category, and location are required' },
        { status: 400 }
      );
    }

    const submitData: any = {
      name,
      description: description || null,
      brand: brand || null,
      model: model || null,
      serialNumber: serialNumber || null,
      category,
      locationId,
      organizationId: session.user.organizationId,
    };

    if (purchaseDate) {
      submitData.purchaseDate = new Date(purchaseDate);
    }

    if (warrantyExpiry) {
      submitData.warrantyExpiry = new Date(warrantyExpiry);
    }

    const equipment = await prisma.equipment.create({
      data: submitData,
      include: {
        location: true,
      },
    });

    return NextResponse.json(equipment, { status: 201 });
  } catch (error) {
    console.error('Error creating equipment:', error);
    return NextResponse.json(
      { error: 'Failed to create equipment' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Equipment ID is required' },
        { status: 400 }
      );
    }

    // Verify equipment exists and belongs to organization
    const existingEquipment = await prisma.equipment.findFirst({
      where: {
        id,
        organizationId: session.user.organizationId,
      },
    });

    if (!existingEquipment) {
      return NextResponse.json(
        { error: 'Equipment not found' },
        { status: 404 }
      );
    }

    // Handle optional fields
    const submitData: any = { ...updateData };
    if (submitData.description !== undefined) {
      submitData.description = submitData.description || null;
    }
    if (submitData.brand !== undefined) {
      submitData.brand = submitData.brand || null;
    }
    if (submitData.model !== undefined) {
      submitData.model = submitData.model || null;
    }
    if (submitData.serialNumber !== undefined) {
      submitData.serialNumber = submitData.serialNumber || null;
    }
    if (submitData.purchaseDate) {
      submitData.purchaseDate = new Date(submitData.purchaseDate);
    }
    if (submitData.warrantyExpiry) {
      submitData.warrantyExpiry = new Date(submitData.warrantyExpiry);
    }

    const equipment = await prisma.equipment.update({
      where: { id },
      data: submitData,
      include: {
        location: true,
      },
    });

    return NextResponse.json(equipment);
  } catch (error) {
    console.error('Error updating equipment:', error);
    return NextResponse.json(
      { error: 'Failed to update equipment' },
      { status: 500 }
    );
  }
} 