export { dynamic } from '@/lib/api-config'

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
      return NextResponse.json({ error: 'Neautorizat' }, { status: 401 });
    }
    const orderId = params.id;
    const events = await prisma.orderTimelineEvent.findMany({
      where: { orderId },
      include: {
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        orderItem: { select: { id: true, itemName: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
    return NextResponse.json(events);
  } catch (error) {
    console.error('Error fetching timeline events:', error);
    return NextResponse.json({ error: 'Încărcarea evenimentelor din cronologie a eșuat' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Neautorizat' }, { status: 401 });
    }
    const orderId = params.id;
    const body = await request.json();
    const { type, message, orderItemId } = body;
    const event = await prisma.orderTimelineEvent.create({
      data: {
        orderId,
        orderItemId,
        type,
        message,
        createdById: session.user.id,
      },
      include: {
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        orderItem: { select: { id: true, itemName: true } },
      },
    });
    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    console.error('Error creating timeline event:', error);
    return NextResponse.json({ error: 'Crearea evenimentului din cronologie a eșuat' }, { status: 500 });
  }
} 