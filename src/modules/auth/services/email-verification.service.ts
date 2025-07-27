// src/modules/auth/services/email-verification.service.ts

import { Injectable } from '@nestjs/common';
import { LoggerService } from '../../../shared/logger/logger.service';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { RedisService } from '../../../shared/redis/redis.service';
import { EmailService } from '../../../shared/email/email.service';
import { CryptoUtil } from '../utils/crypto.util';
import { mfa_method } from '@prisma/client';
import * as bcrypt from 'bcrypt';

export interface EmailVerificationResult {
  success: boolean;
  verified: boolean;
  message: string;
  userId?: string;
}

export interface EmailVerificationToken {
  id: string;
  token: string; // Token en clair (pour l'URL)
  userId: string;
  email: string;
  expiresAt: Date;
}

/**
 * Service de vérification d'email avec stockage DB + cache Redis optionnel
 * Utilise la table mfa_tokens avec method=EMAIL
 */
@Injectable()
export class EmailVerificationService {
  private readonly logger: LoggerService;
  private readonly TOKEN_EXPIRY = 24 * 60 * 60; // 24 heures en secondes
  private readonly CACHE_PREFIX = 'email_verification:';
  private readonly USE_REDIS_CACHE = true; // Configurable

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly email: EmailService,
    loggerService: LoggerService,
  ) {
    this.logger = loggerService.createChildLogger('EmailVerificationService');
  }

  /**
   * Génère et stocke un token de vérification d'email
   * Stockage principal : base de données
   * Cache optionnel : Redis
   */
  async generateVerificationToken(userId: string, email: string): Promise<EmailVerificationToken> {
    const operationId = this.logger.startOperation('generateVerificationToken', {
      userId,
      email,
    });

    try {
      // 1. Générer token sécurisé
      const token = CryptoUtil.generateSecureToken(32);
      const tokenHash = await bcrypt.hash(token, 10); // Hash pour la DB

      // 2. Calculer expiration
      const expiresAt = new Date(Date.now() + this.TOKEN_EXPIRY * 1000);

      // 3. Supprimer les anciens tokens de vérification pour cet utilisateur
      await this.cleanupOldTokens(userId);

      // 4. Stocker en base de données (stockage principal)
      const dbToken = await this.prisma.mfa_tokens.create({
        data: {
          user_id: userId,
          method: mfa_method.EMAIL,
          token_hash: tokenHash,
          expires_at: expiresAt,
          is_used: false,
          metadata: {
            email,
            tokenType: 'EMAIL_VERIFICATION',
            purpose: 'account_verification',
          },
        },
      });

      // 5. Stocker en cache Redis (optionnel pour les performances)
      if (this.USE_REDIS_CACHE) {
        try {
          const cacheData = {
            id: dbToken.id,
            userId,
            email,
            expiresAt: expiresAt.toISOString(),
          };
          
          await this.redis.setCache(
            `${this.CACHE_PREFIX}${token}`,
            cacheData,
            this.TOKEN_EXPIRY
          );
        } catch (cacheError) {
          // Cache error shouldn't fail the operation
          this.logger.warn('Failed to cache email verification token', JSON.stringify({
            userId,
            error: cacheError.message,
          }));
        }
      }

      // 6. Logger génération
      this.logger.logBusinessEvent('EMAIL_VERIFICATION_TOKEN_GENERATED', {
        userId,
        email,
        tokenId: dbToken.id,
        expiresAt: expiresAt.toISOString(),
      }, userId);

      this.logger.endOperation('generateVerificationToken', operationId, true);

      return {
        id: dbToken.id,
        token, // Token en clair pour l'URL
        userId,
        email,
        expiresAt,
      };

    } catch (error) {
      this.logger.endOperation('generateVerificationToken', operationId, false, undefined, {
        error: error.message,
      });
      
      this.logger.error(
        'Failed to generate email verification token',
        error.stack,
        'EmailVerificationService.generateVerificationToken',
        JSON.stringify({ userId, email })
      );
      throw error;
    }
  }

  /**
   * Vérifie un token de vérification d'email
   * Recherche : Cache Redis d'abord, puis base de données
   */
  async verifyEmailToken(token: string): Promise<EmailVerificationResult> {
    const operationId = this.logger.startOperation('verifyEmailToken', {
      tokenLength: token?.length,
    });

    try {
      this.logger.info('Email verification attempt started', JSON.stringify({
        tokenPrefix: token?.substring(0, 8),
      }));

      // 1. Valider le format du token
      if (!token || typeof token !== 'string' || token.length < 10) {
        this.logger.warn('Invalid token format for email verification');
        this.logger.endOperation('verifyEmailToken', operationId, false, undefined, {
          reason: 'invalid_token_format',
        });
        
        return {
          success: false,
          verified: false,
          message: 'Token de vérification invalide',
        };
      }

      // 2. Essayer de récupérer depuis le cache Redis d'abord
      let verificationData = null;
      if (this.USE_REDIS_CACHE) {
        try {
          verificationData = await this.redis.getCache<{
            id: string;
            userId: string;
            email: string;
            expiresAt: string;
          }>(`${this.CACHE_PREFIX}${token}`);
        } catch (cacheError) {
          this.logger.warn('Redis cache error, falling back to database', JSON.stringify({
            error: cacheError.message,
          }));
        }
      }

      // 3. Si pas en cache, rechercher en base de données
      if (!verificationData) {
        const dbTokens = await this.prisma.mfa_tokens.findMany({
          where: {
            method: mfa_method.EMAIL,
            is_used: false,
            expires_at: { gt: new Date() },
          },
          include: {
            users: {
              select: {
                id: true,
                email: true,
                email_verified: true,
                is_active: true,
                first_name: true,
                last_name: true,
              }
            }
          }
        });

        // Vérifier le hash du token contre tous les tokens actifs
        let matchedToken = null;
        for (const dbToken of dbTokens) {
          const isMatch = await bcrypt.compare(token, dbToken.token_hash);
          if (isMatch) {
            matchedToken = dbToken;
            break;
          }
        }

        if (!matchedToken) {
          this.logger.warn('Email verification token not found or expired', JSON.stringify({
            tokenPrefix: token.substring(0, 8),
          }));
          this.logger.endOperation('verifyEmailToken', operationId, false, undefined, {
            reason: 'token_not_found',
          });
          
          return {
            success: false,
            verified: false,
            message: 'Token de vérification expiré ou invalide',
          };
        }

        // Transformer pour format uniforme
        verificationData = {
          id: matchedToken.id,
          userId: matchedToken.user_id,
          email: matchedToken.metadata?.email || matchedToken.users.email,
          expiresAt: matchedToken.expires_at.toISOString(),
        };
      }

      // 4. Vérifier l'expiration
      const expiresAt = new Date(verificationData.expiresAt);
      const now = new Date();
      
      if (now > expiresAt) {
        this.logger.warn('Email verification token expired', JSON.stringify({
          userId: verificationData.userId,
          email: verificationData.email,
          expiresAt: verificationData.expiresAt,
        }));
        
        // Nettoyer le token expiré
        await this.markTokenAsUsed(verificationData.id, token);
        
        this.logger.endOperation('verifyEmailToken', operationId, false, undefined, {
          reason: 'token_expired',
        });
        
        return {
          success: false,
          verified: false,
          message: 'Token de vérification expiré',
        };
      }

      // 5. Vérifier que l'utilisateur existe toujours
      const user = await this.prisma.users.findUnique({
        where: { id: verificationData.userId },
        select: {
          id: true,
          email: true,
          email_verified: true,
          is_active: true,
          first_name: true,
          last_name: true,
        }
      });

      if (!user) {
        this.logger.warn('User not found for email verification', JSON.stringify({
          userId: verificationData.userId,
          email: verificationData.email,
        }));
        
        await this.markTokenAsUsed(verificationData.id, token);
        
        this.logger.endOperation('verifyEmailToken', operationId, false, undefined, {
          reason: 'user_not_found',
        });
        
        return {
          success: false,
          verified: false,
          message: 'Utilisateur introuvable',
        };
      }

      // 6. Vérifier que l'email correspond
      if (user.email !== verificationData.email) {
        this.logger.warn('Email mismatch in verification token', JSON.stringify({
          userId: user.id,
          userEmail: user.email,
          tokenEmail: verificationData.email,
        }));
        
        await this.markTokenAsUsed(verificationData.id, token);
        
        this.logger.endOperation('verifyEmailToken', operationId, false, undefined, {
          reason: 'email_mismatch',
        });
        
        return {
          success: false,
          verified: false,
          message: 'Token de vérification invalide',
        };
      }

      // 7. Vérifier si l'email n'est pas déjà vérifié
      if (user.email_verified) {
        this.logger.info('Email already verified', JSON.stringify({
          userId: user.id,
          email: user.email,
          verifiedAt: user.email_verified,
        }));
        
        await this.markTokenAsUsed(verificationData.id, token);
        
        this.logger.endOperation('verifyEmailToken', operationId, true, undefined, {
          reason: 'already_verified',
        });
        
        return {
          success: true,
          verified: true,
          message: 'Email déjà vérifié',
          userId: user.id,
        };
      }

      // 8. ✅ METTRE À JOUR email_verified EN BASE
      const updatedUser = await this.prisma.users.update({
        where: { id: user.id },
        data: {
          email_verified: true, // ✅ Date courante
        },
        select: {
          id: true,
          email: true,
          email_verified: true,
          first_name: true,
          last_name: true,
        }
      });

      // 9. Marquer le token comme utilisé
      await this.markTokenAsUsed(verificationData.id, token);

      // 10. Logger l'événement de succès
      this.logger.logBusinessEvent('EMAIL_VERIFIED', {
        userId: user.id,
        email: user.email,
        verifiedAt: updatedUser.email_verified,
        firstName: user.first_name,
        lastName: user.last_name,
      }, user.id);

      // 11. Envoyer un email de confirmation (optionnel)
      try {
        await this.email.sendEmail({
          to: user.email,
          subject: 'Email vérifié avec succès ! ✅',
          template: 'email-verified',
          context: {
            firstName: user.first_name,
            verifiedAt: updatedUser.email_verified,
          },
        });
      } catch (emailError) {
        this.logger.warn('Failed to send email verification confirmation', JSON.stringify({
          userId: user.id,
          email: user.email,
          error: emailError.message,
        }));
      }

      this.logger.endOperation('verifyEmailToken', operationId, true);

      return {
        success: true,
        verified: true,
        message: 'Email vérifié avec succès',
        userId: user.id,
      };

    } catch (error) {
      this.logger.endOperation('verifyEmailToken', operationId, false, undefined, {
        error: error.message,
      });
      
      this.logger.error(
        'Email verification failed with unexpected error',
        error.stack,
        'EmailVerificationService.verifyEmailToken',
        JSON.stringify({
          tokenPrefix: token?.substring(0, 8),
          error: error.message,
        })
      );

      return {
        success: false,
        verified: false,
        message: 'Erreur lors de la vérification de l\'email',
      };
    }
  }

  /**
   * Marque un token comme utilisé et nettoie les caches
   */
  private async markTokenAsUsed(tokenId: string, token: string): Promise<void> {
    try {
      // Marquer en base de données
      await this.prisma.mfa_tokens.update({
        where: { id: tokenId },
        data: {
          is_used: true,
          used_at: new Date(),
        },
      });

      // Supprimer du cache Redis
      if (this.USE_REDIS_CACHE) {
        await this.redis.delCache(`${this.CACHE_PREFIX}${token}`);
      }
    } catch (error) {
      this.logger.error(
        'Failed to mark token as used',
        error.stack,
        'EmailVerificationService.markTokenAsUsed',
        JSON.stringify({ tokenId, tokenPrefix: token?.substring(0, 8) })
      );
    }
  }

  /**
   * Nettoie les anciens tokens pour un utilisateur
   */
  private async cleanupOldTokens(userId: string): Promise<void> {
    try {
      await this.prisma.mfa_tokens.updateMany({
        where: {
          user_id: userId,
          method: mfa_method.EMAIL,
          is_used: false,
          metadata: {
            path: ['tokenType'],
            equals: 'EMAIL_VERIFICATION',
          },
        },
        data: {
          is_used: true,
          used_at: new Date(),
        },
      });
    } catch (error) {
      this.logger.warn('Failed to cleanup old verification tokens', JSON.stringify({
        userId,
        error: error.message,
      }));
    }
  }

  /**
   * Obtient les statistiques des tokens de vérification
   */
  async getVerificationStats(): Promise<{
    totalTokens: number;
    activeTokens: number;
    expiredTokens: number;
    usedTokens: number;
  }> {
    const [totalTokens, activeTokens, expiredTokens, usedTokens] = await Promise.all([
      this.prisma.mfa_tokens.count({
        where: {
          method: mfa_method.EMAIL,
          metadata: {
            path: ['tokenType'],
            equals: 'EMAIL_VERIFICATION',
          },
        },
      }),
      this.prisma.mfa_tokens.count({
        where: {
          method: mfa_method.EMAIL,
          is_used: false,
          expires_at: { gt: new Date() },
          metadata: {
            path: ['tokenType'],
            equals: 'EMAIL_VERIFICATION',
          },
        },
      }),
      this.prisma.mfa_tokens.count({
        where: {
          method: mfa_method.EMAIL,
          expires_at: { lt: new Date() },
          metadata: {
            path: ['tokenType'],
            equals: 'EMAIL_VERIFICATION',
          },
        },
      }),
      this.prisma.mfa_tokens.count({
        where: {
          method: mfa_method.EMAIL,
          is_used: true,
          metadata: {
            path: ['tokenType'],
            equals: 'EMAIL_VERIFICATION',
          },
        },
      }),
    ]);

    return {
      totalTokens,
      activeTokens,
      expiredTokens,
      usedTokens,
    };
  }
}