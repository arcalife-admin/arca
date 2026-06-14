# Incident Response Playbook

**SOC 2 CC7.3**  
**Last updated:** June 2026

---

## 1. Incident response team

| Role | Responsibility |
|------|----------------|
| **Incident Commander** | Coordinates response, makes severity calls |
| **Engineering Lead** | Technical containment and remediation |
| **Security Lead** | Assessment, evidence preservation, external communication |
| **Legal / DPO** | Regulatory notification guidance |

## 2. Incident lifecycle

```
Detect → Triage → Contain → Eradicate → Recover → Review
```

## 3. Severity classification

| Severity | Criteria | Response time |
|----------|----------|---------------|
| **SEV-1** | Active data breach, production down, cross-tenant exposure | Immediate (24/7) |
| **SEV-2** | Partial outage, auth bypass, single-tenant exposure risk | 4 hours |
| **SEV-3** | Degraded performance, non-exploited vulnerability | 1 business day |
| **SEV-4** | Informational, no patient data impact | 3 business days |

## 4. Detection sources

- Sentry error spikes
- Customer reports (security@arcalife.ro)
- Uptime monitoring (`/api/health`)
- GitHub Dependabot / Semgrep CI alerts
- Vendor security advisories

## 5. Containment actions

| Scenario | Action |
|----------|--------|
| Compromised staff account | Disable account (`isDisabled`), force password reset |
| Compromised API secret | Rotate in Vercel env, redeploy |
| Vulnerability in dependency | Patch via PR, emergency deploy |
| DDoS / abuse | Rate limiting, Vercel firewall rules |
| Upload station PIN leak | Rotate `UPLOAD_STATION_SECRET`, update clinic PIN |

## 6. Communication

| Audience | When | Channel |
|----------|------|---------|
| Internal team | SEV-1/2 immediately | Slack / email |
| Affected clinic | SEV-1 within 24h | Account rep + security@arcalife.ro |
| All customers | SEV-1 with broad impact | Status page / email |
| Regulators | Per breach SOP (controller leads) | ANSPDCP via clinic |

## 7. Evidence preservation

- Do not delete audit logs during investigation
- Export relevant Sentry events and Vercel logs
- Document timeline in incident ticket

## 8. Post-incident review

Within 5 business days for SEV-1/2:
- Root cause analysis
- Remediation items with owners and deadlines
- Update to DPIA, control matrix, or application controls if needed

## 9. Related documents

- [breach-notification-sop.md](breach-notification-sop.md)
- [SECURITY.md](../../SECURITY.md)
- [compliance-status.md](../security/compliance-status.md)
