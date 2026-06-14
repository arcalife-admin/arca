# Security Policy

ArcaLife is a clinic management platform for healthcare organizations. Protecting patient data and clinic operations is a core requirement of the product.

## Reporting a vulnerability

If you discover a security issue, please report it responsibly:

- **Email:** security@arcalife.ro (or your organization's security contact)
- **Do not** open public GitHub issues for security vulnerabilities
- Include steps to reproduce, affected URLs or endpoints, and impact assessment if known

We aim to acknowledge reports within **2 business days** and provide a remediation timeline based on severity.

## Scope

This repository covers the ArcaLife application layer. Infrastructure security for hosting, database, and media storage is shared with our subprocessors (see [docs/security/vendor-compliance.md](docs/security/vendor-compliance.md)).

## Documentation

| Document | Audience | Purpose |
|----------|----------|---------|
| [Compliance status](docs/security/compliance-status.md) | Customers, partners, auditors | Certification matrix — what we have vs. what is in progress |
| [Security overview](docs/security/security-overview.md) | Customers, partners, auditors | High-level security posture and architecture |
| [Application controls](docs/security/application-controls.md) | Technical reviewers | Implementation details in this codebase |
| [Vendor compliance](docs/security/vendor-compliance.md) | Procurement, legal, DPO | Inherited certifications (Vercel, Supabase, Cloudinary) |
| [Control matrix](docs/security/control-matrix.md) | Auditors, compliance teams | Mapping to SOC 2 TSC and GDPR articles |
| [Compliance roadmap](docs/security/compliance-roadmap.md) | Internal teams | Path to formal certification and open gaps |

## Certifications — what we have today

| Layer | Status |
|-------|--------|
| **Vercel** (hosting) | SOC 2 Type II, ISO 27001:2022, PCI DSS SAQ-D — [Trust Center](https://security.vercel.com/) |
| **Supabase** (PostgreSQL) | SOC 2 Type II, ISO 27001:2022, HIPAA-capable — [Trust Center](https://trust.supabase.io/) |
| **Cloudinary** (patient media) | SOC 2 Type II, ISO 27001 — [Trust Center](https://cloudinary.com/trust) |
| **ArcaLife application** | Self-assessed controls documented in this repo; **no independent SOC 2 / ISO audit yet** |

ArcaLife inherits infrastructure assurances from certified vendors under a shared-responsibility model. Formal certification of the ArcaLife product itself requires a third-party audit — see the [compliance roadmap](docs/security/compliance-roadmap.md).

## Data protection contact

For GDPR data subject requests or Data Processing Agreement (DPA) inquiries, contact your ArcaLife account representative or the data protection contact listed in your clinic's agreement.
