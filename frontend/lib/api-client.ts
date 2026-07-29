import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import { signOut } from 'next-auth/react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://preprod.css.cloud.ms2tech.fr/api/v1"

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
})

// Token expiry handling
let expiryLogoutTimer: NodeJS.Timeout | null = null;

const scheduleTokenExpiry = (token: string) => {
  try {
    // Clear any existing timer
    if (expiryLogoutTimer) {
      clearTimeout(expiryLogoutTimer);
    }

    // Decode JWT to get expiration
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expirationTime = payload.exp * 1000; // Convert to milliseconds
    const currentTime = Date.now();
    const timeUntilExpiry = Math.max(expirationTime - currentTime, 0);

    // Schedule automatic logout when token expires
    if (timeUntilExpiry > 0) {
      expiryLogoutTimer = setTimeout(() => {
        console.log('🔍 TOKEN EXPIRY - Token expired, forcing logout');
        handleTokenExpiry();
      }, timeUntilExpiry);
    } else {
      // Token already expired
      console.log('🔍 TOKEN EXPIRY - Token already expired, logging out immediately');
      handleTokenExpiry();
    }
  } catch (error) {
    console.error('Error scheduling token expiry:', error);
  }
};

const handleTokenExpiry = () => {
  // Clear any existing timers
  if (expiryLogoutTimer) {
    clearTimeout(expiryLogoutTimer);
    expiryLogoutTimer = null;
  }

  // Clear token from localStorage
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');

  // Force logout and redirect to login
  signOut({ redirect: true, callbackUrl: '/auth/login' });
};

// Helper to set the token globally
export function setToken(token: string) {
  apiClient.defaults.headers.Authorization = `Bearer ${token}`;
}

// Helper to get the current token from session
async function getCurrentToken(): Promise<string | null> {
  try {
    const response = await fetch('/api/auth/session');
    const session = await response.json();
    return session?.user?.access_token || null;
  } catch (error) {
    console.error("🔍 API CLIENT - Error getting current token:", error);
    return null;
  }
}

// Initialize token from session on page load
async function initializeToken() {
  const token = await getCurrentToken();
  if (token) {
    console.log("🔍 API CLIENT - Initializing token from session");
    setToken(token);
    scheduleTokenExpiry(token);
  }
}

// Proactive token refresh mechanism
let refreshTimer: NodeJS.Timeout | null = null;

// Function to schedule token refresh
function scheduleTokenRefresh() {
  // Clear existing timer
  if (refreshTimer) {
    clearTimeout(refreshTimer);
  }

  // Get current session to check token expiration
  fetch('/api/auth/session')
    .then(response => response.json())
    .then(session => {
      if (session?.user?.access_token) {
        try {
          // Decode JWT to get expiration time
          const token = session.user.access_token;
          const payload = JSON.parse(atob(token.split('.')[1]));
          const expirationTime = payload.exp * 1000; // Convert to milliseconds
          const currentTime = Date.now();
          const timeUntilExpiry = expirationTime - currentTime;
          
          // Refresh token 2 minutes before it expires (13 minutes after creation)
          const refreshTime = Math.max(timeUntilExpiry - (2 * 60 * 1000), 0);
          
          console.log(`🔍 API CLIENT - Scheduling token refresh in ${Math.round(refreshTime / 1000)} seconds`);
          
          refreshTimer = setTimeout(async () => {
            console.log("🔍 API CLIENT - Proactive token refresh triggered");
            const newToken = await refreshToken();
            if (newToken) {
              setToken(newToken);
              scheduleTokenExpiry(newToken);
              // Schedule next refresh
              scheduleTokenRefresh();
            }
          }, refreshTime);
        } catch (error) {
          console.error("🔍 API CLIENT - Error parsing token for refresh scheduling:", error);
        }
      }
    })
    .catch(error => {
      console.error("🔍 API CLIENT - Error getting session for refresh scheduling:", error);
    });
}

// Request interceptor to automatically add token to requests
apiClient.interceptors.request.use(
  async (config) => {
    // If no token is set, try to get it from session
    if (!config.headers.Authorization) {
      const token = await getCurrentToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Start proactive refresh when the module loads (if in browser)
if (typeof window !== 'undefined') {
  // Initialize token from session first
  initializeToken().then(() => {
    // Then schedule refresh
    scheduleTokenRefresh();
  });
  
  // Re-schedule on page visibility change (user comes back to tab)
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      console.log("🔍 API CLIENT - Page became visible, re-scheduling token expiry and refresh");
      getCurrentToken().then(token => {
        if (token) {
          scheduleTokenExpiry(token);
          scheduleTokenRefresh();
        }
      });
    }
  });
  
  // Re-schedule on window focus (user switches back to window)
  window.addEventListener('focus', () => {
    console.log("🔍 API CLIENT - Window focused, re-scheduling token expiry and refresh");
    getCurrentToken().then(token => {
      if (token) {
        scheduleTokenExpiry(token);
        scheduleTokenRefresh();
      }
    });
  });
}

// Token refresh function
async function refreshToken(): Promise<string | null> {
  try {
    // Get the current session to access refresh token
    const response = await fetch('/api/auth/session');
    const session = await response.json();
    
    if (!session?.user?.refresh_token) {
      console.log("🔍 API CLIENT - No refresh token available");
      return null;
    }

    console.log("🔍 API CLIENT - Attempting token refresh");

    // Call the backend refresh endpoint
    const refreshResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        refreshToken: session.user.refresh_token
      }),
    });

    if (!refreshResponse.ok) {
      console.log("🔍 API CLIENT - Token refresh failed with status:", refreshResponse.status);
      return null;
    }

    const refreshData = await refreshResponse.json();
    
    if (refreshData.success && refreshData.data?.tokens?.accessToken) {
      console.log("🔍 API CLIENT - Token refreshed successfully");
      
      // Note: Session will be updated on next page load or API call
      console.log("🔍 API CLIENT - Token refreshed, session will update on next interaction");
      
      return refreshData.data.tokens.accessToken;
    }
    
    console.log("🔍 API CLIENT - Token refresh response invalid:", refreshData);
    return null;
  } catch (error) {
    console.error("🔍 API CLIENT - Token refresh error:", error);
    return null;
  }
}

// Response interceptor for error handling and token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      console.log("🔍 API CLIENT - 401 error, attempting token refresh");
      
      const newToken = await refreshToken();
      
      if (newToken) {
        // Update the token in the client
        setToken(newToken);
        scheduleTokenExpiry(newToken);
        
        // Update the original request with new token
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        
        // Retry the original request
        return apiClient(originalRequest);
      } else {
        // Token refresh failed, redirect to login
        console.log("🔍 API CLIENT - Token refresh failed, redirecting to login");
        handleTokenExpiry();
      }
    }
    
    return Promise.reject(error);
  },
)

// Export functions for external use
export { handleTokenExpiry, scheduleTokenExpiry };
