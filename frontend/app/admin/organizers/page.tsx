"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { EmptyState } from "@/components/ui/empty-state"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, MoreVertical, Edit, Trash2, Eye, Shield, Building2, Calendar, Users, MapPin, CheckCircle, XCircle, AlertTriangle, Plus } from "lucide-react"
import { CustomCurrencyIcon } from "@/components/ui/custom-currency-icon"
import { useToast } from "@/hooks/use-toast"
import { Sidebar } from "@/components/layout/sidebar"
import { PageHeader } from "@/components/ui/page-header"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import apiClient from "@/lib/api"
import { useSession } from "next-auth/react"

const ORGANIZER_TYPES = {
  SPORTS_CLUB: "Club Sportif",
  CULTURAL_PRODUCER: "Producteur Culturel",
  CORPORATE: "Entreprise",
  ASSOCIATION: "Association",
  FEDERATION: "Fédération",
  INSTITUTION: "Institution",
  PRIVATE_COMPANY: "Société Privée"
}

const ORGANIZER_STATUS = {
  PENDING: "En attente",
  ACTIVE: "Actif",
  SUSPENDED: "Suspendu",
  INACTIVE: "Inactif",
  BLACKLISTED: "Blacklisté"
}

const STATUS_COLORS = {
  PENDING: "bg-yellow-100 text-yellow-800",
  ACTIVE: "bg-green-100 text-green-800",
  SUSPENDED: "bg-red-100 text-red-800",
  INACTIVE: "bg-gray-100 text-gray-800",
  BLACKLISTED: "bg-red-100 text-red-800"
}

export default function AdminOrganizersPage() {
  const { data: session, status } = useSession();
  const [organizers, setOrganizers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const { toast } = useToast()
  const [selectedOrganizer, setSelectedOrganizer] = useState<any | null>(null)
  const [viewLoading, setViewLoading] = useState(false)
  const [organizerStats, setOrganizerStats] = useState<any>(null)
  const [showStatsModal, setShowStatsModal] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [showAddOrganizerModal, setShowAddOrganizerModal] = useState(false);
  const [addOrganizerLoading, setAddOrganizerLoading] = useState(false);
  const [addOrganizerError, setAddOrganizerError] = useState<string | null>(null);
  const [newOrganizer, setNewOrganizer] = useState({
    name: '',
    type: 'COMPANY',
    contact_email: '',
    contact_phone: '',
    description: '',
    website: '',
    logo: '',
  });

  useEffect(() => {
    if (session?.user?.access_token) {
      apiClient.setToken(session.user.access_token);
    }
  }, [session?.user?.access_token]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchOrganizers();
    }
  }, [status, searchTerm, statusFilter, typeFilter, page]);

  const fetchOrganizers = async () => {
    setLoading(true)
    setError(null)
    try {
      const params: any = {
        search: searchTerm,
        page,
        limit: 20,
      }
      if (statusFilter !== "all") params.status = statusFilter
      if (typeFilter !== "all") params.type = typeFilter
      
      const response = await apiClient.getOrganizers(params)
      let organizerList: any[] = [];
      let totalPages = 1;
      const respAny = response as any;
      if (Array.isArray(respAny)) {
        organizerList = respAny;
      } else if (respAny && typeof respAny === 'object') {
        if (Array.isArray(respAny.data)) {
          organizerList = respAny.data;
        }
        if (respAny.meta && typeof respAny.meta.totalPages === 'number') {
          totalPages = respAny.meta.totalPages;
        }
      }
      setOrganizers(organizerList)
      setTotalPages(totalPages)
    } catch (err: any) {
      setError("Erreur lors du chargement des organisateurs.")
      setOrganizers([])
    } finally {
      setLoading(false)
    }
  }

  const handleViewStats = async (organizer: any) => {
    setSelectedOrganizer(organizer)
    setViewLoading(true)
    setOrganizerStats(null)
    try {
      const stats = await apiClient.getOrganizerStats(organizer.id)
      setOrganizerStats(stats)
      setShowStatsModal(true)
    } catch (err: any) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les statistiques de l'organisateur",
        variant: "destructive"
      })
    } finally {
      setViewLoading(false)
    }
  }

  const handleStatusChange = async (organizer: any, newStatus: string) => {
    setActionLoading(true)
    try {
      await apiClient.updateOrganizer(organizer.id, { status: newStatus })
      toast({
        title: "Statut mis à jour",
        description: `L'organisateur ${organizer.name} est maintenant ${ORGANIZER_STATUS[newStatus as keyof typeof ORGANIZER_STATUS]?.toLowerCase()}`
      })
      fetchOrganizers()
    } catch (err: any) {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut",
        variant: "destructive"
      })
    } finally {
      setActionLoading(false)
    }
  }

  const handleValidate = async (organizer: any) => {
    await handleStatusChange(organizer, "ACTIVE")
  }

  const handleSuspend = async (organizer: any) => {
    await handleStatusChange(organizer, "SUSPENDED")
  }

  const handleDelete = async (organizer: any) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer l'organisateur "${organizer.name}" ?`)) return
    setActionLoading(true)
    try {
      await apiClient.deleteOrganizer(organizer.id)
      toast({
        title: "Organisateur supprimé",
        description: "L'organisateur a été supprimé avec succès"
      })
      fetchOrganizers()
    } catch (err: any) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer l'organisateur",
        variant: "destructive"
      })
    } finally {
      setActionLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const color = STATUS_COLORS[status as keyof typeof STATUS_COLORS] || "bg-gray-100 text-gray-800"
    const label = ORGANIZER_STATUS[status as keyof typeof ORGANIZER_STATUS] || status
    return <Badge className={color}>{label}</Badge>
  }

  const getTypeLabel = (type: string) => {
    return ORGANIZER_TYPES[type as keyof typeof ORGANIZER_TYPES] || type
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar type="admin" />
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="px-8 w-full">
          <PageHeader
            title="Organisateurs"
            description="Gérez les organisateurs d'événements, leurs statuts et leurs commissions."
          >
            <Button className="ml-auto" variant="default" onClick={() => setShowAddOrganizerModal(true)}>
                <Plus className="mr-2 h-4 w-4" /> Ajouter Organisateur
            </Button>
          </PageHeader>
          
          <div className="flex-1 overflow-auto pt-6 pb-6">
            {/* Filters */}
            <div className="flex items-center gap-3 mb-6">
              <div className="relative flex-1">
                <Input
                  className="pl-10 pr-4 py-2 rounded-full border border-gray-300 shadow-sm focus:ring-2 focus:ring-primary focus:border-primary transition-all text-base"
                  placeholder="Rechercher par nom, email, type..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                  <Search className="h-5 w-5" />
                </span>
              </div>
              
              <select
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
              >
                <option value="all">Tous les statuts</option>
                <option value="PENDING">En attente</option>
                <option value="ACTIVE">Actif</option>
                <option value="SUSPENDED">Suspendu</option>
                <option value="INACTIVE">Inactif</option>
                <option value="BLACKLISTED">Blacklisté</option>
              </select>
              
              <select
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                value={typeFilter}
                onChange={e => setTypeFilter(e.target.value)}
              >
                <option value="all">Tous les types</option>
                <option value="SPORTS_CLUB">Club Sportif</option>
                <option value="CULTURAL_PRODUCER">Producteur Culturel</option>
                <option value="CORPORATE">Entreprise</option>
                <option value="ASSOCIATION">Association</option>
                <option value="FEDERATION">Fédération</option>
                <option value="INSTITUTION">Institution</option>
                <option value="PRIVATE_COMPANY">Société Privée</option>
              </select>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total</CardTitle>
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{organizers.length}</div>
                  <p className="text-xs text-muted-foreground">Organisateurs</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Actifs</CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {organizers.filter(o => o.status === "ACTIVE").length}
                  </div>
                  <p className="text-xs text-muted-foreground">Organisateurs actifs</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">En attente</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {organizers.filter(o => o.status === "PENDING").length}
                  </div>
                  <p className="text-xs text-muted-foreground">En validation</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Suspendus</CardTitle>
                  <XCircle className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {organizers.filter(o => o.status === "SUSPENDED").length}
                  </div>
                  <p className="text-xs text-muted-foreground">Suspendus</p>
                </CardContent>
              </Card>
            </div>

            {/* Organizers Table */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <LoadingSpinner size="lg" />
              </div>
            ) : error ? (
              <EmptyState
                icon={<AlertTriangle className="h-12 w-12" />}
                title="Erreur"
                description={error}
                action={{ label: "Réessayer", onClick: fetchOrganizers }}
              />
            ) : organizers.length === 0 ? (
              <EmptyState
                icon={<Building2 className="h-12 w-12" />}
                title="Aucun organisateur trouvé"
                description={
                  searchTerm || statusFilter !== "all" || typeFilter !== "all"
                    ? "Essayez d'ajuster vos critères de recherche."
                    : "Aucun organisateur n'est disponible."
                }
                action={{ 
                  label: "Réinitialiser", 
                  onClick: () => { 
                    setSearchTerm(""); 
                    setStatusFilter("all"); 
                    setTypeFilter("all") 
                  } 
                }}
              />
            ) : (
              <div className="space-y-2">
                {/* Header Row */}
                <div className="hidden md:flex items-center px-4 py-2 bg-gray-50 rounded-t font-semibold text-xs text-gray-500 uppercase tracking-wider">
                  <div className="w-1/4 min-w-[200px]">Organisateur</div>
                  <div className="w-1/6 min-w-[120px]">Type</div>
                  <div className="w-1/6 min-w-[100px]">Statut</div>
                  <div className="w-1/6 min-w-[120px]">Événements</div>
                  <div className="w-1/6 min-w-[120px]">Lieux</div>
                  <div className="flex-1 flex justify-end pr-2">Actions</div>
                </div>
                
                {/* Organizer count */}
                {!loading && organizers.length > 0 && (
                  <div className="text-sm text-gray-500 mb-2">
                    {organizers.length} organisateur{organizers.length > 1 ? 's' : ''} trouvé{organizers.length > 1 ? 's' : ''}
                  </div>
                )}

                {/* Organizers List */}
                {organizers.map((organizer) => (
                  <div
                    key={organizer.id}
                    className="hidden md:flex items-center px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-1/4 min-w-[200px] flex items-center space-x-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{organizer.name}</div>
                        <div className="text-sm text-gray-500">{organizer.email}</div>
                      </div>
                    </div>
                    
                    <div className="w-1/6 min-w-[120px]">
                      <span className="text-sm text-gray-600">
                        {getTypeLabel(organizer.type)}
                      </span>
                    </div>
                    
                    <div className="w-1/6 min-w-[100px]">
                      {getStatusBadge(organizer.status)}
                    </div>
                    
                    <div className="w-1/6 min-w-[120px] flex items-center space-x-1">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {organizer._count?.events || 0} événements
                      </span>
                    </div>
                    
                    <div className="w-1/6 min-w-[120px] flex items-center space-x-1">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {organizer._count?.venues || 0} lieux
                      </span>
                    </div>
                    
                    <div className="flex-1 flex justify-end space-x-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewStats(organizer)}
                              disabled={viewLoading}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Voir les statistiques</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      
                      {organizer.status === "PENDING" && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleValidate(organizer)}
                                disabled={actionLoading}
                              >
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Valider</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                      
                      {organizer.status === "ACTIVE" && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleSuspend(organizer)}
                                disabled={actionLoading}
                              >
                                <XCircle className="h-4 w-4 text-red-600" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Suspendre</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                      
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button size="sm" variant="outline">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-48" align="end">
                          <div className="space-y-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="w-full justify-start"
                              onClick={() => handleViewStats(organizer)}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              Voir détails
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="w-full justify-start"
                              asChild
                            >
                              <a href={`/admin/organizers/${organizer.id}/edit`}>
                                <Edit className="mr-2 h-4 w-4" />
                                Modifier
                              </a>
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="w-full justify-start text-red-600 hover:text-red-700"
                              onClick={() => handleDelete(organizer)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Supprimer
                            </Button>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats Modal */}
      <Dialog open={showStatsModal} onOpenChange={setShowStatsModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Statistiques - {selectedOrganizer?.name}
            </DialogTitle>
            <DialogDescription>
              Vue détaillée des performances et activités de l'organisateur
            </DialogDescription>
          </DialogHeader>
          
          {viewLoading ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner size="lg" />
            </div>
          ) : organizerStats ? (
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
                <TabsTrigger value="events">Événements</TabsTrigger>
                <TabsTrigger value="revenue">Revenus</TabsTrigger>
                <TabsTrigger value="venues">Lieux</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Total Événements</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{organizerStats.stats?.totalEvents || 0}</div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Événements Actifs</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{organizerStats.stats?.activeEvents || 0}</div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Lieux Gérés</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{organizerStats.stats?.venueCount || 0}</div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Commission Moyenne</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {organizerStats.stats?.averageCommissionRate || 0}%
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Informations Organisateur</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Nom</label>
                        <p className="text-sm">{organizerStats.organizer?.name}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Email</label>
                        <p className="text-sm">{organizerStats.organizer?.email}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Type</label>
                        <p className="text-sm">{getTypeLabel(organizerStats.organizer?.type)}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Statut</label>
                        <p className="text-sm">{getStatusBadge(organizerStats.organizer?.status)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="events" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Événements Récents</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {organizerStats.recentEvents?.length > 0 ? (
                      <div className="space-y-2">
                        {organizerStats.recentEvents.map((event: any) => (
                          <div key={event.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                              <div className="font-medium">{event.name}</div>
                              <div className="text-sm text-gray-500">
                                {new Date(event.scheduled_start).toLocaleDateString('fr-FR')}
                              </div>
                            </div>
                            <Badge>{event.status}</Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-4">Aucun événement récent</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="revenue" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Revenus et Commissions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Commission Moyenne</label>
                        <p className="text-2xl font-bold">{organizerStats.stats?.averageCommissionRate || 0}%</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Total Revenus</label>
                        <p className="text-2xl font-bold">
                          {organizerStats.stats?.totalRevenue?.toLocaleString() || 0} DT
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="venues" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Lieux Gérés</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {organizerStats.venues?.length > 0 ? (
                      <div className="space-y-2">
                        {organizerStats.venues.map((venue: any) => (
                          <div key={venue.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                              <div className="font-medium">{venue.name}</div>
                              <div className="text-sm text-gray-500">{venue.address}</div>
                            </div>
                            <Badge>{venue.capacity} places</Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-4">Aucun lieu géré</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          ) : (
            <Alert>
              <AlertDescription>
                Impossible de charger les statistiques de l'organisateur
              </AlertDescription>
            </Alert>
          )}
          
          <DialogFooter>
            <Button onClick={() => setShowStatsModal(false)}>Fermer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Organizer Modal */}
      <Dialog open={showAddOrganizerModal} onOpenChange={setShowAddOrganizerModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter un organisateur</DialogTitle>
          </DialogHeader>
          <form onSubmit={async e => {
            e.preventDefault();
            setAddOrganizerError(null);
            if (!newOrganizer.name.trim() || !newOrganizer.type || !newOrganizer.contact_email.trim()) {
              setAddOrganizerError("Veuillez remplir tous les champs obligatoires.");
              return;
            }
            setAddOrganizerLoading(true);
            try {
              await apiClient.post('/organizers', newOrganizer);
              setShowAddOrganizerModal(false);
              setNewOrganizer({ name: '', type: 'COMPANY', contact_email: '', contact_phone: '', description: '', website: '', logo: '' });
              fetchOrganizers();
              toast({ title: "Organisateur ajouté avec succès" });
            } catch (err: any) {
              setAddOrganizerError(err?.message || "Erreur lors de l'ajout de l'organisateur");
              toast({ title: "Erreur", description: err?.message || "Erreur lors de l'ajout de l'organisateur", variant: "destructive" });
            } finally {
              setAddOrganizerLoading(false);
            }
          }} className="space-y-4">
            {addOrganizerError && <div className="text-red-600 text-sm font-medium mb-2">{addOrganizerError}</div>}
            <div>
              <label className="block text-xs text-gray-500 mb-1">Nom</label>
              <Input value={newOrganizer.name} onChange={e => setNewOrganizer(o => ({ ...o, name: e.target.value }))} required />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Type</label>
              <select className="w-full border rounded p-2" value={newOrganizer.type} onChange={e => setNewOrganizer(o => ({ ...o, type: e.target.value }))} required>
                <option value="INDIVIDUAL">Individu</option>
                <option value="COMPANY">Entreprise</option>
                <option value="ASSOCIATION">Association</option>
                <option value="GOVERNMENT">Gouvernement</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Email</label>
              <Input value={newOrganizer.contact_email} onChange={e => setNewOrganizer(o => ({ ...o, contact_email: e.target.value }))} required type="email" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Téléphone</label>
              <Input value={newOrganizer.contact_phone} onChange={e => setNewOrganizer(o => ({ ...o, contact_phone: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Description</label>
              <Input value={newOrganizer.description} onChange={e => setNewOrganizer(o => ({ ...o, description: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Site web</label>
              <Input value={newOrganizer.website} onChange={e => setNewOrganizer(o => ({ ...o, website: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Logo (URL)</label>
              <Input value={newOrganizer.logo} onChange={e => setNewOrganizer(o => ({ ...o, logo: e.target.value }))} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowAddOrganizerModal(false)}>Annuler</Button>
              <Button type="submit" disabled={addOrganizerLoading}>{addOrganizerLoading ? 'Ajout...' : 'Ajouter'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
} 