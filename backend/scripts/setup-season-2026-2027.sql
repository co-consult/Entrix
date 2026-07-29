-- ============================================================================
-- Setup Saison 2026/2027 — subscription plans
-- ============================================================================
-- Strategy:
--   • Keep existing plans as Saison 2025/2026 (historical data unchanged)
--   • Clone 11 plans for Saison 2026/2027 with new codes (*-2627)
--   • Link seasons in metadata (previous_plan_id / successor_plan_id)
--   • Old plans: sales_closed = true when new season sale opens (2026-07-01)
--
-- Safe to re-run: skips if CENTRALE-2627 already exists.
-- ============================================================================

BEGIN;

-- ── 1. Tag existing plans as 2025/2026 ─────────────────────────────────────
UPDATE subscription_plans sp
SET
  metadata = (
    CASE
      WHEN sp.metadata IS NULL OR sp.metadata::text = 'null' THEN '{}'::jsonb
      WHEN jsonb_typeof(sp.metadata) = 'object' THEN sp.metadata
      ELSE '{}'::jsonb
    END
  ) || jsonb_build_object(
    'season', '2025-2026',
    'season_label', 'Saison 2025/2026',
    'serial_prefix', null
  ),
  updated_at = NOW()
WHERE sp.code NOT LIKE '%-2627'
  AND COALESCE(
    CASE WHEN jsonb_typeof(sp.metadata) = 'object' THEN sp.metadata->>'season' END,
    ''
  ) <> '2025-2026';

-- ── 2. Clone plans for 2026/2027 (skip if already done) ───────────────────
DO $$
DECLARE
  r RECORD;
  new_id UUID;
  new_code VARCHAR(50);
  new_name VARCHAR(200);
  is_vb BOOLEAN;
  v_valid_from DATE;
  v_valid_until DATE;
  v_sale_start DATE;
  v_sale_end DATE;
BEGIN
  IF EXISTS (SELECT 1 FROM subscription_plans WHERE code = 'CENTRALE-2627') THEN
    RAISE NOTICE 'Saison 2026/2027 plans already exist — skipping clone.';
    RETURN;
  END IF;

  FOR r IN
    SELECT * FROM subscription_plans
    WHERE COALESCE(metadata->>'season', '2025-2026') = '2025-2026'
      AND code NOT LIKE '%-2627'
    ORDER BY code
  LOOP
    new_code := r.code || '-2627';
    new_name := r.name || ' 2026/2027';
    is_vb := r.code IN ('GRADINS_VB', 'CHAISE_VB');

    IF is_vb THEN
      v_valid_from := '2026-11-13';
      v_valid_until := '2027-11-29';
      v_sale_start := '2026-11-13';
      v_sale_end := '2027-10-31';
    ELSE
      v_valid_from := '2026-08-01';
      v_valid_until := '2027-06-30';
      v_sale_start := '2026-07-01';
      v_sale_end := '2027-06-30';
    END IF;

    new_id := gen_random_uuid();

    INSERT INTO subscription_plans (
      id, code, name, description, type, price, currency,
      max_subscribers, current_subscribers, organizer_id,
      valid_from, valid_until, sale_start_date, sale_end_date,
      transferable, max_transfers, auto_renew, includes_playoffs,
      priority_booking, benefits, restrictions, metadata,
      is_active, created_at, updated_at
    ) VALUES (
      new_id,
      new_code,
      new_name,
      r.description,
      r.type,
      r.price,
      r.currency,
      r.max_subscribers,
      0,
      r.organizer_id,
      v_valid_from,
      v_valid_until,
      v_sale_start,
      v_sale_end,
      r.transferable,
      r.max_transfers,
      r.auto_renew,
      r.includes_playoffs,
      r.priority_booking,
      r.benefits,
      r.restrictions,
      COALESCE(
        CASE
          WHEN r.metadata IS NULL OR r.metadata::text = 'null' THEN '{}'::jsonb
          WHEN jsonb_typeof(r.metadata) = 'object' THEN r.metadata
          ELSE '{}'::jsonb
        END,
        '{}'::jsonb
      )
        || jsonb_build_object(
          'season', '2026-2027',
          'season_label', 'Saison 2026/2027',
          'serial_prefix', '26',
          'previous_plan_id', r.id::text,
          'base_plan_code', r.code,
          'cloned_from_plan_id', r.id::text,
          'cloned_at', to_jsonb(NOW()::text)
        ),
      true,
      NOW(),
      NOW()
    );

    -- Link old → new
    UPDATE subscription_plans
    SET metadata = COALESCE(metadata, '{}'::jsonb)
      || jsonb_build_object(
        'successor_plan_id', new_id::text
      ),
      updated_at = NOW()
    WHERE id = r.id;

    -- Clone zone mappings
    INSERT INTO subscription_plan_zones (
      id, subscription_plan_id, zone_id, is_included,
      price_override, priority_level, metadata, created_at, updated_at
    )
    SELECT
      gen_random_uuid(),
      new_id,
      spz.zone_id,
      spz.is_included,
      spz.price_override,
      spz.priority_level,
      spz.metadata,
      NOW(),
      NOW()
    FROM subscription_plan_zones spz
    WHERE spz.subscription_plan_id = r.id;

    RAISE NOTICE 'Created plan % (%) from %', new_name, new_code, r.code;
  END LOOP;
END $$;

-- ── 3. (Optional) After 2025/2026 sale ends, mark old plans closed for reporting:
-- UPDATE subscription_plans
-- SET metadata = COALESCE(metadata, '{}'::jsonb) || '{"sales_closed": true}'::jsonb
-- WHERE metadata->>'season' = '2025-2026' AND sale_end_date < CURRENT_DATE;

COMMIT;

-- Verification
SELECT
  code,
  name,
  metadata->>'season' AS season,
  metadata->>'sales_closed' AS sales_closed,
  metadata->>'successor_plan_id' IS NOT NULL AS has_successor,
  valid_from,
  valid_until,
  sale_start_date,
  sale_end_date,
  is_active
FROM subscription_plans
ORDER BY metadata->>'season', code;
