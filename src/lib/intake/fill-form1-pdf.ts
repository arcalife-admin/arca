import { PDFCheckBox, PDFDocument, PDFTextField } from 'pdf-lib'
import type { HealthFormData } from './health-defaults'
import { ALL_FORM1_TEXT_FIELDS, ALL_FORM1_YES_NO_QUESTIONS } from './form1-questionnaire'

function setCheckbox(form: ReturnType<PDFDocument['getForm']>, name: string, checked: boolean) {
  try {
    const cb = form.getCheckBox(name)
    if (checked) cb.check()
    else cb.uncheck()
  } catch {
    /* field may be missing */
  }
}

function setTextField(form: ReturnType<PDFDocument['getForm']>, name: string, value: string) {
  if (!value.trim()) return
  try {
    form.getTextField(name).setText(value)
  } catch {
    /* field may be missing */
  }
}

export function applyForm1AnswersToPdf(
  pdfDoc: PDFDocument,
  basic: Record<string, unknown>,
  health: HealthFormData
) {
  const form = pdfDoc.getForm()
  const address = (basic.address as { display_name?: string })?.display_name || ''

  const demographic: Record<string, string> = {
    'Text Box 1': [basic.firstName, basic.lastName].filter(Boolean).join(' ').trim(),
    'Text Box 2': String(basic.cnp || ''),
    'Text Box 3': String(basic.dateOfBirth || ''),
    'Text Box 4': String(basic.phone || ''),
    'Text Box 5': String(basic.email || ''),
    'Text Box 6': address,
    'Text Box 7': health.emergencyContact,
    'Text Box 8': health.emergencyPhone,
    'Text Box 9': health.referringDoctor,
    'Text Box 10': health.visitReason,
  }

  for (const [fieldName, value] of Object.entries(demographic)) {
    setTextField(form, fieldName, value)
  }

  for (const q of ALL_FORM1_YES_NO_QUESTIONS) {
    const answer = health[q.key]
    setCheckbox(form, q.pdfYes, answer === 'yes')
    setCheckbox(form, q.pdfNo, answer === 'no')
    if (q.pdfNa) setCheckbox(form, q.pdfNa, answer === 'na')
  }

  for (const tf of ALL_FORM1_TEXT_FIELDS) {
    const value = health[tf.key]
    if (tf.showWhen && health[tf.showWhen.questionKey] !== tf.showWhen.answer) continue
    setTextField(form, tf.pdfField, value)
  }
}
