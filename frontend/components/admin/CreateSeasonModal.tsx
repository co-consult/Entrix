'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useToast } from '@/hooks/use-toast';
import {
  nextSeasonId,
  registerCustomSeason,
  seasonLabelFromId,
  mergeSeasonOptionsFromApi,
  type SubscriptionSeasonId,
} from '@/lib/seasons';
import {
  seasonOperationsApi,
  subscriptionPlansApi,
} from '@/lib/api/subscription-plans';
import { config } from '@/lib/config';

const STEPS = ['Source', 'Cible', 'Aperçu', 'Confirmation'] as const;

interface CreateSeasonModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentSeason: SubscriptionSeasonId;
  onSeasonCreated?: (seasonId: SubscriptionSeasonId) => void;
}

export function CreateSeasonModal({
  open,
  onOpenChange,
  currentSeason,
  onSeasonCreated,
}: CreateSeasonModalProps) {
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [sourceSeason, setSourceSeason] = useState(currentSeason);
  const [targetSeason, setTargetSeason] = useState('');
  const [generateAfterClone, setGenerateAfterClone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [seasonOptions, setSeasonOptions] = useState<Array<{ id: string; label: string }>>([]);
  const [previewPlans, setPreviewPlans] = useState<number | null>(null);
  const [preflightBlockers, setPreflightBlockers] = useState<string[]>([]);

  const organizerId = config.organizer.getOrganizerId() || '';

  useEffect(() => {
    if (!open) return;

    setStep(0);
    setSourceSeason(currentSeason);
    setTargetSeason(nextSeasonId(currentSeason));
    setGenerateAfterClone(false);
    setPreviewPlans(null);
    setPreflightBlockers([]);

    if (organizerId) {
      seasonOperationsApi.listSeasons(organizerId).then((res) => {
        if (res?.success) {
          const opts = mergeSeasonOptionsFromApi(res.data);
          setSeasonOptions(opts);
          const latest = opts[0]?.id;
          if (latest) setSourceSeason(latest);
        }
      });
    }
  }, [open, currentSeason, organizerId]);

  useEffect(() => {
    if (step === 2 && organizerId && targetSeason && sourceSeason) {
      setLoading(true);
      seasonOperationsApi
        .preflight(organizerId, targetSeason, 'clone', sourceSeason)
        .then((res) => {
          const pf = res.data;
          setPreflightBlockers(pf?.blockers || []);
          subscriptionPlansApi
            .getAllPlansByOrganizer(organizerId)
            .then((plansRes) => {
              const sourcePlans = (plansRes?.data || []).filter(
                (p: any) => p.metadata?.season === sourceSeason,
              );
              setPreviewPlans(sourcePlans.length);
            })
            .catch(() => setPreviewPlans(null));
        })
        .catch(() => setPreflightBlockers(['Impossible de charger la prévisualisation.']))
        .finally(() => setLoading(false));
    }
  }, [step, organizerId, targetSeason, sourceSeason]);

  const handleClone = async () => {
    if (!/^\d{4}-\d{4}$/.test(targetSeason)) {
      toast({
        title: 'Format invalide',
        description: 'Utilisez le format AAAA-AAAA (ex. 2027-2028).',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const response = await subscriptionPlansApi.cloneSeason({
        sourceSeason,
        targetSeason,
        organizerId: organizerId || undefined,
      });

      if (!response?.success) {
        toast({
          title: 'Erreur',
          description: response?.message || 'Impossible de créer la saison.',
          variant: 'destructive',
        });
        return;
      }

      registerCustomSeason(targetSeason);

      if (generateAfterClone && organizerId) {
        try {
          const genRes = await seasonOperationsApi.generateQRs(organizerId, targetSeason, {
            sourceSeason,
            archiveSource: true,
            dryRun: false,
          });
          toast({
            title: 'Saison créée avec QR',
            description: `${response.data?.createdCount ?? 0} plan(s) et ${genRes.data?.inserted ?? 0} QR généré(s).`,
          });
        } catch (genErr: any) {
          toast({
            title: 'Plans clonés — QR en erreur',
            description: genErr.response?.data?.message || genErr.message,
            variant: 'destructive',
          });
        }
      } else {
        toast({
          title: 'Saison créée',
          description:
            response.message ||
            `${response.data?.createdCount ?? 0} plan(s) cloné(s) pour ${seasonLabelFromId(targetSeason)}.`,
        });
      }

      onOpenChange(false);
      onSeasonCreated?.(targetSeason);
      window.dispatchEvent(new CustomEvent('entrix:season-changed', { detail: targetSeason }));
      window.dispatchEvent(new CustomEvent('subscriptionPlanChanged'));
    } catch (err: any) {
      toast({
        title: 'Erreur',
        description: err.response?.data?.message || err.message || 'Erreur lors de la création de la saison.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const canNext =
    step === 0
      ? !!sourceSeason
      : step === 1
        ? /^\d{4}-\d{4}$/.test(targetSeason)
        : step === 2
          ? preflightBlockers.length === 0
          : true;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Créer une nouvelle saison</DialogTitle>
          <DialogDescription>
            Étape {step + 1}/{STEPS.length} — {STEPS[step]}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 min-h-[140px]">
          {step === 0 && (
            <div className="space-y-2">
              <Label>Saison source</Label>
              <Select value={sourceSeason} onValueChange={setSourceSeason}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(seasonOptions.length ? seasonOptions : [{ id: sourceSeason, label: seasonLabelFromId(sourceSeason) }]).map(
                    (s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.label}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Par défaut : la saison la plus récente de l&apos;API.
              </p>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-2">
              <Label htmlFor="target-season">Nouvelle saison (ID)</Label>
              <Input
                id="target-season"
                value={targetSeason}
                onChange={(e) => setTargetSeason(e.target.value.trim())}
                placeholder="2027-2028"
              />
              <p className="text-xs text-muted-foreground">
                Libellé : {targetSeason ? seasonLabelFromId(targetSeason) : '—'}
              </p>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3 text-sm">
              {loading ? (
                <div className="flex justify-center py-4">
                  <LoadingSpinner />
                </div>
              ) : (
                <>
                  <p>
                    <strong>{previewPlans ?? '—'}</strong> plan(s) seront clonés depuis{' '}
                    <strong>{seasonLabelFromId(sourceSeason)}</strong> vers{' '}
                    <strong>{seasonLabelFromId(targetSeason)}</strong>.
                  </p>
                  {preflightBlockers.length > 0 && (
                    <div className="rounded border border-red-200 bg-red-50 p-3 text-red-800 text-xs">
                      {preflightBlockers.map((b) => (
                        <p key={b}>{b}</p>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3">
              <p className="text-sm">
                Confirmer le clonage de {previewPlans ?? '?'} plan(s) vers {seasonLabelFromId(targetSeason)}.
              </p>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="gen-after"
                  checked={generateAfterClone}
                  onCheckedChange={(v) => setGenerateAfterClone(v === true)}
                />
                <Label htmlFor="gen-after" className="font-normal cursor-pointer text-sm">
                  Générer les QR après clonage
                </Label>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          {step > 0 && (
            <Button variant="outline" onClick={() => setStep((s) => s - 1)} disabled={loading}>
              Précédent
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Annuler
          </Button>
          {step < STEPS.length - 1 ? (
            <Button onClick={() => setStep((s) => s + 1)} disabled={!canNext || loading}>
              Suivant
            </Button>
          ) : (
            <Button onClick={handleClone} disabled={loading || preflightBlockers.length > 0}>
              {loading ? <LoadingSpinner size="sm" className="mr-2" /> : null}
              Créer la saison
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
