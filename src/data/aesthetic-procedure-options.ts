export type AestheticProcedureGroup =
  | 'breast'
  | 'face'
  | 'body'
  | 'intimate'
  | 'non-surgical'
  | 'minor'
  | 'combined'

export type AestheticProcedureOption = {
  key: string
  label: string
  group: AestheticProcedureGroup
  hasSize: boolean
}

export const AESTHETIC_PROCEDURE_OPTIONS: AestheticProcedureOption[] = [
  // Breast
  { key: 'implant', label: 'Implant', group: 'breast', hasSize: true },
  { key: 'implant_round', label: 'Implant cu formă rotundă', group: 'breast', hasSize: true },
  { key: 'implant_lift', label: 'Implant cu ridicare / reductie', group: 'breast', hasSize: true },

  // Face
  { key: 'rhinoplasty', label: 'Rinoplastie', group: 'face', hasSize: false },
  { key: 'blepharoplasty', label: 'Blefaroplastie', group: 'face', hasSize: false },
  { key: 'face_lift', label: 'Lifting facial', group: 'face', hasSize: false },

  // Body
  { key: 'liposuction', label: 'Lipoaspiratie', group: 'body', hasSize: false },
  { key: 'abdominoplasty', label: 'Abdominoplastie', group: 'body', hasSize: false },
  { key: 'lipectomy', label: 'Lipectomie', group: 'body', hasSize: false },
  { key: 'thigh_lift', label: 'Lifting coapse', group: 'body', hasSize: false },
  { key: 'arm_lift', label: 'Brahioplastie', group: 'body', hasSize: false },
  { key: 'chin_lipo', label: 'Lipo gusa', group: 'body', hasSize: false },

  // Intimate
  { key: 'labiaplasty', label: 'Labioplastie', group: 'intimate', hasSize: false },

  // Non-surgical
  { key: 'injection', label: 'Injectare', group: 'non-surgical', hasSize: false },

  // Minor
  { key: 'minor_surgery', label: 'Locala plastica (alunite, nevi..)', group: 'minor', hasSize: false },

  // Combined
  { key: 'implant_rhino', label: 'Implant + Rinoplastie', group: 'combined', hasSize: true },
  { key: 'implant_lipo', label: 'Implant + Lipoaspiratie', group: 'combined', hasSize: true },
  { key: 'rhino_lipo', label: 'Rinoplastie + Lipoaspiratie', group: 'combined', hasSize: false },
  { key: 'lipo_abdo', label: 'Lipo + Abdomino', group: 'combined', hasSize: false },
  { key: 'lipo_lipectomy', label: 'Lipo + Lipectomie', group: 'combined', hasSize: false },
  { key: 'lipo_lipofilling', label: 'Lipo + Lipofilling', group: 'combined', hasSize: false },
  { key: 'lipo_lipofilling_abdo', label: 'Lipo + Lipofilling + Abdomino', group: 'combined', hasSize: false },
  { key: 'lipo_lift', label: 'Lipo + Ridicare', group: 'combined', hasSize: false },
  { key: 'abdo_lift', label: 'Abdomino + Ridicare', group: 'combined', hasSize: false },
  { key: 'implant_lab', label: 'Implant + Labioplastie', group: 'combined', hasSize: true },
  { key: 'implant_bleph', label: 'Implant + Blefaroplastie', group: 'combined', hasSize: true },
  { key: 'rhino_bleph', label: 'Rinoplastie + Blefaroplastie', group: 'combined', hasSize: false },
  { key: 'rhino_lab', label: 'Rinoplastie + Labioplastie', group: 'combined', hasSize: false },
]

export const BREAST_SIZE_CC_OPTIONS = [
  '200', '225', '250', '275', '300', '325', '350', '375',
  '400', '425', '450', '475', '500', '550', '600+',
] as const

export const BREAST_SIZE_CUP_OPTIONS = [
  'A', 'B', 'C', 'D', 'DD', 'E', 'F', 'G+',
] as const

export const TIME_AGO_OPTIONS = [
  { value: 'lt_6_months', label: '< 6 luni' },
  { value: '6_12_months', label: '6–12 luni' },
  { value: '1_2_years', label: '1–2 ani' },
  { value: '2_5_years', label: '2–5 ani' },
  { value: '5_10_years', label: '5–10 ani' },
  { value: '10_plus_years', label: '10+ ani' },
  { value: 'unknown', label: 'Necunoscut' },
] as const

export function getProcedureOption(key: string): AestheticProcedureOption | undefined {
  return AESTHETIC_PROCEDURE_OPTIONS.find((p) => p.key === key)
}

export function procedureHasSize(key: string): boolean {
  return getProcedureOption(key)?.hasSize ?? false
}

export function formatSizeDisplay(sizeCc?: string, sizeCup?: string): string {
  const parts: string[] = []
  if (sizeCc) parts.push(`${sizeCc}cc`)
  if (sizeCup) parts.push(sizeCup)
  return parts.join(' / ')
}

export function formatTimeAgo(value?: string): string {
  if (!value) return ''
  return TIME_AGO_OPTIONS.find((o) => o.value === value)?.label ?? value
}
