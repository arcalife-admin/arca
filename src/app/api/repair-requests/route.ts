import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const urgency = searchParams.get('urgency');
    const locationId = searchParams.get('locationId');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;

    const where: any = {
      organizationId: session.user.organizationId,
    };

    if (status) {
      where.status = status;
    }

    if (urgency) {
      where.urgency = urgency;
    }

    if (locationId) {
      where.locationId = locationId;
    }

    const repairRequests = await prisma.repairRequest.findMany({
      where,
      include: {
        requestedBy: {
          select: { id: true, firstName: true, lastName: true }
        },
        location: true,
        equipment: true,
        contactPerson: true,
      },
      orderBy: [
        { urgency: 'desc' },
        { createdAt: 'desc' },
      ],
      ...(limit && { take: limit }),
    });

    return NextResponse.json(repairRequests);
  } catch (error) {
    console.error('Error fetching repair requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch repair requests' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      description,
      urgency = 'NORMAL',
      equipmentId,
      locationId,
      issueCategory,
      symptoms = [],
      contactPersonId,
      scheduledDate,
      scheduledTime,
      estimatedDuration
    } = body;

    if (!title || !locationId || !issueCategory) {
      return NextResponse.json(
        { error: 'Title, location, and issue category are required' },
        { status: 400 }
      );
    }

    const submitData: any = {
      title,
      description: description || null,
      urgency,
      locationId,
      issueCategory,
      symptoms,
      requestedById: session.user.id,
      organizationId: session.user.organizationId,
    };

    if (equipmentId) {
      submitData.equipmentId = equipmentId;
    }

    if (contactPersonId) {
      submitData.contactPersonId = contactPersonId;
      submitData.assignedAt = new Date();
    }

    if (scheduledDate) {
      submitData.scheduledDate = new Date(scheduledDate);
    }

    if (scheduledTime) {
      submitData.scheduledTime = scheduledTime;
    }

    if (estimatedDuration) {
      submitData.estimatedDuration = parseInt(estimatedDuration);
    }

    const repairRequest = await prisma.repairRequest.create({
      data: submitData,
      include: {
        requestedBy: {
          select: { id: true, firstName: true, lastName: true }
        },
        location: true,
        equipment: true,
        contactPerson: true,
      },
    });

    return NextResponse.json(repairRequest, { status: 201 });
  } catch (error) {
    console.error('Error creating repair request:', error);
    return NextResponse.json(
      { error: 'Failed to create repair request' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Repair request ID is required' },
        { status: 400 }
      );
    }

    // Verify repair request exists and belongs to organization
    const existingRequest = await prisma.repairRequest.findFirst({
      where: {
        id,
        organizationId: session.user.organizationId,
      },
    });

    if (!existingRequest) {
      return NextResponse.json(
        { error: 'Repair request not found' },
        { status: 404 }
      );
    }

    // Handle status changes with appropriate timestamps
    const submitData: any = { ...updateData };

    if (updateData.status) {
      switch (updateData.status) {
        case 'SCHEDULED':
          if (updateData.scheduledDate) {
            submitData.scheduledDate = new Date(updateData.scheduledDate);
          }
          break;
        case 'IN_PROGRESS':
          if (!existingRequest.startedAt) {
            submitData.startedAt = new Date();
          }
          break;
        case 'COMPLETED':
          if (!existingRequest.completedAt) {
            submitData.completedAt = new Date();
          }
          break;
      }
    }

    // If contact person is being assigned
    if (updateData.contactPersonId && !existingRequest.contactPersonId) {
      submitData.assignedAt = new Date();
    }

    // Handle optional fields
    if (submitData.scheduledDate) {
      submitData.scheduledDate = new Date(submitData.scheduledDate);
    }
    if (submitData.estimatedDuration) {
      submitData.estimatedDuration = parseInt(submitData.estimatedDuration);
    }

    const updatedRequest = await prisma.repairRequest.update({
      where: { id },
      data: submitData,
      include: {
        requestedBy: {
          select: { id: true, firstName: true, lastName: true }
        },
        location: true,
        equipment: true,
        contactPerson: true,
      },
    });

    return NextResponse.json(updatedRequest);
  } catch (error) {
    console.error('Error updating repair request:', error);
    return NextResponse.json(
      { error: 'Failed to update repair request' },
      { status: 500 }
    );
  }
} 