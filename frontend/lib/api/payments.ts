import { apiClient } from "../api-client"
import type { ApiResponse, PaginatedResponse } from "@/types"

export const paymentsApi = {
  // Get all payments
  getPayments: async (filters?: any): Promise<PaginatedResponse<any>> => {
    const response = await apiClient.get("/payments", { params: filters })
    return response.data
  },

  // Get payment by ID
  getPayment: async (id: string): Promise<ApiResponse<any>> => {
    const response = await apiClient.get(`/payments/${id}`)
    return response.data
  },

  // Create payment
  createPayment: async (data: {
    amount: number;
    currency?: string;
    paymentMethod: string;
    orderId?: string;
    metadata?: any;
  }): Promise<ApiResponse<any>> => {
    const response = await apiClient.post("/payments", data)
    return response.data
  },

  // Process payment
  processPayment: async (id: string, data?: any): Promise<ApiResponse<any>> => {
    const response = await apiClient.post(`/payments/${id}/process`, data || {})
    return response.data
  },

  // Confirm payment
  confirmPayment: async (id: string, data?: any): Promise<ApiResponse<any>> => {
    const response = await apiClient.post(`/payments/${id}/confirm`, data || {})
    return response.data
  },

  // Cancel payment
  cancelPayment: async (id: string, reason?: string): Promise<ApiResponse<any>> => {
    const response = await apiClient.post(`/payments/${id}/cancel`, { reason })
    return response.data
  },

  // Refund payment
  refundPayment: async (id: string, amount?: number, reason?: string): Promise<ApiResponse<any>> => {
    const response = await apiClient.post(`/payments/${id}/refund`, { amount, reason })
    return response.data
  },

  // Partial refund
  partialRefund: async (id: string, amount: number, reason?: string): Promise<ApiResponse<any>> => {
    const response = await apiClient.post(`/payments/${id}/partial-refund`, { amount, reason })
    return response.data
  },

  // Get payment methods
  getPaymentMethods: async (): Promise<ApiResponse<any[]>> => {
    const response = await apiClient.get("/payments/methods")
    return response.data
  },

  // Get my payment methods
  getMyPaymentMethods: async (): Promise<ApiResponse<any[]>> => {
    const response = await apiClient.get("/payments/my-methods")
    return response.data
  },

  // Add payment method
  addPaymentMethod: async (data: any): Promise<ApiResponse<any>> => {
    const response = await apiClient.post("/payments/methods", data)
    return response.data
  },

  // Update payment method
  updatePaymentMethod: async (id: string, data: any): Promise<ApiResponse<any>> => {
    const response = await apiClient.put(`/payments/methods/${id}`, data)
    return response.data
  },

  // Delete payment method
  deletePaymentMethod: async (id: string): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete(`/payments/methods/${id}`)
    return response.data
  },

  // Set default payment method
  setDefaultPaymentMethod: async (id: string): Promise<ApiResponse<any>> => {
    const response = await apiClient.post(`/payments/methods/${id}/set-default`)
    return response.data
  },

  // Get payment stats
  getPaymentStats: async (filters?: any): Promise<ApiResponse<any>> => {
    const response = await apiClient.get("/payments/stats", { params: filters })
    return response.data
  },

  // Get my payment history
  getMyPaymentHistory: async (filters?: any): Promise<PaginatedResponse<any>> => {
    const response = await apiClient.get("/payments/my-history", { params: filters })
    return response.data
  },

  // Get payment analytics
  getPaymentAnalytics: async (filters?: any): Promise<ApiResponse<any>> => {
    const response = await apiClient.get("/payments/analytics", { params: filters })
    return response.data
  },

  // Retry failed payment
  retryPayment: async (id: string): Promise<ApiResponse<any>> => {
    const response = await apiClient.post(`/payments/${id}/retry`)
    return response.data
  },

  // Get payment receipt
  getPaymentReceipt: async (id: string): Promise<ApiResponse<any>> => {
    const response = await apiClient.get(`/payments/${id}/receipt`)
    return response.data
  },

  // Download payment receipt
  downloadPaymentReceipt: async (id: string, format: string = 'pdf'): Promise<any> => {
    const response = await apiClient.get(`/payments/${id}/receipt/download`, {
      params: { format },
      responseType: 'blob'
    })
    return response.data
  },

  // Dispute payment
  disputePayment: async (id: string, data: {
    reason: string;
    description?: string;
    evidence?: any[];
  }): Promise<ApiResponse<any>> => {
    const response = await apiClient.post(`/payments/${id}/dispute`, data)
    return response.data
  },

  // Get payment disputes
  getPaymentDisputes: async (filters?: any): Promise<PaginatedResponse<any>> => {
    const response = await apiClient.get("/payments/disputes", { params: filters })
    return response.data
  },

  // Update dispute
  updateDispute: async (id: string, data: any): Promise<ApiResponse<any>> => {
    const response = await apiClient.put(`/payments/disputes/${id}`, data)
    return response.data
  },

  // Export payments
  exportPayments: async (filters?: any, format: string = 'csv'): Promise<any> => {
    const response = await apiClient.get("/payments/export", {
      params: { ...filters, format },
      responseType: 'blob'
    })
    return response.data
  },

  // Webhook endpoints for payment providers
  handleStripeWebhook: async (data: any): Promise<ApiResponse<any>> => {
    const response = await apiClient.post("/payments/webhooks/stripe", data)
    return response.data
  },

  handlePayPalWebhook: async (data: any): Promise<ApiResponse<any>> => {
    const response = await apiClient.post("/payments/webhooks/paypal", data)
    return response.data
  },
}