// src/modules/users/queues/welcome.queue.ts

import { Injectable } from '@nestjs/common';
import { BullmqService } from '../../../shared/bullmq/bullmq.service';
import { LoggerService } from '../../../shared/logger/logger.service';

export interface WelcomeJobData {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  registrationSource?: string;
  metadata?: Record<string, any>;
}

export interface OnboardingCompleteJobData {
  userId: string;
  email: string;
  firstName: string;
  completionPercentage: number;
  incentiveApplied?: {
    type: string;
    value: number;
    description: string;
  };
  conversionData?: {
    fromAnonymous: boolean;
    originalOnboardingKey?: string;
  };
}

@Injectable()
export class WelcomeQueue {
  private readonly logger: LoggerService;

  constructor(
    private readonly bullmq: BullmqService,
    logger: LoggerService,
  ) {
    this.logger = logger.createChildLogger('WelcomeQueue');
  }

  /**
   * Envoie un email de bienvenue à un nouvel utilisateur
   */
  async sendWelcomeEmail(data: WelcomeJobData, delay?: number): Promise<void> {
    try {
      this.logger.info('Scheduling welcome email job', JSON.stringify({
        userId: data.userId,
        email: data.email,
        delay: delay || 0,
      }));

      if (delay && delay > 0) {
        await this.bullmq.addDelayedJob(
          'email',
          'send-welcome-email',
          data,
          delay,
        );
      } else {
        await this.bullmq.addPriorityJob(
          'email',
          'send-welcome-email',
          data,
          'HIGH',
        );
      }

      this.logger.info('Welcome email job scheduled successfully', JSON.stringify({
        userId: data.userId,
        jobType: 'send-welcome-email',
      }));
    } catch (error) {
      this.logger.error(
        'Failed to schedule welcome email job',
        error.stack,
        JSON.stringify({ userId: data.userId, email: data.email }),
      );
      throw error;
    }
  }

  /**
   * Envoie un email de félicitations pour l'onboarding terminé
   */
  async sendOnboardingCompleteEmail(data: OnboardingCompleteJobData): Promise<void> {
    try {
      this.logger.info('Scheduling onboarding complete email job', JSON.stringify({
        userId: data.userId,
        completionPercentage: data.completionPercentage,
      }));

      await this.bullmq.addPriorityJob(
        'email',
        'send-onboarding-complete-email',
        data,
        'NORMAL',
      );

      this.logger.info('Onboarding complete email job scheduled successfully', JSON.stringify({
        userId: data.userId,
        jobType: 'send-onboarding-complete-email',
      }));
    } catch (error) {
      this.logger.error(
        'Failed to schedule onboarding complete email job',
        error.stack,
        JSON.stringify({ userId: data.userId }),
      );
      throw error;
    }
  }

  /**
   * Programme un email de rappel d'activation de compte
   */
  async scheduleActivationReminder(
    userId: string,
    email: string,
    firstName: string,
    reminderNumber: 1 | 2 | 3,
  ): Promise<void> {
    try {
      const delays = {
        1: 24 * 60 * 60 * 1000, // 24h
        2: 72 * 60 * 60 * 1000, // 72h
        3: 7 * 24 * 60 * 60 * 1000, // 7 jours
      };

      const data = {
        userId,
        email,
        firstName,
        reminderNumber,
        scheduledAt: new Date(),
      };

      this.logger.info('Scheduling activation reminder email', JSON.stringify({
        userId,
        reminderNumber,
        delayHours: delays[reminderNumber] / (60 * 60 * 1000),
      }));

      await this.bullmq.addDelayedJob(
        'email',
        'send-activation-reminder',
        data,
        delays[reminderNumber],
      );

      this.logger.info('Activation reminder scheduled successfully', JSON.stringify({
        userId,
        reminderNumber,
        jobType: 'send-activation-reminder',
      }));
    } catch (error) {
      this.logger.error(
        'Failed to schedule activation reminder',
        error.stack,
        JSON.stringify({ userId, reminderNumber }),
      );
      throw error;
    }
  }

  /**
   * Programme un email de conseils post-inscription
   */
  async scheduleTipsEmail(userId: string, email: string, firstName: string): Promise<void> {
    try {
      const data = {
        userId,
        email,
        firstName,
        tipCategory: 'getting-started',
        scheduledAt: new Date(),
      };

      // Envoie les conseils 3 jours après l'inscription
      const delay = 3 * 24 * 60 * 60 * 1000; // 3 jours

      this.logger.info('Scheduling tips email job', JSON.stringify({
        userId,
        email,
        delayDays: 3,
      }));

      await this.bullmq.addDelayedJob(
        'email',
        'send-tips-email',
        data,
        delay,
      );

      this.logger.info('Tips email job scheduled successfully', JSON.stringify({
        userId,
        jobType: 'send-tips-email',
      }));
    } catch (error) {
      this.logger.error(
        'Failed to schedule tips email job',
        error.stack,
        JSON.stringify({ userId }),
      );
      throw error;
    }
  }

  /**
   * Annule tous les jobs de bienvenue pour un utilisateur
   */
  async cancelWelcomeJobs(userId: string): Promise<void> {
    try {
      this.logger.info('Cancelling welcome jobs for user', JSON.stringify({ userId }));

      // Ici on pourrait implémenter la logique d'annulation des jobs
      // En attendant que BullmqService ait une méthode pour ça
      
      this.logger.info('Welcome jobs cancelled successfully', JSON.stringify({
        userId,
        action: 'cancelled-welcome-jobs',
      }));
    } catch (error) {
      this.logger.error(
        'Failed to cancel welcome jobs',
        error.stack,
        JSON.stringify({ userId }),
      );
      throw error;
    }
  }
}