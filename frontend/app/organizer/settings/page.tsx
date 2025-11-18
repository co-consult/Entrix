"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Sidebar } from "@/components/layout/sidebar";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import type { Organizer } from "@/types";
import apiClient from "@/lib/api";
import { Building2, CheckCircle, Calendar, MapPin, Shield } from "lucide-react";
import Link from "next/link";

function getOrganizerId(user: any): string | undefined {
  return user?.organizer_id || user?.organizerId;
}

export default function OrganizerSettingsPage() {
  const { data: session } = useSession();
  const [organizer, setOrganizer] = useState<Organizer | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    contact_email: "",
    contact_phone: "",
    website: "",
    logo: "",
  });

  useEffect(() => {
    const organizerId = getOrganizerId(session?.user);
    if (organizerId) {
      fetchOrganizer(organizerId);
    } else {
      setOrganizer(null);
      setLoading(false);
    }
    // eslint-disable-next-line
  }, [session?.user]);

  const fetchOrganizer = async (organizerId: string) => {
    try {
      setLoading(true);
      const response = await apiClient.getOrganizer(organizerId);
      // Type guard for response
      const data = (response && typeof response === 'object' && 'data' in response) ? (response as any).data : response;
      setOrganizer(data);
      setForm({
        name: data?.name || "",
        description: data?.description || "",
        contact_email: data?.contact_email || "",
        contact_phone: data?.contact_phone || "",
        website: data?.website || "",
        logo: data?.logo || "",
      });
    } catch (error) {
      setOrganizer(null);
      toast({ title: "Erreur", description: "Erreur lors du chargement du profil organisateur.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organizer) return;
    setSaving(true);
    try {
      await apiClient.updateOrganizer(organizer.id, form);
      toast({ title: "Succès", description: "Profil organisateur mis à jour !" });
      fetchOrganizer(organizer.id);
    } catch (error) {
      toast({ title: "Erreur", description: "Erreur lors de la mise à jour du profil organisateur.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  // Organizer stats for summary cards
  const statsCards = [
    {
      title: "Nom",
      value: loading ? "..." : organizer?.name || "-",
      description: "Nom de l'organisation",
      icon: Building2,
      color: "text-blue-600",
    },
    {
      title: "Type",
      value: loading ? "..." : organizer?.type || "-",
      description: "Type d'organisateur",
      icon: Shield,
      color: "text-green-600",
    },
    {
      title: "Statut",
      value: loading ? "..." : organizer?.verification_status || "-",
      description: "Vérification",
      icon: CheckCircle,
      color: organizer?.verification_status === "APPROVED" ? "text-green-600" : "text-yellow-600",
    },
    {
      title: "Événements",
      value: loading ? "..." : (organizer?.events?.length ?? "-"),
      description: "Total organisés",
      icon: Calendar,
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
              title="Paramètres de l'Organisateur"
              description="Gérez les informations de votre profil organisateur."
            />
            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6 mt-6">
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
            {/* Quick Actions Card */}
            <div className="grid gap-6 md:grid-cols-4 mb-6">
              <Card className="col-span-1">
                <CardHeader>
                  <CardTitle>Actions Rapides</CardTitle>
                  <CardDescription>Raccourcis pour l'organisateur</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button className="w-full justify-start bg-transparent" variant="outline" asChild>
                    <Link href="/organizer/events">
                      <Calendar className="mr-2 h-4 w-4" />
                      Voir mes Événements
                    </Link>
                  </Button>
                  <Button className="w-full justify-start bg-transparent" variant="outline" asChild>
                    <Link href="/organizer/venues">
                      <MapPin className="mr-2 h-4 w-4" />
                      Voir mes Lieux
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
            {/* Profile Form */}
            <Card className="mt-6 max-w-xl mx-auto">
              <CardHeader>
                <CardTitle>Profil Organisateur</CardTitle>
                <CardDescription>Modifiez les informations de votre organisation</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">Chargement...</div>
                ) : !organizer ? (
                  <div className="text-center py-8 text-muted-foreground">Aucun profil organisateur trouvé.</div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="name">Nom</Label>
                      <Input id="name" name="name" value={form.name} onChange={handleChange} required />
                    </div>
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea id="description" name="description" value={form.description} onChange={handleChange} rows={3} />
                    </div>
                    <div>
                      <Label htmlFor="contact_email">Email de contact</Label>
                      <Input id="contact_email" name="contact_email" value={form.contact_email} onChange={handleChange} type="email" required />
                    </div>
                    <div>
                      <Label htmlFor="contact_phone">Téléphone</Label>
                      <Input id="contact_phone" name="contact_phone" value={form.contact_phone} onChange={handleChange} />
                    </div>
                    <div>
                      <Label htmlFor="website">Site web</Label>
                      <Input id="website" name="website" value={form.website} onChange={handleChange} />
                    </div>
                    <div>
                      <Label htmlFor="logo">Logo (URL)</Label>
                      <Input id="logo" name="logo" value={form.logo} onChange={handleChange} />
                    </div>
                    <Button type="submit" className="w-full" disabled={saving}>
                      {saving ? "Enregistrement..." : "Enregistrer les modifications"}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
} 