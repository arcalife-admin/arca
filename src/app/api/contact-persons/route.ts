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
    const isActive = searchParams.get('isActive');
    const specialty = searchParams.get('specialty');

    const where: any = {
      organizationId: session.user.organizationId,
    };

    if (isActive !== null) {
      where.isActive = isActive === 'true';
    }

    if (specialty) {
      where.specialties = {
        has: specialty,
      };
    }

    const contactPersons = await prisma.contactPerson.findMany({
      where,
      include: {
        _count: {
          select: {
            repairRequests: true,
            locationContacts: true,
          },
        },
        locationContacts: {
          include: {
            location: true,
          },
        },
      },
      orderBy: [
        { isPreferred: 'desc' },
        { name: 'asc' },
      ],
    });

    return NextResponse.json(contactPersons);
  } catch (error) {
    console.error('Error fetching contact persons:', error);
    return NextResponse.json(
      { error: 'Failed to fetch contact persons' },
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
      name,
      company,
      role,
      email,
      phone,
      mobile,
      specialties = [],
      isActive = true,
      isPreferred = false
    } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Contact person name is required' },
        { status: 400 }
      );
    }

    const submitData: any = {
      name,
      company: company || null,
      role: role || null,
      email: email || null,
      phone: phone || null,
      mobile: mobile || null,
      specialties,
      isActive,
      isPreferred,
      organizationId: session.user.organizationId,
    };

    const contactPerson = await prisma.contactPerson.create({
      data: submitData,
    });

    return NextResponse.json(contactPerson, { status: 201 });
  } catch (error) {
    console.error('Error creating contact person:', error);
    return NextResponse.json(
      { error: 'Failed to create contact person' },
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
        { error: 'Contact person ID is required' },
        { status: 400 }
      );
    }

    // Verify contact person exists and belongs to organization
    const existingContact = await prisma.contactPerson.findFirst({
      where: {
        id,
        organizationId: session.user.organizationId,
      },
    });

    if (!existingContact) {
      return NextResponse.json(
        { error: 'Contact person not found' },
        { status: 404 }
      );
    }

    // Handle optional fields
    const submitData: any = { ...updateData };
    if (submitData.company !== undefined) {
      submitData.company = submitData.company || null;
    }
    if (submitData.role !== undefined) {
      submitData.role = submitData.role || null;
    }
    if (submitData.email !== undefined) {
      submitData.email = submitData.email || null;
    }
    if (submitData.phone !== undefined) {
      submitData.phone = submitData.phone || null;
    }
    if (submitData.mobile !== undefined) {
      submitData.mobile = submitData.mobile || null;
    }

    const contactPerson = await prisma.contactPerson.update({
      where: { id },
      data: submitData,
    });

    return NextResponse.json(contactPerson);
  } catch (error) {
    console.error('Error updating contact person:', error);
    return NextResponse.json(
      { error: 'Failed to update contact person' },
      { status: 500 }
    );
  }
} 