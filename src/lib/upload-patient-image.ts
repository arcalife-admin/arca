import { prisma } from '@/lib/prisma';
import {
  getSignedPatientMediaUrl,
  uploadPatientMediaBuffer,
} from '@/lib/cloudinary-patient-media';

export async function uploadPatientImage(
  patientId: string,
  file: File,
  type: string,
  notes?: string | null
) {
  const buffer = Buffer.from(await file.arrayBuffer());

  const result = await uploadPatientMediaBuffer(buffer, {
    folder: `patient-images/${patientId}`,
    resource_type: 'image',
  });

  const image = await prisma.image.create({
    data: {
      url: result.public_id,
      type: type as never,
      patientId,
      notes: notes || null,
      dateTaken: new Date(),
    },
  });

  return {
    ...image,
    url: getSignedPatientMediaUrl(image.url),
  };
}
