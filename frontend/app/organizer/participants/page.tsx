"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Sidebar } from "@/components/layout/sidebar";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Calendar, UserCheck, UserX, BarChart3, Mail } from "lucide-react";
import Link from "next/link";
import { eventsApi } from "@/lib/api/events";
import type { Event, EventParticipant } from "@/types";

function getOrganizerId(user: any): string | undefined {
  return user?.organizer_id || user?.organizerId;
}

export default function OrganizerParticipantsPage() {
  const { data: session } = useSession();
  const [participants, setParticipants] = useState<EventParticipant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const organizerId = getOrganizerId(session?.user);
    if (organizerId) {
      fetchParticipants(organizerId);
    } else {
      setParticipants([]);
      setLoading(false);
    }
    // eslint-disable-next-line
  }, [session?.user]);

  const fetchParticipants = async (organizerId: string) => {
    try {
      setLoading(true);
      const eventsResponse = await eventsApi.getOrganizerEvents(organizerId);
      const events: Event[] = Array.isArray(eventsResponse) ? eventsResponse : eventsResponse.data || [];
      // Aggregate all participants from all events
      const allParticipants: EventParticipant[] = [];
      events.forEach(event => {
        if (Array.isArray(event.participants)) {
          event.participants.forEach(participant => {
            allParticipants.push({ ...participant, event });
          });
        }
      });
      setParticipants(allParticipants);
    } catch (error) {
      setParticipants([]);
    } finally {
      setLoading(false);
    }
  };

  // Compute stats for cards
  const totalParticipants = participants.length;
  const uniqueEvents = new Set(participants.map(p => p.event?.id)).size;
  const roles = participants.reduce((acc, p) => {
    acc[p.role] = (acc[p.role] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const confirmed = participants.filter(p => p.status === "CONFIRMED").length;
  const pending = participants.filter(p => p.status === "REGISTERED").length;

  const statsCards = [
    {
      title: "Participants",
      value: loading ? "..." : totalParticipants,
      description: "Total inscrits",
      icon: Users,
      color: "text-blue-600",
    },
    {
      title: "Événements",
      value: loading ? "..." : uniqueEvents,
      description: "Événements couverts",
      icon: Calendar,
      color: "text-green-600",
    },
    {
      title: "Confirmés",
      value: loading ? "..." : confirmed,
      description: "Participants confirmés",
      icon: UserCheck,
      color: "text-purple-600",
    },
    {
      title: "En attente",
      value: loading ? "..." : pending,
      description: "En attente de validation",
      icon: UserX,
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
              title="Gestion des Participants"
              description="Liste de tous les participants à vos événements."
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
                    <CardTitle>Participants</CardTitle>
                    <CardDescription>Liste de tous les participants à vos événements</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="text-center py-8">Chargement...</div>
                    ) : participants.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">Aucun participant trouvé.</div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead>
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Nom</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Événement</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Rôle</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {participants.map((participant, idx) => (
                              <tr key={participant.id + "-" + idx}>
                                <td className="px-4 py-2 whitespace-nowrap">{participant.user?.first_name} {participant.user?.last_name}</td>
                                <td className="px-4 py-2 whitespace-nowrap">{participant.user?.email}</td>
                                <td className="px-4 py-2 whitespace-nowrap">{participant.event?.name}</td>
                                <td className="px-4 py-2 whitespace-nowrap">{participant.role}</td>
                                <td className="px-4 py-2 whitespace-nowrap">{participant.status}</td>
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
                      <CardDescription>Raccourcis pour la gestion des participants</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Button className="w-full justify-start bg-transparent" variant="outline">
                        <Mail className="mr-2 h-4 w-4" />
                        Envoyer un Email à Tous
                      </Button>
                      <Button className="w-full justify-start bg-transparent" variant="outline">
                        <BarChart3 className="mr-2 h-4 w-4" />
                        Exporter la Liste
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