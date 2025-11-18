"use client"

import { useState, useEffect } from "react"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { Sidebar } from "@/components/layout/sidebar"
import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Users,
  Calendar,
  AlertTriangle,
  Activity,
  TrendingUp,
  Shield,
  BarChart3,
  Plus,
  RefreshCw,
  Download,
  Smartphone,
} from "lucide-react"
import { CustomCurrencyIcon } from "@/components/ui/custom-currency-icon"
import apiClient from "@/lib/api"
import type { AdminStats } from "@/types"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { UserCreationModal } from "@/components/admin/user-creation-modal"

export default function AdminDashboard() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [systemAlerts, setSystemAlerts] = useState<any[]>([])
  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddUserModal, setShowAddUserModal] = useState(false)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      // Use fallback data since these endpoints might not exist yet
      const mockStats = {
        total_users: 0,
        total_events: 0,
        total_revenue: 0,
        system_health: "GOOD",
        monthly_growth: 0,
        total_organizers: 0
      }
      
      const mockAlerts: any[] = []
      const mockActivity = [
        {
          type: "user",
          action: "Nouveau utilisateur inscrit",
          user: "Système",
          entityType: "Utilisateur",
          createdAt: new Date().toISOString()
        },
        {
          type: "system",
          action: "Système démarré",
          user: "Système",
          entityType: "Système",
          createdAt: new Date(Date.now() - 60000).toISOString()
        }
      ]

      setStats(mockStats as AdminStats)
      setSystemAlerts(mockAlerts)
      setRecentActivity(mockActivity)
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
      // Set fallback data on error
      setStats({
        total_users: 0,
        total_events: 0,
        total_revenue: 0,
        system_health: "GOOD",
        monthly_growth: 0,
        total_organizers: 0
      } as AdminStats)
      setSystemAlerts([])
      setRecentActivity([])
    } finally {
      setLoading(false)
    }
  }

  const statsCards = [
    {
      title: "Utilisateurs Totaux",
      value: stats?.total_users || 0,
      description: "+12% ce mois",
      icon: Users,
      color: "text-blue-600",
    },
    {
      title: "Événements Actifs",
      value: stats?.total_events || 0,
      description: "+8% ce mois",
      icon: Calendar,
      color: "text-green-600",
    },
    {
      title: "Revenus Plateforme",
      value: `${(stats?.total_revenue || 0).toLocaleString()} DT`,
      description: "+25% ce mois",
      icon: CustomCurrencyIcon,
      color: "text-yellow-600",
    },
    {
      title: "Alertes Système",
      value: systemAlerts.length,
      description: "2 critiques, 1 avertissement",
      icon: AlertTriangle,
      color: "text-red-600",
    },
  ]

  const getSystemHealthColor = (health: string) => {
    switch (health) {
      case "GOOD":
        return "text-green-600"
      case "WARNING":
        return "text-yellow-600"
      case "CRITICAL":
        return "text-red-600"
      default:
        return "text-gray-600"
    }
  }

  const getSystemHealthBadge = (health: string) => {
    switch (health) {
      case "GOOD":
        return "bg-green-100 text-green-800"
      case "WARNING":
        return "bg-yellow-100 text-yellow-800"
      case "CRITICAL":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <ProtectedRoute requiredRole={["ADMIN"]}>
      <div className="flex h-screen bg-background">
        <Sidebar type="admin" />
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-auto p-6">
            {/* Development Notice */}
            <Alert className="mb-6 border-orange-200 bg-orange-50">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <AlertTitle className="text-orange-800">Interface d'Administration en Développement</AlertTitle>
              <AlertDescription className="text-orange-700">
                Cette interface d'administration est actuellement en cours de développement. Certaines fonctionnalités peuvent ne pas être disponibles ou être en cours d'implémentation.
              </AlertDescription>
            </Alert>

            <PageHeader title="Administration" description="Vue d'ensemble du système et contrôles administratifs">
              <div className="flex items-center space-x-2">
                <Button 
                  onClick={() => {
                    const link = document.createElement('a')
                    link.href = '/entrix-scanner.apk'
                    link.download = 'entrix-scanner.apk'
                    document.body.appendChild(link)
                    link.click()
                    document.body.removeChild(link)
                  }}
                  variant="outline"
                  className="bg-blue-50 hover:bg-blue-100 border-blue-300 text-blue-700"
                >
                  <Smartphone className="mr-2 h-4 w-4" />
                  <Download className="mr-2 h-4 w-4" />
                  Télécharger l'App Mobile
                </Button>
                <Button onClick={fetchDashboardData} variant="outline">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Actualiser
                </Button>
                <Button onClick={() => setShowAddUserModal(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Ajouter Utilisateur
                </Button>
              </div>
            </PageHeader>

            {/* System Status Alert */}
            <Alert className="mt-6">
              <Activity className="h-4 w-4" />
              <AlertTitle className="flex items-center">
                État du Système
                <Badge className={`ml-2 ${getSystemHealthBadge(stats?.system_health || "GOOD")}`}>
                  {stats?.system_health || "GOOD"}
                </Badge>
              </AlertTitle>
              <AlertDescription>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm">Services API: Opérationnels</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm">Base de données: Saine</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <span className="text-sm">Passerelle paiement: Dégradée</span>
                  </div>
                </div>
              </AlertDescription>
            </Alert>

            {/* Stats Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mt-6">
              {statsCards.map((stat) => (
                <Card key={stat.title}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                    <stat.icon className={`h-4 w-4 ${stat.color}`} />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <p className="text-xs text-muted-foreground">{stat.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Main Content */}
            <Tabs defaultValue="activity" className="mt-6">
              <TabsList>
                <TabsTrigger value="activity">Activité Récente</TabsTrigger>
                <TabsTrigger value="alerts">Alertes Système</TabsTrigger>
                <TabsTrigger value="analytics">Analyses</TabsTrigger>
                <TabsTrigger value="management">Gestion</TabsTrigger>
              </TabsList>

              <TabsContent value="activity" className="mt-6">
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                  <Card className="col-span-4">
                    <CardHeader>
                      <CardTitle>Activité Récente</CardTitle>
                      <CardDescription>Derniers événements système et actions utilisateurs</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {recentActivity.map((activity, index) => (
                          <div key={index} className="flex items-center space-x-4 p-3 border rounded-lg">
                            <div
                              className={`w-2 h-2 rounded-full ${
                                activity.type === "user"
                                  ? "bg-blue-500"
                                  : activity.type === "event"
                                    ? "bg-green-500"
                                    : activity.type === "payment"
                                      ? "bg-yellow-500"
                                      : "bg-purple-500"
                              }`}
                            />
                            <div className="flex-1">
                              <p className="text-sm font-medium">{activity.action || "Action système"}</p>
                              <p className="text-xs text-muted-foreground">
                                {activity.user || "Système"} - {activity.entityType}
                              </p>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {new Date(activity.createdAt || Date.now()).toLocaleTimeString("fr-FR")}
                            </p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="col-span-3">
                    <CardHeader>
                      <CardTitle>Actions Rapides</CardTitle>
                      <CardDescription>Raccourcis administratifs</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Button className="w-full justify-start bg-transparent" variant="outline" asChild>
                        <Link href="/admin/users">
                          <Users className="mr-2 h-4 w-4" />
                          Gérer les Utilisateurs
                        </Link>
                      </Button>
                      <Button className="w-full justify-start bg-transparent" variant="outline" asChild>
                        <Link href="/admin/organizers">
                          <Shield className="mr-2 h-4 w-4" />
                          Valider les Organisateurs
                        </Link>
                      </Button>
                      <Button className="w-full justify-start bg-transparent" variant="outline" asChild>
                        <Link href="/admin/events">
                          <Calendar className="mr-2 h-4 w-4" />
                          Modérer les Événements
                        </Link>
                      </Button>
                      <Button className="w-full justify-start bg-transparent" variant="outline" asChild>
                        <Link href="/admin/reports">
                          <BarChart3 className="mr-2 h-4 w-4" />
                          Générer un Rapport
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="alerts" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Alertes Système</CardTitle>
                    <CardDescription>Problèmes nécessitant une attention</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {systemAlerts.length > 0 ? (
                      systemAlerts.map((alert, index) => (
                        <div
                          key={index}
                          className={`p-3 border rounded-lg ${
                            alert.severity === "CRITICAL"
                              ? "border-red-200 bg-red-50"
                              : alert.severity === "HIGH"
                                ? "border-yellow-200 bg-yellow-50"
                                : "border-gray-200 bg-gray-50"
                          }`}
                        >
                          <div className="flex items-center space-x-2">
                            <AlertTriangle
                              className={`h-4 w-4 ${
                                alert.severity === "CRITICAL"
                                  ? "text-red-600"
                                  : alert.severity === "HIGH"
                                    ? "text-yellow-600"
                                    : "text-gray-600"
                              }`}
                            />
                            <span
                              className={`text-sm font-medium ${
                                alert.severity === "CRITICAL"
                                  ? "text-red-800"
                                  : alert.severity === "HIGH"
                                    ? "text-yellow-800"
                                    : "text-gray-800"
                              }`}
                            >
                              {alert.severity || "Avertissement"}
                            </span>
                          </div>
                          <p
                            className={`text-sm mt-1 ${
                              alert.severity === "CRITICAL"
                                ? "text-red-700"
                                : alert.severity === "HIGH"
                                  ? "text-yellow-700"
                                  : "text-gray-700"
                            }`}
                          >
                            {alert.description || "Problème système détecté"}
                          </p>
                          <p
                            className={`text-xs mt-1 ${
                              alert.severity === "CRITICAL"
                                ? "text-red-600"
                                : alert.severity === "HIGH"
                                  ? "text-yellow-600"
                                  : "text-gray-600"
                            }`}
                          >
                            {new Date(alert.createdAt || Date.now()).toLocaleString("fr-FR")}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <Shield className="h-12 w-12 text-green-500 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-green-800 mb-2">Système Sain</h3>
                        <p className="text-green-600">Aucune alerte système active</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="analytics" className="mt-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Croissance Plateforme</CardTitle>
                      <CardDescription>Métriques de croissance mensuelle</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span>Nouveaux utilisateurs</span>
                          <div className="flex items-center">
                            <TrendingUp className="mr-1 h-4 w-4 text-green-600" />
                            <span className="font-medium">+{stats?.monthly_growth || 0}%</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Organisateurs actifs</span>
                          <div className="flex items-center">
                            <TrendingUp className="mr-1 h-4 w-4 text-green-600" />
                            <span className="font-medium">{stats?.total_organizers || 0}</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Revenus commission</span>
                          <div className="flex items-center">
                            <TrendingUp className="mr-1 h-4 w-4 text-green-600" />
                            <span className="font-medium">
                              {((stats?.total_revenue || 0) * 0.12).toLocaleString()} DT
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Performance Système</CardTitle>
                      <CardDescription>Métriques techniques</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span>Temps de réponse API</span>
                          <span className="font-medium text-green-600">125ms</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Disponibilité</span>
                          <span className="font-medium text-green-600">99.9%</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Transactions/min</span>
                          <span className="font-medium">1,247</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Erreurs système</span>
                          <span className="font-medium text-yellow-600">0.1%</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="management" className="mt-6">
                <div className="grid gap-6 md:grid-cols-3">
                  <Card>
                    <CardHeader>
                      <CardTitle>Gestion des Utilisateurs</CardTitle>
                      <CardDescription>Administration des comptes utilisateurs</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <Button className="w-full justify-start bg-transparent" variant="outline" asChild>
                        <Link href="/admin/users">Tous les utilisateurs</Link>
                      </Button>
                      <Button className="w-full justify-start bg-transparent" variant="outline" asChild>
                        <Link href="/admin/users/pending">Comptes en attente</Link>
                      </Button>
                      <Button className="w-full justify-start bg-transparent" variant="outline" asChild>
                        <Link href="/admin/users/suspended">Comptes suspendus</Link>
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Gestion du Contenu</CardTitle>
                      <CardDescription>Modération et validation</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <Button className="w-full justify-start bg-transparent" variant="outline" asChild>
                        <Link href="/admin/events/pending">Événements en attente</Link>
                      </Button>
                      <Button className="w-full justify-start bg-transparent" variant="outline" asChild>
                        <Link href="/admin/organizers/pending">Organisateurs à valider</Link>
                      </Button>
                      <Button className="w-full justify-start bg-transparent" variant="outline" asChild>
                        <Link href="/admin/venues">Gestion des lieux</Link>
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Système & Sécurité</CardTitle>
                      <CardDescription>Configuration et monitoring</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <Button className="w-full justify-start bg-transparent" variant="outline" asChild>
                        <Link href="/admin/security">Sécurité</Link>
                      </Button>
                      <Button className="w-full justify-start bg-transparent" variant="outline" asChild>
                        <Link href="/admin/audit-logs">Journaux d'audit</Link>
                      </Button>
                      <Button className="w-full justify-start bg-transparent" variant="outline" asChild>
                        <Link href="/admin/settings">Paramètres système</Link>
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* User Creation Modal */}
      <UserCreationModal 
        open={showAddUserModal}
        onOpenChange={setShowAddUserModal}
        onUserCreated={() => {
          // Refresh dashboard data when a user is created
          fetchDashboardData()
        }}
      />
    </ProtectedRoute>
  )
}
