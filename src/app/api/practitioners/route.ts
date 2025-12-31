import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth-config';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.organizationId) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const includeColors = searchParams.get('includeColors') === 'true';
    const includeDisabled = searchParams.get('includeDisabled') === 'true';

    // Build where clause - exclude disabled users by default
    const where: any = {
      organizationId: session.user.organizationId,
    };

    // Only include disabled users if explicitly requested (for manager view)
    if (!includeDisabled) {
      where.isDisabled = false;
    }

    const practitioners = await prisma.user.findMany({
      where,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        role: true,
        isDisabled: true, // Include disabled status for manager view
        ...(includeColors && {
          calendarSettings: {
            select: {
              color: true,
            },
          },
        }),
      },
      orderBy: [
        { isDisabled: 'asc' }, // Active users first
        { firstName: 'asc' },
        { lastName: 'asc' },
      ],
    });

    return NextResponse.json(practitioners);
  } catch (error) {
    console.error('Error fetching practitioners:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}