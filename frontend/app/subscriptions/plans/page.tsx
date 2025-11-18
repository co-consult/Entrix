"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Crown, Star, Calendar, Check, Search, Filter } from "lucide-react"
import { CustomCurrencyIcon } from "@/components/ui/custom-currency-icon"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { EmptyState } from "@/components/ui/empty-state"
import apiClient from "@/lib/api"
import type { SubscriptionPlan } from "@/types"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { subscriptionsApi } from "@/lib/api/subscriptions"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { organizerApi } from "@/lib/api/organizer";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import type { User } from "@/types";
import { PageHeader } from "@/components/ui/page-header"

export default function SubscriptionPlansPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedType, setSelectedType] = useState("all")
  const [selectedOrganizer, setSelectedOrganizer] = useState("all")
  const { data: session, status } = useSession()
  const router = useRouter()
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newPlan, setNewPlan] = useState({
    organizer_id: "", // TODO: Set this to the current organizer's ID
    name: "",
    description: "",
    type: "VIP",
    price: 0,
    currency: "EUR",
    duration_days: 30,
    max_events: 1,
    max_tickets: 1,
    benefits: "",
  });
  const [organizerId, setOrganizerId] = useState<string | null>(null);
  const [organizerFetchError, setOrganizerFetchError] = useState(false);
  const { toast } = useToast();
  const sessionUser = session?.user as User | undefined;

  useEffect(() => {
    fetchPlans()
    // Auto-fill organizer_id if available
    if (sessionUser?.organizer_id) {
      setNewPlan((prev) => ({ ...prev, organizer_id: sessionUser.organizer_id }));
    }
  }, [searchTerm, selectedType, selectedOrganizer, sessionUser?.organizer_id])

  useEffect(() => {
    async function fetchOrganizer() {
      try {
        const organizer = await organizerApi.getMyOrganizer();
        if (organizer?.id) {
          setOrganizerId(organizer.id);
          setNewPlan((prev) => ({ ...prev, organizer_id: organizer.id }));
        } else if (sessionUser?.organizer_id) {
          setOrganizerId(sessionUser.organizer_id);
          setNewPlan((prev) => ({ ...prev, organizer_id: sessionUser.organizer_id! }));
        } else {
          setOrganizerId(null);
        }
      } catch {
        setOrganizerFetchError(true);
        if (sessionUser?.organizer_id) {
          setOrganizerId(sessionUser.organizer_id);
          setNewPlan((prev) => ({ ...prev, organizer_id: sessionUser.organizer_id! }));
        } else {
          setOrganizerId(null);
        }
      }
    }
    if (showCreateModal) fetchOrganizer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showCreateModal]);

  const fetchPlans = async () => {
    try {
      setLoading(true)
      const response = await subscriptionsApi.getSubscriptionPlans({
        search: searchTerm,
        type: selectedType !== "all" ? selectedType : undefined,
        organizerId: selectedOrganizer !== "all" ? selectedOrganizer : undefined,
      })
      // Cast response as any to avoid type errors and ensure setPlans always receives an array
      const plansArray = Array.isArray((response as any)) ? (response as any) : (Array.isArray((response as any)?.data) ? (response as any).data : [])
      setPlans(plansArray)
    } catch (error) {
      console.error("Error fetching subscription plans:", error)
    } finally {
      setLoading(false)
    }
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
        return <Crown className="h-5 w-5" />
      case "FULL_SEASON":
        return <Calendar className="h-5 w-5" />
      case "FLEX":
        return <Star className="h-5 w-5" />
      default:
        return <Crown className="h-5 w-5" />
    }
  }

  const formatPrice = (price: number, currency: string = "TND") => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency,
    }).format(price);
  };

  const handleCreatePlan = async () => {
    if (!organizerId) return;
    setCreating(true);
    try {
      // Validate required fields
      if (!newPlan.organizer_id || !newPlan.name || !newPlan.type || !newPlan.price) {
        toast({ title: "Champs requis manquants", description: "Veuillez remplir tous les champs obligatoires.", variant: "destructive" });
        setCreating(false);
        return;
      }
      await subscriptionsApi.createSubscriptionPlan({
        ...newPlan,
        organizer_id: organizerId,
        price: Number(newPlan.price),
        duration_days: Number(newPlan.duration_days),
        max_events: newPlan.max_events ? Number(newPlan.max_events) : undefined,
        max_tickets: newPlan.max_tickets ? Number(newPlan.max_tickets) : undefined,
        benefits: newPlan.benefits ? newPlan.benefits.split('\n').map(b => b.trim()).filter(Boolean) : [],
        metadata: {
          createdBy: session?.user?.id || session?.user?.email || 'unknown',
          createdAt: new Date().toISOString(),
          createdVia: 'user_panel'
        }
      });
      setShowCreateModal(false);
      setNewPlan({
        organizer_id: organizerId,
        name: "",
        description: "",
        type: "VIP",
        price: 0,
        currency: "EUR",
        duration_days: 30,
        max_events: undefined,
        max_tickets: undefined,
        benefits: "",
      });
      fetchPlans(); // Refresh the list
              toast({ title: "Type créé avec succès" });
    } catch (e: any) {
              toast({ title: "Erreur lors de la création du type", description: e?.message || String(e), variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  // Only show the create button if the user is an admin
  const isAdmin = session?.user?.role === "ADMIN";

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <LoadingSpinner size="lg" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <PageHeader
          title="Plans d'Abonnement"
          description="Découvrez nos plans d'abonnement pour accéder à des événements exclusifs"
        >
          {isAdmin && (
            <Button onClick={() => setShowCreateModal(true)} variant="default">
              Créer un nouveau plan
            </Button>
          )}
        </PageHeader>

        <div className="mt-6 space-y-6">
          {/* Search and Filters */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher des plans..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  <SelectItem value="VIP">VIP</SelectItem>
                  <SelectItem value="PREMIUM">Premium</SelectItem>
                  <SelectItem value="FULL_SEASON">Saison complète</SelectItem>
                  <SelectItem value="FLEX">Flexible</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("")
                  setSelectedType("all")
                  setSelectedOrganizer("all")
                }}
              >
                <Filter className="mr-2 h-4 w-4" />
                Réinitialiser
              </Button>
            </div>
          </div>

          {/* Plans Grid */}
          <div>
            {plans.length === 0 ? (
              <EmptyState
                icon={<Crown className="h-12 w-12" />}
                title="Aucun plan trouvé"
                description={
                  searchTerm || selectedType !== "all"
                    ? "Essayez d'ajuster vos critères de recherche"
                    : "Aucun type d'abonnement n'est disponible pour le moment"
                }
                action={{
                  label: "Réinitialiser les filtres",
                  onClick: () => {
                    setSearchTerm("")
                    setSelectedType("all")
                    setSelectedOrganizer("all")
                  },
                }}
              />
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {plans.map((plan) => (
                  <Card key={plan.id} className="relative overflow-hidden hover:shadow-lg transition-shadow">
                    {plan.type === "VIP" && (
                      <div className="absolute top-4 right-4">
                        <Badge className="bg-yellow-100 text-yellow-800">
                          <Crown className="mr-1 h-3 w-3" />
                          Populaire
                        </Badge>
                      </div>
                    )}

                    <CardHeader>
                      <div className="flex items-center space-x-2">
                        {getTypeIcon(plan.type)}
                        <CardTitle className="text-xl">{plan.name}</CardTitle>
                      </div>
                      <CardDescription>{plan.organizer?.name}</CardDescription>
                      <Badge className={getTypeColor(plan.type)} variant="secondary">
                        {plan.type}
                      </Badge>
                    </CardHeader>

                    <CardContent>
                      <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">{plan.description}</p>

                        <div className="text-center">
                          <div className="text-3xl font-bold text-primary flex items-center justify-center gap-2">
                            <CustomCurrencyIcon className="h-6 w-6 text-green-600" />
                            {formatPrice(plan.price, plan.currency)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {plan.duration ? `${plan.duration} jours` : "Durée variable"}
                          </div>
                        </div>

                        {plan.max_events && (
                          <div className="text-center text-sm">
                            <span className="font-medium">Jusqu'à {plan.max_events} événements</span>
                          </div>
                        )}

                        {plan.benefits && plan.benefits.length > 0 && (
                          <div>
                            <h4 className="font-medium mb-2">Avantages inclus:</h4>
                            <ul className="space-y-1">
                              {plan.benefits.slice(0, 4).map((benefit, index) => (
                                <li key={index} className="flex items-center text-sm">
                                  <Check className="mr-2 h-3 w-3 text-green-600" />
                                  {benefit}
                                </li>
                              ))}
                              {plan.benefits.length > 4 && (
                                <li className="text-sm text-muted-foreground">
                                  +{plan.benefits.length - 4} autres avantages
                                </li>
                              )}
                            </ul>
                          </div>
                        )}

                        <div className="space-y-2 pt-4">
                          <Button
                            onClick={() => {
                              if (!session) {
                                router.push(`/auth/login?callbackUrl=/subscriptions/purchase/${plan.id}`)
                              } else {
                                router.push(`/subscriptions/purchase/${plan.id}`)
                              }
                            }}
                            className="w-full"
                          >
                            S'abonner
                          </Button>
                          <Button variant="outline" className="w-full bg-transparent" asChild>
                            <Link href={`/subscriptions/plans/${plan.id}`}>Voir les détails</Link>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold mb-6 text-center">Questions fréquentes</h2>
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Comment fonctionne un abonnement ?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Un abonnement vous donne accès à un nombre défini d'événements pendant une période donnée, avec des
                  avantages exclusifs selon le type d'abonnement choisi.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Puis-je annuler mon abonnement ?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Oui, vous pouvez annuler votre abonnement à tout moment depuis votre espace personnel. Les conditions
                  d'annulation varient selon le type d'abonnement.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Que se passe-t-il si un événement est annulé ?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  En cas d'annulation d'un événement, votre crédit d'événement est automatiquement restauré et peut être
                  utilisé pour un autre événement.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Les abonnements sont-ils transférables ?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Les abonnements sont personnels et non transférables. Cependant, certains plans permettent d'inviter
                  des accompagnateurs selon les conditions spécifiques.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
        {showCreateModal && (
          <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Créer un nouveau type d'abonnement</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {organizerId === null && (
                  <Alert variant="destructive">
                    <AlertTitle>Impossible de trouver l'organisateur</AlertTitle>
                    <AlertDescription>
                      Vous n'êtes pas lié à un organisateur. Veuillez contacter un administrateur.
                    </AlertDescription>
                  </Alert>
                )}
                <Input
                  placeholder="ID de l'organisateur"
                  value={organizerId || ""}
                  readOnly
                  disabled
                  className="bg-gray-100"
                />
                <Input
                  placeholder="Nom du plan"
                  value={newPlan.name}
                  onChange={e => setNewPlan({ ...newPlan, name: e.target.value })}
                  required
                />
                <Input
                  placeholder="Description"
                  value={newPlan.description}
                  onChange={e => setNewPlan({ ...newPlan, description: e.target.value })}
                />
                <Select value={newPlan.type} onValueChange={val => setNewPlan({ ...newPlan, type: val })}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Type de plan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BASIC">BASIC</SelectItem>
                    <SelectItem value="PREMIUM">PREMIUM</SelectItem>
                    <SelectItem value="VIP">VIP</SelectItem>
                    <SelectItem value="CORPORATE">CORPORATE</SelectItem>
                    <SelectItem value="STUDENT">STUDENT</SelectItem>
                    <SelectItem value="SENIOR">SENIOR</SelectItem>
                    <SelectItem value="FAMILY">FAMILY</SelectItem>
                    <SelectItem value="ANNUAL">ANNUAL</SelectItem>
                    <SelectItem value="SEASONAL">SEASONAL</SelectItem>
                    <SelectItem value="EVENT_SPECIFIC">EVENT_SPECIFIC</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  placeholder="Prix (€)"
                  value={newPlan.price}
                  onChange={e => setNewPlan({ ...newPlan, price: e.target.value })}
                  required
                />
                <Input
                  placeholder="Devise (ex: EUR)"
                  value={newPlan.currency}
                  onChange={e => setNewPlan({ ...newPlan, currency: e.target.value })}
                />
                <Input
                  type="number"
                  placeholder="Durée (jours)"
                  value={newPlan.duration_days}
                  onChange={e => setNewPlan({ ...newPlan, duration_days: e.target.value })}
                />
                <Input
                  type="number"
                  placeholder="Nombre max d'événements"
                  value={newPlan.max_events}
                  onChange={e => setNewPlan({ ...newPlan, max_events: e.target.value })}
                />
                <Input
                  type="number"
                  placeholder="Nombre max de tickets"
                  value={newPlan.max_tickets}
                  onChange={e => setNewPlan({ ...newPlan, max_tickets: e.target.value })}
                />
                <textarea
                  className="w-full border rounded p-2"
                  placeholder="Avantages (un par ligne)"
                  value={newPlan.benefits}
                  onChange={e => setNewPlan({ ...newPlan, benefits: e.target.value })}
                  rows={4}
                />
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setShowCreateModal(false)} disabled={creating}>Annuler</Button>
                  <Button onClick={handleCreatePlan} loading={creating} disabled={creating}>Créer</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  )
}
