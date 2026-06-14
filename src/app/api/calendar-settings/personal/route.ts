export { dynamic } from '@/lib/api-config'

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import {
  DEFAULT_VISIBLE_DAYS,
  formatVisibleDays,
} from '@/lib/calendar-availability';
import {
  logActivity,
  LOG_ACTIONS,
  ENTITY_TYPES,
  LOG_SEVERITY,
} from '@/lib/activity-logger';

const DEFAULT_VISIBLE_DAYS_LIST = [...DEFAULT_VISIBLE_DAYS];

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user.organizationId) {
      return NextResponse.json({ error: 'Neautorizat' }, { status: 401 });
    }

    const url = new URL(request.url);
    const queryUserId = url.searchParams.get('userId');
    const targetUserId = queryUserId || session.user.id;

    if (targetUserId !== session.user.id) {
      const targetUser = await prisma.user.findFirst({
        where: {
          id: targetUserId,
          organizationId: session.user.organizationId,
        },
        select: { id: true },
      });

      if (!targetUser) {
        return NextResponse.json({ error: 'Neautorizat' }, { status: 403 });
      }
    }

    const settings = await prisma.calendarSettings.findUnique({
      where: {
        userId: targetUserId,
      },
    });

    return NextResponse.json({
      color: settings?.color || '#cfdbff',
      visibleDays: settings?.visibleDays || DEFAULT_VISIBLE_DAYS_LIST,
    });
  } catch (error) {
    console.error('Error fetching calendar settings:', error);
    return NextResponse.json({ error: 'Eroare internă de server' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user.organizationId) {
      return NextResponse.json({ error: 'Neautorizat' }, { status: 401 });
    }

    const body = await request.json();
    const { color, visibleDays } = body;

    const existing = await prisma.calendarSettings.findUnique({
      where: { userId: session.user.id },
    });

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

    const previousDays = existing?.visibleDays || DEFAULT_VISIBLE_DAYS_LIST;
    const disabledDays = DEFAULT_VISIBLE_DAYS_LIST.filter((day) => !visibleDays.includes(day));
    const enabledDays = visibleDays as string[];
    const userName = [session.user.firstName, session.user.lastName].filter(Boolean).join(' ').trim()
      || session.user.email
      || session.user.id;

    await logActivity(
      {
        action: LOG_ACTIONS.UPDATE_CALENDAR_SETTINGS,
        entityType: ENTITY_TYPES.CALENDAR_SETTINGS,
        entityId: settings.id,
        description: `${userName} a actualizat setările personale ale calendarului`,
        details: {
          before: existing
            ? { color: existing.color, visibleDays: previousDays }
            : null,
          after: { color, visibleDays: enabledDays },
          enabledDays,
          disabledDays,
          enabledDaysLabel: formatVisibleDays(enabledDays),
          disabledDaysLabel: formatVisibleDays(disabledDays),
        },
        page: '/dashboard/calendar-settings',
        severity: LOG_SEVERITY.INFO,
      },
      {
        userId: session.user.id,
        organizationId: session.user.organizationId,
        ipAddress:
          request.headers.get('x-forwarded-for') ||
          request.headers.get('x-real-ip') ||
          'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      }
    );

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error saving calendar settings:', error);
    return NextResponse.json({ error: 'Eroare internă de server' }, { status: 500 });
  }
}
