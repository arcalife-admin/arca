import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { prisma } from '@/lib/prisma'
import { LeaveRequestStatus } from '@prisma/client'
import { z } from 'zod'

// Schema for creating a leave request
const createLeaveRequestSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  leaveType: z.enum([
    'VACATION',
    'SICK_LEAVE',
    'PERSONAL',
    'MATERNITY',
    'PATERNITY',
    'BEREAVEMENT',
    'EMERGENCY',
    'UNPAID',
    'COMPENSATORY',
    'STUDY',
    'OTHER',
  ]),
  startDate: z.string().transform((val) => new Date(val)),
  endDate: z.string().transform((val) => new Date(val)),
  isPartialDay: z.boolean().default(false),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
})

// Schema for reviewing a leave request (manager action)
const reviewLeaveRequestSchema = z.object({
  action: z.enum(['APPROVE', 'DENY', 'PROPOSE_ALTERNATIVE']),
  reviewComments: z.string().optional(),
  alternativeStartDate: z.string().optional().transform((val) => val ? new Date(val) : undefined),
  alternativeEndDate: z.string().optional().transform((val) => val ? new Date(val) : undefined),
  alternativeComments: z.string().optional(),
})

// Schema for responding to alternative proposal (user action)
const respondToAlternativeSchema = z.object({
  accepted: z.boolean(),
})

// Helper function to calculate total days
function calculateTotalDays(startDate: Date, endDate: Date, isPartialDay: boolean, startTime?: string, endTime?: string): number {
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1 // +1 to include both start and end dates

  if (isPartialDay && startTime && endTime) {
    // Calculate partial day based on time difference
    const [startHour, startMin] = startTime.split(':').map(Number)
    const [endHour, endMin] = endTime.split(':').map(Number)
    const startMinutes = startHour * 60 + startMin
    const endMinutes = endHour * 60 + endMin
    const totalMinutes = endMinutes - startMinutes
    return totalMinutes / (8 * 60) // Assuming 8-hour workday
  }

  return diffDays
}

// Check if user has manager permissions
function hasManagerPermissions(userRole: string): boolean {
  return userRole === 'ORGANIZATION_OWNER' || userRole === 'MANAGER'
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || !session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const status = searchParams.get('status')
    const view = searchParams.get('view')
    const isManagerView = searchParams.get('managerView') === 'true'

    // Build where clause
    const where: any = {
      organizationId: session.user.organizationId,
    }

    // Handle calendar view - show all approved leave for everyone in organization
    if (view === 'calendar') {
      where.status = {
        in: ['APPROVED', 'ALTERNATIVE_ACCEPTED']
      }
      // For calendar view, include practitioner information
    } else if (view === 'user') {
      // User view - only show their own requests
      where.userId = session.user.id
    } else if (isManagerView && hasManagerPermissions(session.user.role)) {
      // Manager can see all requests in organization
      if (userId) {
        where.userId = userId
      }
    } else {
      // Regular users can only see their own requests
      where.userId = session.user.id
    }

    // Apply status filter if provided (except for calendar view which overrides it)
    if (status && view !== 'calendar') {
      if (status === 'approved') {
        where.status = {
          in: ['APPROVED', 'ALTERNATIVE_ACCEPTED']
        }
      } else {
        where.status = status.toUpperCase()
      }
    }

    const leaveRequests = await prisma.leaveRequest.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
            // Include practitioner info for calendar blocking
            ...(view === 'calendar' && {
              organizationId: true,
            }),
          },
        },
        reviewedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        ...(view === 'calendar' && {
          organization: {
            select: {
              id: true,
              name: true,
            },
          },
        }),
      },
      orderBy: [
        { createdAt: 'desc' },
      ],
    })

    // For calendar view, add practitioner mapping logic
    let enhancedRequests = leaveRequests
    if (view === 'calendar') {
      // Get practitioner IDs for users who are practitioners
      const userIds = leaveRequests.map(req => req.userId)
      const practitioners = await prisma.user.findMany({
        where: {
          id: { in: userIds },
          role: {
            in: [
              'DENTIST',
              'HYGIENIST',
              'ORTHODONTIST',
              'PERIODONTOLOGIST',
              'IMPLANTOLOGIST',
              'ENDODONTIST',
              'ANESTHESIOLOGIST',
            ]
          }
        },
        select: {
          id: true,
          role: true,
        },
      })

      const practitionerMap = new Map(practitioners.map(p => [p.id, p.id]))

      enhancedRequests = leaveRequests.map(request => ({
        ...request,
        user: {
          ...request.user,
          practitionerId: practitionerMap.get(request.userId) || null,
        },
      }))
    }

    return NextResponse.json({
      leaveRequests: enhancedRequests,
      ...(view === 'calendar' && { view: 'calendar' })
    })
  } catch (error) {
    console.error('Error fetching leave requests:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || !session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createLeaveRequestSchema.parse(body)

    // Validate dates
    if (validatedData.startDate > validatedData.endDate) {
      return NextResponse.json(
        { error: 'Start date cannot be after end date' },
        { status: 400 }
      )
    }

    // Check for overlapping leave requests
    const overlappingRequest = await prisma.leaveRequest.findFirst({
      where: {
        userId: session.user.id,
        organizationId: session.user.organizationId,
        status: {
          in: ['PENDING', 'APPROVED', 'ALTERNATIVE_PROPOSED', 'ALTERNATIVE_ACCEPTED'],
        },
        OR: [
          {
            AND: [
              { startDate: { lte: validatedData.startDate } },
              { endDate: { gte: validatedData.startDate } },
            ],
          },
          {
            AND: [
              { startDate: { lte: validatedData.endDate } },
              { endDate: { gte: validatedData.endDate } },
            ],
          },
          {
            AND: [
              { startDate: { gte: validatedData.startDate } },
              { endDate: { lte: validatedData.endDate } },
            ],
          },
        ],
      },
    })

    if (overlappingRequest) {
      return NextResponse.json(
        { error: 'You already have a leave request for overlapping dates' },
        { status: 400 }
      )
    }

    // Calculate total days
    const totalDays = calculateTotalDays(
      validatedData.startDate,
      validatedData.endDate,
      validatedData.isPartialDay,
      validatedData.startTime,
      validatedData.endTime
    )

    // Create leave request
    const leaveRequest = await prisma.leaveRequest.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        leaveType: validatedData.leaveType,
        startDate: validatedData.startDate,
        endDate: validatedData.endDate,
        isPartialDay: validatedData.isPartialDay,
        startTime: validatedData.startTime,
        endTime: validatedData.endTime,
        totalDays,
        userId: session.user.id,
        organizationId: session.user.organizationId,
        status: 'PENDING',
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
      },
    })

    return NextResponse.json(leaveRequest, { status: 201 })
  } catch (error) {
    console.error('Error creating leave request:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || !session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { leaveRequestId, type, ...actionData } = body

    if (!leaveRequestId) {
      return NextResponse.json({ error: 'Leave request ID is required' }, { status: 400 })
    }

    // Find the leave request
    const leaveRequest = await prisma.leaveRequest.findFirst({
      where: {
        id: leaveRequestId,
        organizationId: session.user.organizationId,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    })

    if (!leaveRequest) {
      return NextResponse.json({ error: 'Leave request not found' }, { status: 404 })
    }

    if (type === 'review') {
      // Manager reviewing a leave request
      // Allow self-approval for personal blocked times, otherwise require manager permissions
      const isSelfApprovalForPersonalBlock = (
        leaveRequest.userId === session.user.id &&
        leaveRequest.leaveType === 'PERSONAL' &&
        actionData.reviewComments === 'Auto-approved personal blocked time'
      );

      if (!isSelfApprovalForPersonalBlock && !hasManagerPermissions(session.user.role)) {
        return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
      }

      const validatedData = reviewLeaveRequestSchema.parse(actionData)

      let updateData: any = {
        reviewedById: session.user.id,
        reviewedAt: new Date(),
        reviewComments: validatedData.reviewComments,
      }

      switch (validatedData.action) {
        case 'APPROVE':
          updateData.status = 'APPROVED'
          break

        case 'DENY':
          updateData.status = 'DENIED'
          break

        case 'PROPOSE_ALTERNATIVE':
          if (!validatedData.alternativeStartDate || !validatedData.alternativeEndDate) {
            return NextResponse.json(
              { error: 'Alternative dates are required when proposing alternative' },
              { status: 400 }
            )
          }
          updateData.status = 'ALTERNATIVE_PROPOSED'
          updateData.hasAlternative = true
          updateData.alternativeStartDate = validatedData.alternativeStartDate
          updateData.alternativeEndDate = validatedData.alternativeEndDate
          updateData.alternativeComments = validatedData.alternativeComments
          break
      }

      const updatedRequest = await prisma.leaveRequest.update({
        where: { id: leaveRequestId },
        data: updateData,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true,
            },
          },
          reviewedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      })

      return NextResponse.json(updatedRequest)

    } else if (type === 'respond_alternative') {
      // User responding to alternative proposal
      if (leaveRequest.userId !== session.user.id) {
        return NextResponse.json({ error: 'Can only respond to your own leave requests' }, { status: 403 })
      }

      if (leaveRequest.status !== 'ALTERNATIVE_PROPOSED') {
        return NextResponse.json({ error: 'No alternative proposal to respond to' }, { status: 400 })
      }

      const validatedData = respondToAlternativeSchema.parse(actionData)

      const updateData = {
        alternativeAccepted: validatedData.accepted,
        alternativeRespondedAt: new Date(),
        status: validatedData.accepted ? LeaveRequestStatus.ALTERNATIVE_ACCEPTED : LeaveRequestStatus.ALTERNATIVE_REJECTED,
      }

      const updatedRequest = await prisma.leaveRequest.update({
        where: { id: leaveRequestId },
        data: updateData,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true,
            },
          },
          reviewedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      })

      return NextResponse.json(updatedRequest)

    } else if (type === 'cancel') {
      // User cancelling their own request
      if (leaveRequest.userId !== session.user.id) {
        return NextResponse.json({ error: 'Can only cancel your own leave requests' }, { status: 403 })
      }

      if (!['PENDING', 'ALTERNATIVE_PROPOSED'].includes(leaveRequest.status)) {
        return NextResponse.json({ error: 'Cannot cancel this leave request' }, { status: 400 })
      }

      const updatedRequest = await prisma.leaveRequest.update({
        where: { id: leaveRequestId },
        data: { status: 'CANCELLED' },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true,
            },
          },
          reviewedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      })

      return NextResponse.json(updatedRequest)
    }

    return NextResponse.json({ error: 'Invalid action type' }, { status: 400 })
  } catch (error) {
    console.error('Error updating leave request:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 