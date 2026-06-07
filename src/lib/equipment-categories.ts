export const EQUIPMENT_CATEGORIES = [
  { value: 'SURGICAL_TABLE', label: 'Surgical Table' },
  { value: 'XRAY_MACHINE', label: 'X-Ray Machine' },
  { value: 'AUTOCLAVE', label: 'Autoclave' },
  { value: 'COMPRESSOR', label: 'Compressor' },
  { value: 'VACUUM_SYSTEM', label: 'Vacuum System' },
  { value: 'LIGHTING', label: 'Lighting' },
  { value: 'HVAC', label: 'HVAC' },
  { value: 'INSTRUMENTS', label: 'Instruments' },
  { value: 'COMPUTER_EQUIPMENT', label: 'Computer Equipment' },
  { value: 'PHONE_SYSTEM', label: 'Phone System' },
  { value: 'SECURITY_SYSTEM', label: 'Security System' },
  { value: 'OTHER', label: 'Other' },
] as const;

export const DEFAULT_EQUIPMENT_CATEGORY = 'SURGICAL_TABLE';

export const REPAIR_SPECIALTY_OPTIONS = [
  'Surgical Tables',
  'X-Ray Equipment',
  'Sterilization',
  'HVAC Systems',
  'Electrical',
  'Plumbing',
  'Computer/IT',
  'Phone Systems',
  'Security Systems',
  'General Maintenance',
];

export function getEquipmentCategoryLabel(value: string): string {
  const match = EQUIPMENT_CATEGORIES.find((category) => category.value === value);
  if (match) return match.label;
  // Legacy enum value from before plastic surgery migration
  if (value === 'DENTAL_CHAIR') return 'Surgical Table';
  return value.replace(/_/g, ' ');
}
