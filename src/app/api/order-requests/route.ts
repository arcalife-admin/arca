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
    const status = searchParams.get('status');
    const urgency = searchParams.get('urgency');
    const requestedById = searchParams.get('requestedBy');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;

    const where: any = {
      organizationId: session.user.organizationId,
    };

    if (status) {
      where.status = status;
    }

    if (urgency) {
      where.urgency = urgency;
    }

    if (requestedById) {
      where.requestedById = requestedById;
    }

    const requests = await prisma.orderRequest.findMany({
      where,
      include: {
        requestedBy: {
          select: { id: true, firstName: true, lastName: true }
        },
        processedBy: {
          select: { id: true, firstName: true, lastName: true }
        },
        category: true,
        vendor: true,
        order: {
          select: { id: true, orderNumber: true, status: true }
        }
      },
      orderBy: [
        { urgency: 'desc' },
        { createdAt: 'desc' },
      ],
      ...(limit && { take: limit }),
    });

    return NextResponse.json(requests);
  } catch (error) {
    console.error('Error fetching order requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch order requests' },
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
      itemName,
      description,
      quantity = 1,
      urgency = 'NORMAL',
      reason,
      categoryId,
      vendorId
    } = body;

    if (!itemName) {
      return NextResponse.json(
        { error: 'Item name is required' },
        { status: 400 }
      );
    }

    const orderRequest = await prisma.orderRequest.create({
      data: {
        itemName,
        description,
        quantity,
        urgency,
        reason,
        categoryId,
        vendorId,
        requestedById: session.user.id,
        organizationId: session.user.organizationId,
      },
      include: {
        requestedBy: {
          select: { id: true, firstName: true, lastName: true }
        },
        category: true,
        vendor: true,
      },
    });

    return NextResponse.json(orderRequest, { status: 201 });
  } catch (error) {
    console.error('Error creating order request:', error);
    return NextResponse.json(
      { error: 'Failed to create order request' },
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
    const { id, status, vendorId, categoryId } = body;

    if (!id || !status) {
      return NextResponse.json(
        { error: 'Request ID and status are required' },
        { status: 400 }
      );
    }

    // Verify request exists and belongs to organization
    const existingRequest = await prisma.orderRequest.findFirst({
      where: {
        id,
        organizationId: session.user.organizationId,
      },
    });

    if (!existingRequest) {
      return NextResponse.json(
        { error: 'Request not found' },
        { status: 404 }
      );
    }

    const updateData: any = {
      status,
      processedById: session.user.id,
      processedAt: new Date(),
    };

    if (vendorId) {
      updateData.vendorId = vendorId;
    }

    if (categoryId) {
      updateData.categoryId = categoryId;
    }

    const updatedRequest = await prisma.orderRequest.update({
      where: { id },
      data: updateData,
      include: {
        requestedBy: {
          select: { id: true, firstName: true, lastName: true }
        },
        processedBy: {
          select: { id: true, firstName: true, lastName: true }
        },
        category: true,
        vendor: true,
        order: {
          select: { id: true, orderNumber: true, status: true }
        }
      },
    });

    return NextResponse.json(updatedRequest);
  } catch (error) {
    console.error('Error updating order request:', error);
    return NextResponse.json(
      { error: 'Failed to update order request' },
      { status: 500 }
    );
  }
} 