"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { EmptyState } from "@/components/ui/empty-state"
import { Search, MoreVertical, Eye, Calendar, User, CreditCard, Download, RefreshCw, Filter, ShoppingCart, Receipt, Package, AlertTriangle, X, RotateCcw, CheckCircle, FileText, Trash2, List, Edit, Trash } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Sidebar } from "@/components/layout/sidebar"
import { PageHeader } from "@/components/ui/page-header"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useSession } from "next-auth/react"
import apiClient from "@/lib/api"
import type { Order, OrderItem } from "@/types"

const ORDER_STATUS = {
  DRAFT: "Brouillon",
  PENDING: "En attente",
  CONFIRMED: "Confirmée",
  PROCESSING: "En traitement",
  COMPLETED: "Terminée",
  CANCELLED: "Annulée",
  REFUNDED: "Remboursée",
  EXPIRED: "Expirée",
  PARTIALLY_FULFILLED: "Partiellement traitée",
  ON_HOLD: "En suspens"
}

const STATUS_COLORS = {
  DRAFT: "bg-gray-100 text-gray-800",
  PENDING: "bg-yellow-100 text-yellow-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  PROCESSING: "bg-purple-100 text-purple-800",
  COMPLETED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
  REFUNDED: "bg-orange-100 text-orange-800",
  EXPIRED: "bg-red-100 text-red-800",
  PARTIALLY_FULFILLED: "bg-yellow-100 text-yellow-800",
  ON_HOLD: "bg-orange-100 text-orange-800"
}

const PURCHASE_CHANNEL = {
  WEB: "Web",
  MOBILE_APP: "Application mobile",
  PHONE: "Téléphone",
  COUNTER: "Comptoir",
  PARTNER: "Partenaire"
}

const ITEM_TYPES = {
  TICKET: "Billet",
  SUBSCRIPTION: "Abonnement",
  MERCHANDISE: "Marchandise",
  SERVICE: "Service",
  OTHER: "Autre"
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [channelFilter, setChannelFilter] = useState("all")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalOrders, setTotalOrders] = useState(0)
  const [pageSize, setPageSize] = useState(50)
  const { toast } = useToast()
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [showOrderDetails, setShowOrderDetails] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const { data: session } = useSession()
  
  // Stats state
  const [stats, setStats] = useState({
    total_orders: 0,
    total_revenue: 0,
    completed_orders: 0,
    pending_orders: 0,
    confirmed_orders: 0
  })
  
  // Tab state
  const [activeTab, setActiveTab] = useState("orders")
  
  // Order items state
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])
  const [itemsLoading, setItemsLoading] = useState(false)
  const [itemsError, setItemsError] = useState<string | null>(null)
  const [itemsPage, setItemsPage] = useState(1)
  const [itemsTotalPages, setItemsTotalPages] = useState(1)
  const [itemsTotal, setItemsTotal] = useState(0)
  const [itemActionLoading, setItemActionLoading] = useState(false)

  // Set token from session
  useEffect(() => {
    if (session?.user?.access_token) {
      apiClient.setToken(session.user.access_token)
    }
  }, [session?.user?.access_token])

  useEffect(() => {
    // Only fetch if we have a session token
    if (session?.user?.access_token) {
    fetchOrders()
    fetchStats()
    }
  }, [searchTerm, statusFilter, channelFilter, page, pageSize, session?.user?.access_token])

  useEffect(() => {
    if (activeTab === "items" && selectedOrder) {
      fetchOrderItems(selectedOrder.id)
    }
  }, [activeTab, selectedOrder])

  // Refetch data when user returns to the tab
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && session?.user?.access_token) {
        fetchOrders()
        fetchStats()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [session?.user?.access_token])

  const fetchStats = async () => {
    try {
      // First try with organizer_id (hardcoded)
      let statsResponse = await apiClient.getOrderStats() as any
      console.log('Stats response (with organizer_id):', statsResponse)
      
      // Handle different response formats
      let statsData = statsResponse?.data || statsResponse
      
      // Check if stats are valid (not all zeros)
      const hasValidStats = statsData?.total_orders > 0 || statsData?.total_revenue > 0 || 
                           statsData?.orders_by_status?.COMPLETED > 0 || 
                           statsData?.orders_by_status?.CONFIRMED > 0 ||
                           statsData?.orders_by_status?.PENDING > 0
      
      // If stats are all zeros, try without organizer_id filter to get all orders stats
      if (!hasValidStats) {
        console.log('Stats with organizer_id returned zeros, trying without filter...')
        try {
          // Call the API directly without organizer_id using fetch
          const token = (apiClient as any).token || session?.user?.access_token
          const baseURL = (apiClient as any).baseURL || 'http://localhost:3000/api/v1'
          const response = await fetch(`${baseURL}/orders/stats`, {
            headers: {
              'Authorization': token ? `Bearer ${token}` : '',
              'Content-Type': 'application/json'
            }
          })
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`)
          }
          const allStatsResponse = await response.json() as any
          console.log('Stats response (without organizer_id):', allStatsResponse)
          const allStatsData = allStatsResponse?.data || allStatsResponse
          
          // Check if this has valid stats
          const hasAllStats = allStatsData?.total_orders > 0 || allStatsData?.total_revenue > 0 || 
                             allStatsData?.orders_by_status?.COMPLETED > 0 || 
                             allStatsData?.orders_by_status?.CONFIRMED > 0 ||
                             allStatsData?.orders_by_status?.PENDING > 0
          
          if (hasAllStats) {
            statsData = allStatsData
            console.log('Using stats without organizer filter')
          }
        } catch (fallbackErr) {
          console.warn('Failed to fetch stats without organizer filter:', fallbackErr)
        }
      }
      
      // Final check if we have valid stats
      const finalHasValidStats = statsData?.total_orders > 0 || statsData?.total_revenue > 0 || 
                                 statsData?.orders_by_status?.COMPLETED > 0 || 
                                 statsData?.orders_by_status?.CONFIRMED > 0 ||
                                 statsData?.orders_by_status?.PENDING > 0
      
      if (finalHasValidStats) {
        // Use API stats - these are accurate totals
      setStats({
          total_orders: statsData?.total_orders || statsData?.total || 0,
          total_revenue: statsData?.total_revenue || statsData?.revenue || 0,
          completed_orders: statsData?.orders_by_status?.COMPLETED || statsData?.completed || 0,
          pending_orders: statsData?.orders_by_status?.PENDING || statsData?.pending || 0,
          confirmed_orders: statsData?.orders_by_status?.CONFIRMED || statsData?.confirmed || 0
      })
      } else if (orders.length > 0 && totalOrders > 0) {
        // Last resort: calculate from orders we have, but we need to fetch all orders for accurate stats
        console.warn('Stats API returned zeros, calculating from orders data (may not be 100% accurate)...')
        // Try to fetch all orders to calculate accurate stats
        try {
          const allOrdersResponse = await apiClient.getOrders({ page: 1, limit: 10000 }) as any
          const allOrdersList = Array.isArray(allOrdersResponse) ? allOrdersResponse : 
                               allOrdersResponse?.orders || allOrdersResponse?.data?.orders || []
          
          if (allOrdersList.length > 0) {
            const calculatedStats = calculateStatsFromAllOrders(allOrdersList, totalOrders)
            setStats(calculatedStats)
          } else {
            // Fallback to current page
            const calculatedStats = calculateStatsFromOrders(orders, totalOrders)
            setStats(calculatedStats)
          }
        } catch (fetchErr) {
          console.warn('Failed to fetch all orders for stats, using current page:', fetchErr)
          const calculatedStats = calculateStatsFromOrders(orders, totalOrders)
          setStats(calculatedStats)
        }
      } else {
        // No orders available, set to zeros
        setStats({
          total_orders: 0,
          total_revenue: 0,
          completed_orders: 0,
          pending_orders: 0,
          confirmed_orders: 0
        })
      }
    } catch (err: any) {
      console.error("Error fetching stats:", err)
      // If we have orders, calculate stats from them as fallback
      if (orders.length > 0 && totalOrders > 0) {
        console.log('Stats API failed, calculating from orders data...')
        const calculatedStats = calculateStatsFromOrders(orders, totalOrders)
        setStats(calculatedStats)
      } else {
        // Reset to defaults on error if no orders available
        setStats({
          total_orders: 0,
          total_revenue: 0,
          completed_orders: 0,
          pending_orders: 0,
          confirmed_orders: 0
        })
      }
    }
  }

  // Helper to calculate stats from ALL orders (more accurate)
  const calculateStatsFromAllOrders = (allOrdersList: Order[], totalCount: number) => {
    const totalRevenue = allOrdersList.reduce((sum, order) => sum + (order.total_amount || 0), 0)
    const completedOrders = allOrdersList.filter(o => o.status === 'COMPLETED').length
    const pendingOrders = allOrdersList.filter(o => o.status === 'PENDING').length
    const confirmedOrders = allOrdersList.filter(o => o.status === 'CONFIRMED').length

    return {
      total_orders: totalCount,
      total_revenue: totalRevenue,
      completed_orders: completedOrders,
      pending_orders: pendingOrders,
      confirmed_orders: confirmedOrders
    }
  }

  // Helper function to calculate stats from orders array
  // NOTE: This only calculates from the current page, so it's not accurate for totals
  // It should only be used as a last resort when the API fails
  const calculateStatsFromOrders = (ordersList: Order[], totalCount?: number) => {
    // Use totalCount if provided (from API), otherwise use ordersList length
    const calculatedTotal = totalCount || ordersList.length
    // Only calculate revenue from current page (not accurate for total)
    const totalRevenue = ordersList.reduce((sum, order) => sum + (order.total_amount || 0), 0)
    // These counts are only from the current page, not accurate totals
    const completedOrders = ordersList.filter(o => o.status === 'COMPLETED').length
    const pendingOrders = ordersList.filter(o => o.status === 'PENDING').length
    const confirmedOrders = ordersList.filter(o => o.status === 'CONFIRMED').length

    return {
      total_orders: calculatedTotal,
      total_revenue: totalRevenue, // This is only from current page, not accurate
      completed_orders: completedOrders, // This is only from current page, not accurate
      pending_orders: pendingOrders, // This is only from current page, not accurate
      confirmed_orders: confirmedOrders // This is only from current page, not accurate
    }
  }

  const fetchOrderItems = async (orderId?: string) => {
    setItemsLoading(true)
    setItemsError(null)
    try {
      let response: any
      
      if (orderId) {
        // Fetch items for a specific order
        response = await apiClient.getOrderItems(orderId) as any
        const itemsList = Array.isArray(response) ? response : []
        setOrderItems(itemsList)
        setItemsTotal(itemsList.length)
        setItemsTotalPages(1)
      } else {
        // Fetch all order items (fallback)
        const params: any = {
          page: itemsPage,
          limit: pageSize,
        }
        
        response = await apiClient.getAllOrderItems(params) as any
        const itemsList = Array.isArray(response) ? response : response?.items || []
        
        setOrderItems(itemsList)
        
        if (response?.pagination?.total) {
          setItemsTotal(response.pagination.total)
          setItemsTotalPages(response.pagination.totalPages)
        }
      }
    } catch (err: any) {
      console.error("Error fetching order items:", err)
      setItemsError("Erreur lors du chargement des articles de commande")
      setOrderItems([])
    } finally {
      setItemsLoading(false)
    }
  }

  const fetchOrders = async () => {
    setLoading(true)
    setError(null)
    try {
      const params: any = {
        page,
        limit: pageSize,
      }
      if (searchTerm) params.search = searchTerm
      if (statusFilter !== "all") params.status = statusFilter
      if (channelFilter !== "all") params.channel = channelFilter
      
      const response = await apiClient.getOrders(params) as any
      
      // Handle different response formats
      // Response could be: array, { orders: [], total: number }, { data: { orders: [], total: number } }, etc.
      let orderList: Order[] = []
      let total = 0
      
      if (Array.isArray(response)) {
        orderList = response
        total = response.length
      } else if (response?.data) {
        // Response wrapped in data property
        if (Array.isArray(response.data)) {
          orderList = response.data
          total = response.data.length
        } else if (response.data.orders) {
          orderList = response.data.orders
          total = response.data.total || response.data.orders.length
        }
      } else if (response?.orders) {
        orderList = response.orders
        total = response.total || response.orders.length
      } else if (response?.success && response?.data) {
        // { success: true, data: [...] }
        if (Array.isArray(response.data)) {
          orderList = response.data
          total = response.data.length
        } else if (response.data.orders) {
          orderList = response.data.orders
          total = response.data.total || response.data.orders.length
        }
      }
      
      console.log('Orders response:', response)
      console.log('Parsed orders list:', orderList)
      console.log('Total orders:', total)
      
      setOrders(orderList)
      
      // Handle pagination
      if (response?.total !== undefined) {
        setTotalOrders(response.total)
        setTotalPages(Math.ceil(response.total / pageSize))
      } else if (total > 0) {
        setTotalOrders(total)
        setTotalPages(Math.ceil(total / pageSize))
      } else {
        // If no total provided, use the length of the current page
        setTotalOrders(orderList.length)
        setTotalPages(1)
      }

      // After fetching orders, refresh stats to ensure they're up to date
      // Don't calculate from current page - always use API stats for accuracy
      if (response?.total !== undefined && response.total > 0) {
        // Refresh stats from API to get accurate totals
        fetchStats()
      }
    } catch (err: any) {
      console.error("Error fetching orders:", err)
      
      // Only clear orders if this is not the initial load (to prevent showing error on first load)
      // Keep existing orders if we have them, unless it's a critical error
      if (orders.length === 0) {
      if (err.response?.status === 400) {
        setError("Erreur de requête API (400). Vérifiez les paramètres de filtrage.")
      } else if (err.response?.status === 404) {
        setError("Endpoint des commandes non trouvé (404). Vérifiez que le backend est configuré.")
      } else if (err.response?.status === 401) {
        setError("Vous n'êtes pas autorisé à accéder aux commandes.")
      } else if (err.code === 'NETWORK_ERROR' || err.message?.includes('fetch')) {
        setError("Impossible de se connecter au serveur. Vérifiez votre connexion internet.")
      } else {
        setError("Erreur lors du chargement des commandes. Veuillez réessayer.")
      }
      setOrders([])
      } else {
        // If we have existing orders, show a toast but don't clear them
        toast({
          title: "Erreur de rafraîchissement",
          description: "Impossible de mettre à jour les commandes. Les données affichées peuvent être obsolètes.",
          variant: "destructive"
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (order: Order, newStatus: string) => {
    setActionLoading(true)
    try {
      console.log('Updating order status:', order.id, 'to:', newStatus)
      
      // Update local state immediately for instant feedback
      setOrders(prevOrders => 
        prevOrders.map(o => 
          o.id === order.id ? { ...o, status: newStatus as any } : o
        )
      )
      
      // Update order status via API
      await apiClient.updateOrder(order.id, { status: newStatus })
      
      // Refresh orders list and stats to get the latest data from backend
      setTimeout(() => {
        fetchOrders()
        fetchStats()
      }, 500)
      
      toast({
        title: "Statut mis à jour",
        description: `La commande ${order.order_number} est maintenant ${ORDER_STATUS[newStatus as keyof typeof ORDER_STATUS]?.toLowerCase()}`
      })
    } catch (err: any) {
      console.error("Error updating order status:", err)
      
      // Revert local state change on error
      setOrders(prevOrders => 
        prevOrders.map(o => 
          o.id === order.id ? { ...o, status: order.status as any } : o
        )
      )
      
      toast({
        title: "Erreur",
        description: `Impossible de mettre à jour le statut: ${err?.message || 'Erreur inconnue'}`,
        variant: "destructive"
      })
    } finally {
      setActionLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const color = STATUS_COLORS[status as keyof typeof STATUS_COLORS] || "bg-gray-100 text-gray-800"
    const label = ORDER_STATUS[status as keyof typeof ORDER_STATUS] || status
    return <Badge className={color}>{label}</Badge>
  }

  const formatDate = (dateString: string | Date) => {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatCurrency = (amount: number) => {
    // Handle invalid or very large numbers
    if (!amount || isNaN(amount) || !isFinite(amount)) {
      return '0,000 TND'
    }
    
    // For very large numbers, use a more compact format
    if (amount >= 1000000000) {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
        currency: 'TND',
        notation: 'compact',
        maximumFractionDigits: 2
      }).format(amount)
    }
    
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'TND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  // Group order items by plan/type for better display
  const groupOrderItems = (items: OrderItem[]) => {
    const grouped = items.reduce((acc, item) => {
      const key = item.ticket_type?.name || item.item_name || 'Autre'
      if (!acc[key]) {
        acc[key] = {
          name: key,
          items: [],
          totalQuantity: 0,
          totalPrice: 0
        }
      }
      acc[key].items.push(item)
      acc[key].totalQuantity += item.quantity
      acc[key].totalPrice += item.total_price
      return acc
    }, {} as Record<string, { name: string; items: OrderItem[]; totalQuantity: number; totalPrice: number }>)
    
    return Object.values(grouped)
  }

  const handleViewOrderDetails = (order: Order) => {
    setSelectedOrder(order)
    setShowOrderDetails(true)
  }

  const handleViewOrderItems = (order: Order) => {
    setSelectedOrder(order)
    setActiveTab("items")
    setShowOrderDetails(false) // Close the modal if it's open
  }

  const handleCancelOrder = async (order: Order) => {
    setActionLoading(true)
    try {
      await apiClient.cancelOrder(order.id, "Annulé par l'administrateur")
      toast({
        title: "Commande annulée",
        description: `La commande ${order.order_number} a été annulée avec succès`
      })
      fetchOrders()
      fetchStats()
    } catch (err: any) {
      toast({
        title: "Erreur",
        description: `Impossible d'annuler la commande: ${err?.message || 'Erreur inconnue'}`,
        variant: "destructive"
      })
    } finally {
      setActionLoading(false)
    }
  }

  const handleRefundOrder = async (order: Order) => {
    setActionLoading(true)
    try {
      await apiClient.refundOrder(order.id, { 
        amount: order.total_amount,
        reason: "Remboursement administrateur"
      })
      toast({
        title: "Commande remboursée",
        description: `La commande ${order.order_number} a été remboursée avec succès`
      })
      fetchOrders()
      fetchStats()
    } catch (err: any) {
      toast({
        title: "Erreur",
        description: `Impossible de rembourser la commande: ${err?.message || 'Erreur inconnue'}`,
        variant: "destructive"
      })
    } finally {
      setActionLoading(false)
    }
  }

  const handleConfirmOrder = async (order: Order) => {
    setActionLoading(true)
    try {
      await apiClient.confirmOrder(order.id)
      toast({
        title: "Commande confirmée",
        description: `La commande ${order.order_number} a été confirmée avec succès`
      })
      fetchOrders()
      fetchStats()
    } catch (err: any) {
      toast({
        title: "Erreur",
        description: `Impossible de confirmer la commande: ${err?.message || 'Erreur inconnue'}`,
        variant: "destructive"
      })
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeleteOrder = async (order: Order) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer définitivement la commande ${order.order_number} ?`)) {
      return
    }
    
    setActionLoading(true)
    try {
      await apiClient.deleteOrder(order.id)
      toast({
        title: "Commande supprimée",
        description: `La commande ${order.order_number} a été supprimée avec succès`
      })
      fetchOrders()
      fetchStats()
    } catch (err: any) {
      toast({
        title: "Erreur",
        description: `Impossible de supprimer la commande: ${err?.message || 'Erreur inconnue'}`,
        variant: "destructive"
      })
    } finally {
      setActionLoading(false)
    }
  }

  const handleGenerateInvoice = async (order: Order) => {
    setActionLoading(true)
    try {
      const invoiceData = await apiClient.generateOrderInvoice(order.id) as any
      
      // Handle both HTML and PDF responses
      let blob: Blob
      let filename: string
      let mimeType: string
      
      if (typeof invoiceData === 'string' || (invoiceData instanceof ArrayBuffer && new TextDecoder().decode(invoiceData).includes('<html'))) {
        // HTML invoice
        const htmlContent = typeof invoiceData === 'string' ? invoiceData : new TextDecoder().decode(invoiceData)
        blob = new Blob([htmlContent], { type: 'text/html' })
        filename = `facture-${order.order_number}.html`
        mimeType = 'text/html'
      } else {
        // PDF invoice
        blob = new Blob([invoiceData as BlobPart], { type: 'application/pdf' })
        filename = `facture-${order.order_number}.pdf`
        mimeType = 'application/pdf'
      }
      
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast({
        title: "Facture générée",
        description: `La facture pour la commande ${order.order_number} a été téléchargée`
      })
    } catch (err: any) {
      console.error('Invoice generation error:', err)
      toast({
        title: "Erreur",
        description: `Impossible de générer la facture: ${err?.message || 'Erreur inconnue'}`,
        variant: "destructive"
      })
    } finally {
      setActionLoading(false)
    }
  }

  // Order Item Actions
  const handleEditOrderItem = async (item: OrderItem) => {
    // TODO: Implement edit modal for order items
    toast({
      title: "Modification d'article",
      description: `Fonctionnalité de modification pour l'article "${item.item_name || item.ticket_type?.name || 'Article'}" sera bientôt disponible.`
    })
  }

  const handleDeleteOrderItem = async (item: OrderItem) => {
    if (!selectedOrder) return
    
    if (!confirm(`Êtes-vous sûr de vouloir supprimer cet article de la commande #${selectedOrder.order_number} ?`)) {
      return
    }
    
    setItemActionLoading(true)
    try {
      console.log('Deleting order item:', { orderId: selectedOrder.id, itemId: item.id })
      await apiClient.removeOrderItem(selectedOrder.id, item.id)
      
      toast({
        title: "Article supprimé",
        description: `L'article "${item.item_name || item.ticket_type?.name || (item as any).subscription_plan?.name || 'Article'}" a été supprimé de la commande.`
      })
      
      // Refresh the order items
      await fetchOrderItems(selectedOrder.id)
      
      // Also refresh the orders list to update totals
      await fetchOrders()
      await fetchStats()
    } catch (err: any) {
      console.error('Error deleting order item:', err)
      toast({
        title: "Erreur",
        description: `Impossible de supprimer l'article: ${err?.message || 'Erreur inconnue'}`,
        variant: "destructive"
      })
    } finally {
      setItemActionLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar type="admin" />
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="px-8 w-full">
          <PageHeader
            title="Commandes"
            description="Gérez les commandes, leurs statuts et leurs détails."
          >
            <Button 
              className="ml-auto" 
              variant="outline" 
              onClick={() => {
                if (session?.user?.access_token) {
                  fetchOrders()
                  fetchStats()
                } else {
                  toast({
                    title: "Erreur d'authentification",
                    description: "Veuillez vous reconnecter pour actualiser les données.",
                    variant: "destructive"
                  })
                }
              }}
              disabled={loading || !session?.user?.access_token}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
          </PageHeader>
          
          <div className="flex-1 overflow-auto pt-6 pb-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="orders" className="flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4" />
                  Commandes
                </TabsTrigger>
                <TabsTrigger value="items" className="flex items-center gap-2">
                  <List className="h-4 w-4" />
                  Articles
                </TabsTrigger>
              </TabsList>

              <TabsContent value="orders" className="space-y-6">
                {/* Filters */}
                <div className="flex items-center gap-3 mb-6">
              <div className="relative flex-1">
                <Input
                  className="pl-10 pr-4 py-2 rounded-full border border-gray-300 shadow-sm focus:ring-2 focus:ring-primary focus:border-primary transition-all text-base"
                  placeholder="Rechercher par numéro, email, nom..."
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
                <option value="DRAFT">Brouillon</option>
                <option value="PENDING">En attente</option>
                <option value="CONFIRMED">Confirmée</option>
                <option value="PROCESSING">En traitement</option>
                <option value="COMPLETED">Terminée</option>
                <option value="CANCELLED">Annulée</option>
                <option value="REFUNDED">Remboursée</option>
                <option value="EXPIRED">Expirée</option>
                <option value="PARTIALLY_FULFILLED">Partiellement traitée</option>
                <option value="ON_HOLD">En suspens</option>
              </select>
              
              <select
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                value={channelFilter}
                onChange={e => setChannelFilter(e.target.value)}
              >
                <option value="all">Tous les canaux</option>
                <option value="WEB">Web</option>
                <option value="MOBILE_APP">Application mobile</option>
                <option value="PHONE">Téléphone</option>
                <option value="COUNTER">Comptoir</option>
                <option value="PARTNER">Partenaire</option>
              </select>
              
              <select
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                value={pageSize}
                onChange={e => {
                  setPageSize(Number(e.target.value))
                  setPage(1) // Reset to first page when changing page size
                }}
              >
                <option value={20}>20 par page</option>
                <option value={50}>50 par page</option>
                <option value={100}>100 par page</option>
                <option value={200}>200 par page</option>
              </select>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
              {/* Confirmed */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Confirmées</CardTitle>
                  <CheckCircle className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.confirmed_orders}</div>
                  <p className="text-xs text-muted-foreground">Commandes confirmées</p>
                </CardContent>
              </Card>

              {/* Completed */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Terminées</CardTitle>
                  <Receipt className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.completed_orders}</div>
                  <p className="text-xs text-muted-foreground">Commandes terminées</p>
                </CardContent>
              </Card>

              {/* Total */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total</CardTitle>
                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.total_orders}</div>
                  <p className="text-xs text-muted-foreground">Commandes</p>
                </CardContent>
              </Card>

              {/* Revenue */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Chiffre d'affaires</CardTitle>
                  <CreditCard className="h-4 w-4 text-blue-600 flex-shrink-0" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold break-words overflow-hidden" style={{ 
                    wordBreak: 'break-word', 
                    lineHeight: '1.2',
                    maxWidth: '100%',
                    overflowWrap: 'break-word'
                  }}>
                    {formatCurrency(stats.total_revenue)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Total des ventes</p>
                </CardContent>
              </Card>
            </div>

            {/* Orders Table */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <LoadingSpinner size="lg" />
              </div>
            ) : error ? (
              <EmptyState
                icon={<AlertTriangle className="h-12 w-12" />}
                title="Erreur"
                description={error}
                action={{ label: "Réessayer", onClick: fetchOrders }}
              />
            ) : orders.length === 0 ? (
              <EmptyState
                icon={<ShoppingCart className="h-12 w-12" />}
                title="Aucune commande trouvée"
                description={
                  searchTerm || statusFilter !== "all" || channelFilter !== "all"
                    ? "Essayez d'ajuster vos critères de recherche."
                    : "Aucune commande n'est disponible."
                }
                action={{ 
                  label: "Réinitialiser", 
                  onClick: () => { 
                    setSearchTerm(""); 
                    setStatusFilter("all"); 
                    setChannelFilter("all") 
                  } 
                }}
              />
            ) : (
              <div className="space-y-2">
                {/* Header Row */}
                <div className="hidden md:flex items-center px-4 py-2 bg-gray-50 rounded-t font-semibold text-xs text-gray-500 uppercase tracking-wider">
                  <div className="w-1/6 min-w-[120px]">COMMANDE</div>
                  <div className="w-1/6 min-w-[100px]">CLIENT</div>
                  <div className="w-1/6 min-w-[100px]">STATUT</div>
                  <div className="w-1/6 min-w-[100px]">MONTANT</div>
                  <div className="w-1/6 min-w-[100px]">DATE</div>
                  <div className="w-1/6 min-w-[100px]">CANAL</div>
                  <div className="flex-1 flex justify-end pr-2">ACTIONS</div>
                </div>
                
                {/* Order count and pagination info */}
                {!loading && orders.length > 0 && (
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-sm text-gray-500">
                      {orders.length} commande{orders.length > 1 ? 's' : ''} sur {totalOrders} total
                    </div>
                    <div className="text-sm text-gray-500">
                      Page {page} sur {totalPages}
                    </div>
                  </div>
                )}

                {/* Orders List */}
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="hidden md:flex items-center px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-1/6 min-w-[120px] flex items-center space-x-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <ShoppingCart className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">#{order.order_number}</div>
                        <div className="text-sm text-gray-500">
                          {order.items?.length || 0} article{(order.items?.length || 0) > 1 ? 's' : ''}
                          {order.items && order.items.length > 0 && (
                            <div className="text-xs text-gray-400 mt-1">
                              {groupOrderItems(order.items).map(group => 
                                `${group.totalQuantity} ${group.name}`
                              ).join(', ')}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="w-1/6 min-w-[100px]">
                      <div className="text-sm text-gray-900">
                        {order.user?.first_name && order.user?.last_name 
                          ? `${order.user.first_name} ${order.user.last_name}`
                          : order.guest_name || "Invité"
                        }
                      </div>
                      <div className="text-xs text-gray-500">
                        {order.user?.email || order.guest_email}
                      </div>
                    </div>
                    
                    <div className="w-1/6 min-w-[100px]">
                      <div className="flex items-center gap-2">
                        {getStatusBadge(order.status)}
                        <select
                          className="text-xs border rounded px-2 py-1 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                          value={order.status}
                          onChange={(e) => handleStatusChange(order, e.target.value)}
                          disabled={actionLoading}
                        >
                          <option value="DRAFT">Brouillon</option>
                          <option value="PENDING">En attente</option>
                          <option value="CONFIRMED">Confirmée</option>
                          <option value="PROCESSING">En traitement</option>
                          <option value="COMPLETED">Terminée</option>
                          <option value="CANCELLED">Annulée</option>
                          <option value="REFUNDED">Remboursée</option>
                          <option value="EXPIRED">Expirée</option>
                          <option value="PARTIALLY_FULFILLED">Partiellement traitée</option>
                          <option value="ON_HOLD">En suspens</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="w-1/6 min-w-[100px]">
                      <span className="text-sm font-medium text-gray-900">
                        {formatCurrency(order.total_amount || 0)}
                      </span>
                    </div>
                    
                    <div className="w-1/6 min-w-[100px]">
                      <span className="text-sm text-gray-600">
                        {formatDate(order.created_at)}
                      </span>
                    </div>
                    
                    <div className="w-1/6 min-w-[100px]">
                      <span className="text-sm text-gray-600">
                        {PURCHASE_CHANNEL[order.purchase_channel as keyof typeof PURCHASE_CHANNEL] || order.purchase_channel}
                      </span>
                    </div>
                    
                    <div className="flex-1 flex justify-end space-x-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewOrderDetails(order)}
                              disabled={actionLoading}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Voir les détails</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button size="sm" variant="outline" disabled={actionLoading}>
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-56" align="end">
                          <div className="space-y-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="w-full justify-start"
                              onClick={() => handleViewOrderDetails(order)}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              Voir détails
                            </Button>
                            
                            <Button
                              size="sm"
                              variant="ghost"
                              className="w-full justify-start"
                              onClick={() => handleViewOrderItems(order)}
                            >
                              <List className="mr-2 h-4 w-4" />
                              Voir articles
                            </Button>
                            
                            {order.status === 'PENDING' && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="w-full justify-start text-green-600 hover:text-green-700"
                                onClick={() => handleConfirmOrder(order)}
                                disabled={actionLoading}
                              >
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Confirmer
                              </Button>
                            )}
                            
                            {order.status === 'CONFIRMED' && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="w-full justify-start text-blue-600 hover:text-blue-700"
                                onClick={() => handleGenerateInvoice(order)}
                                disabled={actionLoading}
                              >
                                <FileText className="mr-2 h-4 w-4" />
                                Générer facture
                              </Button>
                            )}
                            
                            {['CONFIRMED', 'PROCESSING'].includes(order.status) && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="w-full justify-start text-orange-600 hover:text-orange-700"
                                onClick={() => handleCancelOrder(order)}
                                disabled={actionLoading}
                              >
                                <X className="mr-2 h-4 w-4" />
                                Annuler
                              </Button>
                            )}
                            
                            {['CONFIRMED', 'COMPLETED'].includes(order.status) && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="w-full justify-start text-red-600 hover:text-red-700"
                                onClick={() => handleRefundOrder(order)}
                                disabled={actionLoading}
                              >
                                <RotateCcw className="mr-2 h-4 w-4" />
                                Rembourser
                              </Button>
                            )}
                            
                            {order.status === 'DRAFT' && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="w-full justify-start text-red-600 hover:text-red-700"
                                onClick={() => handleDeleteOrder(order)}
                                disabled={actionLoading}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Supprimer
                              </Button>
                            )}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                ))}

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center space-x-2 mt-6 pt-4 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(1)}
                      disabled={page === 1}
                    >
                      Première
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                    >
                      Précédent
                    </Button>
                    
                    {/* Page numbers */}
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (page <= 3) {
                          pageNum = i + 1;
                        } else if (page >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = page - 2 + i;
                        }
                        
                        return (
                          <Button
                            key={pageNum}
                            variant={page === pageNum ? "default" : "outline"}
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
                      onClick={() => setPage(page + 1)}
                      disabled={page === totalPages}
                    >
                      Suivant
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(totalPages)}
                      disabled={page === totalPages}
                    >
                      Dernière
                    </Button>
                  </div>
                )}
              </div>
            )}
              </TabsContent>

              <TabsContent value="items" className="space-y-6">
                {/* Order Items Content */}
                {!selectedOrder ? (
                  <EmptyState
                    icon={<ShoppingCart className="h-12 w-12" />}
                    title="Sélectionnez une commande"
                    description="Cliquez sur 'Voir articles' dans le menu d'actions d'une commande pour voir ses articles."
                  />
                ) : itemsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <LoadingSpinner size="lg" />
                  </div>
                ) : itemsError ? (
                  <EmptyState
                    icon={<AlertTriangle className="h-12 w-12" />}
                    title="Erreur"
                    description={itemsError}
                    action={{ label: "Réessayer", onClick: () => fetchOrderItems(selectedOrder.id) }}
                  />
                ) : orderItems.length === 0 ? (
                  <EmptyState
                    icon={<Package className="h-12 w-12" />}
                    title="Aucun article trouvé"
                    description={`Aucun article trouvé pour la commande #${selectedOrder.order_number}.`}
                  />
                ) : (
                  <div className="space-y-4">
                    {/* Selected Order Header */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-blue-900">
                            Articles de la commande #{selectedOrder.order_number}
                          </h3>
                          <p className="text-sm text-blue-700">
                            Client: {selectedOrder.user?.first_name && selectedOrder.user?.last_name 
                              ? `${selectedOrder.user.first_name} ${selectedOrder.user.last_name}`
                              : selectedOrder.guest_name || "Invité"
                            } • 
                            Statut: {ORDER_STATUS[selectedOrder.status as keyof typeof ORDER_STATUS]} • 
                            Total: {formatCurrency(selectedOrder.total_amount || 0)}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedOrder(null)
                            setActiveTab("orders")
                          }}
                        >
                          <X className="h-4 w-4 mr-2" />
                          Fermer
                        </Button>
                      </div>
                    </div>

                    {/* Items count and pagination info */}
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-500">
                        {orderItems.length} article{orderItems.length > 1 ? 's' : ''} trouvé{orderItems.length > 1 ? 's' : ''}
                      </div>
                    </div>

                    {/* Order Items List */}
                    <div className="space-y-2">
                      {orderItems.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">
                              {item.ticket_type?.name || (item as any).subscription_plan?.name || item.item_name || 'Article'}
                            </div>
                            <div className="text-sm text-gray-500">
                              Quantité: {item.quantity} • 
                              Prix unitaire: {formatCurrency(item.unit_price)}
                              {(item.discount_amount || 0) > 0 && (
                                <span className="text-green-600 ml-2">
                                  (Réduction: {formatCurrency(item.discount_amount || 0)})
                                </span>
                              )}
                            </div>
                            {(item as any).event && (
                              <div className="text-xs text-gray-400 mt-1">
                                Événement: {(item as any).event.name}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center space-x-4">
                            <div className="text-right">
                              <div className="font-medium text-gray-900">
                                {formatCurrency(item.total_price)}
                              </div>
                              <div className="text-sm text-gray-500">
                                {ITEM_TYPES[item.item_type as keyof typeof ITEM_TYPES] || item.item_type}
                              </div>
                            </div>
                            
                            {/* Item Actions */}
                            <div className="flex items-center space-x-2">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleEditOrderItem(item)}
                                      disabled={itemActionLoading}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Modifier l'article</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleDeleteOrderItem(item)}
                                      disabled={itemActionLoading}
                                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    >
                                      <Trash className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Supprimer l'article</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>


                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Order Details Modal */}
      <Dialog open={showOrderDetails} onOpenChange={setShowOrderDetails}>
        <DialogContent className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl font-bold">
              <ShoppingCart className="h-6 w-6 text-primary" />
              Détails de la commande #{selectedOrder?.order_number}
            </DialogTitle>
            <DialogDescription className="text-base mt-1 mb-4">
              Commande passée le {selectedOrder && formatDate(selectedOrder.created_at)}
            </DialogDescription>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-6">
              {/* Order Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Informations de la commande</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Numéro de commande</label>
                      <p className="text-sm text-gray-900">#{selectedOrder.order_number}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Statut</label>
                      <div className="mt-1">{getStatusBadge(selectedOrder.status)}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Date de création</label>
                      <p className="text-sm text-gray-900">{formatDate(selectedOrder.created_at)}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Canal d'achat</label>
                      <p className="text-sm text-gray-900">
                        {PURCHASE_CHANNEL[selectedOrder.purchase_channel as keyof typeof PURCHASE_CHANNEL] || selectedOrder.purchase_channel}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Customer Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Informations client</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Nom</label>
                      <p className="text-sm text-gray-900">
                        {selectedOrder.user?.first_name && selectedOrder.user?.last_name 
                          ? `${selectedOrder.user.first_name} ${selectedOrder.user.last_name}`
                          : selectedOrder.guest_name || "N/A"
                        }
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email</label>
                      <p className="text-sm text-gray-900">{selectedOrder.user?.email || selectedOrder.guest_email || "N/A"}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Téléphone</label>
                      <p className="text-sm text-gray-900">{selectedOrder.user?.phone || selectedOrder.guest_phone || "N/A"}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Type de client</label>
                      <p className="text-sm text-gray-900">{selectedOrder.user ? "Utilisateur enregistré" : "Invité"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Order Items */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Articles commandés</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {selectedOrder.items && groupOrderItems(selectedOrder.items).map((group, groupIndex) => (
                      <div key={groupIndex} className="border rounded-lg p-4 bg-gray-50">
                        <div className="flex justify-between items-center mb-2">
                          <div className="font-medium text-gray-900">{group.name}</div>
                          <div className="text-right">
                            <div className="font-medium text-gray-900">{formatCurrency(group.totalPrice)}</div>
                            <div className="text-sm text-gray-500">
                              {group.totalQuantity} × {formatCurrency(group.items[0]?.unit_price || 0)}
                            </div>
                          </div>
                        </div>
                        
                        {/* Show individual items if there are multiple or if they have different prices */}
                        {group.items.length > 1 && (
                          <div className="ml-4 space-y-1">
                            {group.items.map((item, itemIndex) => (
                              <div key={item.id} className="flex justify-between items-center text-sm">
                                <div className="text-gray-600">
                                  {item.quantity} × {formatCurrency(item.unit_price)}
                                  {(item.discount_amount || 0) > 0 && (
                                    <span className="text-green-600 ml-2">
                                      (-{formatCurrency(item.discount_amount || 0)})
                                    </span>
                                  )}
                                </div>
                                <div className="font-medium">{formatCurrency(item.total_price)}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Order Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Récapitulatif</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Sous-total</span>
                      <span>{formatCurrency(selectedOrder.subtotal_amount || 0)}</span>
                    </div>
                    {selectedOrder.discount_amount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Réduction</span>
                        <span>-{formatCurrency(selectedOrder.discount_amount)}</span>
                      </div>
                    )}
                    {(selectedOrder.tax_amount || 0) > 0 && (
                      <div className="flex justify-between">
                        <span>Taxes</span>
                        <span>{formatCurrency(selectedOrder.tax_amount || 0)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Frais de traitement</span>
                      <span>{formatCurrency(selectedOrder.processing_fee || 0)}</span>
                    </div>
                    <div className="border-t pt-2 mt-2">
                      <div className="flex justify-between font-medium text-base">
                        <span>Total</span>
                        <span>{formatCurrency(selectedOrder.total_amount || 0)}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Information */}
              {selectedOrder.payments && selectedOrder.payments.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Informations de paiement</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {selectedOrder.payments.map((payment) => (
                        <div key={payment.id} className="border rounded-lg p-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Méthode de paiement</label>
                              <p className="text-sm text-gray-900">{payment.payment_method?.name || "N/A"}</p>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Montant</label>
                              <p className="text-sm text-gray-900">{formatCurrency(payment.amount)}</p>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Statut</label>
                              <Badge className={STATUS_COLORS[payment.status as keyof typeof STATUS_COLORS] || "bg-gray-100 text-gray-800"}>
                                {payment.status}
                              </Badge>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Date de paiement</label>
                              <p className="text-sm text-gray-900">
                                {payment.payment_date ? formatDate(payment.payment_date) : "N/A"}
                              </p>
                            </div>
                            {payment.transaction_id && (
                              <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700">ID de transaction</label>
                                <p className="text-sm text-gray-900 font-mono">{payment.transaction_id}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Notes */}
              {selectedOrder.notes && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-900">{selectedOrder.notes}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
