# Control Matrix — SOC 2 & GDPR Mapping

This matrix maps ArcaLife controls to **SOC 2 Trust Services Criteria (TSC)** and **GDPR** requirements. Status codes:

| Code | Meaning |
|------|---------|
| **Implemented** | Control exists and is documented in code or operations |
| **Inherited** | Provided by a certified subprocessor (Vercel, Supabase, Cloudinary) |
| **Partial** | Control exists but has known gaps |
| **Planned** | Not yet implemented; see [compliance-roadmap.md](compliance-roadmap.md) |
| **N/A** | Not applicable to ArcaLife's architecture |

---

## SOC 2 — Common Criteria (Security)

| TSC ID | Criterion | Status | Evidence |
|--------|-----------|--------|----------|
| CC1.1 | Commitment to integrity and ethical values | Implemented | Security documentation, GDPR consent in product |
| CC1.2 | Board/management oversight of security | Planned | Formal security governance not yet documented |
| CC1.3 | Organizational structure and authority | Partial | Role-based access in app; no formal RACI doc |
| CC2.1 | Internal communication of security info | Implemented | `SECURITY.md`, support docs, in-app guides |
| CC2.2 | External communication of security info | Implemented | This documentation package |
| CC3.1 | Risk assessment process | Planned | No formal risk register yet |
| CC3.2 | Fraud risk assessment | N/A | Low fraud surface for B2B clinic SaaS |
| CC3.3 | Change-related risk | Partial | Git-based change control; no formal change advisory board |
| CC3.4 | Vendor risk assessment | Implemented | [vendor-compliance.md](vendor-compliance.md) |
| CC5.1 | Selection and development of controls | Implemented | Controls in codebase per [application-controls.md](application-controls.md) |
| CC5.2 | Technology general controls | Partial | Missing security headers, rate limiting |
| CC5.3 | Deployment of controls via policies | Partial | Env-based config; no formal ISMS policy |
| CC6.1 | Logical access — authorization | Implemented | NextAuth + RBAC + org scoping |
| CC6.2 | Logical access — provisioning | Partial | Self-registration when enabled; no invite-only flow |
| CC6.3 | Logical access — removal | Implemented | `isDisabled` / `isActive` flags |
| CC6.4 | Physical access | Inherited | Vercel, Supabase, Cloudinary data centers |
| CC6.5 | Asset disposal | Inherited | Vendor-managed infrastructure |
| CC6.6 | Logical access — encryption | Partial | TLS inherited; app-level encryption at rest N/A (DB handles) |
| CC6.7 | Transmission security | Inherited + Implemented | TLS (Vercel) + signed Cloudinary URLs |
| CC6.8 | Malware prevention | Inherited | Platform-level |
| CC7.1 | Vulnerability detection | Partial | Sentry for runtime errors; no SAST/DAST pipeline |
| CC7.2 | Security event monitoring | Partial | Sentry + health checks; no SIEM |
| CC7.3 | Security incident response | Planned | Vulnerability reporting in `SECURITY.md`; no IR playbook |
| CC7.4 | Incident recovery | Inherited | Supabase PITR (if enabled), Vercel redeploy |
| CC7.5 | Security event analysis | Partial | Sentry dashboards when configured |
| CC8.1 | Change management | Partial | Git + PR workflow; no formal CAB |
| CC9.1 | Vendor management | Implemented | Subprocessor register in vendor-compliance doc |

---

## SOC 2 — Availability

| TSC ID | Criterion | Status | Evidence |
|--------|-----------|--------|----------|
| A1.1 | Capacity planning | Inherited | Vercel auto-scaling, Supabase compute tiers |
| A1.2 | Environmental protections | Inherited | Vendor SOC 2 Availability criteria |
| A1.3 | Recovery and continuity | Partial | Supabase PITR available; no documented RTO/RPO |
| A1.4 | Recovery testing | Planned | No regular DR drills documented |

---

## SOC 2 — Confidentiality

| TSC ID | Criterion | Status | Evidence |
|--------|-----------|--------|----------|
| C1.1 | Confidential information identification | Implemented | Patient data classified in security overview |
| C1.2 | Confidential information disposal | Inherited | Vendor retention/deletion policies |
| C1.3 | Confidential information access | Implemented | Auth + org scoping + signed media URLs |

---

## SOC 2 — Privacy (GDPR overlap)

| TSC ID | Criterion | Status | Evidence |
|--------|-----------|--------|----------|
| P1.1 | Privacy notice | Partial | GDPR consent in intake; no standalone privacy policy URL in repo |
| P2.1 | Choice and consent | Implemented | Patient intake consent forms |
| P3.1 | Personal information collection | Implemented | Scoped to clinic operational needs |
| P4.1 | Personal information use | Implemented | Multi-tenant clinic use only |
| P5.1 | Personal information retention | Planned | No automated retention/deletion policy |
| P6.1 | Personal information disclosure | Implemented | Subprocessor list documented |
| P7.1 | Personal information quality | Partial | Clinic staff responsible for data accuracy |
| P8.1 | Privacy complaint handling | Planned | No formal DSR workflow documented |

---

## GDPR Article Mapping

| Article | Requirement | Status | ArcaLife implementation |
|---------|-------------|--------|---------------------------|
| Art. 5 | Principles (lawfulness, minimization, etc.) | Partial | Consent in intake; retention policy needed |
| Art. 6 | Lawful basis | Implemented | Consent + legitimate interest (clinic operations) |
| Art. 7 | Conditions for consent | Implemented | Intake consent documentation |
| Art. 9 | Special category data (health) | Partial | Health data processed; explicit Art. 9 consent in intake |
| Art. 13/14 | Information to data subjects | Partial | Consent forms; clinic responsible for privacy notice |
| Art. 15 | Right of access | Planned | No self-service export; manual process needed |
| Art. 16 | Right to rectification | Implemented | Clinic staff can edit patient records |
| Art. 17 | Right to erasure | Planned | No automated deletion workflow |
| Art. 25 | Data protection by design | Partial | Auth, RLS lockdown, signed media; gaps in headers/rate limits |
| Art. 28 | Processor obligations | Implemented | Subprocessor documentation; DPA template needed |
| Art. 30 | Records of processing | Planned | This doc is a start; formal RoPA needed |
| Art. 32 | Security of processing | Implemented | Controls documented in this package |
| Art. 33/34 | Breach notification | Planned | No breach notification playbook |
| Art. 35 | DPIA | Planned | Recommended for health data processing |
| Art. 44–49 | International transfers | Inherited | Depends on Supabase/Vercel/Cloudinary region config |

---

## Platform-specific control inheritance

| Control area | Vercel | Supabase | Cloudinary | ArcaLife app |
|--------------|--------|----------|------------|--------------|
| SOC 2 Type II | ✓ | ✓ | ✓ | Self-assessed |
| ISO 27001 | ✓ | ✓ | ✓ | — |
| Encryption at rest | ✓ | ✓ | ✓ | — |
| Encryption in transit (TLS) | ✓ | ✓ | ✓ | ✓ |
| DDoS protection | ✓ | ✓ | ✓ | — |
| Access control | Platform | Platform | Platform + signed URLs | ✓ RBAC |
| Audit logging | Platform logs | Platform logs | Platform logs | Partial (app logs) |
| Backup / recovery | Redeploy | PITR (optional) | CDN redundancy | — |

---

## Using this matrix in an audit

1. **For vendor audits:** Attach SOC 2 reports from trust centers; reference the "Inherited" rows above.
2. **For application review:** Walk through "Implemented" rows with code references from [application-controls.md](application-controls.md).
3. **For gap analysis:** "Planned" and "Partial" rows define the remediation backlog in [compliance-roadmap.md](compliance-roadmap.md).
4. **Honest positioning:** State that ArcaLife controls are **self-assessed and aligned with** SOC 2 / GDPR — not independently audited unless/until you complete your own SOC 2 engagement.
