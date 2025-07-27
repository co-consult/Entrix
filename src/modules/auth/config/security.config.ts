// src/modules/auth/config/security.config.ts

import { ConfigService } from '@nestjs/config';
import { SECURITY_CONSTANTS } from '../constants/security.constants';

/**
 * Configuration sécurité Entrix V3.0
 * ✅ MISE À JOUR : Utilise les nouvelles constantes SECURITY_CONSTANTS
 * Respecte processus_authentification.md
 */

export interface SecurityConfig {
  riskScoring: {
    enabled: boolean;
    requireMfaThreshold: number;
    blockThreshold: number;
    alertThreshold: number;
    maxRiskScore: number;
    defaultRiskScore: number;
  };
  geolocation: {
    enabled: boolean;
    maxReasonableSpeedKmH: number;
    earthRadiusKm: number;
    trustedCountries: string[];
    highRiskCountries: string[];
    impossibleTravelDetection: boolean;
    vpnDetection: boolean;
    datacenterDetection: boolean;
  };
  deviceFingerprinting: {
    enabled: boolean;
    sessionHijackingDetection: boolean;
    maxConcurrentSessions: number;
    maxSessionsPerIp: number;
    tokenReuseDetection: boolean;
  };
  audit: {
    enabled: boolean;
    securityLogsRetentionDays: number;
    auditLogsRetentionDays: number;
    highRiskLogsRetentionDays: number;
    complianceAlertsEnabled: boolean;
    gdprDeletionTracking: boolean;
  };
  botDetection: {
    enabled: boolean;
    captchaThreshold: number;
    rapidRequestsThreshold: number;
    identicalRequestsThreshold: number;
    suspiciousHeadersScore: number;
  };
  incidentResponse: {
    autoLockAccountRisk: number;
    autoRequireMfaRisk: number;
    securityTeamAlertRisk: number;
    emergencyLockdownRisk: number;
    quarantineSuspiciousSessions: boolean;
    quarantineDurationHours: number;
  };
  alerts: {
    emailAlertsEnabled: boolean;
    slackAlertsEnabled: boolean;
    smsAlertsEnabled: boolean;
    maxAlertsPerUserHour: number;
    maxAlertsPerTypeHour: number;
    alertCooldownMinutes: number;
  };
}

export const getSecurityConfig = (configService: ConfigService): SecurityConfig => ({
  // ✅ Risk Scoring - Mise à jour avec nouvelles constantes
  riskScoring: {
    enabled: configService.get<boolean>('RISK_SCORING_ENABLED', true),
    requireMfaThreshold: configService.get<number>('RISK_MFA_THRESHOLD', SECURITY_CONSTANTS.RISK_SCORING.REQUIRE_MFA_THRESHOLD),
    blockThreshold: configService.get<number>('RISK_BLOCK_THRESHOLD', SECURITY_CONSTANTS.RISK_SCORING.BLOCK_THRESHOLD),
    alertThreshold: configService.get<number>('RISK_ALERT_THRESHOLD', SECURITY_CONSTANTS.RISK_SCORING.ALERT_THRESHOLD),
    maxRiskScore: configService.get<number>('RISK_MAX_SCORE', SECURITY_CONSTANTS.RISK_SCORING.MAX_RISK_SCORE),
    defaultRiskScore: configService.get<number>('RISK_DEFAULT_SCORE', SECURITY_CONSTANTS.RISK_SCORING.DEFAULT_RISK_SCORE),
  },

  // ✅ Geolocation - Mise à jour avec nouvelles constantes
  geolocation: {
    enabled: configService.get<boolean>('GEOLOCATION_ENABLED', true),
    maxReasonableSpeedKmH: configService.get<number>('GEO_MAX_SPEED', SECURITY_CONSTANTS.GEOLOCATION.MAX_REASONABLE_SPEED_KM_H),
    earthRadiusKm: configService.get<number>('GEO_EARTH_RADIUS', SECURITY_CONSTANTS.GEOLOCATION.EARTH_RADIUS_KM),
    trustedCountries: configService.get<string>('GEO_TRUSTED_COUNTRIES', 'TN,FR,DE,US,CA,GB,IT,ES').split(','),
    highRiskCountries: configService.get<string>('GEO_HIGH_RISK_COUNTRIES', SECURITY_CONSTANTS.GEOLOCATION.HIGH_RISK_COUNTRIES.join(',')).split(','),
    impossibleTravelDetection: configService.get<boolean>('GEO_IMPOSSIBLE_TRAVEL', true),
    vpnDetection: configService.get<boolean>('GEO_VPN_DETECTION', true),
    datacenterDetection: configService.get<boolean>('GEO_DATACENTER_DETECTION', true),
  },

  // ✅ Device Fingerprinting et Session Security - Mise à jour avec nouvelles constantes
  deviceFingerprinting: {
    enabled: configService.get<boolean>('DEVICE_FINGERPRINTING_ENABLED', true),
    sessionHijackingDetection: configService.get<boolean>('DEVICE_HIJACKING_DETECTION', SECURITY_CONSTANTS.SESSION_SECURITY.SESSION_HIJACKING_DETECTION),
    maxConcurrentSessions: configService.get<number>('DEVICE_MAX_SESSIONS', SECURITY_CONSTANTS.SESSION_SECURITY.MAX_CONCURRENT_SESSIONS),
    maxSessionsPerIp: configService.get<number>('DEVICE_MAX_SESSIONS_IP', SECURITY_CONSTANTS.SESSION_SECURITY.MAX_SESSIONS_PER_IP),
    tokenReuseDetection: configService.get<boolean>('DEVICE_TOKEN_REUSE_DETECTION', SECURITY_CONSTANTS.SESSION_SECURITY.TOKEN_REUSE_DETECTION),
  },

  // ✅ Audit - Mise à jour avec nouvelles constantes
  audit: {
    enabled: configService.get<boolean>('AUDIT_ENABLED', true),
    securityLogsRetentionDays: configService.get<number>('AUDIT_SECURITY_RETENTION', SECURITY_CONSTANTS.AUDIT.SECURITY_LOGS_RETENTION_DAYS),
    auditLogsRetentionDays: configService.get<number>('AUDIT_LOGS_RETENTION', SECURITY_CONSTANTS.AUDIT.AUDIT_LOGS_RETENTION_DAYS),
    highRiskLogsRetentionDays: configService.get<number>('AUDIT_HIGH_RISK_RETENTION', SECURITY_CONSTANTS.AUDIT.HIGH_RISK_LOGS_RETENTION_DAYS),
    complianceAlertsEnabled: configService.get<boolean>('AUDIT_COMPLIANCE_ALERTS', SECURITY_CONSTANTS.AUDIT.COMPLIANCE_ALERTS_ENABLED),
    gdprDeletionTracking: configService.get<boolean>('AUDIT_GDPR_TRACKING', SECURITY_CONSTANTS.AUDIT.GDPR_DELETION_TRACKING),
  },

  // ✅ NOUVEAU : Bot Detection
  botDetection: {
    enabled: configService.get<boolean>('BOT_DETECTION_ENABLED', true),
    captchaThreshold: configService.get<number>('BOT_CAPTCHA_THRESHOLD', SECURITY_CONSTANTS.BOT_DETECTION.CAPTCHA_CHALLENGE_THRESHOLD),
    rapidRequestsThreshold: configService.get<number>('BOT_RAPID_REQUESTS', SECURITY_CONSTANTS.BOT_DETECTION.RAPID_REQUESTS_THRESHOLD),
    identicalRequestsThreshold: configService.get<number>('BOT_IDENTICAL_REQUESTS', SECURITY_CONSTANTS.BOT_DETECTION.IDENTICAL_REQUESTS_THRESHOLD),
    suspiciousHeadersScore: configService.get<number>('BOT_SUSPICIOUS_HEADERS', SECURITY_CONSTANTS.BOT_DETECTION.SUSPICIOUS_HEADERS_SCORE),
  },

  // ✅ NOUVEAU : Incident Response
  incidentResponse: {
    autoLockAccountRisk: configService.get<number>('INCIDENT_AUTO_LOCK_RISK', SECURITY_CONSTANTS.INCIDENT_RESPONSE.AUTO_LOCK_ACCOUNT_RISK),
    autoRequireMfaRisk: configService.get<number>('INCIDENT_AUTO_MFA_RISK', SECURITY_CONSTANTS.INCIDENT_RESPONSE.AUTO_REQUIRE_MFA_RISK),
    securityTeamAlertRisk: configService.get<number>('INCIDENT_SECURITY_ALERT_RISK', SECURITY_CONSTANTS.INCIDENT_RESPONSE.SECURITY_TEAM_ALERT_RISK),
    emergencyLockdownRisk: configService.get<number>('INCIDENT_EMERGENCY_LOCKDOWN_RISK', SECURITY_CONSTANTS.INCIDENT_RESPONSE.EMERGENCY_LOCKDOWN_RISK),
    quarantineSuspiciousSessions: configService.get<boolean>('INCIDENT_QUARANTINE_SESSIONS', SECURITY_CONSTANTS.INCIDENT_RESPONSE.QUARANTINE_SUSPICIOUS_SESSIONS),
    quarantineDurationHours: configService.get<number>('INCIDENT_QUARANTINE_DURATION', SECURITY_CONSTANTS.INCIDENT_RESPONSE.QUARANTINE_DURATION_HOURS),
  },

  // ✅ NOUVEAU : Alerts Configuration
  alerts: {
    emailAlertsEnabled: configService.get<boolean>('ALERTS_EMAIL_ENABLED', SECURITY_CONSTANTS.ALERTS.EMAIL_ALERTS_ENABLED),
    slackAlertsEnabled: configService.get<boolean>('ALERTS_SLACK_ENABLED', SECURITY_CONSTANTS.ALERTS.SLACK_ALERTS_ENABLED),
    smsAlertsEnabled: configService.get<boolean>('ALERTS_SMS_ENABLED', SECURITY_CONSTANTS.ALERTS.SMS_ALERTS_ENABLED),
    maxAlertsPerUserHour: configService.get<number>('ALERTS_MAX_USER_HOUR', SECURITY_CONSTANTS.ALERTS.MAX_ALERTS_PER_USER_HOUR),
    maxAlertsPerTypeHour: configService.get<number>('ALERTS_MAX_TYPE_HOUR', SECURITY_CONSTANTS.ALERTS.MAX_ALERTS_PER_TYPE_HOUR),
    alertCooldownMinutes: configService.get<number>('ALERTS_COOLDOWN_MINUTES', SECURITY_CONSTANTS.ALERTS.ALERT_COOLDOWN_MINUTES),
  },
});

/**
 * ✅ NOUVEAU : Helper pour obtenir les seuils de session adaptatifs
 */
export const getAdaptiveSessionTimeouts = (riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'): number => {
  switch (riskLevel) {
    case 'HIGH':
      return SECURITY_CONSTANTS.SESSION_SECURITY.HIGH_RISK_SESSION_TIMEOUT_MINUTES;
    case 'MEDIUM':
      return SECURITY_CONSTANTS.SESSION_SECURITY.MEDIUM_RISK_SESSION_TIMEOUT_MINUTES;
    case 'LOW':
    default:
      return SECURITY_CONSTANTS.SESSION_SECURITY.LOW_RISK_SESSION_TIMEOUT_MINUTES;
  }
};

/**
 * ✅ NOUVEAU : Helper pour vérifier si un pays est à haut risque
 */
export const isHighRiskCountry = (countryCode: string, configService: ConfigService): boolean => {
  const config = getSecurityConfig(configService);
  return config.geolocation.highRiskCountries.includes(countryCode.toUpperCase());
};

/**
 * ✅ NOUVEAU : Helper pour vérifier si un User-Agent est suspect
 */
export const isSuspiciousUserAgent = (userAgent: string): boolean => {
  const suspiciousPatterns = SECURITY_CONSTANTS.SUSPICIOUS_PATTERNS.AUTOMATED_USER_AGENTS;
  const lowerUserAgent = userAgent.toLowerCase();
  return suspiciousPatterns.some(pattern => lowerUserAgent.includes(pattern));
};

/**
 * ✅ NOUVEAU : Helper pour calculer si un voyage est impossible
 */
export const isImpossibleTravel = (
  lastLocation: { lat: number; lon: number; timestamp: Date },
  currentLocation: { lat: number; lon: number; timestamp: Date }
): boolean => {
  // Calcul de la distance en utilisant la formule de Haversine
  const R = SECURITY_CONSTANTS.GEOLOCATION.EARTH_RADIUS_KM;
  const dLat = (currentLocation.lat - lastLocation.lat) * Math.PI / 180;
  const dLon = (currentLocation.lon - lastLocation.lon) * Math.PI / 180;
  
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lastLocation.lat * Math.PI / 180) * Math.cos(currentLocation.lat * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c; // Distance en km
  
  // Calcul du temps en heures
  const timeDiffMs = currentLocation.timestamp.getTime() - lastLocation.timestamp.getTime();
  const timeDiffHours = timeDiffMs / (1000 * 60 * 60);
  
  // Vitesse calculée
  const speed = distance / timeDiffHours;
  
  // Vérifier si la vitesse dépasse le seuil raisonnable
  return speed > SECURITY_CONSTANTS.GEOLOCATION.MAX_REASONABLE_SPEED_KM_H;
};

/**
 * ✅ NOUVEAU : Configuration présets pour différents environnements
 */
export const SECURITY_PRESETS = {
  // Production - Sécurité maximale
  PRODUCTION: {
    riskScoring: { enabled: true, requireMfaThreshold: 40, blockThreshold: 70 },
    geolocation: { enabled: true, impossibleTravelDetection: true },
    botDetection: { enabled: true, captchaThreshold: 30 },
    incidentResponse: { autoLockAccountRisk: 75, quarantineSuspiciousSessions: true },
  },

  // Staging - Sécurité modérée
  STAGING: {
    riskScoring: { enabled: true, requireMfaThreshold: 50, blockThreshold: 80 },
    geolocation: { enabled: true, impossibleTravelDetection: true },
    botDetection: { enabled: true, captchaThreshold: 40 },
    incidentResponse: { autoLockAccountRisk: 85, quarantineSuspiciousSessions: false },
  },

  // Development - Sécurité allégée
  DEVELOPMENT: {
    riskScoring: { enabled: false, requireMfaThreshold: 90, blockThreshold: 95 },
    geolocation: { enabled: false, impossibleTravelDetection: false },
    botDetection: { enabled: false, captchaThreshold: 90 },
    incidentResponse: { autoLockAccountRisk: 95, quarantineSuspiciousSessions: false },
  },
} as const;