import { apiClient } from "../api-client"
import type { ApiResponse, PaginatedResponse } from "@/types"

export const groupsApi = {
  // Basic Group Operations
  getGroups: async (filters?: any): Promise<PaginatedResponse<any>> => {
    const response = await apiClient.get("/groups", { params: filters })
    return response.data
  },

  getMyGroups: async (filters?: any): Promise<ApiResponse<any[]>> => {
    const response = await apiClient.get("/groups/my-groups", { params: filters })
    return response.data
  },

  getPublicGroups: async (filters?: any): Promise<ApiResponse<any[]>> => {
    const response = await apiClient.get("/groups/public", { params: filters })
    return response.data
  },

  getGroup: async (id: string): Promise<ApiResponse<any>> => {
    const response = await apiClient.get(`/groups/${id}`)
    return response.data
  },

  getGroupByCode: async (code: string): Promise<ApiResponse<any>> => {
    const response = await apiClient.get(`/groups/code/${code}`)
    return response.data
  },

  getGroupStats: async (id: string): Promise<ApiResponse<any>> => {
    const response = await apiClient.get(`/groups/${id}/stats`)
    return response.data
  },

  createGroup: async (data: any): Promise<ApiResponse<any>> => {
    const response = await apiClient.post("/groups", data)
    return response.data
  },

  updateGroup: async (id: string, data: any): Promise<ApiResponse<any>> => {
    const response = await apiClient.put(`/groups/${id}`, data)
    return response.data
  },

  deleteGroup: async (id: string): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete(`/groups/${id}`)
    return response.data
  },

  // Member Management
  addMember: async (groupId: string, userId: string, role?: string): Promise<ApiResponse<any>> => {
    const response = await apiClient.post(`/groups/${groupId}/members`, { userId, role })
    return response.data
  },

  removeMember: async (groupId: string, userId: string): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete(`/groups/${groupId}/members/${userId}`)
    return response.data
  },

  updateMemberRole: async (groupId: string, userId: string, newRole: string): Promise<ApiResponse<any>> => {
    const response = await apiClient.put(`/groups/${groupId}/members/${userId}/role`, { newRole })
    return response.data
  },

  updateMemberPermissions: async (groupId: string, userId: string, permissions: any): Promise<ApiResponse<any>> => {
    const response = await apiClient.put(`/groups/${groupId}/members/${userId}/permissions`, { permissions })
    return response.data
  },

  // Invitations
  inviteUser: async (groupId: string, data: {
    email?: string;
    userId?: string;
    role?: string;
    message?: string;
  }): Promise<ApiResponse<any>> => {
    const response = await apiClient.post(`/groups/${groupId}/invite`, data)
    return response.data
  },

  // Permissions & Actions
  checkPermissions: async (groupId: string, userId: string, permission?: string): Promise<ApiResponse<any>> => {
    const params = permission ? { permission } : {}
    const response = await apiClient.get(`/groups/${groupId}/permissions/${userId}`, { params })
    return response.data
  },

  canPerformAction: async (groupId: string, userId: string, action: string): Promise<ApiResponse<any>> => {
    const response = await apiClient.get(`/groups/${groupId}/actions/${userId}/${action}`)
    return response.data
  },

  // Group Types & Categories
  getGroupTypes: async (): Promise<ApiResponse<any[]>> => {
    const response = await apiClient.get("/groups/types")
    return response.data
  },

  getGroupCategories: async (): Promise<ApiResponse<any[]>> => {
    const response = await apiClient.get("/groups/categories")
    return response.data
  },

  // Group Search & Discovery
  searchGroups: async (query: string, filters?: any): Promise<ApiResponse<any[]>> => {
    const response = await apiClient.get("/groups/search", { 
      params: { query, ...filters } 
    })
    return response.data
  },

  getRecommendedGroups: async (userId?: string): Promise<ApiResponse<any[]>> => {
    const params = userId ? { userId } : {}
    const response = await apiClient.get("/groups/recommended", { params })
    return response.data
  },

  // Group Activities & Events
  getGroupActivities: async (groupId: string, filters?: any): Promise<ApiResponse<any[]>> => {
    const response = await apiClient.get(`/groups/${groupId}/activities`, { params: filters })
    return response.data
  },

  getGroupEvents: async (groupId: string, filters?: any): Promise<ApiResponse<any[]>> => {
    const response = await apiClient.get(`/groups/${groupId}/events`, { params: filters })
    return response.data
  },

  // Group Settings & Configuration
  getGroupSettings: async (groupId: string): Promise<ApiResponse<any>> => {
    const response = await apiClient.get(`/groups/${groupId}/settings`)
    return response.data
  },

  updateGroupSettings: async (groupId: string, settings: any): Promise<ApiResponse<any>> => {
    const response = await apiClient.put(`/groups/${groupId}/settings`, settings)
    return response.data
  },

  // Group Moderation
  reportGroup: async (groupId: string, reason: string, details?: string): Promise<ApiResponse<any>> => {
    const response = await apiClient.post(`/groups/${groupId}/report`, { reason, details })
    return response.data
  },

  blockGroup: async (groupId: string): Promise<ApiResponse<void>> => {
    const response = await apiClient.post(`/groups/${groupId}/block`)
    return response.data
  },

  unblockGroup: async (groupId: string): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete(`/groups/${groupId}/block`)
    return response.data
  },

  // Group Analytics (for group admins)
  getGroupAnalytics: async (groupId: string, timeRange?: string): Promise<ApiResponse<any>> => {
    const params = timeRange ? { timeRange } : {}
    const response = await apiClient.get(`/groups/${groupId}/analytics`, { params })
    return response.data
  },

  getGroupMembershipTrends: async (groupId: string): Promise<ApiResponse<any>> => {
    const response = await apiClient.get(`/groups/${groupId}/membership-trends`)
    return response.data
  },

  getGroupEngagementStats: async (groupId: string): Promise<ApiResponse<any>> => {
    const response = await apiClient.get(`/groups/${groupId}/engagement`)
    return response.data
  },

  // Group Export & Import
  exportGroupData: async (groupId: string, format: string = 'json'): Promise<any> => {
    const response = await apiClient.get(`/groups/${groupId}/export`, { 
      params: { format },
      responseType: 'blob'
    })
    return response.data
  },

  exportGroupMembers: async (groupId: string, format: string = 'csv'): Promise<any> => {
    const response = await apiClient.get(`/groups/${groupId}/members/export`, { 
      params: { format },
      responseType: 'blob'
    })
    return response.data
  },
}