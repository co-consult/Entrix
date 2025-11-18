import { apiClient } from "../api-client"
import type { ApiResponse, PaginatedResponse } from "@/types"

export const webhooksApi = {
  // Get all webhooks
  getWebhooks: async (filters?: any): Promise<PaginatedResponse<any>> => {
    const response = await apiClient.get("/webhooks", { params: filters })
    return response.data
  },

  // Get webhook by ID
  getWebhook: async (id: string): Promise<ApiResponse<any>> => {
    const response = await apiClient.get(`/webhooks/${id}`)
    return response.data
  },

  // Create webhook
  createWebhook: async (data: {
    name: string;
    url: string;
    events: string[];
    secret?: string;
    isActive?: boolean;
    headers?: Record<string, string>;
    metadata?: any;
  }): Promise<ApiResponse<any>> => {
    const response = await apiClient.post("/webhooks", data)
    return response.data
  },

  // Update webhook
  updateWebhook: async (id: string, data: any): Promise<ApiResponse<any>> => {
    const response = await apiClient.put(`/webhooks/${id}`, data)
    return response.data
  },

  // Delete webhook
  deleteWebhook: async (id: string): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete(`/webhooks/${id}`)
    return response.data
  },

  // Test webhook
  testWebhook: async (id: string, data?: any): Promise<ApiResponse<any>> => {
    const response = await apiClient.post(`/webhooks/${id}/test`, data || {})
    return response.data
  },

  // Retry webhook delivery
  retryWebhook: async (id: string): Promise<ApiResponse<any>> => {
    const response = await apiClient.post(`/webhooks/${id}/retry`)
    return response.data
  },

  // Resend webhook
  resendWebhook: async (id: string): Promise<ApiResponse<any>> => {
    const response = await apiClient.post(`/webhooks/${id}/send`)
    return response.data
  },

  // Enable webhook
  enableWebhook: async (id: string): Promise<ApiResponse<any>> => {
    const response = await apiClient.post(`/webhooks/${id}/enable`)
    return response.data
  },

  // Disable webhook
  disableWebhook: async (id: string): Promise<ApiResponse<any>> => {
    const response = await apiClient.post(`/webhooks/${id}/disable`)
    return response.data
  },

  // Get webhook deliveries
  getWebhookDeliveries: async (id: string, filters?: any): Promise<PaginatedResponse<any>> => {
    const response = await apiClient.get(`/webhooks/${id}/deliveries`, { params: filters })
    return response.data
  },

  // Get webhook delivery
  getWebhookDelivery: async (webhookId: string, deliveryId: string): Promise<ApiResponse<any>> => {
    const response = await apiClient.get(`/webhooks/${webhookId}/deliveries/${deliveryId}`)
    return response.data
  },

  // Retry webhook delivery
  retryWebhookDelivery: async (webhookId: string, deliveryId: string): Promise<ApiResponse<any>> => {
    const response = await apiClient.post(`/webhooks/${webhookId}/deliveries/${deliveryId}/retry`)
    return response.data
  },

  // Get webhook stats
  getWebhookStats: async (filters?: any): Promise<ApiResponse<any>> => {
    const response = await apiClient.get("/webhooks/stats", { params: filters })
    return response.data
  },

  // Get webhook analytics
  getWebhookAnalytics: async (id: string, timeRange?: string): Promise<ApiResponse<any>> => {
    const params = timeRange ? { timeRange } : {}
    const response = await apiClient.get(`/webhooks/${id}/analytics`, { params })
    return response.data
  },

  // Get available webhook events
  getWebhookEvents: async (): Promise<ApiResponse<any[]>> => {
    const response = await apiClient.get("/webhooks/events")
    return response.data
  },

  // Get webhook event types
  getWebhookEventTypes: async (): Promise<ApiResponse<any[]>> => {
    const response = await apiClient.get("/webhooks/event-types")
    return response.data
  },

  // Validate webhook URL
  validateWebhookUrl: async (url: string): Promise<ApiResponse<any>> => {
    const response = await apiClient.post("/webhooks/validate-url", { url })
    return response.data
  },

  // Generate webhook secret
  generateWebhookSecret: async (): Promise<ApiResponse<{ secret: string }>> => {
    const response = await apiClient.post("/webhooks/generate-secret")
    return response.data
  },

  // Rotate webhook secret
  rotateWebhookSecret: async (id: string): Promise<ApiResponse<any>> => {
    const response = await apiClient.post(`/webhooks/${id}/rotate-secret`)
    return response.data
  },

  // Get webhook logs
  getWebhookLogs: async (id: string, filters?: any): Promise<PaginatedResponse<any>> => {
    const response = await apiClient.get(`/webhooks/${id}/logs`, { params: filters })
    return response.data
  },

  // Clear webhook logs
  clearWebhookLogs: async (id: string): Promise<ApiResponse<any>> => {
    const response = await apiClient.delete(`/webhooks/${id}/logs`)
    return response.data
  },

  // Bulk webhook operations
  bulkEnableWebhooks: async (ids: string[]): Promise<ApiResponse<any>> => {
    const response = await apiClient.post("/webhooks/bulk-enable", { ids })
    return response.data
  },

  bulkDisableWebhooks: async (ids: string[]): Promise<ApiResponse<any>> => {
    const response = await apiClient.post("/webhooks/bulk-disable", { ids })
    return response.data
  },

  bulkDeleteWebhooks: async (ids: string[]): Promise<ApiResponse<any>> => {
    const response = await apiClient.post("/webhooks/bulk-delete", { ids })
    return response.data
  },

  // Webhook templates
  getWebhookTemplates: async (): Promise<ApiResponse<any[]>> => {
    const response = await apiClient.get("/webhooks/templates")
    return response.data
  },

  createWebhookFromTemplate: async (templateId: string, data: any): Promise<ApiResponse<any>> => {
    const response = await apiClient.post(`/webhooks/templates/${templateId}/create`, data)
    return response.data
  },

  // Export webhooks
  exportWebhooks: async (filters?: any, format: string = 'json'): Promise<any> => {
    const response = await apiClient.get("/webhooks/export", {
      params: { ...filters, format },
      responseType: 'blob'
    })
    return response.data
  },

  // Import webhooks
  importWebhooks: async (file: File): Promise<ApiResponse<any>> => {
    const formData = new FormData()
    formData.append('file', file)
    const response = await apiClient.post("/webhooks/import", formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return response.data
  },

  // Webhook health check
  healthCheckWebhook: async (id: string): Promise<ApiResponse<any>> => {
    const response = await apiClient.get(`/webhooks/${id}/health`)
    return response.data
  },

  // Get webhook performance metrics
  getWebhookMetrics: async (id: string, timeRange?: string): Promise<ApiResponse<any>> => {
    const params = timeRange ? { timeRange } : {}
    const response = await apiClient.get(`/webhooks/${id}/metrics`, { params })
    return response.data
  },
}