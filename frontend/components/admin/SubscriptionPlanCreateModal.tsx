"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { X, Plus, Trash2, Calendar, Users, Crown, Star, MapPin, Search, CheckCircle2, Circle, Building2, Grid3x3 } from "lucide-react";
import { CustomCurrencyIcon } from "@/components/ui/custom-currency-icon";
import { useToast } from "@/hooks/use-toast";
import { useSession } from "next-auth/react";
import { subscriptionPlansApi } from "@/lib/api/subscription-plans";
import { zonesApi } from "@/lib/api/zones";
import { venuesApi } from "@/lib/api/venues";
import { eventsApi } from "@/lib/api/events";
import { SeasonSelector } from "@/components/admin/SeasonSelector";
import { DEFAULT_SUBSCRIPTION_SEASON } from "@/lib/seasons";
import { config } from "@/lib/config";
import type { SubscriptionPlan } from "@/types";

interface SubscriptionPlanCreateModalProps {
  organizers: any[];
  plan?: SubscriptionPlan | null;
  defaultSeason?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function SubscriptionPlanCreateModal({
  organizers,
  plan,
  defaultSeason = DEFAULT_SUBSCRIPTION_SEASON,
  onClose,
  onSuccess
}: SubscriptionPlanCreateModalProps) {
  const isEditMode = !!plan;
  const [planScope, setPlanScope] = useState<"season" | "event">("season");
  const [selectedEventIds, setSelectedEventIds] = useState<string[]>([]);
  const [availableEvents, setAvailableEvents] = useState<Array<{ id: string; name: string; scheduled_start?: string }>>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [selectedSeason, setSelectedSeason] = useState(defaultSeason);
  const [loading, setLoading] = useState(false);
  const [zones, setZones] = useState<Array<{ id: string; code: string; name: string }>>([]);
  const [loadingZones, setLoadingZones] = useState(false);
  const [venues, setVenues] = useState<Array<{ id: string; name: string; city?: string }>>([]);
  const [loadingVenues, setLoadingVenues] = useState(false);
  const [selectedVenueId, setSelectedVenueId] = useState<string>("all");
  const [selectedZones, setSelectedZones] = useState<string[]>([]);
  const [zoneSearchTerm, setZoneSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    organizer_id: "",
    name: "",
    code: "",
    description: "",
    type: "SEASON",
    price: 0,
    currency: "TND",
    is_active: true,
    max_subscribers: null as number | null,
    current_subscribers: 0,
    valid_from: "",
    valid_until: "",
    sale_start_date: "",
    sale_end_date: "",
    transferable: false,
    max_transfers: 0,
    auto_renew: false,
    includes_playoffs: false,
    priority_booking: false,
    benefits: [] as string[],
    restrictions: [] as string[],
    metadata: {}
  });

  const [newBenefit, setNewBenefit] = useState("");
  const [newRestriction, setNewRestriction] = useState("");

  const { toast } = useToast();
  const { data: session } = useSession();

  // Fetch venues on component mount
  useEffect(() => {
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
    fetchVenues();
  }, []);

  // Fetch zones based on selected venue
  useEffect(() => {
    const fetchZones = async () => {
      setLoadingZones(true);
      try {
        console.log("🔍 Fetching zones from zones API...");
        const params: any = { active: true };
        
        // Add venue filter if a venue is selected
        if (selectedVenueId && selectedVenueId !== "all") {
          params.venue_id = selectedVenueId;
        }
        
        const response = await zonesApi.getAll(params);
        console.log("🔍 Zones API response:", response);
        
        if (response && response.success && Array.isArray(response.data)) {
          console.log("🔍 Number of zones:", response.data.length);
          if (response.data.length > 0) {
            console.log("🔍 First zone:", response.data[0]);
          }
          setZones(response.data);
          // Clear selected zones when venue changes (optional - you might want to keep them)
          // setSelectedZones([]);
        } else {
          console.warn("⚠️ Unexpected zones response format:", response);
          setZones([]);
        }
      } catch (error) {
        console.error("❌ Error fetching zones:", error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les zones",
          variant: "destructive"
        });
        setZones([]);
      } finally {
        setLoadingZones(false);
      }
    };
    fetchZones();
  }, [selectedVenueId]);

  useEffect(() => {
    if (planScope !== "event") return;
    const loadEvents = async () => {
      setLoadingEvents(true);
      try {
        const res = await eventsApi.getEvents(1, 100, {}, true);
        setAvailableEvents(res.events || []);
      } catch {
        setAvailableEvents([]);
      } finally {
        setLoadingEvents(false);
      }
    };
    loadEvents();
  }, [planScope]);

  useEffect(() => {
    if (plan) {
      // Populate form with existing plan data for edit mode
      setFormData({
        organizer_id: plan.organizer_id || "",
        name: plan.name || "",
        code: plan.code || "",
        description: plan.description || "",
        type: plan.type || "SEASON",
        price: plan.price || 0,
        currency: plan.currency || "TND",
        is_active: (plan as any).isActive ?? (plan as any).is_active ?? true,
        max_subscribers: plan.maxSubscribers || null,
        current_subscribers: plan.currentSubscribers || 0,
        valid_from: plan.validFrom ? new Date(plan.validFrom).toISOString().split('T')[0] : "",
        valid_until: plan.validUntil ? new Date(plan.validUntil).toISOString().split('T')[0] : "",
        sale_start_date: plan.saleStartDate ? new Date(plan.saleStartDate).toISOString().split('T')[0] : "",
        sale_end_date: plan.saleEndDate ? new Date(plan.saleEndDate).toISOString().split('T')[0] : "",
        transferable: plan.transferable || false,
        max_transfers: plan.maxTransfers || 0,
        auto_renew: plan.autoRenew || false,
        includes_playoffs: plan.includesPlayoffs || false,
        priority_booking: plan.priorityBooking || false,
        benefits: Array.isArray(plan.benefits) ? plan.benefits : [],
        restrictions: Array.isArray(plan.restrictions) ? plan.restrictions : [],
        metadata: plan.metadata || {}
      });
      
      // Set selected zones from plan
      if (plan.zones && Array.isArray(plan.zones)) {
        setSelectedZones(plan.zones.map((z: any) => z.id || z.zone_id));
      }
    } else {
      // When creating a new plan, automatically use default organizer from config
      const defaultOrganizerId = config.organizer.getOrganizerId();
      if (defaultOrganizerId) {
        setFormData(prev => ({
          ...prev,
          organizer_id: defaultOrganizerId
        }));
      } else if (organizers.length > 0) {
        // Fallback to first organizer if config doesn't have one
      setFormData(prev => ({
        ...prev,
        organizer_id: organizers[0].id
      }));
    }
    }
  }, [organizers, plan]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addBenefit = () => {
    if (newBenefit.trim()) {
      setFormData(prev => ({
        ...prev,
        benefits: [...prev.benefits, newBenefit.trim()]
      }));
      setNewBenefit("");
    }
  };

  const removeBenefit = (index: number) => {
    setFormData(prev => ({
      ...prev,
      benefits: prev.benefits.filter((_, i) => i !== index)
    }));
  };

  const addRestriction = () => {
    if (newRestriction.trim()) {
      setFormData(prev => ({
        ...prev,
        restrictions: [...prev.restrictions, newRestriction.trim()]
      }));
      setNewRestriction("");
    }
  };

  const removeRestriction = (index: number) => {
    setFormData(prev => ({
      ...prev,
      restrictions: prev.restrictions.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async () => {
    // For new plans, validate all required fields
    if (!isEditMode) {
    if (!formData.organizer_id || !formData.name || !formData.code?.trim() || formData.price <= 0) {
      toast({
        title: "Erreur de validation",
        description: "Nom, code et prix sont obligatoires",
        variant: "destructive"
      });
      return;
    }
    if (!formData.valid_from || !formData.valid_until) {
      toast({
        title: "Erreur de validation",
        description: "Les dates de validité sont obligatoires",
        variant: "destructive"
      });
      return;
    }
    if (planScope === "event" && selectedEventIds.length === 0) {
      toast({
        title: "Erreur de validation",
        description: "Sélectionnez au moins un événement pour un plan événementiel",
        variant: "destructive"
      });
      return;
    }

      // Validate that at least one zone is selected for new plans
    if (selectedZones.length === 0) {
      toast({
        title: "Erreur de validation",
        description: "Veuillez sélectionner au moins une zone",
        variant: "destructive"
      });
      return;
    }
    }
    // In edit mode, no validation needed - all fields are already populated from existing plan
    // This allows partial updates like just toggling is_active

    setLoading(true);
    try {
      if (isEditMode && plan) {
        // Update existing plan - support partial updates (e.g., just toggling is_active)
        const updateData: any = {
          is_active: formData.is_active
        };
        
        // Only include other fields if they have been changed or have valid values
        if (formData.name) updateData.name = formData.name;
        if (formData.description !== undefined) updateData.description = formData.description;
        if (formData.price > 0) updateData.price = formData.price;
        if (formData.currency) updateData.currency = formData.currency;
        if (formData.max_subscribers !== undefined && formData.max_subscribers !== null) updateData.max_subscribers = formData.max_subscribers;
        if (formData.valid_from) updateData.valid_from = formData.valid_from;
        if (formData.valid_until) updateData.valid_until = formData.valid_until;
        if (formData.sale_start_date !== undefined) updateData.sale_start_date = formData.sale_start_date || null;
        if (formData.sale_end_date !== undefined) updateData.sale_end_date = formData.sale_end_date || null;
        if (formData.transferable !== undefined) updateData.transferable = formData.transferable;
        if (formData.max_transfers !== undefined) updateData.max_transfers = formData.max_transfers;
        if (formData.auto_renew !== undefined) updateData.auto_renew = formData.auto_renew;
        if (formData.includes_playoffs !== undefined) updateData.includes_playoffs = formData.includes_playoffs;
        if (formData.priority_booking !== undefined) updateData.priority_booking = formData.priority_booking;
        
        // Convert benefits and restrictions from arrays to objects if they exist
        if (formData.benefits && formData.benefits.length > 0) {
          const benefitsObj = formData.benefits.reduce((acc: any, benefit: string, index: number) => {
            acc[`benefit_${index + 1}`] = benefit;
            return acc;
          }, {});
          updateData.benefits = benefitsObj;
        }
        
        if (formData.restrictions && formData.restrictions.length > 0) {
          const restrictionsObj = formData.restrictions.reduce((acc: any, restriction: string, index: number) => {
            acc[`restriction_${index + 1}`] = restriction;
            return acc;
          }, {});
          updateData.restrictions = restrictionsObj;
        }
        
        // Include zones only if they are selected
        if (selectedZones.length > 0) {
          const zonesData = selectedZones.map((zoneId) => ({
            zone_id: zoneId,
            is_included: true,
            price_override: null,
            priority_level: 0,
          }));
          updateData.zones = zonesData;
        }
        
        // Add metadata
        updateData.metadata = {
          ...formData.metadata,
          updatedBy: session?.user?.id || session?.user?.email || 'unknown',
          updatedAt: new Date().toISOString(),
          updatedVia: 'admin_panel'
        };
        
        await subscriptionPlansApi.update(plan.id, updateData);
      } else {
        // Create new plan - prepare full data
      const { is_active, current_subscribers, ...dataToSend } = formData;
      
      // Convert benefits and restrictions from arrays to objects
      const benefitsObj = formData.benefits.reduce((acc: any, benefit: string, index: number) => {
        acc[`benefit_${index + 1}`] = benefit;
        return acc;
      }, {});
      
      const restrictionsObj = formData.restrictions.reduce((acc: any, restriction: string, index: number) => {
        acc[`restriction_${index + 1}`] = restriction;
        return acc;
      }, {});

      // Prepare zones data
      const zonesData = selectedZones.map((zoneId) => ({
        zone_id: zoneId,
        is_included: true,
        price_override: null,
        priority_level: 0,
      }));

      // Add metadata
      const planType = planScope === "season" ? "SEASON" : "PARTIAL";
      const metadata: Record<string, unknown> = {
        ...formData.metadata,
        createdBy: session?.user?.id || session?.user?.email || 'unknown',
        createdAt: new Date().toISOString(),
        createdVia: 'admin_panel',
      };
      if (planScope === "season") {
        metadata.season = selectedSeason;
      }

      const dataWithMetadata = {
        ...dataToSend,
        type: planType,
        zones: zonesData.length > 0 ? zonesData : undefined,
        events: planScope === "event" ? selectedEventIds.map((event_id) => ({ event_id, is_included: true })) : undefined,
        benefits: Object.keys(benefitsObj).length > 0 ? benefitsObj : undefined,
        restrictions: Object.keys(restrictionsObj).length > 0 ? restrictionsObj : undefined,
        metadata,
      };

        // Create new plan - don't send is_active or current_subscribers
        await subscriptionPlansApi.create(dataWithMetadata);
      }
      
      onSuccess();
    } catch (error: any) {
      console.error("Error saving plan:", error);
      
      // Extract error messages and convert to French
      let errorMessage = "Impossible de créer le plan";
      if (isEditMode) {
        errorMessage = "Impossible de modifier le plan";
      }
      
      if (error?.response?.data?.message) {
        const messages = Array.isArray(error.response.data.message) 
          ? error.response.data.message 
          : [error.response.data.message];
        
        const frenchMessages = messages.map((msg: string) => {
          if (msg.includes("is_active")) return "Le champ 'is_active' ne doit pas être envoyé lors de la création";
          if (msg.includes("current_subscribers")) return "Le champ 'current_subscribers' ne doit pas être envoyé";
          if (msg.includes("Benefits must be an object")) return "Les avantages doivent être un objet";
          if (msg.includes("Restrictions must be an object")) return "Les restrictions doivent être un objet";
          if (msg.includes("Type must be a valid")) return "Le type doit être valide";
          return msg;
        });
        
        errorMessage = frenchMessages.join(", ");
      }
      
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5" />
            {isEditMode ? "Modifier le Plan d'Abonnement" : "Créer un Nouveau Type"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {!isEditMode && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Portée du plan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-3">
                  <Button type="button" variant={planScope === "season" ? "default" : "outline"} onClick={() => { setPlanScope("season"); handleInputChange("type", "SEASON"); }}>
                    Saison (abonnements)
                  </Button>
                  <Button type="button" variant={planScope === "event" ? "default" : "outline"} onClick={() => { setPlanScope("event"); handleInputChange("type", "PARTIAL"); }}>
                    Événement ponctuel
                  </Button>
                </div>
                {planScope === "season" && (
                  <SeasonSelector season={selectedSeason} onSeasonChange={setSelectedSeason} />
                )}
                {planScope === "event" && (
                  <div className="space-y-2 max-h-48 overflow-y-auto border rounded-lg p-3">
                    {loadingEvents ? (
                      <LoadingSpinner size="sm" />
                    ) : availableEvents.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Aucun événement disponible</p>
                    ) : (
                      availableEvents.map((ev) => (
                        <label key={ev.id} className="flex items-center gap-2 text-sm cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedEventIds.includes(ev.id)}
                            onChange={(e) => {
                              setSelectedEventIds((prev) =>
                                e.target.checked ? [...prev, ev.id] : prev.filter((id) => id !== ev.id)
                              );
                            }}
                          />
                          {ev.name}
                        </label>
                      ))
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informations de Base</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Organizer is hidden - always uses default */}
                <div className="hidden">
                  <Label htmlFor="organizer">Organisateur *</Label>
                  <Input
                    id="organizer"
                    value={formData.organizer_id}
                    readOnly
                  />
                </div>

                {/* Type is always SEASON - hidden */}
                <div className="hidden">
                  <Label htmlFor="type">Type d'Abonnement</Label>
                  <Input
                    id="type"
                    value="SEASON"
                    readOnly
                  />
                </div>

                <div>
                  <Label htmlFor="name">Nom du Plan *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="Ex: Plan VIP Saison 2025"
                  />
                </div>

                <div>
                  <Label htmlFor="code">Code du Plan *</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => handleInputChange("code", e.target.value)}
                    placeholder="Ex: PLAN-VIP-2025"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  placeholder="Description détaillée du plan..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Pricing */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CustomCurrencyIcon className="h-5 w-5 text-green-600" />
                Tarification
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="price">Prix *</Label>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => handleInputChange("price", parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <Label htmlFor="currency">Devise</Label>
                  <div className="flex items-center h-10 px-3 py-2 text-sm border border-gray-300 rounded-md bg-gray-50">
                    TND (Tunisian Dinar)
                  </div>
                </div>

                <div>
                  <Label htmlFor="max_subscribers">Limite d'Abonnés</Label>
                  <Input
                    id="max_subscribers"
                    type="number"
                    min="0"
                    value={formData.max_subscribers || ""}
                    onChange={(e) => handleInputChange("max_subscribers", e.target.value ? parseInt(e.target.value) : null)}
                    placeholder="Illimité"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dates */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Périodes de Validité et de Vente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="valid_from">Date de Début de Validité</Label>
                  <Input
                    id="valid_from"
                    type="date"
                    value={formData.valid_from}
                    onChange={(e) => handleInputChange("valid_from", e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="valid_until">Date de Fin de Validité</Label>
                  <Input
                    id="valid_until"
                    type="date"
                    value={formData.valid_until}
                    onChange={(e) => handleInputChange("valid_until", e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="sale_start_date">Date de Début de Vente</Label>
                  <Input
                    id="sale_start_date"
                    type="date"
                    value={formData.sale_start_date}
                    onChange={(e) => handleInputChange("sale_start_date", e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="sale_end_date">Date de Fin de Vente</Label>
                  <Input
                    id="sale_end_date"
                    type="date"
                    value={formData.sale_end_date}
                    onChange={(e) => handleInputChange("sale_end_date", e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Zones Selection - Modern Design */}
          <Card className="border-2 border-dashed border-gray-200 hover:border-primary/50 transition-colors">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <span>Zones Incluses</span>
                  <span className="text-red-500 text-base">*</span>
                </div>
                {selectedZones.length > 0 && (
                  <Badge variant="default" className="bg-primary/10 text-primary border-primary/20">
                    {selectedZones.length} sélectionnée{selectedZones.length > 1 ? 's' : ''}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Venue Selection - Modern */}
              <div className="space-y-2">
                <Label htmlFor="venue" className="text-sm font-semibold flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-gray-500" />
                  Lieu
                </Label>
                <Select 
                  value={selectedVenueId} 
                  onValueChange={setSelectedVenueId}
                  disabled={loadingVenues}
                >
                  <SelectTrigger className="h-11 bg-gray-50 border-gray-200 hover:border-primary/50 transition-colors">
                    <SelectValue placeholder={loadingVenues ? "Chargement..." : "Sélectionner un lieu"} />
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
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <span>💡</span>
                  Sélectionnez un lieu pour filtrer les zones disponibles
                </p>
              </div>

              {/* Zone Search */}
              {zones.length > 0 && (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Rechercher une zone..."
                    value={zoneSearchTerm}
                    onChange={(e) => setZoneSearchTerm(e.target.value)}
                    className="pl-10 h-10 bg-white border-gray-200 focus:border-primary focus:ring-primary/20"
                  />
                </div>
              )}

              {/* Zones Grid - Modern Card Design */}
              {loadingZones ? (
                <div className="flex flex-col items-center justify-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                  <LoadingSpinner className="mb-3" />
                  <span className="text-sm text-gray-600 font-medium">Chargement des zones...</span>
                </div>
              ) : zones.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                  <Grid3x3 className="h-12 w-12 text-gray-300 mb-3" />
                  <p className="text-sm font-medium text-gray-600">
                    {selectedVenueId === "all" 
                      ? "Aucune zone disponible" 
                      : "Aucune zone disponible pour ce lieu"}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Filtered Zones */}
                  <div 
                    className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[320px] overflow-y-auto pr-2"
                    style={{
                      scrollbarWidth: 'thin',
                      scrollbarColor: '#cbd5e1 #f1f5f9'
                    }}
                  >
                    {zones
                      .filter(zone => 
                        zoneSearchTerm === "" || 
                        zone.name.toLowerCase().includes(zoneSearchTerm.toLowerCase()) ||
                        zone.code.toLowerCase().includes(zoneSearchTerm.toLowerCase())
                      )
                      .map((zone) => {
                        const isSelected = selectedZones.includes(zone.id);
                        return (
                          <div
                            key={zone.id}
                            onClick={() => {
                              if (isSelected) {
                                setSelectedZones(selectedZones.filter((id) => id !== zone.id));
                              } else {
                                setSelectedZones([...selectedZones, zone.id]);
                              }
                            }}
                            className={`
                              relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-200
                              ${isSelected 
                                ? 'border-primary bg-primary/5 shadow-md shadow-primary/10' 
                                : 'border-gray-200 bg-white hover:border-primary/50 hover:shadow-sm'
                              }
                            `}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  {isSelected ? (
                                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                                  ) : (
                                    <Circle className="h-5 w-5 text-gray-300 flex-shrink-0" />
                                  )}
                                  <h4 className="font-semibold text-gray-900 truncate">
                                    {zone.name}
                                  </h4>
                                </div>
                                <Badge 
                                  variant="outline" 
                                  className="mt-1 text-xs font-mono bg-gray-50 border-gray-200"
                                >
                                  {zone.code}
                                </Badge>
                              </div>
                            </div>
                            {isSelected && (
                              <div className="absolute top-2 right-2">
                                <div className="h-2 w-2 bg-primary rounded-full animate-pulse" />
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>

                  {/* No results message */}
                  {zones.filter(zone => 
                    zoneSearchTerm === "" || 
                    zone.name.toLowerCase().includes(zoneSearchTerm.toLowerCase()) ||
                    zone.code.toLowerCase().includes(zoneSearchTerm.toLowerCase())
                  ).length === 0 && zoneSearchTerm !== "" && (
                    <div className="text-center py-8 text-gray-500 text-sm">
                      Aucune zone trouvée pour "{zoneSearchTerm}"
                    </div>
                  )}
                </div>
              )}

              {/* Validation Message */}
              {selectedZones.length === 0 && !loadingZones && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <X className="h-4 w-4 text-red-500 flex-shrink-0" />
                  <p className="text-sm font-medium text-red-700">
                    Aucune zone sélectionnée (requis)
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Plan Active Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Star className="h-5 w-5" />
                Statut du Plan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="is_active">Plan Actif</Label>
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => handleInputChange("is_active", checked)}
                  />
              </div>
            </CardContent>
          </Card>

          {/* Benefits */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Avantages</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={newBenefit}
                  onChange={(e) => setNewBenefit(e.target.value)}
                  placeholder="Ajouter un avantage..."
                  onKeyPress={(e) => e.key === 'Enter' && addBenefit()}
                />
                <Button onClick={addBenefit} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-2">
                {formData.benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Badge variant="secondary" className="flex-1">
                      {benefit}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeBenefit(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Restrictions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Restrictions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={newRestriction}
                  onChange={(e) => setNewRestriction(e.target.value)}
                  placeholder="Ajouter une restriction..."
                  onKeyPress={(e) => e.key === 'Enter' && addRestriction()}
                />
                <Button onClick={addRestriction} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-2">
                {formData.restrictions.map((restriction, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Badge variant="outline" className="flex-1">
                      {restriction}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeRestriction(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading && <LoadingSpinner className="mr-2" />}
            {isEditMode ? "Modifier le Plan" : "Créer le Plan"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 