import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import fs from 'fs'
import path from 'path'
import { PDFDocument } from 'pdf-lib'
import { authOptions } from '@/lib/auth-config'
import { INTAKE_DOCUMENT_LIST } from '@/lib/intake/documents'
import { generateBasicInfoPdf, generateHealthAssessmentPdf } from '@/lib/intake/generate-print-pdf'
import { createDefaultHealthFormData } from '@/lib/intake/health-defaults'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
    }

    const merged = await PDFDocument.create()

    const blankBasic = {
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      gender: '',
      cnp: '',
      country: 'Netherlands',
      email: '',
      phone: '',
      address: { display_name: '' },
    }

    const basicPdf = await PDFDocument.load(generateBasicInfoPdf(blankBasic))
    const healthPdf = await PDFDocument.load(
      generateHealthAssessmentPdf(createDefaultHealthFormData())
    )

    for (const src of [basicPdf, healthPdf]) {
      const pages = await merged.copyPages(src, src.getPageIndices())
      pages.forEach((p) => merged.addPage(p))
    }

    for (const doc of INTAKE_DOCUMENT_LIST) {
      if (!doc.filePath) continue
      const diskPath = path.join(process.cwd(), 'public', doc.filePath)
      if (!fs.existsSync(diskPath)) continue
      const bytes = fs.readFileSync(diskPath)
      const src = await PDFDocument.load(bytes)
      const pages = await merged.copyPages(src, src.getPageIndices())
      pages.forEach((p) => merged.addPage(p))
    }

    const pdfBytes = await merged.save()

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="intake-pack.pdf"',
      },
    })
  } catch (error) {
    console.error('Print bundle error:', error)
    return NextResponse.json({ message: 'Generarea pachetului de printare a eșuat' }, { status: 500 })
  }
}
