# Risk Register

**Owner:** ArcaLife Security Lead  
**Review:** Quarterly  
**Last updated:** June 2026

---

## Active risks

| ID | Risk | Likelihood | Impact | Mitigation | Owner | Status |
|----|------|------------|--------|------------|-------|--------|
| R-001 | Cross-tenant data exposure via API bug | Low | Critical | Org-scoped queries, auth audits, RLS lockdown | Engineering | Mitigated |
| R-002 | Credential stuffing on login | Medium | High | Rate limiting, bcrypt, MFA for managers | Engineering | Mitigated |
| R-003 | Clinical media public exposure | Low | Critical | Authenticated Cloudinary + signed URLs | Engineering | Mitigated |
| R-004 | Subprocessor data breach | Low | High | SOC 2 vendors, DPAs, breach SOP | Security | Accepted |
| R-005 | Insider threat (clinic staff) | Medium | High | RBAC, audit logs, clinic training | Clinic + ArcaLife | Partial |
| R-006 | Missing DSR fulfillment | Low | Medium | Export/erasure APIs, DSR SOP | Ops | Mitigated |
| R-007 | Dependency vulnerability | Medium | Medium | Semgrep CI, npm audit, Dependabot | Engineering | Mitigated |
| R-008 | Serverless rate limit bypass | Medium | Low | In-memory limiter; Redis planned | Engineering | Accepted |
| R-009 | No product SOC 2 yet | High | Medium | SOC 2 readiness program | Security | In progress |
| R-010 | US PHI without HIPAA config | Low | Critical | HIPAA readiness doc; activate on first US clinic | Security | Planned |

## Review log

| Date | Reviewer | Changes |
|------|----------|---------|
| 2026-06 | Security Lead | Initial register created |

## Escalation

Risks rated **Critical impact + Medium+ likelihood** without mitigation are escalated to management within 5 business days.
