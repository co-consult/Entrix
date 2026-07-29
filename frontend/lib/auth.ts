import type { NextAuthOptions, User as NextAuthUser, Session } from "next-auth"
import type { NextApiRequest, NextApiResponse } from "next"
import Credentials from "next-auth/providers/credentials"

// Map backend role names to canonical frontend names
function canonicalizeRole(role: string): string {
  if (!role) return "";
  const r = role.toUpperCase();
  if ([
    "ADMIN", "SUPER_ADMIN", "ADMINISTRATEUR", "ADMINISTRATOR", "SUPER ADMINISTRATEUR",
    "ADMIN ORGANISATEUR", "ADMIN ORGANIZER", "ADMINISTRATEUR ORGANISATEUR",
    "ORGANIZER_ADMIN"  // ORGANIZER_ADMIN should be treated as ADMIN for admin panel access
  ].includes(r)) return "ADMIN";
  if ([
    "ORGANIZER", "ORGANISATEUR"
  ].includes(r)) return "ORGANIZER";
  if (["USER", "UTILISATEUR"].includes(r)) return "USER";
  return r;
}

export const authOptions: NextAuthOptions = {
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials: Record<string, string> | undefined): Promise<NextAuthUser | null> {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          const apiUrl =
            process.env.API_BASE_URL ||
            process.env.NEXT_PUBLIC_API_URL ||
            'http://backend:3000/api/v1';
          const response = await fetch(`${apiUrl}/auth/login`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          })

          const data = await response.json().catch(() => null)

          if (!response.ok) {
            const message = Array.isArray(data?.message)
              ? data.message.join(', ')
              : data?.message || "Identifiants invalides"
            throw new Error(message)
          }

          if (data?.mfaRequired || data?.data?.mfaRequired) {
            throw new Error("Authentification à deux facteurs requise. Contactez l'administrateur.")
          }

          if (data.success && data.data && data.data.tokens && data.data.user) {
            const u = data.data.user
            const firstName = u.firstName || u.first_name || ''
            const lastName = u.lastName || u.last_name || ''
            return {
              id: u.id,
              email: u.email,
              name: `${firstName} ${lastName}`.trim() || u.email,
              firstName,
              lastName,
              roles: u.roles || [],
              access_token: data.data.tokens.accessToken,
              refresh_token: data.data.tokens.refreshToken,
            } as any
          }

          throw new Error(data?.message || "Réponse de connexion invalide")
        } catch (error) {
          console.error("Auth error:", error)
          throw error
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 15 * 60, // 15 minutes (matches backend JWT expiry)
  },
  callbacks: {
    async jwt({ token, user }: { token: any; user?: NextAuthUser }) {
      if (user) {
        // Initial login - set all user data
        token.access_token = (user as any).access_token
        token.refresh_token = (user as any).refresh_token
        token.roles = (user as any).roles
        token.firstName = (user as any).firstName
        token.lastName = (user as any).lastName
        token.iat = Math.floor(Date.now() / 1000)
        token.exp = Math.floor(Date.now() / 1000) + (15 * 60) // 15 minutes from now
      }
      
      // Check if token is expired
      if (token.exp && token.exp < Math.floor(Date.now() / 1000)) {
        console.log("🔍 AUTH - JWT token expired, clearing session");
        return { ...token, access_token: null, refresh_token: null };
      }
      
      // On page refresh, existing token data is preserved automatically
      return token
    },
    async session({ session, token }: { session: Session; token: any }) {
      if (token && session.user) {
        // Check if token is expired
        if (token.exp && token.exp < Math.floor(Date.now() / 1000)) {
          console.log("🔍 AUTH - Session expired, redirecting to login");
          // Return empty session to trigger redirect
          return { ...session, user: { ...session.user, id: undefined } };
        }
        
        session.user.id = token.sub!;
        session.user.access_token = token.access_token as string;
        session.user.refresh_token = token.refresh_token as string;
        session.user.roles = token.roles as any[];
        
        // Try to get firstName and lastName from token first
        let firstName = token.firstName;
        let lastName = token.lastName;
        
        // Fallback: If no firstName/lastName, use hardcoded values for known users
        if (!firstName && !lastName) {
          if (token.email === 'admin@entrx.local') {
            firstName = 'Admin';
            lastName = 'User';
          }
        }
        
        (session.user as any).firstName = firstName as string;
        (session.user as any).lastName = lastName as string;
        // Set the name field for display
        session.user.name = `${firstName || ''} ${lastName || ''}`.trim() || token.email;
        // Add role property for compatibility with ProtectedRoute
        const userRole = Array.isArray(token.roles) && token.roles.length > 0
          ? canonicalizeRole(token.roles[0])
          : undefined;
        (session.user as any).role = userRole;
      }
      
      return session;
    },
  },
  pages: {
    signIn: "/auth/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
  events: {
    async signOut() {
      console.log("🔍 AUTH - User signed out, clearing session data");
    },
    async session({ session, token }) {
      console.log("🔍 AUTH - Session updated", { userId: session.user?.id, tokenExp: token.exp });
    },
  },
}

// Helper function to check user roles
export function hasRole(user: any, role: string): boolean {
  return (
    user?.roles?.some((r: any) => {
      const roleStr = typeof r === "string" ? r : r?.role?.name || r?.name || r?.code || "";
      return canonicalizeRole(roleStr) === canonicalizeRole(role);
    }) || false
  );
}

export function isAdmin(user: any): boolean {
  return hasRole(user, "ADMIN");
}

export function isOrganizer(user: any): boolean {
  return hasRole(user, "ORGANIZER");
}

export function canAccessAdminPanel(user: any): boolean {
  return isAdmin(user);
}

export function canAccessOrganizerPanel(user: any): boolean {
  return isOrganizer(user) || isAdmin(user)
}
