# Application Security Controls

Technical reference for security controls implemented in the ArcaLife codebase. For customer-facing summary, see [security-overview.md](security-overview.md).

---

## Authentication

| Control | Implementation | Location |
|---------|----------------|----------|
| Credential provider | NextAuth Credentials provider | `src/lib/auth-config.ts` |
| Password hashing | bcrypt, cost 10 | `src/lib/auth-config.ts`, registration routes |
| Session strategy | JWT (stateless) | `src/lib/auth-config.ts` |
| Session payload | `id`, `role`, `organizationId` | JWT callbacks in auth config |
| Account lockout | `isActive` / `isDisabled` flags checked at login | `src/lib/auth-config.ts` |
| Login audit | `lastLoginAt` updated on successful auth | `src/lib/auth-config.ts` |
| Custom sign-in page | `/login` | auth config + `src/app/login/` |
| Page protection | Middleware redirects unauthenticated users from `/dashboard/*` | `src/middleware.ts` |
| Registration gate | `ALLOW_PUBLIC_REGISTRATION` env var; off by default in production | `src/lib/require-auth.ts`, `src/middleware.ts` |

---

## Authorization

| Control | Implementation | Location |
|---------|----------------|----------|
| API auth helper | `requireAuth()` — 401 without valid session + org | `src/lib/require-auth.ts` |
| Manager gate | `requireManager()` — 403 unless owner/manager role | `src/lib/require-auth.ts` |
| Role enum | `ORGANIZATION_OWNER`, `MANAGER`, `PRACTITIONER`, etc. | Prisma schema |
| Tenant scoping | Queries filtered by `session.user.organizationId` | Per-route in `src/app/api/` |
| Manager-only APIs | Users, logs, analytics, instructions management | Various API routes |

**Coverage:** ~105 of 110 API routes use session checks. Routes without auth should be treated as bugs — see [compliance-roadmap.md](compliance-roadmap.md).

---

## Upload station (kiosk)

| Control | Implementation | Location |
|---------|----------------|----------|
| PIN authentication | `UPLOAD_STATION_PIN` env var | `src/lib/upload-station-auth.ts` |
| Session cookie | HMAC-SHA256 signed, 12h expiry | `src/lib/upload-station-auth.ts` |
| Cookie flags | `httpOnly`, `secure` (production), `sameSite: 'lax'` | `src/lib/upload-station-auth.ts` |
| Upload station org scoping | `UPLOAD_STATION_ORGANIZATION_ID` or single-org auto-detect | `src/lib/upload-station-org.ts` |
| Patient org verification helper | `findPatientInOrganization()` | `src/lib/patient-access.ts` |

---

## Input validation

| Control | Implementation | Location |
|---------|----------------|----------|
| Schema validation | Zod schemas on registration, patients, users, etc. | API route handlers |
| Type safety | TypeScript + Prisma generated types | Throughout |
| Debug endpoint | Disabled in production | `src/app/api/debug-distance/route.ts` |

---

## Database security

| Control | Implementation | Location |
|---------|----------------|----------|
| ORM | Prisma — parameterized queries (SQL injection protection) | `src/lib/prisma.ts` |
| Server-only guard | Prisma client throws if imported in browser | `src/lib/prisma.ts` |
| Connection pooling | `pgbouncer=true` for Supabase pooler | `src/lib/prisma.ts` |
| RLS on all tables | `ENABLE` + `FORCE ROW LEVEL SECURITY` | `prisma/migrations/20250608120000_enable_rls/` |
| Supabase API lockdown | `REVOKE ALL` from `anon`, `authenticated` | Same migration |
| Auto RLS on new tables | DDL event trigger | Same migration |
| Tenant isolation | Application-layer `organizationId` filters | API routes |

**Note:** Prisma connects with a privileged database role that bypasses RLS. Tenant isolation depends on correct application code — not database policies.

---

## Media security (Cloudinary)

| Control | Implementation | Location |
|---------|----------------|----------|
| Authenticated uploads | `type: 'authenticated'` | `src/lib/cloudinary-patient-media.ts` |
| Upload preset | `patient_media` | `src/lib/cloudinary-patient-media.ts` |
| Signed delivery | `getSignedPatientMediaUrl()` with expiration | `src/lib/cloudinary-patient-media.ts` |
| Server-side credentials | API key/secret never exposed to client | Env vars, server-only upload functions |
| Legacy URL detection | Identifies old public Cloudinary URLs | `src/lib/cloudinary-patient-media.ts` |
| Org logos | Separate public upload path (non-clinical) | `src/lib/cloudinary.ts` |

---

## HTTP & transport

| Control | Implementation | Location |
|---------|----------------|----------|
| API cache headers | `Cache-Control: no-store, must-revalidate` on `/api/*` | `next.config.cjs` |
| TLS | Enforced by Vercel platform | Vercel (inherited) |
| Security headers | X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy | `next.config.cjs` |
| API rate limiting | In-memory limit on auth/register/upload-station (20 req / 15 min per IP) | `src/middleware.ts`, `src/lib/rate-limit.ts` |
| Server-only packages | Webpack externals prevent client bundling of `bcrypt`, `pg`, `@prisma/client` | `next.config.cjs`, `package.json` `"browser"` field |
| Image domain allowlist | `res.cloudinary.com` only | `next.config.cjs` |

### Not yet implemented

| Control | Status | Priority |
|---------|--------|----------|
| Content-Security-Policy (strict) | Missing — may break Next.js inline scripts | Medium |
| Distributed rate limiting (Redis/Upstash) | In-memory only (per server instance) | Medium |
| CSRF tokens for API | Missing (same-site cookies mitigate) | Medium |
| Centralized API auth middleware | Per-route checks only | Medium |

---

## Secrets & configuration

| Control | Implementation | Location |
|---------|----------------|----------|
| Git ignore | `.env`, `.env.local`, `.env.production` | `.gitignore` |
| Startup validation | `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL` | `src/lib/env-check.ts` |
| Sentry opt-in | Only loaded when DSN present | `next.config.cjs`, Sentry configs |

### Required production environment variables

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL connection (Supabase) |
| `DIRECT_URL` | Direct connection for migrations |
| `NEXTAUTH_SECRET` | Session signing key |
| `NEXTAUTH_URL` | Canonical app URL |
| `CLOUDINARY_API_KEY` | Media upload (server) |
| `CLOUDINARY_API_SECRET` | Media upload (server) |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name (public, expected) |
| `ALLOW_PUBLIC_REGISTRATION` | Set to `false` in production |
| `UPLOAD_STATION_PIN` | Kiosk PIN |
| `UPLOAD_STATION_SECRET` | Kiosk cookie signing key |
| `UPLOAD_STATION_ORGANIZATION_ID` | Org scope for kiosk (auto-detected if single org) |

---

## Monitoring

| Control | Implementation | Location |
|---------|----------------|----------|
| Error tracking | Sentry (server, client, edge configs) | `sentry.*.config.ts`, `instrumentation.ts` |
| Health check | `/api/health` — DB connectivity ping | `src/app/api/health/route.ts` |
| Uptime monitoring | Documented setup | `support/uptime-monitoring.md` |
| Remote support policy | Attended access, session logging | `support/clinic-remote-setup.md` |

---

## GDPR & privacy

| Control | Implementation | Location |
|---------|----------------|----------|
| Consent forms | Patient intake GDPR consent | `src/lib/intake/documents.ts` |
| Privacy policy | Public page Art. 13/14 | `src/app/[locale]/privacy/page.tsx` |
| Patient export (Art. 15) | Manager-only JSON export | `src/app/api/patients/[id]/export/route.ts` |
| Patient erasure (Art. 17) | Manager-only + Cloudinary purge | `src/app/api/patients/[id]/erase/route.ts` |
| Retention purge | Weekly cron job | `src/app/api/cron/data-retention/route.ts` |
| Legal documents | RoPA, DPIA, DPA, SOPs | `docs/legal/` |
| Data minimization | Fields collected per intake workflow | Intake components |
| Multi-tenant separation | Organization-scoped data access | Application layer |

---

## MFA

| Control | Implementation | Location |
|---------|----------------|----------|
| TOTP generation | otplib authenticator | `src/lib/mfa.ts` |
| MFA setup / enable / disable | Manager-only API routes | `src/app/api/auth/mfa/*` |
| Login MFA challenge | Credentials provider + login UI | `src/lib/auth-config.ts`, login page |

---

## HTTP security headers

| Header | Value | Location |
|--------|-------|----------|
| Strict-Transport-Security | max-age=63072000; includeSubDomains; preload | `next.config.cjs` |
| Content-Security-Policy-Report-Only | Restrictive policy (monitoring phase) | `next.config.cjs` |
| X-Frame-Options | SAMEORIGIN | `next.config.cjs` |
| X-Content-Type-Options | nosniff | `next.config.cjs` |
| Referrer-Policy | strict-origin-when-cross-origin | `next.config.cjs` |

---

## PHI scrubbing

| Control | Implementation | Location |
|---------|----------------|----------|
| Sentry beforeSend | Strips CNP, patient fields from errors | `src/lib/sentry.ts` |

---

## Middleware scope

```typescript
// src/middleware.ts — protects pages, NOT API routes
matcher: ['/((?!api|_next/static|_next/image|favicon.ico|...).*)']
```

API routes rely on per-handler `requireAuth()` calls. This is a deliberate Next.js pattern but requires discipline to avoid gaps.
