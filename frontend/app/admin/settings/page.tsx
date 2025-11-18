"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { EmptyState } from "@/components/ui/empty-state"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Settings, Shield, Database, Bell, Globe, CreditCard, Users, Building2, Activity, Save, RefreshCw, AlertTriangle, CheckCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Sidebar } from "@/components/layout/sidebar"
import { PageHeader } from "@/components/ui/page-header"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import apiClient from "@/lib/api"

const SYSTEM_STATUS = {
  OPERATIONAL: "Opérationnel",
  DEGRADED: "Dégradé",
  MAINTENANCE: "Maintenance",
  CRITICAL: "Critique"
}

const STATUS_COLORS = {
  OPERATIONAL: "bg-green-100 text-green-800",
  DEGRADED: "bg-yellow-100 text-yellow-800",
  MAINTENANCE: "bg-blue-100 text-blue-800",
  CRITICAL: "bg-red-100 text-red-800"
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [systemHealth, setSystemHealth] = useState<any>(null)
  const [showBackupModal, setShowBackupModal] = useState(false)
  const [backupLoading, setBackupLoading] = useState(false)
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false)
  const [maintenanceMode, setMaintenanceMode] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchSettingsData()
  }, [])

  const fetchSettingsData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [settingsResponse, healthResponse] = await Promise.all([
        apiClient.request("/admin/settings"),
        apiClient.request("/admin/system-health")
      ])

      setSettings(settingsResponse || {})
      setSystemHealth(healthResponse)
    } catch (err: any) {
      setError("Erreur lors du chargement des paramètres.")
    } finally {
      setLoading(false)
    }
  }

  const handleSaveSettings = async (section: string, newSettings: any) => {
    setSaving(true)
    try {
      await apiClient.request("/admin/settings", {
        method: "PUT",
        body: JSON.stringify({ section, settings: newSettings })
      })
      
      toast({
        title: "Paramètres sauvegardés",
        description: "Les paramètres ont été mis à jour avec succès"
      })
      
      fetchSettingsData()
    } catch (err: any) {
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder les paramètres",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  const handleCreateBackup = async () => {
    setBackupLoading(true)
    try {
      await apiClient.request("/admin/backup", {
        method: "POST"
      })
      
      toast({
        title: "Sauvegarde créée",
        description: "La sauvegarde système a été créée avec succès"
      })
      
      setShowBackupModal(false)
    } catch (err: any) {
      toast({
        title: "Erreur",
        description: "Impossible de créer la sauvegarde",
        variant: "destructive"
      })
    } finally {
      setBackupLoading(false)
    }
  }

  const handleToggleMaintenance = async () => {
    try {
      await apiClient.request("/admin/maintenance", {
        method: "POST",
        body: JSON.stringify({ enabled: !maintenanceMode })
      })
      
      setMaintenanceMode(!maintenanceMode)
      toast({
        title: "Mode maintenance",
        description: `Le mode maintenance a été ${!maintenanceMode ? 'activé' : 'désactivé'}`
      })
    } catch (err: any) {
      toast({
        title: "Erreur",
        description: "Impossible de modifier le mode maintenance",
        variant: "destructive"
      })
    }
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar type="admin" />
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="px-8 w-full">
          <PageHeader
            title="Paramètres Système"
            description="Configuration et gestion des paramètres système."
          >
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                onClick={fetchSettingsData}
                disabled={loading}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Actualiser
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowBackupModal(true)}
              >
                <Database className="mr-2 h-4 w-4" />
                Sauvegarde
              </Button>
            </div>
          </PageHeader>
          
          <div className="flex-1 overflow-auto pt-6 pb-6">
            {/* System Status */}
            <Alert className="mb-6">
              <Activity className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <span>État du système</span>
                <Badge className={STATUS_COLORS[systemHealth?.status || "OPERATIONAL"]}>
                  {SYSTEM_STATUS[systemHealth?.status || "OPERATIONAL"]}
                </Badge>
              </AlertDescription>
            </Alert>

            {/* Settings Content */}
            <Tabs defaultValue="general" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="general">Général</TabsTrigger>
                <TabsTrigger value="security">Sécurité</TabsTrigger>
                <TabsTrigger value="notifications">Notifications</TabsTrigger>
                <TabsTrigger value="advanced">Avancé</TabsTrigger>
              </TabsList>

              <TabsContent value="general" className="space-y-4">
                <div className="grid gap-6 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Paramètres Généraux</CardTitle>
                      <CardDescription>Configuration de base du système</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="site-name">Nom du site</Label>
                        <Input
                          id="site-name"
                          value={settings.general?.siteName || ""}
                          onChange={e => setSettings({
                            ...settings,
                            general: { ...settings.general, siteName: e.target.value }
                          })}
                          className="mt-1"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="site-description">Description</Label>
                        <Textarea
                          id="site-description"
                          value={settings.general?.description || ""}
                          onChange={e => setSettings({
                            ...settings,
                            general: { ...settings.general, description: e.target.value }
                          })}
                          className="mt-1"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="contact-email">Email de contact</Label>
                        <Input
                          id="contact-email"
                          type="email"
                          value={settings.general?.contactEmail || ""}
                          onChange={e => setSettings({
                            ...settings,
                            general: { ...settings.general, contactEmail: e.target.value }
                          })}
                          className="mt-1"
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Mode maintenance</Label>
                          <p className="text-sm text-muted-foreground">
                            Activer le mode maintenance
                          </p>
                        </div>
                        <Switch
                          checked={maintenanceMode}
                          onCheckedChange={handleToggleMaintenance}
                        />
                      </div>
                      
                      <Button 
                        onClick={() => handleSaveSettings("general", settings.general)}
                        disabled={saving}
                        className="w-full"
                      >
                        {saving ? <LoadingSpinner size="sm" /> : <Save className="mr-2 h-4 w-4" />}
                        Sauvegarder
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Paramètres Paiement</CardTitle>
                      <CardDescription>Configuration des passerelles de paiement</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="stripe-key">Clé publique Stripe</Label>
                        <Input
                          id="stripe-key"
                          type="password"
                          value={settings.payment?.stripePublicKey || ""}
                          onChange={e => setSettings({
                            ...settings,
                            payment: { ...settings.payment, stripePublicKey: e.target.value }
                          })}
                          className="mt-1"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="stripe-secret">Clé secrète Stripe</Label>
                        <Input
                          id="stripe-secret"
                          type="password"
                          value={settings.payment?.stripeSecretKey || ""}
                          onChange={e => setSettings({
                            ...settings,
                            payment: { ...settings.payment, stripeSecretKey: e.target.value }
                          })}
                          className="mt-1"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="commission-rate">Taux de commission (%)</Label>
                        <Input
                          id="commission-rate"
                          type="number"
                          value={settings.payment?.commissionRate || ""}
                          onChange={e => setSettings({
                            ...settings,
                            payment: { ...settings.payment, commissionRate: e.target.value }
                          })}
                          className="mt-1"
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Paiements en ligne</Label>
                          <p className="text-sm text-muted-foreground">
                            Activer les paiements en ligne
                          </p>
                        </div>
                        <Switch
                          checked={settings.payment?.onlinePaymentsEnabled || false}
                          onCheckedChange={checked => setSettings({
                            ...settings,
                            payment: { ...settings.payment, onlinePaymentsEnabled: checked }
                          })}
                        />
                      </div>
                      
                      <Button 
                        onClick={() => handleSaveSettings("payment", settings.payment)}
                        disabled={saving}
                        className="w-full"
                      >
                        {saving ? <LoadingSpinner size="sm" /> : <Save className="mr-2 h-4 w-4" />}
                        Sauvegarder
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="security" className="space-y-4">
                <div className="grid gap-6 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Paramètres de Sécurité</CardTitle>
                      <CardDescription>Configuration de la sécurité</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="session-timeout">Timeout de session (minutes)</Label>
                        <Input
                          id="session-timeout"
                          type="number"
                          value={settings.security?.sessionTimeout || ""}
                          onChange={e => setSettings({
                            ...settings,
                            security: { ...settings.security, sessionTimeout: e.target.value }
                          })}
                          className="mt-1"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="max-login-attempts">Tentatives de connexion max</Label>
                        <Input
                          id="max-login-attempts"
                          type="number"
                          value={settings.security?.maxLoginAttempts || ""}
                          onChange={e => setSettings({
                            ...settings,
                            security: { ...settings.security, maxLoginAttempts: e.target.value }
                          })}
                          className="mt-1"
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Authentification 2FA</Label>
                          <p className="text-sm text-muted-foreground">
                            Exiger l'authentification à deux facteurs
                          </p>
                        </div>
                        <Switch
                          checked={settings.security?.require2FA || false}
                          onCheckedChange={checked => setSettings({
                            ...settings,
                            security: { ...settings.security, require2FA: checked }
                          })}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Chiffrement SSL</Label>
                          <p className="text-sm text-muted-foreground">
                            Forcer les connexions HTTPS
                          </p>
                        </div>
                        <Switch
                          checked={settings.security?.forceSSL || false}
                          onCheckedChange={checked => setSettings({
                            ...settings,
                            security: { ...settings.security, forceSSL: checked }
                          })}
                        />
                      </div>
                      
                      <Button 
                        onClick={() => handleSaveSettings("security", settings.security)}
                        disabled={saving}
                        className="w-full"
                      >
                        {saving ? <LoadingSpinner size="sm" /> : <Save className="mr-2 h-4 w-4" />}
                        Sauvegarder
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Paramètres d'Audit</CardTitle>
                      <CardDescription>Configuration des journaux d'audit</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Journalisation complète</Label>
                          <p className="text-sm text-muted-foreground">
                            Enregistrer toutes les actions
                          </p>
                        </div>
                        <Switch
                          checked={settings.audit?.fullLogging || false}
                          onCheckedChange={checked => setSettings({
                            ...settings,
                            audit: { ...settings.audit, fullLogging: checked }
                          })}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="retention-days">Rétention des logs (jours)</Label>
                        <Input
                          id="retention-days"
                          type="number"
                          value={settings.audit?.logRetentionDays || ""}
                          onChange={e => setSettings({
                            ...settings,
                            audit: { ...settings.audit, logRetentionDays: e.target.value }
                          })}
                          className="mt-1"
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Alertes de sécurité</Label>
                          <p className="text-sm text-muted-foreground">
                            Notifier les événements de sécurité
                          </p>
                        </div>
                        <Switch
                          checked={settings.audit?.securityAlerts || false}
                          onCheckedChange={checked => setSettings({
                            ...settings,
                            audit: { ...settings.audit, securityAlerts: checked }
                          })}
                        />
                      </div>
                      
                      <Button 
                        onClick={() => handleSaveSettings("audit", settings.audit)}
                        disabled={saving}
                        className="w-full"
                      >
                        {saving ? <LoadingSpinner size="sm" /> : <Save className="mr-2 h-4 w-4" />}
                        Sauvegarder
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="notifications" className="space-y-4">
                <div className="grid gap-6 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Paramètres Email</CardTitle>
                      <CardDescription>Configuration des notifications email</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="smtp-host">Serveur SMTP</Label>
                        <Input
                          id="smtp-host"
                          value={settings.email?.smtpHost || ""}
                          onChange={e => setSettings({
                            ...settings,
                            email: { ...settings.email, smtpHost: e.target.value }
                          })}
                          className="mt-1"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="smtp-port">Port SMTP</Label>
                        <Input
                          id="smtp-port"
                          type="number"
                          value={settings.email?.smtpPort || ""}
                          onChange={e => setSettings({
                            ...settings,
                            email: { ...settings.email, smtpPort: e.target.value }
                          })}
                          className="mt-1"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="email-from">Email expéditeur</Label>
                        <Input
                          id="email-from"
                          type="email"
                          value={settings.email?.fromEmail || ""}
                          onChange={e => setSettings({
                            ...settings,
                            email: { ...settings.email, fromEmail: e.target.value }
                          })}
                          className="mt-1"
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Notifications email</Label>
                          <p className="text-sm text-muted-foreground">
                            Activer les notifications par email
                          </p>
                        </div>
                        <Switch
                          checked={settings.email?.enabled || false}
                          onCheckedChange={checked => setSettings({
                            ...settings,
                            email: { ...settings.email, enabled: checked }
                          })}
                        />
                      </div>
                      
                      <Button 
                        onClick={() => handleSaveSettings("email", settings.email)}
                        disabled={saving}
                        className="w-full"
                      >
                        {saving ? <LoadingSpinner size="sm" /> : <Save className="mr-2 h-4 w-4" />}
                        Sauvegarder
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Paramètres Push</CardTitle>
                      <CardDescription>Configuration des notifications push</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="push-key">Clé API Push</Label>
                        <Input
                          id="push-key"
                          type="password"
                          value={settings.push?.apiKey || ""}
                          onChange={e => setSettings({
                            ...settings,
                            push: { ...settings.push, apiKey: e.target.value }
                          })}
                          className="mt-1"
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Notifications push</Label>
                          <p className="text-sm text-muted-foreground">
                            Activer les notifications push
                          </p>
                        </div>
                        <Switch
                          checked={settings.push?.enabled || false}
                          onCheckedChange={checked => setSettings({
                            ...settings,
                            push: { ...settings.push, enabled: checked }
                          })}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Notifications système</Label>
                          <p className="text-sm text-muted-foreground">
                            Notifications d'événements système
                          </p>
                        </div>
                        <Switch
                          checked={settings.push?.systemNotifications || false}
                          onCheckedChange={checked => setSettings({
                            ...settings,
                            push: { ...settings.push, systemNotifications: checked }
                          })}
                        />
                      </div>
                      
                      <Button 
                        onClick={() => handleSaveSettings("push", settings.push)}
                        disabled={saving}
                        className="w-full"
                      >
                        {saving ? <LoadingSpinner size="sm" /> : <Save className="mr-2 h-4 w-4" />}
                        Sauvegarder
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="advanced" className="space-y-4">
                <div className="grid gap-6 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Paramètres Base de Données</CardTitle>
                      <CardDescription>Configuration de la base de données</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="db-host">Hôte DB</Label>
                        <Input
                          id="db-host"
                          value={settings.database?.host || ""}
                          onChange={e => setSettings({
                            ...settings,
                            database: { ...settings.database, host: e.target.value }
                          })}
                          className="mt-1"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="db-port">Port DB</Label>
                        <Input
                          id="db-port"
                          type="number"
                          value={settings.database?.port || ""}
                          onChange={e => setSettings({
                            ...settings,
                            database: { ...settings.database, port: e.target.value }
                          })}
                          className="mt-1"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="db-name">Nom de la base</Label>
                        <Input
                          id="db-name"
                          value={settings.database?.name || ""}
                          onChange={e => setSettings({
                            ...settings,
                            database: { ...settings.database, name: e.target.value }
                          })}
                          className="mt-1"
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Pool de connexions</Label>
                          <p className="text-sm text-muted-foreground">
                            Activer le pool de connexions
                          </p>
                        </div>
                        <Switch
                          checked={settings.database?.connectionPool || false}
                          onCheckedChange={checked => setSettings({
                            ...settings,
                            database: { ...settings.database, connectionPool: checked }
                          })}
                        />
                      </div>
                      
                      <Button 
                        onClick={() => handleSaveSettings("database", settings.database)}
                        disabled={saving}
                        className="w-full"
                      >
                        {saving ? <LoadingSpinner size="sm" /> : <Save className="mr-2 h-4 w-4" />}
                        Sauvegarder
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Paramètres Cache</CardTitle>
                      <CardDescription>Configuration du cache système</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="cache-ttl">TTL Cache (secondes)</Label>
                        <Input
                          id="cache-ttl"
                          type="number"
                          value={settings.cache?.ttl || ""}
                          onChange={e => setSettings({
                            ...settings,
                            cache: { ...settings.cache, ttl: e.target.value }
                          })}
                          className="mt-1"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="cache-max-size">Taille max cache (MB)</Label>
                        <Input
                          id="cache-max-size"
                          type="number"
                          value={settings.cache?.maxSize || ""}
                          onChange={e => setSettings({
                            ...settings,
                            cache: { ...settings.cache, maxSize: e.target.value }
                          })}
                          className="mt-1"
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Cache Redis</Label>
                          <p className="text-sm text-muted-foreground">
                            Utiliser Redis pour le cache
                          </p>
                        </div>
                        <Switch
                          checked={settings.cache?.useRedis || false}
                          onCheckedChange={checked => setSettings({
                            ...settings,
                            cache: { ...settings.cache, useRedis: checked }
                          })}
                        />
                      </div>
                      
                      <Button 
                        onClick={() => handleSaveSettings("cache", settings.cache)}
                        disabled={saving}
                        className="w-full"
                      >
                        {saving ? <LoadingSpinner size="sm" /> : <Save className="mr-2 h-4 w-4" />}
                        Sauvegarder
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Backup Modal */}
      <Dialog open={showBackupModal} onOpenChange={setShowBackupModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Créer une Sauvegarde</DialogTitle>
            <DialogDescription>
              Créer une sauvegarde complète du système
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Cette opération peut prendre plusieurs minutes selon la taille de la base de données.
              </AlertDescription>
            </Alert>
            
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">Base de données</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">Fichiers uploadés</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">Configuration système</span>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBackupModal(false)}>
              Annuler
            </Button>
            <Button onClick={handleCreateBackup} disabled={backupLoading}>
              {backupLoading ? <LoadingSpinner size="sm" /> : "Créer la sauvegarde"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 