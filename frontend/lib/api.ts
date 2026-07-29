class ApiClient {
  private baseURL: string
  private token: string | null = null

  constructor() {
    // Use local development URL when running locally, otherwise use the production URL
    const isDevelopment = process.env.NODE_ENV === 'development' || 
                         typeof window !== 'undefined' && window.location.hostname === 'localhost'
    this.baseURL = isDevelopment 
      ? "http://localhost:3000/api/v1"
      : (process.env.NEXT_PUBLIC_API_URL || "https://preprod.css.cloud.ms2tech.fr/api/v1")
    
    console.log('API Client initialized with baseURL:', this.baseURL)
  }

  setToken(token: string) {
    this.token = token
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`
    console.log('Making API request to:', url)

    // If no token is set, try to get it from the session
    let token = this.token
    if (!token && typeof window !== 'undefined') {
      try {
        const sessionResponse = await fetch('/api/auth/session')
        const session = await sessionResponse.json()
        token = session?.user?.access_token || null
        if (token) {
          this.token = token
        }
      } catch (error) {
        console.warn('Failed to get token from session:', error)
      }
    }

    const config: RequestInit = {
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    }

    const response = await fetch(url, config)
    console.log('API response status:', response.status, response.statusText)

    if (!response.ok) {
      // Try to parse error JSON, fallback to text, then generic message
      let error: any = { message: `HTTP ${response.status}` };
      try {
        error = await response.json();
      } catch {
        try {
          error = { message: await response.text() };
        } catch {}
      }
      throw new Error(error.message || `HTTP ${response.status}`)
    }

    // Handle 204 No Content or empty body
    if (response.status === 204) return undefined as T;
    const text = await response.text();
    if (!text) return undefined as T;
    const json = JSON.parse(text);
    console.log('API response JSON:', json)
    // Unwrap 'data' if present, otherwise return the whole response
    const result = (json && typeof json === 'object' && 'data' in json) ? json.data : json
    console.log('API response final result:', result)
    return result
  }

  // Auth endpoints
  async login(credentials: { email: string; password: string; rememberMe?: boolean; deviceFingerprint?: string }) {
    return this.request("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    })
  }

  async register(userData: any) {
    return this.request("/auth/register", {
      method: "POST",
      body: JSON.stringify(userData),
    })
  }

  async validatePassword(password: string) {
    return this.request("/auth/validate-password", {
      method: "POST",
      body: JSON.stringify({ password }),
    })
  }

  async logout(allDevices?: boolean) {
    return this.request("/auth/logout", {
      method: "POST",
      body: JSON.stringify({ allDevices }),
    })
  }

  async refreshToken(refreshToken: string) {
    return this.request("/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
    })
  }

  async forgotPassword(email: string) {
    return this.request("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    })
  }

  async resetPassword(token: string, newPassword: string, confirmPassword: string) {
    return this.request("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, newPassword, confirmPassword }),
    })
  }

  async verifyEmail(token: string) {
    return this.request(`/auth/verify-email?token=${encodeURIComponent(token)}`, {
      method: "GET",
    })
  }

  async resendVerificationEmail() {
    return this.request("/auth/resend-verification", {
      method: "POST",
    })
  }

  async getVerificationStatus() {
    return this.request("/auth/verification-status", {
      method: "GET",
    })
  }

  async forceVerifyEmail() {
    return this.request("/auth/force-verify-email", {
      method: "POST",
    })
  }

  // Session Management
  async getCurrentSession() {
    return this.request("/auth/session", {
      method: "GET",
    })
  }

  async getAllSessions() {
    return this.request("/auth/sessions", {
      method: "GET",
    })
  }

  async deleteSession(sessionId: string) {
    return this.request(`/auth/sessions/${sessionId}`, {
      method: "DELETE",
    })
  }

  // MFA endpoints
  async getMfaProviders() {
    return this.request("/auth/mfa/providers", {
      method: "GET",
    })
  }

  async getMfaStatus() {
    return this.request("/auth/mfa/status", {
      method: "GET",
    })
  }

  async setupMfa(data: { provider: string; phoneNumber?: string }) {
    return this.request("/auth/mfa/setup", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async verifyMfa(data: { provider: string; code: string; challengeToken?: string }) {
    return this.request("/auth/mfa/verify", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async toggleMfa(provider: string, enabled: boolean) {
    return this.request(`/auth/mfa/${provider}/toggle`, {
      method: "PUT",
      body: JSON.stringify({ enabled }),
    })
  }

  async deleteMfa(provider: string) {
    return this.request(`/auth/mfa/${provider}`, {
      method: "DELETE",
    })
  }

  async regenerateBackupCodes() {
    return this.request("/auth/mfa/backup-codes/regenerate", {
      method: "POST",
    })
  }

  async getTrustedDevices() {
    return this.request("/auth/mfa/trusted-devices", {
      method: "GET",
    })
  }

  async deleteTrustedDevice(deviceId: string) {
    return this.request(`/auth/mfa/trusted-devices/${deviceId}`, {
      method: "DELETE",
    })
  }

  // User endpoints
  async getUser(userId: string) {
    return this.request(`/users/${userId}`)
  }

  async getMyProfile() {
    return this.request('/users/me')
  }

  async getUserStats() {
    return this.request('/users/stats')
  }

  async exportUsers(format: string) {
    return this.request(`/users/export?format=${format}`, {
      method: "GET"
    })
  }

  async downloadReport(reportId: string, format: string) {
    return this.request(`/reporting/reports/${reportId}/download?format=${format}`)
  }

  async updateUser(userId: string, data: any) {
    return this.request(`/users/${userId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  }

  async updateMyProfile(data: any) {
    return this.request(`/users/me/profile`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  }

  async updateMyPrivacy(data: any) {
    return this.request(`/users/me/privacy`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  }

  async updateMyPreferences(data: any) {
    return this.request(`/users/me/preferences`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  }

  async getUserProfile(userId: string) {
    return this.request(`/users/${userId}/profile`)
  }

  async updateUserProfile(userId: string, data: any) {
    return this.request(`/users/${userId}/profile`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  }

  async getUsers(filters: any = {}) {
    const params = new URLSearchParams(filters)
    return this.request(`/users?${params}`)
  }

  async activateUser(userId: string) {
    return this.request(`/users/${userId}/activate`, {
      method: "POST",
    })
  }

  async deactivateUser(userId: string) {
    return this.request(`/users/${userId}/deactivate`, {
      method: "POST",
    })
  }

  async verifyUser(userId: string) {
    return this.request(`/users/${userId}/verify`, {
      method: "POST",
    })
  }

  async getUserGroups(userId: string) {
    return this.request(`/users/${userId}/groups`)
  }

  async getUserRoles(userId: string) {
    return this.request(`/users/${userId}/roles`)
  }

  async changeUserPassword(userId: string, oldPassword: string, newPassword: string) {
    return this.request(`/users/${userId}/password`, {
      method: "PUT",
      body: JSON.stringify({ oldPassword, newPassword }),
    })
  }

  async deleteUser(userId: string) {
    return this.request(`/users/${userId}`, {
      method: "DELETE",
    })
  }

  // Event endpoints
  async getEvents(filters: any = {}) {
    const params = new URLSearchParams(filters)
    return this.request(`/events?${params}`)
  }

  async getEvent(id: string) {
    return this.request(`/events/${id}`)
  }

  async createEvent(data: any) {
    return this.request("/events", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async updateEvent(id: string, data: any) {
    return this.request(`/events/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  }

  async deleteEvent(id: string) {
    return this.request(`/events/${id}`, {
      method: "DELETE",
    })
  }

  async getEventStats(id: string) {
    return this.request(`/events/${id}/stats`)
  }

  async publishEvent(id: string) {
    return this.request(`/events/${id}/publish`, {
      method: "POST",
    })
  }

  async unpublishEvent(id: string) {
    return this.request(`/events/${id}/unpublish`, {
      method: "POST",
    })
  }

  // Ticket endpoints
  async getTickets(filters: any = {}) {
    const params = new URLSearchParams(filters)
    return this.request(`/tickets?${params}`)
  }

  async getTicket(id: string) {
    return this.request(`/tickets/${id}`)
  }

  async createTicket(data: any) {
    // Use /tickets for ticket creation (purchase logic may be via /orders)
    return this.request("/tickets", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async getTicketTypes() {
    return this.request(`/tickets/ticket-types`)
  }

  // Order endpoints
  async getOrders(filters: any = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });
    return this.request(`/orders?${params.toString()}`)
  }

  async getOrder(id: string) {
    return this.request(`/orders/${id}`)
  }

  async createOrder(data: any) {
    return this.request("/orders", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async updateOrder(id: string, data: any) {
    return this.request(`/orders/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  }

  async deleteOrder(id: string) {
    return this.request(`/orders/${id}`, {
      method: "DELETE",
    })
  }

  async cancelOrder(id: string, reason?: string) {
    return this.request(`/orders/${id}/cancel`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    })
  }

  async refundOrder(id: string, data: any) {
    return this.request(`/orders/${id}/refund`, {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async confirmOrder(id: string) {
    return this.request(`/orders/${id}/confirm`, {
      method: "POST"
    })
  }

  async generateOrderInvoice(id: string) {
    return this.request(`/orders/${id}/invoice`, {
      method: "GET"
    })
  }

  async getOrderItems(orderId: string) {
    return this.request(`/orders/${orderId}/items`)
  }

  async getAllOrderItems(params: any = {}) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    return this.request(`/orders/items${queryString ? `?${queryString}` : ''}`)
  }

  async addOrderItem(orderId: string, data: any) {
    return this.request(`/orders/${orderId}/items`, {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async updateOrderItem(orderId: string, itemId: string, data: any) {
    return this.request(`/orders/${orderId}/items/${itemId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  }

  async removeOrderItem(orderId: string, itemId: string) {
    return this.request(`/orders/${orderId}/items/${itemId}`, {
      method: "DELETE",
    })
  }

  async getOrderPayments(orderId: string) {
    return this.request(`/orders/${orderId}/payments`)
  }

  async getOrderStats(organizerId?: string) {
    // Use provided organizerId or fallback to environment variable or hardcoded default
    const finalOrganizerId = organizerId || process.env.NEXT_PUBLIC_ORGANIZER_ID || 'e219c1e4-2f2e-4719-b2f9-c6ce4d2d8d2e';
    const params = new URLSearchParams({ organizer_id: finalOrganizerId });
    return this.request(`/orders/stats?${params}`)
  }

  async getOrderAnalytics(filters: any = {}) {
    const params = new URLSearchParams(filters)
    return this.request(`/orders/analytics?${params}`)
  }

  async exportOrders(filters: any = {}) {
    const params = new URLSearchParams(filters)
    return this.request(`/orders/export?${params}`, {
      method: "GET",
      headers: {
        "Accept": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      }
    })
  }

  // Duplicate removed: generateOrderInvoice is defined earlier

  // Venue endpoints
  async getVenues(filters: any = {}) {
    const params = new URLSearchParams(filters)
    return this.request(`/venues?${params}`)
  }

  async getVenue(id: string) {
    return this.request(`/venues/${id}`)
  }

  async createVenue(data: any) {
    return this.request("/venues", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async updateVenue(id: string, data: any) {
    return this.request(`/venues/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  }

  async getVenueStats(id: string) {
    return this.request(`/venues/${id}/stats`)
  }

  async deleteVenue(id: string) {
    return this.request(`/venues/${id}`, {
      method: "DELETE",
    })
  }

  // Venue Mapping endpoints
  async getVenueMappings(venueId: string) {
    return this.request(`/venues/${venueId}/mappings`)
  }

  async getVenueMapping(venueId: string, mappingId: string) {
    return this.request(`/venues/${venueId}/mappings/${mappingId}`)
  }

  async createVenueMapping(venueId: string, data: any) {
    return this.request(`/venues/${venueId}/mappings`, {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async updateVenueMapping(venueId: string, mappingId: string, data: any) {
    return this.request(`/venues/${venueId}/mappings/${mappingId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  }

  async deleteVenueMapping(venueId: string, mappingId: string) {
    return this.request(`/venues/${venueId}/mappings/${mappingId}`, {
      method: "DELETE" })
  }

  // Venue Zone endpoints
  async getVenueZones(venueId: string) {
    return this.request(`/venues/${venueId}/zones`)
  }

  async createVenueZone(venueId: string, data: any) {
    return this.request(`/venues/${venueId}/zones`, {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async updateVenueZone(zoneId: string, data: any) {
    return this.request(`/venues/zones/${zoneId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  }

  async deleteVenueZone(zoneId: string) {
    return this.request(`/venues/zones/${zoneId}`, {
      method: "DELETE" })
  }

  // Venue Amenity endpoints
  async getVenueAmenities(venueId: string) {
    return this.request(`/venues/${venueId}/amenities`)
  }

  async createVenueAmenity(venueId: string, data: any) {
    return this.request(`/venues/${venueId}/amenities`, {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async updateVenueAmenity(amenityId: string, data: any) {
    return this.request(`/venues/amenities/${amenityId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  }

  async deleteVenueAmenity(amenityId: string) {
    return this.request(`/venues/amenities/${amenityId}`, {
      method: "DELETE" })
  }

  // Subscription endpoints
  async getSubscriptions(filters: any = {}) {
    const params = new URLSearchParams(filters)
    const url = `${this.baseURL}/subscription-sales/subscriptions?${params}`

    const config: RequestInit = {
      headers: {
        "Content-Type": "application/json",
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
      },
    }

    const response = await fetch(url, config)

    if (!response.ok) {
      let error: any = { message: `HTTP ${response.status}` };
      try {
        error = await response.json();
      } catch {
        try {
          error = { message: await response.text() };
        } catch {}
      }
      throw new Error(error.message || `HTTP ${response.status}`)
    }

    const text = await response.text();
    if (!text) return undefined;
    const json = JSON.parse(text);
    // Return the full response for pagination support
    return json;
  }

  async getSubscriptionsStats(filters: any = {}) {
    const params = new URLSearchParams(filters)
    return this.request(`/subscription-sales/stats/subscriptions?${params}`)
  }

  async getFilterOptions(filters: Record<string, string> = {}) {
    const timestamp = Date.now();
    const params = new URLSearchParams({ _t: timestamp.toString(), ...filters });
    return this.request(`/subscription-sales/filter-options?${params}`)
  }

  async getSubscription(id: string) {
    return this.request(`/subscription-sales/subscriptions/${id}`)
  }

  async getSubscriptionPlans(queryString?: string) {
    const url = queryString ? `/subscription-sales/plans/available${queryString}` : "/subscription-sales/plans/available";
    return this.request(url)
  }

  async createSubscription(data: any) {
    return this.request("/subscriptions", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async createSubscriptionPlan(data: any) {
    return this.request("/subscriptions/plans", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async getAllPlansByOrganizer(organizerId?: string) {
    // Use provided organizerId or fallback to environment variable
    const finalOrganizerId = organizerId || process.env.NEXT_PUBLIC_ORGANIZER_ID || 'e219c1e4-2f2e-4719-b2f9-c6ce4d2d8d2e';
    // Add cache-busting timestamp to prevent stale data
    const timestamp = Date.now();
    return this.request(`/subscription-sales/organizers/${finalOrganizerId}/plans?_t=${timestamp}`)
  }

  async getAvailablePlansForSales() {
    return this.request("/subscription-sales/plans/available")
  }

  async getQRCodeBySerialNumber(serialNumber: string, planId?: string) {
    const url = planId
      ? `/subscription-sales/qr-code-by-serial/${serialNumber}?planId=${planId}`
      : `/subscription-sales/qr-code-by-serial/${serialNumber}`;
    return this.request(url)
  }

  async getQRCodeInfo(qrCode: string) {
    return this.request(`/subscription-sales/qr-code-info/${qrCode}`)
  }

  async createDirectSale(saleData: any) {
    return this.request("/subscription-sales/direct-sale", {
      method: "POST",
      body: JSON.stringify(saleData),
    })
  }

  async activateSubscription(id: string) {
    return this.request(`/subscription-sales/subscriptions/${id}/activate`, {
      method: "POST",
    })
  }

  async deactivateSubscription(id: string, suspensionReason?: string) {
    return this.request(`/subscription-sales/subscriptions/${id}/deactivate`, {
      method: "POST",
      body: JSON.stringify({ suspensionReason }),
    })
  }

  async getSubscriptionStats(organizerId?: string) {
    // Use provided organizerId or fallback to environment variable
    const finalOrganizerId = organizerId || process.env.NEXT_PUBLIC_ORGANIZER_ID || 'e219c1e4-2f2e-4719-b2f9-c6ce4d2d8d2e';
    const url = `/subscription-sales/subscriptions/stats?organizerId=${finalOrganizerId}`;
    return this.request(url)
  }

  async searchUsers(query: string, limit: number = 10) {
    return this.request(`/users?query=${encodeURIComponent(query)}&limit=${limit}`)
  }

  // Stats endpoints
  async getDashboardStats() {
    return this.request("/stats/dashboard")
  }



  async getAdminStats() {
    return this.request("/admin/stats")
  }

  // Organizer endpoints
  async getOrganizers(filters: any = {}) {
    const params = new URLSearchParams(filters)
    return this.request(`/organizers?${params}`)
  }

  async getOrganizer(id: string) {
    return this.request(`/organizers/${id}`)
  }

  async getOrganizerStats(id: string) {
    return this.request(`/organizers/${id}/comprehensive-stats`)
  }

  async updateOrganizer(id: string, data: any) {
    return this.request(`/organizers/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  }

  async deleteOrganizer(id: string) {
    return this.request(`/organizers/${id}`, {
      method: "DELETE",
    })
  }

  // Security endpoints
  async getSecurityEvents(filters: any = {}) {
    const params = new URLSearchParams(filters)
    return this.request(`/security/events?${params}`)
  }

  async getSecurityStats() {
    return this.request("/security/stats")
  }

  async getBlacklist(filters: any = {}) {
    const params = new URLSearchParams(filters)
    return this.request(`/security/blacklist?${params}`)
  }

  async addToBlacklist(data: any) {
    return this.request("/security/blacklist", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async removeFromBlacklist(id: string) {
    return this.request(`/security/blacklist/${id}`, {
      method: "DELETE",
    })
  }

  // Audit log endpoints
  async getAuditLogs(filters: any = {}) {
    const params = new URLSearchParams(filters)
    return this.request(`/audit-logs?${params}`)
  }

  async getAuditStats(timeRange?: any) {
    const params = timeRange ? new URLSearchParams(timeRange) : ""
    return this.request(`/audit-logs/stats?${params}`)
  }

  async exportAuditLogs(format: string, filters?: any) {
    const params = new URLSearchParams({ format, ...filters })
    return this.request(`/audit-logs/export?${params}`)
  }





  // Reporting endpoints
  async getReportingSummary() {
    return this.request("/reporting/summary")
  }

  async generateEventReport(eventId: string, startDate: string, endDate: string) {
    return this.request(`/reporting/events/${eventId}`, {
      method: "POST",
      body: JSON.stringify({ startDate, endDate }),
    })
  }

  async getVenueOccupancyRate(venueId: string, startDate: string, endDate: string) {
    return this.request(`/reporting/venues/${venueId}/occupancy`, {
      method: "POST",
      body: JSON.stringify({ startDate, endDate }),
    })
  }

  // Commission endpoints
  async getCommissions(filters: any = {}) {
    const params = new URLSearchParams(filters)
    return this.request(`/commissions?${params}`)
  }

  async getCommissionStats(organizerId?: string) {
    // Use provided organizerId or fallback to environment variable
    const finalOrganizerId = organizerId || process.env.NEXT_PUBLIC_ORGANIZER_ID || 'e219c1e4-2f2e-4719-b2f9-c6ce4d2d8d2e';
    const params = new URLSearchParams({ organizer_id: finalOrganizerId });
    return this.request(`/commissions/stats?${params}`)
  }



  // Payment endpoints
  async getPayments(filters: any = {}) {
    const params = new URLSearchParams(filters)
    return this.request(`/payments?${params}`)
  }

  async getPaymentStats() {
    return this.request("/payments/stats")
  }

  // Notification endpoints
  async getNotifications(filters: any = {}) {
    const params = new URLSearchParams(filters)
    return this.request(`/notifications?${params}`)
  }

  async getAllNotificationStats() {
    return this.request("/notifications/stats/all")
  }

  // Webhook endpoints
  async getWebhooks(filters: any = {}) {
    const params = new URLSearchParams(filters)
    return this.request(`/webhooks?${params}`)
  }

  async getWebhookStats() {
    return this.request("/webhooks/stats")
  }

  // Groups endpoints - Enhanced to match backend
  async getGroups(filters: any = {}) {
    const params = new URLSearchParams(filters)
    return this.request(`/groups?${params}`)
  }

  async getMyGroups(filters: any = {}) {
    const params = new URLSearchParams(filters)
    return this.request(`/groups/my-groups?${params}`)
  }

  async getPublicGroups(filters: any = {}) {
    const params = new URLSearchParams(filters)
    return this.request(`/groups/public?${params}`)
  }

  async getGroup(id: string) {
    return this.request(`/groups/${id}`)
  }

  async getGroupByCode(code: string) {
    return this.request(`/groups/code/${code}`)
  }

  async getGroupStats(id: string) {
    return this.request(`/groups/${id}/stats`)
  }

  async createGroup(data: any) {
    return this.request(`/groups`, {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async updateGroup(id: string, data: any) {
    return this.request(`/groups/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  }

  async addGroupMember(groupId: string, userId: string, role?: string) {
    return this.request(`/groups/${groupId}/members`, {
      method: "POST",
      body: JSON.stringify({ userId, role }),
    })
  }

  async removeGroupMember(groupId: string, userId: string) {
    return this.request(`/groups/${groupId}/members/${userId}`, {
      method: "DELETE",
    })
  }

  async updateMemberRole(groupId: string, userId: string, newRole: string) {
    return this.request(`/groups/${groupId}/members/${userId}/role`, {
      method: "PUT",
      body: JSON.stringify({ newRole }),
    })
  }

  async updateMemberPermissions(groupId: string, userId: string, permissions: any) {
    return this.request(`/groups/${groupId}/members/${userId}/permissions`, {
      method: "PUT",
      body: JSON.stringify({ permissions }),
    })
  }

  async inviteToGroup(groupId: string, data: any) {
    return this.request(`/groups/${groupId}/invite`, {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async checkGroupPermissions(groupId: string, userId: string, permission?: string) {
    const params = permission ? new URLSearchParams({ permission }) : ""
    return this.request(`/groups/${groupId}/permissions/${userId}?${params}`)
  }

  async canPerformGroupAction(groupId: string, userId: string, action: string) {
    return this.request(`/groups/${groupId}/actions/${userId}/${action}`)
  }

  async deleteGroup(id: string) {
    return this.request(`/groups/${id}`, {
      method: "DELETE",
    })
  }

  // Profiles endpoints - New module
  async createProfile(userId: string, data: any) {
    return this.request(`/profiles`, {
      method: "POST",
      body: JSON.stringify({ ...data, userId }),
    })
  }

  async getProfileByUserId(userId: string) {
    return this.request(`/profiles/user/${userId}`)
  }

  async getProfileCompletion(userId: string) {
    return this.request(`/profiles/user/${userId}/completion`)
  }

  async updateProfilePreferences(userId: string, data: any) {
    return this.request(`/profiles/user/${userId}/preferences`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  }

  async deleteProfile(userId: string) {
    return this.request(`/profiles/user/${userId}`, {
      method: "DELETE",
    })
  }

  async getAllProfiles(filters: any = {}) {
    const params = new URLSearchParams(filters)
    return this.request(`/profiles?${params}`)
  }

  // Invitations endpoints - New module
  async createInvitation(data: any) {
    return this.request(`/invitations`, {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async createBulkInvitations(data: any) {
    return this.request(`/invitations/bulk`, {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async getInvitationByToken(token: string) {
    return this.request(`/invitations/token/${token}`)
  }

  async acceptInvitation(token: string, data?: any) {
    return this.request(`/invitations/accept/${token}`, {
      method: "POST",
      body: JSON.stringify(data || {}),
    })
  }

  async declineInvitation(id: string, reason?: string) {
    return this.request(`/invitations/decline/${id}`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    })
  }

  // Anonymous users endpoints - New module
  async createAnonymousUser(data: any) {
    return this.request(`/anonymous`, {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async getAnonymousByEmail(email: string) {
    return this.request(`/anonymous/email/${encodeURIComponent(email)}`)
  }

  async getAnonymousOnboarding(key: string) {
    return this.request(`/anonymous/onboarding/${key}`)
  }

  async convertAnonymousUser(data: any) {
    return this.request(`/anonymous/convert`, {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async validateAnonymousKey(key: string) {
    return this.request(`/anonymous/validate/${key}`)
  }

  async generateAnonymousKey(data: any) {
    return this.request(`/anonymous/generate-key`, {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async applyAnonymousIncentive(data: any) {
    return this.request(`/anonymous/apply-incentive`, {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async getAnonymousConversionStats() {
    return this.request(`/anonymous/stats/conversion`)
  }

  async getAnonymousGeneralStats() {
    return this.request(`/anonymous/stats/general`)
  }

  // ============================================================================
  // ACCESS CONTROL LOGS ENDPOINTS
  // ============================================================================

  // Access control logs
  async getAccessLogs(filters: any = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });
    
    console.log('Access logs filters:', filters);
    console.log('Access logs params:', params.toString());
    
    const response = await this.request(`/access-control/logs?${params.toString()}`);
    console.log('Access logs response:', response);
    return response;
  }

  async getAccessLogById(id: string) {
    const response = await this.request(`/access-control/logs/${id}`);
    return response;
  }

  async getAccessAnalytics(filters: any = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });
    
    const response = await this.request(`/access-control/analytics?${params.toString()}`);
    return response;
  }

  async getDenialAnalysis(filters: any = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });
    
    const response = await this.request(`/access-control/denial-analysis?${params.toString()}`);
    return response;
  }

}

const apiClient = new ApiClient()
export default apiClient

