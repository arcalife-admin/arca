import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if a specific userId is requested (for fetching other practitioners' settings)
    const url = new URL(request.url);
    const queryUserId = url.searchParams.get('userId');
    const targetUserId = queryUserId || session.user.id;

    const settings = await prisma.calendarSettings.findUnique({
      where: {
        userId: targetUserId,
      },
    });

    return NextResponse.json({
      color: settings?.color || '#cfdbff',
      visibleDays: settings?.visibleDays || [
        'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
      ]
    });
  } catch (error) {
    console.error('Error fetching calendar settings:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { color, visibleDays } = body;

    const settings = await prisma.calendarSettings.upsert({
      where: {
        userId: session.user.id,
      },
      update: {
        color,
        visibleDays,
      },
      create: {
        userId: session.user.id,
        color,
        visibleDays,
      },
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error saving calendar settings:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 