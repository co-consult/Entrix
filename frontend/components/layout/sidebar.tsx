"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import {
  Home,
  Calendar,
  Users,
  Ticket,
  Crown,
  Settings,
  BarChart3,
  MapPin,
  Shield,
  UserCheck,
  FileText,
  CreditCard,
  Building,
  Map,
  Wrench,
  User,
  Bell,
  Activity,
  MessageSquare,
  Database,
  Dot as DotIcon,
  ChevronDown,
  ShoppingCart,
  Plus,
  Star,
  QrCode,
  ClipboardList,
  Armchair,
} from "lucide-react"
import { CustomCurrencyIcon } from "@/components/ui/custom-currency-icon"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import { useSession } from "next-auth/react"
import { useState } from "react"
import SubscriptionSalesModal from "@/components/admin/SubscriptionSalesModal"
import { UserCreationModal } from "@/components/admin/user-creation-modal"
import { useToast } from "@/hooks/use-toast"

interface SidebarNavItem {
  name: string;
  href?: string;
  icon?: React.ComponentType<any>;
  children?: { name: string; href: string }[];
}

interface SidebarProps {
  type: "user" | "organizer" | "admin"
}

export function Sidebar({ type }: SidebarProps) {
  const pathname = usePathname()
  const { data: session } = useSession();
  const [openMenus, setOpenMenus] = useState<{ [key: string]: boolean }>({});
  const [showSalesModal, setShowSalesModal] = useState(false);
  const [showUserCreationModal, setShowUserCreationModal] = useState(false);
  const { toast } = useToast();

  // Determine if user is admin
  const isAdmin = session?.user?.roles?.some(
    (r: string) => ["ADMIN", "ADMINISTRATOR", "ADMINISTRATEUR", "ORGANIZER_ADMIN"].includes(r.toUpperCase())
  );




  // Helper: icon map for child items (customize as needed)
  const childIconMap: Record<string, React.ComponentType<any>> = {
    "Utilisateurs": Users,
    "Organisateurs": UserCheck,
    "Demandes de contact": MessageSquare,
    "Événements": Calendar,
    "Lieux": Building,
    "Venues": Building,
    "Mappings": Map,
    "Zones": MapPin,
    "Notifications": Bell,
    "Audit logs": FileText,
    "Webhooks": Activity,
    "Paiements": CreditCard,
    "Commissions": CustomCurrencyIcon,
    "Générateur de codes": Wrench,
    "Générateur de QR Codes": Database,
    "Plans d'abonnement": CreditCard,
    "Abonnements": Crown,
    "QR Codes": Database,
  };
  const DefaultChildIcon = DotIcon; // fallback icon

  // Anonymous navigation
  const anonymousNavigation: SidebarNavItem[] = [
    // {
    //   name: "Explorer",
    //   href: "/explore",
    //   icon: Home,
    // },
    {
      name: "Abonnements",
      href: "/subscriptions/plans",
      icon: Crown,
    },
    {
      name: "Billets",
      href: "/tickets",
      icon: Ticket,
    },
  ];

  const userNavigation: SidebarNavItem[] = [
    {
      name: "Tableau de bord",
      href: "/dashboard",
      icon: Home,
    },
    {
      name: "Mes billets",
      href: "/tickets",
      icon: Ticket,
    },
    {
      name: "Mes commandes",
      href: "/orders",
      icon: CreditCard,
    },
    {
      name: "Abonnements",
      href: "/subscriptions",
      icon: Crown,
    },
    {
      name: "Profil",
      href: "/profile",
      icon: User,
    },
  ]

  const organizerNavigation: SidebarNavItem[] = [
    {
      name: "Tableau de bord",
      href: "/organizer",
      icon: Home,
    },
    {
      name: "Événements",
      href: "/organizer/events",
      icon: Calendar,
    },
    {
      name: "Participants",
      href: "/organizer/participants",
      icon: Users,
    },
    {
      name: "Billets",
      href: "/organizer/tickets",
      icon: Ticket,
    },
    {
      name: "Lieux",
      href: "/organizer/venues",
      icon: MapPin,
    },
    {
      name: "Abonnements",
      href: "/subscriptions/manage",
      icon: Crown,
    },
    {
      name: "Analyses",
      href: "/organizer/analytics",
      icon: BarChart3,
    },
    {
      name: "Paramètres",
      href: "/organizer/settings",
      icon: Settings,
    },
  ]

  const adminNavigation: SidebarNavItem[] = [
    {
      name: "Tableau de bord",
      href: "/admin",
      icon: Home,
    },
    {
      name: "Gestion",
      icon: Users,
      children: [
        {
          name: "Utilisateurs",
          href: "/admin/users",
        },
        {
          name: "Événements",
          href: "/admin/events",
        },
        {
          name: "Lieux",
          href: "/admin/venues",
        },
        {
          name: "Mappings",
          href: "/admin/mappings",
        },
        {
          name: "Zones",
          href: "/admin/zones",
        },
        // {
        //   name: "Organisateurs",
        //   href: "/admin/organizers",
        // },
        // {
        //   name: "Groupes",
        //   href: "/admin/groups",
        // },
        // {
        //   name: "Demandes de contact",
        //   href: "/admin/contact-requests",
        // },
      ],
    },
    // {
    //   name: "Abonnements",
    //   href: "/admin/subscriptions",
    //   icon: Users,
    // },
    // {
    //   name: "Contenu",
    //   icon: Calendar,
    //   children: [
    //     {
    //       name: "Événements",
    //       href: "/admin/events",
    //     },
    //     // {
    //     //   name: "Lieux",
    //     //   href: "/admin/venues",
    //     // },
    //   ],
    // },
    // {
    //   name: "Système",
    //   icon: Activity,
    //   children: [
    //     {
    //       name: "Notifications",
    //       href: "/admin/notifications",
    //     },
    //     {
    //       name: "Audit logs",
    //       href: "/admin/audit-logs",
    //     },
    //     {
    //       name: "Webhooks",
    //       href: "/admin/webhooks",
    //     },
    //   ],
    // },
    // {
    //   name: "Financier",
    //   icon: CustomCurrencyIcon,
    //   children: [
    //     {
    //       name: "Paiements",
    //       href: "/admin/payments",
    //     },
    //     {
    //       name: "Commissions",
    //       href: "/admin/commissions",
    //     },
    //   ],
    // },
    {
      name: "Abonnements",
      icon: Ticket,
      children: [
        {
          name: "Plans d'abonnement",
          href: "/admin/subscriptions/plans",
        },
        {
          name: "Abonnements",
          href: "/admin/subscriptions",
        },
        {
          name: "QR Codes",
          href: "/admin/qr-codes",
        },
      ],
    },
    {
      name: "Commandes",
      href: "/admin/orders",
      icon: ShoppingCart,
    },
    {
      name: "Logs d'Accès",
      href: "/admin/access-control",
      icon: Shield,
    },
    // {
    //   name: "Rapports",
    //   href: "/admin/reports",
    //   icon: FileText,
    // },
    // {
    //   name: "Sécurité",
    //   href: "/admin/security",
    //   icon: Shield,
    // },
    // {
    //   name: "Outils",
    //   icon: Wrench,
    //   children: [
    //     {
    //       name: "Générateur de codes",
    //       href: "/tools/code-generator",
    //     },
    //     {
    //       name: "Générateur de QR Codes",
    //       href: "/tools/qr-code-generator",
    //     },
    //   ],
    // },
    // {
    //   name: "Paramètres",
    //   href: "/admin/settings",
    //   icon: Settings,
    // },
  ]

  const getNavigation = () => {
    if (!session) return anonymousNavigation;
    
    // Check if user has admin roles directly from session data
    const hasAdminRoles = session?.user?.roles?.some(
      (r: string) => ["ADMIN", "ADMINISTRATOR", "ADMINISTRATEUR", "ORGANIZER_ADMIN"].includes(r.toUpperCase())
    );
    
    if (hasAdminRoles) {
      return adminNavigation;
    }
    
    switch (type) {
      case "organizer":
        return organizerNavigation
      default:
        return userNavigation
    }
  }

  const navigation = getNavigation()

  return (
    <div className="flex h-full w-64 flex-col bg-muted/20 border-r">
      {/* Logo removed from sidebar, only in header now */}

      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-2">
          {navigation.map((item) => {
            if (item.children) {
              // Check if any child is active
              const isChildActive = item.children.some((child: { href: string }) => pathname === child.href || pathname.startsWith(child.href + "/"));
              const isOpen = openMenus[item.name] || isChildActive;
              return (
                <div key={item.name} className="mb-1">
                  <Button
                    variant={isChildActive ? "secondary" : "ghost"}
                    className={cn("w-full justify-start", isChildActive && "bg-secondary")}
                    onClick={() => setOpenMenus((prev) => ({ ...prev, [item.name]: !isOpen }))}
                  >
                    <span className="flex items-center w-full justify-between">
                      <span className="flex items-center">
                        {item.icon && <item.icon className="mr-2 h-4 w-4" />}
                        {item.name}
                      </span>
                      <span className="ml-auto">
                        <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")}/>
                      </span>
                    </span>
                  </Button>
                  {isOpen && (
                    <div className="ml-6 mt-1 flex flex-col gap-1">
                      {item.children.map((child: { name: string; href: string }) => {
                        const isActive = pathname === child.href || pathname.startsWith(child.href + "/");
                        const ChildIcon = childIconMap[child.name] || DefaultChildIcon;
                        return (
                          <Button
                            key={child.name}
                            variant={isActive ? "secondary" : "ghost"}
                            className={cn("w-full justify-start text-sm pl-6", isActive && "bg-secondary font-bold")}
                            asChild
                          >
                            <Link href={child.href || "#"} className="flex items-center">
                              <ChildIcon className="mr-2 h-4 w-4" />
                              {child.name}
                            </Link>
                          </Button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )
            }
            const isActive = item.href && (pathname === item.href || pathname.startsWith(item.href + "/"));
            return (
              <Button
                key={item.name}
                variant={isActive ? "secondary" : "ghost"}
                className={cn("w-full justify-start", isActive && "bg-secondary")}
                asChild
              >
                <Link href={item.href || "#"}>
                  {item.icon && <item.icon className="mr-2 h-4 w-4" />}
                  {item.name}
                </Link>
              </Button>
            )
          })}
        </nav>

        <Separator className="my-4" />

        {/* Quick Actions */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground px-2">Actions rapides</h4>
          {type === "user" && (
            <>
              <Button variant="ghost" className="w-full justify-start" asChild>
                <Link href="/events">
                  <Calendar className="mr-2 h-4 w-4" />
                  Découvrir des événements
                </Link>
              </Button>
              <Button variant="ghost" className="w-full justify-start" asChild>
                <Link href="/venues">
                  <MapPin className="mr-2 h-4 w-4" />
                  Explorer les lieux
                </Link>
              </Button>
            </>
          )}

          {type === "organizer" && (
            <>
              <Button variant="ghost" className="w-full justify-start" asChild>
                <Link href="/organizer/events/new">
                  <Calendar className="mr-2 h-4 w-4" />
                  Créer un événement
                </Link>
              </Button>
              <Button variant="ghost" className="w-full justify-start" asChild>
                <Link href="/organizer/venues/new">
                  <MapPin className="mr-2 h-4 w-4" />
                  Ajouter un lieu
                </Link>
              </Button>
            </>
          )}

          {type === "admin" && (
            <>
              <Button 
                variant="ghost" 
                className="w-full justify-start"
                onClick={() => setShowSalesModal(true)}
              >
                <ShoppingCart className="mr-2 h-4 w-4" />
                Vente d'abonnement
              </Button>
              <Button 
                variant="ghost" 
                className="w-full justify-start"
                onClick={() => setShowUserCreationModal(true)}
              >
                <Users className="mr-2 h-4 w-4" />
                Ajouter utilisateur
              </Button>
            </>
          )}
        </div>
      </ScrollArea>

      {/* Subscription Sales Modal */}
      {showSalesModal && (
        <SubscriptionSalesModal 
          open={showSalesModal} 
          onOpenChange={setShowSalesModal} 
          onSuccess={() => {
            toast({
              title: "Vente créée",
              description: "La vente d'abonnement a été créée avec succès",
              variant: "default"
            });
          }} 
        />
      )}

      {/* User Creation Modal */}
      {showUserCreationModal && (
        <UserCreationModal 
          open={showUserCreationModal} 
          onOpenChange={setShowUserCreationModal} 
          onUserCreated={() => {
            toast({
              title: "Utilisateur créé",
              description: "L'utilisateur a été créé avec succès",
              variant: "default"
            });
          }} 
        />
      )}
    </div>
  )
}
