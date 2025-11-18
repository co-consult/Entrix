"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Sidebar } from "@/components/layout/sidebar";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Building2, CheckCircle, BarChart3, Plus } from "lucide-react";
import Link from "next/link";
import { eventsApi } from "@/lib/api/events";
import type { Event, Venue } from "@/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import apiClient from "@/lib/api";

function getOrganizerId(user: any): string | undefined {
  return user?.organizer_id || user?.organizerId;
}

type VenueEntry = { venue: Venue; eventCount: number };

export default function OrganizerVenuesPage() {
  const { data: session } = useSession();
  const [venueEntries, setVenueEntries] = useState<VenueEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    address: "",
    city: "",
    country: "",
    capacity: 0,
    type: "INDOOR",
  });
  const [formError, setFormError] = useState("");

  useEffect(() => {
    const organizerId = getOrganizerId(session?.user);
    if (organizerId) {
      fetchVenues(organizerId);
    } else {
      setVenueEntries([]);
      setLoading(false);
    }
    // eslint-disable-next-line
  }, [session?.user]);

  const fetchVenues = async (organizerId: string) => {
    try {
      setLoading(true);
      const eventsResponse = await eventsApi.getOrganizerEvents(organizerId);
      const events: Event[] = Array.isArray(eventsResponse) ? eventsResponse : eventsResponse.data || [];
      // Aggregate all unique venues from all events
      const venueMap: Record<string, { venue: Venue; eventCount: number }> = {};
      events.forEach(event => {
        if (event.venue) {
          if (!venueMap[event.venue.id]) {
            venueMap[event.venue.id] = { venue: event.venue, eventCount: 1 };
          } else {
            venueMap[event.venue.id].eventCount += 1;
          }
        }
      });
      setVenueEntries(Object.values(venueMap));
    } catch (error) {
      setVenueEntries([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateVenue = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (!form.name || !form.address || !form.city || !form.country || !form.capacity) {
      setFormError("Veuillez remplir tous les champs obligatoires.");
      return;
    }
    setCreating(true);
    try {
      await apiClient.createVenue({ ...form });
      setShowCreateModal(false);
      setForm({
        name: "",
        description: "",
        address: "",
        city: "",
        country: "",
        capacity: 0,
        type: "INDOOR",
      });
      toast({ title: "Succès", description: "Lieu créé avec succès." });
      // Refresh venues
      const organizerId = getOrganizerId(session?.user);
      if (organizerId) fetchVenues(organizerId);
    } catch (error) {
      setFormError("Erreur lors de la création du lieu.");
    } finally {
      setCreating(false);
    }
  };

  // Compute stats for cards
  const totalVenues = venueEntries.length;
  const totalEvents = venueEntries.reduce((sum, entry) => sum + entry.eventCount, 0);
  const activeVenues = venueEntries.filter(entry => entry.venue.is_active).length;
  const uniqueCities = new Set(venueEntries.map(entry => entry.venue.city)).size;

  const statsCards = [
    {
      title: "Lieux",
      value: loading ? "..." : totalVenues,
      description: "Total utilisés",
      icon: Building2,
      color: "text-blue-600",
    },
    {
      title: "Actifs",
      value: loading ? "..." : activeVenues,
      description: "Lieux actifs",
      icon: CheckCircle,
      color: "text-green-600",
    },
    {
      title: "Villes",
      value: loading ? "..." : uniqueCities,
      description: "Villes couvertes",
      icon: MapPin,
      color: "text-purple-600",
    },
    {
      title: "Événements",
      value: loading ? "..." : totalEvents,
      description: "Événements organisés",
      icon: BarChart3,
      color: "text-yellow-600",
    },
  ];

  return (
    <ProtectedRoute requiredRole="ORGANIZER">
      <div className="flex h-screen bg-background">
        <Sidebar type="organizer" />
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-auto p-6">
            <PageHeader
              title="Gestion des Lieux"
              description="Liste de tous les lieux utilisés pour vos événements."
            >
              <Button onClick={() => setShowCreateModal(true)}>
                <MapPin className="mr-2 h-4 w-4" />
                Ajouter un Lieu
              </Button>
            </PageHeader>
            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-4 mt-6">
              {statsCards.map((stat) => (
                <Card key={stat.title}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                    <stat.icon className={`h-4 w-4 ${stat.color}`} />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <p className="text-xs text-muted-foreground">{stat.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
            {/* Main Content with Sidebar */}
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Main Table */}
              <div className="flex-1 min-w-0">
                <Card>
                  <CardHeader>
                    <CardTitle>Lieux</CardTitle>
                    <CardDescription>Liste de tous les lieux utilisés pour vos événements</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="text-center py-8">Chargement...</div>
                    ) : venueEntries.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">Aucun lieu trouvé.</div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead>
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Nom</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Adresse</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Ville</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Capacité</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Événements</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {venueEntries.map((entry, idx) => (
                              <tr key={entry.venue.id + "-" + idx}>
                                <td className="px-4 py-2 whitespace-nowrap">{entry.venue.name}</td>
                                <td className="px-4 py-2 whitespace-nowrap">{entry.venue.address}</td>
                                <td className="px-4 py-2 whitespace-nowrap">{entry.venue.city}</td>
                                <td className="px-4 py-2 whitespace-nowrap">{entry.venue.capacity}</td>
                                <td className="px-4 py-2 whitespace-nowrap">{entry.eventCount}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
              {/* Quick Actions Sidebar */}
              <div className="lg:w-80 w-full flex-shrink-0">
                <div className="lg:sticky lg:top-24">
                  <Card>
                    <CardHeader>
                      <CardTitle>Actions Rapides</CardTitle>
                      <CardDescription>Raccourcis pour la gestion des lieux</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Button className="w-full justify-start bg-transparent" variant="outline" onClick={() => setShowCreateModal(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Ajouter un Lieu
                      </Button>
                      <Button className="w-full justify-start bg-transparent" variant="outline" asChild>
                        <Link href="/organizer/events">
                          <BarChart3 className="mr-2 h-4 w-4" />
                          Voir les Événements
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-2xl w-full">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl font-bold">
              <Plus className="h-6 w-6 text-primary" />
              Ajouter un Lieu
            </DialogTitle>
            <DialogDescription className="text-base mt-1 mb-4">
              Remplissez les informations pour ajouter un lieu. Tous les champs marqués * sont obligatoires.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateVenue} className="space-y-6">
            {/* Section: Informations Générales */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="h-5 w-5 text-blue-600" />
                <span className="font-semibold text-lg">Informations Générales</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="venue-name" className="block mb-1 font-medium">Nom *</label>
                  <Input id="venue-name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required placeholder="Nom du lieu" />
                  <p className="text-xs text-muted-foreground mt-1">Le nom du lieu sera visible par les participants.</p>
                </div>
                <div>
                  <label htmlFor="venue-type" className="block mb-1 font-medium">Type *</label>
                  <select id="venue-type" className="w-full border rounded px-3 py-2" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} required>
                    <option value="INDOOR">Intérieur</option>
                    <option value="OUTDOOR">Extérieur</option>
                    <option value="HYBRID">Hybride</option>
                  </select>
                  <p className="text-xs text-muted-foreground mt-1">Choisissez le type de lieu.</p>
                </div>
              </div>
              <div className="mt-4">
                <label htmlFor="venue-description" className="block mb-1 font-medium">Description</label>
                <Textarea id="venue-description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} placeholder="Décrivez le lieu..." />
                <p className="text-xs text-muted-foreground mt-1">Ajoutez une description pour donner plus de détails aux participants.</p>
              </div>
            </div>
            {/* Section: Localisation & Capacité */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="h-5 w-5 text-green-600" />
                <span className="font-semibold text-lg">Localisation & Capacité</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="venue-address" className="block mb-1 font-medium">Adresse *</label>
                  <Input id="venue-address" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} required placeholder="Adresse du lieu" />
                </div>
                <div>
                  <label htmlFor="venue-city" className="block mb-1 font-medium">Ville *</label>
                  <Input id="venue-city" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} required placeholder="Ville" />
                </div>
                <div>
                  <label htmlFor="venue-country" className="block mb-1 font-medium">Pays *</label>
                  <Input id="venue-country" value={form.country} onChange={e => setForm(f => ({ ...f, country: e.target.value }))} required placeholder="Pays" />
                </div>
                <div>
                  <label htmlFor="venue-capacity" className="block mb-1 font-medium">Capacité *</label>
                  <Input id="venue-capacity" type="number" value={form.capacity} onChange={e => setForm(f => ({ ...f, capacity: Number(e.target.value) }))} required min={1} placeholder="Capacité" />
                </div>
              </div>
            </div>
            {formError && <div className="text-red-600 text-sm">{formError}</div>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)}>Annuler</Button>
              <Button type="submit" disabled={creating}>{creating ? "Création..." : "Créer"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </ProtectedRoute>
  );
} 