import { v2 as cloudinary } from 'cloudinary';
import { prisma } from '@/lib/prisma';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function uploadPatientImage(
  patientId: string,
  file: File,
  type: string,
  notes?: string | null
) {
  const buffer = Buffer.from(await file.arrayBuffer());

  const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'image',
        folder: `patient-images/${patientId}`,
      },
      (error, uploadResult) => {
        if (error) reject(error);
        else resolve(uploadResult as { secure_url: string });
      }
    );
    uploadStream.end(buffer);
  });

  return prisma.image.create({
    data: {
      url: result.secure_url,
      type: type as never,
      patientId,
      notes: notes || null,
      dateTaken: new Date(),
    },
  });
}
