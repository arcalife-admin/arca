# Information Security Policy

**Owner:** ArcaLife Security Lead  
**Effective:** June 2026  
**Review:** Annual

---

## 1. Purpose

Establish the framework for protecting information assets, including patient health data, processed by ArcaLife.

## 2. Scope

All ArcaLife employees, contractors, and systems involved in developing, operating, or supporting the clinic management platform.

## 3. Principles

1. **Confidentiality** — Health data accessible only to authorized clinic staff within their organization
2. **Integrity** — Data accurate and protected from unauthorized modification
3. **Availability** — Platform available for clinical operations with documented recovery procedures
4. **Accountability** — Actions traceable via audit logging

## 4. Responsibilities

| Role | Responsibility |
|------|----------------|
| Management | Approve policies, allocate resources for security |
| Engineering | Implement and maintain technical controls |
| All personnel | Follow acceptable use policy, report incidents |

## 5. Key controls

- Role-based access control with multi-tenant isolation
- Encryption in transit (TLS) and at rest (platform-level)
- MFA for privileged accounts (MANAGER, ORGANIZATION_OWNER)
- Vulnerability reporting via security@arcalife.ro
- Annual penetration testing and SOC 2 audit

## 6. Compliance

ArcaLife aligns with GDPR, SOC 2 Trust Services Criteria, and prepares for ISO 27001 certification.

## 7. Exceptions

Exceptions require written approval from the Security Lead and must include compensating controls.
