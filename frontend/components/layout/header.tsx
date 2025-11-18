"use client"

import { useState } from "react"
import { useSession, signOut } from "next-auth/react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { User, Settings, LogOut, Calendar, Ticket, Crown, Menu, Home, MapPin } from "lucide-react"

// Helper function to get user display name
const getUserDisplayName = (session: any) => {
  if (!session?.user) return "Utilisateur"
  
  // Try to construct name from firstName and lastName (camelCase)
  const firstName = session.user.firstName || session.user.first_name
  const lastName = session.user.lastName || session.user.last_name
  
  if (firstName || lastName) {
    const fullName = `${firstName || ''} ${lastName || ''}`.trim()
    return fullName
  }
  
  // Fallback to session.user.name if available and not "undefined undefined"
  if (session.user.name && session.user.name !== "undefined undefined") {
    return session.user.name
  }
  
  // Final fallback to email
  return session.user.email || "Utilisateur"
}

// Helper function to get user initials
const getUserInitials = (session: any) => {
  if (!session?.user) return "U"
  
  const firstName = session.user.firstName || session.user.first_name
  const lastName = session.user.lastName || session.user.last_name
  
  if (firstName || lastName) {
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase() || "U"
  }
  
  // Fallback to email first letter
  return session.user.email?.[0]?.toUpperCase() || "U"
}

export function Header() {
  const { data: session, status } = useSession()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Navigation for anonymous users
  const anonymousNavigation = [
    { name: "Accueil", href: "/", icon: Home },
    { name: "Événements", href: "/events", icon: Calendar },
    { name: "Abonnements", href: "/subscriptions/plans", icon: Crown },
    { name: "Billets", href: "/tickets", icon: Ticket },
  ];

  const navigation = session
    ? [
    { name: "Accueil", href: "/", icon: Home },
    { name: "Événements", href: "/events", icon: Calendar },
    { name: "Lieux", href: "/venues", icon: MapPin },
  ]
    : anonymousNavigation;

  const userNavigation = session
    ? [
        { name: "Tableau de bord", href: "/dashboard", icon: Home },
        { name: "Mes billets", href: "/tickets", icon: Ticket },
        { name: "Abonnements", href: "/subscriptions", icon: Crown },
        { name: "Profil", href: "/profile", icon: User },
      ]
    : []

  const handleSignOut = () => {
    signOut({ callbackUrl: "/" })
  }

  // Get user display name and initials
  const displayName = getUserDisplayName(session)
  const userInitials = getUserInitials(session)

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <img
              src="/logo.png"
              alt="Logo CSS"
              className="h-10 w-auto mr-2"
            />
            <span className="font-bold text-xl">Entrix</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {status === "loading" ? (
              <div className="h-8 w-8 animate-pulse bg-muted rounded-full" />
            ) : session ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={session.user?.image || ""} alt={displayName} />
                      <AvatarFallback>
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{displayName}</p>
                      {session.user?.email && displayName !== session.user.email && (
                        <p className="text-xs leading-none text-muted-foreground">{session.user.email}</p>
                      )}
                      {session.user?.roles && session.user.roles.length > 0 && (
                        <Badge variant="secondary" className="w-fit text-xs">
                          {session.user.roles[0]}
                        </Badge>
                      )}
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {userNavigation.map((item) => (
                    <DropdownMenuItem key={item.name} asChild>
                      <Link href={item.href} className="flex items-center">
                        <item.icon className="mr-2 h-4 w-4" />
                        {item.name}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                  {session.user?.roles?.includes("ORGANIZER") && (
                    <DropdownMenuItem asChild>
                      <Link href="/organizer" className="flex items-center">
                        <Calendar className="mr-2 h-4 w-4" />
                        Espace Organisateur
                      </Link>
                    </DropdownMenuItem>
                  )}
                  {session.user?.roles?.includes("ADMIN") && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin" className="flex items-center">
                        <Settings className="mr-2 h-4 w-4" />
                        Administration
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Se déconnecter
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center space-x-2">
                <Button variant="ghost" asChild>
                  <Link href="/auth/login">Se connecter</Link>
                </Button>
                <Button asChild>
                  <Link href="/auth/register">S'inscrire</Link>
                </Button>
              </div>
            )}

            {/* Mobile Menu */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <div className="flex flex-col space-y-4 mt-6">
                  {navigation.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="flex items-center space-x-2 text-sm font-medium"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.name}</span>
                    </Link>
                  ))}
                  {session && (
                    <>
                      <div className="border-t pt-4">
                        {userNavigation.map((item) => (
                          <Link
                            key={item.name}
                            href={item.href}
                            className="flex items-center space-x-2 text-sm font-medium py-2"
                            onClick={() => setIsMobileMenuOpen(false)}
                          >
                            <item.icon className="h-4 w-4" />
                            <span>{item.name}</span>
                          </Link>
                        ))}
                        {session.user?.roles?.includes("ORGANIZER") && (
                          <Link
                            href="/organizer"
                            className="flex items-center space-x-2 text-sm font-medium py-2"
                            onClick={() => setIsMobileMenuOpen(false)}
                          >
                            <Calendar className="h-4 w-4" />
                            <span>Espace Organisateur</span>
                          </Link>
                        )}
                        {session.user?.roles?.includes("ADMIN") && (
                          <Link
                            href="/admin"
                            className="flex items-center space-x-2 text-sm font-medium py-2"
                            onClick={() => setIsMobileMenuOpen(false)}
                          >
                            <Settings className="h-4 w-4" />
                            <span>Administration</span>
                          </Link>
                        )}
                        <div className="border-t pt-4">
                          <button
                            onClick={() => {
                              handleSignOut()
                              setIsMobileMenuOpen(false)
                            }}
                            className="flex items-center space-x-2 text-sm font-medium py-2 w-full text-left"
                          >
                            <LogOut className="h-4 w-4" />
                            <span>Se déconnecter</span>
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  )
}