/**
 * Dev script: lists AcroForm field names per intake PDF.
 * Run: npx tsx scripts/extract-pdf-fields.ts
 */
import { PDFDocument } from 'pdf-lib'
import fs from 'fs'
import path from 'path'
import { INTAKE_DOCUMENT_LIST } from '../src/lib/intake/documents'

async function main() {
  for (const doc of INTAKE_DOCUMENT_LIST) {
    if (!doc.filePath) continue
    const fp = path.join(process.cwd(), 'public', doc.filePath)
    if (!fs.existsSync(fp)) {
      console.log(doc.id, 'MISSING', fp)
      continue
    }
    const bytes = fs.readFileSync(fp)
    const pdf = await PDFDocument.load(bytes)
    const names = pdf.getForm().getFields().map((f) => f.getName())
    console.log(`\n--- ${doc.id} (${names.length} fields) ---`)
    console.log(names.join('\n'))
  }
}

main().catch(console.error)
