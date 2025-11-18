"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { eventsApi } from "@/lib/api/events"
import { ArrowLeft, ArrowRight, CreditCard, Banknote, Building2 } from "lucide-react"

const mockSections = [
  { id: "nord", name: "Tribune Nord", price: 45 },
  { id: "sud", name: "Tribune Sud", price: 45 },
  { id: "est", name: "Tribune Est", price: 75 },
  { id: "ouest", name: "Tribune Ouest", price: 75 },
  { id: "vip-lat", name: "VIP Latérale", price: 180 },
  { id: "vip-cent", name: "VIP Centrale", price: 240 },
]

const paymentMethods = [
  { id: "flouci", label: "Flouci", icon: <CreditCard className="mr-2 h-5 w-5" />, description: "Paiement mobile sécurisé" },
  { id: "smt", label: "SMT", icon: <Building2 className="mr-2 h-5 w-5" />, description: "Société Monétique Tunisienne" },
  { id: "card", label: "Carte bancaire", icon: <Banknote className="mr-2 h-5 w-5" />, description: "Visa, Mastercard" },
]

export default function TicketPaymentPage() {
  const router = useRouter()
  const { eventId } = useParams() as { eventId: string }
  const searchParams = useSearchParams()
  const sectionId = searchParams.get("section")
  const quantity = Number(searchParams.get("quantity") || 1)
  const [event, setEvent] = useState<any>(null)
  const [section, setSection] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "" })
  const [paymentMethod, setPaymentMethod] = useState<string>("")
  const [processing, setProcessing] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    fetchEvent()
    setSection(mockSections.find(s => s.id === sectionId))
  }, [eventId, sectionId])

  const fetchEvent = async () => {
    try {
      setLoading(true)
      const response = await eventsApi.getEvent(eventId)
      setEvent(response.data)
    } catch (err) {
      setError("Erreur lors du chargement de l'événement.")
    } finally {
      setLoading(false)
    }
  }

  const total = section ? section.price * quantity : 0
  const serviceFee = Math.round(total * 0.15)
  const grandTotal = total + serviceFee

  const handleInputChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handlePayment = async () => {
    setProcessing(true)
    setTimeout(() => {
      setProcessing(false)
      setSuccess(true)
    }, 1200)
  }

  if (loading) return <div className="flex justify-center items-center min-h-[60vh]">Chargement...</div>
  if (error) return <div className="flex justify-center items-center min-h-[60vh] text-red-500">{error}</div>
  if (!event || !section) return null

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center py-12">
      <div className="w-full max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-2 text-center">Paiement sécurisé</h1>
        <div className="grid md:grid-cols-2 gap-8 mt-8">
          {/* Personal Info & Payment Method */}
          <div>
            <Card className="shadow-xl border-0 rounded-2xl mb-8">
              <CardHeader>
                <CardTitle className="text-xl font-bold mb-1">Informations personnelles</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  <div className="flex gap-2">
                    <Input name="firstName" placeholder="Prénom" value={form.firstName} onChange={handleInputChange} required />
                    <Input name="lastName" placeholder="Nom" value={form.lastName} onChange={handleInputChange} required />
                  </div>
                  <Input name="email" placeholder="Email" value={form.email} onChange={handleInputChange} required type="email" />
                  <Input name="phone" placeholder="Téléphone" value={form.phone} onChange={handleInputChange} required />
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-xl border-0 rounded-2xl">
              <CardHeader>
                <CardTitle className="text-xl font-bold mb-1">Méthode de paiement *</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {paymentMethods.map(method => (
                    <label key={method.id} className={`flex items-center p-4 rounded-xl border cursor-pointer transition-all ${paymentMethod === method.id ? "border-primary bg-primary/10" : "border-gray-300 bg-white hover:bg-primary/5"}`}>
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={method.id}
                        checked={paymentMethod === method.id}
                        onChange={() => setPaymentMethod(method.id)}
                        className="mr-3 accent-primary"
                      />
                      {method.icon}
                      <span className="font-medium mr-2">{method.label}</span>
                      <span className="text-sm text-muted-foreground">{method.description}</span>
                    </label>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          {/* Order Summary */}
          <div>
            <Card className="shadow-xl border-0 rounded-2xl">
              <CardHeader>
                <CardTitle className="text-xl font-bold mb-1">Récapitulatif de commande</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-2">Match: <span className="font-medium">{event.name}</span></div>
                <div className="mb-2">Section: <span className="font-medium">{section.name}</span></div>
                <div className="mb-2">Quantité: <span className="font-medium">{quantity} billet(s)</span></div>
                <div className="mb-2">Frais de service: <span className="font-medium">{serviceFee} TND</span></div>
                <div className="mb-4 text-lg font-bold">Total: {grandTotal} TND</div>
                <Button className="w-full text-lg py-6 rounded-xl" onClick={handlePayment} disabled={processing || !form.firstName || !form.lastName || !form.email || !form.phone || !paymentMethod}>
                  {processing ? "Paiement en cours..." : "Finaliser le paiement"}
                </Button>
                {success && <div className="text-green-600 font-semibold text-center py-6">Paiement réussi !<br />Vous recevrez vos billets par email.</div>}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
} 