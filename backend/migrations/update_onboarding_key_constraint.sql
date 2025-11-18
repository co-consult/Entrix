-- ============================================================================
-- Migration: Update onboarding key constraint for CSS 2025 physical QR codes
-- ============================================================================
-- Date: 2025-07-30
-- Description: Update the onboarding key format constraint to accept NTRX:CSS:SUB:G6:2AWMFP format
--              instead of the previous ONB_YYYY_XXX_XXXXXXX format for CSS 2025 physical cards

-- Drop the existing constraint
ALTER TABLE physical_qr_codes DROP CONSTRAINT IF EXISTS chk_onboarding_key_format;

-- Add the new constraint that accepts both formats:
-- 1. Legacy format: ONB_YYYY_XXX_XXXXXXX (for backward compatibility)
-- 2. CSS 2025 format: XXXX-XXXX (for new physical cards)
ALTER TABLE physical_qr_codes ADD CONSTRAINT chk_onboarding_key_format 
CHECK (
    LENGTH(onboarding_key) >= 8 AND 
    (
        -- Legacy format: ONB_YYYY_XXX_XXXXXXX
        onboarding_key ~ '^ONB_\d{4}_[A-Z]{3}_[A-Z0-9]{6,}$' OR
        -- CSS 2025 format: XXXX-XXXX (4 alphanumeric chars, dash, 4 alphanumeric chars)
        onboarding_key ~ '^[A-Z0-9]{4}-[A-Z0-9]{4}$'
    )
);

-- Update the comment to reflect the new format
COMMENT ON COLUMN physical_qr_codes.onboarding_key IS 'Clé d''onboarding unique imprimée au dos de la carte pour conversion anonyme. Formats acceptés: ONB_YYYY_XXX_XXXXXXX ou XXXX-XXXX';

-- Log the migration
INSERT INTO schema_migrations (version, description, applied_at) 
VALUES (
    '2025-07-30-onboarding-key-format-update', 
    'Updated onboarding key constraint to accept CSS 2025 format XXXX-XXXX',
    NOW()
) ON CONFLICT (version) DO NOTHING; 