import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const productId = params.id;
    const body = await request.json();
    const { name, description, defaultPrice, category, isActive } = body;

    if (!name || defaultPrice === undefined || defaultPrice === null) {
      return NextResponse.json(
        { error: 'Name and default price are required' },
        { status: 400 }
      );
    }

    if (defaultPrice < 0) {
      return NextResponse.json(
        { error: 'Default price must be non-negative' },
        { status: 400 }
      );
    }

    // Verify product exists and belongs to organization
    const existingProduct = await prisma.product.findFirst({
      where: {
        id: productId,
        organizationId: session.user.organizationId,
      },
    });

    if (!existingProduct) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: {
        name,
        description: description || null,
        defaultPrice: parseFloat(defaultPrice),
        category: category || null,
        isActive: isActive !== undefined ? isActive : existingProduct.isActive,
      },
    });

    return NextResponse.json(updatedProduct);
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const productId = params.id;

    // Verify product exists and belongs to organization
    const existingProduct = await prisma.product.findFirst({
      where: {
        id: productId,
        organizationId: session.user.organizationId,
      },
      include: {
        purchases: {
          take: 1, // Just check if any purchases exist
        },
      },
    });

    if (!existingProduct) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Check if product has any purchases
    if (existingProduct.purchases.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete product with existing purchases. Consider deactivating instead.' },
        { status: 400 }
      );
    }

    await prisma.product.delete({
      where: { id: productId },
    });

    return NextResponse.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    );
  }
} 