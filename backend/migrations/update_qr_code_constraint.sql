-- ============================================================================
-- Migration: Update QR code constraint for CSS 2025 physical QR codes
-- ============================================================================
-- Date: 2025-07-30
-- Description: Update the QR code format constraint to accept colons for CSS 2025 physical cards
--              that use format like NTRX:CSS:SUB:G6:2AWMFP

-- Drop the existing constraint
ALTER TABLE physical_qr_codes DROP CONSTRAINT IF EXISTS chk_physical_qr_code_format;

-- Add the new constraint that accepts both formats:
-- 1. Legacy format: alphanumeric, underscores, hyphens
-- 2. CSS 2025 format: alphanumeric, underscores, hyphens, colons
ALTER TABLE physical_qr_codes ADD CONSTRAINT chk_physical_qr_code_format 
CHECK (
    LENGTH(qr_code) >= 10 AND 
    qr_code ~ '^[A-Z0-9_:-]+$'
);

-- Update the comment to reflect the new format
COMMENT ON COLUMN physical_qr_codes.qr_code IS 'QR code unique imprimé sur la face de la carte physique. Formats acceptés: alphanumérique, tirets, underscores, et deux-points pour CSS 2025';

-- Log the migration
INSERT INTO schema_migrations (version, description, applied_at) 
VALUES (
    '2025-07-30-qr-code-format-update', 
    'Updated QR code constraint to accept colons for CSS 2025 format NTRX:CSS:SUB:G6:XXXXXX',
    NOW()
) ON CONFLICT (version) DO NOTHING; 