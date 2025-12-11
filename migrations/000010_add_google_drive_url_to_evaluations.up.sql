-- ================================
-- Add google_drive_url to evaluations table
-- ================================
-- Allows vendors to share additional photos via Google Drive link
ALTER TABLE evaluations
ADD COLUMN IF NOT EXISTS google_drive_url VARCHAR(500) NULL;

-- Add comment
COMMENT ON COLUMN evaluations.google_drive_url IS 'Optional Google Drive link for additional photos beyond the 5 photo limit';
