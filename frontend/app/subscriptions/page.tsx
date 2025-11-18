"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Sidebar } from "@/components/layout/sidebar"
import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Crown, Calendar, Star, Plus, Eye, Settings, AlertTriangle } from "lucide-react"
import apiClient from "@/lib/api"
import type { Subscription, SubscriptionPlan } from "@/types"
import Link from "next/link"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function SubscriptionsPage() {
  const { data: session, status } = useSession()
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [availablePlans, setAvailablePlans] = useState<SubscriptionPlan[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === "authenticated") {
      fetchSubscriptions()
      fetchAvailablePlans()
    }
  }, [status])

  const fetchSubscriptions = async () => {
    try {
      const subscriptions = await apiClient.getSubscriptions({
        user_id: session?.user?.id,
        search: searchTerm,
        status: selectedStatus !== "all" ? selectedStatus : undefined,
      })
      setSubscriptions(Array.isArray(subscriptions) ? subscriptions : [])
    } catch (error) {
      console.error("Error fetching subscriptions:", error)
    }
  }

  const fetchAvailablePlans = async () => {
    try {
      const response = await apiClient.getSubscriptionPlans({ is_active: true })
      setAvailablePlans(response.data || [])
    } catch (error) {
      console.error("Error fetching subscription plans:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-800"
      case "SUSPENDED":
        return "bg-yellow-100 text-yellow-800"
      case "EXPIRED":
        return "bg-red-100 text-red-800"
      case "CANCELLED":
        return "bg-gray-100 text-gray-800"
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

  const calculateProgress = (subscription: Subscription) => {
    if (!subscription.end_date) return 0
    const now = new Date()
    const start = new Date(subscription.start_date)
    const end = new Date(subscription.end_date)
    const total = end.getTime() - start.getTime()
    const elapsed = now.getTime() - start.getTime()
    return Math.min(Math.max((elapsed / total) * 100, 0), 100)
  }

  const getDaysRemaining = (subscription: Subscription) => {
    if (!subscription.end_date) return null
    const now = new Date()
    const end = new Date(subscription.end_date)
    const diff = end.getTime() - now.getTime()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  }

  if (loading) {
    return (
        <div className="flex h-screen bg-background">
          <Sidebar type="user" />
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p>Chargement des abonnements...</p>
            </div>
          </div>
        </div>
    )
  }

  return (
      <div className="flex h-screen bg-background">
        <Sidebar type="user" />
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-auto p-6">
            {/* Development Notice */}
            <Alert className="mb-6 border-orange-200 bg-orange-50">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <AlertTitle className="text-orange-800">Interface en Développement</AlertTitle>
              <AlertDescription className="text-orange-700">
                Cette interface est actuellement en cours de développement. Certaines fonctionnalités peuvent ne pas être disponibles ou être en cours d'implémentation.
              </AlertDescription>
            </Alert>

            <PageHeader title="Mes Abonnements" description="Gérez vos abonnements et découvrez de nouveaux plans">
              <Button asChild>
                <Link href="/subscriptions/plans">
                  <Plus className="mr-2 h-4 w-4" />
                  Découvrir les Plans
                </Link>
              </Button>
            </PageHeader>

            <Tabs defaultValue="active" className="mt-6">
              <TabsList>
                <TabsTrigger value="active">Abonnements Actifs</TabsTrigger>
                <TabsTrigger value="available">Plans Disponibles</TabsTrigger>
                <TabsTrigger value="history">Historique</TabsTrigger>
              </TabsList>

              <TabsContent value="active" className="mt-6">
                {subscriptions.filter((s) => s.status === "ACTIVE").length > 0 ? (
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {subscriptions
                      .filter((s) => s.status === "ACTIVE")
                      .map((subscription) => {
                        const progress = calculateProgress(subscription)
                        const daysRemaining = getDaysRemaining(subscription)

                        return (
                          <Card key={subscription.id} className="relative overflow-hidden">
                            <CardHeader>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  {getTypeIcon(subscription.subscription_plan?.type || "")}
                                  <CardTitle className="text-lg">{subscription.subscription_plan?.name}</CardTitle>
                                </div>
                                <Badge className={getStatusColor(subscription.status)}>{subscription.status}</Badge>
                              </div>
                              <CardDescription>{subscription.organizer?.name}</CardDescription>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-4">
                                <p className="text-sm text-muted-foreground">
                                  {subscription.subscription_plan?.description}
                                </p>

                                {subscription.end_date && (
                                  <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                      <span>Progression</span>
                                      <span>
                                        {daysRemaining !== null && daysRemaining > 0
                                          ? `${daysRemaining} jours restants`
                                          : "Expiré"}
                                      </span>
                                    </div>
                                    <Progress value={progress} className="h-2" />
                                  </div>
                                )}

                                <div className="flex items-center justify-between">
                                  <div className="text-2xl font-bold text-primary">
                                    {subscription.subscription_plan?.price} DT
                                  </div>
                                  <div className="flex space-x-2">
                                    <Button variant="outline" size="sm" asChild>
                                      <Link href={`/subscriptions/${subscription.id}`}>
                                        <Eye className="mr-1 h-3 w-3" />
                                        Détails
                                      </Link>
                                    </Button>
                                    <Button variant="outline" size="sm">
                                      <Settings className="mr-1 h-3 w-3" />
                                      Gérer
                                    </Button>
                                  </div>
                                </div>
                                

                              </div>
                            </CardContent>
                          </Card>
                        )
                      })}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <Crown className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium mb-2">Aucun abonnement actif</h3>
                      <p className="text-muted-foreground text-center mb-4">
                        Découvrez nos plans d'abonnement pour accéder à des événements exclusifs
                      </p>
                      <Button asChild>
                        <Link href="/subscriptions/plans">Voir les plans disponibles</Link>
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="available" className="mt-6">
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {availablePlans.map((plan) => (
                    <Card key={plan.id} className="relative">
                      <CardHeader>
                        <div className="flex items-center space-x-2">
                          {getTypeIcon(plan.type)}
                          <CardTitle className="text-lg">{plan.name}</CardTitle>
                        </div>
                        <CardDescription>{plan.organizer?.name}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <p className="text-sm text-muted-foreground">{plan.description}</p>

                          {plan.benefits && (
                            <div>
                              <h4 className="font-medium mb-2">Avantages inclus:</h4>
                              <ul className="text-sm space-y-1">
                                {plan.benefits.slice(0, 3).map((benefit, index) => (
                                  <li key={index} className="flex items-center">
                                    <div className="w-1.5 h-1.5 bg-primary rounded-full mr-2" />
                                    {benefit}
                                  </li>
                                ))}
                                {plan.benefits.length > 3 && (
                                  <li className="text-muted-foreground">
                                    +{plan.benefits.length - 3} autres avantages
                                  </li>
                                )}
                              </ul>
                            </div>
                          )}

                          <div className="flex items-center justify-between">
                            <div className="text-2xl font-bold text-primary">{plan.price} DT</div>
                            <Button size="sm">S'abonner</Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="history" className="mt-6">
                {subscriptions.filter((s) => s.status !== "ACTIVE").length > 0 ? (
                  <div className="space-y-4">
                    {subscriptions
                      .filter((s) => s.status !== "ACTIVE")
                      .map((subscription) => (
                        <Card key={subscription.id}>
                          <CardContent className="flex items-center justify-between p-6">
                            <div className="flex items-center space-x-4">
                              {getTypeIcon(subscription.subscription_plan?.type || "")}
                              <div>
                                <h3 className="font-medium">{subscription.subscription_plan?.name}</h3>
                                <p className="text-sm text-muted-foreground">{subscription.organizer?.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  Du {new Date(subscription.start_date).toLocaleDateString("fr-FR")}
                                  {subscription.end_date &&
                                    ` au ${new Date(subscription.end_date).toLocaleDateString("fr-FR")}`}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-4">
                              <Badge className={getStatusColor(subscription.status)}>{subscription.status}</Badge>
                              <Button variant="outline" size="sm" asChild>
                                <Link href={`/subscriptions/${subscription.id}`}>Voir détails</Link>
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium mb-2">Aucun historique</h3>
                      <p className="text-muted-foreground text-center">Vos anciens abonnements apparaîtront ici</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
  )
}
