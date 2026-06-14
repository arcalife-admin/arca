# Data Subject Request (DSR) Standard Operating Procedure

**GDPR Articles 15–22**  
**Last updated:** June 2026

---

## 1. Roles

| Role | Responsibility |
|------|----------------|
| **Data subject (patient)** | Submits request to the clinic |
| **Clinic (controller)** | Receives request, verifies identity, responds within 30 days |
| **ArcaLife (processor)** | Provides technical assistance via export/erasure APIs |

## 2. Request channels

Patients submit requests to the clinic directly (reception, email, written form). Clinics may forward requests to ArcaLife support at security@arcalife.ro for technical assistance.

## 3. Request types and handling

### 3.1 Right of access (Art. 15) — Export

1. Clinic verifies patient identity
2. Clinic manager uses ArcaLife or requests export via API:
   - `GET /api/patients/{id}/export` (manager-authenticated)
3. ArcaLife returns JSON bundle containing:
   - Patient demographics and health data
   - Appointments, procedures, notes, treatments
   - File and image metadata (signed URLs for media)
   - Activity log entries related to the patient
4. Clinic delivers export to patient within **30 days** (extendable by 60 days with notice)

### 3.2 Right to rectification (Art. 16)

Clinic staff corrects records directly in ArcaLife patient profile. No ArcaLife involvement required unless technical issue.

### 3.3 Right to erasure (Art. 17) — Deletion

1. Clinic verifies identity and legal basis for erasure (consent withdrawn, no overriding legal obligation)
2. Clinic manager initiates GDPR erasure:
   - `POST /api/patients/{id}/erase` (manager-authenticated)
3. ArcaLife:
   - Deletes Cloudinary clinical media
   - Anonymizes or deletes patient record and cascaded related data
   - Writes audit log entry (`GDPR_ERASURE`)
4. Clinic confirms completion to patient

**Exceptions:** Data required for legal claims, public health, or medical record retention laws may be retained in anonymized form per clinic legal advice.

### 3.4 Right to restriction (Art. 18)

Clinic sets `isDisabled` on patient record with reason. Processing limited to storage only.

### 3.5 Right to portability (Art. 20)

Export API provides machine-readable JSON. Clinic delivers to patient or designated recipient.

### 3.6 Right to object (Art. 21)

Handled by clinic per legal advice. ArcaLife assists with erasure or restriction as instructed.

## 4. SLA

| Step | Timeline |
|------|----------|
| Clinic acknowledges patient request | 3 business days |
| ArcaLife technical assistance (if needed) | 5 business days |
| Clinic response to patient | 30 days (GDPR default) |

## 5. Logging

All DSR-related exports and erasures are recorded in the ActivityLog with action `EXPORT_DATA` or `GDPR_ERASURE`.

## 6. Review

This SOP is reviewed **annually**.
