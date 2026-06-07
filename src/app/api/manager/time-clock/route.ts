import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { TimeClockEventType } from '@prisma/client'
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  subDays,
} from 'date-fns'
import { z } from 'zod'
import { authOptions } from '@/lib/auth-config'
import { prisma } from '@/lib/prisma'
import { msToHours, workedMsInWindow } from '@/lib/time-clock'

export const dynamic = 'force-dynamic'

function hasManagerPermissions(userRole: string): boolean {
  return userRole === 'ORGANIZATION_OWNER' || userRole === 'MANAGER'
}

const postSchema = z.object({
  userId: z.string().min(1),
  eventType: z.enum(['CLOCK_IN', 'CLOCK_OUT']),
  /** ISO datetime — omit for “now” (e.g. backdated punch) */
  occurredAt: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.organizationId) {
      return NextResponse.json({ message: 'Neautorizat' }, { status: 401 })
    }
    if (!hasManagerPermissions(session.user.role)) {
      return NextResponse.json({ message: 'Permisiuni insuficiente' }, { status: 403 })
    }

    const body = await request.json()
    const parsed = postSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ message: 'Cerere invalidă', issues: parsed.error.flatten() }, { status: 400 })
    }

    const { userId, eventType, occurredAt: occurredAtRaw } = parsed.data
    let occurredAt: Date | undefined
    if (occurredAtRaw !== undefined) {
      occurredAt = new Date(occurredAtRaw)
      if (Number.isNaN(occurredAt.getTime())) {
        return NextResponse.json({ message: 'Data evenimentului este invalidă' }, { status: 400 })
      }
    }

    const target = await prisma.user.findFirst({
      where: {
        id: userId,
        organizationId: session.user.organizationId,
      },
      select: { id: true },
    })
    if (!target) {
      return NextResponse.json({ message: 'Utilizatorul nu a fost găsit în această organizație' }, { status: 404 })
    }

    const event = await prisma.timeClockEvent.create({
      data: {
        organizationId: session.user.organizationId,
        userId,
        eventType: eventType as TimeClockEventType,
        source: 'manual',
        ...(occurredAt !== undefined ? { occurredAt } : {}),
      },
      include: {
        user: {
          select: { firstName: true, lastName: true, email: true },
        },
      },
    })

    return NextResponse.json(event)
  } catch (error) {
    console.error('Error creating time clock event:', error)
    return NextResponse.json({ message: 'Eroare internă de server' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.organizationId) {
      return NextResponse.json({ message: 'Neautorizat' }, { status: 401 })
    }
    if (!hasManagerPermissions(session.user.role)) {
      return NextResponse.json({ message: 'Permisiuni insuficiente' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const fromParam = searchParams.get('from')
    const toParam = searchParams.get('to')

    const now = new Date()
    const defaultFrom = subDays(startOfDay(now), 30)
    const defaultTo = endOfDay(now)

    const from = fromParam ? new Date(fromParam) : defaultFrom
    const to = toParam ? new Date(toParam) : defaultTo

    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
      return NextResponse.json({ message: 'Data de la sau până la este invalidă' }, { status: 400 })
    }

    const orgId = session.user.organizationId

    const [users, events] = await Promise.all([
      prisma.user.findMany({
        where: { organizationId: orgId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          isDisabled: true,
        },
        orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
      }),
      prisma.timeClockEvent.findMany({
        where: {
          organizationId: orgId,
          occurredAt: { gte: from, lte: to },
        },
        include: {
          user: {
            select: { firstName: true, lastName: true, email: true },
          },
        },
        orderBy: { occurredAt: 'desc' },
      }),
    ])

    const dayStart = startOfDay(now)
    const dayEnd = endOfDay(now)
    const weekStart = startOfWeek(now, { weekStartsOn: 1 })
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 })
    const monthStart = startOfMonth(now)
    const monthEnd = endOfMonth(now)

    const statsRangeStart = new Date(
      Math.min(weekStart.getTime(), monthStart.getTime(), dayStart.getTime())
    )
    const statsRangeEnd = new Date(
      Math.max(weekEnd.getTime(), monthEnd.getTime(), dayEnd.getTime())
    )

    const statsEvents = await prisma.timeClockEvent.findMany({
      where: {
        organizationId: orgId,
        occurredAt: { gte: statsRangeStart, lte: statsRangeEnd },
      },
      select: {
        userId: true,
        eventType: true,
        occurredAt: true,
      },
    })

    const byUser = new Map<string, typeof statsEvents>()
    for (const e of statsEvents) {
      const list = byUser.get(e.userId) ?? []
      list.push(e)
      byUser.set(e.userId, list)
    }

    const hoursByUser: Record<
      string,
      {
        displayName: string
        hoursToday: number
        hoursThisWeek: number
        hoursThisMonth: number
      }
    > = {}

    for (const u of users) {
      const evs = byUser.get(u.id) ?? []
      const hDay = msToHours(workedMsInWindow(evs, dayStart, dayEnd))
      const hWeek = msToHours(workedMsInWindow(evs, weekStart, weekEnd))
      const hMonth = msToHours(workedMsInWindow(evs, monthStart, monthEnd))
      hoursByUser[u.id] = {
        displayName: `${u.firstName} ${u.lastName}`.trim(),
        hoursToday: Math.round(hDay * 100) / 100,
        hoursThisWeek: Math.round(hWeek * 100) / 100,
        hoursThisMonth: Math.round(hMonth * 100) / 100,
      }
    }

    return NextResponse.json({
      users,
      events,
      hoursByUser,
      ranges: {
        day: { start: dayStart.toISOString(), end: dayEnd.toISOString() },
        week: { start: weekStart.toISOString(), end: weekEnd.toISOString() },
        month: { start: monthStart.toISOString(), end: monthEnd.toISOString() },
      },
      query: { from: from.toISOString(), to: to.toISOString() },
    })
  } catch (error) {
    console.error('Error fetching time clock data:', error)
    return NextResponse.json({ message: 'Eroare internă de server' }, { status: 500 })
  }
}
