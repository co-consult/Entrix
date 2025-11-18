import { apiClient } from "../api-client"
import type { ApiResponse, PaginatedResponse } from "@/types"

export const profilesApi = {
  // Profile Management
  createProfile: async (data: any): Promise<ApiResponse<any>> => {
    const response = await apiClient.post("/profiles", data)
    return response.data
  },

  getProfileByUserId: async (userId: string): Promise<ApiResponse<any>> => {
    const response = await apiClient.get(`/profiles/user/${userId}`)
    return response.data
  },

  getProfileCompletion: async (userId: string): Promise<ApiResponse<any>> => {
    const response = await apiClient.get(`/profiles/user/${userId}/completion`)
    return response.data
  },

  updateProfilePreferences: async (userId: string, preferences: any): Promise<ApiResponse<any>> => {
    const response = await apiClient.put(`/profiles/user/${userId}/preferences`, preferences)
    return response.data
  },

  deleteProfile: async (userId: string): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete(`/profiles/user/${userId}`)
    return response.data
  },

  getAllProfiles: async (filters?: any): Promise<PaginatedResponse<any>> => {
    const response = await apiClient.get("/profiles", { params: filters })
    return response.data
  },

  // Profile Visibility & Privacy
  updateProfileVisibility: async (userId: string, visibility: any): Promise<ApiResponse<any>> => {
    const response = await apiClient.put(`/profiles/user/${userId}/visibility`, visibility)
    return response.data
  },

  getProfilePrivacySettings: async (userId: string): Promise<ApiResponse<any>> => {
    const response = await apiClient.get(`/profiles/user/${userId}/privacy`)
    return response.data
  },

  updateProfilePrivacySettings: async (userId: string, privacy: any): Promise<ApiResponse<any>> => {
    const response = await apiClient.put(`/profiles/user/${userId}/privacy`, privacy)
    return response.data
  },

  // Profile Verification
  requestProfileVerification: async (userId: string, data: any): Promise<ApiResponse<any>> => {
    const response = await apiClient.post(`/profiles/user/${userId}/verify`, data)
    return response.data
  },

  getProfileVerificationStatus: async (userId: string): Promise<ApiResponse<any>> => {
    const response = await apiClient.get(`/profiles/user/${userId}/verification-status`)
    return response.data
  },

  // Profile Media & Assets
  uploadProfileImage: async (userId: string, file: File): Promise<ApiResponse<any>> => {
    const formData = new FormData()
    formData.append('image', file)
    const response = await apiClient.post(`/profiles/user/${userId}/image`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return response.data
  },

  deleteProfileImage: async (userId: string): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete(`/profiles/user/${userId}/image`)
    return response.data
  },

  uploadCoverImage: async (userId: string, file: File): Promise<ApiResponse<any>> => {
    const formData = new FormData()
    formData.append('cover', file)
    const response = await apiClient.post(`/profiles/user/${userId}/cover`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return response.data
  },

  deleteCoverImage: async (userId: string): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete(`/profiles/user/${userId}/cover`)
    return response.data
  },

  // Profile Social Links
  addSocialLink: async (userId: string, link: any): Promise<ApiResponse<any>> => {
    const response = await apiClient.post(`/profiles/user/${userId}/social-links`, link)
    return response.data
  },

  updateSocialLink: async (userId: string, linkId: string, link: any): Promise<ApiResponse<any>> => {
    const response = await apiClient.put(`/profiles/user/${userId}/social-links/${linkId}`, link)
    return response.data
  },

  deleteSocialLink: async (userId: string, linkId: string): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete(`/profiles/user/${userId}/social-links/${linkId}`)
    return response.data
  },

  getSocialLinks: async (userId: string): Promise<ApiResponse<any[]>> => {
    const response = await apiClient.get(`/profiles/user/${userId}/social-links`)
    return response.data
  },

  // Profile Skills & Interests
  addSkill: async (userId: string, skill: any): Promise<ApiResponse<any>> => {
    const response = await apiClient.post(`/profiles/user/${userId}/skills`, skill)
    return response.data
  },

  removeSkill: async (userId: string, skillId: string): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete(`/profiles/user/${userId}/skills/${skillId}`)
    return response.data
  },

  getSkills: async (userId: string): Promise<ApiResponse<any[]>> => {
    const response = await apiClient.get(`/profiles/user/${userId}/skills`)
    return response.data
  },

  addInterest: async (userId: string, interest: any): Promise<ApiResponse<any>> => {
    const response = await apiClient.post(`/profiles/user/${userId}/interests`, interest)
    return response.data
  },

  removeInterest: async (userId: string, interestId: string): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete(`/profiles/user/${userId}/interests/${interestId}`)
    return response.data
  },

  getInterests: async (userId: string): Promise<ApiResponse<any[]>> => {
    const response = await apiClient.get(`/profiles/user/${userId}/interests`)
    return response.data
  },

  // Profile Analytics
  getProfileViews: async (userId: string, timeRange?: string): Promise<ApiResponse<any>> => {
    const params = timeRange ? { timeRange } : {}
    const response = await apiClient.get(`/profiles/user/${userId}/views`, { params })
    return response.data
  },

  getProfileEngagement: async (userId: string): Promise<ApiResponse<any>> => {
    const response = await apiClient.get(`/profiles/user/${userId}/engagement`)
    return response.data
  },

  // Profile Search & Discovery
  searchProfiles: async (query: string, filters?: any): Promise<ApiResponse<any[]>> => {
    const response = await apiClient.get("/profiles/search", { 
      params: { query, ...filters } 
    })
    return response.data
  },

  getRecommendedProfiles: async (userId?: string): Promise<ApiResponse<any[]>> => {
    const params = userId ? { userId } : {}
    const response = await apiClient.get("/profiles/recommended", { params })
    return response.data
  },

  getSimilarProfiles: async (userId: string): Promise<ApiResponse<any[]>> => {
    const response = await apiClient.get(`/profiles/user/${userId}/similar`)
    return response.data
  },

  // Profile Export
  exportProfile: async (userId: string, format: string = 'json'): Promise<any> => {
    const response = await apiClient.get(`/profiles/user/${userId}/export`, { 
      params: { format },
      responseType: 'blob'
    })
    return response.data
  },

  // Profile Statistics
  getProfileStats: async (userId: string): Promise<ApiResponse<any>> => {
    const response = await apiClient.get(`/profiles/user/${userId}/stats`)
    return response.data
  },

  getGlobalProfileStats: async (): Promise<ApiResponse<any>> => {
    const response = await apiClient.get("/profiles/stats")
    return response.data
  },
}