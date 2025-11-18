import { apiClient } from "../api-client"
import type { Ticket, ApiResponse, PaginatedResponse } from "@/types"

// Define CreateTicketForm type locally if not available
type CreateTicketForm = {
  name: string;
  description?: string;
  price: number;
  currency?: string;
  quantity?: number;
  maxPerOrder?: number;
  saleStartDate?: string;
  saleEndDate?: string;
  isActive?: boolean;
  metadata?: any;
}

export const ticketsApi = {
  // Get all tickets
  getTickets: async (filters?: any): Promise<PaginatedResponse<Ticket>> => {
    const response = await apiClient.get("/tickets", { params: filters })
    return response.data
  },

  // Get tickets for an event
  getEventTickets: async (eventId: string): Promise<ApiResponse<Ticket[]>> => {
    const response = await apiClient.get(`/events/${eventId}/tickets`)
    return response.data
  },

  // Get ticket by ID
  getTicket: async (ticketId: string): Promise<ApiResponse<Ticket>> => {
    const response = await apiClient.get(`/tickets/${ticketId}`)
    return response.data
  },

  // Create ticket
  createTicket: async (eventId: string, data: CreateTicketForm): Promise<ApiResponse<Ticket>> => {
    const response = await apiClient.post(`/events/${eventId}/tickets`, data)
    return response.data
  },

  // Update ticket
  updateTicket: async (ticketId: string, data: Partial<CreateTicketForm>): Promise<ApiResponse<Ticket>> => {
    const response = await apiClient.put(`/tickets/${ticketId}`, data)
    return response.data
  },

  // Delete ticket
  deleteTicket: async (ticketId: string): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete(`/tickets/${ticketId}`)
    return response.data
  },

  // Get ticket types
  getTicketTypes: async (): Promise<ApiResponse<any[]>> => {
    const response = await apiClient.get("/tickets/types")
    return response.data
  },

  // Create ticket order/payment
  createTicketOrder: async (data: {
    ticketTypeId: string;
    quantity?: number;
    eventId?: string;
    metadata?: any;
  }): Promise<ApiResponse<any>> => {
    const response = await apiClient.post("/orders", {
      items: [
        {
          type: "TICKET",
          ticket_type_id: data.ticketTypeId,
          quantity: data.quantity || 1,
          event_id: data.eventId,
          metadata: data.metadata,
        },
      ],
    })
    return response.data
  },

  // Purchase ticket directly
  purchaseTicket: async (ticketId: string, data: {
    quantity?: number;
    paymentMethod?: string;
    metadata?: any;
  }): Promise<ApiResponse<any>> => {
    const response = await apiClient.post(`/tickets/${ticketId}/purchase`, data)
    return response.data
  },

  // Get my tickets
  getMyTickets: async (filters?: any): Promise<ApiResponse<Ticket[]>> => {
    const response = await apiClient.get("/tickets/my-tickets", { params: filters })
    return response.data
  },

  // Validate ticket
  validateTicket: async (ticketId: string, validationCode?: string): Promise<ApiResponse<any>> => {
    const response = await apiClient.post(`/tickets/${ticketId}/validate`, { validationCode })
    return response.data
  },

  // Transfer ticket
  transferTicket: async (ticketId: string, data: {
    recipientEmail?: string;
    recipientUserId?: string;
    message?: string;
  }): Promise<ApiResponse<any>> => {
    const response = await apiClient.post(`/tickets/${ticketId}/transfer`, data)
    return response.data
  },

  // Cancel ticket
  cancelTicket: async (ticketId: string, reason?: string): Promise<ApiResponse<any>> => {
    const response = await apiClient.post(`/tickets/${ticketId}/cancel`, { reason })
    return response.data
  },

  // Refund ticket
  refundTicket: async (ticketId: string, data: {
    amount?: number;
    reason?: string;
    refundMethod?: string;
  }): Promise<ApiResponse<any>> => {
    const response = await apiClient.post(`/tickets/${ticketId}/refund`, data)
    return response.data
  },

  // Get ticket QR code
  getTicketQRCode: async (ticketId: string): Promise<ApiResponse<any>> => {
    const response = await apiClient.get(`/tickets/${ticketId}/qr-code`)
    return response.data
  },

  // Download ticket
  downloadTicket: async (ticketId: string, format: string = 'pdf'): Promise<any> => {
    const response = await apiClient.get(`/tickets/${ticketId}/download`, {
      params: { format },
      responseType: 'blob'
    })
    return response.data
  },

  // Get ticket stats
  getTicketStats: async (filters?: any): Promise<ApiResponse<any>> => {
    const response = await apiClient.get("/tickets/stats", { params: filters })
    return response.data
  },

  // Get event ticket stats
  getEventTicketStats: async (eventId: string): Promise<ApiResponse<any>> => {
    const response = await apiClient.get(`/events/${eventId}/tickets/stats`)
    return response.data
  },

  // Bulk ticket operations
  bulkUpdateTickets: async (ticketIds: string[], data: any): Promise<ApiResponse<any>> => {
    const response = await apiClient.put("/tickets/bulk-update", { ticketIds, data })
    return response.data
  },

  bulkCancelTickets: async (ticketIds: string[], reason?: string): Promise<ApiResponse<any>> => {
    const response = await apiClient.post("/tickets/bulk-cancel", { ticketIds, reason })
    return response.data
  },

  // Ticket analytics
  getTicketAnalytics: async (filters?: any): Promise<ApiResponse<any>> => {
    const response = await apiClient.get("/tickets/analytics", { params: filters })
    return response.data
  },

  getEventTicketAnalytics: async (eventId: string, timeRange?: string): Promise<ApiResponse<any>> => {
    const params = timeRange ? { timeRange } : {}
    const response = await apiClient.get(`/events/${eventId}/tickets/analytics`, { params })
    return response.data
  },

  // Export tickets
  exportTickets: async (filters?: any, format: string = 'csv'): Promise<any> => {
    const response = await apiClient.get("/tickets/export", {
      params: { ...filters, format },
      responseType: 'blob'
    })
    return response.data
  },

  exportEventTickets: async (eventId: string, format: string = 'csv'): Promise<any> => {
    const response = await apiClient.get(`/events/${eventId}/tickets/export`, {
      params: { format },
      responseType: 'blob'
    })
    return response.data
  },
}
