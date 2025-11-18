"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Lock, Eye, EyeOff, CheckCircle } from "lucide-react"
import apiClient from "@/lib/api"

export default function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams?.get("token") || ''

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState("")
  const [passwordStrength, setPasswordStrength] = useState<{ score: number; feedback: string[] }>({ score: 0, feedback: [] })

  useEffect(() => {
    if (!token) {
      router.push("/auth/forgot-password")
    }
  }, [token, router])

  // Validate password strength
  const validatePasswordStrength = async (password: string) => {
    if (!password) {
      setPasswordStrength({ score: 0, feedback: [] })
      return
    }

    try {
      const response = await apiClient.validatePassword(password)
      const safeScore = typeof (response as any)?.score === 'number' ? (response as any).score : 0
      const rawFeedback = (response as any)?.feedback
      const safeFeedback = Array.isArray(rawFeedback)
        ? rawFeedback
        : typeof rawFeedback === 'string'
          ? [rawFeedback]
          : []
      setPasswordStrength({ score: safeScore, feedback: safeFeedback })
    } catch (error) {
      console.error('Password validation error:', error)
      // Fallback to basic validation
      const score = password.length >= 8 ? 50 : 0
      const feedback = password.length < 8 ? ['Le mot de passe doit contenir au moins 8 caractères'] : []
      setPasswordStrength({ score, feedback })
    }
  }

  // Handle password change
  const handlePasswordChange = (value: string) => {
    setPassword(value)
    validatePasswordStrength(value)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // Validation checks
    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas")
      return
    }

    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères")
      return
    }

    if (passwordStrength.score < 60) {
      setError("Le mot de passe n'est pas assez fort. " + passwordStrength.feedback.join(', '))
      return
    }

    setIsLoading(true)

    try {
      const response = await apiClient.resetPassword(token!, password, confirmPassword)
      console.log('Reset password response:', response)
      setIsSuccess(true)
    } catch (error: any) {
      console.error('Reset password error:', error)
      
      // Handle specific error cases
      if (error.message?.includes('token') && error.message?.includes('invalid')) {
        setError("Le lien de réinitialisation est invalide ou a expiré. Veuillez demander un nouveau lien.")
      } else if (error.message?.includes('expired')) {
        setError("Le lien de réinitialisation a expiré. Veuillez demander un nouveau lien.")
      } else if (error.message?.includes('used')) {
        setError("Ce lien de réinitialisation a déjà été utilisé. Veuillez demander un nouveau lien.")
      } else {
        setError(error.message || "Une erreur s'est produite. Veuillez réessayer.")
      }
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
            <CardTitle>Mot de passe réinitialisé</CardTitle>
            <CardDescription>Votre mot de passe a été réinitialisé avec succès</CardDescription>
          </CardHeader>
          <CardContent>
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
          <CardTitle>Nouveau mot de passe</CardTitle>
          <CardDescription>Entrez votre nouveau mot de passe</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="password">Nouveau mot de passe</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  className="pl-10 pr-10"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              
              {/* Password Strength Indicator */}
              {password && (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          passwordStrength.score < 30 ? 'bg-red-500' :
                          passwordStrength.score < 60 ? 'bg-yellow-500' :
                          passwordStrength.score < 80 ? 'bg-blue-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(passwordStrength.score, 100)}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {passwordStrength.score < 30 ? 'Faible' :
                       passwordStrength.score < 60 ? 'Moyen' :
                       passwordStrength.score < 80 ? 'Bon' : 'Fort'}
                    </span>
                  </div>
                  {passwordStrength.feedback.length > 0 && (
                    <div className="text-xs text-muted-foreground">
                      {passwordStrength.feedback.map((tip, index) => (
                        <div key={index}>• {tip}</div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Réinitialisation..." : "Réinitialiser le mot de passe"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
