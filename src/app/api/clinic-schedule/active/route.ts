import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { prisma } from '@/lib/prisma'

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
    const date = searchParams.get('date')
    const includeAvailability = searchParams.get('includeAvailability') === 'true'

    // Get the active schedule for the organization
    const activeSchedule = await prisma.clinicSchedule.findFirst({
      where: {
        organizationId: session.user.organizationId,
        isActive: true,
      },
      include: {
        roomAssignments: {
          include: {
            mainPractitioner: {
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
          orderBy: {
            roomNumber: 'asc',
          },
        },
        otherWorkerSchedules: {
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
          },
        },
        scheduleOverrides: date
          ? {
            where: {
              date: {
                gte: new Date(date),
                lt: new Date(new Date(date).getTime() + 24 * 60 * 60 * 1000), // Next day
              },
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
          }
          : true,
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
            { priority: 'desc' },
            { startTime: 'asc' },
          ],
        },
      },
    })

    if (!activeSchedule) {
      return NextResponse.json({
        schedule: null,
        message: 'No active schedule found',
      })
    }

    // If availability is requested and date is provided, calculate availability
    let availability = null
    if (includeAvailability && date) {
      availability = await calculateAvailability(activeSchedule, new Date(date))
    }

    return NextResponse.json({
      schedule: activeSchedule,
      availability,
    })
  } catch (error) {
    console.error('Error fetching active clinic schedule:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function calculateAvailability(schedule: any, date: Date) {
  const dayName = date.toLocaleDateString('en-US', { weekday: 'long' })

  // Get existing appointments for the date
  const startOfDay = new Date(date)
  startOfDay.setHours(0, 0, 0, 0)
  const endOfDay = new Date(date)
  endOfDay.setHours(23, 59, 59, 999)

  const existingAppointments = await prisma.appointment.findMany({
    where: {
      startTime: {
        gte: startOfDay,
        lte: endOfDay,
      },
      practitioner: {
        organizationId: schedule.organizationId,
      },
      status: {
        not: 'CANCELLED',
      },
    },
    select: {
      id: true,
      startTime: true,
      endTime: true,
      practitionerId: true,
    },
  })

  const availability = {
    rooms: [] as any[],
    practitioners: [] as any[],
  }

  // Calculate room availability
  for (const roomAssignment of schedule.roomAssignments) {
    if (!roomAssignment.workingDays.includes(dayName)) {
      continue // Room not working on this day
    }

    // Check for overrides for this room/date
    const roomOverrides = schedule.scheduleOverrides.filter((override: any) =>
      override.roomNumber === roomAssignment.roomNumber
    )

    const roomAvailability = {
      roomNumber: roomAssignment.roomNumber,
      isAvailable: roomOverrides.length === 0 || !roomOverrides.some((o: any) => o.isUnavailable),
      mainPractitioner: roomAssignment.mainPractitioner,
      sidePractitioner: roomAssignment.sidePractitioner,
      workingHours: {
        start: roomAssignment.startTime,
        end: roomAssignment.endTime,
      },
      overrides: roomOverrides,
      bookedSlots: [] as any[],
    }

    // Find booked appointments for practitioners in this room
    const practitionerIds = [
      roomAssignment.mainPractitionerId,
      roomAssignment.sidePractitionerId,
    ].filter(Boolean)

    const roomAppointments = existingAppointments.filter(apt =>
      practitionerIds.includes(apt.practitionerId)
    )

    roomAvailability.bookedSlots = roomAppointments.map(apt => ({
      startTime: apt.startTime,
      endTime: apt.endTime,
      practitionerId: apt.practitionerId,
    }))

    availability.rooms.push(roomAvailability)
  }

  // Calculate other worker availability
  for (const workerSchedule of schedule.otherWorkerSchedules) {
    if (!workerSchedule.workingDays.includes(dayName)) {
      continue // Worker not working on this day
    }

    // Check for overrides for this practitioner/date
    const workerOverrides = schedule.scheduleOverrides.filter((override: any) =>
      override.practitionerId === workerSchedule.practitionerId
    )

    const workerAvailability = {
      practitioner: workerSchedule.practitioner,
      isAvailable: workerOverrides.length === 0 || !workerOverrides.some((o: any) => o.isUnavailable),
      workingHours: {
        start: workerSchedule.startTime,
        end: workerSchedule.endTime,
      },
      overrides: workerOverrides,
      bookedSlots: [] as any[],
    }

    // Find booked appointments for this practitioner
    const workerAppointments = existingAppointments.filter(apt =>
      apt.practitionerId === workerSchedule.practitionerId
    )

    workerAvailability.bookedSlots = workerAppointments.map(apt => ({
      startTime: apt.startTime,
      endTime: apt.endTime,
    }))

    availability.practitioners.push(workerAvailability)
  }

  return availability
}

// Helper endpoint to get schedule for a specific date range
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
    const { startDate, endDate } = body

    if (!startDate || !endDate) {
      return NextResponse.json(
        { message: 'Start date and end date are required' },
        { status: 400 }
      )
    }

    // Get the active schedule
    const activeSchedule = await prisma.clinicSchedule.findFirst({
      where: {
        organizationId: session.user.organizationId,
        isActive: true,
      },
      include: {
        roomAssignments: {
          include: {
            mainPractitioner: {
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
          orderBy: {
            roomNumber: 'asc',
          },
        },
        otherWorkerSchedules: {
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
          },
        },
        scheduleOverrides: {
          where: {
            date: {
              gte: new Date(startDate),
              lte: new Date(endDate),
            },
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
        },
      },
    })

    if (!activeSchedule) {
      return NextResponse.json({
        schedule: null,
        message: 'No active schedule found',
      })
    }

    // Generate availability for each day in the range
    const dailyAvailability = []
    const start = new Date(startDate)
    const end = new Date(endDate)

    for (let current = new Date(start); current <= end; current.setDate(current.getDate() + 1)) {
      const availability = await calculateAvailability(activeSchedule, new Date(current))
      dailyAvailability.push({
        date: current.toISOString().split('T')[0],
        dayName: current.toLocaleDateString('en-US', { weekday: 'long' }),
        availability,
      })
    }

    return NextResponse.json({
      schedule: activeSchedule,
      dailyAvailability,
    })
  } catch (error) {
    console.error('Error generating schedule availability:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
} 