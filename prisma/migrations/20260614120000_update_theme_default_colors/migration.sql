-- Align stored theme defaults with current brand colors (blue -> red)
-- Only updates rows that still have the old factory defaults unchanged.

UPDATE "OrganizationThemeSettings"
SET
  "primaryColor" = '#ef4444',
  "infoColor" = '#ef4444'
WHERE "primaryColor" = '#3b82f6'
  AND "infoColor" = '#3b82f6';

UPDATE "PersonalThemeSettings"
SET
  "primaryColor" = '#ef4444',
  "infoColor" = '#ef4444'
WHERE "primaryColor" = '#3b82f6'
  AND "infoColor" = '#3b82f6';
