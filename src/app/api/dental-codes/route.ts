import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');

    if (!search) {
      // When no search term is supplied, return ALL codes for treatment modal dropdown
      const allCodes = await prisma.dentalCode.findMany({
        orderBy: { code: 'asc' },
      })

      return NextResponse.json(allCodes)
    }

    // If the query is a single character we restrict the search to *codes that start with that
    // letter* only. This prevents a flood of description matches (which often include that
    // letter) and ensures the letter-filter and one-character searches behave intuitively.

    let codes

    if (search.length === 1) {
      codes = await prisma.dentalCode.findMany({
        where: {
          code: {
            startsWith: search.toUpperCase(),
            mode: 'insensitive',
          },
        },
        orderBy: { code: 'asc' },
        take: 500, // generous cap so all letter-codes appear
      })
    } else {
      // General search: match code startsWith OR description contains
      codes = await prisma.dentalCode.findMany({
        where: {
          OR: [
            {
              code: {
                startsWith: search.toUpperCase(),
                mode: 'insensitive',
              },
            },
            {
              description: {
                contains: search,
                mode: 'insensitive',
              },
            },
          ],
        },
        orderBy: { code: 'asc' },
        take: 100, // smaller cap for larger queries
      })
    }

    return NextResponse.json(codes);
  } catch (error) {
    console.error('Error searching dental codes:', error);
    return NextResponse.json({ error: 'Failed to search dental codes' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      code,
      description,
      category,
      section,
      subSection,
      patientType,
      requirements,
    } = body;

    // Validate required fields
    if (!code || !description || !category || !section || !subSection || !patientType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if code already exists
    const existingCode = await prisma.dentalCode.findUnique({
      where: { code },
    });

    if (existingCode) {
      return NextResponse.json(
        { error: 'Code already exists' },
        { status: 400 }
      );
    }

    // Create the dental code
    const dentalCode = await prisma.dentalCode.create({
      data: {
        code,
        description,
        category,
        section,
        subSection,
        patientType,
        requirements,
      },
    });

    return NextResponse.json(dentalCode);
  } catch (error) {
    console.error('Error creating dental code:', error);
    return NextResponse.json(
      { error: 'Failed to create dental code' },
      { status: 500 }
    );
  }
} 