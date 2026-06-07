const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN

export function isSentryEnabled(): boolean {
  return Boolean(SENTRY_DSN)
}

export const sentryInitOptions = {
  dsn: SENTRY_DSN,
  enabled: isSentryEnabled(),
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  environment: process.env.VERCEL_ENV || process.env.NODE_ENV || 'development',
}
