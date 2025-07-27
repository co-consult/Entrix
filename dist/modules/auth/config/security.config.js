"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SECURITY_PRESETS = exports.isImpossibleTravel = exports.isSuspiciousUserAgent = exports.isHighRiskCountry = exports.getAdaptiveSessionTimeouts = exports.getSecurityConfig = void 0;
const security_constants_1 = require("../constants/security.constants");
const getSecurityConfig = (configService) => ({
    riskScoring: {
        enabled: configService.get('RISK_SCORING_ENABLED', true),
        requireMfaThreshold: configService.get('RISK_MFA_THRESHOLD', security_constants_1.SECURITY_CONSTANTS.RISK_SCORING.REQUIRE_MFA_THRESHOLD),
        blockThreshold: configService.get('RISK_BLOCK_THRESHOLD', security_constants_1.SECURITY_CONSTANTS.RISK_SCORING.BLOCK_THRESHOLD),
        alertThreshold: configService.get('RISK_ALERT_THRESHOLD', security_constants_1.SECURITY_CONSTANTS.RISK_SCORING.ALERT_THRESHOLD),
        maxRiskScore: configService.get('RISK_MAX_SCORE', security_constants_1.SECURITY_CONSTANTS.RISK_SCORING.MAX_RISK_SCORE),
        defaultRiskScore: configService.get('RISK_DEFAULT_SCORE', security_constants_1.SECURITY_CONSTANTS.RISK_SCORING.DEFAULT_RISK_SCORE),
    },
    geolocation: {
        enabled: configService.get('GEOLOCATION_ENABLED', true),
        maxReasonableSpeedKmH: configService.get('GEO_MAX_SPEED', security_constants_1.SECURITY_CONSTANTS.GEOLOCATION.MAX_REASONABLE_SPEED_KM_H),
        earthRadiusKm: configService.get('GEO_EARTH_RADIUS', security_constants_1.SECURITY_CONSTANTS.GEOLOCATION.EARTH_RADIUS_KM),
        trustedCountries: configService.get('GEO_TRUSTED_COUNTRIES', 'TN,FR,DE,US,CA,GB,IT,ES').split(','),
        highRiskCountries: configService.get('GEO_HIGH_RISK_COUNTRIES', security_constants_1.SECURITY_CONSTANTS.GEOLOCATION.HIGH_RISK_COUNTRIES.join(',')).split(','),
        impossibleTravelDetection: configService.get('GEO_IMPOSSIBLE_TRAVEL', true),
        vpnDetection: configService.get('GEO_VPN_DETECTION', true),
        datacenterDetection: configService.get('GEO_DATACENTER_DETECTION', true),
    },
    deviceFingerprinting: {
        enabled: configService.get('DEVICE_FINGERPRINTING_ENABLED', true),
        sessionHijackingDetection: configService.get('DEVICE_HIJACKING_DETECTION', security_constants_1.SECURITY_CONSTANTS.SESSION_SECURITY.SESSION_HIJACKING_DETECTION),
        maxConcurrentSessions: configService.get('DEVICE_MAX_SESSIONS', security_constants_1.SECURITY_CONSTANTS.SESSION_SECURITY.MAX_CONCURRENT_SESSIONS),
        maxSessionsPerIp: configService.get('DEVICE_MAX_SESSIONS_IP', security_constants_1.SECURITY_CONSTANTS.SESSION_SECURITY.MAX_SESSIONS_PER_IP),
        tokenReuseDetection: configService.get('DEVICE_TOKEN_REUSE_DETECTION', security_constants_1.SECURITY_CONSTANTS.SESSION_SECURITY.TOKEN_REUSE_DETECTION),
    },
    audit: {
        enabled: configService.get('AUDIT_ENABLED', true),
        securityLogsRetentionDays: configService.get('AUDIT_SECURITY_RETENTION', security_constants_1.SECURITY_CONSTANTS.AUDIT.SECURITY_LOGS_RETENTION_DAYS),
        auditLogsRetentionDays: configService.get('AUDIT_LOGS_RETENTION', security_constants_1.SECURITY_CONSTANTS.AUDIT.AUDIT_LOGS_RETENTION_DAYS),
        highRiskLogsRetentionDays: configService.get('AUDIT_HIGH_RISK_RETENTION', security_constants_1.SECURITY_CONSTANTS.AUDIT.HIGH_RISK_LOGS_RETENTION_DAYS),
        complianceAlertsEnabled: configService.get('AUDIT_COMPLIANCE_ALERTS', security_constants_1.SECURITY_CONSTANTS.AUDIT.COMPLIANCE_ALERTS_ENABLED),
        gdprDeletionTracking: configService.get('AUDIT_GDPR_TRACKING', security_constants_1.SECURITY_CONSTANTS.AUDIT.GDPR_DELETION_TRACKING),
    },
    botDetection: {
        enabled: configService.get('BOT_DETECTION_ENABLED', true),
        captchaThreshold: configService.get('BOT_CAPTCHA_THRESHOLD', security_constants_1.SECURITY_CONSTANTS.BOT_DETECTION.CAPTCHA_CHALLENGE_THRESHOLD),
        rapidRequestsThreshold: configService.get('BOT_RAPID_REQUESTS', security_constants_1.SECURITY_CONSTANTS.BOT_DETECTION.RAPID_REQUESTS_THRESHOLD),
        identicalRequestsThreshold: configService.get('BOT_IDENTICAL_REQUESTS', security_constants_1.SECURITY_CONSTANTS.BOT_DETECTION.IDENTICAL_REQUESTS_THRESHOLD),
        suspiciousHeadersScore: configService.get('BOT_SUSPICIOUS_HEADERS', security_constants_1.SECURITY_CONSTANTS.BOT_DETECTION.SUSPICIOUS_HEADERS_SCORE),
    },
    incidentResponse: {
        autoLockAccountRisk: configService.get('INCIDENT_AUTO_LOCK_RISK', security_constants_1.SECURITY_CONSTANTS.INCIDENT_RESPONSE.AUTO_LOCK_ACCOUNT_RISK),
        autoRequireMfaRisk: configService.get('INCIDENT_AUTO_MFA_RISK', security_constants_1.SECURITY_CONSTANTS.INCIDENT_RESPONSE.AUTO_REQUIRE_MFA_RISK),
        securityTeamAlertRisk: configService.get('INCIDENT_SECURITY_ALERT_RISK', security_constants_1.SECURITY_CONSTANTS.INCIDENT_RESPONSE.SECURITY_TEAM_ALERT_RISK),
        emergencyLockdownRisk: configService.get('INCIDENT_EMERGENCY_LOCKDOWN_RISK', security_constants_1.SECURITY_CONSTANTS.INCIDENT_RESPONSE.EMERGENCY_LOCKDOWN_RISK),
        quarantineSuspiciousSessions: configService.get('INCIDENT_QUARANTINE_SESSIONS', security_constants_1.SECURITY_CONSTANTS.INCIDENT_RESPONSE.QUARANTINE_SUSPICIOUS_SESSIONS),
        quarantineDurationHours: configService.get('INCIDENT_QUARANTINE_DURATION', security_constants_1.SECURITY_CONSTANTS.INCIDENT_RESPONSE.QUARANTINE_DURATION_HOURS),
    },
    alerts: {
        emailAlertsEnabled: configService.get('ALERTS_EMAIL_ENABLED', security_constants_1.SECURITY_CONSTANTS.ALERTS.EMAIL_ALERTS_ENABLED),
        slackAlertsEnabled: configService.get('ALERTS_SLACK_ENABLED', security_constants_1.SECURITY_CONSTANTS.ALERTS.SLACK_ALERTS_ENABLED),
        smsAlertsEnabled: configService.get('ALERTS_SMS_ENABLED', security_constants_1.SECURITY_CONSTANTS.ALERTS.SMS_ALERTS_ENABLED),
        maxAlertsPerUserHour: configService.get('ALERTS_MAX_USER_HOUR', security_constants_1.SECURITY_CONSTANTS.ALERTS.MAX_ALERTS_PER_USER_HOUR),
        maxAlertsPerTypeHour: configService.get('ALERTS_MAX_TYPE_HOUR', security_constants_1.SECURITY_CONSTANTS.ALERTS.MAX_ALERTS_PER_TYPE_HOUR),
        alertCooldownMinutes: configService.get('ALERTS_COOLDOWN_MINUTES', security_constants_1.SECURITY_CONSTANTS.ALERTS.ALERT_COOLDOWN_MINUTES),
    },
});
exports.getSecurityConfig = getSecurityConfig;
const getAdaptiveSessionTimeouts = (riskLevel) => {
    switch (riskLevel) {
        case 'HIGH':
            return security_constants_1.SECURITY_CONSTANTS.SESSION_SECURITY.HIGH_RISK_SESSION_TIMEOUT_MINUTES;
        case 'MEDIUM':
            return security_constants_1.SECURITY_CONSTANTS.SESSION_SECURITY.MEDIUM_RISK_SESSION_TIMEOUT_MINUTES;
        case 'LOW':
        default:
            return security_constants_1.SECURITY_CONSTANTS.SESSION_SECURITY.LOW_RISK_SESSION_TIMEOUT_MINUTES;
    }
};
exports.getAdaptiveSessionTimeouts = getAdaptiveSessionTimeouts;
const isHighRiskCountry = (countryCode, configService) => {
    const config = (0, exports.getSecurityConfig)(configService);
    return config.geolocation.highRiskCountries.includes(countryCode.toUpperCase());
};
exports.isHighRiskCountry = isHighRiskCountry;
const isSuspiciousUserAgent = (userAgent) => {
    const suspiciousPatterns = security_constants_1.SECURITY_CONSTANTS.SUSPICIOUS_PATTERNS.AUTOMATED_USER_AGENTS;
    const lowerUserAgent = userAgent.toLowerCase();
    return suspiciousPatterns.some(pattern => lowerUserAgent.includes(pattern));
};
exports.isSuspiciousUserAgent = isSuspiciousUserAgent;
const isImpossibleTravel = (lastLocation, currentLocation) => {
    const R = security_constants_1.SECURITY_CONSTANTS.GEOLOCATION.EARTH_RADIUS_KM;
    const dLat = (currentLocation.lat - lastLocation.lat) * Math.PI / 180;
    const dLon = (currentLocation.lon - lastLocation.lon) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lastLocation.lat * Math.PI / 180) * Math.cos(currentLocation.lat * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    const timeDiffMs = currentLocation.timestamp.getTime() - lastLocation.timestamp.getTime();
    const timeDiffHours = timeDiffMs / (1000 * 60 * 60);
    const speed = distance / timeDiffHours;
    return speed > security_constants_1.SECURITY_CONSTANTS.GEOLOCATION.MAX_REASONABLE_SPEED_KM_H;
};
exports.isImpossibleTravel = isImpossibleTravel;
exports.SECURITY_PRESETS = {
    PRODUCTION: {
        riskScoring: { enabled: true, requireMfaThreshold: 40, blockThreshold: 70 },
        geolocation: { enabled: true, impossibleTravelDetection: true },
        botDetection: { enabled: true, captchaThreshold: 30 },
        incidentResponse: { autoLockAccountRisk: 75, quarantineSuspiciousSessions: true },
    },
    STAGING: {
        riskScoring: { enabled: true, requireMfaThreshold: 50, blockThreshold: 80 },
        geolocation: { enabled: true, impossibleTravelDetection: true },
        botDetection: { enabled: true, captchaThreshold: 40 },
        incidentResponse: { autoLockAccountRisk: 85, quarantineSuspiciousSessions: false },
    },
    DEVELOPMENT: {
        riskScoring: { enabled: false, requireMfaThreshold: 90, blockThreshold: 95 },
        geolocation: { enabled: false, impossibleTravelDetection: false },
        botDetection: { enabled: false, captchaThreshold: 90 },
        incidentResponse: { autoLockAccountRisk: 95, quarantineSuspiciousSessions: false },
    },
};
//# sourceMappingURL=security.config.js.map