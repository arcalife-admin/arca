# Database Seeding Documentation

This document explains how the database seeding works in the Dentiva application.

## Overview

The database is automatically seeded with essential data whenever you reset or initialize the database. This ensures that critical tables like `DentalCode`, `InstructionVideo`, and `InstructionImage` are always populated with the necessary data.

## What Gets Seeded

### 1. Dental Codes (334 codes total)
- **A-codes**: 4 codes - Anesthesia
- **B-codes**: 3 codes - Basic procedures  
- **C-codes**: 14 codes - Consultations
- **E-codes**: 41 codes - Examinations
- **F-codes**: 31 codes - Fillings
- **G-codes**: 23 codes - General procedures
- **H-codes**: 26 codes - Hygiene procedures
- **J-codes**: 63 codes - Jaw/Joint procedures
- **M-codes**: 10 codes - Mouth procedures
- **P-codes**: 31 codes - Prosthetics
- **R-codes**: 31 codes - Root canal procedures
- **T-codes**: 25 codes - Tooth procedures
- **U-codes**: 4 codes - Urgent procedures
- **V-codes**: 17 codes - Various procedures
- **X-codes**: 9 codes - X-ray procedures
- **Y-codes**: 2 codes - Special procedures

### 2. Instruction Videos (8 videos)
- How Braces Work
- Dry Socket
- Wisdom Tooth Extraction
- Root Canal Treatment
- Dental Veneers
- 3D Printed Nightguards - Step by Step Tutorial
- Night Guard for Teeth - How It's Made and Fitted
- Overdenture with Dental Implants (3D Animation)

### 3. Instruction Images (9 images)
- Crowns
- Implants
- Tooth Extraction
- Fillings
- Braces
- Dentures
- Partial Dentures
- Frame Prosthesis
- Splints

## How It Works

### Automatic Seeding
The database is automatically seeded in the following scenarios:

1. **After `prisma migrate reset`** - The seed script runs automatically
2. **After `prisma migrate dev`** - When creating new migrations
3. **Manual execution** - Using `npm run db:seed`

### Seed Script Configuration
The seeding is configured in `package.json`:

```json
{
  "prisma": {
    "seed": "node prisma/seed.cjs"
  },
  "scripts": {
    "db:seed": "node prisma/seed.cjs",
    "db:reset": "npm run build:codes && prisma migrate reset --force && prisma db seed"
  }
}
```

### Seed Script Location
The main seed script is located at `prisma/seed.cjs`.

## Available Commands

### Manual Database Reset with Seeding
```bash
npm run db:reset
```
This command:
1. Builds the dental codes TypeScript files
2. Resets the database completely
3. Applies all migrations
4. Runs the seed script automatically

### Manual Seeding Only
```bash
npm run db:seed
```
This command runs only the seeding process without resetting the database.

### Build Dental Codes
```bash
npm run build:codes
```
This command compiles the TypeScript dental code files to JavaScript, which is required before seeding.

## Important Notes

### Prerequisites
- The dental codes must be built (`npm run build:codes`) before seeding
- The database schema must be up to date with migrations

### Upsert Behavior
The seed script uses `upsert` operations, which means:
- If a record already exists (by unique key), it will be updated
- If a record doesn't exist, it will be created
- This prevents duplicate entries and allows safe re-running

### Custom vs Default Content
- **Dental codes**: Always marked as system data
- **Instructions**: Default content is marked with `isCustom: false`
- User-added instruction videos and images are marked with `isCustom: true`
- Only custom content can be deleted through the UI

## Troubleshooting

### Dental Codes Not Loading
If dental codes aren't being imported:
1. Run `npm run build:codes` to ensure TypeScript files are compiled
2. Check that files exist in `dist/data/dental-codes/`
3. Run `npm run db:seed` manually to see detailed output

### Missing Instruction Tables
If instruction videos/images fail to import:
1. Ensure the latest migrations have been applied
2. Check that `InstructionVideo` and `InstructionImage` tables exist in the database
3. Run `npx prisma migrate dev` to apply any pending migrations

### Verifying Seed Success
You can verify the seed worked by checking record counts:
- Dental codes: Should have ~334 records
- Instruction videos: Should have 8 records  
- Instruction images: Should have 9 records

Use Prisma Studio to inspect the database:
```bash
npx prisma studio
```

## File Structure

```
prisma/
  └── seed.cjs              # Main seed script
dist/data/dental-codes/     # Compiled JavaScript dental code files
src/data/dental-codes/      # TypeScript source files for dental codes
scripts/
  └── import-all-codes.js   # Legacy import script (still available)
```

This seeding system ensures that your database always has the essential data needed for the Dentiva application to function properly, especially for patient dental procedures which depend on the dental codes. 