"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Sidebar } from "@/components/layout/sidebar"
import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Ticket, Calendar, MapPin, QrCode, Download, Search, RefreshCw, Eye, AlertTriangle } from "lucide-react"
import apiClient from "@/lib/api"
import type { Ticket as TicketType } from "@/types"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function TicketsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [tickets, setTickets] = useState<TicketType[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [selectedTicket, setSelectedTicket] = useState<TicketType | null>(null)

  useEffect(() => {
    if (status === "authenticated") {
      fetchTickets()
    }
  }, [status, searchTerm, selectedStatus])

  const fetchTickets = async () => {
    try {
      setLoading(true)
      const tickets = await apiClient.getTickets({
        user_id: session?.user?.id,
        search: searchTerm,
        is_active: selectedStatus === "active" ? true : selectedStatus === "inactive" ? false : undefined,
      })
      setTickets(Array.isArray(tickets) ? tickets : [])
    } catch (error) {
      console.error("Error fetching tickets:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (ticket: TicketType) => {
    if (!ticket.is_active) return "bg-red-100 text-red-800"
    if (ticket.is_used) return "bg-gray-100 text-gray-800"
    if (new Date(ticket.valid_until) < new Date()) return "bg-yellow-100 text-yellow-800"
    return "bg-green-100 text-green-800"
  }

  const getStatusText = (ticket: TicketType) => {
    if (!ticket.is_active) return "Inactif"
    if (ticket.is_used) return "Utilisé"
    if (new Date(ticket.valid_until) < new Date()) return "Expiré"
    return "Valide"
  }

  const handleDownloadTicket = async (ticketId: string) => {
    try {
      const response = await fetch(`/api/tickets/${ticketId}/download`)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `ticket-${ticketId}.pdf`
      a.click()
    } catch (error) {
      console.error("Error downloading ticket:", error)
    }
  }

  const activeTickets = tickets.filter((t) => t.is_active && !t.is_used && new Date(t.valid_until) >= new Date())
  const usedTickets = tickets.filter((t) => t.is_used)
  const expiredTickets = tickets.filter((t) => new Date(t.valid_until) < new Date() || !t.is_active)

  return (
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

            <PageHeader title="Mes Billets" description="Gérez vos billets d'événements">
              <Button onClick={fetchTickets} variant="outline">
                <RefreshCw className="mr-2 h-4 w-4" />
                Actualiser
              </Button>
            </PageHeader>

            {/* Search and Filters */}
            <div className="mt-6 mb-6 space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher des billets ou événements..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    <SelectItem value="active">Valides</SelectItem>
                    <SelectItem value="used">Utilisés</SelectItem>
                    <SelectItem value="inactive">Expirés/Inactifs</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-3 mb-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Billets Valides</CardTitle>
                  <Ticket className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{activeTickets.length}</div>
                  <p className="text-xs text-muted-foreground">Prêts à utiliser</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Billets Utilisés</CardTitle>
                  <Ticket className="h-4 w-4 text-gray-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{usedTickets.length}</div>
                  <p className="text-xs text-muted-foreground">Événements passés</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Dépensé</CardTitle>
                  <Ticket className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {tickets.reduce((sum, ticket) => sum + ticket.price_paid, 0)} DT
                  </div>
                  <p className="text-xs text-muted-foreground">Tous les billets</p>
                </CardContent>
              </Card>
            </div>

            {/* Tickets Tabs */}
            <Tabs defaultValue="active" className="space-y-6">
              <TabsList>
                <TabsTrigger value="active">Billets Valides ({activeTickets.length})</TabsTrigger>
                <TabsTrigger value="used">Utilisés ({usedTickets.length})</TabsTrigger>
                <TabsTrigger value="expired">Expirés ({expiredTickets.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="active">
                {activeTickets.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {activeTickets.map((ticket) => (
                      <Card key={ticket.id} className="hover:shadow-md transition-shadow">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="text-lg">{ticket.event?.name}</CardTitle>
                              <CardDescription className="flex items-center mt-1">
                                <Calendar className="mr-1 h-3 w-3" />
                                {new Date(ticket.event?.scheduled_start || "").toLocaleDateString("fr-FR")}
                              </CardDescription>
                            </div>
                            <Badge className={getStatusColor(ticket)}>{getStatusText(ticket)}</Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div className="text-sm">
                              <p className="font-medium">Billet #{ticket.ticket_number}</p>
                              <p className="text-muted-foreground">{ticket.ticket_type?.name}</p>
                            </div>

                            <div className="flex items-center text-sm text-muted-foreground">
                              <MapPin className="mr-1 h-3 w-3" />
                              {ticket.event?.venue?.name}, {ticket.event?.venue?.city}
                            </div>

                            <div className="flex items-center justify-between text-sm">
                              <span>Prix payé:</span>
                              <span className="font-medium">{ticket.price_paid} DT</span>
                            </div>
                            <div className="flex justify-center mt-4">
                              <Button
                                onClick={() => {
                                  if (!session) {
                                    router.push(`/auth/login?callbackUrl=/tickets/purchase/${ticket.ticket_type_id}`)
                                  } else {
                                    router.push(`/tickets/purchase/${ticket.ticket_type_id}`)
                                  }
                                }}
                                className="w-full"
                              >
                                Acheter
                              </Button>
                            </div>

                            <div className="flex items-center justify-between text-sm">
                              <span>Valide jusqu'au:</span>
                              <span className="font-medium">
                                {new Date(ticket.valid_until).toLocaleDateString("fr-FR")}
                              </span>
                            </div>

                            <div className="flex space-x-2 pt-2">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="outline" size="sm" onClick={() => setSelectedTicket(ticket)}>
                                    <QrCode className="mr-1 h-3 w-3" />
                                    QR Code
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-md">
                                  <DialogHeader>
                                    <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                                      <QrCode className="h-6 w-6 text-primary" />
                                      QR Code du Billet
                                    </DialogTitle>
                                    <DialogDescription className="text-base mt-1 mb-4">
                                      Présentez ce QR code à l'entrée de l'événement. Gardez-le accessible sur votre téléphone ou imprimez-le.
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="flex flex-col items-center space-y-6 py-2">
                                    {/* QR Code Section */}
                                    <div className="rounded-xl bg-white shadow-lg p-4 flex flex-col items-center">
                                      <div className="w-48 h-48 flex items-center justify-center bg-gray-50 rounded-lg border mb-2">
                                        <QrCode className="h-32 w-32 text-primary" />
                                      </div>
                                      <div className="text-center mt-2">
                                        <p className="font-semibold text-lg">{ticket.event?.name}</p>
                                        <p className="text-sm text-muted-foreground">Billet #{ticket.ticket_number}</p>
                                      </div>
                                    </div>
                                    {/* Ticket Info Section */}
                                    <div className="w-full flex flex-col items-center gap-2">
                                      <div className="flex items-center gap-2 text-sm">
                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                        <span>{new Date(ticket.event?.scheduled_start || "").toLocaleDateString("fr-FR")}</span>
                                      </div>
                                      <div className="flex items-center gap-2 text-sm">
                                        <MapPin className="h-4 w-4 text-muted-foreground" />
                                        <span>{ticket.event?.venue?.name}, {ticket.event?.venue?.city}</span>
                                      </div>
                                      <div className="flex items-center gap-2 text-sm">
                                        <Ticket className="h-4 w-4 text-muted-foreground" />
                                        <span>{ticket.ticket_type?.name}</span>
                                      </div>
                                      <div className="flex items-center gap-2 text-sm">
                                        <Badge className="bg-green-100 text-green-800">{getStatusText(ticket)}</Badge>
                                      </div>
                                    </div>
                                    <div className="w-full text-center text-xs text-muted-foreground mt-2">
                                      Pour toute question, contactez le support ou l'organisateur de l'événement.
                                    </div>
                                  </div>
                                </DialogContent>
                              </Dialog>

                              <Button variant="outline" size="sm" onClick={() => handleDownloadTicket(ticket.id)}>
                                <Download className="mr-1 h-3 w-3" />
                                PDF
                              </Button>

                              <Button variant="outline" size="sm" asChild>
                                <Link href={`/events/${ticket.event?.id}`}>
                                  <Eye className="mr-1 h-3 w-3" />
                                  Événement
                                </Link>
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <Ticket className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium mb-2">Aucun billet valide</h3>
                      <p className="text-muted-foreground text-center mb-4">
                        Vous n'avez pas de billets valides pour le moment
                      </p>
                      <Button asChild>
                        <Link href="/events">Découvrir des événements</Link>
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="used">
                {usedTickets.length > 0 ? (
                  <div className="space-y-4">
                    {usedTickets.map((ticket) => (
                      <Card key={ticket.id}>
                        <CardContent className="flex items-center justify-between p-6">
                          <div className="flex items-center space-x-4">
                            <Ticket className="h-8 w-8 text-muted-foreground" />
                            <div>
                              <h3 className="font-medium">{ticket.event?.name}</h3>
                              <p className="text-sm text-muted-foreground">
                                Billet #{ticket.ticket_number} • {ticket.ticket_type?.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Utilisé le {ticket.used_at ? new Date(ticket.used_at).toLocaleDateString("fr-FR") : "N/A"}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge className={getStatusColor(ticket)}>{getStatusText(ticket)}</Badge>
                            <p className="text-sm text-muted-foreground mt-1">{ticket.price_paid} DT</p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <Ticket className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium mb-2">Aucun billet utilisé</h3>
                      <p className="text-muted-foreground text-center">
                        Vos billets utilisés apparaîtront ici après les événements
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="expired">
                {expiredTickets.length > 0 ? (
                  <div className="space-y-4">
                    {expiredTickets.map((ticket) => (
                      <Card key={ticket.id}>
                        <CardContent className="flex items-center justify-between p-6">
                          <div className="flex items-center space-x-4">
                            <Ticket className="h-8 w-8 text-muted-foreground" />
                            <div>
                              <h3 className="font-medium">{ticket.event?.name}</h3>
                              <p className="text-sm text-muted-foreground">
                                Billet #{ticket.ticket_number} • {ticket.ticket_type?.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Expiré le {new Date(ticket.valid_until).toLocaleDateString("fr-FR")}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge className={getStatusColor(ticket)}>{getStatusText(ticket)}</Badge>
                            <p className="text-sm text-muted-foreground mt-1">{ticket.price_paid} DT</p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <Ticket className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium mb-2">Aucun billet expiré</h3>
                      <p className="text-muted-foreground text-center">
                        Les billets expirés ou inactifs apparaîtront ici
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
  )
}
