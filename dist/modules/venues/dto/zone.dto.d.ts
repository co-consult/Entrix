import { zone_type, zone_category } from '@prisma/client';
import { ZoneSortField, SortDirection } from '../constants/venues.constants';
export declare class ZoneCoordinatesDto {
    coordinates: any;
    center?: {
        latitude: number;
        longitude: number;
    };
    area_sqm?: number;
}
export declare class ZoneMetadataDto {
    view_quality?: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'OBSTRUCTED';
    noise_level?: 'QUIET' | 'MODERATE' | 'LOUD';
    sun_exposure?: 'FULL_SUN' | 'PARTIAL_SUN' | 'SHADE';
    entry_points?: string[];
    exit_points?: string[];
    nearest_facilities?: string[];
    special_features?: string[];
}
export declare class CreateZoneDto {
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
    coordinates?: ZoneCoordinatesDto;
    description?: string;
    amenities?: string[];
    is_accessible?: boolean;
    requires_special_access?: boolean;
    metadata?: ZoneMetadataDto;
}
declare const UpdateZoneDto_base: import("@nestjs/common").Type<Partial<CreateZoneDto>>;
export declare class UpdateZoneDto extends UpdateZoneDto_base {
    mapping_id?: never;
}
export declare class ZoneSearchDto {
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
    page?: number;
    limit?: number;
    sortField?: ZoneSortField;
    sortDirection?: SortDirection;
    includeMapping?: boolean;
    includeParentZone?: boolean;
    includeChildZones?: boolean;
    includeStatistics?: boolean;
}
export declare class ZoneHierarchyDto {
    mappingId: string;
    maxLevel?: number;
    includeInactive?: boolean;
}
export declare class ZoneResponseDto {
    id: string;
    mapping_id: string;
    parent_zone_id?: string;
    name: string;
    code: string;
    zone_type: zone_type;
    category: zone_category;
    level: number;
    capacity: number;
    base_price: number;
    currency: string;
    coordinates?: any;
    description?: string;
    amenities?: string[];
    is_accessible: boolean;
    requires_special_access: boolean;
    metadata?: any;
    created_at: Date;
    updated_at: Date;
    mapping?: {
        id: string;
        name: string;
        venue_id: string;
    };
    parentZone?: {
        id: string;
        name: string;
        code: string;
    };
    childZones?: Array<{
        id: string;
        name: string;
        code: string;
        capacity: number;
    }>;
    availableCapacity?: number;
    utilization?: number;
    activeAccessRights?: number;
}
export {};
