"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { EmptyState } from "@/components/ui/empty-state"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart3, Download, Calendar, Users, TrendingUp, FileText, PieChart, Activity, Building2, MapPin, CreditCard, Bell } from "lucide-react"
import { CustomCurrencyIcon } from "@/components/ui/custom-currency-icon"
import { useToast } from "@/hooks/use-toast"
import { Sidebar } from "@/components/layout/sidebar"
import { PageHeader } from "@/components/ui/page-header"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import apiClient from "@/lib/api"

const REPORT_TYPES = {
  EVENT_PERFORMANCE: "Performance Événements",
  REVENUE_ANALYSIS: "Analyse Revenus",
  USER_ACTIVITY: "Activité Utilisateurs",
  VENUE_UTILIZATION: "Utilisation Lieux",
  SECURITY_AUDIT: "Audit Sécurité",
  PAYMENT_ANALYSIS: "Analyse Paiements",
  ORGANIZER_PERFORMANCE: "Performance Organisateurs",
  SYSTEM_HEALTH: "Santé Système"
}

export default function AdminReportsPage() {
  const [reports, setReports] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedReport, setSelectedReport] = useState<any | null>(null)
  const [showGenerateModal, setShowGenerateModal] = useState(false)
  const [generatingReport, setGeneratingReport] = useState(false)
  const [reportConfig, setReportConfig] = useState({
    type: "EVENT_PERFORMANCE",
    startDate: "",
    endDate: "",
    format: "PDF"
  })
  const { toast } = useToast()
  const [summary, setSummary] = useState<any>(null)

  useEffect(() => {
    fetchReportsData()
  }, [])

  const fetchReportsData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [reportsResponse, summaryResponse] = await Promise.all([
        apiClient.getReportingSummary(),
        apiClient.getReportingSummary()
      ])

      setReports(Array.isArray(reportsResponse) ? reportsResponse : [])
      setSummary(summaryResponse)
    } catch (err: any) {
      setError("Erreur lors du chargement des rapports.")
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateReport = async () => {
    if (!reportConfig.startDate || !reportConfig.endDate) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner une période",
        variant: "destructive"
      })
      return
    }

    setGeneratingReport(true)
    try {
      const report = await apiClient.generateEventReport("all", reportConfig.startDate, reportConfig.endDate)
      
      toast({
        title: "Rapport généré",
        description: "Le rapport a été généré avec succès"
      })
      
      setShowGenerateModal(false)
      fetchReportsData()
    } catch (err: any) {
      toast({
        title: "Erreur",
        description: "Impossible de générer le rapport",
        variant: "destructive"
      })
    } finally {
      setGeneratingReport(false)
    }
  }

  const handleDownloadReport = async (reportId: string, format: string) => {
    try {
      const response = await apiClient.downloadReport(reportId, format)
      
      // Create download link
      const blob = new Blob([JSON.stringify(response, null, 2)], { type: 'application/json' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `report-${reportId}-${new Date().toISOString().split('T')[0]}.${format.toLowerCase()}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast({
        title: "Téléchargement réussi",
        description: `Le rapport a été téléchargé en ${format.toUpperCase()}`
      })
    } catch (err: any) {
      toast({
        title: "Erreur",
        description: "Impossible de télécharger le rapport",
        variant: "destructive"
      })
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR')
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar type="admin" />
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="px-8 w-full">
          <PageHeader
            title="Rapports"
            description="Génération et gestion des rapports business intelligence."
          >
            <Button 
              className="ml-auto" 
              variant="default" 
              onClick={() => setShowGenerateModal(true)}
            >
              <FileText className="mr-2 h-4 w-4" /> Générer Rapport
            </Button>
          </PageHeader>
          
          <div className="flex-1 overflow-auto pt-6 pb-6">
            {/* Summary Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Revenus Totaux</CardTitle>
                  <CustomCurrencyIcon className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {summary?.totalRevenue?.toLocaleString() || 0} DT
                  </div>
                  <p className="text-xs text-muted-foreground">Cette période</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Événements</CardTitle>
                  <Calendar className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{summary?.totalEvents || 0}</div>
                  <p className="text-xs text-muted-foreground">Événements créés</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Utilisateurs</CardTitle>
                  <Users className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{summary?.totalUsers || 0}</div>
                  <p className="text-xs text-muted-foreground">Utilisateurs actifs</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Tickets Vendus</CardTitle>
                  <CreditCard className="h-4 w-4 text-orange-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{summary?.totalTickets || 0}</div>
                  <p className="text-xs text-muted-foreground">Billets vendus</p>
                </CardContent>
              </Card>
            </div>

            {/* Reports Content */}
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
                <TabsTrigger value="reports">Rapports</TabsTrigger>
                <TabsTrigger value="analytics">Analyses</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid gap-6 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Performance Événements</CardTitle>
                      <CardDescription>Métriques des événements par statut</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span>Événements publiés</span>
                          <div className="flex items-center">
                            <TrendingUp className="mr-1 h-4 w-4 text-green-600" />
                            <span className="font-medium">{summary?.publishedEvents || 0}</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Événements en direct</span>
                          <div className="flex items-center">
                            <Activity className="mr-1 h-4 w-4 text-red-600" />
                            <span className="font-medium">{summary?.liveEvents || 0}</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Événements terminés</span>
                          <div className="flex items-center">
                            <Calendar className="mr-1 h-4 w-4 text-gray-600" />
                            <span className="font-medium">{summary?.finishedEvents || 0}</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Taux de remplissage moyen</span>
                          <div className="flex items-center">
                            <PieChart className="mr-1 h-4 w-4 text-blue-600" />
                            <span className="font-medium">{summary?.averageOccupancyRate?.toFixed(1) || 0}%</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Analyses Financières</CardTitle>
                      <CardDescription>Métriques de revenus et commissions</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span>Revenus totaux</span>
                          <div className="flex items-center">
                            <CustomCurrencyIcon className="mr-1 h-4 w-4 text-green-600" />
                            <span className="font-medium">
                              {summary?.totalRevenue?.toLocaleString() || 0} DT
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Commissions plateforme</span>
                          <div className="flex items-center">
                            <CustomCurrencyIcon className="mr-1 h-4 w-4 text-yellow-600" />
                            <span className="font-medium">
                              {summary?.platformCommissions?.toLocaleString() || 0} DT
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Paiements traités</span>
                          <div className="flex items-center">
                            <CreditCard className="mr-1 h-4 w-4 text-blue-600" />
                            <span className="font-medium">{summary?.totalPayments || 0}</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Taux de conversion</span>
                          <div className="flex items-center">
                            <TrendingUp className="mr-1 h-4 w-4 text-green-600" />
                            <span className="font-medium">{summary?.conversionRate?.toFixed(1) || 0}%</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Utilisation des Lieux</CardTitle>
                    <CardDescription>Performance des lieux d'événements</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Lieux actifs</label>
                        <p className="text-2xl font-bold">{summary?.activeVenues || 0}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Capacité totale</label>
                        <p className="text-2xl font-bold">{summary?.totalCapacity?.toLocaleString() || 0}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Taux d'occupation</label>
                        <p className="text-2xl font-bold">{summary?.venueOccupancyRate?.toFixed(1) || 0}%</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Événements par lieu</label>
                        <p className="text-2xl font-bold">{summary?.averageEventsPerVenue?.toFixed(1) || 0}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="reports" className="space-y-4">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <LoadingSpinner size="lg" />
                  </div>
                ) : error ? (
                  <EmptyState
                    icon={<BarChart3 className="h-12 w-12" />}
                    title="Erreur"
                    description={error}
                    action={{ label: "Réessayer", onClick: fetchReportsData }}
                  />
                ) : reports.length === 0 ? (
                  <EmptyState
                    icon={<FileText className="h-12 w-12" />}
                    title="Aucun rapport"
                    description="Aucun rapport généré pour le moment."
                    action={{ 
                      label: "Générer un rapport", 
                      onClick: () => setShowGenerateModal(true) 
                    }}
                  />
                ) : (
                  <div className="grid gap-4">
                    {reports.map((report) => (
                      <Card key={report.id}>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle>{REPORT_TYPES[report.type as keyof typeof REPORT_TYPES] || report.type}</CardTitle>
                              <CardDescription>
                                Généré le {formatDate(report.created_at)} - {report.description}
                              </CardDescription>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge variant="outline">{report.status}</Badge>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDownloadReport(report.id, "PDF")}
                              >
                                <Download className="h-4 w-4 mr-2" />
                                PDF
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDownloadReport(report.id, "CSV")}
                              >
                                <Download className="h-4 w-4 mr-2" />
                                CSV
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="font-medium">Période:</span>
                              <p>{formatDate(report.start_date)} - {formatDate(report.end_date)}</p>
                            </div>
                            <div>
                              <span className="font-medium">Format:</span>
                              <p>{report.format}</p>
                            </div>
                            <div>
                              <span className="font-medium">Taille:</span>
                              <p>{report.file_size || "N/A"}</p>
                            </div>
                            <div>
                              <span className="font-medium">Statut:</span>
                              <p>{report.status}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="analytics" className="space-y-4">
                <div className="grid gap-6 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Croissance Utilisateurs</CardTitle>
                      <CardDescription>Évolution du nombre d'utilisateurs</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span>Nouveaux utilisateurs</span>
                          <div className="flex items-center">
                            <TrendingUp className="mr-1 h-4 w-4 text-green-600" />
                            <span className="font-medium">+{summary?.newUsersThisMonth || 0}</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Utilisateurs actifs</span>
                          <div className="flex items-center">
                            <Users className="mr-1 h-4 w-4 text-blue-600" />
                            <span className="font-medium">{summary?.activeUsers || 0}</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Taux de rétention</span>
                          <div className="flex items-center">
                            <TrendingUp className="mr-1 h-4 w-4 text-green-600" />
                            <span className="font-medium">{summary?.retentionRate?.toFixed(1) || 0}%</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Performance Organisateurs</CardTitle>
                      <CardDescription>Métriques des organisateurs</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span>Organisateurs actifs</span>
                          <div className="flex items-center">
                            <Building2 className="mr-1 h-4 w-4 text-green-600" />
                            <span className="font-medium">{summary?.activeOrganizers || 0}</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Nouveaux organisateurs</span>
                          <div className="flex items-center">
                            <TrendingUp className="mr-1 h-4 w-4 text-blue-600" />
                            <span className="font-medium">+{summary?.newOrganizersThisMonth || 0}</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Commission moyenne</span>
                          <div className="flex items-center">
                            <CustomCurrencyIcon className="mr-1 h-4 w-4 text-yellow-600" />
                            <span className="font-medium">{summary?.averageCommissionRate?.toFixed(1) || 0}%</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Generate Report Modal */}
      <Dialog open={showGenerateModal} onOpenChange={setShowGenerateModal}>
        <DialogContent className="max-w-2xl w-full">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl font-bold">
              <BarChart3 className="h-6 w-6 text-primary" />
              Générer un Rapport
            </DialogTitle>
            <DialogDescription className="text-base mt-1 mb-4">
              Créez un nouveau rapport personnalisé. Tous les champs marqués * sont obligatoires.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleGenerateReport} className="space-y-6">
            {/* Section: Informations du Rapport */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                <span className="font-semibold text-lg">Informations du Rapport</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="report-type">Type de rapport *</Label>
                  <select id="report-type" className="w-full border rounded px-3 py-2" value={reportConfig.type} onChange={e => setReportConfig({...reportConfig, type: e.target.value})} required>
                    {Object.entries(REPORT_TYPES).map(([key, value]) => (
                      <option key={key} value={key}>{value}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="report-format">Format *</Label>
                  <select id="report-format" className="w-full border rounded px-3 py-2" value={reportConfig.format} onChange={e => setReportConfig({...reportConfig, format: e.target.value})} required>
                    <option value="PDF">PDF</option>
                    <option value="CSV">CSV</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <Label htmlFor="start-date">Date de début *</Label>
                  <Input id="start-date" type="date" value={reportConfig.startDate} onChange={e => setReportConfig({...reportConfig, startDate: e.target.value})} required />
                </div>
                <div>
                  <Label htmlFor="end-date">Date de fin *</Label>
                  <Input id="end-date" type="date" value={reportConfig.endDate} onChange={e => setReportConfig({...reportConfig, endDate: e.target.value})} required />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowGenerateModal(false)}>Annuler</Button>
              <Button type="submit" disabled={generatingReport}>{generatingReport ? "Génération..." : "Générer"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
} 