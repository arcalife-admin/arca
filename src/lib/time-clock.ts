import { TimeClockEventType } from '@prisma/client'

export type TimeClockEventLike = {
  eventType: TimeClockEventType
  occurredAt: Date
}

/**
 * Sums completed IN→OUT segments where both events fall inside [windowStart, windowEnd].
 * Same-day clinic assumption; overnight shifts split across days would count per day separately.
 */
export function workedMsInWindow(
  events: TimeClockEventLike[],
  windowStart: Date,
  windowEnd: Date
): number {
  const inWindow = events
    .filter((e) => e.occurredAt >= windowStart && e.occurredAt <= windowEnd)
    .sort((a, b) => a.occurredAt.getTime() - b.occurredAt.getTime())

  let openIn: Date | null = null
  let total = 0
  for (const e of inWindow) {
    if (e.eventType === 'CLOCK_IN') {
      openIn = e.occurredAt
    } else if (e.eventType === 'CLOCK_OUT' && openIn) {
      total += e.occurredAt.getTime() - openIn.getTime()
      openIn = null
    }
  }
  return total
}

export function msToHours(ms: number): number {
  return ms / (1000 * 60 * 60)
}

export function formatHoursShort(hours: number): string {
  if (!Number.isFinite(hours) || hours <= 0) return '0h'
  if (hours < 1) return `${Math.round(hours * 60)}m`
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}
