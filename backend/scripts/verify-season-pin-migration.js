#!/usr/bin/env node
/**
 * Verify season QR migration PIN preservation:
 * - ALL duplicated cards: target.onboarding_key MUST equal source original PIN
 * - Archived source: onboarding_key is placeholder; original in metadata.original_onboarding_key
 */
const { PrismaClient } = require('@prisma/client');
const { createHash } = require('crypto');

function seasonOnboardingKey(sourceId) {
  const h1 = createHash('sha256').update(`onb1${sourceId}`).digest('hex').substring(0, 4).toUpperCase();
  const h2 = createHash('sha256').update(`onb2${sourceId}`).digest('hex').substring(0, 4).toUpperCase();
  return `${h1}-${h2}`;
}

async function main() {
  const prisma = new PrismaClient();
  const targets = await prisma.physical_qr_codes.findMany({
    where: { metadata: { path: ['previous_qr_id'], not: null } },
    select: {
      id: true,
      onboarding_key: true,
      serial_number: true,
      qr_code: true,
      metadata: true,
      subscription_plans: { select: { code: true, metadata: true } },
    },
  });

  const sourceIds = [
    ...new Set(
      targets
        .map((t) => (t.metadata)?.previous_qr_id)
        .filter(Boolean),
    ),
  ];

  const sources = await prisma.physical_qr_codes.findMany({
    where: { id: { in: sourceIds } },
    select: {
      id: true,
      onboarding_key: true,
      serial_number: true,
      qr_code: true,
      status: true,
      metadata: true,
    },
  });

  const sourceById = new Map(sources.map((s) => [s.id, s]));

  const stats = {
    total: 0,
    renewal: { total: 0, pinOk: 0, pinBad: 0, serialOk: 0, serialBad: 0 },
    newStock: { total: 0, pinOk: 0, pinBad: 0, serialOk: 0, serialBad: 0 },
    badSamples: [],
  };

  for (const t of targets) {
    const meta = t.metadata || {};
    const sourceId = meta.previous_qr_id;
    if (!sourceId) continue;
    const s = sourceById.get(sourceId);
    if (!s) continue;

    stats.total++;
    const sMeta = s.metadata || {};
    const effectiveStatus = (sMeta.original_status || s.status);
    const originalPin = sMeta.original_onboarding_key || s.onboarding_key;
    const isRenewal = effectiveStatus === 'ASSIGNED' || meta.renewal_pin_preserved === true;
    const bucket = isRenewal ? stats.renewal : stats.newStock;
    bucket.total++;

    const expectedPin = originalPin;
    const pinOk = t.onboarding_key === expectedPin;
    if (pinOk) bucket.pinOk++;
    else {
      bucket.pinBad++;
      if (stats.badSamples.length < 15) {
        stats.badSamples.push({
          type: isRenewal ? 'RENEWAL' : 'NEW_STOCK',
          plan: t.subscription_plans?.code,
          targetPin: t.onboarding_key,
          expectedPin,
          originalPin,
          sourcePinNow: s.onboarding_key,
          targetSerial: t.serial_number,
          sourceSerial: sMeta.original_serial || s.serial_number,
          sourceId: s.id.slice(0, 8),
        });
      }
    }

    const srcSerial = s.serial_number;
    const digits = srcSerial.replace(/[^0-9]/g, '').padStart(4, '0').slice(-4);
    const season = (t.subscription_plans?.metadata)?.season || meta.season;
    const prefix = season ? season.split('-')[0].slice(2) : '26';
    const expectedSerial = `${prefix}${digits}`;
    const serialOk = t.serial_number === expectedSerial;
    if (serialOk) bucket.serialOk++;
    else bucket.serialBad++;
  }

  console.log(JSON.stringify(stats, null, 2));
  await prisma.$disconnect();
  process.exit(stats.renewal.pinBad > 0 || stats.newStock.pinBad > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(2);
});
