"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { EmptyState } from "@/components/ui/empty-state"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, MoreVertical, Eye, FileText, Users, Calendar, Activity, BarChart3, Download, Filter, Clock, MapPin, User, Building2, CalendarDays, AlertTriangle, Info } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Sidebar } from "@/components/layout/sidebar"
import { PageHeader } from "@/components/ui/page-header"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import apiClient from "@/lib/api"
import { Label } from "@/components/ui/label"
import { useSession } from "next-auth/react"

const AUDIT_ACTIONS = {
  CREATE: "Création",
  READ: "Lecture",
  UPDATE: "Modification",
  DELETE: "Suppression",
  LOGIN: "Connexion",
  LOGOUT: "Déconnexion",
  PASSWORD_CHANGE: "Changement de mot de passe",
  ROLE_ASSIGNMENT: "Attribution de rôle",
  PERMISSION_GRANT: "Octroi de permission",
  PERMISSION_REVOKE: "Révocation de permission",
  DATA_EXPORT: "Export de données",
  SECURITY_EVENT: "Événement de sécurité",
  SYSTEM_CONFIG: "Configuration système",
  BACKUP: "Sauvegarde",
  RESTORE: "Restauration"
}

const ENTITY_TYPES = {
  USER: "Utilisateur",
  EVENT: "Événement",
  ORGANIZER: "Organisateur",
  VENUE: "Lieu",
  TICKET: "Billet",
  PAYMENT: "Paiement",
  ORDER: "Commande",
  SUBSCRIPTION: "Abonnement",
  SECURITY: "Sécurité",
  SYSTEM: "Système"
}

const ACTION_COLORS = {
  CREATE: "bg-green-100 text-green-800",
  READ: "bg-blue-100 text-blue-800",
  UPDATE: "bg-yellow-100 text-yellow-800",
  DELETE: "bg-red-100 text-red-800",
  LOGIN: "bg-green-100 text-green-800",
  LOGOUT: "bg-gray-100 text-gray-800",
  PASSWORD_CHANGE: "bg-orange-100 text-orange-800",
  ROLE_ASSIGNMENT: "bg-purple-100 text-purple-800",
  PERMISSION_GRANT: "bg-green-100 text-green-800",
  PERMISSION_REVOKE: "bg-red-100 text-red-800",
  DATA_EXPORT: "bg-blue-100 text-blue-800",
  SECURITY_EVENT: "bg-red-100 text-red-800",
  SYSTEM_CONFIG: "bg-purple-100 text-purple-800",
  BACKUP: "bg-green-100 text-green-800",
  RESTORE: "bg-orange-100 text-orange-800"
}

export default function AdminAuditLogsPage() {
  const [auditLogs, setAuditLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [actionFilter, setActionFilter] = useState("all")
  const [entityFilter, setEntityFilter] = useState("all")
  const [userFilter, setUserFilter] = useState("all")
  const [dateRange, setDateRange] = useState({ start: "", end: "" })
  const { toast } = useToast()
  const [selectedLog, setSelectedLog] = useState<any | null>(null)
  const [showLogModal, setShowLogModal] = useState(false)
  const [stats, setStats] = useState<any>(null)
  const [exportLoading, setExportLoading] = useState(false)
  const { status } = useSession();

  useEffect(() => {
    if (status === "authenticated") {
      fetchAuditData();
    }
  }, [status]);

  const fetchAuditData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [logsResponse, statsResponse] = await Promise.all([
        apiClient.request("/audit-logs"),
        apiClient.request("/audit-logs/stats")
      ])

      setAuditLogs(Array.isArray(logsResponse) ? logsResponse : [])
      setStats(statsResponse)
    } catch (err: any) {
      setError("Erreur lors du chargement des journaux d'audit.")
    } finally {
      setLoading(false)
    }
  }

  const handleViewLog = (log: any) => {
    setSelectedLog(log)
    setShowLogModal(true)
  }

  const handleExport = async (format: string) => {
    setExportLoading(true)
    try {
      const response = await apiClient.request(`/audit-logs/export?format=${format}`, {
        method: "GET"
      })
      
      // Create download link
      const blob = new Blob([JSON.stringify(response, null, 2)], { type: 'application/json' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.${format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast({
        title: "Export réussi",
        description: `Les journaux d'audit ont été exportés en ${format.toUpperCase()}`
      })
    } catch (err: any) {
      toast({
        title: "Erreur d'export",
        description: "Impossible d'exporter les journaux d'audit",
        variant: "destructive"
      })
    } finally {
      setExportLoading(false)
    }
  }

  const getActionBadge = (action: string) => {
    const color = ACTION_COLORS[action as keyof typeof ACTION_COLORS] || "bg-gray-100 text-gray-800"
    const label = AUDIT_ACTIONS[action as keyof typeof AUDIT_ACTIONS] || action
    return <Badge className={color}>{label}</Badge>
  }

  const getEntityTypeLabel = (entityType: string) => {
    return ENTITY_TYPES[entityType as keyof typeof ENTITY_TYPES] || entityType
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('fr-FR')
  }

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = !searchTerm || 
      log.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.ip_address?.includes(searchTerm)
    
    const matchesAction = actionFilter === "all" || log.action === actionFilter
    const matchesEntity = entityFilter === "all" || log.entity_type === entityFilter
    const matchesUser = userFilter === "all" || log.user_id === userFilter
    
    let matchesDate = true
    if (dateRange.start && dateRange.end) {
      const logDate = new Date(log.created_at)
      const startDate = new Date(dateRange.start)
      const endDate = new Date(dateRange.end)
      matchesDate = logDate >= startDate && logDate <= endDate
    }
    
    return matchesSearch && matchesAction && matchesEntity && matchesUser && matchesDate
  })

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar type="admin" />
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="px-8 w-full">
          <PageHeader
            title="Journaux d'Audit"
            description="Surveillance et analyse des activités système et utilisateur."
          >
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                onClick={() => handleExport('json')}
                disabled={exportLoading}
              >
                <Download className="mr-2 h-4 w-4" />
                {exportLoading ? <LoadingSpinner size="sm" /> : "Exporter JSON"}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => handleExport('csv')}
                disabled={exportLoading}
              >
                <Download className="mr-2 h-4 w-4" />
                {exportLoading ? <LoadingSpinner size="sm" /> : "Exporter CSV"}
              </Button>
            </div>
          </PageHeader>
          
          <div className="flex-1 overflow-auto pt-6 pb-6">
            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-4 mb-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Logs</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.totalLogs || 0}</div>
                  <p className="text-xs text-muted-foreground">Journaux</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Actions Utilisateur</CardTitle>
                  <Users className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.userActions || 0}</div>
                  <p className="text-xs text-muted-foreground">Par utilisateurs</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Actions Système</CardTitle>
                  <Activity className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.systemActions || 0}</div>
                  <p className="text-xs text-muted-foreground">Automatiques</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Moyenne/Jour</CardTitle>
                  <BarChart3 className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{Math.round(stats?.averagePerDay || 0)}</div>
                  <p className="text-xs text-muted-foreground">Logs par jour</p>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-3 mb-6">
              <div className="relative flex-1">
                <Input
                  className="pl-10 pr-4 py-2 rounded-full border border-gray-300 shadow-sm focus:ring-2 focus:ring-primary focus:border-primary transition-all text-base"
                  placeholder="Rechercher par action, utilisateur, détails..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                  <Search className="h-5 w-5" />
                </span>
              </div>
              
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Toutes les actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les actions</SelectItem>
                  <SelectItem value="CREATE">Création</SelectItem>
                  <SelectItem value="READ">Lecture</SelectItem>
                  <SelectItem value="UPDATE">Modification</SelectItem>
                  <SelectItem value="DELETE">Suppression</SelectItem>
                  <SelectItem value="LOGIN">Connexion</SelectItem>
                  <SelectItem value="LOGOUT">Déconnexion</SelectItem>
                  <SelectItem value="PASSWORD_CHANGE">Changement de mot de passe</SelectItem>
                  <SelectItem value="ROLE_ASSIGNMENT">Attribution de rôle</SelectItem>
                  <SelectItem value="SECURITY_EVENT">Événement de sécurité</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={entityFilter} onValueChange={setEntityFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Toutes les entités" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les entités</SelectItem>
                  <SelectItem value="USER">Utilisateur</SelectItem>
                  <SelectItem value="EVENT">Événement</SelectItem>
                  <SelectItem value="ORGANIZER">Organisateur</SelectItem>
                  <SelectItem value="VENUE">Lieu</SelectItem>
                  <SelectItem value="TICKET">Billet</SelectItem>
                  <SelectItem value="PAYMENT">Paiement</SelectItem>
                  <SelectItem value="ORDER">Commande</SelectItem>
                  <SelectItem value="SUBSCRIPTION">Abonnement</SelectItem>
                  <SelectItem value="SECURITY">Sécurité</SelectItem>
                  <SelectItem value="SYSTEM">Système</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date Range Filter */}
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium">Période:</label>
                <Input
                  type="date"
                  value={dateRange.start}
                  onChange={e => setDateRange({...dateRange, start: e.target.value})}
                  className="w-40"
                />
                <span className="text-sm text-gray-500">à</span>
                <Input
                  type="date"
                  value={dateRange.end}
                  onChange={e => setDateRange({...dateRange, end: e.target.value})}
                  className="w-40"
                />
              </div>
              
              <Button
                variant="outline"
                onClick={() => setDateRange({ start: "", end: "" })}
              >
                Réinitialiser
              </Button>
            </div>

            {/* Audit Logs Table */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <LoadingSpinner size="lg" />
              </div>
            ) : error ? (
              <EmptyState
                icon={<AlertTriangle className="h-12 w-12" />}
                title="Erreur"
                description={error}
                action={{ label: "Réessayer", onClick: fetchAuditData }}
              />
            ) : filteredLogs.length === 0 ? (
              <EmptyState
                icon={<FileText className="h-12 w-12" />}
                title="Aucun journal d'audit"
                description={
                  searchTerm || actionFilter !== "all" || entityFilter !== "all" || dateRange.start || dateRange.end
                    ? "Aucun journal d'audit trouvé avec les critères actuels."
                    : "Aucun journal d'audit disponible."
                }
                action={{ 
                  label: "Réinitialiser", 
                  onClick: () => { 
                    setSearchTerm(""); 
                    setActionFilter("all"); 
                    setEntityFilter("all");
                    setDateRange({ start: "", end: "" });
                  } 
                }}
              />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Journaux d'Audit ({filteredLogs.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Action</TableHead>
                        <TableHead>Utilisateur</TableHead>
                        <TableHead>Entité</TableHead>
                        <TableHead>Détails</TableHead>
                        <TableHead>IP</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell>
                            {getActionBadge(log.action)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <User className="h-4 w-4 text-gray-400" />
                              <span className="text-sm">
                                {log.user?.email || "Système"}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              {log.entity_type && (
                                <>
                                  {log.entity_type === "USER" && <Users className="h-4 w-4 text-blue-400" />}
                                  {log.entity_type === "EVENT" && <Calendar className="h-4 w-4 text-green-400" />}
                                  {log.entity_type === "ORGANIZER" && <Building2 className="h-4 w-4 text-purple-400" />}
                                  {log.entity_type === "VENUE" && <MapPin className="h-4 w-4 text-orange-400" />}
                                  {log.entity_type === "TICKET" && <FileText className="h-4 w-4 text-red-400" />}
                                  {log.entity_type === "PAYMENT" && <CalendarDays className="h-4 w-4 text-yellow-400" />}
                                  <span className="text-sm">
                                    {getEntityTypeLabel(log.entity_type)}
                                  </span>
                                </>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="max-w-xs truncate">
                              {log.details}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-gray-600 font-mono">
                              {log.ip_address || "N/A"}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-1">
                              <Clock className="h-4 w-4 text-gray-400" />
                              <span className="text-sm text-gray-600">
                                {formatDate(log.created_at)}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewLog(log)}
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
          </div>
        </div>
      </div>

      {/* Log Details Modal */}
      <Dialog open={showLogModal} onOpenChange={setShowLogModal}>
        <DialogContent className="max-w-2xl w-full">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl font-bold">
              <Activity className="h-6 w-6 text-primary" />
              Détails du Log d'Audit
            </DialogTitle>
            <DialogDescription className="text-base mt-1 mb-4">
              Informations détaillées sur l'action enregistrée.
            </DialogDescription>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-6">
              {/* Section: Informations Générales */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="h-5 w-5 text-blue-600" />
                  <span className="font-semibold text-lg">Informations Générales</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">ID</Label>
                    <p className="font-mono text-sm">{selectedLog.id}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Action</Label>
                    <p className="text-sm">{selectedLog.action}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Utilisateur</Label>
                    <p className="text-sm">{selectedLog.user?.first_name} {selectedLog.user?.last_name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Date</Label>
                    <p className="text-sm">{selectedLog.created_at ? new Date(selectedLog.created_at).toLocaleString('fr-FR') : '-'}</p>
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
                    <Label className="text-sm font-medium text-gray-500">Données</Label>
                    <pre className="bg-muted/60 rounded p-4 text-xs overflow-x-auto border">{JSON.stringify(selectedLog.data, null, 2)}</pre>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Anciennes Données</Label>
                    <pre className="bg-muted/60 rounded p-4 text-xs overflow-x-auto border">{JSON.stringify(selectedLog.old_data, null, 2)}</pre>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLogModal(false)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 