'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import {
  seasonOperationsApi,
  type SeasonPreflightResult,
  type SeasonSummary,
} from '@/lib/api/subscription-plans';
import { getSeasonStatusLabel, seasonLabelFromId, unregisterCustomSeason } from '@/lib/seasons';
import { GenerateSeasonQRModal } from '@/components/admin/GenerateSeasonQRModal';
import { RollbackSeasonModal } from '@/components/admin/RollbackSeasonModal';
import {
  Play,
  QrCode,
  RefreshCw,
  RotateCcw,
  Settings2,
  Trash2,
  Layers,
  Package,
  Users,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const STATUS_COLORS: Record<string, string> = {
  none: 'bg-gray-100 text-gray-700',
  draft_plans: 'bg-amber-100 text-amber-800',
  qrs_ready: 'bg-blue-100 text-blue-800',
  qrs_in_use: 'bg-orange-100 text-orange-800',
  sales_active: 'bg-green-100 text-green-800',
  archived: 'bg-slate-100 text-slate-700',
};

interface SeasonOperationsPanelProps {
  organizerId: string;
  season: string;
  onRefresh?: () => void;
  onSeasonDeleted?: (deletedSeasonId: string) => void;
  className?: string;
  /** sheet = trigger button + side panel (legacy); inline = full page card */
  variant?: 'sheet' | 'inline';
}

function KpiTile({
  label,
  value,
  hint,
  icon: Icon,
  accent,
}: {
  label: string;
  value: number | string;
  hint?: string;
  icon?: LucideIcon;
  accent?: string;
}) {
  return (
    <div className="rounded-xl border bg-gradient-to-br from-white to-slate-50/80 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
        {Icon && (
          <span className={cn('rounded-lg p-1.5', accent || 'bg-indigo-100 text-indigo-700')}>
            <Icon className="h-4 w-4" />
          </span>
        )}
      </div>
      <p className="mt-2 text-2xl font-bold tabular-nums tracking-tight">{value}</p>
      {hint && <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function SeasonOperationsPanel({
  organizerId,
  season,
  onRefresh,
  onSeasonDeleted,
  className,
  variant = 'sheet',
}: SeasonOperationsPanelProps) {
  const { toast } = useToast();
  const inline = variant === 'inline';
  const [open, setOpen] = useState(inline);
  const [summary, setSummary] = useState<SeasonSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [preflights, setPreflights] = useState<Record<string, SeasonPreflightResult>>({});
  const [showGenerate, setShowGenerate] = useState(false);
  const [showRollback, setShowRollback] = useState(false);
  const [showCancelDraft, setShowCancelDraft] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const seasonRef = useRef(season);
  seasonRef.current = season;

  const loadData = useCallback(async () => {
    if (!organizerId || !season) return;
    const requestedSeason = season;
    setLoading(true);
    setSummary(null);
    setPreflights({});
    try {
      const [summaryRes, genPf, actPf, rbPf, cancelPf] = await Promise.all([
        seasonOperationsApi.getSummary(organizerId, requestedSeason),
        seasonOperationsApi.preflight(organizerId, requestedSeason, 'generate_qr'),
        seasonOperationsApi.preflight(organizerId, requestedSeason, 'activate'),
        seasonOperationsApi.preflight(organizerId, requestedSeason, 'rollback'),
        seasonOperationsApi.preflight(organizerId, requestedSeason, 'cancel_draft'),
      ]);
      if (seasonRef.current !== requestedSeason) return;
      if (summaryRes.data?.seasonId !== requestedSeason) return;
      setSummary(summaryRes.data);
      setPreflights({
        generate_qr: genPf.data,
        activate: actPf.data,
        rollback: rbPf.data,
        cancel_draft: cancelPf.data,
      });
    } catch (err: any) {
      if (seasonRef.current !== requestedSeason) return;
      toast({
        title: 'Erreur chargement saison',
        description: err.response?.data?.message || err.message,
        variant: 'destructive',
      });
    } finally {
      if (seasonRef.current === requestedSeason) setLoading(false);
    }
  }, [organizerId, season, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const handler = () => loadData();
    window.addEventListener('entrix:season-changed', handler);
    window.addEventListener('subscriptionPlanChanged', handler);
    return () => {
      window.removeEventListener('entrix:season-changed', handler);
      window.removeEventListener('subscriptionPlanChanged', handler);
    };
  }, [loadData]);

  useEffect(() => {
    if (!inline && open) loadData();
  }, [open, loadData, inline]);

  const sourceSeason =
    summary?.sourceSeasonId ||
    preflights.generate_qr?.sourceSeason ||
    preflights.rollback?.sourceSeason;

  const isDraft = summary?.status === 'draft_plans';
  const isGhostSeason = summary?.status === 'none' && summary.planCount === 0;

  const closePanel = () => {
    if (!inline) setOpen(false);
  };

  const handleRemoveGhostSeason = () => {
    unregisterCustomSeason(season);
    toast({ title: 'Saison retirée', description: `${seasonLabelFromId(season)} retirée de la liste.` });
    closePanel();
    onSeasonDeleted?.(season);
    window.dispatchEvent(new CustomEvent('entrix:season-deleted', { detail: season }));
  };

  const handleActivate = async () => {
    if (!sourceSeason) return;
    setActionLoading(true);
    try {
      const res = await seasonOperationsApi.activateSales(organizerId, season, { sourceSeason });
      if (res?.success) {
        toast({ title: 'Ventes activées', description: res.message });
        await loadData();
        onRefresh?.();
        window.dispatchEvent(new CustomEvent('subscriptionPlanChanged'));
      }
    } catch (err: any) {
      toast({
        title: 'Erreur',
        description: err.response?.data?.message || err.message,
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelDraft = async () => {
    setActionLoading(true);
    try {
      const res = await seasonOperationsApi.cancelDraft(organizerId, season);
      if (res?.success) {
        unregisterCustomSeason(season);
        toast({ title: 'Saison brouillon supprimée', description: res.message });
        setShowCancelDraft(false);
        closePanel();
        onSeasonDeleted?.(season);
        await loadData();
        onRefresh?.();
        window.dispatchEvent(new CustomEvent('entrix:season-deleted', { detail: season }));
        window.dispatchEvent(new CustomEvent('subscriptionPlanChanged'));
      }
    } catch (err: any) {
      toast({
        title: 'Erreur',
        description: err.response?.data?.message || err.message,
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const summaryReady = summary && summary.seasonId === season && !loading;

  const operationsBody = (
    <div className="space-y-6">
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <LoadingSpinner />
          <p className="text-sm text-muted-foreground">Chargement de {seasonLabelFromId(season)}…</p>
        </div>
      ) : summaryReady ? (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <KpiTile label="Plans" value={summary.planCount} icon={Layers} accent="bg-violet-100 text-violet-700" />
            <KpiTile label="QR total" value={summary.qrCount.toLocaleString('fr-FR')} icon={QrCode} accent="bg-blue-100 text-blue-700" />
            <KpiTile
              label="Disponibles"
              value={(summary.qrAvailableCount ?? 0).toLocaleString('fr-FR')}
              icon={Package}
              accent="bg-emerald-100 text-emerald-700"
            />
            <KpiTile
              label="Vendus"
              value={(summary.soldQrCount ?? summary.assignedQrCount).toLocaleString('fr-FR')}
              hint="QR assignés + abonnements"
              icon={TrendingUp}
              accent="bg-amber-100 text-amber-700"
            />
            <KpiTile
              label="Abonnements"
              value={summary.subscriptionCount.toLocaleString('fr-FR')}
              icon={Users}
              accent="bg-rose-100 text-rose-700"
            />
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Actions</p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <Button
                variant="outline"
                className="justify-start"
                disabled={!preflights.generate_qr?.allowed}
                onClick={() => setShowGenerate(true)}
              >
                <QrCode className="mr-2 h-4 w-4 shrink-0" />
                <span className="text-left flex-1">Générer QR depuis saison précédente</span>
              </Button>
              {!preflights.generate_qr?.allowed && preflights.generate_qr?.blockers?.[0] && (
                <p className="text-xs text-muted-foreground px-1 sm:col-span-2">
                  {preflights.generate_qr.blockers[0]}
                </p>
              )}

              <Button
                variant="outline"
                className="justify-start"
                disabled={!preflights.activate?.allowed || actionLoading}
                onClick={handleActivate}
              >
                <Play className="mr-2 h-4 w-4 shrink-0" />
                Activer les ventes
              </Button>
              {!preflights.activate?.allowed && preflights.activate?.blockers?.[0] && (
                <p className="text-xs text-muted-foreground px-1 sm:col-span-2">
                  {preflights.activate.blockers[0]}
                </p>
              )}

              {isGhostSeason && (
                <Button
                  variant="outline"
                  className="justify-start text-destructive hover:text-destructive sm:col-span-2"
                  onClick={handleRemoveGhostSeason}
                >
                  <Trash2 className="mr-2 h-4 w-4 shrink-0" />
                  Retirer cette saison de la liste
                </Button>
              )}

              {isDraft && (
                <>
                  <Button
                    variant="outline"
                    className="justify-start text-destructive hover:text-destructive"
                    disabled={!preflights.cancel_draft?.allowed}
                    onClick={() => setShowCancelDraft(true)}
                  >
                    <Trash2 className="mr-2 h-4 w-4 shrink-0" />
                    Supprimer la saison brouillon
                  </Button>
                  {!preflights.cancel_draft?.allowed && preflights.cancel_draft?.blockers?.[0] && (
                    <p className="text-xs text-muted-foreground px-1 sm:col-span-2">
                      {preflights.cancel_draft.blockers[0]}
                    </p>
                  )}
                </>
              )}

              {!isDraft && summary.status !== 'none' && (
                <p className="text-xs text-muted-foreground rounded-md bg-muted/50 p-2 sm:col-span-2">
                  La suppression n&apos;est disponible que pour une saison brouillon (plans clonés, sans QR).
                </p>
              )}

              <Button
                variant="destructive"
                className="justify-start sm:col-span-2"
                disabled={!preflights.rollback?.allowed}
                onClick={() => setShowRollback(true)}
              >
                <RotateCcw className="mr-2 h-4 w-4 shrink-0" />
                Rollback migration QR
              </Button>
              {!preflights.rollback?.allowed && preflights.rollback?.blockers?.[0] && (
                <p className="text-xs text-muted-foreground px-1 sm:col-span-2">
                  {preflights.rollback.blockers[0]}
                </p>
              )}
            </div>
          </div>

          {summary.plans.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Détail par plan
              </p>
              <div className="rounded-lg border overflow-x-auto max-h-72">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Plan</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-right">Dispo</TableHead>
                      <TableHead className="text-right">Vendus</TableHead>
                      <TableHead className="text-right">Abos</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {summary.plans.map((p) => (
                      <TableRow key={p.planId}>
                        <TableCell className="font-mono text-[11px] max-w-[140px] truncate">
                          {p.planCode}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{p.qrTotal}</TableCell>
                        <TableCell className="text-right tabular-nums">{p.qrAvailable}</TableCell>
                        <TableCell className="text-right tabular-nums">{p.qrAssigned}</TableCell>
                        <TableCell className="text-right tabular-nums">{p.subscriptionCount}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </>
      ) : (
        <p className="text-sm text-muted-foreground py-8 text-center">
          Aucune donnée pour {seasonLabelFromId(season)}.
        </p>
      )}
    </div>
  );

  const modals = (
    <>
      <GenerateSeasonQRModal
        open={showGenerate}
        onOpenChange={setShowGenerate}
        organizerId={organizerId}
        targetSeason={season}
        defaultSourceSeason={sourceSeason}
        onSuccess={() => {
          loadData();
          onRefresh?.();
        }}
      />

      <RollbackSeasonModal
        open={showRollback}
        onOpenChange={setShowRollback}
        organizerId={organizerId}
        targetSeason={season}
        sourceSeason={sourceSeason}
        onSuccess={() => {
          loadData();
          onRefresh?.();
        }}
      />

      <AlertDialog open={showCancelDraft} onOpenChange={setShowCancelDraft}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer la saison brouillon ?</AlertDialogTitle>
            <AlertDialogDescription>
              Tous les plans de {seasonLabelFromId(season)} seront supprimés définitivement.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>Annuler</AlertDialogCancel>
            <Button
              variant="destructive"
              disabled={actionLoading}
              onClick={(e) => {
                e.preventDefault();
                void handleCancelDraft();
              }}
            >
              {actionLoading ? 'Suppression…' : 'Supprimer'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );

  if (!organizerId) return null;

  if (inline) {
    return (
      <>
        <Card className={cn('overflow-hidden border-indigo-100 shadow-md', className)}>
          <div className="h-1.5 bg-gradient-to-r from-indigo-500 via-violet-500 to-blue-500" />
          <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4 bg-gradient-to-br from-indigo-50/50 to-white">
            <div>
              <CardTitle className="text-xl font-bold tracking-tight">{seasonLabelFromId(season)}</CardTitle>
              <CardDescription className="flex flex-wrap items-center gap-2 mt-2">
                Opérations et indicateurs
                {summaryReady && summary && (
                  <Badge className={cn(STATUS_COLORS[summary.status])}>
                    {getSeasonStatusLabel(summary.status)}
                  </Badge>
                )}
                {loading && (
                  <Badge variant="outline" className="text-muted-foreground animate-pulse">
                    Chargement…
                  </Badge>
                )}
              </CardDescription>
            </div>
            <Button variant="outline" size="icon" onClick={loadData} disabled={loading} className="h-9 w-9 shrink-0">
              <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
            </Button>
          </CardHeader>
          <CardContent className="pt-2">{operationsBody}</CardContent>
        </Card>
        {modals}
      </>
    );
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className={cn(
          'border-indigo-300 bg-white text-indigo-900 hover:bg-indigo-50 whitespace-nowrap',
          className,
        )}
      >
        <Settings2 className="mr-2 h-4 w-4" />
        Opérations saison
        {summary && (
          <Badge
            className={cn('ml-2 text-[10px] font-normal', STATUS_COLORS[summary.status] || STATUS_COLORS.none)}
          >
            {getSeasonStatusLabel(summary.status)}
          </Badge>
        )}
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader className="space-y-1 pb-4 border-b">
            <div className="flex items-center justify-between pr-6">
              <SheetTitle className="text-lg">Opérations saison</SheetTitle>
              <Button variant="ghost" size="icon" onClick={loadData} disabled={loading} className="h-8 w-8">
                <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
              </Button>
            </div>
            <SheetDescription>
              {seasonLabelFromId(season)}
              {summary && (
                <Badge className={cn('ml-2', STATUS_COLORS[summary.status])}>
                  {getSeasonStatusLabel(summary.status)}
                </Badge>
              )}
            </SheetDescription>
          </SheetHeader>
          <div className="mt-4">{operationsBody}</div>
        </SheetContent>
      </Sheet>
      {modals}
    </>
  );
}
