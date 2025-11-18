"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { EmptyState } from "@/components/ui/empty-state"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, MoreVertical, Eye, CreditCard, CheckCircle, XCircle, AlertTriangle, Clock, Download, Filter, TrendingUp, Activity, Info } from "lucide-react"
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
import apiClient from "@/lib/api"
import { Label } from "@/components/ui/label"
import { paymentsApi } from "@/lib/api/payments";

const PAYMENT_STATUS = {
  PENDING: "En attente",
  PROCESSING: "En cours",
  COMPLETED: "Complété",
  FAILED: "Échoué",
  CANCELLED: "Annulé",
  REFUNDED: "Remboursé",
  DISPUTED: "Contesté"
}

const PAYMENT_METHOD = {
  CREDIT_CARD: "Carte de crédit",
  DEBIT_CARD: "Carte de débit",
  BANK_TRANSFER: "Virement bancaire",
  PAYPAL: "PayPal",
  STRIPE: "Stripe",
  CASH: "Espèces",
  CHECK: "Chèque"
}

const STATUS_COLORS = {
  PENDING: "bg-yellow-100 text-yellow-800",
  PROCESSING: "bg-blue-100 text-blue-800",
  COMPLETED: "bg-green-100 text-green-800",
  FAILED: "bg-red-100 text-red-800",
  CANCELLED: "bg-gray-100 text-gray-800",
  REFUNDED: "bg-orange-100 text-orange-800",
  DISPUTED: "bg-red-100 text-red-800"
}

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [methodFilter, setMethodFilter] = useState("all")
  const [dateRange, setDateRange] = useState({ start: "", end: "" })
  const { toast } = useToast()
  const [selectedPayment, setSelectedPayment] = useState<any | null>(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [stats, setStats] = useState<any>(null)
  const [exportLoading, setExportLoading] = useState(false)

  useEffect(() => {
    fetchPaymentsData()
  }, [])

  const fetchPaymentsData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [paymentsResponse, statsResponse] = await Promise.all([
        apiClient.getPayments(),
        apiClient.getPaymentStats()
      ])

      setPayments(Array.isArray(paymentsResponse) ? paymentsResponse : [])
      setStats(statsResponse)
    } catch (err: any) {
      setError("Erreur lors du chargement des paiements.")
    } finally {
      setLoading(false)
    }
  }

  const handleViewPayment = (payment: any) => {
    setSelectedPayment(payment)
    setShowPaymentModal(true)
  }

  const handleRefundPayment = async (paymentId: string) => {
    try {
      await paymentsApi.refundPayment(paymentId)
      toast({
        title: "Remboursement effectué",
        description: "Le paiement a été remboursé avec succès"
      })
      fetchPaymentsData()
    } catch (err: any) {
      toast({
        title: "Erreur",
        description: "Impossible de rembourser le paiement",
        variant: "destructive"
      })
    }
  }

  const handleExport = async (format: string) => {
    setExportLoading(true)
    try {
      // Note: Export endpoint not in API client yet
      const response = await apiClient.getPayments()
      
      // Create download link
      const blob = new Blob([JSON.stringify(response, null, 2)], { type: 'application/json' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `payments-${new Date().toISOString().split('T')[0]}.${format.toLowerCase()}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast({
        title: "Export réussi",
        description: `Les paiements ont été exportés en ${format.toUpperCase()}`
      })
    } catch (err: any) {
      toast({
        title: "Erreur",
        description: "Impossible d'exporter les paiements",
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

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = payment.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.event_title?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === "all" || payment.status === statusFilter
    const matchesMethod = methodFilter === "all" || payment.payment_method === methodFilter
    
    return matchesSearch && matchesStatus && matchesMethod
  })

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar type="admin" />
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="px-8 w-full">
          <PageHeader
            title="Gestion des Paiements"
            description="Surveillance et gestion des transactions de paiement."
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
                  <CardTitle className="text-sm font-medium">Total Revenus</CardTitle>
                  <CustomCurrencyIcon className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stats?.totalRevenue?.toLocaleString() || 0} DT
                  </div>
                  <p className="text-xs text-muted-foreground">Cette période</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Paiements</CardTitle>
                  <CreditCard className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.totalPayments || 0}</div>
                  <p className="text-xs text-muted-foreground">Transactions</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Taux de Succès</CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.successRate?.toFixed(1) || 0}%</div>
                  <p className="text-xs text-muted-foreground">Paiements réussis</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">En Attente</CardTitle>
                  <Clock className="h-4 w-4 text-yellow-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.pendingPayments || 0}</div>
                  <p className="text-xs text-muted-foreground">Paiements en cours</p>
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
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Statut" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les statuts</SelectItem>
                        {Object.entries(PAYMENT_STATUS).map(([key, value]) => (
                          <SelectItem key={key} value={key}>{value}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Select value={methodFilter} onValueChange={setMethodFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Méthode" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Toutes les méthodes</SelectItem>
                        {Object.entries(PAYMENT_METHOD).map(([key, value]) => (
                          <SelectItem key={key} value={key}>{value}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Input
                      type="date"
                      placeholder="Début"
                      value={dateRange.start}
                      onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                    />
                    <Input
                      type="date"
                      placeholder="Fin"
                      value={dateRange.end}
                      onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payments Table */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <LoadingSpinner size="lg" />
              </div>
            ) : error ? (
              <EmptyState
                icon={<CreditCard className="h-12 w-12" />}
                title="Erreur"
                description={error}
                action={{ label: "Réessayer", onClick: fetchPaymentsData }}
              />
            ) : filteredPayments.length === 0 ? (
              <EmptyState
                icon={<CreditCard className="h-12 w-12" />}
                title="Aucun paiement"
                description="Aucun paiement trouvé avec les critères actuels."
              />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Paiements ({filteredPayments.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Utilisateur</TableHead>
                        <TableHead>Événement</TableHead>
                        <TableHead>Montant</TableHead>
                        <TableHead>Méthode</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPayments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell className="font-mono text-sm">
                            {payment.id}
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{payment.user_name}</p>
                              <p className="text-sm text-muted-foreground">{payment.user_email}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{payment.event_title}</p>
                              <p className="text-sm text-muted-foreground">{payment.ticket_type}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="font-medium">{formatAmount(payment.amount)}</span>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {PAYMENT_METHOD[payment.payment_method as keyof typeof PAYMENT_METHOD] || payment.payment_method}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={STATUS_COLORS[payment.status as keyof typeof STATUS_COLORS]}>
                              {PAYMENT_STATUS[payment.status as keyof typeof PAYMENT_STATUS] || payment.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground">
                              {formatDate(payment.created_at)}
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
                                      onClick={() => handleViewPayment(payment)}
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Voir les détails</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              
                              {payment.status === "COMPLETED" && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleRefundPayment(payment.id)}
                                      >
                                        <XCircle className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Rembourser</TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
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

      {/* Payment Details Modal */}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="max-w-2xl w-full">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl font-bold">
              <CreditCard className="h-6 w-6 text-primary" />
              Détails du Paiement
            </DialogTitle>
            <DialogDescription className="text-base mt-1 mb-4">
              Informations détaillées sur la transaction.
            </DialogDescription>
          </DialogHeader>
          {selectedPayment && (
            <div className="space-y-6">
              {/* Section: Informations Générales */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <CreditCard className="h-5 w-5 text-blue-600" />
                  <span className="font-semibold text-lg">Informations Générales</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">ID Transaction</Label>
                    <p className="font-mono text-sm">{selectedPayment.id}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Statut</Label>
                    <Badge className={STATUS_COLORS[selectedPayment.status as keyof typeof STATUS_COLORS]}>
                      {PAYMENT_STATUS[selectedPayment.status as keyof typeof PAYMENT_STATUS]}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Montant</Label>
                    <p className="text-lg font-bold">{formatAmount(selectedPayment.amount)}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Méthode</Label>
                    <p>{PAYMENT_METHOD[selectedPayment.payment_method as keyof typeof PAYMENT_METHOD]}</p>
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
                    <p>{selectedPayment.created_at ? new Date(selectedPayment.created_at).toLocaleString('fr-FR') : '-'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Référence</Label>
                    <p>{selectedPayment.reference || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Utilisateur</Label>
                    <p>{selectedPayment.user?.first_name} {selectedPayment.user?.last_name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Événement</Label>
                    <p>{selectedPayment.event?.name || '-'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPaymentModal(false)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 