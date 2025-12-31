import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Get all images for a patient
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const images = await prisma.image.findMany({
      where: {
        patientId: params.id
      },
      include: {
        calibration: true,
        annotations: true
      },
      orderBy: {
        dateTaken: 'desc'
      }
    });

    return NextResponse.json(images);
  } catch (error) {
    console.error('Error fetching images:', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

// Upload a new image
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string;
    const side = formData.get('side') as string | null;
    const toothNumber = formData.get('toothNumber') as string;
    const notes = formData.get('notes') as string;

    if (!file) {
      return new NextResponse('No file uploaded', { status: 400 });
    }

    // Convert File to buffer for Cloudinary upload
    const buffer = Buffer.from(await file.arrayBuffer());

    // Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'image',
          folder: `dental-images/${params.id}`,
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );

      // Write buffer to stream
      uploadStream.end(buffer);
    });

    const image = await prisma.image.create({
      data: {
        url: (result as any).secure_url,
        type: type as any, // Cast to ImageType enum
        side: side || null,
        toothNumber: toothNumber ? parseInt(toothNumber) : null,
        notes: notes || null,
        patientId: params.id,
        dateTaken: new Date()
      }
    });

    return NextResponse.json(image);
  } catch (error) {
    console.error('Error uploading image:', error);
    return new NextResponse(error instanceof Error ? error.message : 'Internal Error', { status: 500 });
  }
} 