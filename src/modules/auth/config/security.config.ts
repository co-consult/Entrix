
// src/modules/auth/config/security.config.ts

import { ConfigService } from '@nestjs/config';
import { SECURITY_CONSTANTS } from '../constants/security.constants';

/**
 * Configuration sécurité Entrix V3.0
 * Respecte processus_authentification.md
 */

export interface SecurityConfig {
  riskScoring: {
    enabled: boolean;
    requireMfaThreshold: number;
    blockThreshold: number;
    alertThreshold: number;
  };
  geolocation: {
    enabled: boolean;
    maxDistanceKm: number;
    trustedCountries: string[];
    highRiskCountries: string[];
    timeout: number;
  };
  deviceFingerprinting: {
    enabled: boolean;
    trustDuration: number;
    requiredFields: string[];
    minEntropy: number;
  };
  audit: {
    enabled: boolean;
    retentionDays: number;
    highRiskRetentionDays: number;
  };
}

export const getSecurityConfig = (configService: ConfigService): SecurityConfig => ({
  riskScoring: {
    enabled: configService.get<boolean>('RISK_SCORING_ENABLED', true),
    requireMfaThreshold: configService.get<number>('RISK_MFA_THRESHOLD', SECURITY_CONSTANTS.RISK_SCORING.REQUIRE_MFA_THRESHOLD),
    blockThreshold: configService.get<number>('RISK_BLOCK_THRESHOLD', SECURITY_CONSTANTS.RISK_SCORING.BLOCK_THRESHOLD),
    alertThreshold: configService.get<number>('RISK_ALERT_THRESHOLD', SECURITY_CONSTANTS.RISK_SCORING.ALERT_THRESHOLD),
  },
  geolocation: {
    enabled: configService.get<boolean>('GEOLOCATION_ENABLED', true),
    maxDistanceKm: configService.get<number>('GEO_MAX_DISTANCE', SECURITY_CONSTANTS.GEOLOCATION.MAX_DISTANCE_KM),
    trustedCountries: configService.get<string>('GEO_TRUSTED_COUNTRIES', 'TN,FR,DE,US,CA').split(','),
    highRiskCountries: configService.get<string>('GEO_HIGH_RISK_COUNTRIES', 'CN,RU,KP').split(','),
    timeout: configService.get<number>('GEO_TIMEOUT', SECURITY_CONSTANTS.GEOLOCATION.GEOLOCATION_TIMEOUT),
  },
  deviceFingerprinting: {
    enabled: configService.get<boolean>('DEVICE_FINGERPRINTING_ENABLED', true),
    trustDuration: configService.get<number>('DEVICE_TRUST_DURATION', SECURITY_CONSTANTS.DEVICE_FINGERPRINT.TRUST_DURATION),
    requiredFields: [...SECURITY_CONSTANTS.DEVICE_FINGERPRINT.REQUIRED_FIELDS], // Spread pour créer array mutable
    minEntropy: configService.get<number>('DEVICE_MIN_ENTROPY', SECURITY_CONSTANTS.DEVICE_FINGERPRINT.MIN_ENTROPY),
  },
  audit: {
    enabled: configService.get<boolean>('AUDIT_ENABLED', true),
    retentionDays: configService.get<number>('AUDIT_RETENTION_DAYS', SECURITY_CONSTANTS.AUDIT.RETENTION_DAYS),
    highRiskRetentionDays: configService.get<number>('AUDIT_HIGH_RISK_RETENTION', SECURITY_CONSTANTS.AUDIT.HIGH_RISK_RETENTION_DAYS),
  },
});