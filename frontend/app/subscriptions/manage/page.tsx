"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { Sidebar } from "@/components/layout/sidebar"
import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { 
  Plus, 
  Eye, 
  Crown, 
  Star, 
  Calendar, 
  Users, 
  TrendingUp,
  Settings,
  X,
  Save
} from "lucide-react";
import { CustomCurrencyIcon } from "@/components/ui/custom-currency-icon";
import { DataTable } from "@/components/ui/data-table"
import apiClient from "@/lib/api"
import type { SubscriptionPlan } from "@/types"
import Link from "next/link"
import type { User } from "@/types";

export default function ManageSubscriptionsPage() {
  const { data: session } = useSession()
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "FLEX",
    price: "",
    duration_days: "",
    max_events: "",
    benefits: [""],
  })

  const sessionUser = session?.user as User | undefined;

  useEffect(() => {
    fetchPlans()
  }, [])

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const params = sessionUser?.organizer_id
        ? { organizer_id: sessionUser.organizer_id }
        : {};
      const response = await apiClient.getSubscriptionPlans(params);
      setPlans(response.data || []);
    } catch (error) {
      console.error("Error fetching subscription plans:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert("Le nom du plan est obligatoire.");
      return;
    }
    if (!sessionUser?.organizer_id) {
      alert("Votre profil d'organisateur est manquant. Veuillez contacter l'administrateur.");
      return;
    }
    try {
      console.log("sessionUser", sessionUser);
      const organizer_id = sessionUser.organizer_id;
      const planData = {
        name: formData.name,
        description: formData.description,
        type: formData.type,
        price: Number.parseFloat(formData.price),
        duration_days: formData.duration_days ? Number.parseInt(formData.duration_days) : undefined,
        max_events: formData.max_events ? Number.parseInt(formData.max_events) : undefined,
        benefits: formData.benefits.filter((b) => b.trim() !== ""),
        organizer_id,
      };
      console.log("Submitting planData:", planData);
      await apiClient.createSubscriptionPlan(planData)
      await fetchPlans()
      setIsCreateDialogOpen(false)
      resetForm()
    } catch (error) {
      console.error("Error saving subscription plan:", error)
    }
  }



  const handleViewPlan = (plan: any) => {
    // setSelectedPlan(plan); // This state variable is not defined in the original file
    // setShowViewModal(true); // This state variable is not defined in the original file
  };

  const addBenefit = () => {
    setFormData((prev) => ({
      ...prev,
      benefits: [...prev.benefits, ""],
    }))
  }

  const updateBenefit = (index: number, value: string) => {
    setFormData((prev) => ({
      ...prev,
      benefits: prev.benefits.map((benefit, i) => (i === index ? value : benefit)),
    }))
  }

  const removeBenefit = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      benefits: prev.benefits.filter((_, i) => i !== index),
    }))
  }

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      type: "FLEX",
      price: "",
      duration_days: "",
      max_events: "",
      benefits: [""],
    })
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "VIP":
        return "bg-yellow-100 text-yellow-800"
      case "PREMIUM":
        return "bg-purple-100 text-purple-800"
      case "FULL_SEASON":
        return "bg-blue-100 text-blue-800"
      case "FLEX":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "VIP":
        return <Crown className="h-4 w-4" />
      case "FULL_SEASON":
        return <Calendar className="h-4 w-4" />
      case "FLEX":
        return <Star className="h-4 w-4" />
      default:
        return <Crown className="h-4 w-4" />
    }
  }

  const columns = [
    {
      accessorKey: "name",
      header: "Nom",
      cell: ({ row }: any) => (
        <div className="flex items-center space-x-2">
          {getTypeIcon(row.original.type)}
          <span className="font-medium">{row.getValue("name")}</span>
        </div>
      ),
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }: any) => <Badge className={getTypeColor(row.getValue("type"))}>{row.getValue("type")}</Badge>,
    },
    {
      accessorKey: "price",
      header: "Prix",
      cell: ({ row }: any) => `${row.getValue("price")} DT`,
    },
    {
      accessorKey: "duration",
      header: "Durée",
      cell: ({ row }: any) => {
        const duration = row.getValue("duration")
        return duration ? `${duration} jours` : "Variable"
      },
    },
    {
      accessorKey: "maxEvents",
      header: "Max événements",
      cell: ({ row }: any) => {
        const maxEvents = row.getValue("maxEvents")
        return maxEvents || "Illimité"
      },
    },
    {
      accessorKey: "isActive",
      header: "Statut",
      cell: ({ row }: any) => (
        <Badge variant={row.getValue("isActive") ? "default" : "secondary"}>
          {row.getValue("isActive") ? "Actif" : "Inactif"}
        </Badge>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }: any) => (
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={() => handleViewPlan(row.original)}>
            <Eye className="h-3 w-3" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <ProtectedRoute requiredRole="ORGANIZER">
      <div className="flex h-screen bg-background">
        <Sidebar type="organizer" />
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-auto p-6">
            <PageHeader title="Gestion des Abonnements" description="Créez et gérez vos plans d'abonnement">
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={resetForm}>
                    <Plus className="mr-2 h-4 w-4" />
                    Créer un plan
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl w-full">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-2xl font-bold">
                      <Plus className="h-6 w-6 text-primary" />
                      Créer un nouveau plan
                    </DialogTitle>
                    <DialogDescription className="text-base mt-1 mb-4">Configurez les détails de votre type d'abonnement. Tous les champs marqués * sont obligatoires.</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreatePlan} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="name">Nom du plan *</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                          required
                          placeholder="Ex: Abonnement Premium"
                        />
                        <span className="text-xs text-muted-foreground">Le nom sera visible par les utilisateurs.</span>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="type">Type *</Label>
                        <Select
                          value={formData.type}
                          onValueChange={(value) => setFormData((prev) => ({ ...prev, type: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Choisir un type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="VIP">VIP</SelectItem>
                            <SelectItem value="PREMIUM">Premium</SelectItem>
                            <SelectItem value="FULL_SEASON">Saison complète</SelectItem>
                            <SelectItem value="FLEX">Flexible</SelectItem>
                          </SelectContent>
                        </Select>
                        <span className="text-xs text-muted-foreground">Détermine les avantages et restrictions du plan.</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                        rows={3}
                        placeholder="Décrivez les avantages du plan..."
                      />
                      <span className="text-xs text-muted-foreground">Facultatif. Fournit plus de détails aux utilisateurs.</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="price">Prix (DT) *</Label>
                        <Input
                          id="price"
                          type="number"
                          step="0.01"
                          value={formData.price}
                          onChange={(e) => setFormData((prev) => ({ ...prev, price: e.target.value }))}
                          required
                          placeholder="Ex: 99.99"
                        />
                        <span className="text-xs text-muted-foreground">Prix total du plan.</span>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="duration">Durée (jours)</Label>
                        <Input
                          id="duration"
                          type="number"
                          value={formData.duration_days}
                          onChange={(e) => setFormData((prev) => ({ ...prev, duration_days: e.target.value }))}
                          placeholder="Ex: 30"
                        />
                        <span className="text-xs text-muted-foreground">Laisser vide pour une durée illimitée.</span>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="maxEvents">Max événements</Label>
                        <Input
                          id="maxEvents"
                          type="number"
                          value={formData.max_events}
                          onChange={(e) => setFormData((prev) => ({ ...prev, max_events: e.target.value }))}
                          placeholder="Ex: 10"
                        />
                        <span className="text-xs text-muted-foreground">Nombre maximum d'événements inclus.</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Avantages</Label>
                      {formData.benefits.map((benefit, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <Input
                            value={benefit}
                            onChange={(e) => updateBenefit(index, e.target.value)}
                            placeholder="Avantage..."
                          />
                          {formData.benefits.length > 1 && (
                            <Button type="button" variant="outline" size="sm" onClick={() => removeBenefit(index)}>
                              <X className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      ))}
                      <Button type="button" variant="outline" onClick={addBenefit} size="sm">
                        <Plus className="mr-2 h-3 w-3" />
                        Ajouter un avantage
                      </Button>
                      <span className="text-xs text-muted-foreground">Ajoutez un ou plusieurs avantages pour ce plan.</span>
                    </div>

                    <div className="flex justify-end space-x-2 mt-6">
                      <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                        Annuler
                      </Button>
                      <Button type="submit" className="font-semibold">
                        Créer
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </PageHeader>

            <Tabs defaultValue="plans" className="mt-6">
              <TabsList>
                <TabsTrigger value="plans">Mes Plans</TabsTrigger>
                <TabsTrigger value="subscribers">Abonnés</TabsTrigger>
                <TabsTrigger value="analytics">Analyses</TabsTrigger>
              </TabsList>

              <TabsContent value="plans" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Plans d'abonnement</CardTitle>
                    <CardDescription>Gérez vos plans d'abonnement et leurs paramètres</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <DataTable
                      columns={columns}
                      data={plans}
                      searchKey="name"
                      searchPlaceholder="Rechercher des plans..."
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="subscribers" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Abonnés</CardTitle>
                    <CardDescription>Liste de vos abonnés actifs</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-center py-8">Fonctionnalité en cours de développement</p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="analytics" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Analyses</CardTitle>
                    <CardDescription>Statistiques de vos abonnements</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-center py-8">Fonctionnalité en cours de développement</p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
