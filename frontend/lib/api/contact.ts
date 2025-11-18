import { apiClient } from "../api-client";

export const contactApi = {
  // Public: send a contact request
  sendContactRequest: async (data: { name: string; email: string; subject: string; message: string }) => {
    const response = await apiClient.post("/contact-requests", data);
    return response.data;
  },

  // Admin: get all contact requests
  getContactRequests: async () => {
    const response = await apiClient.get("/admin/contact-requests");
    return response.data;
  },

  // Admin: get a single contact request
  getContactRequest: async (id: string) => {
    const response = await apiClient.get(`/admin/contact-requests/${id}`);
    return response.data;
  },

  // Admin: update a contact request (status/response)
  updateContactRequest: async (id: string, data: { status?: string; response?: string }) => {
    const response = await apiClient.patch(`/admin/contact-requests/${id}`, data);
    return response.data;
  },

  // Admin: delete a contact request
  deleteContactRequest: async (id: string) => {
    const response = await apiClient.delete(`/admin/contact-requests/${id}`);
    return response.data;
  },
}; 