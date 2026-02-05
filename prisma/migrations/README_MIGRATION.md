# Database Migration Guide: Dental Clinic to Plastic Surgery Clinic

This guide explains how to migrate your database from a dental clinic structure to a plastic surgery clinic structure.

## Prerequisites

1. **Backup your database** before running any migrations
2. Ensure you have PostgreSQL admin access
3. Review all migration scripts before executing

## Migration Steps

### Step 1: Run the Main Transformation Script

```bash
psql -U your_username -d your_database -f prisma/migrations/transform_to_plastic_surgery.sql
```

This script:
- Renames `DentalCode` to `SurgicalProcedureCode`
- Renames `DentalProcedure` to `SurgicalProcedure`
- Removes dental-specific fields (toothNumber, subSurfaces, fillingMaterial)
- Adds surgical-specific fields (bodyArea, procedureType, anesthesiaType)
- Removes dental-specific tables (PpsRecord, ScreeningRecallRecord, CleaningRecallRecord, FluorideFlavor)
- Updates Patient table fields

### Step 2: Update Enum Types

```bash
psql -U your_username -d your_database -f prisma/migrations/update_enums.sql
```

This script:
- Updates `UserRole` enum to include plastic surgery roles
- Updates `ImageType` enum to include surgical imaging types
- Migrates existing data to new enum values

### Step 3: Run Prisma Migrate

After running the SQL scripts, update your Prisma schema and generate the client:

```bash
npx prisma generate
npx prisma db pull  # This will sync your schema with the database
```

### Step 4: Verify Migration

1. Check that all tables were renamed correctly
2. Verify that enum values were updated
3. Ensure foreign key constraints are intact
4. Test that existing data is accessible

## Data Migration Notes

### User Roles Mapping

- `DENTIST` → `PLASTIC_SURGEON`
- `HYGIENIST` → `NURSE`
- `ORTHODONTIST`, `PERIODONTOLOGIST`, `IMPLANTOLOGIST`, `ENDODONTIST` → `SURGEON`
- `DENTAL_TECHNICIAN`, `DENTAL_LAB_TECHNICIAN` → `MEDICAL_ASSISTANT`
- Other roles remain unchanged

### Image Types Mapping

- `BITEWING`, `OPG`, `PANORAMIC` → `XRAY`
- `CBCT` → `CT_SCAN`
- `SOLO`, `INTRAORAL`, `EXTRAORAL` → `DOCUMENTATION`
- All other types → `OTHER`

### Procedure Data

- Existing procedures will lose `toothNumber`, `subSurfaces`, and `fillingMaterial` data
- You may want to export this data before migration if needed for reference
- New fields (`bodyArea`, `procedureType`, `anesthesiaType`) will be NULL and need to be populated

## Rollback

If you need to rollback, restore from your backup. The migration scripts do not include rollback procedures as they involve data loss (dental-specific fields).

## Post-Migration Tasks

1. Update application code to use new table/field names
2. Populate new fields with appropriate data
3. Update any stored procedures or views
4. Update API endpoints
5. Test all functionality

## Support

If you encounter issues during migration, check:
- PostgreSQL logs for errors
- Foreign key constraint violations
- Enum value mismatches
- Missing indexes

