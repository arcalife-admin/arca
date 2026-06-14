# Compliance Roadmap

Internal document tracking gaps between current state and "best possible" security posture. Do not share the "Known gaps" section with customers without context — use [security-overview.md](security-overview.md) for external communication.

---

## Current state summary

| Layer | Maturity | Notes |
|-------|----------|-------|
| Vercel hosting | **Certified** | SOC 2 Type II, ISO 27001 — obtain report from trust center |
| Supabase database | **Certified** | SOC 2 Type II, ISO 27001 — RLS lockdown applied |
| Cloudinary media | **Certified** | SOC 2 Type II — authenticated uploads + signed URLs in app |
| ArcaLife application | **Documented, self-assessed** | Strong baseline; known gaps below |

---

## Known gaps (priority order)

### Critical — fix before claiming "best possible"

| # | Gap | Risk | Remediation | Status |
|---|-----|------|-------------|--------|
| 1 | Unauthenticated payment endpoint (`/api/patients/[id]/surgical-procedures/pay`) | Financial data tampering | Add `requireAuth()` + org scoping | **Fixed** |
| 2 | Upload station returns all patients (no org filter) | Cross-tenant data exposure | Filter by organization in upload-station routes | **Fixed** |
| 3 | Some patient routes missing org ownership check | IDOR / data leak | Audit all `[id]` routes for `organizationId` match | **Fixed** (files, notes, images, asa) |
| 4 | Upload station dev secret fallback | Weak signing key in misconfigured deploy | Fail startup if `UPLOAD_STATION_SECRET` missing in production | **Fixed** |

### High — required for enterprise sales / audit readiness

| # | Gap | Remediation | Status |
|---|-----|-------------|--------|
| 5 | No HTTP security headers (HSTS, CSP, X-Frame-Options, Referrer-Policy) | Add to `next.config.cjs` headers | **Fixed** (X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy) |
| 6 | No API rate limiting | Add rate limiting on auth/register/upload-station | **Fixed** (middleware, in-memory) |
| 7 | No `.env.example` | Create template documenting required vars | **Fixed** |
| 8 | Public registration can assign any role when enabled | Restrict to invite-only or limit roles | **Fixed** (MANAGER/OWNER blocked when joining org) |
| 9 | No formal incident response playbook | Write IR doc; define severity levels and notification timelines | Planned |
| 10 | No breach notification procedure (GDPR Art. 33) | Document 72-hour notification workflow | Planned |
| 17 | `/api/webpage-qa` accepts arbitrary URLs | Add URL allowlist to prevent SSRF | **Fixed** |

### Medium — SOC 2 / ISO readiness

| # | Gap | Remediation |
|---|-----|-------------|
| 11 | No formal ISMS / security policy document | Adopt ISO 27001-aligned policy set |
| 12 | No risk register | Quarterly risk assessment process |
| 13 | No Records of Processing Activities (Art. 30) | Create RoPA for ArcaLife as processor |
| 14 | No DPIA for health data | Conduct Data Protection Impact Assessment |
| 15 | No data retention / deletion automation | Define retention periods; implement purge jobs |
| 16 | No DSR (data subject request) workflow | Export + delete endpoints or manual SOP |
| 17 | `/api/webpage-qa` accepts arbitrary URLs | Add URL allowlist to prevent SSRF |
| 18 | No SAST/DAST in CI | Add Semgrep or similar to GitHub Actions |
| 19 | Database tenant isolation is app-layer only | Consider non-superuser DB role + RLS policies |
| 20 | No penetration test report | Engage third-party pentest annually |

---

## Path to formal ArcaLife certification

### Phase 1 — Close critical & high gaps (1–2 months)

- [ ] Fix authentication/authorization gaps (#1–4)
- [ ] Add security headers (#5)
- [ ] Add rate limiting on auth and sensitive endpoints (#6)
- [ ] Create `.env.example` (#7)
- [ ] Lock down registration (#8)
- [ ] Write incident response playbook (#9–10)

**Deliverable:** Updated [application-controls.md](application-controls.md) and [control-matrix.md](control-matrix.md) with gaps closed.

### Phase 2 — GDPR & operational readiness (2–3 months)

- [ ] Records of Processing Activities (#13)
- [ ] Data Protection Impact Assessment (#14)
- [ ] Retention policy + deletion workflow (#15–16)
- [ ] DPA template for clinic customers (#13)
- [ ] Privacy policy page (Art. 13/14) (#8 in control matrix)

**Deliverable:** GDPR compliance packet for clinic customers.

### Phase 3 — SOC 2 Type II readiness (3–6 months)

- [ ] Formal ISMS policies (#11)
- [ ] Risk register and quarterly reviews (#12)
- [ ] Change management documentation (#8 in CC)
- [ ] Vendor management program (already started in vendor-compliance doc)
- [ ] Access review process (quarterly user audit)
- [ ] Employee security training records
- [ ] Penetration test (#20)
- [ ] Engage SOC 2 auditor (Vanta, Drata, or direct CPA firm)

**Deliverable:** SOC 2 Type II report for ArcaLife (12-month audit window).

### Phase 4 — Healthcare-specific (if needed)

For US PHI or enhanced EU healthcare requirements:

- [ ] Supabase HIPAA add-on + BAA (Team/Enterprise plan)
- [ ] Supabase High Compliance project settings (SSL, network restrictions, PITR)
- [ ] Vercel HIPAA BAA (Pro+ add-on, if applicable)
- [ ] Cloudinary HIPAA BAA (contact account team)
- [ ] ArcaLife HIPAA security rule mapping
- [ ] Business Associate Agreement template for clinic customers

**Estimated platform cost for HIPAA:** ~$700+/month (Supabase Team + HIPAA add-on; Vercel add-on if needed).

---

## What you can claim today (accurate statements)

Use these in sales materials and security questionnaires:

> ArcaLife is hosted on Vercel, which maintains SOC 2 Type II and ISO 27001:2022 certification. Audit reports are available upon request from the Vercel Trust Center.

> Patient data is stored in PostgreSQL on Supabase, a SOC 2 Type II and ISO 27001:2022 certified provider. Direct database API access is blocked via Row Level Security.

> Clinical media is stored on Cloudinary (SOC 2 Type II certified) using authenticated asset types and time-limited signed URLs — media is not publicly accessible.

> ArcaLife implements role-based access control, bcrypt password hashing, multi-tenant data isolation, input validation, and encrypted transport. Our security controls are documented and aligned with SOC 2 and GDPR requirements.

## What you cannot claim today

- "ArcaLife is SOC 2 certified" (unless you complete Phase 3)
- "ArcaLife is ISO 27001 certified"
- "ArcaLife is HIPAA compliant" (without BAAs and HIPAA-configured infrastructure)
- "Penetration tested" (without a pentest report)

---

## Obtaining vendor certificates (action items)

| Action | Owner | Link |
|--------|-------|------|
| Download Vercel SOC 2 report | DevOps / Security | [security.vercel.com](https://security.vercel.com/) |
| Download Supabase SOC 2 report | DevOps / Security | [trust.supabase.io](https://trust.supabase.io/documents) |
| Request Cloudinary SOC 2 report | DevOps / Security | [cloudinary.com/trust](https://cloudinary.com/trust) |
| Store reports in compliance vault | Legal / Compliance | Internal secure storage (not git) |
| Review Supabase plan tier for report access | Engineering | Team or Enterprise required |

---

## Review schedule

| Document | Review frequency |
|----------|------------------|
| This roadmap | Monthly |
| Control matrix | After each security fix or audit finding |
| Vendor compliance | Quarterly (check for new vendor certs) |
| Security overview | Annually or after major architecture change |
