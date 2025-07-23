// src/modules/auth/strategies/jwt-refresh.strategy.ts

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '../../../shared/logger/logger.service';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { RedisService } from '../../../shared/redis/redis.service';
import { JwtRefreshPayload } from '../interfaces/auth.interfaces';
import { InvalidRefreshTokenException } from '../exceptions/session.exceptions';

/**
 * JWT Refresh Strategy pour Refresh Tokens Entrix V3.0
 * Gestion rotation tokens et sécurité renforcée
 */

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
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
      secretOrKey: configService.get<string>('JWT_REFRESH_SECRET', configService.get<string>('JWT_SECRET')),
      issuer: 'entrix-v3',
      audience: 'entrix-refresh',
      passReqToCallback: true, // Pour accéder au token complet
    });

    this.logger = loggerService.createChildLogger('JwtRefreshStrategy');
  }

  /**
   * Validation refresh token avec rotation
   */
  async validate(req: any, payload: JwtRefreshPayload): Promise<{ userId: string; sessionId: string; tokenId: string }> {
    const operationId = this.logger.startOperation('validateRefreshToken', { 
      userId: payload.sub,
      sessionId: payload.sessionId,
      tokenId: payload.tokenId 
    });

    try {
      // 1. Vérifier structure payload
      if (!this.isValidRefreshPayload(payload)) {
        this.logger.warn('Invalid refresh token payload', JSON.stringify({ payload }));
        throw new InvalidRefreshTokenException();
      }

      // 2. Extraire token complet pour blacklisting
      const token = this.extractTokenFromRequest(req);
      if (!token) {
        throw new InvalidRefreshTokenException();
      }

      // 3. Vérifier si token déjà utilisé (protection contre replay)
      const isUsed = await this.isRefreshTokenUsed(payload.tokenId);
      if (isUsed) {
        this.logger.warn('Refresh token replay attempt', JSON.stringify({ 
          tokenId: payload.tokenId,
          userId: payload.sub 
        }));
        
        // Compromission potentielle - révoquer toutes les sessions utilisateur
        await this.revokeAllUserSessions(payload.sub);
        throw new InvalidRefreshTokenException();
      }

      // 4. Vérifier session associée
      const session = await this.validateRefreshSession(payload.sessionId, payload.sub);
      if (!session) {
        this.logger.warn('Refresh session invalid', JSON.stringify({ 
          sessionId: payload.sessionId 
        }));
        throw new InvalidRefreshTokenException();
      }

      // 5. Marquer token comme utilisé (rotation)
      await this.markRefreshTokenAsUsed(payload.tokenId, token);

      // 6. Logger utilisation refresh token
      this.logger.logBusinessEvent('REFRESH_TOKEN_USED', {
        userId: payload.sub,
        sessionId: payload.sessionId,
        tokenId: payload.tokenId,
      }, payload.sub);

      this.logger.endOperation(operationId, 'success', true);

      return {
        userId: payload.sub,
        sessionId: payload.sessionId,
        tokenId: payload.tokenId,
      };

    } catch (error) {
      this.logger.endOperation(operationId, 'error', error.message);
      
      this.logger.logBusinessEvent('REFRESH_TOKEN_VALIDATION_FAILED', {
        userId: payload.sub,
        sessionId: payload.sessionId,
        tokenId: payload.tokenId,
        error: error.message,
      }, payload.sub);

      throw error;
    }
  }

  /**
   * Valide structure payload refresh token
   */
  private isValidRefreshPayload(payload: any): payload is JwtRefreshPayload {
    return payload &&
           typeof payload.sub === 'string' &&
           typeof payload.sessionId === 'string' &&
           typeof payload.tokenId === 'string' &&
           typeof payload.iat === 'number' &&
           typeof payload.exp === 'number' &&
           payload.aud === 'entrix-refresh' &&
           payload.iss === 'entrix-v3';
  }

  /**
   * Extrait token de la requête
   */
  private extractTokenFromRequest(req: any): string | null {
    const authHeader = req.headers?.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.substring(7);
  }

  /**
   * Vérifie si refresh token déjà utilisé
   */
  private async isRefreshTokenUsed(tokenId: string): Promise<boolean> {
    try {
      const usedKey = `refresh_used:${tokenId}`;
      const isUsed = await this.redis.exists(usedKey);
      return isUsed;
    } catch (error) {
      this.logger.error('Error checking refresh token usage', error.stack);
      return false;
    }
  }

  /**
   * Valide session pour refresh token
   */
  private async validateRefreshSession(sessionId: string, userId: string): Promise<boolean> {
    try {
      const session = await this.prisma.user_sessions.findFirst({
        where: {
          id: sessionId,
          user_id: userId,
          is_active: true,
          expires_at: {
            gt: new Date(),
          },
        },
        select: {
          id: true,
        },
      });

      return !!session;
    } catch (error) {
      this.logger.error('Error validating refresh session', error.stack);
      return false;
    }
  }

  /**
   * Marque refresh token comme utilisé
   */
  private async markRefreshTokenAsUsed(tokenId: string, token: string): Promise<void> {
    try {
      const usedKey = `refresh_used:${tokenId}`;
      const blacklistKey = `blacklist:refresh:${tokenId}`;
      
      // Marquer comme utilisé avec TTL de 7 jours
      await Promise.all([
        this.redis.setCache(usedKey, token, 7 * 24 * 60 * 60),
        this.redis.setCache(blacklistKey, 'revoked', 7 * 24 * 60 * 60),
      ]);
    } catch (error) {
      this.logger.error('Error marking refresh token as used', error.stack);
      // Ne pas faire échouer l'auth, mais logger
    }
  }

  /**
   * Révoque toutes les sessions utilisateur (compromission détectée)
   */
  private async revokeAllUserSessions(userId: string): Promise<void> {
    try {
      await this.prisma.user_sessions.updateMany({
        where: {
          user_id: userId,
          is_active: true,
        },
        data: {
          is_active: false,
          updated_at: new Date(),
        },
      });

      this.logger.logBusinessEvent('ALL_SESSIONS_REVOKED', {
        userId,
        reason: 'refresh_token_replay_detected',
      }, userId);

    } catch (error) {
      this.logger.error('Error revoking all user sessions', error.stack, JSON.stringify({ userId }));
    }
  }
}
