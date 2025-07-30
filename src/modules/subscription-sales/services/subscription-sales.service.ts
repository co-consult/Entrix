// src/modules/subscription-sales/services/subscription-sales.service.ts

import { 
  Injectable, 
  NotFoundException, 
  ConflictException, 
  BadRequestException,
  InternalServerErrorException 
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

// Services partagés Entrix
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { LoggerService } from '../../../shared/logger/logger.service';
import { RedisService } from '../../../shared/redis/redis.service';
import { BullmqService } from '../../../shared/bullmq/bullmq.service';
import { HashingService } from '../../../shared/hashing/hashing.service';

// Services externes
import { UsersService } from '../../users/services/users.service';
import { ProfilesService } from '../../users/services/profiles.service';

// Types et interfaces
import { 
  ISubscriptionSaleData,
  IAnonymousConversionData,
  IQRCodeValidation,
  ISubscriptionSalesService
} from '../interfaces/subscription-sale.interface';
import { 
  SaleResult, 
  ConversionResult,
  PhysicalQRCode,
  QRCodeStatus,
  SaleMode
} from '../types/sale-types';

/**
 * Service de Vente d'Abonnements Entrix V3.0 - Grade A+
 * 
 * Gère la vente d'abonnements physiques avec QR codes pré-imprimés
 * Support clients identifiés et anonymes avec conversion ultérieure
 */
@Injectable()
export class SubscriptionSalesService implements ISubscriptionSalesService {
  private readonly logger: LoggerService;
  private readonly CACHE_PREFIX = 'subscription-sale:';
  private readonly QR_CACHE_PREFIX = 'qr-code:';
  private readonly CACHE_TTL = 3600; // 1 heure

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly bullmq: BullmqService,
    private readonly hashingService: HashingService,
    private readonly usersService: UsersService,
    private readonly profilesService: ProfilesService,
    loggerService: LoggerService,
  ) {
    this.logger = loggerService.createChildLogger('SubscriptionSalesService');
  }

  // ============================================================================
  // VENTE D'ABONNEMENTS
  // ============================================================================

  /**
   * Crée une vente d'abonnement (identifiée ou anonyme)
   */
  async createSubscriptionSale(saleData: ISubscriptionSaleData): Promise<SaleResult> {
    const operationId = this.logger.startOperation('createSubscriptionSale', {
      planId: saleData.planId,
      quantity: saleData.quantity,
      saleMode: saleData.saleMode,
      saleChannel: saleData.saleChannel,
    });

    try {
      this.logger.info('Starting subscription sale', JSON.stringify({
        planId: saleData.planId,
        quantity: saleData.quantity,
        saleMode: saleData.saleMode,
        qrCodesCount: saleData.qrCodes.length,
      }));

      // 1. Validations préliminaires
      await this.validateSaleData(saleData);

      // 2. Vérifier disponibilité QR codes pour ce plan
      const qrValidations = await this.validateQRCodesAvailability(saleData.qrCodes, saleData.planId);
      const unavailableCodes = qrValidations.filter(v => !v.isAvailable);
      if (unavailableCodes.length > 0) {
        throw new BadRequestException(
          `QR codes non disponibles: ${unavailableCodes.map(v => v.qrCode).join(', ')}`
        );
      }

      // 3. Récupérer le plan d'abonnement
      const subscriptionPlan = await this.getSubscriptionPlan(saleData.planId);

      // 4. Créer utilisateur si mode identifié
      let user = null;
      if (saleData.saleMode === SaleMode.IDENTIFIED && saleData.customerInfo) {
        user = await this.createUserWithProfile(saleData.customerInfo);
      }

      // 5. Transaction atomique pour la vente
      const result = await this.prisma.transactionWithRetry(async (tx) => {
        // Créer la commande
        const order = await this.createOrder(tx, saleData, user?.id, subscriptionPlan);

        // Créer les abonnements
        const subscriptions = await this.createSubscriptions(
          tx, 
          saleData, 
          subscriptionPlan, 
          user?.id,
          order.id
        );

        // Créer les droits d'accès
        await this.createAccessRights(tx, subscriptions, subscriptionPlan);

        // Marquer QR codes comme assignés
        await this.assignQRCodes(tx, saleData.qrCodes, saleData.sellerId);

        return { order, subscriptions };
      });

      // 6. Mise en cache et logging
      await this.cacheResults(result, user);
      
      this.logger.logBusinessEvent('SUBSCRIPTION_SALE_COMPLETED', {
        planId: saleData.planId,
        quantity: saleData.quantity,
        amount: saleData.amount,
        saleMode: saleData.saleMode,
        userId: user?.id,
        orderId: result.order.id,
        subscriptionIds: result.subscriptions.map(s => s.id),
      }, user?.id);

      this.logger.endOperation('createSubscriptionSale', operationId, true);

      // 7. Préparer la réponse
      return this.buildSaleResult(result, user, saleData);

    } catch (error) {
      this.logger.logErrorEvent(
        error as Error,
        'SubscriptionSalesService.createSubscriptionSale',
        undefined,
        JSON.stringify({ saleData })
      );
      this.logger.endOperation('createSubscriptionSale', operationId, false);
      throw error;
    }
  }

  /**
   * Conversion d'abonnement anonyme vers client enregistré
   */
  async convertAnonymousSubscription(conversionData: IAnonymousConversionData): Promise<ConversionResult> {
    const operationId = this.logger.startOperation('convertAnonymousSubscription', {
      onboardingKey: conversionData.onboardingKey,
      email: conversionData.customerInfo.email,
    });

    try {
      this.logger.info('Starting anonymous subscription conversion', JSON.stringify({
        onboardingKey: conversionData.onboardingKey,
        email: conversionData.customerInfo.email,
      }));

      // 1. Trouver les abonnements avec cette clé onboarding dans metadata
      const subscriptions = await this.getSubscriptionsByOnboardingKey(conversionData.onboardingKey);
      
      if (subscriptions.length === 0) {
        throw new NotFoundException('Aucun abonnement trouvé avec cette clé d\'onboarding');
      }

      // Vérifier qu'ils sont bien anonymes
      const nonAnonymous = subscriptions.filter(s => s.user_id !== null);
      if (nonAnonymous.length > 0) {
        throw new ConflictException('Cette clé d\'onboarding a déjà été utilisée');
      }

      // 2. Créer l'utilisateur avec profil
      const user = await this.createUserWithProfile(conversionData.customerInfo, conversionData.password);

      // 3. Transaction de migration
      const migrationResult = await this.prisma.transactionWithRetry(async (tx) => {
        // Migrer les abonnements vers l'utilisateur
        const updatedSubscriptions = await Promise.all(
          subscriptions.map(subscription =>
            tx.subscriptions.update({
              where: { id: subscription.id },
              data: { 
                user_id: user.id,
                updated_at: new Date(),
              },
            })
          )
        );

        // Migrer les droits d'accès
        await tx.access_rights.updateMany({
          where: { 
            subscription_id: { in: subscriptions.map(s => s.id) }
          },
          data: { 
            user_id: user.id,
            updated_at: new Date(),
          },
        });

        // Marquer les clés onboarding comme utilisées dans metadata
        await Promise.all(
          subscriptions.map(subscription => {
            const currentMetadata = subscription.metadata as any || {};
            const updatedMetadata = {
              ...currentMetadata,
              onboarding: {
                ...(currentMetadata.onboarding || {}),
                used: true,
                usedAt: new Date().toISOString(),
                convertedUserId: user.id,
              },
            };

            return tx.subscriptions.update({
              where: { id: subscription.id },
              data: {
                metadata: updatedMetadata as Record<string, any>,
              },
            });
          })
        );

        return { updatedSubscriptions, subscriptionsCount: subscriptions.length };
      });

      // 4. Appliquer les incentives (si configurés)
      const incentivesApplied = await this.applyOnboardingIncentives(
        user.id, 
        subscriptions,
        conversionData.onboardingKey
      );

      // 5. Envoyer email de bienvenue
      await this.bullmq.addJob('email', 'send-welcome-email', {
        userId: user.id,
        email: user.email,
        firstName: user.firstName,
        subscriptionsCount: migrationResult.subscriptionsCount,
        incentives: incentivesApplied,
      });

      this.logger.logBusinessEvent('ANONYMOUS_SUBSCRIPTION_CONVERTED', {
        userId: user.id,
        email: user.email,
        onboardingKey: conversionData.onboardingKey,
        subscriptionsMigrated: migrationResult.subscriptionsCount,
        incentives: incentivesApplied,
      }, user.id);

      this.logger.endOperation('convertAnonymousSubscription', operationId, true);

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        },
        subscriptionsMigrated: migrationResult.subscriptionsCount,
        incentivesApplied,
        message: `Compte créé avec succès. ${migrationResult.subscriptionsCount} abonnement(s) associé(s) à votre compte.`,
      };

    } catch (error) {
      this.logger.logErrorEvent(
        error as Error,
        'SubscriptionSalesService.convertAnonymousSubscription',
        undefined,
        JSON.stringify({ conversionData })
      );
      this.logger.endOperation('convertAnonymousSubscription', operationId, false);
      throw error;
    }
  }

  // ============================================================================
  // VALIDATION ET GESTION QR CODES
  // ============================================================================

  /**
   * Valide la disponibilité des QR codes pour un plan donné
   */
  async validateQRCodesAvailability(qrCodes: string[], planId?: string): Promise<IQRCodeValidation[]> {
    try {
      const validations = await Promise.all(
        qrCodes.map(async (qrCode) => {
          // Vérifier cache d'abord
          const cacheKey = `${this.QR_CACHE_PREFIX}${qrCode}`;
          const cached = await this.redis.getCache<any>(cacheKey);
          
          if (cached) {
            const isAvailable = cached.status === QRCodeStatus.AVAILABLE;
            const planMatches = !planId || cached.subscription_plan_id === planId;
            
            return {
              qrCode,
              isAvailable: isAvailable && planMatches,
              status: cached.status,
              assignedAt: cached.assigned_at,
              errorMessage: !isAvailable 
                ? `QR code ${cached.status.toLowerCase()}` 
                : !planMatches 
                ? 'QR code associé à un autre plan d\'abonnement'
                : undefined,
            };
          }

          // Vérifier en base
          const physicalQR = await this.prisma.physical_qr_codes.findUnique({
            where: { qr_code: qrCode },
          });

          if (!physicalQR) {
            return {
              qrCode,
              isAvailable: false,
              status: 'NOT_FOUND',
              errorMessage: 'QR code non trouvé',
            };
          }

          // Vérifier correspondance avec le plan
          const planMatches = !planId || physicalQR.subscription_plan_id === planId;
          const isAvailable = physicalQR.status === QRCodeStatus.AVAILABLE;

          // Mettre en cache
          await this.redis.setCache(cacheKey, physicalQR, this.CACHE_TTL);

          return {
            qrCode,
            isAvailable: isAvailable && planMatches,
            status: physicalQR.status,
            assignedAt: physicalQR.assigned_at,
            errorMessage: !isAvailable 
              ? `QR code ${physicalQR.status.toLowerCase()}` 
              : !planMatches 
              ? 'QR code associé à un autre plan d\'abonnement'
              : undefined,
          };
        })
      );

      return validations;
    } catch (error) {
      this.logger.error('Error validating QR codes availability', error.stack);
      throw new InternalServerErrorException('Erreur lors de la validation des QR codes');
    }
  }

  /**
   * Récupère des QR codes disponibles pour un plan
   */
  async getAvailableQRCodes(planId: string, quantity: number): Promise<PhysicalQRCode[]> {
    try {
      const availableQRs = await this.prisma.physical_qr_codes.findMany({
        where: { 
          status: QRCodeStatus.AVAILABLE,
          subscription_plan_id: planId, // Filtrer par plan d'abonnement
        },
        take: quantity,
        orderBy: { created_at: 'asc' }, // FIFO
      });

      if (availableQRs.length < quantity) {
        throw new BadRequestException(
          `Seulement ${availableQRs.length} QR codes disponibles pour ce plan sur ${quantity} demandés`
        );
      }

      return availableQRs.map(qr => ({
        qrCode: qr.qr_code,
        onboardingKey: qr.onboarding_key,
        serialNumber: qr.serial_number,
        subscriptionPlanId: qr.subscription_plan_id,
        status: qr.status as QRCodeStatus,
        cardBatch: qr.card_batch,
        cardType: qr.card_type,
        assignedBy: qr.assigned_by,
      }));
    } catch (error) {
      this.logger.error('Error getting available QR codes', error.stack);
      throw error;
    }
  }

  // ============================================================================
  // CONSULTATION
  // ============================================================================

  /**
   * Récupère les détails d'une vente
   */
  async getSaleDetails(saleId: string): Promise<any> {
    try {
      const order = await this.prisma.orders.findUnique({
        where: { id: saleId },
        include: {
          order_items: true,
          users: true,
        },
      });

      if (!order) {
        throw new NotFoundException('Vente non trouvée');
      }

      // Récupérer les abonnements associés
      const subscriptions = await this.prisma.subscriptions.findMany({
        where: { 
          id: { in: order.order_items.map(item => item.subscription_plan_id).filter(Boolean) }
        },
        include: {
          subscription_plans: true,
          access_rights: true,
        },
      });

      return {
        order,
        subscriptions,
      };
    } catch (error) {
      this.logger.error('Error getting sale details', error.stack);
      throw error;
    }
  }

  /**
   * Récupère les abonnements par clé onboarding
   */
  async getSubscriptionsByOnboardingKey(onboardingKey: string): Promise<any[]> {
    try {
      // La clé onboarding est stockée dans metadata.onboarding.secretKey
      const subscriptions = await this.prisma.subscriptions.findMany({
        where: {
          metadata: {
            path: ['onboarding', 'secretKey'],
            equals: onboardingKey
          }
        },
        include: {
          subscription_plans: true,
          access_rights: true,
        },
      });

      return subscriptions;
    } catch (error) {
      this.logger.error('Error getting subscriptions by onboarding key', error.stack);
      throw error;
    }
  }

  // ============================================================================
  // MÉTHODES PRIVÉES
  // ============================================================================

  /**
   * Valide les données de vente
   */
  private async validateSaleData(saleData: ISubscriptionSaleData): Promise<void> {
    // Vérifier cohérence quantité et QR codes
    if (saleData.qrCodes.length !== saleData.quantity) {
      throw new BadRequestException(
        `Incohérence: ${saleData.quantity} abonnements demandés mais ${saleData.qrCodes.length} QR codes fournis`
      );
    }

    // Vérifier infos client si mode identifié
    if (saleData.saleMode === SaleMode.IDENTIFIED && !saleData.customerInfo) {
      throw new BadRequestException('Informations client requises pour une vente identifiée');
    }

    // Vérifier montant positif
    if (saleData.amount <= 0) {
      throw new BadRequestException('Le montant doit être positif');
    }
  }

  /**
   * Récupère et valide le plan d'abonnement
   */
  private async getSubscriptionPlan(planId: string) {
    const plan = await this.prisma.subscription_plans.findUnique({
      where: { id: planId },
      include: {
        organizers: true,
      },
    });

    if (!plan) {
      throw new NotFoundException('Plan d\'abonnement non trouvé');
    }

    if (!plan.is_active) {
      throw new BadRequestException('Plan d\'abonnement inactif');
    }

    // Vérifier période de validité
    const now = new Date();
    if (plan.sale_start_date && now < plan.sale_start_date) {
      throw new BadRequestException('Vente pas encore ouverte pour ce plan');
    }

    if (plan.sale_end_date && now > plan.sale_end_date) {
      throw new BadRequestException('Vente fermée pour ce plan');
    }

    return plan;
  }

  /**
   * Crée un utilisateur avec profil
   */
  private async createUserWithProfile(customerInfo: any, password?: string) {
    // Générer mot de passe si non fourni
    const userPassword = password || this.generateRandomPassword();

    // Créer l'utilisateur
    const user = await this.usersService.create({
      email: customerInfo.email,
      password: userPassword,
      firstName: customerInfo.firstName,
      lastName: customerInfo.lastName,
      phone: customerInfo.phone,
      isActive: true,
      emailVerified: false,
      phoneVerified: false,
    });

    // Créer le profil avec fan_id
    if (customerInfo.fanId) {
      await this.profilesService.create({
        userId: user.id,
        fanId: customerInfo.fanId,
        language: 'fr',
        country: 'TN',
      });
    }

    return user;
  }

  /**
   * Crée la commande
   */
  private async createOrder(tx: any, saleData: ISubscriptionSaleData, userId: string | null, plan: any) {
    return await tx.orders.create({
      data: {
        user_id: userId,
        organizer_id: plan.organizer_id,
        order_type: 'SUBSCRIPTION',
        status: 'CONFIRMED',
        total: saleData.amount,
        currency: saleData.currency,
        channel: saleData.saleChannel,
        purchase_channel: saleData.saleChannel === 'PHYSICAL' ? 'PHYSICAL' : 'ONLINE',
        payment_method: saleData.paymentMethod,
        metadata: {
          ...saleData.metadata,
          sellerId: saleData.sellerId,
          qrCodes: saleData.qrCodes,
        },
        confirmed_at: new Date(),
        completed_at: new Date(),
      },
    });
  }

  /**
   * Crée les abonnements
   */
  private async createSubscriptions(
    tx: any, 
    saleData: ISubscriptionSaleData, 
    plan: any, 
    userId: string | null,
    orderId: string
  ) {
    const subscriptions = [];

    for (let i = 0; i < saleData.quantity; i++) {
      const qrCode = saleData.qrCodes[i];
      
      // Récupérer la clé onboarding associée au QR code
      const physicalQR = await tx.physical_qr_codes.findUnique({
        where: { qr_code: qrCode },
      });

      const subscription = await tx.subscriptions.create({
        data: {
          plan_id: plan.id,
          user_id: userId,
          guest_name: saleData.customerInfo ? 
            `${saleData.customerInfo.firstName} ${saleData.customerInfo.lastName}` : null,
          guest_email: saleData.customerInfo?.email || null,
          guest_phone: saleData.customerInfo?.phone || null,
          qr_code: qrCode,
          organizer_id: plan.organizer_id,
          status: 'ACTIVE',
          start_date: plan.valid_from,
          end_date: plan.valid_until,
          price_paid: saleData.amount / saleData.quantity,
          currency: saleData.currency,
          metadata: {
            orderId,
            saleMode: saleData.saleMode,
            saleChannel: saleData.saleChannel,
            onboarding: {
              secretKey: physicalQR.onboarding_key,
              campaignId: physicalQR.metadata?.campaignId || `sale_${plan.type.toLowerCase()}`,
              incentiveType: physicalQR.metadata?.incentives?.type || 'BONUS_POINTS',
              incentiveValue: physicalQR.metadata?.incentives?.value || 50,
              description: physicalQR.metadata?.incentives?.description || 'Bonus inscription',
              expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 jours
              used: saleData.saleMode === SaleMode.IDENTIFIED, // Déjà utilisée si identifiée
              contactMethod: saleData.customerInfo?.email ? 'email' : 'none',
              communicationSent: false,
              createdAt: new Date().toISOString(),
            },
          },
        },
      });

      subscriptions.push(subscription);

      // Créer l'order_item correspondant
      await tx.order_items.create({
        data: {
          order_id: orderId,
          subscription_plan_id: plan.id,
          item_type: 'SUBSCRIPTION',
          item_name: plan.name,
          quantity: 1,
          unit_price: saleData.amount / saleData.quantity,
          total_price: saleData.amount / saleData.quantity,
          currency: saleData.currency,
        },
      });
    }

    return subscriptions;
  }

  /**
   * Crée les droits d'accès
   */
  private async createAccessRights(tx: any, subscriptions: any[], plan: any) {
    for (const subscription of subscriptions) {
      await tx.access_rights.create({
        data: {
          qr_code: subscription.qr_code,
          user_id: subscription.user_id,
          subscription_id: subscription.id,
          subscription_plan_id: plan.id,
          organizer_id: plan.organizer_id,
          access_type: 'SUBSCRIPTION',
          status: 'ACTIVE',
          valid_from: plan.valid_from,
          valid_until: plan.valid_until,
          max_uses: 999999, // Usage "illimité" pour abonnement
          current_uses: 0,
          benefits: plan.benefits,
          metadata: {
            subscriptionType: plan.type,
            planName: plan.name,
          },
        },
      });
    }
  }

  /**
   * Marque les QR codes comme assignés
   */
  private async assignQRCodes(tx: any, qrCodes: string[], assignedBy?: string) {
    await tx.physical_qr_codes.updateMany({
      where: { qr_code: { in: qrCodes } },
      data: {
        status: QRCodeStatus.ASSIGNED,
        assigned_at: new Date(),
        assigned_by: assignedBy || null,
      },
    });

    // Invalider le cache
    for (const qrCode of qrCodes) {
      const cacheKey = `${this.QR_CACHE_PREFIX}${qrCode}`;
      await this.redis.delCache(cacheKey);
    }
  }

  /**
   * Met en cache les résultats
   */
  private async cacheResults(result: any, user: any) {
    const cacheKey = `${this.CACHE_PREFIX}${result.order.id}`;
    await this.redis.setCache(cacheKey, { 
      order: result.order, 
      subscriptions: result.subscriptions,
      user 
    }, this.CACHE_TTL);
  }

  /**
   * Construit le résultat de vente
   */
  private buildSaleResult(result: any, user: any, saleData: ISubscriptionSaleData): SaleResult {
    return {
      success: true,
      subscriptions: result.subscriptions.map((sub: any) => ({
        id: sub.id,
        qrCode: sub.qr_code,
        onboardingKey: (sub.metadata as any)?.onboarding?.secretKey || 'N/A',
      })),
      user: user ? {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
      } : undefined,
      order: {
        id: result.order.id,
        total: result.order.total,
        currency: result.order.currency,
      },
      message: saleData.saleMode === SaleMode.IDENTIFIED
        ? `Vente réalisée avec succès. ${saleData.quantity} abonnement(s) créé(s) et associé(s) au compte client.`
        : `Vente anonyme réalisée avec succès. ${saleData.quantity} abonnement(s) créé(s). Le client peut créer son compte avec les clés d'onboarding.`,
    };
  }

  /**
   * Applique les incentives d'onboarding
   */
  private async applyOnboardingIncentives(userId: string, subscriptions: any[], onboardingKey: string) {
    try {
      // Récupérer les données d'incentive depuis les métadonnées du premier abonnement
      const firstSubscription = subscriptions[0];
      const onboardingData = (firstSubscription?.metadata as any)?.onboarding;
      
      if (!onboardingData) {
        this.logger.warn('No onboarding data found in subscription metadata', JSON.stringify({
          subscriptionId: firstSubscription?.id,
          onboardingKey
        }));
        return null;
      }

      const incentiveType = onboardingData.incentiveType || 'BONUS_POINTS';
      const incentiveValue = onboardingData.incentiveValue || 50;
      const description = onboardingData.description || 'Bonus inscription';

      // Ici vous pouvez implémenter la logique spécifique selon le type d'incentive
      // Par exemple : ajouter des points de fidélité, créer des réductions, etc.
      
      this.logger.logBusinessEvent('ONBOARDING_INCENTIVE_APPLIED', {
        userId,
        onboardingKey,
        incentiveType,
        incentiveValue,
        description,
        subscriptionsCount: subscriptions.length,
      }, userId);

      return {
        type: incentiveType,
        value: incentiveValue,
        description: description,
      };
    } catch (error) {
      this.logger.error('Error applying onboarding incentives', error.stack);
      return null;
    }
  }

  /**
   * Génère un mot de passe aléatoire sécurisé
   */
  private generateRandomPassword(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@$!%*?&';
    let password = '';
    
    // Garantir au moins un caractère de chaque type
    password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)]; // Majuscule
    password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)]; // Minuscule
    password += '0123456789'[Math.floor(Math.random() * 10)]; // Chiffre
    password += '@$!%*?&'[Math.floor(Math.random() * 7)]; // Spécial
    
    // Compléter avec des caractères aléatoires
    for (let i = 4; i < 12; i++) {
      password += chars[Math.floor(Math.random() * chars.length)];
    }
    
    // Mélanger le mot de passe
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }
}