"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, QrCode, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { eventTicketsApi, type EventTicketTier } from "@/lib/api/event-tickets";

const PRESET_TIERS = [
  { name: "Standard", price: 30 },
  { name: "Premium", price: 60 },
  { name: "VIP", price: 120 },
];

export interface ZoneOption {
  id: string;
  name: string;
  code?: string;
  capacity?: number;
}

interface EventTicketTiersManagerProps {
  eventId: string;
  zones: ZoneOption[];
  onTicketsGenerated?: () => void;
}

export function EventTicketTiersManager({
  eventId,
  zones,
  onTicketsGenerated,
}: EventTicketTiersManagerProps) {
  const { toast } = useToast();
  const [tiers, setTiers] = useState<EventTicketTier[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [selectedTier, setSelectedTier] = useState<EventTicketTier | null>(null);
  const [generateCount, setGenerateCount] = useState(10);
  const [actionLoading, setActionLoading] = useState(false);
  const [tierForm, setTierForm] = useState({
    ticket_type_name: "Standard",
    zone_id: "__all__",
    price: 30,
    available_quantity: 100,
  });

  const getMaxStockForZone = useCallback(
    (zoneId: string, excludeTierId?: string) => {
      if (zoneId === "__all__") return undefined;
      const zone = zones.find((z) => z.id === zoneId);
      if (!zone?.capacity) return undefined;
      const usedByOtherTiers = tiers
        .filter((t) => t.zone_id === zoneId && t.id !== excludeTierId)
        .reduce((sum, t) => sum + (t.available_quantity ?? 0), 0);
      return Math.max(0, zone.capacity - usedByOtherTiers);
    },
    [zones, tiers],
  );

  const getMaxGenerateCount = (tier: EventTicketTier | null) => {
    if (!tier) return 5000;
    const caps: number[] = [5000];
    if (tier.remaining != null) caps.push(tier.remaining);
    if (tier.zone_capacity_remaining != null) caps.push(tier.zone_capacity_remaining);
    return Math.min(...caps);
  };

  const loadTiers = useCallback(async () => {
    if (!eventId) return;
    setLoading(true);
    try {
      const res = await eventTicketsApi.listTicketConfigs(eventId);
      setTiers(res.data || []);
    } catch {
      setTiers([]);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    loadTiers();
  }, [loadTiers]);

  const handleAddTier = async () => {
    if (!tierForm.ticket_type_name.trim()) return;
    if (tierForm.zone_id !== "__all__") {
      const maxStock = getMaxStockForZone(tierForm.zone_id);
      if (maxStock != null && tierForm.available_quantity > maxStock) {
        toast({
          title: "Stock trop élevé",
          description: `Maximum ${maxStock} place(s) pour cette zone.`,
          variant: "destructive",
        });
        return;
      }
    }
    setActionLoading(true);
    try {
      await eventTicketsApi.upsertTicketConfig(eventId, {
        ticket_type_name: tierForm.ticket_type_name.trim(),
        zone_id: tierForm.zone_id === "__all__" ? undefined : tierForm.zone_id,
        price: tierForm.price,
        available_quantity: tierForm.available_quantity,
      });
      toast({ title: "Catégorie ajoutée", description: tierForm.ticket_type_name });
      setShowAddModal(false);
      setTierForm({ ticket_type_name: "Standard", zone_id: "__all__", price: 30, available_quantity: 100 });
      await loadTiers();
    } catch (err: any) {
      toast({
        title: "Erreur",
        description: err?.response?.data?.message || err.message,
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteTier = async (tier: EventTicketTier) => {
    setActionLoading(true);
    try {
      await eventTicketsApi.deleteTicketConfig(eventId, tier.id);
      toast({ title: "Catégorie supprimée" });
      await loadTiers();
    } catch (err: any) {
      toast({
        title: "Erreur",
        description: err?.response?.data?.message || err.message,
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const openGenerate = (tier: EventTicketTier) => {
    setSelectedTier(tier);
    const maxCount = getMaxGenerateCount(tier);
    setGenerateCount(Math.min(Math.max(1, maxCount), 10));
    setShowGenerateModal(true);
  };

  const handleGenerate = async () => {
    if (!selectedTier || generateCount < 1) return;
    const maxCount = getMaxGenerateCount(selectedTier);
    if (generateCount > maxCount) {
      toast({
        title: "Quantité invalide",
        description: `Maximum ${maxCount} billet(s) pour cette catégorie/zone.`,
        variant: "destructive",
      });
      return;
    }
    setActionLoading(true);
    try {
      await eventTicketsApi.generateBatch(eventId, {
        ticket_type_id: selectedTier.ticket_type_id,
        zone_id: selectedTier.zone_id || undefined,
        count: generateCount,
        price: selectedTier.price,
        ticket_type_name: selectedTier.ticket_type_name,
      });
      toast({
        title: "Billets générés",
        description: `${generateCount} QR pour « ${selectedTier.ticket_type_name} »`,
      });
      setShowGenerateModal(false);
      setSelectedTier(null);
      await loadTiers();
      onTicketsGenerated?.();
    } catch (err: any) {
      toast({
        title: "Erreur",
        description: err?.response?.data?.message || err.message,
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const applyPreset = (preset: { name: string; price: number }) => {
    setTierForm((f) => ({ ...f, ticket_type_name: preset.name, price: preset.price }));
  };

  if (loading && tiers.length === 0) {
    return (
      <div className="flex justify-center py-6">
        <LoadingSpinner size="md" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-sm">Catégories de billets</h3>
          <p className="text-xs text-muted-foreground">
            Définissez VIP, Premium, Standard… puis générez les QR par catégorie.
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={() => setShowAddModal(true)}>
          <Plus className="mr-1 h-4 w-4" /> Ajouter
        </Button>
      </div>

      {tiers.length === 0 ? (
        <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
          <p>Aucune catégorie définie.</p>
          <p className="mt-1">Ajoutez au moins une catégorie (ex. VIP, Premium, Standard).</p>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            {PRESET_TIERS.map((p) => (
              <Button
                key={p.name}
                size="sm"
                variant="secondary"
                onClick={() => {
                  applyPreset(p);
                  setShowAddModal(true);
                }}
              >
                + {p.name}
              </Button>
            ))}
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-left text-muted-foreground">
                <th className="py-2 px-3">Catégorie</th>
                <th className="py-2 px-3">Zone</th>
                <th className="py-2 px-3">Prix</th>
                <th className="py-2 px-3">Stock</th>
                <th className="py-2 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tiers.map((tier) => (
                <tr key={tier.id} className="border-b last:border-0">
                  <td className="py-2 px-3 font-medium">{tier.ticket_type_name}</td>
                  <td className="py-2 px-3">{tier.zone_name || "Toutes"}</td>
                  <td className="py-2 px-3">{tier.price} TND</td>
                  <td className="py-2 px-3">
                    {tier.available_quantity != null ? (
                      <span>
                        {tier.sold_quantity}/{tier.available_quantity}
                        {tier.remaining != null && tier.remaining <= 0 && (
                          <Badge variant="destructive" className="ml-2 text-xs">Complet</Badge>
                        )}
                      </span>
                    ) : (
                      <span>{tier.sold_quantity} généré(s)</span>
                    )}
                  </td>
                  <td className="py-2 px-3 text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={actionLoading || (tier.remaining != null && tier.remaining <= 0)}
                        onClick={() => openGenerate(tier)}
                      >
                        <QrCode className="mr-1 h-3 w-3" /> QR
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-600"
                        disabled={actionLoading}
                        onClick={() => handleDeleteTier(tier)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add tier modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter une catégorie de billet</DialogTitle>
            <DialogDescription>Ex. VIP, Premium, Standard — avec prix et stock.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-wrap gap-2 mb-2">
            {PRESET_TIERS.map((p) => (
              <Button key={p.name} type="button" size="sm" variant="secondary" onClick={() => applyPreset(p)}>
                {p.name} ({p.price} TND)
              </Button>
            ))}
          </div>
          <div className="space-y-4">
            <div>
              <Label>Nom *</Label>
              <Input
                value={tierForm.ticket_type_name}
                onChange={(e) => setTierForm((f) => ({ ...f, ticket_type_name: e.target.value }))}
                placeholder="VIP, Premium, Standard…"
              />
            </div>
            <div>
              <Label>Zone</Label>
              <Select
                value={tierForm.zone_id}
                onValueChange={(v) => {
                  const maxStock = getMaxStockForZone(v);
                  setTierForm((f) => ({
                    ...f,
                    zone_id: v,
                    available_quantity:
                      maxStock != null ? Math.min(f.available_quantity, maxStock) : f.available_quantity,
                  }));
                }}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Toutes zones</SelectItem>
                  {zones.map((z) => (
                    <SelectItem key={z.id} value={z.id}>
                      {z.name}{z.capacity ? ` (${z.capacity} places)` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Prix (TND)</Label>
                <Input
                  type="number"
                  min={0}
                  value={tierForm.price}
                  onChange={(e) => setTierForm((f) => ({ ...f, price: Number(e.target.value) }))}
                />
              </div>
              <div>
                <Label>Stock disponible</Label>
                <Input
                  type="number"
                  min={1}
                  max={getMaxStockForZone(tierForm.zone_id) ?? undefined}
                  value={tierForm.available_quantity}
                  onChange={(e) => {
                    let qty = Number(e.target.value);
                    const maxStock = getMaxStockForZone(tierForm.zone_id);
                    if (maxStock != null && qty > maxStock) qty = maxStock;
                    setTierForm((f) => ({ ...f, available_quantity: qty }));
                  }}
                />
                {tierForm.zone_id !== "__all__" && (() => {
                  const z = zones.find((x) => x.id === tierForm.zone_id);
                  const maxStock = getMaxStockForZone(tierForm.zone_id);
                  return z?.capacity ? (
                    <p className="text-xs text-muted-foreground mt-1">
                      Capacité zone : {z.capacity} places
                      {maxStock != null && ` · max. ${maxStock} pour cette catégorie`}
                    </p>
                  ) : (
                    <p className="text-xs text-amber-600 mt-1">Cette zone n&apos;a pas de capacité définie.</p>
                  );
                })()}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddModal(false)}>Annuler</Button>
            <Button onClick={handleAddTier} disabled={actionLoading || !tierForm.ticket_type_name.trim()}>
              {actionLoading ? <LoadingSpinner size="sm" /> : "Enregistrer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Generate QR modal */}
      <Dialog open={showGenerateModal} onOpenChange={setShowGenerateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Générer des QR — {selectedTier?.ticket_type_name}</DialogTitle>
            <DialogDescription>
              {selectedTier?.remaining != null
                ? `${selectedTier.remaining} place(s) restante(s) sur ${selectedTier.available_quantity}.`
                : "Génération de billets avec QR unique."}
              {selectedTier?.zone_capacity != null && selectedTier.zone_id && (
                <>
                  {" "}
                  Zone : {selectedTier.zone_tickets_used ?? 0}/{selectedTier.zone_capacity} place(s) utilisée(s)
                  {selectedTier.zone_capacity_remaining != null &&
                    ` (${selectedTier.zone_capacity_remaining} restante(s)).`}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div>
            <Label>Quantité à générer</Label>
            <Input
              type="number"
              min={1}
              max={getMaxGenerateCount(selectedTier)}
              value={generateCount}
              onChange={(e) => {
                let qty = Number(e.target.value);
                const max = getMaxGenerateCount(selectedTier);
                if (qty > max) qty = max;
                setGenerateCount(qty);
              }}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Maximum {getMaxGenerateCount(selectedTier)} · jusqu&apos;à 5000 par opération
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGenerateModal(false)}>Annuler</Button>
            <Button onClick={handleGenerate} disabled={actionLoading || generateCount < 1}>
              {actionLoading ? <LoadingSpinner size="sm" /> : "Générer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
