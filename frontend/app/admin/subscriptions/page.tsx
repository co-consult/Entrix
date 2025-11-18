"use client";

import { useEffect, useState } from "react";
import { subscriptionsApi } from "@/lib/api/subscriptions";
import { config } from "@/lib/config";
import apiClient from "@/lib/api";
import { Sidebar } from "@/components/layout/sidebar";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Search, 
  Filter, 
  Download, 
  Eye, 
  TrendingUp, 
  Clock, 
  CreditCard, 
  Plus,
  Minus,
  Crown,
  ShoppingCart,
  BarChart3,
  Play,
  Pause,
  User,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Users,
  Star,
  XCircle,
  AlertTriangle,
  UserCheck,
  Receipt,
  QrCode,
  MapPin
} from "lucide-react";
import { CustomCurrencyIcon } from "@/components/ui/custom-currency-icon";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import type { Subscription } from "@/types";
import SubscriptionCreateModal from "@/components/admin/SubscriptionCreateModal";
import SubscriptionSalesModal from "@/components/admin/SubscriptionSalesModal";
import SubscriptionPlanManagementModal from "@/components/admin/SubscriptionPlanManagementModal";
import AdvancedStatsModal from "@/components/admin/AdvancedStatsModal";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { useSession } from "next-auth/react";
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { ProtectedRoute } from "@/components/auth/protected-route";

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [planFilter, setPlanFilter] = useState("all");
  const [vendorFilter, setVendorFilter] = useState("all");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalFilteredCount, setTotalFilteredCount] = useState(0);
  const [stats, setStats] = useState<any>(null);
  const [exportLoading, setExportLoading] = useState(false);
  const [itemsPerPage] = useState(20);
  const [filterOptions, setFilterOptions] = useState<{
    plans: Array<{id: string, name: string}>;
    vendors: Array<{id: string, name: string}>;
    paymentMethods: string[];
  }>({ plans: [], vendors: [], paymentMethods: [] });
  const { toast } = useToast();
  
  // Date range state
  const [dateRange, setDateRange] = useState({ start: "", end: "" });

  // Action states
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [showSalesModal, setShowSalesModal] = useState(false);
  const [showPlanManagementModal, setShowPlanManagementModal] = useState(false);
  const [showAdvancedStatsModal, setShowAdvancedStatsModal] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [showSaleDetails, setShowSaleDetails] = useState(false);
  const [suspensionReason, setSuspensionReason] = useState("");
  const [qrCodeInfo, setQrCodeInfo] = useState<any>(null);
  
  useEffect(() => {
    fetchSubscriptions();
    fetchStats();
  }, [searchTerm, statusFilter, planFilter, vendorFilter, paymentMethodFilter, dateRange, page]);

  useEffect(() => {
    fetchFilterOptions();
  }, []); // Fetch filter options only once on component mount

  const fetchSubscriptions = async () => {
    setLoading(true);
    setError(null);
    try {
      // Build filters object
      const filters: any = {
        page,
        limit: itemsPerPage,
      };
      
      if (searchTerm) filters.query = searchTerm;
      if (statusFilter !== "all") filters.status = statusFilter;
      if (planFilter !== "all") filters.planId = planFilter;
      if (vendorFilter !== "all") filters.vendorId = vendorFilter;
      if (paymentMethodFilter !== "all") filters.paymentMethod = paymentMethodFilter;
      
      // Validate and add date filters only if they are valid dates
      if (dateRange.start && !isNaN(new Date(dateRange.start).getTime())) {
        filters.createdAfter = dateRange.start;
      }
      if (dateRange.end && !isNaN(new Date(dateRange.end).getTime())) {
        filters.createdBefore = dateRange.end;
      }
      
      const response = await subscriptionsApi.getAll(filters);
      
      // Handle paginated response
      if (response && typeof response === 'object' && 'data' in response) {
        const allSubs = Array.isArray(response.data) ? response.data : [];
        setTotalPages(response.totalPages || 1);
        setTotalFilteredCount(response.total || 0);

        // Transform data to fix field name mismatches and handle null/undefined fields robustly
        const transformedSubs = allSubs.map((sub: any) => {
          // Try different possible field names for order number and created by
          const orderNumber =
            (sub.metadata && (sub.metadata.order_number ?? sub.metadata.orderNumber ?? sub.metadata.order_id)) ??
            sub.order_number ??
            sub.orderNumber ??
            null;

          const createdBy =
            (sub.metadata && (sub.metadata.created_by ?? sub.metadata.createdBy ?? sub.metadata.created_by_user)) ??
            sub.created_by ??
            sub.createdBy ??
            null;

          return {
            ...sub,
            // Fix field name: backend returns subscription_plans, frontend expects subscription_plan
            subscription_plan: sub.subscription_plans ?? sub.subscription_plan ?? null,
            // Handle null/undefined dates
            start_date: sub.start_date ?? null,
            end_date: sub.end_date ?? null,
            // Ensure user data is properly structured - backend returns 'users' (plural)
            user: sub.users ?? sub.user ?? null,
            // Include created_by for seller information (from metadata)
            created_by: createdBy,
            // Extract order_number from metadata
            order_number: orderNumber
          };
        });
      
      setSubscriptions(transformedSubs);
    } else {
      // Fallback for non-paginated response
      const allSubs = Array.isArray(response) ? response : [];
      setSubscriptions(allSubs);
      setTotalFilteredCount(allSubs.length);
      setTotalPages(1);
    }
  } catch (err: any) {
      setError("Erreur lors du chargement des abonnements.");
      setSubscriptions([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchFilterOptions = async () => {
    try {
      // Use the dedicated filter options endpoint
      const filterData = await subscriptionsApi.getFilterOptions();
      
      if (filterData && typeof filterData === 'object') {
        setFilterOptions({
          plans: filterData.plans || [],
          vendors: filterData.vendors || [],
          paymentMethods: filterData.paymentMethods || []
        });
      }
    } catch (err) {
      console.error("Failed to fetch filter options:", err);
    }
  };

  const fetchStats = async () => {
    try {
      // Build filters for stats (same as subscriptions but without pagination)
      const filters: any = {};
      
      if (searchTerm) filters.query = searchTerm;
      if (statusFilter !== "all") filters.status = statusFilter;
      if (planFilter !== "all") filters.planId = planFilter;
      if (vendorFilter !== "all") filters.vendorId = vendorFilter;
      if (paymentMethodFilter !== "all") filters.paymentMethod = paymentMethodFilter;
      
      // Validate and add date filters only if they are valid dates
      if (dateRange.start && !isNaN(new Date(dateRange.start).getTime())) {
        filters.createdAfter = dateRange.start;
      }
      if (dateRange.end && !isNaN(new Date(dateRange.end).getTime())) {
        filters.createdBefore = dateRange.end;
      }
      
      // Use the dedicated stats endpoint - now returns pre-calculated stats
      const statsData = await subscriptionsApi.getStats(filters);
      
      // The backend now returns pre-calculated stats object
      if (statsData && typeof statsData === 'object' && 'total_revenue' in statsData) {
        setStats(statsData);
      } else {
        // Fallback for old format
        const subs = Array.isArray(statsData) ? statsData : [];
        
        const now = new Date();
        const totalRevenue = subs.reduce((sum, sub) => {
          // Check if this is a no-price user (sponsor/partner)
          const metadata = sub.metadata as any;
          const isNoPriceUser = metadata?.isNoPriceUser === true;
          
          // Only calculate revenue for non-sponsor/partner users
          if (!isNoPriceUser) {
            const price = parseFloat(sub.price_paid || sub.subscription_plan?.price || 0);
            return sum + price;
          }
          return sum;
        }, 0);
        
        const totalSubscriptions = subs.length;
        const newThisWeek = subs.filter(sub => {
          const createdDate = new Date(sub.created_at);
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return createdDate >= weekAgo;
        }).length;
        
        const avgSubscriptionValue = subs.length > 0 ? (totalRevenue / subs.length).toFixed(0) : 0;
        
        setStats({
          total_revenue: totalRevenue,
          avg_subscription_value: avgSubscriptionValue,
          total_subscriptions: totalSubscriptions,
          new_this_week: newThisWeek
        });
      }
    } catch (err) {
      console.error("Failed to calculate stats:", err);
      setStats({
        total_revenue: 0,
        avg_subscription_value: 0,
        total_subscriptions: 0,
        new_this_week: 0
      });
    }
  };

  const handleExport = async (format: string) => {
    setExportLoading(true)
    try {
      // Build filters for export (same as fetchSubscriptions but without pagination)
      const filters: any = {};
      
      if (searchTerm) filters.query = searchTerm;
      if (statusFilter !== "all") filters.status = statusFilter;
      if (planFilter !== "all") filters.planId = planFilter;
      if (vendorFilter !== "all") filters.vendorId = vendorFilter;
      if (paymentMethodFilter !== "all") filters.paymentMethod = paymentMethodFilter;
      
      // Validate and add date filters only if they are valid dates
      if (dateRange.start && !isNaN(new Date(dateRange.start).getTime())) {
        filters.createdAfter = dateRange.start;
      }
      if (dateRange.end && !isNaN(new Date(dateRange.end).getTime())) {
        filters.createdBefore = dateRange.end;
      }
      
      // Fetch ALL filtered subscriptions (no limit)
      const response = await subscriptionsApi.getAll(filters);
      const allSubs = Array.isArray(response) ? response : (response?.data || []);
      
      // Transform data to fix field name mismatches and handle null dates
      const transformedSubs = allSubs.map((sub: any) => {
        const orderNumber = sub.metadata?.order_number || 
                           sub.metadata?.orderNumber || 
                           sub.order_number || 
                           sub.orderNumber ||
                           sub.metadata?.order_id ||
                           null;
        
        const createdBy = sub.metadata?.created_by || 
                         sub.metadata?.createdBy || 
                         sub.created_by || 
                         sub.createdBy ||
                         sub.metadata?.created_by_user ||
                         null;
        
        return {
          ...sub,
          subscription_plan: sub.subscription_plans || null,
          start_date: sub.start_date || null,
          end_date: sub.end_date || null,
          user: sub.users || sub.user || null,
          created_by: createdBy,
          order_number: orderNumber
        };
      });

      // Export all filtered subscriptions (not just the paginated ones)
      const exportData = transformedSubs.map((sub: any) => ({
        'Utilisateur': sub.user ? `${sub.user.first_name || ''} ${sub.user.last_name || ''}`.trim() || sub.user.email : 'Anonyme',
        'Email': sub.user?.email || 'Aucun email',
        'Plan': sub.subscription_plan?.name || 'Plan inconnu',
        'Statut': sub.status,
        'Prix': `${sub.subscription_plan?.price || 0} TND`,
        'Date de début': sub.start_date ? new Date(sub.start_date).toLocaleDateString('fr-FR') : '',
        'Date de fin': sub.end_date ? new Date(sub.end_date).toLocaleDateString('fr-FR') : '',
        'Créé le': sub.created_at ? new Date(sub.created_at).toLocaleDateString('fr-FR') : '',
        'Dernière mise à jour': sub.updated_at ? new Date(sub.updated_at).toLocaleDateString('fr-FR') : ''
      }));

      // Create Excel file using xlsx library
      const XLSX = await import('xlsx');
      
      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      
      // Set column widths for better formatting
      const columnWidths = [
        { wch: 25 }, // Utilisateur
        { wch: 30 }, // Email
        { wch: 20 }, // Plan
        { wch: 12 }, // Statut
        { wch: 15 }, // Prix
        { wch: 12 }, // Date de début
        { wch: 12 }, // Date de fin
        { wch: 12 }, // Créé le
        { wch: 15 }, // Dernière mise à jour
      ];
      worksheet['!cols'] = columnWidths;
      
      // Create a descriptive sheet name
      let sheetName = 'Abonnements';
      
      // Add the worksheet to the workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
      
      // Generate the Excel file
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      
      // Create a descriptive filename based on current filters
      let filename = `abonnements-${new Date().toISOString().split('T')[0]}`;
      if (searchTerm) {
        filename += `-recherche-${searchTerm}`;
      }
      if (statusFilter !== 'all') {
        filename += `-statut-${statusFilter}`;
      }
      if (planFilter !== 'all') {
        filename += `-plan-${planFilter}`;
      }
      if (dateRange.start || dateRange.end) {
        filename += `-dates-${dateRange.start || 'debut'}-${dateRange.end || 'fin'}`;
      }
      filename += '.xlsx';
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      // Create a descriptive success message
      let message = `${exportData.length} abonnement${exportData.length > 1 ? 's' : ''} exporté${exportData.length > 1 ? 's' : ''}`;
      if (searchTerm || statusFilter !== 'all' || planFilter !== 'all' || dateRange.start || dateRange.end) {
        message += ' avec filtres appliqués';
      }
      message += ' en fichier Excel';
      
      toast({
        title: "Export réussi",
        description: message
      });
    } catch (err: any) {
      console.error('Export error:', err);
      toast({
        title: "Erreur d'export",
        description: "Impossible d'exporter les abonnements",
        variant: "destructive"
      });
    } finally {
      setExportLoading(false);
    }
  }

  const handleView = async (subscription: Subscription) => {
    setSelectedSubscription(subscription);
    setShowViewModal(true);
    
    // Fetch QR code information
    try {
      const qrCodeResponse = await subscriptionsApi.getSubscriptionQRCodeInfo(subscription.id);
      console.log("QR Code Response:", qrCodeResponse); // Debug log
      setQrCodeInfo(qrCodeResponse?.data || qrCodeResponse || null);
    } catch (error) {
      console.error("Error fetching QR code info:", error);
      setQrCodeInfo(null);
    }
  };

  const handleActivate = async (subscription: Subscription) => {
    setActionLoading(true);
    try {
      await subscriptionsApi.activateSubscription(subscription.id);
      
      toast({
        title: "Abonnement activé",
        description: "L'abonnement a été activé avec succès"
      });
      
      fetchSubscriptions();
      fetchStats(); // Refresh stats when subscription is activated
    } catch (err: any) {
      toast({
        title: "Erreur",
        description: "Impossible d'activer l'abonnement",
        variant: "destructive"
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeactivate = (subscription: Subscription) => {
    setSelectedSubscription(subscription);
    setShowDeactivateModal(true);
  };

  const confirmDeactivate = async () => {
    if (!selectedSubscription) return;
    setActionLoading(true);
    try {
      await subscriptionsApi.deactivateSubscription(selectedSubscription.id, suspensionReason);
      toast({
        title: "Abonnement désactivé",
        description: "L'abonnement a été désactivé avec succès"
      });
      setShowDeactivateModal(false);
      setSelectedSubscription(null);
      setSuspensionReason(""); // Reset suspension reason
      fetchSubscriptions();
      fetchStats(); // Refresh stats when subscription is deactivated
    } catch (err: any) {
      toast({
        title: "Erreur",
        description: "Impossible de désactiver l'abonnement",
        variant: "destructive"
      });
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      ACTIVE: "bg-green-100 text-green-800",
      SUSPENDED: "bg-yellow-100 text-yellow-800",
      EXPIRED: "bg-red-100 text-red-800",
      CANCELLED: "bg-gray-100 text-gray-800"
    };
    const labels = {
      ACTIVE: "Actif",
      SUSPENDED: "Suspendu",
      EXPIRED: "Expiré",
      CANCELLED: "Annulé"
    };
    return (
      <Badge className={`rounded-full px-3 py-1 text-xs font-semibold ${colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800"}`}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    );
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      // Check if date is valid (not NaN)
      if (isNaN(date.getTime())) return "-";
      return date.toLocaleDateString("fr-FR");
    } catch (error) {
      return "-";
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("fr-FR");
  };

  // Helper function to get seller information from metadata
  const getSellerInfo = (subscription: Subscription) => {
    // Use the sellerInfo field provided by the backend
    if (subscription.sellerInfo) {
      return {
        name: subscription.sellerInfo.name || 'Vendeur système',
        email: subscription.sellerInfo.email || 'N/A',
        id: subscription.sellerInfo.id || 'N/A'
      };
    }
    
    // Fallback to metadata if sellerInfo is not available
    const metadata = subscription.metadata;
    if (metadata) {
      const sellerName = metadata.sellerName || metadata.seller_name || metadata.createdBy || metadata.created_by;
      const sellerEmail = metadata.sellerEmail || metadata.seller_email;
      const sellerId = metadata.sellerId || metadata.seller_id;
      
      if (sellerName || sellerEmail || sellerId) {
        return {
          name: sellerName || 'Vendeur système',
          email: sellerEmail || 'N/A',
          id: sellerId || 'N/A'
        };
      }
    }
    
    // If no seller info found, return system seller
    return {
      name: 'Vendeur système',
      email: 'N/A',
      id: 'N/A'
    };
  };

  // Helper function to get payment method from metadata
  // Helper function to get French payment method labels
  const getPaymentMethodLabel = (method: string) => {
    const methodLabels: { [key: string]: string } = {
      'CASH': 'Espèces',
      'CARD': 'Carte bancaire',
      'FLOUCI': 'Flouci',
      'BANK_TRANSFER': 'Virement bancaire',
      'SOCIOS': 'Socios',
      'CHEQUE': 'Chèque',
      'NO_FEE': 'Aucun frais',
    };
    
    return methodLabels[method] || method;
  };

  const getPaymentMethod = (subscription: Subscription) => {
    const metadata = subscription.metadata;
    if (!metadata) return null;
    
    const method = metadata.paymentMethod || metadata.payment_method || metadata.paymentDetails?.method;
    if (!method) return null;
    
    return getPaymentMethodLabel(method);
  };



  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar type="admin" />
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="px-8 w-full">
          <PageHeader
            title="Abonnements"
            description="Gérez et créez des abonnements pour les utilisateurs."
          >
            <div className="flex gap-2">
              <Button 
                variant="outline"
                onClick={() => {
                  fetchSubscriptions();
                  fetchStats();
                  toast({ 
                    title: "Données actualisées", 
                    description: "Les données ont été rechargées" 
                  });
                }}
                className="flex items-center gap-2"
              >
                <TrendingUp className="h-4 w-4" />
                Actualiser
              </Button>
              <Button 
                onClick={() => setShowAdvancedStatsModal(true)}
                variant="outline"
                className="flex items-center gap-2"
              >
                <BarChart3 className="h-4 w-4" />
                Statistiques Avancées
              </Button>
              <Button 
                onClick={() => setShowPlanManagementModal(true)}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Crown className="h-4 w-4" />
                Types d'abonnements
              </Button>
              <Button variant="default" onClick={() => setShowSalesModal(true)}>
                <ShoppingCart className="mr-2 h-4 w-4" />
                Vente d'abonnement
              </Button>
            </div>
          </PageHeader>

          {showPlanManagementModal && (
            <SubscriptionPlanManagementModal
              isOpen={showPlanManagementModal}
              onClose={() => setShowPlanManagementModal(false)}
              onSuccess={() => {
                fetchSubscriptions();
                toast({
                  title: "Types mis à jour",
                  description: "Les types d'abonnement ont été mis à jour avec succès",
                  variant: "default"
                });
              }}
              organizerId={config.organizer.getOrganizerId()}
            />
          )}

          {showSalesModal && (
            <SubscriptionSalesModal 
              open={showSalesModal} 
              onOpenChange={setShowSalesModal} 
              onSuccess={() => {
                fetchSubscriptions();
                fetchStats(); // Refresh stats when new subscription is created
                toast({
                  title: "Vente créée",
                  description: "La vente d'abonnement a été créée avec succès",
                  variant: "default"
                });
              }} 
            />
          )}

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card className="shadow-sm hover:shadow-md transition-shadow duration-200">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Valeur moyenne</CardTitle>
                <TrendingUp className="h-5 w-5 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats ? `${stats.avg_subscription_value} TND` : <span className="inline-block h-6 w-16 bg-gray-200 rounded animate-pulse" />}
                </div>
                <div className="text-xs text-gray-600">par abonnement</div>
              </CardContent>
            </Card>
            
            <Card className="shadow-sm hover:shadow-md transition-shadow duration-200">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Abonnements</CardTitle>
                <CreditCard className="h-5 w-5 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats ? stats.total_subscriptions : <span className="inline-block h-6 w-16 bg-gray-200 rounded animate-pulse" />}
                </div>
                <div className="text-xs text-gray-600">tous les abonnements</div>
              </CardContent>
            </Card>
            
            <Card className="shadow-sm hover:shadow-md transition-shadow duration-200">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Revenus totaux</CardTitle>
                <CustomCurrencyIcon className="h-5 w-5 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats ? `${stats.total_revenue.toLocaleString()} TND` : <span className="inline-block h-6 w-16 bg-gray-200 rounded animate-pulse" />}
                </div>
                <div className="text-xs text-gray-600">tous les temps</div>
              </CardContent>
            </Card>
            
            <Card className="shadow-sm hover:shadow-md transition-shadow duration-200">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Nouveaux cette semaine</CardTitle>
                <Plus className="h-5 w-5 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats ? stats.new_this_week : <span className="inline-block h-6 w-16 bg-gray-200 rounded animate-pulse" />}
                </div>
                <div className="text-xs text-gray-600">abonnements</div>
              </CardContent>
            </Card>
          </div>



          {/* Search and Filters */}
          <div className="space-y-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Input
                  className="pl-10 pr-4 py-2 rounded-full border border-gray-300 shadow-sm focus:ring-2 focus:ring-primary focus:border-primary transition-all text-base"
                  placeholder="Rechercher par supporter, plan ou email..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  style={{ boxShadow: 'none' }}
                />
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                  <Search className="h-5 w-5" />
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                  setPlanFilter("all");
                  setVendorFilter("all");
                  setPaymentMethodFilter("all");
                  setDateRange({ start: "", end: "" });
                  setPage(1);
                }}
                className="text-xs"
              >
                Réinitialiser
              </Button>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              {/* Statut */}
              <select
                className="appearance-none rounded-full border px-4 py-2 text-sm bg-white shadow-sm focus:ring-primary focus:border-primary transition-all pr-10"
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                style={{
                  backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'20\' height=\'20\' viewBox=\'0 0 20 20\' fill=\'none\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M6 8L10 12L14 8\' stroke=\'%239CA3AF\' stroke-width=\'1.5\' stroke-linecap=\'round\' stroke-linejoin=\'round\'/%3E%3C/svg%3E")',
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 0.75rem center',
                  backgroundSize: '1.25rem 1.25rem',
                  minWidth: 160,
                }}
              >
                <option value="all">Tous les statuts</option>
                <option value="ACTIVE">Actif</option>
                <option value="SUSPENDED">Suspendu</option>
                <option value="EXPIRED">Expiré</option>
                <option value="CANCELLED">Annulé</option>
              </select>
              
              {/* Plan Filter */}
              <select
                className="appearance-none rounded-full border px-4 py-2 text-sm bg-white shadow-sm focus:ring-primary focus:border-primary transition-all pr-10"
                value={planFilter}
                onChange={e => setPlanFilter(e.target.value)}
                style={{
                  backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'20\' height=\'20\' viewBox=\'0 0 20 20\' fill=\'none\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M6 8L10 12L14 8\' stroke=\'%239CA3AF\' stroke-width=\'1.5\' stroke-linecap=\'round\' stroke-linejoin=\'round\'/%3E%3C/svg%3E")',
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 0.75rem center',
                  backgroundSize: '1.25rem 1.25rem',
                  minWidth: 180,
                }}
              >
                <option value="all">Tous les plans</option>
                {filterOptions.plans.map(plan => (
                  <option key={plan.id} value={plan.id}>
                    {plan.name}
                  </option>
                ))}
              </select>
              
              {/* Vendor Filter */}
              <select
                className="appearance-none rounded-full border px-4 py-2 text-sm bg-white shadow-sm focus:ring-primary focus:border-primary transition-all pr-10"
                value={vendorFilter}
                onChange={e => setVendorFilter(e.target.value)}
                style={{
                  backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'20\' height=\'20\' viewBox=\'0 0 20 20\' fill=\'none\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M6 8L10 12L14 8\' stroke=\'%239CA3AF\' stroke-width=\'1.5\' stroke-linecap=\'round\' stroke-linejoin=\'round\'/%3E%3C/svg%3E")',
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 0.75rem center',
                  backgroundSize: '1.25rem 1.25rem',
                  minWidth: 160,
                }}
              >
                <option value="all">Tous les vendeurs</option>
                {filterOptions.vendors.map(vendor => (
                  <option key={vendor.id} value={vendor.id}>
                    {vendor.name || `${vendor.first_name || ''} ${vendor.last_name || ''}`.trim() || vendor.email}
                  </option>
                ))}
              </select>
              
              {/* Payment Method Filter */}
              <select
                className="appearance-none rounded-full border px-4 py-2 text-sm bg-white shadow-sm focus:ring-primary focus:border-primary transition-all pr-10"
                value={paymentMethodFilter}
                onChange={e => setPaymentMethodFilter(e.target.value)}
                style={{
                  backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'20\' height=\'20\' viewBox=\'0 0 20 20\' fill=\'none\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M6 8L10 12L14 8\' stroke=\'%239CA3AF\' stroke-width=\'1.5\' stroke-linecap=\'round\' stroke-linejoin=\'round\'/%3E%3C/svg%3E")',
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 0.75rem center',
                  backgroundSize: '1.25rem 1.25rem',
                  minWidth: 160,
                }}
              >
                <option value="all">Toutes les méthodes</option>
                {filterOptions.paymentMethods.map(paymentMethod => (
                  <option key={paymentMethod} value={paymentMethod}>
                    {getPaymentMethodLabel(paymentMethod)}
                  </option>
                ))}
              </select>
              
              {/* Date Range Filters */}
              <div className="flex items-center gap-2">
                <DatePicker
                  selected={dateRange.start ? new Date(dateRange.start) : undefined}
                  onChange={date => setDateRange(prev => ({ ...prev, start: date ? date.toISOString().slice(0, 10) : '' }))}
                  selectsStart
                  startDate={dateRange.start ? new Date(dateRange.start) : undefined}
                  endDate={dateRange.end ? new Date(dateRange.end) : undefined}
                  dateFormat="yyyy-MM-dd"
                  placeholderText="Date début"
                  className="text-sm border border-gray-300 rounded-full px-3 py-2"
                  isClearable
                />
                <span className="text-gray-400">à</span>
                <DatePicker
                  selected={dateRange.end ? new Date(dateRange.end) : undefined}
                  onChange={date => setDateRange(prev => ({ ...prev, end: date ? date.toISOString().slice(0, 10) : '' }))}
                  selectsEnd
                  startDate={dateRange.start ? new Date(dateRange.start) : undefined}
                  endDate={dateRange.end ? new Date(dateRange.end) : undefined}
                  minDate={dateRange.start ? new Date(dateRange.start) : undefined}
                  dateFormat="yyyy-MM-dd"
                  placeholderText="Date fin"
                  className="text-sm border border-gray-300 rounded-full px-3 py-2"
                  isClearable
                />
              </div>
              
              {/* Export Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport('xlsx')}
                disabled={exportLoading}
                className="text-xs"
              >
                {exportLoading ? (
                  <LoadingSpinner size="sm" className="mr-2" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                Exporter
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto">
            {loading ? (
              <div className="flex flex-col gap-2 min-h-[300px]">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="animate-pulse flex items-center bg-white rounded-xl shadow px-4 py-3 gap-4">
                    <div className="w-10 h-10 rounded-full bg-gray-200" />
                    <div className="flex-1 h-4 bg-gray-200 rounded" />
                    <div className="w-24 h-4 bg-gray-200 rounded" />
                    <div className="w-16 h-4 bg-gray-200 rounded" />
                    <div className="w-24 h-4 bg-gray-200 rounded" />
                    <div className="w-24 h-4 bg-gray-200 rounded" />
                    <div className="w-8 h-8 bg-gray-200 rounded-full" />
                  </div>
                ))}
              </div>
            ) : error ? (
              <EmptyState
                icon={<Search className="h-12 w-12" />}
                title="Erreur"
                description={error}
                action={{ label: "Réessayer", onClick: fetchSubscriptions }}
              />
            ) : subscriptions.length === 0 ? (
              <EmptyState
                icon={<Search className="h-12 w-12" />}
                title="Aucun abonnement trouvé"
                description={
                  searchTerm || statusFilter !== "all"
                    ? "Essayez d'ajuster vos critères de recherche."
                    : "Aucun abonnement n'est disponible."
                }
                action={{ label: "Réinitialiser", onClick: () => { setSearchTerm(""); setStatusFilter("all"); setPlanFilter("all"); setVendorFilter("all"); setPaymentMethodFilter("all"); setDateRange({ start: "", end: "" }); setPage(1); } }}
              />
            ) : (
              <div className="space-y-2">
                {/* Header Row */}
                <div className="hidden md:grid grid-cols-[1.5fr_1fr_0.8fr_1fr_1fr_1.2fr_180px] lg:grid-cols-[1.5fr_1fr_0.8fr_1fr_1fr_1.2fr_180px] md:grid-cols-[1.2fr_0.8fr_0.6fr_0.8fr_0.8fr_1fr_140px] sm:grid-cols-[1fr_0.6fr_0.5fr_0.6fr_0.6fr_0.8fr_120px] items-center px-4 py-2 bg-gray-50 rounded-t font-semibold text-xs text-gray-500 uppercase tracking-wider">
                  <div>Supporter</div>
                  <div>Plan</div>
                  <div>Statut</div>
                  <div>Vendeur</div>
                  <div>Paiement</div>
                  <div>Créé le</div>
                  <div className="text-right pr-2">Actions</div>
                </div>
                
                {subscriptions.map((sub) => (
                  <div
                    key={sub.id}
                    className="grid grid-cols-[1.5fr_1fr_0.8fr_1fr_1fr_1.2fr_180px] lg:grid-cols-[1.5fr_1fr_0.8fr_1fr_1fr_1.2fr_180px] md:grid-cols-[1.2fr_0.8fr_0.6fr_0.8fr_0.8fr_1fr_140px] sm:grid-cols-[1fr_0.6fr_0.5fr_0.6fr_0.6fr_0.8fr_120px] items-center bg-white rounded-xl shadow-sm px-4 py-3 group hover:bg-gray-50 border-b last:border-b-0 relative"
                  >
                    {/* User */}
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-lg font-bold text-blue-700">
                        <User className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-gray-900 truncate max-w-[160px] md:max-w-[140px] sm:max-w-[120px] text-sm sm:text-xs" title={`${sub.user?.first_name || 'Anonyme'} ${sub.user?.last_name || ''}`}>
                          {sub.user?.first_name && sub.user?.last_name 
                            ? `${sub.user.first_name} ${sub.user.last_name}`
                            : sub.user?.first_name || sub.user?.email || 'Utilisateur anonyme'
                          }
                        </div>
                        <div className="text-xs text-gray-500 truncate max-w-[140px] md:max-w-[120px] sm:max-w-[100px]" title={sub.user?.email || 'Aucun email'}>
                          {sub.user?.email || 'Aucun email'}
                        </div>
                        {(sub.user?.metadata?.isNoPriceUser || sub.metadata?.isNoPriceUser) && (
                          <Badge className="mt-1 bg-yellow-100 text-yellow-800 border-yellow-300 text-xs font-medium">
                            {(sub.user?.metadata?.sponsorType || sub.metadata?.sponsorType) === 'SPONSOR' ? 'Sponsor' : 'Partenaire'} - 0 frais
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    {/* Plan */}
                    <div className="font-medium text-gray-900">
                      {sub.subscription_plan?.name || "N/A"}
                    </div>
                    
                    {/* Status */}
                    <div>
                      {getStatusBadge(sub.status)}
                    </div>
                    
                    {/* Seller */}
                    <div className="min-w-0">
                      {(() => {
                        const sellerInfo = getSellerInfo(sub);
                        return sellerInfo ? (
                          <div className="flex items-center gap-2">
                            <UserCheck className="h-4 w-4 text-green-600" />
                            <div>
                              <div className="font-medium text-gray-900 truncate max-w-[100px]" title={sellerInfo.name}>
                                {sellerInfo.name}
                              </div>
                              <div className="text-xs text-gray-500 truncate max-w-[100px]" title={sellerInfo.email}>
                                {sellerInfo.email}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm text-gray-500">-</div>
                        );
                      })()}
                    </div>
                    
                    {/* Payment Method */}
                    <div className="min-w-0">
                      {(() => {
                        const paymentMethod = getPaymentMethod(sub);
                        
                        const paymentContent = (
                          <div className="flex items-center gap-2">
                            <Receipt className="h-4 w-4 text-blue-600" />
                            <div>
                              <div className="font-medium text-gray-900 truncate max-w-[100px]" title={paymentMethod || 'N/A'}>
                                {paymentMethod || '-'}
                              </div>

                            </div>
                          </div>
                        );

                        // Always show tooltip with payment method and price
                        return (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="cursor-help">
                                  {paymentContent}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs">
                                <div className="space-y-2">
                                  <div>
                                    <span className="font-medium">Méthode:</span>
                                    <div className="text-sm">{paymentMethod}</div>
                                  </div>
                                  <div>
                                    <span className="font-medium">Prix:</span>
                                    <div className="text-sm font-semibold text-green-600">
                                      {sub.price_paid} {sub.currency}
                                    </div>
                                  </div>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        );

                        return paymentContent;
                      })()}
                    </div>
                    
                    {/* Created At */}
                    <div className="flex items-center gap-1 text-sm text-gray-700">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      {sub.created_at ? formatDate(sub.created_at) : "-"}
                    </div>
                    
                    {/* Actions */}
                    <div className="flex justify-end gap-1">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="rounded-full"
                        onClick={() => handleView(sub)}
                        title="Voir les détails"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      

                      
                      {sub.status === "ACTIVE" ? (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="rounded-full text-yellow-600 hover:text-yellow-700"
                          onClick={() => handleDeactivate(sub)}
                          title="Désactiver"
                          disabled={actionLoading}
                        >
                          <Clock className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="rounded-full text-green-600 hover:text-green-700"
                          onClick={() => handleActivate(sub)}
                          title="Activer"
                          disabled={actionLoading}
                        >
                          <TrendingUp className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pagination */}
          {!loading && !error && subscriptions.length > 0 && (
            <div className="flex items-center justify-between mt-6 px-4 py-3 bg-white rounded-lg shadow-sm border">
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span>
                  Affichage de <span className="font-semibold">{(page - 1) * itemsPerPage + 1}</span> à{' '}
                  <span className="font-semibold">
                    {Math.min(page * itemsPerPage, totalFilteredCount)}
                  </span>{' '}
                  sur <span className="font-semibold">{totalFilteredCount}</span> abonnements
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

          {/* View Modal */}
          {showViewModal && selectedSubscription && (
            <Dialog open onOpenChange={() => setShowViewModal(false)}>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Détails de l'abonnement: {selectedSubscription.subscription_plan?.name}
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                  {/* Header Info */}
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h2 className="text-2xl font-bold mb-2">{selectedSubscription.user?.first_name} {selectedSubscription.user?.last_name}</h2>
                          <div className="flex items-center gap-2 mb-2">
                            {getStatusBadge(selectedSubscription.status)}
                            <Badge variant="outline">{selectedSubscription.subscription_plan?.type || 'STANDARD'}</Badge>
                            <Badge variant="secondary">{selectedSubscription.subscription_number}</Badge>
                          </div>
                          <p className="text-gray-600">{selectedSubscription.user?.email}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-3xl font-bold text-green-600">
                            {selectedSubscription.price_paid} {selectedSubscription.currency}
                          </div>
                          <div className="text-sm text-gray-500">prix payé</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-blue-600" />
                          <div>
                            <p className="text-sm font-medium text-gray-600">Membre depuis</p>
                            <p className="text-lg font-bold">{selectedSubscription.user?.created_at ? formatDate(selectedSubscription.user.created_at) : (selectedSubscription.created_at ? formatDate(selectedSubscription.created_at) : 'N/A')}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-green-600" />
                          <div>
                            <p className="text-sm font-medium text-gray-600">Durée</p>
                            <p className="text-lg font-bold">
                              {selectedSubscription.subscription_plan?.duration || 
                               selectedSubscription.subscription_plan?.duration_days || 
                               (selectedSubscription.start_date && selectedSubscription.end_date ? 
                                 Math.ceil((new Date(selectedSubscription.end_date).getTime() - new Date(selectedSubscription.start_date).getTime()) / (1000 * 60 * 60 * 24)) : 
                                 'N/A')} jours
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-2">
                          <CreditCard className="h-4 w-4 text-green-600" />
                          <div>
                            <p className="text-sm font-medium text-gray-600">Renouvellement</p>
                            <p className="text-lg font-bold">{selectedSubscription.auto_renew ? 'Activé' : 'Désactivé'}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Basic Information */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Eye className="h-5 w-5" />
                          Informations Générales
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium text-gray-600">Plan:</span>
                            <p>{selectedSubscription.subscription_plan?.name}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-600">Type:</span>
                            <p>{selectedSubscription.subscription_plan?.type || 'STANDARD'}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-600">Prix:</span>
                            <p>{selectedSubscription.price_paid} {selectedSubscription.currency}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-600">Numéro:</span>
                            <p>{selectedSubscription.subscription_number}</p>
                          </div>
                        </div>


                      </CardContent>
                    </Card>

                    {/* Dates */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Calendar className="h-5 w-5" />
                          Périodes
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-3 text-sm">
                          <div>
                            <span className="font-medium text-gray-600">Validité:</span>
                            <p>{selectedSubscription.start_date ? formatDate(selectedSubscription.start_date) : 'N/A'} - {selectedSubscription.end_date ? formatDate(selectedSubscription.end_date) : 'N/A'}</p>
                          </div>
                          
                          <div>
                            <span className="font-medium text-gray-600">Créé le:</span>
                            <p>{selectedSubscription.created_at ? formatDateTime(selectedSubscription.created_at) : 'N/A'}</p>
                          </div>
                          
                          <div>
                            <span className="font-medium text-gray-600">Dernière modification:</span>
                            <p>{selectedSubscription.updated_at ? formatDateTime(selectedSubscription.updated_at) : 'N/A'}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Sale Information */}
                  {selectedSubscription.metadata && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <UserCheck className="h-5 w-5" />
                          Informations de Vente
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {getSellerInfo(selectedSubscription) && (
                            <div className="border rounded-lg p-3">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-medium">Vendeur</h4>
                                <Badge variant="outline">Vente</Badge>
                              </div>
                              <div className="space-y-1 text-sm text-gray-600">
                                <p>Nom: {getSellerInfo(selectedSubscription)?.name}</p>
                                <p>Email: {getSellerInfo(selectedSubscription)?.email}</p>
                              </div>
                            </div>
                          )}
                          
                          {/* Expandable Sale Details */}
                          <div className="border rounded-lg">
                            <button
                              onClick={() => setShowSaleDetails(!showSaleDetails)}
                              className="w-full p-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                            >
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium">Détails de Vente</h4>
                                <Badge variant="outline">Finance</Badge>
                              </div>
                              {showSaleDetails ? (
                                <Minus className="h-4 w-4 text-gray-500" />
                              ) : (
                                <Plus className="h-4 w-4 text-gray-500" />
                              )}
                            </button>
                            
                            {showSaleDetails && (
                              <div className="px-3 pb-3 space-y-4">
                                {/* Payment Method */}
                                <div className="space-y-2">
                                  <h5 className="font-medium text-sm text-gray-700">Méthode de Paiement</h5>
                                  <div className="flex items-center gap-2">
                                    <div className="text-sm text-gray-600">
                                      {getPaymentMethod(selectedSubscription) || 'Non spécifiée'}
                                    </div>

                                  </div>
                                </div>
                                
                                {/* Amount */}
                                <div className="space-y-2">
                                  <h5 className="font-medium text-sm text-gray-700">Montant</h5>
                                  <div className="space-y-1">
                                    <div className="text-sm font-semibold text-green-600">
                                      {selectedSubscription.price_paid} {selectedSubscription.currency}
                                    </div>

                                  </div>
                                </div>
                                
                                {/* Note */}
                                {(selectedSubscription.metadata?.note || selectedSubscription.metadata?.paymentDetails?.note) && (
                                  <div className="space-y-2">
                                    <h5 className="font-medium text-sm text-gray-700">Note</h5>
                                    <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                                      {selectedSubscription.metadata?.note || selectedSubscription.metadata?.paymentDetails?.note}
                                    </div>
                                  </div>
                                )}
                                
                                {/* Transaction Number */}
                                {selectedSubscription.metadata?.paymentDetails?.transactionNumber && (
                                  <div className="space-y-2">
                                    <h5 className="font-medium text-sm text-gray-700">Numéro de Transaction</h5>
                                    <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md font-mono">
                                      {selectedSubscription.metadata.paymentDetails.transactionNumber}
                                    </div>
                                  </div>
                                )}
                                
                                {/* Check Number */}
                                {selectedSubscription.metadata?.paymentDetails?.checkNumber && (
                                  <div className="space-y-2">
                                    <h5 className="font-medium text-sm text-gray-700">Numéro de Chèque</h5>
                                    <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md font-mono">
                                      {selectedSubscription.metadata.paymentDetails.checkNumber}
                                    </div>
                                  </div>
                                )}
                                
                                {/* Socios Note */}
                                {selectedSubscription.metadata?.paymentDetails?.sociosNote && (
                                  <div className="space-y-2">
                                    <h5 className="font-medium text-sm text-gray-700">Note Socios</h5>
                                    <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                                      {selectedSubscription.metadata.paymentDetails.sociosNote}
                                    </div>
                                  </div>
                                )}
                                
                                {/* Socios Number */}
                                {selectedSubscription.metadata?.paymentDetails?.sociosNumber && (
                                  <div className="space-y-2">
                                    <h5 className="font-medium text-sm text-gray-700">Numéro Socios</h5>
                                    <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md font-mono">
                                      {selectedSubscription.metadata.paymentDetails.sociosNumber}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                          

                          
                          {(selectedSubscription.metadata?.saleMode || selectedSubscription.metadata?.saleChannel) && (
                            <div className="border rounded-lg p-3">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-medium">Détails</h4>
                                <Badge variant="outline">Info</Badge>
                              </div>
                              <div className="space-y-1 text-sm text-gray-600">
                                {selectedSubscription.metadata?.saleMode && (
                                  <p>Mode: {selectedSubscription.metadata.saleMode === 'IDENTIFIED' ? 'Identifié' : 'Anonyme'}</p>
                                )}
                                {selectedSubscription.metadata?.saleChannel && (
                                  <p>Canal: {selectedSubscription.metadata.saleChannel === 'PHYSICAL' ? 'Physique' : 'En ligne'}</p>
                                )}

                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* QR Code Information */}
                  {qrCodeInfo && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <QrCode className="h-5 w-5" />
                          Informations QR Code
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Code QR</p>
                            <p className="font-mono font-medium">{qrCodeInfo.qr_code.code}</p>
                          </div>
                          {qrCodeInfo.qr_code.serial_number && (
                            <div>
                              <p className="text-muted-foreground">Numéro de série</p>
                              <p className="font-mono font-medium">{qrCodeInfo.qr_code.serial_number}</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowViewModal(false)}>
                    Fermer
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}

          {/* Deactivate Confirmation Modal */}
          {showDeactivateModal && selectedSubscription && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 border-t-4 border-yellow-500 shadow-xl">
                <div className="flex items-center gap-3 mb-4">
                  <Clock className="h-7 w-7 text-yellow-500" />
                  <h3 className="text-lg font-bold text-yellow-700">Confirmer la désactivation</h3>
                </div>
                <p className="text-sm text-gray-700 mb-2">
                  Êtes-vous sûr de vouloir désactiver l'abonnement de <span className="font-semibold text-gray-900">{selectedSubscription.user?.first_name} {selectedSubscription.user?.last_name}</span> ?
                </p>
                <p className="text-sm font-semibold text-yellow-700 mb-4 flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-yellow-500" />
                  L'utilisateur ne pourra plus accéder aux événements liés à cet abonnement.
                </p>
                <div className="mb-4">
                  <Label htmlFor="suspensionReason" className="text-sm font-medium text-gray-700">
                    Raison de la suspension (optionnel)
                  </Label>
                  <Textarea
                    id="suspensionReason"
                    value={suspensionReason}
                    onChange={(e) => setSuspensionReason(e.target.value)}
                    placeholder="Ex: Paiement en retard, comportement inapproprié, demande de l'utilisateur..."
                    className="mt-1"
                    rows={3}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setShowDeactivateModal(false);
                      setSuspensionReason(""); // Reset suspension reason
                    }}
                    disabled={actionLoading}
                    className="border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    Annuler
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={confirmDeactivate}
                    disabled={actionLoading}
                    className="bg-gradient-to-r from-yellow-500 to-yellow-700 hover:from-yellow-600 hover:to-yellow-800 text-white font-semibold px-6"
                  >
                    {actionLoading ? <LoadingSpinner size="sm" className="mr-2" /> : <Clock className="mr-2 h-4 w-4" />}
                    Désactiver
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Advanced Stats Modal */}
          {showAdvancedStatsModal && (
            <AdvancedStatsModal 
              open={showAdvancedStatsModal} 
              onOpenChange={setShowAdvancedStatsModal}
            />
          )}
        </div>
      </div>
    </div>
  );
}