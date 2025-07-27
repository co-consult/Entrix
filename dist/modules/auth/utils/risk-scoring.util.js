"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RiskScoringUtil = void 0;
const security_constants_1 = require("../constants/security.constants");
const geolocation_util_1 = require("./geolocation.util");
const device_util_1 = require("./device.util");
class RiskScoringUtil {
    static calculateRiskScore(deviceInfo, userProfile, geoInfo) {
        const factors = this.analyzeRiskFactors(deviceInfo, userProfile, geoInfo);
        const score = this.computeRiskScore(factors);
        const recommendation = this.getRecommendation(score);
        return {
            score,
            factors,
            recommendation,
            requiresMfa: score >= security_constants_1.SECURITY_CONSTANTS.RISK_SCORING.REQUIRE_MFA_THRESHOLD,
        };
    }
    static analyzeRiskFactors(deviceInfo, userProfile, geoInfo) {
        return {
            unknownDevice: this.isUnknownDevice(deviceInfo, userProfile),
            newLocation: this.isNewLocation(deviceInfo, userProfile),
            unusualTime: this.isUnusualTime(new Date(), userProfile),
            failedAttempts: userProfile.recentFailedAttempts,
            suspiciousIp: this.isSuspiciousIp(deviceInfo, geoInfo),
            multipleSessions: userProfile.activeSessions > security_constants_1.SECURITY_CONSTANTS.SUSPICIOUS_PATTERNS.MULTIPLE_IP_SESSIONS,
            velocityAnomaly: this.detectVelocityAnomaly(deviceInfo, userProfile),
            browserInconsistency: this.detectBrowserInconsistency(deviceInfo),
        };
    }
    static computeRiskScore(factors) {
        let score = 0;
        if (factors.unknownDevice)
            score += security_constants_1.SECURITY_CONSTANTS.RISK_SCORING.UNKNOWN_DEVICE;
        if (factors.newLocation)
            score += security_constants_1.SECURITY_CONSTANTS.RISK_SCORING.NEW_LOCATION;
        if (factors.unusualTime)
            score += security_constants_1.SECURITY_CONSTANTS.RISK_SCORING.UNUSUAL_TIME;
        if (factors.suspiciousIp)
            score += security_constants_1.SECURITY_CONSTANTS.RISK_SCORING.TOR_IP;
        if (factors.multipleSessions)
            score += security_constants_1.SECURITY_CONSTANTS.RISK_SCORING.MULTIPLE_SESSIONS;
        if (factors.failedAttempts > 0) {
            score += Math.min(security_constants_1.SECURITY_CONSTANTS.RISK_SCORING.FAILED_ATTEMPTS, factors.failedAttempts * 10);
        }
        if (factors.velocityAnomaly)
            score += 20;
        if (factors.browserInconsistency)
            score += 15;
        return Math.min(100, Math.max(0, score));
    }
    static getRecommendation(score) {
        if (score >= security_constants_1.SECURITY_CONSTANTS.RISK_SCORING.BLOCK_THRESHOLD)
            return 'BLOCK';
        if (score >= security_constants_1.SECURITY_CONSTANTS.RISK_SCORING.ALERT_THRESHOLD)
            return 'ALERT';
        if (score >= security_constants_1.SECURITY_CONSTANTS.RISK_SCORING.REQUIRE_MFA_THRESHOLD)
            return 'REQUIRE_MFA';
        return 'ALLOW';
    }
    static isUnknownDevice(deviceInfo, userProfile) {
        const deviceFingerprint = device_util_1.DeviceUtil.generateDeviceFingerprint(deviceInfo);
        return !userProfile.commonDevices.includes(deviceFingerprint);
    }
    static isNewLocation(deviceInfo, userProfile) {
        const currentLocation = deviceInfo.geolocation?.country || 'Unknown';
        return !userProfile.commonLocations.includes(currentLocation);
    }
    static isUnusualTime(loginTime, userProfile) {
        const hour = loginTime.getHours();
        const typicalHours = userProfile.typicalLoginTimes;
        if (typicalHours.length === 0)
            return false;
        return !typicalHours.some(typicalHour => Math.abs(hour - typicalHour) <= 3);
    }
    static isSuspiciousIp(deviceInfo, geoInfo) {
        if (!geoInfo)
            return false;
        return geoInfo.isTor ||
            geoInfo.isVpn ||
            geoInfo.isDatacenter ||
            (geoInfo.countryCode && geolocation_util_1.GeolocationUtil.isHighRiskCountry(geoInfo.countryCode));
    }
    static detectVelocityAnomaly(deviceInfo, userProfile) {
        if (!userProfile.lastLoginLocation || !deviceInfo.geolocation?.coordinates) {
            return false;
        }
        const lastLocation = userProfile.lastLoginLocation;
        const currentLocation = deviceInfo.geolocation.country;
        return lastLocation !== currentLocation;
    }
    static detectBrowserInconsistency(deviceInfo) {
        const userAgent = deviceInfo.userAgent;
        const lowerUserAgent = userAgent.toLowerCase();
        return security_constants_1.SECURITY_CONSTANTS.SUSPICIOUS_PATTERNS.AUTOMATED_USER_AGENTS.some(pattern => lowerUserAgent.includes(pattern));
    }
    static updateUserBehaviorProfile(userProfile, deviceInfo, loginSuccess) {
        const updatedProfile = { ...userProfile };
        if (loginSuccess) {
            const location = deviceInfo.geolocation?.country;
            if (location && !updatedProfile.commonLocations.includes(location)) {
                updatedProfile.commonLocations.push(location);
                if (updatedProfile.commonLocations.length > 5) {
                    updatedProfile.commonLocations = updatedProfile.commonLocations.slice(-5);
                }
            }
            const deviceFingerprint = device_util_1.DeviceUtil.generateDeviceFingerprint(deviceInfo);
            if (!updatedProfile.commonDevices.includes(deviceFingerprint)) {
                updatedProfile.commonDevices.push(deviceFingerprint);
                if (updatedProfile.commonDevices.length > 3) {
                    updatedProfile.commonDevices = updatedProfile.commonDevices.slice(-3);
                }
            }
            const currentHour = new Date().getHours();
            if (!updatedProfile.typicalLoginTimes.includes(currentHour)) {
                updatedProfile.typicalLoginTimes.push(currentHour);
                if (updatedProfile.typicalLoginTimes.length > 8) {
                    updatedProfile.typicalLoginTimes = updatedProfile.typicalLoginTimes.slice(-8);
                }
            }
            updatedProfile.recentFailedAttempts = 0;
            updatedProfile.lastLoginLocation = location;
            updatedProfile.lastLoginDevice = deviceFingerprint;
        }
        else {
            updatedProfile.recentFailedAttempts += 1;
        }
        return updatedProfile;
    }
}
exports.RiskScoringUtil = RiskScoringUtil;
//# sourceMappingURL=risk-scoring.util.js.map