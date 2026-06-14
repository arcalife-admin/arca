import { format, isWithinInterval } from 'date-fns';

export const DEFAULT_VISIBLE_DAYS = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
] as const;

export type CalendarPractitioner = {
  id: string;
  firstName?: string;
  lastName?: string;
};

export type CalendarScheduleRule = {
  startDate: string | Date;
  endDate: string | Date;
  repeatType: string;
  daysOfWeek: string[];
  schedule?: Record<string, Record<string, { userId?: string }>>;
};

/**
 * Resolve which practitioners appear on a given date.
 * Manager-assigned shifts define the global roster; personal visible-day
 * preferences can only remove practitioners from that roster.
 */
export function getPractitionersAvailableOnDate(
  practitioners: CalendarPractitioner[],
  scheduleRules: CalendarScheduleRule[],
  practitionerVisibleDays: Record<string, string[]>,
  date: Date
): CalendarPractitioner[] {
  const dayOfWeekLower = format(date, 'EEEE').toLowerCase();
  const dayOfWeek = format(date, 'EEEE');

  const applicableRules = scheduleRules.filter((rule) => {
    const ruleStart = new Date(rule.startDate);
    const ruleEnd = new Date(rule.endDate);
    return isWithinInterval(date, { start: ruleStart, end: ruleEnd });
  });

  let candidates: CalendarPractitioner[];

  if (applicableRules.length === 0) {
    candidates = practitioners;
  } else {
    const scheduleIds = new Set<string>();

    applicableRules.forEach((rule) => {
      if (rule.repeatType === 'weekly' && rule.daysOfWeek.includes(dayOfWeek)) {
        const daySchedule = rule.schedule?.[dayOfWeek];
        if (daySchedule) {
          Object.values(daySchedule).forEach((room) => {
            if (room.userId) {
              scheduleIds.add(room.userId);
            }
          });
        }
      } else if (rule.repeatType === 'daily') {
        const allSchedule = rule.schedule?.['ALL'];
        if (allSchedule) {
          Object.values(allSchedule).forEach((room) => {
            if (room.userId) {
              scheduleIds.add(room.userId);
            }
          });
        }
      }
    });

    candidates = practitioners.filter((p) => scheduleIds.has(p.id));
  }

  return candidates.filter((p) => {
    const days = practitionerVisibleDays[p.id] || [...DEFAULT_VISIBLE_DAYS];
    return days.includes(dayOfWeekLower);
  });
}

export const VISIBLE_DAY_LABELS: Record<string, string> = {
  monday: 'Luni',
  tuesday: 'Marți',
  wednesday: 'Miercuri',
  thursday: 'Joi',
  friday: 'Vineri',
  saturday: 'Sâmbătă',
  sunday: 'Duminică',
};

export function formatVisibleDays(days: string[]): string {
  return days.map((day) => VISIBLE_DAY_LABELS[day] || day).join(', ');
}
