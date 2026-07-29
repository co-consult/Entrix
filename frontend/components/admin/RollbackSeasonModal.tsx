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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useToast } from '@/hooks/use-toast';
import { seasonOperationsApi } from '@/lib/api/subscription-plans';
import { seasonLabelFromId } from '@/lib/seasons';
import { AlertTriangle } from 'lucide-react';

interface RollbackSeasonModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizerId: string;
  targetSeason: string;
  sourceSeason?: string;
  onSuccess?: () => void;
}

export function RollbackSeasonModal({
  open,
  onOpenChange,
  organizerId,
  targetSeason,
  sourceSeason,
  onSuccess,
}: RollbackSeasonModalProps) {
  const { toast } = useToast();
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);
  const [blockers, setBlockers] = useState<string[]>([]);

  const expectedConfirm = `ROLLBACK ${targetSeason}`;

  useEffect(() => {
    if (open) {
      setConfirmText('');
      setBlockers([]);
      if (sourceSeason) {
        seasonOperationsApi
          .preflight(organizerId, targetSeason, 'rollback', sourceSeason)
          .then((res) => setBlockers(res.data?.blockers || []))
          .catch(() => setBlockers(['Impossible de charger les vérifications.']));
      } else {
        setBlockers(['Saison source introuvable — impossible de déterminer la migration à annuler.']);
      }
    }
  }, [open, organizerId, targetSeason, sourceSeason]);

  const handleRollback = async () => {
    if (!sourceSeason) return;
    setLoading(true);
    try {
      const res = await seasonOperationsApi.rollbackMigration(organizerId, targetSeason, {
        sourceSeason,
      });
      if (res?.success) {
        toast({
          title: 'Rollback effectué',
          description: `${res.data?.deletedTarget ?? 0} QR supprimé(s), ${res.data?.restoredSource ?? 0} QR source restauré(s).`,
        });
        onOpenChange(false);
        onSuccess?.();
        window.dispatchEvent(new CustomEvent('subscriptionPlanChanged'));
      }
    } catch (err: any) {
      toast({
        title: 'Rollback impossible',
        description: err.response?.data?.message || err.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-700">
            <AlertTriangle className="h-5 w-5" />
            Rollback migration QR
          </DialogTitle>
          <DialogDescription>
            Supprime tous les QR de {seasonLabelFromId(targetSeason)} et restaure les cartes archivées
            de la saison source. Action irréversible si des ventes ont eu lieu.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {blockers.length > 0 && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              <p className="font-semibold mb-1">Blocages</p>
              <ul className="list-disc pl-4 space-y-1">
                {blockers.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            </div>
          )}

          {sourceSeason && (
            <p className="text-sm text-muted-foreground">
              Saison source : <strong>{seasonLabelFromId(sourceSeason)}</strong>
            </p>
          )}

          <div className="space-y-2">
            <Label htmlFor="rollback-confirm">
              Tapez <code className="text-xs bg-muted px-1 rounded">{expectedConfirm}</code> pour confirmer
            </Label>
            <Input
              id="rollback-confirm"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={expectedConfirm}
              autoComplete="off"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Annuler
          </Button>
          <Button
            variant="destructive"
            onClick={handleRollback}
            disabled={
              loading ||
              blockers.length > 0 ||
              confirmText !== expectedConfirm ||
              !sourceSeason
            }
          >
            {loading ? <LoadingSpinner size="sm" className="mr-2" /> : null}
            Rollback
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
