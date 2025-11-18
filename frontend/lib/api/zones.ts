// frontend/lib/api/zones.ts

import { apiClient } from '../api-client';

export interface Zone {
  id: string;
  code: string;
  name: string;
  description?: string;
  capacity?: number;
  base_price?: number;
  currency?: string;
  is_active?: boolean;
  zone_type?: string;
  category?: string;
  amenities?: string[];
  mapping_id?: string;
}

export interface GetZonesParams {
  active?: boolean;
  zone_type?: string;
  category?: string;
  search?: string;
  venue_id?: string;
}

export const zonesApi = {
  /**
   * Get all zones with optional filters
   */
  getAll: async (params?: GetZonesParams): Promise<{ success: boolean; data: Zone[]; message?: string }> => {
    try {
      const response = await apiClient.get('/zones', { params });
      const data = response.data || response;
      
      // Handle different response formats
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
      } else if (data && Array.isArray(data.data)) {
        return {
          success: true,
          data: data.data,
        };
      }
      
      return {
        success: false,
        data: [],
        message: 'Invalid response format',
      };
    } catch (error: any) {
      console.error('Error fetching zones:', error);
      throw error;
    }
  },

  /**
   * Get zone by ID
   */
  getById: async (id: string): Promise<{ success: boolean; data: Zone; message?: string }> => {
    try {
      const response = await apiClient.get(`/zones/${id}`);
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
      console.error(`Error fetching zone ${id}:`, error);
      throw error;
    }
  },

  /**
   * Get zones by IDs (bulk operation)
   */
  getByIds: async (ids: string[]): Promise<{ success: boolean; data: Zone[]; message?: string }> => {
    try {
      const response = await apiClient.post('/zones/by-ids', { ids });
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
      console.error('Error fetching zones by IDs:', error);
      throw error;
    }
  },

  /**
   * Create a new zone
   */
  create: async (data: {
    mapping_id: string;
    name: string;
    code: string;
    zone_type: string;
    category: string;
    capacity: number;
    base_price?: number;
    currency?: string;
    description?: string;
    parent_zone_id?: string;
    level?: number;
    is_accessible?: boolean;
    requires_special_access?: boolean;
    amenities?: string[];
    coordinates?: any;
    metadata?: any;
    is_active?: boolean;
  }): Promise<{ success: boolean; data: Zone; message?: string }> => {
    try {
      const response = await apiClient.post('/zones', data);
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
      console.error('Error creating zone:', error);
      throw error;
    }
  },

  /**
   * Update a zone
   */
  update: async (id: string, data: Partial<Zone>): Promise<{ success: boolean; data: Zone; message?: string }> => {
    try {
      const response = await apiClient.put(`/zones/${id}`, data);
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
      console.error(`Error updating zone ${id}:`, error);
      throw error;
    }
  },

  /**
   * Delete a zone
   */
  delete: async (id: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await apiClient.delete(`/zones/${id}`);
      const responseData = response.data || response;
      
      if (responseData && responseData.success) {
        return {
          success: true,
          message: responseData.message,
        };
      }
      
      throw new Error('Invalid response format');
    } catch (error: any) {
      console.error(`Error deleting zone ${id}:`, error);
      throw error;
    }
  },

  /**
   * Get zones that have seats
   */
  getZonesWithSeats: async (): Promise<{ success: boolean; data: Zone[]; message?: string }> => {
    try {
      const response = await apiClient.get('/zones/zones-with-seats');
      const data = response.data || response;
      
      if (data && data.success && Array.isArray(data.data)) {
        return {
          success: true,
          data: data.data,
          message: data.message,
        };
      }
      
      return {
        success: false,
        data: [],
        message: 'Invalid response format',
      };
    } catch (error: any) {
      console.error('Error fetching zones with seats:', error);
      throw error;
    }
  },

  /**
   * Get all seats for a zone
   */
  getZoneSeats: async (zoneId: string): Promise<{ success: boolean; data: any[]; message?: string }> => {
    try {
      const response = await apiClient.get(`/zones/${zoneId}/seats`);
      const data = response.data || response;
      
      if (data && data.success && Array.isArray(data.data)) {
        return {
          success: true,
          data: data.data,
          message: data.message,
        };
      }
      
      return {
        success: false,
        data: [],
        message: 'Invalid response format',
      };
    } catch (error: any) {
      console.error(`Error fetching seats for zone ${zoneId}:`, error);
      throw error;
    }
  },
};

