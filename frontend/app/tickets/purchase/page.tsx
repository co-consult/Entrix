"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { eventsApi } from "@/lib/api/events"
import { Calendar, MapPin, Search } from "lucide-react"

export default function TicketEventSelectionPage() {
  const router = useRouter()
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    fetchEvents()
  }, [search])

  const fetchEvents = async () => {
    try {
      setLoading(true)
      const response = await eventsApi.getEvents(1, 20, search ? { search } : {})
      setEvents(Array.isArray(response) ? response : response.data || [])
    } catch (err) {
      setError("Erreur lors du chargement des événements.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center py-12">
      <div className="w-full max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-2 text-center">Réservation de billets</h1>
        <p className="text-lg text-muted-foreground mb-8 text-center">Sélectionnez un événement pour commencer votre achat</p>
        <div className="mb-8 flex justify-center">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un événement..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        {loading ? (
          <div className="flex justify-center items-center min-h-[30vh]">Chargement...</div>
        ) : error ? (
          <div className="flex justify-center items-center min-h-[30vh] text-red-500">{error}</div>
        ) : events.length === 0 ? (
          <div className="flex justify-center items-center min-h-[30vh] text-muted-foreground">Aucun événement trouvé</div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {events.map(event => (
              <Card key={event.id} className="hover:shadow-xl transition-shadow cursor-pointer border-0 rounded-2xl" onClick={() => router.push(`/tickets/purchase/${event.id}`)}>
                <CardHeader>
                  <CardTitle className="text-xl font-bold mb-1">{event.name}</CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {event.scheduled_start ? new Date(event.scheduled_start).toLocaleDateString("fr-FR") : "Date à venir"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <MapPin className="h-4 w-4" />
                    {event.venue?.name || "Lieu à venir"}
                  </div>
                  <div className="text-sm text-muted-foreground line-clamp-2">{event.description}</div>
                  <Button className="w-full mt-4" variant="outline" onClick={e => { e.stopPropagation(); router.push(`/tickets/purchase/${event.id}`) }}>Choisir</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 