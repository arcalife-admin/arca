export { dynamic } from '@/lib/api-config'

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
      return NextResponse.json({ error: 'Neautorizat' }, { status: 401 });
    }

    const productId = params.id;
    const body = await request.json();
    const { name, description, defaultPrice, category, isActive } = body;

    if (!name || defaultPrice === undefined || defaultPrice === null) {
      return NextResponse.json(
        { error: 'Numele și prețul implicit sunt obligatorii' },
        { status: 400 }
      );
    }

    if (defaultPrice < 0) {
      return NextResponse.json(
        { error: 'Prețul implicit trebuie să fie nenegativ' },
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
        { error: 'Produsul nu a fost găsit' },
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
      { error: 'Actualizarea produsului a eșuat' },
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
      return NextResponse.json({ error: 'Neautorizat' }, { status: 401 });
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
        { error: 'Produsul nu a fost găsit' },
        { status: 404 }
      );
    }

    // Check if product has any purchases
    if (existingProduct.purchases.length > 0) {
      return NextResponse.json(
        { error: 'Nu se poate șterge produsul cu achiziții existente. Considerați dezactivarea.' },
        { status: 400 }
      );
    }

    await prisma.product.delete({
      where: { id: productId },
    });

    return NextResponse.json({ message: 'Produsul a fost șters cu succes' });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { error: 'Ștergerea produsului a eșuat' },
      { status: 500 }
    );
  }
} 