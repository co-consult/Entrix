import { access_type, security_level } from '@prisma/client';
export declare class DayScheduleDto {
    open: string;
    close: string;
    breaks?: BreakPeriodDto[];
}
export declare class BreakPeriodDto {
    start: string;
    end: string;
    reason?: string;
}
export declare class OperatingHoursDto {
    monday?: DayScheduleDto;
    tuesday?: DayScheduleDto;
    wednesday?: DayScheduleDto;
    thursday?: DayScheduleDto;
    friday?: DayScheduleDto;
    saturday?: DayScheduleDto;
    sunday?: DayScheduleDto;
}
export declare class AccessPointMetadataDto {
    queue_capacity?: number;
    processing_rate_per_minute?: number;
    staffing_requirements?: number;
    equipment_needed?: string[];
    peak_usage_times?: string[];
    accessibility_features?: string[];
}
export declare class CreateAccessPointDto {
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
    operating_hours?: OperatingHoursDto;
    metadata?: AccessPointMetadataDto;
}
declare const UpdateAccessPointDto_base: import("@nestjs/common").Type<Partial<CreateAccessPointDto>>;
export declare class UpdateAccessPointDto extends UpdateAccessPointDto_base {
    is_active?: boolean;
    mapping_id?: never;
}
export declare class AccessPointSearchDto {
    query?: string;
    mappingId?: string;
    venueId?: string;
    accessType?: access_type;
    securityLevel?: security_level;
    allowedZones?: string[];
    restrictedZones?: string[];
    isActive?: boolean;
    requiresSpecialPermission?: boolean;
    page?: number;
    limit?: number;
    includeMapping?: boolean;
    includeVenue?: boolean;
    includeAllowedZones?: boolean;
    includeRestrictedZones?: boolean;
    includeStatistics?: boolean;
}
export declare class AccessPointResponseDto {
    id: string;
    mapping_id: string;
    name: string;
    code: string;
    access_type: access_type;
    allowed_zones: string[];
    restricted_zones?: string[];
    security_level: security_level;
    latitude?: number;
    longitude?: number;
    is_active: boolean;
    requires_special_permission: boolean;
    operating_hours?: any;
    metadata?: any;
    created_at: Date;
    updated_at: Date;
    mapping?: {
        id: string;
        name: string;
        venue_id: string;
    };
    venue?: {
        id: string;
        name: string;
        slug: string;
        city: string;
    };
    allowedZoneDetails?: Array<{
        id: string;
        name: string;
        code: string;
        zone_type: string;
        capacity: number;
    }>;
    restrictedZoneDetails?: Array<{
        id: string;
        name: string;
        code: string;
        zone_type: string;
        capacity: number;
    }>;
    averageProcessingTime?: number;
    lastUsed?: Date;
    todayUsageCount?: number;
}
export {};
