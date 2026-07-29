'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
  Plus,
  CalendarRange,
  ArrowRight,
  Info,
  Layers,
  QrCode,
  TrendingUp,
} from 'lucide-react';
import { Sidebar } from '@/components/layout/sidebar';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { SeasonSelector } from '@/components/admin/SeasonSelector';
import { CreateSeasonModal } from '@/components/admin/CreateSeasonModal';
import { SeasonOperationsPanel } from '@/components/admin/SeasonOperationsPanel';
import { useSeason } from '@/hooks/use-season';
import { config } from '@/lib/config';
import {
  seasonOperationsApi,
  type SeasonListItem,
} from '@/lib/api/subscription-plans';
import { getSeasonStatusLabel, seasonLabelFromId } from '@/lib/seasons';
import { cn } from '@/lib/utils';

const STATUS_COLORS: Record<string, string> = {
  none: 'bg-gray-100 text-gray-700 border-gray-200',
  draft_plans: 'bg-amber-50 text-amber-800 border-amber-200',
  qrs_ready: 'bg-blue-50 text-blue-800 border-blue-200',
  qrs_in_use: 'bg-orange-50 text-orange-800 border-orange-200',
  sales_active: 'bg-green-50 text-green-800 border-green-200',
  archived: 'bg-slate-100 text-slate-700 border-slate-200',
};

const WORKFLOW_STEPS = [
  { step: 1, title: 'Cloner les plans', desc: 'Dupliquer les plans de la saison source vers la nouvelle saison.' },
  { step: 2, title: 'Générer les QR', desc: 'Créer les cartes physiques (même PIN & place, nouveau QR & n° série).' },
  { step: 3, title: 'Activer les ventes', desc: 'Fermer la vente sur l\'ancienne saison et ouvrir la nouvelle.' },
  { step: 4, title: 'Vendre / renouveler', desc: 'Guichet ou partenaire CSSForever — assignation sur la nouvelle carte.' },
];

export default function AdminSeasonsPage() {
  const { data: session } = useSession();
  const { season, setSeason } = useSeason();
  const [seasons, setSeasons] = useState<SeasonListItem[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const organizerId = config.organizer.getOrganizerId() || '';
  const isAdmin = session?.user?.role === 'ADMIN';
  const selectedFromList = seasons.find((s) => s.id === season);

  const loadSeasons = useCallback(async () => {
    if (!organizerId) {
      setLoadingList(false);
      return;
    }
    setLoadingList(true);
    try {
      const res = await seasonOperationsApi.listSeasons(organizerId);
      if (res?.success && Array.isArray(res.data)) {
        setSeasons(res.data);
      }
    } finally {
      setLoadingList(false);
    }
  }, [organizerId]);

  useEffect(() => {
    loadSeasons();
  }, [loadSeasons]);

  useEffect(() => {
    const refresh = () => loadSeasons();
    window.addEventListener('entrix:season-changed', refresh);
    window.addEventListener('entrix:season-deleted', refresh);
    window.addEventListener('subscriptionPlanChanged', refresh);
    return () => {
      window.removeEventListener('entrix:season-changed', refresh);
      window.removeEventListener('entrix:season-deleted', refresh);
      window.removeEventListener('subscriptionPlanChanged', refresh);
    };
  }, [loadSeasons]);

  const handleSeasonDeleted = async (deletedId: string) => {
    const res = await seasonOperationsApi.listSeasons(organizerId);
    const next = res.data?.find((s) => s.id !== deletedId)?.id || res.data?.[0]?.id || '2026-2027';
    setSeason(next);
    loadSeasons();
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-b from-slate-50/80 to-background">
      <Sidebar type="admin" />
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="px-8 w-full pb-10">
          <PageHeader
            title="Gestion des saisons"
            description="Créer une nouvelle saison, dupliquer les plans, générer les QR et activer les ventes."
          >
            {isAdmin && (
              <Button onClick={() => setShowCreateModal(true)} className="ml-auto shadow-sm">
                <Plus className="mr-2 h-4 w-4" />
                Nouvelle saison
              </Button>
            )}
          </PageHeader>

          <div className="mb-6 rounded-2xl border border-indigo-100 bg-white/80 p-1 shadow-sm backdrop-blur-sm">
            <SeasonSelector
              season={season}
              onSeasonChange={setSeason}
              organizerId={organizerId || undefined}
              compact
              className="border-0 bg-transparent shadow-none"
            />
          </div>

          {selectedFromList && (
            <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl border bg-white p-4 shadow-sm">
                <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium uppercase">
                  <Layers className="h-3.5 w-3.5" /> Plans
                </div>
                <p className="mt-1 text-2xl font-bold tabular-nums">{selectedFromList.planCount ?? 0}</p>
              </div>
              <div className="rounded-xl border bg-white p-4 shadow-sm">
                <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium uppercase">
                  <QrCode className="h-3.5 w-3.5" /> QR
                </div>
                <p className="mt-1 text-2xl font-bold tabular-nums">{selectedFromList.qrCount ?? 0}</p>
              </div>
              <div className="rounded-xl border bg-white p-4 shadow-sm">
                <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium uppercase">
                  <TrendingUp className="h-3.5 w-3.5" /> Vendus
                </div>
                <p className="mt-1 text-2xl font-bold tabular-nums">{selectedFromList.assignedQrCount ?? 0}</p>
              </div>
              <div className="rounded-xl border bg-white p-4 shadow-sm flex flex-col justify-center">
                {selectedFromList.status && (
                  <Badge className={cn('w-fit text-xs border', STATUS_COLORS[selectedFromList.status])}>
                    {getSeasonStatusLabel(selectedFromList.status)}
                  </Badge>
                )}
                <p className="text-xs text-muted-foreground mt-2 truncate">{selectedFromList.label}</p>
              </div>
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-3 mb-6">
            <Card className="lg:col-span-2 shadow-sm border-slate-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <CalendarRange className="h-5 w-5 text-indigo-600" />
                  Saisons enregistrées
                </CardTitle>
                <CardDescription>
                  Cliquez sur une ligne pour sélectionner la saison à gérer.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingList ? (
                  <div className="flex justify-center py-10">
                    <LoadingSpinner />
                  </div>
                ) : seasons.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-8 text-center">
                    Aucune saison. Créez une nouvelle saison pour commencer.
                  </p>
                ) : (
                  <div className="rounded-xl border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/40 hover:bg-muted/40">
                          <TableHead>Saison</TableHead>
                          <TableHead>Statut</TableHead>
                          <TableHead className="text-right">Plans</TableHead>
                          <TableHead className="text-right">QR</TableHead>
                          <TableHead className="text-right">Vendus</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {seasons.map((s) => {
                          const isSelected = season === s.id;
                          return (
                            <TableRow
                              key={s.id}
                              className={cn(
                                'cursor-pointer transition-colors',
                                isSelected
                                  ? 'bg-indigo-50 hover:bg-indigo-50/90 border-l-4 border-l-indigo-500'
                                  : 'hover:bg-muted/30',
                              )}
                              onClick={() => setSeason(s.id)}
                            >
                              <TableCell className="font-semibold">
                                {s.label || seasonLabelFromId(s.id)}
                              </TableCell>
                              <TableCell>
                                {s.status && (
                                  <Badge
                                    variant="outline"
                                    className={cn('text-[10px] font-medium', STATUS_COLORS[s.status])}
                                  >
                                    {getSeasonStatusLabel(s.status)}
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-right tabular-nums">{s.planCount ?? '—'}</TableCell>
                              <TableCell className="text-right tabular-nums">{s.qrCount ?? '—'}</TableCell>
                              <TableCell className="text-right tabular-nums">{s.assignedQrCount ?? '—'}</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-sm border-slate-200 bg-gradient-to-br from-white to-indigo-50/30">
              <CardHeader>
                <CardTitle className="text-base">Parcours type</CardTitle>
                <CardDescription>Ordre recommandé pour une nouvelle saison</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {WORKFLOW_STEPS.map(({ step, title, desc }) => (
                  <div key={step} className="flex gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white shadow-sm">
                      {step}
                    </span>
                    <div>
                      <p className="text-sm font-semibold">{title}</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {organizerId && (
            <SeasonOperationsPanel
              key={season}
              variant="inline"
              organizerId={organizerId}
              season={season}
              onSeasonDeleted={handleSeasonDeleted}
              onRefresh={loadSeasons}
              className="mb-6"
            />
          )}

          <Card className="border-dashed border-slate-300 bg-slate-50/50">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Info className="h-4 w-4 text-indigo-600" />
                Rappels & pages liées
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                Les pages <strong className="text-foreground">Plans</strong> et{' '}
                <strong className="text-foreground">QR Codes</strong> utilisent la saison active
                uniquement pour filtrer l&apos;affichage — toutes les opérations de migration se font ici.
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Duplication : PIN identique à la source, nouveau QR et n° série (ex. 26xxxx).</li>
                <li>Export Excel/CSV : script serveur <code className="text-xs bg-white px-1 rounded">export-season-qr-codes.sh</code>.</li>
              </ul>
              <div className="flex flex-wrap gap-3 pt-2">
                <Button variant="outline" size="sm" asChild className="bg-white">
                  <Link href="/admin/subscriptions/plans">
                    Plans d&apos;abonnement
                    <ArrowRight className="ml-2 h-3 w-3" />
                  </Link>
                </Button>
                <Button variant="outline" size="sm" asChild className="bg-white">
                  <Link href="/admin/qr-codes">
                    QR Codes
                    <ArrowRight className="ml-2 h-3 w-3" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <CreateSeasonModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        currentSeason={season}
        onSeasonCreated={(newSeason) => {
          setSeason(newSeason);
          loadSeasons();
        }}
      />
    </div>
  );
}
