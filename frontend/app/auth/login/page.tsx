"use client"

import type React from "react"

import { useState } from "react"
import { signIn, getSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, Mail, Lock } from "lucide-react"
import { isAdmin, isOrganizer } from "@/lib/auth"

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") || "/"

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
      })

      if (result?.error) {
        if (result.error === "CredentialsSignin" || result.error === "Invalid credentials") {
          setError("Email ou mot de passe incorrect.");
        } else {
          setError(result.error || "Une erreur est survenue. Veuillez réessayer.");
        }
      } else {
        // Wait a moment for session to update
        setTimeout(async () => {
        const session = await getSession()
        
        if (session?.user) {
            const canonicalizeRole = (role: string) => {
              const r = role.toUpperCase();
              if (["ADMIN", "SUPER_ADMIN", "ADMINISTRATEUR", "ADMINISTRATOR", "SUPER ADMINISTRATEUR", "ADMIN ORGANISATEUR", "ADMIN ORGANIZER", "ADMINISTRATEUR ORGANISATEUR", "ORGANIZER_ADMIN"].includes(r)) return "ADMIN";
              if (["ORGANIZER", "ORGANISATEUR"].includes(r)) return "ORGANIZER";
              if (["USER", "UTILISATEUR"].includes(r)) return "USER";
              return r;
            };
            const roles = session.user.roles?.map(
              (r: any) => {
                // Handle both string roles and object roles
                const roleStr = typeof r === "string" ? r : r?.role?.name || r?.name || r?.code || "";
                return canonicalizeRole(roleStr);
              }
            );
            
            if (roles?.includes("ADMIN")) {
              router.push("/admin");
            } else if (roles?.includes("ORGANIZER")) {
              router.push("/organizer");
            } else {
              router.push("/dashboard");
            }
        } else {
          router.push(callbackUrl)
        }
        }, 200)
      }
    } catch (error) {
      setError("Une erreur est survenue. Veuillez réessayer.")
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Connexion</CardTitle>
          <CardDescription>Connectez-vous à votre compte Entrix</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="votre@email.com"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => handleChange("password", e.target.value)}
                  className="pl-10 pr-10"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Connexion..." : "Se connecter"}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm">
            <Link href="/auth/forgot-password" className="text-primary hover:underline">
              Mot de passe oublié ?
            </Link>
          </div>

          <div className="mt-2 text-center text-sm">
            Pas encore de compte ?{" "}
            <Link href="/auth/register" className="text-primary hover:underline">
              S'inscrire
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
