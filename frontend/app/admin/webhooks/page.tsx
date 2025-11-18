"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { EmptyState } from "@/components/ui/empty-state"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, MoreVertical, Eye, Webhook, Plus, Trash2, Edit, Activity, CheckCircle, XCircle, Clock, AlertTriangle, ClipboardCopy, Link2, Info } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Sidebar } from "@/components/layout/sidebar"
import { PageHeader } from "@/components/ui/page-header"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import apiClient from "@/lib/api"
import { webhooksApi } from "@/lib/api/webhooks";
import { saveAs } from "file-saver";

const WEBHOOK_EVENTS = {
  EVENT_CREATED: "Événement créé",
  EVENT_UPDATED: "Événement modifié",
  EVENT_DELETED: "Événement supprimé",
  TICKET_PURCHASED: "Billet acheté",
  PAYMENT_COMPLETED: "Paiement complété",
  PAYMENT_FAILED: "Paiement échoué",
  USER_REGISTERED: "Utilisateur inscrit",
  USER_UPDATED: "Utilisateur modifié",
  ORGANIZER_CREATED: "Organisateur créé",
  ORGANIZER_UPDATED: "Organisateur modifié",
  VENUE_CREATED: "Lieu créé",
  VENUE_UPDATED: "Lieu modifié"
}

const WEBHOOK_STATUS = {
  ACTIVE: "Actif",
  INACTIVE: "Inactif",
  ERROR: "Erreur",
  SUSPENDED: "Suspendu"
}

const WEBHOOK_METHODS = {
  POST: "POST",
  PUT: "PUT",
  PATCH: "PATCH"
}

const STATUS_COLORS = {
  ACTIVE: "bg-green-100 text-green-800",
  INACTIVE: "bg-gray-100 text-gray-800",
  ERROR: "bg-red-100 text-red-800",
  SUSPENDED: "bg-orange-100 text-orange-800"
}

export default function AdminWebhooksPage() {
  const [webhooks, setWebhooks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [eventTypeFilter, setEventTypeFilter] = useState<string>("all");
  const { toast } = useToast()
  const [selectedWebhook, setSelectedWebhook] = useState<any | null>(null)
  const [showWebhookModal, setShowWebhookModal] = useState(false)
  const [stats, setStats] = useState<any>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newWebhook, setNewWebhook] = useState<{
    name: string;
    url: string;
    events: string[];
    method: string;
    headers: Record<string, string>;
    is_active: boolean;
    secret: string;
  }>({
    name: "",
    url: "",
    events: [],
    method: "POST",
    headers: {},
    is_active: true,
    secret: ""
  })
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState("");
  const [expandedFields, setExpandedFields] = useState<{ [key: string]: boolean }>({});
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [webhookToDelete, setWebhookToDelete] = useState<string | null>(null);

  // Filter webhooks by search and dropdowns
  const filteredWebhooks = webhooks.filter((w) =>
    (w.event_type?.toLowerCase().includes(search.toLowerCase()) ||
     w.payment_id?.toLowerCase().includes(search.toLowerCase()) ||
     w.id?.toLowerCase().includes(search.toLowerCase())) &&
    (statusFilter === "all" || w.status === statusFilter) &&
    (eventTypeFilter === "all" || w.event_type === eventTypeFilter)
  );
  const totalPages = Math.max(1, Math.ceil(filteredWebhooks.length / pageSize));
  const paginatedWebhooks = filteredWebhooks.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    fetchWebhooksData()
  }, [])

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchWebhooksData();
    }, 10000); // 10 seconds
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const fetchWebhooksData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [webhooksResponse, statsResponse] = await Promise.all([
        apiClient.getWebhooks(),
        apiClient.getWebhookStats()
      ])
      console.log('Webhooks API response:', webhooksResponse);
      setWebhooks(Array.isArray(webhooksResponse) ? webhooksResponse : [])
      setStats(statsResponse)
    } catch (err: any) {
      setError("Erreur lors du chargement des webhooks.")
    } finally {
      setLoading(false)
    }
  }

  const handleViewWebhook = (webhook: any) => {
    setSelectedWebhook(webhook)
    setShowWebhookModal(true)
  }

  const handleAddWebhook = async () => {
    if (!newWebhook.name || !newWebhook.url || newWebhook.events.length === 0) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive"
      })
      return
    }

    setSaving(true)
    try {
      await webhooksApi.addWebhook(newWebhook)
      toast({
        title: "Webhook ajouté",
        description: "Le webhook a été créé avec succès"
      })
      setNewWebhook({
        name: "",
        url: "",
        events: [],
        method: "POST",
        headers: {},
        is_active: true,
        secret: ""
      })
      setShowAddModal(false)
      fetchWebhooksData()
    } catch (err: any) {
      toast({
        title: "Erreur",
        description: "Impossible de créer le webhook",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteWebhook = async (id: string) => {
    setWebhookToDelete(id);
    setDeleteDialogOpen(true);
  };
  const confirmDeleteWebhook = async () => {
    if (!webhookToDelete) return;
    try {
      await webhooksApi.deleteWebhook(webhookToDelete);
      toast({ title: "Succès", description: `Webhook supprimé avec succès.`, variant: "default" });
      fetchWebhooksData();
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message || "Impossible de supprimer le webhook.", variant: "destructive" });
    } finally {
      setDeleteDialogOpen(false);
      setWebhookToDelete(null);
    }
  };

  const handleToggleWebhook = async (webhookId: string, isActive: boolean) => {
    try {
      await webhooksApi.updateWebhook(webhookId, { is_active: isActive })
      toast({
        title: "Webhook mis à jour",
        description: `Le webhook a été ${isActive ? 'activé' : 'désactivé'}`
      })
      fetchWebhooksData()
    } catch (err: any) {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le webhook",
        variant: "destructive"
      })
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR')
  }

  // Get unique status and event types for dropdowns
  const statusOptions = Array.from(new Set(webhooks.map(w => w.status).filter(Boolean)));
  const eventTypeOptions = Array.from(new Set(webhooks.map(w => w.event_type).filter(Boolean)));

  // Reset to first page when filters/search change
  useEffect(() => { setPage(1); }, [search, statusFilter, eventTypeFilter]);

  // Export helpers
  function exportToCSV(data: any[], filename: string) {
    if (!data.length) return;
    const keys = Object.keys(data[0]);
    const csv = [keys.join(",")].concat(
      data.map(row => keys.map(k => JSON.stringify(row[k] ?? "")).join(","))
    ).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, filename);
  }
  function exportToJSON(data: any[], filename: string) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    saveAs(blob, filename);
  }

  // Add handlers for retry and resend
  const handleRetryWebhook = async (id: string) => {
    try {
      await webhooksApi.retryWebhook(id);
      toast({ title: "Succès", description: `Webhook réessayé avec succès.`, variant: "default" });
      fetchWebhooksData();
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message || "Impossible de réessayer le webhook.", variant: "destructive" });
    }
  };
  const handleResendWebhook = async (id: string) => {
    try {
      await webhooksApi.resendWebhook(id);
      toast({ title: "Succès", description: `Webhook renvoyé avec succès.`, variant: "default" });
      fetchWebhooksData();
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message || "Impossible de renvoyer le webhook.", variant: "destructive" });
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar type="admin" />
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="px-8 w-full">
          <PageHeader
            title="Gestion des Webhooks"
            description="Configuration et surveillance des webhooks système."
          >
            <div className="flex items-center space-x-2">
              <Button 
                variant="default" 
                onClick={() => setShowAddModal(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Ajouter Webhook
              </Button>
            </div>
          </PageHeader>
          
          <div className="flex-1 overflow-auto pt-6 pb-6">
            {/* Stats Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Webhooks</CardTitle>
                  <Webhook className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.totalWebhooks || 0}</div>
                  <p className="text-xs text-muted-foreground">Webhooks configurés</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Actifs</CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.activeWebhooks || 0}</div>
                  <p className="text-xs text-muted-foreground">Webhooks actifs</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Succès</CardTitle>
                  <Activity className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.successRate?.toFixed(1) || 0}%</div>
                  <p className="text-xs text-muted-foreground">Taux de succès</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Erreurs</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.errorCount || 0}</div>
                  <p className="text-xs text-muted-foreground">Erreurs récentes</p>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <div className="mb-4 flex gap-2 items-center">
                    <Input
                placeholder="Rechercher par event, payment ID ou ID..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-80"
                    />
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue>{statusFilter === "all" ? "Tous les statuts" : statusFilter}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les statuts</SelectItem>
                  {statusOptions.map((status) => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
              <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue>{eventTypeFilter === "all" ? "Tous les événements" : eventTypeFilter}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les événements</SelectItem>
                  {eventTypeOptions.map((event) => (
                    <SelectItem key={event} value={event}>{event}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
            </div>

            {/* Export and auto-refresh controls */}
            <div className="mb-2 flex gap-4 items-center">
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => exportToCSV(filteredWebhooks, "webhooks.csv")}>Exporter CSV</Button>
                <Button size="sm" variant="outline" onClick={() => exportToJSON(filteredWebhooks, "webhooks.json")}>Exporter JSON</Button>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={autoRefresh} onCheckedChange={setAutoRefresh} id="auto-refresh" />
                <Label htmlFor="auto-refresh">Auto-refresh</Label>
                  </div>
                </div>

            {/* Webhooks Table */}
            {loading ? (
                <LoadingSpinner size="lg" />
            ) : error ? (
              <Alert variant="destructive">{error}</Alert>
            ) : webhooks.length === 0 ? (
              <EmptyState
                icon={<Webhook size={48} />}
                title="Aucun webhook"
                description="Aucun webhook trouvé avec les critères actuels."
                action={{ label: "Ajouter un webhook", onClick: () => setShowAddModal(true) }}
              />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Webhooks (Logs)</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Payment ID</TableHead>
                        <TableHead>Event Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created At</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedWebhooks.map((webhook) => (
                        <TableRow key={webhook.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="truncate max-w-[120px]">{webhook.id}</span>
                              <Button size="icon" variant="ghost" onClick={() => navigator.clipboard.writeText(webhook.id)} title="Copier l'ID">
                                <ClipboardCopy size={16} />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell>{webhook.payment_id || '-'}</TableCell>
                          <TableCell>{webhook.event_type || '-'}</TableCell>
                          <TableCell>
                            <Badge className={
                              webhook.status === 'DELIVERED' ? 'bg-green-100 text-green-800' :
                              webhook.status === 'FAILED' ? 'bg-red-100 text-red-800' :
                              webhook.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }>
                              {webhook.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{webhook.created_at ? new Date(webhook.created_at).toLocaleString('fr-FR') : '-'}</TableCell>
                          <TableCell>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                  <Button size="sm" variant="outline" onClick={() => handleViewWebhook(webhook)}>
                                    <Eye size={18} />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Voir les détails</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button size="icon" variant="ghost">
                                  <MoreVertical size={18} />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-40 p-2">
                                <Button variant="ghost" className="w-full justify-start text-sm mb-1" onClick={() => handleRetryWebhook(webhook.id)}>
                                  Réessayer (Retry)
                                </Button>
                                <Button variant="ghost" className="w-full justify-start text-sm mb-1" onClick={() => handleResendWebhook(webhook.id)}>
                                  Renvoyer (Resend)
                                </Button>
                                <Button variant="ghost" className="w-full justify-start text-sm text-red-600" onClick={() => handleDeleteWebhook(webhook.id)}>
                                  Supprimer
                                    </Button>
                              </PopoverContent>
                            </Popover>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                 {/* Pagination controls */}
                 <div className="flex items-center justify-between mt-4">
                   <span>Page {page} sur {totalPages}</span>
                   <div className="flex gap-2">
                     <Button size="sm" variant="outline" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Précédent</Button>
                     <Button size="sm" variant="outline" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Suivant</Button>
                   </div>
                 </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Webhook Details Modal */}
      <Dialog open={showWebhookModal} onOpenChange={setShowWebhookModal}>
        <DialogContent className="max-w-2xl w-full">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl font-bold">
              <Link2 className="h-6 w-6 text-primary" />
              Détails du Webhook
            </DialogTitle>
            <DialogDescription className="text-base mt-1 mb-4">
              Informations détaillées sur le webhook.
            </DialogDescription>
          </DialogHeader>
          {selectedWebhook && (
            <div className="space-y-6">
              {/* Section: Informations Générales */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Link2 className="h-5 w-5 text-blue-600" />
                  <span className="font-semibold text-lg">Informations Générales</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">ID</Label>
                    <p className="font-mono text-sm">{selectedWebhook.id}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">URL</Label>
                    <p className="text-sm">{selectedWebhook.url}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Type</Label>
                    <Badge variant="outline">{selectedWebhook.type}</Badge>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Statut</Label>
                    <Badge className={STATUS_COLORS[selectedWebhook.status as keyof typeof STATUS_COLORS]}>{selectedWebhook.status}</Badge>
                  </div>
                </div>
              </div>
              {/* Section: Détails */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Info className="h-5 w-5 text-green-600" />
                  <span className="font-semibold text-lg">Détails</span>
                </div>
                <div className="space-y-2">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Dernier envoi</Label>
                    <p className="text-sm">{selectedWebhook.last_sent_at ? new Date(selectedWebhook.last_sent_at).toLocaleString('fr-FR') : '-'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Réponse</Label>
                    <p className="text-sm">{selectedWebhook.last_response || '-'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowWebhookModal(false)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Webhook Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter un Webhook</DialogTitle>
            <DialogDescription>
              Créer un nouveau webhook pour recevoir les événements
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nom</Label>
              <Input
                id="name"
                value={newWebhook.name}
                onChange={(e) => setNewWebhook({...newWebhook, name: e.target.value})}
                placeholder="Nom du webhook"
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="url">URL</Label>
              <Input
                id="url"
                value={newWebhook.url}
                onChange={(e) => setNewWebhook({...newWebhook, url: e.target.value})}
                placeholder="https://example.com/webhook"
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="method">Méthode HTTP</Label>
              <Select 
                value={newWebhook.method} 
                onValueChange={(value) => setNewWebhook({...newWebhook, method: value})}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(WEBHOOK_METHODS).map(([key, value]) => (
                    <SelectItem key={key} value={key}>{value}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="events">Événements</Label>
              <div className="mt-1 space-y-2 max-h-40 overflow-y-auto">
                {Object.entries(WEBHOOK_EVENTS).map(([key, value]) => (
                  <div key={key} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={key}
                      checked={newWebhook.events.includes(key as string)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setNewWebhook({
                            ...newWebhook,
                            events: [...newWebhook.events, key as string]
                          })
                        } else {
                          setNewWebhook({
                            ...newWebhook,
                            events: newWebhook.events.filter((event: string) => event !== key)
                          })
                        }
                      }}
                    />
                    <Label htmlFor={key} className="text-sm">{value}</Label>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                checked={newWebhook.is_active}
                onCheckedChange={(checked) => setNewWebhook({...newWebhook, is_active: checked})}
              />
              <Label>Actif</Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddModal(false)}>
              Annuler
            </Button>
            <Button onClick={handleAddWebhook} disabled={saving}>
              {saving ? <LoadingSpinner size="sm" /> : "Ajouter"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer ce webhook ? Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Annuler</Button>
            <Button variant="destructive" onClick={confirmDeleteWebhook}>Supprimer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 