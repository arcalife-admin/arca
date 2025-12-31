import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// DELETE - Remove video or image
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'video' or 'image'

    if (type === 'video') {
      // Delete video
      const video = await prisma.instructionVideo.findUnique({
        where: { id },
      });

      if (!video) {
        return NextResponse.json(
          { error: 'Video not found' },
          { status: 404 }
        );
      }

      // Only allow deletion of custom videos
      if (!video.isCustom) {
        return NextResponse.json(
          { error: 'Cannot delete predefined videos' },
          { status: 403 }
        );
      }

      await prisma.instructionVideo.delete({
        where: { id },
      });

      return NextResponse.json({ message: 'Video deleted successfully' });
    } else if (type === 'image') {
      // Delete image
      const image = await prisma.instructionImage.findUnique({
        where: { id },
      });

      if (!image) {
        return NextResponse.json(
          { error: 'Image not found' },
          { status: 404 }
        );
      }

      // Only allow deletion of custom images
      if (!image.isCustom) {
        return NextResponse.json(
          { error: 'Cannot delete predefined images' },
          { status: 403 }
        );
      }

      // Delete from Cloudinary if it's a custom image
      if (image.imageUrl.includes('cloudinary.com')) {
        try {
          // Extract public_id from Cloudinary URL
          const urlParts = image.imageUrl.split('/');
          const publicIdWithExtension = urlParts[urlParts.length - 1];
          const publicId = publicIdWithExtension.split('.')[0];
          const fullPublicId = `dentiva/${publicId}`;

          await cloudinary.uploader.destroy(fullPublicId);
        } catch (error) {
          console.error('Error deleting image from Cloudinary:', error);
          // Continue with database deletion even if Cloudinary deletion fails
        }
      }

      await prisma.instructionImage.delete({
        where: { id },
      });

      return NextResponse.json({ message: 'Image deleted successfully' });
    } else {
      return NextResponse.json(
        { error: 'Type parameter is required (video or image)' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error deleting instruction:', error);
    return NextResponse.json(
      { error: 'Failed to delete instruction' },
      { status: 500 }
    );
  }
} 