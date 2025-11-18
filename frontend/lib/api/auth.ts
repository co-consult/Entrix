import { apiClient } from "../api-client"
import type { ApiResponse } from "@/types"

export const authApi = {
  // Basic Auth
  login: async (credentials: { 
    email: string; 
    password: string; 
    rememberMe?: boolean; 
    deviceFingerprint?: string 
  }): Promise<ApiResponse<any>> => {
    const response = await apiClient.post("/auth/login", credentials)
    return response.data
  },

  register: async (userData: any): Promise<ApiResponse<any>> => {
    const response = await apiClient.post("/auth/register", userData)
    return response.data
  },

  logout: async (allDevices?: boolean): Promise<ApiResponse<any>> => {
    const response = await apiClient.post("/auth/logout", { allDevices })
    return response.data
  },

  refreshToken: async (refreshToken: string): Promise<ApiResponse<any>> => {
    const response = await apiClient.post("/auth/refresh", { refreshToken })
    return response.data
  },

  // Password Management
  forgotPassword: async (email: string): Promise<ApiResponse<any>> => {
    const response = await apiClient.post("/auth/forgot-password", { email })
    return response.data
  },

  resetPassword: async (token: string, password: string): Promise<ApiResponse<any>> => {
    const response = await apiClient.post("/auth/reset-password", { token, password })
    return response.data
  },

  changePassword: async (oldPassword: string, newPassword: string): Promise<ApiResponse<any>> => {
    const response = await apiClient.put("/auth/change-password", { oldPassword, newPassword })
    return response.data
  },

  validatePassword: async (password: string): Promise<ApiResponse<any>> => {
    const response = await apiClient.post("/auth/validate-password", { password })
    return response.data
  },

  // Email Verification
  verifyEmail: async (token: string): Promise<ApiResponse<any>> => {
    const response = await apiClient.get(`/auth/verify-email?token=${encodeURIComponent(token)}`)
    return response.data
  },

  resendVerificationEmail: async (): Promise<ApiResponse<any>> => {
    const response = await apiClient.post("/auth/resend-verification")
    return response.data
  },

  getVerificationStatus: async (): Promise<ApiResponse<any>> => {
    const response = await apiClient.get("/auth/verification-status")
    return response.data
  },

  forceVerifyEmail: async (): Promise<ApiResponse<any>> => {
    const response = await apiClient.post("/auth/force-verify-email")
    return response.data
  },

  // Session Management
  getCurrentSession: async (): Promise<ApiResponse<any>> => {
    const response = await apiClient.get("/auth/session")
    return response.data
  },

  getAllSessions: async (): Promise<ApiResponse<any[]>> => {
    const response = await apiClient.get("/auth/sessions")
    return response.data
  },

  deleteSession: async (sessionId: string): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete(`/auth/sessions/${sessionId}`)
    return response.data
  },

  // MFA Management
  getMfaProviders: async (): Promise<ApiResponse<any[]>> => {
    const response = await apiClient.get("/auth/mfa/providers")
    return response.data
  },

  getMfaStatus: async (): Promise<ApiResponse<any>> => {
    const response = await apiClient.get("/auth/mfa/status")
    return response.data
  },

  setupMfa: async (data: { provider: string; phoneNumber?: string }): Promise<ApiResponse<any>> => {
    const response = await apiClient.post("/auth/mfa/setup", data)
    return response.data
  },

  verifyMfa: async (data: { 
    provider: string; 
    code: string; 
    challengeToken?: string 
  }): Promise<ApiResponse<any>> => {
    const response = await apiClient.post("/auth/mfa/verify", data)
    return response.data
  },

  toggleMfa: async (provider: string, enabled: boolean): Promise<ApiResponse<any>> => {
    const response = await apiClient.put(`/auth/mfa/${provider}/toggle`, { enabled })
    return response.data
  },

  deleteMfa: async (provider: string): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete(`/auth/mfa/${provider}`)
    return response.data
  },

  regenerateBackupCodes: async (): Promise<ApiResponse<any>> => {
    const response = await apiClient.post("/auth/mfa/backup-codes/regenerate")
    return response.data
  },

  getTrustedDevices: async (): Promise<ApiResponse<any[]>> => {
    const response = await apiClient.get("/auth/mfa/trusted-devices")
    return response.data
  },

  deleteTrustedDevice: async (deviceId: string): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete(`/auth/mfa/trusted-devices/${deviceId}`)
    return response.data
  },

  // Security & Audit
  getSecurityEvents: async (filters?: any): Promise<ApiResponse<any[]>> => {
    const response = await apiClient.get("/auth/security-events", { params: filters })
    return response.data
  },

  verifyDevice: async (data: any): Promise<ApiResponse<any>> => {
    const response = await apiClient.post("/auth/verify-device", data)
    return response.data
  },

  getSecurityTrustedDevices: async (): Promise<ApiResponse<any[]>> => {
    const response = await apiClient.get("/auth/trusted-devices")
    return response.data
  },

  deleteSecurityTrustedDevice: async (deviceId: string): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete(`/auth/trusted-devices/${deviceId}`)
    return response.data
  },

  performRiskAssessment: async (data: any): Promise<ApiResponse<any>> => {
    const response = await apiClient.post("/auth/risk-assessment", data)
    return response.data
  },

  getSecuritySummary: async (): Promise<ApiResponse<any>> => {
    const response = await apiClient.get("/auth/security-summary")
    return response.data
  },

  // Persistent Tokens
  createPersistentToken: async (data: any): Promise<ApiResponse<any>> => {
    const response = await apiClient.post("/auth/tokens", data)
    return response.data
  },

  createApiKey: async (data: any): Promise<ApiResponse<any>> => {
    const response = await apiClient.post("/auth/tokens/api-key", data)
    return response.data
  },

  getPersistentTokens: async (): Promise<ApiResponse<any[]>> => {
    const response = await apiClient.get("/auth/tokens")
    return response.data
  },

  getPersistentToken: async (id: string): Promise<ApiResponse<any>> => {
    const response = await apiClient.get(`/auth/tokens/${id}`)
    return response.data
  },

  getTokenStats: async (): Promise<ApiResponse<any>> => {
    const response = await apiClient.get("/auth/tokens/stats")
    return response.data
  },

  updatePersistentToken: async (id: string, data: any): Promise<ApiResponse<any>> => {
    const response = await apiClient.put(`/auth/tokens/${id}`, data)
    return response.data
  },

  refreshPersistentToken: async (id: string): Promise<ApiResponse<any>> => {
    const response = await apiClient.post(`/auth/tokens/${id}/refresh`)
    return response.data
  },

  deletePersistentToken: async (id: string): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete(`/auth/tokens/${id}`)
    return response.data
  },

  deleteAllPersistentTokens: async (): Promise<ApiResponse<any>> => {
    const response = await apiClient.delete("/auth/tokens")
    return response.data
  },

  validatePersistentToken: async (data: any): Promise<ApiResponse<any>> => {
    const response = await apiClient.post("/auth/tokens/validate", data)
    return response.data
  },

  // Validation Tokens
  requestEmailVerification: async (data: any): Promise<ApiResponse<any>> => {
    const response = await apiClient.post("/auth/validation/email-verification", data)
    return response.data
  },

  verifyEmailToken: async (data: any): Promise<ApiResponse<any>> => {
    const response = await apiClient.post("/auth/validation/verify-email", data)
    return response.data
  },

  requestPasswordReset: async (data: any): Promise<ApiResponse<any>> => {
    const response = await apiClient.post("/auth/validation/password-reset", data)
    return response.data
  },

  resetPasswordWithToken: async (data: any): Promise<ApiResponse<any>> => {
    const response = await apiClient.post("/auth/validation/reset-password", data)
    return response.data
  },

  createInvitationToken: async (data: any): Promise<ApiResponse<any>> => {
    const response = await apiClient.post("/auth/validation/invitation", data)
    return response.data
  },

  acceptInvitationToken: async (data: any): Promise<ApiResponse<any>> => {
    const response = await apiClient.post("/auth/validation/accept-invitation", data)
    return response.data
  },

  requestMagicLink: async (data: any): Promise<ApiResponse<any>> => {
    const response = await apiClient.post("/auth/validation/magic-link", data)
    return response.data
  },

  useMagicLink: async (data: any): Promise<ApiResponse<any>> => {
    const response = await apiClient.post("/auth/validation/use-magic-link", data)
    return response.data
  },

  requestPhoneVerification: async (data: any): Promise<ApiResponse<any>> => {
    const response = await apiClient.post("/auth/validation/phone-verification", data)
    return response.data
  },

  verifyPhone: async (data: any): Promise<ApiResponse<any>> => {
    const response = await apiClient.post("/auth/validation/verify-phone", data)
    return response.data
  },

  validateToken: async (data: any): Promise<ApiResponse<any>> => {
    const response = await apiClient.post("/auth/validation/validate", data)
    return response.data
  },

  resendValidationToken: async (data: any): Promise<ApiResponse<any>> => {
    const response = await apiClient.post("/auth/validation/resend", data)
    return response.data
  },

  getMyValidationTokens: async (): Promise<ApiResponse<any[]>> => {
    const response = await apiClient.get("/auth/validation/my-tokens")
    return response.data
  },

  getValidationStats: async (): Promise<ApiResponse<any>> => {
    const response = await apiClient.get("/auth/validation/stats")
    return response.data
  },
}