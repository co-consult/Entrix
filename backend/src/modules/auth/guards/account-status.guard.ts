// src/modules/auth/guards/account-status.guard.ts

import { 
  Injectable, 
  CanActivate, 
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException 
} from '@nestjs/common';
import { LoggerService } from '../../../shared/logger/logger.service';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { EmailNotVerifiedException, AccountLockedException } from '../exceptions/auth.exceptions';

/**
 * Account Status Guard Entrix V3.0
 * Vérifie le statut du compte utilisateur
 */

@Injectable()
export class AccountStatusGuard implements CanActivate {
  private readonly logger: LoggerService;

  constructor(
    private readonly prisma: PrismaService,
    loggerService: LoggerService,
  ) {
    this.logger = loggerService.createChildLogger('AccountStatusGuard');
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return true; // Laisser JwtAuthGuard gérer l'absence d'utilisateur
    }

    const operationId = this.logger.startOperation('accountStatusGuard', {
      userId: user.id,
    });

    try {
      // Récupérer statut complet utilisateur depuis DB
      const userStatus = await this.getUserStatus(user.id);
      
      if (!userStatus) {
        this.logger.warn('User not found in database', JSON.stringify({ userId: user.id }));
        throw new UnauthorizedException('Utilisateur introuvable');
      }

      // Vérifier si compte actif
      if (!userStatus.is_active) {
        this.logger.warn('Inactive account access attempt', JSON.stringify({ userId: user.id }));
        
        this.logger.logBusinessEvent('INACTIVE_ACCOUNT_ACCESS', {
          userId: user.id,
          email: userStatus.email,
        }, user.id);

        throw new ForbiddenException('Compte désactivé');
      }

      // Vérifier vérification email si requise pour cette route
      const requireEmailVerification = this.shouldRequireEmailVerification(context);
      if (requireEmailVerification && !userStatus.email_verified) {
        this.logger.warn('Unverified email access attempt', JSON.stringify({ 
          userId: user.id,
          email: userStatus.email 
        }));

        this.logger.logBusinessEvent('UNVERIFIED_EMAIL_ACCESS', {
          userId: user.id,
          email: userStatus.email,
        }, user.id);

        throw new EmailNotVerifiedException();
      }

      // Vérifier si compte verrouillé (temporairement)
      const isLocked = await this.isAccountLocked(user.id);
      if (isLocked.locked) {
        this.logger.warn('Locked account access attempt', JSON.stringify({ userId: user.id }));

        throw new AccountLockedException(isLocked.unlockAt);
      }

      this.logger.endOperation(operationId, 'success', true);
      return true;

    } catch (error) {
      this.logger.endOperation(operationId, 'error', error.message);
      throw error;
    }
  }

  /**
   * Récupère statut utilisateur depuis DB
   */
  private async getUserStatus(userId: string): Promise<any> {
    try {
      const user = await this.prisma.users.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          is_active: true,
          email_verified: true,
          metadata: true,
        },
      });

      return user;
    } catch (error) {
      this.logger.error('Error fetching user status', error.stack, JSON.stringify({ userId }));
      return null;
    }
  }

  /**
   * Détermine si vérification email requise
   */
  private shouldRequireEmailVerification(context: ExecutionContext): boolean {
    // Logique simplifiée - dans un vrai système, utiliser des décorateurs
    const request = context.switchToHttp().getRequest();
    const sensitiveRoutes = ['/auth/mfa', '/account', '/payments'];
    
    return sensitiveRoutes.some(route => request.url.includes(route));
  }

  /**
   * Vérifie si compte temporairement verrouillé
   */
  private async isAccountLocked(userId: string): Promise<{ locked: boolean; unlockAt?: Date }> {
    try {
      // Logique simplifiée - vérifier metadata utilisateur
      const user = await this.prisma.users.findUnique({
        where: { id: userId },
        select: {
          metadata: true,
        },
      });

      const metadata = user?.metadata as any;
      const lockUntil = metadata?.lockUntil ? new Date(metadata.lockUntil) : null;
      
      if (lockUntil && lockUntil > new Date()) {
        return { locked: true, unlockAt: lockUntil };
      }

      return { locked: false };
    } catch (error) {
      this.logger.error('Error checking account lock status', error.stack);
      return { locked: false };
    }
  }
}