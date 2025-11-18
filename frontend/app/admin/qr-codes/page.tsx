"use client";

// Force dynamic rendering to avoid static generation issues
export const dynamic = 'force-dynamic';

import { useEffect, useState } from "react";
import { qrCodesApi } from "@/lib/api/qr-codes";
import { Sidebar } from "@/components/layout/sidebar";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { 
  Search, 
  Filter, 
  Download, 
  Eye, 
  QrCode, 
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
  MapPin,
  Hash,
  CheckCircle,
  X,
  Edit,
  Trash2,
  Copy,
  RefreshCw,
  Settings,
  FileText,
  Zap,
  Building,
  DoorOpen,
  List,
  Grid,
  CheckSquare,
  Square
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { QRCodeType, QRCodeStatus } from "@/types";
import type { QRCode, QRCodeStats, SubscriptionPlan } from "@/types";
import { subscriptionsApi } from "@/lib/api/subscriptions";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";



export default function QRCodesPage() {
  const [qrCodes, setQRCodes] = useState<QRCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<QRCodeStatus | "all">("all");
  const [subscriptionPlanFilter, setSubscriptionPlanFilter] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [stats, setStats] = useState<QRCodeStats | null>(null);
  const [exportLoading, setExportLoading] = useState(false);
  const [syncSeatsLoading, setSyncSeatsLoading] = useState(false);
  const [itemsPerPage] = useState(20);
  const { toast } = useToast();
  
  // Subscription plans state
  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(false);

  // Action states
  const [selectedQRCode, setSelectedQRCode] = useState<QRCode | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [createdQRCodeIds, setCreatedQRCodeIds] = useState<string[]>([]);
  
  // View mode state
  const [viewMode, setViewMode] = useState<"list" | "compact">("list");
  
  // Selection state for bulk operations
  const [selectedQRCodeIds, setSelectedQRCodeIds] = useState<Set<string>>(new Set());
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false);
  
  // Reset form state
  const [resetForm, setResetForm] = useState({
    reason: "",
  });


  // Create QR code form state
  const [createForm, setCreateForm] = useState({
    subscription_plan_id: "",
    mode: "SINGULAR" as "SINGULAR" | "BULK",
    count: 1,
    zone_id: "",
    suffix_type: "",
    card_type: "",
    card_batch: "",
    seat_row: "",
    seat_start_number: 1,
    porte: undefined as number | undefined,
  });

  // Track if the selected subscription plan has seats
  const [planHasSeats, setPlanHasSeats] = useState(false);
  // Track if subscription plan has existing QR codes
  const [planHasQRCodes, setPlanHasQRCodes] = useState(false);
  // Manual seat activation toggle (when no QR codes exist)
  const [manualSeatActivation, setManualSeatActivation] = useState(false);
  // Available seat rows for the selected plan
  const [availableSeatRows, setAvailableSeatRows] = useState<string[]>([]);
  // Track if selected row is new or existing
  const [isNewSeatRow, setIsNewSeatRow] = useState(false);
  // Last seat number for selected row (read-only when existing row)
  const [lastSeatNumber, setLastSeatNumber] = useState<number | null>(null);
  // Zones for the selected subscription plan
  const [planZones, setPlanZones] = useState<Array<{ id: string; code: string; name: string }>>([]);
  const [loadingZones, setLoadingZones] = useState(false);

  // Build filters object for both QR codes and stats
  const buildFilters = () => {
    const filters: any = {};
    if (statusFilter !== "all") filters.status = statusFilter;
    if (subscriptionPlanFilter !== "all") filters.subscriptionPlanId = subscriptionPlanFilter;
    return filters;
  };

  useEffect(() => {
    fetchQRCodes();
    fetchStats();
    fetchSubscriptionPlans();
    // Note: Selection persists across page/filter changes
  }, [searchTerm, statusFilter, subscriptionPlanFilter, page, sortOrder]);

  // Listen for subscription plan changes from other pages
  useEffect(() => {
    const handlePlanChange = () => {
      fetchSubscriptionPlans();
    };
    
    window.addEventListener('subscriptionPlanChanged', handlePlanChange);
    
    // Refetch when page becomes visible (user switches back to tab)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchSubscriptionPlans();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      window.removeEventListener('subscriptionPlanChanged', handlePlanChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);


  // Fetch zones for subscription plan when plan changes
  useEffect(() => {
    const fetchPlanZones = async () => {
      if (createForm.subscription_plan_id) {
        setLoadingZones(true);
        try {
          const response = await qrCodesApi.getZonesForPlan(createForm.subscription_plan_id);
          if (response.success && response.data) {
            setPlanZones(response.data);
            
            // If only one zone, auto-select it
            if (response.data.length === 1) {
              const zone = response.data[0];
              setCreateForm(prev => ({ 
                ...prev, 
                zone_id: zone.code,
                // suffix_type will be determined by backend based on zone ID
              }));
            } else if (response.data.length > 1) {
              // Multiple zones - clear zone_id to force user selection
              setCreateForm(prev => ({ ...prev, zone_id: "" }));
            } else {
              // No zones - clear zone_id
              setCreateForm(prev => ({ ...prev, zone_id: "" }));
            }
          } else {
            setPlanZones([]);
            setCreateForm(prev => ({ ...prev, zone_id: "" }));
          }
        } catch (err) {
          console.error('Error fetching plan zones:', err);
          setPlanZones([]);
          setCreateForm(prev => ({ ...prev, zone_id: "" }));
        } finally {
          setLoadingZones(false);
        }
      } else {
        setPlanZones([]);
        setCreateForm(prev => ({ ...prev, zone_id: "" }));
      }
    };

    fetchPlanZones();
  }, [createForm.subscription_plan_id]);

  // Check if subscription plan has seats and existing QR codes when plan changes
  useEffect(() => {
    const checkPlanSeats = async () => {
      if (createForm.subscription_plan_id) {
        try {
          // Check if plan has existing QR codes
          const qrCodesResponse = await qrCodesApi.getAll(1, 1, { subscription_plan_id: createForm.subscription_plan_id });
          const hasQRCodes = qrCodesResponse.data && qrCodesResponse.data.length > 0;
          setPlanHasQRCodes(hasQRCodes);
          
          // Check if plan has seats (only if QR codes exist)
          if (hasQRCodes) {
          const hasSeatsResponse = await qrCodesApi.checkPlanHasSeats(createForm.subscription_plan_id);
          if (hasSeatsResponse.success && hasSeatsResponse.data?.hasSeats !== undefined) {
            setPlanHasSeats(hasSeatsResponse.data.hasSeats);
            
            if (hasSeatsResponse.data.hasSeats) {
              // Get available seat rows
              const rowsResponse = await qrCodesApi.getAvailableSeatRows(createForm.subscription_plan_id);
              if (rowsResponse.success && rowsResponse.data?.seatRows) {
                setAvailableSeatRows(rowsResponse.data.seatRows);
              } else {
                setAvailableSeatRows([]);
              }
            } else {
            // Clear seat fields if plan doesn't have seats
              setCreateForm(prev => ({ ...prev, seat_row: "", seat_start_number: 1 }));
              setAvailableSeatRows([]);
              setIsNewSeatRow(false);
              setLastSeatNumber(null);
            }
            }
          } else {
            // No QR codes exist - reset seat detection
            setPlanHasSeats(false);
            setManualSeatActivation(false);
            setAvailableSeatRows([]);
            setCreateForm(prev => ({ ...prev, seat_row: "", seat_start_number: 1, porte: undefined }));
            setIsNewSeatRow(false);
            setLastSeatNumber(null);
          }
        } catch (err) {
          // Silently fail - assume no seats
          console.error('Error checking plan seats:', err);
          setPlanHasSeats(false);
          setPlanHasQRCodes(false);
          setAvailableSeatRows([]);
        }
      } else {
        setPlanHasSeats(false);
        setPlanHasQRCodes(false);
        setManualSeatActivation(false);
        setAvailableSeatRows([]);
        setIsNewSeatRow(false);
        setLastSeatNumber(null);
        setCreateForm(prev => ({ ...prev, porte: undefined }));
      }
    };

    checkPlanSeats();
  }, [createForm.subscription_plan_id]);

  // Fetch last seat number when seat row changes (if existing row)
  useEffect(() => {
    const fetchLastSeatNumber = async () => {
      if (createForm.subscription_plan_id && createForm.seat_row && !isNewSeatRow && (planHasSeats || manualSeatActivation)) {
        try {
          const response = await qrCodesApi.getLastSeatNumber(
            createForm.subscription_plan_id,
            createForm.seat_row
          );
          if (response.success && response.data?.lastSeatNumber !== undefined) {
            const lastNumber = response.data.lastSeatNumber;
            setLastSeatNumber(lastNumber);
            // Auto-set start number to last + 1
              setCreateForm(prev => ({ 
                ...prev, 
              seat_start_number: lastNumber + 1 
              }));
          } else {
            setLastSeatNumber(0);
            setCreateForm(prev => ({ ...prev, seat_start_number: 1 }));
          }
        } catch (err) {
          console.error('Error fetching last seat number:', err);
          setLastSeatNumber(null);
        }
      } else if (isNewSeatRow || (!planHasSeats && !manualSeatActivation)) {
        setLastSeatNumber(null);
        if (isNewSeatRow) {
        setCreateForm(prev => ({ ...prev, seat_start_number: 1 }));
        }
      }
    };
    fetchLastSeatNumber();
  }, [createForm.subscription_plan_id, createForm.seat_row, isNewSeatRow, planHasSeats, manualSeatActivation]);

  const fetchQRCodes = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = {
        page,
        limit: itemsPerPage,
      };
      
      if (searchTerm) params.query = searchTerm;
      if (statusFilter !== "all") params.status = statusFilter;
      if (subscriptionPlanFilter !== "all") params.subscription_plan_id = subscriptionPlanFilter;
      
      // Add sorting parameters - backend will sort all records, not just current page
      params.sort_by = 'created_at';
      params.sort_order = sortOrder === 'newest' ? 'desc' : 'asc';
      
      const response = await qrCodesApi.getAll(params.page || 1, params.limit || 20, params);
      
      if (response.success) {
        setQRCodes(response.data || []);
        setTotalPages(response.pagination?.totalPages || 1);
        setTotalCount(response.pagination?.total || 0);
      } else {
        setError("Erreur lors du chargement des QR codes");
      }
    } catch (err: any) {
      setError(err.message || "Erreur lors du chargement des QR codes");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const filters = buildFilters();
      const response = await qrCodesApi.getStats(filters);
      if (response.success) {
        setStats(response.data);
      }
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  };

  const fetchSubscriptionPlans = async () => {
    setLoadingPlans(true);
    try {
      const response = await subscriptionsApi.getSubscriptionPlans();
      setSubscriptionPlans(response.data || []);
    } catch (err: any) {
      console.error("Error fetching subscription plans:", err);
    } finally {
      setLoadingPlans(false);
    }
  };

  const handleResetQRCode = async () => {
    if (!selectedQRCode) return;
    setActionLoading(true);
    try {
      const response = await qrCodesApi.release(selectedQRCode.id, resetForm.reason);
      if (response.success) {
        toast({ title: "Succès", description: "QR code réinitialisé avec succès" });
        setShowResetModal(false);
        setResetForm({ reason: "" });
        fetchQRCodes();
        fetchStats();
      } else {
        toast({ title: "Erreur", description: response.message || "Erreur lors de la réinitialisation", variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message || "Erreur lors de la réinitialisation", variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  };


  const handleDelete = (qrCode: QRCode) => {
    setSelectedQRCode(qrCode);
    setShowDeleteModal(true);
  };

  const handleDeleteQRCode = async () => {
    if (!selectedQRCode) return;
    setActionLoading(true);
    try {
      // Check if QR code is assigned (only check status, backend will check access_rights)
      const isAssigned = selectedQRCode.status === QRCodeStatus.ASSIGNED;
      
      if (isAssigned) {
        toast({ 
          title: "Action requise", 
          description: "Ce QR code est assigné. Veuillez d'abord le réinitialiser avant de le supprimer.",
          variant: "destructive" 
        });
        setShowDeleteModal(false);
        setShowResetModal(true);
        return;
      }

      const response = await qrCodesApi.delete(selectedQRCode.id);
      if (response.success) {
        toast({ title: "Succès", description: "QR code supprimé avec succès" });
        setShowDeleteModal(false);
        setSelectedQRCode(null);
        fetchQRCodes();
        fetchStats();
      } else {
        toast({ title: "Erreur", description: response.message || "Erreur lors de la suppression", variant: "destructive" });
      }
    } catch (err: any) {
      // Check if error is about assigned QR code
      if (err.message?.includes('assigné') || err.message?.includes('assigned')) {
        toast({ 
          title: "Action requise", 
          description: "Ce QR code est assigné. Veuillez d'abord le réinitialiser avant de le supprimer.",
          variant: "destructive" 
        });
        setShowDeleteModal(false);
        setShowResetModal(true);
      } else {
        toast({ title: "Erreur", description: err.message || "Erreur lors de la suppression", variant: "destructive" });
      }
    } finally {
      setActionLoading(false);
    }
  };



  const handleExport = async (format: string) => {
    setExportLoading(true);
    try {
      // Get all QR codes for export using the new export endpoint
      const params: any = {};
      if (searchTerm) params.query = searchTerm;
      if (statusFilter !== "all") params.status = statusFilter;
      if (subscriptionPlanFilter !== "all") params.subscription_plan_id = subscriptionPlanFilter;
      
      const response = await qrCodesApi.exportAll(params);
      
      if (response.success && response.data) {
        const csvData = generateCSV(response.data);
        // Get subscription plan name from first QR code or use filter
        const subscriptionPlanName = response.data.length > 0 
          ? (response.data[0].subscription?.subscription_plan?.name || 
             response.data[0].subscription?.subscription_plan?.code || 
             subscriptionPlanFilter !== "all" ? subscriptionPlanFilter : "all")
          : (subscriptionPlanFilter !== "all" ? subscriptionPlanFilter : "all");
        // Clean plan name for filename (remove special characters)
        const cleanPlanName = subscriptionPlanName.replace(/[^a-zA-Z0-9]/g, '_');
        const qrCount = response.data.length;
        downloadCSV(csvData, `qr-codes_${cleanPlanName}_${qrCount}.csv`);
        toast({ title: "Export réussi", description: "Fichier CSV téléchargé avec succès" });
      } else {
        toast({ title: "Erreur", description: "Erreur lors de l'export", variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message || "Erreur lors de l'export", variant: "destructive" });
    } finally {
      setExportLoading(false);
    }
  };

  const handleSyncSeats = async () => {
    setSyncSeatsLoading(true);
    try {
      const response = await qrCodesApi.syncSeats();
      if (response.success) {
        toast({ 
          title: "Synchronisation réussie", 
          description: `${response.data.synced} sièges synchronisés${response.data.errors > 0 ? `, ${response.data.errors} erreurs` : ''}` 
        });
        // Refresh QR codes list to show updated seat statuses
        fetchQRCodes();
      } else {
        toast({ title: "Erreur", description: "Erreur lors de la synchronisation", variant: "destructive" });
      }
    } catch (err: any) {
      toast({ 
        title: "Erreur", 
        description: err.response?.data?.message || err.message || "Erreur lors de la synchronisation des sièges", 
        variant: "destructive" 
      });
    } finally {
      setSyncSeatsLoading(false);
    }
  };

  const generateCSV = (qrCodes: QRCode[]): string => {
    const headers = [
      'QR Code',
      'Serial Number',
      'Status',
      'Seat',
      'Zone',
      'Access Gate',
      'Subscription Plan',
      'Subscriber Name',
      'Subscriber Email',
      'Assigned Date',
      'Created Date',
      'Updated Date'
    ];

    const rows = qrCodes.map(qrCode => [
      qrCode.code,
      qrCode.metadata?.serial_number || '',
      qrCode.status,
      qrCode.seatNumber || qrCode.metadata?.seat_number || qrCode.metadata?.seat || '',
      qrCode.metadata?.zone_name || qrCode.metadata?.zone || '',
      qrCode.metadata?.entry_gate || qrCode.metadata?.access_gate || '',
      qrCode.subscription?.subscription_plan?.name || qrCode.subscription?.subscription_plan?.code || qrCode.subscriptionId || '',
      qrCode.subscriptionInfo?.user ? `${qrCode.subscriptionInfo.user.first_name} ${qrCode.subscriptionInfo.user.last_name}` : '',
      qrCode.subscriptionInfo?.user?.email || '',
      qrCode.assignedAt ? (typeof qrCode.assignedAt === 'string' ? new Date(qrCode.assignedAt) : qrCode.assignedAt).toLocaleDateString('en-US') : '',
      qrCode.createdAt ? (typeof qrCode.createdAt === 'string' ? new Date(qrCode.createdAt) : qrCode.createdAt).toLocaleDateString('en-US') : '',
      qrCode.updatedAt ? (typeof qrCode.updatedAt === 'string' ? new Date(qrCode.updatedAt) : qrCode.updatedAt).toLocaleDateString('en-US') : ''
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    return csvContent;
  };

  const downloadCSV = (csvContent: string, filename: string) => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleView = (qrCode: QRCode) => {
    setSelectedQRCode(qrCode);
    setShowViewModal(true);
  };

  const handleReset = (qrCode: QRCode) => {
    setSelectedQRCode(qrCode);
    setShowResetModal(true);
  };

  const handlePreview = async () => {
    if (!createForm.subscription_plan_id) {
      toast({ title: "Erreur", description: "Veuillez sélectionner un plan d'abonnement", variant: "destructive" });
      return;
    }

    // Check if plan has zones and zone is required
    if (planZones.length > 1 && !createForm.zone_id) {
      toast({ 
        title: "Zone requise", 
        description: "Veuillez sélectionner une zone pour ce plan d'abonnement", 
        variant: "destructive" 
      });
      return;
    }

    // Check if plan has no zones
    if (planZones.length === 0 && !createForm.zone_id) {
      toast({ 
        title: "Zone requise", 
        description: "Ce plan d'abonnement n'a aucune zone configurée. Veuillez configurer des zones pour ce plan ou spécifiez manuellement une zone.", 
        variant: "destructive" 
      });
      return;
    }

    const count = createForm.mode === "BULK" ? createForm.count : 1;
    if (count < 1) {
      toast({ title: "Erreur", description: "Veuillez spécifier un nombre valide", variant: "destructive" });
      return;
    }

    setPreviewLoading(true);
    try {
      const payload: any = {
        subscription_plan_id: createForm.subscription_plan_id,
        count,
      };

      if (createForm.zone_id) payload.zone_id = createForm.zone_id;
      if (createForm.suffix_type) payload.suffix_type = createForm.suffix_type;
      if (createForm.card_type) payload.card_type = createForm.card_type;
      if (createForm.card_batch) payload.card_batch = createForm.card_batch;
      if (createForm.seat_row) payload.seat_row = createForm.seat_row;
      if (createForm.seat_start_number) payload.seat_start_number = createForm.seat_start_number;
      if (createForm.porte) payload.porte = createForm.porte;

      const response = await qrCodesApi.previewPhysical(payload);
      
      if (response.success) {
        setPreviewData(response.data);
        setShowCreateModal(false);
        setShowPreviewModal(true);
      } else {
        toast({ title: "Erreur", description: response.message || "Erreur lors de la génération de l'aperçu", variant: "destructive" });
      }
    } catch (err: any) {
      // Extract error message from response if available
      const errorMessage = err.response?.data?.message || err.message || "Erreur lors de la génération de l'aperçu";
      toast({ title: "Erreur", description: errorMessage, variant: "destructive" });
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleCreateQRCode = async () => {
    if (!createForm.subscription_plan_id) {
      toast({ title: "Erreur", description: "Veuillez sélectionner un plan d'abonnement", variant: "destructive" });
      return;
    }

    // Check if plan has zones and zone is required
    if (planZones.length > 1 && !createForm.zone_id) {
      toast({ 
        title: "Zone requise", 
        description: "Veuillez sélectionner une zone pour ce plan d'abonnement", 
        variant: "destructive" 
      });
      return;
    }

    // Check if plan has no zones
    if (planZones.length === 0 && !createForm.zone_id) {
      toast({ 
        title: "Zone requise", 
        description: "Ce plan d'abonnement n'a aucune zone configurée. Veuillez configurer des zones pour ce plan ou spécifiez manuellement une zone.", 
        variant: "destructive" 
      });
      return;
    }

    if (createForm.mode === "BULK" && (!createForm.count || createForm.count < 1)) {
      toast({ title: "Erreur", description: "Veuillez spécifier un nombre valide pour la création en masse", variant: "destructive" });
      return;
    }

    setCreateLoading(true);
    try {
      const payload: any = {
        subscription_plan_id: createForm.subscription_plan_id,
        mode: createForm.mode,
      };

      if (createForm.mode === "BULK") {
        payload.count = createForm.count;
      }

      if (createForm.zone_id) payload.zone_id = createForm.zone_id;
      if (createForm.suffix_type) payload.suffix_type = createForm.suffix_type;
      if (createForm.card_type) payload.card_type = createForm.card_type;
      if (createForm.card_batch) payload.card_batch = createForm.card_batch;
      if (createForm.seat_row) payload.seat_row = createForm.seat_row;
      if (createForm.seat_start_number) payload.seat_start_number = createForm.seat_start_number;
      if (createForm.porte) payload.porte = createForm.porte;

      const response = await qrCodesApi.createPhysical(payload);
      
      if (response.success) {
        // Extract created QR code IDs for export
        const createdIds: string[] = [];
        if (createForm.mode === "BULK" && response.data?.created) {
          createdIds.push(...response.data.created.map((qr: any) => qr.id));
        } else if (response.data?.id) {
          createdIds.push(response.data.id);
        }

        setCreatedQRCodeIds(createdIds);
        
        const message = createForm.mode === "BULK" 
          ? `${response.data?.created?.length || createForm.count} QR code(s) créé(s) avec succès${response.data?.errors?.length > 0 ? `. ${response.data.errors.length} erreur(s) survenues.` : ''}`
          : "QR code créé avec succès";
        
        toast({ title: "Succès", description: message });
        setShowPreviewModal(false);
        setShowCreateModal(false);
        
        // Show export modal if QR codes were created
        if (createdIds.length > 0) {
          setShowExportModal(true);
        }
        
        setCreateForm({
          subscription_plan_id: "",
          mode: "SINGULAR",
          count: 1,
          zone_id: "",
          suffix_type: "",
          card_type: "",
          card_batch: "",
          seat_row: "",
          seat_start_number: 1,
          porte: undefined,
        });
        setPlanHasSeats(false);
        fetchQRCodes();
        fetchStats();
      } else {
        toast({ title: "Erreur", description: response.message || "Erreur lors de la création", variant: "destructive" });
      }
    } catch (err: any) {
      // Extract error message from response if available
      const errorMessage = err.response?.data?.message || err.message || "Erreur lors de la création";
      toast({ title: "Erreur", description: errorMessage, variant: "destructive" });
    } finally {
      setCreateLoading(false);
    }
  };

  const handleExportCreated = async () => {
    if (createdQRCodeIds.length === 0) {
      toast({ title: "Erreur", description: "Aucun QR code à exporter", variant: "destructive" });
      return;
    }

    try {
      const { blob, filename } = await qrCodesApi.exportCreated(createdQRCodeIds);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast({ title: "Succès", description: "Export réussi" });
      setShowExportModal(false);
      setCreatedQRCodeIds([]);
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message || "Erreur lors de l'export", variant: "destructive" });
    }
  };



  const getStatusBadge = (status: QRCodeStatus) => {
    const statusConfig = {
      [QRCodeStatus.AVAILABLE]: { label: "Disponible", color: "bg-green-100 text-green-800" },
      [QRCodeStatus.ASSIGNED]: { label: "Assigné", color: "bg-blue-100 text-blue-800" },
      [QRCodeStatus.RESERVED]: { label: "Réservé", color: "bg-yellow-100 text-yellow-800" },
      [QRCodeStatus.USED]: { label: "Utilisé", color: "bg-gray-100 text-gray-800" },
      [QRCodeStatus.EXPIRED]: { label: "Expiré", color: "bg-red-100 text-red-800" },
      [QRCodeStatus.DAMAGED]: { label: "Endommagé", color: "bg-orange-100 text-orange-800" },
      [QRCodeStatus.LOST]: { label: "Perdu", color: "bg-red-100 text-red-800" },
    };

    const config = statusConfig[status];
    if (!config) {
      return <Badge className="bg-gray-100 text-gray-800">Inconnu</Badge>;
    }
    
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const getTypeBadge = (type: QRCodeType, qrCode?: QRCode) => {
    const typeConfig = {
      [QRCodeType.SEAT]: { label: "Siège", icon: MapPin, color: "bg-purple-100 text-purple-800" },
      [QRCodeType.ENTRY]: { label: "Entrée", icon: Hash, color: "bg-blue-100 text-blue-800" },
      [QRCodeType.VIP]: { label: "VIP", icon: Crown, color: "bg-yellow-100 text-yellow-800" },
      [QRCodeType.STAFF]: { label: "Staff", icon: User, color: "bg-green-100 text-green-800" },
      [QRCodeType.GENERAL]: { label: "Général", icon: QrCode, color: "bg-gray-100 text-gray-800" },
    };

    const config = typeConfig[type];
    if (!config) {
      return <Badge className="bg-gray-100 text-gray-800">Inconnu</Badge>;
    }
    
    const Icon = config.icon;
    
    // For SEAT type, show seat number if available
    if (type === QRCodeType.SEAT && qrCode) {
      const seatNumber = qrCode.seatNumber || qrCode.metadata?.seat_number || qrCode.metadata?.seat;
      if (seatNumber) {
        return (
          <Badge className={config.color}>
            <Icon className="w-3 h-3 mr-1" />
            {seatNumber}
          </Badge>
        );
      }
    }
    
    return (
      <Badge className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const formatDate = (dateInput: string | Date | null | undefined) => {
    if (!dateInput) return "-";
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copié", description: "Code copié dans le presse-papiers" });
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setSubscriptionPlanFilter("all");
    setSortOrder("newest");
    setPage(1);
    // Note: Selection is preserved when resetting filters - user can clear it manually if needed
    toast({ title: "Filtres réinitialisés", description: "Tous les filtres ont été remis à zéro" });
  };

  // Sorting is now handled by the backend API
  // No need for client-side sorting as it only sorted the current page

  // Selection handlers
  const handleSelectQRCode = (id: string) => {
    setSelectedQRCodeIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    // Get IDs of QR codes on current page
    const currentPageIds = new Set(qrCodes.map(qr => qr.id));
    
    // Check if all current page items are selected
    const allCurrentPageSelected = qrCodes.every(qr => selectedQRCodeIds.has(qr.id));
    
    if (allCurrentPageSelected) {
      // Deselect all items on current page, but keep selections from other pages
      setSelectedQRCodeIds(prev => {
        const newSet = new Set(prev);
        currentPageIds.forEach(id => newSet.delete(id));
        return newSet;
      });
    } else {
      // Select all items on current page, keeping existing selections
      setSelectedQRCodeIds(prev => {
        const newSet = new Set(prev);
        currentPageIds.forEach(id => newSet.add(id));
        return newSet;
      });
    }
  };

  const handleBulkDelete = async () => {
    if (selectedQRCodeIds.size === 0) return;
    
    setBulkDeleteLoading(true);
    const idsToDelete = Array.from(selectedQRCodeIds);
    const assignedCodes: string[] = [];
    const deletedIds: string[] = [];
    const errors: string[] = [];

    try {
      // Delete each QR code sequentially to handle errors properly
      for (const id of idsToDelete) {
        try {
          // Try to find QR code in current page data first
          let qrCode = qrCodes.find(qr => qr.id === id);
          let qrCodeLabel = qrCode?.code || id;
          
          // If not found in current page, fetch it from API to get the code label
          if (!qrCode) {
            try {
              const fetchResponse = await qrCodesApi.getById(id);
              if (fetchResponse.success && fetchResponse.data) {
                qrCode = fetchResponse.data;
                qrCodeLabel = qrCode.code || id;
                
                // Check if QR code is assigned before attempting delete
                if (qrCode.status === QRCodeStatus.ASSIGNED) {
                  assignedCodes.push(qrCodeLabel);
                  continue;
                }
              }
            } catch (fetchErr) {
              // If we can't fetch it, we'll try to delete anyway and let backend handle it
              console.warn(`Could not fetch QR code ${id} details:`, fetchErr);
            }
          } else {
            // We have the QR code from current page, check if assigned
            if (qrCode.status === QRCodeStatus.ASSIGNED) {
              assignedCodes.push(qrCodeLabel);
              continue;
            }
          }

          // Attempt to delete
          const response = await qrCodesApi.delete(id);
          if (response.success) {
            deletedIds.push(id);
          } else {
            // Check if the error is about assigned QR code
            if (response.message?.includes('assigné') || response.message?.includes('assigned')) {
              assignedCodes.push(qrCodeLabel);
            } else {
              errors.push(response.message || `Erreur lors de la suppression de ${qrCodeLabel}`);
            }
          }
        } catch (err: any) {
          // Check if error is about assigned QR code
          const errorMessage = err.message || err.response?.data?.message || '';
          if (errorMessage.includes('assigné') || errorMessage.includes('assigned') || 
              errorMessage.includes('Impossible de supprimer un QR code assigné')) {
            // Try to get the code label
            let codeLabel = id;
            try {
              const qrCode = qrCodes.find(qr => qr.id === id);
              if (qrCode) {
                codeLabel = qrCode.code || id;
              } else {
                // Try to fetch it to get the code
                const fetchResponse = await qrCodesApi.getById(id);
                if (fetchResponse.success && fetchResponse.data) {
                  codeLabel = fetchResponse.data.code || id;
                }
              }
            } catch {
              // Use ID if we can't get the code
            }
            assignedCodes.push(codeLabel);
          } else {
            errors.push(errorMessage || `Erreur lors de la suppression de ${id}`);
          }
        }
      }

      // Show results
      if (deletedIds.length > 0) {
        toast({ 
          title: "Succès", 
          description: `${deletedIds.length} QR code(s) supprimé(s) avec succès` 
        });
      }

      if (assignedCodes.length > 0) {
        toast({ 
          title: "Action impossible", 
          description: `${assignedCodes.length} QR code(s) assigné(s) ne peuvent pas être supprimés. Veuillez d'abord les réinitialiser avant de les supprimer.`,
          variant: "destructive"
        });
      }

      if (errors.length > 0) {
        toast({ 
          title: "Erreurs", 
          description: `${errors.length} erreur(s) lors de la suppression: ${errors.slice(0, 3).join(', ')}${errors.length > 3 ? '...' : ''}`,
          variant: "destructive"
        });
      }

      // Clear selection and refresh
      setSelectedQRCodeIds(new Set());
      setShowBulkDeleteModal(false);
      fetchQRCodes();
      fetchStats();
    } catch (err: any) {
      toast({ 
        title: "Erreur", 
        description: err.message || "Erreur lors de la suppression en masse",
        variant: "destructive"
      });
    } finally {
      setBulkDeleteLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar type="admin" />
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="px-8 w-full">
          <PageHeader
            title="QR Codes Physiques"
            description="Gérez les QR codes physiques, leurs assignations et leurs utilisations."
          />

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <Card className="shadow-sm hover:shadow-md transition-shadow duration-200">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total QR Codes</CardTitle>
                <QrCode className="h-5 w-5 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats ? stats.totalQRCodes : <span className="inline-block h-6 w-16 bg-gray-200 rounded animate-pulse" />}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm hover:shadow-md transition-shadow duration-200">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Disponibles</CardTitle>
                <CheckCircle className="h-5 w-5 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats ? stats.availableQRCodes : <span className="inline-block h-6 w-16 bg-gray-200 rounded animate-pulse" />}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm hover:shadow-md transition-shadow duration-200">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Assignés</CardTitle>
                <UserCheck className="h-5 w-5 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats ? stats.assignedQRCodes : <span className="inline-block h-6 w-16 bg-gray-200 rounded animate-pulse" />}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="space-y-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Input
                  className="pl-10 pr-4 py-2 rounded-full border border-gray-300 shadow-sm focus:ring-2 focus:ring-primary focus:border-primary transition-all text-base"
                  placeholder="Rechercher par code QR, numéro de série, ou siège..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              </div>
              
              <Button
                variant="default"
                size="sm"
                onClick={() => setShowCreateModal(true)}
                className="text-xs bg-primary hover:bg-primary/90"
              >
                <Plus className="mr-2 h-4 w-4" />
                Créer des QR Codes
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport('csv')}
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

              <Button
                variant="outline"
                size="sm"
                onClick={handleSyncSeats}
                disabled={syncSeatsLoading}
                className="text-xs"
                title="Synchroniser les statuts des sièges avec les QR codes"
              >
                {syncSeatsLoading ? (
                  <LoadingSpinner size="sm" className="mr-2" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Synchroniser les sièges
              </Button>

              {/* View Mode Toggle */}
              <div className="flex items-center gap-1 border border-gray-300 rounded-lg p-1 bg-white">
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className="h-8 px-3"
                >
                  <List className="h-4 w-4" />
                </Button>
              <Button
                variant={viewMode === "compact" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("compact")}
                className="h-8 px-3"
              >
                <Grid className="h-4 w-4" />
              </Button>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <select
                className="appearance-none border border-gray-300 rounded-full px-4 py-2 text-sm bg-white shadow-sm focus:ring-primary focus:border-primary transition-all pr-10"
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as QRCodeStatus | "all")}
                style={{
                  backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'20\' height=\'20\' viewBox=\'0 0 20 20\' fill=\'none\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M6 8L10 12L14 8\' stroke=\'%239CA3AF\' stroke-width=\'1.5\' stroke-linecap=\'round\' stroke-linejoin=\'round\'/%3E%3C/svg%3E")',
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 0.75rem center',
                  backgroundSize: '1.25rem 1.25rem',
                }}
              >
                <option value="all">Tous les statuts</option>
                <option value={QRCodeStatus.AVAILABLE}>Disponible</option>
                <option value={QRCodeStatus.ASSIGNED}>Assigné</option>
                <option value={QRCodeStatus.RESERVED}>Réservé</option>
                <option value={QRCodeStatus.USED}>Utilisé</option>
                <option value={QRCodeStatus.EXPIRED}>Expiré</option>
                <option value={QRCodeStatus.DAMAGED}>Endommagé</option>
                <option value={QRCodeStatus.LOST}>Perdu</option>
              </select>

              <select
                className="appearance-none border border-gray-300 rounded-full px-4 py-2 text-sm bg-white shadow-sm focus:ring-primary focus:border-primary transition-all pr-10"
                value={subscriptionPlanFilter}
                onChange={e => setSubscriptionPlanFilter(e.target.value)}
                disabled={loadingPlans}
                style={{
                  backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'20\' height=\'20\' viewBox=\'0 0 20 20\' fill=\'none\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M6 8L10 12L14 8\' stroke=\'%239CA3AF\' stroke-width=\'1.5\' stroke-linecap=\'round\' stroke-linejoin=\'round\'/%3E%3C/svg%3E")',
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 0.75rem center',
                  backgroundSize: '1.25rem 1.25rem',
                }}
              >
                <option value="all">Tous les abonnements</option>
                {subscriptionPlans.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.name}
                  </option>
                ))}
              </select>

              <select
                className="appearance-none border border-gray-300 rounded-full px-4 py-2 text-sm bg-white shadow-sm focus:ring-primary focus:border-primary transition-all pr-10"
                value={sortOrder}
                onChange={e => setSortOrder(e.target.value as "newest" | "oldest")}
                style={{
                  backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'20\' height=\'20\' viewBox=\'0 0 20 20\' fill=\'none\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M6 8L10 12L14 8\' stroke=\'%239CA3AF\' stroke-width=\'1.5\' stroke-linecap=\'round\' stroke-linejoin=\'round\'/%3E%3C/svg%3E")',
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 0.75rem center',
                  backgroundSize: '1.25rem 1.25rem',
                }}
              >
                <option value="newest">Plus récent d'abord</option>
                <option value="oldest">Plus ancien d'abord</option>
              </select>

              <Button
                variant="outline"
                size="sm"
                onClick={handleResetFilters}
                className="text-xs border-gray-300 hover:bg-gray-50"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Réinitialiser
              </Button>
            </div>
          </div>

          {/* Bulk Action Bar */}
          {viewMode === "compact" && selectedQRCodeIds.size > 0 && (
            <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-blue-900">
                  {selectedQRCodeIds.size} QR code(s) sélectionné(s)
                </span>
                {qrCodes.length > 0 && (
                  <span className="text-xs text-blue-700">
                    ({qrCodes.filter(qr => selectedQRCodeIds.has(qr.id)).length} sur cette page)
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedQRCodeIds(new Set())}
                  className="text-xs"
                >
                  <X className="mr-2 h-4 w-4" />
                  Tout désélectionner
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowBulkDeleteModal(true)}
                  className="text-xs"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Supprimer ({selectedQRCodeIds.size})
                </Button>
              </div>
            </div>
          )}

          {/* QR Codes List */}
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
                icon={<AlertTriangle className="h-12 w-12" />}
                title="Erreur"
                description={error}
                action={{ label: "Réessayer", onClick: fetchQRCodes }}
              />
            ) : qrCodes.length === 0 ? (
              <EmptyState
                icon={<QrCode className="h-12 w-12" />}
                title="Aucun QR code trouvé"
                description="Ajustez vos critères de recherche ou créez votre premier QR code."
                action={{ label: "Réessayer", onClick: fetchQRCodes }}
              />
            ) : viewMode === "compact" ? (
              <div className="space-y-2">
                {/* Select All Header */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-2 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleSelectAll}
                      className="h-8 w-8 p-0"
                    >
                      {qrCodes.every(qr => selectedQRCodeIds.has(qr.id)) ? (
                        <CheckSquare className="h-5 w-5 text-primary" />
                      ) : (
                        <Square className="h-5 w-5 text-gray-400" />
                      )}
                    </Button>
                    <span className="text-sm font-medium text-gray-700">
                      {qrCodes.every(qr => selectedQRCodeIds.has(qr.id)) 
                        ? "Tout désélectionner (page actuelle)" 
                        : "Tout sélectionner (page actuelle)"}
                    </span>
                  </div>
                  {selectedQRCodeIds.size > 0 && (
                    <span className="text-xs text-gray-500">
                      {selectedQRCodeIds.size} sélectionné(s) au total
                    </span>
                  )}
                </div>

                {/* Compact List Items */}
                {qrCodes.map((qrCode) => (
                  <div 
                    key={qrCode.id} 
                    className={`bg-white rounded-lg border transition-all ${
                      selectedQRCodeIds.has(qrCode.id) 
                        ? "border-primary shadow-md bg-blue-50" 
                        : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
                    }`}
                  >
                    <div className="flex items-center gap-3 p-3">
                      {/* Checkbox */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSelectQRCode(qrCode.id)}
                        className="h-6 w-6 p-0 flex-shrink-0"
                      >
                        {selectedQRCodeIds.has(qrCode.id) ? (
                          <CheckSquare className="h-5 w-5 text-primary" />
                        ) : (
                          <Square className="h-5 w-5 text-gray-400" />
                        )}
                      </Button>

                      {/* QR Code Icon */}
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded flex items-center justify-center flex-shrink-0">
                        <QrCode className="h-4 w-4 text-white" />
                      </div>

                      {/* QR Code Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-gray-900 truncate">{qrCode.code}</span>
                          {getStatusBadge(qrCode.status)}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-600 flex-wrap">
                          {qrCode.metadata?.serial_number && (
                            <span className="font-mono">S/N: {qrCode.metadata.serial_number}</span>
                          )}
                          {(qrCode.seatNumber || qrCode.metadata?.seat_number) && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {qrCode.seatNumber || qrCode.metadata?.seat_number}
                            </span>
                          )}
                          {qrCode.metadata?.zone_name && (
                            <span className="flex items-center gap-1">
                              <Building className="w-3 h-3" />
                              {qrCode.metadata.zone_name}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(qrCode.createdAt)}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleView(qrCode)}
                                className="h-8 w-8 p-0"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Voir les détails</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        
                        {qrCode.status === QRCodeStatus.ASSIGNED && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleReset(qrCode)}
                                  className="h-8 w-8 p-0"
                                >
                                  <RefreshCw className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Réinitialiser le QR code</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(qrCode)}
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Supprimer le QR code</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {qrCodes.map((qrCode) => (
                  <div key={qrCode.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                          <QrCode className="h-6 w-6 text-white" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gray-900 truncate">{qrCode.code}</h3>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => copyToClipboard(qrCode.code)}
                                    className="h-6 w-6 p-0"
                                  >
                                    <Copy className="h-3 w-3" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Copier le code</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                          
                          {(qrCode.metadata?.serial_number) && (
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm text-gray-600">S/N:</span>
                              <span className="text-sm font-mono text-gray-700">{qrCode.metadata.serial_number}</span>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => copyToClipboard(qrCode.metadata?.serial_number || '')}
                                      className="h-4 w-4 p-0"
                                    >
                                      <Copy className="h-2 w-2" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Copier le numéro de série</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          )}
                          
                          {/* Subscriber Information */}
                          {qrCode.subscriptionInfo?.user && (
                            <div className="flex items-center gap-2 mb-2">
                              <User className="w-4 h-4 text-blue-600" />
                              <span className="text-sm text-gray-600">Abonné:</span>
                              <span className="text-sm font-medium text-gray-900">
                                {qrCode.subscriptionInfo.user.first_name} {qrCode.subscriptionInfo.user.last_name}
                              </span>
                              <span className="text-xs text-gray-500">
                                ({qrCode.subscriptionInfo.user.email})
                              </span>
                            </div>
                          )}
                          
                          <div className="flex items-center gap-2 mb-2">
                            {getStatusBadge(qrCode.status)}
                            {(qrCode.seatNumber || qrCode.metadata?.seat_number || qrCode.metadata?.seat) && (
                              <Badge variant="outline" className="text-xs">
                                <MapPin className="w-3 h-3 mr-1" />
                                {qrCode.seatNumber || qrCode.metadata?.seat_number || qrCode.metadata?.seat}
                              </Badge>
                            )}
                            {(qrCode.metadata?.zone_name || qrCode.metadata?.zone) && (
                              <Badge variant="outline" className="text-xs">
                                <Building className="w-3 h-3 mr-1" />
                                {qrCode.metadata?.zone_name || qrCode.metadata?.zone}
                              </Badge>
                            )}
                          </div>
                          
                          <div className="text-sm text-gray-500 space-y-1">
                            <div>Créé le {formatDate(qrCode.createdAt)}</div>
                            {qrCode.assignedAt && (
                              <div>Assigné le {formatDate(qrCode.assignedAt)}</div>
                            )}
                            {qrCode.venue && (
                              <div className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {qrCode.venue.name}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleView(qrCode)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Voir les détails</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        
                        {qrCode.status === QRCodeStatus.ASSIGNED && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleReset(qrCode)}
                                >
                                  <RefreshCw className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Réinitialiser le QR code</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDelete(qrCode)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Supprimer le QR code</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pagination */}
          {!loading && !error && qrCodes.length > 0 && (
            <div className="flex items-center justify-between mt-6 px-4 py-3 bg-white rounded-lg shadow-sm border">
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span>
                  Affichage de <span className="font-semibold">{(page - 1) * itemsPerPage + 1}</span> à{' '}
                  <span className="font-semibold">
                    {Math.min(page * itemsPerPage, totalCount)}
                  </span>{' '}
                  sur <span className="font-semibold">{totalCount}</span> QR codes
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

      {/* Reset QR Code Modal */}
      <Dialog open={showResetModal} onOpenChange={setShowResetModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Réinitialiser le QR Code</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir réinitialiser ce QR code ? Cette action le libérera de son assignation actuelle.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="resetReason">Raison de la réinitialisation (optionnel)</Label>
              <Textarea
                id="resetReason"
                value={resetForm.reason}
                onChange={(e) => setResetForm(prev => ({ ...prev, reason: e.target.value }))}
                placeholder="Ex: Erreur d'assignation, demande client..."
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResetModal(false)}>
              Annuler
            </Button>
            <Button onClick={handleResetQRCode} disabled={actionLoading}>
              {actionLoading ? <LoadingSpinner size="sm" className="mr-2" /> : null}
              Réinitialiser
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create QR Code Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Créer des QR Codes Physiques
            </DialogTitle>
            <DialogDescription>
              Créez un ou plusieurs QR codes physiques pour un plan d'abonnement. Les numéros de série, clés d'onboarding et codes QR seront générés automatiquement.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Subscription Plan Selection */}
            <div>
              <Label htmlFor="subscription_plan" className="text-sm font-medium">
                Plan d'abonnement <span className="text-red-500">*</span>
              </Label>
              <select
                id="subscription_plan"
                className="mt-1 w-full appearance-none border border-gray-300 rounded-lg px-4 py-2 text-sm bg-white shadow-sm focus:ring-primary focus:border-primary transition-all pr-10"
                value={createForm.subscription_plan_id}
                onChange={(e) => setCreateForm(prev => ({ ...prev, subscription_plan_id: e.target.value }))}
                disabled={loadingPlans}
                style={{
                  backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'20\' height=\'20\' viewBox=\'0 0 20 20\' fill=\'none\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M6 8L10 12L14 8\' stroke=\'%239CA3AF\' stroke-width=\'1.5\' stroke-linecap=\'round\' stroke-linejoin=\'round\'/%3E%3C/svg%3E")',
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 0.75rem center',
                  backgroundSize: '1.25rem 1.25rem',
                }}
              >
                <option value="">Sélectionner un plan d'abonnement</option>
                {subscriptionPlans.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.name} {plan.code ? `(${plan.code})` : ''}
                  </option>
                ))}
              </select>
              {loadingPlans && (
                <p className="mt-1 text-xs text-gray-500">Chargement des plans...</p>
              )}
            </div>

            {/* Zone Selection */}
            {createForm.subscription_plan_id && (
              <div>
                <Label htmlFor="zone_id" className="text-sm font-medium">
                  Zone {planZones.length > 1 && <span className="text-red-500">*</span>}
                </Label>
                {loadingZones ? (
                  <p className="mt-1 text-xs text-gray-500">Chargement des zones...</p>
                ) : planZones.length > 1 ? (
                  <select
                    id="zone_id"
                    className="mt-1 w-full appearance-none border border-gray-300 rounded-lg px-4 py-2 text-sm bg-white shadow-sm focus:ring-primary focus:border-primary transition-all pr-10"
                    value={createForm.zone_id}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, zone_id: e.target.value }))}
                    required={planZones.length > 1}
                    style={{
                      backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'20\' height=\'20\' viewBox=\'0 0 20 20\' fill=\'none\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M6 8L10 12L14 8\' stroke=\'%239CA3AF\' stroke-width=\'1.5\' stroke-linecap=\'round\' stroke-linejoin=\'round\'/%3E%3C/svg%3E")',
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 0.75rem center',
                      backgroundSize: '1.25rem 1.25rem',
                    }}
                  >
                    <option value="">Sélectionner une zone</option>
                    {planZones.map((zone) => (
                      <option key={zone.id} value={zone.code}>
                        {zone.name} ({zone.code})
                      </option>
                    ))}
                  </select>
                ) : planZones.length === 1 ? (
                  <>
                    <Input
                      id="zone_id"
                      type="text"
                      value={createForm.zone_id || planZones[0].code}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, zone_id: e.target.value }))}
                      className="mt-1"
                      readOnly
                      style={{ backgroundColor: '#f3f4f6', cursor: 'not-allowed' }}
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Zone sélectionnée automatiquement: {planZones[0].name} ({planZones[0].code})
                    </p>
                  </>
                ) : (
                  <>
                    <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg mb-2">
                      <p className="text-xs text-yellow-800 font-medium mb-1">
                        ⚠️ Aucune zone configurée
                      </p>
                      <p className="text-xs text-yellow-700">
                        Ce plan d'abonnement n'a aucune zone configurée. Veuillez configurer des zones pour ce plan dans les paramètres du plan d'abonnement, ou spécifiez manuellement une zone ci-dessous.
                      </p>
                    </div>
                    <Input
                      id="zone_id"
                      type="text"
                      value={createForm.zone_id}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, zone_id: e.target.value.toUpperCase() }))}
                      className="mt-1"
                      placeholder="Ex: H0, A1, etc."
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Spécifiez manuellement le code de la zone (ex: H0, A1)
                    </p>
                  </>
                )}
              </div>
            )}

            {/* Mode Selection */}
            <div>
              <Label className="text-sm font-medium">
                Mode de création <span className="text-red-500">*</span>
              </Label>
              <div className="mt-2 flex gap-4">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="mode"
                    value="SINGULAR"
                    checked={createForm.mode === "SINGULAR"}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, mode: e.target.value as "SINGULAR" | "BULK" }))}
                    className="text-primary focus:ring-primary"
                  />
                  <span className="text-sm">Création unique</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="mode"
                    value="BULK"
                    checked={createForm.mode === "BULK"}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, mode: e.target.value as "SINGULAR" | "BULK" }))}
                    className="text-primary focus:ring-primary"
                  />
                  <span className="text-sm">Création en masse</span>
                </label>
              </div>
            </div>

            {/* Count Input (for BULK mode) */}
            {createForm.mode === "BULK" && (
              <div>
                <Label htmlFor="count" className="text-sm font-medium">
                  Nombre de QR codes <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="count"
                  type="number"
                  min="1"
                  max="1000"
                  value={createForm.count}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, count: parseInt(e.target.value) || 1 }))}
                  className="mt-1"
                  placeholder="Ex: 10"
                />
                <p className="mt-1 text-xs text-gray-500">Entre 1 et 1000 QR codes</p>
              </div>
            )}

            {/* Porte Selection (only if no QR codes exist) */}
            {!planHasQRCodes && createForm.subscription_plan_id && (
              <div>
                <Label htmlFor="porte" className="text-sm font-medium">
                  Porte (Porte d'entrée)
                </Label>
                <select
                  id="porte"
                  className="mt-1 w-full appearance-none border border-gray-300 rounded-lg px-4 py-2 text-sm bg-white shadow-sm focus:ring-primary focus:border-primary transition-all pr-10"
                  value={createForm.porte || ""}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, porte: e.target.value ? parseInt(e.target.value) : undefined }))}
                  style={{
                    backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'20\' height=\'20\' viewBox=\'0 0 20 20\' fill=\'none\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M6 8L10 12L14 8\' stroke=\'%239CA3AF\' stroke-width=\'1.5\' stroke-linecap=\'round\' stroke-linejoin=\'round\'/%3E%3C/svg%3E")',
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 0.75rem center',
                    backgroundSize: '1.25rem 1.25rem',
                  }}
                >
                  <option value="">Sélectionner une porte (optionnel)</option>
                  <option value="1">Porte 1</option>
                  <option value="2">Porte 2</option>
                  <option value="3">Porte 3</option>
                  <option value="4">Porte 4</option>
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  Sélectionnez la porte d'entrée pour ces QR codes (1-4)
                </p>
              </div>
            )}

            {/* Seat Activation Toggle (only if no QR codes exist) */}
            {!planHasQRCodes && createForm.subscription_plan_id && (
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="activate_seats" className="text-sm font-medium text-gray-700 cursor-pointer">
                      Activer la gestion des sièges
                    </Label>
                    <p className="text-xs text-gray-500 mt-1">
                      Activez cette option si les QR codes doivent être associés à des sièges numérotés
                    </p>
                  </div>
                  <input
                    id="activate_seats"
                    type="checkbox"
                    checked={manualSeatActivation}
                    onChange={(e) => {
                      setManualSeatActivation(e.target.checked);
                      if (!e.target.checked) {
                        setCreateForm(prev => ({ ...prev, seat_row: "", seat_start_number: 1 }));
                        setIsNewSeatRow(false);
                        setLastSeatNumber(null);
                      }
                    }}
                    className="w-5 h-5 text-primary focus:ring-primary rounded"
                  />
                </div>
              </div>
            )}

            {/* Seat Information (if subscription plan has seats OR manually activated) */}
            {(planHasSeats || manualSeatActivation) && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-700">Informations de siège {manualSeatActivation && <span className="text-red-500">*</span>}</h3>
                <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="seat_row" className="text-sm font-medium">
                      Rangée (A, B, C, etc.)
                  </Label>
                  <select
                      id="seat_row"
                    className="mt-1 w-full appearance-none border border-gray-300 rounded-lg px-4 py-2 text-sm bg-white shadow-sm focus:ring-primary focus:border-primary transition-all pr-10"
                      value={isNewSeatRow ? "NEW" : createForm.seat_row}
                      onChange={(e) => {
                        if (e.target.value === "NEW") {
                          setIsNewSeatRow(true);
                          setCreateForm(prev => ({ ...prev, seat_row: "", seat_start_number: 1 }));
                          setLastSeatNumber(null);
                        } else {
                          setIsNewSeatRow(false);
                          setCreateForm(prev => ({ ...prev, seat_row: e.target.value }));
                        }
                      }}
                    style={{
                      backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'20\' height=\'20\' viewBox=\'0 0 20 20\' fill=\'none\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M6 8L10 12L14 8\' stroke=\'%239CA3AF\' stroke-width=\'1.5\' stroke-linecap=\'round\' stroke-linejoin=\'round\'/%3E%3C/svg%3E")',
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 0.75rem center',
                      backgroundSize: '1.25rem 1.25rem',
                    }}
                  >
                      <option value="">Sélectionner une rangée</option>
                      {availableSeatRows.map((row) => (
                        <option key={row} value={row}>
                          Rangée {row}
                        </option>
                      ))}
                      <option value="NEW">+ Nouvelle rangée</option>
                  </select>
                    {isNewSeatRow && (
                      <div className="mt-2">
                  <Input
                    type="text"
                    value={createForm.seat_row}
                          onChange={(e) => {
                            const newRow = e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 1);
                      setCreateForm(prev => ({ ...prev, seat_row: newRow }));
                    }}
                    className="mt-1"
                          placeholder="Ex: A, B, C..."
                    maxLength={1}
                  />
                      </div>
                    )}
                </div>
                <div>
                  <Label htmlFor="seat_start_number" className="text-sm font-medium">
                    Numéro de siège de départ
                  </Label>
                    {!isNewSeatRow && lastSeatNumber !== null && (
                      <div className="mb-2">
                        <p className="text-xs text-gray-500">
                          Dernier numéro: <span className="font-semibold">{lastSeatNumber}</span>
                        </p>
                      </div>
                    )}
                  <Input
                    id="seat_start_number"
                    type="number"
                    value={createForm.seat_start_number}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, seat_start_number: parseInt(e.target.value) || 1 }))}
                    className="mt-1"
                    placeholder="Ex: 1"
                    min={1}
                      readOnly={!isNewSeatRow && lastSeatNumber !== null}
                      style={!isNewSeatRow && lastSeatNumber !== null ? { backgroundColor: '#f3f4f6', cursor: 'not-allowed' } : {}}
                  />
                    {!isNewSeatRow && lastSeatNumber !== null && (
                      <p className="mt-1 text-xs text-gray-500">
                        Le numéro sera incrémenté automatiquement à partir de {lastSeatNumber + 1}
                      </p>
                    )}
                    {createForm.mode === "BULK" && createForm.seat_row && (
                      <p className="mt-1 text-xs text-blue-600">
                        Les sièges seront créés de {createForm.seat_start_number} à {createForm.seat_start_number + createForm.count - 1} pour la rangée {createForm.seat_row}
                      </p>
                    )}
                </div>
              </div>
            </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Annuler
            </Button>
            <Button onClick={handlePreview} disabled={previewLoading || !createForm.subscription_plan_id}>
              {previewLoading ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Génération de l'aperçu...
                </>
              ) : (
                <>
                  <Eye className="mr-2 h-4 w-4" />
                  Aperçu
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Modal */}
      <Dialog open={showPreviewModal} onOpenChange={setShowPreviewModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Aperçu de la création de QR Codes
            </DialogTitle>
            <DialogDescription>
              Vérifiez les détails avant de confirmer la création
            </DialogDescription>
          </DialogHeader>
          
          {previewData && (
            <div className="space-y-6">
              {/* Subscription Plan Info */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-3 text-blue-800">Plan d'abonnement</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-blue-600">Nom</Label>
                    <p className="text-lg font-semibold text-blue-900">{previewData.subscriptionPlan.name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-blue-600">Code</Label>
                    <p className="text-lg font-mono text-blue-900">{previewData.subscriptionPlan.code}</p>
                  </div>
                </div>
              </div>

              {/* Configuration */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-3 text-gray-800">Configuration</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Zone</Label>
                    <p className="text-lg font-mono text-gray-900">{previewData.zone}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Suffixe</Label>
                    <p className="text-lg font-mono text-gray-900">{previewData.suffix}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Type de carte</Label>
                    <p className="text-lg text-gray-900">{previewData.cardType}</p>
                  </div>
                </div>
              </div>

              {/* Serial Numbers */}
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-3 text-green-800">Numéros de série</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-green-600">Début</Label>
                    <p className="text-lg font-mono text-green-900">{previewData.serialNumberRange.start}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-green-600">Fin</Label>
                    <p className="text-lg font-mono text-green-900">{previewData.serialNumberRange.end}</p>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-sm font-medium text-green-600">Nombre de QR codes</Label>
                    <p className="text-lg font-semibold text-green-900">{previewData.count}</p>
                  </div>
                </div>
              </div>

              {/* Capacity */}
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-3 text-yellow-800">Capacité maximale du plan</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-yellow-600">Avant création</Label>
                    <p className="text-lg font-semibold text-yellow-900">{previewData.estimatedCapacity.max_before}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-yellow-600">Après création</Label>
                    <p className="text-lg font-semibold text-yellow-900">{previewData.estimatedCapacity.max_after}</p>
                  </div>
                  </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowPreviewModal(false);
              setShowCreateModal(true);
            }}>
              Retour
            </Button>
            <Button onClick={handleCreateQRCode} disabled={createLoading}>
              {createLoading ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Création...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Confirmer et créer
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Export Modal */}
      <Dialog open={showExportModal} onOpenChange={setShowExportModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Export des QR Codes créés
            </DialogTitle>
            <DialogDescription>
              {createdQRCodeIds.length} QR code(s) créé(s) avec succès. Souhaitez-vous les exporter maintenant ?
            </DialogDescription>
          </DialogHeader>
          
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-800">
              L'export contiendra: QR Code, Clé d'onboarding, Numéro de série
            </p>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowExportModal(false);
              setCreatedQRCodeIds([]);
            }}>
              Plus tard
            </Button>
            <Button onClick={handleExportCreated}>
              <Download className="mr-2 h-4 w-4" />
              Exporter maintenant
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View QR Code Modal */}
      <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              Détails du QR Code
            </DialogTitle>
          </DialogHeader>
          
          {selectedQRCode && (
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-3 text-gray-800">Informations de base</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Code QR</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-lg font-mono bg-white px-2 py-1 rounded border">{selectedQRCode.code}</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(selectedQRCode.code)}
                        className="h-8 w-8 p-0"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Numéro de série</Label>
                    <p className="text-lg font-mono bg-white px-2 py-1 rounded border mt-1">
                      {selectedQRCode.metadata?.serial_number || "N/A"}
                    </p>
                  </div>
                  

                  
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Statut</Label>
                    <div className="mt-1">{getStatusBadge(selectedQRCode.status)}</div>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Siège</Label>
                    <div className="flex items-center gap-2 mt-1">
                      {(selectedQRCode.seatNumber || selectedQRCode.metadata?.seat_number || selectedQRCode.metadata?.seat) ? (
                        <>
                          <MapPin className="h-4 w-4 text-gray-500" />
                          <span className="text-lg">{selectedQRCode.seatNumber || selectedQRCode.metadata?.seat_number || selectedQRCode.metadata?.seat}</span>
                        </>
                      ) : (
                        <span className="text-gray-400">Aucun siège assigné</span>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Zone</Label>
                    <div className="flex items-center gap-2 mt-1">
                      {(selectedQRCode.metadata?.zone_name || selectedQRCode.metadata?.zone) ? (
                        <>
                          <Building className="h-4 w-4 text-gray-500" />
                          <span className="text-lg">{selectedQRCode.metadata?.zone_name || selectedQRCode.metadata?.zone}</span>
                        </>
                      ) : (
                        <span className="text-gray-400">Aucune zone assignée</span>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Porte d'accès</Label>
                    <div className="flex items-center gap-2 mt-1">
                      {(selectedQRCode.metadata?.entry_gate || selectedQRCode.metadata?.access_gate) ? (
                        <>
                          <DoorOpen className="h-4 w-4 text-gray-500" />
                          <span className="text-lg">{selectedQRCode.metadata?.entry_gate || selectedQRCode.metadata?.access_gate}</span>
                        </>
                      ) : (
                        <span className="text-gray-400">Non spécifiée</span>
                      )}
                    </div>
                  </div>
                  

                </div>
              </div>

              {/* Subscriber Information Section */}
              {selectedQRCode.subscriptionInfo && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-3 text-blue-800">Informations de l'abonné</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedQRCode.subscriptionInfo.user && (
                      <>
                        <div>
                          <Label className="text-sm font-medium text-blue-600">Nom complet</Label>
                          <p className="text-lg font-semibold text-blue-900 mt-1">
                            {selectedQRCode.subscriptionInfo.user.first_name} {selectedQRCode.subscriptionInfo.user.last_name}
                          </p>
                        </div>
                        
                        <div>
                          <Label className="text-sm font-medium text-blue-600">Email</Label>
                          <p className="text-lg text-blue-900 mt-1">{selectedQRCode.subscriptionInfo.user.email}</p>
                        </div>
                      </>
                    )}
                    
                    <div>
                      <Label className="text-sm font-medium text-blue-600">Numéro d'abonnement</Label>
                      <p className="text-lg font-mono text-blue-900 mt-1">{selectedQRCode.subscriptionInfo.subscription_number}</p>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium text-blue-600">Statut de l'abonnement</Label>
                      <div className="mt-1">
                        <Badge variant={selectedQRCode.subscriptionInfo.status === 'ACTIVE' ? 'default' : 'secondary'}>
                          {selectedQRCode.subscriptionInfo.status}
                        </Badge>
                      </div>
                    </div>
                    
                    {selectedQRCode.subscriptionInfo.subscription_plan && (
                      <>
                        <div>
                          <Label className="text-sm font-medium text-blue-600">Plan d'abonnement</Label>
                          <p className="text-lg text-blue-900 mt-1">{selectedQRCode.subscriptionInfo.subscription_plan.name}</p>
                        </div>
                        
                        <div>
                          <Label className="text-sm font-medium text-blue-600">Type</Label>
                          <p className="text-lg text-blue-900 mt-1">{selectedQRCode.subscriptionInfo.subscription_plan.type}</p>
                        </div>
                      </>
                    )}
                    
                    <div>
                      <Label className="text-sm font-medium text-blue-600">Prix payé</Label>
                      <p className="text-lg font-semibold text-green-600 mt-1">
                        {selectedQRCode.subscriptionInfo.price_paid} {selectedQRCode.subscriptionInfo.currency}
                      </p>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium text-blue-600">Période de validité</Label>
                      <p className="text-lg text-blue-900 mt-1">
                        {formatDate(selectedQRCode.subscriptionInfo.start_date)} - {formatDate(selectedQRCode.subscriptionInfo.end_date)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Dates and Timeline */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-3 text-gray-800">Historique et dates</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Créé le</Label>
                    <p className="text-lg">{formatDate(selectedQRCode.createdAt)}</p>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Dernière modification</Label>
                    <p className="text-lg">{formatDate(selectedQRCode.updatedAt)}</p>
                  </div>
                  
                  {selectedQRCode.assignedAt && (
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Assigné le</Label>
                      <p className="text-lg">{formatDate(selectedQRCode.assignedAt)}</p>
                    </div>
                  )}
                  
                  {selectedQRCode.metadata?.printed_at && (
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Imprimé le</Label>
                      <p className="text-lg">{formatDate(selectedQRCode.metadata.printed_at)}</p>
                    </div>
                  )}
                </div>
              </div>



              {/* Reset Information */}
              {selectedQRCode.metadata?.reseted && (
                <div className="bg-red-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-3 text-red-800 flex items-center gap-2">
                    <RefreshCw className="h-5 w-5" />
                    QR Code Réinitialisé
                  </h3>
                  <div className="space-y-4">
                    {selectedQRCode.metadata.previous_assignment && (
                      <div className="bg-white p-3 rounded border">
                        <h4 className="font-medium text-red-800 mb-2">Assignation précédente</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-gray-600">Plan d'abonnement:</span>
                            <p className="font-medium">{selectedQRCode.metadata.previous_assignment.subscription_plan_name || 'N/A'}</p>
                          </div>
                          <div>
                            <span className="text-gray-600">Statut précédent:</span>
                            <p className="font-medium">{selectedQRCode.metadata.previous_assignment.status}</p>
                          </div>
                          <div>
                            <span className="text-gray-600">Assigné le:</span>
                            <p className="font-medium">{formatDate(selectedQRCode.metadata.previous_assignment.assigned_at)}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {selectedQRCode.metadata.deletedSubscription && (
                      <div className="bg-white p-3 rounded border">
                        <h4 className="font-medium text-red-800 mb-2">Abonnement supprimé</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-gray-600">Numéro:</span>
                            <p className="font-medium">{selectedQRCode.metadata.deletedSubscription.subscription_number}</p>
                          </div>
                          <div>
                            <span className="text-gray-600">Nom:</span>
                            <p className="font-medium">{selectedQRCode.metadata.deletedSubscription.name}</p>
                          </div>
                          <div>
                            <span className="text-gray-600">Prix:</span>
                            <p className="font-medium">
                              {selectedQRCode.metadata.deletedSubscription.price} {selectedQRCode.metadata.deletedSubscription.currency}
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-600">Créé le:</span>
                            <p className="font-medium">{formatDate(selectedQRCode.metadata.deletedSubscription.created_at)}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Reservation Information */}
              {selectedQRCode.status === QRCodeStatus.RESERVED && selectedQRCode.metadata?.reservation && (
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-3 text-yellow-800 flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Informations de réservation
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-yellow-600">Réservé pour</Label>
                      <p className="text-lg font-semibold text-yellow-800">{selectedQRCode.metadata.reservation.reservedFor}</p>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium text-yellow-600">Réservé jusqu'au</Label>
                      <p className="text-lg font-semibold text-yellow-800">{formatDate(selectedQRCode.metadata.reservation.reservedUntil)}</p>
                    </div>
                    
                    {selectedQRCode.metadata.reservation.note && (
                      <div className="md:col-span-2">
                        <Label className="text-sm font-medium text-yellow-600">Note</Label>
                        <p className="text-lg text-yellow-800 bg-white p-2 rounded border">{selectedQRCode.metadata.reservation.note}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Reset History */}
              {selectedQRCode.metadata?.reset_history && selectedQRCode.metadata.reset_history.length > 0 && (
                <div className="bg-red-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-3 text-red-800 flex items-center gap-2">
                    <RefreshCw className="h-5 w-5" />
                    Historique des réinitialisations
                  </h3>
                  <div className="space-y-2">
                    {selectedQRCode.metadata.reset_history.map((reset: any, index: number) => (
                      <div key={index} className="bg-white p-3 rounded border">
                        <div className="space-y-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium text-red-800">{formatDate(reset.resetAt)}</p>
                              <p className="text-sm text-red-600">{reset.reason}</p>
                            </div>
                            <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                              Par: {reset.resetBy}
                            </span>
                          </div>
                          
                          <div className="text-xs text-gray-600 space-y-1">
                            <div>
                              <span className="font-medium">Statut précédent:</span> {reset.previousStatus}
                            </div>
                            {reset.previousSubscriptionPlanName && (
                              <div>
                                <span className="font-medium">Plan d'abonnement:</span> {reset.previousSubscriptionPlanName}
                              </div>
                            )}
                            {reset.deletedSubscription && (
                              <div className="mt-2 p-2 bg-gray-50 rounded">
                                <p className="font-medium text-gray-700">Abonnement supprimé:</p>
                                <p className="text-xs">{reset.deletedSubscription.subscription_number} - {reset.deletedSubscription.name}</p>
                                <p className="text-xs">{reset.deletedSubscription.price} {reset.deletedSubscription.currency}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}


            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowViewModal(false)}>
              Fermer
            </Button>
            <Button onClick={() => copyToClipboard(selectedQRCode?.code || "")}>
              <Copy className="h-4 w-4 mr-2" />
              Copier le code
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      {/* Bulk Delete Modal */}
      <Dialog open={showBulkDeleteModal} onOpenChange={setShowBulkDeleteModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-600" />
              Supprimer plusieurs QR Codes
            </DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer {selectedQRCodeIds.size} QR code(s) ? Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Note importante :</strong> Les QR codes assignés ne peuvent pas être supprimés. 
              Ils devront être réinitialisés avant de pouvoir être supprimés.
            </p>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">
              <strong>{selectedQRCodeIds.size}</strong> QR code(s) seront traités. 
              Seuls les QR codes non assignés seront supprimés.
            </p>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulkDeleteModal(false)}>
              Annuler
            </Button>
            <Button 
              onClick={handleBulkDelete} 
              disabled={bulkDeleteLoading}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {bulkDeleteLoading ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Suppression...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Supprimer ({selectedQRCodeIds.size})
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete QR Code Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-600" />
              Supprimer le QR Code
            </DialogTitle>
            <DialogDescription>
              {selectedQRCode && selectedQRCode.status === QRCodeStatus.ASSIGNED ? (
                <div className="space-y-2">
                  <p className="text-red-600 font-medium">
                    Ce QR code est actuellement assigné et ne peut pas être supprimé directement.
                  </p>
                  <p className="text-sm text-gray-600">
                    Veuillez d'abord le réinitialiser pour le libérer de son assignation, puis vous pourrez le supprimer.
                  </p>
                </div>
              ) : (
                <p>
                  Êtes-vous sûr de vouloir supprimer ce QR code ? Cette action est irréversible.
                </p>
              )}
            </DialogDescription>
          </DialogHeader>
          
          {selectedQRCode && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="space-y-2">
                <div>
                  <span className="text-sm font-medium text-gray-600">Code QR:</span>
                  <p className="text-sm font-mono text-gray-900">{selectedQRCode.code}</p>
                </div>
                {selectedQRCode.metadata?.serial_number && (
                  <div>
                    <span className="text-sm font-medium text-gray-600">Numéro de série:</span>
                    <p className="text-sm font-mono text-gray-900">{selectedQRCode.metadata.serial_number}</p>
                  </div>
                )}
                <div>
                  <span className="text-sm font-medium text-gray-600">Statut:</span>
                  <div className="mt-1">{getStatusBadge(selectedQRCode.status)}</div>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
              Annuler
            </Button>
            {selectedQRCode && selectedQRCode.status === QRCodeStatus.ASSIGNED ? (
              <Button onClick={() => {
                setShowDeleteModal(false);
                setShowResetModal(true);
              }}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Réinitialiser d'abord
              </Button>
            ) : (
              <Button 
                onClick={handleDeleteQRCode} 
                disabled={actionLoading}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {actionLoading ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Suppression...
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Supprimer
                  </>
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      </div>
  );
}

 