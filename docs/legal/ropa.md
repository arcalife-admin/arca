# Records of Processing Activities (RoPA)

**GDPR Article 30**  
**Controller:** The clinic (customer organization) using ArcaLife  
**Processor:** ArcaLife (S.C. ArcaLife / operator as named in the DPA)  
**Last updated:** June 2026

---

## 1. Processing overview

| Field | Value |
|-------|-------|
| **Processing activity** | Clinic management platform — patient records, appointments, clinical media, operations |
| **Purpose** | Enable healthcare organizations to manage patients, clinical workflows, and clinic operations |
| **Lawful basis (controller)** | Art. 6(1)(b) contract with patient; Art. 9(2)(a) explicit consent for health data |
| **Categories of data subjects** | Clinic patients, clinic staff |
| **Special categories** | Health data (medical history, clinical images, treatment records, ASA scores) |
| **Recipients** | Authorized clinic staff within the organization; ArcaLife subprocessors (see DPA) |
| **International transfers** | Depends on deployment region (Vercel/Supabase/Cloudinary EU or US) |
| **Retention** | Per clinic policy; see [retention-policy.md](retention-policy.md) |
| **Security measures** | See [compliance-status.md](../security/compliance-status.md) |

---

## 2. Data categories processed

| Category | Examples | Storage |
|----------|----------|---------|
| Staff identity | Name, email, role, hashed password | PostgreSQL (Supabase) |
| Patient demographics | Name, DOB, gender, CNP, address, phone, email | PostgreSQL |
| Health data | Medical/surgical history, ASA scores, clinical notes | PostgreSQL |
| Clinical media | Before/after photos, X-rays, documents | Cloudinary (authenticated) |
| Consent records | GDPR consent, informed consent, imaging consent | PostgreSQL + PDF templates |
| Operational | Appointments, tasks, finance, audit logs | PostgreSQL |

---

## 3. Processing purposes

| Purpose | Data used | Legal basis |
|---------|-------------|-------------|
| Patient care management | Full patient record | Contract + Art. 9 consent |
| Appointment scheduling | Demographics, contact | Contract |
| Clinical documentation | Health data, images | Art. 9 consent |
| Staff access control | Staff credentials, roles | Legitimate interest / contract |
| Audit and security | Activity logs, IP addresses | Legitimate interest (Art. 6(1)(f)) |
| Error monitoring (optional) | Stack traces (PHI scrubbed) | Legitimate interest |

---

## 4. Subprocessors

| Subprocessor | Function | Location |
|--------------|----------|----------|
| Vercel Inc. | Application hosting | US/EU |
| Supabase Inc. | PostgreSQL database | EU/US (project region) |
| Cloudinary Ltd. | Clinical media storage | Global CDN |
| Sentry (optional) | Error monitoring | US/EU |

Full details: [vendor-compliance.md](../security/vendor-compliance.md)

---

## 5. Technical and organizational measures (Art. 32)

- Role-based access control and multi-tenant isolation
- bcrypt password hashing; MFA for privileged roles
- TLS encryption in transit; platform encryption at rest
- Authenticated Cloudinary assets with signed delivery URLs
- Supabase RLS lockdown on direct API access
- Rate limiting on authentication endpoints
- Activity audit logging
- Documented incident response and breach notification procedures

---

## 6. Data subject rights

Handled per [dsr-sop.md](dsr-sop.md). Clinic (controller) receives requests; ArcaLife (processor) assists via export and erasure APIs.

---

## 7. Review schedule

This RoPA is reviewed **annually** or when processing activities change materially.
