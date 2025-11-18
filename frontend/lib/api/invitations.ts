import { apiClient } from "../api-client"
import type { ApiResponse } from "@/types"

export const invitationsApi = {
  // Basic Invitation Operations
  createInvitation: async (data: {
    email?: string;
    userId?: string;
    type: string;
    entityId?: string;
    role?: string;
    message?: string;
    expiresAt?: string;
  }): Promise<ApiResponse<any>> => {
    const response = await apiClient.post("/invitations", data)
    return response.data
  },

  createBulkInvitations: async (data: {
    invitations: Array<{
      email?: string;
      userId?: string;
      type: string;
      entityId?: string;
      role?: string;
    }>;
    message?: string;
    expiresAt?: string;
  }): Promise<ApiResponse<any>> => {
    const response = await apiClient.post("/invitations/bulk", data)
    return response.data
  },

  getInvitationByToken: async (token: string): Promise<ApiResponse<any>> => {
    const response = await apiClient.get(`/invitations/token/${token}`)
    return response.data
  },

  acceptInvitation: async (token: string, data?: any): Promise<ApiResponse<any>> => {
    const response = await apiClient.post(`/invitations/accept/${token}`, data || {})
    return response.data
  },

  declineInvitation: async (id: string, reason?: string): Promise<ApiResponse<any>> => {
    const response = await apiClient.post(`/invitations/decline/${id}`, { reason })
    return response.data
  },

  // Invitation Management
  getMyInvitations: async (filters?: {
    status?: string;
    type?: string;
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<any[]>> => {
    const response = await apiClient.get("/invitations/my-invitations", { params: filters })
    return response.data
  },

  getSentInvitations: async (filters?: {
    status?: string;
    type?: string;
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<any[]>> => {
    const response = await apiClient.get("/invitations/sent", { params: filters })
    return response.data
  },

  getReceivedInvitations: async (filters?: {
    status?: string;
    type?: string;
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<any[]>> => {
    const response = await apiClient.get("/invitations/received", { params: filters })
    return response.data
  },

  getInvitation: async (id: string): Promise<ApiResponse<any>> => {
    const response = await apiClient.get(`/invitations/${id}`)
    return response.data
  },

  updateInvitation: async (id: string, data: any): Promise<ApiResponse<any>> => {
    const response = await apiClient.put(`/invitations/${id}`, data)
    return response.data
  },

  deleteInvitation: async (id: string): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete(`/invitations/${id}`)
    return response.data
  },

  // Invitation Actions
  resendInvitation: async (id: string): Promise<ApiResponse<any>> => {
    const response = await apiClient.post(`/invitations/${id}/resend`)
    return response.data
  },

  cancelInvitation: async (id: string, reason?: string): Promise<ApiResponse<any>> => {
    const response = await apiClient.post(`/invitations/${id}/cancel`, { reason })
    return response.data
  },

  expireInvitation: async (id: string): Promise<ApiResponse<any>> => {
    const response = await apiClient.post(`/invitations/${id}/expire`)
    return response.data
  },

  // Group Invitations
  inviteToGroup: async (groupId: string, data: {
    email?: string;
    userId?: string;
    role?: string;
    message?: string;
  }): Promise<ApiResponse<any>> => {
    const response = await apiClient.post(`/invitations/groups/${groupId}`, data)
    return response.data
  },

  getGroupInvitations: async (groupId: string, filters?: any): Promise<ApiResponse<any[]>> => {
    const response = await apiClient.get(`/invitations/groups/${groupId}`, { params: filters })
    return response.data
  },

  // Event Invitations
  inviteToEvent: async (eventId: string, data: {
    email?: string;
    userId?: string;
    role?: string;
    message?: string;
  }): Promise<ApiResponse<any>> => {
    const response = await apiClient.post(`/invitations/events/${eventId}`, data)
    return response.data
  },

  getEventInvitations: async (eventId: string, filters?: any): Promise<ApiResponse<any[]>> => {
    const response = await apiClient.get(`/invitations/events/${eventId}`, { params: filters })
    return response.data
  },

  // Organization Invitations
  inviteToOrganization: async (orgId: string, data: {
    email?: string;
    userId?: string;
    role?: string;
    message?: string;
  }): Promise<ApiResponse<any>> => {
    const response = await apiClient.post(`/invitations/organizations/${orgId}`, data)
    return response.data
  },

  getOrganizationInvitations: async (orgId: string, filters?: any): Promise<ApiResponse<any[]>> => {
    const response = await apiClient.get(`/invitations/organizations/${orgId}`, { params: filters })
    return response.data
  },

  // Invitation Templates
  getInvitationTemplates: async (type?: string): Promise<ApiResponse<any[]>> => {
    const params = type ? { type } : {}
    const response = await apiClient.get("/invitations/templates", { params })
    return response.data
  },

  createInvitationTemplate: async (data: {
    name: string;
    type: string;
    subject: string;
    body: string;
    variables?: string[];
  }): Promise<ApiResponse<any>> => {
    const response = await apiClient.post("/invitations/templates", data)
    return response.data
  },

  updateInvitationTemplate: async (id: string, data: any): Promise<ApiResponse<any>> => {
    const response = await apiClient.put(`/invitations/templates/${id}`, data)
    return response.data
  },

  deleteInvitationTemplate: async (id: string): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete(`/invitations/templates/${id}`)
    return response.data
  },

  // Invitation Statistics
  getInvitationStats: async (filters?: {
    type?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<ApiResponse<any>> => {
    const response = await apiClient.get("/invitations/stats", { params: filters })
    return response.data
  },

  getMyInvitationStats: async (): Promise<ApiResponse<any>> => {
    const response = await apiClient.get("/invitations/my-stats")
    return response.data
  },

  // Invitation Settings
  getInvitationSettings: async (): Promise<ApiResponse<any>> => {
    const response = await apiClient.get("/invitations/settings")
    return response.data
  },

  updateInvitationSettings: async (settings: any): Promise<ApiResponse<any>> => {
    const response = await apiClient.put("/invitations/settings", settings)
    return response.data
  },

  // Invitation Validation
  validateInvitationToken: async (token: string): Promise<ApiResponse<any>> => {
    const response = await apiClient.post("/invitations/validate-token", { token })
    return response.data
  },

  checkInvitationEligibility: async (data: {
    email?: string;
    userId?: string;
    type: string;
    entityId?: string;
  }): Promise<ApiResponse<any>> => {
    const response = await apiClient.post("/invitations/check-eligibility", data)
    return response.data
  },

  // Invitation Export
  exportInvitations: async (filters?: any, format: string = 'csv'): Promise<any> => {
    const response = await apiClient.get("/invitations/export", { 
      params: { ...filters, format },
      responseType: 'blob'
    })
    return response.data
  },
}