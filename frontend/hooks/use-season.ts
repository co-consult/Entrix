'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  DEFAULT_SUBSCRIPTION_SEASON,
  SEASON_STORAGE_KEY,
  getAllSeasonOptions,
  type SubscriptionSeasonId,
} from '@/lib/seasons';

export function useSeason() {
  const [season, setSeasonState] = useState<SubscriptionSeasonId>(DEFAULT_SUBSCRIPTION_SEASON);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(SEASON_STORAGE_KEY);
      if (saved) {
        setSeasonState(saved);
      }
    } catch {
      // ignore
    }
    setReady(true);
  }, []);

  const setSeason = useCallback((next: SubscriptionSeasonId) => {
    setSeasonState(next);
    try {
      localStorage.setItem(SEASON_STORAGE_KEY, next);
    } catch {
      // ignore
    }
    window.dispatchEvent(new CustomEvent('entrix:season-changed', { detail: next }));
  }, []);

  const seasonOptions = getAllSeasonOptions();

  return { season, setSeason, ready, seasonOptions, refreshSeasonOptions: () => getAllSeasonOptions() };
}
