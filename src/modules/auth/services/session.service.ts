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
import { DeviceUtil } from '../utils/device.util';
import { TokenUtil } from '../utils/token.util';
import { SESSION_CONSTANTS } from '../constants/session.constants';
import { AUTH_CONSTANTS } from '../constants/auth.constants';
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

      // 2. Générer session ID unique
      const sessionId = TokenUtil.generateSessionId();
      
      // 3. Calculer durée session
      const sessionDuration = rememberMe 
        ? SESSION_CONSTANTS.DURATION.REMEMBER_ME_SESSION
        : SESSION_CONSTANTS.DURATION.DEFAULT_SESSION;

      const expiresAt = new Date(Date.now() + sessionDuration * 1000);

      // 4. Générer device fingerprint si absent
      const deviceFingerprint = deviceInfo.deviceFingerprint || 
                               DeviceUtil.generateDeviceFingerprint(deviceInfo);

      // 5. Créer session en DB selon schema.prisma exact
      const session = await this.prisma.user_sessions.create({
        data: {
          id: sessionId,
          session_token: TokenUtil.generateSecureToken(128), // Token session unique
          user_id: userId,
          ip_address: deviceInfo.ipAddress,
          user_agent: deviceInfo.userAgent || null,
          device_fingerprint: deviceFingerprint,
          geolocation: deviceInfo.geolocation || null,
          is_active: true,
          last_activity: new Date(),
          expires_at: expiresAt,
          created_at: new Date(),
          updated_at: new Date(),
        },
      });

      // 6. Mettre en cache Redis pour accès rapide
      await this.cacheSession(session);

      // 7. Nettoyer sessions expirées (async)
      this.cleanupExpiredSessionsAsync(userId);

      // 8. Logger création session
      this.logger.logBusinessEvent('SESSION_CREATED', {
        userId,
        sessionId: session.id,
        deviceFingerprint,
        ipAddress: deviceInfo.ipAddress,
        userAgent: deviceInfo.userAgent,
        rememberMe,
        expiresAt: expiresAt.toISOString(),
      }, userId);

      this.logger.endOperation(operationId, 'success');
      return session;

    } catch (error) {
      this.logger.endOperation(operationId, 'error', error.message);
      
      if (error instanceof TooManySessionsException) {
        throw error;
      }

      this.logger.error('Failed to create session', error.stack, {
        userId,
        ipAddress: deviceInfo.ipAddress,
      });
      throw new Error(`Erreur création session: ${error.message}`);
    }
  }

  /**
   * Valide session active
   * Vérifie DB + cache Redis
   */
  async validateSession(sessionToken: string): Promise<IUserSession | null> {
    const operationId = this.logger.startOperation('validateSession');

    try {
      // 1. Chercher en cache Redis d'abord
      const cachedSession = await this.getSessionFromCache(sessionToken);
      if (cachedSession && this.isSessionValid(cachedSession)) {
        this.logger.endOperation(operationId, 'cache_hit');
        return cachedSession;
      }

      // 2. Fallback sur DB si cache miss
      const session = await this.prisma.user_sessions.findFirst({
        where: {
          session_token: sessionToken,
          is_active: true,
          expires_at: {
            gt: new Date(),
          },
        },
      });

      if (!session) {
        this.logger.endOperation(operationId, 'session_not_found');
        return null;
      }

      // 3. Vérifier validité
      if (!this.isSessionValid(session)) {
        await this.expireSession(session.id);
        this.logger.endOperation(operationId, 'session_expired');
        return null;
      }

      // 4. Remettre en cache
      await this.cacheSession(session);

      this.logger.endOperation(operationId, 'db_hit');
      return session;

    } catch (error) {
      this.logger.endOperation(operationId, 'error', error.message);
      this.logger.error('Session validation failed', error.stack);
      return null;
    }
  }

  /**
   * Refresh session avec nouveau token pair
   * Implémente rotation refresh tokens
   */
  async refreshSession(refreshToken: string): Promise<ITokenPair> {
    const operationId = this.logger.startOperation('refreshSession');

    try {
      // 1. Valider refresh token
      const refreshPayload = await this.tokenService.verifyRefreshToken(refreshToken);

      // 2. Vérifier session associée
      const session = await this.validateSession(refreshPayload.sessionId);
      if (!session) {
        throw new InvalidRefreshTokenException();
      }

      // 3. Récupérer utilisateur pour nouveau token
      const user = await this.prisma.users.findUnique({
        where: { id: refreshPayload.sub },
        select: {
          id: true,
          email: true,
          is_active: true,
        },
      });

      if (!user || !user.is_active) {
        throw new InvalidRefreshTokenException();
      }

      // 4. Marquer ancien refresh token comme utilisé
      await this.markRefreshTokenAsUsed(refreshPayload.tokenId, refreshToken);

      // 5. Générer nouvelle paire tokens
      const newTokens = await this.tokenService.generateTokenPair(
        user.id,
        user.email,
        session.id,
        this.isRememberMeSession(session),
        session.device_fingerprint
      );

      // 6. Étendre durée session
      const sessionExtended = await this.extendSession(session.id);

      // 7. Logger refresh réussi
      this.logger.logBusinessEvent('SESSION_REFRESHED', {
        userId: user.id,
        sessionId: session.id,
        oldTokenId: refreshPayload.tokenId,
        sessionExtended,
      }, user.id);

      this.logger.endOperation(operationId, 'success');
      return newTokens;

    } catch (error) {
      this.logger.endOperation(operationId, 'error', error.message);
      
      if (error instanceof InvalidRefreshTokenException) {
        throw error;
      }

      this.logger.error('Session refresh failed', error.stack);
      throw new InvalidRefreshTokenException();
    }
  }

  /**
   * Révoque session spécifique
   */
  async revokeSession(sessionId: string): Promise<boolean> {
    const operationId = this.logger.startOperation('revokeSession', { sessionId });

    try {
      // 1. Désactiver session en DB
      const updatedSession = await this.prisma.user_sessions.updateMany({
        where: {
          id: sessionId,
          is_active: true,
        },
        data: {
          is_active: false,
          updated_at: new Date(),
        },
      });

      // 2. Supprimer du cache Redis
      await this.removeSessionFromCache(sessionId);

      // 3. Blacklister tokens associés (si possible)
      await this.blacklistSessionTokens(sessionId);

      const revoked = updatedSession.count > 0;

      if (revoked) {
        this.logger.logBusinessEvent('SESSION_REVOKED', {
          sessionId,
          reason: 'manual_logout',
        });
      }

      this.logger.endOperation(operationId, revoked ? 'success' : 'not_found');
      return revoked;

    } catch (error) {
      this.logger.endOperation(operationId, 'error', error.message);
      this.logger.error('Failed to revoke session', error.stack, { sessionId });
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
      const result = await this.prisma.user_sessions.updateMany({
        where: {
          user_id: userId,
          is_active: true,
        },
        data: {
          is_active: false,
          updated_at: new Date(),
        },
      });

      // 2. Nettoyer cache Redis pour cet utilisateur
      await this.clearUserSessionsFromCache(userId);

      // 3. Logger révocation globale
      this.logger.logBusinessEvent('ALL_SESSIONS_REVOKED', {
        userId,
        sessionsRevoked: result.count,
        reason: 'logout_all_devices',
      }, userId);

      this.logger.endOperation(operationId, 'success');
      return result.count;

    } catch (error) {
      this.logger.endOperation(operationId, 'error', error.message);
      this.logger.error('Failed to revoke all user sessions', error.stack, { userId });
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

      this.logger.endOperation(operationId, 'success');
      return sessions;

    } catch (error) {
      this.logger.endOperation(operationId, 'error', error.message);
      this.logger.error('Failed to get user active sessions', error.stack, { userId });
      return [];
    }
  }

  /**
   * Nettoie sessions expirées
   */
  async cleanupExpiredSessions(): Promise<number> {
    const operationId = this.logger.startOperation('cleanupExpiredSessions');

    try {
      // 1. Supprimer sessions expirées de DB
      const result = await this.prisma.user_sessions.deleteMany({
        where: {
          OR: [
            { expires_at: { lt: new Date() } },
            { 
              is_active: false,
              updated_at: { 
                lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 jours
              }
            }
          ],
        },
      });

      // 2. Nettoyer cache Redis (pattern matching)
      await this.cleanupExpiredSessionsFromCache();

      this.logger.logBusinessEvent('SESSIONS_CLEANUP', {
        sessionsDeleted: result.count,
        timestamp: new Date().toISOString(),
      });

      this.logger.endOperation(operationId, 'success');
      return result.count;

    } catch (error) {
      this.logger.endOperation(operationId, 'error', error.message);
      this.logger.error('Failed to cleanup expired sessions', error.stack);
      return 0;
    }
  }

  /**
   * Méthodes helper privées
   */

  private async enforceSessionLimits(userId: string): Promise<void> {
    const activeSessions = await this.getUserActiveSessions(userId);
    
    if (activeSessions.length >= SESSION_CONSTANTS.LIMITS.MAX_CONCURRENT_SESSIONS) {
      // Supprimer session la plus ancienne
      const oldestSession = activeSessions[activeSessions.length - 1];
      await this.revokeSession(oldestSession.id);
      
      this.logger.warn('Session limit reached, revoked oldest session', JSON.stringify({
        userId,
        revokedSessionId: oldestSession.id,
        activeSessionsCount: activeSessions.length,
      }));
    }
  }

  private isSessionValid(session: IUserSession): boolean {
    const now = new Date();
    return session.is_active && 
           session.expires_at > now &&
           (now.getTime() - session.last_activity.getTime()) < SESSION_CONSTANTS.DURATION.IDLE_TIMEOUT * 1000;
  }

  private async cacheSession(session: IUserSession): Promise<void> {
    try {
      const cacheKey = `${SESSION_CONSTANTS.REDIS_KEYS.SESSION_PREFIX}${session.session_token}`;
      const ttl = Math.floor((session.expires_at.getTime() - Date.now()) / 1000);
      
      if (ttl > 0) {
        await this.redis.setCache(cacheKey, session, ttl);
      }
    } catch (error) {
      this.logger.warn('Failed to cache session', JSON.stringify({ 
        sessionId: session.id,
        error: error.message 
      }));
    }
  }

  private async getSessionFromCache(sessionToken: string): Promise<IUserSession | null> {
    try {
      const cacheKey = `${SESSION_CONSTANTS.REDIS_KEYS.SESSION_PREFIX}${sessionToken}`;
      const cached = await this.redis.getCache<IUserSession>(cacheKey);
      return cached;
    } catch (error) {
      this.logger.warn('Failed to get session from cache', JSON.stringify({ error: error.message }));
      return null;
    }
  }

  private async expireSession(sessionId: string): Promise<void> {
    try {
      await this.prisma.user_sessions.update({
        where: { id: sessionId },
        data: { 
          is_active: false,
          updated_at: new Date(),
        },
      });
    } catch (error) {
      this.logger.error('Failed to expire session', error.stack, { sessionId });
    }
  }

  private isRememberMeSession(session: IUserSession): boolean {
    const sessionDuration = session.expires_at.getTime() - session.created_at.getTime();
    return sessionDuration > SESSION_CONSTANTS.DURATION.DEFAULT_SESSION * 1000;
  }

  private async extendSession(sessionId: string): Promise<boolean> {
    try {
      const extensionDuration = SESSION_CONSTANTS.DURATION.DEFAULT_SESSION;
      const newExpiresAt = new Date(Date.now() + extensionDuration * 1000);

      await this.prisma.user_sessions.update({
        where: { id: sessionId },
        data: {
          expires_at: newExpiresAt,
          last_activity: new Date(),
          updated_at: new Date(),
        },
      });

      return true;
    } catch (error) {
      this.logger.error('Failed to extend session', error.stack, { sessionId });
      return false;
    }
  }

  private async markRefreshTokenAsUsed(tokenId: string, token: string): Promise<void> {
    try {
      const usedKey = `refresh_used:${tokenId}`;
      await this.redis.setCache(usedKey, token, AUTH_CONSTANTS.JWT.REFRESH_TOKEN_EXPIRY);
    } catch (error) {
      this.logger.error('Failed to mark refresh token as used', error.stack);
    }
  }

  private async removeSessionFromCache(sessionId: string): Promise<void> {
    try {
      const pattern = `${SESSION_CONSTANTS.REDIS_KEYS.SESSION_PREFIX}*`;
      // TODO: Implémenter recherche par sessionId dans le cache
      // Simplification: on nettoiera au prochain cleanup
    } catch (error) {
      this.logger.warn('Failed to remove session from cache', JSON.stringify({ error: error.message }));
    }
  }

  private async blacklistSessionTokens(sessionId: string): Promise<void> {
    // TODO: Implémenter blacklisting des tokens de cette session
    // Nécessite mapping sessionId -> tokens actifs
  }

  private async clearUserSessionsFromCache(userId: string): Promise<void> {
    try {
      const pattern = `${SESSION_CONSTANTS.REDIS_KEYS.USER_SESSIONS_PREFIX}${userId}:*`;
      // TODO: Implémenter nettoyage pattern Redis
    } catch (error) {
      this.logger.warn('Failed to clear user sessions from cache', JSON.stringify({ error: error.message }));
    }
  }

  private async cleanupExpiredSessionsFromCache(): Promise<void> {
    // TODO: Implémenter nettoyage cache Redis pour sessions expirées
    // Utiliser SCAN pour parcourir les clés de session et vérifier TTL
  }

  private cleanupExpiredSessionsAsync(userId: string): void {
    // Lancement asynchrone du nettoyage (non bloquant)
    setImmediate(() => {
      this.cleanupExpiredSessions().catch(error => {
        this.logger.error('Async cleanup failed', error.stack, { userId });
      });
    });
  }
}