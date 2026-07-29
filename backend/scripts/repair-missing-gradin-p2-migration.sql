-- Insert 2 missing GRADIN-P2 cards into 2026-2027 (serials 3285, 3286)
-- Root cause: archived on source but target row never created during initial migration.

BEGIN;

INSERT INTO physical_qr_codes (
  id, qr_code, onboarding_key, serial_number, subscription_plan_id,
  card_batch, card_type, status, printed_at, metadata, created_at, updated_at
) VALUES
(
  gen_random_uuid(),
  'NTRX:CSS:SUB:G3:F2746AA9',
  'HXVM-Y9FB',
  '263285',
  (SELECT id FROM subscription_plans WHERE code = 'GRADIN-P2-2627'),
  'BATCH_GRADINS3_2026',
  'STANDARD',
  'AVAILABLE',
  NOW(),
  jsonb_build_object(
    'zone', 'Gradins3',
    'entry_gate', 'Porte2',
    'season', '2026-2027',
    'previous_serial', '3285',
    'previous_qr_code', 'NTRX:CSS:SUB:G3:W2897P',
    'previous_qr_id', 'c2bedd6e-0e5a-490f-9f8f-2746aa98466e',
    'renewal_pin_preserved', true,
    'pin_preserved_from_source', true,
    'source_status', 'ASSIGNED',
    'migration_source_season', '2025-2026',
    'migration_repair', 'missing_duplicate_2026-06-22'
  ),
  NOW(), NOW()
),
(
  gen_random_uuid(),
  'NTRX:CSS:SUB:G3:02C5AF57',
  'VAU3-9K72',
  '263286',
  (SELECT id FROM subscription_plans WHERE code = 'GRADIN-P2-2627'),
  'BATCH_GRADINS3_2026',
  'STANDARD',
  'AVAILABLE',
  NOW(),
  jsonb_build_object(
    'zone', 'Gradins3',
    'entry_gate', 'Porte2',
    'season', '2026-2027',
    'previous_serial', '3286',
    'previous_qr_code', 'NTRX:CSS:SUB:G3:FK424Q',
    'previous_qr_id', 'a0260302-17fd-4008-86c0-2c5af573bd07',
    'renewal_pin_preserved', true,
    'pin_preserved_from_source', true,
    'source_status', 'ASSIGNED',
    'migration_source_season', '2025-2026',
    'migration_repair', 'missing_duplicate_2026-06-22'
  ),
  NOW(), NOW()
);

COMMIT;

-- Verify
SELECT COUNT(*) FILTER (WHERE sp.metadata->>'season' = '2025-2026') as qr_2526,
       COUNT(*) FILTER (WHERE sp.metadata->>'season' = '2026-2027') as qr_2627
FROM physical_qr_codes p
JOIN subscription_plans sp ON sp.id = p.subscription_plan_id;

SELECT COUNT(*) missing
FROM physical_qr_codes s
JOIN subscription_plans sp ON sp.id = s.subscription_plan_id
WHERE sp.metadata->>'season' = '2025-2026'
  AND NOT EXISTS (
    SELECT 1 FROM physical_qr_codes t WHERE t.metadata->>'previous_qr_id' = s.id::text
  );
