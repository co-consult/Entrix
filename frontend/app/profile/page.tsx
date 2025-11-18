"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { Sidebar } from "@/components/layout/sidebar"
import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { User, Mail, Calendar, Shield, Camera, Save, Eye, EyeOff, AlertTriangle } from "lucide-react"
import apiClient from "@/lib/api"
import type { User as UserType, UserProfile } from "@/types"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function ProfilePage() {
  const { data: session, update, status } = useSession()
  const [user, setUser] = useState<UserType>({
    id: "",
    email: "",
    first_name: "",
    last_name: "",
    phone: "",
    avatar: undefined,
    email_verified: false,
    is_active: true,
    last_login: undefined,
    created_at: "",
    updated_at: "",
    roles: [],
    profile: undefined,
    organizer_id: undefined
  })
  const [profile, setProfile] = useState<UserProfile>({
    id: "",
    user_id: "",
    date_of_birth: undefined,
    gender: undefined,
    city: "",
    country: "TN",
    language: "fr",
    emergency_contact: { name: "", phone: "", relationship: "" },
    // Ajoutez d'autres champs par défaut si besoin
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  // Ajouter un état pour l'erreur téléphone
  const [phoneError, setPhoneError] = useState<string>("");

  useEffect(() => {
    if (status === "authenticated") {
      fetchUserData()
    }
  }, [status])

  const fetchUserData = async () => {
    try {
      setLoading(true)
      // Récupérer l'utilisateur principal
      const userResponse = await apiClient.getUser(session?.user?.id || "") as { data: UserType }
      setUser({ ...user, ...userResponse.data })
      // Récupérer le profil utilisateur
      const profileResponse = await apiClient.getUserProfile(session?.user?.id || "") as { data: UserProfile }
      console.log('Profil récupéré:', profileResponse.data);
      setProfile({ ...profile, ...profileResponse.data })
    } catch (error) {
      console.error("Error fetching user data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateProfile = async (data: Partial<UserProfile>) => {
    try {
      setSaving(true)
      await apiClient.updateUserProfile(session?.user?.id || "", data)
      await fetchUserData()
      // Show success message
    } catch (error) {
      console.error("Error updating profile:", error)
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateUser = async (data: Partial<UserType>) => {
    try {
      setSaving(true)
      await apiClient.updateUserProfile(session?.user?.id || "", data)
      await update() // Update session
      // Mettre à jour localement l'état user avec les nouvelles valeurs
      setUser((prev) => (prev ? { ...prev, ...data } : prev))
      // Show success message
    } catch (error) {
      console.error("Error updating user:", error)
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      // Show error message
      return
    }

    try {
      setSaving(true)
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/users/${session?.user?.id}/change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      })
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" })
      // Show success message
    } catch (error) {
      console.error("Error changing password:", error)
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append("avatar", file)

    try {
      setSaving(true)
      // Use the API client with correct /api/v1 path
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/users/${session?.user?.id}/avatar`, {
        method: "POST",
        body: formData,
        headers: {
          Authorization: `Bearer ${session?.user?.access_token || ''}`,
        },
      })
      const data = await response.json()
      // Mettre à jour l'avatar localement pour affichage immédiat
      setUser((prev) => ({ ...prev, avatar: data.avatar }))
      await fetchUserData()
    } catch (error) {
      console.error("Error uploading avatar:", error)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="flex h-screen bg-background">
          <Sidebar type="user" />
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p>Chargement du profil...</p>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-background">
        <Sidebar type="user" />
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-auto p-6">
            {/* Development Notice */}
            <Alert className="mb-6 border-orange-200 bg-orange-50">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <AlertTitle className="text-orange-800">Interface en Développement</AlertTitle>
              <AlertDescription className="text-orange-700">
                Cette interface est actuellement en cours de développement. Certaines fonctionnalités peuvent ne pas être disponibles ou être en cours d'implémentation.
              </AlertDescription>
            </Alert>

            <PageHeader title="Mon Profil" description="Gérez vos informations personnelles et paramètres de compte" />

            <div className="mt-6">
              <Tabs defaultValue="profile" className="space-y-6">
                <TabsList>
                  <TabsTrigger value="profile">Profil</TabsTrigger>
                  <TabsTrigger value="account">Compte</TabsTrigger>
                  <TabsTrigger value="security">Sécurité</TabsTrigger>
                  <TabsTrigger value="preferences">Préférences</TabsTrigger>
                </TabsList>

                <TabsContent value="profile">
                  <div className="grid gap-6 md:grid-cols-2">
                    <Card>
                      <CardHeader>
                        <CardTitle>Photo de profil</CardTitle>
                        <CardDescription>
                          Téléchargez une photo de profil pour personnaliser votre compte
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center space-x-4">
                          <Avatar className="h-20 w-20">
                            <AvatarImage src={user?.avatar || "/placeholder.svg"} />
                            <AvatarFallback className="text-lg">
                              {user?.first_name?.[0]}
                              {user?.last_name?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <Label htmlFor="avatar-upload" className="cursor-pointer">
                              <Button variant="outline" size="sm" asChild>
                                <span>
                                  <Camera className="mr-2 h-4 w-4" />
                                  Changer la photo
                                </span>
                              </Button>
                            </Label>
                            <Input
                              id="avatar-upload"
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handleAvatarUpload}
                            />
                            <p className="text-xs text-muted-foreground mt-1">JPG, PNG ou GIF. Max 5MB.</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Informations personnelles</CardTitle>
                        <CardDescription>Mettez à jour vos informations personnelles</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="firstName">Prénom</Label>
                            <Input
                              id="firstName"
                              value={user?.first_name || ""}
                              onChange={(e) =>
                                setUser((prev) => ({ ...prev, first_name: e.target.value }))
                              }
                            />
                          </div>
                          <div>
                            <Label htmlFor="lastName">Nom</Label>
                            <Input
                              id="lastName"
                              value={user?.last_name || ""}
                              onChange={(e) => setUser((prev) => ({ ...prev, last_name: e.target.value }))}
                            />
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="phone">Téléphone</Label>
                          <Input
                            id="phone"
                            type="tel"
                            pattern="[0-9]+"
                            value={user?.phone || ""}
                            onChange={(e) => {
                              const value = e.target.value;
                              setUser((prev) => ({ ...prev, phone: value }));
                              if (!/^\d*$/.test(value)) {
                                setPhoneError("Le numéro de téléphone ne doit contenir que des chiffres.");
                              } else {
                                setPhoneError("");
                              }
                            }}
                            placeholder="+216 XX XXX XXX"
                          />
                        </div>
                        {phoneError && <div style={{ color: 'red', fontSize: 12 }}>{phoneError}</div>}

                        <div>
                          <Label htmlFor="dateOfBirth">Date de naissance</Label>
                          <Input
                            id="dateOfBirth"
                            type="date"
                            value={profile?.date_of_birth ? (typeof profile.date_of_birth === 'string' ? profile.date_of_birth : new Date(profile.date_of_birth).toISOString().split('T')[0]) : ""}
                            onChange={(e) => setProfile((prev) => ({ ...prev, date_of_birth: e.target.value ? new Date(e.target.value) : undefined }))}
                          />
                        </div>

                        <div>
                          <Label htmlFor="gender">Genre</Label>
                          <Select
                            value={profile?.gender || ""}
                            onValueChange={(value) => {
                              console.log('Genre sélectionné :', value);
                              setProfile((prev) => ({ ...prev, gender: value as "MALE" | "FEMALE" | "OTHER" | "PREFER_NOT_TO_SAY" | undefined }))
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="MALE">Homme</SelectItem>
                              <SelectItem value="FEMALE">Femme</SelectItem>
                              <SelectItem value="OTHER">Autre</SelectItem>
                              <SelectItem value="PREFER_NOT_TO_SAY">Préfère ne pas dire</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <Button
                          onClick={() =>
                            handleUpdateUser({
                              first_name: user?.first_name,
                              last_name: user?.last_name,
                              phone: user?.phone,
                            })
                          }
                          disabled={saving || !!phoneError}
                        >
                          <Save className="mr-2 h-4 w-4" />
                          {saving ? "Enregistrement..." : "Enregistrer"}
                        </Button>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Adresse</CardTitle>
                        <CardDescription>Informations de localisation</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label htmlFor="city">Ville</Label>
                          <Input
                            id="city"
                            value={profile?.city || ""}
                            onChange={(e) => setProfile((prev) => ({ ...prev, city: e.target.value }))}
                            placeholder="Tunis"
                          />
                        </div>

                        <div>
                          <Label htmlFor="country">Pays</Label>
                          <Select
                            value={profile?.country || "TN"}
                            onValueChange={(value) => setProfile((prev) => ({ ...prev, country: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="TN">Tunisie</SelectItem>
                              <SelectItem value="FR">France</SelectItem>
                              <SelectItem value="MA">Maroc</SelectItem>
                              <SelectItem value="DZ">Algérie</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <Button
                          onClick={() =>
                            handleUpdateProfile({
                              city: profile?.city,
                              country: profile?.country,
                              date_of_birth: profile?.date_of_birth,
                              gender: profile?.gender,
                            })
                          }
                          disabled={saving}
                        >
                          <Save className="mr-2 h-4 w-4" />
                          {saving ? "Enregistrement..." : "Enregistrer"}
                        </Button>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Contact d'urgence</CardTitle>
                        <CardDescription>Personne à contacter en cas d'urgence</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label htmlFor="emergencyName">Nom</Label>
                          <Input
                            id="emergencyName"
                            value={profile?.emergency_contact?.name || ""}
                            onChange={(e) =>
                              setProfile((prev) => ({
                                ...prev,
                                emergency_contact: {
                                  name: e.target.value,
                                  phone: prev.emergency_contact?.phone || "",
                                  relationship: prev.emergency_contact?.relationship || ""
                                }
                              }))
                            }
                          />
                        </div>

                        <div>
                          <Label htmlFor="emergencyPhone">Téléphone</Label>
                          <Input
                            id="emergencyPhone"
                            value={profile?.emergency_contact?.phone || ""}
                            onChange={(e) =>
                              setProfile((prev) => ({
                                ...prev,
                                emergency_contact: {
                                  name: prev.emergency_contact?.name || "",
                                  phone: e.target.value,
                                  relationship: prev.emergency_contact?.relationship || ""
                                }
                              }))
                            }
                          />
                        </div>

                        <div>
                          <Label htmlFor="emergencyRelationship">Relation</Label>
                          <Input
                            id="emergencyRelationship"
                            value={profile?.emergency_contact?.relationship || ""}
                            onChange={(e) =>
                              setProfile((prev) => ({
                                ...prev,
                                emergency_contact: {
                                  name: prev.emergency_contact?.name || "",
                                  phone: prev.emergency_contact?.phone || "",
                                  relationship: e.target.value
                                }
                              }))
                            }
                            placeholder="Conjoint, Parent, Ami..."
                          />
                        </div>

                        <Button
                          onClick={() =>
                            handleUpdateProfile({
                              emergency_contact: profile?.emergency_contact,
                            })
                          }
                          disabled={saving}
                        >
                          <Save className="mr-2 h-4 w-4" />
                          {saving ? "Enregistrement..." : "Enregistrer"}
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="account">
                  <div className="grid gap-6 md:grid-cols-2">
                    <Card>
                      <CardHeader>
                        <CardTitle>Informations du compte</CardTitle>
                        <CardDescription>Détails de votre compte Entrix</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center space-x-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span>{user?.email}</span>
                          {user?.email_verified && (
                            <Badge variant="secondary" className="bg-green-100 text-green-800">
                              Vérifié
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>Membre depuis le {new Date(user?.created_at || "").toLocaleDateString("fr-FR")}</span>
                        </div>

                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span>
                            Dernière connexion:{" "}
                            {user?.last_login ? new Date(user.last_login).toLocaleDateString("fr-FR") : "Jamais"}
                          </span>
                        </div>

                        <Separator />

                        <div>
                          <Label htmlFor="newEmail">Changer d'email</Label>
                          <div className="flex space-x-2">
                            <Input id="newEmail" type="email" placeholder="nouvel.email@exemple.com" />
                            <Button variant="outline">Changer</Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Pièce d'identité</CardTitle>
                        <CardDescription>Informations de votre pièce d'identité</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label htmlFor="idType">Type de pièce</Label>
                          <Select
                            value={profile?.id_type || ""}
                            onValueChange={(value) =>
                              setProfile((prev) => ({ ...prev, id_type: value as any }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="IDENTITY_CARD">Carte d'identité</SelectItem>
                              <SelectItem value="PASSPORT">Passeport</SelectItem>
                              <SelectItem value="DRIVING_LICENSE">Permis de conduire</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor="idNumber">Numéro</Label>
                          <Input
                            id="idNumber"
                            value={profile?.id_number || ""}
                            onChange={(e) =>
                              setProfile((prev) => ({ ...prev, id_number: e.target.value }))
                            }
                            placeholder="12345678"
                          />
                        </div>

                        <Button
                          onClick={() =>
                            handleUpdateProfile({
                              id_type: profile?.id_type,
                              id_number: profile?.id_number,
                            })
                          }
                          disabled={saving}
                        >
                          <Save className="mr-2 h-4 w-4" />
                          {saving ? "Enregistrement..." : "Enregistrer"}
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="security">
                  <div className="grid gap-6 md:grid-cols-2">
                    <Card>
                      <CardHeader>
                        <CardTitle>Changer le mot de passe</CardTitle>
                        <CardDescription>Mettez à jour votre mot de passe pour sécuriser votre compte</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label htmlFor="currentPassword">Mot de passe actuel</Label>
                          <div className="relative">
                            <Input
                              id="currentPassword"
                              type={showPassword ? "text" : "password"}
                              value={passwordData.currentPassword}
                              onChange={(e) =>
                                setPasswordData((prev) => ({ ...prev, currentPassword: e.target.value }))
                              }
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

                        <div>
                          <Label htmlFor="newPassword">Nouveau mot de passe</Label>
                          <Input
                            id="newPassword"
                            type="password"
                            value={passwordData.newPassword}
                            onChange={(e) => setPasswordData((prev) => ({ ...prev, newPassword: e.target.value }))}
                          />
                        </div>

                        <div>
                          <Label htmlFor="confirmPassword">Confirmer le nouveau mot de passe</Label>
                          <Input
                            id="confirmPassword"
                            type="password"
                            value={passwordData.confirmPassword}
                            onChange={(e) => setPasswordData((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                          />
                        </div>

                        <Button
                          onClick={handleChangePassword}
                          disabled={
                            saving ||
                            !passwordData.currentPassword ||
                            !passwordData.newPassword ||
                            passwordData.newPassword !== passwordData.confirmPassword
                          }
                        >
                          <Shield className="mr-2 h-4 w-4" />
                          {saving ? "Changement..." : "Changer le mot de passe"}
                        </Button>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Sécurité du compte</CardTitle>
                        <CardDescription>Paramètres de sécurité et authentification</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Authentification à deux facteurs</p>
                            <p className="text-sm text-muted-foreground">Sécurisez votre compte avec un code SMS</p>
                          </div>
                          <Button variant="outline" size="sm">
                            Activer
                          </Button>
                        </div>

                        <Separator />

                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Sessions actives</p>
                            <p className="text-sm text-muted-foreground">Gérez vos sessions de connexion</p>
                          </div>
                          <Button variant="outline" size="sm">
                            Voir
                          </Button>
                        </div>

                        <Separator />

                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Historique de connexion</p>
                            <p className="text-sm text-muted-foreground">Consultez vos dernières connexions</p>
                          </div>
                          <Button variant="outline" size="sm">
                            Consulter
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="preferences">
                  <div className="grid gap-6 md:grid-cols-2">
                    <Card>
                      <CardHeader>
                        <CardTitle>Préférences de langue</CardTitle>
                        <CardDescription>Choisissez votre langue préférée</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label htmlFor="language">Langue</Label>
                          <Select
                            value={profile?.language || "fr"}
                            onValueChange={(value) =>
                              setProfile((prev) => ({ ...prev, language: value }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="fr">Français</SelectItem>
                              <SelectItem value="ar">العربية</SelectItem>
                              <SelectItem value="en">English</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <Button
                          onClick={() =>
                            handleUpdateProfile({
                              language: profile?.language,
                            })
                          }
                          disabled={saving}
                        >
                          <Save className="mr-2 h-4 w-4" />
                          {saving ? "Enregistrement..." : "Enregistrer"}
                        </Button>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Notifications</CardTitle>
                        <CardDescription>Gérez vos préférences de notification</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Notifications par email</p>
                            <p className="text-sm text-muted-foreground">Recevoir des emails pour les événements</p>
                          </div>
                          <Button variant="outline" size="sm">
                            Configurer
                          </Button>
                        </div>

                        <Separator />

                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Notifications SMS</p>
                            <p className="text-sm text-muted-foreground">Recevoir des SMS pour les rappels</p>
                          </div>
                          <Button variant="outline" size="sm">
                            Configurer
                          </Button>
                        </div>

                        <Separator />

                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Newsletter</p>
                            <p className="text-sm text-muted-foreground">Recevoir notre newsletter hebdomadaire</p>
                          </div>
                          <Button variant="outline" size="sm">
                            S'abonner
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}