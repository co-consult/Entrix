"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { eventsApi } from "@/lib/api/events"
import { ArrowRight } from "lucide-react"

// Mock stadium sections (replace with real data if available)
const mockSections = [
  { id: "nord", name: "Tribune Nord", price: 45, available: 1200 },
  { id: "sud", name: "Tribune Sud", price: 45, available: 800 },
  { id: "est", name: "Tribune Est", price: 75, available: 450 },
  { id: "ouest", name: "Tribune Ouest", price: 75, available: 320 },
  { id: "vip-lat", name: "VIP Latérale", price: 180, available: 25 },
  { id: "vip-cent", name: "VIP Centrale", price: 240, available: 15 },
]

export default function TicketSectionSelectionPage() {
  const router = useRouter()
  const { eventId } = useParams() as { eventId: string }
  const [event, setEvent] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [selectedSection, setSelectedSection] = useState<any>(null)
  const [quantity, setQuantity] = useState(1)

  useEffect(() => {
    fetchEvent()
  }, [eventId])

  const fetchEvent = async () => {
    try {
      setLoading(true)
      const response = await eventsApi.getEvent(eventId)
      setEvent(response.data ?? response)
    } catch (err) {
      setError("Erreur lors du chargement de l'événement.")
    } finally {
      setLoading(false)
    }
  }

  const handleContinue = () => {
    if (!selectedSection) return
    router.push(`/tickets/purchase/${eventId}/payment?section=${selectedSection.id}&quantity=${quantity}`)
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center py-12">
      <div className="w-full max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2 text-center">Sélection des places</h1>
        <p className="text-lg text-muted-foreground mb-8 text-center">Choisissez votre section et le nombre de billets</p>
        {loading ? (
          <div className="flex justify-center items-center min-h-[30vh]">Chargement...</div>
        ) : error ? (
          <div className="flex justify-center items-center min-h-[30vh] text-red-500">{error}</div>
        ) : !event ? (
          <div className="flex justify-center items-center min-h-[30vh] text-red-500">Événement introuvable ou indisponible.</div>
        ) : (
          <div className="grid md:grid-cols-2 gap-8">
            {/* Stadium Map (mocked) */}
            <div className="flex flex-col items-center">
              <div className="w-full h-72 bg-gradient-to-br from-gray-100 to-gray-300 rounded-2xl flex flex-wrap items-center justify-center shadow-inner mb-6">
                {/* Simple color blocks for sections */}
                {mockSections.map((section, idx) => (
                  <div
                    key={section.id}
                    className={`m-2 w-24 h-16 rounded-lg flex flex-col items-center justify-center cursor-pointer border-2 transition-all ${selectedSection?.id === section.id ? "border-primary bg-primary/10" : "border-gray-300 bg-white hover:bg-primary/5"}`}
                    onClick={() => setSelectedSection(section)}
                  >
                    <span className="font-bold text-sm">{section.name}</span>
                    <span className="text-xs text-muted-foreground">{section.price} TND</span>
                    <span className="text-xs">{section.available} places</span>
                  </div>
                ))}
              </div>
              <div className="text-center text-muted-foreground text-sm">Plan du stade (illustration)</div>
            </div>
            {/* Section Details and Quantity */}
            <div className="flex flex-col justify-center">
              <Card className="shadow-xl border-0 rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-xl font-bold mb-1">{event.name}</CardTitle>
                  <CardDescription className="mb-2">{event.venue?.name || "Lieu à venir"}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <div className="font-medium mb-2">Section sélectionnée :</div>
                    {selectedSection ? (
                      <div className="mb-2">
                        <span className="font-bold">{selectedSection.name}</span> <span className="text-muted-foreground">({selectedSection.price} TND)</span>
                        <div className="text-xs text-muted-foreground">Places disponibles: {selectedSection.available}</div>
                      </div>
                    ) : (
                      <div className="text-muted-foreground">Aucune section sélectionnée</div>
                    )}
                  </div>
                  <div className="mb-4">
                    <div className="font-medium mb-2">Quantité :</div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="icon" onClick={() => setQuantity(q => Math.max(1, q - 1))}>-</Button>
                      <Input type="number" min={1} max={selectedSection?.available || 10} value={quantity} onChange={e => setQuantity(Math.max(1, Number(e.target.value)))} className="w-16 text-center" />
                      <Button variant="outline" size="icon" onClick={() => setQuantity(q => Math.min(selectedSection?.available || 10, q + 1))}>+</Button>
                    </div>
                  </div>
                  <Button className="w-full mt-4 text-lg py-6 rounded-xl" onClick={handleContinue} disabled={!selectedSection}>
                    Continuer <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 