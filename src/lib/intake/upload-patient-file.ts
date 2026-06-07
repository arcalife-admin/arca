import { v2 as cloudinary } from 'cloudinary'
import { prisma } from '@/lib/prisma'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

function getFileType(filename: string): 'XRAY' | 'DOCUMENT' | 'IMAGE' | 'OTHER' {
  const ext = filename.split('.').pop()?.toLowerCase()
  if (!ext) return 'OTHER'
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return 'IMAGE'
  if (['pdf', 'doc', 'docx', 'txt'].includes(ext)) return 'DOCUMENT'
  if (['dcm', 'dicom'].includes(ext)) return 'XRAY'
  return 'OTHER'
}

export async function uploadPatientFile(params: {
  patientId: string
  file: File | Buffer
  fileName: string
  mimeType?: string
}) {
  const buffer =
    params.file instanceof Buffer
      ? params.file
      : Buffer.from(await (params.file as File).arrayBuffer())

  const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      { folder: 'patient-files', resource_type: 'auto' },
      (error, res) => {
        if (error) reject(error)
        else resolve(res as { secure_url: string })
      }
    ).end(buffer)
  })

  return prisma.file.create({
    data: {
      name: params.fileName,
      url: result.secure_url,
      type: getFileType(params.fileName),
      size: buffer.length,
      patientId: params.patientId,
    },
  })
}
