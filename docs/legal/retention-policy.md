# Data Retention Policy

**GDPR Article 5(1)(e)**  
**Last updated:** June 2026

---

## 1. Principles

Personal data is kept only as long as necessary for the purposes for which it was collected. Clinics (controllers) may set shorter periods; these are ArcaLife defaults.

## 2. Retention periods

| Data category | Default retention | Deletion method |
|---------------|-------------------|-----------------|
| Active patient records | Duration of clinic relationship + 10 years | Manual erasure or automated purge after retention period |
| Disabled patient records | 2 years after `disabledAt` | Automated purge job |
| Activity audit logs | 2 years | Automated purge job |
| Staff accounts (disabled) | 1 year after `disabledAt` | Manual review + deletion |
| Session / auth tokens | JWT expiry (session end) | Stateless — no DB retention |
| Error monitoring (Sentry) | 90 days (Sentry default) | Sentry platform retention |
| Cloudinary clinical media | Linked to patient record lifecycle | Deleted on patient erasure |

## 3. Automated purge

A scheduled job runs via `GET /api/cron/data-retention` (protected by `CRON_SECRET`):

- Deletes activity logs older than `RETENTION_ACTIVITY_LOG_DAYS` (default: 730)
- Deletes disabled patients past `RETENTION_DISABLED_PATIENT_DAYS` (default: 730) after anonymization check

## 4. Legal holds

Data subject to legal proceedings or regulatory investigation is excluded from automated purge until the hold is released.

## 5. Clinic responsibility

Controllers must configure retention per applicable medical records law (e.g., Romanian healthcare regulations). ArcaLife provides the technical mechanism; the clinic defines the policy.

## 6. Review

Reviewed **annually** or when legal requirements change.
