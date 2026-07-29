"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  QrCode,
  Ticket,
  Download,
  Search,
  List,
  LayoutGrid,
  Copy,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  ShoppingCart,
  Receipt,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { eventsApi } from "@/lib/api/events";
import { eventTicketsApi, EventTicketRow } from "@/lib/api/event-tickets";
import { zonesApi } from "@/lib/api/zones";
import { EventCombobox } from "@/components/admin/EventCombobox";
import { EventTicketTiersManager } from "@/components/admin/EventTicketTiersManager";
import { EventTicketSalesModal } from "@/components/admin/EventTicketSalesModal";

interface EventTicketsAdminPanelProps {
  initialEventId?: string;
}

const ITEMS_PER_PAGE = 20;

function statusBadge(status?: string) {
  if (!status) return null;
  const map: Record<string, string> = {
    VALID: "bg-green-100 text-green-800",
    USED: "bg-gray-100 text-gray-800",
    EXPIRED: "bg-orange-100 text-orange-800",
    REVOKED: "bg-red-100 text-red-800",
  };
  const label =
    status === "VALID"
      ? "Valide"
      : status === "USED"
        ? "Utilisé"
        : status === "EXPIRED"
          ? "Expiré"
          : status;
  return (
    <Badge variant="secondary" className={map[status] || "bg-gray-100 text-gray-700"}>
      {label}
    </Badge>
  );
}

export default function EventTicketsAdminPanel({ initialEventId }: EventTicketsAdminPanelProps) {
  const { toast } = useToast();
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState(initialEventId || "");
  const [tickets, setTickets] = useState<EventTicketRow[]>([]);
  const [zones, setZones] = useState<any[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [tierFilter, setTierFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [validCount, setValidCount] = useState(0);
  const [viewMode, setViewMode] = useState<"list" | "compact">("list");
  const [panelTab, setPanelTab] = useState<"tickets" | "sales">("tickets");
  const [showSalesModal, setShowSalesModal] = useState(false);
  const [sales, setSales] = useState<any[]>([]);
  const [salesLoading, setSalesLoading] = useState(false);
  const [salesPage, setSalesPage] = useState(1);
  const [salesTotalPages, setSalesTotalPages] = useState(1);
  const [salesStats, setSalesStats] = useState({ total_sales: 0, total_revenue: 0 });

  useEffect(() => {
    eventsApi
      .getEvents(1, 500, {}, true)
      .then((res) => setEvents(res.events || []))
      .catch(() => {
        toast({ title: "Erreur", description: "Impossible de charger les événements", variant: "destructive" });
      })
      .finally(() => setLoadingEvents(false));
  }, [toast]);

  useEffect(() => {
    if (initialEventId) setSelectedEventId(initialEventId);
  }, [initialEventId]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery.trim()), 350);
    return () => clearTimeout(t);
  }, [searchQuery]);

  useEffect(() => {
    setPage(1);
  }, [selectedEventId, tierFilter, debouncedSearch]);

  const loadTickets = useCallback(async () => {
    if (!selectedEventId) {
      setTickets([]);
      setTotalCount(0);
      setValidCount(0);
      return;
    }
    setLoadingTickets(true);
    try {
      const res = await eventTicketsApi.list(selectedEventId, {
        page,
        limit: ITEMS_PER_PAGE,
        ticket_type: tierFilter !== "all" ? tierFilter : undefined,
        search: debouncedSearch || undefined,
      });
      setTickets(res?.data || []);
      setTotalPages(res?.pagination?.totalPages ?? 1);
      setTotalCount(res?.pagination?.total ?? 0);
      setValidCount(res?.stats?.valid ?? 0);
    } catch {
      setTickets([]);
      setTotalCount(0);
    } finally {
      setLoadingTickets(false);
    }
  }, [selectedEventId, page, tierFilter, debouncedSearch]);

  const loadSales = useCallback(async () => {
    if (!selectedEventId) {
      setSales([]);
      return;
    }
    setSalesLoading(true);
    try {
      const res = await eventTicketsApi.listSales(selectedEventId, { page: salesPage, limit: ITEMS_PER_PAGE });
      setSales(res?.data || []);
      setSalesTotalPages(res?.pagination?.totalPages ?? 1);
      setSalesStats(res?.stats || { total_sales: 0, total_revenue: 0 });
    } catch {
      setSales([]);
    } finally {
      setSalesLoading(false);
    }
  }, [selectedEventId, salesPage]);

  const loadZonesForEvent = useCallback(async (eventId: string) => {
    try {
      const eventRes = await eventsApi.getEvent(eventId);
      const eventData = (eventRes as any)?.data ?? eventRes;
      const mappingId = eventData?.mappingId || eventData?.mapping_id;
      if (mappingId) {
        const zRes = await zonesApi.getAll({});
        if (zRes.success) {
          setZones(zRes.data.filter((z) => z.mapping_id === mappingId));
        } else {
          setZones([]);
        }
      } else {
        setZones([]);
      }
    } catch {
      setZones([]);
    }
  }, []);

  useEffect(() => {
    if (!selectedEventId) {
      setTickets([]);
      setZones([]);
      return;
    }
    loadTickets();
    loadZonesForEvent(selectedEventId);
  }, [selectedEventId, loadTickets, loadZonesForEvent]);

  useEffect(() => {
    if (selectedEventId && panelTab === "sales") {
      loadSales();
    }
  }, [selectedEventId, panelTab, loadSales]);

  const refreshAll = () => {
    loadTickets();
    if (panelTab === "sales") loadSales();
  };

  const selectedEvent = events.find((e) => e.id === selectedEventId);

  const [tierOptions, setTierOptions] = useState<string[]>([]);

  useEffect(() => {
    if (!selectedEventId) {
      setTierOptions([]);
      return;
    }
    eventTicketsApi
      .listTicketConfigs(selectedEventId)
      .then((res) => {
        const names = (res.data || [])
          .map((t) => t.ticket_type_name)
          .filter(Boolean) as string[];
        setTierOptions([...new Set(names)].sort());
      })
      .catch(() => setTierOptions([]));
  }, [selectedEventId, tickets.length]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copié", description: "Code QR copié dans le presse-papiers" });
  };

  const exportCsv = async () => {
    if (!selectedEventId) return;
    try {
      const res = await eventTicketsApi.list(selectedEventId, {
        page: 1,
        limit: 10000,
        ticket_type: tierFilter !== "all" ? tierFilter : undefined,
        search: debouncedSearch || undefined,
      });
      const rows = res?.data || [];
      if (rows.length === 0) return;
      const headers = ["ticket_number", "qr_code", "access_code", "ticket_type", "zone", "zone_code", "price", "status"];
      const csvRows = rows.map((t) => [
        t.ticket_number,
        t.qr_code,
        t.access_code,
        t.ticket_type || "",
        t.zone_name || "",
        t.zone_code || "",
        t.price_paid,
        t.status,
      ]);
      const csv = [headers.join(","), ...csvRows.map((r) => r.map((c) => `"${c ?? ""}"`).join(","))].join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `billets-${selectedEvent?.name?.slice(0, 20) || selectedEventId.slice(0, 8)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast({ title: "Erreur", description: "Export impossible", variant: "destructive" });
    }
  };

  const resetFilters = () => {
    setSearchQuery("");
    setTierFilter("all");
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ticket className="h-5 w-5" />
            Billets événement
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Format QR : <code className="text-xs bg-muted px-1 rounded">NTRX:CSS:TKT:ZONE:XXXXXX</code>
            {" "}— sélectionnez un événement, configurez les catégories, puis générez les QR.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Événement</Label>
            {loadingEvents ? (
              <LoadingSpinner size="sm" className="mt-2" />
            ) : (
              <div className="mt-1">
                <EventCombobox
                  events={events.map((ev) => ({
                    id: ev.id,
                    name: ev.name,
                    venueName: ev.venueName || ev.venue?.name,
                    scheduledStart: ev.scheduledStart || ev.scheduled_start,
                  }))}
                  value={selectedEventId}
                  onChange={setSelectedEventId}
                />
              </div>
            )}
          </div>
          {selectedEvent && (
            <p className="text-xs text-muted-foreground">
              {selectedEvent.venueName || selectedEvent.venue?.name || ""}
              {(selectedEvent.scheduledStart || selectedEvent.scheduled_start) &&
                ` · ${new Date(selectedEvent.scheduledStart || selectedEvent.scheduled_start).toLocaleString("fr-FR")}`}
            </p>
          )}
        </CardContent>
      </Card>

      {!selectedEventId ? (
        <EmptyState
          icon={<QrCode className="h-12 w-12" />}
          title="Sélectionnez un événement"
          description="Recherchez et choisissez un événement pour gérer ses billets."
        />
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
            <div className="flex gap-2">
              <Button
                variant={panelTab === "tickets" ? "default" : "outline"}
                size="sm"
                onClick={() => setPanelTab("tickets")}
              >
                <QrCode className="mr-1 h-4 w-4" /> Billets & QR
              </Button>
              <Button
                variant={panelTab === "sales" ? "default" : "outline"}
                size="sm"
                onClick={() => setPanelTab("sales")}
              >
                <Receipt className="mr-1 h-4 w-4" /> Ventes
              </Button>
            </div>
            <Button size="sm" onClick={() => setShowSalesModal(true)}>
              <ShoppingCart className="mr-1 h-4 w-4" /> Vente comptoir
            </Button>
          </div>

          <Card>
            <CardContent className="pt-6">
              <EventTicketTiersManager
                eventId={selectedEventId}
                zones={zones}
                onTicketsGenerated={() => {
                  setPage(1);
                  refreshAll();
                }}
              />
            </CardContent>
          </Card>

          {panelTab === "sales" ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="pt-4 pb-4">
                    <p className="text-xs text-muted-foreground">Ventes</p>
                    <p className="text-2xl font-bold">{salesStats.total_sales}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 pb-4">
                    <p className="text-xs text-muted-foreground">Revenus</p>
                    <p className="text-2xl font-bold">{salesStats.total_revenue.toLocaleString()} TND</p>
                  </CardContent>
                </Card>
              </div>
              <Card>
                <CardHeader>
                  <CardTitle>Historique des ventes</CardTitle>
                </CardHeader>
                <CardContent>
                  {salesLoading ? (
                    <div className="flex justify-center py-8"><LoadingSpinner size="lg" /></div>
                  ) : sales.length === 0 ? (
                    <EmptyState
                      icon={<Receipt className="h-10 w-10" />}
                      title="Aucune vente"
                      description="Enregistrez une vente au comptoir pour commencer."
                    />
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b text-left text-muted-foreground">
                            <th className="py-2 pr-4">Commande</th>
                            <th className="py-2 pr-4">Client</th>
                            <th className="py-2 pr-4">Catégorie</th>
                            <th className="py-2 pr-4">Qté</th>
                            <th className="py-2 pr-4">Montant</th>
                            <th className="py-2 pr-4">Paiement</th>
                            <th className="py-2">Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sales.map((s) => (
                            <tr key={s.id} className="border-b">
                              <td className="py-2 pr-4 font-mono text-xs">{s.order_number}</td>
                              <td className="py-2 pr-4">{s.guest_name || "—"}</td>
                              <td className="py-2 pr-4">{s.ticket_type_name || "—"}</td>
                              <td className="py-2 pr-4">{s.quantity}</td>
                              <td className="py-2 pr-4">{s.total_amount} {s.currency}</td>
                              <td className="py-2 pr-4">{s.payment_method || "—"}</td>
                              <td className="py-2 text-xs">{new Date(s.created_at).toLocaleString("fr-FR")}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  {salesTotalPages > 1 && (
                    <div className="flex justify-end gap-2 mt-4">
                      <Button variant="outline" size="sm" disabled={salesPage <= 1} onClick={() => setSalesPage((p) => p - 1)}>
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="text-sm self-center">{salesPage} / {salesTotalPages}</span>
                      <Button variant="outline" size="sm" disabled={salesPage >= salesTotalPages} onClick={() => setSalesPage((p) => p + 1)}>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
          <>
          {totalCount > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-4 pb-4">
                  <p className="text-xs text-muted-foreground">Total billets</p>
                  <p className="text-2xl font-bold">{totalCount}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-4">
                  <p className="text-xs text-muted-foreground">QR valides</p>
                  <p className="text-2xl font-bold text-green-600">{validCount}</p>
                </CardContent>
              </Card>
              <Card className="col-span-2 md:col-span-1">
                <CardContent className="pt-4 pb-4">
                  <p className="text-xs text-muted-foreground">Pages</p>
                  <p className="text-2xl font-bold">{page} / {totalPages}</p>
                </CardContent>
              </Card>
            </div>
          )}

          <Card>
            <CardHeader className="space-y-4">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <CardTitle className="text-lg">
                  {totalCount} billet{totalCount !== 1 ? "s" : ""}
                </CardTitle>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative flex-1 min-w-[200px] max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher QR, n° billet, zone…"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  {tierOptions.length > 0 && (
                    <Select value={tierFilter} onValueChange={setTierFilter}>
                      <SelectTrigger className="w-[160px]">
                        <SelectValue placeholder="Catégorie" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Toutes catégories</SelectItem>
                        {tierOptions.map((name) => (
                          <SelectItem key={name} value={name}>{name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  <div className="flex items-center gap-1 border rounded-lg p-1">
                    <Button
                      variant={viewMode === "list" ? "default" : "ghost"}
                      size="sm"
                      className="h-8 px-3"
                      onClick={() => setViewMode("list")}
                    >
                      <List className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === "compact" ? "default" : "ghost"}
                      size="sm"
                      className="h-8 px-3"
                      onClick={() => setViewMode("compact")}
                    >
                      <LayoutGrid className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button variant="outline" size="sm" onClick={resetFilters}>
                    <RefreshCw className="mr-2 h-4 w-4" /> Réinitialiser
                  </Button>
                  <Button variant="outline" size="sm" onClick={exportCsv} disabled={totalCount === 0}>
                    <Download className="mr-2 h-4 w-4" /> Export CSV
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loadingTickets ? (
                <div className="flex justify-center py-12">
                  <LoadingSpinner size="lg" />
                </div>
              ) : tickets.length === 0 ? (
                <EmptyState
                  icon={<QrCode className="h-12 w-12" />}
                  title={debouncedSearch || tierFilter !== "all" ? "Aucun résultat" : "Aucun billet généré"}
                  description={
                    debouncedSearch || tierFilter !== "all"
                      ? "Ajustez vos filtres ou réinitialisez la recherche."
                      : "Ajoutez une catégorie puis cliquez sur « QR » pour générer des billets."
                  }
                />
              ) : viewMode === "compact" ? (
                <div className="space-y-2">
                  {tickets.map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all"
                    >
                      <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-600 rounded flex items-center justify-center flex-shrink-0">
                        <QrCode className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-sm font-semibold truncate">{t.qr_code}</span>
                          {statusBadge(t.status)}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                          <span>{t.ticket_type || "—"}</span>
                          {t.zone_name && <span>· {t.zone_name}</span>}
                          <span>· {t.price_paid} TND</span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 flex-shrink-0"
                        onClick={() => t.qr_code && copyToClipboard(t.qr_code)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-muted-foreground">
                        <th className="py-2 pr-4">Code QR</th>
                        <th className="py-2 pr-4">Catégorie</th>
                        <th className="py-2 pr-4">Zone</th>
                        <th className="py-2 pr-4">Prix</th>
                        <th className="py-2 pr-4">Statut</th>
                        <th className="py-2 w-10"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {tickets.map((t) => (
                        <tr key={t.id} className="border-b hover:bg-muted/30">
                          <td className="py-2 pr-4">
                            <span className="font-mono text-xs">{t.qr_code}</span>
                          </td>
                          <td className="py-2 pr-4">{t.ticket_type || "—"}</td>
                          <td className="py-2 pr-4">
                            {t.zone_name ? (
                              <span>{t.zone_name}{t.zone_code ? ` (${t.zone_code})` : ""}</span>
                            ) : (
                              "—"
                            )}
                          </td>
                          <td className="py-2 pr-4">{t.price_paid} TND</td>
                          <td className="py-2 pr-4">{statusBadge(t.status)}</td>
                          <td className="py-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => t.qr_code && copyToClipboard(t.qr_code)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Affichage de{" "}
                    <span className="font-semibold">{(page - 1) * ITEMS_PER_PAGE + 1}</span> à{" "}
                    <span className="font-semibold">{Math.min(page * ITEMS_PER_PAGE, totalCount)}</span> sur{" "}
                    <span className="font-semibold">{totalCount}</span>
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm px-2">
                      Page {page} / {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= totalPages}
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          </>
          )}
        </>
      )}

      <EventTicketSalesModal
        open={showSalesModal}
        onOpenChange={setShowSalesModal}
        eventId={selectedEventId}
        eventName={selectedEvent?.name}
        onSuccess={refreshAll}
      />
    </div>
  );
}
