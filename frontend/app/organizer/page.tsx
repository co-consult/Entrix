"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Sidebar } from "@/components/layout/sidebar";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users, Plus, BarChart3, Ticket, MapPin } from "lucide-react";
import { CustomCurrencyIcon } from "@/components/ui/custom-currency-icon";
import apiClient from "@/lib/api";
import type { OrganizerStats } from "@/types";
import Link from "next/link";

function getOrganizerId(user: any): string | undefined {
  return user?.organizer_id || user?.organizerId;
}

export default function OrganizerDashboard() {
  const { data: session, status } = useSession();
  const [stats, setStats] = useState<OrganizerStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "authenticated") {
      fetchDashboardData();
    }
    // eslint-disable-next-line
  }, [status]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const organizerId = getOrganizerId(session?.user);
      if (!organizerId) {
        setStats(null);
        setLoading(false);
        return;
      }
      const statsResponse = await apiClient.getOrganizerStats(organizerId);
      // Type guard for response
      const data = (statsResponse && typeof statsResponse === 'object' && 'data' in statsResponse) ? (statsResponse as any).data : statsResponse;
      setStats(data);
    } catch (error) {
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  const statsCards = [
    {
      title: "Événements Actifs",
      value: loading ? "..." : stats?.active_events || 0,
      description: `+${stats?.total_events || 0} au total`,
      icon: Calendar,
      color: "text-blue-600",
    },
    {
      title: "Billets Vendus",
      value: loading ? "..." : stats?.sold_tickets || 0,
      description: `+${(((stats?.sold_tickets || 0) / (stats?.total_tickets || 1)) * 100).toFixed(1)}% taux de vente`,
      icon: Ticket,
      color: "text-green-600",
    },
    {
      title: "Revenus",
      value: loading ? "..." : `${(stats?.total_revenue || 0).toLocaleString()} DT`,
      description: "+20.1% ce mois",
      icon: CustomCurrencyIcon,
      color: "text-yellow-600",
    },
    {
      title: "Participants",
      value: loading ? "..." : stats?.total_participants || 0,
      description: `${((stats?.average_attendance || 0) * 100).toFixed(1)}% présence moyenne`,
      icon: Users,
      color: "text-purple-600",
    },
  ];

  const quickActions = [
    {
      label: "Créer un Événement",
      href: "/organizer/events/new",
      icon: Plus,
    },
    {
      label: "Gérer les Lieux",
      href: "/organizer/venues",
      icon: MapPin,
    },
    {
      label: "Voir les Analyses",
      href: "/organizer/analytics",
      icon: BarChart3,
    },
    {
      label: "Gestion des Billets",
      href: "/organizer/tickets",
      icon: Ticket,
    },
    {
      label: "Gérer les Participants",
      href: "/organizer/participants",
      icon: Users,
    },
  ];

  return (
    <ProtectedRoute requiredRole="ORGANIZER">
      <div className="flex h-screen bg-background">
        <Sidebar type="organizer" />
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-auto p-6">
            <PageHeader
              title="Tableau de Bord Organisateur"
              description="Vue d'ensemble de votre activité et accès rapide à vos outils."
            />
            {/* Stats Cards */}
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
            {/* Quick Actions Card */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mt-6">
              <Card className="col-span-4">
                <CardHeader>
                  <CardTitle>Actions Rapides</CardTitle>
                  <CardDescription>Raccourcis vers vos tâches courantes</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {quickActions.map((action) => (
                    <Button key={action.href} className="w-full justify-start bg-transparent" variant="outline" asChild>
                      <Link href={action.href}>
                        <action.icon className="mr-2 h-4 w-4" />
                        {action.label}
                      </Link>
                    </Button>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
