"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { EmptyState } from "@/components/ui/empty-state"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, MoreVertical, Eye, Shield, AlertTriangle, Users, Lock, Unlock, Trash2, Plus, Activity, BarChart3, Clock, MapPin } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Sidebar } from "@/components/layout/sidebar"
import { PageHeader } from "@/components/ui/page-header"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Textarea } from "@/components/ui/textarea"
import apiClient from "@/lib/api"
import { useSession } from "next-auth/react"

const SECURITY_SEVERITY = {
  LOW: "Faible",
  MEDIUM: "Moyen",
  HIGH: "Élevé",
  CRITICAL: "Critique"
}

const SECURITY_TYPE = {
  LOGIN_ATTEMPT: "Tentative de connexion",
  SUSPICIOUS_ACTIVITY: "Activité suspecte",
  BLACKLIST_VIOLATION: "Violation blacklist",
  RATE_LIMIT_EXCEEDED: "Limite de taux dépassée",
  GEOGRAPHICAL_ANOMALY: "Anomalie géographique",
  MULTIPLE_FAILED_LOGINS: "Multiples échecs de connexion",
  UNAUTHORIZED_ACCESS: "Accès non autorisé",
  DATA_BREACH_ATTEMPT: "Tentative de violation de données"
}

const SEVERITY_COLORS = {
  LOW: "bg-blue-100 text-blue-800",
  MEDIUM: "bg-yellow-100 text-yellow-800",
  HIGH: "bg-orange-100 text-orange-800",
  CRITICAL: "bg-red-100 text-red-800"
}

const BLACKLIST_TYPE = {
  USER: "Utilisateur",
  IP: "Adresse IP",
  EMAIL: "Email",
  PHONE: "Téléphone",
  DEVICE: "Appareil"
}

const BLACKLIST_SCOPE = {
  GLOBAL: "Global",
  ORGANIZER: "Organisateur",
  EVENT: "Événement",
  VENUE: "Lieu"
}

export default function AdminSecurityPage() {
  const [securityEvents, setSecurityEvents] = useState<any[]>([])
  const [blacklistItems, setBlacklistItems] = useState<any[]>([])
  const [auditLogs, setAuditLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("events")
  const [searchTerm, setSearchTerm] = useState("")
  const [severityFilter, setSeverityFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const { toast } = useToast()
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null)
  const [showEventModal, setShowEventModal] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [stats, setStats] = useState<any>(null)
  const [newBlacklistItem, setNewBlacklistItem] = useState({
    type: "USER",
    scope: "GLOBAL",
    value: "",
    reason: ""
  })
  const [showAddBlacklistModal, setShowAddBlacklistModal] = useState(false)
  const { status } = useSession();

  useEffect(() => {
    if (status === "authenticated") {
      fetchSecurityData();
    }
  }, [status]);

  const fetchSecurityData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [eventsResponse, blacklistResponse, auditResponse, statsResponse] = await Promise.all([
        apiClient.request("/security/events"),
        apiClient.request("/security/blacklist"),
        apiClient.request("/audit-logs"),
        apiClient.request("/security/stats")
      ])

      setSecurityEvents(Array.isArray(eventsResponse) ? eventsResponse : [])
      setBlacklistItems(Array.isArray(blacklistResponse) ? blacklistResponse : [])
      setAuditLogs(Array.isArray(auditResponse) ? auditResponse : [])
      setStats(statsResponse)
    } catch (err: any) {
      setError("Erreur lors du chargement des données de sécurité.")
    } finally {
      setLoading(false)
    }
  }

  const handleViewEvent = (event: any) => {
    setSelectedEvent(event)
    setShowEventModal(true)
  }

  const handleAddToBlacklist = async () => {
    if (!newBlacklistItem.value || !newBlacklistItem.reason) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs",
        variant: "destructive"
      })
      return
    }

    setActionLoading(true)
    try {
      await apiClient.request("/security/blacklist", {
        method: "POST",
        body: JSON.stringify(newBlacklistItem)
      })
      
      toast({
        title: "Succès",
        description: "Élément ajouté à la blacklist"
      })
      
      setNewBlacklistItem({
        type: "USER",
        scope: "GLOBAL",
        value: "",
        reason: ""
      })
      setShowAddBlacklistModal(false)
      fetchSecurityData()
    } catch (err: any) {
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter à la blacklist",
        variant: "destructive"
      })
    } finally {
      setActionLoading(false)
    }
  }

  const handleRemoveFromBlacklist = async (itemId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir retirer cet élément de la blacklist ?")) return
    
    setActionLoading(true)
    try {
      await apiClient.request(`/security/blacklist/${itemId}`, {
        method: "DELETE"
      })
      
      toast({
        title: "Succès",
        description: "Élément retiré de la blacklist"
      })
      
      fetchSecurityData()
    } catch (err: any) {
      toast({
        title: "Erreur",
        description: "Impossible de retirer de la blacklist",
        variant: "destructive"
      })
    } finally {
      setActionLoading(false)
    }
  }

  const getSeverityBadge = (severity: string) => {
    const color = SEVERITY_COLORS[severity as keyof typeof SEVERITY_COLORS] || "bg-gray-100 text-gray-800"
    const label = SECURITY_SEVERITY[severity as keyof typeof SECURITY_SEVERITY] || severity
    return <Badge className={color}>{label}</Badge>
  }

  const getTypeLabel = (type: string) => {
    return SECURITY_TYPE[type as keyof typeof SECURITY_TYPE] || type
  }

  const getBlacklistTypeLabel = (type: string) => {
    return BLACKLIST_TYPE[type as keyof typeof BLACKLIST_TYPE] || type
  }

  const getBlacklistScopeLabel = (scope: string) => {
    return BLACKLIST_SCOPE[scope as keyof typeof BLACKLIST_SCOPE] || scope
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('fr-FR')
  }

  const filteredEvents = securityEvents.filter(event => {
    const matchesSearch = !searchTerm || 
      event.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.ip_address?.includes(searchTerm) ||
      event.user_agent?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesSeverity = severityFilter === "all" || event.severity === severityFilter
    const matchesType = typeFilter === "all" || event.event_type === typeFilter
    
    return matchesSearch && matchesSeverity && matchesType
  })

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar type="admin" />
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="px-8 w-full">
          <PageHeader
            title="Sécurité"
            description="Surveillance et gestion de la sécurité du système."
          >
            <Button 
              className="ml-auto" 
              variant="default" 
              onClick={() => setShowAddBlacklistModal(true)}
            >
              <Plus className="mr-2 h-4 w-4" /> Ajouter à Blacklist
            </Button>
          </PageHeader>
          
          <div className="flex-1 overflow-auto pt-6 pb-6">
            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-4 mb-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Événements Sécurité</CardTitle>
                  <Shield className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.totalSecurityEvents || 0}</div>
                  <p className="text-xs text-muted-foreground">Total</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Récents (24h)</CardTitle>
                  <Activity className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.recentSecurityEvents || 0}</div>
                  <p className="text-xs text-muted-foreground">Dernières 24h</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Blacklist</CardTitle>
                  <Lock className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.totalBlacklistItems || 0}</div>
                  <p className="text-xs text-muted-foreground">Éléments</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Actifs</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.activeBlacklistItems || 0}</div>
                  <p className="text-xs text-muted-foreground">En attente</p>
                </CardContent>
              </Card>
            </div>

            {/* Main Content */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="events">Événements Sécurité</TabsTrigger>
                <TabsTrigger value="blacklist">Blacklist</TabsTrigger>
                <TabsTrigger value="audit">Journaux d'Audit</TabsTrigger>
              </TabsList>

              <TabsContent value="events" className="space-y-4">
                {/* Filters */}
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <Input
                      className="pl-10 pr-4 py-2 rounded-full border border-gray-300 shadow-sm focus:ring-2 focus:ring-primary focus:border-primary transition-all text-base"
                      placeholder="Rechercher par description, IP, user agent..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                    />
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                      <Search className="h-5 w-5" />
                    </span>
                  </div>
                  
                  <select
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                    value={severityFilter}
                    onChange={e => setSeverityFilter(e.target.value)}
                  >
                    <option value="all">Toutes les sévérités</option>
                    <option value="LOW">Faible</option>
                    <option value="MEDIUM">Moyen</option>
                    <option value="HIGH">Élevé</option>
                    <option value="CRITICAL">Critique</option>
                  </select>
                  
                  <select
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                    value={typeFilter}
                    onChange={e => setTypeFilter(e.target.value)}
                  >
                    <option value="all">Tous les types</option>
                    <option value="LOGIN_ATTEMPT">Tentative de connexion</option>
                    <option value="SUSPICIOUS_ACTIVITY">Activité suspecte</option>
                    <option value="BLACKLIST_VIOLATION">Violation blacklist</option>
                    <option value="RATE_LIMIT_EXCEEDED">Limite de taux dépassée</option>
                    <option value="GEOGRAPHICAL_ANOMALY">Anomalie géographique</option>
                    <option value="MULTIPLE_FAILED_LOGINS">Multiples échecs de connexion</option>
                    <option value="UNAUTHORIZED_ACCESS">Accès non autorisé</option>
                    <option value="DATA_BREACH_ATTEMPT">Tentative de violation de données</option>
                  </select>
                </div>

                {/* Events Table */}
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <LoadingSpinner size="lg" />
                  </div>
                ) : error ? (
                  <EmptyState
                    icon={<AlertTriangle className="h-12 w-12" />}
                    title="Erreur"
                    description={error}
                    action={{ label: "Réessayer", onClick: fetchSecurityData }}
                  />
                ) : filteredEvents.length === 0 ? (
                  <EmptyState
                    icon={<Shield className="h-12 w-12" />}
                    title="Aucun événement de sécurité"
                    description="Aucun événement de sécurité trouvé avec les critères actuels."
                  />
                ) : (
                  <Card>
                    <CardHeader>
                      <CardTitle>Événements de Sécurité</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Type</TableHead>
                            <TableHead>Sévérité</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>IP</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredEvents.map((event) => (
                            <TableRow key={event.id}>
                              <TableCell>
                                <span className="text-sm font-medium">
                                  {getTypeLabel(event.event_type)}
                                </span>
                              </TableCell>
                              <TableCell>
                                {getSeverityBadge(event.severity)}
                              </TableCell>
                              <TableCell>
                                <div className="max-w-xs truncate">
                                  {event.description}
                                </div>
                              </TableCell>
                              <TableCell>
                                <span className="text-sm text-gray-600">
                                  {event.ip_address || "N/A"}
                                </span>
                              </TableCell>
                              <TableCell>
                                <span className="text-sm text-gray-600">
                                  {formatDate(event.created_at)}
                                </span>
                              </TableCell>
                              <TableCell>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleViewEvent(event)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="blacklist" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Liste Noire</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {blacklistItems.length === 0 ? (
                      <EmptyState
                        icon={<Lock className="h-12 w-12" />}
                        title="Liste noire vide"
                        description="Aucun élément dans la liste noire."
                      />
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Type</TableHead>
                            <TableHead>Scope</TableHead>
                            <TableHead>Valeur</TableHead>
                            <TableHead>Raison</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {blacklistItems.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell>
                                <Badge variant="outline">
                                  {getBlacklistTypeLabel(item.type)}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">
                                  {getBlacklistScopeLabel(item.scope)}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <span className="text-sm font-mono">
                                  {item.value}
                                </span>
                              </TableCell>
                              <TableCell>
                                <div className="max-w-xs truncate">
                                  {item.reason}
                                </div>
                              </TableCell>
                              <TableCell>
                                <span className="text-sm text-gray-600">
                                  {formatDate(item.created_at)}
                                </span>
                              </TableCell>
                              <TableCell>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleRemoveFromBlacklist(item.id)}
                                  disabled={actionLoading}
                                >
                                  <Unlock className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="audit" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Journaux d'Audit</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {auditLogs.length === 0 ? (
                      <EmptyState
                        icon={<BarChart3 className="h-12 w-12" />}
                        title="Aucun journal d'audit"
                        description="Aucun journal d'audit disponible."
                      />
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Action</TableHead>
                            <TableHead>Utilisateur</TableHead>
                            <TableHead>Détails</TableHead>
                            <TableHead>IP</TableHead>
                            <TableHead>Date</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {auditLogs.slice(0, 50).map((log) => (
                            <TableRow key={log.id}>
                              <TableCell>
                                <span className="text-sm font-medium">
                                  {log.action}
                                </span>
                              </TableCell>
                              <TableCell>
                                <span className="text-sm text-gray-600">
                                  {log.user?.email || "Système"}
                                </span>
                              </TableCell>
                              <TableCell>
                                <div className="max-w-xs truncate">
                                  {log.details}
                                </div>
                              </TableCell>
                              <TableCell>
                                <span className="text-sm text-gray-600">
                                  {log.ip_address || "N/A"}
                                </span>
                              </TableCell>
                              <TableCell>
                                <span className="text-sm text-gray-600">
                                  {formatDate(log.created_at)}
                                </span>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Event Details Modal */}
      <Dialog open={showEventModal} onOpenChange={setShowEventModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Détails de l'Événement de Sécurité</DialogTitle>
          </DialogHeader>
          
          {selectedEvent && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Type</label>
                  <p className="text-sm">{getTypeLabel(selectedEvent.event_type)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Sévérité</label>
                  <div className="mt-1">{getSeverityBadge(selectedEvent.severity)}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Adresse IP</label>
                  <p className="text-sm font-mono">{selectedEvent.ip_address || "N/A"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Date</label>
                  <p className="text-sm">{formatDate(selectedEvent.created_at)}</p>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Description</label>
                <p className="text-sm mt-1">{selectedEvent.description}</p>
              </div>
              
              {selectedEvent.details && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Détails</label>
                  <pre className="text-sm mt-1 p-2 bg-gray-50 rounded border overflow-x-auto">
                    {JSON.stringify(selectedEvent.details, null, 2)}
                  </pre>
                </div>
              )}
              
              {selectedEvent.user_agent && (
                <div>
                  <label className="text-sm font-medium text-gray-500">User Agent</label>
                  <p className="text-sm mt-1 font-mono text-xs">{selectedEvent.user_agent}</p>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button onClick={() => setShowEventModal(false)}>Fermer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add to Blacklist Modal */}
      <Dialog open={showAddBlacklistModal} onOpenChange={setShowAddBlacklistModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter à la Blacklist</DialogTitle>
            <DialogDescription>
              Ajoutez un élément à la liste noire pour bloquer l'accès.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Type</label>
              <select
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                value={newBlacklistItem.type}
                onChange={e => setNewBlacklistItem({...newBlacklistItem, type: e.target.value})}
              >
                <option value="USER">Utilisateur</option>
                <option value="IP">Adresse IP</option>
                <option value="EMAIL">Email</option>
                <option value="PHONE">Téléphone</option>
                <option value="DEVICE">Appareil</option>
              </select>
            </div>
            
            <div>
              <label className="text-sm font-medium">Scope</label>
              <select
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                value={newBlacklistItem.scope}
                onChange={e => setNewBlacklistItem({...newBlacklistItem, scope: e.target.value})}
              >
                <option value="GLOBAL">Global</option>
                <option value="ORGANIZER">Organisateur</option>
                <option value="EVENT">Événement</option>
                <option value="VENUE">Lieu</option>
              </select>
            </div>
            
            <div>
              <label className="text-sm font-medium">Valeur</label>
              <Input
                className="mt-1"
                placeholder="Entrez la valeur à bloquer..."
                value={newBlacklistItem.value}
                onChange={e => setNewBlacklistItem({...newBlacklistItem, value: e.target.value})}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Raison</label>
              <Textarea
                className="mt-1"
                placeholder="Raison du blocage..."
                value={newBlacklistItem.reason}
                onChange={e => setNewBlacklistItem({...newBlacklistItem, reason: e.target.value})}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddBlacklistModal(false)}>
              Annuler
            </Button>
            <Button onClick={handleAddToBlacklist} disabled={actionLoading}>
              {actionLoading ? <LoadingSpinner size="sm" /> : "Ajouter"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 