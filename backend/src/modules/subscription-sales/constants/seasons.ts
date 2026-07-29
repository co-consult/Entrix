/**
 * Season identifiers for subscription plans.
 * Plans store season in metadata.season and link across seasons via
 * metadata.previous_plan_id / metadata.successor_plan_id.
 */
export const SUBSCRIPTION_SEASONS = {
  '2025-2026': {
    label: 'Saison 2025/2026',
    serialPrefix: null,
    football: { validFrom: '2025-08-01', validUntil: '2026-06-30' },
    volleyball: { validFrom: '2025-11-13', validUntil: '2026-11-29' },
  },
  '2026-2027': {
    label: 'Saison 2026/2027',
    serialPrefix: '26',
    football: { validFrom: '2026-08-01', validUntil: '2027-06-30' },
    volleyball: { validFrom: '2026-11-13', validUntil: '2027-11-29' },
  },
} as const;

export type SubscriptionSeasonId = keyof typeof SUBSCRIPTION_SEASONS;

/** Season used for new sales / QR generation by default */
export const CURRENT_SUBSCRIPTION_SEASON: SubscriptionSeasonId = '2026-2027';

/** Plan code suffix for a season (e.g. CENTRALE → CENTRALE-2627) */
export function seasonPlanCode(baseCode: string, seasonId: SubscriptionSeasonId): string {
  const suffix = seasonCodeSuffix(seasonId);
  return `${baseCode}-${suffix}`;
}

/** e.g. 2026-2027 → 2627 */
export function seasonCodeSuffix(seasonId: string): string {
  const [start, end] = seasonId.split('-');
  return `${start.slice(2)}${end.slice(2)}`;
}

export function seasonLabelFromId(seasonId: string): string {
  const [start, end] = seasonId.split('-');
  return `Saison ${start}/${end}`;
}
