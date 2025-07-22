// src/modules/users/queues/user-analytics.queue.ts

import { Injectable } from '@nestjs/common';
import { BullmqService } from '../../../shared/bullmq/bullmq.service';
import { LoggerService } from '../../../shared/logger/logger.service';
import { BusinessEventType } from '../types/enums';

export interface UserEventJobData {
  userId: string;
  eventType: BusinessEventType;
  eventData: Record<string, any>;
  timestamp: Date;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

export interface UserBehaviorJobData {
  userId: string;
  behaviorType: 'PAGE_VIEW' | 'BUTTON_CLICK' | 'FORM_SUBMISSION' | 'SEARCH' | 'FILTER_APPLIED';
  page?: string;
  element?: string;
  searchQuery?: string;
  filters?: Record<string, any>;
  duration?: number; // temps passé en millisecondes
  timestamp: Date;
  sessionId: string;
  metadata?: Record<string, any>;
}

export interface UserEngagementJobData {
  userId: string;
  engagementType: 'EMAIL_OPENED' | 'EMAIL_CLICKED' | 'NOTIFICATION_VIEWED' | 'FEATURE_USED' | 'GOAL_COMPLETED';
  source: string; // email_campaign, push_notification, etc.
  campaignId?: string;
  goalType?: string;
  value?: number;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface GroupAnalyticsJobData {
  groupId: string;
  eventType: 'GROUP_CREATED' | 'MEMBER_ADDED' | 'MEMBER_REMOVED' | 'PURCHASE_MADE' | 'ROLE_CHANGED';
  userId?: string;
  memberCount?: number;
  purchaseAmount?: number;
  oldRole?: string;
  newRole?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface ConversionFunnelJobData {
  userId?: string;
  anonymousId?: string;
  funnelStep: 'ANONYMOUS_CREATED' | 'EMAIL_SENT' | 'EMAIL_OPENED' | 'LINK_CLICKED' | 'FORM_STARTED' | 'FORM_COMPLETED' | 'ACCOUNT_CREATED';
  funnelName: string; // 'user_registration', 'anonymous_conversion', etc.
  stepValue?: number;
  timestamp: Date;
  source?: string;
  campaignId?: string;
  metadata?: Record<string, any>;
}

export interface SegmentationJobData {
  userId: string;
  segmentType: 'DEMOGRAPHIC' | 'BEHAVIORAL' | 'ENGAGEMENT' | 'VALUE';
  segmentName: string;
  segmentValue: string | number;
  previousValue?: string | number;
  timestamp: Date;
  metadata?: Record<string, any>;
}

@Injectable()
export class UserAnalyticsQueue {
  private readonly logger: LoggerService;

  constructor(
    private readonly bullmq: BullmqService,
    logger: LoggerService,
  ) {
    this.logger = logger.createChildLogger('UserAnalyticsQueue');
  }

  /**
   * Enregistre un événement business utilisateur
   */
  async trackUserEvent(data: UserEventJobData): Promise<void> {
    try {
      this.logger.info('Scheduling user event tracking', JSON.stringify({
        userId: data.userId,
        eventType: data.eventType,
        timestamp: data.timestamp,
      }));

      await this.bullmq.addJob(
        'analytics',
        'track-user-event',
        data,
      );

      this.logger.info('User event tracking scheduled successfully', JSON.stringify({
        userId: data.userId,
        eventType: data.eventType,
        jobType: 'track-user-event',
      }));
    } catch (error) {
      this.logger.error(
        'Failed to schedule user event tracking',
        error.stack,
        JSON.stringify({ 
          userId: data.userId,
          eventType: data.eventType,
        }),
      );
      // Ne pas faire échouer le processus principal pour les analytics
    }
  }

  /**
   * Enregistre le comportement utilisateur
   */
  async trackUserBehavior(data: UserBehaviorJobData): Promise<void> {
    try {
      this.logger.info('Scheduling user behavior tracking', JSON.stringify({
        userId: data.userId,
        behaviorType: data.behaviorType,
        page: data.page,
      }));

      await this.bullmq.addJob(
        'analytics',
        'track-user-behavior',
        data,
      );

      this.logger.info('User behavior tracking scheduled successfully', JSON.stringify({
        userId: data.userId,
        behaviorType: data.behaviorType,
        jobType: 'track-user-behavior',
      }));
    } catch (error) {
      this.logger.error(
        'Failed to schedule user behavior tracking',
        error.stack,
        JSON.stringify({ 
          userId: data.userId,
          behaviorType: data.behaviorType,
        }),
      );
      // Ne pas faire échouer le processus principal
    }
  }

  /**
   * Enregistre l'engagement utilisateur
   */
  async trackUserEngagement(data: UserEngagementJobData): Promise<void> {
    try {
      this.logger.info('Scheduling user engagement tracking', JSON.stringify({
        userId: data.userId,
        engagementType: data.engagementType,
        source: data.source,
        campaignId: data.campaignId,
      }));

      await this.bullmq.addJob(
        'analytics',
        'track-user-engagement',
        data,
      );

      this.logger.info('User engagement tracking scheduled successfully', JSON.stringify({
        userId: data.userId,
        engagementType: data.engagementType,
        jobType: 'track-user-engagement',
      }));
    } catch (error) {
      this.logger.error(
        'Failed to schedule user engagement tracking',
        error.stack,
        JSON.stringify({ 
          userId: data.userId,
          engagementType: data.engagementType,
        }),
      );
      // Ne pas faire échouer le processus principal
    }
  }

  /**
   * Enregistre les analytics de groupe
   */
  async trackGroupAnalytics(data: GroupAnalyticsJobData): Promise<void> {
    try {
      this.logger.info('Scheduling group analytics tracking', JSON.stringify({
        groupId: data.groupId,
        eventType: data.eventType,
        userId: data.userId,
      }));

      await this.bullmq.addJob(
        'analytics',
        'track-group-analytics',
        data,
      );

      this.logger.info('Group analytics tracking scheduled successfully', JSON.stringify({
        groupId: data.groupId,
        eventType: data.eventType,
        jobType: 'track-group-analytics',
      }));
    } catch (error) {
      this.logger.error(
        'Failed to schedule group analytics tracking',
        error.stack,
        JSON.stringify({ 
          groupId: data.groupId,
          eventType: data.eventType,
        }),
      );
      // Ne pas faire échouer le processus principal
    }
  }

  /**
   * Enregistre les étapes du funnel de conversion
   */
  async trackConversionFunnel(data: ConversionFunnelJobData): Promise<void> {
    try {
      this.logger.info('Scheduling conversion funnel tracking', JSON.stringify({
        userId: data.userId,
        anonymousId: data.anonymousId,
        funnelStep: data.funnelStep,
        funnelName: data.funnelName,
      }));

      await this.bullmq.addJob(
        'analytics',
        'track-conversion-funnel',
        data,
      );

      this.logger.info('Conversion funnel tracking scheduled successfully', JSON.stringify({
        userId: data.userId || data.anonymousId,
        funnelStep: data.funnelStep,
        jobType: 'track-conversion-funnel',
      }));
    } catch (error) {
      this.logger.error(
        'Failed to schedule conversion funnel tracking',
        error.stack,
        JSON.stringify({ 
          funnelStep: data.funnelStep,
          funnelName: data.funnelName,
        }),
      );
      // Ne pas faire échouer le processus principal
    }
  }

  /**
   * Met à jour la segmentation utilisateur
   */
  async updateUserSegmentation(data: SegmentationJobData): Promise<void> {
    try {
      this.logger.info('Scheduling user segmentation update', JSON.stringify({
        userId: data.userId,
        segmentType: data.segmentType,
        segmentName: data.segmentName,
        segmentValue: data.segmentValue,
      }));

      await this.bullmq.addJob(
        'analytics',
        'update-user-segmentation',
        data,
      );

      this.logger.info('User segmentation update scheduled successfully', JSON.stringify({
        userId: data.userId,
        segmentType: data.segmentType,
        jobType: 'update-user-segmentation',
      }));
    } catch (error) {
      this.logger.error(
        'Failed to schedule user segmentation update',
        error.stack,
        JSON.stringify({ 
          userId: data.userId,
          segmentType: data.segmentType,
        }),
      );
      // Ne pas faire échouer le processus principal
    }
  }

  /**
   * Calcule et met à jour les métriques utilisateur
   */
  async calculateUserMetrics(userId: string, force: boolean = false): Promise<void> {
    try {
      this.logger.info('Scheduling user metrics calculation', JSON.stringify({
        userId,
        force,
      }));

      const priority = force ? 'HIGH' : 'LOW';

      await this.bullmq.addPriorityJob(
        'analytics',
        'calculate-user-metrics',
        {
          userId,
          force,
          timestamp: new Date(),
        },
        priority,
      );

      this.logger.info('User metrics calculation scheduled successfully', JSON.stringify({
        userId,
        priority,
        jobType: 'calculate-user-metrics',
      }));
    } catch (error) {
      this.logger.error(
        'Failed to schedule user metrics calculation',
        error.stack,
        JSON.stringify({ userId, force }),
      );
      // Ne pas faire échouer le processus principal
    }
  }

  /**
   * Génère un rapport d'analytics utilisateur
   */
  async generateUserReport(
    userId: string,
    reportType: 'DAILY' | 'WEEKLY' | 'MONTHLY',
    notifyEmail?: string,
  ): Promise<void> {
    try {
      this.logger.info('Scheduling user report generation', JSON.stringify({
        userId,
        reportType,
        notifyEmail,
      }));

      await this.bullmq.addJob(
        'reports',
        'generate-user-report',
        {
          userId,
          reportType,
          notifyEmail,
          requestedAt: new Date(),
        },
      );

      this.logger.info('User report generation scheduled successfully', JSON.stringify({
        userId,
        reportType,
        jobType: 'generate-user-report',
      }));
    } catch (error) {
      this.logger.error(
        'Failed to schedule user report generation',
        error.stack,
        JSON.stringify({ userId, reportType }),
      );
      throw error;
    }
  }

  /**
   * Nettoie les anciennes données analytics
   */
  async cleanupOldAnalytics(retentionDays: number = 90): Promise<void> {
    try {
      this.logger.info('Scheduling analytics cleanup', JSON.stringify({
        retentionDays,
      }));

      await this.bullmq.addJob(
        'maintenance',
        'cleanup-old-analytics',
        {
          retentionDays,
          cleanupDate: new Date(),
        },
      );

      this.logger.info('Analytics cleanup scheduled successfully', JSON.stringify({
        retentionDays,
        jobType: 'cleanup-old-analytics',
      }));
    } catch (error) {
      this.logger.error(
        'Failed to schedule analytics cleanup',
        error.stack,
        JSON.stringify({ retentionDays }),
      );
      throw error;
    }
  }

  /**
   * Synchronise les données analytics avec les services externes
   */
  async syncExternalAnalytics(
    service: 'GOOGLE_ANALYTICS' | 'MIXPANEL' | 'AMPLITUDE',
    dataType: 'USERS' | 'EVENTS' | 'CONVERSIONS',
    batchSize: number = 1000,
  ): Promise<void> {
    try {
      this.logger.info('Scheduling external analytics sync', JSON.stringify({
        service,
        dataType,
        batchSize,
      }));

      await this.bullmq.addJob(
        'integrations',
        'sync-external-analytics',
        {
          service,
          dataType,
          batchSize,
          syncDate: new Date(),
        },
      );

      this.logger.info('External analytics sync scheduled successfully', JSON.stringify({
        service,
        dataType,
        jobType: 'sync-external-analytics',
      }));
    } catch (error) {
      this.logger.error(
        'Failed to schedule external analytics sync',
        error.stack,
        JSON.stringify({ service, dataType }),
      );
      throw error;
    }
  }
}