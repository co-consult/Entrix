// src/modules/qr-codes/interfaces/qr-code.interface.ts

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
  subscription?: {
    subscription_plan: {
      id: string;
      name: string;
      code?: string;
    };
  };
  assignedUser?: {
    first_name: string;
    last_name: string;
    email: string;
  };
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

export interface CreateQRCodeData {
  code: string;
  type: QRCodeType;
  seatNumber?: string;
  venueId?: string;
  eventId?: string;
  metadata?: Record<string, any>;
}

export interface UpdateQRCodeData {
  code?: string;
  type?: QRCodeType;
  status?: QRCodeStatus;
  seatNumber?: string;
  venueId?: string;
  eventId?: string;
  subscriptionId?: string;
  assignedTo?: string;
  assignedAt?: Date;
  metadata?: Record<string, any>;
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

export interface QRCodeSearchParams {
  query?: string;
  filters?: QRCodeFilters;
  pagination?: PaginationParams;
  sorting?: SortingParams;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface SortingParams {
  field: string;
  order: 'asc' | 'desc';
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

export interface QRCodeAssignment {
  qrCodeId: string;
  subscriptionId: string;
  assignedTo: string;
  assignedAt: Date;
  seatNumber?: string;
  eventId?: string;
  venueId?: string;
}

export interface QRCodeUsage {
  qrCodeId: string;
  usedAt: Date;
  usedBy: string;
  location?: string;
  deviceInfo?: string;
  metadata?: Record<string, any>;
} 