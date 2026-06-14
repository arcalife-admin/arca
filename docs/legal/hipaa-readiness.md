# HIPAA Readiness Guide (US Market)

**Last updated:** June 2026  
**Status:** Ready to activate on first US clinic customer

---

## 1. When this applies

Activate this program when ArcaLife processes **Protected Health Information (PHI)** for US-based patients or US clinic customers.

EU/Romania deployments under GDPR do **not** require HIPAA.

## 2. Shared responsibility

| Layer | HIPAA obligation |
|-------|------------------|
| **Clinic (Covered Entity / BA)** | Patient notices, minimum necessary, workforce training |
| **ArcaLife (Business Associate)** | Security Rule safeguards for the application |
| **Vercel, Supabase, Cloudinary** | Infrastructure BAAs and platform controls |

## 3. Infrastructure activation checklist

### Supabase (database)

- [ ] Upgrade to Team ($599/mo) or Enterprise plan
- [ ] Enable HIPAA add-on ($350/mo)
- [ ] Sign Supabase Business Associate Agreement
- [ ] Configure project as **High Compliance**:
  - SSL enforcement
  - Network restrictions
  - Point-in-Time Recovery (PITR)
- [ ] Confirm US region for US PHI

### Vercel (hosting)

- [ ] Upgrade to Pro+ or Enterprise
- [ ] Sign Vercel HIPAA BAA (if available for plan tier)
- [ ] Confirm deployment region

### Cloudinary (clinical media)

- [ ] Contact account team for HIPAA BAA
- [ ] Confirm authenticated asset configuration (already implemented)

### Sentry (optional)

- [ ] Confirm PHI scrubbing rules active (implemented in `src/lib/sentry.ts`)
- [ ] Evaluate Sentry BAA or disable for US HIPAA tenants

## 4. Application controls (already implemented)

- Access control (RBAC + tenant isolation)
- Audit logging
- Encryption in transit (TLS)
- Authenticated clinical media
- MFA for privileged roles
- PHI scrubbing in error monitoring
- Breach notification SOP

## 5. Additional documents needed

- [ ] ArcaLife BAA template for US clinic customers
- [ ] HIPAA Security Rule mapping document
- [ ] US-specific privacy notice addendum

## 6. Estimated platform cost uplift

~**$700+/month** (Supabase Team + HIPAA add-on; Vercel add-on if applicable).

## 7. Activation trigger

When the first US clinic signs:

1. Execute this checklist
2. Sign BAAs with all subprocessors
3. Provide BAA template to clinic customer
4. Update [compliance-status.md](../security/compliance-status.md) status to **Implemented**
5. Restrict deployment to HIPAA-configured infrastructure

## 8. Honest positioning today

> ArcaLife subprocessors (Supabase, Cloudinary) are HIPAA-capable. ArcaLife is **not yet HIPAA-compliant** for US PHI until BAAs are signed and infrastructure is configured per this guide.
