// frontend/lib/api/mappings.ts

import { apiClient } from '../api-client';

export interface Mapping {
  id: string;
  venue_id: string;
  name: string;
  code: string;
  description?: string;
  mapping_type: string;
  event_categories: string[];
  effective_capacity: number;
  valid_from?: string;
  valid_until?: string;
  is_active: boolean;
  metadata?: any;
}

export interface CreateMappingData {
  venue_id: string;
  name: string;
  code: string;
  description?: string;
  mapping_type: string;
  event_categories: string[];
  effective_capacity: number;
  valid_from?: string;
  valid_until?: string;
  is_active?: boolean;
  metadata?: any;
}

export const mappingsApi = {
  /**
   * Get all mappings with optional venue filter
   */
  getAll: async (venueId?: string): Promise<{ success: boolean; data: Mapping[]; message?: string }> => {
    try {
      const params = venueId ? { venue_id: venueId } : {};
      const response = await apiClient.get('/zones/mappings', { params });
      const data = response.data || response;
      
      if (data && data.success && Array.isArray(data.data)) {
        return {
          success: true,
          data: data.data,
          message: data.message,
        };
      } else if (Array.isArray(data)) {
        return {
          success: true,
          data: data,
        };
      }
      
      return {
        success: false,
        data: [],
        message: 'Invalid response format',
      };
    } catch (error: any) {
      console.error('Error fetching mappings:', error);
      throw error;
    }
  },

  /**
   * Get mapping by ID
   */
  getById: async (id: string): Promise<{ success: boolean; data: Mapping; message?: string }> => {
    try {
      const response = await apiClient.get(`/zones/mappings/${id}`);
      const data = response.data || response;
      
      if (data && data.success && data.data) {
        return {
          success: true,
          data: data.data,
          message: data.message,
        };
      }
      
      throw new Error('Invalid response format');
    } catch (error: any) {
      console.error(`Error fetching mapping ${id}:`, error);
      throw error;
    }
  },

  /**
   * Create a new mapping
   */
  create: async (data: CreateMappingData): Promise<{ success: boolean; data: Mapping; message?: string }> => {
    try {
      const response = await apiClient.post('/zones/mappings', data);
      const responseData = response.data || response;
      
      if (responseData && responseData.success && responseData.data) {
        return {
          success: true,
          data: responseData.data,
          message: responseData.message,
        };
      }
      
      throw new Error('Invalid response format');
    } catch (error: any) {
      console.error('Error creating mapping:', error);
      throw error;
    }
  },

  /**
   * Update a mapping
   */
  update: async (id: string, data: Partial<Mapping>): Promise<{ success: boolean; data: Mapping; message?: string }> => {
    try {
      const response = await apiClient.put(`/zones/mappings/${id}`, data);
      const responseData = response.data || response;
      
      if (responseData && responseData.success && responseData.data) {
        return {
          success: true,
          data: responseData.data,
          message: responseData.message,
        };
      }
      
      throw new Error('Invalid response format');
    } catch (error: any) {
      console.error(`Error updating mapping ${id}:`, error);
      throw error;
    }
  },

  /**
   * Delete a mapping
   */
  delete: async (id: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await apiClient.delete(`/zones/mappings/${id}`);
      const responseData = response.data || response;
      
      if (responseData && responseData.success) {
        return {
          success: true,
          message: responseData.message,
        };
      }
      
      throw new Error('Invalid response format');
    } catch (error: any) {
      console.error(`Error deleting mapping ${id}:`, error);
      throw error;
    }
  },
};

