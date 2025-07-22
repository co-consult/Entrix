declare class PriceRangeDto {
    min?: number;
    max?: number;
}
declare class LocationPreferenceDto {
    city?: string;
    radius?: number;
}
declare class EventPreferencesDto {
    eventTypes?: string[];
    favoriteVenues?: string[];
    priceRange?: PriceRangeDto;
    location?: LocationPreferenceDto;
}
declare class AccessibilityPreferencesDto {
    largeText?: boolean;
    highContrast?: boolean;
    screenReader?: boolean;
    wheelchairAccess?: boolean;
}
export declare class UserPreferencesDto {
    language?: string;
    timezone?: string;
    currency?: string;
    dateFormat?: string;
    eventPreferences?: EventPreferencesDto;
    accessibility?: AccessibilityPreferencesDto;
    customFields?: Record<string, any>;
}
export {};
