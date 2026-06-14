export { dynamic } from '@/lib/api-config'

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireManager, isAuthError } from '@/lib/require-auth';

export async function GET(request: Request) {
  try {
    const auth = await requireAuth();
    if (isAuthError(auth)) return auth;

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');

    if (!search) {
      // When no search term is supplied, return ALL codes for treatment modal dropdown
      const allCodes = await prisma.surgicalProcedureCode.findMany({
        orderBy: { code: 'asc' },
      })

      return NextResponse.json(allCodes)
    }

    // If the query is a single character we restrict the search to *codes that start with that
    // letter* only. This prevents a flood of description matches (which often include that
    // letter) and ensures the letter-filter and one-character searches behave intuitively.

    let codes

    if (search.length === 1) {
      codes = await prisma.surgicalProcedureCode.findMany({
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
      codes = await prisma.surgicalProcedureCode.findMany({
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
    console.error('Error searching surgical procedure codes:', error);
    return NextResponse.json({ error: 'Căutarea codurilor de proceduri chirurgicale a eșuat' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireManager();
    if (isAuthError(auth)) return auth;

    const body = await request.json();
    const {
      code,
      description,
      category,
      section,
      subSection,
      patientType,
      requirements,
      price,
      duration,
      currency,
    } = body;

    // Validate required fields
    if (!code || !description || !category || !section || !subSection) {
      return NextResponse.json(
        { error: 'Câmpuri obligatorii lipsă' },
        { status: 400 }
      );
    }

    // Check if code already exists
    const existingCode = await prisma.surgicalProcedureCode.findUnique({
      where: { code },
    });

    if (existingCode) {
      return NextResponse.json(
        { error: 'Codul există deja' },
        { status: 400 }
      );
    }

    // Create the surgical procedure code
    const surgicalCode = await prisma.surgicalProcedureCode.create({
      data: {
        code,
        description,
        category,
        section,
        subSection,
        patientType: patientType || null,
        requirements: requirements || {},
        price: price || null,
        currency: currency || 'EUR',
        duration: duration || null,
      },
    });

    return NextResponse.json(surgicalCode);
  } catch (error) {
    console.error('Error creating surgical procedure code:', error);
    return NextResponse.json(
      { error: 'Crearea codului de procedură chirurgicală a eșuat' },
      { status: 500 }
    );
  }
}

