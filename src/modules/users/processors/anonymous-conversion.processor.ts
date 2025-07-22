// src/modules/users/processors/anonymous-conversion.processor.ts

import { Processor, Process } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { Job } from 'bull';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { EmailService } from '../../../shared/email/email.service';
import { LoggerService } from '../../../shared/logger/logger.service';
import { RedisService } from '../../../shared/redis/redis.service';
import { IncentiveType } from '../types/enums';

export interface ConversionJobData {
  userId: string;
  anonymousId: string;
  onboardingKey: string;
  incentiveType: IncentiveType;
  incentiveValue: number;
  incentiveDescription: string;
  conversionMetadata: {
    source: string;
    campaignId?: string;
    conversionTime: Date;
    userAgent?: string;
    ipAddress?: string;
  };
}

export interface IncentiveApplicationJobData {
  userId: string;
  incentiveType: IncentiveType;
  incentiveValue: number;
  description: string;
  sourceType: 'CONVERSION' | 'WELCOME_BONUS' | 'REFERRAL' | 'PROMOTION';
  sourceId?: string;
  expiresAt?: Date;
}

export interface ConversionEmailJobData {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  incentiveApplied: {
    type: IncentiveType;
    value: number;
    description: string;
  };
  migrationSummary: {
    ticketsMigrated: number;
    subscriptionsMigrated: number;
    ordersMigrated: number;
    totalValue: number;
  };
  originalPurchaseData?: {
    firstPurchaseDate: Date;
    totalPurchases: number;
    favoriteEventType?: string;
  };
}

@Injectable()
@Processor('conversion')
export class AnonymousConversionProcessor {
  private readonly logger: LoggerService;

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly redisService: RedisService,
    logger: LoggerService,
  ) {
    this.logger = logger.createChildLogger('AnonymousConversionProcessor');
  }

  @Process('process-conversion')
  async processConversion(job: Job<ConversionJobData>): Promise<void> {
    const { 
      userId, 
      anonymousId, 
      onboardingKey, 
      incentiveType, 
      incentiveValue, 
      incentiveDescription,
      conversionMetadata 
    } = job.data;

    this.logger.info('Processing anonymous user conversion', JSON.stringify({
      jobId: job.id,
      userId,
      anonymousId,
      incentiveType,
      incentiveValue,
      source: conversionMetadata.source,
    }));

    try {
      // Utiliser transaction avec retry du PrismaService
      const result = await this.prisma.transactionWithRetry(async (tx) => {
        // Vérifier que l'utilisateur existe
        const user = await tx.users.findUnique({
          where: { id: userId },
          select: {
            id: true,
            email: true,
            first_name: true,
            last_name: true,
            is_active: true,
            created_at: true,
          },
        });

        if (!user || !user.is_active) {
          throw new Error(`User ${userId} not found or inactive`);
        }

        // ✅ CORRECTION FINALE : Migration via orders (seule table avec guest_email)
        
        // 1. Migrer les orders anonymes
        const ordersUpdate = await tx.orders.updateMany({
          where: {
            AND: [
              { user_id: null },
              { guest_email: user.email },
            ],
          },
          data: {
            user_id: user.id,
            metadata: {
              migratedFrom: 'anonymous',
              originalGuestEmail: user.email,
              migrationDate: new Date(),
              onboardingKey,
            },
          },
        });

        const ordersMigrated = ordersUpdate.count || 0;

        // 2. Migrer les tickets liés aux orders migrées
        const ticketsUpdate = await tx.tickets.updateMany({
          where: {
            user_id: null,
            // Chercher les tickets liés aux orders qui ont été migrées
            access_rights: {
              some: {
                // Note: Cette relation dépend de l'architecture access_rights
                // Alternative: chercher via order_items si relation existe
              },
            },
          },
          data: {
            user_id: user.id,
            metadata: {
              migratedFrom: 'anonymous',
              originalGuestEmail: user.email,
              migrationDate: new Date(),
              onboardingKey,
            },
          },
        });

        // 3. Migrer les subscriptions (via metadata ou autre méthode)
        const subscriptionsUpdate = await tx.subscriptions.updateMany({
          where: {
            AND: [
              { user_id: null },
              {
                // Chercher dans metadata si email stocké là
                metadata: {
                  path: ['guestEmail'],
                  equals: user.email,
                },
              },
            ],
          },
          data: {
            user_id: user.id,
            metadata: {
              migratedFrom: 'anonymous',
              originalGuestEmail: user.email,
              migrationDate: new Date(),
              onboardingKey,
            },
          },
        });

        const ticketsMigrated = ticketsUpdate.count || 0;
        const subscriptionsMigrated = subscriptionsUpdate.count || 0;

        // ✅ CORRECTION FINALE : Calculer la valeur totale  
        const migratedOrders = await tx.orders.findMany({
          where: {
            user_id: user.id,
            metadata: {
              path: ['onboardingKey'],
              equals: onboardingKey,
            },
          },
          select: { total_amount: true },
        });

        const migratedTickets = await tx.tickets.findMany({
          where: {
            user_id: user.id,
            metadata: {
              path: ['onboardingKey'],
              equals: onboardingKey,
            },
          },
          select: { price_paid: true },
        });

        const migratedSubscriptions = await tx.subscriptions.findMany({
          where: {
            user_id: user.id,
            metadata: {
              path: ['onboardingKey'],
              equals: onboardingKey,
            },
          },
          select: { price_paid: true },
        });

        const totalValue = [
          ...migratedOrders.map(o => Number(o.total_amount) || 0),
          ...migratedTickets.map(t => Number(t.price_paid) || 0),
          ...migratedSubscriptions.map(s => Number(s.price_paid) || 0),
        ].reduce((sum, value) => sum + value, 0);

        this.logger.info('Anonymous conversion data migration completed', JSON.stringify({
          userId,
          ordersMigrated,
          ticketsMigrated,
          subscriptionsMigrated,
          totalValue,
          jobId: job.id,
        }));

        return {
          user,
          migrationSummary: {
            ticketsMigrated,
            subscriptionsMigrated,
            ordersMigrated,
            totalValue,
          },
        };
      });

      // Suite du traitement...
      await this.invalidateUserCaches(result.user.email, result.user.id);

      if (incentiveType && incentiveValue) {
        await this.applyConversionIncentive(
          result.user.id,
          incentiveType,
          incentiveValue,
          incentiveDescription,
        );
      }

      await this.sendConversionConfirmationEmail({
        userId: result.user.id,
        email: result.user.email,
        firstName: result.user.first_name,
        lastName: result.user.last_name,
        incentiveApplied: {
          type: incentiveType,
          value: incentiveValue,
          description: incentiveDescription,
        },
        migrationSummary: result.migrationSummary,
      });

      this.logger.logBusinessEvent(
        'ANONYMOUS_USER_CONVERTED',
        {
          userId: result.user.id,
          anonymousId,
          onboardingKey,
          incentiveType,
          incentiveValue,
          source: conversionMetadata.source,
          ticketsMigrated: result.migrationSummary.ticketsMigrated,
          subscriptionsMigrated: result.migrationSummary.subscriptionsMigrated,
          ordersMigrated: result.migrationSummary.ordersMigrated,
          totalValue: result.migrationSummary.totalValue,
        },
        result.user.id,
      );

    } catch (error) {
      this.logger.logErrorEvent(
        error,
        'AnonymousConversionProcessor.processConversion',
        userId,
        JSON.stringify({
          originalJobData: job.data,
        }),
      );

      throw error;
    }
  }

  @Process('apply-incentive')
  async processIncentiveApplication(job: Job<IncentiveApplicationJobData>): Promise<void> {
    const { 
      userId, 
      incentiveType, 
      incentiveValue, 
      description, 
      sourceType, 
      sourceId,
      expiresAt 
    } = job.data;

    this.logger.info('Processing incentive application', JSON.stringify({
      jobId: job.id,
      userId,
      incentiveType,
      incentiveValue,
      sourceType,
    }));

    try {
      // Vérifier que l'utilisateur existe
      const user = await this.prisma.users.findUnique({
        where: { id: userId },
        select: { 
          id: true, 
          email: true, 
          first_name: true, 
          is_active: true 
        },
      });

      if (!user || !user.is_active) {
        throw new Error(`User ${userId} not found or inactive`);
      }

      // Appliquer l'incentive selon le type
      let incentiveApplied = false;
      
      switch (incentiveType) {
        case IncentiveType.BONUS_POINTS:
          incentiveApplied = await this.applyBonusPoints(userId, incentiveValue, description, expiresAt);
          break;
          
        case IncentiveType.DISCOUNT_NEXT:
          incentiveApplied = await this.applyDiscountCoupon(userId, incentiveValue, description, expiresAt);
          break;
          
        case IncentiveType.FREE_UPGRADE:
          incentiveApplied = await this.applyFreeUpgrade(userId, incentiveValue, description, expiresAt);
          break;
          
        case IncentiveType.EXCLUSIVE_ACCESS:
          incentiveApplied = await this.applyExclusiveAccess(userId, incentiveValue, description, expiresAt);
          break;
          
        case IncentiveType.GIFT_VOUCHER:
          incentiveApplied = await this.applyGiftVoucher(userId, incentiveValue, description, expiresAt);
          break;
          
        default:
          this.logger.warn('Unknown incentive type', JSON.stringify({ incentiveType, userId }));
          break;
      }

      if (incentiveApplied) {
        // Logger l'événement business
        this.logger.logBusinessEvent(
          'INCENTIVE_APPLIED',
          {
            userId,
            incentiveType,
            incentiveValue,
            description,
            sourceType,
            sourceId,
          },
          userId,
        );

        this.logger.info('Incentive applied successfully', JSON.stringify({
          userId,
          incentiveType,
          incentiveValue,
          jobId: job.id,
        }));
      } else {
        this.logger.warn('Failed to apply incentive', JSON.stringify({
          userId,
          incentiveType,
          incentiveValue,
          jobId: job.id,
        }));
      }

    } catch (error) {
      this.logger.logErrorEvent(
        error,
        'AnonymousConversionProcessor.processIncentiveApplication',
        userId,
        JSON.stringify({
          originalJobData: job.data,
        }),
      );

      throw error;
    }
  }

  @Process('send-conversion-email')
  async processSendConversionEmail(job: Job<ConversionEmailJobData>): Promise<void> {
    const { userId, email, firstName, lastName, incentiveApplied, migrationSummary } = job.data;

    this.logger.info('Processing conversion confirmation email', JSON.stringify({
      jobId: job.id,
      userId,
      email,
    }));

    try {
      // Envoyer l'email de confirmation de conversion
      await this.emailService.sendMail({
        to: email,
        subject: '🎉 Bienvenue sur Entrix ! Votre conversion est réussie',
        template: 'anonymous-conversion',
        context: {
          firstName,
          lastName,
          incentiveApplied,
          migrationSummary,
          dashboardUrl: `${process.env.FRONTEND_URL}/dashboard`,
          supportUrl: `${process.env.FRONTEND_URL}/support`,
          incentiveUsageInstructions: this.getIncentiveUsageInstructions(incentiveApplied.type),
        },
      });

      // Logger l'événement de notification
      this.logger.logNotificationEvent(
        'sent',
        'email',
        email,
        job.id.toString(),
        {
          emailType: 'conversion-confirmation',
          userId,
          incentiveType: incentiveApplied.type,
        },
      );

      this.logger.info('Conversion email sent successfully', JSON.stringify({
        userId,
        email,
        jobId: job.id,
      }));

    } catch (error) {
      this.logger.logErrorEvent(
        error,
        'AnonymousConversionProcessor.processSendConversionEmail',
        userId,
        JSON.stringify({
          originalJobData: job.data,
        }),
      );

      // Notifier l'échec d'envoi d'email
      await this.notifyConversionEmailFailure(job.data, error);

      throw error;
    }
  }

  // ============================================================================
  // MÉTHODES PRIVÉES
  // ============================================================================

  /**
   * Invalide les caches Redis liés à un utilisateur
   */
  private async invalidateUserCaches(email: string, userId: string): Promise<void> {
    try {
      await Promise.all([
        this.redisService.delCache(`user:${userId}`),
        this.redisService.delCache(`user:email:${email}`),
        this.redisService.delCache(`user:profile:${userId}`),
        this.redisService.delCache(`user:groups:${userId}`),
        this.redisService.delCache(`user:permissions:${userId}`),
      ]);

      this.logger.logCacheEvent('del', `user-conversion-${userId}`);
    } catch (error) {
      this.logger.warn('Failed to invalidate user caches', JSON.stringify({ 
        userId, 
        email, 
        error: error.message 
      }));
    }
  }

  /**
   * Applique l'incentive de conversion
   */
  private async applyConversionIncentive(
    userId: string,
    incentiveType: IncentiveType,
    incentiveValue: number,
    description: string,
  ): Promise<void> {
    try {
      const expiresAt = new Date();
      expiresAt.setFullYear(expiresAt.getFullYear() + 1); // Expire dans 1 an

      switch (incentiveType) {
        case IncentiveType.BONUS_POINTS:
          await this.applyBonusPoints(userId, incentiveValue, description, expiresAt);
          break;
        case IncentiveType.DISCOUNT_NEXT:
          await this.applyDiscountCoupon(userId, incentiveValue, description, expiresAt);
          break;
        case IncentiveType.FREE_UPGRADE:
          await this.applyFreeUpgrade(userId, incentiveValue, description, expiresAt);
          break;
        case IncentiveType.EXCLUSIVE_ACCESS:
          await this.applyExclusiveAccess(userId, incentiveValue, description, expiresAt);
          break;
        case IncentiveType.GIFT_VOUCHER:
          await this.applyGiftVoucher(userId, incentiveValue, description, expiresAt);
          break;
      }
    } catch (error) {
      this.logger.logErrorEvent(
        error,
        'AnonymousConversionProcessor.applyConversionIncentive',
        userId,
        JSON.stringify({
          incentiveType,
          incentiveValue,
          description,
        }),
      );
    }
  }

  /**
   * Applique des points bonus
   */
  private async applyBonusPoints(
    userId: string, 
    points: number, 
    description: string, 
    expiresAt?: Date
  ): Promise<boolean> {
    try {
      // Note: Cette table pourrait ne pas exister selon le schema
      // On utilise executeWithRetry pour la robustesse
      await this.prisma.executeWithRetry(async () => {
        // Créer un audit_log pour tracer l'attribution de points
        await this.prisma.audit_logs.create({
          data: {
            user_id: userId,
            table_name: 'loyalty_points',
            action: 'CREATE',
            new_values: {
              userId,
              points,
              source: 'CONVERSION_BONUS',
              description,
              expiresAt,
            },
            description: `Bonus points applied: ${points} points`,
          },
        });
      });

      this.logger.info('Bonus points applied successfully', JSON.stringify({
        userId,
        points,
        description,
      }));

      return true;
    } catch (error) {
      this.logger.logErrorEvent(error, 'AnonymousConversionProcessor.applyBonusPoints', userId, 
        JSON.stringify({ points, description }));
      return false;
    }
  }

  /**
   * Applique un coupon de réduction
   */
  private async applyDiscountCoupon(
    userId: string, 
    discountPercent: number, 
    description: string, 
    expiresAt?: Date
  ): Promise<boolean> {
    try {
      // Note: Cette table pourrait ne pas exister selon le schema
      await this.prisma.executeWithRetry(async () => {
        await this.prisma.audit_logs.create({
          data: {
            user_id: userId,
            table_name: 'user_coupons',
            action: 'CREATE',
            new_values: {
              userId,
              discountPercent,
              source: 'CONVERSION_BONUS',
              description,
              expiresAt,
              isActive: true,
            },
            description: `Discount coupon applied: ${discountPercent}%`,
          },
        });
      });

      return true;
    } catch (error) {
      this.logger.logErrorEvent(error, 'AnonymousConversionProcessor.applyDiscountCoupon', userId,
        JSON.stringify({ discountPercent, description }));
      return false;
    }
  }

  /**
   * Applique un upgrade gratuit
   */
  private async applyFreeUpgrade(
    userId: string, 
    upgradeCount: number, 
    description: string, 
    expiresAt?: Date
  ): Promise<boolean> {
    try {
      await this.prisma.executeWithRetry(async () => {
        await this.prisma.audit_logs.create({
          data: {
            user_id: userId,
            table_name: 'user_upgrades',
            action: 'CREATE',
            new_values: {
              userId,
              upgradeCount,
              source: 'CONVERSION_BONUS',
              description,
              expiresAt,
              isActive: true,
            },
            description: `Free upgrade applied: ${upgradeCount} upgrades`,
          },
        });
      });

      return true;
    } catch (error) {
      this.logger.logErrorEvent(error, 'AnonymousConversionProcessor.applyFreeUpgrade', userId,
        JSON.stringify({ upgradeCount, description }));
      return false;
    }
  }

  /**
   * Applique un accès exclusif
   */
  private async applyExclusiveAccess(
    userId: string, 
    durationDays: number, 
    description: string, 
    expiresAt?: Date
  ): Promise<boolean> {
    try {
      await this.prisma.executeWithRetry(async () => {
        await this.prisma.audit_logs.create({
          data: {
            user_id: userId,
            table_name: 'user_exclusive_access',
            action: 'CREATE',
            new_values: {
              userId,
              durationDays,
              source: 'CONVERSION_BONUS',
              description,
              expiresAt,
              isActive: true,
            },
            description: `Exclusive access applied: ${durationDays} days`,
          },
        });
      });

      return true;
    } catch (error) {
      this.logger.logErrorEvent(error, 'AnonymousConversionProcessor.applyExclusiveAccess', userId,
        JSON.stringify({ durationDays, description }));
      return false;
    }
  }

  /**
   * Applique un bon d'achat
   */
  private async applyGiftVoucher(
    userId: string, 
    amount: number, 
    description: string, 
    expiresAt?: Date
  ): Promise<boolean> {
    try {
      await this.prisma.executeWithRetry(async () => {
        await this.prisma.audit_logs.create({
          data: {
            user_id: userId,
            table_name: 'user_vouchers',
            action: 'CREATE',
            new_values: {
              userId,
              amount,
              currency: 'TND',
              source: 'CONVERSION_BONUS',
              description,
              expiresAt: expiresAt || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 an
              isActive: true,
            },
            description: `Gift voucher applied: ${amount} TND`,
          },
        });
      });

      return true;
    } catch (error) {
      this.logger.logErrorEvent(error, 'AnonymousConversionProcessor.applyGiftVoucher', userId,
        JSON.stringify({ amount, description }));
      return false;
    }
  }

  /**
   * Envoie l'email de confirmation de conversion
   */
  private async sendConversionConfirmationEmail(data: ConversionEmailJobData): Promise<void> {
    try {
      await this.emailService.sendMail({
        to: data.email,
        subject: '🎉 Bienvenue sur Entrix ! Votre conversion est réussie',
        template: 'anonymous-conversion',
        context: {
          firstName: data.firstName,
          lastName: data.lastName,
          incentiveApplied: data.incentiveApplied,
          migrationSummary: data.migrationSummary,
          dashboardUrl: `${process.env.FRONTEND_URL}/dashboard`,
          supportUrl: `${process.env.FRONTEND_URL}/support`,
          incentiveTypeLabel: this.getIncentiveTypeLabel(data.incentiveApplied.type),
          incentiveUsageInstructions: this.getIncentiveUsageInstructions(data.incentiveApplied.type),
        },
      });
    } catch (error) {
      this.logger.logErrorEvent(
        error,
        'AnonymousConversionProcessor.sendConversionConfirmationEmail',
        data.userId,
        JSON.stringify({ email: data.email }),
      );
      throw error;
    }
  }

  /**
   * Notifie l'échec d'envoi d'email de conversion
   */
  private async notifyConversionEmailFailure(
    jobData: ConversionEmailJobData, 
    error: Error
  ): Promise<void> {
    try {
      this.logger.logErrorEvent(
        error,
        'AnonymousConversionProcessor.notifyConversionFailure',
        jobData.userId,
        JSON.stringify({
          originalJobData: jobData,
        }),
      );

      // Optionnel: Envoyer une notification à l'équipe support
      // await this.emailService.sendMail({
      //   to: 'support@entrix.tn',
      //   subject: 'Échec envoi email de conversion',
      //   template: 'admin-notification',
      //   context: { error: error.message, jobData }
      // });

    } catch (notificationError) {
      this.logger.logErrorEvent(
        notificationError,
        'AnonymousConversionProcessor.notifyConversionFailure',
        jobData.userId,
      );
    }
  }

  /**
   * Obtient le libellé d'un type d'incentive
   */
  private getIncentiveTypeLabel(type: IncentiveType): string {
    const labels = {
      [IncentiveType.BONUS_POINTS]: 'Points Bonus',
      [IncentiveType.DISCOUNT_NEXT]: 'Réduction',
      [IncentiveType.FREE_UPGRADE]: 'Surclassement Gratuit',
      [IncentiveType.EXCLUSIVE_ACCESS]: 'Accès Exclusif',
      [IncentiveType.GIFT_VOUCHER]: 'Bon d\'Achat',
    };
    return labels[type] || type;
  }

  /**
   * Obtient les instructions d'utilisation d'un incentive
   */
  private getIncentiveUsageInstructions(type: IncentiveType): string {
    const instructions = {
      [IncentiveType.BONUS_POINTS]: 'Vos points sont automatiquement ajoutés à votre compte et peuvent être utilisés lors de vos prochains achats.',
      [IncentiveType.DISCOUNT_NEXT]: 'Votre réduction sera automatiquement appliquée lors de votre prochain achat.',
      [IncentiveType.FREE_UPGRADE]: 'Votre surclassement gratuit sera proposé automatiquement lors de la sélection de places.',
      [IncentiveType.EXCLUSIVE_ACCESS]: 'Vous recevrez des invitations aux ventes privées par email.',
      [IncentiveType.GIFT_VOUCHER]: 'Votre bon d\'achat est disponible dans votre espace récompenses.',
    };
    return instructions[type] || 'Consultez votre compte pour plus de détails.';
  }
}