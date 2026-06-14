# Breach Notification Standard Operating Procedure

**GDPR Articles 33 & 34**  
**Last updated:** June 2026

---

## 1. Purpose

Define the process for detecting, assessing, containing, and notifying personal data breaches involving ArcaLife systems or subprocessors.

## 2. Scope

Applies to all ArcaLife personnel and contractors with access to production systems or patient data.

## 3. Definitions

| Term | Definition |
|------|------------|
| **Personal data breach** | Breach of security leading to accidental or unlawful destruction, loss, alteration, unauthorized disclosure of, or access to, personal data |
| **Controller** | The clinic (customer) — responsible for notifying ANSPDCP and data subjects |
| **Processor** | ArcaLife — responsible for notifying the controller without undue delay |

## 4. Severity levels

| Level | Description | Example |
|-------|-------------|---------|
| **P1 — Critical** | Confirmed unauthorized access to patient health data | Cross-tenant data leak, database exfiltration |
| **P2 — High** | Likely unauthorized access or significant availability loss | Compromised admin credentials, ransomware |
| **P3 — Medium** | Limited exposure or contained incident | Single misconfigured endpoint, brief outage |
| **P4 — Low** | No personal data impact | Non-production incident, failed attack attempt |

## 5. Response timeline

| Action | P1 | P2 | P3/P4 |
|--------|----|----|-------|
| Acknowledge alert | 1 hour | 4 hours | 1 business day |
| Notify ArcaLife security lead | Immediate | 4 hours | 1 business day |
| Initial containment | 2 hours | 8 hours | 1 business day |
| Notify clinic (controller) | **24 hours** | 48 hours | As needed |
| Controller notifies ANSPDCP | **72 hours** (controller obligation) | Per controller | N/A |
| Post-incident report | 5 business days | 10 business days | 10 business days |

## 6. Response steps

### 6.1 Detection

Sources: Sentry alerts, customer reports, security@arcalife.ro, vendor notifications, audit log anomalies.

### 6.2 Triage

1. Assign incident commander (security lead or on-call engineer)
2. Classify severity (P1–P4)
3. Document timeline in incident tracker
4. Preserve evidence (logs, snapshots) — do not destroy audit trails

### 6.3 Containment

- Revoke compromised credentials
- Disable affected accounts (`isDisabled` flag)
- Block malicious IPs (Vercel firewall / rate limiting)
- Rotate secrets (`NEXTAUTH_SECRET`, `UPLOAD_STATION_SECRET`, API keys)
- Isolate affected tenant if cross-tenant risk

### 6.4 Assessment

Determine:
- Categories and approximate number of data subjects
- Categories and approximate number of records
- Likely consequences for data subjects
- Measures taken or proposed

### 6.5 Notification

**To clinic (controller):** Email security contact + account representative with:
- Nature of breach
- Data categories and subjects affected
- Likely consequences
- Measures taken
- Contact point for further information

**To ANSPDCP:** Controller responsibility. ArcaLife assists with technical details.

**To data subjects:** Controller responsibility (Art. 34) when high risk to rights and freedoms.

### 6.6 Recovery

- Deploy fixes
- Verify containment
- Monitor for recurrence (72 hours minimum)

### 6.7 Post-incident review

- Root cause analysis within 5 business days (P1/P2)
- Update controls and documentation
- Update DPIA if processing risks changed

## 7. Contacts

| Role | Contact |
|------|---------|
| Security reports | security@arcalife.ro |
| ArcaLife incident commander | On-call engineering lead |
| ANSPDCP (Romania) | https://www.dataprotection.ro |

## 8. Review

This SOP is reviewed **annually** and after every P1/P2 incident.
