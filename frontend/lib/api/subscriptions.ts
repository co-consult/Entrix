import apiClient from "../api"
import type { SubscriptionPlan, ApiResponse, Subscription } from "@/types"

export const subscriptionsApi = {
  getSubscriptionPlans: async (params?: any): Promise<ApiResponse<SubscriptionPlan[]>> => {
    console.log("[subscriptionsApi.getSubscriptionPlans] params:", params)
    // Add cache-busting timestamp to prevent stale data
    const timestamp = Date.now();
    const queryParams = { _t: timestamp, ...params };
    const queryString = `?${new URLSearchParams(queryParams as any).toString()}`
    const response = await apiClient.getSubscriptionPlans(queryString)
    console.log("[subscriptionsApi.getSubscriptionPlans] response:", response)
    // The backend returns the array directly, not wrapped in ApiResponse
    return { data: response, success: true }
  },
  getSubscriptionPlan: async (id: string): Promise<ApiResponse<SubscriptionPlan>> => {
    const response = await apiClient.getSubscription(id)
    return { data: response, success: true }
  },
  createSubscriptionOrder: async (planId: string) => {
    const response = await apiClient.createOrder({
      items: [
        {
          type: "SUBSCRIPTION",
          subscription_plan_id: planId,
          quantity: 1,
        },
      ],
    })
    return response
  },
  getAll: async (params?: { page?: number; limit?: number; vendorId?: string; paymentMethod?: string; [key: string]: any }) => {
    // Add cache-busting timestamp to ensure fresh data
    const timestamp = Date.now();
    const queryParams = { _t: timestamp, ...params };
    const response = await apiClient.getSubscriptions(queryParams);
    // Return the full response for pagination support
    return response;
  },
  
  getAllStats: async (params?: { vendorId?: string; paymentMethod?: string; [key: string]: any }) => {
    // Add cache-busting timestamp to ensure fresh data
    const timestamp = Date.now();
    const queryParams = { _t: timestamp, ...params };
    const response = await apiClient.getSubscriptionsStats(queryParams);
    // The main apiClient automatically unwraps the data property
    // So response is already the array, not { success: true, data: [...], total: number, message: string }
    return Array.isArray(response) ? response : [];
  },
  
  getStats: async (params?: { vendorId?: string; paymentMethod?: string; [key: string]: any }) => {
    // Add cache-busting timestamp to ensure fresh data
    const timestamp = Date.now();
    const queryParams = { _t: timestamp, ...params };
    const response = await apiClient.getSubscriptionsStats(queryParams);
    // The backend now returns { success: true, data: {...}, message: string }
    // We need to return the data property for the new stats format
    return response && typeof response === 'object' && 'data' in response ? response.data : response;
  },
  
  getFilterOptions: async () => {
    // Use the main API client's getFilterOptions method
    const response = await apiClient.getFilterOptions();
    // The backend returns { success: true, data: {...}, message: string }
    return response && typeof response === 'object' && 'data' in response ? response.data : response;
  },
  getSubscription: async (id: string): Promise<ApiResponse<Subscription>> => {
    const response = await apiClient.getSubscription(id);
    // The backend returns { success: true, data: {...}, message: string }
    return { data: response, success: true };
  },
  getSubscriptionQRCodeInfo: async (id: string) => {
    const response = await apiClient.request(`/subscription-sales/subscriptions/${id}/qr-code-info`, { method: 'GET' });
    return response;
  },
  createAdminSubscription: async (data: {
    user_id: string,
    subscription_plan_id: string,
    qr_code: string,
    event_id?: string,
    start_date?: string,
    end_date?: string
  }) => {
    const response = await apiClient.createSubscription(data);
    return response;
  },
  updateSubscription: async (id: string, data: {
    status?: string,
    start_date?: string,
    end_date?: string,
    subscription_plan_id?: string
  }) => {
    // Note: This method might not exist in the main API client
    // You may need to add it to the main api.ts file
    throw new Error("updateSubscription method not implemented in main API client")
  },
  deleteSubscription: async (id: string) => {
    // Note: This method might not exist in the main API client
    // You may need to add it to the main api.ts file
    throw new Error("deleteSubscription method not implemented in main API client")
  },
  // New enhanced methods
  activateSubscription: async (id: string) => {
    const response = await apiClient.activateSubscription(id);
    return response;
  },
  deactivateSubscription: async (id: string, suspensionReason?: string) => {
    const response = await apiClient.deactivateSubscription(id, suspensionReason);
    return response;
  },
  getSubscriptionBenefits: async (id: string) => {
    // Note: This method might not exist in the main API client
    // You may need to add it to the main api.ts file
    throw new Error("getSubscriptionBenefits method not implemented in main API client")
  },
  getSubscriptionStats: async (organizerId?: string) => {
    const response = await apiClient.getSubscriptionStats(organizerId);
    // The backend returns { success: true, data: {...}, message: string }
    return response;
  },
  checkSubscriptionAccess: async (userId: string, eventId: string) => {
    // Note: This method might not exist in the main API client
    // You may need to add it to the main api.ts file
    throw new Error("checkSubscriptionAccess method not implemented in main API client")
  },
  getActiveSubscriptions: async (userId: string) => {
    // Note: This method might not exist in the main API client
    // You may need to add it to the main api.ts file
    throw new Error("getActiveSubscriptions method not implemented in main API client")
  },

  createSubscriptionPlan: async (data: any) => {
    const response = await apiClient.createSubscriptionPlan(data);
    return response;
  },


  // ============================================================================
  // SUBSCRIPTION-SALES MODULE INTEGRATION
  // ============================================================================

  // Get available subscription plans for sales
  getAvailablePlansForSales: async () => {
    const response = await apiClient.getAvailablePlansForSales();
    return { data: response, success: true };
  },
  getAllPlansByOrganizer: async (organizerId: string) => {
    const response = await apiClient.getAllPlansByOrganizer(organizerId);
    return { data: response, success: true };
  },

  // ============================================================================
  // SUBSCRIPTION PLAN MANAGEMENT (MISSING ENDPOINTS)
  // ============================================================================

  // Create subscription plan
  createSubscriptionPlan: async (data: {
    organizer_id: string,
    name: string,
    code?: string,
    description?: string,
    type: string,
    price: number,
    currency?: string,
    is_active?: boolean,
    max_subscribers?: number | null,
    valid_from?: string,
    valid_until?: string,
    sale_start_date?: string,
    sale_end_date?: string,
    transferable?: boolean,
    max_transfers?: number,
    auto_renew?: boolean,
    includes_playoffs?: boolean,
    priority_booking?: boolean,
    benefits?: string[],
    restrictions?: string[],
    metadata?: any
  }) => {
    const response = await apiClient.post(`/subscription-sales/plans`, data);
    return response.data;
  },

  // Update subscription plan
  updateSubscriptionPlan: async (planId: string, data: {
    organizer_id?: string,
    name?: string,
    code?: string,
    description?: string,
    type?: string,
    price?: number,
    currency?: string,
    is_active?: boolean,
    max_subscribers?: number | null,
    valid_from?: string,
    valid_until?: string,
    sale_start_date?: string,
    sale_end_date?: string,
    transferable?: boolean,
    max_transfers?: number,
    auto_renew?: boolean,
    includes_playoffs?: boolean,
    priority_booking?: boolean,
    benefits?: string[],
    restrictions?: string[],
    metadata?: any
  }) => {
    const response = await apiClient.put(`/subscription-sales/plans/${planId}`, data);
    return response.data;
  },

  // Delete subscription plan
  deleteSubscriptionPlan: async (planId: string) => {
    const response = await apiClient.delete(`/subscription-sales/plans/${planId}`);
    return response.data;
  },

  // Get plan zones for seat selection
  getPlanZones: async (planId: string) => {
    const response = await apiClient.get(`/subscription-sales/plans/${planId}/zones`);
    return response.data;
  },

  // Get available seats in a zone
  getZoneSeats: async (zoneId: string, quantity?: number) => {
    const params = quantity ? { quantity } : {};
    const response = await apiClient.get(`/subscription-sales/zones/${zoneId}/seats`, { params });
    return response.data;
  },

  // Validate QR codes
  validateQRCodes: async (codes: string[], planId?: string) => {
    const params: any = { codes: codes.join(',') };
    if (planId) params.planId = planId;
    const response = await apiClient.get(`/subscription-sales/qr-codes/validate`, { params });
    return response.data;
  },

  // Get available QR codes for a plan
  getAvailableQRCodes: async (planId: string, quantity: number) => {
    const response = await apiClient.get(`/subscription-sales/qr-codes/available`, {
      params: { planId, quantity }
    });
    return response.data;
  },

  // ============================================================================
  // SALES MANAGEMENT
  // ============================================================================

  // Create direct subscription sale (bypass flow)
  createDirectSale: async (saleData: {
    planId: string;
    quantity: number;
    qrCodes: string[];
    saleMode: 'IDENTIFIED' | 'ANONYMOUS';
    saleChannel: 'PHYSICAL' | 'FRONTEND';
    paymentMethod: 'CASH' | 'CARD' | 'FLOUCI' | 'BANK_TRANSFER' | 'SOCIOS' | 'CHEQUE';
    amount: number;
    currency: string;
    customerInfo?: {
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      fanId?: string;
    };
    sellerId?: string;
    metadata?: Record<string, any>;
  }) => {
    const response = await apiClient.post(`/subscription-sales/direct-sale`, saleData);
    return response.data;
  },

  // Convert anonymous subscription to identified user
  convertAnonymousSubscription: async (conversionData: {
    onboardingKey: string;
    customerInfo: {
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      fanId?: string;
    };
    password?: string;
  }) => {
    const response = await apiClient.post(`/subscription-sales/convert-anonymous`, conversionData);
    return response.data;
  },

  // Get sale details
  getSaleDetails: async (saleId: string) => {
    const response = await apiClient.get(`/subscription-sales/sales/${saleId}`);
    return response.data;
  },

  // Get subscriptions by onboarding key
  getSubscriptionsByOnboardingKey: async (onboardingKey: string) => {
    const response = await apiClient.get(`/subscription-sales/onboarding/${onboardingKey}`);
    return response.data;
  },

  // ============================================================================
  // QR CODE UTILITIES
  // ============================================================================

  // Get QR code information from physical_qr_codes table
  getQRCodeInfo: async (qrCode: string) => {
    try {
      const response = await apiClient.get(`/subscription-sales/qr-code-info/${qrCode}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get QR code by serial number
  getQRCodeBySerialNumber: async (serialNumber: string, planId?: string) => {
    try {
      const url = planId 
        ? `/subscription-sales/qr-codes/serial/${serialNumber}?planId=${planId}`
        : `/subscription-sales/qr-codes/serial/${serialNumber}`;
      const response = await apiClient.get(url);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // ============================================================================
  // SALES FLOW MANAGEMENT
  // ============================================================================

  // Start sales session
  startSalesSession: async (sessionData: {
    organizerId?: string;
    sellerId?: string;
    metadata?: Record<string, any>;
  }) => {
    const response = await apiClient.post(`/subscription-sales/flow/start`, sessionData);
    return response.data;
  },

  // Select plan in session
  selectPlanInSession: async (sessionId: string, planId: string) => {
    const response = await apiClient.post(`/subscription-sales/flow/${sessionId}/select-plan`, {
      planId
    });
    return response.data;
  },

  // Select zone in session
  selectZoneInSession: async (sessionId: string, zoneId: string) => {
    const response = await apiClient.post(`/subscription-sales/flow/${sessionId}/select-zone`, {
      zoneId
    });
    return response.data;
  },

  // Select seats in session
  selectSeatsInSession: async (sessionId: string, seatIds: string[]) => {
    const response = await apiClient.post(`/subscription-sales/flow/${sessionId}/select-seats`, {
      seatIds
    });
    return response.data;
  },

  // Validate physical cards in session
  validatePhysicalCardsInSession: async (sessionId: string, qrCodes: string[]) => {
    const response = await apiClient.post(`/subscription-sales/flow/${sessionId}/validate-cards`, {
      qrCodes
    });
    return response.data;
  },

  // Complete sale in session
  completeSaleInSession: async (sessionId: string, saleData: {
    customerInfo?: {
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      fanId?: string;
    };
    paymentMethod: 'CASH' | 'CARD' | 'FLOUCI' | 'BANK_TRANSFER';
    amount: number;
    currency: string;
    metadata?: Record<string, any>;
  }) => {
    const response = await apiClient.post(`/subscription-sales/flow/${sessionId}/complete`, saleData);
    return response.data;
  },

  // Complete anonymous sale in session
  completeAnonymousSaleInSession: async (sessionId: string, saleData: {
    paymentMethod: 'CASH' | 'CARD' | 'FLOUCI' | 'BANK_TRANSFER';
    amount: number;
    currency: string;
    metadata?: Record<string, any>;
  }) => {
    const response = await apiClient.post(`/subscription-sales/flow/${sessionId}/complete-anonymous`, saleData);
    return response.data;
  },

  // Get session status
  getSessionStatus: async (sessionId: string) => {
    const response = await apiClient.get(`/subscription-sales/flow/${sessionId}/status`);
    return response.data;
  },

  // Cancel session
  cancelSession: async (sessionId: string) => {
    const response = await apiClient.delete(`/subscription-sales/flow/${sessionId}`);
    return response.data;
  },
} 