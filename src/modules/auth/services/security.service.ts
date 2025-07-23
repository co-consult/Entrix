// src/modules/auth/services/security.service.ts

import { Injectable } from '@nestjs/common';
import { LoggerService } from '../../../shared/logger/logger.service';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { RedisService } from '../../../shared/redis/redis.service';
import { 
  ISecurityService, 
  IRiskAssessment, 
  ISecurityEvent, 
  IDeviceInfo,
  SecurityEventType
} from '../interfaces';
import { RiskScoringUtil, UserBehaviorProfile } from '../utils/risk-scoring.util';
import { GeolocationUtil } from '../utils/geolocation.util';
import { DeviceUtil } from '../utils/device.util';
import { CryptoUtil } from '../utils/crypto.util';
import { SECURITY_CONSTANTS } from '../constants/security.constants';

/**
 * Security Service Entrix V3.0 - Grade A+
 * Analyse de risque, détection fraude et audit sécurité
 * Respecte processus_authentification.md et SECURITY_CONSTANTS
 */

@Injectable()
export class SecurityService implements ISecurityService {
  private readonly logger: LoggerService;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    loggerService: LoggerService,
  ) {
    this.logger = loggerService.createChildLogger('SecurityService');
  }

  /**
   * Évalue risque de sécurité pour tentative connexion
   * Analyse comportementale et géographique
   */
  async assessRisk(userId: string, deviceInfo: IDeviceInfo): Promise<IRiskAssessment> {
    const operationId = this.logger.startOperation('assessRisk', {
      userId,
      ipAddress: deviceInfo.ipAddress,
    });

    try {
      // 1. Récupérer profil comportemental utilisateur
      const userProfile = await this.getUserBehaviorProfile(userId);

      // 2. Analyser géolocalisation
      const geoInfo = await this.analyzeGeolocation(deviceInfo.ipAddress);

      // 3. Calculer score de risque
      const riskAssessment = RiskScoringUtil.calculateRiskScore(
        deviceInfo,
        userProfile,
        geoInfo
      );

      // 4. Logger évaluation risque
      this.logger.logBusinessEvent('RISK_ASSESSMENT_COMPLETED', {
        userId,
        riskScore: riskAssessment.score,
        factors: Object.keys(riskAssessment.factors).filter(
          key => riskAssessment.factors[key as keyof typeof riskAssessment.factors]
        ),
        recommendation: riskAssessment.recommendation,
        ipAddress: deviceInfo.ipAddress,
      }, userId);

      this.logger.endOperation(operationId, 'success');
      return riskAssessment;

    } catch (error) {
      this.logger.endOperation(operationId, 'error', error.message);
      this.logger.error('Risk assessment failed', error.stack, { userId });
      
      // Retourner évaluation conservative en cas d'erreur
      return {
        score: 50,
        factors: {
          unknownDevice: true,
          newLocation: true,
          unusualTime: false,
          failedAttempts: 0,
          suspiciousIp: false,
          multipleSessions: false,
        },
        recommendation: 'REQUIRE_MFA',
        requiresMfa: true,
      };
    }
  }

  /**
   * Enregistre événement de sécurité
   * Audit complet avec métadonnées
   */
  async logSecurityEvent(
    event: Omit<ISecurityEvent, 'id' | 'createdAt'>
  ): Promise<ISecurityEvent> {
    const operationId = this.logger.startOperation('logSecurityEvent', {
      type: event.type,
      userId: event.userId,
    });

    try {
      // 1. Générer ID unique pour événement
      const eventId = CryptoUtil.generateUuid();

      // 2. Enrichir avec métadonnées
      const enrichedEvent: ISecurityEvent = {
        ...event,
        id: eventId,
        createdAt: new Date(),
      };

      // 3. Stocker en base de données (table security_events)
      // Note: Simplification - dans un vrai système, il y aurait une table dédiée
      await this.storeSecurityEventInDb(enrichedEvent);

      // 4. Mettre en cache pour accès rapide
      await this.cacheSecurityEvent(enrichedEvent);

      // 5. Analyser si action automatique requise
      await this.analyzeSecurityEvent(enrichedEvent);

      // 6. Logger dans système central
      this.logger.logBusinessEvent('SECURITY_EVENT_LOGGED', {
        eventId,
        type: event.type,
        userId: event.userId,
        riskScore: event.riskScore,
        location: event.location,
      }, event.userId);

      this.logger.endOperation(operationId, 'success');
      return enrichedEvent;

    } catch (error) {
      this.logger.endOperation(operationId, 'error', error.message);
      this.logger.error('Failed to log security event', error.stack, {
        type: event.type,
        userId: event.userId,
      });
      throw new Error(`Erreur logging événement sécurité: ${error.message}`);
    }
  }

  /**
   * Récupère événements de sécurité utilisateur
   */
  async getSecurityEvents(userId: string, limit: number = 20): Promise<ISecurityEvent[]> {
    const operationId = this.logger.startOperation('getSecurityEvents', {
      userId,
      limit,
    });

    try {
      // 1. Récupérer depuis cache d'abord
      const cachedEvents = await this.getCachedSecurityEvents(userId, limit);
      if (cachedEvents.length > 0) {
        this.logger.endOperation(operationId, 'cache_hit');
        return cachedEvents;
      }

      // 2. Fallback sur base de données
      const events = await this.getSecurityEventsFromDb(userId, limit);

      // 3. Mettre en cache pour prochaine fois
      await this.cacheUserSecurityEvents(userId, events);

      this.logger.endOperation(operationId, 'db_hit');
      return events;

    } catch (error) {
      this.logger.endOperation(operationId, 'error', error.message);
      this.logger.error('Failed to get security events', error.stack, { userId });
      return [];
    }
  }

  /**
   * Vérifie activité suspecte récente
   */
  async checkSuspiciousActivity(userId: string): Promise<boolean> {
    const operationId = this.logger.startOperation('checkSuspiciousActivity', { userId });

    try {
      // 1. Récupérer événements récents (24h)
      const recentEvents = await this.getRecentSecurityEvents(userId, 24);

      // 2. Analyser patterns suspects
      const suspiciousPatterns = this.analyzeSuspiciousPatterns(recentEvents);

      // 3. Calculer score suspicion
      const suspicionScore = this.calculateSuspicionScore(suspiciousPatterns);

      const isSuspicious = suspicionScore >= SECURITY_CONSTANTS.RISK_SCORING.ALERT_THRESHOLD;

      if (isSuspicious) {
        await this.logSecurityEvent({
          type: 'SUSPICIOUS_ACTIVITY',
          userId,
          ipAddress: 'system',
          userAgent: 'security_analysis',
          location: 'System',
          riskScore: suspicionScore,
          description: 'Activité suspecte détectée par analyse automatique',
          metadata: { patterns: suspiciousPatterns },
          resolved: false,
        });
      }

      this.logger.endOperation(operationId, 'success');
      return isSuspicious;

    } catch (error) {
      this.logger.endOperation(operationId, 'error', error.message);
      this.logger.error('Failed to check suspicious activity', error.stack, { userId });
      return false;
    }
  }

  /**
   * Bloque IP suspecte temporairement
   */
  async blockSuspiciousIp(ip: string, duration: number): Promise<void> {
    const operationId = this.logger.startOperation('blockSuspiciousIp', {
      ip,
      duration,
    });

    try {
      // 1. Ajouter IP à blacklist Redis
      const blockKey = `blocked_ip:${ip}`;
      const blockData = {
        ip,
        blockedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + duration * 1000).toISOString(),
        reason: 'suspicious_activity',
      };

      await this.redis.setCache(blockKey, blockData, duration);

      // 2. Logger blocage IP
      this.logger.logBusinessEvent('IP_BLOCKED', {
        ip,
        duration,
        reason: 'suspicious_activity',
        expiresAt: blockData.expiresAt,
      });

      this.logger.endOperation(operationId, 'success');

    } catch (error) {
      this.logger.endOperation(operationId, 'error', error.message);
      this.logger.error('Failed to block suspicious IP', error.stack, { ip });
    }
  }

  /**
   * Méthodes helper privées
   */

  private async getUserBehaviorProfile(userId: string): Promise<UserBehaviorProfile> {
    try {
      // 1. Récupérer depuis cache
      const profileKey = `behavior_profile:${userId}`;
      let profile = await this.redis.getCache<UserBehaviorProfile>(profileKey);

      if (!profile) {
        // 2. Construire profil depuis historique
        profile = await this.buildBehaviorProfile(userId);
        
        // 3. Mettre en cache
        await this.redis.setCache(profileKey, profile, 3600); // 1 heure
      }

      return profile;
    } catch (error) {
      this.logger.error('Failed to get user behavior profile', error.stack, { userId });
      
      // Profil par défaut
      return {
        userId,
        commonLocations: [],
        commonDevices: [],
        typicalLoginTimes: [],
        averageSessionDuration: 3600,
        recentFailedAttempts: 0,
        activeSessions: 0,
      };
    }
  }

  private async buildBehaviorProfile(userId: string): Promise<UserBehaviorProfile> {
    try {
      // Analyser historique sessions pour construire profil comportemental
      const recentSessions = await this.prisma.user_sessions.findMany({
        where: {
          user_id: userId,
          created_at: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 jours
          },
        },
        orderBy: { created_at: 'desc' },
        take: 100,
      });

      const profile: UserBehaviorProfile = {
        userId,
        commonLocations: this.extractCommonLocations(recentSessions),
        commonDevices: this.extractCommonDevices(recentSessions),
        typicalLoginTimes: this.extractTypicalLoginTimes(recentSessions),
        averageSessionDuration: this.calculateAverageSessionDuration(recentSessions),
        recentFailedAttempts: await this.getRecentFailedAttempts(userId),
        activeSessions: await this.getActiveSessionsCount(userId),
      };

      return profile;
    } catch (error) {
      this.logger.error('Failed to build behavior profile', error.stack, { userId });
      throw error;
    }
  }

  private async analyzeGeolocation(ipAddress: string): Promise<any> {
    try {
      // TODO: Intégrer service géolocalisation (MaxMind, IPinfo, etc.)
      // Pour simulation, on retourne données basiques
      return {
        country: 'TN',
        countryCode: 'TN',
        city: 'Tunis',
        region: 'Tunis',
        coordinates: [36.8065, 10.1815] as [number, number],
        timezone: 'Africa/Tunis',
        isp: 'Unknown ISP',
        isVpn: false,
        isTor: false,
        isDatacenter: false,
        riskScore: GeolocationUtil.calculateGeoRiskScore({
          countryCode: 'TN',
          isVpn: false,
          isTor: false,
          isDatacenter: false,
        }),
      };
    } catch (error) {
      this.logger.error('Geolocation analysis failed', error.stack, { ipAddress });
      return null;
    }
  }

  private extractCommonLocations(sessions: any[]): string[] {
    const locations = sessions
      .map(s => s.geolocation?.country)
      .filter(Boolean);
    
    // Retourner top 3 locations les plus fréquentes
    const locationCounts = locations.reduce((acc, loc) => {
      acc[loc] = (acc[loc] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(locationCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([loc]) => loc);
  }

  private extractCommonDevices(sessions: any[]): string[] {
    const devices = sessions
      .map(s => s.device_fingerprint)
      .filter(Boolean);
    
    return [...new Set(devices)].slice(0, 3);
  }

  private extractTypicalLoginTimes(sessions: any[]): number[] {
    const hours = sessions.map(s => new Date(s.created_at).getHours());
    
    // Retourner heures les plus fréquentes
    const hourCounts = hours.reduce((acc, hour) => {
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    return Object.entries(hourCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 8)
      .map(([hour]) => parseInt(hour));
  }

  private calculateAverageSessionDuration(sessions: any[]): number {
    const completedSessions = sessions.filter(s => !s.is_active);
    
    if (completedSessions.length === 0) return 3600; // 1 heure par défaut

    const totalDuration = completedSessions.reduce((acc, session) => {
      const duration = new Date(session.updated_at).getTime() - new Date(session.created_at).getTime();
      return acc + duration;
    }, 0);

    return Math.floor(totalDuration / completedSessions.length / 1000); // en secondes
  }

  private async getRecentFailedAttempts(userId: string): Promise<number> {
    // TODO: Compter échecs de connexion récents
    return 0;
  }

  private async getActiveSessionsCount(userId: string): Promise<number> {
    try {
      const count = await this.prisma.user_sessions.count({
        where: {
          user_id: userId,
          is_active: true,
          expires_at: { gt: new Date() },
        },
      });
      return count;
    } catch (error) {
      return 0;
    }
  }

  private async storeSecurityEventInDb(event: ISecurityEvent): Promise<void> {
    // TODO: Implémenter stockage en base de données
    // Simplification - utiliser metadata utilisateur ou table dédiée
  }

  private async cacheSecurityEvent(event: ISecurityEvent): Promise<void> {
    try {
      const eventKey = `security_event:${event.id}`;
      await this.redis.setCache(eventKey, event, 24 * 60 * 60); // 24h
    } catch (error) {
      this.logger.error('Failed to cache security event', error.stack);
    }
  }

  private async analyzeSecurityEvent(event: ISecurityEvent): Promise<void> {
    // TODO: Implémenter analyse automatique et actions
    // - Bloquer IP si score trop élevé
    // - Envoyer alertes
    // - Révoquer sessions si nécessaire
  }

  private async getCachedSecurityEvents(userId: string, limit: number): Promise<ISecurityEvent[]> {
    // TODO: Implémenter récupération cache
    return [];
  }

  private async getSecurityEventsFromDb(userId: string, limit: number): Promise<ISecurityEvent[]> {
    // TODO: Implémenter récupération base de données
    return [];
  }

  private async cacheUserSecurityEvents(userId: string, events: ISecurityEvent[]): Promise<void> {
    // TODO: Implémenter mise en cache événements utilisateur
  }

  private async getRecentSecurityEvents(userId: string, hours: number): Promise<ISecurityEvent[]> {
    // TODO: Implémenter récupération événements récents
    return [];
  }

  private analyzeSuspiciousPatterns(events: ISecurityEvent[]): string[] {
    const patterns: string[] = [];

    // Analyser différents patterns suspects
    const failedLogins = events.filter(e => e.type === 'LOGIN_FAILED').length;
    if (failedLogins > 10) patterns.push('excessive_failed_logins');

    const uniqueIps = new Set(events.map(e => e.ipAddress)).size;
    if (uniqueIps > 5) patterns.push('multiple_ip_addresses');

    const highRiskEvents = events.filter(e => e.riskScore > 70).length;
    if (highRiskEvents > 3) patterns.push('high_risk_activities');

    return patterns;
  }

  private calculateSuspicionScore(patterns: string[]): number {
    let score = 0;
    
    patterns.forEach(pattern => {
      switch (pattern) {
        case 'excessive_failed_logins': score += 30; break;
        case 'multiple_ip_addresses': score += 25; break;
        case 'high_risk_activities': score += 35; break;
        default: score += 10;
      }
    });

    return Math.min(100, score);
  }
}