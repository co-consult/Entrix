export interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  phone?: string
  avatar?: string
  email_verified?: boolean
  is_active: boolean
  last_login?: string
  created_at: string
  updated_at: string
  roles?: UserRole[]
  profile?: UserProfile
  organizer_id?: string
}

export interface UserRole {
  id: string
  user_id: string
  role_id: string
  assigned_at: Date
  role: Role
}

export interface Role {
  id: string
  name: string
  description?: string
  permissions: Permission[]
}

export interface Permission {
  id: string
  name: string
  resource: string
  action: string
}

export interface UserProfile {
  id: string
  user_id: string
  date_of_birth?: Date
  gender?: "MALE" | "FEMALE" | "OTHER" | "PREFER_NOT_TO_SAY"
  city?: string
  country: string
  language: string
  id_type?: "IDENTITY_CARD" | "PASSPORT" | "DRIVING_LICENSE"
  id_number?: string
  emergency_contact?: {
    name: string
    phone: string
    relationship: string
  }
  preferences?: {
    notifications: boolean
    marketing: boolean
    language: string
  }
}

export interface Event {
  id: string
  name: string
  description: string
  short_description?: string
  status: "DRAFT" | "PUBLISHED" | "LIVE" | "FINISHED" | "CANCELLED"
  scheduled_start: string
  scheduled_end: string
  actual_start?: string
  actual_end?: string
  max_capacity?: number
  current_capacity: number
  is_public: boolean
  requires_approval: boolean
  organizer_id: string
  venue_id: string
  category_id?: string
  tags?: string[]
  images?: string[]
  created_at: string
  updated_at: string
  organizer?: Organizer
  venue?: Venue
  category?: EventCategory
  tickets?: Ticket[]
  participants?: EventParticipant[]
  ticket_types?: TicketType[]
}

export interface Organizer {
  id: string
  name: string
  type: "INDIVIDUAL" | "COMPANY" | "ASSOCIATION" | "GOVERNMENT"
  description?: string
  contact_email: string
  contact_phone?: string
  website?: string
  logo?: string
  is_verified: boolean
  verification_status: "PENDING" | "APPROVED" | "REJECTED"
  user_id: string
  created_at: Date
  updated_at: Date
  user?: User
  events?: Event[]
  venues?: Venue[]
}

export interface Venue {
  id: string
  name: string
  description?: string
  address: string
  city: string
  country: string
  postal_code?: string
  latitude?: number
  longitude?: number
  capacity: number
  type: "INDOOR" | "OUTDOOR" | "HYBRID"
  amenities?: string[]
  images?: string[]
  contact_email?: string
  contact_phone?: string
  is_active: boolean
  organizer_id?: string
  created_at: Date
  updated_at: Date
  organizer?: Organizer
  events?: Event[]
  zones?: VenueZone[]
}

export interface VenueZone {
  id: string
  venue_id: string
  name: string
  description?: string
  capacity: number
  type: "SEATING" | "STANDING" | "VIP" | "GENERAL"
  price_multiplier: number
  is_active: boolean
  venue?: Venue
}

export interface EventCategory {
  id: string
  name: string
  description?: string
  icon?: string
  color?: string
  is_active: boolean
  events?: Event[]
}

export interface Ticket {
  id: string
  ticket_number: string
  event_id: string
  user_id: string
  ticket_type_id: string
  order_id?: string
  price_paid: number
  is_active: boolean
  is_used: boolean
  used_at?: string
  qr_code: string
  valid_from: string
  valid_until: string
  created_at: string
  updated_at: string
  event?: Event
  user?: User
  ticket_type?: TicketType
  order?: Order
}

export interface TicketType {
  id: string
  event_id: string
  name: string
  description?: string
  price: number
  quantity: number
  sold_quantity: number
  max_per_order: number
  sale_start: Date
  sale_end: Date
  is_active: boolean
  requires_approval: boolean
  benefits?: string[]
  restrictions?: string[]
  created_at: Date
  updated_at: Date
  event?: Event
  tickets?: Ticket[]
}

export interface Order {
  id: string
  order_number: string
  user_id: string
  event_id?: string
  status: "DRAFT" | "PENDING" | "CONFIRMED" | "PROCESSING" | "COMPLETED" | "CANCELLED" | "REFUNDED" | "FAILED"
  subtotal_amount: number
  discount_amount: number
  processing_fee: number
  total_amount: number
  currency: string
  purchase_channel?: string
  guest_name?: string
  guest_email?: string
  guest_phone?: string
  tax_amount?: number
  notes?: string
  created_at: string
  updated_at: string
  user?: User
  event?: Event
  items?: OrderItem[]
  payments?: Payment[]
}

export interface OrderItem {
  id: string
  order_id: string
  ticket_type_id?: string
  item_type?: string
  item_name?: string
  quantity: number
  unit_price: number
  total_price: number
  discount_amount?: number
  order?: Order
  ticket_type?: TicketType
}

export interface Payment {
  id: string
  order_id: string
  payment_method_id: string
  amount: number
  currency: string
  status: "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED"
  payment_date?: Date
  transaction_id?: string
  gateway_response?: any
  created_at: Date
  updated_at: Date
  order?: Order
  payment_method?: PaymentMethod
}

export interface PaymentMethod {
  id: string
  name: string
  type: "CREDIT_CARD" | "BANK_TRANSFER" | "MOBILE_PAYMENT" | "CASH"
  is_active: boolean
  config?: any
  payments?: Payment[]
}

export interface Subscription {
  id: string
  subscription_number: string
  order_number?: string
  user_id: string
  organizer_id: string
  subscription_plan_id: string
  status: "ACTIVE" | "SUSPENDED" | "EXPIRED" | "CANCELLED"
  start_date: string
  end_date?: string
  auto_renew: boolean
  created_at: string
  updated_at: string
  metadata?: {
    order_number?: string
    created_by?: User
    [key: string]: any
  }
  created_by?: User
  user?: User
  organizer?: Organizer
  subscription_plan?: SubscriptionPlan
  sellerInfo?: {
    id: string
    name: string
    email: string
  }
}

export interface SubscriptionPlan {
  id: string
  organizer_id: string
  name: string
  description: string
  type: "VIP" | "FULL_SEASON" | "FLEX" | "PREMIUM"
  price: number
  currency: string
  duration: number // in days
  max_events?: number
  benefits?: string[]
  is_active: boolean
  created_at: Date
  updated_at: Date
  organizer?: Organizer
  subscriptions?: Subscription[]
  events?: Event[]
  
  // Additional properties from backend
  code?: string
  maxSubscribers?: number
  currentSubscribers?: number
  activeSubscriptions?: number
  availableSlots?: number
  validFrom?: string
  validUntil?: string
  saleStartDate?: string
  saleEndDate?: string
  isCurrentlyOnSale?: boolean
  transferable?: boolean
  maxTransfers?: number
  autoRenew?: boolean
  includesPlayoffs?: boolean
  priorityBooking?: boolean
  restrictions?: string[]
  zones?: any[]
  includedEvents?: any[]
  metadata?: any
}

export interface EventParticipant {
  id: string
  event_id: string
  user_id: string
  role: "ATTENDEE" | "SPEAKER" | "STAFF" | "VOLUNTEER" | "VIP"
  status: "REGISTERED" | "CONFIRMED" | "ATTENDED" | "NO_SHOW" | "CANCELLED"
  registered_at: Date
  confirmed_at?: Date
  attended_at?: Date
  notes?: string
  event?: Event
  user?: User
}

// Dashboard Stats Types
export interface DashboardStats {
  total_events: number
  total_tickets: number
  total_revenue: number
  upcoming_events: number
}

export interface OrganizerStats {
  active_events: number
  total_events: number
  sold_tickets: number
  total_tickets: number
  total_revenue: number
  total_participants: number
  average_attendance: number
}

export interface AdminStats {
  total_users: number
  total_events: number
  total_organizers: number
  total_revenue: number
  monthly_growth: number
  system_health: "GOOD" | "WARNING" | "CRITICAL"
}

// API Response Types
export interface ApiResponse<T> {
  data: T
  message?: string
  success: boolean
  pagination?: {
    page: number
    limit: number
    total: number
    total_pages: number
  }
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    total_pages: number
  }
}

// Form Types
export interface LoginForm {
  email: string
  password: string
}

export interface RegisterForm {
  first_name: string
  last_name: string
  email: string
  phone?: string
  password: string
  confirm_password: string
  country: string
  accept_terms: boolean
  accept_marketing: boolean
}

export interface EventForm {
  name: string
  description: string
  short_description?: string
  scheduled_start: Date
  scheduled_end: Date
  max_capacity?: number
  is_public: boolean
  requires_approval: boolean
  venue_id: string
  category_id?: string
  tags?: string[]
  images?: string[]
}

export interface VenueForm {
  name: string
  description?: string
  address: string
  city: string
  country: string
  postal_code?: string
  capacity: number
  type: "INDOOR" | "OUTDOOR" | "HYBRID"
  amenities?: string[]
  contact_email?: string
  contact_phone?: string
}

// Filter Types
export interface EventFilters {
  search?: string
  city?: string
  status?: string
  category_id?: string
  organizer_id?: string
  start_date?: Date
  end_date?: Date
  page?: number
  limit?: number
}

export interface UserFilters {
  search?: string
  role?: string
  is_active?: boolean
  page?: number
  limit?: number
}

// QR Code Types
export enum QRCodeType {
  SEAT = 'SEAT',
  ENTRY = 'ENTRY',
  VIP = 'VIP',
  STAFF = 'STAFF',
  GENERAL = 'GENERAL'
}

export enum QRCodeStatus {
  AVAILABLE = 'AVAILABLE',
  ASSIGNED = 'ASSIGNED',
  RESERVED = 'RESERVED',
  DISABLED = 'DISABLED',
  USED = 'USED',
  EXPIRED = 'EXPIRED',
  DAMAGED = 'DAMAGED',
  LOST = 'LOST'
}

export interface QRCode {
  id: string;
  code: string;
  type: QRCodeType;
  status: QRCodeStatus;
  seatNumber?: string;
  venueId?: string;
  eventId?: string;
  subscriptionId?: string;
  assignedTo?: string;
  assignedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any>;
  venue?: Venue;
  event?: Event;
  subscription?: Subscription;
  assignedUser?: User;
  subscriptionInfo?: {
    id: string;
    subscription_number: string;
    status: string;
    start_date: Date;
    end_date: Date;
    price_paid: number;
    currency: string;
    user: {
      id: string;
      first_name: string;
      last_name: string;
      email: string;
    } | null;
    subscription_plan: {
      id: string;
      name: string;
      type: string;
    } | null;
  } | null;
}

export interface QRCodeFilters {
  type?: QRCodeType;
  status?: QRCodeStatus;
  venueId?: string;
  eventId?: string;
  subscriptionId?: string;
  assignedTo?: string;
  seatNumber?: string;
  subscriptionPlanId?: string;
  season?: string;
  createdAfter?: Date;
  createdBefore?: Date;
  assignedAfter?: Date;
  assignedBefore?: Date;
}

export interface QRCodeStats {
  totalQRCodes: number;
  availableQRCodes: number;
  assignedQRCodes: number;
  reservedQRCodes?: number;
  disabledQRCodes?: number;
  usedQRCodes: number;
  expiredQRCodes: number;
  damagedQRCodes: number;
  lostQRCodes: number;
  qrCodesByType: QRCodeTypeStats[];
  qrCodesByStatus: QRCodeStatusStats[];
  qrCodesByVenue: QRCodeVenueStats[];
  assignmentTrend: AssignmentTrendData[];
}

export interface QRCodeTypeStats {
  type: QRCodeType;
  count: number;
  percentage: number;
}

export interface QRCodeStatusStats {
  status: QRCodeStatus;
  count: number;
  percentage: number;
}

export interface QRCodeVenueStats {
  venueId: string;
  venueName: string;
  count: number;
  percentage: number;
}

export interface AssignmentTrendData {
  date: string;
  assigned: number;
  used: number;
}

// TODO: Review all interfaces and align with backend models (refer to backend code/docs/SQL for any unclear fields)
