import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth-config';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.organizationId) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const scheduleRules = await prisma.scheduleRule.findMany({
      where: {
        organizationId: session.user.organizationId,
      },
      orderBy: {
        startDate: 'asc',
      },
    });

    // Ensure schedule is properly parsed from JSON if needed
    const parsedRules = scheduleRules.map(rule => {
      if (rule.schedule) {
        try {
          // If schedule is a string, parse it to an object
          const schedule = typeof rule.schedule === 'string'
            ? JSON.parse(rule.schedule)
            : rule.schedule;

          return {
            ...rule,
            schedule
          };
        } catch (err) {
          console.error(`Failed to parse schedule for rule ${rule.id}:`, err);
        }
      }
      return rule;
    });

    return NextResponse.json(parsedRules);
  } catch (error) {
    console.error('Error fetching schedule rules:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.organizationId) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { startDate, endDate, repeatType, daysOfWeek, conflictResolution, schedule } = body;

    // Handle conflicts based on the selected resolution strategy
    if (conflictResolution === 'delete') {
      await prisma.appointment.deleteMany({
        where: {
          startTime: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
          practitioner: {
            organizationId: session.user.organizationId
          }
        },
      });
    } else if (conflictResolution === 'move') {
      // Update appointments to move them to the new practitioner
      // This would need to be implemented based on your specific requirements
    }

    const scheduleRule = await prisma.scheduleRule.create({
      data: {
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        repeatType,
        daysOfWeek,
        organizationId: session.user.organizationId,
        schedule: schedule, // Store the complete schedule configuration
      },
    });

    return NextResponse.json(scheduleRule);
  } catch (error) {
    console.error('Error creating schedule rule:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.organizationId) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { id, startDate, endDate, repeatType, daysOfWeek, conflictResolution, schedule } = body;

    // Handle conflicts based on the selected resolution strategy
    if (conflictResolution === 'delete') {
      await prisma.appointment.deleteMany({
        where: {
          startTime: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
          practitioner: {
            organizationId: session.user.organizationId
          }
        },
      });
    } else if (conflictResolution === 'move') {
      // Update appointments to move them to the new practitioner
      // This would need to be implemented based on your specific requirements
    }

    const scheduleRule = await prisma.scheduleRule.update({
      where: { id },
      data: {
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        repeatType,
        daysOfWeek,
        schedule: schedule, // Store the complete schedule configuration
      },
    });

    return NextResponse.json(scheduleRule);
  } catch (error) {
    console.error('Error updating schedule rule:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.organizationId) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { message: 'Schedule rule ID is required' },
        { status: 400 }
      );
    }

    // Verify the schedule rule belongs to the user's organization
    const existingRule = await prisma.scheduleRule.findFirst({
      where: {
        id,
        organizationId: session.user.organizationId,
      },
    });

    if (!existingRule) {
      return NextResponse.json(
        { message: 'Schedule rule not found or unauthorized' },
        { status: 404 }
      );
    }

    // Delete the schedule rule
    await prisma.scheduleRule.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Schedule rule deleted successfully' });
  } catch (error) {
    console.error('Error deleting schedule rule:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}