"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { EmptyState } from "@/components/ui/empty-state"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, MoreVertical, Eye, Bell, Send, Trash2, Edit, Plus, Filter, Users, Calendar, AlertTriangle, Clock, XCircle, Info } from "lucide-react"
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
import apiClient from "@/lib/api"
import { notificationsApi } from "@/lib/api/notifications";

const NOTIFICATION_TYPE = {
  SYSTEM: "Système",
  EVENT: "Événement",
  PAYMENT: "Paiement",
  SECURITY: "Sécurité",
  USER: "Utilisateur",
  ORGANIZER: "Organisateur",
  VENUE: "Lieu",
  TICKET: "Billet"
}

const NOTIFICATION_STATUS = {
  PENDING: "En attente",
  SENT: "Envoyé",
  FAILED: "Échoué",
  CANCELLED: "Annulé"
}

const NOTIFICATION_PRIORITY = {
  LOW: "Faible",
  MEDIUM: "Moyen",
  HIGH: "Élevé",
  URGENT: "Urgent"
}

const STATUS_COLORS = {
  PENDING: "bg-yellow-100 text-yellow-800",
  SENT: "bg-green-100 text-green-800",
  FAILED: "bg-red-100 text-red-800",
  CANCELLED: "bg-gray-100 text-gray-800"
}

const PRIORITY_COLORS = {
  LOW: "bg-blue-100 text-blue-800",
  MEDIUM: "bg-yellow-100 text-yellow-800",
  HIGH: "bg-orange-100 text-orange-800",
  URGENT: "bg-red-100 text-red-800"
}

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const { toast } = useToast()
  const [selectedNotification, setSelectedNotification] = useState<any | null>(null)
  const [showNotificationModal, setShowNotificationModal] = useState(false)
  const [stats, setStats] = useState<any>(null)
  const [showSendModal, setShowSendModal] = useState(false)
  const [newNotification, setNewNotification] = useState({
    title: "",
    message: "",
    type: "SYSTEM",
    priority: "MEDIUM",
    target_users: "ALL"
  })
  const [sending, setSending] = useState(false)

  useEffect(() => {
    fetchNotificationsData()
  }, [])

  const fetchNotificationsData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [notificationsResponse, statsResponse] = await Promise.all([
        apiClient.getNotifications(),
        apiClient.getAllNotificationStats()
      ])

      setNotifications(Array.isArray(notificationsResponse) ? notificationsResponse : [])
      setStats(statsResponse)
    } catch (err: any) {
      setError("Erreur lors du chargement des notifications.")
    } finally {
      setLoading(false)
    }
  }

  const handleViewNotification = (notification: any) => {
    setSelectedNotification(notification)
    setShowNotificationModal(true)
  }

  const handleSendNotification = async () => {
    if (!newNotification.title || !newNotification.message) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs",
        variant: "destructive"
      })
      return
    }

    setSending(true)
    try {
      await notificationsApi.sendNotification(newNotification)
      toast({
        title: "Notification envoyée",
        description: "La notification a été envoyée avec succès"
      })
      setNewNotification({
        title: "",
        message: "",
        type: "SYSTEM",
        priority: "MEDIUM",
        target_users: "ALL"
      })
      setShowSendModal(false)
      fetchNotificationsData()
    } catch (err: any) {
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer la notification",
        variant: "destructive"
      })
    } finally {
      setSending(false)
    }
  }

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      await notificationsApi.deleteNotification(notificationId)
      toast({
        title: "Notification supprimée",
        description: "La notification a été supprimée avec succès"
      })
      fetchNotificationsData()
    } catch (err: any) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la notification",
        variant: "destructive"
      })
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR')
  }

  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = notification.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         notification.message?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesType = typeFilter === "all" || notification.type === typeFilter
    const matchesStatus = statusFilter === "all" || notification.status === statusFilter
    const matchesPriority = priorityFilter === "all" || notification.priority === priorityFilter
    
    return matchesSearch && matchesType && matchesStatus && matchesPriority
  })

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar type="admin" />
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="px-8 w-full">
          <PageHeader
            title="Gestion des Notifications"
            description="Envoi et gestion des notifications système."
          >
            <div className="flex items-center space-x-2">
              <Button 
                variant="default" 
                onClick={() => setShowSendModal(true)}
              >
                <Send className="mr-2 h-4 w-4" />
                Envoyer Notification
              </Button>
            </div>
          </PageHeader>
          
          <div className="flex-1 overflow-auto pt-6 pb-6">
            {/* Stats Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Notifications</CardTitle>
                  <Bell className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.totalNotifications || 0}</div>
                  <p className="text-xs text-muted-foreground">Notifications envoyées</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Taux de Succès</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.successRate?.toFixed(1) || 0}%</div>
                  <p className="text-xs text-muted-foreground">Notifications livrées</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">En Attente</CardTitle>
                  <Clock className="h-4 w-4 text-yellow-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.pendingNotifications || 0}</div>
                  <p className="text-xs text-muted-foreground">Notifications en cours</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Échecs</CardTitle>
                  <XCircle className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.failedNotifications || 0}</div>
                  <p className="text-xs text-muted-foreground">Notifications échouées</p>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Filtres</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-4">
                  <div>
                    <Input
                      placeholder="Rechercher..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les types</SelectItem>
                        {Object.entries(NOTIFICATION_TYPE).map(([key, value]) => (
                          <SelectItem key={key} value={key}>{value}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Statut" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les statuts</SelectItem>
                        {Object.entries(NOTIFICATION_STATUS).map(([key, value]) => (
                          <SelectItem key={key} value={key}>{value}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Priorité" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Toutes les priorités</SelectItem>
                        {Object.entries(NOTIFICATION_PRIORITY).map(([key, value]) => (
                          <SelectItem key={key} value={key}>{value}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notifications Table */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <LoadingSpinner size="lg" />
              </div>
            ) : error ? (
              <EmptyState
                icon={<Bell className="h-12 w-12" />}
                title="Erreur"
                description={error}
                action={{ label: "Réessayer", onClick: fetchNotificationsData }}
              />
            ) : filteredNotifications.length === 0 ? (
              <EmptyState
                icon={<Bell className="h-12 w-12" />}
                title="Aucune notification"
                description="Aucune notification trouvée avec les critères actuels."
              />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Notifications ({filteredNotifications.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Titre</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Priorité</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead>Destinataires</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredNotifications.map((notification) => (
                        <TableRow key={notification.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{notification.title}</p>
                              <p className="text-sm text-muted-foreground truncate max-w-xs">
                                {notification.message}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {NOTIFICATION_TYPE[notification.type as keyof typeof NOTIFICATION_TYPE] || notification.type}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={PRIORITY_COLORS[notification.priority as keyof typeof PRIORITY_COLORS]}>
                              {NOTIFICATION_PRIORITY[notification.priority as keyof typeof NOTIFICATION_PRIORITY] || notification.priority}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={STATUS_COLORS[notification.status as keyof typeof STATUS_COLORS]}>
                              {NOTIFICATION_STATUS[notification.status as keyof typeof NOTIFICATION_STATUS] || notification.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground">
                              {notification.recipient_count || 0} utilisateurs
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground">
                              {formatDate(notification.created_at)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleViewNotification(notification)}
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Voir les détails</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleDeleteNotification(notification.id)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Supprimer</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
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

      {/* Notification Details Modal */}
      <Dialog open={showNotificationModal} onOpenChange={setShowNotificationModal}>
        <DialogContent className="max-w-2xl w-full">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl font-bold">
              <Bell className="h-6 w-6 text-primary" />
              Détails de la Notification
            </DialogTitle>
            <DialogDescription className="text-base mt-1 mb-4">
              Informations détaillées sur la notification.
            </DialogDescription>
          </DialogHeader>
          {selectedNotification && (
            <div className="space-y-6">
              {/* Section: Informations Générales */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Bell className="h-5 w-5 text-blue-600" />
                  <span className="font-semibold text-lg">Informations Générales</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">ID</Label>
                    <p className="font-mono text-sm">{selectedNotification.id}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Type</Label>
                    <Badge variant="outline">
                      {NOTIFICATION_TYPE[selectedNotification.type as keyof typeof NOTIFICATION_TYPE]}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Priorité</Label>
                    <Badge className={PRIORITY_COLORS[selectedNotification.priority as keyof typeof PRIORITY_COLORS]}>
                      {NOTIFICATION_PRIORITY[selectedNotification.priority as keyof typeof NOTIFICATION_PRIORITY]}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Statut</Label>
                    <Badge className={STATUS_COLORS[selectedNotification.status as keyof typeof STATUS_COLORS]}>
                      {NOTIFICATION_STATUS[selectedNotification.status as keyof typeof NOTIFICATION_STATUS]}
                    </Badge>
                  </div>
                </div>
              </div>
              {/* Section: Contenu */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Info className="h-5 w-5 text-green-600" />
                  <span className="font-semibold text-lg">Contenu</span>
                </div>
                <div className="space-y-2">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Titre</Label>
                    <p className="font-medium">{selectedNotification.title}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Message</Label>
                    <p className="text-sm">{selectedNotification.message}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNotificationModal(false)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={showSendModal} onOpenChange={setShowSendModal}>
        <DialogContent className="max-w-2xl w-full">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl font-bold">
              <Send className="h-6 w-6 text-primary" />
              Envoyer une Notification
            </DialogTitle>
            <DialogDescription className="text-base mt-1 mb-4">
              Créez et envoyez une nouvelle notification à vos utilisateurs.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSendNotification} className="space-y-6">
            {/* Section: Informations de Notification */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Bell className="h-5 w-5 text-blue-600" />
                <span className="font-semibold text-lg">Informations de Notification</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Titre *</Label>
                  <Input id="title" value={newNotification.title} onChange={e => setNewNotification({...newNotification, title: e.target.value})} placeholder="Titre de la notification" required />
                </div>
                <div>
                  <Label htmlFor="priority">Priorité *</Label>
                  <select id="priority" className="w-full border rounded px-3 py-2" value={newNotification.priority} onChange={e => setNewNotification({...newNotification, priority: e.target.value})} required>
                    {Object.entries(NOTIFICATION_PRIORITY).map(([key, value]) => (
                      <option key={key} value={key}>{value}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="mt-4">
                <Label htmlFor="message">Message *</Label>
                <Textarea id="message" value={newNotification.message} onChange={e => setNewNotification({...newNotification, message: e.target.value})} placeholder="Contenu de la notification" rows={4} required />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowSendModal(false)}>Annuler</Button>
              <Button type="submit" disabled={sending}>{sending ? "Envoi..." : "Envoyer"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
} 