import fs from 'fs'
import path from 'path'
import { PDFCheckBox, PDFDocument, PDFTextField } from 'pdf-lib'
import { INTAKE_DOCUMENTS } from './documents'
import type { DocumentFieldDef } from './document-fields'
import { ALL_DOCUMENT_FIELD_REGISTRY } from './document-fields'
import type { HealthFormData } from './health-defaults'
import { applyForm1AnswersToPdf } from './fill-form1-pdf'

function normalizeKey(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
}

function valueForPdfField(
  field: DocumentFieldDef,
  documentFields: Record<string, string | boolean>,
  basic: Record<string, unknown>
): string | boolean | undefined {
  const direct = documentFields[field.id]
  if (direct !== undefined && direct !== '') return direct

  if (field.id.includes('patientName')) {
    const name = [basic.firstName, basic.lastName].filter(Boolean).join(' ')
    if (name) return name
  }
  if (field.id.includes('cnp') && basic.cnp) return String(basic.cnp)

  return undefined
}

export async function fillIntakePdf(params: {
  documentId: string
  basic: Record<string, unknown>
  health?: HealthFormData
  documentFields: Record<string, string | boolean>
  signatureDataUrl?: string | null
}): Promise<Uint8Array | null> {
  const doc = INTAKE_DOCUMENTS[params.documentId]
  if (!doc?.filePath) return null

  const diskPath = path.join(process.cwd(), 'public', doc.filePath)
  const pdfBytes = fs.readFileSync(diskPath)
  const pdfDoc = await PDFDocument.load(pdfBytes)
  const form = pdfDoc.getForm()
  const fields = form.getFields()
  if (params.documentId === 'form1' && params.health) {
    applyForm1AnswersToPdf(pdfDoc, params.basic, params.health)
  }

  const registryFields = ALL_DOCUMENT_FIELD_REGISTRY.filter((f) => f.documentId === params.documentId)

  for (const reg of registryFields) {
    const val = valueForPdfField(reg, params.documentFields, params.basic)
    if (val === undefined) continue

    const names = reg.pdfFieldNames || [reg.id]
    for (const pdfName of names) {
      try {
        if (typeof val === 'boolean') {
          const cb = form.getCheckBox(pdfName)
          if (val) cb.check()
          else cb.uncheck()
        } else {
          form.getTextField(pdfName).setText(String(val))
        }
      } catch {
        // try matching by normalized name
        for (const f of fields) {
          if (normalizeKey(f.getName()) !== normalizeKey(pdfName)) continue
          try {
            if (typeof val === 'boolean' && f instanceof PDFCheckBox) {
              if (val) f.check()
              else f.uncheck()
            } else if (f instanceof PDFTextField) {
              f.setText(String(val))
            }
          } catch {
            /* skip */
          }
        }
      }
    }
  }

  // Also map common patient fields onto any matching PDF field names
  const commonMap: Record<string, string> = {
    prenume: String(params.basic.firstName || ''),
    nume: String(params.basic.lastName || ''),
    cnp: String(params.basic.cnp || ''),
    email: String(params.basic.email || ''),
    telefon: String(params.basic.phone || ''),
    adresa: String((params.basic.address as { display_name?: string })?.display_name || ''),
  }

  for (const f of fields) {
    const key = normalizeKey(f.getName())
    const mapped = Object.entries(commonMap).find(([k]) => normalizeKey(k) === key)
    if (!mapped?.[1]) continue
    try {
      if (f instanceof PDFTextField) f.setText(mapped[1])
    } catch {
      /* skip */
    }
  }

  if (params.signatureDataUrl?.startsWith('data:image')) {
    try {
      const base64 = params.signatureDataUrl.split(',')[1]
      const imageBytes = Buffer.from(base64, 'base64')
      const png = await pdfDoc.embedPng(imageBytes)
      const pages = pdfDoc.getPages()
      const lastPage = pages[pages.length - 1]
      const { width } = lastPage.getSize()
      lastPage.drawImage(png, {
        x: width - 220,
        y: 40,
        width: 180,
        height: 60,
      })
    } catch {
      /* signature embed optional */
    }
  }

  try {
    form.flatten()
  } catch {
    /* some PDFs may not flatten */
  }

  return pdfDoc.save()
}
