# Transformation Summary: Dental Clinic to Plastic Surgery Clinic

## ✅ Completed Changes

### 1. Database Schema (Prisma)
- ✅ Renamed `DentalCode` → `SurgicalProcedureCode`
- ✅ Renamed `DentalProcedure` → `SurgicalProcedure`
- ✅ Updated `Patient` model:
  - Removed: `dentalHistory`, `dentalChart`, `periodontalCharts`, `ppsScores`, `ppsTreatment`, `recallTerm`
  - Added: `surgicalHistory`, `beforeAfterPhotos`, `surgicalNotes`
- ✅ Updated `Image` model:
  - Removed: `toothNumber`, `side`
  - Added: `bodyArea`, `view`
- ✅ Updated `SurgicalProcedure` model:
  - Removed: `toothNumber`, `subSurfaces`, `fillingMaterial`
  - Added: `bodyArea`, `procedureType`, `anesthesiaType`
- ✅ Updated `UserRole` enum:
  - `DENTIST` → `PLASTIC_SURGEON`
  - `HYGIENIST` → `NURSE`
  - `ORTHODONTIST`, `PERIODONTOLOGIST`, `IMPLANTOLOGIST`, `ENDODONTIST` → `SURGEON`
  - `DENTAL_TECHNICIAN`, `DENTAL_LAB_TECHNICIAN` → `MEDICAL_ASSISTANT`
  - Added: `AESTHETIC_NURSE`, `COUNSELOR`, `PHOTOGRAPHER`
- ✅ Updated `ImageType` enum:
  - Replaced dental types with: `BEFORE_PHOTO`, `AFTER_PHOTO`, `PRE_OPERATIVE`, `POST_OPERATIVE`, `XRAY`, `CT_SCAN`, `MRI`, `ULTRASOUND`, `DOCUMENTATION`, `OTHER`
- ✅ Removed dental-specific models: `PpsRecord`, `ScreeningRecallRecord`, `CleaningRecallRecord`, `FluorideFlavor`
- ✅ Removed `PPSTreatment` enum

### 2. TypeScript Types
- ✅ Created `/src/types/surgical.ts` with:
  - `SurgicalProcedure` interface
  - `SurgicalProcedureCode` interface
  - `BodyArea` and `ProcedureType` types
  - Enums for surgical procedures

### 3. UI Updates
- ✅ Updated register page with plastic surgery roles
- ✅ Updated homepage marketing text
- ✅ Updated dashboard navigation icons (🦷 → 📸)
- ✅ Updated feature descriptions

### 4. SQL Migration Scripts
- ✅ Created `transform_to_plastic_surgery.sql` - main transformation script
- ✅ Created `update_enums.sql` - enum type updates
- ✅ Created `README_MIGRATION.md` - migration guide

## 🔄 Remaining Work

### 1. API Routes (High Priority)
Files to update:
- `src/app/api/dental-procedures/route.ts` → `surgical-procedures/route.ts`
- `src/app/api/patients/[id]/dental-procedures/route.ts` → `surgical-procedures/route.ts`
- `src/app/api/dental-codes/route.ts` → `surgical-procedure-codes/route.ts`
- Any other API routes referencing dental procedures

**Changes needed:**
- Rename routes from `dental-procedures` to `surgical-procedures`
- Update Prisma queries to use `SurgicalProcedure` and `SurgicalProcedureCode`
- Remove tooth-specific logic
- Add body area and procedure type handling

### 2. Components (High Priority)
Files to update/rename:
- `src/components/dental/DentalProcedureForm.tsx` → `surgical/SurgicalProcedureForm.tsx`
- `src/components/dental/DentalCodeSearch.tsx` → `surgical/SurgicalCodeSearch.tsx`
- `src/components/dental/DentalCodeBrowserModal.tsx` → `surgical/SurgicalCodeBrowserModal.tsx`
- `src/components/dental/DentalChart.tsx` → Remove or repurpose (no dental chart needed)
- `src/components/dental/TreatmentModal.tsx` → `surgical/SurgicalTreatmentModal.tsx`
- `src/components/patients/DentalHistoryForm.tsx` → `SurgicalHistoryForm.tsx`

**Changes needed:**
- Remove tooth selection UI
- Remove surface selection UI
- Add body area selection (face, breast, body, other)
- Add procedure type selection
- Update terminology throughout

### 3. Patient Detail Pages (High Priority)
Files to update:
- `src/app/dashboard/patients/[id]/page.tsx`
  - Remove dental chart component
  - Remove periodontal chart
  - Update procedure forms
  - Update history forms
  - Add before/after photo management

### 4. Data Files
Files to update:
- `src/data/dental-codes/` → `surgical-procedure-codes/`
  - Create new procedure codes for plastic surgery procedures:
    - Rhinoplasty
    - Blepharoplasty
    - Otoplasty
    - Face Lift
    - Breast Implants
    - Breast Lift
    - Gynecomastia
    - Liposuction
    - Abdominoplasty
    - Labiaplasty
    - Hyaluronic Acid Injections
    - Carpal Tunnel Surgery

### 5. Utility Files
Files to update:
- `src/lib/dental-utils.ts` → `surgical-utils.ts`
- `src/lib/dental-chart-builder.ts` → Remove or repurpose
- Update imports throughout codebase

### 6. Other Pages
- Update imaging page to handle before/after photos
- Update any references to "dental" in:
  - Dashboard pages
  - Settings pages
  - Print templates
  - Reports

## 📋 Procedure Codes for ArcaLIFE Clinic

Based on the website (https://www.estetica-arcalife.ro/), here are the procedures to add:

### Facial Surgery
- Rhinoplasty (Rinoplastie)
- Blepharoplasty (Blefaroplastie)
- Otoplasty (Otoplastie)
- Face Lift (Lifting Facial)

### Breast Surgery
- Breast Implants (Implanturi mamare)
- Breast Lift (Lifting mamar)
- Gynecomastia (Ginecomastie)

### Body Surgery
- Liposuction (Liposuctie)
- Abdominoplasty (Abdominoplastie)

### Other Procedures
- Labiaplasty (Labioplastie)
- Carpal Tunnel Syndrome (Sindrom Tunel Carpian)

### Non-Surgical
- Hyaluronic Acid Injections (Injectii cu Acid Hialuronic)

## 🚀 Next Steps

1. **Run Database Migration:**
   ```bash
   # Backup database first!
   psql -U your_username -d your_database -f prisma/migrations/transform_to_plastic_surgery.sql
   psql -U your_username -d your_database -f prisma/migrations/update_enums.sql
   npx prisma generate
   ```

2. **Update API Routes:**
   - Start with the main procedure routes
   - Test each endpoint after updating

3. **Update Components:**
   - Begin with procedure forms
   - Update patient detail pages
   - Remove dental-specific components

4. **Create Procedure Codes:**
   - Add all ArcaLIFE procedures to the database
   - Set appropriate pricing and categories

5. **Testing:**
   - Test patient creation
   - Test procedure creation
   - Test appointment scheduling
   - Test imaging upload
   - Test all major workflows

## 📝 Notes

- The dental chart component can be completely removed as it's not relevant for plastic surgery
- Before/after photo management should be a key feature
- Procedure codes should be simpler (no tooth/surface complexity)
- Focus on body areas and procedure types instead
- ASA scores are still relevant for surgical procedures

## 🔗 Related Files

- Database Schema: `prisma/schema.prisma`
- Migration Scripts: `prisma/migrations/`
- Types: `src/types/surgical.ts`
- Components: `src/components/dental/` (to be renamed/updated)

