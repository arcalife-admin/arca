import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// PUT /api/fluoride-flavors/[id]
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  const data = await req.json();
  const { name, color } = data;
  if (!name || !color) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }
  const flavor = await prisma.fluorideFlavor.update({
    where: { id },
    data: { name, color },
  });
  return NextResponse.json(flavor);
}

// DELETE /api/fluoride-flavors/[id]
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  await prisma.fluorideFlavor.delete({ where: { id } });
  return NextResponse.json({ success: true });
} 