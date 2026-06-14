import { ro } from 'date-fns/locale'

export const dateFnsLocale = ro
export const dateFnsLocaleKey = 'ro' as const

/** Culture key for react-big-calendar date-fns localizer */
export const calendarCulture = dateFnsLocaleKey

/** Romanian toolbar and view labels for react-big-calendar */
export const calendarMessages = {
  date: 'Dată',
  time: 'Ora',
  event: 'Eveniment',
  allDay: 'Toată ziua',
  week: 'Săptămână',
  work_week: 'Săptămâna de lucru',
  day: 'Zi',
  month: 'Lună',
  previous: 'Înapoi',
  next: 'Înainte',
  yesterday: 'Ieri',
  tomorrow: 'Mâine',
  today: 'Astăzi',
  agenda: 'Agendă',
  noEventsInRange: 'Nu există evenimente în acest interval.',
  showMore: (total: number) => `+${total} mai multe`,
}
