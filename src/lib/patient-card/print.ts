export type PatientCardSection =
  | 'patientInfo'
  | 'historyTreatments'
  | 'currentTreatments'
  | 'planTreatments'
  | 'beforeAfterImages'

export interface PatientCardPatient {
  firstName: string
  lastName: string
  dateOfBirth: string
  gender: string
  email?: string
  phone?: string
  address: { display_name: string }
  cnp: string
  patientCode: string
}

export interface PatientCardProcedure {
  id: string
  date: string
  status: string
  bodyArea?: string | null
  code: {
    code: string
    description: string
  }
}

export interface PatientCardImage {
  id: string
  url: string
  createdAt?: string
  dateTaken?: string
  type: string
}

export interface PrintPatientCardInput {
  patient: PatientCardPatient
  procedures: PatientCardProcedure[]
  images: PatientCardImage[]
  includedSections: PatientCardSection[]
}

const IMAGES_PER_PAGE = 4

const PRINT_STYLES = `
  body {
    font-family: Arial, sans-serif;
    font-size: 14px;
    line-height: 1.4;
    color: #111827;
    margin: 0;
    padding: 24px;
    background: white;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  h2 {
    font-size: 18px;
    font-weight: 600;
    margin: 0 0 8px;
  }
  h3 {
    font-size: 16px;
    font-weight: 500;
    margin: 0 0 8px;
  }
  section, .section-block {
    margin-bottom: 16px;
  }
  .info-line {
    margin: 4px 0;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 12px;
  }
  th, td {
    border-bottom: 1px solid #d1d5db;
    padding: 4px;
    text-align: left;
  }
  th {
    font-weight: 600;
  }
  .capitalize {
    text-transform: capitalize;
  }
  .photo-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.75rem;
  }
  .photo-cell {
    border: 1px solid #d1d5db;
    padding: 0.5rem;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  .photo-cell img {
    max-width: 100%;
    max-height: 200px;
    width: auto;
    height: auto;
    object-fit: contain;
  }
  .photo-caption {
    font-size: 12px;
    margin-top: 4px;
    text-align: center;
  }
  @media print {
    @page {
      margin: 0;
      size: A4;
    }
    html, body {
      background: white !important;
      margin: 0 !important;
    }
    .print-content {
      padding: 12mm;
    }
    .page-break { page-break-after: always; }
    .photo-page-break { page-break-after: always; }
    .photo-cell {
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .photo-cell img {
      max-width: 85mm;
      max-height: 105mm;
    }
  }
`


function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function chunkImages<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size))
  }
  return chunks
}

function buildTreatmentTable(procedures: PatientCardProcedure[]): string {
  if (procedures.length === 0) return ''

  const rows = procedures
    .map(
      (p) => `<tr>
        <td>${escapeHtml(new Date(p.date).toLocaleDateString())}</td>
        <td>${escapeHtml(p.code.code)}</td>
        <td>${escapeHtml(p.code.description)}</td>
        <td class="capitalize">${escapeHtml(p.bodyArea || '—')}</td>
      </tr>`
    )
    .join('')

  return `<table>
    <thead>
      <tr>
        <th>Date</th>
        <th>Code</th>
        <th>Description</th>
        <th>Area</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>`
}

function buildPhotoSection(title: string, images: PatientCardImage[]): string {
  if (images.length === 0) return ''

  const pages = chunkImages(images, IMAGES_PER_PAGE)

  return pages
    .map((pageImages, pageIndex) => {
      const pageBreakClass = pageIndex < pages.length - 1 ? 'photo-page-break' : ''
      const pageTitle =
        pages.length > 1 ? `${title} (${pageIndex + 1}/${pages.length})` : title
      const cells = pageImages
        .map((img) => {
          const dateLabel = new Date(img.dateTaken || img.createdAt || '').toLocaleDateString()
          return `<div class="photo-cell">
            <img src="${escapeHtml(img.url)}" alt="${escapeHtml(title)}" />
            <p class="photo-caption">${escapeHtml(dateLabel)}</p>
          </div>`
        })
        .join('')

      return `<div class="${pageBreakClass}">
        <h3>${escapeHtml(pageTitle)}</h3>
        <div class="photo-grid">${cells}</div>
      </div>`
    })
    .join('')
}

export function buildPatientCardPrintDocument(input: PrintPatientCardInput): string {
  const { patient, procedures, images, includedSections } = input
  const sections: string[] = []

  const historyProcedures = procedures.filter((p) => p.status === 'COMPLETED')
  const currentProcedures = procedures.filter((p) => p.status === 'IN_PROGRESS')
  const planProcedures = procedures.filter((p) => p.status === 'PENDING')

  const sortedImages = [...images].sort((a, b) => {
    const dateA = new Date(a.dateTaken || a.createdAt || 0).getTime()
    const dateB = new Date(b.dateTaken || b.createdAt || 0).getTime()
    return dateB - dateA
  })
  const beforeImages = sortedImages.filter((img) => img.type === 'BEFORE_PHOTO')
  const afterImages = sortedImages.filter((img) => img.type === 'AFTER_PHOTO')

  if (includedSections.includes('patientInfo')) {
    sections.push(`<section class="page-break">
      <h2>Patient Information</h2>
      <div class="info-line"><strong>Name: </strong>${escapeHtml(`${patient.firstName} ${patient.lastName}`)}</div>
      <div class="info-line"><strong>Patient code: </strong>${escapeHtml(patient.patientCode)}</div>
      <div class="info-line"><strong>CNP: </strong>${escapeHtml(patient.cnp)}</div>
      <div class="info-line"><strong>DOB: </strong>${escapeHtml(new Date(patient.dateOfBirth).toLocaleDateString())}</div>
      <div class="info-line"><strong>Gender: </strong>${escapeHtml(patient.gender)}</div>
      ${patient.email ? `<div class="info-line"><strong>Email: </strong>${escapeHtml(patient.email)}</div>` : ''}
      ${patient.phone ? `<div class="info-line"><strong>Phone: </strong>${escapeHtml(patient.phone)}</div>` : ''}
      <div class="info-line"><strong>Address: </strong>${escapeHtml(patient.address.display_name)}</div>
    </section>`)
  }

  if (includedSections.includes('historyTreatments') && historyProcedures.length > 0) {
    sections.push(`<div class="section-block page-break">
      <h2>Treatment History</h2>
      ${buildTreatmentTable(historyProcedures)}
    </div>`)
  }

  if (includedSections.includes('currentTreatments') && currentProcedures.length > 0) {
    sections.push(`<div class="section-block page-break">
      <h2>Current Treatments</h2>
      ${buildTreatmentTable(currentProcedures)}
    </div>`)
  }

  if (includedSections.includes('planTreatments') && planProcedures.length > 0) {
    sections.push(`<div class="section-block page-break">
      <h2>Treatment Plan</h2>
      ${buildTreatmentTable(planProcedures)}
    </div>`)
  }

  if (
    includedSections.includes('beforeAfterImages') &&
    (beforeImages.length > 0 || afterImages.length > 0)
  ) {
    const beforeSection = buildPhotoSection('Before', beforeImages)
    const afterSection = buildPhotoSection('After', afterImages)
    const pageBreak =
      beforeImages.length > 0 && afterImages.length > 0
        ? '<div class="photo-page-break" aria-hidden="true"></div>'
        : ''

    sections.push(`<div class="section-block page-break">
      <h2>Before &amp; After Photos</h2>
      ${beforeSection}
      ${pageBreak}
      ${afterSection}
    </div>`)
  }

  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Patient Card – ${escapeHtml(`${patient.firstName} ${patient.lastName}`)}</title>
    <style>${PRINT_STYLES}</style>
  </head>
  <body>
    <div class="print-content">${sections.join('')}</div>
  </body>
</html>`
}

export function printPatientCard(input: PrintPatientCardInput) {
  const html = buildPatientCardPrintDocument(input)
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const blobUrl = URL.createObjectURL(blob)

  const iframe = document.createElement('iframe')
  iframe.setAttribute('aria-hidden', 'true')
  iframe.style.cssText = 'position:fixed;width:0;height:0;border:0;visibility:hidden;'
  iframe.src = blobUrl
  document.body.appendChild(iframe)

  const cleanup = () => {
    URL.revokeObjectURL(blobUrl)
    iframe.remove()
  }

  iframe.onload = () => {
    const printWindow = iframe.contentWindow
    const printDocument = iframe.contentDocument
    if (!printWindow || !printDocument) {
      cleanup()
      return
    }

    const triggerPrint = () => {
      printWindow.focus()
      printWindow.print()
    }

    printWindow.addEventListener('afterprint', cleanup, { once: true })

    const images = Array.from(printDocument.images)
    const hasImages = images.length > 0

    if (!hasImages) {
      setTimeout(triggerPrint, 150)
      setTimeout(cleanup, 60_000)
      return
    }

    const waitForImages = () =>
      Promise.all(
        images.map(
          (img) =>
            new Promise<void>((resolve) => {
              if (img.complete) {
                resolve()
                return
              }
              img.addEventListener('load', () => resolve(), { once: true })
              img.addEventListener('error', () => resolve(), { once: true })
            })
        )
      )

    waitForImages().then(() => {
      setTimeout(triggerPrint, 150)
      setTimeout(cleanup, 60_000)
    })
  }
}

export function printOptionsToSections(options: {
  includePatientInfo: boolean
  includeHistoryTreatments: boolean
  includeCurrentTreatments: boolean
  includePlanTreatments: boolean
  includeBeforeAfterImages: boolean
}): PatientCardSection[] {
  const sectionMap: Record<keyof typeof options, PatientCardSection> = {
    includePatientInfo: 'patientInfo',
    includeHistoryTreatments: 'historyTreatments',
    includeCurrentTreatments: 'currentTreatments',
    includePlanTreatments: 'planTreatments',
    includeBeforeAfterImages: 'beforeAfterImages',
  }

  return (Object.entries(options) as [keyof typeof options, boolean][])
    .filter(([, included]) => included)
    .map(([key]) => sectionMap[key])
}
