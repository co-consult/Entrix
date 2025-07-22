// src/modules/venues/interfaces/venues.interface.ts
/**
 * Interfaces pour le module Venues
 * 
 * @author Entrix Development Team
 * @version 1.0.0
 */

import { 
  venues, 
  venue_mappings, 
  venue_zones, 
  access_points,
  mapping_type,
  zone_type,
  zone_category,
  access_type,
  security_level,
  amenity_category 
} from '@prisma/client';

// ================================
// BASE TYPES
// ================================

export type VenueSortField = 'name' | 'city' | 'max_capacity' | 'created_at' | 'updated_at';
export type MappingSortField = 'name' | 'mapping_type' | 'effective_capacity' | 'created_at' | 'updated_at';
export type ZoneSortField = 'name' | 'zone_type' | 'category' | 'capacity' | 'base_price' | 'level' | 'created_at';
export type SortDirection = 'asc' | 'desc';

// ================================
// COORDINATE TYPES
// ================================

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface BoundingBox {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface GeoSearchParams {
  latitude: number;
  longitude: number;
  radiusKm: number;
}

// ================================
// METADATA TYPES
// ================================

export interface VenueMetadata {
  construction_year?: number;
  renovation_year?: number;
  architect?: string;
  capacity_history?: Array<{
    year: number;
    capacity: number;
    reason?: string;
  }>;
  notable_events?: Array<{
    date: string;
    name: string;
    attendance?: number;
  }>;
  technical_specs?: {
    sound_system?: string;
    lighting_system?: string;
    screen_size?: string;
    pitch_dimensions?: string;
  };
  safety_certifications?: string[];
  sustainability_features?: string[];
  [key: string]: any;
}

export interface MappingMetadata {
  configuration_notes?: string;
  setup_time_minutes?: number;
  breakdown_time_minutes?: number;
  required_staff?: number;
  technical_requirements?: string[];
  safety_considerations?: string[];
  weather_dependencies?: string[];
  [key: string]: any;
}

export interface ZoneMetadata {
  view_quality?: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'OBSTRUCTED';
  noise_level?: 'QUIET' | 'MODERATE' | 'LOUD';
  sun_exposure?: 'FULL_SUN' | 'PARTIAL_SUN' | 'SHADE';
  entry_points?: string[];
  exit_points?: string[];
  nearest_facilities?: string[];
  special_features?: string[];
  [key: string]: any;
}

export interface AccessPointMetadata {
  queue_capacity?: number;
  processing_rate_per_minute?: number;
  staffing_requirements?: number;
  equipment_needed?: string[];
  peak_usage_times?: string[];
  accessibility_features?: string[];
  [key: string]: any;
}

// ================================
// OPERATING HOURS
// ================================

export interface OperatingHours {
  monday?: DaySchedule;
  tuesday?: DaySchedule;
  wednesday?: DaySchedule;
  thursday?: DaySchedule;
  friday?: DaySchedule;
  saturday?: DaySchedule;
  sunday?: DaySchedule;
}

export interface DaySchedule {
  open: string; // Format: "HH:mm"
  close: string; // Format: "HH:mm"
  breaks?: Array<{
    start: string;
    end: string;
    reason?: string;
  }>;
}

// ================================
// EXTENDED VENUE TYPES
// ================================

export interface VenueWithRelations extends venues {
  mappings?: venue_mappings[];
  defaultMapping?: venue_mappings;
  primaryOwner?: { id: string; name: string; };
  primaryManager?: { id: string; name: string; };
  totalEvents?: number;
  avgRating?: number;
  distance?: number; // For geo queries
}

export interface MappingWithRelations extends venue_mappings {
  venue?: venues;
  zones?: venue_zones[];
  accessPoints?: access_points[];
  totalCapacity?: number; // Sum of all zones
  activeZones?: number;
  activeAccessPoints?: number;
}

export interface ZoneWithRelations extends venue_zones {
  mapping?: venue_mappings;
  parentZone?: venue_zones;
  childZones?: venue_zones[];
  accessRights?: number; // Count of active access rights
  availableCapacity?: number;
  utilization?: number; // Percentage
}

export interface AccessPointWithRelations extends access_points {
  mapping?: venue_mappings;
  venue?: venues;
  allowedZoneDetails?: venue_zones[];
  restrictedZoneDetails?: venue_zones[];
  averageProcessingTime?: number;
  lastUsed?: Date;
}

// ================================
// STATISTICS TYPES
// ================================

export interface VenueStatistics {
  totalEvents: number;
  totalTicketsSold: number;
  totalRevenue: number;
  averageAttendance: number;
  utilizationRate: number; // Percentage
  popularEventTypes: Array<{
    category: string;
    count: number;
    percentage: number;
  }>;
  monthlyStats: Array<{
    month: string;
    events: number;
    attendance: number;
    revenue: number;
  }>;
  peakSeasons: Array<{
    month: number;
    events: number;
    averageAttendance: number;
  }>;
}

export interface MappingStatistics {
  totalEvents: number;
  totalCapacity: number;
  averageUtilization: number;
  zoneUtilization: Array<{
    zoneId: string;
    zoneName: string;
    utilization: number;
  }>;
  accessPointUsage: Array<{
    pointId: string;
    pointName: string;
    usageCount: number;
    averageWaitTime: number;
  }>;
}

// ================================
// SEARCH AND FILTER TYPES
// ================================

export interface VenueSearchFilters {
  query?: string;
  city?: string;
  country?: string;
  minCapacity?: number;
  maxCapacity?: number;
  amenities?: string[];
  isActive?: boolean;
  hasActiveEvents?: boolean;
  coordinates?: GeoSearchParams;
  ownerId?: string;
  managerId?: string;
}

export interface MappingSearchFilters {
  query?: string;
  venueId?: string;
  mappingType?: mapping_type;
  eventCategories?: string[];
  minCapacity?: number;
  maxCapacity?: number;
  isActive?: boolean;
  validAt?: Date;
}

export interface ZoneSearchFilters {
  query?: string;
  mappingId?: string;
  venueId?: string;
  zoneType?: zone_type;
  category?: zone_category;
  level?: number;
  minCapacity?: number;
  maxCapacity?: number;
  minPrice?: number;
  maxPrice?: number;
  currency?: string;
  isAccessible?: boolean;
  amenities?: string[];
  parentZoneId?: string;
}

export interface AccessPointSearchFilters {
  query?: string;
  mappingId?: string;
  venueId?: string;
  accessType?: access_type;
  securityLevel?: security_level;
  allowedZones?: string[];
  restrictedZones?: string[];
  isActive?: boolean;
  requiresSpecialPermission?: boolean;
}

// ================================
// PAGINATION AND SORTING
// ================================

export interface PaginationOptions {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface SortOptions<T> {
  field: T;
  direction: SortDirection;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// ================================
// SERVICE INTERFACES
// ================================

export interface IVenuesService {
  // CRUD Operations
  create(data: CreateVenueData): Promise<VenueWithRelations>;
  findById(id: string, options?: VenueIncludeOptions): Promise<VenueWithRelations>;
  findBySlug(slug: string, options?: VenueIncludeOptions): Promise<VenueWithRelations>;
  update(id: string, data: UpdateVenueData): Promise<VenueWithRelations>;
  delete(id: string): Promise<void>;
  
  // Search & Filter
  search(filters: VenueSearchFilters, pagination?: PaginationOptions, sort?: SortOptions<VenueSortField>): Promise<PaginatedResponse<VenueWithRelations>>;
  searchByGeo(params: GeoSearchParams, filters?: VenueSearchFilters, pagination?: PaginationOptions): Promise<PaginatedResponse<VenueWithRelations>>;
  
  // Statistics
  getStatistics(id: string, dateRange?: DateRange): Promise<VenueStatistics>;
  
  // Validation
  validateCapacity(venueId: string): Promise<boolean>;
  checkSlugAvailability(slug: string, excludeId?: string): Promise<boolean>;
}

export interface IMappingsService {
  // CRUD Operations
  create(data: CreateMappingData): Promise<MappingWithRelations>;
  findById(id: string, options?: MappingIncludeOptions): Promise<MappingWithRelations>;
  update(id: string, data: UpdateMappingData): Promise<MappingWithRelations>;
  delete(id: string): Promise<void>;
  
  // Venue-specific operations
  findByVenue(venueId: string, filters?: MappingSearchFilters): Promise<MappingWithRelations[]>;
  setAsDefault(id: string): Promise<void>;
  
  // Search & Filter
  search(filters: MappingSearchFilters, pagination?: PaginationOptions, sort?: SortOptions<MappingSortField>): Promise<PaginatedResponse<MappingWithRelations>>;
  
  // Statistics
  getStatistics(id: string): Promise<MappingStatistics>;
  
  // Validation
  validateCode(venueId: string, code: string, excludeId?: string): Promise<boolean>;
  validateCapacity(id: string): Promise<boolean>;
}

export interface IZonesService {
  // CRUD Operations
  create(data: CreateZoneData): Promise<ZoneWithRelations>;
  findById(id: string, options?: ZoneIncludeOptions): Promise<ZoneWithRelations>;
  update(id: string, data: UpdateZoneData): Promise<ZoneWithRelations>;
  delete(id: string): Promise<void>;
  
  // Mapping-specific operations
  findByMapping(mappingId: string, filters?: ZoneSearchFilters): Promise<ZoneWithRelations[]>;
  getHierarchy(mappingId: string): Promise<ZoneWithRelations[]>;
  
  // Search & Filter
  search(filters: ZoneSearchFilters, pagination?: PaginationOptions, sort?: SortOptions<ZoneSortField>): Promise<PaginatedResponse<ZoneWithRelations>>;
  
  // Validation
  validateCode(mappingId: string, code: string, excludeId?: string): Promise<boolean>;
  validateHierarchy(parentZoneId: string, childZoneId: string): Promise<boolean>;
}

export interface IAccessPointsService {
  // CRUD Operations
  create(data: CreateAccessPointData): Promise<AccessPointWithRelations>;
  findById(id: string, options?: AccessPointIncludeOptions): Promise<AccessPointWithRelations>;
  update(id: string, data: UpdateAccessPointData): Promise<AccessPointWithRelations>;
  delete(id: string): Promise<void>;
  
  // Mapping-specific operations
  findByMapping(mappingId: string, filters?: AccessPointSearchFilters): Promise<AccessPointWithRelations[]>;
  
  // Search & Filter
  search(filters: AccessPointSearchFilters, pagination?: PaginationOptions): Promise<PaginatedResponse<AccessPointWithRelations>>;
  
  // Validation
  validateCode(mappingId: string, code: string, excludeId?: string): Promise<boolean>;
}

// ================================
// INCLUDE OPTIONS
// ================================

export interface VenueIncludeOptions {
  mappings?: boolean;
  defaultMapping?: boolean;
  primaryOwner?: boolean;
  primaryManager?: boolean;
  statistics?: boolean;
}

export interface MappingIncludeOptions {
  venue?: boolean;
  zones?: boolean;
  accessPoints?: boolean;
  statistics?: boolean;
}

export interface ZoneIncludeOptions {
  mapping?: boolean;
  parentZone?: boolean;
  childZones?: boolean;
  statistics?: boolean;
}

export interface AccessPointIncludeOptions {
  mapping?: boolean;
  venue?: boolean;
  allowedZones?: boolean;
  restrictedZones?: boolean;
  statistics?: boolean;
}

// ================================
// CREATE/UPDATE DATA TYPES
// ================================

export interface CreateVenueData {
  name: string;
  slug: string;
  address: string;
  city: string;
  postal_code?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  max_capacity: number;
  description?: string;
  images?: string[];
  global_amenities?: string[];
  primary_owner_id?: string;
  primary_manager_id?: string;
  metadata?: VenueMetadata;
}

export interface UpdateVenueData {
  name?: string;
  slug?: string;
  address?: string;
  city?: string;
  postal_code?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  max_capacity?: number;
  description?: string;
  images?: string[];
  global_amenities?: string[];
  primary_owner_id?: string;
  primary_manager_id?: string;
  default_mapping_id?: string;
  is_active?: boolean;
  metadata?: VenueMetadata;
}

export interface CreateMappingData {
  venue_id: string;
  name: string;
  code: string;
  description?: string;
  mapping_type: mapping_type;
  event_categories: string[];
  effective_capacity: number;
  valid_from?: Date;
  valid_until?: Date;
  metadata?: MappingMetadata;
}

export interface UpdateMappingData {
  name?: string;
  code?: string;
  description?: string;
  mapping_type?: mapping_type;
  event_categories?: string[];
  effective_capacity?: number;
  valid_from?: Date;
  valid_until?: Date;
  is_active?: boolean;
  metadata?: MappingMetadata;
}

export interface CreateZoneData {
  mapping_id: string;
  parent_zone_id?: string;
  name: string;
  code: string;
  zone_type: zone_type;
  category: zone_category;
  level?: number;
  capacity: number;
  base_price?: number;
  currency?: string;
  coordinates?: any; // JSON coordinates
  description?: string;
  amenities?: string[];
  is_accessible?: boolean;
  requires_special_access?: boolean;
  metadata?: ZoneMetadata;
}

export interface UpdateZoneData {
  parent_zone_id?: string;
  name?: string;
  code?: string;
  zone_type?: zone_type;
  category?: zone_category;
  level?: number;
  capacity?: number;
  base_price?: number;
  currency?: string;
  coordinates?: any;
  description?: string;
  amenities?: string[];
  is_accessible?: boolean;
  requires_special_access?: boolean;
  metadata?: ZoneMetadata;
}

export interface CreateAccessPointData {
  mapping_id: string;
  name: string;
  code: string;
  access_type: access_type;
  allowed_zones: string[];
  restricted_zones?: string[];
  security_level?: security_level;
  latitude?: number;
  longitude?: number;
  requires_special_permission?: boolean;
  operating_hours?: OperatingHours;
  metadata?: AccessPointMetadata;
}

export interface UpdateAccessPointData {
  name?: string;
  code?: string;
  access_type?: access_type;
  allowed_zones?: string[];
  restricted_zones?: string[];
  security_level?: security_level;
  latitude?: number;
  longitude?: number;
  is_active?: boolean;
  requires_special_permission?: boolean;
  operating_hours?: OperatingHours;
  metadata?: AccessPointMetadata;
}

// ================================
// UTILITY TYPES
// ================================

export interface DateRange {
  start: Date;
  end: Date;
}

export interface BulkOperationResult {
  total: number;
  success: number;
  failed: number;
  errors: Array<{
    index: number;
    error: string;
  }>;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}