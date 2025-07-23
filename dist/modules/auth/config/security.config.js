"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSecurityConfig = void 0;
const security_constants_1 = require("../constants/security.constants");
const getSecurityConfig = (configService) => ({
    riskScoring: {
        enabled: configService.get('RISK_SCORING_ENABLED', true),
        requireMfaThreshold: configService.get('RISK_MFA_THRESHOLD', security_constants_1.SECURITY_CONSTANTS.RISK_SCORING.REQUIRE_MFA_THRESHOLD),
        blockThreshold: configService.get('RISK_BLOCK_THRESHOLD', security_constants_1.SECURITY_CONSTANTS.RISK_SCORING.BLOCK_THRESHOLD),
        alertThreshold: configService.get('RISK_ALERT_THRESHOLD', security_constants_1.SECURITY_CONSTANTS.RISK_SCORING.ALERT_THRESHOLD),
    },
    geolocation: {
        enabled: configService.get('GEOLOCATION_ENABLED', true),
        maxDistanceKm: configService.get('GEO_MAX_DISTANCE', security_constants_1.SECURITY_CONSTANTS.GEOLOCATION.MAX_DISTANCE_KM),
        trustedCountries: configService.get('GEO_TRUSTED_COUNTRIES', 'TN,FR,DE,US,CA').split(','),
        highRiskCountries: configService.get('GEO_HIGH_RISK_COUNTRIES', 'CN,RU,KP').split(','),
        timeout: configService.get('GEO_TIMEOUT', security_constants_1.SECURITY_CONSTANTS.GEOLOCATION.GEOLOCATION_TIMEOUT),
    },
    deviceFingerprinting: {
        enabled: configService.get('DEVICE_FINGERPRINTING_ENABLED', true),
        trustDuration: configService.get('DEVICE_TRUST_DURATION', security_constants_1.SECURITY_CONSTANTS.DEVICE_FINGERPRINT.TRUST_DURATION),
        requiredFields: [...security_constants_1.SECURITY_CONSTANTS.DEVICE_FINGERPRINT.REQUIRED_FIELDS],
        minEntropy: configService.get('DEVICE_MIN_ENTROPY', security_constants_1.SECURITY_CONSTANTS.DEVICE_FINGERPRINT.MIN_ENTROPY),
    },
    audit: {
        enabled: configService.get('AUDIT_ENABLED', true),
        retentionDays: configService.get('AUDIT_RETENTION_DAYS', security_constants_1.SECURITY_CONSTANTS.AUDIT.RETENTION_DAYS),
        highRiskRetentionDays: configService.get('AUDIT_HIGH_RISK_RETENTION', security_constants_1.SECURITY_CONSTANTS.AUDIT.HIGH_RISK_RETENTION_DAYS),
    },
});
exports.getSecurityConfig = getSecurityConfig;
//# sourceMappingURL=security.config.js.map