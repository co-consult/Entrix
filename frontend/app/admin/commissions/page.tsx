"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { EmptyState } from "@/components/ui/empty-state"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, MoreVertical, Eye, TrendingUp, Users, Calendar, Filter, Download, BarChart3, Percent, Info } from "lucide-react"
import { CustomCurrencyIcon } from "@/components/ui/custom-currency-icon"
import { useToast } from "@/hooks/use-toast"
import { Sidebar } from "@/components/layout/sidebar"
import { PageHeader } from "@/components/ui/page-header"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import apiClient from "@/lib/api"

const COMMISSION_STATUS = {
  PENDING: "En attente",
  PAID: "Payé",
  CANCELLED: "Annulé",
  DISPUTED: "Contesté"
}

const COMMISSION_TYPE = {
  EVENT_SALES: "Ventes d'événements",
  SUBSCRIPTION: "Abonnements",
  FEATURED_EVENT: "Événement en vedette",
  PREMIUM_SERVICE: "Service premium"
}

const STATUS_COLORS = {
  PENDING: "bg-yellow-100 text-yellow-800",
  PAID: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
  DISPUTED: "bg-orange-100 text-orange-800"
}

export default function AdminCommissionsPage() {
  const [commissions, setCommissions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const { toast } = useToast()
  const [selectedCommission, setSelectedCommission] = useState<any | null>(null)
  const [showCommissionModal, setShowCommissionModal] = useState(false)
  const [stats, setStats] = useState<any>(null)
  const [exportLoading, setExportLoading] = useState(false)

  useEffect(() => {
    fetchCommissionsData()
  }, [])

  const fetchCommissionsData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [commissionsResponse, statsResponse] = await Promise.all([
        apiClient.getCommissions(),
        apiClient.getCommissionStats()
      ])

      setCommissions(Array.isArray(commissionsResponse) ? commissionsResponse : [])
      setStats(statsResponse)
    } catch (err: any) {
      setError("Erreur lors du chargement des commissions.")
    } finally {
      setLoading(false)
    }
  }

  const handleViewCommission = (commission: any) => {
    setSelectedCommission(commission)
    setShowCommissionModal(true)
  }

  const handleExport = async (format: string) => {
    setExportLoading(true)
    try {
      // Note: Export endpoint not in API client yet
      const response = await apiClient.getCommissions()
      
      // Create download link
      const blob = new Blob([JSON.stringify(response, null, 2)], { type: 'application/json' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `commissions-${new Date().toISOString().split('T')[0]}.${format.toLowerCase()}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast({
        title: "Export réussi",
        description: `Les commissions ont été exportées en ${format.toUpperCase()}`
      })
    } catch (err: any) {
      toast({
        title: "Erreur",
        description: "Impossible d'exporter les commissions",
        variant: "destructive"
      })
    } finally {
      setExportLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR')
  }

  const formatAmount = (amount: number) => {
    return `${amount.toLocaleString()} DT`
  }

  const filteredCommissions = commissions.filter(commission => {
    const matchesSearch = commission.organizer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         commission.event_title?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === "all" || commission.status === statusFilter
    const matchesType = typeFilter === "all" || commission.type === typeFilter
    
    return matchesSearch && matchesStatus && matchesType
  })

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar type="admin" />
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="px-8 w-full">
          <PageHeader
            title="Gestion des Commissions"
            description="Suivi et gestion des commissions des organisateurs."
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
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Commissions</CardTitle>
                  <CustomCurrencyIcon className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stats?.totalCommissions?.toLocaleString() || 0} DT
                  </div>
                  <p className="text-xs text-muted-foreground">Cette période</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Commissions Payées</CardTitle>
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stats?.paidCommissions?.toLocaleString() || 0} DT
                  </div>
                  <p className="text-xs text-muted-foreground">Commissions versées</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">En Attente</CardTitle>
                  <Calendar className="h-4 w-4 text-yellow-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stats?.pendingCommissions?.toLocaleString() || 0} DT
                  </div>
                  <p className="text-xs text-muted-foreground">Commissions en attente</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Organisateurs</CardTitle>
                  <Users className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.totalOrganizers || 0}</div>
                  <p className="text-xs text-muted-foreground">Avec commissions</p>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Filtres</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <Input
                      placeholder="Rechercher..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Statut" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les statuts</SelectItem>
                        {Object.entries(COMMISSION_STATUS).map(([key, value]) => (
                          <SelectItem key={key} value={key}>{value}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les types</SelectItem>
                        {Object.entries(COMMISSION_TYPE).map(([key, value]) => (
                          <SelectItem key={key} value={key}>{value}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Commissions Table */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <LoadingSpinner size="lg" />
              </div>
            ) : error ? (
              <EmptyState
                icon={<CustomCurrencyIcon className="h-12 w-12" />}
                title="Erreur"
                description={error}
                action={{ label: "Réessayer", onClick: fetchCommissionsData }}
              />
            ) : filteredCommissions.length === 0 ? (
              <EmptyState
                icon={<CustomCurrencyIcon className="h-12 w-12" />}
                title="Aucune commission"
                description="Aucune commission trouvée avec les critères actuels."
              />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Commissions ({filteredCommissions.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Organisateur</TableHead>
                        <TableHead>Événement</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Montant</TableHead>
                        <TableHead>Taux</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCommissions.map((commission) => (
                        <TableRow key={commission.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{commission.organizer_name}</p>
                              <p className="text-sm text-muted-foreground">{commission.organizer_email}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{commission.event_title}</p>
                              <p className="text-sm text-muted-foreground">{commission.event_date}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {COMMISSION_TYPE[commission.type as keyof typeof COMMISSION_TYPE] || commission.type}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="font-medium">{formatAmount(commission.amount)}</span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">{commission.rate}%</span>
                          </TableCell>
                          <TableCell>
                            <Badge className={STATUS_COLORS[commission.status as keyof typeof STATUS_COLORS]}>
                              {COMMISSION_STATUS[commission.status as keyof typeof COMMISSION_STATUS] || commission.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground">
                              {formatDate(commission.created_at)}
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
                                      onClick={() => handleViewCommission(commission)}
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Voir les détails</TooltipContent>
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

      {/* Commission Details Modal */}
      <Dialog open={showCommissionModal} onOpenChange={setShowCommissionModal}>
        <DialogContent className="max-w-2xl w-full">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl font-bold">
              <Percent className="h-6 w-6 text-primary" />
              Détails de la Commission
            </DialogTitle>
            <DialogDescription className="text-base mt-1 mb-4">
              Informations détaillées sur la commission.
            </DialogDescription>
          </DialogHeader>
          {selectedCommission && (
            <div className="space-y-6">
              {/* Section: Informations Générales */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Percent className="h-5 w-5 text-blue-600" />
                  <span className="font-semibold text-lg">Informations Générales</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">ID</Label>
                    <p className="font-mono text-sm">{selectedCommission.id}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Statut</Label>
                    <Badge className={STATUS_COLORS[selectedCommission.status as keyof typeof STATUS_COLORS]}>
                      {COMMISSION_STATUS[selectedCommission.status as keyof typeof COMMISSION_STATUS]}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Montant</Label>
                    <p className="text-lg font-bold">{formatAmount(selectedCommission.amount)}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Taux</Label>
                    <p>{selectedCommission.rate}%</p>
                  </div>
                </div>
              </div>
              {/* Section: Détails Supplémentaires */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Info className="h-5 w-5 text-green-600" />
                  <span className="font-semibold text-lg">Détails Supplémentaires</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Date</Label>
                    <p>{selectedCommission.created_at ? new Date(selectedCommission.created_at).toLocaleString('fr-FR') : '-'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Référence</Label>
                    <p>{selectedCommission.reference || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Utilisateur</Label>
                    <p>{selectedCommission.user?.first_name} {selectedCommission.user?.last_name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Événement</Label>
                    <p>{selectedCommission.event?.name || '-'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCommissionModal(false)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 