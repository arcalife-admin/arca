import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const order = await prisma.order.findFirst({
      where: {
        id: params.id,
        organizationId: session.user.organizationId,
      },
      include: {
        vendor: true,
        orderedBy: {
          select: { id: true, firstName: true, lastName: true }
        },
        approvedBy: {
          select: { id: true, firstName: true, lastName: true }
        },
        items: {
          include: {
            category: true,
          },
        },
        requests: {
          include: {
            requestedBy: {
              select: { id: true, firstName: true, lastName: true }
            }
          }
        }
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json(
      { error: 'Failed to fetch order' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { status, expectedDelivery, actualDelivery, notes } = body;

    // Verify order exists and belongs to organization
    const existingOrder = await prisma.order.findFirst({
      where: {
        id: params.id,
        organizationId: session.user.organizationId,
      },
    });

    if (!existingOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const updateData: any = {};

    if (status) {
      updateData.status = status;
    }

    if (expectedDelivery !== undefined) {
      updateData.expectedDelivery = expectedDelivery ? new Date(expectedDelivery) : null;
    }

    if (actualDelivery !== undefined) {
      updateData.actualDelivery = actualDelivery ? new Date(actualDelivery) : null;
    }

    if (notes !== undefined) {
      updateData.notes = notes;
    }

    const updatedOrder = await prisma.order.update({
      where: { id: params.id },
      data: updateData,
      include: {
        vendor: true,
        orderedBy: {
          select: { id: true, firstName: true, lastName: true }
        },
        approvedBy: {
          select: { id: true, firstName: true, lastName: true }
        },
        items: {
          include: {
            category: true,
          },
        },
        requests: {
          include: {
            requestedBy: {
              select: { id: true, firstName: true, lastName: true }
            }
          }
        }
      },
    });

    // Add timeline event for status change
    if (status) {
      await prisma.orderTimelineEvent.create({
        data: {
          orderId: params.id,
          type: status,
          message: `Order status changed to ${status}`,
          createdById: session.user.id,
        },
      });
    }

    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json(
      { error: 'Failed to update order' },
      { status: 500 }
    );
  }
} 