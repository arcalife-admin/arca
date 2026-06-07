import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; imageId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Neautorizat' }, { status: 401 });
    }

    const image = await prisma.image.findUnique({
      where: {
        id: params.imageId,
        patientId: params.id,
      },
    });

    if (!image) {
      return NextResponse.json({ error: 'Imaginea nu a fost găsită' }, { status: 404 });
    }

    const publicId = image.url.split('/').slice(-1)[0].split('.')[0];
    await cloudinary.uploader.destroy(publicId);

    await prisma.image.delete({
      where: { id: params.imageId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting image:', error);
    return NextResponse.json({ error: 'Ștergerea imaginii a eșuat' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; imageId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Neautorizat' }, { status: 401 });
    }

    const body = await request.json();
    const { type, view, side, bodyArea, dateTaken, notes } = body;

    const updateData: Record<string, unknown> = {};

    if (type !== undefined) updateData.type = type;
    if (view !== undefined) updateData.view = view;
    else if (side !== undefined) updateData.view = side;
    if (bodyArea !== undefined) updateData.bodyArea = bodyArea || null;
    if (dateTaken !== undefined) updateData.dateTaken = new Date(dateTaken);
    if (notes !== undefined) updateData.notes = notes || null;

    const image = await prisma.image.update({
      where: {
        id: params.imageId,
        patientId: params.id,
      },
      data: updateData,
    });

    return NextResponse.json(image);
  } catch (error) {
    console.error('Error updating image:', error);
    return NextResponse.json({ error: 'Actualizarea imaginii a eșuat' }, { status: 500 });
  }
}
