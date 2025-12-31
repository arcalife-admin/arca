import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const dayOfWeekOverrideSchema = z.object({
  scheduleId: z.string(),
  dayOfWeek: z.string(),
  roomNumber: z.number().optional(),
  practitionerId: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  isUnavailable: z.boolean(),
  reason: z.string().optional(),
})

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.organizationId) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = dayOfWeekOverrideSchema.parse(body)

    const {
      scheduleId,
      dayOfWeek,
      roomNumber,
      practitionerId,
      startTime,
      endTime,
      isUnavailable,
      reason,
    } = validatedData

    // Verify the schedule belongs to the user's organization
    const schedule = await prisma.clinicSchedule.findFirst({
      where: {
        id: scheduleId,
        organizationId: session.user.organizationId,
        isActive: true,
      },
    })

    if (!schedule) {
      return NextResponse.json(
        { message: 'Schedule not found' },
        { status: 404 }
      )
    }

    // Instead of modifying the base room/worker schedule (which affects every day),
    // we create date-specific ScheduleOverride entries for **each matching day** in the schedule period.

    const start = new Date(schedule.startDate)
    const end = new Date(schedule.endDate)

    const overridesToUpsert: {
      date: Date
      roomNumber?: number
      practitionerId?: string
      startTime?: string
      endTime?: string
      isUnavailable: boolean
      reason?: string
    }[] = []

    const targetDow = dayOfWeek.toLowerCase()

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dow = d.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
      if (dow === targetDow) {
        overridesToUpsert.push({
          date: new Date(d),
          roomNumber,
          practitionerId,
          startTime,
          endTime,
          isUnavailable,
          reason,
        })
      }
    }

    // Upsert each override (unique composite key)
    for (const o of overridesToUpsert) {
      await prisma.scheduleOverride.upsert({
        where: {
          scheduleId_date_roomNumber_practitionerId: {
            scheduleId,
            date: o.date,
            roomNumber: o.roomNumber ?? null,
            practitionerId: o.practitionerId ?? null,
          },
        },
        update: {
          startTime: o.startTime,
          endTime: o.endTime,
          isUnavailable: o.isUnavailable,
          reason: o.reason,
        },
        create: {
          scheduleId,
          date: o.date,
          roomNumber: o.roomNumber,
          practitionerId: o.practitionerId,
          startTime: o.startTime,
          endTime: o.endTime,
          isUnavailable: o.isUnavailable,
          reason: o.reason,
        },
      })
    }

    // Create a log entry for this change (optional)
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        organizationId: session.user.organizationId,
        action: isUnavailable ? 'MARK_DAY_UNAVAILABLE' : 'UPDATE_DAY_SCHEDULE',
        entityType: 'CLINIC_SCHEDULE',
        entityId: scheduleId,
        description: isUnavailable
          ? `Marked ${dayOfWeek} as unavailable${roomNumber ? ` for room ${roomNumber}` : ''}${practitionerId ? ' for specific practitioner' : ''}`
          : `Updated ${dayOfWeek} working hours${roomNumber ? ` for room ${roomNumber}` : ''}${practitionerId ? ' for specific practitioner' : ''}`,
        details: {
          dayOfWeek,
          roomNumber,
          practitionerId,
          startTime,
          endTime,
          isUnavailable,
          reason,
        },
        severity: 'INFO',
      },
    })

    return NextResponse.json({
      message: isUnavailable
        ? `${dayOfWeek} marked as unavailable successfully`
        : `${dayOfWeek} schedule updated successfully`,
    })
  } catch (error) {
    console.error('Error creating day-of-week override:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
} 