import { mapping_type } from '@prisma/client';
import { MappingSortField, SortDirection } from '../constants/venues.constants';
export declare class MappingMetadataDto {
    configuration_notes?: string;
    setup_time_minutes?: number;
    breakdown_time_minutes?: number;
    required_staff?: number;
    technical_requirements?: string[];
    safety_considerations?: string[];
    weather_dependencies?: string[];
}
export declare class CreateMappingDto {
    venue_id: string;
    name: string;
    code: string;
    description?: string;
    mapping_type: mapping_type;
    event_categories: string[];
    effective_capacity: number;
    valid_from?: Date;
    valid_until?: Date;
    metadata?: MappingMetadataDto;
}
declare const UpdateMappingDto_base: import("@nestjs/common").Type<Partial<CreateMappingDto>>;
export declare class UpdateMappingDto extends UpdateMappingDto_base {
    is_active?: boolean;
    venue_id?: never;
}
export declare class MappingSearchDto {
    query?: string;
    venueId?: string;
    mappingType?: mapping_type;
    eventCategories?: string[];
    minCapacity?: number;
    maxCapacity?: number;
    isActive?: boolean;
    validAt?: Date;
    page?: number;
    limit?: number;
    sortField?: MappingSortField;
    sortDirection?: SortDirection;
    includeVenue?: boolean;
    includeZones?: boolean;
    includeAccessPoints?: boolean;
    includeStatistics?: boolean;
}
export declare class SetDefaultMappingDto {
    mappingId: string;
}
export declare class MappingResponseDto {
    id: string;
    venue_id: string;
    name: string;
    code: string;
    description?: string;
    mapping_type: mapping_type;
    event_categories: string[];
    effective_capacity: number;
    valid_from?: Date;
    valid_until?: Date;
    is_active: boolean;
    metadata?: any;
    created_at: Date;
    updated_at: Date;
    venue?: {
        id: string;
        name: string;
        slug: string;
        city: string;
        max_capacity: number;
    };
    totalZones?: number;
    totalAccessPoints?: number;
    totalCapacity?: number;
    activeZones?: number;
    activeAccessPoints?: number;
}
export {};
