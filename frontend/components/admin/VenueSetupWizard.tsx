"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Building2, Map, Grid3x3, CalendarRange, Calendar, ChevronLeft, ChevronRight,
  Ticket, QrCode, Trash2, Check,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { venuesApi, getVenueApiErrorMessage } from "@/lib/api/venues";
import { mappingsApi, type Mapping } from "@/lib/api/mappings";
import { zonesApi, type Zone } from "@/lib/api/zones";
import { eventsApi } from "@/lib/api/events";
import { subscriptionPlansApi } from "@/lib/api/subscription-plans";
import { EventTicketTiersManager } from "@/components/admin/EventTicketTiersManager";
import { config } from "@/lib/config";
import { DEFAULT_SUBSCRIPTION_SEASON, SUBSCRIPTION_SEASONS } from "@/lib/seasons";

const STEPS = [
  { id: 1, label: "Lieu", icon: Building2 },
  { id: 2, label: "Cartographie", icon: Map },
  { id: 3, label: "Zones", icon: Grid3x3 },
  { id: 4, label: "Usage", icon: CalendarRange },
  { id: 5, label: "Billetterie", icon: Ticket },
];

const SPORT_CATEGORY_CODES = ["foot-match", "basket-match", "volley-match"];

type UsageType = "season" | "event" | null;

const ZONE_TYPES = [
  { value: "SEATING_AREA", label: "Places assises" },
  { value: "STANDING_AREA", label: "Places debout" },
  { value: "VIP_AREA", label: "Zone VIP" },
  { value: "SERVICE_AREA", label: "Zone de service" },
  { value: "STAFF_AREA", label: "Zone staff" },
];

const ZONE_CATEGORIES = [
  { value: "STANDARD", label: "Standard" },
  { value: "PREMIUM", label: "Premium" },
  { value: "BASIC", label: "Basique" },
  { value: "VIP", label: "VIP" },
  { value: "ACCESSIBLE", label: "Accessible (PMR)" },
];

interface VenueSetupWizardProps {
  venueId?: string;
}

function slugify(name: string) {
  return name.toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function VenueSetupWizard({ venueId: initialVenueId }: VenueSetupWizardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const organizerId = config.organizer.getOrganizerId();

  const [step, setStep] = useState(Number(searchParams.get("step") || 1));
  const [loading, setLoading] = useState(false);
  const [venueId, setVenueId] = useState<string | undefined>(initialVenueId);
  const [mappingId, setMappingId] = useState<string | undefined>(searchParams.get("mappingId") || undefined);
  const [createdEventId, setCreatedEventId] = useState<string | undefined>(undefined);
  const [createdPlanId, setCreatedPlanId] = useState<string | undefined>(undefined);
  const [zones, setZones] = useState<Zone[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [usageType, setUsageType] = useState<UsageType>(null);

  const [venueForm, setVenueForm] = useState({
    name: "", description: "", address: "", city: "", country: "TN", max_capacity: 1000,
  });
  const [mappingForm, setMappingForm] = useState({
    name: "", code: "", mapping_type: "DEFAULT" as string, effective_capacity: 1000, description: "",
  });
  const [zoneForm, setZoneForm] = useState({
    name: "", code: "", zone_type: "SEATING_AREA", category: "STANDARD", capacity: 500, base_price: 0,
  });
  const [seasonPlanForm, setSeasonPlanForm] = useState({
    name: "", code: "", price: 0, season: DEFAULT_SUBSCRIPTION_SEASON,
    valid_from: "", valid_until: "",
  });
  const [eventForm, setEventForm] = useState({
    name: "", description: "", category: "", scheduledStart: "", scheduledEnd: "", capacityTotal: "",
  });

  const eventCategories = useMemo(
    () => categories.filter((c: any) => !SPORT_CATEGORY_CODES.includes(c.code)),
    [categories],
  );

  const updateUrl = useCallback((s: number, vId?: string, mId?: string) => {
    const base = vId ? `/admin/venues/${vId}/setup` : "/admin/venues/setup";
    const params = new URLSearchParams({ step: String(s) });
    if (mId) params.set("mappingId", mId);
    router.replace(`${base}?${params.toString()}`);
  }, [router]);

  useEffect(() => {
    if (!initialVenueId) return;
    let cancelled = false;
    (async () => {
      try {
        const r = await venuesApi.getById(initialVenueId);
        if (cancelled || !r.success || !r.data) return;
        const v: any = r.data;
        setVenueForm({
          name: v.name || "",
          description: v.description || "",
          address: v.address || "",
          city: v.city || "",
          country: v.country || "TN",
          max_capacity: v.max_capacity || v.capacity || 1000,
        });

        // Load existing mappings so going back doesn't recreate them
        const mRes = await mappingsApi.getAll(initialVenueId);
        if (cancelled || !mRes.success || mRes.data.length === 0) return;
        const defaultId = v.default_mapping_id || v.defaultMappingId;
        const existing = mRes.data.find((m) => m.id === defaultId) || mRes.data[0];
        if (existing) {
          setMappingId(existing.id);
          setMappingForm({
            name: existing.name || "",
            code: existing.code || "",
            mapping_type: existing.mapping_type || "DEFAULT",
            effective_capacity: existing.effective_capacity || v.max_capacity || 1000,
            description: existing.description || "",
          });
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [initialVenueId]);

  useEffect(() => {
    eventsApi.getEventCategories?.().then((r: any) => {
      const list = r?.data || r?.categories || [];
      if (Array.isArray(list)) setCategories(list);
    }).catch(() => {});
  }, []);

  const loadZones = useCallback(async () => {
    if (!mappingId) return;
    const res = await zonesApi.getAll({});
    if (res.success) {
      setZones(res.data.filter((z) => z.mapping_id === mappingId));
    }
  }, [mappingId]);

  useEffect(() => { loadZones(); }, [loadZones]);

  const capacity = useMemo(() => {
    const limits = [mappingForm.effective_capacity, venueForm.max_capacity].filter(
      (c) => typeof c === "number" && c > 0,
    ) as number[];
    const limit = limits.length ? Math.min(...limits) : 0;
    const used = zones.reduce((sum, z) => sum + (z.capacity || 0), 0);
    const remaining = limit > 0 ? Math.max(0, limit - used) : Infinity;
    return { limit, used, remaining };
  }, [mappingForm.effective_capacity, venueForm.max_capacity, zones]);

  const stepValid = useMemo(() => {
    switch (step) {
      case 1: return venueForm.name && venueForm.address && venueForm.city && venueForm.max_capacity >= 1;
      case 2: return mappingForm.name && mappingForm.code && mappingForm.effective_capacity >= 1;
      case 3: return zones.length >= 1;
      case 4: return usageType !== null;
      default: return true;
    }
  }, [step, venueForm, mappingForm, zones, usageType]);

  const saveVenue = async () => {
    setLoading(true);
    try {
      const payload = {
        name: venueForm.name,
        slug: slugify(venueForm.name),
        address: venueForm.address,
        city: venueForm.city,
        country: venueForm.country || "TN",
        max_capacity: venueForm.max_capacity,
        description: venueForm.description || undefined,
      };
      if (venueId) {
        await venuesApi.update(venueId, payload);
        toast({ title: "Lieu mis à jour" });
        setStep(2);
        updateUrl(2, venueId, mappingId);
      } else {
        const res = await venuesApi.create(payload);
        const id = res.data?.id;
        if (!id) throw new Error("ID lieu manquant");
        setVenueId(id);
        toast({ title: "Lieu créé", description: "Passez à la cartographie." });
        router.replace(`/admin/venues/${id}/setup?step=2`);
      }
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message || getVenueApiErrorMessage(err), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const saveMapping = async () => {
    if (!venueId) return;
    setLoading(true);
    try {
      const effectiveCapacity = Math.min(mappingForm.effective_capacity, venueForm.max_capacity);
      if (mappingId) {
        // Idempotent: update the already-created mapping instead of recreating it
        await mappingsApi.update(mappingId, {
          name: mappingForm.name,
          code: mappingForm.code,
          mapping_type: mappingForm.mapping_type,
          effective_capacity: effectiveCapacity,
          description: mappingForm.description || undefined,
        });
        setStep(3);
        updateUrl(3, venueId, mappingId);
        toast({ title: "Cartographie mise à jour" });
        return;
      }
      const res = await mappingsApi.create({
        venue_id: venueId,
        name: mappingForm.name,
        code: mappingForm.code,
        mapping_type: mappingForm.mapping_type,
        event_categories: [],
        effective_capacity: effectiveCapacity,
        description: mappingForm.description || undefined,
        is_active: true,
      });
      const id = res.data?.id;
      if (!id) throw new Error("ID cartographie manquant");
      setMappingId(id);
      await venuesApi.update(venueId, { default_mapping_id: id });
      setStep(3);
      updateUrl(3, venueId, id);
      toast({ title: "Cartographie créée" });
    } catch (err: any) {
      toast({ title: "Erreur", description: err?.response?.data?.message || err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const removeZone = async (zoneId: string) => {
    setLoading(true);
    try {
      await zonesApi.delete(zoneId);
      await loadZones();
      toast({ title: "Zone supprimée" });
    } catch (err: any) {
      toast({ title: "Erreur", description: err?.response?.data?.message || err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const addZone = async () => {
    if (!mappingId) return;
    if (capacity.limit > 0 && capacity.used + zoneForm.capacity > capacity.limit) {
      toast({
        title: "Capacité dépassée",
        description: `Il reste ${capacity.remaining} place(s) disponible(s) sur ${capacity.limit}. Réduisez la capacité de la zone.`,
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    try {
      await zonesApi.create({
        mapping_id: mappingId,
        name: zoneForm.name,
        code: zoneForm.code,
        zone_type: zoneForm.zone_type,
        category: zoneForm.category,
        capacity: zoneForm.capacity,
        base_price: zoneForm.base_price,
        currency: "TND",
        is_active: true,
      });
      setZoneForm({ name: "", code: "", zone_type: "SEATING_AREA", category: "STANDARD", capacity: 500, base_price: 0 });
      await loadZones();
      toast({ title: "Zone ajoutée" });
    } catch (err: any) {
      toast({ title: "Erreur", description: err?.response?.data?.message || err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const saveSeasonPlan = async () => {
    setLoading(true);
    try {
      const [sy, ey] = seasonPlanForm.season.split("-");
      const validFrom = seasonPlanForm.valid_from || `${sy}-07-01`;
      const validUntil = seasonPlanForm.valid_until || `${ey}-06-30`;
      const res = await subscriptionPlansApi.create({
        code: seasonPlanForm.code,
        name: seasonPlanForm.name,
        type: "SEASON",
        price: seasonPlanForm.price,
        currency: "TND",
        organizer_id: organizerId,
        valid_from: validFrom,
        valid_until: validUntil,
        metadata: { season: seasonPlanForm.season },
        zones: zones.map((z) => ({ zone_id: z.id, is_included: true })),
      });
      const planId = res?.data?.id || res?.id;
      setCreatedPlanId(planId);
      toast({ title: "Plan saison créé" });
    } catch (err: any) {
      toast({ title: "Erreur", description: err?.response?.data?.message || err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const saveEvent = async () => {
    if (!venueId || !mappingId) return;
    setLoading(true);
    try {
      const res = await eventsApi.createEvent({
        name: eventForm.name,
        description: eventForm.description || eventForm.name,
        type: "CONCERT",
        category: eventForm.category,
        venueId,
        mappingId,
        scheduledStart: eventForm.scheduledStart,
        scheduledEnd: eventForm.scheduledEnd,
        capacityTotal: eventForm.capacityTotal ? Number(eventForm.capacityTotal) : undefined,
      } as any);
      const payload = (res as any)?.data ?? res;
      const newId = payload?.id;
      if (!newId) {
        throw new Error("L'événement a été créé mais l'identifiant est introuvable.");
      }
      setCreatedEventId(newId);
      toast({ title: "Événement créé", description: eventForm.name });
    } catch (err: any) {
      toast({ title: "Erreur", description: err?.response?.data?.message || err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const goNext = async () => {
    if (step === 1) { await saveVenue(); return; }
    if (step === 2) { await saveMapping(); return; }
    if (step === 3) { setStep(4); updateUrl(4, venueId, mappingId); return; }
    if (step === 4) { setStep(5); updateUrl(5, venueId, mappingId); return; }
  };

  const goPrev = () => {
    const prev = Math.max(1, step - 1);
    setStep(prev);
    updateUrl(prev, venueId, mappingId);
  };

  const onUsageSelect = (type: UsageType) => {
    if (type !== usageType) {
      setCreatedPlanId(undefined);
      setCreatedEventId(undefined);
    }
    setUsageType(type);
    const nextMappingType = type === "season" ? "SEASONAL" : type === "event" ? "EVENT_SPECIFIC" : mappingForm.mapping_type;
    if (type === "season") {
      setMappingForm((f) => ({ ...f, mapping_type: "SEASONAL" }));
      const [sy, ey] = DEFAULT_SUBSCRIPTION_SEASON.split("-");
      setSeasonPlanForm((f) => ({
        ...f,
        valid_from: `${sy}-07-01`,
        valid_until: `${ey}-06-30`,
      }));
    } else if (type === "event") {
      setMappingForm((f) => ({ ...f, mapping_type: "EVENT_SPECIFIC" }));
    }
    // Best-effort: keep the persisted mapping type in sync with chosen usage
    if (mappingId && nextMappingType !== mappingForm.mapping_type) {
      mappingsApi.update(mappingId, { mapping_type: nextMappingType }).catch(() => {});
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Stepper */}
      <div className="flex items-center">
        {STEPS.map((s, idx) => {
          const Icon = s.icon;
          const done = s.id < step;
          const current = s.id === step;
          return (
            <div key={s.id} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-full border-2 transition-colors ${
                    current
                      ? "border-primary bg-primary text-primary-foreground"
                      : done
                      ? "border-green-500 bg-green-500 text-white"
                      : "border-muted bg-background text-muted-foreground"
                  }`}
                >
                  {done ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                </div>
                <span
                  className={`text-xs font-medium whitespace-nowrap ${
                    current ? "text-primary" : done ? "text-green-600" : "text-muted-foreground"
                  }`}
                >
                  {s.label}
                </span>
              </div>
              {idx < STEPS.length - 1 && (
                <div className={`h-0.5 flex-1 mx-2 mb-5 rounded ${done ? "bg-green-500" : "bg-muted"}`} />
              )}
            </div>
          );
        })}
      </div>

      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Étape 1 — Lieu</CardTitle>
            <CardDescription>Informations du lieu physique.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div><Label>Nom *</Label><Input value={venueForm.name} onChange={(e) => setVenueForm((f) => ({ ...f, name: e.target.value }))} /></div>
            <div><Label>Description</Label><Textarea value={venueForm.description} onChange={(e) => setVenueForm((f) => ({ ...f, description: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Adresse *</Label><Input value={venueForm.address} onChange={(e) => setVenueForm((f) => ({ ...f, address: e.target.value }))} /></div>
              <div><Label>Ville *</Label><Input value={venueForm.city} onChange={(e) => setVenueForm((f) => ({ ...f, city: e.target.value }))} /></div>
              <div><Label>Pays</Label><Input value={venueForm.country} onChange={(e) => setVenueForm((f) => ({ ...f, country: e.target.value }))} /></div>
              <div><Label>Capacité max *</Label><Input type="number" min={1} value={venueForm.max_capacity} onChange={(e) => setVenueForm((f) => ({ ...f, max_capacity: Number(e.target.value) }))} /></div>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Étape 2 — Cartographie</CardTitle>
            <CardDescription>Configuration d&apos;usage du lieu (disposition des places).</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div><Label>Nom *</Label><Input value={mappingForm.name} onChange={(e) => setMappingForm((f) => ({ ...f, name: e.target.value, code: f.code || slugify(e.target.value).toUpperCase().slice(0, 20) }))} placeholder="Ex: Configuration Football" /></div>
            <div><Label>Code *</Label><Input value={mappingForm.code} onChange={(e) => setMappingForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))} /></div>
            <div><Label>Type</Label>
              <Select value={mappingForm.mapping_type} onValueChange={(v) => setMappingForm((f) => ({ ...f, mapping_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="DEFAULT">Par défaut</SelectItem>
                  <SelectItem value="SEASONAL">Saisonnière</SelectItem>
                  <SelectItem value="EVENT_SPECIFIC">Événement spécifique</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Capacité effective *</Label><Input type="number" min={1} max={venueForm.max_capacity} value={mappingForm.effective_capacity} onChange={(e) => setMappingForm((f) => ({ ...f, effective_capacity: Number(e.target.value) }))} /></div>
            <div><Label>Description</Label><Textarea value={mappingForm.description} onChange={(e) => setMappingForm((f) => ({ ...f, description: e.target.value }))} /></div>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Étape 3 — Zones</CardTitle>
            <CardDescription>Ajoutez au moins une zone (tribune, gradin, fosse…).</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {capacity.limit > 0 && (
              <div className="rounded-lg border bg-muted/40 p-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Capacité utilisée</span>
                  <span className={`font-medium ${capacity.used > capacity.limit ? "text-red-600" : ""}`}>
                    {capacity.used} / {capacity.limit} places
                  </span>
                </div>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-200">
                  <div
                    className={`h-full transition-all ${capacity.used > capacity.limit ? "bg-red-600" : capacity.remaining === 0 ? "bg-amber-500" : "bg-primary"}`}
                    style={{ width: `${Math.min(100, capacity.limit ? (capacity.used / capacity.limit) * 100 : 0)}%` }}
                  />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {capacity.remaining === Infinity ? "" : `Capacité restante : ${capacity.remaining} place(s).`}
                </p>
              </div>
            )}
            {zones.length > 0 ? (
              <div className="space-y-2">
                {zones.map((z) => (
                  <div key={z.id} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{z.code}</Badge>
                      <span className="font-medium">{z.name}</span>
                      <span className="text-muted-foreground">· {z.capacity} pl.</span>
                      {typeof z.base_price === "number" && z.base_price > 0 && (
                        <span className="text-muted-foreground">· {z.base_price} TND</span>
                      )}
                    </div>
                    <Button type="button" variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={() => removeZone(z.id)} disabled={loading}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Aucune zone pour le moment. Ajoutez-en au moins une.</p>
            )}
            <div className="grid grid-cols-2 gap-4 border-t pt-4">
              <div><Label>Code zone *</Label><Input value={zoneForm.code} onChange={(e) => setZoneForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))} /></div>
              <div><Label>Nom *</Label><Input value={zoneForm.name} onChange={(e) => setZoneForm((f) => ({ ...f, name: e.target.value }))} /></div>
              <div><Label>Type</Label>
                <Select value={zoneForm.zone_type} onValueChange={(v) => setZoneForm((f) => ({ ...f, zone_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ZONE_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Catégorie</Label>
                <Select value={zoneForm.category} onValueChange={(v) => setZoneForm((f) => ({ ...f, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ZONE_CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Capacité</Label><Input type="number" min={1} value={zoneForm.capacity} onChange={(e) => setZoneForm((f) => ({ ...f, capacity: Number(e.target.value) }))} /></div>
              <div><Label>Prix de base (TND)</Label><Input type="number" min={0} value={zoneForm.base_price} onChange={(e) => setZoneForm((f) => ({ ...f, base_price: Number(e.target.value) }))} /></div>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={addZone}
              disabled={loading || !zoneForm.code || !zoneForm.name || zoneForm.capacity < 1 || (capacity.limit > 0 && capacity.remaining <= 0)}
            >
              Ajouter la zone
            </Button>
            {capacity.limit > 0 && capacity.remaining <= 0 && (
              <p className="text-xs text-amber-600">Capacité maximale atteinte. Supprimez ou réduisez une zone pour en ajouter une autre.</p>
            )}
          </CardContent>
        </Card>
      )}

      {step === 4 && (
        <Card>
          <CardHeader>
            <CardTitle>Étape 4 — Type d&apos;usage</CardTitle>
            <CardDescription>Abonnement saisonnier ou événement ponctuel ?</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button type="button" onClick={() => onUsageSelect("season")} className={`p-6 border-2 rounded-lg text-left transition-colors ${usageType === "season" ? "border-primary bg-primary/5" : "border-gray-200 hover:border-gray-300"}`}>
              <CalendarRange className="h-8 w-8 text-primary mb-2" />
              <div className="font-semibold">Saison (abonnements)</div>
              <p className="text-sm text-muted-foreground mt-1">Football, multi-matchs — plans avec metadata.season et cartes physiques.</p>
            </button>
            <button type="button" onClick={() => onUsageSelect("event")} className={`p-6 border-2 rounded-lg text-left transition-colors ${usageType === "event" ? "border-primary bg-primary/5" : "border-gray-200 hover:border-gray-300"}`}>
              <Calendar className="h-8 w-8 text-purple-600 mb-2" />
              <div className="font-semibold">Événement ponctuel</div>
              <p className="text-sm text-muted-foreground mt-1">Concert, match isolé — billets digitaux liés à un événement.</p>
            </button>
          </CardContent>
        </Card>
      )}

      {step === 5 && usageType === "season" && (
        <Card>
          <CardHeader>
            <CardTitle>Étape 5 — Plan d&apos;abonnement</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Code plan *</Label><Input value={seasonPlanForm.code} onChange={(e) => setSeasonPlanForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))} /></div>
              <div><Label>Nom *</Label><Input value={seasonPlanForm.name} onChange={(e) => setSeasonPlanForm((f) => ({ ...f, name: e.target.value }))} /></div>
              <div><Label>Saison</Label>
                <Select value={seasonPlanForm.season} onValueChange={(v) => setSeasonPlanForm((f) => ({ ...f, season: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SUBSCRIPTION_SEASONS.map((s) => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Prix (TND)</Label><Input type="number" min={0} value={seasonPlanForm.price} onChange={(e) => setSeasonPlanForm((f) => ({ ...f, price: Number(e.target.value) }))} /></div>
            </div>
            <p className="text-sm text-muted-foreground">Zones incluses : {zones.map((z) => z.code).join(", ")}</p>
            {!createdPlanId ? (
              <Button onClick={saveSeasonPlan} disabled={loading || !seasonPlanForm.code || !seasonPlanForm.name}>Créer le plan</Button>
            ) : (
              <div className="flex gap-3">
                <Button asChild><Link href="/admin/qr-codes"><QrCode className="mr-2 h-4 w-4" />Générer les QR cartes</Link></Button>
                <Button variant="outline" asChild><Link href="/admin/subscriptions/plans">Voir les plans</Link></Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {step === 5 && usageType === "event" && (
        <Card>
          <CardHeader>
            <CardTitle>Étape 5 — Événement & billets digitaux</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {!createdEventId ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2"><Label>Nom événement *</Label><Input value={eventForm.name} onChange={(e) => setEventForm((f) => ({ ...f, name: e.target.value }))} /></div>
                  <div className="col-span-2"><Label>Description</Label><Textarea value={eventForm.description} onChange={(e) => setEventForm((f) => ({ ...f, description: e.target.value }))} /></div>
                  <div><Label>Catégorie *</Label>
                    <Select value={eventForm.category} onValueChange={(v) => setEventForm((f) => ({ ...f, category: v }))}>
                      <SelectTrigger><SelectValue placeholder="Choisir" /></SelectTrigger>
                      <SelectContent>
                        {eventCategories.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Capacité</Label><Input type="number" value={eventForm.capacityTotal} onChange={(e) => setEventForm((f) => ({ ...f, capacityTotal: e.target.value }))} /></div>
                  <div><Label>Début *</Label><Input type="datetime-local" value={eventForm.scheduledStart} onChange={(e) => setEventForm((f) => ({ ...f, scheduledStart: e.target.value }))} /></div>
                  <div><Label>Fin *</Label><Input type="datetime-local" value={eventForm.scheduledEnd} onChange={(e) => setEventForm((f) => ({ ...f, scheduledEnd: e.target.value }))} /></div>
                </div>
                <p className="text-xs text-muted-foreground">Lieu : {venueForm.name} · Cartographie verrouillée</p>
                <Button onClick={saveEvent} disabled={loading || !eventForm.name || !eventForm.category || !eventForm.scheduledStart}>Créer l&apos;événement</Button>
              </>
            ) : (
              <>
                <Badge variant="outline">Événement créé — {eventForm.name}</Badge>
                <EventTicketTiersManager
                  eventId={createdEventId}
                  zones={zones.map((z) => ({ id: z.id, name: z.name, code: z.code }))}
                />
                <div className="flex gap-3 pt-2">
                  <Button variant="outline" asChild>
                    <Link href={`/admin/qr-codes?mode=event&eventId=${createdEventId}`}>
                      <QrCode className="mr-2 h-4 w-4" />Voir dans QR admin
                    </Link>
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Footer navigation */}
      <div className="flex items-center justify-between gap-3 border-t pt-4">
        <Button variant="outline" onClick={goPrev} disabled={step === 1 || loading}>
          <ChevronLeft className="mr-1 h-4 w-4" /> Précédent
        </Button>
        {step < 5 ? (
          <Button onClick={goNext} disabled={!stepValid || loading}>
            {loading ? <LoadingSpinner size="sm" /> : <>Suivant <ChevronRight className="ml-1 h-4 w-4" /></>}
          </Button>
        ) : (
          <Button variant="outline" asChild>
            <Link href="/admin/venues">Terminer</Link>
          </Button>
        )}
      </div>
    </div>
  );
}
