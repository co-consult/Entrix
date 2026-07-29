// src/modules/subscription-sales/services/subscription-sales.service.ts

import { 
  Injectable, 
  NotFoundException, 
  ConflictException, 
  BadRequestException,
  InternalServerErrorException 
} from '@nestjs/common';

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

      // 4. Gérer utilisateur si mode identifié
      let user = null;
      if (saleData.saleMode === SaleMode.IDENTIFIED && saleData.customerInfo) {
        // Vérifier si l'utilisateur existe déjà par email
        const existingUser = await this.prisma.users.findUnique({
          where: { email: saleData.customerInfo.email }
        });
        
        if (existingUser) {
          // Utiliser l'utilisateur existant
          user = existingUser;
          
          // Update user metadata if this is a no-price user (sponsor/partner)
          if (saleData.customerInfo?.noPrice) {
            const updatedMetadata = {
              ...(user.metadata || {}),
              isNoPriceUser: true,
              sponsorType: saleData.customerInfo.sponsorType || 'SPONSOR',
              updatedAt: new Date().toISOString()
            };
            
            // Update the user's metadata
            await this.usersService.update(user.id, {
              metadata: updatedMetadata
            });
            
            // Update the user object for this transaction
            user.metadata = updatedMetadata;
            
            this.logger.info('Updated existing user metadata for sponsor/partner', JSON.stringify({
              userId: user.id,
              email: user.email,
              metadata: updatedMetadata
            }));
          } else {
            this.logger.info('Using existing user', JSON.stringify({
              userId: user.id,
              email: user.email
            }));
          }
        } else {
          // Créer un nouvel utilisateur
          user = await this.createUserWithProfile(saleData.customerInfo);
          this.logger.info('Created new user', JSON.stringify({
            userId: user.id,
            email: user.email
          }));
        }
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
          // Vérifier cache d'abord (but we need to check access_rights anyway for accuracy)
          const cacheKey = `${this.QR_CACHE_PREFIX}${qrCode}`;
          const cached = await this.redis.getCache<any>(cacheKey);
          
          // Note: We don't use cached data for availability check because access_rights 
          // can change without updating the cache. We always check the database.

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

          // Check for RESERVED status - QR codes with RESERVED status are not usable
          if (physicalQR.status === 'RESERVED') {
            return {
              qrCode,
              isAvailable: false,
              status: 'RESERVED',
              errorMessage: 'QR code réservé (non utilisable)',
            };
          }

          // Simple check: if physical QR status is ASSIGNED, it's already used
          if (physicalQR.status === 'ASSIGNED') {
            return {
              qrCode,
              isAvailable: false,
              status: 'ALREADY_ASSIGNED',
              errorMessage: 'QR code déjà assigné à un abonnement',
            };
          }

          // Vérifier correspondance avec le plan
          const planMatches = !planId || physicalQR.subscription_plan_id === planId;
          
          // A QR code is available if physical QR status is AVAILABLE
          const isAvailable = physicalQR.status === 'AVAILABLE';

          // Mettre en cache
          await this.redis.setCache(cacheKey, physicalQR, this.CACHE_TTL);

          return {
            qrCode,
            isAvailable,
            status: physicalQR.status,
            planMatches,
            errorMessage: !isAvailable ? `QR code non disponible (statut: ${physicalQR.status})` : undefined,
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
          status: QRCodeStatus.AVAILABLE, // Only AVAILABLE status, exclude RESERVED
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

    // Check if this is a no-price user (sponsor/partner)
    const isNoPriceUser = saleData.customerInfo?.noPrice === true;
    
    // Debug logging for amount validation
    this.logger.debug('Amount validation debug', JSON.stringify({
      amount: saleData.amount,
      amountType: typeof saleData.amount,
      customerInfo: saleData.customerInfo,
      noPrice: saleData.customerInfo?.noPrice,
      noPriceType: typeof saleData.customerInfo?.noPrice,
      isNoPriceUser,
      saleMode: saleData.saleMode
    }));
    
    // Vérifier montant positif (allow 0 for sponsor/partner users)
    if (saleData.amount < 0 || (!isNoPriceUser && saleData.amount <= 0)) {
      throw new BadRequestException(
        isNoPriceUser 
          ? 'Le montant ne peut pas être négatif' 
          : 'Le montant doit être positif'
      );
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

    // Prepare user metadata for sponsor/partner users
    const userMetadata = customerInfo.noPrice ? {
      isNoPriceUser: true,
      sponsorType: customerInfo.sponsorType || 'SPONSOR',
      originalPrice: null, // Will be set when subscription is created
      createdAt: new Date().toISOString()
    } : undefined;

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
      metadata: userMetadata,
    });

    // Créer le profil avec fan_id
    await this.profilesService.create({
      userId: user.id,
      language: 'fr',
      country: 'TN',
    });

    if (customerInfo.fanId) {
      await this.prisma.user_profiles.update({
        where: { user_id: user.id },
        data: { fan_id: customerInfo.fanId },
      });
    }

    return user;
  }

  /**
   * Génère un numéro de commande séquentiel au format ORD_XXXXXXXX
   */
  private async generateOrderNumber(tx: any): Promise<string> {
    // Find the last order number with proper format
    const lastOrder = await tx.orders.findFirst({
      where: {
        order_number: {
          startsWith: 'ORD_'
        }
      },
      orderBy: {
        order_number: 'desc'
      },
      select: {
        order_number: true
      }
    });

    let nextNumber = 1;
    
    if (lastOrder) {
      // Extract the number from the last order_number (format: ORD_XXXXXXXX)
      const match = lastOrder.order_number.match(/ORD_(\d+)/);
      if (match) {
        nextNumber = parseInt(match[1]) + 1;
      }
    }

    // Format the number with zero padding (8 digits)
    const formattedNumber = nextNumber.toString().padStart(8, '0');
    const orderNumber = `ORD_${formattedNumber}`;
    
    // Verify uniqueness and retry if needed
    const existingOrder = await tx.orders.findUnique({
      where: { order_number: orderNumber }
    });
    
    if (existingOrder) {
      // If collision occurs, find the next available number
      const allOrders = await tx.orders.findMany({
        where: {
          order_number: {
            startsWith: 'ORD_'
          }
        },
        orderBy: {
          order_number: 'desc'
        },
        select: {
          order_number: true
        }
      });
      
      // Find the highest number and increment
      let maxNumber = 0;
      for (const order of allOrders) {
        const match = order.order_number.match(/ORD_(\d+)/);
        if (match) {
          const num = parseInt(match[1]);
          if (num > maxNumber) {
            maxNumber = num;
          }
        }
      }
      
      const newNumber = maxNumber + 1;
      const newFormattedNumber = newNumber.toString().padStart(8, '0');
      return `ORD_${newFormattedNumber}`;
    }
    
    return orderNumber;
  }

  /**
   * Crée la commande
   */
  private async createOrder(tx: any, saleData: ISubscriptionSaleData, userId: string | null, plan: any) {
    const orderNumber = await this.generateOrderNumber(tx);
    
    // Check if this is a no-price user (sponsor/partner)
    const isNoPriceUser = saleData.customerInfo?.noPrice === true;
    const sponsorType = saleData.customerInfo?.sponsorType;
    
    // Calculate total amount - 0 for no-price users, otherwise use the sale amount
    const totalAmount = isNoPriceUser ? 0 : saleData.amount;
    
    return await tx.orders.create({
      data: {
        order_number: orderNumber,
        user_id: userId,
        primary_organizer_id: plan.organizer_id,
        status: 'CONFIRMED',
        total_amount: totalAmount,
        currency: saleData.currency,
        purchase_channel:
          saleData.saleChannel === 'PHYSICAL'
            ? 'COUNTER'
            : saleData.saleChannel === 'PARTNER'
              ? 'PARTNER'
              : 'WEB',
        guest_name: saleData.customerInfo ? 
          `${saleData.customerInfo.firstName} ${saleData.customerInfo.lastName}` : 
          'Client Anonyme',
        guest_email: saleData.customerInfo?.email || null,
        guest_phone: saleData.customerInfo?.phone || null,
        metadata: {
          ...saleData.metadata,
          sellerId: saleData.sellerId,
          qrCodes: saleData.qrCodes,
          orderType: 'SUBSCRIPTION',
          channel: saleData.saleChannel,
          paymentMethod: saleData.paymentMethod,
          // Sponsor/Partner information
          isNoPriceUser: isNoPriceUser,
          sponsorType: sponsorType,
          originalAmount: isNoPriceUser ? saleData.amount : null,
        },
        confirmed_at: new Date(),
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

    // Check if this is a no-price user (sponsor/partner)
    const isNoPriceUser = saleData.customerInfo?.noPrice === true;
    const sponsorType = saleData.customerInfo?.sponsorType;
    
    // Calculate price - 0 for no-price users, otherwise use the sale amount
    const pricePerSubscription = isNoPriceUser ? 0 : (saleData.amount / saleData.quantity);

    for (let i = 0; i < saleData.quantity; i++) {
      const qrCode = saleData.qrCodes[i];
      
      // Récupérer la clé onboarding associée au QR code
      const physicalQR = await tx.physical_qr_codes.findUnique({
        where: { qr_code: qrCode },
      });

      const subscription = await tx.subscriptions.create({
        data: {
          subscription_number: `SUB-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          plan_id: plan.id,
          user_id: userId,
          status: 'ACTIVE',
          start_date: plan.valid_from,
          end_date: plan.valid_until,
          price_paid: pricePerSubscription,
          currency: saleData.currency,
          metadata: {
            orderId,
            saleMode: saleData.saleMode,
            saleChannel: saleData.saleChannel,
            qrCode: qrCode,
            guestName: saleData.customerInfo ? 
              `${saleData.customerInfo.firstName} ${saleData.customerInfo.lastName}` : null,
            guestEmail: saleData.customerInfo?.email || null,
            guestPhone: saleData.customerInfo?.phone || null,
            // Sponsor/Partner information
            isNoPriceUser: isNoPriceUser,
            sponsorType: sponsorType,
            originalPrice: isNoPriceUser ? saleData.amount / saleData.quantity : null,
            // Seller and payment information
            sellerId: saleData.sellerId,
            sellerEmail: saleData.sellerEmail,
            sellerName: saleData.sellerName,
            paymentMethod: saleData.paymentMethod,
            paymentDetails: saleData.paymentDetails,
            note: saleData.note,
            // Debug: Log what we're storing in metadata
            debugPaymentInfo: {
              paymentMethod: saleData.paymentMethod,
              paymentDetails: saleData.paymentDetails,
              note: saleData.note,
              hasPaymentDetails: !!saleData.paymentDetails,
              hasNote: !!saleData.note,
              sellerId: saleData.sellerId,
              sellerEmail: saleData.sellerEmail,
              sellerName: saleData.sellerName,
              isNoPriceUser: isNoPriceUser,
              sponsorType: sponsorType
            },
            // Onboarding information
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

      // Créer l'order_item correspondant - désactiver temporairement le trigger
      await tx.$executeRaw`ALTER TABLE order_items DISABLE TRIGGER ALL`;
      
      await tx.$executeRaw`
        INSERT INTO order_items (
          id, order_id, subscription_plan_id, item_type, item_name, 
          quantity, unit_price, discount_amount, total_price, currency, 
          created_at, updated_at
        ) VALUES (
          gen_random_uuid(), ${orderId}::uuid, ${plan.id}::uuid, 'SUBSCRIPTION', ${plan.name},
          1, ${pricePerSubscription}, 0, ${pricePerSubscription}, ${saleData.currency},
          NOW(), NOW()
        )
      `;
      
      await tx.$executeRaw`ALTER TABLE order_items ENABLE TRIGGER ALL`;
    }

    return subscriptions;
  }

  /**
   * Crée les droits d'accès
   */
  private async createAccessRights(tx: any, subscriptions: any[], plan: any) {
    for (const subscription of subscriptions) {
      // Extraire le QR code depuis les métadonnées de l'abonnement
      const subscriptionMetadata = subscription.metadata as any;
      const qrCode = subscriptionMetadata?.qrCode;
      
      if (!qrCode) {
        throw new Error(`QR code not found in subscription metadata for subscription ${subscription.id}`);
      }

      // Use raw SQL to bypass Prisma client schema mismatch
      const accessCode = `ACC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const accessMetadata = JSON.stringify({
        subscriptionType: plan.type,
        planName: plan.name,
        benefits: plan.benefits,
      });

      // Temporarily disable triggers to avoid audit conflicts
      await tx.$executeRaw`ALTER TABLE access_rights DISABLE TRIGGER ALL`;
      
      try {
        await tx.$executeRaw`
          INSERT INTO access_rights (
            qr_code, subscription_id, organizer_id, source_type, access_code, 
            status, valid_from, valid_until, max_uses, current_uses, access_metadata
          ) VALUES (
            ${qrCode}, ${subscription.id}::uuid, ${plan.organizer_id}::uuid, 
            'SUBSCRIPTION'::access_source_type, ${accessCode}, 
            'VALID'::access_right_status, ${plan.valid_from}, ${plan.valid_until}, 
            999999, 0, ${accessMetadata}::jsonb
          )
        `;
      } finally {
        // Re-enable triggers
        await tx.$executeRaw`ALTER TABLE access_rights ENABLE TRIGGER ALL`;
      }
    }

    // Clear cache for all QR codes that now have access rights
    const qrCodes = subscriptions.map(sub => sub.qr_code);
    await this.clearQRCodesCache(qrCodes);
  }

  /**
   * Marque les QR codes comme assignés
   */
  private async assignQRCodes(tx: any, qrCodes: string[], assignedBy?: string) {
    // Update QR codes status
    await tx.physical_qr_codes.updateMany({
      where: { qr_code: { in: qrCodes } },
      data: {
        status: QRCodeStatus.ASSIGNED,
        assigned_at: new Date(),
        assigned_by: assignedBy || null,
      },
    });

    // Sync seat status for each QR code that has a seat
    for (const qrCodeString of qrCodes) {
      const qrCode = await tx.physical_qr_codes.findFirst({
        where: { qr_code: qrCodeString },
      });

      if (qrCode && qrCode.metadata?.seat) {
        // Extract seat from metadata
        const seatLabel = qrCode.metadata.seat;
        const seatMatch = seatLabel.match(/^([A-Z])(\d+)$/i);
        
        if (seatMatch) {
          const rowNumber = seatMatch[1].toUpperCase();
          const seatNumber = seatLabel; // Full identifier like "A1"

          // Get zone from QR code pattern
          const qrCodeParts = qrCodeString.split(':');
          const zoneCode = qrCodeParts.length >= 4 ? qrCodeParts[3] : null;

          if (zoneCode) {
            const zone = await tx.venue_zones.findFirst({
              where: { code: zoneCode },
              select: { id: true },
            });

            if (zone) {
              const seat = await tx.seats.findFirst({
                where: {
                  zone_id: zone.id,
                  seat_number: seatNumber,
                  row_number: rowNumber,
                },
              });

              if (seat) {
                await tx.seats.update({
                  where: { id: seat.id },
                  data: {
                    status: 'SOLD',
                    updated_at: new Date(),
                  },
                });
                this.logger.debug(
                  `Synced seat ${seatNumber} status to SOLD for QR code ${qrCodeString}`
                );
              }
            }
          }
        }
      }
    }

    // Invalider le cache pour tous les QR codes assignés
    await this.clearQRCodesCache(qrCodes);
  }

  /**
   * Clear cache for multiple QR codes
   */
  private async clearQRCodesCache(qrCodes: string[]) {
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

  // ============================================================================
  // QR CODE UTILITIES
  // ============================================================================

  /**
   * Récupère les informations d'un QR code physique
   */
  async getQRCodeInfo(qrCode: string) {
    const operationId = this.logger.startOperation('getQRCodeInfo');
    
    try {
      const physicalQR = await this.prisma.physical_qr_codes.findUnique({
        where: { qr_code: qrCode },
        select: {
          qr_code: true,
          onboarding_key: true,
          serial_number: true,
          card_batch: true,
          card_type: true,
          status: true,
          subscription_plan_id: true,
          assigned_at: true,
          first_used_at: true,
          metadata: true
        }
      });

      if (!physicalQR) {
        this.logger.endOperation('getQRCodeInfo', operationId, false);
        throw new NotFoundException(`QR code ${qrCode} non trouvé`);
      }

      // Simple check: if physical QR status is ASSIGNED, it's already used
      const isAlreadyAssigned = physicalQR.status === 'ASSIGNED';
      const isAvailable = physicalQR.status === 'AVAILABLE';

      // Debug logging
      this.logger.logBusinessEvent('QR_CODE_VALIDATION_DEBUG', {
        qrCode,
        physicalStatus: physicalQR.status,
        isAlreadyAssigned,
        isAvailable,
        finalResult: isAvailable ? 'AVAILABLE' : 'NOT_AVAILABLE'
      });

      // Extract comprehensive access information from metadata if available
      const accessInfo = physicalQR.metadata && typeof physicalQR.metadata === 'object' 
        ? {
            seat_number: (physicalQR.metadata as any).seat_number || (physicalQR.metadata as any).seat || null,
            row_number: (physicalQR.metadata as any).row_number || null,
            zone_name: (physicalQR.metadata as any).zone_name || (physicalQR.metadata as any).zone || (physicalQR.metadata as any).section || null,
            seat_code: (physicalQR.metadata as any).seat_code || null,
            entry_gate: (physicalQR.metadata as any).entry_gate || (physicalQR.metadata as any).access_point || (physicalQR.metadata as any).gate || (physicalQR.metadata as any).porte || null,
            plan_name: (physicalQR.metadata as any).plan_name || (physicalQR.metadata as any).plan || null,
            user_name: (physicalQR.metadata as any).user_name || (physicalQR.metadata as any).user || null
          }
        : {
            seat_number: null,
            row_number: null,
            zone_name: null,
            seat_code: null,
            entry_gate: null,
            plan_name: null,
            user_name: null
          };

      this.logger.endOperation('getQRCodeInfo', operationId, true);
      return {
        success: true,
        data: {
          ...physicalQR,
          isAvailable,
          isAlreadyAssigned,
          ...accessInfo
        },
        message: isAvailable 
          ? 'Informations du QR code récupérées avec succès'
          : `QR code ${physicalQR.status.toLowerCase()}`
      };
    } catch (error) {
      this.logger.endOperation('getQRCodeInfo', operationId, false);
      throw error;
    }
  }

  /**
   * Recherche un QR code par numéro de série
   */
  async getQRCodeBySerialNumber(serialNumber: string, planId?: string, suffix?: string) {
    const operationId = this.logger.startOperation('getQRCodeBySerialNumber');
    
    try {
      // Determine suffix from subscription plan if planId is provided but suffix is not
      let effectiveSuffix = suffix;
      if (planId && !suffix) {
        effectiveSuffix = await this.determineSuffixFromPlan(planId);
        this.logger.info(`Determined suffix ${effectiveSuffix} for plan ${planId}`);
      }
      
      // Build where clause
      const where: any = { serial_number: serialNumber };
      
      // If suffix is provided (either explicitly or determined from plan), filter by QR code suffix (e.g., SUB, SUBVB)
      // This ensures we find the correct QR code for the subscription plan type
      if (effectiveSuffix) {
        where.qr_code = {
          contains: `:${effectiveSuffix.toUpperCase()}:`,
        };
      }
      
      const physicalQR = await this.prisma.physical_qr_codes.findFirst({
        where,
        select: {
          qr_code: true,
          onboarding_key: true,
          serial_number: true,
          card_batch: true,
          card_type: true,
          status: true,
          subscription_plan_id: true,
          assigned_at: true,
          first_used_at: true,
          metadata: true
        }
      });

      if (!physicalQR) {
        this.logger.endOperation('getQRCodeBySerialNumber', operationId, false);
        const suffixHint = effectiveSuffix ? ` avec le suffixe ${effectiveSuffix}` : '';
        throw new NotFoundException(`Aucun QR code trouvé avec le numéro de série ${serialNumber}${suffixHint}`);
      }

      // Validate that the QR code belongs to the selected plan (if planId is provided)
      if (planId && physicalQR.subscription_plan_id !== planId) {
        this.logger.endOperation('getQRCodeBySerialNumber', operationId, false);
        throw new BadRequestException(`Le QR code avec le numéro de série ${serialNumber} n'appartient pas au plan d'abonnement sélectionné`);
      }

      // Simple check: if physical QR status is ASSIGNED, it's already used
      const isAlreadyAssigned = physicalQR.status === 'ASSIGNED';
      const isAvailable = physicalQR.status === 'AVAILABLE';

      // Debug logging
      this.logger.logBusinessEvent('QR_CODE_SERIAL_SEARCH_DEBUG', {
        serialNumber,
        qrCode: physicalQR.qr_code,
        planId,
        qrCodePlanId: physicalQR.subscription_plan_id,
        planValidation: planId ? (physicalQR.subscription_plan_id === planId ? 'VALID' : 'INVALID') : 'SKIPPED',
        physicalStatus: physicalQR.status,
        isAlreadyAssigned,
        isAvailable,
        finalResult: isAvailable ? 'AVAILABLE' : 'NOT_AVAILABLE'
      });

      // Extract seat information from metadata if available
      const seatInfo = physicalQR.metadata && typeof physicalQR.metadata === 'object' 
        ? {
            seat_number: (physicalQR.metadata as any).seat_number || null,
            row_number: (physicalQR.metadata as any).row_number || null,
            zone_name: (physicalQR.metadata as any).zone_name || null,
            seat_code: (physicalQR.metadata as any).seat_code || null
          }
        : {
            seat_number: null,
            row_number: null,
            zone_name: null,
            seat_code: null
          };

      this.logger.endOperation('getQRCodeBySerialNumber', operationId, true);
      return {
        success: true,
        data: {
          ...physicalQR,
          isAvailable,
          isAlreadyAssigned,
          ...seatInfo
        },
        message: isAvailable 
          ? 'QR code trouvé par numéro de série'
          : `QR code ${physicalQR.status.toLowerCase()}`
      };
    } catch (error) {
      this.logger.endOperation('getQRCodeBySerialNumber', operationId, false);
      throw error;
    }
  }

  /**
   * Determine suffix type (SUB or SUBVB) based on subscription plan
   * SUBVB for volleyball/basketball, SUB for football
   */
  private async determineSuffixFromPlan(planId: string): Promise<string> {
    try {
      const plan = await this.prisma.subscription_plans.findUnique({
        where: { id: planId },
        include: {
          organizers: {
            select: {
              name: true,
              metadata: true,
            },
          },
        },
      });

      if (!plan) {
        this.logger.warn(`Plan ${planId} not found, defaulting to SUB`);
        return 'SUB';
      }

      // Check metadata for category
      const metadata = plan.metadata as any;
      if (metadata?.category) {
        const category = metadata.category.toLowerCase();
        if (category.includes('volleyball') || category.includes('basketball') || 
            category.includes('volley') || category.includes('basket')) {
          return 'SUBVB';
        }
      }

      // Check organizer name for hints
      const organizerName = plan.organizers?.name?.toLowerCase() || '';
      if (organizerName.includes('volleyball') || organizerName.includes('basketball') || 
          organizerName.includes('volley') || organizerName.includes('basket')) {
        return 'SUBVB';
      }

      // Check plan name for hints
      const planName = plan.name?.toLowerCase() || '';
      if (planName.includes('volleyball') || planName.includes('basketball') || 
          planName.includes('volley') || planName.includes('basket')) {
        return 'SUBVB';
      }

      // Default to SUB (football)
      return 'SUB';
    } catch (error) {
      this.logger.warn(`Error determining suffix for plan ${planId}: ${error.message}, defaulting to SUB`);
      return 'SUB';
    }
  }

  /**
   * Debug method to see all QR code information
   */
  async getQRCodeDebug(qrCode: string) {
    const operationId = this.logger.startOperation('getQRCodeDebug');
    
    try {
      // Get physical QR code info
      const physicalQR = await this.prisma.physical_qr_codes.findUnique({
        where: { qr_code: qrCode }
      });

      // Get ALL access rights for this QR code (without filters)
      const allAccessRights = await this.prisma.access_rights.findMany({
        where: { qr_code: qrCode },
        include: {
          subscriptions: {
            include: {
              users: {
                select: {
                  first_name: true,
                  last_name: true,
                  email: true
                }
              }
            }
          }
        }
      });

      // Get active and non-expired access rights
      const validAccessRights = await this.prisma.access_rights.findMany({
        where: { 
          qr_code: qrCode,
          status: {
            in: ['VALID', 'PENDING', 'SUSPENDED'] // Active statuses that block reuse
          },
          valid_until: {
            gte: new Date()
          }
        },
        include: {
          subscriptions: {
            include: {
              users: {
                select: {
                  first_name: true,
                  last_name: true,
                  email: true
                }
              }
            }
          }
        }
      });

      this.logger.endOperation('getQRCodeDebug', operationId, true);
      return {
        success: true,
        data: {
          qrCode,
          physicalQR,
          allAccessRights,
          validAccessRights,
          totalAccessRights: allAccessRights.length,
          validAccessRightsCount: validAccessRights.length,
          isAvailable: physicalQR?.status === 'AVAILABLE' && validAccessRights.length === 0
        },
        message: 'Debug information retrieved successfully'
      };
    } catch (error) {
      this.logger.endOperation('getQRCodeDebug', operationId, false);
      throw error;
    }
  }

  /**
   * Test method to validate QR code step by step
   */
  async testQRCodeValidation(qrCode: string) {
    const operationId = this.logger.startOperation('testQRCodeValidation');
    
    try {
      // Step 1: Check physical QR code
      const physicalQR = await this.prisma.physical_qr_codes.findUnique({
        where: { qr_code: qrCode }
      });

      if (!physicalQR) {
        return {
          success: false,
          step: 'physical_qr_check',
          error: 'QR code not found in physical_qr_codes table'
        };
      }

      // Step 2: Check access rights
      const accessRights = await this.prisma.access_rights.findMany({
        where: { qr_code: qrCode },
        include: {
          subscriptions: {
            include: {
              users: {
                select: {
                  first_name: true,
                  last_name: true,
                  email: true
                }
              }
            }
          }
        }
      });

      // Step 3: Check active access rights
      const validAccessRights = await this.prisma.access_rights.findMany({
        where: { 
          qr_code: qrCode,
          status: {
            in: ['VALID', 'PENDING', 'SUSPENDED'] // Active statuses that block reuse
          },
          valid_until: {
            gte: new Date()
          }
        },
        include: {
          subscriptions: {
            include: {
              users: {
                select: {
                  first_name: true,
                  last_name: true,
                  email: true
                }
              }
            }
          }
        }
      });

      // Step 4: Determine availability
      const isPhysicalAvailable = physicalQR.status !== 'DISABLED';
      const hasValidAccessRights = validAccessRights.length > 0;
      const isAvailable = isPhysicalAvailable && !hasValidAccessRights;

      this.logger.endOperation('testQRCodeValidation', operationId, true);
      return {
        success: true,
        qrCode,
        results: {
          step1_physical_qr: {
            found: true,
            status: physicalQR.status,
            isAvailable: isPhysicalAvailable
          },
          step2_all_access_rights: {
            count: accessRights.length,
            rights: accessRights.map(ar => ({
              id: ar.id,
              status: ar.status,
              valid_until: ar.valid_until,
              has_subscription: !!ar.subscriptions
            }))
          },
          step3_valid_access_rights: {
            count: validAccessRights.length,
            rights: validAccessRights.map(ar => ({
              id: ar.id,
              status: ar.status,
              valid_until: ar.valid_until,
              subscription: ar.subscriptions ? {
                id: ar.subscriptions.id,
                status: ar.subscriptions.status,
                user: ar.subscriptions.users
              } : null
            }))
          },
          step4_final_result: {
            isAvailable,
            reason: !isPhysicalAvailable 
              ? `Physical QR is ${physicalQR.status}`
              : hasValidAccessRights 
              ? `Has ${validAccessRights.length} active access right(s)`
              : 'Available for use'
          }
        }
      };
    } catch (error) {
      this.logger.endOperation('testQRCodeValidation', operationId, false);
      throw error;
    }
  }

  /**
   * Raw method to see all raw data for a QR code
   */
  async getQRCodeRaw(qrCode: string) {
    const operationId = this.logger.startOperation('getQRCodeRaw');
    
    try {
      // Get ALL data from physical_qr_codes
      const physicalQR = await this.prisma.physical_qr_codes.findUnique({
        where: { qr_code: qrCode }
      });

      // Get ALL data from access_rights
      const allAccessRights = await this.prisma.access_rights.findMany({
        where: { qr_code: qrCode },
        include: {
          subscriptions: {
            include: {
              users: {
                select: {
                  first_name: true,
                  last_name: true,
                  email: true
                }
              }
            }
          }
        }
      });

      // Note: subscriptions are linked to QR codes through access_rights table
      // So we don't need a separate subscriptions query

      this.logger.endOperation('getQRCodeRaw', operationId, true);
      return {
        success: true,
        qrCode,
        rawData: {
          physical_qr_codes: physicalQR,
          access_rights: allAccessRights,
          summary: {
            physicalQRExists: !!physicalQR,
            physicalQRStatus: physicalQR?.status,
            accessRightsCount: allAccessRights.length,
            accessRightsStatuses: allAccessRights.map(ar => ar.status)
          }
        }
      };
    } catch (error) {
      this.logger.endOperation('getQRCodeRaw', operationId, false);
      throw error;
    }
  }

  /**
   * Clear all QR code cache (for testing)
   */
  async clearAllQRCache() {
    const operationId = this.logger.startOperation('clearAllQRCache');
    
    try {
      // Get all QR code cache keys
      const keys = await this.redis.keys(`${this.QR_CACHE_PREFIX}*`);
      let clearedCount = 0;
      
      for (const key of keys) {
        await this.redis.delCache(key);
        clearedCount++;
      }

      this.logger.endOperation('clearAllQRCache', operationId, true);
      return {
        success: true,
        message: `Cleared ${clearedCount} QR code cache entries`,
        clearedCount
      };
    } catch (error) {
      this.logger.endOperation('clearAllQRCache', operationId, false);
      throw error;
    }
  }

  /**
   * Clear all subscription plans cache (for testing)
   */
  async clearAllPlansCache() {
    const operationId = this.logger.startOperation('clearAllPlansCache');
    
    try {
      // Get all subscription plans cache keys
      const keys = await this.redis.keys('subscription-plans:*');
      let clearedCount = 0;
      
      for (const key of keys) {
        await this.redis.delCache(key);
        clearedCount++;
      }

      this.logger.endOperation('clearAllPlansCache', operationId, true);
      return {
        success: true,
        message: `Cleared ${clearedCount} subscription plans cache entries`,
        clearedCount
      };
    } catch (error) {
      this.logger.endOperation('clearAllPlansCache', operationId, false);
      throw error;
    }
  }

  /**
   * Debug subscriptions data (for testing)
   */
  async debugSubscriptions() {
    const operationId = this.logger.startOperation('debugSubscriptions');
    
    try {
      const subscriptions = await this.prisma.subscriptions.findMany({
        include: {
          users: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              email: true,
            },
          },
          subscription_plans: {
            select: {
              id: true,
              name: true,
              type: true,
              price: true,
              currency: true,
              organizer_id: true,
            },
          },
          organizers: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { created_at: 'desc' },
        take: 10, // Limit to 10 for debugging
      });

      const debugData = subscriptions.map(sub => ({
        id: sub.id,
        subscription_number: sub.subscription_number,
        user_id: sub.user_id,
        plan_id: sub.plan_id,
        status: sub.status,
        start_date: sub.start_date,
        end_date: sub.end_date,
        created_at: sub.created_at,
        // User data
        user: sub.users ? {
          id: sub.users.id,
          first_name: sub.users.first_name,
          last_name: sub.users.last_name,
          email: sub.users.email,
        } : null,
        // Plan data
        subscription_plan: sub.subscription_plans ? {
          id: sub.subscription_plans.id,
          name: sub.subscription_plans.name,
          type: sub.subscription_plans.type,
          price: sub.subscription_plans.price,
          currency: sub.subscription_plans.currency,
        } : null,
        // Organizer data
        organizer: sub.organizers ? {
          id: sub.organizers.id,
          name: sub.organizers.name,
        } : null,
      }));

      this.logger.endOperation('debugSubscriptions', operationId, true);
      return {
        success: true,
        message: `Debug data for ${debugData.length} subscriptions`,
        data: debugData,
        total: debugData.length
      };
    } catch (error) {
      this.logger.endOperation('debugSubscriptions', operationId, false);
      throw error;
    }
  }

  // ============================================================================
  // SUBSCRIPTION MANAGEMENT METHODS
  // ============================================================================

  /**
   * Récupère la liste des abonnements avec filtres
   */
  async getSubscriptions(filters: {
    userId?: string;
    organizerId?: string;
    planId?: string;
    season?: string;
    status?: string;
    vendorId?: string;
    paymentMethod?: string;
    query?: string;
    createdAfter?: string;
    createdBefore?: string;
    page?: number;
    limit?: number;
  }) {
    const where: any = {};

    if (filters.userId) where.user_id = filters.userId;
    if (filters.organizerId) where.organizer_id = filters.organizerId;
    await this.applySeasonAndPlanFilter(where, filters.season, filters.organizerId, filters.planId);
    if (filters.status) where.status = filters.status;
    
    // Add date range filters
    if (filters.createdAfter || filters.createdBefore) {
      where.created_at = {};
      if (filters.createdAfter) {
        where.created_at.gte = new Date(filters.createdAfter);
      }
      if (filters.createdBefore) {
        where.created_at.lte = new Date(filters.createdBefore);
      }
    }
    
    // Add search query functionality
    if (filters.query) {
      where.OR = [
        {
          users: {
            OR: [
              { first_name: { contains: filters.query, mode: 'insensitive' } },
              { last_name: { contains: filters.query, mode: 'insensitive' } },
              { email: { contains: filters.query, mode: 'insensitive' } },
            ]
          }
        },
        {
          subscription_plans: {
            name: { contains: filters.query, mode: 'insensitive' }
          }
        },
        {
          organizers: {
            name: { contains: filters.query, mode: 'insensitive' }
          }
        }
      ];
    }

    // Add metadata filters for vendor and payment method
    if (filters.vendorId || filters.paymentMethod) {
      if (!where.AND) where.AND = [];
      
      if (filters.vendorId) {
        where.AND.push({
          metadata: {
            path: ['sellerId'],
            equals: filters.vendorId
          }
        });
      }
      
      if (filters.paymentMethod) {
        where.AND.push({
          metadata: {
            path: ['paymentMethod'],
            equals: filters.paymentMethod
          }
        });
      }
    }

    try {
      // Get total count for pagination
      const total = await this.prisma.subscriptions.count({ where });

      // Calculate pagination - if no pagination params, return all records
      const page = filters.page || 1;
      const limit = filters.limit || null; // null means no limit (all records)
      const skip = limit ? (page - 1) * limit : 0;

      const subscriptions = await this.prisma.subscriptions.findMany({
        where,
        include: {
          users: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              email: true,
            },
          },
          subscription_plans: {
            select: {
              id: true,
              name: true,
              type: true,
              price: true,
              currency: true,
              organizer_id: true,
            },
          },
          organizers: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { created_at: 'desc' },
        skip,
        ...(limit && { take: limit }),
      });

      // Apply search filter if query is provided
      let filteredSubscriptions = subscriptions;
      if (filters.query) {
        const searchTerm = filters.query.toLowerCase();
        filteredSubscriptions = subscriptions.filter(subscription => {
          // Search in user information
          const userName = `${subscription.users?.first_name || ''} ${subscription.users?.last_name || ''}`.toLowerCase();
          const userEmail = subscription.users?.email?.toLowerCase() || '';
          
          // Search in plan information
          const planName = subscription.subscription_plans?.name?.toLowerCase() || '';
          
          return userName.includes(searchTerm) || 
                 userEmail.includes(searchTerm) || 
                 planName.includes(searchTerm);
        });
      }

      // Extract all unique seller IDs from metadata
      const sellerIds = new Set<string>();
      filteredSubscriptions.forEach(subscription => {
        if (subscription.metadata && typeof subscription.metadata === 'object') {
          const metadata = subscription.metadata as any;
          const sellerId = metadata.sellerId || metadata.seller_id;
          if (sellerId) {
            sellerIds.add(sellerId);
          }
        }
      });

      // Fetch all sellers in one query
      const sellers = sellerIds.size > 0 ? await this.prisma.users.findMany({
        where: { id: { in: Array.from(sellerIds) } },
        select: {
          id: true,
          first_name: true,
          last_name: true,
          email: true,
        },
      }) : [];

      // Create a map for quick lookup
      const sellersMap = new Map(sellers.map(seller => [
        seller.id, 
        {
          id: seller.id,
          name: `${seller.first_name || ''} ${seller.last_name || ''}`.trim() || seller.email,
          email: seller.email,
        }
      ]));

      // Add seller information to subscriptions
      const subscriptionsWithSellers = filteredSubscriptions.map(subscription => {
        let sellerInfo = null;
        
        if (subscription.metadata && typeof subscription.metadata === 'object') {
          const metadata = subscription.metadata as any;
          const sellerId = metadata.sellerId || metadata.seller_id;
          
          if (sellerId) {
            sellerInfo = sellersMap.get(sellerId) || null;
          }
        }
        
        return {
          ...subscription,
          sellerInfo,
        };
      });

      return {
        subscriptions: subscriptionsWithSellers,
        total: filters.query ? filteredSubscriptions.length : total,
      };
    } catch (error) {
      this.logger.error('Error fetching subscriptions:', error);
      throw error;
    }
  }

  async getSubscriptionsStats(filters: {
    userId?: string;
    organizerId?: string;
    planId?: string;
    season?: string;
    status?: string;
    vendorId?: string;
    paymentMethod?: string;
    createdAfter?: string;
    createdBefore?: string;
  }) {
    const where: any = {};

    if (filters.userId) where.user_id = filters.userId;
    if (filters.organizerId) where.organizer_id = filters.organizerId;
    await this.applySeasonAndPlanFilter(where, filters.season, filters.organizerId, filters.planId);
    if (filters.status) where.status = filters.status;
    
    // Add date filters
    if (filters.createdAfter || filters.createdBefore) {
      where.created_at = {};
      if (filters.createdAfter) {
        where.created_at.gte = new Date(filters.createdAfter);
      }
      if (filters.createdBefore) {
        where.created_at.lte = new Date(filters.createdBefore);
      }
    }
    
    // Add metadata filters for vendor and payment method
    if (filters.vendorId || filters.paymentMethod) {
      where.AND = [];
      
      if (filters.vendorId) {
        where.AND.push({
          metadata: {
            path: ['sellerId'],
            equals: filters.vendorId
          }
        });
      }
      
      if (filters.paymentMethod) {
        where.AND.push({
          metadata: {
            path: ['paymentMethod'],
            equals: filters.paymentMethod
          }
        });
      }
    }

    try {
      // Optimized: Only fetch the minimal data needed for stats calculations
      const subscriptions = await this.prisma.subscriptions.findMany({
        where,
        select: {
          id: true,
          price_paid: true,
          status: true,
          created_at: true,
          metadata: true,
          subscription_plans: {
            select: {
              price: true,
            },
          },
        },
        orderBy: { created_at: 'desc' },
      });

      // Calculate stats directly from the minimal data
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      let totalRevenue = 0;
      let totalSubscriptions = subscriptions.length;
      let newThisWeek = 0;
      
      subscriptions.forEach(subscription => {
        // Check if this is a no-price user (sponsor/partner)
        const metadata = subscription.metadata as any;
        const isNoPriceUser = metadata?.isNoPriceUser === true;
        
        // Only calculate revenue for non-sponsor/partner users
        if (!isNoPriceUser) {
          const price = parseFloat(String(subscription.price_paid || subscription.subscription_plans?.price || 0));
          totalRevenue += price;
        }
        
        // Count new this week
        const createdDate = new Date(subscription.created_at);
        if (createdDate >= weekAgo) {
          newThisWeek++;
        }
      });
      
      const avgSubscriptionValue = totalSubscriptions > 0 ? Math.round(totalRevenue / totalSubscriptions) : 0;
      
      // Return calculated stats instead of full records
      return {
        total_revenue: totalRevenue,
        avg_subscription_value: avgSubscriptionValue,
        total_subscriptions: totalSubscriptions,
        new_this_week: newThisWeek
      };
    } catch (error) {
      this.logger.error('Error fetching subscription stats:', error);
      throw error;
    }
  }

  async getFilterOptions(season?: string, organizerId?: string) {
    try {
      let subscriptionWhere: any = {};

      if (season) {
        const planIds = await this.resolvePlanIdsForSeason(season, organizerId);
        subscriptionWhere = { plan_id: planIds.length ? { in: planIds } : { in: [] } };
      }

      const subscriptions = await this.prisma.subscriptions.findMany({
        where: subscriptionWhere,
        select: {
          subscription_plans: {
            select: {
              id: true,
              name: true,
              metadata: true,
            },
          },
          metadata: true,
        },
        orderBy: { created_at: 'desc' },
      });

      let plansSource = subscriptions;
      if (season) {
        const seasonPlans = await this.prisma.subscription_plans.findMany({
          where: {
            ...(organizerId ? { organizer_id: organizerId } : {}),
            metadata: { path: ['season'], equals: season },
          },
          select: { id: true, name: true },
          orderBy: { name: 'asc' },
        });
        const plansMap = new Map<string, string>();
        for (const p of seasonPlans) {
          plansMap.set(p.id, p.name);
        }
        for (const sub of subscriptions) {
          if (sub.subscription_plans?.id && sub.subscription_plans?.name) {
            plansMap.set(sub.subscription_plans.id, sub.subscription_plans.name);
          }
        }
        return this.buildFilterOptionsFromData(subscriptions, plansMap);
      }

      // Extract unique plans
      const plansMap = new Map<string, string>();
      plansSource.forEach((subscription) => {
        if (subscription.subscription_plans?.id && subscription.subscription_plans?.name) {
          plansMap.set(subscription.subscription_plans.id, subscription.subscription_plans.name);
        }
      });

      return this.buildFilterOptionsFromData(subscriptions, plansMap);
    } catch (error) {
      this.logger.error('Error fetching filter options:', error);
      throw error;
    }
  }

  private async resolvePlanIdsForSeason(season: string, organizerId?: string): Promise<string[]> {
    const plans = await this.prisma.subscription_plans.findMany({
      where: {
        ...(organizerId ? { organizer_id: organizerId } : {}),
        metadata: { path: ['season'], equals: season },
      },
      select: { id: true },
    });
    return plans.map((p) => p.id);
  }

  private async applySeasonAndPlanFilter(
    where: Record<string, unknown>,
    season?: string,
    organizerId?: string,
    planId?: string,
  ): Promise<void> {
    if (season) {
      const planIds = await this.resolvePlanIdsForSeason(season, organizerId);
      if (planId) {
        where.plan_id = planIds.includes(planId) ? planId : { in: [] };
      } else {
        where.plan_id = planIds.length > 0 ? { in: planIds } : { in: [] };
      }
      return;
    }
    if (planId) {
      where.plan_id = planId;
    }
  }

  private async buildFilterOptionsFromData(
    subscriptions: Array<{
      metadata?: unknown;
      subscription_plans?: { id: string; name: string } | null;
    }>,
    plansMap: Map<string, string>,
  ) {
    const paymentMethodsSet = new Set<string>();
    subscriptions.forEach((subscription) => {
      if (subscription.metadata && typeof subscription.metadata === 'object') {
        const metadata = subscription.metadata as Record<string, unknown>;
        if (typeof metadata.paymentMethod === 'string') {
          paymentMethodsSet.add(metadata.paymentMethod);
        }
      }
    });

    const sellerIds = new Set<string>();
    subscriptions.forEach((subscription) => {
      if (subscription.metadata && typeof subscription.metadata === 'object') {
        const metadata = subscription.metadata as Record<string, unknown>;
        const sellerId = metadata.sellerId || metadata.seller_id;
        if (typeof sellerId === 'string') {
          sellerIds.add(sellerId);
        }
      }
    });

    const sellers =
      sellerIds.size > 0
        ? await this.prisma.users.findMany({
            where: { id: { in: Array.from(sellerIds) } },
            select: { id: true, first_name: true, last_name: true, email: true },
          })
        : [];

    const vendors = sellers.map((seller) => {
      const fullName = `${seller.first_name || ''} ${seller.last_name || ''}`.trim();
      return {
        id: seller.id,
        name: fullName || seller.email,
        first_name: seller.first_name,
        last_name: seller.last_name,
        email: seller.email,
      };
    });

    return {
      plans: Array.from(plansMap.entries()).map(([id, name]) => ({ id, name })),
      vendors,
      paymentMethods: Array.from(paymentMethodsSet),
    };
  }

  /**
   * Récupère un abonnement spécifique
   */
  async getSubscription(id: string) {
    try {
      const subscription = await this.prisma.subscriptions.findUnique({
        where: { id },
        include: {
          users: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              email: true,
            },
          },
          subscription_plans: {
            select: {
              id: true,
              name: true,
              type: true,
              price: true,
              currency: true,
              organizer_id: true,
            },
          },
          organizers: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      if (!subscription) {
        throw new NotFoundException('Abonnement non trouvé');
      }

      // Fetch seller information
      let sellerInfo = null;
      
      if (subscription.metadata && typeof subscription.metadata === 'object') {
        const metadata = subscription.metadata as any;
        const sellerId = metadata.sellerId || metadata.seller_id;
        
        if (sellerId) {
          try {
            const seller = await this.prisma.users.findUnique({
              where: { id: sellerId },
              select: {
                id: true,
                first_name: true,
                last_name: true,
                email: true,
              },
            });
            
            if (seller) {
              sellerInfo = {
                id: seller.id,
                name: `${seller.first_name || ''} ${seller.last_name || ''}`.trim() || seller.email,
                email: seller.email,
              };
            }
          } catch (error) {
            this.logger.warn(`Failed to fetch seller info for sellerId: ${sellerId}`, error);
          }
        }
      }

      return {
        ...subscription,
        sellerInfo,
      };
    } catch (error) {
      this.logger.error('Error fetching subscription:', error);
      throw error;
    }
  }

  /**
   * Récupère les informations QR code et siège pour un abonnement
   */
  async getSubscriptionQRCodeInfo(subscriptionId: string) {
    const operationId = this.logger.startOperation('getSubscriptionQRCodeInfo');
    
    try {
      // First, get the subscription to verify it exists
      const subscription = await this.prisma.subscriptions.findUnique({
        where: { id: subscriptionId },
        select: {
          id: true,
          subscription_number: true,
          status: true,
          metadata: true,
        },
      });

      if (!subscription) {
        this.logger.endOperation('getSubscriptionQRCodeInfo', operationId, false);
        throw new NotFoundException(`Abonnement ${subscriptionId} non trouvé`);
      }

      // Get access rights for this subscription
      const accessRight = await this.prisma.access_rights.findFirst({
        where: { subscription_id: subscriptionId },
        select: {
          qr_code: true,
          seat_id: true,
          access_metadata: true,
          status: true,
          valid_from: true,
          valid_until: true,
        },
      });

      if (!accessRight) {
        this.logger.endOperation('getSubscriptionQRCodeInfo', operationId, false);
        throw new NotFoundException(`Aucun QR code trouvé pour l'abonnement ${subscriptionId}`);
      }

      // Get QR code details from physical_qr_codes table
      const physicalQR = await this.prisma.physical_qr_codes.findUnique({
        where: { qr_code: accessRight.qr_code },
        select: {
          serial_number: true,
          card_batch: true,
          card_type: true,
          metadata: true,
        },
      });

      // Extract QR code metadata if available
      const qrCodeMetadata = physicalQR?.metadata && typeof physicalQR.metadata === 'object'
        ? physicalQR.metadata as any
        : {};

      // Try to get seat information from subscription metadata as well
      const subscriptionMetadata = subscription.metadata && typeof subscription.metadata === 'object'
        ? subscription.metadata as any
        : {};

      // Get seat information if seat_id exists
      let seatInfo = null;
      if (accessRight.seat_id) {
        seatInfo = await this.prisma.seats.findUnique({
          where: { id: accessRight.seat_id },
          select: {
            seat_number: true,
            row_number: true,
            seat_type: true,
            status: true,
            venue_zones: {
              select: {
                name: true,
                zone_type: true,
                code: true,
              },
            },
          },
        });
      }

      // Extract seat information from access_metadata if available
      const accessMetadata = accessRight.access_metadata && typeof accessRight.access_metadata === 'object' 
        ? accessRight.access_metadata as any
        : {};

      // Debug logging
      this.logger.debug('Access Right Debug - seat_id: ' + accessRight.seat_id + ', access_metadata: ' + JSON.stringify(accessMetadata) + ', subscription_metadata: ' + JSON.stringify(subscriptionMetadata) + ', qr_code_metadata: ' + JSON.stringify(qrCodeMetadata) + ', seatInfo: ' + JSON.stringify(seatInfo));

      const result = {
        subscription: {
          id: subscription.id,
          subscription_number: subscription.subscription_number,
          status: subscription.status,
        },
        qr_code: {
          code: accessRight.qr_code,
          serial_number: physicalQR?.serial_number || null,
          card_batch: physicalQR?.card_batch || null,
          card_type: physicalQR?.card_type || null,
          status: accessRight.status,
          valid_from: accessRight.valid_from,
          valid_until: accessRight.valid_until,
        },
        seat: seatInfo ? {
          seat_number: seatInfo.seat_number,
          row_number: seatInfo.row_number,
          seat_type: seatInfo.seat_type,
          status: seatInfo.status,
          zone_name: seatInfo.venue_zones?.name || null,
          seat_code: seatInfo.venue_zones?.code || null,
          zone_type: seatInfo.venue_zones?.zone_type || null,
          zone_name_from_db: seatInfo.venue_zones?.name || null,
        } : {
          // Try multiple sources for seat information
          seat_number: accessMetadata.seat_number || subscriptionMetadata.seat_number || qrCodeMetadata.seat_number || accessMetadata.seatNumber || subscriptionMetadata.seatNumber || qrCodeMetadata.seatNumber || null,
          row_number: accessMetadata.row_number || subscriptionMetadata.row_number || qrCodeMetadata.row_number || accessMetadata.rowNumber || subscriptionMetadata.rowNumber || qrCodeMetadata.rowNumber || null,
          zone_name: accessMetadata.zone_name || subscriptionMetadata.zone_name || qrCodeMetadata.zone_name || accessMetadata.zoneName || subscriptionMetadata.zoneName || qrCodeMetadata.zoneName || null,
          seat_code: accessMetadata.seat_code || subscriptionMetadata.seat_code || qrCodeMetadata.seat_code || accessMetadata.seatCode || subscriptionMetadata.seatCode || qrCodeMetadata.seatCode || null,
          zone_type: accessMetadata.zone_type || subscriptionMetadata.zone_type || qrCodeMetadata.zone_type || accessMetadata.zoneType || subscriptionMetadata.zoneType || qrCodeMetadata.zoneType || null,
          zone_name_from_db: accessMetadata.zone_name || subscriptionMetadata.zone_name || qrCodeMetadata.zone_name || accessMetadata.zoneName || subscriptionMetadata.zoneName || qrCodeMetadata.zoneName || null,
        },
      };

      this.logger.endOperation('getSubscriptionQRCodeInfo', operationId, true);
      return {
        success: true,
        data: result,
        message: 'Informations QR code et siège récupérées avec succès',
      };
    } catch (error) {
      this.logger.endOperation('getSubscriptionQRCodeInfo', operationId, false);
      throw error;
    }
  }

  /**
   * Crée un nouvel abonnement
   */
  async createSubscription(data: {
    user_id: string;
    subscription_plan_id: string;
    qr_code: string;
    event_id?: string;
    start_date?: string;
    end_date?: string;
  }) {
    // Vérifier que l'utilisateur existe
    const user = await this.prisma.users.findUnique({
      where: { id: data.user_id },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    // Vérifier que le plan existe
    const plan = await this.prisma.subscription_plans.findUnique({
      where: { id: data.subscription_plan_id },
    });

    if (!plan) {
      throw new NotFoundException('Plan d\'abonnement non trouvé');
    }

    // Vérifier que le QR code n'est pas déjà utilisé
    const existingAccessRight = await this.prisma.access_rights.findFirst({
      where: { qr_code: data.qr_code },
    });

    if (existingAccessRight) {
      throw new BadRequestException('Ce QR code est déjà utilisé');
    }

    const subscription = await this.prisma.subscriptions.create({
      data: {
        subscription_number: `SUB-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        plan_id: data.subscription_plan_id,
        user_id: data.user_id,
        status: 'ACTIVE',
        start_date: data.start_date ? new Date(data.start_date) : plan.valid_from,
        end_date: data.end_date ? new Date(data.end_date) : plan.valid_until,
        price_paid: plan.price,
        currency: plan.currency,
      },
      include: {
        users: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        },
        subscription_plans: {
          select: {
            id: true,
            name: true,
            type: true,
            price: true,
            currency: true,
          },
        },
      },
    });

    return subscription;
  }

  /**
   * Met à jour un abonnement
   */
  async updateSubscription(id: string, data: {
    status?: string;
    start_date?: string;
    end_date?: string;
    subscription_plan_id?: string;
  }) {
    const subscription = await this.prisma.subscriptions.findUnique({
      where: { id },
    });

    if (!subscription) {
      throw new NotFoundException('Abonnement non trouvé');
    }

    const updateData: any = {};
    if (data.status) updateData.status = data.status;
    if (data.start_date) updateData.start_date = new Date(data.start_date);
    if (data.end_date) updateData.end_date = new Date(data.end_date);
    if (data.subscription_plan_id) updateData.plan_id = data.subscription_plan_id;

    const updatedSubscription = await this.prisma.subscriptions.update({
      where: { id },
      data: updateData,
      include: {
        users: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        },
        subscription_plans: {
          select: {
            id: true,
            name: true,
            type: true,
            price: true,
            currency: true,
          },
        },
      },
    });

    return updatedSubscription;
  }

  /**
   * Supprime un abonnement
   */
  async deleteSubscription(id: string) {
    const subscription = await this.prisma.subscriptions.findUnique({
      where: { id },
    });

    if (!subscription) {
      throw new NotFoundException('Abonnement non trouvé');
    }

    await this.prisma.subscriptions.delete({
      where: { id },
    });
  }

  /**
   * Active un abonnement
   */
  async activateSubscription(id: string) {
    const subscription = await this.prisma.subscriptions.findUnique({
      where: { id },
    });

    if (!subscription) {
      throw new NotFoundException('Abonnement non trouvé');
    }

    const updatedSubscription = await this.prisma.subscriptions.update({
      where: { id },
      data: { status: 'ACTIVE' },
      include: {
        users: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        },
        subscription_plans: {
          select: {
            id: true,
            name: true,
            type: true,
            price: true,
            currency: true,
          },
        },
      },
    });

    return updatedSubscription;
  }

  /**
   * Désactive un abonnement
   */
  async deactivateSubscription(id: string, suspensionReason?: string) {
    const subscription = await this.prisma.subscriptions.findUnique({
      where: { id },
    });

    if (!subscription) {
      throw new NotFoundException('Abonnement non trouvé');
    }

    // Prepare metadata update
    const metadataUpdate: any = {
      suspendedAt: new Date().toISOString(),
      suspendedBy: 'admin_panel' // You might want to get this from the current user context
    };

    if (suspensionReason) {
      metadataUpdate.suspensionReason = suspensionReason;
    }

    const updatedSubscription = await this.prisma.subscriptions.update({
      where: { id },
      data: { 
        status: 'SUSPENDED',
        metadata: {
          ...(subscription.metadata as Record<string, any> || {}),
          ...metadataUpdate
        }
      },
      include: {
        users: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        },
        subscription_plans: {
          select: {
            id: true,
            name: true,
            type: true,
            price: true,
            currency: true,
          },
        },
      },
    });

    return updatedSubscription;
  }

  /**
   * Récupère les avantages d'un abonnement
   */
  async getSubscriptionBenefits(id: string) {
    const subscription = await this.prisma.subscriptions.findUnique({
      where: { id },
      include: {
        subscription_plans: {
          include: {
            subscription_plan_event_groups: {
              include: {
                event_groups: true,
              },
            },
            subscription_plan_events: {
              include: {
                events: true,
              },
            },
            organizers: true,
          },
        },
        access_rights: {
          include: {
            events: true,
          },
        },
      },
    });

    if (!subscription) {
      throw new NotFoundException('Abonnement non trouvé');
    }

    return {
      subscription,
      benefits: {
        eventGroups: subscription.subscription_plans.subscription_plan_event_groups,
        events: subscription.subscription_plans.subscription_plan_events,
        zones: subscription.access_rights,
      },
    };
  }

  /**
   * Récupère les statistiques des abonnements
   */
  async getSubscriptionStats(organizerId?: string) {
    // Validate UUID format if organizerId is provided
    if (organizerId) {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(organizerId)) {
        throw new BadRequestException('Invalid organizerId format. Expected UUID format.');
      }
    }

    const where: any = {};
    if (organizerId) where.organizer_id = organizerId;

    const [totalSubscriptions, activeSubscriptions, recentSubscriptions] = await Promise.all([
      this.prisma.subscriptions.count({ where }),
      this.prisma.subscriptions.count({ where: { ...where, status: 'ACTIVE' } }),
      this.prisma.subscriptions.count({
        where: {
          ...where,
          created_at: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 derniers jours
          },
        },
      }),
    ]);

    return {
      totalSubscriptions,
      activeSubscriptions,
      recentSubscriptions,
    };
  }

  /**
   * Vérifie l'accès d'un utilisateur à un événement
   */
  async checkSubscriptionAccess(userId: string, eventId: string) {
    const accessRights = await this.prisma.access_rights.findMany({
      where: {
        user_id: userId,
        event_id: eventId,
      },
      include: {
        subscriptions: {
          include: {
            subscription_plans: true,
          },
        },
      },
    });

    return {
      hasAccess: accessRights.length > 0,
      accessRights,
    };
  }

  /**
   * Récupère les abonnements actifs d'un utilisateur
   */
  async getActiveSubscriptions(userId: string) {
    try {
      const subscriptions = await this.prisma.subscriptions.findMany({
        where: {
          user_id: userId,
          status: 'ACTIVE',
        },
        include: {
          subscription_plans: {
            select: {
              id: true,
              name: true,
              type: true,
              price: true,
              currency: true,
              organizer_id: true,
            },
          },
          organizers: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { created_at: 'desc' },
      });

      // Transform the data to include organizer info
      return subscriptions.map(subscription => ({
        ...subscription,
        subscription_plans: {
          ...subscription.subscription_plans,
          organizers: subscription.organizers || null,
        },
      }));
    } catch (error) {
      this.logger.error('Error fetching active subscriptions:', error);
      throw error;
    }
  }
}