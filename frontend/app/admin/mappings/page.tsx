"use client";

import { useEffect, useState } from "react";
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
  Map,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Eye,
  Calendar,
  MapPin,
  Clock
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { mappingsApi, type Mapping } from "@/lib/api/mappings";
import { venuesApi, type Venue } from "@/lib/api/venues";
import { zonesApi, type Zone } from "@/lib/api/zones";
import { eventsApi } from "@/lib/api/events";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function AdminMappingsPage() {
  const [mappings, setMappings] = useState<Mapping[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingVenues, setLoadingVenues] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showZoneModal, setShowZoneModal] = useState(false);
  const [selectedMapping, setSelectedMapping] = useState<Mapping | null>(null);
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [mappingZones, setMappingZones] = useState<Zone[]>([]);
  const [mappingEvents, setMappingEvents] = useState<any[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  
  const [formData, setFormData] = useState({
    venue_id: "",
    name: "",
    code: "",
    mapping_type: "DEFAULT",
    effective_capacity: 0,
    description: "",
    is_active: true,
  });

  const { toast } = useToast();

  useEffect(() => {
    fetchVenues();
    fetchMappings();
  }, [searchTerm, statusFilter]);

  const fetchVenues = async () => {
    setLoadingVenues(true);
    try {
      const response = await venuesApi.getAll({ limit: 1000 });
      if (response.success) {
        setVenues(response.data);
      }
    } catch (error: any) {
      console.error("Error fetching venues:", error);
      // Don't show toast for 404 - endpoint might not exist yet
      if (error.response?.status !== 404) {
        toast({
          title: "Erreur",
          description: "Impossible de charger les venues",
          variant: "destructive"
        });
      }
      // Set empty array to prevent rendering errors
      setVenues([]);
    } finally {
      setLoadingVenues(false);
    }
  };

  const fetchMappings = async () => {
    setLoading(true);
    try {
      const response = await mappingsApi.getAll();
      if (response.success) {
        let filtered = response.data || [];
        
        // Apply status filter
        if (statusFilter === "active") {
          filtered = filtered.filter(m => m.is_active);
        } else if (statusFilter === "inactive") {
          filtered = filtered.filter(m => !m.is_active);
        }
        
        setMappings(filtered);
      }
    } catch (error: any) {
      console.error("Error fetching mappings:", error);
      // Don't show toast for 404 - endpoint might not exist yet
      if (error.response?.status !== 404) {
        toast({
          title: "Erreur",
          description: "Impossible de charger les mappings",
          variant: "destructive"
        });
      }
      // Set empty array to prevent rendering errors
      setMappings([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setFormData({
      venue_id: "",
      name: "",
      code: "",
      mapping_type: "DEFAULT",
      effective_capacity: 0,
      description: "",
      is_active: true,
    });
    setShowCreateModal(true);
  };

  const handleView = async (mapping: Mapping) => {
    setSelectedMapping(mapping);
    setShowViewModal(true);
    setLoadingDetails(true);
    
    try {
      // Fetch zones for this mapping
      const zonesResponse = await zonesApi.getAll({});
      if (zonesResponse.success) {
        // Filter zones by mapping_id (assuming zones have mapping_id)
        const filteredZones = zonesResponse.data.filter((zone: any) => 
          zone.mapping_id === mapping.id
        );
        setMappingZones(filteredZones);
      }

      // Fetch events - we'll filter by venue_id since events might not have mapping_id
      try {
        const eventsResponse = await eventsApi.getEvents(1, 100, { venueId: mapping.venue_id }, true);
        setMappingEvents(eventsResponse.events || []);
      } catch (error) {
        console.error("Error fetching events:", error);
        setMappingEvents([]);
      }
    } catch (error) {
      console.error("Error fetching details:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les détails",
        variant: "destructive"
      });
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleViewZone = (zone: Zone) => {
    setSelectedZone(zone);
    setShowZoneModal(true);
  };

  const handleEdit = (mapping: Mapping) => {
    setSelectedMapping(mapping);
    setFormData({
      venue_id: mapping.venue_id,
      name: mapping.name || "",
      code: mapping.code || "",
      mapping_type: mapping.mapping_type || "DEFAULT",
      effective_capacity: mapping.effective_capacity || 0,
      description: mapping.description || "",
      is_active: mapping.is_active ?? true,
    });
    setShowEditModal(true);
  };

  const handleDelete = (mapping: Mapping) => {
    setSelectedMapping(mapping);
    setShowDeleteModal(true);
  };


  const handleSubmitCreate = async () => {
    if (!formData.venue_id || !formData.name || !formData.code || formData.effective_capacity <= 0) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs requis (Venue ID, Nom, Code, Capacité)",
        variant: "destructive"
      });
      return;
    }

    setActionLoading(true);
    try {
      const response = await mappingsApi.create(formData);
      if (response.success) {
        toast({
          title: "Succès",
          description: "Mapping créé avec succès",
        });
        setShowCreateModal(false);
        fetchMappings();
      }
    } catch (error: any) {
      console.error("Error creating mapping:", error);
      const errorMessage = error.response?.data?.message || error.message || "Erreur lors de la création du mapping";
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
    if (!selectedMapping) return;

    setActionLoading(true);
    try {
      const updateData: any = {
        name: formData.name,
        code: formData.code,
        mapping_type: formData.mapping_type,
        effective_capacity: formData.effective_capacity,
        description: formData.description,
        is_active: formData.is_active,
      };

      const response = await mappingsApi.update(selectedMapping.id, updateData);
      if (response.success) {
        toast({
          title: "Succès",
          description: "Mapping mis à jour avec succès",
        });
        setShowEditModal(false);
        fetchMappings();
      }
    } catch (error: any) {
      console.error("Error updating mapping:", error);
      const errorMessage = error.response?.data?.message || error.message || "Erreur lors de la mise à jour du mapping";
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
    if (!selectedMapping) return;

    setActionLoading(true);
    try {
      const response = await mappingsApi.delete(selectedMapping.id);
      if (response.success) {
        toast({
          title: "Succès",
          description: "Mapping supprimé avec succès",
        });
        setShowDeleteModal(false);
        fetchMappings();
      }
    } catch (error: any) {
      console.error("Error deleting mapping:", error);
      const errorMessage = error.response?.data?.message || error.message || "Impossible de supprimer le mapping. Il peut être associé à des enregistrements existants.";
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setActionLoading(false);
    }
  };


  const filteredMappings = mappings.filter(mapping => {
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        mapping.name?.toLowerCase().includes(search) ||
        mapping.code?.toLowerCase().includes(search) ||
        mapping.venue_id?.toLowerCase().includes(search)
      );
    }
    return true;
  });

  const stats = {
    total: mappings.length,
    active: mappings.filter(m => m.is_active).length,
    inactive: mappings.filter(m => !m.is_active).length,
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar type="admin" />
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="px-8 w-full">
          <PageHeader
            title="Gestion des Mappings"
            description="Créez et gérez les mappings de venue"
          >
            <Button onClick={handleCreate} className="ml-auto">
              <Plus className="mr-2 h-4 w-4" />
              Créer un Mapping
            </Button>
          </PageHeader>
          
          <div className="flex-1 overflow-auto pt-6 pb-6">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Total Mappings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Mappings Actifs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.active}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Mappings Inactifs</CardTitle>
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
                        placeholder="Rechercher par nom, code ou venue ID..."
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
                </div>
              </CardContent>
            </Card>

          {/* Mappings List */}
          {loading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner />
            </div>
          ) : filteredMappings.length === 0 ? (
            <EmptyState
              icon={<Map className="h-12 w-12" />}
              title="Aucun mapping trouvé"
              description="Commencez par créer votre premier mapping"
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMappings.map((mapping) => (
                <Card key={mapping.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{mapping.name}</CardTitle>
                        <p className="text-sm text-gray-500 mt-1">{mapping.code}</p>
                      </div>
                      <Badge variant={mapping.is_active ? "default" : "secondary"}>
                        {mapping.is_active ? (
                          <CheckCircle className="h-3 w-3 mr-1" />
                        ) : (
                          <XCircle className="h-3 w-3 mr-1" />
                        )}
                        {mapping.is_active ? "Actif" : "Inactif"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Type:</span>
                        <span className="font-medium">{mapping.mapping_type}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Capacité:</span>
                        <span className="font-medium">{mapping.effective_capacity}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Venue:</span>
                        <span className="font-medium text-sm">
                          {venues.find(v => v.id === mapping.venue_id)?.name || mapping.venue_id.substring(0, 8) + '...'}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleView(mapping)}
                        className="flex-1"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Voir
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(mapping)}
                        className="flex-1"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Modifier
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(mapping)}
                        className="flex-1 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Supprimer
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          </div>
        </div>
      </div>

      {/* Create Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Créer un Mapping</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
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
                  onValueChange={(v) => setFormData({ ...formData, venue_id: v })}
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
                <p className="text-xs text-gray-500 mt-1">Aucun venue disponible. Créez d'abord un venue dans la section Lieux.</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nom *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Mapping Principal"
                />
              </div>
              <div>
                <Label htmlFor="code">Code *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="MAP-001"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="mapping_type">Type *</Label>
                <Select value={formData.mapping_type} onValueChange={(v) => setFormData({ ...formData, mapping_type: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DEFAULT">Par Défaut</SelectItem>
                    <SelectItem value="EVENT_SPECIFIC">Spécifique à l'Événement</SelectItem>
                    <SelectItem value="SEASONAL">Saisonnier</SelectItem>
                    <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                    <SelectItem value="EMERGENCY">Urgence</SelectItem>
                    <SelectItem value="SPECIAL_EVENT">Événement Spécial</SelectItem>
                    <SelectItem value="REDUCED_CAPACITY">Capacité Réduite</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="effective_capacity">Capacité Effective *</Label>
                <Input
                  id="effective_capacity"
                  type="number"
                  min="1"
                  value={formData.effective_capacity}
                  onChange={(e) => setFormData({ ...formData, effective_capacity: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Description du mapping..."
                rows={3}
              />
            </div>
            <div className="flex items-center justify-between p-4 border rounded-md">
              <Label>Mapping actif</Label>
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
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
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
            <DialogTitle>Modifier le Mapping</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
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
                <Label htmlFor="edit_mapping_type">Type *</Label>
                <Select value={formData.mapping_type} onValueChange={(v) => setFormData({ ...formData, mapping_type: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DEFAULT">Par Défaut</SelectItem>
                    <SelectItem value="EVENT_SPECIFIC">Spécifique à l'Événement</SelectItem>
                    <SelectItem value="SEASONAL">Saisonnier</SelectItem>
                    <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                    <SelectItem value="EMERGENCY">Urgence</SelectItem>
                    <SelectItem value="SPECIAL_EVENT">Événement Spécial</SelectItem>
                    <SelectItem value="REDUCED_CAPACITY">Capacité Réduite</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit_effective_capacity">Capacité Effective *</Label>
                <Input
                  id="edit_effective_capacity"
                  type="number"
                  min="1"
                  value={formData.effective_capacity}
                  onChange={(e) => setFormData({ ...formData, effective_capacity: parseInt(e.target.value) || 0 })}
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
            <div className="flex items-center justify-between p-4 border rounded-md">
              <Label>Mapping actif</Label>
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

      {/* View Details Modal */}
      <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Détails du Mapping</DialogTitle>
            <DialogDescription>
              Informations complètes sur le mapping "{selectedMapping?.name}"
            </DialogDescription>
          </DialogHeader>
          {loadingDetails ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Basic Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Informations Générales</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm text-gray-600">Nom</Label>
                      <p className="font-medium">{selectedMapping?.name}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-600">Code</Label>
                      <p className="font-medium">{selectedMapping?.code}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-600">Type</Label>
                      <p className="font-medium">{selectedMapping?.mapping_type}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-600">Capacité Effective</Label>
                      <p className="font-medium">{selectedMapping?.effective_capacity}</p>
                    </div>
                    {selectedMapping?.valid_from && (
                      <div>
                        <Label className="text-sm text-gray-600">Date de Début</Label>
                        <p className="font-medium flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          {new Date(selectedMapping.valid_from).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    )}
                    {selectedMapping?.valid_until && (
                      <div>
                        <Label className="text-sm text-gray-600">Date de Fin</Label>
                        <p className="font-medium flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          {new Date(selectedMapping.valid_until).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    )}
                  </div>
                  {selectedMapping?.description && (
                    <div>
                      <Label className="text-sm text-gray-600">Description</Label>
                      <p className="text-sm mt-1">{selectedMapping.description}</p>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Badge variant={selectedMapping?.is_active ? "default" : "secondary"}>
                      {selectedMapping?.is_active ? (
                        <CheckCircle className="h-3 w-3 mr-1" />
                      ) : (
                        <XCircle className="h-3 w-3 mr-1" />
                      )}
                      {selectedMapping?.is_active ? "Actif" : "Inactif"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Zones */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Zones ({mappingZones.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {mappingZones.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">Aucune zone associée à ce mapping</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {mappingZones.map((zone) => (
                        <div
                          key={zone.id}
                          onClick={() => handleViewZone(zone)}
                          className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-medium text-sm">{zone.name}</p>
                              <p className="text-xs text-gray-500 mt-1">{zone.code}</p>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {zone.zone_type}
                            </Badge>
                          </div>
                          <div className="mt-2 flex items-center gap-4 text-xs text-gray-600">
                            <span>Capacité: {zone.capacity}</span>
                            {zone.base_price !== undefined && (
                              <span>Prix: {zone.base_price} {zone.currency}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Events */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Événements ({mappingEvents.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {mappingEvents.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">Aucun événement associé à ce venue</p>
                  ) : (
                    <div className="space-y-2">
                      {mappingEvents.map((event: any) => (
                        <div key={event.id} className="p-3 border rounded-lg">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-medium text-sm">{event.name || event.title}</p>
                              {event.description && (
                                <p className="text-xs text-gray-500 mt-1 line-clamp-2">{event.description}</p>
                              )}
                            </div>
                            {event.status && (
                              <Badge variant="outline" className="text-xs">
                                {event.status}
                              </Badge>
                            )}
                          </div>
                          {event.scheduledStart && (
                            <div className="mt-2 flex items-center gap-2 text-xs text-gray-600">
                              <Clock className="h-3 w-3" />
                              <span>{new Date(event.scheduledStart).toLocaleString('fr-FR')}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowViewModal(false)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Zone Details Modal */}
      <Dialog open={showZoneModal} onOpenChange={setShowZoneModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Détails de la Zone
            </DialogTitle>
            <DialogDescription>
              Informations complètes sur la zone "{selectedZone?.name}"
            </DialogDescription>
          </DialogHeader>
          {selectedZone && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-gray-600">Nom</Label>
                  <p className="font-medium">{selectedZone.name}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Code</Label>
                  <p className="font-medium">{selectedZone.code}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Type</Label>
                  <p className="font-medium">{selectedZone.zone_type}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Catégorie</Label>
                  <p className="font-medium">{selectedZone.category}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Capacité</Label>
                  <p className="font-medium">{selectedZone.capacity}</p>
                </div>
                {selectedZone.base_price !== undefined && (
                  <div>
                    <Label className="text-sm text-gray-600">Prix de Base</Label>
                    <p className="font-medium">{selectedZone.base_price} {selectedZone.currency}</p>
                  </div>
                )}
              </div>
              {selectedZone.description && (
                <div>
                  <Label className="text-sm text-gray-600">Description</Label>
                  <p className="text-sm mt-1">{selectedZone.description}</p>
                </div>
              )}
              {selectedZone.amenities && selectedZone.amenities.length > 0 && (
                <div>
                  <Label className="text-sm text-gray-600">Équipements</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedZone.amenities.map((amenity, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {amenity}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Badge variant={selectedZone.is_active ? "default" : "secondary"}>
                  {selectedZone.is_active ? (
                    <CheckCircle className="h-3 w-3 mr-1" />
                  ) : (
                    <XCircle className="h-3 w-3 mr-1" />
                  )}
                  {selectedZone.is_active ? "Actif" : "Inactif"}
                </Badge>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowZoneModal(false)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer le Mapping</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer le mapping "{selectedMapping?.name}" ? Cette action est irréversible.
              <br />
              <br />
              <strong>Note:</strong> Le mapping ne peut pas être supprimé s'il est associé à des zones, points d'accès ou événements.
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

    </div>
  );
}

