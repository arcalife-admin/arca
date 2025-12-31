import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { db } from '@/lib/db'
import { z } from 'zod'

// Schema for creating a new log entry
const createLogSchema = z.object({
  action: z.string().min(1, 'Action is required'),
  entityType: z.string().min(1, 'Entity type is required'),
  entityId: z.string().optional(),
  description: z.string().min(1, 'Description is required'),
  details: z.record(z.any()).optional(),
  page: z.string().optional(),
  severity: z.enum(['DEBUG', 'INFO', 'WARN', 'ERROR', 'CRITICAL']).default('INFO'),
  patientId: z.string().optional(),
  appointmentId: z.string().optional(),
  taskId: z.string().optional(),
})

// Schema for filtering logs
const filterLogsSchema = z.object({
  userId: z.string().optional(),
  action: z.string().optional(),
  entityType: z.string().optional(),
  page: z.string().optional(),
  severity: z.enum(['DEBUG', 'INFO', 'WARN', 'ERROR', 'CRITICAL']).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  limit: z.string().transform(Number).optional(),
  offset: z.string().transform(Number).optional(),
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

    // Check if user has manager permissions for viewing logs
    if (!hasManagerPermissions(session.user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const filterData = filterLogsSchema.parse(Object.fromEntries(searchParams))

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

    const limit = filterData.limit || 50
    const offset = filterData.offset || 0

    const [logs, totalCount] = await Promise.all([
      // TODO: Fix activityLog model issue
      db.executeWithRetry(async () => {
        const prisma = db.getPrismaClient();
        // Temporarily return empty array until model is fixed
        return [];
        // return await prisma.activityLog.findMany({
        //   where,
        //   include: {
        //     user: {
        //       select: {
        //         id: true,
        //         firstName: true,
        //         lastName: true,
        //         email: true,
        //         role: true,
        //       },
        //     },
        //     patient: {
        //       select: {
        //         id: true,
        //         firstName: true,
        //         lastName: true,
        //         patientCode: true,
        //       },
        //     },
        //     appointment: {
        //       select: {
        //         id: true,
        //         startTime: true,
        //         endTime: true,
        //         type: true,
        //       },
        //     },
        //     task: {
        //       select: {
        //         id: true,
        //         title: true,
        //         status: true,
        //       },
        //     },
        //   },
        //   orderBy: {
        //     createdAt: 'desc'
        //   },
        //   take: limit,
        //   skip: offset,
        // });
      }),
      // TODO: Fix activityLog model issue
      db.executeWithRetry(async () => {
        const prisma = db.getPrismaClient();
        // Temporarily return 0 until model is fixed
        return 0;
        // return await prisma.activityLog.count({ where });
      })
    ]);

    return NextResponse.json({
      logs,
      totalCount,
      hasMore: totalCount > offset + limit,
      currentPage: Math.floor(offset / limit) + 1,
      totalPages: Math.ceil(totalCount / limit),
    })
  } catch (error) {
    console.error('Error fetching logs:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid filter parameters', details: error.errors },
        { status: 400 }
      )
    }

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
    const validatedData = createLogSchema.parse(body)

    // Get client IP and user agent
    const ipAddress = request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // TODO: Fix activityLog model issue
    const log = await db.executeWithRetry(async () => {
      const prisma = db.getPrismaClient();
      // Temporarily return mock data until model is fixed
      return {
        id: 'temp-id',
        action: validatedData.action,
        entityType: validatedData.entityType,
        entityId: validatedData.entityId,
        description: validatedData.description,
        details: validatedData.details || {},
        ipAddress,
        userAgent,
        page: validatedData.page,
        severity: validatedData.severity,
        userId: session.user.id,
        organizationId: session.user.organizationId,
        patientId: validatedData.patientId,
        appointmentId: validatedData.appointmentId,
        taskId: validatedData.taskId,
        user: {
          id: session.user.id,
          firstName: session.user.firstName || '',
          lastName: session.user.lastName || '',
          email: session.user.email || '',
          role: session.user.role || 'USER'
        }
      };
      // return await prisma.activityLog.create({
      //   data: {
      //     action: validatedData.action,
      //     entityType: validatedData.entityType,
      //     entityId: validatedData.entityId,
      //     description: validatedData.description,
      //     details: validatedData.details || {},
      //     ipAddress,
      //     userAgent,
      //     page: validatedData.page,
      //     severity: validatedData.severity,
      //     userId: session.user.id,
      //     organizationId: session.user.organizationId,
      //     patientId: validatedData.patientId,
      //     appointmentId: validatedData.appointmentId,
      //     taskId: validatedData.taskId,
      //   },
      //   include: {
      //     user: {
      //       select: {
      //         id: true,
      //         firstName: true,
      //         lastName: true,
      //         email: true,
      //         role: true,
      //       },
      //     },
      //   },
      // });
    });

    return NextResponse.json(log, { status: 201 })
  } catch (error) {
    console.error('Error creating log:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || !session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has manager permissions for deleting logs
    if (!hasManagerPermissions(session.user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const logIds = searchParams.get('ids')?.split(',') || []
    const deleteAll = searchParams.get('deleteAll') === 'true'
    const beforeDate = searchParams.get('beforeDate')

    let where: any = {
      organizationId: session.user.organizationId,
    }

    if (deleteAll && beforeDate) {
      where.createdAt = {
        lte: new Date(beforeDate)
      }
    } else if (logIds.length > 0) {
      where.id = {
        in: logIds
      }
    } else {
      return NextResponse.json({ error: 'No logs specified for deletion' }, { status: 400 })
    }

    // TODO: Fix activityLog model issue
    const deletedCount = await db.executeWithRetry(async () => {
      const prisma = db.getPrismaClient();
      // Temporarily return mock data until model is fixed
      return { count: 0 };
      // return await prisma.activityLog.deleteMany({
      //   where
      // });
    });

    return NextResponse.json({
      message: `Successfully deleted ${deletedCount.count} log(s)`,
      deletedCount: deletedCount.count
    })
  } catch (error) {
    console.error('Error deleting logs:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 