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
 * JWT Refresh Strategy CORRIGÉE pour Refresh Tokens Entrix V3.0
 * ✅ ACCEPTE LE TOKEN DEPUIS LE BODY ET L'HEADER (stratégie hybride)
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
      // ✅ CORRIGÉ : Utilise extracteur personnalisé qui gère body ET header
      jwtFromRequest: JwtRefreshStrategy.createHybridExtractor(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_REFRESH_SECRET', configService.get<string>('JWT_SECRET')),
      issuer: 'entrix-v3',
      audience: 'entrix-refresh',
      passReqToCallback: true, // Pour accéder à la requête complète
    });

    this.logger = loggerService.createChildLogger('JwtRefreshStrategy');
  }

  /**
   * ✅ NOUVEAU : Extracteur hybride qui cherche le token dans le body ET l'header
   * Priorité : body > header (plus sécurisé)
   */
  static createHybridExtractor() {
    return (request: any): string | null => {
      // ✅ 1. Essayer d'extraire depuis le body (priorité)
      if (request.body && request.body.refreshToken) {
        return request.body.refreshToken;
      }

      // ✅ 2. Fallback : extraire depuis l'header Authorization (compatibilité)
      const authHeader = request.headers?.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        return authHeader.substring(7);
      }

      // ✅ 3. Aucun token trouvé
      return null;
    };
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
      // ✅ LOG DEBUG : D'où vient le token ?
      const tokenFromBody = req.body?.refreshToken;
      const tokenFromHeader = req.headers?.authorization?.substring(7);
      const tokenUsed = tokenFromBody || tokenFromHeader;

      this.logger.info('Refresh token extraction info', JSON.stringify({
        hasTokenInBody: !!tokenFromBody,
        hasTokenInHeader: !!tokenFromHeader,
        tokenUsedFrom: tokenFromBody ? 'body' : (tokenFromHeader ? 'header' : 'none'),
        tokenLength: tokenUsed?.length || 0,
        tokenPrefix: tokenUsed?.substring(0, 20) + '...' || 'none'
      }));

      // 1. Vérifier structure payload
      if (!this.isValidRefreshPayload(payload)) {
        this.logger.warn('Invalid refresh token payload', JSON.stringify({ payload }));
        throw new InvalidRefreshTokenException();
      }

      // 2. Extraire token complet pour blacklisting
      const token = tokenUsed;
      if (!token) {
        this.logger.warn('No refresh token found in body or header');
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
        extractedFrom: tokenFromBody ? 'body' : 'header'
      }, payload.sub);

      this.logger.endOperation('validateRefreshToken', operationId, true);

      return {
        userId: payload.sub,
        sessionId: payload.sessionId,
        tokenId: payload.tokenId,
      };

    } catch (error) {
      this.logger.endOperation('validateRefreshToken', operationId, false, undefined, { error: error.message });
      
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
   * Vérifie si refresh token déjà utilisé
   */
  private async isRefreshTokenUsed(tokenId: string): Promise<boolean> {
    try {
      const usedKey = `refresh_used:${tokenId}`;
      const isUsed = await this.redis.exists(usedKey);
      return !!isUsed;
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
   * Marque refresh token comme utilisé (rotation sécurisée)
   */
  private async markRefreshTokenAsUsed(tokenId: string, token: string): Promise<void> {
    try {
      const usedKey = `refresh_used:${tokenId}`;
      const tokenKey = `refresh_token:${tokenId}`;
      
      // ✅ CORRIGÉ : Utiliser les méthodes du RedisService Entrix
      await Promise.all([
        this.redis.set(usedKey, '1', 86400), // 24h TTL
        this.redis.set(tokenKey, token, 86400), // Sauvegarder le token pour audit
      ]);
    } catch (error) {
      this.logger.error('Error marking refresh token as used', error.stack);
      // Non bloquant, continue l'exécution
    }
  }

  /**
   * Révoque toutes les sessions utilisateur (en cas de compromission)
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

      this.logger.warn('All user sessions revoked due to token compromise', JSON.stringify({ userId }));
    } catch (error) {
      this.logger.error('Error revoking user sessions', error.stack);
    }
  }
}