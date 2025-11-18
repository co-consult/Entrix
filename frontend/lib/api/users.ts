import { apiClient } from "../api-client"
import type { User, ApiResponse, PaginatedResponse } from "@/types"

export const usersApi = {
  // Get current user profile
  getCurrentUser: async (): Promise<ApiResponse<User>> => {
    const response = await apiClient.get("/users/me")
    return response.data
  },

  // Update my profile
  updateMyProfile: async (data: Partial<User>): Promise<ApiResponse<User>> => {
    const response = await apiClient.put("/users/me/profile", data)
    return response.data
  },

  // Update my privacy settings
  updateMyPrivacy: async (data: any): Promise<ApiResponse<User>> => {
    const response = await apiClient.put("/users/me/privacy", data)
    return response.data
  },

  // Update my preferences
  updateMyPreferences: async (data: any): Promise<ApiResponse<User>> => {
    const response = await apiClient.put("/users/me/preferences", data)
    return response.data
  },

  // Get all users (admin only)
  getUsers: async (page = 1, limit = 10, filters?: any): Promise<PaginatedResponse<User>> => {
    const response = await apiClient.get("/users", {
      params: { page, limit, ...filters },
    })
    return response.data
  },

  // Get user stats
  getUserStats: async (filters?: any): Promise<ApiResponse<any>> => {
    const response = await apiClient.get("/users/stats", { params: filters })
    return response.data
  },

  // Get user by ID
  getUser: async (id: string): Promise<ApiResponse<User>> => {
    const response = await apiClient.get(`/users/${id}`)
    return response.data
  },

  // Update user (admin only)
  updateUser: async (id: string, data: Partial<User>): Promise<ApiResponse<User>> => {
    const response = await apiClient.put(`/users/${id}`, data)
    return response.data
  },

  // Delete user (admin only)
  deleteUser: async (id: string): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete(`/users/${id}`)
    return response.data
  },

  // Activate user (admin only)
  activateUser: async (id: string): Promise<ApiResponse<User>> => {
    const response = await apiClient.post(`/users/${id}/activate`)
    return response.data
  },

  // Deactivate user (admin only)
  deactivateUser: async (id: string): Promise<ApiResponse<User>> => {
    const response = await apiClient.post(`/users/${id}/deactivate`)
    return response.data
  },

  // Verify user (admin only)
  verifyUser: async (id: string): Promise<ApiResponse<User>> => {
    const response = await apiClient.post(`/users/${id}/verify`)
    return response.data
  },

  // Get user groups
  getUserGroups: async (id: string): Promise<ApiResponse<any[]>> => {
    const response = await apiClient.get(`/users/${id}/groups`)
    return response.data
  },

  // Get user roles
  getUserRoles: async (id: string): Promise<ApiResponse<any[]>> => {
    const response = await apiClient.get(`/users/${id}/roles`)
    return response.data
  },

  // Change user password
  changeUserPassword: async (id: string, oldPassword: string, newPassword: string): Promise<ApiResponse<User>> => {
    const response = await apiClient.put(`/users/${id}/password`, { oldPassword, newPassword })
    return response.data
  },

  // Create user (admin only)
  createUser: async (data: Partial<User>): Promise<ApiResponse<User>> => {
    const response = await apiClient.post("/users", data);
    return response.data;
  },

  // Export users
  exportUsers: async (format: string, filters?: any): Promise<any> => {
    const response = await apiClient.get(`/users/export`, {
      params: { format, ...filters },
      responseType: 'blob'
    });
    return response.data;
  },

  // Get user by email
  getUserByEmail: async (email: string): Promise<User | null> => {
    try {
      const response = await apiClient.get(`/users/email/${encodeURIComponent(email)}`);
      return response.data;
    } catch (err) {
      return null;
    }
  },

  // Fetch all roles
  getAllRoles: async (): Promise<any[]> => {
    const response = await apiClient.get("/users/roles");
    return response.data.data;
  },
}
