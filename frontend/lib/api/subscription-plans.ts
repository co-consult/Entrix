// frontend/lib/api/subscription-plans.ts

import { apiClient } from "../api-client"
import type { SubscriptionPlan } from "@/types"

export interface CreateSubscriptionPlanData {
  code: string
  name: string
  description?: string
  type: string
  price: number
  currency?: string
  organizer_id: string
  max_subscribers?: number
  valid_from: string
  valid_until: string
  sale_start_date?: string
  sale_end_date?: string
  transferable?: boolean
  max_transfers?: number
  auto_renew?: boolean
  includes_playoffs?: boolean
  priority_booking?: boolean
  benefits?: Record<string, any>
  restrictions?: Record<string, any>
  metadata?: Record<string, any>
  zones?: Array<{
    zone_id: string
    is_included?: boolean
    price_override?: number
    priority_level?: number
  }>
  events?: Array<{
    event_id: string
    is_included?: boolean
    is_priority?: boolean
    access_level?: string
  }>
}

export interface UpdateSubscriptionPlanData extends Partial<CreateSubscriptionPlanData> {
  code?: string
  is_active?: boolean
}

export const subscriptionPlansApi = {
  // Get available plans (for sale)
  getAvailablePlans: async (organizerId?: string): Promise<any> => {
    // Add cache-busting timestamp to prevent stale data
    const timestamp = Date.now();
    const params: any = { _t: timestamp };
    if (organizerId) params.organizerId = organizerId;
    const response = await apiClient.get("/subscription-sales/available-plans", {
      params,
    })
    return response.data
  },

  // Get all plans by organizer (active + inactive)
  getAllPlansByOrganizer: async (organizerId: string): Promise<any> => {
    // Add cache-busting timestamp to prevent stale data
    const timestamp = Date.now();
    const response = await apiClient.get(`/subscription-sales/organizers/${organizerId}/plans`, {
      params: { _t: timestamp },
    })
    return response.data
  },

  // Get plan details
  getPlanDetails: async (planId: string): Promise<any> => {
    const response = await apiClient.get(`/subscription-sales/plans/${planId}`)
    return response.data
  },

  // Create a new subscription plan
  create: async (data: CreateSubscriptionPlanData): Promise<any> => {
    const response = await apiClient.post("/subscription-sales/subscription-plans", data)
    return response.data
  },

  // Update a subscription plan
  update: async (id: string, data: UpdateSubscriptionPlanData): Promise<any> => {
    const response = await apiClient.put(`/subscription-sales/subscription-plans/${id}`, data)
    return response.data
  },

  // Delete a subscription plan
  delete: async (id: string): Promise<any> => {
    const response = await apiClient.delete(`/subscription-sales/subscription-plans/${id}`)
    return response.data
  },

  // Check plan availability
  checkAvailability: async (planId: string, quantity: number): Promise<any> => {
    const response = await apiClient.get(`/subscription-sales/plans/${planId}/availability`, {
      params: { quantity },
    })
    return response.data
  },
}

