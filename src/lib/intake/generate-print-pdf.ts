import { jsPDF } from 'jspdf'
import type { HealthFormData } from './health-defaults'
import { FORM1_QUESTIONNAIRE_SECTIONS } from './form1-questionnaire'

export function generateBasicInfoPdf(basic: Record<string, unknown>): Uint8Array {
  const doc = new jsPDF()
  doc.setFontSize(14)
  doc.text('Date pacient — Fișă nouă', 14, 20)
  doc.setFontSize(10)
  let y = 32
  const rows: [string, string][] = [
    ['Nume', [basic.firstName, basic.lastName].filter(Boolean).join(' ')],
    ['CNP', String(basic.cnp || '')],
    ['Data nașterii', String(basic.dateOfBirth || '')],
    ['Email', String(basic.email || '')],
    ['Telefon', String(basic.phone || '')],
    ['Adresă', String((basic.address as { display_name?: string })?.display_name || '')],
    ['Țară', String(basic.country || '')],
  ]
  const insurance = basic.healthInsurance as Record<string, string> | undefined
  if (insurance?.provider) {
    rows.push(['Asigurare', `${insurance.provider} — ${insurance.policyNumber || ''}`])
  }
  for (const [label, value] of rows) {
    if (!value) continue
    doc.text(`${label}: ${value}`, 14, y)
    y += 7
  }
  return doc.output('arraybuffer') as unknown as Uint8Array
}

export function generateHealthAssessmentPdf(health: HealthFormData): Uint8Array {
  const doc = new jsPDF()
  doc.setFontSize(14)
  doc.text('Chestionar medical inițial', 14, 20)
  doc.setFontSize(10)
  let y = 32

  for (const section of FORM1_QUESTIONNAIRE_SECTIONS) {
    if (y > 270) {
      doc.addPage()
      y = 20
    }
    if (section.title) {
      doc.setFont('helvetica', 'bold')
      doc.text(section.title, 14, y)
      y += 7
      doc.setFont('helvetica', 'normal')
    }

    for (const tf of section.textFields || []) {
      const value = health[tf.key]?.trim()
      if (!value) continue
      if (tf.showWhen && health[tf.showWhen.questionKey] !== tf.showWhen.answer) continue
      doc.text(`${tf.label}: ${value}`, 14, y)
      y += 6
    }

    for (const q of section.questions) {
      const answer = health[q.key]
      if (!answer) continue
      const label =
        answer === 'yes' ? 'Da' : answer === 'no' ? 'Nu' : answer === 'na' ? 'Nu este cazul' : ''
      if (!label) continue
      const line = doc.splitTextToSize(`• ${q.label} ${label}`, 180)
      doc.text(line, 14, y)
      y += line.length * 5 + 2
      if (y > 275) {
        doc.addPage()
        y = 20
      }
    }
    y += 4
  }

  return doc.output('arraybuffer') as unknown as Uint8Array
}
