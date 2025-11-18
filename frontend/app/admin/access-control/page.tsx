'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { 
  Shield, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Clock,
  User,
  MapPin,
  Calendar,
  BarChart3,
  TrendingUp,
  TrendingDown
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import apiClient from '@/lib/api'
import { eventsApi } from '@/lib/api/events'
import { toast } from 'sonner'
import { Sidebar } from '@/components/layout/sidebar'
import { PageHeader } from '@/components/ui/page-header'

interface AccessLog {
  id: string
  access_right_id?: string
  access_point_id?: string
  user_id: string
  event_id: string
  action: string
  result: 'SUCCESS' | 'DENIED'
  denial_reason?: string
  controller_device?: string
  serial_number?: string
  scan_metadata?: any
  notes?: string
  scanned_at: string
  created_at: string
  access_right?: {
    id: string
    qr_code: string
    access_code: string
    status: string
    subscription?: {
      id: string
      user?: {
        id: string
        email: string
        first_name: string
        last_name: string
      }
      plan?: {
        id: string
        name: string
        description: string
      }
    }
  }
  event?: {
    id: string
    title: string
    start_date: string
    end_date: string
  }
  user?: {
    id: string
    email: string
    first_name: string
    last_name: string
  }
  access_point?: {
    id: string
    name: string
    code: string
  }
}

interface AccessLogsResponse {
  logs: AccessLog[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

interface AccessAnalytics {
  overview: {
    total_scans: number
    successful_scans: number
    denied_scans: number
    success_rate: number
    denial_rate: number
  }
  scans_by_result: Record<string, number>
  scans_by_denial_reason: Record<string, number>
  scans_by_hour: Array<{ hour: number; count: number }>
  scans_by_day: Array<{ date: string; count: number }>
  top_events: Array<{ event_id: string; event_title: string; count: number }>
  top_agents: Array<{ agent: string; count: number }>
}

interface DenialAnalysis {
  denial_reasons: Array<{
    reason: string
    count: number
    percentage: number
  }>
  denial_trends: Array<{ date: string; count: number }>
  top_denied_qr_codes: Array<{ qr_code: string; count: number }>
  denial_by_event: Array<{ event_id: string; event_title: string; count: number }>
  denial_by_agent: Array<{ agent: string; count: number }>
  recent_denials: Array<{
    id: string
    qr_code: string
    denial_reason: string
    event_title: string
    scanned_at: string
    controller_device: string
  }>
}

export default function AccessControlLogsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  const [logs, setLogs] = useState<AccessLog[]>([])
  const [analytics, setAnalytics] = useState<AccessAnalytics | null>(null)
  const [denialAnalysis, setDenialAnalysis] = useState<DenialAnalysis | null>(null)
  const [loading, setLoading] = useState(true)
  const [analyticsLoading, setAnalyticsLoading] = useState(false)
  const [selectedLog, setSelectedLog] = useState<AccessLog | null>(null)
  const [events, setEvents] = useState<any[]>([])
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  })

  // Filters
  const [filters, setFilters] = useState({
    search: '',
    result: '',
    denial_reason: '',
    event_id: '',
    date_from: '',
    date_to: '',
    sort_by: 'scanned_at',
    sort_order: 'desc' as 'asc' | 'desc'
  })

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/auth/signin')
      return
    }
    
    // Set API token
    const token = (session as any)?.accessToken 
      || (session as any)?.access_token 
      || (session as any)?.user?.access_token 
      || (session as any)?.user?.token
    if (token) {
      apiClient.setToken(token as string)
    }
    
    // Ensure token is applied before fetching
    Promise.resolve().then(() => {
      loadLogs()
      loadAnalytics()
      loadEvents()
    })
  }, [session, status, router])

  useEffect(() => {
    loadLogs()
  }, [filters, pagination.page])

  // Re-fetch when tab becomes visible again (handles hard refresh and tab switches)
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        loadLogs();
        loadAnalytics();
        loadEvents();
      }
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [])

  const loadLogs = async () => {
    try {
      setLoading(true)
      const response = await apiClient.getAccessLogs({
        ...filters,
        page: pagination.page,
        limit: pagination.limit
      }) as AccessLogsResponse
      
      setLogs(response.logs)
      setPagination(response.pagination)
    } catch (error) {
      console.error('Error loading access logs:', error)
      toast.error('Erreur lors du chargement des logs d\'accès')
    } finally {
      setLoading(false)
    }
  }

  const loadAnalytics = async () => {
    try {
      setAnalyticsLoading(true)
      const [analyticsData, denialData] = await Promise.all([
        apiClient.getAccessAnalytics({
          event_id: filters.event_id,
          date_from: filters.date_from,
          date_to: filters.date_to
        }),
        apiClient.getDenialAnalysis({
          event_id: filters.event_id,
          date_from: filters.date_from,
          date_to: filters.date_to
        })
      ])
      
      setAnalytics(analyticsData as AccessAnalytics)
      setDenialAnalysis(denialData as DenialAnalysis)
    } catch (error) {
      console.error('Error loading analytics:', error)
      toast.error('Erreur lors du chargement des analyses')
    } finally {
      setAnalyticsLoading(false)
    }
  }

  const loadEvents = async () => {
    try {
      // Use admin endpoint to fetch all events for the filter
      const res = await eventsApi.getEvents(1, 200, undefined, true)
      setEvents(res.events || [])
    } catch (error) {
      console.error('Error loading events:', error)
      // Don't show error toast for events loading as it's not critical
    }
  }

  const handleFilterChange = (key: string, value: string) => {
    // Convert "all" values to undefined for API compatibility (undefined won't be sent in the request)
    const filterValue = value === 'all' ? undefined : value
    setFilters(prev => ({ ...prev, [key]: filterValue }))
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }))
  }

  const getResultBadge = (result: string) => {
    switch (result) {
      case 'SUCCESS':
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Accès accordé</Badge>
      case 'DENIED':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Accès refusé</Badge>
      default:
        return <Badge variant="secondary">{result}</Badge>
    }
  }

  const getDenialReasonBadge = (reason?: string) => {
    if (!reason) return null
    
    // Normalize reason to uppercase for case-insensitive matching
    const normalizedReason = reason.toUpperCase().trim()
    
    const reasonMap: Record<string, { label: string; variant: 'default' | 'destructive' | 'secondary' }> = {
      // Core denial reasons
      'INVALID_QR': { label: 'QR invalide', variant: 'destructive' },
      'EXPIRED': { label: 'Expiré', variant: 'destructive' },
      'ALREADY_USED': { label: 'Déjà utilisé', variant: 'destructive' },
      'NO_SUBSCRIPTION': { label: 'Pas d\'abonnement', variant: 'destructive' },
      'WRONG_ZONE': { label: 'Mauvaise zone', variant: 'destructive' },
      'WRONG_EVENT': { label: 'Mauvais événement', variant: 'destructive' },
      'WRONG_VENUE': { label: 'Mauvais lieu', variant: 'destructive' },
      'WRONG_TIME': { label: 'Mauvais horaire', variant: 'destructive' },
      
      // Status-based denial reasons
      'SUSPENDED_USER': { label: 'Utilisateur suspendu', variant: 'destructive' },
      'CANCELLED_TICKET': { label: 'Billet annulé', variant: 'destructive' },
      'NOT_YET_VALID': { label: 'Pas encore valide', variant: 'destructive' },
      'BLACKLISTED': { label: 'Accès bloqué', variant: 'destructive' },
      
      // Error-based denial reasons
      'TECHNICAL_ERROR': { label: 'Erreur technique', variant: 'destructive' },
      'NETWORK_ERROR': { label: 'Erreur réseau', variant: 'destructive' },
      'DATABASE_ERROR': { label: 'Erreur base de données', variant: 'destructive' },
      'DEVICE_ERROR': { label: 'Erreur appareil', variant: 'destructive' },
      
      // Other denial reasons
      'INSUFFICIENT_RIGHTS': { label: 'Droits insuffisants', variant: 'destructive' },
      'CAPACITY_FULL': { label: 'Capacité pleine', variant: 'destructive' },
      'DUPLICATE_ENTRY': { label: 'Entrée dupliquée', variant: 'destructive' },
      'SECURITY_FLAG': { label: 'Alerte sécurité', variant: 'destructive' },
      'FRAUD_SUSPECTED': { label: 'Fraude suspectée', variant: 'destructive' },
    }
    
    // Try exact match first, then normalized match
    const config = reasonMap[reason] || reasonMap[normalizedReason] || { 
      label: reason, 
      variant: 'destructive' as const // Default to destructive (red) for unknown reasons
    }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('fr-FR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const exportLogs = async () => {
    try {
      toast.info('Export en cours...')
      
      // Get all logs with current filters (without pagination)
      const response = await apiClient.getAccessLogs({
        ...filters,
        page: 1,
        limit: 10000 // Large limit to get all records
      }) as AccessLogsResponse
      
      // Prepare data for Excel export
      const excelData = response.logs.map(log => {
        // Extract QR code - prioritize scan_metadata first, then access_rights
        let qrCode = 'N/A';
        if (log.scan_metadata) {
          try {
            const metadata = typeof log.scan_metadata === 'string' 
              ? JSON.parse(log.scan_metadata) 
              : log.scan_metadata;
            qrCode = metadata?.qr_code || log.access_right?.qr_code || 'N/A';
          } catch (error) {
            qrCode = log.access_right?.qr_code || 'N/A';
          }
        } else {
          qrCode = log.access_right?.qr_code || 'N/A';
        }
        
        // Clean up QR code for export - limit length and filter invalid formats
        if (qrCode && qrCode !== 'N/A') {
          // If it's a URL or too long, show truncated version
          if (qrCode.length > 50 || qrCode.startsWith('http')) {
            qrCode = qrCode.substring(0, 45) + '...';
          }
        }

        return {
          'N°': response.logs.indexOf(log) + 1,
          'Date/Heure': formatDate(log.scanned_at),
          'QR Code': qrCode,
          'Résultat': log.result === 'SUCCESS' ? 'Accès accordé' : 'Accès refusé',
          'Raison de Refus': log.denial_reason || 'N/A',
          'Agent': log.controller_device || 'Système',
          'Événement': log.event?.title || 'Événement inconnu',
          'Utilisateur': log.access_right?.subscription?.user 
            ? `${log.access_right.subscription.user.first_name} ${log.access_right.subscription.user.last_name}`
            : 'N/A',
          'Email Utilisateur': log.access_right?.subscription?.user?.email || 'N/A',
          'Plan d\'Abonnement': log.access_right?.subscription?.plan?.name || 'N/A',
          'Numéro de Série': log.serial_number || 'N/A',
          'Notes': log.notes || 'N/A',
          'Statut QR Code': log.access_right?.status || 'N/A'
        };
      })
      
      // Create Excel file using SheetJS
      const XLSX = require('xlsx');
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      
      // Set column widths
      const columnWidths = [
        { wch: 8 },  // N°
        { wch: 20 }, // Date/Heure
        { wch: 25 }, // QR Code
        { wch: 15 }, // Résultat
        { wch: 20 }, // Raison de Refus
        { wch: 20 }, // Agent
        { wch: 30 }, // Événement
        { wch: 25 }, // Utilisateur
        { wch: 30 }, // Email Utilisateur
        { wch: 25 }, // Plan d'Abonnement
        { wch: 15 }, // Numéro de Série
        { wch: 30 }, // Notes
        { wch: 15 }  // Statut QR Code
      ];
      worksheet['!cols'] = columnWidths;
      
      // Create workbook
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Logs d\'Accès');
      
      // Generate filename with current date and filters
      const now = new Date()
      const dateStr = now.toISOString().split('T')[0]
      const filterStr = filters.result ? `_${filters.result}` : ''
      const denialStr = filters.denial_reason ? `_${filters.denial_reason}` : ''
      const filename = `access_logs_${dateStr}${filterStr}${denialStr}.xlsx`
      
      // Write and download file
      XLSX.writeFile(workbook, filename)
      
      toast.success(`Export terminé - ${response.logs.length} logs exportés en Excel`)
    } catch (error) {
      console.error('Error exporting logs:', error)
      toast.error('Erreur lors de l\'export')
    }
  }

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar type="admin" />
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="px-8 w-full">
            <PageHeader
              title="Logs de Contrôle d'Accès"
              description="Surveillance et analyse des validations d'accès en temps réel"
            />
            <div className="flex-1 overflow-auto pt-6 pb-6">
              <div className="space-y-6">
                <Skeleton className="h-8 w-64" />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-32" />
                  ))}
                </div>
                <Skeleton className="h-96" />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar type="admin" />
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="px-8 w-full">
          <PageHeader
            title="Logs de Contrôle d'Accès"
            description="Surveillance et analyse des validations d'accès en temps réel"
          >
            <Button onClick={exportLogs} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Exporter
            </Button>
          </PageHeader>
          
          <div className="flex-1 overflow-auto pt-6 pb-6 space-y-6">

      {/* Analytics Cards */}
      {analytics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Scans</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.overview.total_scans.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Tous les scans enregistrés
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taux de Réussite</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{analytics.overview.success_rate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">
                {analytics.overview.successful_scans.toLocaleString()} accès accordés
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taux de Refus</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{analytics.overview.denial_rate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">
                {analytics.overview.denied_scans.toLocaleString()} accès refusés
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Événements Actifs</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.top_events.length}</div>
              <p className="text-xs text-muted-foreground">
                Événements avec scans
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Tabs defaultValue="logs" className="space-y-6">
        <TabsList>
          <TabsTrigger value="logs">Logs d'Accès</TabsTrigger>
          <TabsTrigger value="analytics">Analyses</TabsTrigger>
          <TabsTrigger value="denials">Analyse des Refus</TabsTrigger>
        </TabsList>

        {/* Logs Tab */}
        <TabsContent value="logs" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Filtres
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Recherche</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="QR code, événement, agent, notes..."
                      value={filters.search}
                      onChange={(e) => handleFilterChange('search', e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Événement</label>
                  <Select value={filters.event_id || 'all'} onValueChange={(value) => handleFilterChange('event_id', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tous les événements" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les événements</SelectItem>
                      {events.map((event) => (
                        <SelectItem key={event.id} value={event.id}>
                          {event.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Résultat</label>
                  <Select value={filters.result || 'all'} onValueChange={(value) => handleFilterChange('result', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tous les résultats" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les résultats</SelectItem>
                      <SelectItem value="SUCCESS">Accès accordé</SelectItem>
                      <SelectItem value="DENIED">Accès refusé</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Raison de refus</label>
                  <Select value={filters.denial_reason || 'all'} onValueChange={(value) => handleFilterChange('denial_reason', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Toutes les raisons" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes les raisons</SelectItem>
                      <SelectItem value="INVALID_QR">QR invalide</SelectItem>
                      <SelectItem value="EXPIRED">Expiré</SelectItem>
                      <SelectItem value="ALREADY_USED">Déjà utilisé</SelectItem>
                      <SelectItem value="NO_SUBSCRIPTION">Pas d'abonnement</SelectItem>
                      <SelectItem value="WRONG_ZONE">Mauvaise zone</SelectItem>
                      <SelectItem value="TECHNICAL_ERROR">Erreur technique</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Tri</label>
                  <Select value={`${filters.sort_by}-${filters.sort_order}`} onValueChange={(value) => {
                    const [sort_by, sort_order] = value.split('-')
                    handleFilterChange('sort_by', sort_by)
                    handleFilterChange('sort_order', sort_order as 'asc' | 'desc')
                  }}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="scanned_at-desc">Date (récent)</SelectItem>
                      <SelectItem value="scanned_at-asc">Date (ancien)</SelectItem>
                      <SelectItem value="result-desc">Résultat (refusé)</SelectItem>
                      <SelectItem value="result-asc">Résultat (accordé)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Logs Table */}
          <Card>
            <CardHeader>
              <CardTitle>Logs d'Accès</CardTitle>
              <CardDescription>
                {pagination.total.toLocaleString()} logs trouvés
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date/Heure</TableHead>
                        <TableHead>QR Code</TableHead>
                        <TableHead>Résultat</TableHead>
                        <TableHead>Raison</TableHead>
                        <TableHead>Agent</TableHead>
                        <TableHead>Événement</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {logs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-muted-foreground" />
                              {formatDate(log.scanned_at)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <code className="text-sm bg-gray-100 px-2 py-1 rounded max-w-xs truncate block">
                              {(() => {
                                // Extract QR code - prioritize scan_metadata first, then access_rights
                                let qrCode = 'N/A';
                                if (log.scan_metadata) {
                                  try {
                                    const metadata = typeof log.scan_metadata === 'string' 
                                      ? JSON.parse(log.scan_metadata) 
                                      : log.scan_metadata;
                                    qrCode = metadata?.qr_code || log.access_right?.qr_code || 'N/A';
                                  } catch (error) {
                                    qrCode = log.access_right?.qr_code || 'N/A';
                                  }
                                } else {
                                  qrCode = log.access_right?.qr_code || 'N/A';
                                }
                                
                                // Limit QR code display length and filter out invalid formats
                                if (qrCode && qrCode !== 'N/A') {
                                  // If it's a URL or too long, show truncated version
                                  if (qrCode.length > 30 || qrCode.startsWith('http')) {
                                    return qrCode.substring(0, 25) + '...';
                                  }
                                  return qrCode;
                                }
                                return 'N/A';
                              })()}
                            </code>
                          </TableCell>
                          <TableCell>{getResultBadge(log.result)}</TableCell>
                          <TableCell>{getDenialReasonBadge(log.denial_reason)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-muted-foreground" />
                              {log.controller_device || 'Système'}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-muted-foreground" />
                              {log.event?.title || 'Événement inconnu'}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => setSelectedLog(log)}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                  <DialogTitle>Détails du Log d'Accès</DialogTitle>
                                  <DialogDescription>
                                    Informations complètes sur cette validation d'accès
                                  </DialogDescription>
                                </DialogHeader>
                                {selectedLog && (
                                  <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <label className="text-sm font-medium">Date/Heure</label>
                                        <p className="text-sm text-muted-foreground">{formatDate(selectedLog.scanned_at)}</p>
                                      </div>
                                      <div>
                                        <label className="text-sm font-medium">Agent</label>
                                        <p className="text-sm text-muted-foreground">{selectedLog.controller_device || 'Système'}</p>
                                      </div>
                                      <div>
                                        <label className="text-sm font-medium">Résultat</label>
                                        <div className="mt-1">{getResultBadge(selectedLog.result)}</div>
                                      </div>
                                      <div>
                                        <label className="text-sm font-medium">Raison de refus</label>
                                        <div className="mt-1">{getDenialReasonBadge(selectedLog.denial_reason) || 'N/A'}</div>
                                      </div>
                                      <div>
                                        <label className="text-sm font-medium">QR Code</label>
                                        <p className="text-sm text-muted-foreground font-mono break-all">
                                          {(() => {
                                            // Extract QR code - prioritize scan_metadata first, then access_rights
                                            let qrCode = 'N/A';
                                            if (selectedLog.scan_metadata) {
                                              try {
                                                const metadata = typeof selectedLog.scan_metadata === 'string' 
                                                  ? JSON.parse(selectedLog.scan_metadata) 
                                                  : selectedLog.scan_metadata;
                                                qrCode = metadata?.qr_code || selectedLog.access_right?.qr_code || 'N/A';
                                              } catch (error) {
                                                qrCode = selectedLog.access_right?.qr_code || 'N/A';
                                              }
                                            } else {
                                              qrCode = selectedLog.access_right?.qr_code || 'N/A';
                                            }
                                            
                                            // Show full QR code in modal, but handle long ones
                                            if (qrCode && qrCode !== 'N/A') {
                                              return qrCode;
                                            }
                                            return 'N/A';
                                          })()}
                                        </p>
                                      </div>
                                      <div>
                                        <label className="text-sm font-medium">Événement</label>
                                        <p className="text-sm text-muted-foreground">{selectedLog.event?.title || 'N/A'}</p>
                                      </div>
                                      <div>
                                        <label className="text-sm font-medium">Numéro de Série</label>
                                        <p className="text-sm text-muted-foreground">{selectedLog.serial_number || 'N/A'}</p>
                                      </div>
                                      <div>
                                        <label className="text-sm font-medium">Utilisateur</label>
                                        <p className="text-sm text-muted-foreground">
                                          {selectedLog.access_right?.subscription?.user 
                                            ? `${selectedLog.access_right.subscription.user.first_name} ${selectedLog.access_right.subscription.user.last_name}`
                                            : 'N/A'
                                          }
                                        </p>
                                      </div>
                                    </div>
                                    
                                    {selectedLog.scan_metadata && (
                                      <div>
                                        <label className="text-sm font-medium">Détails du Scan</label>
                                        <div className="bg-gray-50 p-3 rounded mt-1 space-y-2">
                                          {(() => {
                                            try {
                                              const metadata = typeof selectedLog.scan_metadata === 'string' 
                                                ? JSON.parse(selectedLog.scan_metadata) 
                                                : selectedLog.scan_metadata;
                                              
                                              return (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                                  {metadata.qr_code && (
                                                    <div>
                                                      <span className="font-medium text-gray-700">QR Code:</span>
                                                      <code className="ml-2 bg-white px-2 py-1 rounded text-xs break-all max-w-xs block">
                                                        {metadata.qr_code.length > 30 ? metadata.qr_code.substring(0, 27) + '...' : metadata.qr_code}
                                                      </code>
                                                    </div>
                                                  )}
                                                  {metadata.agent_id && (
                                                    <div>
                                                      <span className="font-medium text-gray-700">Agent:</span>
                                                      <span className="ml-2 text-gray-600">{metadata.agent_id}</span>
                                                    </div>
                                                  )}

                                                  {metadata.terminal_id && (
                                                    <div>
                                                      <span className="font-medium text-gray-700">Terminal:</span>
                                                      <span className="ml-2 text-gray-600">{metadata.terminal_id}</span>
                                                    </div>
                                                  )}

                                                </div>
                                              );
                                            } catch (error) {
                                              return (
                                                <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto">
                                                  {JSON.stringify(selectedLog.scan_metadata, null, 2)}
                                                </pre>
                                              );
                                            }
                                          })()}
                                        </div>
                                      </div>
                                    )}
                                    
                                    {selectedLog.notes && (
                                      <div>
                                        <label className="text-sm font-medium">Notes</label>
                                        <p className="text-sm text-muted-foreground mt-1">{selectedLog.notes}</p>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </DialogContent>
                            </Dialog>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {/* Pagination */}
                  {pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">
                        Page {pagination.page} sur {pagination.totalPages} ({pagination.total} logs)
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(pagination.page - 1)}
                          disabled={pagination.page === 1}
                        >
                          Précédent
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(pagination.page + 1)}
                          disabled={pagination.page === pagination.totalPages}
                        >
                          Suivant
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          {analyticsLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-64 w-full" />
              ))}
            </div>
          ) : analytics ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Scans by Result */}
              <Card>
                <CardHeader>
                  <CardTitle>Répartition par Résultat</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(analytics.scans_by_result).map(([result, count]) => (
                      <div key={result} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getResultBadge(result)}
                        </div>
                        <span className="font-medium">{count.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Top Events */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Événements</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analytics.top_events.slice(0, 5).map((event) => (
                      <div key={event.event_id} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{event.event_title}</p>
                        </div>
                        <Badge variant="secondary">{event.count}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Top Agents */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Agents</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analytics.top_agents.slice(0, 5).map((agent) => (
                      <div key={agent.agent} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <span>{agent.agent}</span>
                        </div>
                        <Badge variant="secondary">{agent.count}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Scans by Day */}
              <Card>
                <CardHeader>
                  <CardTitle>Scans par Jour</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {analytics.scans_by_day.slice(-7).map((day) => (
                      <div key={day.date} className="flex items-center justify-between">
                        <span className="text-sm">{new Date(day.date).toLocaleDateString('fr-FR')}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${(day.count / Math.max(...analytics.scans_by_day.map(d => d.count))) * 100}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium w-12 text-right">{day.count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Impossible de charger les analyses. Veuillez réessayer.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        {/* Denial Analysis Tab */}
        <TabsContent value="denials" className="space-y-6">
          {analyticsLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-64 w-full" />
              ))}
            </div>
          ) : denialAnalysis ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Denial Reasons */}
              <Card>
                <CardHeader>
                  <CardTitle>Raisons de Refus</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {denialAnalysis.denial_reasons.map((reason) => (
                      <div key={reason.reason} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{reason.reason}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">{reason.percentage.toFixed(1)}%</span>
                            <Badge variant="destructive">{reason.count}</Badge>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-red-600 h-2 rounded-full" 
                            style={{ width: `${reason.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Denials */}
              <Card>
                <CardHeader>
                  <CardTitle>Refus Récents</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {denialAnalysis.recent_denials.map((denial) => (
                      <div key={denial.id} className="border rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <code className="text-sm bg-gray-100 px-2 py-1 rounded max-w-xs truncate block">
                            {denial.qr_code && denial.qr_code !== 'Unknown' 
                              ? (denial.qr_code.length > 25 ? denial.qr_code.substring(0, 22) + '...' : denial.qr_code)
                              : 'N/A'
                            }
                          </code>
                          <span className="text-xs text-muted-foreground">{formatDate(denial.scanned_at)}</span>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium">{denial.event_title}</p>
                          <div className="flex items-center gap-2">
                            {getDenialReasonBadge(denial.denial_reason)}
                            <span className="text-xs text-muted-foreground">par {denial.controller_device}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Top Denied QR Codes */}
              <Card>
                <CardHeader>
                  <CardTitle>QR Codes les Plus Refusés</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {denialAnalysis.top_denied_qr_codes.slice(0, 5).map((qr) => (
                      <div key={qr.qr_code} className="flex items-center justify-between">
                        <code className="text-sm bg-gray-100 px-2 py-1 rounded">{qr.qr_code}</code>
                        <Badge variant="destructive">{qr.count} refus</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Denial Trends */}
              <Card>
                <CardHeader>
                  <CardTitle>Tendances des Refus</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {denialAnalysis.denial_trends.slice(-7).map((trend) => (
                      <div key={trend.date} className="flex items-center justify-between">
                        <span className="text-sm">{new Date(trend.date).toLocaleDateString('fr-FR')}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-red-600 h-2 rounded-full" 
                              style={{ width: `${(trend.count / Math.max(...denialAnalysis.denial_trends.map(t => t.count))) * 100}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium w-12 text-right">{trend.count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Impossible de charger l'analyse des refus. Veuillez réessayer.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>
      </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}
