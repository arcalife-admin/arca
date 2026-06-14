import { prisma } from '@/lib/prisma';
import {
  getSignedPatientMediaUrl,
  uploadPatientMediaBuffer,
} from '@/lib/cloudinary-patient-media';

function getFileType(filename: string): 'XRAY' | 'DOCUMENT' | 'IMAGE' | 'OTHER' {
  const ext = filename.split('.').pop()?.toLowerCase();
  if (!ext) return 'OTHER';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return 'IMAGE';
  if (['pdf', 'doc', 'docx', 'txt'].includes(ext)) return 'DOCUMENT';
  if (['dcm', 'dicom'].includes(ext)) return 'XRAY';
  return 'OTHER';
}

export async function uploadPatientFile(params: {
  patientId: string;
  file: File | Buffer;
  fileName: string;
  mimeType?: string;
}) {
  const buffer =
    params.file instanceof Buffer
      ? params.file
      : Buffer.from(await (params.file as File).arrayBuffer());

  const result = await uploadPatientMediaBuffer(buffer, {
    folder: 'patient-files',
    resource_type: 'auto',
  });

  const savedFile = await prisma.file.create({
    data: {
      name: params.fileName,
      url: result.public_id,
      type: getFileType(params.fileName),
      size: buffer.length,
      patientId: params.patientId,
    },
  });

  return {
    ...savedFile,
    url: getSignedPatientMediaUrl(savedFile.url, { fileName: savedFile.name }),
  };
}
