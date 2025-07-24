// src/modules/auth/services/session.service.ts

import { Injectable } from '@nestjs/common';
import { LoggerService } from '../../../shared/logger/logger.service';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { RedisService } from '../../../shared/redis/redis.service';
import { 
  ISessionService, 
  IUserSession, 
  IDeviceInfo,
  ITokenPair 
} from '../interfaces';
import { TokenService } from './token.service';
import { SESSION_CONSTANTS } from '../constants/session.constants';
import { 
  SessionNotFoundException,
  TooManySessionsException,
  InvalidRefreshTokenException 
} from '../exceptions/session.exceptions';

/**
 * Session Service Entrix V3.0 - Grade A+
 * Gestion sessions avec Redis + PostgreSQL
 * Respecte schema.prisma user_sessions exact
 */

@Injectable()
export class SessionService implements ISessionService {
  private readonly logger: LoggerService;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly tokenService: TokenService,
    loggerService: LoggerService,
  ) {
    this.logger = loggerService.createChildLogger('SessionService');
  }

  /**
   * Crée nouvelle session utilisateur
   * Respecte schema.prisma user_sessions exact
   */
  async createSession(
    userId: string, 
    deviceInfo: IDeviceInfo, 
    rememberMe: boolean = false
  ): Promise<IUserSession> {
    const operationId = this.logger.startOperation('createSession', {
      userId,
      rememberMe,
      ipAddress: deviceInfo.ipAddress,
    });

    try {
      // 1. Vérifier limite sessions par utilisateur
      await this.enforceSessionLimits(userId);

      // 2. Générer session token unique
      const sessionToken = this.generateSessionToken();
      
      // 3. Calculer durée session
      const sessionDuration = rememberMe 
        ? SESSION_CONSTANTS.DURATION.REMEMBER_ME_SESSION
        : SESSION_CONSTANTS.DURATION.DEFAULT_SESSION;

      const expiresAt = new Date(Date.now() + sessionDuration * 1000);

      // 4. Générer device fingerprint si absent
      const deviceFingerprint = deviceInfo.deviceFingerprint || 
                               this.generateDeviceFingerprint(deviceInfo);

      // 5. Créer session en base selon schema.prisma exact
      const session = await this.prisma.user_sessions.create({
        data: {
          session_token: sessionToken,
          user_id: userId,
          ip_address: deviceInfo.ipAddress,
          user_agent: deviceInfo.userAgent || null,
          device_fingerprint: deviceFingerprint,
          geolocation: deviceInfo.geolocation || null,
          expires_at: expiresAt,
          is_active: true,
          last_activity: new Date(),
        },
      });

      // 6. Mettre en cache pour accès rapide
      await this.cacheSession(session);

      // 7. Logger succès
      this.logger.logBusinessEvent('SESSION_CREATED', {
        sessionId: session.id,
        userId,
        deviceFingerprint,
        expiresAt: expiresAt.toISOString(),
        rememberMe,
      }, userId);

      this.logger.endOperation('createSession', operationId, true);
      return session;

    } catch (error) {
      this.logger.logErrorEvent(
        error as Error,
        'SessionService.createSession',
        userId,
        JSON.stringify({
          userId,
          deviceInfo: {
            ipAddress: deviceInfo.ipAddress,
            userAgent: deviceInfo.userAgent,
          },
          rememberMe,
        })
      );

      this.logger.endOperation('createSession', operationId, false);
      throw error;
    }
  }

  /**
   * Valide session existante selon schema.prisma
   */
  async validateSession(sessionToken: string): Promise<IUserSession | null> {
    const operationId = this.logger.startOperation('validateSession');

    try {
      // 1. Chercher en cache d'abord
      const cachedSession = await this.getCachedSession(sessionToken);
      if (cachedSession) {
        this.logger.endOperation('validateSession', operationId, true);
        return cachedSession;
      }

      // 2. Chercher en base selon schema.prisma exact
      const session = await this.prisma.user_sessions.findUnique({
        where: { session_token: sessionToken },
      });

      if (!session) {
        this.logger.endOperation('validateSession', operationId, true);
        return null;
      }

      // 3. Vérifier expiration
      if (session.expires_at < new Date() || !session.is_active) {
        this.logger.warn('Session expired or inactive', JSON.stringify({
          sessionId: session.id,
          expiresAt: session.expires_at.toISOString(),
          isActive: session.is_active,
        }));
        
        await this.invalidateSession(session.id);
        this.logger.endOperation('validateSession', operationId, true);
        return null;
      }

      // 4. Mettre à jour last_activity
      const updatedSession = await this.updateLastActivity(session.id);

      // 5. Remettre en cache
      await this.cacheSession(updatedSession);

      this.logger.endOperation('validateSession', operationId, true);
      return updatedSession;

    } catch (error) {
      this.logger.logErrorEvent(
        error as Error,
        'SessionService.validateSession',
        undefined,
        JSON.stringify({ sessionToken: sessionToken.substring(0, 10) + '...' })
      );

      this.logger.endOperation('validateSession', operationId, false);
      return null;
    }
  }

  /**
   * Refresh session avec nouveau token pair
   */
  async refreshSession(refreshToken: string): Promise<ITokenPair> {
    const operationId = this.logger.startOperation('refreshSession');

    try {
      // 1. Valider refresh token
      const payload = await this.tokenService.verifyRefreshToken(refreshToken);
      
      // 2. Vérifier session active
      const session = await this.prisma.user_sessions.findUnique({
        where: { id: payload.sessionId },
      });

      if (!session || !session.is_active || session.expires_at < new Date()) {
        this.logger.warn('Invalid session for refresh', JSON.stringify({
          sessionId: payload.sessionId,
        }));
        throw new InvalidRefreshTokenException();
      }

      // 3. Récupérer email utilisateur pour tokens
      const user = await this.prisma.users.findUnique({
        where: { id: session.user_id },
        select: { email: true },
      });

      if (!user) {
        throw new InvalidRefreshTokenException();
      }

      // 4. Générer nouveaux tokens avec signature correcte
      const tokenPair = await this.tokenService.generateTokenPair(
        session.user_id,
        user.email,
        session.id
      );

      // 4. Blacklister ancien refresh token
      await this.tokenService.blacklistToken(refreshToken);

      // 5. Étendre session si proche expiration
      await this.extendSessionIfNeeded(session);

      this.logger.logBusinessEvent('SESSION_REFRESHED', {
        sessionId: session.id,
        userId: session.user_id,
      }, session.user_id);

      this.logger.endOperation('refreshSession', operationId, true);
      return tokenPair;

    } catch (error) {
      this.logger.logErrorEvent(
        error as Error,
        'SessionService.refreshSession',
        undefined,
        JSON.stringify({ refreshToken: refreshToken.substring(0, 10) + '...' })
      );

      this.logger.endOperation('refreshSession', operationId, false);
      throw error;
    }
  }

  /**
   * Révoque session spécifique
   */
  async revokeSession(sessionId: string): Promise<boolean> {
    const operationId = this.logger.startOperation('revokeSession', { sessionId });

    try {
      // 1. Désactiver session en base
      const updatedSession = await this.prisma.user_sessions.update({
        where: { id: sessionId },
        data: {
          is_active: false,
          updated_at: new Date(),
        },
      });

      // 2. Supprimer du cache
      await this.removeCachedSession(updatedSession.session_token);

      // 3. Blacklister tokens associés
      await this.blacklistSessionTokens(sessionId);

      this.logger.logBusinessEvent('SESSION_REVOKED', {
        sessionId,
        userId: updatedSession.user_id,
      }, updatedSession.user_id);

      this.logger.endOperation('revokeSession', operationId, true);
      return true;

    } catch (error) {
      this.logger.logErrorEvent(
        error as Error,
        'SessionService.revokeSession',
        undefined,
        JSON.stringify({ sessionId })
      );

      this.logger.endOperation('revokeSession', operationId, false);
      return false;
    }
  }

  /**
   * Révoque toutes les sessions utilisateur
   */
  async revokeAllUserSessions(userId: string): Promise<number> {
    const operationId = this.logger.startOperation('revokeAllUserSessions', { userId });

    try {
      // 1. Désactiver toutes sessions utilisateur
      const { count } = await this.prisma.user_sessions.updateMany({
        where: {
          user_id: userId,
          is_active: true,
        },
        data: {
          is_active: false,
          updated_at: new Date(),
        },
      });

      // 2. Nettoyer cache utilisateur
      await this.clearUserSessionsFromCache(userId);

      this.logger.logBusinessEvent('ALL_SESSIONS_REVOKED', {
        userId,
        sessionsRevoked: count,
      }, userId);

      this.logger.endOperation('revokeAllUserSessions', operationId, true);
      return count;

    } catch (error) {
      this.logger.logErrorEvent(
        error as Error,
        'SessionService.revokeAllUserSessions',
        userId,
        JSON.stringify({ userId })
      );

      this.logger.endOperation('revokeAllUserSessions', operationId, false);
      return 0;
    }
  }

  /**
   * Récupère sessions actives utilisateur
   */
  async getUserActiveSessions(userId: string): Promise<IUserSession[]> {
    const operationId = this.logger.startOperation('getUserActiveSessions', { userId });

    try {
      const sessions = await this.prisma.user_sessions.findMany({
        where: {
          user_id: userId,
          is_active: true,
          expires_at: {
            gt: new Date(),
          },
        },
        orderBy: {
          last_activity: 'desc',
        },
      });

      this.logger.endOperation('getUserActiveSessions', operationId, true);
      return sessions;

    } catch (error) {
      this.logger.logErrorEvent(
        error as Error,
        'SessionService.getUserActiveSessions',
        userId,
        JSON.stringify({ userId })
      );

      this.logger.endOperation('getUserActiveSessions', operationId, false);
      throw error;
    }
  }

  /**
   * Nettoyage sessions expirées
   */
  async cleanupExpiredSessions(): Promise<number> {
    const operationId = this.logger.startOperation('cleanupExpiredSessions');

    try {
      const { count } = await this.prisma.user_sessions.deleteMany({
        where: {
          OR: [
            { expires_at: { lt: new Date() } },
            { is_active: false },
          ],
        },
      });

      // Nettoyer cache aussi
      await this.cleanupExpiredSessionsFromCache();

      this.logger.logBusinessEvent('SESSIONS_CLEANUP', {
        sessionsDeleted: count,
      });

      this.logger.endOperation('cleanupExpiredSessions', operationId, true);
      return count;

    } catch (error) {
      this.logger.logErrorEvent(
        error as Error,
        'SessionService.cleanupExpiredSessions'
      );

      this.logger.endOperation('cleanupExpiredSessions', operationId, false);
      return 0;
    }
  }

  // ============================================================================
  // MÉTHODES PRIVÉES
  // ============================================================================

  private async enforceSessionLimits(userId: string): Promise<void> {
    const activeSessions = await this.getUserActiveSessions(userId);
    
    if (activeSessions.length >= SESSION_CONSTANTS.LIMITS.MAX_CONCURRENT_SESSIONS) {
      // Supprimer session la plus ancienne
      const oldestSession = activeSessions[activeSessions.length - 1];
      await this.revokeSession(oldestSession.id);
    }
  }

  private generateSessionToken(): string {
    // Générer token sécurisé de 255 caractères max
    const crypto = require('crypto');
    return crypto.randomBytes(128).toString('hex');
  }

  private generateDeviceFingerprint(deviceInfo: IDeviceInfo): string {
    const crypto = require('crypto');
    const fingerprint = `${deviceInfo.userAgent}-${deviceInfo.ipAddress}`;
    return crypto.createHash('sha256').update(fingerprint).digest('hex');
  }

  private async cacheSession(session: IUserSession): Promise<void> {
    try {
      const sessionKey = `${SESSION_CONSTANTS.REDIS_KEYS.SESSION_PREFIX}${session.session_token}`;
      await this.redis.setCache(sessionKey, session, SESSION_CONSTANTS.DURATION.DEFAULT_SESSION);
    } catch (error) {
      this.logger.warn('Failed to cache session', JSON.stringify({
        sessionId: session.id,
        error: error.message,
      }));
    }
  }

  private async getCachedSession(sessionToken: string): Promise<IUserSession | null> {
    try {
      const sessionKey = `${SESSION_CONSTANTS.REDIS_KEYS.SESSION_PREFIX}${sessionToken}`;
      return await this.redis.getCache<IUserSession>(sessionKey);
    } catch (error) {
      return null;
    }
  }

  private async removeCachedSession(sessionToken: string): Promise<void> {
    try {
      const sessionKey = `${SESSION_CONSTANTS.REDIS_KEYS.SESSION_PREFIX}${sessionToken}`;
      await this.redis.delCache(sessionKey);
    } catch (error) {
      this.logger.warn('Failed to remove cached session', JSON.stringify({
        error: error.message,
      }));
    }
  }

  private async updateLastActivity(sessionId: string): Promise<IUserSession> {
    return await this.prisma.user_sessions.update({
      where: { id: sessionId },
      data: {
        last_activity: new Date(),
        updated_at: new Date(),
      },
    });
  }

  private async invalidateSession(sessionId: string): Promise<void> {
    try {
      await this.prisma.user_sessions.update({
        where: { id: sessionId },
        data: {
          is_active: false,
          updated_at: new Date(),
        },
      });
    } catch (error) {
      this.logger.logErrorEvent(
        error as Error,
        'SessionService.invalidateSession',
        undefined,
        JSON.stringify({ sessionId })
      );
    }
  }

  private async extendSessionIfNeeded(session: IUserSession): Promise<void> {
    const now = new Date();
    const timeUntilExpiry = session.expires_at.getTime() - now.getTime();
    const oneHour = 60 * 60 * 1000;

    // Étendre si expire dans moins d'1 heure
    if (timeUntilExpiry < oneHour) {
      const newExpiresAt = new Date(now.getTime() + SESSION_CONSTANTS.DURATION.DEFAULT_SESSION * 1000);
      
      await this.prisma.user_sessions.update({
        where: { id: session.id },
        data: {
          expires_at: newExpiresAt,
          updated_at: new Date(),
        },
      });
    }
  }

  private async blacklistSessionTokens(sessionId: string): Promise<void> {
    // TODO: Implémenter blacklisting des tokens de cette session
    // Nécessite mapping sessionId -> tokens actifs
    this.logger.info('Session tokens blacklisted', JSON.stringify({ sessionId }));
  }

  private async clearUserSessionsFromCache(userId: string): Promise<void> {
    try {
      // Récupérer toutes les sessions utilisateur pour nettoyer cache
      const userSessions = await this.prisma.user_sessions.findMany({
        where: { user_id: userId },
        select: { session_token: true },
      });

      for (const session of userSessions) {
        await this.removeCachedSession(session.session_token);
      }
    } catch (error) {
      this.logger.warn('Failed to clear user sessions from cache', JSON.stringify({
        userId,
        error: error.message,
      }));
    }
  }

  private async cleanupExpiredSessionsFromCache(): Promise<void> {
    // Nettoyage asynchrone - ne pas bloquer l'opération principale
    setImmediate(async () => {
      try {
        // Récupérer toutes les sessions expirées
        const expiredSessions = await this.prisma.user_sessions.findMany({
          where: {
            OR: [
              { expires_at: { lt: new Date() } },
              { is_active: false },
            ],
          },
          select: { session_token: true },
        });

        // Nettoyer cache
        for (const session of expiredSessions) {
          await this.removeCachedSession(session.session_token);
        }

        this.logger.info('Cache cleanup completed', JSON.stringify({
          sessionsRemoved: expiredSessions.length,
        }));
      } catch (error) {
        this.logger.logErrorEvent(
          error as Error,
          'SessionService.cleanupExpiredSessionsFromCache'
        );
      }
    });
  }
}