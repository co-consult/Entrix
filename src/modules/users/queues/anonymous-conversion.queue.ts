// src/modules/users/queues/anonymous-conversion.queue.ts

import { Injectable } from '@nestjs/common';
import { BullmqService } from '../../../shared/bullmq/bullmq.service';
import { LoggerService } from '../../../shared/logger/logger.service';
import { IncentiveType } from '../types/enums';

export interface ConversionInviteJobData {
  anonymousUserId: string;
  guestName: string;
  guestEmail: string;
  guestPhone?: string;
  onboardingKey: string;
  incentive: {
    type: IncentiveType;
    value: number;
    description: string;
  };
  purchaseContext?: {
    ticketIds?: string[];
    subscriptionIds?: string[];
    orderTotal?: number;
    eventName?: string;
  };
  campaignData?: {
    campaignId: string;
    campaignName: string;
    source: string;
  };
  expiresAt: Date;
  conversionUrl: string;
}

export interface ConversionReminderJobData {
  anonymousUserId: string;
  onboardingKey: string;
  reminderNumber: 1 | 2 | 3;
  originalData: ConversionInviteJobData;
  daysUntilExpiry: number;
}

export interface ConversionSuccessJobData {
  convertedUserId: string;
  originalAnonymousId: string;
  userEmail: string;
  userName: string;
  incentiveApplied: {
    type: IncentiveType;
    value: number;
    description: string;
  };
  migrationSummary: {
    ticketsMigrated: number;
    subscriptionsMigrated: number;
    ordersMigrated: number;
  };
  conversionTime: number; // en heures
  campaignData?: {
    campaignId: string;
    source: string;
  };
}

export interface ConversionAnalyticsJobData {
  anonymousUserId?: string;
  convertedUserId?: string;
  eventType: 'ANONYMOUS_CREATED' | 'INVITATION_SENT' | 'REMINDER_SENT' | 'CONVERSION_SUCCESSFUL' | 'CONVERSION_FAILED' | 'INVITATION_EXPIRED';
  campaignId?: string;
  incentiveType?: IncentiveType;
  conversionTime?: number;
  failureReason?: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class AnonymousConversionQueue {
  private readonly logger: LoggerService;

  constructor(
    private readonly bullmq: BullmqService,
    logger: LoggerService,
  ) {
    this.logger = logger.createChildLogger('AnonymousConversionQueue');
  }

  /**
   * Envoie l'invitation de conversion d'un utilisateur anonyme
   */
  async sendConversionInvite(data: ConversionInviteJobData): Promise<void> {
    try {
      this.logger.info('Scheduling conversion invite email', JSON.stringify({
        anonymousUserId: data.anonymousUserId,
        guestEmail: data.guestEmail,
        incentiveType: data.incentive.type,
        incentiveValue: data.incentive.value,
      }));

      await this.bullmq.addPriorityJob(
        'email',
        'send-conversion-invite',
        data,
        'HIGH',
      );

      // Programmer les rappels de conversion
      await this.scheduleConversionReminders(data);

      // Tracker l'envoi de l'invitation
      await this.trackConversionEvent({
        anonymousUserId: data.anonymousUserId,
        eventType: 'INVITATION_SENT',
        campaignId: data.campaignData?.campaignId,
        incentiveType: data.incentive.type,
        metadata: {
          email: data.guestEmail,
          source: data.campaignData?.source,
        },
      });

      this.logger.info('Conversion invite scheduled successfully', JSON.stringify({
        anonymousUserId: data.anonymousUserId,
        jobType: 'send-conversion-invite',
      }));
    } catch (error) {
      this.logger.error(
        'Failed to schedule conversion invite',
        error.stack,
        JSON.stringify({ 
          anonymousUserId: data.anonymousUserId,
          guestEmail: data.guestEmail,
        }),
      );
      throw error;
    }
  }

  /**
   * Programme les rappels de conversion
   */
  private async scheduleConversionReminders(data: ConversionInviteJobData): Promise<void> {
    try {
      const now = new Date();
      const expiresAt = new Date(data.expiresAt);
      const timeUntilExpiry = expiresAt.getTime() - now.getTime();
      const daysUntilExpiry = Math.ceil(timeUntilExpiry / (24 * 60 * 60 * 1000));

      this.logger.info('Scheduling conversion reminders', JSON.stringify({
        anonymousUserId: data.anonymousUserId,
        daysUntilExpiry,
      }));

      // Rappel après 24h si expire dans plus de 3 jours
      if (daysUntilExpiry > 3) {
        const reminder1: ConversionReminderJobData = {
          anonymousUserId: data.anonymousUserId,
          onboardingKey: data.onboardingKey,
          reminderNumber: 1,
          originalData: data,
          daysUntilExpiry,
        };

        await this.bullmq.addDelayedJob(
          'email',
          'send-conversion-reminder',
          reminder1,
          24 * 60 * 60 * 1000, // 24h
        );
      }

      // Rappel à mi-parcours si expire dans plus de 7 jours
      if (daysUntilExpiry > 7) {
        const reminder2: ConversionReminderJobData = {
          anonymousUserId: data.anonymousUserId,
          onboardingKey: data.onboardingKey,
          reminderNumber: 2,
          originalData: data,
          daysUntilExpiry,
        };

        await this.bullmq.addDelayedJob(
          'email',
          'send-conversion-reminder',
          reminder2,
          Math.floor(timeUntilExpiry / 2), // Mi-parcours
        );
      }

      // Rappel final 24h avant expiration
      if (daysUntilExpiry > 1) {
        const reminder3: ConversionReminderJobData = {
          anonymousUserId: data.anonymousUserId,
          onboardingKey: data.onboardingKey,
          reminderNumber: 3,
          originalData: data,
          daysUntilExpiry: 1,
        };

        await this.bullmq.addDelayedJob(
          'email',
          'send-conversion-reminder',
          reminder3,
          timeUntilExpiry - 24 * 60 * 60 * 1000, // 24h avant expiration
        );
      }

      this.logger.info('Conversion reminders scheduled successfully', JSON.stringify({
        anonymousUserId: data.anonymousUserId,
        remindersScheduled: daysUntilExpiry > 3 ? (daysUntilExpiry > 7 ? 3 : 2) : (daysUntilExpiry > 1 ? 1 : 0),
      }));
    } catch (error) {
      this.logger.error(
        'Failed to schedule conversion reminders',
        error.stack,
        JSON.stringify({ anonymousUserId: data.anonymousUserId }),
      );
      // Ne pas faire échouer l'invitation principale
    }
  }

  /**
   * Envoie un rappel de conversion
   */
  async sendConversionReminder(data: ConversionReminderJobData): Promise<void> {
    try {
      this.logger.info('Scheduling conversion reminder email', JSON.stringify({
        anonymousUserId: data.anonymousUserId,
        reminderNumber: data.reminderNumber,
        daysUntilExpiry: data.daysUntilExpiry,
      }));

      await this.bullmq.addPriorityJob(
        'email',
        'send-conversion-reminder',
        data,
        'NORMAL',
      );

      // Tracker le rappel
      await this.trackConversionEvent({
        anonymousUserId: data.anonymousUserId,
        eventType: 'REMINDER_SENT',
        metadata: {
          reminderNumber: data.reminderNumber,
          daysUntilExpiry: data.daysUntilExpiry,
        },
      });

      this.logger.info('Conversion reminder scheduled successfully', JSON.stringify({
        anonymousUserId: data.anonymousUserId,
        jobType: 'send-conversion-reminder',
      }));
    } catch (error) {
      this.logger.error(
        'Failed to schedule conversion reminder',
        error.stack,
        JSON.stringify({ anonymousUserId: data.anonymousUserId }),
      );
      throw error;
    }
  }

  /**
   * Envoie l'email de félicitations après conversion réussie
   */
  async sendConversionSuccess(data: ConversionSuccessJobData): Promise<void> {
    try {
      this.logger.info('Scheduling conversion success email', JSON.stringify({
        convertedUserId: data.convertedUserId,
        originalAnonymousId: data.originalAnonymousId,
        incentiveType: data.incentiveApplied.type,
        conversionTimeHours: data.conversionTime,
      }));

      await this.bullmq.addPriorityJob(
        'email',
        'send-conversion-success',
        data,
        'HIGH',
      );

      // Tracker la conversion réussie
      await this.trackConversionEvent({
        anonymousUserId: data.originalAnonymousId,
        convertedUserId: data.convertedUserId,
        eventType: 'CONVERSION_SUCCESSFUL',
        campaignId: data.campaignData?.campaignId,
        incentiveType: data.incentiveApplied.type,
        conversionTime: data.conversionTime,
        metadata: {
          migrationSummary: data.migrationSummary,
          source: data.campaignData?.source,
        },
      });

      this.logger.info('Conversion success email scheduled successfully', JSON.stringify({
        convertedUserId: data.convertedUserId,
        jobType: 'send-conversion-success',
      }));
    } catch (error) {
      this.logger.error(
        'Failed to schedule conversion success email',
        error.stack,
        JSON.stringify({ 
          convertedUserId: data.convertedUserId,
          originalAnonymousId: data.originalAnonymousId,
        }),
      );
      throw error;
    }
  }

  /**
   * Traite l'expiration d'une invitation de conversion
   */
  async processConversionExpiry(anonymousUserId: string, onboardingKey: string): Promise<void> {
    try {
      this.logger.info('Processing conversion expiry', JSON.stringify({
        anonymousUserId,
        onboardingKey,
      }));

      // Annuler tous les rappels en attente
      await this.cancelConversionReminders(anonymousUserId);

      // Tracker l'expiration
      await this.trackConversionEvent({
        anonymousUserId,
        eventType: 'INVITATION_EXPIRED',
        metadata: {
          onboardingKey,
          expiredAt: new Date(),
        },
      });

      this.logger.info('Conversion expiry processed successfully', JSON.stringify({
        anonymousUserId,
        action: 'expiry-processed',
      }));
    } catch (error) {
      this.logger.error(
        'Failed to process conversion expiry',
        error.stack,
        JSON.stringify({ anonymousUserId }),
      );
      throw error;
    }
  }

  /**
   * Enregistre un événement d'analytics de conversion
   */
  async trackConversionEvent(data: ConversionAnalyticsJobData): Promise<void> {
    try {
      await this.bullmq.addJob(
        'analytics',
        'track-conversion-event',
        {
          ...data,
          timestamp: new Date(),
        },
      );

      this.logger.info('Conversion event tracked', JSON.stringify({
        eventType: data.eventType,
        anonymousUserId: data.anonymousUserId,
        convertedUserId: data.convertedUserId,
      }));
    } catch (error) {
      this.logger.error(
        'Failed to track conversion event',
        error.stack,
        JSON.stringify({ eventType: data.eventType }),
      );
      // Ne pas faire échouer le processus principal pour les analytics
    }
  }

  /**
   * Annule tous les rappels de conversion pour un utilisateur
   */
  async cancelConversionReminders(anonymousUserId: string): Promise<void> {
    try {
      this.logger.info('Cancelling conversion reminders', JSON.stringify({ anonymousUserId }));

      // Ici on pourrait implémenter la logique d'annulation des jobs
      // En attendant que BullmqService ait une méthode pour ça

      this.logger.info('Conversion reminders cancelled successfully', JSON.stringify({
        anonymousUserId,
        action: 'cancelled-reminders',
      }));
    } catch (error) {
      this.logger.error(
        'Failed to cancel conversion reminders',
        error.stack,
        JSON.stringify({ anonymousUserId }),
      );
      throw error;
    }
  }
}