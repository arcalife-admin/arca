import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const patientId = params.id;
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;

    const purchases = await prisma.shopPurchase.findMany({
      where: {
        patientId,
        patient: {
          organizationId: session.user.organizationId,
        },
      },
      include: {
        product: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      ...(limit && { take: limit }),
    });

    return NextResponse.json(purchases);
  } catch (error) {
    console.error('Error fetching shop purchases:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shop purchases' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const patientId = params.id;
    const body = await request.json();
    const { purchases } = body; // Array of purchase items

    if (!purchases || !Array.isArray(purchases) || purchases.length === 0) {
      return NextResponse.json(
        { error: 'Purchases array is required' },
        { status: 400 }
      );
    }

    // Validate patient exists and belongs to organization
    const patient = await prisma.patient.findFirst({
      where: {
        id: patientId,
        organizationId: session.user.organizationId,
      },
    });

    if (!patient) {
      return NextResponse.json(
        { error: 'Patient not found' },
        { status: 404 }
      );
    }

    // Validate products exist and belong to organization
    const productIds = purchases.map((p: any) => p.productId);
    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds },
        organizationId: session.user.organizationId,
        isActive: true,
      },
    });

    if (products.length !== productIds.length) {
      return NextResponse.json(
        { error: 'One or more products not found or inactive' },
        { status: 400 }
      );
    }

    // Create purchases
    const createdPurchases = await Promise.all(
      purchases.map(async (purchase: any) => {
        const { productId, quantity, unitPrice, notes } = purchase;

        if (!productId || !quantity || quantity <= 0 || !unitPrice || unitPrice < 0) {
          throw new Error('Invalid purchase data');
        }

        return await prisma.shopPurchase.create({
          data: {
            patientId,
            productId,
            quantity: parseInt(quantity),
            unitPrice: parseFloat(unitPrice),
            totalAmount: parseInt(quantity) * parseFloat(unitPrice),
            notes: notes || null,
            isPaid: false, // Will be updated when payment is processed
          },
          include: {
            product: true,
          },
        });
      })
    );

    return NextResponse.json(createdPurchases, { status: 201 });
  } catch (error) {
    console.error('Error creating shop purchases:', error);
    return NextResponse.json(
      { error: 'Failed to create shop purchases' },
      { status: 500 }
    );
  }
} 