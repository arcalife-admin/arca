import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Neautorizat' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const isActive = searchParams.get('isActive');
    const isPreferred = searchParams.get('isPreferred');

    const where: any = {
      organizationId: session.user.organizationId,
    };

    if (category) {
      where.category = category;
    }

    if (isActive !== null) {
      where.isActive = isActive === 'true';
    }

    if (isPreferred !== null) {
      where.isPreferred = isPreferred === 'true';
    }

    const vendors = await prisma.vendor.findMany({
      where,
      include: {
        _count: {
          select: {
            orders: true,
            orderRequests: true,
          },
        },
      },
      orderBy: [
        { isPreferred: 'desc' },
        { name: 'asc' },
      ],
    });

    return NextResponse.json(vendors);
  } catch (error) {
    console.error('Error fetching vendors:', error);
    return NextResponse.json(
      { error: 'Încărcarea furnizorilor a eșuat' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Neautorizat' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      description,
      category,
      contactEmail,
      contactPhone,
      website,
      orderingUrl,
      accountNumber,
      paymentTerms,
      deliveryTime,
      minimumOrder,
      isActive = true,
      isPreferred = false
    } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Numele furnizorului este obligatoriu' },
        { status: 400 }
      );
    }

    // Handle optional numeric fields
    const submitData: any = {
      name,
      description: description || null,
      category: category || null,
      contactEmail: contactEmail || null,
      contactPhone: contactPhone || null,
      website: website || null,
      orderingUrl: orderingUrl || null,
      accountNumber: accountNumber || null,
      paymentTerms: paymentTerms || null,
      deliveryTime: deliveryTime ? parseInt(deliveryTime) : null,
      minimumOrder: minimumOrder ? parseFloat(minimumOrder) : null,
      isActive,
      isPreferred,
      organizationId: session.user.organizationId,
    };

    const vendor = await prisma.vendor.create({
      data: submitData,
    });

    return NextResponse.json(vendor, { status: 201 });
  } catch (error) {
    console.error('Error creating vendor:', error);
    return NextResponse.json(
      { error: 'Crearea furnizorului a eșuat' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Neautorizat' }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'ID-ul furnizorului este obligatoriu' },
        { status: 400 }
      );
    }

    // Verify vendor exists and belongs to organization
    const existingVendor = await prisma.vendor.findFirst({
      where: {
        id,
        organizationId: session.user.organizationId,
      },
    });

    if (!existingVendor) {
      return NextResponse.json(
        { error: 'Furnizorul nu a fost găsit' },
        { status: 404 }
      );
    }

    // Handle optional numeric fields
    const submitData: any = { ...updateData };
    if (submitData.deliveryTime !== undefined) {
      submitData.deliveryTime = submitData.deliveryTime ? parseInt(submitData.deliveryTime) : null;
    }
    if (submitData.minimumOrder !== undefined) {
      submitData.minimumOrder = submitData.minimumOrder ? parseFloat(submitData.minimumOrder) : null;
    }

    const vendor = await prisma.vendor.update({
      where: { id },
      data: submitData,
    });

    return NextResponse.json(vendor);
  } catch (error) {
    console.error('Error updating vendor:', error);
    return NextResponse.json(
      { error: 'Actualizarea furnizorului a eșuat' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Neautorizat' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID-ul furnizorului este obligatoriu' },
        { status: 400 }
      );
    }

    // Verify vendor exists and belongs to organization
    const existingVendor = await prisma.vendor.findFirst({
      where: {
        id,
        organizationId: session.user.organizationId,
      },
      include: {
        orders: { take: 1 },
        orderRequests: { take: 1 },
      },
    });

    if (!existingVendor) {
      return NextResponse.json(
        { error: 'Furnizorul nu a fost găsit' },
        { status: 404 }
      );
    }

    // Check if vendor has associated orders or requests
    if (existingVendor.orders.length > 0 || existingVendor.orderRequests.length > 0) {
      return NextResponse.json(
        { error: 'Nu se poate șterge furnizorul cu comenzi sau cereri asociate' },
        { status: 400 }
      );
    }

    await prisma.vendor.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Furnizorul a fost șters cu succes' });
  } catch (error) {
    console.error('Error deleting vendor:', error);
    return NextResponse.json(
      { error: 'Ștergerea furnizorului a eșuat' },
      { status: 500 }
    );
  }
} 