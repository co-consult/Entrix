"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { subscriptionsApi } from "@/lib/api/subscriptions"

export default function SubscriptionPurchasePage() {
  const router = useRouter()
  const { planId } = useParams() as { planId: string }
  const [plan, setPlan] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [purchasing, setPurchasing] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchPlan()
  }, [planId])

  const fetchPlan = async () => {
    try {
      setLoading(true)
      const response = await subscriptionsApi.getSubscriptionPlan(planId)
      setPlan(response.data)
    } catch (err) {
      setError("Erreur lors du chargement du plan.")
    } finally {
      setLoading(false)
    }
  }

  const handlePurchase = async () => {
    setPurchasing(true)
    setError("")
    try {
      await subscriptionsApi.createSubscriptionOrder(planId)
      setSuccess(true)
    } catch (err) {
      setError("Erreur lors de l'achat. Veuillez réessayer.")
    } finally {
      setPurchasing(false)
    }
  }

  if (loading) return <div className="flex justify-center items-center min-h-[60vh]">Chargement...</div>
  if (error) return <div className="flex justify-center items-center min-h-[60vh] text-red-500">{error}</div>
  if (!plan) return null

  return (
    <div className="flex justify-center items-center min-h-[80vh] bg-background">
      <Card className="w-full max-w-lg shadow-2xl border-0 rounded-2xl p-6">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold mb-2">Souscrire à l'abonnement</CardTitle>
          <CardDescription className="text-lg mb-4">Confirmez votre choix et profitez de tous les avantages !</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6 bg-muted rounded-xl p-4 shadow-inner">
            <div className="text-2xl font-bold mb-1">{plan.name}</div>
            <div className="text-muted-foreground mb-2">{plan.description}</div>
            <div className="text-3xl font-extrabold text-primary mb-2">{plan.price} DT</div>
            <div className="text-sm text-muted-foreground mb-2">Durée: {plan.duration_days || 'Variable'} jours</div>
            {plan.benefits && plan.benefits.length > 0 && (
              <ul className="list-disc list-inside text-sm text-muted-foreground mb-2">
                {plan.benefits.map((b: string, i: number) => <li key={i}>{b}</li>)}
              </ul>
            )}
          </div>
          {success ? (
            <div className="text-green-600 font-semibold text-center py-6">
              Achat réussi ! Votre abonnement est maintenant actif.<br />
              <Button className="mt-4 w-full" onClick={() => router.push('/subscriptions')}>Voir mes abonnements</Button>
            </div>
          ) : (
            <Button className="w-full text-lg py-6 rounded-xl" onClick={handlePurchase} disabled={purchasing}>
              {purchasing ? 'Traitement...' : 'Procéder au paiement'}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 