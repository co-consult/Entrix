-- Restore 2026-2027 onboarding_key from archived 2025-2026 original_onboarding_key
-- Safe: originals are unique (10326) and only live on DISABLED source rows as placeholders.

BEGIN;

CREATE TEMP TABLE _pin_restore ON COMMIT DROP AS
SELECT
  t.id AS target_id,
  s.metadata->>'original_onboarding_key' AS original_pin
FROM physical_qr_codes t
JOIN physical_qr_codes s ON s.id = (t.metadata->>'previous_qr_id')::uuid
JOIN subscription_plans sp ON sp.id = t.subscription_plan_id
JOIN subscription_plans old_sp ON old_sp.id = s.subscription_plan_id
WHERE sp.metadata->>'season' = '2026-2027'
  AND old_sp.metadata->>'season' = '2025-2026'
  AND s.metadata->>'original_onboarding_key' IS NOT NULL;

-- Pre-check: no duplicate target PINs after restore
DO $$
DECLARE dup INT;
BEGIN
  SELECT COUNT(*) INTO dup FROM (
    SELECT original_pin FROM _pin_restore GROUP BY original_pin HAVING COUNT(*) > 1
  ) x;
  IF dup > 0 THEN
    RAISE EXCEPTION 'Duplicate original PIN in restore set';
  END IF;
END $$;

UPDATE physical_qr_codes t
SET
  onboarding_key = r.original_pin,
  metadata = (
    CASE
      WHEN t.metadata IS NULL OR t.metadata::text = 'null' THEN '{}'::jsonb
      WHEN jsonb_typeof(t.metadata) = 'object' THEN t.metadata
      ELSE '{}'::jsonb
    END
  ) || jsonb_build_object('pin_preserved_from_source', true),
  updated_at = NOW()
FROM _pin_restore r
WHERE t.id = r.target_id
  AND t.onboarding_key IS DISTINCT FROM r.original_pin;

COMMIT;

-- Post-check
SELECT
  COUNT(*) FILTER (WHERE t.onboarding_key = s.metadata->>'original_onboarding_key') AS pin_ok,
  COUNT(*) FILTER (WHERE t.onboarding_key IS DISTINCT FROM s.metadata->>'original_onboarding_key') AS pin_bad,
  COUNT(*) AS total
FROM physical_qr_codes t
JOIN physical_qr_codes s ON s.id = (t.metadata->>'previous_qr_id')::uuid
JOIN subscription_plans sp ON sp.id = t.subscription_plan_id
WHERE sp.metadata->>'season' = '2026-2027';

SELECT 'duplicate_pin' AS check_type, COUNT(*) FROM (
  SELECT onboarding_key FROM physical_qr_codes GROUP BY onboarding_key HAVING COUNT(*) > 1
) x;
