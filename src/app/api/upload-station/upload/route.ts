export { dynamic } from '@/lib/api-config'

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isUploadStationAuthenticated } from '@/lib/upload-station-auth';
import { uploadPatientImage } from '@/lib/upload-patient-image';

const ALLOWED_TYPES = new Set(['BEFORE_PHOTO', 'AFTER_PHOTO']);

export async function POST(request: NextRequest) {
  try {
    if (!(await isUploadStationAuthenticated())) {
      return NextResponse.json({ error: 'Neautorizat' }, { status: 401 });
    }

    const formData = await request.formData();
    const patientId = formData.get('patientId') as string;
    const type = formData.get('type') as string;
    const files = formData.getAll('files') as File[];

    if (!patientId) {
      return NextResponse.json({ error: 'Pacientul este obligatoriu' }, { status: 400 });
    }

    if (!type || !ALLOWED_TYPES.has(type)) {
      return NextResponse.json({ error: 'Tip de imagine invalid' }, { status: 400 });
    }

    if (!files.length) {
      return NextResponse.json({ error: 'Nu au fost încărcate fișiere' }, { status: 400 });
    }

    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      select: { id: true, firstName: true, lastName: true },
    });

    if (!patient) {
      return NextResponse.json({ error: 'Pacientul nu a fost găsit' }, { status: 404 });
    }

    const uploaded = [];
    for (const file of files) {
      if (!file.type.startsWith('image/')) continue;
      const image = await uploadPatientImage(patientId, file, type);
      uploaded.push(image);
    }

    if (uploaded.length === 0) {
      return NextResponse.json({ error: 'Nu există fișiere imagine valide' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      count: uploaded.length,
      patient: `${patient.firstName} ${patient.lastName}`,
      type,
      images: uploaded,
    });
  } catch (error) {
    console.error('Upload station upload error:', error);
    return NextResponse.json({ error: 'Încărcarea a eșuat' }, { status: 500 });
  }
}
