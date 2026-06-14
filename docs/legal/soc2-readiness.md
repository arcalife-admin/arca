# SOC 2 Type II Readiness Guide

**Last updated:** June 2026  
**Status:** Observation period preparation

---

## 1. Objective

Obtain an independent SOC 2 Type II report for the ArcaLife product covering Security, Confidentiality, and Availability trust services criteria.

## 2. Recommended approach

| Option | Description | Timeline |
|--------|-------------|----------|
| **Compliance automation** | Vanta, Drata, or Secureframe — continuous monitoring + auditor intro | 3–6 months to Type II |
| **Direct CPA firm** | Engage Schellman, A-LIGN, or similar directly | 6–12 months |

## 3. Readiness checklist

### Policies (complete)

- [x] Information Security Policy
- [x] Access Control Policy
- [x] Acceptable Use Policy
- [x] Change Management Policy
- [x] Vendor Management Policy
- [x] Incident Response Playbook
- [x] Breach Notification SOP
- [x] Risk Register

### Technical controls (complete)

- [x] Authentication + RBAC + tenant isolation
- [x] MFA for privileged roles
- [x] Audit logging
- [x] Security headers
- [x] Rate limiting
- [x] SAST in CI
- [x] PHI scrubbing in Sentry
- [x] GDPR DSR APIs

### Evidence collection (in progress)

- [ ] Employee security training records
- [ ] Quarterly access review logs
- [ ] Change management tickets (GitHub PRs)
- [ ] Vendor SOC 2 reports in compliance vault
- [ ] Penetration test report
- [ ] Incident response drill record

## 4. Observation period

SOC 2 Type II requires **3–12 months** of control operation evidence. Start the observation clock after:

1. All Critical/High pentest findings remediated
2. Compliance automation platform connected (if used)
3. Control matrix updated with no open P0 gaps

## 5. Customer-facing outcome

Upon completion, ArcaLife can accurately state:

> ArcaLife maintains SOC 2 Type II certification for Security, Confidentiality, and Availability.

Until then, use [compliance-status.md](../security/compliance-status.md) for accurate positioning.

## 6. Estimated cost

| Item | Range |
|------|-------|
| Compliance platform (Vanta/Drata) | $10,000–$20,000/year |
| SOC 2 Type II audit | $15,000–$40,000 |
| Penetration test | $8,000–$15,000 |

## 7. Next actions

1. Select compliance platform or audit firm
2. Complete penetration test (see [pentest-readiness.md](pentest-readiness.md))
3. Begin observation period
4. Update [control-matrix.md](../security/control-matrix.md) as controls mature
