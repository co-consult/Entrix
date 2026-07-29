-- ============================================================================
-- Generate physical QR codes for Saison 2026/2027
-- ============================================================================
-- Clones every 2025/2026 QR into a new row on the matching *-2627 plan:
--   • serial_number: 26 + old 4-digit serial (0859 → 260859)
--   • qr_code: new unique suffix, same zone & type (SUB/SUBVB)
--   • onboarding_key (PIN): ALWAYS kept from source (same as 2025/2026 original)
--   • metadata: zone, entry_gate, seat copied
--   • status: AVAILABLE (fresh cards for printing/sale)
--
-- Idempotent: skips if any QR already exists on a *-2627 plan.
-- ============================================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Helper: unique QR suffix from source row id (8 chars, guaranteed unique per id)
CREATE OR REPLACE FUNCTION _season_qr_suffix(source_id UUID, salt TEXT)
RETURNS TEXT AS $$
  SELECT upper(substr(replace(source_id::text, '-', ''), 20, 8));
$$ LANGUAGE SQL IMMUTABLE;

-- Helper: deterministic onboarding key XXXX-XXXX for new stock cards
CREATE OR REPLACE FUNCTION _season_onboarding_key(source_id UUID)
RETURNS TEXT AS $$
  SELECT
    upper(substr(encode(digest('onb1' || source_id::text, 'sha256'), 'hex'), 1, 4))
    || '-'
    || upper(substr(encode(digest('onb2' || source_id::text, 'sha256'), 'hex'), 1, 4));
$$ LANGUAGE SQL IMMUTABLE;

-- Helper: archived PIN placeholder (XXXX-XXXX format for DB constraint)
CREATE OR REPLACE FUNCTION _season_archived_pin(source_id UUID)
RETURNS TEXT AS $$
  SELECT
    upper(substr(encode(digest('ret1' || source_id::text, 'sha256'), 'hex'), 1, 4))
    || '-'
    || upper(substr(encode(digest('ret2' || source_id::text, 'sha256'), 'hex'), 1, 4));
$$ LANGUAGE SQL IMMUTABLE;

DO $$
DECLARE
  existing_count INT;
  inserted_count INT;
BEGIN
  SELECT COUNT(*) INTO existing_count
  FROM physical_qr_codes pqc
  JOIN subscription_plans sp ON sp.id = pqc.subscription_plan_id
  WHERE sp.code LIKE '%-2627';

  IF existing_count > 0 THEN
    RAISE NOTICE '2026/2027 QR codes already exist (% rows) — skipping generation.', existing_count;
    RETURN;
  END IF;

  -- Stash original PINs before freeing unique constraint
  CREATE TEMP TABLE _qr_season_migration ON COMMIT DROP AS
  SELECT
    old_pqc.id,
    old_pqc.onboarding_key AS original_pin,
    old_pqc.status AS original_status,
    old_pqc.serial_number AS original_serial,
    old_pqc.qr_code AS original_qr_code,
    new_sp.id AS new_plan_id
  FROM physical_qr_codes old_pqc
  JOIN subscription_plans old_sp ON old_sp.id = old_pqc.subscription_plan_id
  JOIN subscription_plans new_sp ON new_sp.metadata->>'previous_plan_id' = old_sp.id::text
  WHERE old_sp.metadata->>'season' = '2025-2026'
    AND old_sp.code NOT LIKE '%-2627';

  -- Archive old cards: free PINs & QR codes for renewals, keep rows for history
  UPDATE physical_qr_codes old_pqc
  SET
    status = 'DISABLED',
    disabled_at = NOW(),
    onboarding_key = _season_archived_pin(old_pqc.id),
    metadata = (
      CASE
        WHEN old_pqc.metadata IS NULL OR old_pqc.metadata::text = 'null' THEN '{}'::jsonb
        WHEN jsonb_typeof(old_pqc.metadata) = 'object' THEN old_pqc.metadata
        ELSE '{}'::jsonb
      END
    ) || jsonb_build_object(
      'archived_reason', 'season_2026_2027_migration',
      'archived_at', NOW()::text,
      'original_onboarding_key', m.original_pin,
      'original_status', m.original_status::text
    ),
    updated_at = NOW()
  FROM _qr_season_migration m
  WHERE old_pqc.id = m.id;

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
    'NTRX:CSS:'
      || split_part(m.original_qr_code, ':', 3)
      || ':'
      || split_part(m.original_qr_code, ':', 4)
      || ':'
      || _season_qr_suffix(m.id, 'qr2627'),
    m.original_pin,
    '26' || lpad(regexp_replace(m.original_serial, '[^0-9]', '', 'g'), 4, '0'),
    m.new_plan_id,
    COALESCE(
      NULLIF(replace(old_pqc.card_batch, '2025', '2026'), ''),
      'BATCH_' || replace(new_sp.code, '-2627', '') || '_2627'
    ),
    COALESCE(old_pqc.card_type, 'STANDARD'),
    'AVAILABLE'::physical_qr_status,
    NOW(),
    (
      CASE
        WHEN old_pqc.metadata IS NULL OR old_pqc.metadata::text = 'null' THEN '{}'::jsonb
        WHEN jsonb_typeof(old_pqc.metadata) = 'object' THEN old_pqc.metadata
        ELSE '{}'::jsonb
      END
    ) || jsonb_build_object(
      'season', '2026-2027',
      'previous_serial', m.original_serial,
      'previous_qr_code', m.original_qr_code,
      'previous_qr_id', m.id::text,
      'renewal_pin_preserved', (m.original_status = 'ASSIGNED'),
      'source_status', m.original_status::text
    ),
    NOW(),
    NOW()
  FROM _qr_season_migration m
  JOIN physical_qr_codes old_pqc ON old_pqc.id = m.id
  JOIN subscription_plans new_sp ON new_sp.id = m.new_plan_id;

  GET DIAGNOSTICS inserted_count = ROW_COUNT;
  RAISE NOTICE 'Inserted % new QR codes for Saison 2026/2027.', inserted_count;
END $$;

-- Verify uniqueness (should return 0 rows)
SELECT 'duplicate_serial' AS check_type, serial_number, COUNT(*)
FROM physical_qr_codes
GROUP BY serial_number
HAVING COUNT(*) > 1
UNION ALL
SELECT 'duplicate_qr', qr_code, COUNT(*)
FROM physical_qr_codes
GROUP BY qr_code
HAVING COUNT(*) > 1
UNION ALL
SELECT 'duplicate_pin', onboarding_key, COUNT(*)
FROM physical_qr_codes
GROUP BY onboarding_key
HAVING COUNT(*) > 1;

COMMIT;

-- Summary per plan
SELECT
  sp.code,
  sp.metadata->>'season' AS season,
  pqc.status,
  COUNT(*) AS cnt,
  MIN(pqc.serial_number) AS min_serial,
  MAX(pqc.serial_number) AS max_serial
FROM physical_qr_codes pqc
JOIN subscription_plans sp ON sp.id = pqc.subscription_plan_id
GROUP BY sp.code, sp.metadata->>'season', pqc.status
ORDER BY season, sp.code, pqc.status;
