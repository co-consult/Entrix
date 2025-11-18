"use client"

import type React from "react"

import { SessionProvider } from "next-auth/react"
import { ThemeProvider } from "@/components/theme-provider"
import { useSession } from "next-auth/react"
import { useEffect } from "react"
import { apiClient as axiosApiClient } from "@/lib/api-client"
import apiClient from "@/lib/api"

function ApiClientTokenProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  useEffect(() => {
    console.log("Providers - Session status:", status);
    console.log("Providers - Session user:", session?.user);
    if (status === "authenticated" && session?.user?.access_token) {
      console.log("Providers - Setting token:", session.user.access_token.substring(0, 20) + "...");
      axiosApiClient.defaults.headers.Authorization = `Bearer ${session.user.access_token}`;
      if (typeof apiClient.setToken === 'function') {
        apiClient.setToken(session.user.access_token);
      }
    } else {
      console.log("Providers - No token available");
    }
  }, [status, session?.user?.access_token]);

  // Only show loading spinner if session is required (authenticated route)
  // Otherwise, render children immediately
  // You can further refine this logic if you want to show a spinner only on protected pages
  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ApiClientTokenProvider>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </ApiClientTokenProvider>
    </SessionProvider>
  )
}
