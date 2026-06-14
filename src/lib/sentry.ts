import type { ErrorEvent, EventHint } from '@sentry/nextjs'

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN

/** Patterns that may appear in health-data error payloads */
const PHI_PATTERNS = [
  /\b\d{13}\b/g, // Romanian CNP
  /\bcnp\b/gi,
  /\bpatient(Name|Id|Code)?\b/gi,
  /\bmedicalHistory\b/gi,
  /\bsurgicalHistory\b/gi,
  /\bhealthInsurance\b/gi,
  /\bfirstName\b/gi,
  /\blastName\b/gi,
  /\bdateOfBirth\b/gi,
]

function scrubString(value: string): string {
  let result = value
  for (const pattern of PHI_PATTERNS) {
    result = result.replace(pattern, '[REDACTED]')
  }
  return result
}

function scrubValue(value: unknown): unknown {
  if (typeof value === 'string') {
    return scrubString(value)
  }
  if (Array.isArray(value)) {
    return value.map(scrubValue)
  }
  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>
    const scrubbed: Record<string, unknown> = {}
    for (const [key, val] of Object.entries(obj)) {
      const sensitiveKey = /cnp|patient|medical|health|insurance|birth|address|phone|email/i.test(
        key
      )
      scrubbed[key] = sensitiveKey ? '[REDACTED]' : scrubValue(val)
    }
    return scrubbed
  }
  return value
}

export function scrubPhiFromEvent(event: ErrorEvent, _hint: EventHint): ErrorEvent {
  if (event.message) {
    event.message = scrubString(event.message)
  }
  if (event.exception?.values) {
    for (const exception of event.exception.values) {
      if (exception.value) {
        exception.value = scrubString(exception.value)
      }
    }
  }
  if (event.request?.data) {
    event.request.data = scrubValue(event.request.data) as typeof event.request.data
  }
  if (event.extra) {
    event.extra = scrubValue(event.extra) as typeof event.extra
  }
  if (event.contexts) {
    event.contexts = scrubValue(event.contexts) as typeof event.contexts
  }
  return event
}

export function isSentryEnabled(): boolean {
  return Boolean(SENTRY_DSN)
}

export const sentryInitOptions = {
  dsn: SENTRY_DSN,
  enabled: isSentryEnabled(),
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  environment: process.env.VERCEL_ENV || process.env.NODE_ENV || 'development',
  beforeSend: scrubPhiFromEvent,
}
