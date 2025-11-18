// src/modules/auth/strategies/jwt.strategy.ts

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '../../../shared/logger/logger.service';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { RedisService } from '../../../shared/redis/redis.service';
import { JwtPayload } from '../interfaces/auth.interfaces';
import { IUserProfile } from '../interfaces/user.interface';
import { SessionExpiredException, InvalidRefreshTokenException } from '../exceptions/session.exceptions';
import { AUTH_CONSTANTS } from '../constants/auth.constants';

/**
 * JWT Strategy pour Access Tokens Entrix V3.0
 * Respecte schema.prisma et api_specs_auth_session.md
 */

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  private readonly logger: LoggerService;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    loggerService: LoggerService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
      issuer: 'entrix-v3',
      audience: 'entrix-users',
    });

    this.logger = loggerService.createChildLogger('JwtStrategy');
  }

  /**
   * Validation du payload JWT et récupération utilisateur
   * Respecte schema.prisma users exact
   */
  async validate(payload: JwtPayload): Promise<IUserProfile> {
    const operationId = this.logger.startOperation('validateJwtToken', { 
      userId: payload.sub,
      sessionId: payload.sessionId 
    });

    try {
      // 1. Vérifier structure payload
      if (!this.isValidPayload(payload)) {
        this.logger.warn('Invalid JWT payload structure', JSON.stringify({ payload }));
        throw new UnauthorizedException('Token payload invalide');
      }

      // 2. Vérifier si token est blacklisté
      const isBlacklisted = await this.isTokenBlacklisted(payload);
      if (isBlacklisted) {
        this.logger.warn('Blacklisted token used', JSON.stringify({ 
          userId: payload.sub,
          sessionId: payload.sessionId 
        }));
        throw new UnauthorizedException('Token révoqué');
      }

      // 3. Vérifier session active selon schema.prisma user_sessions
      const session = await this.validateSession(payload.sessionId);
      if (!session) {
        this.logger.warn('Session not found or expired', JSON.stringify({ 
          sessionId: payload.sessionId 
        }));
        throw new SessionExpiredException();
      }

      // 4. Récupérer utilisateur selon schema.prisma users exact
      const user = await this.getUserFromDatabase(payload.sub);
      if (!user) {
        this.logger.warn('User not found', JSON.stringify({ userId: payload.sub }));
        throw new UnauthorizedException('Utilisateur introuvable');
      }

      // 5. Vérifier statut utilisateur
      if (!user.is_active) {
        this.logger.warn('Inactive user attempted access', JSON.stringify({ userId: payload.sub }));
        throw new UnauthorizedException('Compte désactivé');
      }

      // 6. Mettre à jour last_activity de la session
      await this.updateSessionActivity(payload.sessionId);

      // 7. Logger événement d'authentification réussie
      this.logger.logBusinessEvent('JWT_VALIDATION_SUCCESS', {
        userId: user.id,
        sessionId: payload.sessionId,
        deviceFingerprint: payload.deviceFingerprint,
      }, user.id);

      this.logger.endOperation(operationId, 'success', true);

      // 8. Retourner profil utilisateur normalisé
      return this.normalizeUserProfile(user, payload);

    } catch (error) {
      this.logger.endOperation(operationId, 'error', error.message);
      
      // Logger échec validation JWT
      this.logger.logBusinessEvent('JWT_VALIDATION_FAILED', {
        userId: payload.sub,
        sessionId: payload.sessionId,
        error: error.message,
      }, payload.sub);

      throw error;
    }
  }

  /**
   * Valide structure du payload JWT
   */
  private isValidPayload(payload: any): payload is JwtPayload {
    return payload &&
           typeof payload.sub === 'string' &&
           typeof payload.email === 'string' &&
           typeof payload.sessionId === 'string' &&
           typeof payload.iat === 'number' &&
           typeof payload.exp === 'number' &&
           payload.aud === 'entrix-users' &&
           payload.iss === 'entrix-v3';
  }

  /**
   * Vérifie si token est blacklisté dans Redis
   */
  private async isTokenBlacklisted(payload: JwtPayload): Promise<boolean> {
    try {
      const blacklistKey = `blacklist:token:${payload.sessionId}:${payload.iat}`;
      const isBlacklisted = await this.redis.exists(blacklistKey);
      return isBlacklisted;
    } catch (error) {
      this.logger.error('Error checking token blacklist', error.stack);
      return false; // En cas d'erreur Redis, on laisse passer
    }
  }

  /**
   * Valide session active selon schema.prisma user_sessions
   */
  private async validateSession(sessionId: string): Promise<boolean> {
    try {
      const session = await this.prisma.user_sessions.findFirst({
        where: {
          id: sessionId,
          is_active: true,
          expires_at: {
            gt: new Date(), // Session non expirée
          },
        },
        select: {
          id: true,
          expires_at: true,
          is_active: true,
        },
      });

      return !!session;
    } catch (error) {
      this.logger.error('Error validating session', error.stack, JSON.stringify({ sessionId }));
      return false;
    }
  }

  /**
   * Récupère utilisateur depuis DB selon schema.prisma exact
   */
  private async getUserFromDatabase(userId: string): Promise<any> {
    try {
      const user = await this.prisma.users.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          first_name: true,
          last_name: true,
          phone: true,
          avatar: true,
          is_active: true,
          email_verified: true,
          phone_verified: true,
          last_login: true,
          metadata: true,
          created_at: true,
          updated_at: true,
          // Relations pour permissions/roles si nécessaire
        },
      });

      return user;
    } catch (error) {
      this.logger.error('Error fetching user from database', error.stack, JSON.stringify({ userId }));
      return null;
    }
  }

  /**
   * Met à jour last_activity de la session
   */
  private async updateSessionActivity(sessionId: string): Promise<void> {
    try {
      await this.prisma.user_sessions.update({
        where: { id: sessionId },
        data: { 
          last_activity: new Date(),
          updated_at: new Date(),
        },
      });
    } catch (error) {
      // Log mais ne fait pas échouer l'auth
      this.logger.warn('Failed to update session activity', JSON.stringify({ 
        sessionId,
        error: error.message 
      }));
    }
  }

  /**
   * Normalise profil utilisateur pour réponse API
   */
  private normalizeUserProfile(user: any, payload: JwtPayload): IUserProfile {
    return {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      phone: user.phone,
      avatar: user.avatar,
      isActive: user.is_active,
      emailVerified: user.email_verified,
      phoneVerified: user.phone_verified,
      lastLogin: user.last_login,
      metadata: user.metadata,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
      // Ajouter infos du token
      roles: payload.roles || [],
      permissions: payload.permissions || [],
    };
  }
}
