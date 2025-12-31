import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const orderId = params.id;
    const body = await request.json();
    const { updates } = body;
    if (!Array.isArray(updates)) {
      return NextResponse.json({ error: 'Invalid updates' }, { status: 400 });
    }
    for (const update of updates) {
      const { itemId, isReceived, quantityReceived, notes } = update;
      await prisma.orderItem.update({
        where: { id: itemId, orderId },
        data: {
          isReceived,
          quantityReceived,
          notes,
          receivedAt: isReceived ? new Date() : null,
        },
      });
      if (isReceived) {
        await prisma.orderTimelineEvent.create({
          data: {
            orderId,
            orderItemId: itemId,
            type: 'ITEM_RECEIVED',
            message: `Received ${quantityReceived} unit(s)`,
          },
        });
      }
    }
    // Optionally, update order status if all items are received
    const items = await prisma.orderItem.findMany({ where: { orderId } });
    const allReceived = items.every(item => item.isReceived);
    if (allReceived) {
      await prisma.order.update({ where: { id: orderId }, data: { status: 'COMPLETED' } });
    } else if (items.some(item => item.isReceived)) {
      await prisma.order.update({ where: { id: orderId }, data: { status: 'DELIVERED' } });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating order items:', error);
    return NextResponse.json({ error: 'Failed to update order items' }, { status: 500 });
  }
} 