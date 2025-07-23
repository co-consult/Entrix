"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeolocationUtil = void 0;
class GeolocationUtil {
    static calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371;
        const dLat = this.deg2rad(lat2 - lat1);
        const dLon = this.deg2rad(lon2 - lon1);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;
        return distance;
    }
    static deg2rad(deg) {
        return deg * (Math.PI / 180);
    }
    static isHighRiskCountry(countryCode) {
        const highRiskCountries = ['CN', 'RU', 'KP', 'IR', 'SY'];
        return highRiskCountries.includes(countryCode.toUpperCase());
    }
    static isTrustedCountry(countryCode) {
        const trustedCountries = ['TN', 'FR', 'DE', 'US', 'CA', 'GB', 'IT', 'ES'];
        return trustedCountries.includes(countryCode.toUpperCase());
    }
    static calculateGeoRiskScore(geoInfo) {
        let riskScore = 0;
        if (geoInfo.countryCode && this.isHighRiskCountry(geoInfo.countryCode)) {
            riskScore += 40;
        }
        if (geoInfo.isVpn) {
            riskScore += 20;
        }
        if (geoInfo.isTor) {
            riskScore += 40;
        }
        if (geoInfo.isDatacenter) {
            riskScore += 15;
        }
        if (geoInfo.countryCode && !this.isTrustedCountry(geoInfo.countryCode) && !this.isHighRiskCountry(geoInfo.countryCode)) {
            riskScore += 25;
        }
        return Math.min(100, riskScore);
    }
    static detectTimezoneAnomaly(detectedCountry, reportedTimezone) {
        const countryTimezones = {
            'TN': ['Africa/Tunis'],
            'FR': ['Europe/Paris'],
            'US': ['America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles'],
            'GB': ['Europe/London'],
            'DE': ['Europe/Berlin'],
        };
        const expectedTimezones = countryTimezones[detectedCountry.toUpperCase()];
        if (!expectedTimezones)
            return false;
        return !expectedTimezones.some(tz => reportedTimezone.includes(tz));
    }
    static validateGeographicConsistency(ipGeolocation, userReportedLocation) {
        const anomalies = [];
        let riskIncrease = 0;
        if (userReportedLocation && ipGeolocation.countryCode) {
            if (userReportedLocation.country !== ipGeolocation.countryCode) {
                anomalies.push('country_mismatch');
                riskIncrease += 15;
            }
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
exports.GeolocationUtil = GeolocationUtil;
//# sourceMappingURL=geolocation.util.js.map