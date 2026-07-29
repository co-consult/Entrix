export const SUBSCRIPTION_SEASONS = [
  { id: '2026-2027', label: 'Saison 2026/2027', shortLabel: '2026/2027' },
  { id: '2025-2026', label: 'Saison 2025/2026', shortLabel: '2025/2026' },
] as const;

export type BuiltinSeasonId = (typeof SUBSCRIPTION_SEASONS)[number]['id'];
export type SubscriptionSeasonId = string;

export const DEFAULT_SUBSCRIPTION_SEASON: SubscriptionSeasonId = '2026-2027';

export const SEASON_STORAGE_KEY = 'entrix_selected_season';
export const CUSTOM_SEASONS_STORAGE_KEY = 'entrix_custom_seasons';

export interface SeasonOption {
  id: SubscriptionSeasonId;
  label: string;
  shortLabel: string;
}

/** e.g. 2026-2027 → 2627, 2027-2028 → 2728 */
export function seasonCodeSuffix(seasonId: string): string {
  const [start, end] = seasonId.split('-');
  if (!start || !end || start.length !== 4 || end.length !== 4) {
    throw new Error(`Format de saison invalide: ${seasonId}`);
  }
  return `${start.slice(2)}${end.slice(2)}`;
}

export function seasonLabelFromId(seasonId: string): string {
  const [start, end] = seasonId.split('-');
  if (start?.length === 4 && end?.length === 4) {
    return `Saison ${start}/${end}`;
  }
  return seasonId;
}

export function getCustomSeasons(): SeasonOption[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CUSTOM_SEASONS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((s): s is SeasonOption => typeof s?.id === 'string' && typeof s?.label === 'string')
      .map((s) => ({
        id: s.id,
        label: s.label,
        shortLabel: s.shortLabel || s.id.replace('-', '/').replace(/^(\d{4})-(\d{4})$/, '$1/$2'),
      }));
  } catch {
    return [];
  }
}

export function registerCustomSeason(seasonId: string): SeasonOption {
  const option: SeasonOption = {
    id: seasonId,
    label: seasonLabelFromId(seasonId),
    shortLabel: seasonId.replace(/^(\d{4})-(\d{4})$/, (_, a, b) => `${a}/${b}`),
  };
  const existing = getAllSeasonOptions();
  if (!existing.some((s) => s.id === seasonId)) {
    const custom = getCustomSeasons();
    custom.unshift(option);
    localStorage.setItem(CUSTOM_SEASONS_STORAGE_KEY, JSON.stringify(custom));
  }
  return option;
}

/** Remove a season from the browser registry (after API draft delete). */
export function unregisterCustomSeason(seasonId: string): void {
  if (typeof window === 'undefined') return;
  try {
    const custom = getCustomSeasons().filter((s) => s.id !== seasonId);
    localStorage.setItem(CUSTOM_SEASONS_STORAGE_KEY, JSON.stringify(custom));
  } catch {
    // ignore
  }
}

/** Drop custom seasons that no longer exist in the API list. */
export function pruneCustomSeasons(validSeasonIds: string[]): void {
  if (typeof window === 'undefined') return;
  try {
    const valid = new Set(validSeasonIds);
    const custom = getCustomSeasons().filter((s) => valid.has(s.id));
    localStorage.setItem(CUSTOM_SEASONS_STORAGE_KEY, JSON.stringify(custom));
  } catch {
    // ignore
  }
}

export function getSeasonStatusLabel(status?: SeasonStatus): string {
  switch (status) {
    case 'draft_plans':
      return 'Brouillon';
    case 'qrs_ready':
      return 'QR prêts';
    case 'qrs_in_use':
      return 'QR en utilisation';
    case 'sales_active':
      return 'Ventes actives';
    case 'archived':
      return 'Archivée';
    case 'none':
      return 'Aucun plan';
    default:
      return '';
  }
}

export type SeasonStatus =
  | 'none'
  | 'draft_plans'
  | 'qrs_ready'
  | 'qrs_in_use'
  | 'sales_active'
  | 'archived';

export interface ApiSeasonOption extends SeasonOption {
  status?: SeasonStatus;
  planCount?: number;
  qrCount?: number;
}

/** Merge API seasons (source of truth) with optional extras discovered from plans. */
export function mergeSeasonOptionsFromApi(
  apiSeasons: Array<{ id: string; label?: string; status?: SeasonStatus; planCount?: number; qrCount?: number }>,
  extraSeasons: string[] = [],
): ApiSeasonOption[] {
  const map = new Map<string, ApiSeasonOption>();

  for (const s of apiSeasons) {
    const label = s.label || seasonLabelFromId(s.id);
    map.set(s.id, {
      id: s.id,
      label,
      shortLabel: s.id.replace(/^(\d{4})-(\d{4})$/, (_, a, b) => `${a}/${b}`),
      status: s.status,
      planCount: s.planCount,
      qrCount: s.qrCount,
    });
  }

  for (const id of extraSeasons) {
    if (!map.has(id)) {
      map.set(id, {
        id,
        label: seasonLabelFromId(id),
        shortLabel: id.replace(/^(\d{4})-(\d{4})$/, (_, a, b) => `${a}/${b}`),
      });
    }
  }

  if (typeof window !== 'undefined' && apiSeasons.length > 0) {
    pruneCustomSeasons([...map.keys()]);
  }

  return Array.from(map.values()).sort((a, b) => b.id.localeCompare(a.id));
}

export function getAllSeasonOptions(extraSeasons: string[] = []): SeasonOption[] {
  const map = new Map<string, SeasonOption>();

  for (const s of SUBSCRIPTION_SEASONS) {
    map.set(s.id, { id: s.id, label: s.label, shortLabel: s.shortLabel });
  }

  for (const s of getCustomSeasons()) {
    map.set(s.id, s);
  }

  for (const id of extraSeasons) {
    if (!map.has(id)) {
      map.set(id, {
        id,
        label: seasonLabelFromId(id),
        shortLabel: id.replace(/^(\d{4})-(\d{4})$/, (_, a, b) => `${a}/${b}`),
      });
    }
  }

  return Array.from(map.values()).sort((a, b) => b.id.localeCompare(a.id));
}

export function getPlanSeason(plan: {
  metadata?: Record<string, unknown> | null;
  code?: string;
}): SubscriptionSeasonId {
  const season = plan.metadata?.season;
  if (typeof season === 'string' && season.length > 0) {
    return season;
  }
  const match = plan.code?.match(/-(\d{4})$/);
  if (match) {
    const suffix = match[1];
    return `20${suffix.slice(0, 2)}-20${suffix.slice(2, 4)}`;
  }
  return '2025-2026';
}

export function filterPlansBySeason<T extends { metadata?: Record<string, unknown> | null; code?: string }>(
  plans: T[],
  season: SubscriptionSeasonId,
): T[] {
  return plans.filter((plan) => getPlanSeason(plan) === season);
}

export function getSeasonLabel(seasonId: SubscriptionSeasonId): string {
  return getAllSeasonOptions().find((s) => s.id === seasonId)?.label ?? seasonLabelFromId(seasonId);
}

/** Next season id from a source season, e.g. 2026-2027 → 2027-2028 */
export function nextSeasonId(sourceSeasonId: string): string {
  const [start, end] = sourceSeasonId.split('-').map(Number);
  return `${end}-${end + 1}`;
}
