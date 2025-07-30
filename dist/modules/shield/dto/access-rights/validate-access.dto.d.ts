import { AccessAction } from '../../types/access-enums';
declare class GeolocationDto {
    latitude: number;
    longitude: number;
}
declare class AccessContextDto {
    ip_address?: string;
    user_agent?: string;
    geolocation?: GeolocationDto;
    device_fingerprint?: string;
    venue_zone?: string;
    additional_data?: Record<string, any>;
}
export declare class ValidateAccessDto {
    access_code: string;
    access_point?: string;
    action: AccessAction;
    context?: AccessContextDto;
}
export {};
