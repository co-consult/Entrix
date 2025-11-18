// src/modules/auth/services/token-cleanup.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { mfa_method } from '@prisma/client';

@Injectable()
export class TokenCleanupService {
  private readonly logger = new Logger(TokenCleanupService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Nettoie automatiquement les tokens expirés toutes les heures
   */
  @Cron(CronExpression.EVERY_HOUR)
  async cleanupExpiredTokens(): Promise<void> {
    try {
      this.logger.log('Starting automatic token cleanup...');
      
      const result = await this.prisma.mfa_tokens.deleteMany({
        where: {
          method: mfa_method.EMAIL,
          expires_at: {
            lt: new Date()
          }
        }
      });

      if (result.count > 0) {
        this.logger.log(`✅ Cleaned up ${result.count} expired email tokens`);
      } else {
        this.logger.log('No expired tokens to clean up');
      }
    } catch (error) {
      this.logger.error('❌ Failed to cleanup expired tokens:', error);
    }
  }

  /**
   * Nettoie les tokens utilisés depuis plus de X jours
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async cleanupOldUsedTokens(): Promise<void> {
    try {
      this.logger.log('Starting cleanup of old used tokens...');
      
      // Nettoyer les tokens utilisés depuis plus de 30 jours
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const result = await this.prisma.mfa_tokens.deleteMany({
        where: {
          method: mfa_method.EMAIL,
          is_used: true,
          used_at: {
            lt: thirtyDaysAgo
          }
        }
      });

      if (result.count > 0) {
        this.logger.log(`✅ Cleaned up ${result.count} old used tokens`);
      } else {
        this.logger.log('No old used tokens to clean up');
      }
    } catch (error) {
      this.logger.error('❌ Failed to cleanup old used tokens:', error);
    }
  }

  /**
   * Nettoie les tokens non utilisés depuis plus de X jours (sécurité)
   */
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async cleanupAbandonedTokens(): Promise<void> {
    try {
      this.logger.log('Starting cleanup of abandoned tokens...');
      
      // Nettoyer les tokens non utilisés créés il y a plus de 7 jours
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const result = await this.prisma.mfa_tokens.deleteMany({
        where: {
          method: mfa_method.EMAIL,
          is_used: false,
          created_at: {
            lt: sevenDaysAgo
          }
        }
      });

      if (result.count > 0) {
        this.logger.log(`✅ Cleaned up ${result.count} abandoned tokens`);
      } else {
        this.logger.log('No abandoned tokens to clean up');
      }
    } catch (error) {
      this.logger.error('❌ Failed to cleanup abandoned tokens:', error);
    }
  }

  /**
   * Obtient les statistiques de nettoyage
   */
  async getCleanupStats(): Promise<{
    totalTokens: number;
    activeTokens: number;
    expiredTokens: number;
    usedTokens: number;
    oldestToken: Date | null;
    newestToken: Date | null;
  }> {
    const [
      totalTokens,
      activeTokens,
      expiredTokens,
      usedTokens,
      oldestToken,
      newestToken
    ] = await Promise.all([
      this.prisma.mfa_tokens.count({
        where: { method: mfa_method.EMAIL }
      }),
      this.prisma.mfa_tokens.count({
        where: {
          method: mfa_method.EMAIL,
          is_used: false,
          expires_at: { gt: new Date() }
        }
      }),
      this.prisma.mfa_tokens.count({
        where: {
          method: mfa_method.EMAIL,
          expires_at: { lt: new Date() }
        }
      }),
      this.prisma.mfa_tokens.count({
        where: {
          method: mfa_method.EMAIL,
          is_used: true
        }
      }),
      this.prisma.mfa_tokens.findFirst({
        where: { method: mfa_method.EMAIL },
        orderBy: { created_at: 'asc' },
        select: { created_at: true }
      }),
      this.prisma.mfa_tokens.findFirst({
        where: { method: mfa_method.EMAIL },
        orderBy: { created_at: 'desc' },
        select: { created_at: true }
      })
    ]);

    return {
      totalTokens,
      activeTokens,
      expiredTokens,
      usedTokens,
      oldestToken: oldestToken?.created_at || null,
      newestToken: newestToken?.created_at || null
    };
  }

  /**
   * Force le nettoyage manuel (pour les tests ou maintenance)
   */
  async forceCleanupAll(): Promise<{
    expiredCleaned: number;
    oldUsedCleaned: number;
    abandonedCleaned: number;
    totalCleaned: number;
  }> {
    this.logger.log('🧹 Starting manual force cleanup...');

    const [expired, oldUsed, abandoned] = await Promise.all([
      // Tokens expirés
      this.prisma.mfa_tokens.deleteMany({
        where: {
          method: mfa_method.EMAIL,
          expires_at: { lt: new Date() }
        }
      }),
      // Tokens utilisés depuis plus de 30 jours
      this.prisma.mfa_tokens.deleteMany({
        where: {
          method: mfa_method.EMAIL,
          is_used: true,
          used_at: {
            lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        }
      }),
      // Tokens abandonnés depuis plus de 7 jours
      this.prisma.mfa_tokens.deleteMany({
        where: {
          method: mfa_method.EMAIL,
          is_used: false,
          created_at: {
            lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      })
    ]);

    const totalCleaned = expired.count + oldUsed.count + abandoned.count;

    this.logger.log(`🎯 Force cleanup completed: ${totalCleaned} tokens cleaned`);
    this.logger.log(`   - Expired: ${expired.count}`);
    this.logger.log(`   - Old used: ${oldUsed.count}`);
    this.logger.log(`   - Abandoned: ${abandoned.count}`);

    return {
      expiredCleaned: expired.count,
      oldUsedCleaned: oldUsed.count,
      abandonedCleaned: abandoned.count,
      totalCleaned
    };
  }
}