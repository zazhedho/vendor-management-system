-- ================================
-- Remove google_drive_url from evaluations table
-- ================================
ALTER TABLE evaluations
DROP COLUMN IF EXISTS google_drive_url;
