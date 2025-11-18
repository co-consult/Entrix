"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  Shield, 
  Smartphone, 
  Monitor, 
  Key, 
  AlertTriangle, 
  CheckCircle,
  Settings,
  Trash2,
  Plus
} from "lucide-react"
import apiClient from "@/lib/api"

interface Session {
  id: string
  deviceInfo: {
    browser: string
    os: string
    device: string
  }
  ipAddress: string
  location: string
  lastActivity: string
  isActive: boolean
  isCurrent: boolean
}

interface TrustedDevice {
  id: string
  name: string
  deviceType: string
  addedAt: string
  lastUsed: string
}

interface SecurityEvent {
  id: string
  type: string
  description: string
  timestamp: string
  ipAddress: string
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
}

export default function SecurityPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('overview')
  const [sessions, setSessions] = useState<Session[]>([])
  const [trustedDevices, setTrustedDevices] = useState<TrustedDevice[]>([])
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([])
  const [mfaStatus, setMfaStatus] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!session) {
      router.push("/auth/login")
      return
    }
    loadSecurityData()
  }, [session, router])

  const loadSecurityData = async () => {
    try {
      setIsLoading(true)
      const [sessionsData, devicesData, eventsData, mfaData] = await Promise.all([
        apiClient.getAllSessions(),
        apiClient.getTrustedDevices(),
        apiClient.getSecurityEvents({ limit: 10 }),
        apiClient.getMfaStatus()
      ])
      
      setSessions(sessionsData)
      setTrustedDevices(devicesData)
      setSecurityEvents(eventsData)
      setMfaStatus(mfaData)
    } catch (error: any) {
      setError("Erreur lors du chargement des données de sécurité")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteSession = async (sessionId: string) => {
    try {
      await apiClient.deleteSession(sessionId)
      setSessions(sessions.filter(s => s.id !== sessionId))
    } catch (error: any) {
      setError("Erreur lors de la suppression de la session")
    }
  }

  const handleDeleteTrustedDevice = async (deviceId: string) => {
    try {
      await apiClient.deleteTrustedDevice(deviceId)
      setTrustedDevices(trustedDevices.filter(d => d.id !== deviceId))
    } catch (error: any) {
      setError("Erreur lors de la suppression de l'appareil")
    }
  }

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'HIGH': return 'destructive'
      case 'MEDIUM': return 'default'
      case 'LOW': return 'secondary'
      default: return 'secondary'
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Chargement...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Sécurité du compte</h1>
          <p className="text-muted-foreground">
            Gérez la sécurité et la confidentialité de votre compte
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Navigation Tabs */}
        <div className="flex space-x-1 bg-muted p-1 rounded-lg">
          {[
            { id: 'overview', label: 'Vue d\'ensemble', icon: Shield },
            { id: 'sessions', label: 'Sessions', icon: Monitor },
            { id: 'devices', label: 'Appareils', icon: Smartphone },
            { id: 'events', label: 'Événements', icon: AlertTriangle }
          ].map(tab => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? 'default' : 'ghost'}
              onClick={() => setActiveTab(tab.id)}
              className="flex-1"
            >
              <tab.icon className="mr-2 h-4 w-4" />
              {tab.label}
            </Button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="mr-2 h-5 w-5" />
                  Authentification à deux facteurs
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {mfaStatus?.enabled ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                      <span>MFA activé</span>
                    </div>
                    <Badge variant="secondary">
                      {mfaStatus.providers?.join(', ')}
                    </Badge>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <AlertTriangle className="mr-2 h-4 w-4 text-orange-600" />
                      <span>MFA désactivé</span>
                    </div>
                    <Button asChild size="sm">
                      <Link href="/auth/mfa-setup">Configurer</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Monitor className="mr-2 h-5 w-5" />
                  Sessions actives
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{sessions.length}</div>
                <p className="text-sm text-muted-foreground">
                  Sessions connectées
                </p>
                <Button asChild variant="outline" size="sm" className="mt-2">
                  <Link href="#" onClick={() => setActiveTab('sessions')}>
                    Gérer
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Smartphone className="mr-2 h-5 w-5" />
                  Appareils de confiance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{trustedDevices.length}</div>
                <p className="text-sm text-muted-foreground">
                  Appareils enregistrés
                </p>
                <Button asChild variant="outline" size="sm" className="mt-2">
                  <Link href="#" onClick={() => setActiveTab('devices')}>
                    Gérer
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertTriangle className="mr-2 h-5 w-5" />
                  Événements récents
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {securityEvents.filter(e => e.riskLevel === 'HIGH').length}
                </div>
                <p className="text-sm text-muted-foreground">
                  Événements à risque élevé
                </p>
                <Button asChild variant="outline" size="sm" className="mt-2">
                  <Link href="#" onClick={() => setActiveTab('events')}>
                    Voir tout
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Sessions Tab */}
        {activeTab === 'sessions' && (
          <Card>
            <CardHeader>
              <CardTitle>Sessions actives</CardTitle>
              <CardDescription>
                Gérez vos sessions connectées sur différents appareils
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {sessions.map((session) => (
                <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <Monitor className="h-8 w-8 text-muted-foreground" />
                    <div>
                      <div className="font-medium">
                        {session.deviceInfo.browser} sur {session.deviceInfo.os}
                        {session.isCurrent && (
                          <Badge variant="secondary" className="ml-2">Actuelle</Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {session.location} • {session.ipAddress}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Dernière activité: {new Date(session.lastActivity).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  {!session.isCurrent && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteSession(session.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Trusted Devices Tab */}
        {activeTab === 'devices' && (
          <Card>
            <CardHeader>
              <CardTitle>Appareils de confiance</CardTitle>
              <CardDescription>
                Appareils qui ne nécessitent pas de vérification MFA
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {trustedDevices.map((device) => (
                <div key={device.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <Smartphone className="h-8 w-8 text-muted-foreground" />
                    <div>
                      <div className="font-medium">{device.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {device.deviceType}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Ajouté le {new Date(device.addedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteTrustedDevice(device.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Security Events Tab */}
        {activeTab === 'events' && (
          <Card>
            <CardHeader>
              <CardTitle>Événements de sécurité</CardTitle>
              <CardDescription>
                Historique des événements de sécurité de votre compte
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {securityEvents.map((event) => (
                <div key={event.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <AlertTriangle className="h-8 w-8 text-muted-foreground" />
                    <div>
                      <div className="font-medium">{event.description}</div>
                      <div className="text-sm text-muted-foreground">
                        {event.ipAddress} • {new Date(event.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <Badge variant={getRiskLevelColor(event.riskLevel) as any}>
                    {event.riskLevel}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <div className="text-center">
          <Button asChild variant="outline">
            <Link href="/dashboard">Retour au tableau de bord</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}