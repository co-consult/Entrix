"use client";

import { useCallback, useEffect, useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { EmptyState } from "@/components/ui/empty-state";
import {
  ShoppingCart,
  Receipt,
  Ticket,
  TrendingUp,
  QrCode,
} from "lucide-react";
import { EventCombobox } from "@/components/admin/EventCombobox";
import { EventTicketSalesModal } from "@/components/admin/EventTicketSalesModal";
import { eventsApi } from "@/lib/api/events";
import { eventTicketsApi, SellableTicketOption } from "@/lib/api/event-tickets";
import Link from "next/link";

export default function TicketSalesPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [sellable, setSellable] = useState<SellableTicketOption[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [salesStats, setSalesStats] = useState({ total_sales: 0, total_revenue: 0 });
  const [loading, setLoading] = useState(false);
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [salesPage, setSalesPage] = useState(1);
  const [salesTotalPages, setSalesTotalPages] = useState(1);

  useEffect(() => {
    eventsApi
      .getEvents(1, 500, {}, true)
      .then((res) => setEvents(res.events || []))
      .finally(() => setLoadingEvents(false));
  }, []);

  const loadData = useCallback(async () => {
    if (!selectedEventId) {
      setSellable([]);
      setSales([]);
      return;
    }
    setLoading(true);
    try {
      const [sellRes, salesRes] = await Promise.all([
        eventTicketsApi.listSellableOptions(selectedEventId),
        eventTicketsApi.listSales(selectedEventId, { page: salesPage, limit: 20 }),
      ]);
      setSellable(sellRes.data || []);
      setSales(salesRes.data || []);
      setSalesStats(salesRes.stats || { total_sales: 0, total_revenue: 0 });
      setSalesTotalPages(salesRes.pagination?.totalPages ?? 1);
    } catch {
      setSellable([]);
      setSales([]);
    } finally {
      setLoading(false);
    }
  }, [selectedEventId, salesPage]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const selectedEvent = events.find((e) => e.id === selectedEventId);
  const totalAvailable = sellable.reduce((s, o) => s + o.available_for_sale, 0);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar type="admin" />
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="px-8 w-full">
          <PageHeader
            title="Ventes de billets"
            description="Gestion des ventes au comptoir pour les événements."
          >
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <Link href="/admin/qr-codes?mode=event">
                  <QrCode className="mr-2 h-4 w-4" />
                  Gérer les QR
                </Link>
              </Button>
              <Button
                disabled={!selectedEventId || totalAvailable === 0}
                onClick={() => setShowSaleModal(true)}
              >
                <ShoppingCart className="mr-2 h-4 w-4" />
                Nouvelle vente
              </Button>
            </div>
          </PageHeader>

          <Card className="mb-6">
            <CardContent className="pt-6">
              <label className="text-sm font-medium mb-2 block">Événement</label>
              {loadingEvents ? (
                <LoadingSpinner size="sm" />
              ) : (
                <EventCombobox
                  events={events.map((ev) => ({
                    id: ev.id,
                    name: ev.name,
                    venueName: ev.venueName || ev.venue?.name,
                    scheduledStart: ev.scheduledStart || ev.scheduled_start,
                  }))}
                  value={selectedEventId}
                  onChange={(id) => {
                    setSelectedEventId(id);
                    setSalesPage(1);
                  }}
                />
              )}
            </CardContent>
          </Card>

          {!selectedEventId ? (
            <EmptyState
              icon={<Ticket className="h-12 w-12" />}
              title="Sélectionnez un événement"
              description="Choisissez un événement pour voir le stock et l'historique des ventes."
            />
          ) : loading ? (
            <div className="flex justify-center py-16">
              <LoadingSpinner size="lg" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Ticket className="h-4 w-4 text-blue-500" />
                      Stock disponible
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{totalAvailable}</p>
                    <p className="text-xs text-muted-foreground">billets à vendre</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Receipt className="h-4 w-4 text-purple-500" />
                      Ventes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{salesStats.total_sales}</p>
                    <p className="text-xs text-muted-foreground">commandes</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-emerald-500" />
                      Revenus
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{salesStats.total_revenue.toLocaleString()} TND</p>
                    <p className="text-xs text-muted-foreground">{selectedEvent?.name}</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Stock par catégorie</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {sellable.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Aucun billet en stock — générez des QR d&apos;abord.</p>
                    ) : (
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b text-left text-muted-foreground">
                            <th className="py-2">Catégorie</th>
                            <th className="py-2">Zone</th>
                            <th className="py-2">Prix</th>
                            <th className="py-2 text-right">Dispo</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sellable.map((o) => (
                            <tr key={o.option_key} className="border-b">
                              <td className="py-2">{o.ticket_type_name}</td>
                              <td className="py-2">{o.zone_name || "—"}</td>
                              <td className="py-2">{o.price} TND</td>
                              <td className="py-2 text-right font-semibold">{o.available_for_sale}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Historique des ventes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {sales.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Aucune vente enregistrée.</p>
                    ) : (
                      <div className="space-y-2 max-h-80 overflow-y-auto">
                        {sales.map((s) => (
                          <div key={s.id} className="border rounded-lg p-3 text-sm">
                            <div className="flex justify-between font-medium">
                              <span className="font-mono text-xs">{s.order_number}</span>
                              <span>{s.total_amount} TND</span>
                            </div>
                            <div className="text-muted-foreground text-xs mt-1">
                              {s.ticket_type_name} × {s.quantity} · {s.guest_name || "Client comptoir"}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {new Date(s.created_at).toLocaleString("fr-FR")} · {s.payment_method}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {salesTotalPages > 1 && (
                      <div className="flex justify-end gap-2 mt-4">
                        <Button variant="outline" size="sm" disabled={salesPage <= 1} onClick={() => setSalesPage((p) => p - 1)}>
                          Préc.
                        </Button>
                        <span className="text-sm self-center">{salesPage}/{salesTotalPages}</span>
                        <Button variant="outline" size="sm" disabled={salesPage >= salesTotalPages} onClick={() => setSalesPage((p) => p + 1)}>
                          Suiv.
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </div>
      </div>

      <EventTicketSalesModal
        open={showSaleModal}
        onOpenChange={setShowSaleModal}
        eventId={selectedEventId}
        eventName={selectedEvent?.name}
        onSuccess={loadData}
      />
    </div>
  );
}
