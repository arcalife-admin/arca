export type AppointmentStatusType =
  | 'default'
  | 'waiting_room'
  | 'being_treated'
  | 'finished'
  | 'no_show'
  | 'called_off'
  | 'running_late'
  | 'brushing_teeth'
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

export const APPOINTMENT_STATUS_CONFIGS: Record<AppointmentStatusType, AppointmentStatusConfig> = {
  default: {
    type: 'default',
    label: 'Default',
    icon: '',
    color: '#6b7280',
    description: 'No status set',
    requiresInput: false
  },
  waiting_room: {
    type: 'waiting_room',
    label: 'In Waiting Room',
    icon: '🪑',
    color: '#3b82f6',
    description: 'Patient is waiting in the waiting room',
    requiresInput: false
  },
  being_treated: {
    type: 'being_treated',
    label: 'Being Treated',
    icon: '⚕️',
    color: '#10b981',
    description: 'Patient is currently being treated',
    requiresInput: false
  },
  finished: {
    type: 'finished',
    label: 'Finished',
    icon: '✅',
    color: '#059669',
    description: 'Treatment is completed',
    requiresInput: false
  },
  no_show: {
    type: 'no_show',
    label: "Didn't Show Up",
    icon: '❌',
    color: '#dc2626',
    description: 'Patient did not show up for appointment',
    requiresInput: false
  },
  called_off: {
    type: 'called_off',
    label: 'Called Off',
    icon: '📞',
    color: '#f59e0b',
    description: 'Appointment was cancelled/called off',
    requiresInput: false
  },
  running_late: {
    type: 'running_late',
    label: 'Running Late',
    icon: '⏰',
    color: '#f97316',
    description: 'Patient is running late',
    requiresInput: true,
    inputType: 'minutes'
  },
  brushing_teeth: {
    type: 'brushing_teeth',
    label: 'Brushing Teeth',
    icon: '🦷',
    color: '#8b5cf6',
    description: 'Patient is brushing teeth before treatment',
    requiresInput: false
  },
  important: {
    type: 'important',
    label: 'Important',
    icon: '⚠️',
    color: '#dc2626',
    description: 'Important note or alert',
    requiresInput: true,
    inputType: 'note'
  }
};

export const getStatusConfig = (status: AppointmentStatusType): AppointmentStatusConfig => {
  return APPOINTMENT_STATUS_CONFIGS[status];
};

export const getStatusDisplay = (status: AppointmentStatusMetadata | null): string => {
  if (!status || status.type === 'default') return '';

  const config = APPOINTMENT_STATUS_CONFIGS[status.type];
  let display = config.icon;

  if (status.type === 'running_late' && status.minutesLate) {
    display += ` ${status.minutesLate}min`;
  }

  return display;
};

export const getStatusTooltip = (status: AppointmentStatusMetadata | null): string => {
  if (!status || status.type === 'default') return '';

  const config = APPOINTMENT_STATUS_CONFIGS[status.type];
  let tooltip = config.description;

  if (status.type === 'running_late' && status.minutesLate) {
    tooltip += ` (${status.minutesLate} minutes)`;
  } else if (status.type === 'important' && status.importantNote) {
    tooltip = status.importantNote;
  }

  return tooltip;
}; 