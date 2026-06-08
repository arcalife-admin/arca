export { dynamic } from '@/lib/api-config'

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Neautorizat' }, { status: 401 });
    }

    const [codes, userPrices] = await Promise.all([
      prisma.surgicalProcedureCode.findMany({
        orderBy: { code: 'asc' },
        select: {
          id: true,
          code: true,
          description: true,
          price: true,
          currency: true,
          category: true,
        },
      }),
      prisma.userProcedurePrice.findMany({
        where: { userId: session.user.id },
        select: { codeId: true, price: true },
      }),
    ]);

    const userPriceMap = new Map(userPrices.map((p) => [p.codeId, p.price]));

    const merged = codes.map((code) => ({
      codeId: code.id,
      code: code.code,
      description: code.description,
      category: code.category,
      currency: code.currency,
      catalogPrice: code.price,
      userPrice: userPriceMap.get(code.id) ?? null,
      effectivePrice: userPriceMap.get(code.id) ?? code.price ?? 0,
    }));

    return NextResponse.json(merged);
  } catch (error) {
    console.error('Error fetching procedure prices:', error);
    return NextResponse.json({ error: 'Eroare internă de server' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Neautorizat' }, { status: 401 });
    }

    const body = await request.json();
    const prices: { codeId: string; price: number | null }[] = body.prices;

    if (!Array.isArray(prices)) {
      return NextResponse.json({ error: 'Corpul cererii este invalid' }, { status: 400 });
    }

    for (const item of prices) {
      if (!item.codeId) continue;

      if (item.price === null || item.price === undefined) {
        // Remove override — use catalog default
        await prisma.userProcedurePrice.deleteMany({
          where: { userId: session.user.id, codeId: item.codeId },
        });
      } else {
        await prisma.userProcedurePrice.upsert({
          where: {
            userId_codeId: { userId: session.user.id, codeId: item.codeId },
          },
          update: { price: item.price },
          create: {
            userId: session.user.id,
            codeId: item.codeId,
            price: item.price,
          },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating procedure prices:', error);
    return NextResponse.json({ error: 'Eroare internă de server' }, { status: 500 });
  }
}
