// frontend/lib/api/qr-codes.ts

import { apiClient } from "../api-client"
import type { QRCode, QRCodeStats, QRCodeFilters } from "@/types"

export const qrCodesApi = {
  // Get all QR codes with pagination and filters
  getAll: async (page = 1, limit = 20, filters?: any): Promise<any> => {
    const response = await apiClient.get("/qr-codes", {
      params: { page, limit, ...filters },
    })
    return response.data
  },

  // Get QR code by ID
  getById: async (id: string): Promise<any> => {
    const response = await apiClient.get(`/qr-codes/${id}`)
    return response.data
  },

  // Get QR code by code
  getByCode: async (code: string): Promise<any> => {
    const response = await apiClient.get(`/qr-codes/code/${code}`)
    return response.data
  },

  // Create new QR code
  create: async (data: any): Promise<any> => {
    const response = await apiClient.post("/qr-codes", data)
    return response.data
  },

  // Update QR code
  update: async (id: string, data: any): Promise<any> => {
    const response = await apiClient.put(`/qr-codes/${id}`, data)
    return response.data
  },

  // Delete QR code
  delete: async (id: string): Promise<any> => {
    const response = await apiClient.delete(`/qr-codes/${id}`)
    return response.data
  },

  // Get QR code stats
  getStats: async (filters?: QRCodeFilters): Promise<any> => {
    const response = await apiClient.get("/qr-codes/stats", { params: filters })
    return response.data
  },

  // Export all QR codes
  exportAll: async (filters?: any): Promise<any> => {
    const response = await apiClient.get("/qr-codes/export", { params: filters })
    return response.data
  },

  // Assign QR code to subscription
  assignToSubscription: async (id: string, subscriptionId: string, assignedTo?: string): Promise<any> => {
    const response = await apiClient.post(`/qr-codes/${id}/assign`, {
      subscription_id: subscriptionId,
      assigned_to: assignedTo,
    })
    return response.data
  },

  // Release QR code
  release: async (id: string, reason?: string): Promise<any> => {
    const response = await apiClient.post(`/qr-codes/${id}/release`, {
      reason,
    })
    return response.data
  },

  // Reserve QR code
  reserve: async (id: string, data: { note: string; reservedFor: string; reservedUntil: string }): Promise<any> => {
    const response = await apiClient.post(`/qr-codes/${id}/reserve`, data)
    return response.data
  },

  // Mark QR code as used
  markAsUsed: async (id: string, usedBy: string, location?: string, deviceInfo?: string): Promise<any> => {
    const response = await apiClient.post(`/qr-codes/${id}/use`, {
      used_by: usedBy,
      location,
      device_info: deviceInfo,
    })
    return response.data
  },

  // Generate batch QR codes
  generateBatch: async (count: number, type: string, prefix?: string): Promise<any> => {
    const response = await apiClient.post("/qr-codes/generate-batch", {
      count,
      type,
      prefix,
    })
    return response.data
  },

  // Get available count
  getAvailableCount: async (): Promise<any> => {
    const response = await apiClient.get("/qr-codes/available/count")
    return response.data
  },

  // Get assigned count
  getAssignedCount: async (): Promise<any> => {
    const response = await apiClient.get("/qr-codes/assigned/count")
    return response.data
  },

  // Create physical QR code(s) for a subscription plan
  createPhysical: async (data: {
    subscription_plan_id: string;
    mode: 'SINGULAR' | 'BULK';
    count?: number;
    zone_id?: string;
    suffix_type?: string;
    card_type?: string;
    card_batch?: string;
    seat_row?: string;
    seat_start_number?: number;
    porte?: number;
  }): Promise<any> => {
    const response = await apiClient.post("/qr-codes/create-physical", data)
    return response.data
  },

  // Preview QR code creation
  previewPhysical: async (data: {
    subscription_plan_id: string;
    count: number;
    zone_id?: string;
    suffix_type?: string;
    card_type?: string;
    card_batch?: string;
    seat_row?: string;
    seat_start_number?: number;
    porte?: number;
  }): Promise<any> => {
    const response = await apiClient.post("/qr-codes/create-physical/preview", data)
    return response.data
  },

  // Export created QR codes
  exportCreated: async (qrCodeIds: string[]): Promise<{ blob: Blob; filename: string }> => {
    const response = await apiClient.post("/qr-codes/create-physical/export", { qr_code_ids: qrCodeIds }, {
      responseType: 'blob',
    })
    
    // Extract filename from headers
    // Try X-Filename custom header first (easier to access)
    let filename = 'export';
    
    // Debug: log all headers to see what's available
    console.log('Response headers:', response.headers);
    console.log('Response headers keys:', response.headers ? Object.keys(response.headers) : 'no headers');
    
    if (response.headers) {
      // Try X-Filename header first (case-insensitive)
      const headerKeys = Object.keys(response.headers);
      let xFilename = '';
      let contentDisposition = '';
      
      // Find headers (case-insensitive search)
      for (const key of headerKeys) {
        const lowerKey = key.toLowerCase();
        if (lowerKey === 'x-filename') {
          xFilename = response.headers[key];
        } else if (lowerKey === 'content-disposition') {
          contentDisposition = response.headers[key];
        }
      }
      
      // Also try direct access
      if (!xFilename) {
        xFilename = response.headers['x-filename'] || 
                   response.headers['X-Filename'] ||
                   (response.headers as any)['x-filename'] ||
                   '';
      }
      
      if (!contentDisposition) {
        contentDisposition = response.headers['content-disposition'] || 
                            response.headers['Content-Disposition'] || 
                            '';
      }
      
      if (xFilename) {
        filename = xFilename;
        console.log('Using X-Filename header:', filename);
      } else if (contentDisposition) {
        console.log('Using Content-Disposition header:', contentDisposition);
        // Try to extract filename from Content-Disposition header
        // Format: attachment; filename="50 qr_code gradin 4.csv" or attachment; filename=50 qr_code gradin 4.csv
        const quotedMatch = contentDisposition.match(/filename[^;=\n]*=["']([^"']+)["']/i);
        if (quotedMatch && quotedMatch[1]) {
          filename = quotedMatch[1].trim();
        } else {
          // Try without quotes
          const unquotedMatch = contentDisposition.match(/filename[^;=\n]*=([^;\n]+)/i);
          if (unquotedMatch && unquotedMatch[1]) {
            filename = unquotedMatch[1].trim();
          }
        }
      } else {
        console.warn('No filename header found, using default "export.csv"');
      }
    } else {
      console.warn('No response headers available');
    }
    
    // Remove .csv extension if present (to avoid double extension)
    if (filename.endsWith('.csv')) {
      filename = filename.slice(0, -4);
    }
    
    // Always add .csv extension
    filename = `${filename}.csv`;
    
    console.log('Final filename:', filename);
    
    return { blob: response.data, filename }
  },

  // Get last seat number for a row
  getLastSeatNumber: async (subscriptionPlanId: string, seatRow: string): Promise<any> => {
    const response = await apiClient.get("/qr-codes/get-last-seat-number", {
      params: { subscription_plan_id: subscriptionPlanId, seat_row: seatRow },
    })
    return response.data
  },

  // Check if subscription plan has seats
  checkPlanHasSeats: async (subscriptionPlanId: string): Promise<any> => {
    const response = await apiClient.get("/qr-codes/check-plan-has-seats", {
      params: { subscription_plan_id: subscriptionPlanId },
    })
    return response.data
  },

  // Get available seat rows for a subscription plan
  getAvailableSeatRows: async (subscriptionPlanId: string): Promise<any> => {
    const response = await apiClient.get("/qr-codes/get-available-seat-rows", {
      params: { subscription_plan_id: subscriptionPlanId },
    })
    return response.data
  },

  // Get all zones from database
  getZones: async (): Promise<any> => {
    const response = await apiClient.get("/qr-codes/get-zones")
    console.log("🔍 getZones raw axios response:", response)
    // Axios returns response.data, so if backend returns { success: true, data: [...], message: "..." }
    // Then response.data is { success: true, data: [...], message: "..." }
    const data = response.data || response
    console.log("🔍 getZones response.data:", data)
    
    // Backend returns { success: true, data: zones[], message: "..." }
    if (data && data.success && data.data) {
      return data
    } else if (data && Array.isArray(data)) {
      return { success: true, data: data }
    } else if (data && data.data && Array.isArray(data.data)) {
      return { success: true, data: data.data }
    }
    return { success: false, data: [], message: "Invalid response format" }
  },

  // Get zones for a subscription plan
  getZonesForPlan: async (subscriptionPlanId: string): Promise<any> => {
    const response = await apiClient.get(`/qr-codes/get-zones-for-plan/${subscriptionPlanId}`)
    return response.data
  },

  // Sync all seat statuses with QR codes
  syncSeats: async (): Promise<{ success: boolean; data: { synced: number; errors: number } }> => {
    const response = await apiClient.post("/qr-codes/sync-seats")
    return response.data
  },
} 