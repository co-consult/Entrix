"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { EmptyState } from "@/components/ui/empty-state"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, MoreVertical, Edit, Trash2, Eye, MapPin, Building2, Users, Calendar, Settings, Plus, BarChart3, Layers, AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Sidebar } from "@/components/layout/sidebar"
import { PageHeader } from "@/components/ui/page-header"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { venuesApi } from "@/lib/api/venues"
import Link from "next/link"
import { Textarea } from "@/components/ui/textarea"
import { useSession } from "next-auth/react";

const VENUE_STATUS = {
  ACTIVE: "Actif",
  INACTIVE: "Inactif",
}

const STATUS_COLORS = {
  ACTIVE: "bg-green-100 text-green-800",
  INACTIVE: "bg-gray-100 text-gray-800",
}

export default function AdminVenuesPage() {
  const [venues, setVenues] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const itemsPerPage = 20
  const { toast } = useToast()
  const [selectedVenue, setSelectedVenue] = useState<any | null>(null)
  const [viewLoading, setViewLoading] = useState(false)
  const [venueStats, setVenueStats] = useState<any>(null)
  const [showStatsModal, setShowStatsModal] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [venueToDelete, setVenueToDelete] = useState<any | null>(null);
  const [showVenueModal, setShowVenueModal] = useState(false);
  const [editingVenue, setEditingVenue] = useState(false);
  const [venueLoading, setVenueLoading] = useState(false);
  const defaultForm = () => ({
    name: '',
    description: '',
    address: '',
    city: '',
    country: 'TN',
    max_capacity: 1000,
  });
  const [form, setForm] = useState(defaultForm());

  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "authenticated") {
      fetchVenues();
    }
  }, [status, searchTerm, statusFilter, page]);

  const fetchVenues = async () => {
    setLoading(true)
    setError(null)
    try {
      const params: any = {
        page,
        limit: 20,
      }
      // Only add search if it's not empty
      if (searchTerm && searchTerm.trim()) {
        params.search = searchTerm.trim()
      }
      // Only add status filter if it's not "all"
      if (statusFilter !== "all") {
        params.status = statusFilter === "ACTIVE" ? "active" : statusFilter === "INACTIVE" ? "inactive" : statusFilter.toLowerCase()
      }
      
      console.log('Fetching venues with params:', params)
      const response = await venuesApi.getAll(params)
      console.log('Venues API response:', response)
      
      if (response.success) {
        setVenues(response.data || [])
        setTotalPages(response.meta?.totalPages || 1)
        setTotalCount(response.meta?.total || response.data?.length || 0)
        console.log(`Loaded ${response.data?.length || 0} venues`)
      } else {
        console.warn('Venues API returned success=false:', response)
        setVenues([])
        setTotalPages(1)
        setTotalCount(0)
      }
    } catch (err: any) {
      console.error('Error fetching venues:', err)
      console.error('Error details:', err.response?.data || err.message)
      setError("Erreur lors du chargement des lieux.")
      setVenues([])
      setTotalCount(0)
    } finally {
      setLoading(false)
    }
  }

  const handleViewStats = async (venue: any) => {
    setSelectedVenue(venue)
    setViewLoading(true)
    setVenueStats(null)
    try {
      const response = await venuesApi.getStatistics(venue.id)
      if (response.success) {
        setVenueStats(response.data)
        setShowStatsModal(true)
      } else {
        throw new Error(response.message || 'Failed to load statistics')
      }
    } catch (err: any) {
      console.error('Error loading venue statistics:', err)
      toast({
        title: "Erreur",
        description: err.response?.data?.message || err.message || "Impossible de charger les statistiques du lieu",
        variant: "destructive"
      })
    } finally {
      setViewLoading(false)
    }
  }

  const handleStatusChange = async (venue: any, newStatus: string) => {
    setActionLoading(true)
    try {
      await venuesApi.update(venue.id, { is_active: newStatus === 'ACTIVE' })
      
      toast({
        title: "Statut mis à jour",
        description: `Le lieu ${venue.name} est maintenant ${VENUE_STATUS[newStatus as keyof typeof VENUE_STATUS]?.toLowerCase()}`
      })
      
      fetchVenues()
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

  const handleDelete = (venue: any) => {
    setVenueToDelete(venue)
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    if (!venueToDelete) return
    setActionLoading(true)
    try {
      await venuesApi.delete(venueToDelete.id)
      toast({
        title: "Lieu supprimé",
        description: `Le lieu "${venueToDelete.name}" a été supprimé avec succès`
      })
      setShowDeleteModal(false)
      setVenueToDelete(null)
      fetchVenues()
    } catch (err: any) {
      toast({
        title: "Erreur",
        description: getVenueApiErrorMessage(err, "Impossible de supprimer le lieu"),
        variant: "destructive"
      })
    } finally {
      setActionLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const color = STATUS_COLORS[status as keyof typeof STATUS_COLORS] || "bg-gray-100 text-gray-800"
    const label = VENUE_STATUS[status as keyof typeof VENUE_STATUS] || status
    return <Badge className={color}>{label}</Badge>
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR')
  }

  const openCreateModal = () => {
    setEditingVenue(false);
    setForm(defaultForm());
    setShowVenueModal(true);
  };

  const handleSaveVenue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.max_capacity < 1) {
      toast({ title: 'Erreur', description: 'La capacité maximale doit être au moins 1.', variant: 'destructive' });
      return;
    }
    setVenueLoading(true);
    try {
      // Generate slug from name if not provided
      const slug = form.name.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      
      const venueData = {
        name: form.name,
        slug: slug,
        address: form.address,
        city: form.city,
        country: form.country || 'TN',
        max_capacity: form.max_capacity,
        description: form.description || undefined,
      };

      if (editingVenue) {
        await venuesApi.update(selectedVenue.id, venueData);
        toast({
          title: 'Lieu mis à jour',
          description: `Le lieu "${form.name}" a été mis à jour avec succès.`,
        });
      } else {
        const created = await venuesApi.create(venueData);
        toast({
          title: 'Lieu créé',
          description: `Le lieu "${form.name}" a été créé. Continuez la configuration.`,
        });
        setShowVenueModal(false);
        setForm(defaultForm());
        if (created.data?.id) {
          window.location.href = `/admin/venues/${created.data.id}/setup?step=2`;
          return;
        }
      }
      setShowVenueModal(false);
      setForm(defaultForm());
      fetchVenues();
    } catch (err: any) {
      toast({
        title: 'Erreur',
        description: err?.message || 'Impossible de sauvegarder le lieu.',
        variant: 'destructive',
      });
    } finally {
      setVenueLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar type="admin" />
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="px-8 w-full">
          <PageHeader
            title="Lieux"
            description="Gérez les lieux d'événements, leurs configurations et leurs cartographies."
          >
            <Button className="ml-auto" variant="outline" asChild>
              <Link href="/admin/venues/setup">
                <Settings className="mr-2 h-4 w-4" /> Configurer un lieu
              </Link>
            </Button>
            <Button variant="default" onClick={openCreateModal}>
              <Plus className="mr-2 h-4 w-4" /> Ajouter Lieu
            </Button>
          </PageHeader>
          
          <div className="flex-1 overflow-auto pt-6 pb-6">
            {/* Filters */}
            <div className="flex items-center gap-3 mb-6">
              <div className="relative flex-1">
                <Input
                  className="pl-10 pr-4 py-2 rounded-full border border-gray-300 shadow-sm focus:ring-2 focus:ring-primary focus:border-primary transition-all text-base"
                  placeholder="Rechercher par nom, adresse, ville..."
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
                <option value="ACTIVE">Actif</option>
                <option value="INACTIVE">Inactif</option>
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
                  <div className="text-2xl font-bold">{totalCount}</div>
                  <p className="text-xs text-muted-foreground">Lieux</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Actifs</CardTitle>
                  <MapPin className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {venues.filter(v => v.status === "ACTIVE").length}
                  </div>
                  <p className="text-xs text-muted-foreground">Lieux actifs</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Inactifs</CardTitle>
                  <MapPin className="h-4 w-4 text-gray-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {venues.filter(v => v.status === "INACTIVE" || v.is_active === false).length}
                  </div>
                  <p className="text-xs text-muted-foreground">Sur cette page</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Capacité totale</CardTitle>
                  <Users className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {venues.reduce((sum, v) => sum + (v.max_capacity || v.capacity || 0), 0).toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">places (page courante)</p>
                </CardContent>
              </Card>
            </div>

            {/* Venues Table */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <LoadingSpinner size="lg" />
              </div>
            ) : error ? (
              <EmptyState
                icon={<AlertTriangle className="h-12 w-12" />}
                title="Erreur"
                description={error}
                action={{ label: "Réessayer", onClick: fetchVenues }}
              />
            ) : venues.length === 0 ? (
              <EmptyState
                icon={<Building2 className="h-12 w-12" />}
                title="Aucun lieu trouvé"
                description={
                  searchTerm || statusFilter !== "all"
                    ? "Essayez d'ajuster vos critères de recherche."
                    : "Aucun lieu n'est disponible."
                }
                action={{ 
                  label: "Réinitialiser", 
                  onClick: () => { 
                    setSearchTerm(""); 
                    setStatusFilter("all"); 
                  } 
                }}
              />
            ) : (
              <div className="space-y-2">
                {/* Header Row */}
                <div className="hidden md:flex items-center px-4 py-2 bg-gray-50 rounded-t font-semibold text-xs text-gray-500 uppercase tracking-wider">
                  <div className="w-1/3 min-w-[250px]">Lieu</div>
                  <div className="w-1/6 min-w-[120px]">Statut</div>
                  <div className="w-1/6 min-w-[120px]">Capacité</div>
                  <div className="w-1/6 min-w-[120px]">Événements</div>
                  <div className="w-1/6 min-w-[120px]">Zones</div>
                  <div className="flex-1 flex justify-end pr-2">Actions</div>
                </div>
                
                {/* Venue count */}
                {!loading && venues.length > 0 && (
                  <div className="text-sm text-gray-500 mb-2">
                    {venues.length} lieu{venues.length > 1 ? 'x' : ''} trouvé{venues.length > 1 ? 's' : ''}
                  </div>
                )}

                {/* Venues List */}
                {venues.map((venue) => (
                  <div
                    key={venue.id}
                    className="hidden md:flex items-center px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-1/3 min-w-[250px] flex items-center space-x-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{venue.name}</div>
                        <div className="text-sm text-gray-500">{venue.address}</div>
                      </div>
                    </div>
                    
                    <div className="w-1/6 min-w-[120px]">
                      {getStatusBadge(venue.status)}
                    </div>
                    
                    <div className="w-1/6 min-w-[120px] flex items-center space-x-1">
                      <Users className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {(venue.capacity || venue.max_capacity || 0).toLocaleString()} places
                      </span>
                    </div>
                    
                    <div className="w-1/6 min-w-[120px] flex items-center space-x-1">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {venue._count?.events || 0} événement{(venue._count?.events || 0) !== 1 ? 's' : ''}
                      </span>
                    </div>
                    
                    <div className="w-1/6 min-w-[120px] flex items-center space-x-1">
                      <Layers className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {venue._count?.zones || 0} zone{(venue._count?.zones || 0) !== 1 ? 's' : ''}
                      </span>
                    </div>
                    
                    <div className="flex-1 flex justify-end space-x-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewStats(venue)}
                              disabled={viewLoading}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Voir les statistiques</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button size="sm" variant="outline">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-56 z-50" align="end" sideOffset={4} collisionPadding={8}>
                          <div className="space-y-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="w-full justify-start"
                              onClick={() => handleViewStats(venue)}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              Voir détails
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="w-full justify-start"
                              onClick={() => {
                                setEditingVenue(true);
                                setSelectedVenue(venue);
                                setForm({
                                  name: venue.name,
                                  description: venue.description || '',
                                  address: venue.address || '',
                                  city: venue.city || '',
                                  country: venue.country || 'TN',
                                  max_capacity: venue.max_capacity || venue.capacity || 0,
                                });
                                setShowVenueModal(true);
                              }}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Modifier
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="w-full justify-start"
                              asChild
                            >
                              <Link href={`/admin/venues/${venue.id}/setup`}>
                                <Settings className="mr-2 h-4 w-4" />
                                Continuer configuration
                              </Link>
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="w-full justify-start"
                              asChild
                            >
                              <a href={`/admin/venues/${venue.id}/mapping-editor`}>
                                <Layers className="mr-2 h-4 w-4" />
                                Cartographies
                              </a>
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="w-full justify-start text-red-600 hover:text-red-700"
                              onClick={() => handleDelete(venue)}
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

            {/* Pagination */}
            {!loading && !error && venues.length > 0 && (
              <div className="flex items-center justify-between mt-6 px-4 py-3 bg-white rounded-lg shadow-sm border">
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span>
                    Affichage de <span className="font-semibold">{(page - 1) * itemsPerPage + 1}</span> à{' '}
                    <span className="font-semibold">
                      {Math.min(page * itemsPerPage, totalCount)}
                    </span>{' '}
                    sur <span className="font-semibold">{totalCount}</span> lieu{totalCount > 1 ? 'x' : ''}
                  </span>
                  {totalPages > 1 && (
                    <>
                      <span className="text-gray-400">|</span>
                      <span>
                        Page <span className="font-semibold">{page}</span> sur{' '}
                        <span className="font-semibold">{totalPages}</span>
                      </span>
                    </>
                  )}
                </div>
                
                {totalPages > 1 && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(1)}
                      disabled={page === 1}
                      className="px-3"
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      <ChevronLeft className="h-4 w-4 -ml-2" />
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(Math.max(1, page - 1))}
                      disabled={page === 1}
                      className="px-3"
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Précédent
                    </Button>
                    
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const pageNum = Math.max(1, Math.min(totalPages - 4, page - 2)) + i;
                        return (
                          <Button
                            key={pageNum}
                            variant={pageNum === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => setPage(pageNum)}
                            className="w-8 h-8 p-0"
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(Math.min(totalPages, page + 1))}
                      disabled={page === totalPages}
                      className="px-3"
                    >
                      Suivant
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(totalPages)}
                      disabled={page === totalPages}
                      className="px-3"
                    >
                      <ChevronRight className="h-4 w-4 ml-1" />
                      <ChevronRight className="h-4 w-4 -mr-2" />
                    </Button>
                  </div>
                )}
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
              Statistiques - {selectedVenue?.name}
            </DialogTitle>
            <DialogDescription>
              Vue détaillée des performances et utilisation du lieu
            </DialogDescription>
          </DialogHeader>
          
          {viewLoading ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner size="lg" />
            </div>
          ) : venueStats ? (
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
                <TabsTrigger value="events">Événements</TabsTrigger>
                <TabsTrigger value="capacity">Capacité</TabsTrigger>
                <TabsTrigger value="zones">Zones</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Total Événements
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{venueStats.events_count || 0}</div>
                      <p className="text-xs text-gray-500 mt-1">
                        {venueStats.active_events_count || 0} actifs
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Capacité Max
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{venueStats.max_capacity || 0}</div>
                      <p className="text-xs text-gray-500 mt-1">places</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Layers className="h-4 w-4" />
                        Zones
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{venueStats.zones_count || 0}</div>
                      <p className="text-xs text-gray-500 mt-1">zones configurées</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Mappings
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{venueStats.mappings_count || 0}</div>
                      <p className="text-xs text-gray-500 mt-1">configurations</p>
                    </CardContent>
                  </Card>
                </div>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Informations du Lieu</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Nom</label>
                        <p className="text-sm font-medium">{venueStats.venue_name || selectedVenue?.name}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Statut</label>
                        <div className="mt-1">
                          <Badge variant={venueStats.is_active ? "default" : "secondary"}>
                            {venueStats.is_active ? "Actif" : "Inactif"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="events" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Événements
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 border rounded-lg">
                          <div className="text-sm text-gray-600">Total</div>
                          <div className="text-2xl font-bold">{venueStats.events_count || 0}</div>
                        </div>
                        <div className="p-4 border rounded-lg">
                          <div className="text-sm text-gray-600">Actifs</div>
                          <div className="text-2xl font-bold text-green-600">{venueStats.active_events_count || 0}</div>
                        </div>
                      </div>
                      <p className="text-sm text-gray-500 text-center py-4">
                        Les détails des événements seront disponibles prochainement
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="capacity" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Capacité
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="p-4 border rounded-lg">
                        <div className="text-sm text-gray-600 mb-2">Capacité Maximale</div>
                        <div className="text-3xl font-bold">{venueStats.max_capacity || 0}</div>
                        <p className="text-xs text-gray-500 mt-1">places disponibles</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 border rounded-lg">
                          <div className="text-sm text-gray-600">Zones</div>
                          <div className="text-xl font-bold">{venueStats.zones_count || 0}</div>
                        </div>
                        <div className="p-4 border rounded-lg">
                          <div className="text-sm text-gray-600">Mappings</div>
                          <div className="text-xl font-bold">{venueStats.mappings_count || 0}</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="zones" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Layers className="h-5 w-5" />
                      Zones et Mappings
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 border rounded-lg">
                          <div className="text-sm text-gray-600 mb-2">Nombre de Zones</div>
                          <div className="text-3xl font-bold">{venueStats.zones_count || 0}</div>
                          <p className="text-xs text-gray-500 mt-1">zones configurées</p>
                        </div>
                        <div className="p-4 border rounded-lg">
                          <div className="text-sm text-gray-600 mb-2">Nombre de Mappings</div>
                          <div className="text-3xl font-bold">{venueStats.mappings_count || 0}</div>
                          <p className="text-xs text-gray-500 mt-1">configurations</p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-500 text-center py-4">
                        Pour voir les détails des zones, consultez la page de gestion des zones
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          ) : (
            <Alert>
              <AlertDescription>
                Impossible de charger les statistiques du lieu
              </AlertDescription>
            </Alert>
          )}
          
          <DialogFooter>
            <Button onClick={() => setShowStatsModal(false)}>Fermer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Venue Modal */}
      <Dialog open={showVenueModal} onOpenChange={setShowVenueModal}>
        <DialogContent className="max-w-2xl w-full">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl font-bold">
              <Building2 className="h-6 w-6 text-primary" />
              {editingVenue ? "Modifier le Lieu" : "Nouveau Lieu"}
            </DialogTitle>
            <DialogDescription className="text-base mt-1 mb-4">
              {editingVenue ? "Modifiez les informations du lieu." : "Créez un nouveau lieu. Tous les champs marqués * sont obligatoires."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveVenue} className="space-y-6">
            {/* Section: Informations Générales */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="h-5 w-5 text-blue-600" />
                <span className="font-semibold text-lg">Informations Générales</span>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label htmlFor="venue-name" className="block mb-1 font-medium">Nom *</label>
                  <Input id="venue-name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required placeholder="Nom du lieu" />
                  <p className="text-xs text-muted-foreground mt-1">Le nom du lieu doit être unique.</p>
                </div>
              </div>
              <div className="mt-4">
                <label htmlFor="venue-description" className="block mb-1 font-medium">Description</label>
                <Textarea id="venue-description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} placeholder="Décrivez le lieu..." />
                <p className="text-xs text-muted-foreground mt-1">Ajoutez une description pour donner plus de détails aux participants.</p>
              </div>
            </div>
            {/* Section: Localisation & Capacité */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="h-5 w-5 text-green-600" />
                <span className="font-semibold text-lg">Localisation & Capacité</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="venue-address" className="block mb-1 font-medium">Adresse *</label>
                  <Input id="venue-address" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} required placeholder="Adresse du lieu" />
                </div>
                <div>
                  <label htmlFor="venue-city" className="block mb-1 font-medium">Ville *</label>
                  <Input id="venue-city" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} required placeholder="Ville" />
                </div>
                <div>
                  <label htmlFor="venue-country" className="block mb-1 font-medium">Pays *</label>
                  <Input id="venue-country" value={form.country} onChange={e => setForm(f => ({ ...f, country: e.target.value }))} required placeholder="Pays" />
                </div>
                <div>
                  <label htmlFor="venue-capacity" className="block mb-1 font-medium">Capacité maximale *</label>
                  <Input id="venue-capacity" type="number" value={form.max_capacity} onChange={e => setForm(f => ({ ...f, max_capacity: Number(e.target.value) }))} required min={1} placeholder="Capacité maximale" />
                  <p className="text-xs text-muted-foreground mt-1">Nombre maximum de places disponibles.</p>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowVenueModal(false)}>Annuler</Button>
              <Button type="submit" disabled={venueLoading}>{venueLoading ? "Enregistrement..." : "Enregistrer"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={showDeleteModal} onOpenChange={(open) => { setShowDeleteModal(open); if (!open) setVenueToDelete(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Supprimer le lieu
            </DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer le lieu <span className="font-semibold">&quot;{venueToDelete?.name}&quot;</span> ? Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowDeleteModal(false); setVenueToDelete(null); }} disabled={actionLoading}>
              Annuler
            </Button>
            <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={confirmDelete} disabled={actionLoading}>
              {actionLoading ? <LoadingSpinner size="sm" className="mr-2" /> : <Trash2 className="mr-2 h-4 w-4" />}
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 