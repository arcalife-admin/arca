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
    const vendorId = searchParams.get('vendorId');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;

    const where: any = {
      organizationId: session.user.organizationId,
    };

    if (status) {
      where.status = status;
    }

    if (vendorId) {
      where.vendorId = vendorId;
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        vendor: true,
        orderedBy: {
          select: { id: true, firstName: true, lastName: true }
        },
        approvedBy: {
          select: { id: true, firstName: true, lastName: true }
        },
        items: {
          include: {
            category: true,
          },
        },
        requests: {
          include: {
            requestedBy: {
              select: { id: true, firstName: true, lastName: true }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc',
      },
      ...(limit && { take: limit }),
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
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
      vendorId,
      items,
      priority = 'NORMAL',
      expectedDelivery,
      notes,
      requestIds = []
    } = body;

    if (!vendorId || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Vendor ID and items are required' },
        { status: 400 }
      );
    }

    // Validate vendor exists and belongs to organization
    const vendor = await prisma.vendor.findFirst({
      where: {
        id: vendorId,
        organizationId: session.user.organizationId,
      },
    });

    if (!vendor) {
      return NextResponse.json(
        { error: 'Vendor not found' },
        { status: 404 }
      );
    }

    // Generate order number
    const orderCount = await prisma.order.count({
      where: { organizationId: session.user.organizationId }
    });
    const orderNumber = `ORD-${new Date().getFullYear()}-${String(orderCount + 1).padStart(4, '0')}`;

    // Calculate totals
    const subtotal = items.reduce((sum: number, item: any) =>
      sum + (item.quantity * item.unitPrice), 0
    );

    const order = await prisma.order.create({
      data: {
        orderNumber,
        vendorId,
        status: 'DRAFT',
        priority,
        expectedDelivery: expectedDelivery ? new Date(expectedDelivery) : null,
        subtotal,
        totalAmount: subtotal, // Initially same as subtotal, can be updated with tax/shipping
        orderedById: session.user.id,
        notes,
        organizationId: session.user.organizationId,
        items: {
          create: items.map((item: any) => ({
            itemName: item.itemName,
            description: item.description,
            productCode: item.productCode,
            brand: item.brand,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.quantity * item.unitPrice,
            categoryId: item.categoryId,
            minimumStock: item.minimumStock,
            maxStock: item.maxStock,
            location: item.location,
          }))
        }
      },
      include: {
        vendor: true,
        orderedBy: {
          select: { id: true, firstName: true, lastName: true }
        },
        items: {
          include: {
            category: true,
          },
        },
      },
    });

    // Add timeline event for order creation
    await prisma.orderTimelineEvent.create({
      data: {
        orderId: order.id,
        type: 'CREATED',
        message: `Order ${order.orderNumber} created`,
        createdById: session.user.id,
      },
    });

    // Link any requests to this order
    if (requestIds.length > 0) {
      await prisma.orderRequest.updateMany({
        where: {
          id: { in: requestIds },
          organizationId: session.user.organizationId,
        },
        data: {
          orderId: order.id,
          status: 'ORDERED',
        },
      });
    }

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
} 