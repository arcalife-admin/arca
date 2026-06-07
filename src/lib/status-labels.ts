/** Romanian display labels for enum/status values shown in the UI */

export const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING: 'În așteptare',
  APPROVED: 'Aprobat',
  REJECTED: 'Respins',
  ORDERED: 'Comandat',
  SHIPPED: 'Expediat',
  DELIVERED: 'Livrat',
  CANCELLED: 'Anulat',
  COMPLETED: 'Finalizat',
  CONFIRMED: 'Confirmat',
  CREATED: 'Creat',
  ITEM_RECEIVED: 'Articol primit',
  NOTE: 'Notă',
  ISSUE: 'Problemă',
}

export const REPAIR_STATUS_LABELS: Record<string, string> = {
  REPORTED: 'Raportat',
  ACKNOWLEDGED: 'Confirmat',
  SCHEDULED: 'Programat',
  IN_PROGRESS: 'În lucru',
  COMPLETED: 'Finalizat',
  CLOSED: 'Închis',
}

export const URGENCY_LABELS: Record<string, string> = {
  LOW: 'Scăzută',
  NORMAL: 'Normală',
  HIGH: 'Ridicată',
  URGENT: 'Urgentă',
  CRITICAL: 'Critică',
}

export const LEAVE_STATUS_LABELS: Record<string, string> = {
  PENDING: 'În așteptare',
  APPROVED: 'Aprobat',
  DENIED: 'Refuzat',
  CANCELLED: 'Anulat',
}

export const LEAVE_TYPE_LABELS: Record<string, string> = {
  VACATION: 'Concediu de odihnă',
  SICK: 'Concediu medical',
  PERSONAL: 'Concediu personal',
  OTHER: 'Altele',
}

export const TASK_VISIBILITY_LABELS: Record<string, string> = {
  PUBLIC: 'Public',
  PRIVATE: 'Privat',
}

export const TIMELINE_EVENT_LABELS: Record<string, string> = {
  CREATED: 'Comandă creată',
  DELIVERED: 'Comandă livrată',
  COMPLETED: 'Comandă finalizată',
  ITEM_RECEIVED: 'Articol primit',
  NOTE: 'Notă',
  ISSUE: 'Problemă',
  ORDERED: 'Comandat',
  SHIPPED: 'Expediat',
  CONFIRMED: 'Confirmat',
}

export function getStatusLabel(
  value: string | undefined | null,
  labels: Record<string, string>
): string {
  if (!value) return '—'
  return labels[value] ?? labels[value.toUpperCase()] ?? value
}
