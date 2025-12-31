import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createScheduleSchema = z.object({
  name: z.string().min(1),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  roomCount: z.number().min(1).max(50),
  roomAssignments: z.array(z.object({
    roomNumber: z.number(),
    mainPractitionerId: z.string().optional(),
    sidePractitionerId: z.string().optional(),
    startTime: z.string(),
    endTime: z.string(),
    workingDays: z.array(z.string()),
  })),
  otherWorkers: z.array(z.object({
    practitionerId: z.string(),
    startTime: z.string(),
    endTime: z.string(),
    workingDays: z.array(z.string()),
  })),
})

const updateScheduleSchema = z.object({
  name: z.string().min(1).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  roomCount: z.number().min(1).max(50).optional(),
  isActive: z.boolean().optional(),
})

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.organizationId) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get all schedules for the organization
    const schedules = await prisma.clinicSchedule.findMany({
      where: {
        organizationId: session.user.organizationId,
      },
      include: {
        roomAssignments: {
          include: {
            mainPractitioner: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
            sidePractitioner: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        otherWorkerSchedules: {
          include: {
            practitioner: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        scheduleOverrides: {
          include: {
            practitioner: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        roomShifts: {
          include: {
            practitioner: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                role: true,
                calendarSettings: {
                  select: {
                    color: true,
                  },
                },
              },
            },
            sidePractitioner: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                role: true,
                calendarSettings: {
                  select: {
                    color: true,
                  },
                },
              },
            },
          },
          orderBy: [
            { roomNumber: 'asc' },
            { date: 'asc' },
            { dayOfWeek: 'asc' },
            { startTime: 'asc' },
            { priority: 'desc' },
          ],
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({ schedules })
  } catch (error) {
    console.error('Error fetching clinic schedules:', error)
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

    // Check if user has permission to create schedules
    const userRole = session.user.role
    if (userRole !== 'ORGANIZATION_OWNER' && userRole !== 'MANAGER') {
      return NextResponse.json(
        { message: 'Unauthorized - Only organization owners and managers can create schedules' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = createScheduleSchema.parse(body)

    // Create the schedule in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Fetch current active schedule (if any) so we can copy its overrides later
      const previousActive = await tx.clinicSchedule.findFirst({
        where: {
          organizationId: session.user.organizationId,
          isActive: true,
        },
      })

      // Deactivate any existing active schedule
      if (previousActive) {
        await tx.clinicSchedule.update({
          where: { id: previousActive.id },
          data: { isActive: false },
        })
      }

      // Create new schedule
      const schedule = await tx.clinicSchedule.create({
        data: {
          organizationId: session.user.organizationId,
          name: validatedData.name,
          startDate: new Date(validatedData.startDate),
          endDate: new Date(validatedData.endDate),
          roomCount: validatedData.roomCount,
          isActive: true,
        },
      })

      // Create room assignments
      if (validatedData.roomAssignments.length > 0) {
        await tx.roomAssignment.createMany({
          data: validatedData.roomAssignments.map(assignment => ({
            scheduleId: schedule.id,
            roomNumber: assignment.roomNumber,
            mainPractitionerId: assignment.mainPractitionerId || null,
            sidePractitionerId: assignment.sidePractitionerId || null,
            startTime: assignment.startTime,
            endTime: assignment.endTime,
            workingDays: assignment.workingDays,
          })),
        })
      }

      // Create other worker schedules
      if (validatedData.otherWorkers.length > 0) {
        await tx.otherWorkerSchedule.createMany({
          data: validatedData.otherWorkers.map(worker => ({
            scheduleId: schedule.id,
            practitionerId: worker.practitionerId,
            startTime: worker.startTime,
            endTime: worker.endTime,
            workingDays: worker.workingDays,
          })),
        })
      }

      // Copy overrides from previously active schedule (if any)
      if (previousActive) {
        const prevOverrides = await tx.scheduleOverride.findMany({
          where: { scheduleId: previousActive.id },
        })

        if (prevOverrides.length > 0) {
          await tx.scheduleOverride.createMany({
            data: prevOverrides.map((o) => ({
              scheduleId: schedule.id,
              date: o.date,
              roomNumber: o.roomNumber,
              practitionerId: o.practitionerId,
              startTime: o.startTime,
              endTime: o.endTime,
              isUnavailable: o.isUnavailable,
              reason: o.reason || null,
              createdAt: new Date(),
              updatedAt: new Date(),
            })),
            skipDuplicates: true,
          })
        }
      }

      return schedule
    })

    // Fetch the complete schedule with relations
    const completeSchedule = await prisma.clinicSchedule.findUnique({
      where: { id: result.id },
      include: {
        roomAssignments: {
          include: {
            mainPractitioner: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
            sidePractitioner: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        otherWorkerSchedules: {
          include: {
            practitioner: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    })

    return NextResponse.json({ schedule: completeSchedule })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Validation error', errors: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating clinic schedule:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.organizationId) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user has permission to update schedules
    const userRole = session.user.role
    if (userRole !== 'ORGANIZATION_OWNER' && userRole !== 'MANAGER') {
      return NextResponse.json(
        { message: 'Unauthorized - Only organization owners and managers can update schedules' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { scheduleId, ...updateData } = body
    const validatedData = updateScheduleSchema.parse(updateData)

    if (!scheduleId) {
      return NextResponse.json(
        { message: 'Schedule ID is required' },
        { status: 400 }
      )
    }

    // Update the schedule
    const updatedSchedule = await prisma.clinicSchedule.update({
      where: {
        id: scheduleId,
        organizationId: session.user.organizationId,
      },
      data: {
        ...validatedData,
        startDate: validatedData.startDate ? new Date(validatedData.startDate) : undefined,
        endDate: validatedData.endDate ? new Date(validatedData.endDate) : undefined,
        updatedAt: new Date(),
      },
      include: {
        roomAssignments: {
          include: {
            mainPractitioner: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
            sidePractitioner: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        otherWorkerSchedules: {
          include: {
            practitioner: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    })

    return NextResponse.json({ schedule: updatedSchedule })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Validation error', errors: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating clinic schedule:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
} 