"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Sidebar } from "@/components/layout/sidebar";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Ticket, CheckCircle, XCircle, Clock, BarChart3, Download } from "lucide-react";
import Link from "next/link";
import { eventsApi } from "@/lib/api/events";
import type { Event, Ticket as TicketType } from "@/types";

function getOrganizerId(user: any): string | undefined {
  return user?.organizer_id || user?.organizerId;
}

export default function OrganizerTicketsPage() {
  const { data: session, status } = useSession();
  const [tickets, setTickets] = useState<TicketType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "authenticated") {
      const organizerId = getOrganizerId(session?.user);
      if (organizerId) {
        fetchTickets(organizerId);
      } else {
        setTickets([]);
        setLoading(false);
      }
    }
    // eslint-disable-next-line
  }, [status]);

  const fetchTickets = async (organizerId: string) => {
    try {
      setLoading(true);
      const eventsResponse = await eventsApi.getOrganizerEvents(organizerId);
      const events: Event[] = Array.isArray(eventsResponse) ? eventsResponse : eventsResponse.data || [];
      // Aggregate all tickets from all events
      const allTickets: TicketType[] = [];
      events.forEach(event => {
        if (Array.isArray(event.tickets)) {
          event.tickets.forEach(ticket => {
            allTickets.push({ ...ticket, event });
          });
        }
      });
      setTickets(allTickets);
    } catch (error) {
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusText = (ticket: TicketType) => {
    if (!ticket.is_active) return "Inactif";
    if (ticket.is_used) return "Utilisé";
    if (new Date(ticket.valid_until) < new Date()) return "Expiré";
    return "Valide";
  };

  const getStatusColor = (ticket: TicketType) => {
    if (!ticket.is_active) return "bg-red-100 text-red-800";
    if (ticket.is_used) return "bg-gray-100 text-gray-800";
    if (new Date(ticket.valid_until) < new Date()) return "bg-yellow-100 text-yellow-800";
    return "bg-green-100 text-green-800";
  };

  // Compute stats for cards
  const totalTickets = tickets.length;
  const validTickets = tickets.filter(t => t.is_active && !t.is_used && new Date(t.valid_until) >= new Date()).length;
  const usedTickets = tickets.filter(t => t.is_used).length;
  const expiredTickets = tickets.filter(t => !t.is_used && new Date(t.valid_until) < new Date()).length;

  const statsCards = [
    {
      title: "Billets",
      value: loading ? "..." : totalTickets,
      description: "Total générés",
      icon: Ticket,
      color: "text-blue-600",
    },
    {
      title: "Valides",
      value: loading ? "..." : validTickets,
      description: "Billets valides",
      icon: CheckCircle,
      color: "text-green-600",
    },
    {
      title: "Utilisés",
      value: loading ? "..." : usedTickets,
      description: "Billets utilisés",
      icon: XCircle,
      color: "text-purple-600",
    },
    {
      title: "Expirés",
      value: loading ? "..." : expiredTickets,
      description: "Billets expirés",
      icon: Clock,
      color: "text-yellow-600",
    },
  ];

  return (
    <ProtectedRoute requiredRole="ORGANIZER">
      <div className="flex h-screen bg-background">
        <Sidebar type="organizer" />
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-auto p-6">
            <PageHeader
              title="Gestion des Billets"
              description="Liste de tous les billets vendus pour vos événements."
            />
            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-4 mt-6">
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
            {/* Main Content with Sidebar */}
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Main Table */}
              <div className="flex-1 min-w-0">
                <Card>
                  <CardHeader>
                    <CardTitle>Billets</CardTitle>
                    <CardDescription>Liste de tous les billets vendus pour vos événements</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="text-center py-8">Chargement...</div>
                    ) : tickets.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">Aucun billet trouvé.</div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead>
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Numéro</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Utilisateur</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Événement</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Valide jusqu'au</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {tickets.map((ticket, idx) => (
                              <tr key={ticket.id + "-" + idx}>
                                <td className="px-4 py-2 whitespace-nowrap">{ticket.ticket_number}</td>
                                <td className="px-4 py-2 whitespace-nowrap">{ticket.user?.first_name} {ticket.user?.last_name}</td>
                                <td className="px-4 py-2 whitespace-nowrap">{ticket.event?.name}</td>
                                <td className={`px-4 py-2 whitespace-nowrap`}>
                                  <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(ticket)}`}>{getStatusText(ticket)}</span>
                                </td>
                                <td className="px-4 py-2 whitespace-nowrap">{ticket.valid_until ? new Date(ticket.valid_until).toLocaleDateString("fr-FR") : "-"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
              {/* Quick Actions Sidebar */}
              <div className="lg:w-80 w-full flex-shrink-0">
                <div className="lg:sticky lg:top-24">
                  <Card>
                    <CardHeader>
                      <CardTitle>Actions Rapides</CardTitle>
                      <CardDescription>Raccourcis pour la gestion des billets</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Button className="w-full justify-start bg-transparent" variant="outline">
                        <Download className="mr-2 h-4 w-4" />
                        Exporter les Billets
                      </Button>
                      <Button className="w-full justify-start bg-transparent" variant="outline">
                        <BarChart3 className="mr-2 h-4 w-4" />
                        Voir les Statistiques
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
} 