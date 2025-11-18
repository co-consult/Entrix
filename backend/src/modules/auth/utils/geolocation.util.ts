// src/modules/auth/utils/geolocation.util.ts

/**
 * Utilitaires Géolocalisation Entrix V3.0
 */

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

export class GeolocationUtil {
  /**
   * Calcule distance entre deux points géographiques (Haversine)
   */
  static calculateDistance(
    lat1: number, 
    lon1: number, 
    lat2: number, 
    lon2: number
  ): number {
    const R = 6371; // Rayon terre en km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return distance;
  }

  private static deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  /**
   * Vérifie si un pays est dans la liste des pays à risque
   */
  static isHighRiskCountry(countryCode: string): boolean {
    const highRiskCountries = ['CN', 'RU', 'KP', 'IR', 'SY'];
    return highRiskCountries.includes(countryCode.toUpperCase());
  }

  /**
   * Vérifie si un pays est de confiance
   */
  static isTrustedCountry(countryCode: string): boolean {
    const trustedCountries = ['TN', 'FR', 'DE', 'US', 'CA', 'GB', 'IT', 'ES'];
    return trustedCountries.includes(countryCode.toUpperCase());
  }

  /**
   * Calcule score de risque géographique
   */
  static calculateGeoRiskScore(geoInfo: Partial<GeolocationInfo>): number {
    let riskScore = 0;

    // Pays à risque (+40 points)
    if (geoInfo.countryCode && this.isHighRiskCountry(geoInfo.countryCode)) {
      riskScore += 40;
    }

    // VPN/Proxy (+20 points)
    if (geoInfo.isVpn) {
      riskScore += 20;
    }

    // Tor (+40 points)
    if (geoInfo.isTor) {
      riskScore += 40;
    }

    // Datacenter (+15 points)
    if (geoInfo.isDatacenter) {
      riskScore += 15;
    }

    // Pays non reconnu (+25 points)
    if (geoInfo.countryCode && !this.isTrustedCountry(geoInfo.countryCode) && !this.isHighRiskCountry(geoInfo.countryCode)) {
      riskScore += 25;
    }

    return Math.min(100, riskScore);
  }

  /**
   * Parse timezone pour détecter incohérences
   */
  static detectTimezoneAnomaly(
    detectedCountry: string, 
    reportedTimezone: string
  ): boolean {
    const countryTimezones: Record<string, string[]> = {
      'TN': ['Africa/Tunis'],
      'FR': ['Europe/Paris'],
      'US': ['America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles'],
      'GB': ['Europe/London'],
      'DE': ['Europe/Berlin'],
      // ... autres pays
    };

    const expectedTimezones = countryTimezones[detectedCountry.toUpperCase()];
    if (!expectedTimezones) return false;

    return !expectedTimezones.some(tz => reportedTimezone.includes(tz));
  }

  /**
   * Valide cohérence géographique
   */
  static validateGeographicConsistency(
    ipGeolocation: Partial<GeolocationInfo>,
    userReportedLocation?: { country: string; timezone: string }
  ): {
    isConsistent: boolean;
    anomalies: string[];
    riskIncrease: number;
  } {
    const anomalies: string[] = [];
    let riskIncrease = 0;

    if (userReportedLocation && ipGeolocation.countryCode) {
      // Vérification pays
      if (userReportedLocation.country !== ipGeolocation.countryCode) {
        anomalies.push('country_mismatch');
        riskIncrease += 15;
      }

      // Vérification timezone
      if (this.detectTimezoneAnomaly(ipGeolocation.countryCode, userReportedLocation.timezone)) {
        anomalies.push('timezone_anomaly');
        riskIncrease += 10;
      }
    }

    return {
      isConsistent: anomalies.length === 0,
      anomalies,
      riskIncrease
    };
  }
}