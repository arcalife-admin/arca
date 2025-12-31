export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { db } from '@/lib/db'
import { z } from 'zod'

// Schema for filtering logs for download
const downloadLogsSchema = z.object({
  userId: z.string().optional(),
  action: z.string().optional(),
  entityType: z.string().optional(),
  page: z.string().optional(),
  severity: z.enum(['DEBUG', 'INFO', 'WARN', 'ERROR', 'CRITICAL']).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
})

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

    // Check if user has manager permissions for downloading logs
    if (!hasManagerPermissions(session.user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const filterData = downloadLogsSchema.parse(Object.fromEntries(searchParams))

    // Build where clause
    const where: any = {
      organizationId: session.user.organizationId,
    }

    if (filterData.userId) {
      where.userId = filterData.userId
    }

    if (filterData.action) {
      where.action = { contains: filterData.action, mode: 'insensitive' }
    }

    if (filterData.entityType) {
      where.entityType = filterData.entityType
    }

    if (filterData.page) {
      where.page = { contains: filterData.page, mode: 'insensitive' }
    }

    if (filterData.severity) {
      where.severity = filterData.severity
    }

    if (filterData.startDate || filterData.endDate) {
      where.createdAt = {}
      if (filterData.startDate) {
        where.createdAt.gte = new Date(filterData.startDate)
      }
      if (filterData.endDate) {
        where.createdAt.lte = new Date(filterData.endDate)
      }
    }

    // TODO: Fix activityLog model issue
    const logs = await db.executeWithRetry(async () => {
      const prisma = db.getPrismaClient();
      // Temporarily return empty array until model is fixed
      return [];
      // return await prisma.activityLog.findMany({
      //   where,
      //   include: {
      //     user: {
      //       select: {
      //         firstName: true,
      //         lastName: true,
      //         email: true,
      //         role: true,
      //       },
      //     },
      //     patient: {
      //       select: {
      //         firstName: true,
      //         lastName: true,
      //         patientCode: true,
      //       },
      //     },
      //     appointment: {
      //       select: {
      //         startTime: true,
      //         endTime: true,
      //         type: true,
      //       },
      //     },
      //     task: {
      //       select: {
      //         title: true,
      //         status: true,
      //       },
      //     },
      //   },
      //   orderBy: {
      //     createdAt: 'desc'
      //   },
      // });
    });

    // Convert logs to CSV format
    const csvHeaders = [
      'Date',
      'Time',
      'User',
      'User Role',
      'Action',
      'Entity Type',
      'Entity ID',
      'Description',
      'Page',
      'Severity',
      'Patient',
      'Appointment',
      'Task',
      'IP Address',
      'User Agent',
      'Details'
    ]

    const csvRows = logs.map(log => [
      log.createdAt.toLocaleDateString(),
      log.createdAt.toLocaleTimeString(),
      `${log.user.firstName} ${log.user.lastName}`,
      log.user.role,
      log.action,
      log.entityType,
      log.entityId || '',
      log.description,
      log.page || '',
      log.severity,
      log.patient ? `${log.patient.firstName} ${log.patient.lastName} (${log.patient.patientCode})` : '',
      log.appointment ? `${log.appointment.type} - ${log.appointment.startTime.toLocaleDateString()}` : '',
      log.task ? `${log.task.title} (${log.task.status})` : '',
      log.ipAddress || '',
      log.userAgent || '',
      log.details ? JSON.stringify(log.details) : ''
    ])

    // Escape CSV values and create CSV content
    const escapeCSV = (value: string) => {
      if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`
      }
      return value
    }

    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => row.map(escapeCSV).join(','))
    ].join('\n')

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
    const filename = `activity-logs-${timestamp}.csv`

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache',
      },
    })
  } catch (error) {
    console.error('Error downloading logs:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid filter parameters', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 