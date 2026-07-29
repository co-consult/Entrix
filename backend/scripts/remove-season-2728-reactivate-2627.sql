-- Remove season 2027-2028 and re-activate season 2026-2027 QR stock.
-- Safe: 0 subscriptions on 27-28, 0 assigned QRs on 27-28.

BEGIN;

-- 1) Delete 27-28 QR codes
DELETE FROM physical_qr_codes p
USING subscription_plans sp
WHERE p.subscription_plan_id = sp.id
  AND sp.metadata->>'season' = '2027-2028';

-- 2) Clear successor links on 26-27 plans
UPDATE subscription_plans sp26
SET metadata = sp26.metadata - 'successor_plan_id'
FROM subscription_plans sp28
WHERE sp28.metadata->>'season' = '2027-2028'
  AND sp26.metadata->>'successor_plan_id' = sp28.id::text;

-- 3) Delete 27-28 plan zones then plans
DELETE FROM subscription_plan_zones spz
USING subscription_plans sp
WHERE spz.subscription_plan_id = sp.id
  AND sp.metadata->>'season' = '2027-2028';

DELETE FROM subscription_plans
WHERE metadata->>'season' = '2027-2028';

-- 4) Re-activate 26-27 cards archived for 27-28 migration
UPDATE physical_qr_codes p
SET
  status = 'AVAILABLE',
  disabled_at = NULL,
  onboarding_key = COALESCE(p.metadata->>'original_onboarding_key', p.onboarding_key),
  metadata = (
    CASE
      WHEN p.metadata IS NULL OR p.metadata::text = 'null' THEN '{}'::jsonb
      WHEN jsonb_typeof(p.metadata) = 'object' THEN p.metadata
      ELSE '{}'::jsonb
    END
  ) - 'archived_reason' - 'archived_at' - 'migration_target_season',
  updated_at = NOW()
FROM subscription_plans sp
WHERE p.subscription_plan_id = sp.id
  AND sp.metadata->>'season' = '2026-2027'
  AND p.status = 'DISABLED'
  AND p.metadata->>'archived_reason' = 'season_migration_2027-2028';

COMMIT;

-- Verification
SELECT sp.metadata->>'season' AS season, p.status, COUNT(*)
FROM physical_qr_codes p
JOIN subscription_plans sp ON sp.id = p.subscription_plan_id
WHERE sp.metadata->>'season' IN ('2026-2027', '2027-2028')
GROUP BY 1, 2 ORDER BY 1, 2;

SELECT COUNT(*) AS plans_2728 FROM subscription_plans WHERE metadata->>'season' = '2027-2028';

SELECT COUNT(*) AS unmigrated_2526
FROM physical_qr_codes s
JOIN subscription_plans sp ON sp.id = s.subscription_plan_id
WHERE sp.metadata->>'season' = '2025-2026'
  AND NOT EXISTS (
    SELECT 1 FROM physical_qr_codes t
    WHERE t.metadata->>'previous_qr_id' = s.id::text
  );

SELECT COUNT(*) FILTER (WHERE t.onboarding_key = s.metadata->>'original_onboarding_key') pin_ok,
       COUNT(*) total
FROM physical_qr_codes t
JOIN physical_qr_codes s ON s.id = (t.metadata->>'previous_qr_id')::uuid
JOIN subscription_plans sp ON sp.id = t.subscription_plan_id
WHERE sp.metadata->>'season' = '2026-2027';

SELECT COUNT(*) duplicate_pins FROM (
  SELECT onboarding_key FROM physical_qr_codes GROUP BY 1 HAVING COUNT(*) > 1
) x;
