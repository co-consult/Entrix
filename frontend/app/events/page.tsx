"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, MapPin, Users, Search, Clock, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { EmptyState } from "@/components/ui/empty-state"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import apiClient from "@/lib/api"
import type { Event } from "@/types"

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCity, setSelectedCity] = useState("all")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [cities, setCities] = useState<string[]>([])

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const params: any = {
          search: searchTerm,
          page: 1,
          limit: 20,
        };
        if (selectedCity && selectedCity !== "all") params.city = selectedCity;
        if (selectedStatus && selectedStatus !== "all") params.status = selectedStatus;
        const response = await apiClient.getEvents(params) as Event[];
        console.log('Events API response:', response);
        setEvents(response || []);
        // Extract unique cities from event venues (robust, with debug logging)
        const uniqueCities = Array.from(
          new Set(
            (response || [])
              .map((event: Event) => event.venue && event.venue.city ? event.venue.city.trim() : null)
              .filter((city: string | null): city is string => !!city)
          )
        ) as string[];
        console.log("Extracted cities:", uniqueCities);
        setCities(uniqueCities);
      } catch (error) {
        console.error("Failed to fetch events:", error)
        setEvents([])
        setCities([])
      } finally {
        setLoading(false)
      }
    }

    fetchEvents()
  }, [searchTerm, selectedCity, selectedStatus])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PUBLISHED":
        return "bg-green-100 text-green-800"
      case "LIVE":
        return "bg-blue-100 text-blue-800"
      case "FINISHED":
        return "bg-gray-100 text-gray-800"
      case "CANCELLED":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

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
        {/* Development Notice */}
        <Alert className="mb-6 border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertTitle className="text-orange-800">Interface en Développement</AlertTitle>
          <AlertDescription className="text-orange-700">
            Cette interface est actuellement en cours de développement. Certaines fonctionnalités peuvent ne pas être disponibles ou être en cours d'implémentation.
          </AlertDescription>
        </Alert>

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">Découvrir les événements</h1>
          <p className="text-xl text-muted-foreground">
            Trouvez et participez aux événements les plus passionnants près de chez vous
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher des événements, lieux ou organisateurs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCity} onValueChange={setSelectedCity}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Ville" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les villes</SelectItem>
                {cities.map(city => (
                  <SelectItem key={city} value={city}>{city}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="DRAFT">Brouillon</SelectItem>
                <SelectItem value="PUBLISHED">Publié</SelectItem>
                <SelectItem value="CANCELLED">Annulé</SelectItem>
                <SelectItem value="FINISHED">Terminé</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Events Grid */}
        {events.length === 0 ? (
          <EmptyState
            icon={<Search className="h-12 w-12" />}
            title="Aucun événement trouvé"
            description={
              searchTerm || selectedCity !== "all" || selectedStatus !== "all"
                ? "Essayez d'ajuster vos critères de recherche"
                : "Revenez plus tard pour découvrir de nouveaux événements"
            }
            action={{
              label: "Réinitialiser les filtres",
              onClick: () => {
                setSearchTerm("")
                setSelectedCity("all")
                setSelectedStatus("all")
              },
            }}
          />
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => {
              const scheduledStart = event.scheduled_start || null;
              return (
                <Card key={event.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="aspect-video bg-muted relative">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute top-4 right-4">
                      <Badge className={getStatusColor(event.status)}>{event.status}</Badge>
                    </div>
                    <div className="absolute bottom-4 left-4 text-white">
                      <div className="flex items-center text-sm">
                        <Clock className="mr-1 h-3 w-3" />
                        {scheduledStart
                          ? formatDate(scheduledStart)
                          : "Non planifié"}
                      </div>
                    </div>
                  </div>
                  <CardHeader>
                    <CardTitle className="line-clamp-2">{event.name}</CardTitle>
                    <CardDescription className="line-clamp-3">{event.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Calendar className="mr-2 h-4 w-4" />
                        {scheduledStart
                          ? new Date(scheduledStart).toLocaleTimeString("fr-FR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "Non planifié"}
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <MapPin className="mr-2 h-3 w-4" />
                        {event.venue?.name}, {event.venue?.city}
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Users className="mr-2 h-4 w-4" />
                        {event.participants?.length || 0} / {event.max_capacity || "∞"} participants
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">par {event.organizer?.name}</div>
                      <Button asChild size="sm">
                        <Link href={`/events/${event.id}`}>Voir détails</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  )
}
