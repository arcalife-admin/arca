import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';

// Get all annotations for an image
export async function GET(
  request: Request,
  { params }: { params: { id: string; imageId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const annotations = await prisma.annotation.findMany({
      where: {
        imageId: params.imageId,
        image: {
          patientId: params.id
        }
      }
    });

    return NextResponse.json(annotations);
  } catch (error) {
    console.error('Error fetching annotations:', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

// Add a new annotation
export async function POST(
  request: Request,
  { params }: { params: { id: string; imageId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await request.json();
    const { type, points, text, color, size, measurement } = body;

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

    const annotation = await prisma.annotation.create({
      data: {
        type,
        points,
        text,
        color,
        size,
        measurement,
        imageId: params.imageId
      }
    });

    return NextResponse.json(annotation);
  } catch (error) {
    console.error('Error creating annotation:', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

// Update an annotation
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
    const { annotationId, type, points, text, color, size, measurement } = body;

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

    const annotation = await prisma.annotation.update({
      where: {
        id: annotationId,
        imageId: params.imageId
      },
      data: {
        type,
        points,
        text,
        color,
        size,
        measurement
      }
    });

    return NextResponse.json(annotation);
  } catch (error) {
    console.error('Error updating annotation:', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

// Delete an annotation or all annotations for an image
export async function DELETE(
  request: Request,
  { params }: { params: { id: string; imageId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const annotationId = searchParams.get('annotationId');

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

    if (annotationId) {
      // Delete specific annotation
      await prisma.annotation.delete({
        where: {
          id: annotationId,
          imageId: params.imageId
        }
      });
    } else {
      // Delete all annotations for the image
      await prisma.annotation.deleteMany({
        where: {
          imageId: params.imageId
        }
      });
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting annotation:', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
} 