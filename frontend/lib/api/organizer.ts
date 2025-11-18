import { apiClient } from "../api-client"
import type { ApiResponse } from "@/types"

export const organizerApi = {
  // Get my organizer profile
  getMyOrganizer: async (): Promise<ApiResponse<any>> => {
    const response = await apiClient.get("/organizer/me")
    return response.data
  },

  // Update my organizer profile
  updateMyOrganizer: async (data: any): Promise<ApiResponse<any>> => {
    const response = await apiClient.put("/organizer/me", data)
    return response.data
  },

  // Get organizer by ID
  getOrganizer: async (id: string): Promise<ApiResponse<any>> => {
    const response = await apiClient.get(`/organizers/${id}`)
    return response.data
  },

  // Get all organizers
  getOrganizers: async (filters?: any): Promise<ApiResponse<any[]>> => {
    try {
      const response = await apiClient.get("/organizers", { params: filters })
      return response.data
    } catch (error) {
      console.error("Failed to fetch organizers:", error);
      // Return empty array as fallback
      return { data: [], success: false, message: "Failed to fetch organizers" }
    }
  },

  // Create organizer
  createOrganizer: async (data: any): Promise<ApiResponse<any>> => {
    const response = await apiClient.post("/organizers", data)
    return response.data
  },

  // Update organizer
  updateOrganizer: async (id: string, data: any): Promise<ApiResponse<any>> => {
    const response = await apiClient.put(`/organizers/${id}`, data)
    return response.data
  },

  // Delete organizer
  deleteOrganizer: async (id: string): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete(`/organizers/${id}`)
    return response.data
  },

  // Get organizer stats
  getOrganizerStats: async (id: string): Promise<ApiResponse<any>> => {
    const response = await apiClient.get(`/organizers/${id}/comprehensive-stats`)
    return response.data
  },

  // Get my organizer stats
  getMyOrganizerStats: async (): Promise<ApiResponse<any>> => {
    const response = await apiClient.get("/organizer/me/stats")
    return response.data
  },

  // Get organizer events
  getOrganizerEvents: async (id: string, filters?: any): Promise<ApiResponse<any[]>> => {
    const response = await apiClient.get(`/organizers/${id}/events`, { params: filters })
    return response.data
  },

  // Get my organizer events
  getMyOrganizerEvents: async (filters?: any): Promise<ApiResponse<any[]>> => {
    const response = await apiClient.get("/organizer/me/events", { params: filters })
    return response.data
  },

  // Get organizer venues
  getOrganizerVenues: async (id: string): Promise<ApiResponse<any[]>> => {
    const response = await apiClient.get(`/organizers/${id}/venues`)
    return response.data
  },

  // Get my organizer venues
  getMyOrganizerVenues: async (): Promise<ApiResponse<any[]>> => {
    const response = await apiClient.get("/organizer/me/venues")
    return response.data
  },

  // Organizer verification
  requestVerification: async (data: any): Promise<ApiResponse<any>> => {
    const response = await apiClient.post("/organizer/me/verify", data)
    return response.data
  },

  getVerificationStatus: async (): Promise<ApiResponse<any>> => {
    const response = await apiClient.get("/organizer/me/verification-status")
    return response.data
  },

  // Organizer settings
  getOrganizerSettings: async (): Promise<ApiResponse<any>> => {
    const response = await apiClient.get("/organizer/me/settings")
    return response.data
  },

  updateOrganizerSettings: async (settings: any): Promise<ApiResponse<any>> => {
    const response = await apiClient.put("/organizer/me/settings", settings)
    return response.data
  },

  // Organizer team management
  getTeamMembers: async (): Promise<ApiResponse<any[]>> => {
    const response = await apiClient.get("/organizer/me/team")
    return response.data
  },

  inviteTeamMember: async (data: {
    email: string;
    role: string;
    permissions?: string[];
  }): Promise<ApiResponse<any>> => {
    const response = await apiClient.post("/organizer/me/team/invite", data)
    return response.data
  },

  updateTeamMember: async (memberId: string, data: any): Promise<ApiResponse<any>> => {
    const response = await apiClient.put(`/organizer/me/team/${memberId}`, data)
    return response.data
  },

  removeTeamMember: async (memberId: string): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete(`/organizer/me/team/${memberId}`)
    return response.data
  },
}