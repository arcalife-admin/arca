/**
 * Lists AcroForm field names per intake PDF → data/intake-pdf-fields.json
 * Run: node scripts/extract-pdf-fields.cjs
 */
const { PDFDocument } = require('pdf-lib')
const fs = require('fs')
const path = require('path')

const docs = [
  ['form1', 'FIȘĂ PACIENT NOU – CHESTIONAR MEDICAL INIȚIAL.pdf'],
  ['form2', 'ACORD PRIVIND PRELUCRAREA DATELOR CU CARACTER PERSONAL.pdf'],
  ['form3', 'DECLARAȚIE PRIVIND CONFIDENȚIALITATEA.pdf'],
  ['form4', 'CONSIMȚĂMÂNT INFORMAT PENTRU INTERVENȚIE MEDICALĂ.pdf'],
  [
    'form5',
    'CONSIMȚĂMÂNT PRIVIND IMAGINILE MEDICALE, UTILIZAREA DATELOR ÎN ACTUL MEDICAL ȘI COMUNICAREA REZULTATELOR.pdf',
  ],
  ['form6', 'ACT ADIȚIONAL PRIVIND RISCURILE SPECIALE.pdf'],
]

async function main() {
  const out = {}
  for (const [id, file] of docs) {
    const fp = path.join(process.cwd(), 'public', 'documents', file)
    if (!fs.existsSync(fp)) {
      console.warn(id, 'MISSING', fp)
      out[id] = []
      continue
    }
    const pdf = await PDFDocument.load(fs.readFileSync(fp))
    out[id] = pdf.getForm().getFields().map((f) => f.getName())
    console.log(`${id}: ${out[id].length} fields`)
  }
  const target = path.join(process.cwd(), 'data', 'intake-pdf-fields.json')
  fs.writeFileSync(target, JSON.stringify(out, null, 2))
  console.log('Wrote', target)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
