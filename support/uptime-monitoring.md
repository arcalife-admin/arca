# Uptime monitoring for Arca Life

Use an external monitor to alert you before the clinic calls. The app exposes a health endpoint suitable for UptimeRobot, Better Stack, Pingdom, etc.

## Endpoint

```
GET https://YOUR_PRODUCTION_URL/api/health
```

**Expected response:** HTTP `200` with JSON `"status": "ok"` when database is healthy.

**Failure:** HTTP `503` or `500` — treat as downtime.

## Recommended: UptimeRobot (free tier)

1. Create account at [uptimerobot.com](https://uptimerobot.com).
2. Add monitor:
   - **Type:** HTTP(s)
   - **URL:** `https://YOUR_PRODUCTION_URL/api/health`
   - **Interval:** 5 minutes
   - **Alert contacts:** your email + optional SMS
3. Optional: add a second monitor on the login page URL for frontend availability.

## Alert routing

Forward alerts to the same channels the clinic uses:

- Email → your inbox
- SMS / push → phone used for emergencies
- Webhook → WhatsApp automation (if you use one later)

## Sentry (errors before downtime)

When `NEXT_PUBLIC_SENTRY_DSN` is set, client and server errors are reported to Sentry. Check Sentry before the clinic reports an issue.

Configure in `.env`:

```env
NEXT_PUBLIC_SENTRY_DSN=https://...@....ingest.sentry.io/...
SENTRY_ORG=your-org
SENTRY_PROJECT=arca-life
```

Optional for source maps in production builds:

```env
SENTRY_AUTH_TOKEN=...
```

## What to monitor

| Check | URL | Why |
|-------|-----|-----|
| API + DB | `/api/health` | Catches backend/database failures |
| Frontend | `/login` | Catches deployment/CDN issues |
| Support reports | Sentry dashboard | Catches JS errors users hit before calling |
