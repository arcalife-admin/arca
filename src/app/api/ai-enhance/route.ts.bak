import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

// Lazy import Replicate to avoid build issues
let Replicate: any
let replicate: any

// Initialize Replicate only when needed
async function getReplicateClient() {
  if (!replicate) {
    if (!process.env.REPLICATE_API_TOKEN) {
      throw new Error('REPLICATE_API_TOKEN environment variable is not set')
    }

    try {
      Replicate = (await import('replicate')).default
      replicate = new Replicate({
        auth: process.env.REPLICATE_API_TOKEN,
      })
    } catch (error) {
      console.error('Failed to initialize Replicate client:', error)
      throw new Error('Failed to initialize AI service')
    }
  }
  return replicate
}

export async function POST(req: Request) {
  try {
    // Check authentication
    const session = await auth()
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // Initialize Replicate client
    const replicateClient = await getReplicateClient()

    // Get the image file from form data
    const formData = await req.formData()
    const file = formData.get('image') as File
    if (!file) {
      return new NextResponse('No image provided', { status: 400 })
    }

    // Convert file to base64
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64Image = buffer.toString('base64')

    // Call Replicate API for image enhancement using Real-ESRGAN
    const output = await replicateClient.run(
      "nightmareai/real-esrgan:42fed1c4974146d4d2414e2be2c5277c7fcf05fcc3a73abf41610695738c1d7b",
      {
        input: {
          image: `data:image/jpeg;base64,${base64Image}`,
          scale: 2, // Upscale by 2x
          face_enhance: true // Enable face enhancement for better results
        }
      }
    )

    // Cast output to string through unknown
    const imageUrl = output as unknown as string

    // Fetch the enhanced image
    const response = await fetch(imageUrl)
    const enhancedImageBlob = await response.blob()

    return new NextResponse(enhancedImageBlob, {
      headers: {
        'Content-Type': 'image/png'
      }
    })
  } catch (error) {
    console.error('Error in AI enhancement:', error)
    const errorMessage = error instanceof Error ? error.message : 'AI enhancement failed'
    return new NextResponse(errorMessage, { status: 500 })
  }
} 