export { dynamic } from '@/lib/api-config'

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isUploadStationAuthenticated } from '@/lib/upload-station-auth';
import { resolveUploadStationOrganizationId } from '@/lib/upload-station-org';

export async function GET() {
  try {
    if (!(await isUploadStationAuthenticated())) {
      return NextResponse.json({ error: 'Neautorizat' }, { status: 401 });
    }

    const organizationId = await resolveUploadStationOrganizationId();
    if (!organizationId) {
      return NextResponse.json(
        { error: 'Stația de încărcare nu este configurată complet (UPLOAD_STATION_ORGANIZATION_ID)' },
        { status: 503 }
      );
    }

    const patients = await prisma.patient.findMany({
      where: { isDisabled: false, organizationId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        patientCode: true,
        dateOfBirth: true,
        phone: true,
      },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    });

    return NextResponse.json(patients);
  } catch (error) {
    console.error('Upload station patients error:', error);
    return NextResponse.json({ error: 'Încărcarea pacienților a eșuat' }, { status: 500 });
  }
}
