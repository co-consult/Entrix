// frontend/lib/api/venues.ts

import { apiClient } from '../api-client';

export interface Venue {
  id: string;
  name: string;
  slug?: string;
  type?: string;
  description?: string;
  address?: string;
  city?: string;
  country?: string;
  capacity?: number;
  max_capacity?: number;
  is_active?: boolean;
  status?: string;
}

export interface GetVenuesParams {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export const venuesApi = {
  /**
   * Get all venues with optional filters
   */
  getAll: async (params?: GetVenuesParams): Promise<{ success: boolean; data: Venue[]; message?: string; meta?: any }> => {
    try {
      const response = await apiClient.get('/venues', { params });
      const data = response.data || response;
      
      // Handle different response formats
      if (data && data.success && Array.isArray(data.data)) {
        return {
          success: true,
          data: data.data,
          message: data.message,
          meta: data.meta,
        };
      } else if (Array.isArray(data)) {
        return {
          success: true,
          data: data,
        };
      } else if (data && Array.isArray(data.data)) {
        return {
          success: true,
          data: data.data,
          meta: data.meta,
        };
      }
      
      return {
        success: false,
        data: [],
        message: 'Invalid response format',
      };
    } catch (error: any) {
      console.error('Error fetching venues:', error);
      throw error;
    }
  },

  /**
   * Get venue by ID
   */
  getById: async (id: string): Promise<{ success: boolean; data: Venue; message?: string }> => {
    try {
      const response = await apiClient.get(`/venues/${id}`);
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
      console.error(`Error fetching venue ${id}:`, error);
      throw error;
    }
  },

  /**
   * Get venue statistics
   */
  getStatistics: async (id: string): Promise<{ success: boolean; data: any; message?: string }> => {
    try {
      const response = await apiClient.get(`/venues/${id}/stats`);
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
      console.error(`Error fetching venue statistics ${id}:`, error);
      throw error;
    }
  },

  /**
   * Create a new venue
   */
  create: async (data: any): Promise<{ success: boolean; data: Venue; message?: string }> => {
    try {
      const response = await apiClient.post('/venues', data);
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
      console.error('Error creating venue:', error);
      throw error;
    }
  },

  /**
   * Update a venue
   */
  update: async (id: string, data: any): Promise<{ success: boolean; data: Venue; message?: string }> => {
    try {
      const response = await apiClient.put(`/venues/${id}`, data);
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
      console.error(`Error updating venue ${id}:`, error);
      throw error;
    }
  },

  /**
   * Delete a venue
   */
  delete: async (id: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await apiClient.delete(`/venues/${id}`);
      const responseData = response.data || response;
      
      if (responseData && responseData.success) {
        return {
          success: true,
          message: responseData.message,
        };
      }
      
      throw new Error('Invalid response format');
    } catch (error: any) {
      console.error(`Error deleting venue ${id}:`, error);
      throw error;
    }
  },
};

