export type FieldSection = 'basic' | 'health' | 'form2' | 'form3' | 'form4' | 'form5' | 'form6'

export const BASIC_FIELD_KEYS = [
  'firstName',
  'lastName',
  'dateOfBirth',
  'gender',
  'email',
  'phone',
  'address',
  'cnp',
  'country',
  'healthInsurance',
] as const

export { FORM1_QUESTIONNAIRE_SECTIONS as HEALTH_SECTIONS } from './form1-questionnaire'
export type { Form1Section as HealthSectionDef } from './form1-questionnaire'

export const DEFAULT_COUNTRY = 'Netherlands'
