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

// Model ID and version hash
const MODEL = "adirik/grounding-dino"
const VERSION = "efd10a8ddc57ea28773327e881ce95e20cc1d734c589f7dd01d2036921ed78aa"

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

    // Convert file to blob URL
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64Image = buffer.toString('base64')
    const dataUrl = `data:${file.type};base64,${base64Image}`

    // Prepare input object with detailed radiographic descriptions
    const input = {
      image: dataUrl,
      query: "relatively small radiolucent area in tooth crown, dark spot between teeth indicating decay, clear dark area within tooth structure, radiolucent lesion extending into dentin, proximal radiolucency between teeth, dark spot between teeth indicating decay, clear dark area within tooth structure, radiolucent lesion extending into dentin, proximal radiolucency between teeth",
      box_threshold: 0.15,  // Slightly higher threshold for more confident detections
      text_threshold: 0.15
    }

    // Call Replicate API exactly like the example
    const output = await replicateClient.run(
      "adirik/grounding-dino:efd10a8ddc57ea28773327e881ce95e20cc1d734c589f7dd01d2036921ed78aa",
      { input }
    ) as {
      detections: Array<{
        bbox: number[];
        label: string;
        confidence: number;
      }>;
      result_image?: string;
    }

    // Process detections and add more specific labels based on location/confidence
    const processedDetections = output.detections.map(detection => {
      // Determine more specific label based on location and confidence
      let label = 'Potential Cavity'
      if (detection.confidence > 0.5) {
        label = 'Likely Cavity'
      }
      if (detection.confidence > 0.7) {
        label = 'High Confidence Cavity'
      }

      return {
        box: detection.bbox,
        label: label,
        score: detection.confidence
      }
    })

    return NextResponse.json({
      detections: processedDetections,
      result_image: output.result_image
    })
  } catch (error) {
    console.error('AI Detection error:', error)
    const errorMessage = error instanceof Error ? error.message : 'AI Detection failed'
    return new NextResponse(errorMessage, { status: 500 })
  }
} 