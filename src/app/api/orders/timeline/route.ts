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
    // Get all timeline events for all orders in the organization
    const events = await prisma.orderTimelineEvent.findMany({
      where: {
        order: { organizationId: session.user.organizationId },
      },
      include: {
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        order: { select: { id: true, orderNumber: true } },
        orderItem: { select: { id: true, itemName: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100, // limit to recent 100 events
    });
    return NextResponse.json(events);
  } catch (error) {
    console.error('Error fetching all timeline events:', error);
    return NextResponse.json({ error: 'Failed to fetch timeline events' }, { status: 500 });
  }
} 