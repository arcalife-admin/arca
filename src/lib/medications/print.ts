import { printHtmlDocument } from '@/lib/print-html'

export interface PrintableMedication {
  name: string
  activeIngredient?: string | null
  usageInstructions?: string | null
  prescriptionTemplate?: string | null
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function formatContent(text: string): string {
  return text
    .split('\n')
    .map((line) => {
      const escaped = escapeHtml(line)
      const trimmed = line.trim()
      if (trimmed.endsWith(':') && trimmed.length < 50) {
        return `<span class="section-label">${escaped}</span>`
      }
      return escaped
    })
    .join('<br>')
}

const PRINT_STYLES = `
  @page {
    size: A4;
    margin: 0;
  }
  html, body {
    height: 100%;
  }
  body {
    font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    font-size: 15px;
    line-height: 1.75;
    color: #111827;
    margin: 0;
    padding: 2.5cm 2cm;
    box-sizing: border-box;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  h1 {
    font-size: 28px;
    font-weight: 700;
    margin: 0 0 16px;
    line-height: 1.25;
  }
  .meta {
    color: #4b5563;
    font-size: 14px;
    margin-bottom: 28px;
    line-height: 1.6;
  }
  .meta strong {
    font-size: 16px;
    color: #111827;
  }
  .content {
    font-size: 15px;
    line-height: 1.8;
  }
  .section-label {
    display: inline-block;
    font-size: 17px;
    font-weight: 700;
    margin-top: 18px;
    color: #111827;
  }
  .section-label:first-child {
    margin-top: 0;
  }
`

function buildPrintDocument(title: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(title)}</title>
    <style>${PRINT_STYLES}</style>
  </head>
  <body>${bodyHtml}</body>
</html>`
}

function printHtml(title: string, bodyHtml: string) {
  printHtmlDocument(buildPrintDocument(title, bodyHtml))
}

export function printMedicationInstructions(medication: PrintableMedication) {
  const content = medication.usageInstructions || 'Instrucțiuni indisponibile pentru acest medicament.'
  printHtml(
    `Instrucțiuni – ${medication.name}`,
    `<h1>Instrucțiuni de utilizare</h1>
     <div class="meta">
       <strong>${escapeHtml(medication.name)}</strong>
       ${medication.activeIngredient ? ` · ${escapeHtml(medication.activeIngredient)}` : ''}
       <br />Generat: ${new Date().toLocaleString('ro-RO')}
     </div>
     <div class="content">${formatContent(content)}</div>`
  )
}

export function printMedicationPrescription(medication: PrintableMedication) {
  const content =
    medication.prescriptionTemplate ||
    `REȚETĂ MEDICALĂ\n\nRp/ ${medication.name}\n\nDoza: conform indicației medicului.\n\nSemnătura medicului: _________________________`

  printHtml(
    `Rețetă – ${medication.name}`,
    `<h1>Rețetă medicală</h1>
     <div class="meta">
       <strong>${escapeHtml(medication.name)}</strong>
       ${medication.activeIngredient ? ` · ${escapeHtml(medication.activeIngredient)}` : ''}
     </div>
     <div class="content">${formatContent(content)}</div>`
  )
}
