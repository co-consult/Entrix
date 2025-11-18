import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

const PUBLIC_PATHS = [
  "/",
  "/events",
  "/events/",
  "/contact",
  "/contact/",
  // static assets & auth pages are implicitly public via the matcher below
]

// Define which admin pages are functional (allowed to access)
const FUNCTIONAL_ADMIN_PAGES = [
  "/admin",
  "/admin/users",
  "/admin/events",
  "/admin/subscriptions",
  "/admin/subscriptions/plans",
  "/admin/orders",
  "/admin/access-control",
  "/admin/development",
  "/admin/venues",
  "/admin/mappings",
  "/admin/zones",
  "/admin/qr-codes",
  "/admin/seats",
]

// Define which admin pages should redirect to development page
const DEVELOPMENT_ADMIN_PAGES = [
  "/admin/organizers",
  "/admin/audit-logs",
  "/admin/commissions",
  "/admin/contact-requests",
  "/admin/groups",
  "/admin/notifications",
  "/admin/payments",
  "/admin/reports",
  "/admin/security",
  "/admin/settings",
  "/admin/webhooks",
  "/admin/venues/mapping-editor", // Cartography/mapping editor pages
]

function isPublic(pathname: string) {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`)) || pathname.startsWith("/auth")
}

function canonicalizeRole(role: any): string | undefined {
  if (!role) return undefined;
  // Handle both string roles and object roles
  const roleName = typeof role === "string" ? role : role?.role?.name || role?.name || "";
  const r = roleName.toUpperCase();
  
  if ([
    "ADMIN", "SUPER_ADMIN", "ADMINISTRATEUR", "ADMINISTRATOR", "SUPER ADMINISTRATEUR",
    "ADMIN ORGANISATEUR", "ADMIN ORGANIZER", "ADMINISTRATEUR ORGANISATEUR",
    "ORGANIZER_ADMIN"  // ORGANIZER_ADMIN should be treated as ADMIN for admin panel access
  ].includes(r)) return "ADMIN";
  if ([
    "ORGANIZER", "ORGANISATEUR"
  ].includes(r)) return "ORGANIZER";
  if (["USER", "UTILISATEUR"].includes(r)) return "USER";
  return undefined;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Allow static files and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.match(/\.(svg|png|jpg|jpeg|gif|webp|ico|js|css|json)$/)
  ) {
    return NextResponse.next()
  }

  // Allow API routes (backend API calls should not be intercepted by middleware)
  // These are handled by Next.js API routes or proxied to backend
  if (pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  // Allow public access to subscriptions and tickets pages
  if (
    pathname === '/subscriptions' ||
    pathname.startsWith('/subscriptions/plans') ||
    pathname === '/tickets' ||
    pathname.startsWith('/tickets')
  ) {
    return NextResponse.next()
  }

  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  })

  const isAuth = Boolean(token)
  const isAdminPath = pathname.startsWith("/admin")
  const isOrganizerPath = pathname.startsWith("/organizer")

  // Role-based guards
  const roles: string[] = (token?.roles ?? [])
    .map((r: any) => canonicalizeRole(r))
    .filter((r): r is string => !!r);

  // Debug logs for troubleshooting (can be removed in production)
  // console.log("🔍 MIDDLEWARE - Token roles:", token?.roles);
  // console.log("🔍 MIDDLEWARE - Canonicalized roles:", roles);
  // console.log("🔍 MIDDLEWARE - Has admin:", roles.includes("ADMIN"));
  // console.log("🔍 MIDDLEWARE - Path:", pathname);

  const hasAdmin = roles.includes("ADMIN");
  const hasOrganizer = roles.includes("ORGANIZER");

  // Redirect authenticated users away from auth pages
  if (pathname.startsWith("/auth") && isAuth) {
    // Redirect based on user role
    if (hasAdmin) {
      return NextResponse.redirect(new URL("/admin", req.url))
    } else if (hasOrganizer) {
      return NextResponse.redirect(new URL("/organizer", req.url))
    } else {
      return NextResponse.redirect(new URL("/dashboard", req.url))
    }
  }

  // Protect all non-public pages
  if (!isAuth && !isPublic(pathname)) {
    return NextResponse.redirect(new URL("/auth/login", req.url))
  }

  // Enforce ADMIN-only access for /admin routes
  if (isAdminPath && !hasAdmin) {
    return NextResponse.redirect(new URL("/unauthorized", req.url))
  }

  // If we have a token but no roles yet, allow the request to proceed
  // This handles the case where the session is still loading
  if (isAuth && roles.length === 0 && !isAdminPath) {
    return NextResponse.next()
  }

  // Remove admin role check - let the pages handle their own authentication
  // if (isAdminPath && !hasAdmin) {
  //   return NextResponse.redirect(new URL("/unauthorized", req.url))
  // }

  // Remove organizer role check - let the pages handle their own authentication
  // if (isOrganizerPath && !(hasOrganizer || hasAdmin)) {
  //   return NextResponse.redirect(new URL("/unauthorized", req.url))
  // }

  // Route interception for admin pages
  if (isAdminPath && hasAdmin) {
    // Special handling for mapping-editor routes (cartography) - check if pathname includes mapping-editor
    const isMappingEditor = pathname.includes('/mapping-editor');
    
    // Check if this is a development page that should redirect
    const isDevelopmentPage = isMappingEditor || DEVELOPMENT_ADMIN_PAGES.some(page => 
      pathname === page || pathname.startsWith(`${page}/`)
    );
    
    // Check if this is a functional page that should be allowed
    const isFunctionalPage = FUNCTIONAL_ADMIN_PAGES.some(page => 
      pathname === page || pathname.startsWith(`${page}/`)
    );

    // If it's a development page, redirect to the catch-all route
    if (isDevelopmentPage) {
      // Extract the slug from the pathname for the catch-all route
      const slug = pathname.replace('/admin/', '').replace('/admin', '');
      // Only redirect if we're not already on a catch-all route (check if slug exists)
      if (slug && slug !== '') {
        // Use a different approach - redirect to a specific development route
        // For mapping-editor, use a more descriptive page name
        const pageParam = isMappingEditor ? 'cartography' : slug;
        return NextResponse.redirect(new URL(`/admin/development?page=${pageParam}`, req.url))
      }
    }

    // If it's not a functional page and not a development page, also redirect to catch-all
    if (!isFunctionalPage && !isDevelopmentPage) {
      const slug = pathname.replace('/admin/', '').replace('/admin', '');
      // Only redirect if we're not already on a catch-all route (check if slug exists)
      if (slug && slug !== '') {
        // Use a different approach - redirect to a specific development route
        return NextResponse.redirect(new URL(`/admin/development?page=${slug}`, req.url))
      }
    }
  }

  return NextResponse.next()
}

export const config = {
  // Exclude next/static, next/image, favicon, and API routes
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
