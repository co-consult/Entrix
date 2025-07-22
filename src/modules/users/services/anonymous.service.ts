// src/modules/users/services/anonymous.service.ts

import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { RedisService } from '../../../shared/redis/redis.service';
import { LoggerService } from '../../../shared/logger/logger.service';
import { EmailService } from '../../../shared/email/email.service';
import { BullmqService } from '../../../shared/bullmq/bullmq.service';
import { users } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { 
  CreateAnonymousData, 
  ConversionData,
  ConversionResult,
  OnboardingKeyValidation,
  AnonymousStats,
  ConversionStats,
  DateRange,
  OnboardingKeyData
} from '../interfaces/anonymous.interface';
import { IncentiveType } from '../types/enums';

/**
 * Service pour la gestion des utilisateurs anonymes et leur conversion
 * Les utilisateurs anonymes sont stockés temporairement dans Redis
 * et leurs données permanentes dans les métadonnées des commandes/tickets
 */
@Injectable()
export class AnonymousService {
  private readonly logger: LoggerService;
  private readonly CACHE_PREFIX = 'anonymous:';
  private readonly ONBOARDING_PREFIX = 'onboarding:';
  private readonly DEFAULT_EXPIRY = 30 * 24 * 3600; // 30 jours en secondes

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly email: EmailService,
    private readonly bullmq: BullmqService,
    loggerService: LoggerService,
  ) {
    this.logger = loggerService.createChildLogger('AnonymousService');
  }

  /**
   * Crée un utilisateur anonyme temporaire dans Redis
   * Utilisé lors d'achats anonymes avec génération de clé d'onboarding
   */
  async createAnonymousUser(data: CreateAnonymousData): Promise<any> {
    const operationId = this.logger.startOperation('create_anonymous_user', { 
      guestEmail: data.guestEmail 
    });

    try {
      this.logger.info('Creating anonymous user', JSON.stringify({ 
        guestEmail: data.guestEmail,
        incentiveType: data.incentiveType 
      }));

      // Vérifier si l'email existe déjà dans les utilisateurs enregistrés
      const existingUser = await this.prisma.users.findUnique({
        where: { email: data.guestEmail }
      });

      if (existingUser) {
        throw new ConflictException('Un utilisateur enregistré existe déjà avec cet email');
      }

      // Générer un ID unique pour l'utilisateur anonyme
      const anonymousId = `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Générer une clé d'onboarding si un incentive est fourni
      let onboardingKey: string | undefined;
      if (data.incentiveType) {
        onboardingKey = await this.generateOnboardingKey({
          anonymousUserId: anonymousId,
          incentiveType: data.incentiveType,
          incentiveValue: data.incentiveValue || 0,
          description: data.incentiveDescription || '',
          expiresInHours: 168 // 7 jours par défaut
        });
      }

      // Créer l'objet utilisateur anonyme
      const anonymousUser = {
        id: anonymousId,
        guestName: data.guestName,
        guestEmail: data.guestEmail,
        guestPhone: data.guestPhone,
        onboardingKey,
        incentiveType: data.incentiveType,
        incentiveValue: data.incentiveValue,
        incentiveDescription: data.incentiveDescription,
        expiresAt: data.expiresAt || new Date(Date.now() + this.DEFAULT_EXPIRY * 1000),
        converted: false,
        convertedAt: null,
        convertedUserId: null,
        metadata: data.metadata || {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Stocker dans Redis avec expiration
      const cacheKey = `${this.CACHE_PREFIX}${anonymousId}`;
      await this.redis.setCache(cacheKey, anonymousUser, this.DEFAULT_EXPIRY);

      // Indexer par email pour les recherches
      const emailKey = `${this.CACHE_PREFIX}email:${data.guestEmail}`;
      await this.redis.setCache(emailKey, anonymousId, this.DEFAULT_EXPIRY);

      // Indexer par clé d'onboarding si elle existe
      if (onboardingKey) {
        const keyKey = `${this.ONBOARDING_PREFIX}${onboardingKey}`;
        await this.redis.setCache(keyKey, anonymousId, this.DEFAULT_EXPIRY);
      }

      // Logger l'événement business
      this.logger.logBusinessEvent('ANONYMOUS_USER_CREATED', {
        anonymousId,
        guestEmail: data.guestEmail,
        hasIncentive: !!data.incentiveType,
        incentiveType: data.incentiveType,
        onboardingKeyGenerated: !!onboardingKey
      });

      this.logger.endOperation('create_anonymous_user', operationId, true);
      return anonymousUser;

    } catch (error) {
      this.logger.logErrorEvent(error, 'AnonymousService.createAnonymousUser', JSON.stringify({
        guestEmail: data.guestEmail,
        incentiveType: data.incentiveType
      }));
      this.logger.endOperation('create_anonymous_user', operationId, false);
      throw error;
    }
  }

  /**
   * Trouve un utilisateur anonyme par email
   */
  async findByEmail(email: string): Promise<any | null> {
    try {
      const emailKey = `${this.CACHE_PREFIX}email:${email}`;
      const anonymousId = await this.redis.getCache<string>(emailKey);
      
      if (!anonymousId) {
        return null;
      }

      const cacheKey = `${this.CACHE_PREFIX}${anonymousId}`;
      return await this.redis.getCache(cacheKey);
    } catch (error) {
      this.logger.logErrorEvent(error, 'AnonymousService.findByEmail', JSON.stringify({ email }));
      return null;
    }
  }

  /**
   * Trouve un utilisateur anonyme par clé d'onboarding
   */
  async findByOnboardingKey(key: string): Promise<any | null> {
    try {
      const keyKey = `${this.ONBOARDING_PREFIX}${key}`;
      const anonymousId = await this.redis.getCache<string>(keyKey);
      
      if (!anonymousId) {
        return null;
      }

      const cacheKey = `${this.CACHE_PREFIX}${anonymousId}`;
      return await this.redis.getCache(cacheKey);
    } catch (error) {
      this.logger.logErrorEvent(error, 'AnonymousService.findByOnboardingKey', JSON.stringify({ key }));
      return null;
    }
  }

  /**
   * Convertit un utilisateur anonyme en utilisateur enregistré
   */
  async convertToRegistered(conversionData: ConversionData): Promise<ConversionResult> {
    const operationId = this.logger.startOperation('convert_to_registered', {
      onboardingKey: conversionData.onboardingKey,
      email: conversionData.userData.email
    });

    try {
      this.logger.info('Starting anonymous user conversion', JSON.stringify({
        onboardingKey: conversionData.onboardingKey,
        email: conversionData.userData.email
      }));

      // Valider la clé d'onboarding
      const validation = await this.validateOnboardingKey(conversionData.onboardingKey);
      if (!validation.isValid) {
        this.logger.endOperation('convert_to_registered', operationId, false);
        return {
          success: false,
          incentiveApplied: false,
          errors: validation.errors || ['Clé d\'onboarding invalide']
        };
      }

      const anonymousUser = validation.anonymousUser!;

      // Vérifier que l'email correspond
      if (conversionData.userData.email.toLowerCase() !== anonymousUser.guestEmail.toLowerCase()) {
        this.logger.endOperation('convert_to_registered', operationId, false);
        return {
          success: false,
          incentiveApplied: false,
          errors: ['L\'email doit correspondre à celui utilisé lors de l\'achat anonyme']
        };
      }

      // Vérifier que l'utilisateur n'existe pas déjà
      const existingUser = await this.prisma.users.findUnique({
        where: { email: conversionData.userData.email }
      });

      if (existingUser) {
        this.logger.endOperation('convert_to_registered', operationId, false);
        return {
          success: false,
          incentiveApplied: false,
          errors: ['Un utilisateur existe déjà avec cet email']
        };
      }

      // Hasher le mot de passe
      const hashedPassword = await bcrypt.hash(conversionData.userData.password, 12);

      // Créer l'utilisateur enregistré avec transaction
      const result = await this.prisma.transactionWithRetry(async (tx) => {
        // Créer l'utilisateur avec le password hashé et les bons types
        const newUser = await tx.users.create({
          data: {
            email: conversionData.userData.email,
            first_name: conversionData.userData.firstName,
            last_name: conversionData.userData.lastName,
            phone: conversionData.userData.phone,
            password: hashedPassword, // Champ requis
            is_active: true,
            email_verified: new Date(), // DateTime pour auto-vérification
            phone_verified: conversionData.userData.phone ? new Date() : null,
            metadata: {
              convertedFromAnonymous: true,
              anonymousId: anonymousUser.id,
              conversionDate: new Date(),
              originalPurchaseData: anonymousUser.metadata
            }
          }
        });

        // Créer le profil si des données sont fournies
        if (conversionData.profileData) {
          await tx.user_profiles.create({
            data: {
              user_id: newUser.id,
              date_of_birth: conversionData.profileData.dateOfBirth,
              //gender: conversionData.profileData.gender,
              city: conversionData.profileData.city,
              country: conversionData.profileData.country || 'TN',
              language: conversionData.profileData.language || 'fr',
            }
          });
        }

        // Migrer les commandes anonymes vers le nouvel utilisateur
        await tx.orders.updateMany({
          where: {
            user_id: null,
            guest_email: anonymousUser.guestEmail
          },
          data: {
            user_id: newUser.id
          }
        });

        // Migrer les abonnements anonymes
        // Recherche dans metadata JSON pour l'email anonyme
        await tx.subscriptions.updateMany({
          where: {
            user_id: null,
            metadata: {
              path: ['anonymousUser', 'guestEmail'],
              equals: anonymousUser.guestEmail
            }
          },
          data: {
            user_id: newUser.id,
            metadata: {
              ...({} as any), // Conserver les métadonnées existantes
              migrationInfo: {
                migratedAt: new Date(),
                migratedFromAnonymous: anonymousUser.id,
                conversionKey: conversionData.onboardingKey
              }
            }
          }
        });

        // Migrer les droits d'accès anonymes (user_id = null)
        // On utilise une sous-requête pour identifier les access_rights liés aux ordres de cet utilisateur anonyme
        const orderIds = await tx.orders.findMany({
          where: { user_id: newUser.id },
          select: { id: true }
        });

        if (orderIds.length > 0) {
          // Migrer les access_rights liés via order_items/tickets
          await tx.access_rights.updateMany({
            where: {
              user_id: null,
              OR: [
                // Access rights liés aux tickets de commandes de cet utilisateur
                {
                  ticket_id: {
                    in: await tx.tickets.findMany({
                      where: { user_id: newUser.id },
                      select: { id: true }
                    }).then(tickets => tickets.map(t => t.id))
                  }
                },
                // Access rights liés aux abonnements de cet utilisateur
                {
                  subscription_id: {
                    in: await tx.subscriptions.findMany({
                      where: { user_id: newUser.id },
                      select: { id: true }
                    }).then(subs => subs.map(s => s.id))
                  }
                }
              ]
            },
            data: {
              user_id: newUser.id
            }
          });
        }

        return newUser;
      });

      // Appliquer l'incentive si présent
      let incentiveApplied = false;
      let incentiveDetails = undefined;

      if (anonymousUser.incentiveType && anonymousUser.incentiveValue) {
        try {
          await this.applyIncentive(
            result.id,
            anonymousUser.incentiveType,
            anonymousUser.incentiveValue
          );
          incentiveApplied = true;
          incentiveDetails = {
            type: anonymousUser.incentiveType,
            value: anonymousUser.incentiveValue,
            description: anonymousUser.incentiveDescription || ''
          };
        } catch (error) {
          this.logger.logErrorEvent(error, 'AnonymousService.applyIncentive', JSON.stringify({
            userId: result.id,
            incentiveType: anonymousUser.incentiveType,
            incentiveValue: anonymousUser.incentiveValue
          }));
          // Continue sans incentive si l'application échoue
        }
      }

      // Marquer l'utilisateur anonyme comme converti dans Redis
      anonymousUser.converted = true;
      anonymousUser.convertedAt = new Date();
      anonymousUser.convertedUserId = result.id;
      
      const cacheKey = `${this.CACHE_PREFIX}${anonymousUser.id}`;
      await this.redis.setCache(cacheKey, anonymousUser, 3600); // Garder 1h pour audit

      // Envoyer email de bienvenue (asynchrone)
      try {
        await this.email.sendWelcomeEmail(result.email, result.first_name);
      } catch (emailError) {
        this.logger.logErrorEvent(emailError, 'AnonymousService.sendWelcomeEmail', JSON.stringify({
          userId: result.id,
          email: result.email
        }));
        // Continue même si l'email échoue
      }

      // Logger l'événement business
      this.logger.logBusinessEvent('ANONYMOUS_USER_CONVERTED', {
        anonymousId: anonymousUser.id,
        newUserId: result.id,
        email: result.email,
        incentiveApplied,
        incentiveType: anonymousUser.incentiveType,
        incentiveValue: anonymousUser.incentiveValue
      });

      this.logger.endOperation('convert_to_registered', operationId, true);

      return {
        success: true,
        user: result,
        incentiveApplied,
        incentiveDetails,
        migrationSummary: {
          ticketsMigrated: 0, // TODO: Compter réellement les tickets migrés
          subscriptionsMigrated: 0, // TODO: Compter réellement les abonnements migrés
          ordersMigrated: 0, // TODO: Compter réellement les commandes migrées
        }
      };

    } catch (error) {
      this.logger.logErrorEvent(error, 'AnonymousService.convertToRegistered', JSON.stringify({
        onboardingKey: conversionData.onboardingKey,
        email: conversionData.userData.email
      }));
      this.logger.endOperation('convert_to_registered', operationId, false);

      return {
        success: false,
        incentiveApplied: false,
        errors: ['Erreur lors de la conversion. Veuillez réessayer.']
      };
    }
  }

  /**
   * Valide une clé d'onboarding
   */
  async validateOnboardingKey(key: string): Promise<OnboardingKeyValidation> {
    try {
      const anonymousUser = await this.findByOnboardingKey(key);
      
      if (!anonymousUser) {
        return {
          isValid: false,
          isExpired: false,
          isUsed: false,
          errors: ['Clé d\'onboarding introuvable']
        };
      }

      if (anonymousUser.converted) {
        return {
          isValid: false,
          isExpired: false,
          isUsed: true,
          anonymousUser,
          errors: ['Cette clé a déjà été utilisée']
        };
      }

      const isExpired = anonymousUser.expiresAt && new Date(anonymousUser.expiresAt) < new Date();
      if (isExpired) {
        return {
          isValid: false,
          isExpired: true,
          isUsed: false,
          anonymousUser,
          errors: ['Cette clé a expiré']
        };
      }

      return {
        isValid: true,
        isExpired: false,
        isUsed: false,
        anonymousUser,
        incentiveDetails: anonymousUser.incentiveType ? {
          type: anonymousUser.incentiveType,
          value: anonymousUser.incentiveValue || 0,
          description: anonymousUser.incentiveDescription || ''
        } : undefined
      };

    } catch (error) {
      this.logger.logErrorEvent(error, 'AnonymousService.validateOnboardingKey', JSON.stringify({ key }));
      return {
        isValid: false,
        isExpired: false,
        isUsed: false,
        errors: ['Erreur lors de la validation']
      };
    }
  }

  /**
   * Génère une clé d'onboarding unique
   */
  async generateOnboardingKey(data: OnboardingKeyData): Promise<string> {
    try {
      const timestamp = Date.now().toString(36);
      const random = Math.random().toString(36).substr(2, 8);
      const typePrefix = data.incentiveType ? data.incentiveType.substring(0, 3) : 'GEN';
      
      const key = `ONB_${typePrefix}_${timestamp}_${random}`.toUpperCase();
      
      this.logger.info('Generated onboarding key', JSON.stringify({
        anonymousUserId: data.anonymousUserId,
        key,
        incentiveType: data.incentiveType,
        expiresInHours: data.expiresInHours
      }));

      return key;

    } catch (error) {
      this.logger.logErrorEvent(error, 'AnonymousService.generateOnboardingKey', JSON.stringify(data));
      throw new BadRequestException('Erreur lors de la génération de la clé d\'onboarding');
    }
  }

  /**
   * Applique un incentive à un utilisateur enregistré
   */
  async applyIncentive(userId: string, incentiveType: IncentiveType, value: number): Promise<void> {
    try {
      this.logger.info('Applying incentive to user', JSON.stringify({
        userId,
        incentiveType,
        value
      }));

      // TODO: Implémenter selon le type d'incentive
      switch (incentiveType) {
        case IncentiveType.BONUS_POINTS:
          // Ajouter des points de fidélité
          this.logger.info('Would apply bonus points', JSON.stringify({ userId, points: value }));
          break;
        case IncentiveType.DISCOUNT_NEXT:
          // Créer un coupon de réduction
          this.logger.info('Would create discount coupon', JSON.stringify({ userId, discount: value }));
          break;
        case IncentiveType.FREE_UPGRADE:
          // Créer un voucher d'upgrade
          this.logger.info('Would create upgrade voucher', JSON.stringify({ userId }));
          break;
        case IncentiveType.EXCLUSIVE_ACCESS:
          // Ajouter des permissions spéciales
          this.logger.info('Would grant exclusive access', JSON.stringify({ userId }));
          break;
        case IncentiveType.GIFT_VOUCHER:
          // Créer un bon d'achat
          this.logger.info('Would create gift voucher', JSON.stringify({ userId, amount: value }));
          break;
        default:
          this.logger.warn('Unknown incentive type', JSON.stringify({ incentiveType }));
      }

      this.logger.logBusinessEvent('INCENTIVE_APPLIED', {
        userId,
        incentiveType,
        value,
        appliedAt: new Date()
      });

    } catch (error) {
      this.logger.logErrorEvent(error, 'AnonymousService.applyIncentive', JSON.stringify({
        userId,
        incentiveType,
        value
      }));
      throw error;
    }
  }

  /**
   * Récupère les statistiques de conversion
   */
  async getConversionStats(period?: DateRange): Promise<ConversionStats> {
    try {
      // TODO: Implémenter les vraies statistiques depuis la base de données
      // Pour l'instant, retourner des données simulées
      
      return {
        totalAnonymous: 0,
        totalConverted: 0,
        conversionRate: 0,
        averageConversionTime: 0,
        conversionsByIncentive: [],
        conversionTrend: [],
        topIncentives: []
      };

    } catch (error) {
      this.logger.logErrorEvent(error, 'AnonymousService.getConversionStats', JSON.stringify({ period }));
      throw error;
    }
  }

  /**
   * Récupère les statistiques générales des utilisateurs anonymes
   */
  async getAnonymousStats(): Promise<AnonymousStats> {
    try {
      // TODO: Implémenter les vraies statistiques depuis Redis et la base de données
      
      return {
        totalAnonymous: 0,
        activeAnonymous: 0,
        expiredAnonymous: 0,
        convertedAnonymous: 0,
        pendingConversion: 0,
        averageTimeToConversion: 0,
        mostEffectiveIncentive: {
          type: IncentiveType.BONUS_POINTS,
          conversionRate: 0
        }
      };

    } catch (error) {
      this.logger.logErrorEvent(error, 'AnonymousService.getAnonymousStats', JSON.stringify({}));
      throw error;
    }
  }

  /**
   * Mappe les valeurs de genre aux valeurs enum du schema Prisma
   */
  private mapGenderToEnum(gender?: 'M' | 'F' | 'OTHER' | 'PREFER_NOT_TO_SAY'): 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY' | undefined {
    if (!gender) return undefined;
    
    switch (gender) {
      case 'M':
        return 'MALE';
      case 'F':
        return 'FEMALE';
      case 'OTHER':
        return 'OTHER';
      case 'PREFER_NOT_TO_SAY':
        return 'PREFER_NOT_TO_SAY';
      default:
        return undefined;
    }
  }
}