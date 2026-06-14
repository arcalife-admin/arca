# ArcaLife Legal & GDPR Documentation

Customer-shareable and internal legal documents supporting GDPR compliance and enterprise security reviews.

## GDPR packet

| Document | Purpose |
|----------|---------|
| [ropa.md](ropa.md) | Records of Processing Activities (Art. 30) |
| [dpia.md](dpia.md) | Data Protection Impact Assessment (Art. 35) |
| [dpa-template.md](dpa-template.md) | Data Processing Agreement for clinic customers (Art. 28) |
| [dsr-sop.md](dsr-sop.md) | Data Subject Request handling procedure |
| [breach-notification-sop.md](breach-notification-sop.md) | Breach notification (Art. 33/34) |
| [retention-policy.md](retention-policy.md) | Data retention and purge policy |
| [incident-response.md](incident-response.md) | Security incident response playbook |

## ISMS policies

See [isms/](isms/) for ISO 27001-aligned policy documents.

## Certification readiness

| Document | Purpose |
|----------|---------|
| [pentest-readiness.md](pentest-readiness.md) | Penetration test scope and checklist |
| [soc2-readiness.md](soc2-readiness.md) | SOC 2 Type II observation guide |
| [hipaa-readiness.md](hipaa-readiness.md) | US HIPAA activation checklist |

## Product implementation

| Feature | API / path |
|---------|------------|
| Privacy policy | `/ro/privacy` |
| Patient data export | `GET /api/patients/{id}/export` (manager) |
| Patient GDPR erasure | `POST /api/patients/{id}/erase` (manager) |
| Retention purge job | `GET /api/cron/data-retention` (CRON_SECRET) |
| MFA setup | `POST /api/auth/mfa/setup`, `/enable`, `/disable` |

## Related security docs

- [Compliance status](../security/compliance-status.md)
- [Control matrix](../security/control-matrix.md)
