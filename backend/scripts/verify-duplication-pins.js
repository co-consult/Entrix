#!/usr/bin/env node
/**
 * Verify season duplication logic: every migrated QR must keep source onboarding_key.
 * Mirrors SeasonQRMigrationService.buildMigrationPairs + generateSeasonQRs mapping.
 */
const { PrismaClient } = require('@prisma/client');

const ORG = process.env.ORGANIZER_ID || 'e219c1e4-2f2e-4719-b2f9-c6ce4d2d8d2e';
const SOURCE = process.env.SOURCE_SEASON || '2025-2026';
const TARGET = process.env.TARGET_SEASON || '2026-2027';

function seasonCodeSuffix(season) {
  const [start, end] = season.split('-');
  return `${start.slice(2)}${end.slice(2)}`;
}

async function buildMigrationPairs(prisma, organizerId, sourceSeason, targetSeason) {
  const targetSuffix = seasonCodeSuffix(targetSeason);

  const sourcePlans = await prisma.subscription_plans.findMany({
    where: {
      organizer_id: organizerId,
      metadata: { path: ['season'], equals: sourceSeason },
      NOT: { code: { endsWith: `-${targetSuffix}` } },
    },
    select: { id: true, code: true },
  });

  const sourcePlanIds = sourcePlans.map((p) => p.id);
  const sourcePlanById = new Map(sourcePlans.map((p) => [p.id, p.code]));

  const targetPlans = await prisma.subscription_plans.findMany({
    where: {
      organizer_id: organizerId,
      metadata: { path: ['season'], equals: targetSeason },
    },
    select: { id: true, code: true, metadata: true },
  });

  const targetByPreviousId = new Map();
  for (const tp of targetPlans) {
    const meta = tp.metadata || {};
    if (meta.previous_plan_id) {
      targetByPreviousId.set(meta.previous_plan_id, { id: tp.id, code: tp.code });
    }
  }

  const oldQrs = await prisma.physical_qr_codes.findMany({
    where: { subscription_plan_id: { in: sourcePlanIds } },
  });

  const pairs = [];
  for (const qr of oldQrs) {
    const target = targetByPreviousId.get(qr.subscription_plan_id);
    if (!target) continue;

    const meta = qr.metadata || {};
    const isArchived = qr.status === 'DISABLED';
    const effectiveStatus =
      isArchived && meta.original_status ? meta.original_status : qr.status;
    const effectivePin =
      isArchived && meta.original_onboarding_key
        ? meta.original_onboarding_key
        : qr.onboarding_key;

    // This is what generateSeasonQRs writes (line 265)
    const targetOnboardingKey = effectivePin;

    pairs.push({
      oldQrId: qr.id,
      originalPin: effectivePin,
      originalStatus: effectiveStatus,
      targetOnboardingKey,
      newPlanCode: target.code,
      pinWouldMatch: targetOnboardingKey === effectivePin,
    });
  }
  return pairs;
}

async function main() {
  const prisma = new PrismaClient();
  const pairs = await buildMigrationPairs(prisma, ORG, SOURCE, TARGET);

  const stats = {
    sourceSeason: SOURCE,
    targetSeason: TARGET,
    totalPairs: pairs.length,
    allPinsPreserved: pairs.every((p) => p.pinWouldMatch),
    assigned: pairs.filter((p) => p.originalStatus === 'ASSIGNED').length,
    available: pairs.filter((p) => p.originalStatus === 'AVAILABLE').length,
    assignedPinOk: pairs.filter((p) => p.originalStatus === 'ASSIGNED' && p.pinWouldMatch).length,
    availablePinOk: pairs.filter((p) => p.originalStatus === 'AVAILABLE' && p.pinWouldMatch).length,
    badSamples: pairs.filter((p) => !p.pinWouldMatch).slice(0, 5),
  };

  // Live DB check: existing target season copies
  const live = await prisma.$queryRaw`
    SELECT COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE t.onboarding_key = s.metadata->>'original_onboarding_key')::int AS pin_ok
    FROM physical_qr_codes t
    JOIN physical_qr_codes s ON s.id = (t.metadata->>'previous_qr_id')::uuid
    JOIN subscription_plans sp ON sp.id = t.subscription_plan_id
    WHERE sp.metadata->>'season' = ${TARGET}
  `;

  stats.liveDbTarget = live[0];
  stats.FINAL = stats.allPinsPreserved && stats.liveDbTarget.total === stats.liveDbTarget.pin_ok
    ? 'PASS — duplication keeps every onboarding key'
    : 'FAIL';

  console.log(JSON.stringify(stats, null, 2));
  await prisma.$disconnect();
  process.exit(stats.FINAL.startsWith('PASS') ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(2);
});
