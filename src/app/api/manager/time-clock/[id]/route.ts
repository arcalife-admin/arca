import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { TimeClockEventType } from '@prisma/client'
import { z } from 'zod'
import { authOptions } from '@/lib/auth-config'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

function hasManagerPermissions(userRole: string): boolean {
  return userRole === 'ORGANIZATION_OWNER' || userRole === 'MANAGER'
}

const patchSchema = z
  .object({
    userId: z.string().min(1).optional(),
    eventType: z.enum(['CLOCK_IN', 'CLOCK_OUT']).optional(),
    occurredAt: z.string().min(1).optional(),
  })
  .refine((data) => data.userId !== undefined || data.eventType !== undefined || data.occurredAt !== undefined, {
    message: 'Cel puțin un câmp este obligatoriu',
  })

async function getEventForOrg(eventId: string, organizationId: string) {
  return prisma.timeClockEvent.findFirst({
    where: { id: eventId, organizationId },
    select: { id: true },
  })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.organizationId) {
      return NextResponse.json({ message: 'Neautorizat' }, { status: 401 })
    }
    if (!hasManagerPermissions(session.user.role)) {
      return NextResponse.json({ message: 'Permisiuni insuficiente' }, { status: 403 })
    }

    const { id } = params
    const existing = await getEventForOrg(id, session.user.organizationId)
    if (!existing) {
      return NextResponse.json({ message: 'Evenimentul nu a fost găsit' }, { status: 404 })
    }

    const body = await request.json()
    const parsed = patchSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { message: 'Cerere invalidă', issues: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { userId, eventType, occurredAt } = parsed.data

    if (userId) {
      const target = await prisma.user.findFirst({
        where: { id: userId, organizationId: session.user.organizationId },
        select: { id: true },
      })
      if (!target) {
        return NextResponse.json({ message: 'Utilizatorul nu a fost găsit în această organizație' }, { status: 404 })
      }
    }

    let occurredAtDate: Date | undefined
    if (occurredAt !== undefined) {
      occurredAtDate = new Date(occurredAt)
      if (Number.isNaN(occurredAtDate.getTime())) {
        return NextResponse.json({ message: 'Data evenimentului este invalidă' }, { status: 400 })
      }
    }

    const updated = await prisma.timeClockEvent.update({
      where: { id },
      data: {
        ...(userId !== undefined ? { userId } : {}),
        ...(eventType !== undefined ? { eventType: eventType as TimeClockEventType } : {}),
        ...(occurredAtDate !== undefined ? { occurredAt: occurredAtDate } : {}),
      },
      include: {
        user: {
          select: { firstName: true, lastName: true, email: true },
        },
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating time clock event:', error)
    return NextResponse.json({ message: 'Eroare internă de server' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.organizationId) {
      return NextResponse.json({ message: 'Neautorizat' }, { status: 401 })
    }
    if (!hasManagerPermissions(session.user.role)) {
      return NextResponse.json({ message: 'Permisiuni insuficiente' }, { status: 403 })
    }

    const { id } = params
    const existing = await getEventForOrg(id, session.user.organizationId)
    if (!existing) {
      return NextResponse.json({ message: 'Evenimentul nu a fost găsit' }, { status: 404 })
    }

    await prisma.timeClockEvent.delete({ where: { id } })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error deleting time clock event:', error)
    return NextResponse.json({ message: 'Eroare internă de server' }, { status: 500 })
  }
}
