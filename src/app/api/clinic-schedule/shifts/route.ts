import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-config'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Validation schemas
const createShiftSchema = z.object({
  scheduleId: z.string(),
  roomNumber: z.number().int().min(1),
  practitionerId: z.string(),
  sidePractitionerId: z.string().optional(),
  startTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/), // HH:MM format
  endTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),   // HH:MM format
  date: z.string().optional(), // YYYY-MM-DD format for specific dates
  dayOfWeek: z.string().optional(), // "Monday", "Tuesday", etc. for recurring
  priority: z.number().int().default(0),
  isOverride: z.boolean().default(false),
  reason: z.string().optional(),
})

const updateShiftSchema = createShiftSchema.partial().extend({
  id: z.string(),
})

// GET /api/clinic-schedule/shifts - List shifts for a schedule
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const scheduleId = searchParams.get('scheduleId')
    const roomNumber = searchParams.get('roomNumber')
    const date = searchParams.get('date')
    const dayOfWeek = searchParams.get('dayOfWeek')

    if (!scheduleId) {
      return NextResponse.json({ error: 'scheduleId is required' }, { status: 400 })
    }

    // Build where clause
    const where: any = { scheduleId }

    if (roomNumber) {
      where.roomNumber = parseInt(roomNumber)
    }

    if (date) {
      where.date = new Date(date)
    }

    if (dayOfWeek) {
      where.dayOfWeek = dayOfWeek
    }

    const shifts = await prisma.roomShift.findMany({
      where,
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
          }
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
          }
        },
        schedule: {
          select: {
            id: true,
            name: true,
            organizationId: true,
          }
        }
      },
      orderBy: [
        { roomNumber: 'asc' },
        { date: 'asc' },
        { dayOfWeek: 'asc' },
        { startTime: 'asc' },
        { priority: 'desc' }
      ]
    })

    return NextResponse.json({ shifts })
  } catch (error) {
    console.error('Error fetching room shifts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch room shifts' },
      { status: 500 }
    )
  }
}

// POST /api/clinic-schedule/shifts - Create a new shift
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permissions
    const userRole = session.user.role
    if (!['ORGANIZATION_OWNER', 'MANAGER'].includes(userRole)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = createShiftSchema.parse(body)

    // Validation: Either date OR dayOfWeek must be set, but not both
    if ((validatedData.date && validatedData.dayOfWeek) || (!validatedData.date && !validatedData.dayOfWeek)) {
      return NextResponse.json(
        { error: 'Either date or dayOfWeek must be specified, but not both' },
        { status: 400 }
      )
    }

    // Validate time range
    if (validatedData.startTime >= validatedData.endTime) {
      return NextResponse.json(
        { error: 'Start time must be before end time' },
        { status: 400 }
      )
    }

    // Check if schedule exists and user has access
    const schedule = await prisma.clinicSchedule.findUnique({
      where: { id: validatedData.scheduleId },
      include: { organization: true }
    })

    if (!schedule) {
      return NextResponse.json({ error: 'Schedule not found' }, { status: 404 })
    }

    if (schedule.organizationId !== session.user.organizationId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Helper function to convert time string to minutes
    const timeToMinutes = (timeStr: string): number => {
      const [hours, minutes] = timeStr.split(':').map(Number)
      return hours * 60 + minutes
    }

    // Check for overlapping shifts manually (proper time comparison)
    const whereConflictBase: any = {
      scheduleId: validatedData.scheduleId,
      roomNumber: validatedData.roomNumber,
    }

    if (validatedData.date) {
      whereConflictBase.date = new Date(validatedData.date)
    } else if (validatedData.dayOfWeek) {
      whereConflictBase.dayOfWeek = validatedData.dayOfWeek
      whereConflictBase.date = null // Only weekly recurring shifts
    }

    const existingShifts = await prisma.roomShift.findMany({
      where: whereConflictBase
    })

    // Check for time overlaps using proper time comparison
    const newStartMinutes = timeToMinutes(validatedData.startTime)
    const newEndMinutes = timeToMinutes(validatedData.endTime)

    const conflictingShifts = existingShifts.filter(shift => {
      const existingStartMinutes = timeToMinutes(shift.startTime)
      const existingEndMinutes = timeToMinutes(shift.endTime)

      // Check if times overlap
      return (
        (newStartMinutes < existingEndMinutes && newEndMinutes > existingStartMinutes)
      )
    })

    // Log conflicts for debugging but don't block creation (override is enabled by default)
    if (conflictingShifts.length > 0) {
      const conflictDetails = conflictingShifts.map(shift =>
        `${shift.startTime}-${shift.endTime}${shift.date ? ` on ${shift.date.toDateString()}` : ` (${shift.dayOfWeek}s)`}`
      ).join(', ')

      console.log(`Creating shift with time overlap: ${validatedData.startTime}-${validatedData.endTime} conflicts with: ${conflictDetails}`)

      // Still proceed with creation since override is enabled by default
    }

    // Create the shift
    const newShift = await prisma.roomShift.create({
      data: {
        scheduleId: validatedData.scheduleId,
        roomNumber: validatedData.roomNumber,
        practitionerId: validatedData.practitionerId,
        sidePractitionerId: validatedData.sidePractitionerId || null,
        startTime: validatedData.startTime,
        endTime: validatedData.endTime,
        date: validatedData.date ? new Date(validatedData.date) : null,
        dayOfWeek: validatedData.dayOfWeek || null,
        priority: validatedData.priority || 0,
        isOverride: validatedData.isOverride || false,
        reason: validatedData.reason || null,
      },
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
          }
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
          }
        }
      }
    })

    return NextResponse.json({ shift: newShift }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating room shift:', error)
    return NextResponse.json(
      { error: 'Failed to create room shift' },
      { status: 500 }
    )
  }
}

// PUT /api/clinic-schedule/shifts - Update an existing shift
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permissions
    const userRole = session.user.role
    if (!['ORGANIZATION_OWNER', 'MANAGER'].includes(userRole)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = updateShiftSchema.parse(body)

    // Check if shift exists and user has access
    const existingShift = await prisma.roomShift.findUnique({
      where: { id: validatedData.id },
      include: {
        schedule: {
          include: { organization: true }
        }
      }
    })

    if (!existingShift) {
      return NextResponse.json({ error: 'Shift not found' }, { status: 404 })
    }

    if (existingShift.schedule.organizationId !== session.user.organizationId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Validation for time range
    if (validatedData.startTime && validatedData.endTime) {
      if (validatedData.startTime >= validatedData.endTime) {
        return NextResponse.json(
          { error: 'Start time must be before end time' },
          { status: 400 }
        )
      }
    }

    // Validation: Either date OR dayOfWeek, but not both
    if (validatedData.date && validatedData.dayOfWeek) {
      return NextResponse.json(
        { error: 'Cannot specify both date and dayOfWeek' },
        { status: 400 }
      )
    }

    // Prepare update data
    const updateData: any = { ...validatedData }
    delete updateData.id

    if (updateData.date) {
      updateData.date = new Date(updateData.date)
    }

    // Update the shift
    const updatedShift = await prisma.roomShift.update({
      where: { id: validatedData.id },
      data: updateData,
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
          }
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
          }
        }
      }
    })

    return NextResponse.json({ shift: updatedShift })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating room shift:', error)
    return NextResponse.json(
      { error: 'Failed to update room shift' },
      { status: 500 }
    )
  }
}

// DELETE /api/clinic-schedule/shifts - Delete a shift
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permissions
    const userRole = session.user.role
    if (!['ORGANIZATION_OWNER', 'MANAGER'].includes(userRole)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const shiftId = searchParams.get('id')

    if (!shiftId) {
      return NextResponse.json({ error: 'Shift ID is required' }, { status: 400 })
    }

    // Check if shift exists and user has access
    const existingShift = await prisma.roomShift.findUnique({
      where: { id: shiftId },
      include: {
        schedule: {
          include: { organization: true }
        }
      }
    })

    if (!existingShift) {
      return NextResponse.json({ error: 'Shift not found' }, { status: 404 })
    }

    if (existingShift.schedule.organizationId !== session.user.organizationId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Delete the shift
    await prisma.roomShift.delete({
      where: { id: shiftId }
    })

    return NextResponse.json({ message: 'Shift deleted successfully' })
  } catch (error) {
    console.error('Error deleting room shift:', error)
    return NextResponse.json(
      { error: 'Failed to delete room shift' },
      { status: 500 }
    )
  }
} 