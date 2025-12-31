import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth-config';

export const dynamic = 'force-dynamic';

// Check if user has manager permissions
function hasManagerPermissions(userRole: string): boolean {
  return userRole === 'ORGANIZATION_OWNER' || userRole === 'MANAGER'
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.organizationId) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user has manager permissions
    if (!hasManagerPermissions(session.user.role)) {
      return NextResponse.json(
        { message: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const includeColors = searchParams.get('includeColors') === 'true';

    // For manager view, include ALL practitioners (including disabled ones)
    const practitioners = await prisma.user.findMany({
      where: {
        organizationId: session.user.organizationId,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        isDisabled: true,
        disabledReason: true,
        disabledAt: true,
        lastLoginAt: true,
        ...(includeColors && {
          calendarSettings: {
            select: {
              color: true,
            },
          },
        }),
        // Include counts for management insights
        _count: {
          select: {
            appointments: true,
            createdTasks: true,
            completedTasks: true,
            dentalProcedures: true,
            leaveRequests: true,
          },
        },
      },
      orderBy: [
        { isDisabled: 'asc' }, // Active users first
        { isActive: 'desc' }, // Then by active status
        { firstName: 'asc' },
        { lastName: 'asc' },
      ],
    });

    return NextResponse.json(practitioners);
  } catch (error) {
    console.error('Error fetching practitioners for manager:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 