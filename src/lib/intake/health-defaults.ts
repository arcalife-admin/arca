import type { Form1TextKey, Form1YesNoKey, YesNoValue } from './form1-questionnaire'
import { ALL_FORM1_TEXT_FIELDS, ALL_FORM1_YES_NO_QUESTIONS } from './form1-questionnaire'

export type HealthFormData = {
  [K in Form1YesNoKey]: YesNoValue
} & {
  [K in Form1TextKey]: string
}

export function createDefaultHealthFormData(): HealthFormData {
  const yesNoDefaults = Object.fromEntries(
    ALL_FORM1_YES_NO_QUESTIONS.map((q) => [q.key, ''])
  ) as Record<Form1YesNoKey, YesNoValue>

  const textDefaults = Object.fromEntries(
    ALL_FORM1_TEXT_FIELDS.map((f) => [f.key, ''])
  ) as Record<Form1TextKey, string>

  return { ...yesNoDefaults, ...textDefaults } as HealthFormData
}
