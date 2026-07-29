-- ============================================================================
-- Import printed Saison 2026/2027 physical QR codes into PRODUCTION
-- ============================================================================
-- Prerequisites:
--   1. Backup taken
--   2. 001_extend_serial_number_for_season.sql applied
--   3. setup-season-2026-2027.sql applied (plans *-2627 exist)
--   4. Staging table season_qr_import loaded from TSV
--
-- Does NOT touch events/tickets/orders. Only physical_qr_codes + frees PINs
-- on 2025/2026 cards that are superseded by the printed renewals.
-- ============================================================================

BEGIN;

-- Guard: abort if season QR already present
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM physical_qr_codes p
    JOIN subscription_plans sp ON sp.id = p.subscription_plan_id
    WHERE sp.metadata->>'season' = '2026-2027'
       OR sp.code LIKE '%-2627'
    LIMIT 1
  ) THEN
    RAISE EXCEPTION 'Saison 2026/2027 QR already exist — aborting import';
  END IF;
END $$;

-- 1) Archive old cards whose PIN will be reused by imported new cards
--    Match via previous_qr_code stored in import metadata.
UPDATE physical_qr_codes old_p
SET
  status = 'DISABLED',
  disabled_at = COALESCE(old_p.disabled_at, NOW()),
  onboarding_key = (
    upper(substr(md5('ret1' || old_p.id::text), 1, 4)) || '-' ||
    upper(substr(md5('ret2' || old_p.id::text), 1, 4))
  ),
  metadata = (
    CASE
      WHEN old_p.metadata IS NULL OR old_p.metadata::text = 'null' THEN '{}'::jsonb
      WHEN jsonb_typeof(old_p.metadata) = 'object' THEN old_p.metadata
      ELSE '{}'::jsonb
    END
  ) || jsonb_build_object(
    'archived_reason', 'season_migration_2026-2027',
    'archived_at', NOW()::text,
    'original_onboarding_key', old_p.onboarding_key,
    'original_status', old_p.status::text,
    'migration_target_season', '2026-2027'
  ),
  updated_at = NOW()
WHERE old_p.id IN (
  SELECT old2.id
  FROM season_qr_import i
  JOIN physical_qr_codes old2
    ON old2.qr_code = (i.metadata_json::jsonb->>'previous_qr_code')
  WHERE i.metadata_json::jsonb->>'previous_qr_code' IS NOT NULL
);

-- 2) Insert new season QR (exact printed identity)
INSERT INTO physical_qr_codes (
  id,
  qr_code,
  onboarding_key,
  serial_number,
  subscription_plan_id,
  card_batch,
  card_type,
  status,
  printed_at,
  metadata,
  created_at,
  updated_at
)
SELECT
  gen_random_uuid(),
  i.qr_code,
  i.onboarding_key,
  i.serial_number,
  sp.id,
  NULLIF(i.card_batch, ''),
  COALESCE(NULLIF(i.card_type, ''), 'STANDARD'),
  'AVAILABLE'::physical_qr_status,
  NOW(),
  (
    COALESCE(i.metadata_json::jsonb, '{}'::jsonb)
    - 'previous_qr_id'
  ) || jsonb_build_object(
    'season', '2026-2027',
    'imported_from_preprod', true,
    'imported_at', NOW()::text,
    'previous_qr_id', old_p.id
  ),
  NOW(),
  NOW()
FROM season_qr_import i
JOIN subscription_plans sp ON sp.code = i.plan_code
LEFT JOIN physical_qr_codes old_p
  ON old_p.qr_code = (i.metadata_json::jsonb->>'previous_qr_code');

-- Sanity checks inside transaction
DO $$
DECLARE
  imported int;
  archived int;
  pin_dups int;
BEGIN
  SELECT COUNT(*) INTO imported
  FROM physical_qr_codes p
  JOIN subscription_plans sp ON sp.id = p.subscription_plan_id
  WHERE sp.metadata->>'season' = '2026-2027';

  IF imported <> 10326 THEN
    RAISE EXCEPTION 'Expected 10326 imported QR, got %', imported;
  END IF;

  SELECT COUNT(*) INTO archived
  FROM physical_qr_codes p
  JOIN subscription_plans sp ON sp.id = p.subscription_plan_id
  WHERE sp.metadata->>'season' = '2025-2026'
    AND p.status = 'DISABLED'
    AND p.metadata->>'archived_reason' = 'season_migration_2026-2027';

  IF archived < 10000 THEN
    RAISE EXCEPTION 'Expected ~10326 archived old QR, got %', archived;
  END IF;

  SELECT COUNT(*) INTO pin_dups
  FROM (
    SELECT onboarding_key
    FROM physical_qr_codes
    GROUP BY onboarding_key
    HAVING COUNT(*) > 1
  ) d;

  IF pin_dups > 0 THEN
    RAISE EXCEPTION 'PIN uniqueness broken: % duplicate keys', pin_dups;
  END IF;
END $$;

COMMIT;

SELECT
  sp.code,
  COUNT(*) AS qr_count,
  COUNT(*) FILTER (WHERE p.status = 'AVAILABLE') AS available
FROM physical_qr_codes p
JOIN subscription_plans sp ON sp.id = p.subscription_plan_id
WHERE sp.metadata->>'season' = '2026-2027'
GROUP BY sp.code
ORDER BY sp.code;
