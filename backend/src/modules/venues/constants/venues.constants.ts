// src/modules/venues/constants/venues.constants.ts
/**
 * Constants pour le module Venues
 * 
 * @author Entrix Development Team
 * @version 1.0.0
 */

import { 
  mapping_type, 
  zone_type, 
  zone_category, 
  access_type, 
  security_level,
  amenity_category,
  venue_relation_type 
} from '@prisma/client';

// ================================
// VALIDATION LIMITS
// ================================

export const VENUE_VALIDATION_LIMITS = {
  // Venues
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 200,
  SLUG_MIN_LENGTH: 2,
  SLUG_MAX_LENGTH: 200,
  ADDRESS_MAX_LENGTH: 500,
  CITY_MAX_LENGTH: 100,
  POSTAL_CODE_MAX_LENGTH: 20,
  COUNTRY_LENGTH: 2,
  DESCRIPTION_MAX_LENGTH: 2000,
  MAX_CAPACITY_MIN: 1,
  MAX_CAPACITY_MAX: 200000,
  MAX_IMAGES: 20,
  MAX_AMENITIES: 50,
  
  // Coordinates
  LATITUDE_MIN: -90,
  LATITUDE_MAX: 90,
  LONGITUDE_MIN: -180,
  LONGITUDE_MAX: 180,
  COORDINATE_PRECISION: 8,
  
  // Mappings
  MAPPING_NAME_MIN_LENGTH: 2,
  MAPPING_NAME_MAX_LENGTH: 200,
  MAPPING_CODE_MIN_LENGTH: 2,
  MAPPING_CODE_MAX_LENGTH: 100,
  MAPPING_DESCRIPTION_MAX_LENGTH: 1000,
  EFFECTIVE_CAPACITY_MIN: 1,
  EFFECTIVE_CAPACITY_MAX: 200000,
  MAX_EVENT_CATEGORIES: 20,
  
  // Zones
  ZONE_NAME_MIN_LENGTH: 2,
  ZONE_NAME_MAX_LENGTH: 200,
  ZONE_CODE_MIN_LENGTH: 1,
  ZONE_CODE_MAX_LENGTH: 100,
  ZONE_DESCRIPTION_MAX_LENGTH: 1000,
  ZONE_CAPACITY_MIN: 1,
  ZONE_CAPACITY_MAX: 50000,
  ZONE_LEVEL_MIN: 0,
  ZONE_LEVEL_MAX: 10,
  ZONE_PRICE_MIN: 0,
  ZONE_PRICE_MAX: 9999999.99,
  CURRENCY_LENGTH: 3,
  MAX_ZONE_AMENITIES: 30,
  
  // Access Points
  ACCESS_POINT_NAME_MIN_LENGTH: 2,
  ACCESS_POINT_NAME_MAX_LENGTH: 200,
  ACCESS_POINT_CODE_MIN_LENGTH: 1,
  ACCESS_POINT_CODE_MAX_LENGTH: 100,
  MAX_ALLOWED_ZONES: 50,
  MAX_RESTRICTED_ZONES: 50,
  
  // Pagination
  MAX_PAGE_SIZE: 100,
  MIN_PAGE_SIZE: 1,
  DEFAULT_PAGE_SIZE: 20,
  
  // Search
  SEARCH_MIN_LENGTH: 2,
  SEARCH_MAX_LENGTH: 100,
  
  // GeoSearch
  GEO_RADIUS_MIN: 0.1,
  GEO_RADIUS_MAX: 1000,
} as const;

// ================================
// DEFAULT VALUES
// ================================

export const VENUE_DEFAULTS = {
  // Pagination
  PAGE: 1,
  LIMIT: 20,
  
  // Venues
  COUNTRY: 'TN',
  IS_ACTIVE: true,
  MAX_CAPACITY: 1000,
  
  // Mappings
  MAPPING_TYPE: mapping_type.DEFAULT,
  EFFECTIVE_CAPACITY: 1000,
  MAPPING_IS_ACTIVE: true,
  
  // Zones
  ZONE_LEVEL: 0,
  ZONE_BASE_PRICE: 0,
  ZONE_CURRENCY: 'TND',
  ZONE_IS_ACCESSIBLE: false,
  ZONE_REQUIRES_SPECIAL_ACCESS: false,
  
  // Access Points
  SECURITY_LEVEL: security_level.STANDARD,
  ACCESS_POINT_IS_ACTIVE: true,
  REQUIRES_SPECIAL_PERMISSION: false,
} as const;

// ================================
// ENUM VALUES
// ================================

export const MAPPING_TYPES = Object.values(mapping_type);
export const ZONE_TYPES = Object.values(zone_type);
export const ZONE_CATEGORIES = Object.values(zone_category);
export const ACCESS_TYPES = Object.values(access_type);
export const SECURITY_LEVELS = Object.values(security_level);
export const AMENITY_CATEGORIES = Object.values(amenity_category);
export const VENUE_RELATION_TYPES = Object.values(venue_relation_type);

// ================================
// SUPPORTED VALUES
// ================================

export const SUPPORTED_COUNTRIES = [
  'TN', 'FR', 'DZ', 'MA', 'LY', 'EG', 'SA', 'AE', 'QA', 'KW'
] as const;

export const SUPPORTED_CURRENCIES = [
  'TND', 'EUR', 'USD', 'MAD', 'DZD', 'LYD', 'EGP', 'SAR', 'AED', 'QAR'
] as const;

export const SUPPORTED_EVENT_CATEGORIES = [
  'FOOTBALL',
  'BASKETBALL', 
  'HANDBALL',
  'VOLLEYBALL',
  'TENNIS',
  'CONCERT',
  'THEATER',
  'CONFERENCE',
  'FESTIVAL',
  'EXHIBITION',
  'CEREMONY',
  'CORPORATE',
  'PRIVATE',
  'CULTURAL',
  'RELIGIOUS',
  'EDUCATIONAL',
  'CHARITY',
  'POLITICAL',
  'OTHER'
] as const;

export const COMMON_AMENITIES = [
  // Parking
  'PARKING_GENERAL',
  'PARKING_VIP',
  'PARKING_DISABLED',
  'VALET_PARKING',
  
  // Food & Beverage
  'RESTAURANT',
  'CAFE',
  'BAR',
  'FAST_FOOD',
  'CONCESSION_STAND',
  'VIP_CATERING',
  
  // Accessibility
  'WHEELCHAIR_ACCESS',
  'DISABLED_TOILETS',
  'HEARING_LOOP',
  'SIGN_LANGUAGE',
  'BRAILLE_SIGNAGE',
  'ELEVATOR',
  
  // Connectivity
  'WIFI',
  'CHARGING_STATIONS',
  'MOBILE_COVERAGE',
  'LIVE_STREAMING',
  
  // Health & Safety
  'FIRST_AID',
  'SECURITY_CHECKPOINT',
  'FIRE_EXITS',
  'MEDICAL_ROOM',
  'DEFIBRILLATOR',
  
  // Comfort
  'AIR_CONDITIONING',
  'HEATING',
  'COVERED_AREAS',
  'COMFORTABLE_SEATING',
  'PREMIUM_LOUNGES',
  
  // Entertainment
  'GIANT_SCREEN',
  'SOUND_SYSTEM',
  'LIGHTING_SYSTEM',
  'STAGE',
  'VIP_BOXES',
  
  // Services
  'GIFT_SHOP',
  'TICKET_OFFICE',
  'INFORMATION_DESK',
  'LOST_AND_FOUND',
  'COAT_CHECK',
  'CHILDCARE',
  'ATM'
] as const;

// ================================
// ERROR MESSAGES
// ================================

export const VENUE_ERROR_MESSAGES = {
  // General
  VENUE_NOT_FOUND: 'Lieu non trouvé',
  MAPPING_NOT_FOUND: 'Configuration non trouvée',
  ZONE_NOT_FOUND: 'Zone non trouvée',
  ACCESS_POINT_NOT_FOUND: 'Point d\'accès non trouvé',
  
  // Validation
  INVALID_COORDINATES: 'Coordonnées GPS invalides',
  INVALID_CAPACITY: 'Capacité invalide',
  INVALID_PRICE: 'Prix invalide',
  INVALID_CURRENCY: 'Devise non supportée',
  INVALID_COUNTRY: 'Code pays invalide',
  
  // Business Rules
  SLUG_ALREADY_EXISTS: 'Ce slug existe déjà',
  MAPPING_CODE_EXISTS: 'Ce code de configuration existe déjà pour ce lieu',
  ZONE_CODE_EXISTS: 'Ce code de zone existe déjà pour cette configuration',
  ACCESS_POINT_CODE_EXISTS: 'Ce code de point d\'accès existe déjà pour cette configuration',
  
  // Capacity
  ZONE_CAPACITY_EXCEEDS_MAPPING: 'La capacité totale des zones dépasse celle de la configuration',
  MAPPING_CAPACITY_EXCEEDS_VENUE: 'La capacité de la configuration dépasse celle du lieu',
  
  // Dependencies
  VENUE_HAS_ACTIVE_EVENTS: 'Impossible de supprimer un lieu avec des événements actifs',
  MAPPING_HAS_ACTIVE_EVENTS: 'Impossible de supprimer une configuration avec des événements actifs',
  ZONE_HAS_ACTIVE_TICKETS: 'Impossible de supprimer une zone avec des billets actifs',
  
  // Access
  INSUFFICIENT_PERMISSIONS: 'Permissions insuffisantes',
  VENUE_ACCESS_DENIED: 'Accès refusé à ce lieu',
} as const;

// ================================
// CACHE CONFIGURATION
// ================================

export const VENUE_CACHE_CONFIG = {
  // TTL en secondes
  VENUE_DETAILS_TTL: 300, // 5 minutes
  VENUE_LIST_TTL: 60, // 1 minute
  MAPPING_DETAILS_TTL: 300, // 5 minutes
  ZONE_DETAILS_TTL: 300, // 5 minutes
  ACCESS_POINTS_TTL: 180, // 3 minutes
  VENUE_STATS_TTL: 900, // 15 minutes
  
  // Clés de cache
  KEYS: {
    VENUE: (id: string) => `venue:${id}`,
    VENUE_MAPPINGS: (venueId: string) => `venue:${venueId}:mappings`,
    MAPPING_ZONES: (mappingId: string) => `mapping:${mappingId}:zones`,
    MAPPING_ACCESS_POINTS: (mappingId: string) => `mapping:${mappingId}:access_points`,
    VENUE_STATS: (venueId: string) => `venue:${venueId}:stats`,
    VENUE_LIST: (filters: string) => `venues:list:${filters}`,
    VENUE_SEARCH: (query: string) => `venues:search:${query}`,
    VENUE_GEO_SEARCH: (lat: number, lng: number, radius: number) => 
      `venues:geo:${lat}:${lng}:${radius}`,
  }
} as const;

// ================================
// AUDIT EVENTS
// ================================

export const VENUE_AUDIT_EVENTS = {
  // Venues
  VENUE_CREATED: 'venue.created',
  VENUE_UPDATED: 'venue.updated',
  VENUE_DELETED: 'venue.deleted',
  VENUE_ACTIVATED: 'venue.activated',
  VENUE_DEACTIVATED: 'venue.deactivated',
  
  // Mappings
  MAPPING_CREATED: 'mapping.created',
  MAPPING_UPDATED: 'mapping.updated',
  MAPPING_DELETED: 'mapping.deleted',
  MAPPING_ACTIVATED: 'mapping.activated',
  MAPPING_DEACTIVATED: 'mapping.deactivated',
  MAPPING_SET_AS_DEFAULT: 'mapping.set_as_default',
  
  // Zones
  ZONE_CREATED: 'zone.created',
  ZONE_UPDATED: 'zone.updated',
  ZONE_DELETED: 'zone.deleted',
  ZONE_CAPACITY_CHANGED: 'zone.capacity_changed',
  ZONE_PRICE_CHANGED: 'zone.price_changed',
  
  // Access Points
  ACCESS_POINT_CREATED: 'access_point.created',
  ACCESS_POINT_UPDATED: 'access_point.updated',
  ACCESS_POINT_DELETED: 'access_point.deleted',
  ACCESS_POINT_ACTIVATED: 'access_point.activated',
  ACCESS_POINT_DEACTIVATED: 'access_point.deactivated',
} as const;

// ================================
// BUSINESS RULES
// ================================

export const VENUE_BUSINESS_RULES = {
  // Capacities
  MIN_VENUE_CAPACITY: 50,
  MAX_VENUE_CAPACITY: 200000,
  MIN_ZONE_CAPACITY: 1,
  
  // Geographic
  TUNISIA_BOUNDS: {
    NORTH: 37.5,
    SOUTH: 30.2,
    EAST: 11.6,
    WEST: 7.5
  },
  
  // Search
  MAX_SEARCH_RADIUS_KM: 500,
  DEFAULT_SEARCH_RADIUS_KM: 50,
  
  // Batch operations
  MAX_BULK_OPERATIONS: 100,
} as const;

// ================================
// SORTING OPTIONS
// ================================

export const VENUE_SORT_FIELDS = [
  'name',
  'city',
  'max_capacity',
  'created_at',
  'updated_at'
] as const;

export const MAPPING_SORT_FIELDS = [
  'name',
  'mapping_type',
  'effective_capacity',
  'created_at',
  'updated_at'
] as const;

export const ZONE_SORT_FIELDS = [
  'name',
  'zone_type',
  'category',
  'capacity',
  'base_price',
  'level',
  'created_at'
] as const;

export type VenueSortField = typeof VENUE_SORT_FIELDS[number];
export type MappingSortField = typeof MAPPING_SORT_FIELDS[number];
export type ZoneSortField = typeof ZONE_SORT_FIELDS[number];
export type SortDirection = 'asc' | 'desc';