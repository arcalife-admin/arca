import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { uploadImage } from '@/lib/cloudinary';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Function to convert YouTube URLs to embed format
function convertToEmbedUrl(url: string): string {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/watch\?.*v=([^&\n?#]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return `https://www.youtube.com/embed/${match[1]}`;
    }
  }

  // If already an embed URL, return as is
  if (url.includes('youtube.com/embed/')) {
    return url;
  }

  throw new Error('Invalid YouTube URL');
}

// GET - Fetch all videos and images
export async function GET() {
  try {
    const [videos, images] = await Promise.all([
      prisma.instructionVideo.findMany({
        orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
      }),
      prisma.instructionImage.findMany({
        orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
      }),
    ]);

    return NextResponse.json({ videos, images });
  } catch (error) {
    console.error('Error fetching instructions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch instructions' },
      { status: 500 }
    );
  }
}

// POST - Add new video or image
export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type');

    if (contentType?.includes('multipart/form-data')) {
      // Handle image upload
      const formData = await request.formData();
      const title = formData.get('title') as string;
      const file = formData.get('file') as File;
      const order = parseInt(formData.get('order') as string) || 0;

      if (!title || !file) {
        return NextResponse.json(
          { error: 'Title and file are required' },
          { status: 400 }
        );
      }

      // Upload image to Cloudinary
      const imageUrl = await uploadImage(file);

      // Save to database
      const image = await prisma.instructionImage.create({
        data: {
          title,
          imageUrl,
          order,
          isCustom: true,
        },
      });

      return NextResponse.json({ image });
    } else {
      // Handle video data
      const body = await request.json();
      const { title, url, order = 0 } = body;

      if (!title || !url) {
        return NextResponse.json(
          { error: 'Title and URL are required' },
          { status: 400 }
        );
      }

      // Convert YouTube URL to embed format
      const embedUrl = convertToEmbedUrl(url);

      // Save to database
      const video = await prisma.instructionVideo.create({
        data: {
          title,
          embedUrl,
          order,
          isCustom: true,
        },
      });

      return NextResponse.json({ video });
    }
  } catch (error) {
    console.error('Error adding instruction:', error);
    return NextResponse.json(
      { error: 'Failed to add instruction' },
      { status: 500 }
    );
  }
} 