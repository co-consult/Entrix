export interface GeolocationInfo {
    country: string;
    countryCode: string;
    city: string;
    region: string;
    coordinates: [number, number];
    timezone: string;
    isp: string;
    isVpn: boolean;
    isTor: boolean;
    isDatacenter: boolean;
    riskScore: number;
}
export declare class GeolocationUtil {
    static calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number;
    private static deg2rad;
    static isHighRiskCountry(countryCode: string): boolean;
    static isTrustedCountry(countryCode: string): boolean;
    static calculateGeoRiskScore(geoInfo: Partial<GeolocationInfo>): number;
    static detectTimezoneAnomaly(detectedCountry: string, reportedTimezone: string): boolean;
    static validateGeographicConsistency(ipGeolocation: Partial<GeolocationInfo>, userReportedLocation?: {
        country: string;
        timezone: string;
    }): {
        isConsistent: boolean;
        anomalies: string[];
        riskIncrease: number;
    };
}
