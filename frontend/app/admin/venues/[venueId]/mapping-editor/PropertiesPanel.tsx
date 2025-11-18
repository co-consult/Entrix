import React from "react";
import { Zone, AccessPoint } from "./types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle } from "lucide-react";

type ZoneUpdate = Partial<import("./types").Zone> & { _delete?: boolean };

export interface PropertiesPanelProps {
  zones: Zone[];
  selectedZone: string | null;
  accessPoints: AccessPoint[];
  selectedAccessPoint: string | null;
  updateZone: (id: string, updates: Partial<Zone>) => void;
  updateAccessPoint: (id: string, updates: Partial<AccessPoint>) => void;
  savingZoneIds?: string[];
  savingAPIds?: string[];
  savedZoneIds?: string[];
  savedAPIds?: string[];
}

const ZONE_TYPES = [
  { value: 'GENERAL_ADMISSION', label: 'Admission Générale' },
  { value: 'RESERVED_SEATING', label: 'Places Réservées' },
  { value: 'VIP', label: 'VIP' },
  { value: 'PREMIUM', label: 'Premium' },
  { value: 'STANDING', label: 'Debout' },
  { value: 'WHEELCHAIR_ACCESSIBLE', label: 'Accès Fauteuil' },
  { value: 'FAMILY', label: 'Famille' },
  { value: 'QUIET', label: 'Silencieux' },
  { value: 'SMOKING', label: 'Fumeur' },
  { value: 'BAR', label: 'Bar' },
  { value: 'MERCHANDISE', label: 'Boutique' },
];
const ZONE_CATEGORIES = [
  { value: 'MAIN_ARENA', label: 'Parterre' },
  { value: 'CONCESSION', label: 'Concession' },
  { value: 'PARKING', label: 'Parking' },
  { value: 'ENTRANCE', label: 'Entrée' },
  { value: 'EXIT', label: 'Sortie' },
  { value: 'EMERGENCY', label: 'Urgence' },
  { value: 'STAFF', label: 'Staff' },
  { value: 'MEDIA', label: 'Média' },
  { value: 'VIP_LOUNGE', label: 'VIP Lounge' },
  { value: 'BACKSTAGE', label: 'Backstage' },
];
const ACCESS_POINT_TYPES = [
  { value: "Entrée Principale", label: "Entrée Principale" },
  { value: "Entrée VIP", label: "Entrée VIP" },
  { value: "Entrée Staff", label: "Entrée Staff" },
  { value: "Sortie Secours", label: "Sortie Secours" },
  { value: "Sortie Standard", label: "Sortie Standard" },
];

export default function PropertiesPanel({
  zones,
  selectedZone,
  accessPoints,
  selectedAccessPoint,
  updateZone,
  updateAccessPoint,
  savingZoneIds = [],
  savingAPIds = [],
  savedZoneIds = [],
  savedAPIds = [],
}: PropertiesPanelProps) {
  const zone = zones.find(z => z.id === selectedZone);
  const ap = accessPoints.find(a => a.id === selectedAccessPoint);
  return (
    <div className="w-[340px] h-full bg-background border-l border-gray-200 flex flex-col">
      <Card className="shadow-none border-none rounded-none h-full flex flex-col">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold">Propriétés</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col gap-4">
          {zone && (
            <div>
              <div className="mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Zone</div>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="zone-name">Nom</Label>
                  <Input id="zone-name" value={zone.name} onChange={e => updateZone(zone.id, { name: e.target.value } as ZoneUpdate)} className="mt-1" />
                  <div className="flex gap-2 mt-1 h-4">
                    {savingZoneIds.includes(zone.id) && <span className="text-xs text-muted-foreground">Enregistrement...</span>}
                    {savedZoneIds.includes(zone.id) && <span className="text-xs text-green-600">Enregistré !</span>}
                  </div>
                </div>
                <div>
                  <Label htmlFor="zone-type">Type</Label>
                  <select
                    id="zone-type"
                    value={zone.type}
                    onChange={e => updateZone(zone.id, { type: e.target.value } as ZoneUpdate)}
                    className="mt-1 w-full border rounded px-2 py-1 text-sm"
                  >
                    {ZONE_TYPES.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                </div>
                <div>
                  <Label htmlFor="zone-category">Catégorie</Label>
                  <select
                    id="zone-category"
                    value={(zone as any).category || ''}
                    onChange={e => updateZone(zone.id, { category: e.target.value } as ZoneUpdate)}
                    className="mt-1 w-full border rounded px-2 py-1 text-sm"
                  >
                    {ZONE_CATEGORIES.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                </div>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <Label htmlFor="zone-capacity">Capacité</Label>
                    <Input id="zone-capacity" type="number" min={0} value={zone.capacity} onChange={e => updateZone(zone.id, { capacity: Number(e.target.value) } as ZoneUpdate)} className="mt-1" />
                  </div>
                  <div className="flex-1">
                    <Label htmlFor="zone-color">Couleur</Label>
                    <Input id="zone-color" type="color" value={zone.color || "#1976d2"} onChange={e => updateZone(zone.id, { color: e.target.value } as ZoneUpdate)} className="mt-1 h-9 p-0 border-none bg-transparent" />
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <Label htmlFor="zone-x">X</Label>
                    <Input id="zone-x" type="number" value={zone.x} onChange={e => updateZone(zone.id, { x: Number(e.target.value) } as ZoneUpdate)} className="mt-1" />
                  </div>
                  <div className="flex-1">
                    <Label htmlFor="zone-y">Y</Label>
                    <Input id="zone-y" type="number" value={zone.y} onChange={e => updateZone(zone.id, { y: Number(e.target.value) } as ZoneUpdate)} className="mt-1" />
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <Label htmlFor="zone-width">Largeur</Label>
                    <Input id="zone-width" type="number" value={zone.width} onChange={e => updateZone(zone.id, { width: Number(e.target.value) } as ZoneUpdate)} className="mt-1" />
                  </div>
                  <div className="flex-1">
                    <Label htmlFor="zone-height">Hauteur</Label>
                    <Input id="zone-height" type="number" value={zone.height} onChange={e => updateZone(zone.id, { height: Number(e.target.value) } as ZoneUpdate)} className="mt-1" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="zone-description">Description</Label>
                  <Textarea id="zone-description" value={zone.description || ""} onChange={e => updateZone(zone.id, { description: e.target.value } as ZoneUpdate)} rows={2} className="mt-1" />
                </div>
                <Button
                  variant="destructive"
                  className="w-full mt-4"
                  onClick={async () => {
                    if (window.confirm('Supprimer cette zone ?')) await updateZone(zone.id, { _delete: true } as ZoneUpdate);
                  }}
                >
                  Supprimer la zone
                </Button>
              </div>
            </div>
          )}
          {zone && ap && <Separator className="my-4" />}
          {ap && (
            <div>
              <div className="mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Point d'accès</div>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="ap-name">Nom</Label>
                  <Input id="ap-name" value={ap.name || ""} onChange={e => updateAccessPoint(ap.id, { name: e.target.value })} className="mt-1" />
                  <div className="flex gap-2 mt-1 h-4">
                    {savingAPIds.includes(ap.id) && <span className="text-xs text-muted-foreground">Enregistrement...</span>}
                    {savedAPIds.includes(ap.id) && <span className="text-xs text-green-600">Enregistré !</span>}
                  </div>
                </div>
                <div>
                  <Label htmlFor="ap-type">Type</Label>
                  <select
                    id="ap-type"
                    value={ap.type}
                    onChange={e => updateAccessPoint(ap.id, { type: e.target.value })}
                    className="mt-1 w-full border rounded px-2 py-1 text-sm"
                  >
                    {ACCESS_POINT_TYPES.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                </div>
                <div>
                  <Label htmlFor="ap-description">Description</Label>
                  <Textarea id="ap-description" value={ap.description || ""} onChange={e => updateAccessPoint(ap.id, { description: e.target.value })} rows={2} className="mt-1" />
                </div>
                <Button
                  variant="destructive"
                  className="w-full mt-4"
                  onClick={async () => {
                    if (window.confirm("Supprimer ce point d'accès ?")) await updateAccessPoint(ap.id, { _delete: true } as any);
                  }}
                >
                  Supprimer le point d'accès
                </Button>
              </div>
            </div>
          )}
          {!zone && !ap && (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground gap-2 mt-12">
              <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <div className="font-medium">Sélectionnez une zone ou un point d'accès.</div>
              <div className="text-xs">Cliquez sur un élément de la carte pour voir ou éditer ses propriétés.</div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 