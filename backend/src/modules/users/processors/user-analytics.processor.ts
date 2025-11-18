// src/modules/users/processors/user-analytics.processor.ts

import { Processor, Process } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { Job } from 'bull';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { RedisService } from '../../../shared/redis/redis.service';
import { LoggerService } from '../../../shared/logger/logger.service';
import { audit_action } from '@prisma/client';

export interface UserActivityJobData {
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  metadata?: Record<string, any>;
  timestamp: Date;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  referrer?: string;
}

export interface UserBehaviorJobData {
  userId: string;
  eventType: 'PAGE_VIEW' | 'SEARCH' | 'FILTER' | 'CLICK' | 'PURCHASE' | 'SHARE';
  page?: string;
  searchQuery?: string;
  filters?: Record<string, any>;
  clickTarget?: string;
  purchaseData?: {
    orderId: string;
    amount: number;
    items: number;
    category: string;
  };
  shareData?: {
    platform: string;
    contentType: string;
    contentId: string;
  };
  sessionData: {
    sessionId: string;
    sessionStart: Date;
    pageNumber: number;
    timeOnPage?: number;
  };
  deviceData: {
    type: 'desktop' | 'mobile' | 'tablet';
    browser: string;
    os: string;
    screenSize?: string;
  };
  timestamp: Date;
}

export interface UserEngagementJobData {
  userId: string;
  engagementType: 'LOGIN' | 'PROFILE_UPDATE' | 'PREFERENCE_CHANGE' | 'SOCIAL_INTERACTION' | 'SUPPORT_CONTACT';
  details: Record<string, any>;
  timestamp: Date;
}

export interface UserRetentionJobData {
  userId: string;
  cohortMonth: string; // YYYY-MM
  registrationDate: Date;
  lastActiveDate: Date;
  totalSessions: number;
  totalPurchases: number;
  totalSpent: number;
  isActive: boolean;
  riskScore?: number;
}

@Injectable()
@Processor('analytics')
export class UserAnalyticsProcessor {
  private readonly logger: LoggerService;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
    logger: LoggerService,
  ) {
    this.logger = logger.createChildLogger('UserAnalyticsProcessor');
  }

  @Process('track-user-activity')
  async processUserActivity(job: Job<UserActivityJobData>): Promise<void> {
    const { 
      userId, 
      action, 
      resource, 
      resourceId, 
      metadata, 
      timestamp, 
      sessionId,
      ipAddress,
      userAgent,
      referrer 
    } = job.data;

    this.logger.info('Processing user activity tracking', JSON.stringify({
      jobId: job.id,
      userId,
      action,
      resource,
      resourceId,
    }));

    try {
      // Enregistrer l'activité dans audit_logs au lieu de user_activities
      await this.prisma.executeWithRetry(async () => {
        await this.prisma.audit_logs.create({
          data: {
            user_id: userId,
            table_name: resource,
            record_id: resourceId,
            action: this.mapActionToAuditAction(action),
            new_values: {
              action,
              resource,
              resourceId,
              sessionId,
              referrer,
              timestamp: timestamp.toISOString(),
            },
            ip_address: ipAddress,
            user_agent: userAgent,
            description: `User activity: ${action} on ${resource}`,
            metadata: metadata || {},
            created_at: new Date(timestamp),
          },
        });
      }, 3, 1000);

      // Mettre à jour les métriques en temps réel dans Redis
      await this.updateRealTimeMetrics(userId, action, resource, timestamp);

      // Mettre à jour la dernière activité de l'utilisateur
      await this.updateLastActivity(userId, timestamp);

      // Analyser les patterns d'utilisation
      if (this.isSignificantActivity(action, resource)) {
        await this.analyzeUsagePatterns(userId, action, resource, timestamp);
      }

      this.logger.info('User activity tracked successfully', JSON.stringify({
        userId,
        action,
        resource,
        jobId: job.id,
      }));

      // Logger l'événement business si c'est une action importante
      if (this.isBusinessCriticalActivity(action, resource)) {
        this.logger.logBusinessEvent(
          'USER_ACTIVITY_TRACKED',
          {
            userId,
            action,
            resource,
            resourceId,
            sessionId,
            hasMetadata: !!metadata,
          },
          userId,
        );
      }

    } catch (error) {
      this.logger.error(
        'Failed to process user activity',
        error.stack,
        JSON.stringify({
          userId,
          action,
          resource,
          jobId: job.id,
        }),
      );

      throw error;
    }
  }

  @Process('track-user-behavior')
  async processUserBehavior(job: Job<UserBehaviorJobData>): Promise<void> {
    const { 
      userId, 
      eventType, 
      sessionData, 
      deviceData, 
      timestamp,
      ...eventSpecificData 
    } = job.data;

    this.logger.info('Processing user behavior tracking', JSON.stringify({
      jobId: job.id,
      userId,
      eventType,
      sessionId: sessionData.sessionId,
      deviceType: deviceData.type,
    }));

    try {
      // Enregistrer le comportement dans audit_logs au lieu de user_behaviors
      await this.prisma.executeWithRetry(async () => {
        await this.prisma.audit_logs.create({
          data: {
            user_id: userId,
            table_name: 'user_behavior',
            action: 'CREATE',
            new_values: {
              eventType,
              sessionId: sessionData.sessionId,
              pageNumber: sessionData.pageNumber,
              timeOnPage: sessionData.timeOnPage,
              deviceType: deviceData.type,
              browser: deviceData.browser,
              os: deviceData.os,
              screenSize: deviceData.screenSize,
              eventData: eventSpecificData,
              timestamp: timestamp.toISOString(),
            },
            description: `User behavior: ${eventType}`,
            metadata: {
              behaviorType: eventType,
              device: deviceData,
              session: sessionData,
            },
            created_at: new Date(timestamp),
          },
        });
      }, 3, 1000);

      // Mettre à jour les métriques comportementales
      await this.updateBehaviorMetrics(userId, eventType, deviceData.type, timestamp);

      // Analyser les patterns de navigation
      if (eventType === 'PAGE_VIEW') {
        await this.analyzeNavigationPatterns(userId, sessionData, timestamp);
      }

      // Analyser les conversions si c'est un achat
      if (eventType === 'PURCHASE' && eventSpecificData.purchaseData) {
        await this.analyzePurchaseConversion(userId, eventSpecificData.purchaseData, sessionData, timestamp);
      }

      // Détecter l'engagement utilisateur
      await this.updateEngagementScore(userId, eventType, sessionData, timestamp);

      this.logger.info('User behavior tracked successfully', JSON.stringify({
        userId,
        eventType,
        sessionId: sessionData.sessionId,
        jobId: job.id,
      }));

    } catch (error) {
      this.logger.error(
        'Failed to process user behavior',
        error.stack,
        JSON.stringify({
          userId,
          eventType,
          jobId: job.id,
        }),
      );

      throw error;
    }
  }

  @Process('update-user-engagement')
  async processUserEngagement(job: Job<UserEngagementJobData>): Promise<void> {
    const { userId, engagementType, details, timestamp } = job.data;

    this.logger.info('Processing user engagement update', JSON.stringify({
      jobId: job.id,
      userId,
      engagementType,
    }));

    try {
      // Calculer le score d'engagement
      const engagementScore = await this.calculateEngagementScore(userId, engagementType, details, timestamp);

      // Stocker l'engagement dans audit_logs au lieu de user_engagement_profiles
      await this.prisma.audit_logs.create({
        data: {
          user_id: userId,
          table_name: 'user_engagement',
          action: 'CREATE',
          new_values: {
            engagementType,
            engagementScore,
            details,
            timestamp: timestamp.toISOString(),
          },
          description: `User engagement: ${engagementType}`,
          metadata: {
            engagementScore,
            engagementType,
            details,
          },
          created_at: new Date(timestamp),
        },
      });

      // Mettre à jour les métriques d'engagement en cache Redis
      await this.updateEngagementCache(userId, engagementType, engagementScore);

      // Détecter les utilisateurs à risque
      if (engagementScore < 30) {
        await this.flagUserAtRisk(userId, engagementScore, 'LOW_ENGAGEMENT');
      }

      this.logger.info('User engagement updated successfully', JSON.stringify({
        userId,
        engagementType,
        engagementScore,
        jobId: job.id,
      }));

      // Logger l'événement business
      this.logger.logBusinessEvent(
        'USER_ENGAGEMENT_UPDATED',
        {
          userId,
          engagementType,
          engagementScore,
          details,
        },
        userId,
      );

    } catch (error) {
      this.logger.error(
        'Failed to process user engagement',
        error.stack,
        JSON.stringify({
          userId,
          engagementType,
          jobId: job.id,
        }),
      );

      throw error;
    }
  }

  @Process('calculate-user-retention')
  async processUserRetention(job: Job<UserRetentionJobData>): Promise<void> {
    const { 
      userId, 
      cohortMonth, 
      registrationDate, 
      lastActiveDate, 
      totalSessions,
      totalPurchases,
      totalSpent,
      isActive,
      riskScore 
    } = job.data;

    this.logger.info('Processing user retention calculation', JSON.stringify({
      jobId: job.id,
      userId,
      cohortMonth,
      isActive,
      riskScore,
    }));

    try {
      // Calculer les métriques de rétention
      const daysSinceRegistration = Math.floor((Date.now() - new Date(registrationDate).getTime()) / (1000 * 60 * 60 * 24));
      const daysSinceLastActive = Math.floor((Date.now() - new Date(lastActiveDate).getTime()) / (1000 * 60 * 60 * 24));
      
      const retentionMetrics = {
        daysSinceRegistration,
        daysSinceLastActive,
        avgSessionsPerDay: daysSinceRegistration > 0 ? totalSessions / daysSinceRegistration : 0,
        avgSpentPerSession: totalSessions > 0 ? totalSpent / totalSessions : 0,
        isAtRisk: daysSinceLastActive > 30 || (riskScore && riskScore > 70),
        lifetimeValue: totalSpent,
        sessionFrequency: totalSessions,
        purchaseFrequency: totalPurchases,
      };

      // Stocker dans audit_logs au lieu de user_retention_cohorts
      await this.prisma.audit_logs.create({
        data: {
          user_id: userId,
          table_name: 'user_retention',
          action: 'UPDATE',
          new_values: {
            cohortMonth,
            retentionMetrics,
            calculatedAt: new Date().toISOString(),
          },
          description: `User retention calculated for cohort ${cohortMonth}`,
          metadata: {
            retentionMetrics,
            cohortMonth,
            isActive,
            riskScore,
          },
          created_at: new Date(),
        },
      });

      // Mettre à jour le cache de rétention
      await this.updateRetentionCache(userId, cohortMonth, retentionMetrics);

      // Déclencher des actions si l'utilisateur est à risque
      if (retentionMetrics.isAtRisk) {
        await this.triggerRetentionActions(userId, retentionMetrics);
      }

      this.logger.info('User retention calculated successfully', JSON.stringify({
        userId,
        cohortMonth,
        isAtRisk: retentionMetrics.isAtRisk,
        jobId: job.id,
      }));

      // Logger l'événement business
      this.logger.logBusinessEvent(
        'USER_RETENTION_CALCULATED',
        {
          userId,
          cohortMonth,
          isActive,
          daysSinceRegistration,
          daysSinceLastActive,
        },
        userId,
      );

    } catch (error) {
      this.logger.error(
        'Failed to process user retention',
        error.stack,
        JSON.stringify({
          userId,
          cohortMonth,
          jobId: job.id,
        }),
      );

      throw error;
    }
  }

  /**
   * Map les actions vers les audit_action enum values
   */
  private mapActionToAuditAction(action: string): audit_action {
    const actionMap: Record<string, audit_action> = {
      'CREATE': 'CREATE',
      'create': 'CREATE',
      'READ': 'READ',
      'UPDATE': 'UPDATE',
      'update': 'UPDATE',
      'DELETE': 'DELETE',
      'delete': 'DELETE',
      'login': 'LOGIN',
      'LOGIN': 'LOGIN',
      'logout': 'LOGOUT',
      'LOGOUT': 'LOGOUT',
      'view': 'READ',
      'click': 'READ',
      'purchase': 'CREATE',
      'search': 'READ',
      'filter': 'READ',
      'share': 'CREATE',
      'export': 'EXPORT',
      'import': 'IMPORT',
      'approve': 'APPROVE',
      'reject': 'REJECT',
      'suspend': 'SUSPEND',
      'activate': 'ACTIVATE',
    };
    
    return actionMap[action] || 'READ';
  }

  /**
   * Met à jour les métriques en temps réel dans Redis
   */
  private async updateRealTimeMetrics(userId: string, action: string, resource: string, timestamp: Date): Promise<void> {
    try {
      const date = new Date(timestamp).toISOString().split('T')[0]; // YYYY-MM-DD
      const hour = new Date(timestamp).getHours();

      // Compteurs globaux avec TTL (30 jours)
      const ttl = 30 * 24 * 60 * 60; // 30 jours
      
      await this.redisService.increment(`metrics:daily:${date}:activities`, ttl);
      await this.redisService.increment(`metrics:hourly:${date}:${hour}:activities`, ttl);
      
      // Compteurs par utilisateur
      await this.redisService.increment(`metrics:user:${userId}:daily:${date}:activities`, ttl);
      
      // Compteurs par action
      await this.redisService.increment(`metrics:action:${action}:daily:${date}`, ttl);
      
      // Compteurs par ressource
      await this.redisService.increment(`metrics:resource:${resource}:daily:${date}`, ttl);
      
    } catch (error) {
      this.logger.error('Failed to update real-time metrics', error.stack, JSON.stringify({ userId }));
    }
  }

  /**
   * Met à jour la dernière activité de l'utilisateur
   */
  private async updateLastActivity(userId: string, timestamp: Date): Promise<void> {
    try {
      await this.redisService.setCache(`user:${userId}:last_activity`, timestamp.toISOString(), 86400);
      
      // Mettre à jour aussi en base avec retry
      await this.prisma.executeWithRetry(async () => {
        await this.prisma.users.update({
          where: { id: userId },
          data: { last_login: timestamp },
        });
      }, 2, 500);
      
    } catch (error) {
      this.logger.error('Failed to update last activity', error.stack, JSON.stringify({ userId }));
    }
  }

  /**
   * Vérifie si une activité est significative pour l'analyse
   */
  private isSignificantActivity(action: string, resource: string): boolean {
    const significantActions = ['CREATE', 'UPDATE', 'DELETE', 'purchase'];
    const significantResources = ['orders', 'tickets', 'subscriptions', 'events'];
    
    return significantActions.includes(action) || significantResources.includes(resource);
  }

  /**
   * Vérifie si une activité est critique pour le business
   */
  private isBusinessCriticalActivity(action: string, resource: string): boolean {
    const criticalCombinations = [
      { action: 'purchase', resource: 'orders' },
      { action: 'CREATE', resource: 'tickets' },
      { action: 'CREATE', resource: 'subscriptions' },
      { action: 'DELETE', resource: 'users' },
    ];
    
    return criticalCombinations.some(
      combo => combo.action === action && combo.resource === resource
    );
  }

  /**
   * Analyse les patterns d'utilisation
   */
  private async analyzeUsagePatterns(userId: string, action: string, resource: string, timestamp: Date): Promise<void> {
    try {
      const date = new Date(timestamp).toISOString().split('T')[0];
      const hour = new Date(timestamp).getHours();
      
      // Stocker les patterns temporels
      await this.redisService.increment(`patterns:user:${userId}:hour:${hour}`, 86400);
      await this.redisService.increment(`patterns:user:${userId}:action:${action}`, 86400);
      
      // Analyser la fréquence des actions
      const recentActions = await this.redisService.getCache(`patterns:user:${userId}:recent`);
      const actions = recentActions ? JSON.parse(recentActions as string) : [];
      
      actions.push({ action, resource, timestamp: timestamp.toISOString() });
      
      // Garder seulement les 50 dernières actions
      if (actions.length > 50) {
        actions.splice(0, actions.length - 50);
      }
      
      await this.redisService.setCache(
        `patterns:user:${userId}:recent`, 
        JSON.stringify(actions), 
        86400
      );
      
    } catch (error) {
      this.logger.error('Failed to analyze usage patterns', error.stack, JSON.stringify({ userId }));
    }
  }

  /**
   * Met à jour les métriques comportementales
   */
  private async updateBehaviorMetrics(userId: string, eventType: string, deviceType: string, timestamp: Date): Promise<void> {
    try {
      const date = new Date(timestamp).toISOString().split('T')[0];
      
      // Métriques par type d'événement
      await this.redisService.increment(`behavior:${eventType}:daily:${date}`, 86400);
      
      // Métriques par utilisateur
      await this.redisService.increment(`behavior:user:${userId}:${eventType}:daily:${date}`, 86400);
      
      // Métriques par device
      await this.redisService.increment(`behavior:device:${deviceType}:daily:${date}`, 86400);
      
    } catch (error) {
      this.logger.error('Failed to update behavior metrics', error.stack, JSON.stringify({ userId }));
    }
  }

  /**
   * Analyse les patterns de navigation
   */
  private async analyzeNavigationPatterns(userId: string, sessionData: any, timestamp: Date): Promise<void> {
    try {
      const sessionKey = `navigation:${userId}:${sessionData.sessionId}`;
      
      // Récupérer la navigation existante
      const existingNavigation = await this.redisService.getCache(sessionKey);
      const navigation = existingNavigation ? JSON.parse(existingNavigation as string) : [];
      
      // Ajouter la nouvelle page
      navigation.push({
        pageNumber: sessionData.pageNumber,
        timeOnPage: sessionData.timeOnPage,
        timestamp: timestamp.toISOString(),
      });
      
      // Sauvegarder (TTL de 24h)
      await this.redisService.setCache(sessionKey, JSON.stringify(navigation), 86400);
      
      // Analyser les abandons si temps sur page très faible
      if (sessionData.timeOnPage && sessionData.timeOnPage < 5) {
        await this.redisService.increment(`abandons:user:${userId}:daily`, 86400);
      }
      
    } catch (error) {
      this.logger.error('Failed to analyze navigation patterns', error.stack, JSON.stringify({ userId }));
    }
  }

  /**
   * Analyse les conversions d'achat
   */
  private async analyzePurchaseConversion(userId: string, purchaseData: any, sessionData: any, timestamp: Date): Promise<void> {
    try {
      const conversionData = {
        orderId: purchaseData.orderId,
        amount: purchaseData.amount,
        items: purchaseData.items,
        category: purchaseData.category,
        sessionId: sessionData.sessionId,
        pageNumber: sessionData.pageNumber,
        timestamp: timestamp.toISOString(),
      };
      
      // Stocker la conversion
      await this.redisService.setCache(
        `conversion:${userId}:${purchaseData.orderId}`, 
        JSON.stringify(conversionData), 
        604800 // 7 jours
      );
      
      // Incrémenter les métriques de conversion
      const date = new Date(timestamp).toISOString().split('T')[0];
      await this.redisService.increment(`conversions:daily:${date}`, 86400);
      await this.redisService.increment(`conversions:user:${userId}:daily:${date}`, 86400);
      
    } catch (error) {
      this.logger.error('Failed to analyze purchase conversion', error.stack, JSON.stringify({ userId }));
    }
  }

  /**
   * Met à jour le score d'engagement
   */
  private async updateEngagementScore(userId: string, eventType: string, sessionData: any, timestamp: Date): Promise<void> {
    try {
      // Calculer le score de base selon le type d'événement
      const baseScore = this.getBaseEngagementScore(eventType);
      
      // Bonus pour le temps passé sur la page
      const timeBonus = sessionData.timeOnPage ? 
        Math.min(sessionData.timeOnPage / 60, 10) : 0; // Bonus jusqu'à 10 points
      const totalScore = baseScore + timeBonus;
      
      // Mettre à jour le score dans Redis
      await this.redisService.increment(`engagement:${userId}:daily`, Math.round(totalScore));
      
    } catch (error) {
      this.logger.error('Failed to update engagement score', error.stack, JSON.stringify({ userId }));
    }
  }

  /**
   * Calcule le score d'engagement de base
   */
  private getBaseEngagementScore(eventType: string): number {
    const scores: Record<string, number> = {
      'PAGE_VIEW': 1,
      'SEARCH': 3,
      'FILTER': 2,
      'CLICK': 2,
      'PURCHASE': 10,
      'SHARE': 5,
    };
    
    return scores[eventType] || 1;
  }

  /**
   * Calcule le score d'engagement global
   */
  private async calculateEngagementScore(userId: string, engagementType: string, details: Record<string, any>, timestamp: Date): Promise<number> {
    try {
      // Score de base selon le type d'engagement
      const baseScores: Record<string, number> = {
        'LOGIN': 10,
        'PROFILE_UPDATE': 15,
        'PREFERENCE_CHANGE': 5,
        'SOCIAL_INTERACTION': 20,
        'SUPPORT_CONTACT': 8,
      };
      
      let score = baseScores[engagementType] || 5;
      
      // Bonus pour la fréquence d'engagement
      const recentEngagement = await this.redisService.getCache(`engagement:${userId}:daily`);
      if (recentEngagement && typeof recentEngagement === 'string') {
        const currentScore = parseInt(recentEngagement, 10) || 0;
        score += Math.min(currentScore * 0.1, 20); // Bonus jusqu'à 20 points
      }
      
      return Math.min(score, 100); // Score maximum de 100
      
    } catch (error) {
      this.logger.error('Failed to calculate engagement score', error.stack, JSON.stringify({ userId }));
      return 5; // Score par défaut
    }
  }

  /**
   * Met à jour le cache d'engagement
   */
  private async updateEngagementCache(userId: string, engagementType: string, score: number): Promise<void> {
    try {
      const date = new Date().toISOString().split('T')[0];
      
      // Mettre à jour les compteurs d'engagement
      await this.redisService.increment(`engagement:${userId}:${engagementType}:daily:${date}`, 1);
      await this.redisService.setCache(`engagement:${userId}:score:latest`, score.toString(), 86400);
      
    } catch (error) {
      this.logger.error('Failed to update engagement cache', error.stack, JSON.stringify({ userId }));
    }
  }

  /**
   * Marque un utilisateur comme à risque
   */
  private async flagUserAtRisk(userId: string, score: number, reason: string): Promise<void> {
    try {
      const riskData = {
        userId,
        score,
        reason,
        flaggedAt: new Date().toISOString(),
      };
      
      await this.redisService.setCache(`risk:${userId}`, JSON.stringify(riskData), 604800); // 7 jours
      
      // Enregistrer dans audit_logs
      await this.prisma.audit_logs.create({
        data: {
          user_id: userId,
          table_name: 'user_risk',
          action: 'CREATE',
          new_values: riskData,
          description: `User flagged as at-risk: ${reason}`,
          metadata: { riskScore: score, reason },
          created_at: new Date(),
        },
      });
      
    } catch (error) {
      this.logger.error('Failed to flag user at risk', error.stack, JSON.stringify({ userId }));
    }
  }

  /**
   * Met à jour le cache de rétention
   */
  private async updateRetentionCache(userId: string, cohortMonth: string, metrics: any): Promise<void> {
    try {
      const cacheKey = `retention:${cohortMonth}:${userId}`;
      await this.redisService.setCache(cacheKey, JSON.stringify(metrics), 604800); // 7 jours
      
      // Mettre à jour les métriques globales de la cohorte
      if (metrics.isAtRisk) {
        await this.redisService.increment(`retention:${cohortMonth}:at_risk`, 604800);
      }
      
    } catch (error) {
      this.logger.error('Failed to update retention cache', error.stack, JSON.stringify({ userId }));
    }
  }

  /**
   * Déclenche des actions de rétention
   */
  private async triggerRetentionActions(userId: string, metrics: any): Promise<void> {
    try {
      // Marquer l'utilisateur pour des campagnes de rétention
      await this.redisService.setCache(
        `retention_action:${userId}`, 
        JSON.stringify({
          triggeredAt: new Date().toISOString(),
          metrics,
          actionType: 'EMAIL_CAMPAIGN',
        }), 
        604800 // 7 jours
      );
      
      this.logger.info('Retention actions triggered', JSON.stringify({
        userId,
        daysSinceLastActive: metrics.daysSinceLastActive,
        isAtRisk: metrics.isAtRisk,
      }));
      
    } catch (error) {
      this.logger.error('Failed to trigger retention actions', error.stack, JSON.stringify({ userId }));
    }
  }
}