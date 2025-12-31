import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { prisma } from '@/lib/prisma'
import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    if (!file) {
      return new NextResponse('No file provided', { status: 400 })
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'patient-files',
        },
        (error, result) => {
          if (error) reject(error)
          resolve(result)
        }
      )

      uploadStream.end(buffer)
    })

    // Save file info to database
    const savedFile = await prisma.file.create({
      data: {
        name: file.name,
        url: (result as any).secure_url,
        type: getFileType(file.name),
        size: file.size,
        patientId: params.id,
      },
    })

    return NextResponse.json(savedFile)
  } catch (error) {
    console.error('Error uploading file:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

function getFileType(filename: string): 'XRAY' | 'DOCUMENT' | 'IMAGE' | 'OTHER' {
  const ext = filename.split('.').pop()?.toLowerCase()
  if (!ext) return 'OTHER'

  if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) {
    return 'IMAGE'
  }
  if (['pdf', 'doc', 'docx', 'txt'].includes(ext)) {
    return 'DOCUMENT'
  }
  if (['dcm', 'dicom'].includes(ext)) {
    return 'XRAY'
  }
  return 'OTHER'
} 