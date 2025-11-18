"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, XCircle } from "lucide-react"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import apiClient from "@/lib/api"

export default function VerifyEmailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  const [isLoading, setIsLoading] = useState(true)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!token) {
      setError("Token de vérification manquant")
      setIsLoading(false)
      return
    }

    verifyEmail()
  }, [token])

  const verifyEmail = async () => {
    try {
      await apiClient.verifyEmail(token!)
      setIsSuccess(true)
    } catch (error: any) {
      setError(error.message || "Erreur lors de la vérification")
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Vérification en cours</CardTitle>
            <CardDescription>Veuillez patienter pendant que nous vérifions votre email</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <LoadingSpinner size="lg" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <CardTitle>Email vérifié</CardTitle>
            <CardDescription>Votre adresse email a été vérifiée avec succès</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              Vous pouvez maintenant vous connecter à votre compte.
            </p>
            <Button className="w-full" asChild>
              <Link href="/auth/login">Se connecter</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <XCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <CardTitle>Erreur de vérification</CardTitle>
          <CardDescription>Impossible de vérifier votre adresse email</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <p className="text-sm text-muted-foreground text-center">
            Le lien de vérification peut avoir expiré ou être invalide.
          </p>

          <div className="space-y-2">
            <Button className="w-full" asChild>
              <Link href="/auth/login">Retour à la connexion</Link>
            </Button>
            <Button variant="outline" className="w-full bg-transparent" asChild>
              <Link href="/auth/register">Créer un nouveau compte</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
