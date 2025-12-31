import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get waiting list statistics grouped by practitioner
    const stats = await prisma.waitingListEntry.groupBy({
      by: ['practitionerId'],
      where: {
        status: 'ACTIVE',
      },
      _count: {
        id: true,
      },
    });

    // Get practitioner details for each group
    const practitionerIds = stats.map(stat => stat.practitionerId);
    const practitioners = await prisma.user.findMany({
      where: {
        id: {
          in: practitionerIds,
        },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        role: true,
      },
    });

    // Combine stats with practitioner details
    const waitingListStats = stats.map(stat => {
      const practitioner = practitioners.find(p => p.id === stat.practitionerId);
      return {
        practitionerId: stat.practitionerId,
        practitionerName: practitioner ? `${practitioner.firstName} ${practitioner.lastName}` : 'Unknown',
        practitionerRole: practitioner?.role || 'Unknown',
        patientCount: stat._count.id,
      };
    }).filter(stat => stat.practitionerName !== 'Unknown');

    return NextResponse.json(waitingListStats);
  } catch (error) {
    console.error('Error fetching waiting list stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch waiting list stats' },
      { status: 500 }
    );
  }
} 