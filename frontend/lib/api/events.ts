import { apiClient } from "../api-client"
import type { Event, ApiResponse, PaginatedResponse } from "@/types"

// Define CreateEventForm type locally if not available
type CreateEventForm = {
  name: string;
  description?: string;
  type: string;
  category: string;
  venueId: string;
  scheduledStart: string;
  scheduledEnd: string;
  capacityTotal?: number;
  ticketSalesStart?: string;
  ticketSalesEnd?: string;
  featuredImageUrl?: string;
  tags?: string[];
  metadata?: any;
}

// Define the actual backend response format
type EventsResponse = {
  events: Event[];
  total: number;
}

export const eventsApi = {
  // Get all events with pagination
  getEvents: async (page = 1, limit = 10, filters?: any, admin?: boolean): Promise<EventsResponse> => {
    const path = admin ? "/events/admin" : "/events";
    const response = await apiClient.get(path, {
      params: { page, limit, ...filters },
    })
    return response.data
  },

  // Get single event by ID
  getEvent: async (id: string): Promise<ApiResponse<Event>> => {
    const response = await apiClient.get(`/events/${id}`)
    return response.data
  },

  // Create new event
  createEvent: async (data: CreateEventForm): Promise<ApiResponse<Event>> => {
    const response = await apiClient.post("/events", data)
    return response.data
  },

  // Update event
  updateEvent: async (id: string, data: Partial<CreateEventForm>): Promise<ApiResponse<Event>> => {
    const response = await apiClient.put(`/events/${id}`, data)
    return response.data
  },

  // Update event status
  updateEventStatus: async (id: string, status: string): Promise<ApiResponse<Event>> => {
    const response = await apiClient.put(`/events/${id}/status`, { status })
    return response.data
  },

  // Delete event
  deleteEvent: async (id: string): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete(`/events/${id}`)
    return response.data
  },

  // Get events by organizer
  getOrganizerEvents: async (organizerId: string): Promise<ApiResponse<Event[]>> => {
    const response = await apiClient.get(`/events/organizer/${organizerId}`)
    return response.data
  },

  // Get my events (as organizer)
  getMyEvents: async (filters?: any): Promise<ApiResponse<Event[]>> => {
    const response = await apiClient.get("/events/my-events", { params: filters })
    return response.data
  },

  // Get event stats
  getEventStats: async (id: string): Promise<ApiResponse<any>> => {
    const response = await apiClient.get(`/events/${id}/stats`)
    return response.data
  },

  // Get event participants
  getEventParticipants: async (id: string, filters?: any): Promise<ApiResponse<any[]>> => {
    const response = await apiClient.get(`/events/${id}/participants`, { params: filters })
    return response.data
  },

  // Get event tickets
  getEventTickets: async (id: string): Promise<ApiResponse<any[]>> => {
    const response = await apiClient.get(`/events/${id}/tickets`)
    return response.data
  },

  // Duplicate event
  duplicateEvent: async (id: string, data?: any): Promise<ApiResponse<Event>> => {
    const response = await apiClient.post(`/events/${id}/duplicate`, data || {})
    return response.data
  },

  // Get event analytics
  getEventAnalytics: async (id: string, timeRange?: string): Promise<ApiResponse<any>> => {
    const params = timeRange ? { timeRange } : {}
    const response = await apiClient.get(`/events/${id}/analytics`, { params })
    return response.data
  },

  // Event registration
  registerForEvent: async (id: string, data?: any): Promise<ApiResponse<any>> => {
    const response = await apiClient.post(`/events/${id}/register`, data || {})
    return response.data
  },

  unregisterFromEvent: async (id: string): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete(`/events/${id}/register`)
    return response.data
  },

  // Event favorites
  favoriteEvent: async (id: string): Promise<ApiResponse<void>> => {
    const response = await apiClient.post(`/events/${id}/favorite`)
    return response.data
  },

  unfavoriteEvent: async (id: string): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete(`/events/${id}/favorite`)
    return response.data
  },

  getFavoriteEvents: async (): Promise<ApiResponse<Event[]>> => {
    const response = await apiClient.get("/events/favorites")
    return response.data
  },

  // Event search and discovery
  searchEvents: async (query: string, filters?: any): Promise<ApiResponse<Event[]>> => {
    const response = await apiClient.get("/events/search", {
      params: { query, ...filters }
    })
    return response.data
  },

  getRecommendedEvents: async (userId?: string): Promise<ApiResponse<Event[]>> => {
    const params = userId ? { userId } : {}
    const response = await apiClient.get("/events/recommended", { params })
    return response.data
  },

  getTrendingEvents: async (timeRange?: string): Promise<ApiResponse<Event[]>> => {
    const params = timeRange ? { timeRange } : {}
    const response = await apiClient.get("/events/trending", { params })
    return response.data
  },

  // Event categories and tags
  getEventCategories: async (): Promise<ApiResponse<any[]>> => {
    const response = await apiClient.get("/events/categories")
    return response.data
  },

  getEventTags: async (): Promise<ApiResponse<any[]>> => {
    const response = await apiClient.get("/events/tags")
    return response.data
  },

  // Event groups
  getEventGroup: async (id: string): Promise<ApiResponse<any>> => {
    const response = await apiClient.get(`/events/groups/${id}`)
    return response.data
  },

  getEventGroups: async (filters?: any): Promise<ApiResponse<any[]>> => {
    const response = await apiClient.get("/events/groups", { params: filters })
    return response.data
  },

  createEventGroup: async (data: any): Promise<ApiResponse<any>> => {
    const response = await apiClient.post("/events/groups", data)
    return response.data
  },

  updateEventGroup: async (id: string, data: any): Promise<ApiResponse<any>> => {
    const response = await apiClient.put(`/events/groups/${id}`, data)
    return response.data
  },

  deleteEventGroup: async (id: string): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete(`/events/groups/${id}`)
    return response.data
  },

  // Event export
  exportEvent: async (id: string, format: string = 'json'): Promise<any> => {
    const response = await apiClient.get(`/events/${id}/export`, {
      params: { format },
      responseType: 'blob'
    })
    return response.data
  },

  exportEventParticipants: async (id: string, format: string = 'csv'): Promise<any> => {
    const response = await apiClient.get(`/events/${id}/participants/export`, {
      params: { format },
      responseType: 'blob'
    })
    return response.data
  },
}
