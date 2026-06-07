export type AppointmentStatusType =
  | 'default'
  | 'waiting_room'
  | 'being_prepped'
  | 'in_operation_room'
  | 'post_operation'
  | 'finished'
  | 'no_show'
  | 'called_off'
  | 'running_late'
  | 'important';

export interface AppointmentStatusMetadata {
  type: AppointmentStatusType;
  minutesLate?: number; // For 'running_late' status
  importantNote?: string; // For 'important' status
  timestamp?: Date; // When status was set
}

export interface AppointmentStatusConfig {
  type: AppointmentStatusType;
  label: string;
  icon: string;
  color: string;
  description: string;
  requiresInput: boolean;
  inputType?: 'minutes' | 'note';
}

/** Maps legacy dental status keys stored in the database to the new surgical equivalents. */
const LEGACY_STATUS_ALIASES: Record<string, AppointmentStatusType> = {
  brushing_teeth: 'being_prepped',
  being_treated: 'in_operation_room',
};

export function normalizeStatusType(type: string | undefined): AppointmentStatusType {
  if (!type) return 'default';
  if (type in LEGACY_STATUS_ALIASES) return LEGACY_STATUS_ALIASES[type];
  if (type in APPOINTMENT_STATUS_CONFIGS) return type as AppointmentStatusType;
  return 'default';
}

export const APPOINTMENT_STATUS_CONFIGS: Record<AppointmentStatusType, AppointmentStatusConfig> = {
  default: {
    type: 'default',
    label: 'Implicit',
    icon: '',
    color: '#6b7280',
    description: 'Niciun status setat',
    requiresInput: false
  },
  waiting_room: {
    type: 'waiting_room',
    label: 'În sala de așteptare',
    icon: '🪑',
    color: '#3b82f6',
    description: 'Pacientul așteaptă în sala de așteptare',
    requiresInput: false
  },
  being_prepped: {
    type: 'being_prepped',
    label: 'Se pregătește',
    icon: '🩺',
    color: '#8b5cf6',
    description: 'Pacientul este pregătit pentru intervenție',
    requiresInput: false
  },
  in_operation_room: {
    type: 'in_operation_room',
    label: 'În sala de operație',
    icon: '🏥',
    color: '#10b981',
    description: 'Pacientul este în sala de operație',
    requiresInput: false
  },
  post_operation: {
    type: 'post_operation',
    label: 'În sala post-operatorie',
    icon: '🛏️',
    color: '#06b6d4',
    description: 'Pacientul este în sala de recuperare post-operatorie',
    requiresInput: false
  },
  finished: {
    type: 'finished',
    label: 'Finalizat',
    icon: '✅',
    color: '#059669',
    description: 'Procedura este finalizată',
    requiresInput: false
  },
  no_show: {
    type: 'no_show',
    label: 'Nu s-a prezentat',
    icon: '❌',
    color: '#dc2626',
    description: 'Pacientul nu s-a prezentat la programare',
    requiresInput: false
  },
  called_off: {
    type: 'called_off',
    label: 'Anulat',
    icon: '📞',
    color: '#f59e0b',
    description: 'Programarea a fost anulată',
    requiresInput: false
  },
  running_late: {
    type: 'running_late',
    label: 'Întârzie',
    icon: '⏰',
    color: '#f97316',
    description: 'Pacientul întârzie',
    requiresInput: true,
    inputType: 'minutes'
  },
  important: {
    type: 'important',
    label: 'Important',
    icon: '⚠️',
    color: '#dc2626',
    description: 'Notă sau alertă importantă',
    requiresInput: true,
    inputType: 'note'
  }
};

export const getStatusConfig = (status: AppointmentStatusType | string): AppointmentStatusConfig => {
  return APPOINTMENT_STATUS_CONFIGS[normalizeStatusType(status)];
};

export const getStatusDisplay = (status: AppointmentStatusMetadata | null): string => {
  if (!status || status.type === 'default') return '';

  const config = getStatusConfig(status.type);
  let display = config.icon;

  if (normalizeStatusType(status.type) === 'running_late' && status.minutesLate) {
    display += ` ${status.minutesLate}min`;
  }

  return display;
};

export const getStatusTooltip = (status: AppointmentStatusMetadata | null): string => {
  if (!status || status.type === 'default') return '';

  const config = getStatusConfig(status.type);
  let tooltip = config.description;

  if (normalizeStatusType(status.type) === 'running_late' && status.minutesLate) {
    tooltip += ` (${status.minutesLate} minute)`;
  } else if (normalizeStatusType(status.type) === 'important' && status.importantNote) {
    tooltip = status.importantNote;
  }

  return tooltip;
};
