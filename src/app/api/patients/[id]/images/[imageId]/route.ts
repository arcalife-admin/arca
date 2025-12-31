import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { prisma } from '@/lib/prisma';

// Configure Cloudinary
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
    // First get the image to get its URL
    const image = await prisma.image.findUnique({
      where: {
        id: params.imageId,
        patientId: params.id,
      },
    });

    if (!image) {
      return NextResponse.json(
        { error: 'Image not found' },
        { status: 404 }
      );
    }

    // Delete from Cloudinary
    // Extract public_id from the URL
    const publicId = image.url.split('/').slice(-1)[0].split('.')[0];
    await cloudinary.uploader.destroy(publicId);

    // Delete from database
    await prisma.image.delete({
      where: {
        id: params.imageId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting image:', error);
    return NextResponse.json(
      { error: 'Failed to delete image' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; imageId: string } }
) {
  try {
    const body = await request.json();
    const { type, side, dateTaken, toothNumber, notes } = body;

    // Build data object only with provided fields
    const updateData: any = {};

    if (type !== undefined) updateData.type = type;
    if (side !== undefined) updateData.side = side;
    if (dateTaken !== undefined) updateData.dateTaken = new Date(dateTaken);
    if (toothNumber !== undefined) updateData.toothNumber = toothNumber ? parseInt(toothNumber) : null;
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
    return NextResponse.json(
      { error: 'Failed to update image' },
      { status: 500 }
    );
  }
} 