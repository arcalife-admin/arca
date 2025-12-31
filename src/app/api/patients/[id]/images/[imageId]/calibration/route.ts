import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';

// Get calibration for an image
export async function GET(
  request: Request,
  { params }: { params: { id: string; imageId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const calibration = await prisma.calibration.findUnique({
      where: {
        imageId: params.imageId
      }
    });

    if (!calibration) {
      return new NextResponse('Calibration not found', { status: 404 });
    }

    return NextResponse.json(calibration);
  } catch (error) {
    console.error('Error fetching calibration:', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

// Create or update calibration
export async function PUT(
  request: Request,
  { params }: { params: { id: string; imageId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await request.json();
    const { pixelWidth, pixelHeight, realWidth, realHeight, unit } = body;

    // Validate that the image belongs to the patient
    const image = await prisma.image.findFirst({
      where: {
        id: params.imageId,
        patientId: params.id
      }
    });

    if (!image) {
      return new NextResponse('Image not found', { status: 404 });
    }

    const calibration = await prisma.calibration.upsert({
      where: {
        imageId: params.imageId
      },
      update: {
        pixelWidth,
        pixelHeight,
        realWidth,
        realHeight,
        unit
      },
      create: {
        pixelWidth,
        pixelHeight,
        realWidth,
        realHeight,
        unit,
        imageId: params.imageId
      }
    });

    return NextResponse.json(calibration);
  } catch (error) {
    console.error('Error updating calibration:', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

// Delete calibration
export async function DELETE(
  request: Request,
  { params }: { params: { id: string; imageId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Validate that the image belongs to the patient
    const image = await prisma.image.findFirst({
      where: {
        id: params.imageId,
        patientId: params.id
      }
    });

    if (!image) {
      return new NextResponse('Image not found', { status: 404 });
    }

    await prisma.calibration.delete({
      where: {
        imageId: params.imageId
      }
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting calibration:', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
} 