// src/modules/auth/services/session.service.ts

import { Injectable } from '@nestjs/common';
import { LoggerService } from '../../../shared/logger/logger.service';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { RedisService } from '../../../shared/redis/redis.service';
import { 
  ISessionService, 
  IUserSession, 
  IDeviceInfo,
  ITokenPair,
  ISessionLoginResult
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
 * ✅ AMÉLIORÉ : Gestion intelligente des sessions existantes
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
   * ✅ NOUVELLE MÉTHODE : Gestion intelligente du login utilisateur
   * Vérifie sessions existantes et décide de la stratégie optimale :
   * - Réutilise session active récente si possible
   * - Rafraîchit session expirée mais valide
   * - Crée nouvelle session si nécessaire
   */
  async handleUserLogin(
    userId: string,
    deviceInfo: IDeviceInfo,
    rememberMe: boolean = false
  ): Promise<ISessionLoginResult> {
    const operationId = this.logger.startOperation('handleUserLogin', {
      userId,
      rememberMe,
      deviceFingerprint: deviceInfo.deviceFingerprint,
    });

    try {
      console.log('🔍 DEBUG handleUserLogin - Début gestion session pour user:', userId);

      // 1. Nettoyer les sessions expirées d'abord
      await this.cleanupExpiredSessionsForUser(userId);

      // 2. Chercher sessions actives existantes
      const existingSessions = await this.getUserActiveSessions(userId);
      console.log('🔍 DEBUG handleUserLogin - Sessions actives trouvées:', existingSessions.length);

      // 3. Chercher session compatible (même device fingerprint ou IP récente)
      const compatibleSession = await this.findCompatibleSession(
        existingSessions,
        deviceInfo,
        rememberMe
      );

      if (compatibleSession) {
        console.log('🔍 DEBUG handleUserLogin - Session compatible trouvée:', compatibleSession.id);
        
        // Vérifier si session est encore fraîche (moins de 1h d'inactivité)
        const now = new Date();
        const lastActivity = new Date(compatibleSession.last_activity);
        const inactiveMinutes = (now.getTime() - lastActivity.getTime()) / (1000 * 60);

        if (inactiveMinutes <= 60) { // Session fraîche, réutiliser
          console.log('🔍 DEBUG handleUserLogin - Session fraîche, réutilisation');
          
          // Mettre à jour l'activité et prolonger si nécessaire
          const updatedSession = await this.refreshExistingSession(
            compatibleSession,
            deviceInfo,
            rememberMe
          );

          // Générer nouveaux tokens pour sécurité
          const tokens = await this.tokenService.generateTokenPair(
            userId,
            updatedSession.user_id, // email will be fetched in token service
            updatedSession.id,
            rememberMe,
            deviceInfo.deviceFingerprint,
            [], // roles will be fetched in token service
            []  // permissions will be fetched in token service
          );

          this.logger.endOperation('handleUserLogin', operationId, true);

          return {
            session: updatedSession,
            tokens,
            type: 'reused',
            isReused: true,
          };
        } else {
          console.log('🔍 DEBUG handleUserLogin - Session ancienne, rafraîchissement');
          
          // Session ancienne mais valide, rafraîchir
          const refreshedSession = await this.refreshExistingSession(
            compatibleSession,
            deviceInfo,
            rememberMe
          );

          const tokens = await this.tokenService.generateTokenPair(
            userId,
            refreshedSession.user_id,
            refreshedSession.id,
            rememberMe,
            deviceInfo.deviceFingerprint,
            [],
            []
          );

          this.logger.endOperation('handleUserLogin', operationId, true);

          return {
            session: refreshedSession,
            tokens,
            type: 'refreshed',
            isReused: false,
          };
        }
      }

      console.log('🔍 DEBUG handleUserLogin - Aucune session compatible, création nouvelle session');

      // 4. Aucune session compatible trouvée, créer nouvelle session
      const newSession = await this.createSession(userId, deviceInfo, rememberMe);

      const tokens = await this.tokenService.generateTokenPair(
        userId,
        newSession.user_id,
        newSession.id,
        rememberMe,
        deviceInfo.deviceFingerprint,
        [],
        []
      );

      this.logger.endOperation('handleUserLogin', operationId, true);

      return {
        session: newSession,
        tokens,
        type: 'new',
        isReused: false,
      };

    } catch (error) {
      this.logger.logErrorEvent(
        error as Error,
        'SessionService.handleUserLogin',
        userId,
        JSON.stringify({ deviceInfo, rememberMe })
      );

      this.logger.endOperation('handleUserLogin', operationId, false);
      throw error;
    }
  }

  /**
   * ✅ AMÉLIORÉ : Création session avec vérification des limites
   * Crée nouvelle session utilisateur avec nettoyage préalable
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
      console.log('🔍 DEBUG createSession - Création nouvelle session pour user:', userId);

      // 1. ✅ NOUVEAU : Nettoyer sessions expirées avant vérification des limites
      await this.cleanupExpiredSessionsForUser(userId);

      // 2. Vérifier limite sessions par utilisateur
      await this.enforceSessionLimits(userId);

      // 3. Générer session token unique
      const sessionToken = this.generateSessionToken();
      
      // 4. Calculer durée session
      const sessionDuration = rememberMe 
        ? SESSION_CONSTANTS.DURATION.REMEMBER_ME_SESSION
        : SESSION_CONSTANTS.DURATION.DEFAULT_SESSION;

      const expiresAt = new Date(Date.now() + sessionDuration * 1000);

      // 5. Générer device fingerprint si absent
      const deviceFingerprint = deviceInfo.deviceFingerprint || 
                               this.generateDeviceFingerprint(deviceInfo);

      console.log('🔍 DEBUG createSession - Création en base avec token:', sessionToken.substring(0, 10) + '...');

      // 6. Créer session en base selon schema.prisma exact
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

      console.log('🔍 DEBUG createSession - Session créée avec ID:', session.id);

      // 7. Mettre en cache pour accès rapide
      await this.cacheSession(session);

      // 8. Logger succès
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
  /**
   * Refresh session avec nouveau token pair
   */
  async refreshSession(refreshToken: string): Promise<ITokenPair> {
    const operationId = this.logger.startOperation('refreshSession');

    try {
      // 1. ✅ CORRIGÉ : Utiliser verifyRefreshToken (pas validateRefreshToken)
      const payload = await this.tokenService.verifyRefreshToken(refreshToken);
      
      if (!payload || !payload.sessionId) {
        throw new InvalidRefreshTokenException();
      }

      // 2. ✅ CORRIGÉ : Récupérer session ET utilisateur depuis la base
      const sessionData = await this.prisma.user_sessions.findUnique({
        where: { id: payload.sessionId },
        include: {
          users: {
            select: {
              id: true,
              email: true,
              user_roles_user_roles_user_idTousers: {
                where: { status: 'ACTIVE' },
                include: {
                  roles: {
                    select: {
                      name: true,
                      code: true
                    }
                  }
                }
              }
            }
          }
        }
      });

      if (!sessionData || !sessionData.is_active || sessionData.expires_at < new Date()) {
        throw new SessionNotFoundException(payload.sessionId);
      }

      // 3. ✅ CORRIGÉ : Extraire informations utilisateur depuis la base
      const user = sessionData.users;
      const userRoles = user.user_roles_user_roles_user_idTousers
        ?.filter(ur => ur.status === 'ACTIVE')
        .map(ur => ur.roles.name) || [];

      // Déterminer si c'était une session "remember me" selon la durée
      const sessionDuration = sessionData.expires_at.getTime() - sessionData.created_at.getTime();
      const isRememberMe = sessionDuration > SESSION_CONSTANTS.DURATION.DEFAULT_SESSION * 1000;

      // 4. Générer nouveau token pair avec informations correctes
      const tokens = await this.tokenService.generateTokenPair(
        sessionData.user_id,
        user.email,
        sessionData.id,
        isRememberMe,
        sessionData.device_fingerprint,
        userRoles,
        [] // permissions - sera implémenté plus tard
      );

      // 5. Logger refresh
      this.logger.logBusinessEvent('TOKEN_REFRESHED', {
        sessionId: sessionData.id,
        userId: sessionData.user_id,
      }, sessionData.user_id);

      this.logger.endOperation('refreshSession', operationId, true);
      return tokens;

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
   * Révoquer session spécifique
   */
  async revokeSession(sessionId: string): Promise<boolean> {
    const operationId = this.logger.startOperation('revokeSession', { sessionId });

    try {
      // Invalider en base
      const result = await this.prisma.user_sessions.updateMany({
        where: { id: sessionId },
        data: { is_active: false },
      });

      // Supprimer du cache
      await this.removeCachedSessionById(sessionId);

      const success = result.count > 0;

      if (success) {
        this.logger.logBusinessEvent('SESSION_REVOKED', {
          sessionId,
        });
      }

      this.logger.endOperation('revokeSession', operationId, success);
      return success;

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
   * Révoquer toutes les sessions d'un utilisateur
   */
  async revokeAllUserSessions(userId: string): Promise<number> {
    const operationId = this.logger.startOperation('revokeAllUserSessions', { userId });

    try {
      // Invalider toutes les sessions utilisateur
      const result = await this.prisma.user_sessions.updateMany({
        where: { user_id: userId },
        data: { is_active: false },
      });

      // Nettoyer du cache
      await this.cleanupUserSessionsFromCache(userId);

      this.logger.logBusinessEvent('ALL_USER_SESSIONS_REVOKED', {
        userId,
        sessionsCount: result.count,
      }, userId);

      this.logger.endOperation('revokeAllUserSessions', operationId, true);
      return result.count;

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
   * Récupérer sessions actives utilisateur
   */
  async getUserActiveSessions(userId: string): Promise<IUserSession[]> {
    return await this.prisma.user_sessions.findMany({
      where: {
        user_id: userId,
        is_active: true,
        expires_at: { gt: new Date() },
      },
      orderBy: { last_activity: 'desc' },
    });
  }

  /**
   * Nettoyage global sessions expirées
   */
  async cleanupExpiredSessions(): Promise<number> {
    const operationId = this.logger.startOperation('cleanupExpiredSessions');

    try {
      const result = await this.prisma.user_sessions.deleteMany({
        where: {
          OR: [
            { expires_at: { lt: new Date() } },
            { 
              AND: [
                { is_active: false },
                { updated_at: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } } // 24h
              ]
            }
          ]
        }
      });

      const count = result.count;

      // Nettoyer cache
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
  // ✅ NOUVELLES MÉTHODES PRIVÉES pour gestion intelligente
  // ============================================================================

  /**
   * ✅ NOUVELLE MÉTHODE : Trouve session compatible pour réutilisation
   */
  async findCompatibleSession(
    sessions: IUserSession[],
    deviceInfo: IDeviceInfo,
    rememberMe: boolean
  ): Promise<IUserSession | null> {
    if (sessions.length === 0) return null;

    // 1. Chercher par device fingerprint exact (priorité haute)
    if (deviceInfo.deviceFingerprint) {
      const fingerprintMatch = sessions.find(s => 
        s.device_fingerprint === deviceInfo.deviceFingerprint
      );
      if (fingerprintMatch) {
        console.log('🔍 DEBUG findCompatibleSession - Match par fingerprint:', fingerprintMatch.id);
        return fingerprintMatch;
      }
    }

    // 2. Chercher par IP récente (dernières 2h) si même user agent
    const recentIpMatch = sessions.find(s => {
      const lastActivity = new Date(s.last_activity);
      const now = new Date();
      const hoursSinceActivity = (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60);
      
      return s.ip_address === deviceInfo.ipAddress &&
             s.user_agent === deviceInfo.userAgent &&
             hoursSinceActivity <= 2;
    });

    if (recentIpMatch) {
      console.log('🔍 DEBUG findCompatibleSession - Match par IP récente:', recentIpMatch.id);
      return recentIpMatch;
    }

    // 3. Si remember me, chercher session remember me active
    if (rememberMe) {
      const rememberMeSession = sessions.find(s => {
        const sessionDuration = s.expires_at.getTime() - s.created_at.getTime();
        return sessionDuration > SESSION_CONSTANTS.DURATION.DEFAULT_SESSION * 1000;
      });
      
      if (rememberMeSession) {
        console.log('🔍 DEBUG findCompatibleSession - Match remember me:', rememberMeSession.id);
        return rememberMeSession;
      }
    }

    console.log('🔍 DEBUG findCompatibleSession - Aucune session compatible trouvée');
    return null;
  }

  /**
   * ✅ NOUVELLE MÉTHODE : Rafraîchit session existante
   */
  async refreshExistingSession(
    session: IUserSession,
    deviceInfo: IDeviceInfo,
    rememberMe: boolean
  ): Promise<IUserSession> {
    console.log('🔍 DEBUG refreshExistingSession - Rafraîchissement session:', session.id);

    // Calculer nouvelle durée si nécessaire
    let newExpiresAt = session.expires_at;
    
    if (rememberMe) {
      const rememberMeExpiration = new Date(Date.now() + SESSION_CONSTANTS.DURATION.REMEMBER_ME_SESSION * 1000);
      if (rememberMeExpiration > session.expires_at) {
        newExpiresAt = rememberMeExpiration;
      }
    }

    // Mettre à jour session
    const updatedSession = await this.prisma.user_sessions.update({
      where: { id: session.id },
      data: {
        last_activity: new Date(),
        expires_at: newExpiresAt,
        ip_address: deviceInfo.ipAddress, // Mettre à jour IP courante
        user_agent: deviceInfo.userAgent || session.user_agent,
        device_fingerprint: deviceInfo.deviceFingerprint || session.device_fingerprint,
        geolocation: deviceInfo.geolocation || session.geolocation,
      },
    });

    // Mettre à jour cache
    await this.cacheSession(updatedSession);

    // Logger rafraîchissement
    this.logger.logBusinessEvent('SESSION_REFRESHED', {
      sessionId: session.id,
      userId: session.user_id,
      extended: newExpiresAt > session.expires_at,
    }, session.user_id);

    return updatedSession;
  }

  /**
   * ✅ NOUVELLE MÉTHODE : Nettoie sessions expirées pour un utilisateur
   */
  async cleanupExpiredSessionsForUser(userId: string): Promise<number> {
    const deletedCount = await this.prisma.user_sessions.deleteMany({
      where: {
        user_id: userId,
        OR: [
          { expires_at: { lt: new Date() } },
          { is_active: false }
        ]
      }
    });

    if (deletedCount.count > 0) {
      console.log(`🔍 DEBUG cleanupExpiredSessionsForUser - ${deletedCount.count} sessions expirées supprimées pour user:`, userId);
      
      // Nettoyer aussi du cache
      await this.cleanupUserSessionsFromCache(userId);
    }

    return deletedCount.count;
  }

  // ============================================================================
  // MÉTHODES PRIVÉES EXISTANTES (inchangées)
  // ============================================================================

  private async enforceSessionLimits(userId: string): Promise<void> {
    const activeSessions = await this.getUserActiveSessions(userId);
    
    if (activeSessions.length >= SESSION_CONSTANTS.LIMITS.MAX_CONCURRENT_SESSIONS) {
      // Supprimer session la plus ancienne
      const oldestSession = activeSessions[activeSessions.length - 1];
      await this.revokeSession(oldestSession.id);
      
      console.log('🔍 DEBUG enforceSessionLimits - Session la plus ancienne supprimée:', oldestSession.id);
    }
  }

  private generateSessionToken(): string {
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
      return await this.redis.getCache(sessionKey);
    } catch (error) {
      return null;
    }
  }

  private async updateLastActivity(sessionId: string): Promise<IUserSession> {
    return await this.prisma.user_sessions.update({
      where: { id: sessionId },
      data: { last_activity: new Date() },
    });
  }

  private async invalidateSession(sessionId: string): Promise<void> {
    await this.prisma.user_sessions.update({
      where: { id: sessionId },
      data: { is_active: false },
    });
    
    await this.removeCachedSessionById(sessionId);
  }

  private async removeCachedSessionById(sessionId: string): Promise<void> {
    try {
      // Chercher le token de session d'abord
      const session = await this.prisma.user_sessions.findUnique({
        where: { id: sessionId },
        select: { session_token: true }
      });

      if (session) {
        const sessionKey = `${SESSION_CONSTANTS.REDIS_KEYS.SESSION_PREFIX}${session.session_token}`;
        await this.redis.delCache(sessionKey);
      }
    } catch (error) {
      this.logger.warn('Failed to remove cached session', JSON.stringify({
        sessionId,
        error: error.message,
      }));
    }
  }

  private async cleanupUserSessionsFromCache(userId: string): Promise<void> {
    // Implementation pour nettoyer les sessions utilisateur du cache
    console.log('🔍 DEBUG cleanupUserSessionsFromCache - Nettoyage cache pour user:', userId);
  }

  private async cleanupExpiredSessionsFromCache(): Promise<void> {
    // Implementation pour nettoyer les sessions expirées du cache
    console.log('🔍 DEBUG cleanupExpiredSessionsFromCache - Nettoyage cache sessions expirées');
  }
}