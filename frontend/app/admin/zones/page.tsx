"use client";

import { useEffect, useState, useMemo } from "react";
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
  MapPin,
  Edit,
  Trash2,
  Filter,
  CheckCircle,
  XCircle,
  Armchair,
  RefreshCw,
  Download,
  Square
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { zonesApi, type Zone } from "@/lib/api/zones";
import { mappingsApi, type Mapping } from "@/lib/api/mappings";
import { venuesApi, type Venue } from "@/lib/api/venues";
import { qrCodesApi } from "@/lib/api/qr-codes";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

export default function AdminZonesPage() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [mappings, setMappings] = useState<Mapping[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingVenues, setLoadingVenues] = useState(false);
  const [loadingMappings, setLoadingMappings] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [venueFilter, setVenueFilter] = useState<string>("all");
  const [mappingFilter, setMappingFilter] = useState<string>("all");
  const [allMappings, setAllMappings] = useState<Mapping[]>([]);
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSeatsModal, setShowSeatsModal] = useState(false);
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [zonesWithSeats, setZonesWithSeats] = useState<Set<string>>(new Set());
  const [seats, setSeats] = useState<any[]>([]);
  const [loadingSeats, setLoadingSeats] = useState(false);
  const [syncing, setSyncing] = useState(false);
  
  const [formData, setFormData] = useState({
    venue_id: "", // For filtering mappings
    mapping_id: "",
    name: "",
    code: "",
    zone_type: "SEATING_AREA",
    category: "STANDARD",
    capacity: 0,
    base_price: 0,
    currency: "TND",
    description: "",
    amenities: [] as string[],
    is_active: true,
  });

  const [newAmenity, setNewAmenity] = useState("");

  const { toast } = useToast();

  useEffect(() => {
    fetchVenues();
    fetchZonesWithSeats();
    fetchAllMappings();
  }, []);

  const fetchAllMappings = async (venueId?: string) => {
    try {
      const response = await mappingsApi.getAll(
        venueId && venueId !== "all" ? venueId : undefined,
      );
      if (response.success) {
        setAllMappings(response.data);
      }
    } catch (error) {
      console.error("Error fetching mappings:", error);
    }
  };

  useEffect(() => {
    fetchAllMappings(venueFilter);
    setMappingFilter("all");
  }, [venueFilter]);

  const fetchZonesWithSeats = async () => {
    try {
      const response = await zonesApi.getZonesWithSeats();
      if (response.success && response.data) {
        setZonesWithSeats(new Set(response.data.map((z: Zone) => z.id)));
      }
    } catch (error) {
      console.error("Error fetching zones with seats:", error);
    }
  };

  useEffect(() => {
    if (formData.venue_id) {
      fetchMappings(formData.venue_id);
    } else {
      setMappings([]);
    }
  }, [formData.venue_id]);

  useEffect(() => {
    fetchZones();
  }, [searchTerm, statusFilter, categoryFilter, venueFilter]);

  const fetchVenues = async () => {
    setLoadingVenues(true);
    try {
      const response = await venuesApi.getAll({ limit: 1000 });
      if (response.success) {
        setVenues(response.data);
      }
    } catch (error: any) {
      console.error("Error fetching venues:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les venues",
        variant: "destructive"
      });
    } finally {
      setLoadingVenues(false);
    }
  };

  const fetchMappings = async (venueId: string) => {
    setLoadingMappings(true);
    try {
      const response = await mappingsApi.getAll(venueId);
      if (response.success) {
        setMappings(response.data);
        // If mapping_id is set but not in the filtered list, clear it
        if (formData.mapping_id && !response.data.find(m => m.id === formData.mapping_id)) {
          setFormData({ ...formData, mapping_id: "" });
        }
      }
    } catch (error: any) {
      console.error("Error fetching mappings:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les mappings",
        variant: "destructive"
      });
    } finally {
      setLoadingMappings(false);
    }
  };

  const fetchZones = async () => {
    setLoading(true);
    try {
      const params: any = {};
      // Only add active filter if explicitly set
      if (statusFilter === "active") {
        params.active = true;
      } else if (statusFilter === "inactive") {
        params.active = false;
      }
      // Only add category filter if not "all"
      if (categoryFilter && categoryFilter !== "all") {
        params.category = categoryFilter;
      }
      // Only add venue filter if not "all"
      if (venueFilter && venueFilter !== "all") {
        params.venue_id = venueFilter;
      }
      // Only add search if not empty
      if (searchTerm && searchTerm.trim()) {
        params.search = searchTerm.trim();
      }

      console.log('Fetching zones with params:', params);
      const response = await zonesApi.getAll(params);
      console.log('Zones API response:', response);
      
      if (response.success) {
        setZones(response.data || []);
        console.log(`Loaded ${response.data?.length || 0} zones`);
      } else {
        console.warn('Zones API returned success=false:', response);
        setZones([]);
      }
    } catch (error: any) {
      console.error("Error fetching zones:", error);
      console.error("Error details:", error.response?.data || error.message);
      toast({
        title: "Erreur",
        description: error.response?.data?.message || "Impossible de charger les zones",
        variant: "destructive"
      });
      setZones([]);
    } finally {
      setLoading(false);
    }
  };

  const resetFormData = () => {
    setFormData({
      venue_id: "",
      mapping_id: "",
      name: "",
      code: "",
      zone_type: "SEATING_AREA",
      category: "STANDARD",
      capacity: 0,
      base_price: 0,
      currency: "TND",
      description: "",
      amenities: [],
      is_active: true,
    });
    setMappings([]);
    setNewAmenity("");
  };

  const handleCreate = () => {
    resetFormData();
    setShowCreateModal(true);
  };

  const handleCreateModalChange = (open: boolean) => {
    setShowCreateModal(open);
    if (!open) {
      // Reset form when modal is closed
      resetFormData();
    }
  };

  const handleEdit = async (zone: Zone) => {
    setSelectedZone(zone);
    
    // Get the mapping_id from the zone
    const zoneMappingId = zone.mapping_id || "";
    
    // If we have a mapping_id, fetch the mapping to get the venue_id
    let venueId = "";
    if (zoneMappingId) {
      try {
        const mappingResponse = await mappingsApi.getById(zoneMappingId);
        if (mappingResponse.success && mappingResponse.data) {
          venueId = mappingResponse.data.venue_id;
          // Fetch mappings for this venue
          await fetchMappings(venueId);
        }
      } catch (error) {
        console.error("Error fetching mapping for zone:", error);
      }
    }
    
    setFormData({
      venue_id: venueId,
      mapping_id: zoneMappingId,
      name: zone.name || "",
      code: zone.code || "",
      zone_type: zone.zone_type || "SEATING_AREA",
      category: zone.category || "STANDARD",
      capacity: zone.capacity || 0,
      base_price: zone.base_price || 0,
      currency: zone.currency || "TND",
      description: zone.description || "",
      amenities: zone.amenities || [],
      is_active: zone.is_active ?? true,
    });
    setNewAmenity("");
    setShowEditModal(true);
  };

  const handleDelete = (zone: Zone) => {
    setSelectedZone(zone);
    setShowDeleteModal(true);
  };

  const handleViewSeats = async (zone: Zone) => {
    setSelectedZone(zone);
    setShowSeatsModal(true);
    await fetchSeatsForZone(zone.id);
  };

  const fetchSeatsForZone = async (zoneId: string) => {
    setLoadingSeats(true);
    try {
      const response = await zonesApi.getZoneSeats(zoneId);
      if (response.success) {
        setSeats(response.data || []);
      }
    } catch (error: any) {
      console.error("Error fetching seats:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les sièges",
        variant: "destructive",
      });
    } finally {
      setLoadingSeats(false);
    }
  };

  const handleSyncSeats = async () => {
    if (!selectedZone) return;
    setSyncing(true);
    try {
      const response = await qrCodesApi.syncSeats();
      if (response.success) {
        toast({
          title: "Synchronisation réussie",
          description: `${response.data.synced} sièges synchronisés${response.data.errors > 0 ? `, ${response.data.errors} erreurs` : ''}`,
        });
        await fetchSeatsForZone(selectedZone.id);
      }
    } catch (err: any) {
      toast({
        title: "Erreur",
        description: err.response?.data?.message || err.message || "Erreur lors de la synchronisation",
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
    }
  };

  const handleExportSeats = () => {
    if (seats.length === 0 || !selectedZone) return;
    const headers = ["Row", "Seat Number", "Type", "Status"];
    const rows = seats.map(seat => [
      seat.row_number || "",
      seat.seat_number,
      seat.seat_type,
      seat.status,
    ]);
    const csvContent = [headers.join(","), ...rows.map(row => row.map(cell => `"${cell}"`).join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    
    // Format filename: sieges_{count}_{zoneName}_{zoneCode}_{date}.csv
    const zoneName = selectedZone.name?.replace(/[^a-zA-Z0-9]/g, '_') || 'zone';
    const zoneCode = selectedZone.code || 'unknown';
    const count = seats.length;
    const date = new Date().toISOString().split('T')[0];
    link.download = `sieges_${count}_${zoneName}_${zoneCode}_${date}.csv`;
    
    link.click();
    toast({ title: "Export réussi", description: "Fichier CSV téléchargé" });
  };

  const handleSubmitCreate = async () => {
    if (!formData.mapping_id || !formData.name || !formData.code || formData.capacity <= 0) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs requis (Venue, Mapping, Nom, Code, Capacité)",
        variant: "destructive"
      });
      return;
    }

    setActionLoading(true);
    try {
      // Remove venue_id from payload - zones are linked to mappings, not venues directly
      const { venue_id, ...zoneData } = formData;
      const response = await zonesApi.create(zoneData);
      if (response.success) {
        toast({
          title: "Succès",
          description: "Zone créée avec succès",
        });
        handleCreateModalChange(false);
        fetchZones();
      }
    } catch (error: any) {
      console.error("Error creating zone:", error);
      const errorMessage = error.response?.data?.message || error.message || "Erreur lors de la création de la zone";
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitEdit = async () => {
    if (!selectedZone) return;

    setActionLoading(true);
    try {
      const updateData: any = {
        name: formData.name,
        code: formData.code,
        zone_type: formData.zone_type,
        category: formData.category,
        capacity: formData.capacity,
        base_price: formData.base_price,
        currency: formData.currency,
        description: formData.description,
        amenities: formData.amenities || [],
        is_active: formData.is_active,
      };
      
      // Include mapping_id if it was changed
      if (formData.mapping_id) {
        updateData.mapping_id = formData.mapping_id;
      }

      const response = await zonesApi.update(selectedZone.id, updateData);
      if (response.success) {
        toast({
          title: "Succès",
          description: "Zone mise à jour avec succès",
        });
        setShowEditModal(false);
        fetchZones();
      }
    } catch (error: any) {
      console.error("Error updating zone:", error);
      const errorMessage = error.response?.data?.message || error.message || "Erreur lors de la mise à jour de la zone";
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedZone) return;

    setActionLoading(true);
    try {
      const response = await zonesApi.delete(selectedZone.id);
      if (response.success) {
        toast({
          title: "Succès",
          description: "Zone supprimée avec succès",
        });
        setShowDeleteModal(false);
        fetchZones();
      }
    } catch (error: any) {
      console.error("Error deleting zone:", error);
      const errorMessage = error.response?.data?.message || error.message || "Impossible de supprimer la zone. Elle peut être associée à des enregistrements existants.";
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setActionLoading(false);
    }
  };

  const filteredZones = zones.filter(zone => {
    if (mappingFilter !== "all" && zone.mapping_id !== mappingFilter) {
      return false;
    }
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        zone.name?.toLowerCase().includes(search) ||
        zone.code?.toLowerCase().includes(search)
      );
    }
    return true;
  });

  const venueLookup = useMemo(() => {
    const map = new Map<string, Venue>();
    venues.forEach((v) => map.set(v.id, v));
    return map;
  }, [venues]);

  const mappingLookup = useMemo(() => {
    const map = new Map<string, Mapping>();
    allMappings.forEach((m) => map.set(m.id, m));
    return map;
  }, [allMappings]);

  const groupedZones = useMemo(() => {
    const groups = new Map<string, Zone[]>();
    for (const zone of filteredZones) {
      const key = zone.mapping_id || "unknown";
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(zone);
    }
    return Array.from(groups.entries()).sort(([aId], [bId]) => {
      const nameA = mappingLookup.get(aId)?.name || aId;
      const nameB = mappingLookup.get(bId)?.name || bId;
      return nameA.localeCompare(nameB, "fr");
    });
  }, [filteredZones, mappingLookup]);

  const availableMappingsForFilter = useMemo(() => {
    if (venueFilter === "all") return allMappings;
    return allMappings.filter((m) => m.venue_id === venueFilter);
  }, [allMappings, venueFilter]);

  const stats = {
    total: zones.length,
    active: zones.filter(z => z.is_active).length,
    inactive: zones.filter(z => !z.is_active).length,
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar type="admin" />
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="px-8 w-full">
          <PageHeader
            title="Gestion des Zones"
            description="Créez et gérez les zones de votre venue"
          >
            <Button onClick={handleCreate} className="ml-auto">
              <Plus className="mr-2 h-4 w-4" />
              Créer une Zone
            </Button>
          </PageHeader>
          
          <div className="flex-1 overflow-auto pt-6 pb-6">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Total Zones</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Zones Actives</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.active}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Zones Inactives</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-400">{stats.inactive}</div>
              </CardContent>
            </Card>
          </div>

            {/* Filters and Actions */}
            <Card className="mb-6">
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Rechercher par nom ou code..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
                    <SelectTrigger className="w-full md:w-[180px]">
                      <SelectValue placeholder="Statut" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les statuts</SelectItem>
                      <SelectItem value="active">Actif</SelectItem>
                      <SelectItem value="inactive">Inactif</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-full md:w-[200px]">
                      <SelectValue placeholder="Catégorie" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes les catégories</SelectItem>
                      <SelectItem value="STANDARD">Standard</SelectItem>
                      <SelectItem value="PREMIUM">Premium</SelectItem>
                      <SelectItem value="BASIC">Basic</SelectItem>
                      <SelectItem value="VIP">VIP</SelectItem>
                      <SelectItem value="ACCESSIBLE">Accessible</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={venueFilter} onValueChange={setVenueFilter}>
                    <SelectTrigger className="w-full md:w-[200px]">
                      <SelectValue placeholder="Lieu" />
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
                  <Select value={mappingFilter} onValueChange={setMappingFilter}>
                    <SelectTrigger className="w-full md:w-[220px]">
                      <SelectValue placeholder="Cartographie" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes les cartographies</SelectItem>
                      {availableMappingsForFilter.map((mapping) => {
                        const venue = venueLookup.get(mapping.venue_id);
                        return (
                          <SelectItem key={mapping.id} value={mapping.id}>
                            {mapping.name}{venue ? ` · ${venue.name}` : ""}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

          {/* Zones List */}
          {loading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner />
            </div>
          ) : filteredZones.length === 0 ? (
            <EmptyState
              icon={<MapPin className="h-12 w-12" />}
              title="Aucune zone trouvée"
              description="Commencez par créer votre première zone"
            />
          ) : (
            <div className="space-y-8">
              {groupedZones.map(([mappingId, mappingZones]) => {
                const mapping = mappingLookup.get(mappingId);
                const venue = mapping ? venueLookup.get(mapping.venue_id) : undefined;
                return (
                  <section key={mappingId}>
                    <div className="flex flex-wrap items-center gap-2 mb-4 pb-3 border-b">
                      <MapPin className="h-5 w-5 text-primary shrink-0" />
                      <h2 className="text-lg font-semibold">
                        {mapping?.name || "Cartographie inconnue"}
                      </h2>
                      {mapping?.code && (
                        <Badge variant="outline">{mapping.code}</Badge>
                      )}
                      {venue && (
                        <span className="text-sm text-muted-foreground">{venue.name}</span>
                      )}
                      <Badge variant="secondary" className="ml-auto">
                        {mappingZones.length} zone{mappingZones.length > 1 ? "s" : ""}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {mappingZones.map((zone) => (
                <Card key={zone.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{zone.name}</CardTitle>
                        <p className="text-sm text-gray-500 mt-1">{zone.code}</p>
                      </div>
                      <div className="flex flex-col gap-1 items-end">
                        <Badge variant={zone.is_active ? "default" : "secondary"}>
                          <span className="flex items-center">
                            {zone.is_active ? (
                              <CheckCircle className="h-3 w-3 mr-1" />
                            ) : (
                              <XCircle className="h-3 w-3 mr-1" />
                            )}
                            {zone.is_active ? "Actif" : "Inactif"}
                          </span>
                        </Badge>
                        {zonesWithSeats.has(zone.id) && (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
                            <Armchair className="h-3 w-3 mr-1" />
                            Sièges
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Type:</span>
                        <span className="font-medium">{zone.zone_type}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Catégorie:</span>
                        <span className="font-medium">{zone.category}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Capacité:</span>
                        <span className="font-medium">{zone.capacity}</span>
                      </div>
                      {zone.base_price !== undefined && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Prix:</span>
                          <span className="font-medium">{zone.base_price} {zone.currency}</span>
                        </div>
                      )}
                      {zone.amenities && zone.amenities.length > 0 && (
                        <div className="mt-2 pt-2 border-t">
                          <span className="text-gray-600 text-xs">Équipements:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {zone.amenities.slice(0, 3).map((amenity) => (
                              <Badge key={amenity} variant="outline" className="text-xs">
                                {amenity}
                              </Badge>
                            ))}
                            {zone.amenities.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{zone.amenities.length - 3}
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 mt-4">
                      {zonesWithSeats.has(zone.id) && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleViewSeats(zone)}
                          className="flex-1 bg-black hover:bg-gray-800 text-white"
                        >
                          <Armchair className="h-4 w-4 mr-2" />
                          Voir sièges
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(zone)}
                        className={zonesWithSeats.has(zone.id) ? "" : "flex-1"}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Modifier
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(zone)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Supprimer
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          )}
          </div>
        </div>
      </div>

      {/* Create Modal */}
      <Dialog open={showCreateModal} onOpenChange={handleCreateModalChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Créer une Zone</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 bg-blue-50 rounded-md border border-blue-200">
              <p className="text-sm text-blue-800 font-medium mb-2">Hiérarchie: Venue → Mapping → Zone</p>
              <p className="text-xs text-blue-700">Sélectionnez d'abord un venue, puis un mapping pour créer une zone.</p>
            </div>
            <div>
              <Label htmlFor="venue_id">Venue *</Label>
              {loadingVenues ? (
                <div className="flex items-center gap-2 py-2">
                  <LoadingSpinner />
                  <span className="text-sm text-gray-500">Chargement des venues...</span>
                </div>
              ) : (
                <Select 
                  value={formData.venue_id} 
                  onValueChange={(v) => {
                    setFormData({ ...formData, venue_id: v, mapping_id: "" });
                    fetchMappings(v);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un venue" />
                  </SelectTrigger>
                  <SelectContent>
                    {venues.map((venue) => (
                      <SelectItem key={venue.id} value={venue.id}>
                        {venue.name} {venue.city ? `(${venue.city})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {venues.length === 0 && !loadingVenues && (
                <p className="text-xs text-gray-500 mt-1">Aucun venue disponible. Créez d'abord un venue dans la section Venues.</p>
              )}
            </div>
            <div>
              <Label htmlFor="mapping_id">Mapping *</Label>
              {!formData.venue_id ? (
                <div className="text-sm text-gray-500 py-2 border rounded-md px-3 bg-gray-50">
                  Veuillez d'abord sélectionner un venue
                </div>
              ) : loadingMappings ? (
                <div className="flex items-center gap-2 py-2">
                  <LoadingSpinner />
                  <span className="text-sm text-gray-500">Chargement des mappings...</span>
                </div>
              ) : (
                <Select 
                  value={formData.mapping_id} 
                  onValueChange={(v) => setFormData({ ...formData, mapping_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un mapping" />
                  </SelectTrigger>
                  <SelectContent>
                    {mappings.map((mapping) => (
                      <SelectItem key={mapping.id} value={mapping.id}>
                        {mapping.name} ({mapping.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {formData.venue_id && mappings.length === 0 && !loadingMappings && (
                <p className="text-xs text-gray-500 mt-1">Aucun mapping disponible pour ce venue. Créez d'abord un mapping dans la section Mappings.</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nom *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Gradin 4"
                />
              </div>
              <div>
                <Label htmlFor="code">Code *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="ZONE-A"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="zone_type">Type *</Label>
                <Select value={formData.zone_type} onValueChange={(v) => setFormData({ ...formData, zone_type: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SEATING_AREA">Zone Assise</SelectItem>
                    <SelectItem value="STANDING_AREA">Zone Debout</SelectItem>
                    <SelectItem value="VIP_AREA">Zone VIP</SelectItem>
                    <SelectItem value="SERVICE_AREA">Zone Service</SelectItem>
                    <SelectItem value="STAFF_AREA">Zone Personnel</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="category">Catégorie *</Label>
                <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="STANDARD">Standard</SelectItem>
                    <SelectItem value="PREMIUM">Premium</SelectItem>
                    <SelectItem value="BASIC">Basic</SelectItem>
                    <SelectItem value="VIP">VIP</SelectItem>
                    <SelectItem value="ACCESSIBLE">Accessible</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="capacity">Capacité *</Label>
                <Input
                  id="capacity"
                  type="number"
                  min="1"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label htmlFor="base_price">Prix de Base</Label>
                <Input
                  id="base_price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.base_price}
                  onChange={(e) => setFormData({ ...formData, base_price: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label htmlFor="currency">Devise</Label>
                <Input
                  id="currency"
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value.toUpperCase() })}
                  placeholder="TND"
                  maxLength={3}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Description de la zone..."
                rows={3}
              />
            </div>
            <div>
              <Label>Équipements (Amenities)</Label>
              <div className="space-y-3 mt-2">
                {/* Add new amenity input */}
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="Ajouter un équipement (ex: WiFi, Climatisation, etc.)"
                    value={newAmenity}
                    onChange={(e) => setNewAmenity(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (newAmenity.trim() && !formData.amenities.includes(newAmenity.trim())) {
                          setFormData({
                            ...formData,
                            amenities: [...formData.amenities, newAmenity.trim()],
                          });
                          setNewAmenity("");
                        }
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (newAmenity.trim() && !formData.amenities.includes(newAmenity.trim())) {
                        setFormData({
                          ...formData,
                          amenities: [...formData.amenities, newAmenity.trim()],
                        });
                        setNewAmenity("");
                      }
                    }}
                    disabled={!newAmenity.trim() || formData.amenities.includes(newAmenity.trim())}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                
                {/* Display added amenities */}
                {formData.amenities.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.amenities.map((amenity, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="flex items-center gap-2 px-3 py-1 text-sm"
                      >
                        {amenity}
                        <button
                          type="button"
                          onClick={() => {
                            setFormData({
                              ...formData,
                              amenities: formData.amenities.filter((_, i) => i !== index),
                            });
                          }}
                          className="ml-1 hover:text-red-600 transition-colors"
                        >
                          <XCircle className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between p-4 border rounded-md">
              <Label>Zone active</Label>
              <Button
                type="button"
                variant={formData.is_active ? "default" : "outline"}
                size="sm"
                onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                className={formData.is_active ? "bg-black text-white hover:bg-gray-800" : ""}
              >
                {formData.is_active ? "Actif" : "Inactif"}
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => handleCreateModalChange(false)}>
              Annuler
            </Button>
            <Button onClick={handleSubmitCreate} disabled={actionLoading}>
              {actionLoading ? "Création..." : "Créer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifier la Zone</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 bg-blue-50 rounded-md mb-4">
              <p className="text-sm text-blue-700">Hiérarchie: Venue → Mapping → Zone</p>
              <p className="text-xs text-blue-600 mt-1">Vous pouvez modifier le mapping si nécessaire</p>
            </div>
            <div>
              <Label htmlFor="edit_venue">Venue *</Label>
              <Select
                value={formData.venue_id}
                onValueChange={(v) => {
                  setFormData({ ...formData, venue_id: v, mapping_id: "" });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un venue" />
                </SelectTrigger>
                <SelectContent>
                  {venues.map((venue) => (
                    <SelectItem key={venue.id} value={venue.id}>
                      {venue.name} {venue.city ? `(${venue.city})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit_mapping">Mapping *</Label>
              {!formData.venue_id ? (
                <p className="text-xs text-gray-500 mt-1">Sélectionnez d'abord un venue</p>
              ) : loadingMappings ? (
                <p className="text-xs text-gray-500 mt-1">Chargement des mappings...</p>
              ) : (
                <Select
                  value={formData.mapping_id}
                  onValueChange={(v) => setFormData({ ...formData, mapping_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un mapping" />
                  </SelectTrigger>
                  <SelectContent>
                    {mappings.map((mapping) => (
                      <SelectItem key={mapping.id} value={mapping.id}>
                        {mapping.name} ({mapping.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {formData.venue_id && mappings.length === 0 && !loadingMappings && (
                <p className="text-xs text-gray-500 mt-1">Aucun mapping disponible pour ce venue. Créez d'abord un mapping dans la section Mappings.</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit_name">Nom *</Label>
                <Input
                  id="edit_name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit_code">Code *</Label>
                <Input
                  id="edit_code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit_zone_type">Type *</Label>
                <Select value={formData.zone_type} onValueChange={(v) => setFormData({ ...formData, zone_type: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SEATING_AREA">Zone Assise</SelectItem>
                    <SelectItem value="STANDING_AREA">Zone Debout</SelectItem>
                    <SelectItem value="VIP_AREA">Zone VIP</SelectItem>
                    <SelectItem value="SERVICE_AREA">Zone Service</SelectItem>
                    <SelectItem value="STAFF_AREA">Zone Personnel</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit_category">Catégorie *</Label>
                <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="STANDARD">Standard</SelectItem>
                    <SelectItem value="PREMIUM">Premium</SelectItem>
                    <SelectItem value="BASIC">Basic</SelectItem>
                    <SelectItem value="VIP">VIP</SelectItem>
                    <SelectItem value="ACCESSIBLE">Accessible</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="edit_capacity">Capacité *</Label>
                <Input
                  id="edit_capacity"
                  type="number"
                  min="1"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label htmlFor="edit_base_price">Prix de Base</Label>
                <Input
                  id="edit_base_price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.base_price}
                  onChange={(e) => setFormData({ ...formData, base_price: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label htmlFor="edit_currency">Devise</Label>
                <Input
                  id="edit_currency"
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value.toUpperCase() })}
                  maxLength={3}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="edit_description">Description</Label>
              <Textarea
                id="edit_description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
            <div>
              <Label>Équipements (Amenities)</Label>
              <div className="space-y-3 mt-2">
                {/* Add new amenity input */}
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="Ajouter un équipement (ex: WiFi, Climatisation, etc.)"
                    value={newAmenity}
                    onChange={(e) => setNewAmenity(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (newAmenity.trim() && !formData.amenities.includes(newAmenity.trim())) {
                          setFormData({
                            ...formData,
                            amenities: [...formData.amenities, newAmenity.trim()],
                          });
                          setNewAmenity("");
                        }
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (newAmenity.trim() && !formData.amenities.includes(newAmenity.trim())) {
                        setFormData({
                          ...formData,
                          amenities: [...formData.amenities, newAmenity.trim()],
                        });
                        setNewAmenity("");
                      }
                    }}
                    disabled={!newAmenity.trim() || formData.amenities.includes(newAmenity.trim())}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                
                {/* Display added amenities */}
                {formData.amenities.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.amenities.map((amenity, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="flex items-center gap-2 px-3 py-1 text-sm"
                      >
                        {amenity}
                        <button
                          type="button"
                          onClick={() => {
                            setFormData({
                              ...formData,
                              amenities: formData.amenities.filter((_, i) => i !== index),
                            });
                          }}
                          className="ml-1 hover:text-red-600 transition-colors"
                        >
                          <XCircle className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between p-4 border rounded-md">
              <Label>Zone active</Label>
              <Button
                type="button"
                variant={formData.is_active ? "default" : "outline"}
                size="sm"
                onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                className={formData.is_active ? "bg-black text-white hover:bg-gray-800" : ""}
              >
                {formData.is_active ? "Actif" : "Inactif"}
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditModal(false)}>
              Annuler
            </Button>
            <Button onClick={handleSubmitEdit} disabled={actionLoading}>
              {actionLoading ? "Mise à jour..." : "Mettre à jour"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer la Zone</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer la zone "{selectedZone?.name}" ? Cette action est irréversible.
              <br />
              <br />
              <strong>Note:</strong> La zone ne peut pas être supprimée si elle est associée à des sièges, droits d'accès, plans d'abonnement, billets ou zones enfants.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete} disabled={actionLoading}>
              {actionLoading ? "Suppression..." : "Supprimer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Seats Management Modal */}
      <Dialog open={showSeatsModal} onOpenChange={setShowSeatsModal}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Gestion des Sièges - {selectedZone?.name}</DialogTitle>
            <DialogDescription>
              Zone: {selectedZone?.code} | {seats.length} siège(s) au total
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Actions */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSyncSeats}
                disabled={syncing}
              >
                {syncing ? (
                  <LoadingSpinner size="sm" className="mr-2" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Synchroniser avec QR codes
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportSeats}
                disabled={seats.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Exporter CSV
              </Button>
            </div>

            {/* Statistics */}
            {seats.length > 0 && (
              <div className="grid grid-cols-5 gap-2">
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-sm text-gray-600">Total</div>
                    <div className="text-2xl font-bold">{seats.length}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-sm text-gray-600">Disponibles</div>
                    <div className="text-2xl font-bold text-green-600">
                      {seats.filter(s => s.status === "AVAILABLE").length}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-sm text-gray-600">Vendus</div>
                    <div className="text-2xl font-bold text-red-600">
                      {seats.filter(s => s.status === "SOLD").length}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-sm text-gray-600">Réservés</div>
                    <div className="text-2xl font-bold text-yellow-600">
                      {seats.filter(s => ["RESERVED", "RESERVED_TEMPORARY", "HELD"].includes(s.status)).length}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-sm text-gray-600">Bloqués</div>
                    <div className="text-2xl font-bold text-gray-600">
                      {seats.filter(s => ["BLOCKED", "MAINTENANCE"].includes(s.status)).length}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Seats Grid */}
            {loadingSeats ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner />
              </div>
            ) : seats.length === 0 ? (
              <EmptyState
                icon={<Armchair className="h-12 w-12" />}
                title="Aucun siège trouvé"
                description="Cette zone n'a pas de sièges configurés"
              />
            ) : (
              <div className="space-y-4">
                {Object.entries(
                  seats.reduce((acc, seat) => {
                    const row = seat.row_number || "Sans rangée";
                    if (!acc[row]) acc[row] = [];
                    acc[row].push(seat);
                    return acc;
                  }, {} as Record<string, typeof seats>)
                )
                  .sort(([a], [b]) => {
                    if (a === "Sans rangée") return 1;
                    if (b === "Sans rangée") return -1;
                    return a.localeCompare(b);
                  })
                  .map(([row, rowSeats]) => (
                    <Card key={row}>
                      <CardHeader>
                        <CardTitle className="text-sm">Rangée {row}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {rowSeats.map((seat) => {
                            const statusColor =
                              seat.status === "AVAILABLE"
                                ? "bg-green-100 text-green-800 border-green-300"
                                : seat.status === "SOLD"
                                ? "bg-red-100 text-red-800 border-red-300"
                                : ["BLOCKED", "MAINTENANCE"].includes(seat.status)
                                ? "bg-gray-100 text-gray-800 border-gray-300"
                                : ["RESERVED", "RESERVED_TEMPORARY", "HELD"].includes(seat.status)
                                ? "bg-yellow-100 text-yellow-800 border-yellow-300"
                                : "bg-blue-100 text-blue-800 border-blue-300";
                            return (
                              <div
                                key={seat.id}
                                className={`px-3 py-2 rounded-md border text-sm font-medium flex items-center gap-2 ${statusColor}`}
                              >
                                {seat.status === "AVAILABLE" ? (
                                  <CheckCircle className="h-4 w-4" />
                                ) : seat.status === "SOLD" ? (
                                  <XCircle className="h-4 w-4" />
                                ) : (
                                  <Square className="h-4 w-4" />
                                )}
                                {seat.seat_number}
                                {seat.is_accessible && (
                                  <span className="ml-1 text-xs">♿</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSeatsModal(false)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

