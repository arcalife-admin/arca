export { dynamic } from '@/lib/api-config'

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

    const products = await prisma.product.findMany({
      where: {
        organizationId: session.user.organizationId,
        isActive: true,
      },
      orderBy: [
        { category: 'asc' },
        { name: 'asc' },
      ],
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Încărcarea produselor a eșuat' },
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
    const { name, description, defaultPrice, category } = body;

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

    const product = await prisma.product.create({
      data: {
        name,
        description: description || null,
        defaultPrice: parseFloat(defaultPrice),
        category: category || null,
        organizationId: session.user.organizationId,
        isActive: true,
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: 'Crearea produsului a eșuat' },
      { status: 500 }
    );
  }
} 