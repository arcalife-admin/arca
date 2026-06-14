# Data Processing Agreement (DPA) Template

**GDPR Article 28**  
**Between:** [Clinic Name] ("Controller") and ArcaLife ("Processor")  
**Last updated:** June 2026

---

## 1. Subject matter and duration

The Processor provides clinic management software (ArcaLife) to the Controller for the duration of the service agreement.

## 2. Nature and purpose of processing

Processing personal data, including special-category health data, to enable patient management, appointment scheduling, clinical documentation, and related clinic operations.

## 3. Types of personal data

- Patient demographics (name, date of birth, gender, national ID/CNP, contact details, address)
- Health data (medical history, surgical history, clinical assessments, treatment records)
- Clinical media (photographs, documents, imaging files)
- Staff identity and access credentials
- Operational data (appointments, audit logs, financial records)

## 4. Categories of data subjects

- Patients of the Controller
- Employees and contractors of the Controller

## 5. Processor obligations

The Processor shall:

1. Process personal data only on documented instructions from the Controller
2. Ensure persons authorized to process data are bound by confidentiality
3. Implement appropriate technical and organizational measures per Article 32
4. Not engage sub-processors without Controller authorization (listed in Annex B)
5. Assist the Controller with data subject requests per Articles 15–22
6. Assist with breach notification per Articles 33–34
7. Delete or return data upon termination of services
8. Make available information necessary to demonstrate compliance and allow audits

## 6. Sub-processors (Annex B)

| Sub-processor | Service |
|---------------|---------|
| Vercel Inc. | Application hosting |
| Supabase Inc. | PostgreSQL database |
| Cloudinary Ltd. | Clinical media storage |
| Sentry (optional) | Error monitoring |

The Controller authorizes these sub-processors. The Processor shall notify the Controller of changes with 30 days' notice.

## 7. International transfers

Data may be processed in the EU and/or US depending on deployment configuration. Transfers are covered by Standard Contractual Clauses where applicable.

## 8. Security measures (Annex A)

See [compliance-status.md](../security/compliance-status.md) and [application-controls.md](../security/application-controls.md).

Key measures include:
- Encryption in transit (TLS) and at rest (platform-level)
- Role-based access control and multi-tenant isolation
- Authenticated clinical media with signed URLs
- Audit logging and incident response procedures
- MFA for privileged staff accounts

## 9. Data breach notification

The Processor shall notify the Controller without undue delay and within **24 hours** of becoming aware of a personal data breach, providing details per Article 33(3).

## 10. Data subject requests

The Processor provides technical assistance via patient data export and erasure APIs. The Controller remains responsible for responding to data subjects within statutory timelines.

## 11. Deletion and return

Upon termination, the Processor shall delete all personal data within **30 days**, unless EU or member state law requires retention.

## 12. Audit rights

The Controller may audit Processor compliance annually with 30 days' notice, or accept the Processor's SOC 2 Type II report when available.

---

**Signatures**

Controller: _________________________ Date: _________

Processor (ArcaLife): _________________________ Date: _________
