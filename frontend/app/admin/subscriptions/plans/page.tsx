"use client";

import { useEffect, useState } from "react";
import { config, storage, STORAGE_KEYS } from "@/lib/config";
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
  Plus, 
  Crown, 
  TrendingUp, 
  CheckCircle, 
  Clock,
  Filter,
  Calendar,
  Users,
  Eye,
  MoreHorizontal,
  Edit,
  Trash2
} from "lucide-react";
import { CustomCurrencyIcon } from "@/components/ui/custom-currency-icon";
import { useToast } from "@/hooks/use-toast";
import { useSession } from "next-auth/react";
import type { SubscriptionPlan, User } from "@/types";
import SubscriptionPlanCreateModal from "@/components/admin/SubscriptionPlanCreateModal";
import SubscriptionPlanDetailsModal from "@/components/admin/SubscriptionPlanDetailsModal";
import { DataTable } from "@/components/ui/data-table"
import apiClient from "@/lib/api"
import { subscriptionPlansApi } from "@/lib/api/subscription-plans"
import { venuesApi } from "@/lib/api/venues"
import { zonesApi } from "@/lib/api/zones"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"

export default function AdminSubscriptionPlansPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [allPlans, setAllPlans] = useState<SubscriptionPlan[]>([]); // Store all plans for filtering
  const [organizers, setOrganizers] = useState<any[]>([]);
  const [venues, setVenues] = useState<Array<{ id: string; name: string; city?: string }>>([]);
  const [zones, setZones] = useState<Array<{ id: string; mapping_id?: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [loadingVenues, setLoadingVenues] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [organizerFilter, setOrganizerFilter] = useState(() => {
    // Try to get from localStorage first, then config, then default
    const saved = storage.get<string>(STORAGE_KEYS.SELECTED_ORGANIZER);
    console.log("🔍 Debug - Saved organizer from localStorage:", saved);
    
    if (saved) return saved;
    
    const defaultOrg = config.organizer.getOrganizerId();
    console.log("🔍 Debug - Default organizer from config:", defaultOrg);
    
    if (defaultOrg) return defaultOrg;
    
    console.log("🔍 Debug - Using 'all' as fallback");
    return "all";
  });
  
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [venueFilter, setVenueFilter] = useState<string>("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const { toast } = useToast();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";
  
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    onSale: 0,
    totalRevenue: 0,
  });

  useEffect(() => {
    fetchPlans();
    fetchStats();
    fetchOrganizers();
    fetchVenues();
    fetchZones();
  }, [searchTerm, organizerFilter, statusFilter, typeFilter, venueFilter]);

  // Save preferences to localStorage when they change
  useEffect(() => {
    storage.set(STORAGE_KEYS.SELECTED_ORGANIZER, organizerFilter);
  }, [organizerFilter]);

  const fetchOrganizers = async () => {
    try {
      // Get the default organizer from environment config
      const defaultOrganizerId = config.organizer.getOrganizerId();
      console.log("🔍 Debug - Default organizer ID from env:", defaultOrganizerId);
      
      if (defaultOrganizerId) {
        const organizerInfo = config.organizer.getOrganizerInfo();
        console.log("🔍 Debug - Organizer info:", organizerInfo);
        setOrganizers([organizerInfo]);
      } else {
        console.log("🔍 Debug - No default organizer found in env");
        setOrganizers([]);
      }
    } catch (error) {
      console.error("Error fetching organizers:", error);
      setOrganizers([]);
    }
  };

  const fetchVenues = async () => {
    setLoadingVenues(true);
    try {
      const response = await venuesApi.getAll({ limit: 1000 });
      if (response && response.success && Array.isArray(response.data)) {
        setVenues(response.data);
      } else {
        setVenues([]);
      }
    } catch (error) {
      console.error("Error fetching venues:", error);
      setVenues([]);
    } finally {
      setLoadingVenues(false);
    }
  };

  const fetchZones = async () => {
    try {
      const response = await zonesApi.getAll({ active: true });
      if (response && response.success && Array.isArray(response.data)) {
        setZones(response.data);
      } else {
        setZones([]);
      }
    } catch (error) {
      console.error("Error fetching zones:", error);
      setZones([]);
    }
  };

  const fetchPlans = async () => {
    setLoading(true);
    try {
      console.log("🔍 Debug - Current state:", {
        organizerFilter,
        statusFilter,
        searchTerm
      });
      
      // Use the default organizer ID to get all plans
      const organizerId = organizerFilter !== "all" ? organizerFilter : config.organizer.getOrganizerId();
      console.log("📡 Calling getAllPlansByOrganizer with:", organizerId);
      // Add cache-busting timestamp to ensure fresh data
      const timestamp = Date.now();
      const response = await apiClient.getAllPlansByOrganizer(organizerId);
      console.log("📡 getAllPlansByOrganizer response:", response);
      const plansData = Array.isArray(response) ? response : [];
      
      // Debug: Log the actual data structure
      console.log("📊 Raw plans data:", plansData);
      if (plansData.length > 0) {
        console.log("📊 First plan structure:", plansData[0]);
        console.log("📊 First plan activeSubscriptions:", plansData[0].activeSubscriptions);
        console.log("📊 First plan currentSubscribers:", plansData[0].currentSubscribers);
        console.log("📊 First plan validFrom:", plansData[0].validFrom);
        console.log("📊 First plan validUntil:", plansData[0].validUntil);
      }
      
      console.log("📊 Plans data received:", plansData);
      
      // Always update allPlans first with fresh data
      setAllPlans([...plansData]);
      
      // Apply additional filters
      let filteredPlans = [...plansData];
      
      if (searchTerm) {
        filteredPlans = filteredPlans.filter((plan: any) => 
          plan.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          plan.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          plan.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
          plan.code?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      
      if (statusFilter !== "all") {
        filteredPlans = filteredPlans.filter((plan: any) => {
          if (statusFilter === "active") return plan.isActive;
          if (statusFilter === "inactive") return !plan.isActive;
          if (statusFilter === "onSale") return plan.isCurrentlyOnSale;
          return true;
        });
      }
      
      if (typeFilter !== "all") {
        filteredPlans = filteredPlans.filter((plan: any) => plan.type === typeFilter);
      }

      // Filter by venue (through zones) - async operation
      if (venueFilter !== "all") {
        // Fetch zones for this specific venue
        zonesApi.getAll({ active: true, venue_id: venueFilter })
          .then((venueZonesResponse) => {
            if (venueZonesResponse && venueZonesResponse.success && Array.isArray(venueZonesResponse.data)) {
              const venueZoneIds = new Set(venueZonesResponse.data.map(z => z.id));
              
              const venueFilteredPlans = filteredPlans.filter((plan: any) => {
                // Check if plan has zones
                if (!plan.zones || !Array.isArray(plan.zones) || plan.zones.length === 0) {
                  return false; // Plans without zones don't match venue filter
                }
                
                // Get zone IDs from the plan
                const planZoneIds = plan.zones.map((z: any) => z.id || z.zone_id).filter(Boolean);
                
                // Check if any of the plan's zones belong to the selected venue
                return planZoneIds.some((zoneId: string) => venueZoneIds.has(zoneId));
              });
              
              // Force state update with new array reference
              setPlans([...venueFilteredPlans]);
            } else {
              setPlans([]);
            }
          })
          .catch((error) => {
            console.error("Error fetching venue zones:", error);
            setPlans([]);
          });
      } else {
        // Force state update with new array reference
        setPlans([...filteredPlans]);
      }
      
      // Compute stats with better data handling
      const total = plansData.length;
      const active = plansData.filter((p: any) => p.isActive).length;
      const inactive = plansData.filter((p: any) => !p.isActive).length;
      const onSale = plansData.filter((p: any) => p.isCurrentlyOnSale).length;
      
      console.log("📊 Stats calculated:", {
        total,
        active,
        inactive,
        onSale,
        samplePlan: plansData[0] ? {
          name: plansData[0].name,
          activeSubscriptions: plansData[0].activeSubscriptions,
          currentSubscribers: plansData[0].currentSubscribers,
          maxSubscribers: plansData[0].maxSubscribers,
          validFrom: plansData[0].validFrom,
          validUntil: plansData[0].validUntil
        } : null
      });
      
      setStats({
        total,
        active,
        inactive,
        onSale,
        totalRevenue: 0, // Will be updated by fetchStats
      });
    } catch (error) {
      console.error("Error fetching plans:", error);
      toast({ 
        title: "Erreur lors du chargement des plans", 
        description: "Impossible de récupérer les plans d'abonnement",
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // Use the same stats API as the subscriptions page
      const organizerId = organizerFilter !== "all" ? organizerFilter : config.organizer.getOrganizerId();
      const statsData = await apiClient.getSubscriptionsStats({ organizerId });
      
      console.log("📊 Stats data from API:", statsData);
      
      if (statsData && typeof statsData === 'object' && 'total_revenue' in statsData) {
        setStats(prevStats => ({
          ...prevStats,
          totalRevenue: Number(statsData.total_revenue) || 0,
        }));
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
      // Don't show error toast for stats as it's not critical
    }
  };

  const handleCreatePlan = () => {
    setSelectedPlan(null);
    setShowCreateModal(true);
  };



  const handleViewPlan = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setShowDetailsModal(true);
  };

  const handleEditPlan = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setShowEditModal(true);
  };

  const handleDeletePlan = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedPlan) return;

    setActionLoading(true);
    try {
      await subscriptionPlansApi.delete(selectedPlan.id);
      setShowDeleteModal(false);
      setSelectedPlan(null);
      // Small delay to ensure backend cache is cleared
      await new Promise(resolve => setTimeout(resolve, 200));
      await fetchPlans();
      await fetchStats();
      // Notify other pages about the change
      window.dispatchEvent(new Event('subscriptionPlanChanged'));
      toast({
        title: "Succès",
        description: "Plan d'abonnement supprimé avec succès",
      });
    } catch (error: any) {
      console.error("Error deleting plan:", error);
      toast({
        title: "Erreur",
        description: error?.response?.data?.message || "Impossible de supprimer le plan d'abonnement",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (plan: any) => {
    if (!plan.isActive) {
      return <Badge variant="secondary">Inactif</Badge>;
    }
    if (plan.isCurrentlyOnSale) {
      return <Badge variant="default">En vente</Badge>;
    }
    return <Badge variant="outline">Actif</Badge>;
  };

  const formatPrice = (price: number, currency: string = "TND") => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency,
    }).format(price);
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      // Check if date is valid (not NaN)
      if (isNaN(date.getTime())) return "-";
      return date.toLocaleDateString('fr-FR');
    } catch (error) {
      return "-";
    }
  };

  const getTypeDisplayName = (type: string) => {
    switch (type) {
      case 'VIP': return 'VIP';
      case 'FULL_SEASON': return 'Saison Complète';
      case 'FLEX': return 'Flexible';
      case 'PREMIUM': return 'Premium';
      default: return type;
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar type="admin" />
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="px-8 w-full">
          <PageHeader
            title="Gestion des Types d'Abonnement"
            description="Gérez tous les types d'abonnement de votre plateforme"
          >
            <Button 
              onClick={handleCreatePlan}
              className="ml-auto"
            >
              <Plus className="mr-2 h-4 w-4" />
              Créer un Plan
            </Button>
          </PageHeader>
          
          <div className="flex-1 overflow-auto pt-6 pb-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Crown className="h-4 w-4 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Types</p>
                    <p className="text-2xl font-bold">{stats.total}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Actifs</p>
                    <p className="text-2xl font-bold">{stats.active}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-gray-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Inactifs</p>
                    <p className="text-2xl font-bold">{stats.inactive}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4 text-orange-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">En Vente</p>
                    <p className="text-2xl font-bold">{stats.onSale}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <CustomCurrencyIcon className="h-4 w-4 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Revenus</p>
                    <p className="text-2xl font-bold">{formatPrice(stats.totalRevenue)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

            {/* Filters and Actions */}
            <Card className="mb-6">
              <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                <div className="flex flex-col sm:flex-row gap-4 flex-1">
                  {/* Search */}
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Rechercher un type..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  
                  {/* Type Filter */}
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">Tous les Types</option>
                    <option value="VIP">VIP</option>
                    <option value="FULL_SEASON">Saison Complète</option>
                    <option value="FLEX">Flexible</option>
                    <option value="PREMIUM">Premium</option>
                  </select>
                  

                  
                  {/* Status Filter */}
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">Tous les statuts</option>
                    <option value="active">Actifs</option>
                    <option value="inactive">Inactifs</option>
                    <option value="onSale">En vente</option>
                  </select>

                  {/* Venue Filter */}
                  <Select value={venueFilter} onValueChange={setVenueFilter} disabled={loadingVenues}>
                    <SelectTrigger className="w-full md:w-[200px]">
                      <SelectValue placeholder={loadingVenues ? "Chargement..." : "Lieu"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les lieux</SelectItem>
                      {venues.map((venue) => (
                        <SelectItem key={venue.id} value={venue.id}>
                          {venue.name} {venue.city ? `(${venue.city})` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Refresh Button */}
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      fetchPlans();
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
                </div>
              </div>
            </CardContent>
          </Card>

            {/* Plans List */}
            <Card>
            <CardHeader>
              <CardTitle>Types d'Abonnement</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <LoadingSpinner />
                </div>
              ) : plans.length === 0 ? (
                <EmptyState
                  icon={<Crown className="h-12 w-12" />}
                  title="Aucun plan trouvé"
                  description="Aucun type d'abonnement ne correspond à vos critères de recherche."
                />
              ) : (
                <div className="space-y-4">
                  {plans.map((plan: any) => (
                    <div
                      key={plan.id}
                      className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold">{plan.name}</h3>
                            {getStatusBadge(plan)}
                            {plan.code && (
                              <Badge variant="outline">{plan.code}</Badge>
                            )}
                            <Badge variant="secondary">{getTypeDisplayName(plan.type)}</Badge>
                          </div>
                          
                          <p className="text-gray-600 mb-3">
                            {plan.description || "Aucune description"}
                          </p>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div className="flex items-center gap-2">
                              <CustomCurrencyIcon className="h-4 w-4 text-gray-400" />
                              <span className="font-medium">{formatPrice(plan.price, plan.currency)}</span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-gray-400" />
                              <span>{plan.activeSubscriptions || 0} abonnés actifs</span>
                            </div>
                            
                            {plan.maxSubscribers ? (
                              <div className="flex items-center gap-2">
                                <TrendingUp className="h-4 w-4 text-gray-400" />
                                <span>{plan.activeSubscriptions || 0}/{plan.maxSubscribers} places</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <TrendingUp className="h-4 w-4 text-gray-400" />
                                <span>Places illimitées</span>
                              </div>
                            )}
                            
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-gray-400" />
                              <span>Valide du {formatDate(plan.validFrom)}</span>
                            </div>
                          </div>
                          
                          {plan.organizer && (
                            <div className="mt-3 text-sm text-gray-500">
                              Organisateur: {plan.organizer.name}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2 ml-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewPlan(plan)}
                            title="Voir les détails"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditPlan(plan)}
                            title="Modifier"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeletePlan(plan)}
                            title="Supprimer"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showCreateModal && (
        <SubscriptionPlanCreateModal
          organizers={organizers}
          onClose={() => {
            setShowCreateModal(false);
            setSelectedPlan(null);
          }}
          onSuccess={async () => {
            setShowCreateModal(false);
            setSelectedPlan(null);
            // Small delay to ensure backend cache is cleared
            await new Promise(resolve => setTimeout(resolve, 200));
            await fetchPlans();
            await fetchStats();
            // Notify other pages about the change
            window.dispatchEvent(new Event('subscriptionPlanChanged'));
            toast({ 
              title: "Succès", 
              description: "Plan créé avec succès" 
            });
          }}
        />
      )}
      
      {showDetailsModal && selectedPlan && (
        <SubscriptionPlanDetailsModal
          plan={selectedPlan}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedPlan(null);
          }}
        />
      )}

      {showEditModal && selectedPlan && (
        <SubscriptionPlanCreateModal
          organizers={organizers}
          plan={selectedPlan}
          onClose={() => {
            setShowEditModal(false);
            setSelectedPlan(null);
          }}
          onSuccess={async () => {
            setShowEditModal(false);
            setSelectedPlan(null);
            // Small delay to ensure backend cache is cleared
            await new Promise(resolve => setTimeout(resolve, 200));
            await fetchPlans();
            await fetchStats();
            // Notify other pages about the change
            window.dispatchEvent(new Event('subscriptionPlanChanged'));
            toast({ 
              title: "Succès", 
              description: "Plan modifié avec succès" 
            });
          }}
        />
      )}

      {showDeleteModal && selectedPlan && (
        <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Supprimer le plan d'abonnement</DialogTitle>
              <DialogDescription>
                Êtes-vous sûr de vouloir supprimer le plan "{selectedPlan.name}" ?
                {selectedPlan.activeSubscriptions && selectedPlan.activeSubscriptions > 0 && (
                  <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <p className="text-sm text-yellow-800">
                      ⚠️ Ce plan a {selectedPlan.activeSubscriptions} abonnement(s) actif(s). 
                      La suppression ne sera possible que si aucun abonnement actif n'est associé à ce plan.
                    </p>
                  </div>
                )}
                {(!selectedPlan.activeSubscriptions || selectedPlan.activeSubscriptions === 0) && (
                  <p className="mt-2 text-sm text-gray-600">
                    Cette action est irréversible. Le plan sera définitivement supprimé.
                  </p>
                )}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedPlan(null);
                }}
                disabled={actionLoading}
              >
                Annuler
              </Button>
              <Button
                variant="destructive"
                onClick={handleConfirmDelete}
                disabled={actionLoading}
              >
                {actionLoading ? "Suppression..." : "Supprimer"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
} 