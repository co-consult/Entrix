"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Mail, CheckCircle, Clock } from "lucide-react"
import apiClient from "@/lib/api"

export default function ResendVerificationPage() {
  const { data: session } = useSession()
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState("")
  const [cooldown, setCooldown] = useState(0)

  const handleResend = async () => {
    if (!session?.user?.email) {
      setError("Vous devez être connecté pour renvoyer l'email de vérification")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      await apiClient.resendVerificationEmail()
      setIsSuccess(true)
      // Start cooldown timer
      setCooldown(60)
      const timer = setInterval(() => {
        setCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(timer)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } catch (error: any) {
      setError(error.message || "Erreur lors de l'envoi de l'email")
    } finally {
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <CardTitle>Email envoyé</CardTitle>
            <CardDescription>Un nouvel email de vérification a été envoyé</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              Vérifiez votre boîte de réception à l'adresse <strong>{session?.user?.email}</strong>
            </p>
            <Button className="w-full" asChild>
              <Link href="/dashboard">Retour au tableau de bord</Link>
            </Button>
            {cooldown > 0 && (
              <p className="text-xs text-muted-foreground text-center">
                Vous pourrez renvoyer un email dans {cooldown} secondes
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Mail className="h-12 w-12 text-blue-600 mx-auto mb-4" />
          <CardTitle>Renvoyer l'email de vérification</CardTitle>
          <CardDescription>
            Vous n'avez pas reçu l'email de vérification ?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              Email actuel: <strong>{session?.user?.email}</strong>
            </p>
            <p className="text-xs text-muted-foreground">
              Vérifiez d'abord votre dossier spam avant de renvoyer l'email
            </p>
          </div>

          <Button 
            onClick={handleResend} 
            className="w-full" 
            disabled={isLoading || cooldown > 0}
          >
            {isLoading ? "Envoi en cours..." : 
             cooldown > 0 ? `Attendre ${cooldown}s` : 
             "Renvoyer l'email"}
          </Button>

          <div className="text-center">
            <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-primary">
              Retour au tableau de bord
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}