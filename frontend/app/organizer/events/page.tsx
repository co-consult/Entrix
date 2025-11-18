"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Sidebar } from "@/components/layout/sidebar";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Calendar, MapPin, BarChart3, CheckCircle, FilePlus, ListChecks } from "lucide-react";
import Link from "next/link";
import { eventsApi } from "@/lib/api/events";
import type { Event } from "@/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

function getOrganizerId(user: any): string | undefined {
  // Try both camelCase and snake_case for compatibility
  return user?.organizer_id || user?.organizerId;
}

export default function OrganizerEventsPage() {
  const { data: session } = useSession();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    scheduled_start: "",
    scheduled_end: "",
    is_public: true,
    requires_approval: false,
    venue_id: "",
  });
  const [formError, setFormError] = useState("");

  useEffect(() => {
    const organizerId = getOrganizerId(session?.user);
    if (organizerId) {
      fetchEvents(organizerId);
    } else {
      setEvents([]);
      setLoading(false);
    }
    // eslint-disable-next-line
  }, [session?.user]);

  const fetchEvents = async (organizerId: string) => {
    try {
      setLoading(true);
      const response = await eventsApi.getOrganizerEvents(organizerId);
      setEvents(Array.isArray(response) ? response : response.data || []);
    } catch (error) {
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (!form.name || !form.scheduled_start || !form.scheduled_end) {
      setFormError("Veuillez remplir tous les champs obligatoires.");
      return;
    }
    setCreating(true);
    try {
      await eventsApi.createEvent({
        ...form,
        scheduled_start: new Date(form.scheduled_start),
        scheduled_end: new Date(form.scheduled_end),
      });
      setShowCreateModal(false);
      setForm({
        name: "",
        description: "",
        scheduled_start: "",
        scheduled_end: "",
        is_public: true,
        requires_approval: false,
        venue_id: "",
      });
      toast({ title: "Succès", description: "Événement créé avec succès." });
      // Refresh events
      const organizerId = getOrganizerId(session?.user);
      if (organizerId) fetchEvents(organizerId);
    } catch (error) {
      setFormError("Erreur lors de la création de l'événement.");
    } finally {
      setCreating(false);
    }
  };

  // Compute stats for cards
  const totalEvents = events.length;
  const publishedEvents = events.filter(e => e.status === "PUBLISHED").length;
  const draftEvents = events.filter(e => e.status === "DRAFT").length;
  const upcomingEvents = events.filter(e => new Date(e.scheduled_start) > new Date()).length;

  const statsCards = [
    {
      title: "Total Événements",
      value: loading ? "..." : totalEvents,
      description: "Tous vos événements",
      icon: BarChart3,
      color: "text-blue-600",
    },
    {
      title: "Publiés",
      value: loading ? "..." : publishedEvents,
      description: "Événements publiés",
      icon: CheckCircle,
      color: "text-green-600",
    },
    {
      title: "Brouillons",
      value: loading ? "..." : draftEvents,
      description: "En cours de préparation",
      icon: FilePlus,
      color: "text-yellow-600",
    },
    {
      title: "À venir",
      value: loading ? "..." : upcomingEvents,
      description: "Prochains événements",
      icon: ListChecks,
      color: "text-purple-600",
    },
  ];

  return (
    <ProtectedRoute requiredRole="ORGANIZER">
      <div className="flex h-screen bg-background">
        <Sidebar type="organizer" />
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-auto p-6">
            <PageHeader
              title="Gestion des Événements"
              description="Créez, modifiez et gérez vos événements."
            >
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Créer un Événement
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
              {/* Main Event List */}
              <div className="flex-1 min-w-0">
                <Card>
                  <CardHeader>
                    <CardTitle>Mes Événements</CardTitle>
                    <CardDescription>Liste de tous vos événements</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="text-center py-8">Chargement...</div>
                    ) : events.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">Aucun événement trouvé.</div>
                    ) : (
                      <div className="space-y-4">
                        {events.map((event) => (
                          <div key={event.id} className="flex items-center justify-between p-4 border rounded-lg">
                            <div>
                              <h3 className="font-medium">{event.name}</h3>
                              <p className="text-sm text-muted-foreground flex items-center">
                                <Calendar className="mr-1 h-3 w-3" />
                                {new Date(event.scheduled_start).toLocaleDateString("fr-FR")}
                              </p>
                              <p className="text-sm text-muted-foreground flex items-center">
                                <MapPin className="mr-1 h-3 w-3" />
                                {event.venue?.name || "-"}
                              </p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge
                                className={
                                  event.status === "PUBLISHED"
                                    ? "bg-green-100 text-green-800"
                                    : event.status === "DRAFT"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-gray-100 text-gray-800"
                                }
                              >
                                {event.status}
                              </Badge>
                              <Button variant="outline" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="outline" size="sm" color="destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
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
                      <CardDescription>Raccourcis pour la gestion des événements</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Button className="w-full justify-start bg-transparent" variant="outline" onClick={() => setShowCreateModal(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Créer un Événement
                      </Button>
                      <Button className="w-full justify-start bg-transparent" variant="outline" asChild>
                        <Link href="/organizer/venues">
                          <MapPin className="mr-2 h-4 w-4" />
                          Gérer les Lieux
                        </Link>
                      </Button>
                      <Button className="w-full justify-start bg-transparent" variant="outline" asChild>
                        <Link href="/organizer/analytics">
                          <BarChart3 className="mr-2 h-4 w-4" />
                          Voir les Statistiques
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
              Créer un Nouvel Événement
            </DialogTitle>
            <DialogDescription className="text-base mt-1 mb-4">
              Remplissez les informations pour créer un événement. Tous les champs marqués * sont obligatoires.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateEvent} className="space-y-6">
            {/* Section: Informations Générales */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                <span className="font-semibold text-lg">Informations Générales</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="event-name" className="block mb-1 font-medium">Nom *</label>
                  <Input id="event-name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required placeholder="Nom de l'événement" />
                  <p className="text-xs text-muted-foreground mt-1">Le nom sera visible par les participants.</p>
                </div>
                <div>
                  <label htmlFor="event-public" className="block mb-1 font-medium">Public</label>
                  <div className="flex items-center gap-2 mt-1">
                    <input id="event-public" type="checkbox" checked={form.is_public} onChange={e => setForm(f => ({ ...f, is_public: e.target.checked }))} />
                    <span className="text-sm">Événement public</span>
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <label htmlFor="event-description" className="block mb-1 font-medium">Description</label>
                <Textarea id="event-description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} placeholder="Décrivez votre événement..." />
                <p className="text-xs text-muted-foreground mt-1">Ajoutez une description pour donner plus de détails aux participants.</p>
              </div>
            </div>
            {/* Section: Dates & Validation */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-5 w-5 text-green-600" />
                <span className="font-semibold text-lg">Dates & Validation</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="event-start" className="block mb-1 font-medium">Début *</label>
                  <Input id="event-start" type="datetime-local" value={form.scheduled_start} onChange={e => setForm(f => ({ ...f, scheduled_start: e.target.value }))} required />
                </div>
                <div>
                  <label htmlFor="event-end" className="block mb-1 font-medium">Fin *</label>
                  <Input id="event-end" type="datetime-local" value={form.scheduled_end} onChange={e => setForm(f => ({ ...f, scheduled_end: e.target.value }))} required />
                </div>
              </div>
              <div className="flex items-center gap-2 mt-4">
                <input id="event-approval" type="checkbox" checked={form.requires_approval} onChange={e => setForm(f => ({ ...f, requires_approval: e.target.checked }))} />
                <label htmlFor="event-approval" className="text-sm">Validation requise pour les inscriptions</label>
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