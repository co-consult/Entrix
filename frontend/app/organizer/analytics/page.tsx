"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Sidebar } from "@/components/layout/sidebar";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart3, Calendar, Ticket, Users } from "lucide-react";
import { CustomCurrencyIcon } from "@/components/ui/custom-currency-icon";
import { eventsApi } from "@/lib/api/events";
import type { Event, Ticket as TicketType, EventParticipant } from "@/types";

function getOrganizerId(user: any): string | undefined {
  return user?.organizer_id || user?.organizerId;
}

export default function OrganizerAnalyticsPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState({
    totalEvents: 0,
    totalTickets: 0,
    totalParticipants: 0,
    totalRevenue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const organizerId = getOrganizerId(session?.user);
    if (organizerId) {
      fetchAnalytics(organizerId);
    } else {
      setStats({ totalEvents: 0, totalTickets: 0, totalParticipants: 0, totalRevenue: 0 });
      setLoading(false);
    }
    // eslint-disable-next-line
  }, [session?.user]);

  const fetchAnalytics = async (organizerId: string) => {
    try {
      setLoading(true);
      const eventsResponse = await eventsApi.getOrganizerEvents(organizerId);
      const events: Event[] = Array.isArray(eventsResponse) ? eventsResponse : eventsResponse.data || [];
      let totalTickets = 0;
      let totalParticipants = 0;
      let totalRevenue = 0;
      events.forEach(event => {
        if (Array.isArray(event.tickets)) {
          totalTickets += event.tickets.length;
          totalRevenue += event.tickets.reduce((sum, t) => sum + (t.price_paid || 0), 0);
        }
        if (Array.isArray(event.participants)) {
          totalParticipants += event.participants.length;
        }
      });
      setStats({
        totalEvents: events.length,
        totalTickets,
        totalParticipants,
        totalRevenue,
      });
    } catch (error) {
      setStats({ totalEvents: 0, totalTickets: 0, totalParticipants: 0, totalRevenue: 0 });
    } finally {
      setLoading(false);
    }
  };

  const statsCards = [
    {
      title: "Événements",
      value: loading ? "..." : stats.totalEvents,
      description: "Total organisés",
      icon: Calendar,
      color: "text-blue-600",
    },
    {
      title: "Billets",
      value: loading ? "..." : stats.totalTickets,
      description: "Total vendus",
      icon: Ticket,
      color: "text-green-600",
    },
    {
      title: "Participants",
      value: loading ? "..." : stats.totalParticipants,
      description: "Total inscrits",
      icon: Users,
      color: "text-purple-600",
    },
    {
      title: "Revenus",
      value: loading ? "..." : `${stats.totalRevenue.toLocaleString()} DT`,
      description: "Total estimé",
      icon: CustomCurrencyIcon,
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
              title="Analyses & Statistiques"
              description="Statistiques globales sur vos événements, billets et participants."
            />
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mt-6">
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
            {/* Placeholder for future charts */}
            <div className="mt-8">
              <Card>
                <CardHeader>
                  <CardTitle>Graphiques & Analyses Avancées</CardTitle>
                  <CardDescription>Bientôt disponible : visualisez vos ventes, fréquentation, etc.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center text-muted-foreground py-8">Section graphique à venir...</div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
} 