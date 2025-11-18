"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MapPin, Users, Search, Calendar, Star, Navigation, AlertTriangle } from "lucide-react"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { EmptyState } from "@/components/ui/empty-state"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import apiClient from "@/lib/api"
import type { Venue } from "@/types"
import Link from "next/link"

export default function VenuesPage() {
  const [venues, setVenues] = useState<Venue[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCity, setSelectedCity] = useState("all")
  const [selectedType, setSelectedType] = useState("all")
  const [cities, setCities] = useState<string[]>([])

  useEffect(() => {
    fetchVenues()
  }, [searchTerm, selectedCity, selectedType])

  const fetchVenues = async () => {
    try {
      setLoading(true)
      const venues = await apiClient.getVenues({
        search: searchTerm,
        city: selectedCity !== "all" ? selectedCity : undefined,
        type: selectedType !== "all" ? selectedType : undefined,
        is_active: true,
      })
      setVenues(Array.isArray(venues) ? venues : [])
      // Extract unique cities from venues
      const uniqueCities = Array.from(
        new Set(
          (Array.isArray(venues) ? venues : [])
            .map((venue: Venue) => venue.city ? venue.city.trim() : null)
            .filter((city: string | null): city is string => !!city)
        )
      ) as string[];
      setCities(uniqueCities);
    } catch (error) {
      console.error("Error fetching venues:", error)
      setVenues([])
      setCities([])
    } finally {
      setLoading(false)
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "INDOOR":
        return "bg-blue-100 text-blue-800"
      case "OUTDOOR":
        return "bg-green-100 text-green-800"
      case "HYBRID":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getTypeText = (type: string) => {
    switch (type) {
      case "INDOOR":
        return "Intérieur"
      case "OUTDOOR":
        return "Extérieur"
      case "HYBRID":
        return "Hybride"
      default:
        return type
    }
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
          <h1 className="text-4xl font-bold mb-4">Découvrir les lieux</h1>
          <p className="text-xl text-muted-foreground">
            Explorez les meilleurs lieux d'événements en Tunisie et au Maghreb
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher des lieux..."
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
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                <SelectItem value="INDOOR">Intérieur</SelectItem>
                <SelectItem value="OUTDOOR">Extérieur</SelectItem>
                <SelectItem value="HYBRID">Hybride</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Venues Grid */}
        {venues.length === 0 ? (
          <EmptyState
            icon={<MapPin className="h-12 w-12" />}
            title="Aucun lieu trouvé"
            description={
              searchTerm || selectedCity !== "all" || selectedType !== "all"
                ? "Essayez d'ajuster vos critères de recherche"
                : "Aucun lieu n'est disponible pour le moment"
            }
            action={{
              label: "Réinitialiser les filtres",
              onClick: () => {
                setSearchTerm("")
                setSelectedCity("all")
                setSelectedType("all")
              },
            }}
          />
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {venues.map((venue) => (
              <Card key={venue.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-video bg-muted relative">
                  {venue.images && venue.images.length > 0 ? (
                    <img
                      src={venue.images[0] || "/placeholder.svg"}
                      alt={venue.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <MapPin className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                  <div className="absolute top-4 right-4">
                    <Badge className={getTypeColor(venue.type)}>{getTypeText(venue.type)}</Badge>
                  </div>
                </div>
                <CardHeader>
                  <CardTitle className="line-clamp-1">{venue.name}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {venue.description || "Lieu d'événements de qualité"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <MapPin className="mr-2 h-4 w-4" />
                      <span className="line-clamp-1">
                        {venue.address}, {venue.city}
                      </span>
                    </div>

                    <div className="flex items-center text-sm text-muted-foreground">
                      <Users className="mr-2 h-4 w-4" />
                      <span>Capacité: {venue.capacity.toLocaleString()} personnes</span>
                    </div>

                    {venue.events && venue.events.length > 0 && (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Calendar className="mr-2 h-4 w-4" />
                        <span>{venue.events.length} événement(s) à venir</span>
                      </div>
                    )}

                    {venue.amenities && venue.amenities.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {venue.amenities.slice(0, 3).map((amenity, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {amenity}
                          </Badge>
                        ))}
                        {venue.amenities.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{venue.amenities.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center">
                        <Star className="h-4 w-4 text-yellow-500 mr-1" />
                        <span className="text-sm font-medium">4.5</span>
                        <span className="text-sm text-muted-foreground ml-1">(24 avis)</span>
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/venues/${venue.id}`}>
                            <Navigation className="mr-1 h-3 w-3" />
                            Voir
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Featured Venues Section */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold mb-6">Lieux populaires</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {venues.slice(0, 4).map((venue) => (
              <Card key={`featured-${venue.id}`} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                      <MapPin className="h-6 w-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">{venue.name}</h3>
                      <p className="text-sm text-muted-foreground truncate">{venue.city}</p>
                      <div className="flex items-center mt-1">
                        <Users className="h-3 w-3 mr-1" />
                        <span className="text-xs">{venue.capacity.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
