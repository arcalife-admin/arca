import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { prisma } from '@/lib/prisma'

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

    // Check if user has manager permissions
    if (!hasManagerPermissions(session.user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'month' // month, quarter, year

    // Calculate date range
    let startDate: Date
    let endDate: Date = new Date()

    switch (period) {
      case 'quarter':
        const quarterStart = Math.floor(endDate.getMonth() / 3) * 3
        startDate = new Date(endDate.getFullYear(), quarterStart, 1)
        break
      case 'year':
        startDate = new Date(endDate.getFullYear(), 0, 1)
        break
      default: // month
        startDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1)
    }

    // Get organization info
    const organization = await prisma.organization.findUnique({
      where: { id: session.user.organizationId },
      select: {
        id: true,
        name: true,
        employeeCount: true,
        createdAt: true,
      },
    })

    // User Analytics
    const totalUsers = await prisma.user.count({
      where: { organizationId: session.user.organizationId },
    })

    const activeUsers = await prisma.user.count({
      where: {
        organizationId: session.user.organizationId,
        isActive: true,
        isDisabled: false,
      },
    })

    const disabledUsers = await prisma.user.count({
      where: {
        organizationId: session.user.organizationId,
        isDisabled: true,
      },
    })

    const newUsersThisPeriod = await prisma.user.count({
      where: {
        organizationId: session.user.organizationId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    })

    // User roles breakdown
    const usersByRole = await prisma.user.groupBy({
      by: ['role'],
      where: {
        organizationId: session.user.organizationId,
        isActive: true,
      },
      _count: {
        role: true,
      },
    })

    // Patient Analytics
    const totalPatients = await prisma.patient.count({
      where: { organizationId: session.user.organizationId },
    })

    const activePatients = await prisma.patient.count({
      where: {
        organizationId: session.user.organizationId,
        isDisabled: false,
      },
    })

    const newPatientsThisPeriod = await prisma.patient.count({
      where: {
        organizationId: session.user.organizationId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    })

    // Appointment Analytics
    const totalAppointments = await prisma.appointment.count({
      where: {
        practitioner: {
          organizationId: session.user.organizationId,
        },
        startTime: {
          gte: startDate,
          lte: endDate,
        },
      },
    })

    const appointmentsByStatus = await prisma.appointment.groupBy({
      by: ['status'],
      where: {
        practitioner: {
          organizationId: session.user.organizationId,
        },
        startTime: {
          gte: startDate,
          lte: endDate,
        },
      },
      _count: {
        status: true,
      },
    })

    const appointmentsByPractitioner = await prisma.appointment.groupBy({
      by: ['practitionerId'],
      where: {
        practitioner: {
          organizationId: session.user.organizationId,
        },
        startTime: {
          gte: startDate,
          lte: endDate,
        },
      },
      _count: {
        practitionerId: true,
      },
    })

    // Enhance practitioner data with names
    const practitionerIds = appointmentsByPractitioner.map(a => a.practitionerId)
    const practitioners = await prisma.user.findMany({
      where: {
        id: { in: practitionerIds },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        role: true,
      },
    })

    const appointmentsByPractitionerWithNames = appointmentsByPractitioner.map(ap => {
      const practitioner = practitioners.find(p => p.id === ap.practitionerId)
      return {
        practitionerId: ap.practitionerId,
        practitionerName: practitioner ? `${practitioner.firstName} ${practitioner.lastName}` : 'Unknown',
        practitionerRole: practitioner?.role || 'Unknown',
        appointmentCount: ap._count.practitionerId,
      }
    })

    // Task Analytics
    const totalTasks = await prisma.task.count({
      where: { organizationId: session.user.organizationId },
    })

    const tasksByStatus = await prisma.task.groupBy({
      by: ['status'],
      where: { organizationId: session.user.organizationId },
      _count: {
        status: true,
      },
    })

    const tasksByPriority = await prisma.task.groupBy({
      by: ['priority'],
      where: { organizationId: session.user.organizationId },
      _count: {
        priority: true,
      },
    })

    const completedTasksThisPeriod = await prisma.task.count({
      where: {
        organizationId: session.user.organizationId,
        status: 'COMPLETED',
        completedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    })

    // Leave Request Analytics
    const totalLeaveRequests = await prisma.leaveRequest.count({
      where: { organizationId: session.user.organizationId },
    })

    const leaveRequestsByStatus = await prisma.leaveRequest.groupBy({
      by: ['status'],
      where: { organizationId: session.user.organizationId },
      _count: {
        status: true,
      },
    })

    const leaveRequestsByType = await prisma.leaveRequest.groupBy({
      by: ['leaveType'],
      where: { organizationId: session.user.organizationId },
      _count: {
        leaveType: true,
      },
    })

    const pendingLeaveRequests = await prisma.leaveRequest.count({
      where: {
        organizationId: session.user.organizationId,
        status: 'PENDING',
      },
    })

    // Recent activity
    const recentAppointments = await prisma.appointment.findMany({
      where: {
        practitioner: {
          organizationId: session.user.organizationId,
        },
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        },
      },
      include: {
        patient: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        practitioner: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    })

    const recentTasks = await prisma.task.findMany({
      where: {
        organizationId: session.user.organizationId,
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        },
      },
      include: {
        creator: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        patient: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    })

    const recentLeaveRequests = await prisma.leaveRequest.findMany({
      where: {
        organizationId: session.user.organizationId,
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        },
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    })

    // Performance metrics
    const averageAppointmentDuration = await prisma.appointment.aggregate({
      where: {
        practitioner: {
          organizationId: session.user.organizationId,
        },
        startTime: {
          gte: startDate,
          lte: endDate,
        },
        duration: {
          not: null,
        },
      },
      _avg: {
        duration: true,
      },
    })

    // Daily trend data for charts (last 30 days)
    const dailyTrends = []
    for (let i = 29; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dayStart = new Date(date.setHours(0, 0, 0, 0))
      const dayEnd = new Date(date.setHours(23, 59, 59, 999))

      const dayAppointments = await prisma.appointment.count({
        where: {
          practitioner: {
            organizationId: session.user.organizationId,
          },
          startTime: {
            gte: dayStart,
            lte: dayEnd,
          },
        },
      })

      const dayTasks = await prisma.task.count({
        where: {
          organizationId: session.user.organizationId,
          createdAt: {
            gte: dayStart,
            lte: dayEnd,
          },
        },
      })

      dailyTrends.push({
        date: dayStart.toISOString().split('T')[0],
        appointments: dayAppointments,
        tasks: dayTasks,
      })
    }

    // Top performing practitioners (by appointment count)
    const topPractitioners = appointmentsByPractitionerWithNames
      .sort((a, b) => b.appointmentCount - a.appointmentCount)
      .slice(0, 5)

    // Build comprehensive response
    const analytics = {
      period,
      startDate,
      endDate,
      organization,

      // Summary metrics
      summary: {
        totalUsers,
        activeUsers,
        disabledUsers,
        newUsersThisPeriod,
        totalPatients,
        activePatients,
        newPatientsThisPeriod,
        totalAppointments,
        totalTasks,
        completedTasksThisPeriod,
        totalLeaveRequests,
        pendingLeaveRequests,
        averageAppointmentDuration: Math.round(averageAppointmentDuration._avg.duration || 0),
      },

      // Breakdown data
      usersByRole: usersByRole.map(role => ({
        role: role.role,
        count: role._count.role,
      })),

      appointmentsByStatus: appointmentsByStatus.map(status => ({
        status: status.status,
        count: status._count.status,
      })),

      appointmentsByPractitioner: appointmentsByPractitionerWithNames,

      tasksByStatus: tasksByStatus.map(status => ({
        status: status.status,
        count: status._count.status,
      })),

      tasksByPriority: tasksByPriority.map(priority => ({
        priority: priority.priority,
        count: priority._count.priority,
      })),

      leaveRequestsByStatus: leaveRequestsByStatus.map(status => ({
        status: status.status,
        count: status._count.status,
      })),

      leaveRequestsByType: leaveRequestsByType.map(type => ({
        type: type.leaveType,
        count: type._count.leaveType,
      })),

      // Performance data
      topPractitioners,
      dailyTrends,

      // Recent activity
      recentActivity: {
        appointments: recentAppointments.map(apt => ({
          id: apt.id,
          type: apt.type,
          patientName: apt.patient ? `${apt.patient.firstName} ${apt.patient.lastName}` : 'No Patient',
          practitionerName: `${apt.practitioner.firstName} ${apt.practitioner.lastName}`,
          startTime: apt.startTime,
          status: apt.status,
          createdAt: apt.createdAt,
        })),
        tasks: recentTasks.map(task => ({
          id: task.id,
          title: task.title,
          status: task.status,
          priority: task.priority,
          creatorName: `${task.creator.firstName} ${task.creator.lastName}`,
          patientName: task.patient ? `${task.patient.firstName} ${task.patient.lastName}` : null,
          createdAt: task.createdAt,
        })),
        leaveRequests: recentLeaveRequests.map(request => ({
          id: request.id,
          title: request.title,
          leaveType: request.leaveType,
          status: request.status,
          userName: `${request.user.firstName} ${request.user.lastName}`,
          startDate: request.startDate,
          endDate: request.endDate,
          createdAt: request.createdAt,
        })),
      },
    }

    return NextResponse.json(analytics)
  } catch (error) {
    console.error('Error fetching manager analytics:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 