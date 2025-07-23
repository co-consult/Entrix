// src/modules/auth/utils/risk-scoring.util.ts

import { IDeviceInfo } from '../interfaces/session.interface';
import { IRiskAssessment } from '../interfaces/security.interface';
import { SECURITY_CONSTANTS } from '../constants/security.constants';
import { GeolocationUtil, GeolocationInfo } from './geolocation.util';
import { DeviceUtil } from './device.util';

/**
 * Utilitaires Risk Scoring Entrix V3.0
 * Analyse comportementale et détection fraude
 */

export interface RiskFactors {
  unknownDevice: boolean;
  newLocation: boolean;
  unusualTime: boolean;
  failedAttempts: number;
  suspiciousIp: boolean;
  multipleSessions: boolean;
  velocityAnomaly: boolean;
  browserInconsistency: boolean;
}

export interface UserBehaviorProfile {
  userId: string;
  commonLocations: string[];
  commonDevices: string[];
  typicalLoginTimes: number[]; // Heures de la journée
  averageSessionDuration: number;
  lastLoginLocation?: string;
  lastLoginDevice?: string;
  recentFailedAttempts: number;
  activeSessions: number;
}

export class RiskScoringUtil {
  /**
   * Calcule score de risque global
   */
  static calculateRiskScore(
    deviceInfo: IDeviceInfo,
    userProfile: UserBehaviorProfile,
    geoInfo?: Partial<GeolocationInfo>
  ): IRiskAssessment {
    const factors = this.analyzeRiskFactors(deviceInfo, userProfile, geoInfo);
    const score = this.computeRiskScore(factors);
    const recommendation = this.getRecommendation(score);

    return {
      score,
      factors,
      recommendation,
      requiresMfa: score >= SECURITY_CONSTANTS.RISK_SCORING.REQUIRE_MFA_THRESHOLD,
    };
  }

  /**
   * Analyse les facteurs de risque individuels
   */
  private static analyzeRiskFactors(
    deviceInfo: IDeviceInfo,
    userProfile: UserBehaviorProfile,
    geoInfo?: Partial<GeolocationInfo>
  ): RiskFactors {
    return {
      unknownDevice: this.isUnknownDevice(deviceInfo, userProfile),
      newLocation: this.isNewLocation(deviceInfo, userProfile),
      unusualTime: this.isUnusualTime(new Date(), userProfile),
      failedAttempts: userProfile.recentFailedAttempts,
      suspiciousIp: this.isSuspiciousIp(deviceInfo, geoInfo),
      multipleSessions: userProfile.activeSessions > SECURITY_CONSTANTS.SUSPICIOUS_PATTERNS.MULTIPLE_IP_SESSIONS,
      velocityAnomaly: this.detectVelocityAnomaly(deviceInfo, userProfile),
      browserInconsistency: this.detectBrowserInconsistency(deviceInfo),
    };
  }

  /**
   * Calcule score numérique basé sur les facteurs
   */
  private static computeRiskScore(factors: RiskFactors): number {
    let score = 0;

    // Facteurs de risque avec poids
    if (factors.unknownDevice) score += SECURITY_CONSTANTS.RISK_SCORING.UNKNOWN_DEVICE;
    if (factors.newLocation) score += SECURITY_CONSTANTS.RISK_SCORING.NEW_LOCATION;
    if (factors.unusualTime) score += SECURITY_CONSTANTS.RISK_SCORING.UNUSUAL_TIME;
    if (factors.suspiciousIp) score += SECURITY_CONSTANTS.RISK_SCORING.TOR_IP;
    if (factors.multipleSessions) score += SECURITY_CONSTANTS.RISK_SCORING.MULTIPLE_SESSIONS;

    // Tentatives échouées (progressif)
    if (factors.failedAttempts > 0) {
      score += Math.min(SECURITY_CONSTANTS.RISK_SCORING.FAILED_ATTEMPTS, factors.failedAttempts * 10);
    }

    // Anomalies comportementales
    if (factors.velocityAnomaly) score += 20;
    if (factors.browserInconsistency) score += 15;

    return Math.min(100, Math.max(0, score));
  }

  /**
   * Détermine la recommandation d'action
   */
  private static getRecommendation(score: number): 'ALLOW' | 'REQUIRE_MFA' | 'BLOCK' | 'ALERT' {
    if (score >= SECURITY_CONSTANTS.RISK_SCORING.BLOCK_THRESHOLD) return 'BLOCK';
    if (score >= SECURITY_CONSTANTS.RISK_SCORING.ALERT_THRESHOLD) return 'ALERT';
    if (score >= SECURITY_CONSTANTS.RISK_SCORING.REQUIRE_MFA_THRESHOLD) return 'REQUIRE_MFA';
    return 'ALLOW';
  }

  /**
   * Vérifie si l'appareil est inconnu
   */
  private static isUnknownDevice(deviceInfo: IDeviceInfo, userProfile: UserBehaviorProfile): boolean {
    const deviceFingerprint = DeviceUtil.generateDeviceFingerprint(deviceInfo);
    return !userProfile.commonDevices.includes(deviceFingerprint);
  }

  /**
   * Vérifie si la localisation est nouvelle
   */
  private static isNewLocation(deviceInfo: IDeviceInfo, userProfile: UserBehaviorProfile): boolean {
    const currentLocation = deviceInfo.geolocation?.country || 'Unknown';
    return !userProfile.commonLocations.includes(currentLocation);
  }

  /**
   * Vérifie si l'heure est inhabituelle
   */
  private static isUnusualTime(loginTime: Date, userProfile: UserBehaviorProfile): boolean {
    const hour = loginTime.getHours();
    const typicalHours = userProfile.typicalLoginTimes;
    
    if (typicalHours.length === 0) return false;
    
    // Considère comme inhabituel si l'heure est à plus de 3h des heures habituelles
    return !typicalHours.some(typicalHour => Math.abs(hour - typicalHour) <= 3);
  }

  /**
   * Vérifie si l'IP est suspecte
   */
  private static isSuspiciousIp(deviceInfo: IDeviceInfo, geoInfo?: Partial<GeolocationInfo>): boolean {
    if (!geoInfo) return false;
    
    return geoInfo.isTor || 
           geoInfo.isVpn || 
           geoInfo.isDatacenter ||
           (geoInfo.countryCode && GeolocationUtil.isHighRiskCountry(geoInfo.countryCode));
  }

  /**
   * Détecte anomalie de vélocité (déplacements impossibles)
   */
  private static detectVelocityAnomaly(deviceInfo: IDeviceInfo, userProfile: UserBehaviorProfile): boolean {
    if (!userProfile.lastLoginLocation || !deviceInfo.geolocation?.coordinates) {
      return false;
    }

    // Logique simplifiée - dans un vrai système, on comparerait avec la géolocalisation précédente
    // et calculerait la vitesse de déplacement nécessaire
    const lastLocation = userProfile.lastLoginLocation;
    const currentLocation = deviceInfo.geolocation.country;
    
    // Si changement de pays en moins d'1 heure, c'est suspect
    return lastLocation !== currentLocation;
  }

  /**
   * Détecte incohérence navigateur
   */
  private static detectBrowserInconsistency(deviceInfo: IDeviceInfo): boolean {
    const userAgent = deviceInfo.userAgent;
    
    // Détecte signatures d'automation
    return SECURITY_CONSTANTS.SUSPICIOUS_PATTERNS.AUTOMATION_DETECTED.test(userAgent) ||
           SECURITY_CONSTANTS.SUSPICIOUS_PATTERNS.UNUSUAL_USER_AGENT.test(userAgent);
  }

  /**
   * Met à jour le profil comportemental après login
   */
  static updateUserBehaviorProfile(
    userProfile: UserBehaviorProfile,
    deviceInfo: IDeviceInfo,
    loginSuccess: boolean
  ): UserBehaviorProfile {
    const updatedProfile = { ...userProfile };

    if (loginSuccess) {
      // Ajoute localisation si nouvelle
      const location = deviceInfo.geolocation?.country;
      if (location && !updatedProfile.commonLocations.includes(location)) {
        updatedProfile.commonLocations.push(location);
        // Garde seulement les 5 dernières localisations
        if (updatedProfile.commonLocations.length > 5) {
          updatedProfile.commonLocations = updatedProfile.commonLocations.slice(-5);
        }
      }

      // Ajoute device si nouveau
      const deviceFingerprint = DeviceUtil.generateDeviceFingerprint(deviceInfo);
      if (!updatedProfile.commonDevices.includes(deviceFingerprint)) {
        updatedProfile.commonDevices.push(deviceFingerprint);
        // Garde seulement les 3 derniers devices
        if (updatedProfile.commonDevices.length > 3) {
          updatedProfile.commonDevices = updatedProfile.commonDevices.slice(-3);
        }
      }

      // Met à jour heure de connexion habituelle
      const currentHour = new Date().getHours();
      if (!updatedProfile.typicalLoginTimes.includes(currentHour)) {
        updatedProfile.typicalLoginTimes.push(currentHour);
        // Garde seulement les 8 heures les plus courantes
        if (updatedProfile.typicalLoginTimes.length > 8) {
          updatedProfile.typicalLoginTimes = updatedProfile.typicalLoginTimes.slice(-8);
        }
      }

      // Reset failed attempts
      updatedProfile.recentFailedAttempts = 0;
      updatedProfile.lastLoginLocation = location;
      updatedProfile.lastLoginDevice = deviceFingerprint;
    } else {
      // Incrémente tentatives échouées
      updatedProfile.recentFailedAttempts += 1;
    }

    return updatedProfile;
  }
}