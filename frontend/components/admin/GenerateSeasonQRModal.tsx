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
import { seasonOperationsApi } from '@/lib/api/subscription-plans';
import { getAllSeasonOptions, mergeSeasonOptionsFromApi, seasonLabelFromId } from '@/lib/seasons';

interface GenerateSeasonQRModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizerId: string;
  targetSeason: string;
  defaultSourceSeason?: string;
  onSuccess?: () => void;
}

export function GenerateSeasonQRModal({
  open,
  onOpenChange,
  organizerId,
  targetSeason,
  defaultSourceSeason,
  onSuccess,
}: GenerateSeasonQRModalProps) {
  const { toast } = useToast();
  const [sourceSeason, setSourceSeason] = useState(defaultSourceSeason || '');
  const [archiveSource, setArchiveSource] = useState(true);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<{
    total: number;
    renewals: number;
    newStock: number;
    perPlan: Array<{ planCode: string; total: number; renewals: number; newStock: number }>;
  } | null>(null);
  const [seasonOptions, setSeasonOptions] = useState<Array<{ id: string; label: string }>>([]);

  useEffect(() => {
    if (!open) return;
    seasonOperationsApi.listSeasons(organizerId).then((res) => {
      if (res?.success) {
        setSeasonOptions(mergeSeasonOptionsFromApi(res.data));
      } else {
        setSeasonOptions(getAllSeasonOptions());
      }
    }).catch(() => setSeasonOptions(getAllSeasonOptions()));
  }, [open, organizerId]);

  useEffect(() => {
    if (open) {
      setSourceSeason(defaultSourceSeason || seasonOptions[0]?.id || '');
      setPreview(null);
    }
  }, [open, defaultSourceSeason, seasonOptions]);

  const loadPreview = async () => {
    if (!sourceSeason) return;
    setLoading(true);
    try {
      const res = await seasonOperationsApi.generateQRs(organizerId, targetSeason, {
        sourceSeason,
        archiveSource,
        dryRun: true,
      });
      setPreview(res.data?.preview || null);
    } catch (err: any) {
      toast({
        title: 'Prévisualisation impossible',
        description: err.response?.data?.message || err.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && sourceSeason) {
      loadPreview();
    }
  }, [open, sourceSeason, archiveSource]);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await seasonOperationsApi.generateQRs(organizerId, targetSeason, {
        sourceSeason,
        archiveSource,
        dryRun: false,
      });
      if (res?.success) {
        toast({
          title: 'QR codes générés',
          description: `${res.data?.inserted ?? 0} QR code(s) créé(s) pour ${seasonLabelFromId(targetSeason)}.`,
        });
        onOpenChange(false);
        onSuccess?.();
        window.dispatchEvent(new CustomEvent('subscriptionPlanChanged'));
      }
    } catch (err: any) {
      toast({
        title: 'Erreur',
        description: err.response?.data?.message || err.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Générer les QR codes</DialogTitle>
          <DialogDescription>
            Migration depuis la saison source vers {seasonLabelFromId(targetSeason)}.
            Les cartes ASSIGNED conservent leur PIN pour les renouvellements.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Saison source</Label>
            <Select value={sourceSeason} onValueChange={setSourceSeason}>
              <SelectTrigger>
                <SelectValue placeholder="Choisir la saison source" />
              </SelectTrigger>
              <SelectContent>
                {seasonOptions
                  .filter((s) => s.id !== targetSeason)
                  .map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.label}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="archive-source"
              checked={archiveSource}
              onCheckedChange={(v) => setArchiveSource(v === true)}
            />
            <Label htmlFor="archive-source" className="font-normal cursor-pointer">
              Archiver les QR de la saison source (DISABLED + PIN placeholder)
            </Label>
          </div>

          {preview && (
            <div className="rounded-lg border bg-muted/40 p-4 text-sm space-y-2">
              <p className="font-semibold">Prévisualisation</p>
              <p>Total : {preview.total} — Renouvellements : {preview.renewals} — Nouveau stock : {preview.newStock}</p>
              {preview.perPlan.length > 0 && (
                <ul className="max-h-40 overflow-y-auto text-xs space-y-1">
                  {preview.perPlan.map((p) => (
                    <li key={p.planCode} className="flex justify-between gap-2">
                      <span className="truncate">{p.planCode}</span>
                      <span className="shrink-0 text-muted-foreground">
                        {p.total} ({p.renewals} ren. / {p.newStock} neuf)
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Annuler
          </Button>
          <Button onClick={handleGenerate} disabled={loading || !preview?.total}>
            {loading ? <LoadingSpinner size="sm" className="mr-2" /> : null}
            Générer les QR
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
