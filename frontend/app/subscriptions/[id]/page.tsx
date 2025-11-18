"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Crown, Calendar, Star, Settings, CreditCard, AlertTriangle, Check, ArrowLeft, Info } from "lucide-react"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import apiClient from "@/lib/api"
import type { Subscription, Event } from "@/types"
import Link from "next/link"

export default function SubscriptionDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [cancelLoading, setCancelLoading] = useState(false)

  useEffect(() => {
    fetchSubscriptionDetails()
  }, [params.id])

  const fetchSubscriptionDetails = async () => {
    try {
      setLoading(true)
      const [subscriptionResponse, eventsResponse] = await Promise.all([
        apiClient.getSubscription(params.id as string),
        apiClient.getEvents({ subscriptionPlanId: params.id, limit: 10 }),
      ])
      setSubscription(subscriptionResponse.data)
      setEvents(eventsResponse.data || [])
    } catch (error) {
      console.error("Error fetching subscription details:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCancelSubscription = async () => {
    try {
      setCancelLoading(true)
      await apiClient.request(`/subscriptions/${params.id}/cancel`, { method: "POST" })
      await fetchSubscriptionDetails()
    } catch (error) {
      console.error("Error canceling subscription:", error)
    } finally {
      setCancelLoading(false)
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

  const calculateProgress = () => {
    if (!subscription?.endDate) return 0
    const now = new Date()
    const start = new Date(subscription.startDate)
    const end = new Date(subscription.endDate)
    const total = end.getTime() - start.getTime()
    const elapsed = now.getTime() - start.getTime()
    return Math.min(Math.max((elapsed / total) * 100, 0), 100)
  }

  const getDaysRemaining = () => {
    if (!subscription?.endDate) return null
    const now = new Date()
    const end = new Date(subscription.endDate)
    const diff = end.getTime() - now.getTime()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-background">
          <div className="container mx-auto px-4 py-8">
            <div className="flex items-center justify-center min-h-[400px]">
              <LoadingSpinner size="lg" />
            </div>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  if (!subscription) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-background">
          <div className="container mx-auto px-4 py-8">
            <div className="text-center">
              <h1 className="text-2xl font-bold mb-4">Abonnement non trouvé</h1>
              <Button asChild>
                <Link href="/subscriptions">Retour aux abonnements</Link>
              </Button>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  const progress = calculateProgress()
  const daysRemaining = getDaysRemaining()

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <Button variant="ghost" asChild className="mb-4">
              <Link href="/subscriptions">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour aux abonnements
              </Link>
            </Button>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">{subscription.subscriptionPlan?.name}</h1>
                <p className="text-muted-foreground">{subscription.organizer?.name}</p>
              </div>
              <Badge className={getStatusColor(subscription.status)}>{subscription.status}</Badge>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Subscription Overview */}
              <Card>
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    {getTypeIcon(subscription.subscriptionPlan?.type || "")}
                    <CardTitle>Détails de l'abonnement</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-muted-foreground">{subscription.subscriptionPlan?.description}</p>

                    {subscription.endDate && subscription.status === "ACTIVE" && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progression</span>
                          <span>
                            {daysRemaining !== null && daysRemaining > 0 ? `${daysRemaining} jours restants` : "Expiré"}
                          </span>
                        </div>
                        <Progress value={progress} className="h-2" />
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Date de début</p>
                        <p className="font-medium">{new Date(subscription.startDate).toLocaleDateString("fr-FR")}</p>
                      </div>
                      {subscription.endDate && (
                        <div>
                          <p className="text-muted-foreground">Date de fin</p>
                          <p className="font-medium">{new Date(subscription.endDate).toLocaleDateString("fr-FR")}</p>
                        </div>
                      )}
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Prix payé</p>
                        <p className="text-2xl font-bold text-primary">{subscription.subscriptionPlan?.price} DT</p>
                      </div>
                      {subscription.autoRenew && <Badge variant="secondary">Renouvellement automatique</Badge>}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Benefits */}
              {subscription.subscriptionPlan?.benefits && (
                <Card>
                  <CardHeader>
                    <CardTitle>Avantages inclus</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {subscription.subscriptionPlan.benefits.map((benefit, index) => (
                        <li key={index} className="flex items-center">
                          <Check className="mr-2 h-4 w-4 text-green-600" />
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Events */}
              <Card>
                <CardHeader>
                  <CardTitle>Événements inclus</CardTitle>
                  <CardDescription>Événements auxquels vous avez accès avec cet abonnement</CardDescription>
                </CardHeader>
                <CardContent>
                  {events.length > 0 ? (
                    <div className="space-y-4">
                      {events.map((event) => (
                        <div key={event.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <h3 className="font-medium">{event.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {new Date(event.scheduledStart).toLocaleDateString("fr-FR")} • {event.venue?.name}
                            </p>
                          </div>
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/events/${event.id}`}>Voir</Link>
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-8">Aucun événement disponible pour le moment</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full bg-transparent" variant="outline">
                    <CreditCard className="mr-2 h-4 w-4" />
                    Gérer le paiement
                  </Button>
                  <Button className="w-full bg-transparent" variant="outline">
                    <Settings className="mr-2 h-4 w-4" />
                    Paramètres
                  </Button>
                  {subscription.status === "ACTIVE" && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button className="w-full" variant="destructive">
                          <AlertTriangle className="mr-2 h-4 w-4" />
                          Annuler l'abonnement
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                            <AlertTriangle className="h-6 w-6 text-destructive" />
                            Confirmer l'annulation
                          </DialogTitle>
                          <DialogDescription className="text-base mt-1 mb-4">
                            Êtes-vous sûr de vouloir annuler cet abonnement ? Cette action est irréversible et vous perdrez l'accès aux avantages restants.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="flex flex-col items-center space-y-4 mt-2">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Info className="h-4 w-4 text-yellow-500" />
                            L'annulation prendra effet immédiatement.
                          </div>
                          <div className="flex justify-end space-x-2 w-full mt-4">
                            <Button variant="outline">Annuler</Button>
                            <Button variant="destructive" onClick={handleCancelSubscription} disabled={cancelLoading}>
                              {cancelLoading ? "Annulation..." : "Confirmer l'annulation"}
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </CardContent>
              </Card>

              {/* Support */}
              <Card>
                <CardHeader>
                  <CardTitle>Besoin d'aide ?</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Contactez notre équipe support pour toute question concernant votre abonnement.
                  </p>
                  <Button className="w-full bg-transparent" variant="outline" asChild>
                    <Link href="/contact">Contacter le support</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
