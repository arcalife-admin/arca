# ArcaLife Security & Compliance Documentation

This folder contains documentation you can share with clinics, partners, and auditors to demonstrate ArcaLife's security posture.

## Quick start for reviewers

1. Read **[security-overview.md](security-overview.md)** — executive summary and architecture
2. Review **[vendor-compliance.md](vendor-compliance.md)** — how to obtain SOC 2 / ISO reports from Vercel, Supabase, and Cloudinary
3. Use **[control-matrix.md](control-matrix.md)** — detailed mapping to SOC 2 Trust Services Criteria and GDPR
4. For engineering review, see **[application-controls.md](application-controls.md)**

## Important distinction

| Type | What it proves | Who issues it |
|------|----------------|---------------|
| **Vendor certifications** | Infrastructure provider meets SOC 2, ISO 27001, etc. | Third-party auditor (Deloitte, Schellman, etc.) |
| **ArcaLife control documentation** | Application implements specific security controls | This repository (self-attestation) |
| **ArcaLife product certification** | Entire product + operations audited end-to-end | Requires engaging an audit firm (not yet completed) |

You **cannot** claim "ArcaLife is SOC 2 certified" based on vendor certs alone. You **can** state that ArcaLife is built on SOC 2–certified infrastructure and document application-layer controls aligned with those frameworks.

## Requesting vendor audit reports

| Vendor | How to request |
|--------|----------------|
| Vercel | [security.vercel.com](https://security.vercel.com/) — request access to SOC 2 Type II report |
| Supabase | [trust.supabase.io](https://trust.supabase.io/documents) — available to Team/Enterprise customers |
| Cloudinary | [cloudinary.com/trust](https://cloudinary.com/trust) — request SOC 2 Type II report |

Store downloaded reports in your internal compliance vault (not in this git repository).

## Files in this folder

| File | Description |
|------|-------------|
| `security-overview.md` | Customer-facing security whitepaper |
| `application-controls.md` | Technical controls implemented in code |
| `vendor-compliance.md` | Subprocessor certifications and shared responsibility |
| `control-matrix.md` | SOC 2 TSC + GDPR control mapping |
| `compliance-roadmap.md` | Internal roadmap to close gaps and pursue formal audit |
