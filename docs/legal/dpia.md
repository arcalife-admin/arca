# Data Protection Impact Assessment (DPIA)

**GDPR Article 35**  
**Processing:** Systematic processing of special-category health data via ArcaLife  
**Last updated:** June 2026  
**Status:** Approved

---

## 1. Description of processing

ArcaLife is a multi-tenant SaaS platform enabling plastic surgery and aesthetic clinics to:

- Register and manage patient records including Romanian CNP (national ID)
- Store medical history, surgical history, and clinical assessments
- Capture and store clinical photographs and documents
- Schedule appointments and manage treatment workflows
- Generate consent documentation (GDPR, informed consent, imaging consent)

**Scale:** Multi-clinic; each clinic is an isolated tenant (`organizationId`).

**Necessity:** Processing is necessary to deliver the contracted clinic management service. Health data is not used for unrelated purposes (marketing, profiling, or sale to third parties).

---

## 2. Necessity and proportionality

| Assessment | Conclusion |
|------------|------------|
| Is processing necessary? | Yes — core product function for clinic operations |
| Is data minimized? | Yes — fields scoped to clinical and operational needs |
| Are retention periods defined? | Yes — see [retention-policy.md](retention-policy.md) |
| Is consent obtained? | Yes — digital intake with explicit Art. 9 consent |
| Can patients exercise rights? | Yes — export and erasure APIs per [dsr-sop.md](dsr-sop.md) |

---

## 3. Risk assessment

| Risk | Likelihood | Impact | Mitigation | Residual risk |
|------|------------|--------|------------|---------------|
| Unauthorized cross-tenant access | Low | Critical | Org-scoped queries, auth on all patient APIs, RLS lockdown | Low |
| Credential compromise | Medium | High | bcrypt, rate limiting, MFA for managers | Low-Medium |
| Clinical media public exposure | Low | Critical | Authenticated Cloudinary + signed URLs | Low |
| Data breach via subprocessor | Low | High | SOC 2 certified vendors, DPAs, breach SOP | Low |
| Insider abuse by clinic staff | Medium | High | RBAC, audit logging, manager oversight | Medium |
| Incomplete erasure on DSR | Low | Medium | Erasure API with Cloudinary purge | Low |
| PHI in error logs | Low | Medium | Sentry PHI scrubbing | Low |

---

## 4. Measures to address risks

### Technical

- NextAuth JWT sessions with organization scoping
- `requireAuth()` / `requireManager()` on sensitive API routes
- Cloudinary `type: authenticated` with time-limited signed URLs
- Supabase RLS enabled; `anon`/`authenticated` roles revoked
- HSTS, CSP (report-only), security headers
- Activity audit trail (`ActivityLog`)
- Automated retention purge job

### Organizational

- DPA with clinic customers ([dpa-template.md](dpa-template.md))
- Breach notification SOP ([breach-notification-sop.md](breach-notification-sop.md))
- Incident response playbook ([incident-response.md](incident-response.md))
- Staff security training (ISMS policies)
- Annual penetration test
- SOC 2 Type II audit in progress

---

## 5. Consultation

| Stakeholder | Role |
|-------------|------|
| Engineering | Control implementation and technical review |
| Legal / DPO | GDPR compliance review |
| Clinic customers | Controller obligations and privacy notices |

ANSPDCP consultation is **not required** at this time given mitigations reduce residual risk to acceptable levels. Reassess if processing scope expands (e.g., AI diagnosis, cross-clinic analytics).

---

## 6. Decision

**Approved to proceed** with documented controls and ongoing monitoring per [compliance-status.md](../security/compliance-status.md).

**Next review:** June 2027 or upon material architecture change.
