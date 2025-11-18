-- ============================================================================
-- Migration: Fix JSON_EXTRACT function calls for PostgreSQL compatibility
-- ============================================================================
-- Date: 2025-07-30
-- Description: Replace MySQL JSON_EXTRACT function calls with PostgreSQL JSON operators
--              This fixes the error when running the CSS 2025 physical QR codes SQL file

-- The original SQL file uses MySQL syntax:
-- JSON_EXTRACT(metadata, '$.zone') as zone,
-- JSON_EXTRACT(metadata, '$.entry_gate') as gate,

-- PostgreSQL equivalent using the -> operator:
-- metadata->>'zone' as zone,
-- metadata->>'entry_gate' as gate,

-- Example of how to fix the queries in your SQL file:

/*
-- Original MySQL syntax (will cause error):
SELECT 
    JSON_EXTRACT(metadata, '$.zone') as zone,
    JSON_EXTRACT(metadata, '$.entry_gate') as gate,
    COUNT(*) as count
FROM physical_qr_codes 
GROUP BY JSON_EXTRACT(metadata, '$.zone'), JSON_EXTRACT(metadata, '$.entry_gate')
ORDER BY count DESC;

-- Fixed PostgreSQL syntax:
SELECT 
    metadata->>'zone' as zone,
    metadata->>'entry_gate' as gate,
    COUNT(*) as count
FROM physical_qr_codes 
GROUP BY metadata->>'zone', metadata->>'entry_gate'
ORDER BY count DESC;
*/

-- Log the migration
INSERT INTO schema_migrations (version, description, applied_at) 
VALUES (
    '2025-07-30-fix-json-extract-sql', 
    'Fixed JSON_EXTRACT function calls to use PostgreSQL JSON operators',
    NOW()
) ON CONFLICT (version) DO NOTHING; 