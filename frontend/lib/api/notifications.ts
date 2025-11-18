import { apiClient } from "../api-client"
import type { ApiResponse, PaginatedResponse } from "@/types"

export const notificationsApi = {
  // Get all notifications
  getNotifications: async (filters?: any): Promise<PaginatedResponse<any>> => {
    const response = await apiClient.get("/notifications", { params: filters })
    return response.data
  },

  // Get my notifications
  getMyNotifications: async (filters?: any): Promise<PaginatedResponse<any>> => {
    const response = await apiClient.get("/notifications/my-notifications", { params: filters })
    return response.data
  },

  // Get notification by ID
  getNotification: async (id: string): Promise<ApiResponse<any>> => {
    const response = await apiClient.get(`/notifications/${id}`)
    return response.data
  },

  // Send a notification (admin/organizer)
  sendNotification: async (data: {
    type: string;
    title: string;
    message: string;
    recipients?: string[];
    recipientType?: string;
    scheduledAt?: string;
    metadata?: any;
  }): Promise<ApiResponse<any>> => {
    const response = await apiClient.post("/notifications", data)
    return response.data
  },

  // Send bulk notifications
  sendBulkNotifications: async (data: {
    notifications: Array<{
      type: string;
      title: string;
      message: string;
      recipients: string[];
      metadata?: any;
    }>;
    scheduledAt?: string;
  }): Promise<ApiResponse<any>> => {
    const response = await apiClient.post("/notifications/bulk", data)
    return response.data
  },

  // Mark notification as read
  markAsRead: async (id: string): Promise<ApiResponse<any>> => {
    const response = await apiClient.post(`/notifications/${id}/read`)
    return response.data
  },

  // Mark notification as unread
  markAsUnread: async (id: string): Promise<ApiResponse<any>> => {
    const response = await apiClient.post(`/notifications/${id}/unread`)
    return response.data
  },

  // Mark all notifications as read
  markAllAsRead: async (): Promise<ApiResponse<any>> => {
    const response = await apiClient.post("/notifications/mark-all-read")
    return response.data
  },

  // Delete notification
  deleteNotification: async (id: string): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete(`/notifications/${id}`)
    return response.data
  },

  // Delete multiple notifications
  deleteNotifications: async (ids: string[]): Promise<ApiResponse<any>> => {
    const response = await apiClient.post("/notifications/bulk-delete", { ids })
    return response.data
  },

  // Get unread count
  getUnreadCount: async (): Promise<ApiResponse<{ count: number }>> => {
    const response = await apiClient.get("/notifications/unread-count")
    return response.data
  },

  // Get notification preferences
  getNotificationPreferences: async (): Promise<ApiResponse<any>> => {
    const response = await apiClient.get("/notifications/preferences")
    return response.data
  },

  // Update notification preferences
  updateNotificationPreferences: async (preferences: any): Promise<ApiResponse<any>> => {
    const response = await apiClient.put("/notifications/preferences", preferences)
    return response.data
  },

  // Subscribe to notification type
  subscribe: async (type: string, channel?: string): Promise<ApiResponse<any>> => {
    const response = await apiClient.post("/notifications/subscribe", { type, channel })
    return response.data
  },

  // Unsubscribe from notification type
  unsubscribe: async (type: string, channel?: string): Promise<ApiResponse<any>> => {
    const response = await apiClient.post("/notifications/unsubscribe", { type, channel })
    return response.data
  },

  // Get notification templates
  getNotificationTemplates: async (type?: string): Promise<ApiResponse<any[]>> => {
    const params = type ? { type } : {}
    const response = await apiClient.get("/notifications/templates", { params })
    return response.data
  },

  // Create notification template
  createNotificationTemplate: async (data: {
    name: string;
    type: string;
    subject: string;
    body: string;
    variables?: string[];
    isActive?: boolean;
  }): Promise<ApiResponse<any>> => {
    const response = await apiClient.post("/notifications/templates", data)
    return response.data
  },

  // Update notification template
  updateNotificationTemplate: async (id: string, data: any): Promise<ApiResponse<any>> => {
    const response = await apiClient.put(`/notifications/templates/${id}`, data)
    return response.data
  },

  // Delete notification template
  deleteNotificationTemplate: async (id: string): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete(`/notifications/templates/${id}`)
    return response.data
  },

  // Get notification stats
  getNotificationStats: async (filters?: any): Promise<ApiResponse<any>> => {
    const response = await apiClient.get("/notifications/stats", { params: filters })
    return response.data
  },

  // Get all notification stats (admin)
  getAllNotificationStats: async (filters?: any): Promise<ApiResponse<any>> => {
    const response = await apiClient.get("/notifications/stats/all", { params: filters })
    return response.data
  },

  // Get notification analytics
  getNotificationAnalytics: async (filters?: any): Promise<ApiResponse<any>> => {
    const response = await apiClient.get("/notifications/analytics", { params: filters })
    return response.data
  },

  // Schedule notification
  scheduleNotification: async (data: {
    type: string;
    title: string;
    message: string;
    recipients: string[];
    scheduledAt: string;
    metadata?: any;
  }): Promise<ApiResponse<any>> => {
    const response = await apiClient.post("/notifications/schedule", data)
    return response.data
  },

  // Cancel scheduled notification
  cancelScheduledNotification: async (id: string): Promise<ApiResponse<any>> => {
    const response = await apiClient.post(`/notifications/${id}/cancel`)
    return response.data
  },

  // Get scheduled notifications
  getScheduledNotifications: async (filters?: any): Promise<PaginatedResponse<any>> => {
    const response = await apiClient.get("/notifications/scheduled", { params: filters })
    return response.data
  },

  // Test notification
  testNotification: async (data: {
    type: string;
    title: string;
    message: string;
    recipient: string;
  }): Promise<ApiResponse<any>> => {
    const response = await apiClient.post("/notifications/test", data)
    return response.data
  },

  // Export notifications
  exportNotifications: async (filters?: any, format: string = 'csv'): Promise<any> => {
    const response = await apiClient.get("/notifications/export", {
      params: { ...filters, format },
      responseType: 'blob'
    })
    return response.data
  },

  // Real-time notifications (WebSocket connection helpers)
  connectToNotifications: async (): Promise<ApiResponse<{ token: string; endpoint: string }>> => {
    const response = await apiClient.post("/notifications/connect")
    return response.data
  },

  disconnectFromNotifications: async (): Promise<ApiResponse<any>> => {
    const response = await apiClient.post("/notifications/disconnect")
    return response.data
  },
}