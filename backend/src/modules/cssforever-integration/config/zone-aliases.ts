/**
 * Maps CSSForever standNumber to Entrix venue_zones.code.
 * Extend via env JSON CSSFOREVER_ZONE_ALIASES or hardcode known CSS stadium stands.
 */
export const DEFAULT_ZONE_ALIASES: Record<string, string> = {
  A: 'C',
  B: 'G',
  C: 'C2',
  D: 'G3',
};

export function parseZoneAliasesFromEnv(raw?: string): Record<string, string> {
  if (!raw) return { ...DEFAULT_ZONE_ALIASES };
  try {
    return { ...DEFAULT_ZONE_ALIASES, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_ZONE_ALIASES };
  }
}
