export interface PatientLabelData {
  firstName: string
  lastName: string
  patientCode: string
  dateOfBirth: string
  address: string
  phone?: string
  email?: string
}

const LABEL_WIDTH = '2.25in'
const LABEL_HEIGHT = '1in'

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('ro-RO', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

function cleanAddress(address: string): string {
  const parts = address.split(', ')
  const seen = new Set<string>()
  const cleaned = parts.filter((part) => {
    const lowerPart = part.toLowerCase()
    if (seen.has(lowerPart)) return false
    seen.add(lowerPart)
    return true
  })

  const postcodePattern = /^\d{4}\s?[A-Z]{2}$/
  const addressParts: string[] = []
  let postcode = ''

  for (const part of cleaned) {
    if (postcodePattern.test(part.trim())) {
      postcode = part.trim()
    } else {
      addressParts.push(part)
    }
  }

  if (postcode) {
    return `${addressParts.join(', ')} ${postcode}`
  }

  return cleaned.join(', ')
}

const PRINT_STYLES = `
  @page {
    size: ${LABEL_WIDTH} ${LABEL_HEIGHT};
    margin: 0;
  }
  html, body {
    width: ${LABEL_WIDTH};
    height: ${LABEL_HEIGHT};
    max-width: ${LABEL_WIDTH};
    max-height: ${LABEL_HEIGHT};
    margin: 0;
    padding: 0;
    overflow: hidden;
  }
  body {
    font-family: Arial, sans-serif;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .label-container {
    display: flex;
    flex-direction: column;
    width: ${LABEL_WIDTH};
    height: ${LABEL_HEIGHT};
    max-height: ${LABEL_HEIGHT};
    padding: 2px 3px;
    box-sizing: border-box;
    gap: 0;
    font-size: 9px;
    line-height: 1.08;
    overflow: hidden;
  }
  .patient-name {
    font-weight: bold;
    font-size: 10px;
    line-height: 1.1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    flex-shrink: 0;
  }
  .info-row {
    flex-shrink: 0;
    overflow: hidden;
  }
  .dob {
    font-weight: bold;
  }
  .address {
    word-break: break-word;
    overflow: hidden;
  }
  .contact-info {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  @media print {
    html, body {
      width: ${LABEL_WIDTH};
      height: ${LABEL_HEIGHT};
    }
  }
`

const FIT_SCRIPT = `
  (function fitLabel() {
    var container = document.querySelector('.label-container');
    var body = document.body;
    if (!container || !body) return;

    var fontSize = 10;
    container.style.fontSize = fontSize + 'px';
    while (container.scrollHeight > body.clientHeight && fontSize > 6) {
      fontSize -= 0.5;
      container.style.fontSize = fontSize + 'px';
    }
  })();
`

function buildPrintDocument(patient: PatientLabelData): string {
  const name = escapeHtml(`${patient.firstName} ${patient.lastName} (${patient.patientCode})`)
  const dob = escapeHtml(formatDate(patient.dateOfBirth))
  const address = escapeHtml(cleanAddress(patient.address))
  const phone = patient.phone ? `<div class="info-row contact-info">${escapeHtml(patient.phone)}</div>` : ''
  const email = patient.email ? `<div class="info-row contact-info">${escapeHtml(patient.email)}</div>` : ''

  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Patient Label</title>
    <style>${PRINT_STYLES}</style>
  </head>
  <body>
    <div class="label-container">
      <div class="patient-name">${name}</div>
      <div class="info-row dob">${dob}</div>
      <div class="info-row address">${address}</div>
      ${phone}
      ${email}
    </div>
    <script>${FIT_SCRIPT}<\/script>
  </body>
</html>`
}

export function printPatientLabel(patient: PatientLabelData) {
  const html = buildPrintDocument(patient)
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
    if (!printWindow) {
      cleanup()
      return
    }

    printWindow.addEventListener('afterprint', cleanup, { once: true })
    setTimeout(() => {
      printWindow.focus()
      printWindow.print()
      setTimeout(cleanup, 60_000)
    }, 150)
  }
}
