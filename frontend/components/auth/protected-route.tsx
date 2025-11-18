"use client"

import type React from "react"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: string | string[]
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { data: session, status, update } = useSession()
  const router = useRouter()
  


  useEffect(() => {
    
    if (status === "loading") return // Still loading

    if (!session) {
      router.push("/auth/login")
      return
    }

    // If session exists but no roles are required, allow access
    if (!requiredRole) {
      return
    }

    const requiredRolesArr = Array.isArray(requiredRole) ? requiredRole : requiredRole ? [requiredRole] : [];
    
    // If session exists but user has no roles yet, wait a bit more
    if (!session.user?.roles || session.user.roles.length === 0) {
      return
    }
    
    const canonicalizeRole = (r: any): string | undefined => {
      if (!r) return undefined;
      const roleStr = (typeof r === "string" ? r : r?.role?.name || r?.name || "").toUpperCase();
      if ([
        "ADMIN", "SUPER_ADMIN", "ADMINISTRATEUR", "ADMINISTRATOR", "SUPER ADMINISTRATEUR",
        "ADMIN ORGANISATEUR", "ADMIN ORGANIZER", "ADMINISTRATEUR ORGANISATEUR",
        "ORGANIZER_ADMIN"  // ORGANIZER_ADMIN should be treated as ADMIN for admin panel access
      ].includes(roleStr)) return "ADMIN";
      if ([
        "ORGANIZER", "ORGANISATEUR"
      ].includes(roleStr)) return "ORGANIZER";
      if (["USER", "UTILISATEUR"].includes(roleStr)) return "USER";
      return undefined;
    };
    const userRoles = (session.user?.roles || [])
      .map((r: any) => canonicalizeRole(r))
      .filter((r): r is string => !!r);
    
    if (
      requiredRolesArr.length > 0 &&
      !userRoles.some((r: string) => requiredRolesArr.map((req) => canonicalizeRole(req)).includes(r))
    ) {
      router.push("/unauthorized")
      return
    }
  }, [session, status, router, requiredRole])

      if (status === "loading") {
      // If we have session data but status is still loading, allow access
      if (session && (session as any)?.user?.roles && (session as any).user.roles.length > 0) {
        return <>{children}</>
      }
      return (
        <div className="min-h-screen flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      )
    }

  if (!session) {
    return null
  }

  // If no roles are required, allow access
  if (!requiredRole) {
    return <>{children}</>
  }

  // If session exists but user has no roles yet, show loading
  if (!session.user?.roles || session.user.roles.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const requiredRolesArr = Array.isArray(requiredRole) ? requiredRole : requiredRole ? [requiredRole] : [];
  const canonicalizeRole = (r: any): string | undefined => {
    if (!r) return undefined;
    const roleStr = (typeof r === "string" ? r : r?.role?.name || r?.name || "").toUpperCase();
    if ([
      "ADMIN", "SUPER_ADMIN", "ADMINISTRATEUR", "ADMINISTRATOR", "SUPER ADMINISTRATEUR",
      "ADMIN ORGANISATEUR", "ADMIN ORGANIZER", "ADMINISTRATEUR ORGANISATEUR",
      "ORGANIZER_ADMIN"  // ORGANIZER_ADMIN should be treated as ADMIN for admin panel access
    ].includes(roleStr)) return "ADMIN";
    if ([
      "ORGANIZER", "ORGANISATEUR"
    ].includes(roleStr)) return "ORGANIZER";
    if (["USER", "UTILISATEUR"].includes(roleStr)) return "USER";
    return undefined;
  };
  const userRoles = (session.user?.roles || [])
    .map((r: any) => canonicalizeRole(r))
    .filter((r): r is string => !!r);
  
  if (
    requiredRolesArr.length > 0 &&
    !userRoles.some((r: string) => requiredRolesArr.map((req) => canonicalizeRole(req)).includes(r))
  ) {
    router.push("/unauthorized")
    return null
  }

  return <>{children}</>
}
