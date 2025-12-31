import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { codes } = body;

    if (!Array.isArray(codes)) {
      return NextResponse.json(
        { error: 'Codes must be an array' },
        { status: 400 }
      );
    }

    const results = await prisma.$transaction(
      codes.map((code) =>
        prisma.dentalCode.upsert({
          where: { code: code.code },
          update: code,
          create: code,
        })
      )
    );

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error creating dental codes:', error);
    return NextResponse.json(
      { error: 'Failed to create dental codes' },
      { status: 500 }
    );
  }
} 