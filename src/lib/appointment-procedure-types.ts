import { AppointmentType } from '@/types/appointment';
import { treatmentTypes } from '@/data/treatmentTypes';

export interface SurgicalProcedureCodeRecord {
  id: string;
  code: string;
  description: string;
  price: number | null;
  category: string;
  duration?: number | null;
}

const CATEGORY_COLORS: Record<string, string> = {
  facial: '#E91E63',
  breast: '#9C27B0',
  body: '#FF9800',
  combo: '#673AB7',
  anesthesia: '#795548',
  'non-surgical': '#4CAF50',
  other: '#607D8B',
};

const DEFAULT_DURATION_MINUTES = 30;
const DEFAULT_COLOR = '#607D8B';

export function getColorForProcedureCategory(category: string): string {
  return CATEGORY_COLORS[category.toLowerCase()] ?? DEFAULT_COLOR;
}

export function procedureCodeToAppointmentType(code: SurgicalProcedureCodeRecord): AppointmentType {
  const duration = code.duration ?? DEFAULT_DURATION_MINUTES;

  return {
    id: code.id,
    name: code.description,
    duration,
    color: getColorForProcedureCategory(code.category),
    description: `${code.code} - ${code.description}`,
  };
}

export function procedureCodesToAppointmentTypes(
  codes: SurgicalProcedureCodeRecord[]
): AppointmentType[] {
  return codes.map(procedureCodeToAppointmentType);
}

export function resolveAppointmentType(
  storedType: unknown,
  procedureTypes: AppointmentType[]
): AppointmentType | undefined {
  if (!storedType) return undefined;

  if (typeof storedType === 'object' && storedType !== null && 'name' in storedType) {
    return storedType as AppointmentType;
  }

  const typeName = String(storedType);

  const fromProcedures =
    procedureTypes.find((type) => type.name === typeName) ??
    procedureTypes.find((type) => type.description === typeName) ??
    procedureTypes.find((type) => type.description?.startsWith(`${typeName} -`));

  if (fromProcedures) return fromProcedures;

  return treatmentTypes.find(
    (type) => type.name === typeName || type.id === typeName
  );
}
