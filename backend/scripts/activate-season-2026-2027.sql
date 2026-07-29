-- ============================================================================
-- Close Saison 2025/2026 sales & activate Saison 2026/2027 (football)
-- ============================================================================
-- Safe to re-run.
-- VB plans (GRADINS_VB-2627, CHAISE_VB-2627) keep November sale start.
-- ============================================================================

BEGIN;

-- 1. Close all 2025/2026 plans for sales (historical data untouched)
UPDATE subscription_plans
SET
  metadata = (
    CASE
      WHEN metadata IS NULL OR metadata::text = 'null' THEN '{}'::jsonb
      WHEN jsonb_typeof(metadata) = 'object' THEN metadata
      ELSE '{}'::jsonb
    END
  ) || jsonb_build_object('sales_closed', true),
  sale_end_date = LEAST(COALESCE(sale_end_date, CURRENT_DATE), CURRENT_DATE - 1),
  updated_at = NOW()
WHERE metadata->>'season' = '2025-2026'
  AND code NOT LIKE '%-2627';

-- 2. Open 2026/2027 football plans for sale now
UPDATE subscription_plans
SET
  sale_start_date = CURRENT_DATE,
  sale_end_date = '2027-06-30',
  is_active = true,
  updated_at = NOW()
WHERE metadata->>'season' = '2026-2027'
  AND code NOT IN ('GRADINS_VB-2627', 'CHAISE_VB-2627');

COMMIT;

SELECT
  code,
  metadata->>'season' AS season,
  metadata->>'sales_closed' AS sales_closed,
  sale_start_date,
  sale_end_date,
  is_active
FROM subscription_plans
ORDER BY metadata->>'season', code;
