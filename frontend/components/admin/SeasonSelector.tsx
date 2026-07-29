'use client';

import { useEffect, useState } from 'react';
import { CalendarRange, Plus, Settings2 } from 'lucide-react';
import Link from 'next/link';
import {
  getAllSeasonOptions,
  getSeasonLabel,
  mergeSeasonOptionsFromApi,
  type ApiSeasonOption,
  type SubscriptionSeasonId,
} from '@/lib/seasons';
import { seasonOperationsApi } from '@/lib/api/subscription-plans';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface SeasonSelectorProps {
  season: SubscriptionSeasonId;
  onSeasonChange: (season: SubscriptionSeasonId) => void;
  className?: string;
  compact?: boolean;
  extraSeasons?: string[];
  showCreateButton?: boolean;
  onCreateSeason?: () => void;
  /** Link to season management hub instead of inline create */
  showManageLink?: boolean;
  organizerId?: string;
}

export function SeasonSelector({
  season,
  onSeasonChange,
  className,
  compact = false,
  extraSeasons = [],
  showCreateButton = false,
  onCreateSeason,
  showManageLink = false,
  organizerId,
}: SeasonSelectorProps) {
  const [options, setOptions] = useState<ApiSeasonOption[]>([]);

  useEffect(() => {
    const load = async () => {
      if (organizerId) {
        try {
          const res = await seasonOperationsApi.listSeasons(organizerId);
          if (res?.success && Array.isArray(res.data)) {
            setOptions(mergeSeasonOptionsFromApi(res.data, extraSeasons));
            return;
          }
        } catch {
          // fallback to local
        }
      }
      setOptions(getAllSeasonOptions(extraSeasons));
    };

    load();
    const onChanged = () => load();
    window.addEventListener('entrix:season-changed', onChanged);
    window.addEventListener('entrix:season-deleted', onChanged);
    window.addEventListener('storage', onChanged);
    window.addEventListener('subscriptionPlanChanged', onChanged);
    return () => {
      window.removeEventListener('entrix:season-changed', onChanged);
      window.removeEventListener('entrix:season-deleted', onChanged);
      window.removeEventListener('storage', onChanged);
      window.removeEventListener('subscriptionPlanChanged', onChanged);
    };
  }, [extraSeasons.join(','), organizerId]);

  return (
    <div
      className={cn(
        'flex flex-col gap-3 rounded-xl border-2 border-indigo-200 bg-gradient-to-r from-indigo-50 to-blue-50 px-4 py-3 shadow-sm sm:flex-row sm:items-center',
        className,
      )}
    >
      <div className="flex min-w-0 items-center gap-2 shrink-0">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white">
          <CalendarRange className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">Saison active</p>
          {!compact && (
            <p className="text-sm text-indigo-900/80 truncate">Plans & QR codes filtrés par saison</p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:ml-auto sm:flex-row sm:items-center sm:gap-3 w-full sm:w-auto">
        <Select value={season} onValueChange={onSeasonChange}>
          <SelectTrigger className="w-full sm:w-[220px] bg-white border-indigo-200 font-semibold text-indigo-900">
            <SelectValue placeholder="Choisir une saison" />
          </SelectTrigger>
          <SelectContent>
            {options.map((item) => (
              <SelectItem key={item.id} value={item.id}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {showManageLink && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            asChild
            className="border-indigo-300 text-indigo-800 hover:bg-indigo-100 whitespace-nowrap"
          >
            <Link href="/admin/subscriptions/seasons">
              <Settings2 className="mr-2 h-4 w-4" />
              Gérer les saisons
            </Link>
          </Button>
        )}

        {showCreateButton && onCreateSeason && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onCreateSeason}
            className="border-indigo-300 text-indigo-800 hover:bg-indigo-100 whitespace-nowrap"
          >
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle saison
          </Button>
        )}

        <span className="hidden lg:inline text-xs font-medium text-indigo-700 bg-white/70 border border-indigo-100 rounded-full px-3 py-1 whitespace-nowrap">
          Affichage : {getSeasonLabel(season)}
        </span>
      </div>
    </div>
  );
}
