import { apiClient } from "../api-client"
import type { ApiResponse } from "@/types"

export const anonymousApi = {
  // Anonymous User Creation & Management
  createAnonymousUser: async (data: {
    email?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    metadata?: any;
    source?: string;
    referrer?: string;
  }): Promise<ApiResponse<any>> => {
    const response = await apiClient.post("/anonymous", data)
    return response.data
  },

  getAnonymousByEmail: async (email: string): Promise<ApiResponse<any>> => {
    const response = await apiClient.get(`/anonymous/email/${encodeURIComponent(email)}`)
    return response.data
  },

  getAnonymousOnboarding: async (key: string): Promise<ApiResponse<any>> => {
    const response = await apiClient.get(`/anonymous/onboarding/${key}`)
    return response.data
  },

  updateAnonymousUser: async (key: string, data: any): Promise<ApiResponse<any>> => {
    const response = await apiClient.put(`/anonymous/${key}`, data)
    return response.data
  },

  deleteAnonymousUser: async (key: string): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete(`/anonymous/${key}`)
    return response.data
  },

  // Anonymous User Conversion
  convertAnonymousUser: async (data: {
    key?: string;
    email?: string;
    password: string;
    firstName?: string;
    lastName?: string;
    acceptTerms: boolean;
    marketingConsent?: boolean;
  }): Promise<ApiResponse<any>> => {
    const response = await apiClient.post("/anonymous/convert", data)
    return response.data
  },

  previewConversion: async (key: string): Promise<ApiResponse<any>> => {
    const response = await apiClient.get(`/anonymous/${key}/conversion-preview`)
    return response.data
  },

  getConversionRequirements: async (key: string): Promise<ApiResponse<any>> => {
    const response = await apiClient.get(`/anonymous/${key}/conversion-requirements`)
    return response.data
  },

  // Anonymous Key Management
  validateAnonymousKey: async (key: string): Promise<ApiResponse<any>> => {
    const response = await apiClient.get(`/anonymous/validate/${key}`)
    return response.data
  },

  generateAnonymousKey: async (data: {
    email?: string;
    source?: string;
    metadata?: any;
  }): Promise<ApiResponse<any>> => {
    const response = await apiClient.post("/anonymous/generate-key", data)
    return response.data
  },

  refreshAnonymousKey: async (oldKey: string): Promise<ApiResponse<any>> => {
    const response = await apiClient.post(`/anonymous/${oldKey}/refresh`)
    return response.data
  },

  extendAnonymousKey: async (key: string, extensionDays: number): Promise<ApiResponse<any>> => {
    const response = await apiClient.post(`/anonymous/${key}/extend`, { extensionDays })
    return response.data
  },

  // Anonymous Incentives & Rewards
  applyAnonymousIncentive: async (data: {
    key: string;
    incentiveCode: string;
    context?: any;
  }): Promise<ApiResponse<any>> => {
    const response = await apiClient.post("/anonymous/apply-incentive", data)
    return response.data
  },

  getAvailableIncentives: async (key: string): Promise<ApiResponse<any[]>> => {
    const response = await apiClient.get(`/anonymous/${key}/incentives`)
    return response.data
  },

  getAppliedIncentives: async (key: string): Promise<ApiResponse<any[]>> => {
    const response = await apiClient.get(`/anonymous/${key}/applied-incentives`)
    return response.data
  },

  // Anonymous Activity Tracking
  trackAnonymousActivity: async (key: string, activity: {
    type: string;
    action: string;
    entityId?: string;
    metadata?: any;
  }): Promise<ApiResponse<any>> => {
    const response = await apiClient.post(`/anonymous/${key}/activity`, activity)
    return response.data
  },

  getAnonymousActivity: async (key: string, filters?: {
    type?: string;
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<any[]>> => {
    const response = await apiClient.get(`/anonymous/${key}/activity`, { params: filters })
    return response.data
  },

  // Anonymous Preferences
  updateAnonymousPreferences: async (key: string, preferences: any): Promise<ApiResponse<any>> => {
    const response = await apiClient.put(`/anonymous/${key}/preferences`, preferences)
    return response.data
  },

  getAnonymousPreferences: async (key: string): Promise<ApiResponse<any>> => {
    const response = await apiClient.get(`/anonymous/${key}/preferences`)
    return response.data
  },

  // Anonymous Cart & Session
  getAnonymousCart: async (key: string): Promise<ApiResponse<any>> => {
    const response = await apiClient.get(`/anonymous/${key}/cart`)
    return response.data
  },

  updateAnonymousCart: async (key: string, cartData: any): Promise<ApiResponse<any>> => {
    const response = await apiClient.put(`/anonymous/${key}/cart`, cartData)
    return response.data
  },

  addToAnonymousCart: async (key: string, item: any): Promise<ApiResponse<any>> => {
    const response = await apiClient.post(`/anonymous/${key}/cart/items`, item)
    return response.data
  },

  removeFromAnonymousCart: async (key: string, itemId: string): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete(`/anonymous/${key}/cart/items/${itemId}`)
    return response.data
  },

  clearAnonymousCart: async (key: string): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete(`/anonymous/${key}/cart`)
    return response.data
  },

  // Anonymous Wishlist
  getAnonymousWishlist: async (key: string): Promise<ApiResponse<any[]>> => {
    const response = await apiClient.get(`/anonymous/${key}/wishlist`)
    return response.data
  },

  addToAnonymousWishlist: async (key: string, item: any): Promise<ApiResponse<any>> => {
    const response = await apiClient.post(`/anonymous/${key}/wishlist`, item)
    return response.data
  },

  removeFromAnonymousWishlist: async (key: string, itemId: string): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete(`/anonymous/${key}/wishlist/${itemId}`)
    return response.data
  },

  // Anonymous Statistics & Analytics
  getAnonymousConversionStats: async (filters?: {
    dateFrom?: string;
    dateTo?: string;
    source?: string;
  }): Promise<ApiResponse<any>> => {
    const response = await apiClient.get("/anonymous/stats/conversion", { params: filters })
    return response.data
  },

  getAnonymousGeneralStats: async (filters?: {
    dateFrom?: string;
    dateTo?: string;
  }): Promise<ApiResponse<any>> => {
    const response = await apiClient.get("/anonymous/stats/general", { params: filters })
    return response.data
  },

  getAnonymousActivityStats: async (key: string): Promise<ApiResponse<any>> => {
    const response = await apiClient.get(`/anonymous/${key}/stats`)
    return response.data
  },

  // Anonymous Communication
  sendAnonymousMessage: async (key: string, message: {
    type: string;
    subject?: string;
    body: string;
    recipientType?: string;
    metadata?: any;
  }): Promise<ApiResponse<any>> => {
    const response = await apiClient.post(`/anonymous/${key}/messages`, message)
    return response.data
  },

  getAnonymousMessages: async (key: string, filters?: any): Promise<ApiResponse<any[]>> => {
    const response = await apiClient.get(`/anonymous/${key}/messages`, { params: filters })
    return response.data
  },

  // Anonymous Export & Data
  exportAnonymousData: async (key: string, format: string = 'json'): Promise<any> => {
    const response = await apiClient.get(`/anonymous/${key}/export`, { 
      params: { format },
      responseType: 'blob'
    })
    return response.data
  },

  getAnonymousDataSummary: async (key: string): Promise<ApiResponse<any>> => {
    const response = await apiClient.get(`/anonymous/${key}/data-summary`)
    return response.data
  },

  // Anonymous Cleanup & Maintenance
  cleanupExpiredAnonymous: async (): Promise<ApiResponse<any>> => {
    const response = await apiClient.post("/anonymous/cleanup")
    return response.data
  },

  getAnonymousCleanupStats: async (): Promise<ApiResponse<any>> => {
    const response = await apiClient.get("/anonymous/cleanup/stats")
    return response.data
  },
}