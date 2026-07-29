"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { eventTicketsApi, SellableTicketOption } from "@/lib/api/event-tickets";
import { eventsApi } from "@/lib/api/events";
import { EventCombobox } from "@/components/admin/EventCombobox";
import { ArrowLeft, ArrowRight, CheckCircle2, Copy, ShoppingCart } from "lucide-react";

interface EventTicketSalesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId?: string;
  eventName?: string;
  onSuccess?: () => void;
}

const PAYMENT_METHODS = [
  { value: "CASH", label: "Espèces" },
  { value: "CARD", label: "Carte bancaire" },
  { value: "FLOUCI", label: "Flouci" },
  { value: "BANK_TRANSFER", label: "Virement" },
  { value: "CHEQUE", label: "Chèque" },
];

export function EventTicketSalesModal({
  open,
  onOpenChange,
  eventId: initialEventId,
  eventName: initialEventName,
  onSuccess,
}: EventTicketSalesModalProps) {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState<any[]>([]);
  const [eventId, setEventId] = useState(initialEventId || "");
  const [eventName, setEventName] = useState(initialEventName || "");
  const [options, setOptions] = useState<SellableTicketOption[]>([]);
  const [selectedKey, setSelectedKey] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [note, setNote] = useState("");
  const [saleResult, setSaleResult] = useState<any>(null);

  const loadEvents = useCallback(async () => {
    try {
      const res = await eventsApi.getEvents(1, 500, {}, true);
      setEvents(res.events || []);
    } catch {
      setEvents([]);
    }
  }, []);

  const loadOptions = useCallback(async () => {
    if (!eventId) {
      setOptions([]);
      return;
    }
    setLoading(true);
    try {
      const res = await eventTicketsApi.listSellableOptions(eventId);
      const sellable = res.data || [];
      setOptions(sellable);
      if (sellable.length > 0) {
        setSelectedKey(sellable[0].option_key);
      } else {
        setSelectedKey("");
      }
    } catch {
      setOptions([]);
      setSelectedKey("");
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    if (initialEventId) {
      setEventId(initialEventId);
      setEventName(initialEventName || "");
    }
  }, [initialEventId, initialEventName]);

  useEffect(() => {
    if (open) {
      setStep(initialEventId ? 1 : 0);
      setSaleResult(null);
      setQuantity(1);
      if (!initialEventId) {
        loadEvents();
      }
      if (eventId || initialEventId) {
        loadOptions();
      }
    }
  }, [open, initialEventId, eventId, loadEvents, loadOptions]);

  useEffect(() => {
    if (open && eventId) {
      const ev = events.find((e) => e.id === eventId);
      if (ev) setEventName(ev.name);
      loadOptions();
    }
  }, [eventId, open, events, loadOptions]);

  const selected = options.find((o) => o.option_key === selectedKey);
  const maxQty = selected?.available_for_sale ?? 0;
  const total = (selected?.price ?? 0) * quantity;

  const copyQr = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: "Copié", description: "QR copié" });
  };

  const handleSell = async () => {
    if (!selected || !eventId) return;
    setLoading(true);
    try {
      const res = await eventTicketsApi.sell(eventId, {
        ticket_type_id: selected.ticket_type_id,
        zone_id: selected.zone_id || undefined,
        quantity,
        payment_method: paymentMethod,
        guest_name: guestName || undefined,
        guest_phone: guestPhone || undefined,
        guest_email: guestEmail || undefined,
        note: note || undefined,
      });
      setSaleResult(res.data);
      setStep(3);
      onSuccess?.();
      toast({ title: "Vente enregistrée", description: res.message });
    } catch (err: any) {
      toast({
        title: "Erreur",
        description: err?.response?.data?.message || err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Vente de billets
          </DialogTitle>
          <DialogDescription>
            {eventName || "Sélectionnez un événement"} — vente au comptoir
          </DialogDescription>
        </DialogHeader>

        {loading && step < 3 && step !== 0 ? (
          <div className="flex justify-center py-10">
            <LoadingSpinner size="lg" />
          </div>
        ) : step === 0 ? (
          <div className="space-y-4">
            <Label>Événement</Label>
            <EventCombobox
              events={events.map((ev) => ({
                id: ev.id,
                name: ev.name,
                venueName: ev.venueName || ev.venue?.name,
                scheduledStart: ev.scheduledStart || ev.scheduled_start,
              }))}
              value={eventId}
              onChange={setEventId}
            />
          </div>
        ) : step === 1 ? (
          <div className="space-y-4">
            {options.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Aucun billet généré disponible à la vente. Générez des QR d&apos;abord (QR Codes → Billets événement).
              </p>
            ) : (
              <>
                <div>
                  <Label>Catégorie</Label>
                  <Select value={selectedKey} onValueChange={setSelectedKey}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {options.map((o) => (
                        <SelectItem key={o.option_key} value={o.option_key}>
                          {o.ticket_type_name}
                          {o.zone_name ? ` · ${o.zone_name}` : ""}
                          {" "}
                          ({o.available_for_sale} dispo · {o.price} TND)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Quantité</Label>
                  <Input
                    type="number"
                    min={1}
                    max={maxQty}
                    value={quantity}
                    onChange={(e) => {
                      let q = Number(e.target.value);
                      if (q > maxQty) q = maxQty;
                      if (q < 1) q = 1;
                      setQuantity(q);
                    }}
                  />
                  <p className="text-xs text-muted-foreground mt-1">{maxQty} billet(s) en stock</p>
                </div>
                {selected && (
                  <div className="rounded-lg bg-muted p-3 text-sm flex justify-between">
                    <span>Total</span>
                    <span className="font-bold">{total.toFixed(2)} TND</span>
                  </div>
                )}
              </>
            )}
          </div>
        ) : step === 2 ? (
          <div className="space-y-4">
            <div className="rounded-lg border p-3 text-sm space-y-1">
              <p><strong>{selected?.ticket_type_name}</strong> × {quantity}</p>
              <p className="text-muted-foreground">Total : {total.toFixed(2)} TND</p>
            </div>
            <div>
              <Label>Paiement</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Nom client (optionnel)</Label>
              <Input value={guestName} onChange={(e) => setGuestName(e.target.value)} placeholder="Client comptoir" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Téléphone</Label>
                <Input value={guestPhone} onChange={(e) => setGuestPhone(e.target.value)} />
              </div>
              <div>
                <Label>Email</Label>
                <Input type="email" value={guestEmail} onChange={(e) => setGuestEmail(e.target.value)} />
              </div>
            </div>
            <div>
              <Label>Note</Label>
              <Input value={note} onChange={(e) => setNote(e.target.value)} />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-5 w-5" />
              <span className="font-medium">Vente confirmée — {saleResult?.order_number}</span>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {(saleResult?.tickets || []).map((t: any) => (
                <div key={t.ticket_id} className="flex items-center justify-between gap-2 border rounded p-2 text-xs">
                  <span className="font-mono truncate">{t.qr_code}</span>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => copyQr(t.qr_code)}>
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
            <Badge variant="secondary">{saleResult?.total_amount} TND</Badge>
          </div>
        )}

        <DialogFooter className="gap-2">
          {step === 0 && (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
              <Button disabled={!eventId} onClick={() => setStep(1)}>
                Suivant <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </>
          )}
          {step === 1 && (
            <>
              <Button variant="outline" onClick={() => (initialEventId ? onOpenChange(false) : setStep(0))}>
                {initialEventId ? "Annuler" : <><ArrowLeft className="mr-1 h-4 w-4" /> Retour</>}
              </Button>
              <Button disabled={!selected || maxQty < 1} onClick={() => setStep(2)}>
                Suivant <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </>
          )}
          {step === 2 && (
            <>
              <Button variant="outline" onClick={() => setStep(1)}>
                <ArrowLeft className="mr-1 h-4 w-4" /> Retour
              </Button>
              <Button onClick={handleSell} disabled={loading}>
                {loading ? <LoadingSpinner size="sm" /> : "Confirmer la vente"}
              </Button>
            </>
          )}
          {step === 3 && (
            <Button onClick={() => onOpenChange(false)}>Fermer</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
