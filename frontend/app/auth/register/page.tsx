"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Eye, EyeOff, Mail, Lock, User, Phone } from "lucide-react"
import apiClient from "@/lib/api"

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    country: "TN",
    acceptTerms: false,
    acceptMarketing: false,
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<{[key: string]: string}>({})
  const [passwordStrength, setPasswordStrength] = useState<{score: number, label: string, color: string}>({score: 0, label: '', color: ''})
  const router = useRouter()

  const validateForm = (): boolean => {
    const errors: {[key: string]: string} = {}
    
    // Validate firstName
    if (!formData.firstName.trim()) {
      errors.firstName = "Le prénom est obligatoire"
    } else if (formData.firstName.trim().length < 2) {
      errors.firstName = "Le prénom doit contenir au moins 2 caractères"
    } else if (!/^[a-zA-ZÀ-ÿ\s'-]+$/.test(formData.firstName.trim())) {
      errors.firstName = "Le prénom ne peut contenir que des lettres, espaces, tirets et apostrophes"
    }

    // Validate lastName
    if (!formData.lastName.trim()) {
      errors.lastName = "Le nom est obligatoire"
    } else if (formData.lastName.trim().length < 2) {
      errors.lastName = "Le nom doit contenir au moins 2 caractères"
    } else if (!/^[a-zA-ZÀ-ÿ\s'-]+$/.test(formData.lastName.trim())) {
      errors.lastName = "Le nom ne peut contenir que des lettres, espaces, tirets et apostrophes"
    }

    // Validate email
    if (!formData.email.trim()) {
      errors.email = "L'adresse email est obligatoire"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errors.email = "Veuillez saisir une adresse email valide"
    }

    // Validate password
    if (!formData.password) {
      errors.password = "Le mot de passe est obligatoire"
    } else if (formData.password.length < 8) {
      errors.password = "Le mot de passe doit contenir au moins 8 caractères"
    } else {
      // Check each requirement individually for better error messages
      const hasLowercase = /[a-z]/.test(formData.password)
      const hasUppercase = /[A-Z]/.test(formData.password)
      const hasNumber = /\d/.test(formData.password)
      const hasSymbol = /[@$!%*?&]/.test(formData.password)
      
      if (!hasLowercase || !hasUppercase || !hasNumber || !hasSymbol) {
        const missing = []
        if (!hasLowercase) missing.push('minuscule')
        if (!hasUppercase) missing.push('majuscule')
        if (!hasNumber) missing.push('chiffre')
        if (!hasSymbol) missing.push('symbole')
        
        errors.password = `Le mot de passe doit contenir au moins une lettre ${missing.join(', ')} et un symbole (@, $, !, %, *, ?, ou &)`
      }
    }

    // Validate confirm password
    if (!formData.confirmPassword) {
      errors.confirmPassword = "Veuillez confirmer votre mot de passe"
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = "Les mots de passe ne correspondent pas"
    }

    // Validate phone (optional but if provided, must be valid)
    if (formData.phone && !/^\+216[0-9]{8}$/.test(formData.phone.trim())) {
      errors.phone = "Veuillez saisir un numéro de téléphone tunisien valide (format: +216 XX XXX XXX)"
    }

    // Validate terms acceptance
    if (!formData.acceptTerms) {
      errors.terms = "Vous devez accepter les conditions d'utilisation"
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setFieldErrors({})

    if (!validateForm()) {
      setLoading(false)
      return
    }

    try {
      await apiClient.register({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        marketingConsent: formData.acceptMarketing,
        termsAccepted: true,
      })

      router.push("/auth/login?message=Compte créé avec succès! Veuillez vérifier votre email et vous connecter.")
    } catch (error: any) {
      const errorMessage = error.message || "Une erreur est survenue. Veuillez réessayer."
      setError(translateError(errorMessage))
    } finally {
      setLoading(false)
    }
  }

  const getPasswordStrength = (password: string) => {
    let score = 0
    let requirements = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      numbers: /\d/.test(password),
      symbols: /[@$!%*?&]/.test(password) // Match backend regex exactly
    }
    
    // Check for weak patterns that would be rejected by backend
    const weakPatterns = ['admin', 'password', 'user', 'login', 'root', 'guest', '123456', 'qwerty', 'azerty', 'test', 'entrix']
    const hasWeakPattern = weakPatterns.some(pattern => password.toLowerCase().includes(pattern))
    
    if (requirements.length) score++
    if (requirements.uppercase) score++
    if (requirements.lowercase) score++
    if (requirements.numbers) score++
    if (requirements.symbols) score++
    
    // If password contains weak patterns, mark as weak regardless of other requirements
    if (hasWeakPattern) {
      return { score: 1, label: 'Faible (mot interdit)', color: 'bg-red-400' }
    }
    
    if (score <= 2) return { score, label: 'Faible', color: 'bg-red-400' }
    if (score === 3) return { score, label: 'Moyen', color: 'bg-yellow-400' }
    if (score >= 4) return { score, label: 'Fort', color: 'bg-green-500' }
    return { score, label: '', color: '' }
  }

  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear field error when user starts typing
    if (fieldErrors[field]) {
      setFieldErrors(prev => ({ ...prev, [field]: '' }))
    }
    // Clear general error when user makes changes
    if (error) {
      setError("")
    }
    // Update password strength when password changes
    if (field === 'password' && typeof value === 'string') {
      setPasswordStrength(getPasswordStrength(value))
      // Clear password error if password becomes valid
      if (fieldErrors.password && /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(value)) {
        setFieldErrors(prev => ({ ...prev, password: '' }))
      }
    }
  }

      // Function to translate backend error messages to user-friendly French messages
  const translateError = (errorMessage: string): string => {
    const message = errorMessage.toLowerCase()
    
    // Email errors
    if (message.includes('email') && message.includes('existe')) {
      return "Cette adresse email est déjà utilisée. Veuillez utiliser une autre adresse ou vous connecter."
    }
    if (message.includes('email') && message.includes('invalide')) {
      return "Veuillez saisir une adresse email valide (exemple: votre@email.com)"
    }
    if (message.includes('email') && message.includes('requis')) {
      return "L'adresse email est obligatoire"
    }
    if (message.includes('email') && message.includes('trop long')) {
      return "L'adresse email est trop longue"
    }

    // Password errors
    if (message.includes('mot de passe') && message.includes('minimum')) {
      return "Le mot de passe doit contenir au moins 8 caractères"
    }
    if (message.includes('mot de passe') && message.includes('maximum')) {
      return "Le mot de passe ne peut pas dépasser 128 caractères"
    }
    if (message.includes('mot de passe') && message.includes('majuscule')) {
      return "Le mot de passe doit contenir au moins une lettre majuscule, une minuscule, un chiffre et un symbole (@, $, !, %, *, ?, ou &)"
    }
    if (message.includes('mot de passe') && message.includes('requis')) {
      return "Le mot de passe est obligatoire"
    }
    if (message.includes('password') && message.includes('weak')) {
      return "Le mot de passe est trop faible. Évitez les mots courants comme 'admin', 'password', 'user', etc. et utilisez une combinaison de lettres, chiffres et symboles."
    }
    if (message.includes('faible') || message.includes('weak')) {
      return "Le mot de passe est trop faible. Évitez les mots courants comme 'admin', 'password', 'user', etc. et utilisez une combinaison de lettres, chiffres et symboles."
    }

    // Name errors
    if (message.includes('prénom') && message.includes('requis')) {
      return "Le prénom est obligatoire"
    }
    if (message.includes('prénom') && message.includes('minimum')) {
      return "Le prénom doit contenir au moins 2 caractères"
    }
    if (message.includes('prénom') && message.includes('maximum')) {
      return "Le prénom ne peut pas dépasser 100 caractères"
    }
    if (message.includes('prénom') && message.includes('alphabétiques')) {
      return "Le prénom ne peut contenir que des lettres, espaces, tirets et apostrophes"
    }
    if (message.includes('nom') && message.includes('requis')) {
      return "Le nom est obligatoire"
    }
    if (message.includes('nom') && message.includes('minimum')) {
      return "Le nom doit contenir au moins 2 caractères"
    }
    if (message.includes('nom') && message.includes('maximum')) {
      return "Le nom ne peut pas dépasser 100 caractères"
    }
    if (message.includes('nom') && message.includes('alphabétiques')) {
      return "Le nom ne peut contenir que des lettres, espaces, tirets et apostrophes"
    }

    // Phone errors
    if (message.includes('téléphone') && message.includes('tunisien')) {
      return "Veuillez saisir un numéro de téléphone tunisien valide (format: +216 XX XXX XXX)"
    }

    // Terms acceptance
    if (message.includes('conditions') || message.includes('terms')) {
      return "Vous devez accepter les conditions d'utilisation pour créer votre compte"
    }

    // Rate limiting
    if (message.includes('rate') || message.includes('limite') || message.includes('trop de tentatives')) {
      return "Trop de tentatives d'inscription. Veuillez attendre quelques minutes avant de réessayer."
    }

    // Network errors
    if (message.includes('network') || message.includes('fetch') || message.includes('timeout')) {
      return "Problème de connexion. Veuillez vérifier votre connexion internet et réessayer."
    }

    // Server errors
    if (message.includes('500') || message.includes('internal server')) {
      return "Erreur technique temporaire. Veuillez réessayer dans quelques minutes."
    }

    // Default fallback
    return "Une erreur est survenue lors de la création de votre compte. Veuillez réessayer."
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Créer un compte</CardTitle>
          <CardDescription>Rejoignez Entrix et commencez à organiser vos événements</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Prénom</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="firstName"
                    type="text"
                    placeholder="Prénom"
                    value={formData.firstName}
                    onChange={(e) => handleChange("firstName", e.target.value)}
                    className={`pl-10 ${fieldErrors.firstName ? 'border-red-500 focus:border-red-500' : ''}`}
                    required
                  />
                </div>
                {fieldErrors.firstName && (
                  <p className="text-sm text-red-600 mt-1">{fieldErrors.firstName}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">Nom</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="lastName"
                    type="text"
                    placeholder="Nom"
                    value={formData.lastName}
                    onChange={(e) => handleChange("lastName", e.target.value)}
                    className={`pl-10 ${fieldErrors.lastName ? 'border-red-500 focus:border-red-500' : ''}`}
                    required
                  />
                </div>
                {fieldErrors.lastName && (
                  <p className="text-sm text-red-600 mt-1">{fieldErrors.lastName}</p>
                )}
              </div>
            </div>

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
                  className={`pl-10 ${fieldErrors.email ? 'border-red-500 focus:border-red-500' : ''}`}
                  required
                />
              </div>
              {fieldErrors.email && (
                <p className="text-sm text-red-600 mt-1">{fieldErrors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Téléphone</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+216 XX XXX XXX"
                  value={formData.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  className={`pl-10 ${fieldErrors.phone ? 'border-red-500 focus:border-red-500' : ''}`}
                />
              </div>
              {fieldErrors.phone && (
                <p className="text-sm text-red-600 mt-1">{fieldErrors.phone}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">Pays</Label>
              <Select value={formData.country} onValueChange={(value) => handleChange("country", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TN">Tunisie</SelectItem>
                  <SelectItem value="MA">Maroc</SelectItem>
                  <SelectItem value="DZ">Algérie</SelectItem>
                  <SelectItem value="FR">France</SelectItem>
                  <SelectItem value="OTHER">Autre</SelectItem>
                </SelectContent>
              </Select>
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
                  className={`pl-10 pr-10 ${fieldErrors.password ? 'border-red-500 focus:border-red-500' : ''}`}
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
              {fieldErrors.password && (
                <p className="text-sm text-red-600 mt-1">{fieldErrors.password}</p>
              )}
              {formData.password && (
                <div className="mt-2">
                  <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                    <span>Force du mot de passe:</span>
                    <span className={`px-2 py-1 rounded text-white text-xs ${passwordStrength.color}`}>
                      {passwordStrength.label}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${passwordStrength.color}`}
                      style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={(e) => handleChange("confirmPassword", e.target.value)}
                  className={`pl-10 pr-10 ${fieldErrors.confirmPassword ? 'border-red-500 focus:border-red-500' : ''}`}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {fieldErrors.confirmPassword && (
                <p className="text-sm text-red-600 mt-1">{fieldErrors.confirmPassword}</p>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="acceptTerms"
                  checked={formData.acceptTerms}
                  onCheckedChange={(checked) => handleChange("acceptTerms", checked as boolean)}
                />
                <Label htmlFor="acceptTerms" className="text-sm">
                  J'accepte les{" "}
                  <Link href="/terms" className="text-primary hover:underline">
                    conditions d'utilisation
                  </Link>{" "}
                  et la{" "}
                  <Link href="/privacy" className="text-primary hover:underline">
                    politique de confidentialité
                  </Link>
                </Label>
              </div>
              {fieldErrors.terms && (
                <p className="text-sm text-red-600 mt-1">{fieldErrors.terms}</p>
              )}

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="acceptMarketing"
                  checked={formData.acceptMarketing}
                  onCheckedChange={(checked) => handleChange("acceptMarketing", checked as boolean)}
                />
                <Label htmlFor="acceptMarketing" className="text-sm">
                  Je souhaite recevoir des informations sur les événements et promotions
                </Label>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Création du compte..." : "Créer mon compte"}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm">
            Déjà un compte ?{" "}
            <Link href="/auth/login" className="text-primary hover:underline">
              Se connecter
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
