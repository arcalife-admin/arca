import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createOverrideSchema = z.object({
  scheduleId: z.string(),
  date: z.string(),
  roomNumber: z.number().optional(),
  practitionerId: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  isUnavailable: z.boolean().default(false),
  reason: z.string().optional(),
})

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.organizationId) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const scheduleId = searchParams.get('scheduleId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    if (!scheduleId) {
      return NextResponse.json(
        { message: 'Schedule ID is required' },
        { status: 400 }
      )
    }

    // Build where clause
    const whereClause: any = {
      scheduleId,
      schedule: {
        organizationId: session.user.organizationId,
      },
    }

    if (startDate && endDate) {
      whereClause.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      }
    }

    const overrides = await prisma.scheduleOverride.findMany({
      where: whereClause,
      include: {
        practitioner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        date: 'asc',
      },
    })

    return NextResponse.json({ overrides })
  } catch (error) {
    console.error('Error fetching schedule overrides:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.organizationId) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user has permission to create overrides
    const userRole = session.user.role
    if (userRole !== 'ORGANIZATION_OWNER' && userRole !== 'MANAGER') {
      return NextResponse.json(
        { message: 'Unauthorized - Only organization owners and managers can create schedule overrides' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = createOverrideSchema.parse(body)

    // Verify the schedule belongs to the user's organization
    const schedule = await prisma.clinicSchedule.findFirst({
      where: {
        id: validatedData.scheduleId,
        organizationId: session.user.organizationId,
      },
    })

    if (!schedule) {
      return NextResponse.json(
        { message: 'Schedule not found' },
        { status: 404 }
      )
    }

    // Create or update the override
    const override = await prisma.scheduleOverride.upsert({
      where: {
        scheduleId_date_roomNumber_practitionerId: {
          scheduleId: validatedData.scheduleId,
          date: new Date(validatedData.date + 'T00:00:00'),
          roomNumber: validatedData.roomNumber || null,
          practitionerId: validatedData.practitionerId || null,
        },
      },
      update: {
        startTime: validatedData.startTime,
        endTime: validatedData.endTime,
        isUnavailable: validatedData.isUnavailable,
        reason: validatedData.reason,
        updatedAt: new Date(),
      },
      create: {
        scheduleId: validatedData.scheduleId,
        date: new Date(validatedData.date + 'T00:00:00'),
        roomNumber: validatedData.roomNumber,
        practitionerId: validatedData.practitionerId,
        startTime: validatedData.startTime,
        endTime: validatedData.endTime,
        isUnavailable: validatedData.isUnavailable,
        reason: validatedData.reason,
      },
      include: {
        practitioner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    })

    return NextResponse.json({ override })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Validation error', errors: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating schedule override:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.organizationId) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user has permission to delete overrides
    const userRole = session.user.role
    if (userRole !== 'ORGANIZATION_OWNER' && userRole !== 'MANAGER') {
      return NextResponse.json(
        { message: 'Unauthorized - Only organization owners and managers can delete schedule overrides' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const overrideId = searchParams.get('overrideId')
    const scheduleId = searchParams.get('scheduleId')

    // Handle bulk deletion for entire schedule
    if (scheduleId && !overrideId) {
      // Verify the schedule belongs to the user's organization
      const schedule = await prisma.clinicSchedule.findFirst({
        where: {
          id: scheduleId,
          organizationId: session.user.organizationId,
        },
      })

      if (!schedule) {
        return NextResponse.json(
          { message: 'Schedule not found' },
          { status: 404 }
        )
      }

      // Delete all overrides for this schedule
      const deletedCount = await prisma.scheduleOverride.deleteMany({
        where: {
          scheduleId: scheduleId,
        },
      })

      return NextResponse.json({
        message: `${deletedCount.count} schedule overrides deleted successfully`
      })
    }

    // Handle single override deletion
    if (!overrideId) {
      return NextResponse.json(
        { message: 'Override ID or Schedule ID is required' },
        { status: 400 }
      )
    }

    // Verify the override belongs to the user's organization
    const override = await prisma.scheduleOverride.findFirst({
      where: {
        id: overrideId,
        schedule: {
          organizationId: session.user.organizationId,
        },
      },
    })

    if (!override) {
      return NextResponse.json(
        { message: 'Override not found' },
        { status: 404 }
      )
    }

    // Delete the override
    await prisma.scheduleOverride.delete({
      where: {
        id: overrideId,
      },
    })

    return NextResponse.json({ message: 'Override deleted successfully' })
  } catch (error) {
    console.error('Error deleting schedule override:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
} 