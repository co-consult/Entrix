import { VenueSortField, SortDirection } from '../constants/venues.constants';
export declare class CoordinatesDto {
    latitude: number;
    longitude: number;
}
export declare class VenueMetadataDto {
    construction_year?: number;
    renovation_year?: number;
    architect?: string;
    safety_certifications?: string[];
    sustainability_features?: string[];
}
export declare class CreateVenueDto {
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
    metadata?: VenueMetadataDto;
}
declare const UpdateVenueDto_base: import("@nestjs/common").Type<Partial<CreateVenueDto>>;
export declare class UpdateVenueDto extends UpdateVenueDto_base {
    default_mapping_id?: string;
    is_active?: boolean;
}
export declare class VenueSearchDto {
    query?: string;
    city?: string;
    country?: string;
    minCapacity?: number;
    maxCapacity?: number;
    amenities?: string[];
    isActive?: boolean;
    hasActiveEvents?: boolean;
    ownerId?: string;
    managerId?: string;
    page?: number;
    limit?: number;
    sortField?: VenueSortField;
    sortDirection?: SortDirection;
    includeMappings?: boolean;
    includeDefaultMapping?: boolean;
    includeStatistics?: boolean;
}
export declare class VenueGeoSearchDto {
    latitude: number;
    longitude: number;
    radiusKm: number;
    includeDistance?: boolean;
    minCapacity?: number;
    maxCapacity?: number;
    amenities?: string[];
    page?: number;
    limit?: number;
}
export declare class VenueResponseDto {
    id: string;
    name: string;
    slug: string;
    address: string;
    city: string;
    postal_code?: string;
    country: string;
    latitude?: number;
    longitude?: number;
    max_capacity: number;
    description?: string;
    images?: string[];
    global_amenities?: string[];
    is_active: boolean;
    primary_owner_id?: string;
    primary_manager_id?: string;
    default_mapping_id?: string;
    metadata?: any;
    created_at: Date;
    updated_at: Date;
    distance?: number;
    totalEvents?: number;
    avgRating?: number;
}
export {};
