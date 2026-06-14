export { dynamic } from '@/lib/api-config'

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { findPatientInOrganization } from '@/lib/patient-access';
import {
  getSignedPatientMediaUrl,
  uploadPatientMediaBuffer,
} from '@/lib/cloudinary-patient-media';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const patient = await findPatientInOrganization(params.id, session.user.organizationId);
    if (!patient) {
      return new NextResponse('Not Found', { status: 404 });
    }

    const images = await prisma.image.findMany({
      where: {
        patientId: params.id,
      },
      include: {
        calibration: true,
        annotations: true,
      },
      orderBy: {
        dateTaken: 'desc',
      },
    });

    return NextResponse.json(
      images.map((image) => ({
        ...image,
        url: getSignedPatientMediaUrl(image.url),
      }))
    );
  } catch (error) {
    console.error('Error fetching images:', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const patient = await findPatientInOrganization(params.id, session.user.organizationId);
    if (!patient) {
      return new NextResponse('Not Found', { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string;
    const view = (formData.get('view') || formData.get('side')) as string | null;
    const bodyArea = (formData.get('bodyArea') || formData.get('toothNumber')) as string | null;
    const notes = formData.get('notes') as string;

    if (!file) {
      return new NextResponse('No file uploaded', { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await uploadPatientMediaBuffer(buffer, {
      folder: `patient-images/${params.id}`,
      resource_type: 'image',
    });

    const image = await prisma.image.create({
      data: {
        url: result.public_id,
        type: type as never,
        view: view || null,
        bodyArea: bodyArea || null,
        notes: notes || null,
        patientId: params.id,
        dateTaken: new Date(),
      },
    });

    return NextResponse.json({
      ...image,
      url: getSignedPatientMediaUrl(image.url),
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    return new NextResponse(error instanceof Error ? error.message : 'Internal Error', { status: 500 });
  }
}
