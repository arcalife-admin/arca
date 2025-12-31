import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/fluoride-flavors?organizationId=xxx
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const organizationId = searchParams.get('organizationId');
  if (!organizationId) return NextResponse.json([], { status: 400 });
  const flavors = await prisma.fluorideFlavor.findMany({
    where: { organizationId },
    orderBy: { createdAt: 'asc' },
  });
  return NextResponse.json(flavors);
}

// POST /api/fluoride-flavors
export async function POST(req: NextRequest) {
  const data = await req.json();
  const { name, color, organizationId } = data;
  if (!name || !color || !organizationId) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }
  const exists = await prisma.fluorideFlavor.findFirst({ where: { name, organizationId } });
  if (exists) {
    return NextResponse.json({ error: 'Flavor already exists' }, { status: 409 });
  }
  const flavor = await prisma.fluorideFlavor.create({
    data: { name, color, organizationId },
  });
  return NextResponse.json(flavor);
} 