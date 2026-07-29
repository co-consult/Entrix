import { apiClient } from '../api-client';

export interface UpsertTicketConfigData {
  zone_id?: string;
  ticket_type_name: string;
  price: number;
  available_quantity?: number;
}

export interface GenerateEventTicketsData {
  zone_id?: string;
  count: number;
  price: number;
  ticket_type_name?: string;
  ticket_type_id?: string;
}

export interface EventTicketTier {
  id: string;
  ticket_type_id: string;
  ticket_type_name: string;
  zone_id: string | null;
  zone_name: string | null;
  zone_capacity?: number | null;
  zone_tickets_used?: number | null;
  zone_capacity_remaining?: number | null;
  price: number;
  available_quantity: number | null;
  sold_quantity: number;
  remaining: number | null;
  available_for_sale?: number;
}

export interface EventTicketRow {
  id: string;
  ticket_number: string;
  event_id: string;
  zone_id: string | null;
  zone_name?: string;
  zone_code?: string;
  price_paid: number;
  ticket_type?: string;
  is_active: boolean;
  qr_code?: string;
  access_code?: string;
  status?: string;
  created_at: string;
}

export interface ListEventTicketsParams {
  page?: number;
  limit?: number;
  ticket_type?: string;
  search?: string;
}

export interface ListEventTicketsResponse {
  success: boolean;
  data: EventTicketRow[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  stats: {
    total: number;
    valid: number;
  };
}

export interface SellableTicketOption {
  ticket_type_id: string;
  ticket_type_name: string;
  zone_id: string | null;
  zone_name: string | null;
  available_for_sale: number;
  price: number;
  option_key: string;
}

export const eventTicketsApi = {
  list: async (
    eventId: string,
    params: ListEventTicketsParams = {},
  ): Promise<ListEventTicketsResponse> => {
    const response = await apiClient.get(`/events/${eventId}/tickets`, { params });
    return response.data;
  },

  listTicketConfigs: async (eventId: string): Promise<{ success: boolean; data: EventTicketTier[] }> => {
    const response = await apiClient.get(`/events/${eventId}/ticket-configs`);
    return response.data;
  },

  listSellableOptions: async (
    eventId: string,
  ): Promise<{ success: boolean; data: SellableTicketOption[] }> => {
    const response = await apiClient.get(`/events/${eventId}/tickets/sellable-options`);
    return response.data;
  },

  upsertTicketConfig: async (eventId: string, data: UpsertTicketConfigData) => {
    const response = await apiClient.post(`/events/${eventId}/ticket-config`, data);
    return response.data;
  },

  deleteTicketConfig: async (eventId: string, configId: string) => {
    const response = await apiClient.delete(`/events/${eventId}/ticket-configs/${configId}`);
    return response.data;
  },

  generateBatch: async (eventId: string, data: GenerateEventTicketsData) => {
    const response = await apiClient.post(
      `/events/${eventId}/tickets/generate-batch`,
      data,
      { timeout: 300000 },
    );
    return response.data;
  },

  sell: async (
    eventId: string,
    data: {
      ticket_type_id: string;
      zone_id?: string;
      quantity: number;
      payment_method: string;
      guest_name?: string;
      guest_phone?: string;
      guest_email?: string;
      note?: string;
    },
  ) => {
    const response = await apiClient.post(`/events/${eventId}/tickets/sell`, data);
    return response.data;
  },

  listSales: async (
    eventId: string,
    params: { page?: number; limit?: number } = {},
  ) => {
    const response = await apiClient.get(`/events/${eventId}/ticket-sales`, { params });
    return response.data;
  },
};
