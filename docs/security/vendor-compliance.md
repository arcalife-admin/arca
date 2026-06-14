# Vendor Compliance & Subprocessors

ArcaLife relies on certified third-party infrastructure providers. This document lists their compliance posture, how to obtain audit reports, and the shared-responsibility boundaries.

---

## Subprocessor register

| Subprocessor | Service | Data processed | Location | Certifications |
|--------------|---------|----------------|----------|----------------|
| **Vercel Inc.** | Application hosting, serverless functions, CDN edge | HTTP requests, session cookies, application logs | US / EU (region-configurable) | SOC 2 Type II, ISO 27001:2022, PCI DSS SAQ-D |
| **Supabase Inc.** | Managed PostgreSQL database | All structured clinic and patient data | EU/US (project region) | SOC 2 Type II, ISO 27001:2022, HIPAA-capable |
| **Cloudinary Ltd.** | Image and document storage/delivery | Patient photos, clinical images, intake documents | Global CDN | SOC 2 Type II, ISO 27001 |
| **Sentry (Functional Software Inc.)** | Error monitoring | Stack traces, request metadata (when enabled) | US/EU | SOC 2 Type II |

Additional subprocessors may be used for optional features (email delivery, external APIs). Review environment variables and your deployment configuration for the full list active in your instance.

---

## Vercel

**Role:** Hosts the ArcaLife Next.js application, API routes, and static assets.

### Certifications

| Standard | Status | Notes |
|----------|--------|-------|
| SOC 2 Type II | ✓ Attested | Security, Confidentiality, Availability |
| ISO 27001:2022 | ✓ Certified | Certificate via Schellman |
| PCI DSS | ✓ SAQ-D AOC | For payment-adjacent hosting |
| TISAX AL2 | ✓ | Automotive supply chain standard |

### How to obtain reports

1. Visit the [Vercel Trust Center](https://security.vercel.com/)
2. Request access to the SOC 2 Type II report and ISO 27001 certificate
3. For enterprise customers, contact your Vercel account team

### ArcaLife-specific configuration

- Deployment uses Next.js `output: 'standalone'`
- Environment variables for secrets managed via Vercel project settings (not in git)
- Sentry integration supports Vercel deployment monitoring when configured

**Documentation:** [vercel.com/docs/security/compliance](https://vercel.com/docs/security/compliance)

---

## Supabase

**Role:** Hosts the PostgreSQL database. ArcaLife uses Supabase as a **database host only** — not Supabase Auth, Storage, or PostgREST API.

### Certifications

| Standard | Status | Notes |
|----------|--------|-------|
| SOC 2 Type II | ✓ Certified | Annual audit (March–February cycle) |
| ISO 27001:2022 | ✓ Certified | |
| HIPAA | ✓ Capable | Requires Team/Enterprise plan + HIPAA add-on + signed BAA |
| PCI DSS | ✓ | Platform-level |
| GDPR | ✓ | DPA available |

### How to obtain reports

1. Visit the [Supabase Trust Center](https://trust.supabase.io/documents)
2. SOC 2 Type II reports available to **Team and Enterprise** plan customers
3. For HIPAA: enable HIPAA add-on, sign BAA, configure project as High Compliance

### ArcaLife-specific configuration

| Control | Implementation |
|---------|----------------|
| Connection | Prisma via connection pooler (`pgbouncer=true` on port 6543) |
| Direct API lockdown | RLS enabled + `FORCE ROW LEVEL SECURITY` on all public tables |
| Role revocation | `anon` and `authenticated` roles revoked on all tables |
| Auto-protection | Event trigger enables RLS on newly created tables |
| Application access | Prisma connects with privileged DB role; tenant isolation enforced in application code |

**Migration reference:** `prisma/migrations/20250608120000_enable_rls/migration.sql`

### HIPAA note

If you process Protected Health Information (PHI) for US patients, Supabase HIPAA compliance requires:

- Team ($599/mo) or Enterprise plan
- HIPAA add-on ($350/mo)
- Signed Business Associate Agreement (BAA)
- Project configured as High Compliance (SSL enforcement, network restrictions, Point-in-Time Recovery)

ArcaLife's use of Supabase as PostgreSQL-only simplifies the compliance boundary but does not replace your own HIPAA obligations for the application layer.

**Documentation:** [supabase.com/docs/guides/security/soc-2-compliance](https://supabase.com/docs/guides/security/soc-2-compliance)

---

## Cloudinary

**Role:** Stores and delivers patient clinical media (photos, documents, videos).

### Certifications

| Standard | Status | Notes |
|----------|--------|-------|
| SOC 2 Type II | ✓ Certified | Security, Availability, Privacy, Confidentiality; HIPAA Security Rule criteria |
| ISO 27001 | ✓ Certified | |
| CSA STAR / CAIQ | ✓ | Cloud Controls Matrix self-assessment |

### How to obtain reports

1. Visit the [Cloudinary Trust Center](https://cloudinary.com/trust)
2. Request the SOC 2 Type II report through their security documentation portal
3. Review the CSA STAR registry entry for CAIQ questionnaire

### ArcaLife-specific configuration

| Control | Implementation |
|---------|----------------|
| Upload type | `type: 'authenticated'` — assets not publicly deliverable |
| Upload preset | `patient_media` preset for clinical files |
| Delivery | Server-generated **signed URLs** with expiration |
| Credentials | `CLOUDINARY_API_KEY` and `CLOUDINARY_API_SECRET` server-side only |
| Legacy handling | Detection and migration path for older public URLs |

**Implementation reference:** `src/lib/cloudinary-patient-media.ts`

Organization logos (non-clinical) may use a separate public upload path — clinical patient media always uses authenticated + signed delivery.

---

## Sentry (optional)

**Role:** Application error monitoring and performance tracing.

Enabled when `NEXT_PUBLIC_SENTRY_DSN` is set. May capture request context, user IDs, and stack traces. Configure data scrubbing rules in Sentry project settings for production.

**Trust Center:** [sentry.io/security](https://sentry.io/security/)

---

## Shared responsibility summary

```
┌─────────────────────────────────────────────────────────────┐
│                    YOUR RESPONSIBILITY                       │
│  ArcaLife application code, access control, tenant isolation │
│  Environment secrets, user provisioning, GDPR consent        │
│  Upload station PIN management, incident response            │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                 VENDOR RESPONSIBILITY                        │
│  Physical security, network, platform patching               │
│  Database/media encryption at rest (platform defaults)       │
│  SOC 2 / ISO audits of infrastructure                        │
└─────────────────────────────────────────────────────────────┘
```

When presenting compliance to a clinic or auditor:

1. Provide this subprocessor list
2. Attach vendor SOC 2 reports (obtained from trust centers above)
3. Include [security-overview.md](security-overview.md) and [control-matrix.md](control-matrix.md)
4. Sign a Data Processing Agreement (DPA) covering ArcaLife as processor and subprocessors listed here
