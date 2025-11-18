"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { Sidebar } from "@/components/layout/sidebar"
import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, Ticket, Crown, TrendingUp, Plus, Eye, AlertTriangle } from "lucide-react"
import apiClient from "@/lib/api"
import type { DashboardStats, Event, Ticket as TicketType, Subscription } from "@/types"
import Link from "next/link"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([])
  const [recentTickets, setRecentTickets] = useState<TicketType[]>([])
  const [activeSubscriptions, setActiveSubscriptions] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === "authenticated") {
      fetchDashboardData()
    }
  }, [status])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const [statsResponse, eventsResponse, ticketsResponse, subscriptionsResponse] = await Promise.all([
        apiClient.getDashboardStats(),
        apiClient.getEvents({ limit: 5, status: "PUBLISHED" }),
        apiClient.getTickets({ user_id: session?.user?.id, limit: 5 }),
        apiClient.getSubscriptions({ user_id: session?.user?.id, status: "ACTIVE" }),
      ])

      setStats(statsResponse.data)
      setUpcomingEvents(eventsResponse.data || [])
      setRecentTickets(ticketsResponse.data || [])
      setActiveSubscriptions(subscriptionsResponse.data || [])
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  const statsCards = [
    {
      title: "Mes Billets",
      value: recentTickets.length,
      description: "Billets actifs",
      icon: Ticket,
      color: "text-blue-600",
      href: "/tickets",
    },
    {
      title: "Événements à venir",
      value: upcomingEvents.length,
      description: "Cette semaine",
      icon: Calendar,
      color: "text-green-600",
      href: "/events",
    },
    {
      title: "Abonnements",
      value: activeSubscriptions.length,
      description: "Actifs",
      icon: Crown,
      color: "text-purple-600",
      href: "/subscriptions",
    },
    {
      title: "Activité",
      value: "12",
      description: "+20% ce mois",
      icon: TrendingUp,
      color: "text-orange-600",
      href: "/profile",
    },
  ]

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="flex h-screen bg-background">
          <Sidebar type="user" />
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p>Chargement du tableau de bord...</p>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
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

            <PageHeader
              title={`Bonjour, ${session?.user?.name || session?.user?.email}`}
              description="Voici un aperçu de votre activité"
            >
              <Button asChild>
                <Link href="/events">
                  <Plus className="mr-2 h-4 w-4" />
                  Découvrir des événements
                </Link>
              </Button>
            </PageHeader>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mt-6">
              {statsCards.map((stat) => (
                <Card key={stat.title} className="hover:shadow-md transition-shadow cursor-pointer">
                  <Link href={stat.href}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                      <stat.icon className={`h-4 w-4 ${stat.color}`} />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stat.value}</div>
                      <p className="text-xs text-muted-foreground">{stat.description}</p>
                    </CardContent>
                  </Link>
                </Card>
              ))}
            </div>

            {/* Main Content */}
            <Tabs defaultValue="events" className="mt-6">
              <TabsList>
                <TabsTrigger value="events">Événements à venir</TabsTrigger>
                <TabsTrigger value="tickets">Mes billets récents</TabsTrigger>
                <TabsTrigger value="subscriptions">Abonnements</TabsTrigger>
              </TabsList>

              <TabsContent value="events" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Événements recommandés</CardTitle>
                    <CardDescription>Découvrez les événements qui pourraient vous intéresser</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {upcomingEvents.length > 0 ? (
                      <div className="space-y-4">
                        {upcomingEvents.map((event) => (
                          <div key={event.id} className="flex items-center justify-between p-4 border rounded-lg">
                            <div>
                              <h3 className="font-medium">{event.name}</h3>
                              <p className="text-sm text-muted-foreground">
                                {new Date(event.scheduled_start).toLocaleDateString("fr-FR", {
                                  weekday: "long",
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                })}
                              </p>
                              <p className="text-sm text-muted-foreground">{event.venue?.name}</p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge variant="secondary">{
                                event.status === "DRAFT" ? "Brouillon" :
                                event.status === "PUBLISHED" ? "Publié" :
                                event.status === "CANCELLED" ? "Annulé" :
                                event.status === "FINISHED" ? "Terminé" :
                                event.status
                              }</Badge>
                              <Button variant="outline" size="sm" asChild>
                                <Link href={`/events/${event.id}`}>
                                  <Eye className="mr-1 h-3 w-3" />
                                  Voir
                                </Link>
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium mb-2">Aucun événement à venir</h3>
                        <p className="text-muted-foreground mb-4">Découvrez les événements disponibles</p>
                        <Button asChild>
                          <Link href="/events">Parcourir les événements</Link>
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="tickets" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Mes billets récents</CardTitle>
                    <CardDescription>Vos derniers billets achetés</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {recentTickets.length > 0 ? (
                      <div className="space-y-4">
                        {recentTickets.map((ticket) => (
                          <div key={ticket.id} className="flex items-center justify-between p-4 border rounded-lg">
                            <div>
                              <h3 className="font-medium">{ticket.event?.name}</h3>
                              <p className="text-sm text-muted-foreground">Billet #{ticket.ticket_number}</p>
                              <p className="text-sm text-muted-foreground">
                                {new Date(ticket.event?.scheduled_start || "").toLocaleDateString("fr-FR")}
                              </p>
                            </div>
                            <div className="text-right">
                              <Badge
                                className={ticket.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                              >
                                {ticket.is_active ? "Actif" : "Inactif"}
                              </Badge>
                              <p className="text-sm text-muted-foreground mt-1">{ticket.price_paid} DT</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Ticket className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium mb-2">Aucun billet</h3>
                        <p className="text-muted-foreground mb-4">Vous n'avez pas encore acheté de billets</p>
                        <Button asChild>
                          <Link href="/events">Acheter des billets</Link>
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="subscriptions" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Mes abonnements</CardTitle>
                    <CardDescription>Vos abonnements actifs</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {activeSubscriptions.length > 0 ? (
                      <div className="space-y-4">
                        {activeSubscriptions.map((subscription) => (
                          <div
                            key={subscription.id}
                            className="flex items-center justify-between p-4 border rounded-lg"
                          >
                            <div>
                              <h3 className="font-medium">{subscription.subscription_plan?.name}</h3>
                              <p className="text-sm text-muted-foreground">{subscription.organizer?.name}</p>
                              <p className="text-sm text-muted-foreground">
                                Expire le{" "}
                                {subscription.end_date
                                  ? new Date(subscription.end_date).toLocaleDateString("fr-FR")
                                  : "N/A"}
                              </p>
                            </div>
                            <div className="text-right">
                              <Badge className="bg-green-100 text-green-800">{subscription.status}</Badge>
                              <p className="text-sm text-muted-foreground mt-1">
                                {subscription.subscription_plan?.price} DT
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Crown className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium mb-2">Aucun abonnement</h3>
                        <p className="text-muted-foreground mb-4">Découvrez nos plans d'abonnement</p>
                        <Button asChild>
                          <Link href="/subscriptions">Voir les abonnements</Link>
                        </Button>
                      </div>
                    )}
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
