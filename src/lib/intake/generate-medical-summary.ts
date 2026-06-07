import type { HealthFormData } from './health-defaults'
import { ALL_FORM1_TEXT_FIELDS, ALL_FORM1_YES_NO_QUESTIONS } from './form1-questionnaire'

export function generateMedicalSummary(formData: HealthFormData): string {
  const lines: string[] = []

  for (const q of ALL_FORM1_YES_NO_QUESTIONS) {
    const answer = formData[q.key]
    if (answer === 'yes') lines.push(q.label.replace(/\?$/, '') + ': Da')
    else if (answer === 'no') lines.push(q.label.replace(/\?$/, '') + ': Nu')
    else if (answer === 'na') lines.push(q.label.replace(/\?$/, '') + ': Nu este cazul')
  }

  for (const tf of ALL_FORM1_TEXT_FIELDS) {
    const value = formData[tf.key]?.trim()
    if (!value) continue
    if (tf.showWhen && formData[tf.showWhen.questionKey] !== tf.showWhen.answer) continue
    lines.push(`${tf.label}: ${value}`)
  }

  return lines.join('\n')
}
