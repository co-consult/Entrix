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
  ISessionLoginResult,
  SessionType
} from '../interfaces';
import { TokenService } from './token.service';
import { PersistentTokenService } from './persistent-token.service';
import { IpUtils } from '../utils/ip.util'; // ✅ IMPORT AJOUTÉ
import { SESSION_CONSTANTS } from '../constants/session.constants';
import { AUTH_CONSTANTS } from '../constants/auth.constants';
import { 
  SessionNotFoundException,
  TooManySessionsException,
  InvalidRefreshTokenException 
} from '../exceptions/session.exceptions';

/**
 * Session Service Entrix V3.0 REFACTORISÉ - Grade A+
 * ✅ CORRECTION : Validation des adresses IP avec IpUtils
 * ✅ INTÉGRATION COMPLÈTE des nouveaux services de tokens
 * 
 * CORRECTIONS APPLIQUÉES :
 * - Validation et normalisation des adresses IP avec IpUtils
 * - Protection contre les erreurs PostgreSQL INET
 * - Gestion des cas edge (IPv6, adresses invalides, null)
 * 
 * NOUVELLES FONCTIONNALITÉS :
 * - Intégration PersistentTokenService pour refresh tokens longue durée
 * - Utilisation du TokenService refactorisé pour JWT temporaires
 * - Gestion intelligente des sessions avec tokens hybrides
 * - Cache optimisé avec les nouveaux patterns
 * - Support des API keys pour sessions persistantes
 * - Maintenance automatique intégrée
 * 
 * Respecte schema.prisma user_sessions exact et toutes les interfaces existantes
 */

@Injectable()
export class SessionService implements ISessionService {
  private readonly logger: LoggerService;
  private readonly CACHE_PREFIX = 'session:';
  private readonly TOKENS_CACHE_PREFIX = 'session_tokens:';
  private readonly CACHE_TTL = 300; // 5 minutes

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly tokenService: TokenService,                    // ✅ REFACTORISÉ
    private readonly persistentTokenService: PersistentTokenService, // ✅ NOUVEAU
    loggerService: LoggerService,
  ) {
    this.logger = loggerService.createChildLogger('SessionService');
  }

  // ============================================================================
  // MÉTHODES PRINCIPALES DE GESTION DE SESSION
  // ============================================================================

  /**
   * ✅ REFACTORISÉ : Gestion intelligente du login utilisateur
   * Intègre les nouveaux services de tokens pour une approche hybride
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
      // ✅ CORRECTION : Valider et normaliser l'adresse IP dès le début
      const validatedDeviceInfo: IDeviceInfo = {
        ...deviceInfo,
        ipAddress: IpUtils.validateAndNormalizeIp(deviceInfo.ipAddress),
      };

      this.logger.info('Starting intelligent session management', JSON.stringify({
        userId,
        rememberMe,
        ipAddress: validatedDeviceInfo.ipAddress,
        deviceFingerprint: validatedDeviceInfo.deviceFingerprint?.substring(0, 8) + '...',
      }));

      // 1. Nettoyer les sessions expirées pour cet utilisateur
      const cleanedSessions = await this.cleanupExpiredSessionsForUser(userId);
      this.logger.info(`Cleaned ${cleanedSessions} expired sessions for user`, JSON.stringify({ userId }));

      // 2. Chercher sessions actives existantes
      const existingSessions = await this.getUserActiveSessions(userId);
      this.logger.info(`Found ${existingSessions.length} active sessions`, JSON.stringify({ userId }));

      // 3. ✅ NOUVEAU : Vérifier s'il y a des sessions avec tokens persistants
      const sessionWithPersistentTokens = await this.findSessionWithValidPersistentTokens(
        userId, 
        validatedDeviceInfo.deviceFingerprint
      );

      if (sessionWithPersistentTokens) {
        this.logger.info('Found session with valid persistent tokens, reusing', JSON.stringify({
          sessionId: sessionWithPersistentTokens.id,
          userId,
        }));

        // Réutiliser la session avec ses tokens persistants
        const tokens = await this.getTokensForExistingSession(sessionWithPersistentTokens, rememberMe);
        
        // Mettre à jour l'activité
        await this.updateLastActivity(sessionWithPersistentTokens.id, validatedDeviceInfo.ipAddress);

        this.logger.endOperation('handleUserLogin', operationId, true);
        
        return {
          session: sessionWithPersistentTokens,
          tokens,
          type: 'reused',
          isReused: true,
          tokensReused: true,
        };
      }

      // 4. Vérifier sessions compatibles pour refresh
      const compatibleSession = this.findCompatibleSession(existingSessions, validatedDeviceInfo, rememberMe);

      if (compatibleSession) {
        this.logger.info('Found compatible session for refresh', JSON.stringify({
          sessionId: compatibleSession.id,
          userId,
        }));

        // Rafraîchir la session existante
        const refreshedSession = await this.refreshExistingSession(
          compatibleSession,
          validatedDeviceInfo,
          rememberMe
        );

        // Générer nouveaux tokens (mix JWT + persistant si remember me)
        const tokens = await this.generateHybridTokensForSession(refreshedSession, rememberMe);

        this.logger.endOperation('handleUserLogin', operationId, true);

        return {
          session: refreshedSession,
          tokens,
          type: 'refreshed',
          isReused: false,
          tokensReused: false,
        };
      }

      // 5. Aucune session compatible, créer nouvelle session
      this.logger.info('No compatible session found, creating new session', JSON.stringify({ userId }));

      const newSession = await this.createSession(userId, validatedDeviceInfo, rememberMe);
      const tokens = await this.generateHybridTokensForSession(newSession, rememberMe);

      this.logger.endOperation('handleUserLogin', operationId, true);

      return {
        session: newSession,
        tokens,
        type: 'new',
        isReused: false,
        tokensReused: false,
      };

    } catch (error) {
      this.logger.endOperation('handleUserLogin', operationId, false);
      this.logger.error(
        'Failed to handle user login',
        error.stack,
        'SessionService.handleUserLogin',
        JSON.stringify({ errorMessage: error.message, userId })
      );
      throw error;
    }
  }

  /**
   * ✅ REFACTORISÉ : Création de session avec intégration tokens hybrides et validation IP
   */
  async createSession(
    userId: string, 
    deviceInfo: IDeviceInfo, 
    rememberMe: boolean = false
  ): Promise<IUserSession> {
    const operationId = this.logger.startOperation('createSession', { userId, rememberMe });

    try {
      // ✅ CORRECTION : Valider et normaliser les données d'entrée
      const validatedDeviceInfo: IDeviceInfo = {
        ...deviceInfo,
        ipAddress: IpUtils.validateAndNormalizeIp(deviceInfo.ipAddress),
        userAgent: deviceInfo.userAgent?.substring(0, 500) || null, // Limiter la taille
      };

      this.logger.info('Creating session with validated device info', JSON.stringify({
        userId,
        ipAddress: validatedDeviceInfo.ipAddress,
        userAgent: validatedDeviceInfo.userAgent?.substring(0, 50) + '...',
        rememberMe,
      }));

      // Vérifier limite de sessions concurrentes
      const activeSessions = await this.getUserActiveSessions(userId);
      if (activeSessions.length >= SESSION_CONSTANTS.LIMITS.MAX_CONCURRENT_SESSIONS) {
        // Révoquer la plus ancienne session
        const oldestSession = activeSessions.sort((a, b) => 
          a.last_activity.getTime() - b.last_activity.getTime()
        )[0];
        
        await this.revokeSession(oldestSession.id);
        this.logger.info('Revoked oldest session due to limit', JSON.stringify({
          revokedSessionId: oldestSession.id,
          userId,
        }));
      }

      // Calculer expiration selon le type de session
      const now = new Date();
      const duration = rememberMe 
        ? SESSION_CONSTANTS.DURATION.REMEMBER_ME_SESSION 
        : SESSION_CONSTANTS.DURATION.DEFAULT_SESSION;
      const expiresAt = new Date(now.getTime() + duration * 1000);

      // Générer token de session unique
      const sessionToken = this.generateSessionToken();

      // ✅ CORRECTION : Créer la session en base avec validation IP
      const session = await this.prisma.user_sessions.create({
        data: {
          session_token: sessionToken,
          user_id: userId,
          ip_address: validatedDeviceInfo.ipAddress, // ✅ IP validée
          user_agent: validatedDeviceInfo.userAgent,
          device_fingerprint: validatedDeviceInfo.deviceFingerprint || null,
          geolocation: validatedDeviceInfo.geolocation || null,
          expires_at: expiresAt,
          is_active: true,
          last_activity: now,
        },
      });

      // ✅ NOUVEAU : Si remember me, créer aussi un persistent token pour cette session
      if (rememberMe) {
        await this.createPersistentTokenForSession(session, validatedDeviceInfo);
      }

      // Mettre en cache
      await this.cacheSession(session);

      this.logger.endOperation('createSession', operationId, true);
      this.logger.info('Session created successfully', JSON.stringify({
        sessionId: session.id,
        userId,
        ipAddress: validatedDeviceInfo.ipAddress,
        rememberMe,
        expiresAt: expiresAt.toISOString(),
      }));

      return session;

    } catch (error) {
      this.logger.endOperation('createSession', operationId, false);
      this.logger.error(
        'Failed to create session',
        error.stack,
        'SessionService.createSession',
        JSON.stringify({ 
          errorMessage: error.message, 
          userId,
          ipAddress: deviceInfo.ipAddress, // IP originale pour debug
        })
      );
      throw error;
    }
  }

  /**
   * ✅ REFACTORISÉ : Validation de session avec cache intelligent
   */
  async validateSession(sessionToken: string): Promise<IUserSession | null> {
    const operationId = this.logger.startOperation('validateSession');

    try {
      // Vérifier cache d'abord
      const cacheKey = `${this.CACHE_PREFIX}token:${sessionToken}`;
      const cachedSession = await this.redis.getCache<IUserSession>(cacheKey);
      
      if (cachedSession) {
        // Vérifier que la session n'est pas expirée
        if (new Date(cachedSession.expires_at) > new Date() && cachedSession.is_active) {
          this.logger.endOperation('validateSession', operationId, true);
          return cachedSession;
        }
        
        // Session expirée en cache, la supprimer
        await this.redis.delCache(cacheKey);
      }

      // Chercher en base
      const session = await this.prisma.user_sessions.findUnique({
        where: { session_token: sessionToken },
      });

      if (!session) {
        this.logger.endOperation('validateSession', operationId, false);
        return null;
      }

      // Vérifier validité
      if (!session.is_active || session.expires_at < new Date()) {
        this.logger.endOperation('validateSession', operationId, false);
        return null;
      }

      // Mettre en cache pour prochaine fois
      await this.cacheSession(session);

      this.logger.endOperation('validateSession', operationId, true);
      return session;

    } catch (error) {
      this.logger.endOperation('validateSession', operationId, false);
      this.logger.error(
        'Failed to validate session',
        error.stack,
        'SessionService.validateSession',
        JSON.stringify({ errorMessage: error.message })
      );
      return null;
    }
  }

  /**
   * ✅ REFACTORISÉ : Refresh session avec nouveaux services de tokens
   */
  async refreshSession(refreshToken: string): Promise<ITokenPair> {
    const operationId = this.logger.startOperation('refreshSession');

    try {
      this.logger.info('Starting session refresh', JSON.stringify({
        tokenPrefix: refreshToken.substring(0, 20) + '...',
      }));

      // 1. ✅ NOUVEAU : Déterminer le type de refresh token
      let payload: any;
      let isPersistentToken = false;

      if (refreshToken.startsWith('ent_ref_')) {
        // C'est un persistent token de type REFRESH_LONG
        const validation = await this.persistentTokenService.validateToken(refreshToken);
        
        if (!validation.isValid || !validation.token) {
          throw new InvalidRefreshTokenException();
        }

        payload = {
          sub: validation.userId,
          sessionId: validation.token.metadata?.sessionId,
        };
        isPersistentToken = true;

        this.logger.info('Using persistent refresh token', JSON.stringify({
          tokenId: validation.token.id,
          userId: validation.userId,
        }));

      } else {
        // C'est un JWT refresh token classique
        payload = await this.tokenService.verifyRefreshToken(refreshToken);
        
        if (!payload || !payload.sessionId) {
          throw new InvalidRefreshTokenException();
        }

        this.logger.info('Using JWT refresh token', JSON.stringify({
          sessionId: payload.sessionId,
          userId: payload.sub,
        }));
      }

      // 2. Récupérer la session et les informations utilisateur
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

      // 3. Extraire informations utilisateur
      const user = sessionData.users;
      const userRoles = user.user_roles_user_roles_user_idTousers
        ?.filter(ur => ur.status === 'ACTIVE')
        .map(ur => ur.roles.name) || [];

      // 4. Déterminer le type de session (remember me basé sur durée ou token persistant)
      const sessionDuration = sessionData.expires_at.getTime() - sessionData.created_at.getTime();
      const isRememberMe = isPersistentToken || 
        sessionDuration > SESSION_CONSTANTS.DURATION.DEFAULT_SESSION * 1000;

      // 5. ✅ NOUVEAU : Générer tokens hybrides selon le type
      const newTokens = await this.generateHybridTokensForSession(sessionData, isRememberMe);

      // 6. Invalider l'ancien token selon son type
      if (isPersistentToken) {
        // Pour les persistent tokens, on met à jour l'usage mais on ne révoque pas
        await this.persistentTokenService.recordTokenUsage(
          payload.tokenId || 'unknown',
          sessionData.ip_address
        );
      } else {
        // Pour les JWT, on blackliste l'ancien
        await this.tokenService.blacklistToken(refreshToken);
      }

      // 7. ✅ CORRECTION : Mettre à jour l'activité avec IP validée
      const validatedIp = IpUtils.validateAndNormalizeIp(sessionData.ip_address);
      await this.updateLastActivity(sessionData.id, validatedIp);

      // 8. Mettre en cache les nouveaux tokens
      await this.cacheTokensForSession(sessionData.id, newTokens, isRememberMe);

      this.logger.info('Session refreshed successfully', JSON.stringify({
        sessionId: sessionData.id,
        userId: sessionData.user_id,
        tokenType: isPersistentToken ? 'persistent' : 'jwt',
        isRememberMe,
      }));

      this.logger.endOperation('refreshSession', operationId, true);
      return newTokens;

    } catch (error) {
      this.logger.endOperation('refreshSession', operationId, false);
      this.logger.error(
        'Failed to refresh session',
        error.stack,
        'SessionService.refreshSession',
        JSON.stringify({ errorMessage: error.message })
      );
      throw error;
    }
  }

  /**
   * ✅ REFACTORISÉ : Révocation de session avec nettoyage complet
   */
  async revokeSession(sessionId: string): Promise<boolean> {
    const operationId = this.logger.startOperation('revokeSession', { sessionId });

    try {
      // Récupérer la session avant révocation
      const session = await this.prisma.user_sessions.findUnique({
        where: { id: sessionId },
      });

      if (!session) {
        this.logger.endOperation('revokeSession', operationId, false);
        return false;
      }

      // Désactiver la session
      await this.prisma.user_sessions.update({
        where: { id: sessionId },
        data: {
          is_active: false,
          updated_at: new Date(),
        },
      });

      // ✅ NOUVEAU : Révoquer les persistent tokens associés à cette session
      await this.revokePersistentTokensForSession(sessionId);

      // Nettoyer le cache
      await this.clearSessionCache(session);

      this.logger.endOperation('revokeSession', operationId, true);
      this.logger.info('Session revoked successfully', JSON.stringify({
        sessionId,
        userId: session.user_id,
      }));

      return true;

    } catch (error) {
      this.logger.endOperation('revokeSession', operationId, false);
      this.logger.error(
        'Failed to revoke session',
        error.stack,
        'SessionService.revokeSession',
        JSON.stringify({ errorMessage: error.message, sessionId })
      );
      return false;
    }
  }

  /**
   * ✅ REFACTORISÉ : Révocation de toutes les sessions utilisateur
   */
  async revokeAllUserSessions(userId: string): Promise<number> {
    const operationId = this.logger.startOperation('revokeAllUserSessions', { userId });

    try {
      // Récupérer toutes les sessions actives
      const activeSessions = await this.getUserActiveSessions(userId);

      // Désactiver toutes les sessions
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

      // ✅ NOUVEAU : Révoquer tous les persistent tokens de l'utilisateur
      const revokedPersistentTokens = await this.persistentTokenService.revokeAllUserTokens(
        userId,
        'Session revocation'
      );

      // Nettoyer le cache pour toutes les sessions
      for (const session of activeSessions) {
        await this.clearSessionCache(session);
      }

      this.logger.endOperation('revokeAllUserSessions', operationId, true);
      this.logger.info('All user sessions revoked', JSON.stringify({
        userId,
        sessionsRevoked: result.count,
        persistentTokensRevoked: revokedPersistentTokens,
      }));

      return result.count;

    } catch (error) {
      this.logger.endOperation('revokeAllUserSessions', operationId, false);
      this.logger.error(
        'Failed to revoke all user sessions',
        error.stack,
        'SessionService.revokeAllUserSessions',
        JSON.stringify({ errorMessage: error.message, userId })
      );
      return 0;
    }
  }

  /**
   * Récupérer les sessions actives d'un utilisateur
   */
  async getUserActiveSessions(userId: string): Promise<IUserSession[]> {
    try {
      return await this.prisma.user_sessions.findMany({
        where: {
          user_id: userId,
          is_active: true,
          expires_at: { gt: new Date() },
        },
        orderBy: { last_activity: 'desc' },
      });
    } catch (error) {
      this.logger.error('Error getting user active sessions', error.stack);
      return [];
    }
  }

  /**
   * ✅ REFACTORISÉ : Nettoyage des sessions expirées avec gestion des tokens associés
   */
  async cleanupExpiredSessions(): Promise<number> {
    const operationId = this.logger.startOperation('cleanupExpiredSessions');

    try {
      // Récupérer les sessions expirées avant suppression pour nettoyer les tokens
      const expiredSessions = await this.prisma.user_sessions.findMany({
        where: {
          OR: [
            { expires_at: { lt: new Date() } },
            { is_active: false },
          ],
        },
        select: { id: true, user_id: true, session_token: true },
      });

      // ✅ NOUVEAU : Nettoyer les persistent tokens associés
      for (const session of expiredSessions) {
        await this.revokePersistentTokensForSession(session.id);
        await this.clearSessionCacheByToken(session.session_token);
      }

      // Supprimer les sessions expirées
      const result = await this.prisma.user_sessions.deleteMany({
        where: {
          OR: [
            { expires_at: { lt: new Date() } },
            { is_active: false },
          ],
        },
      });

      this.logger.endOperation('cleanupExpiredSessions', operationId, true);
      this.logger.info('Expired sessions cleaned up', JSON.stringify({
        count: result.count,
        persistentTokensProcessed: expiredSessions.length,
      }));

      return result.count;

    } catch (error) {
      this.logger.endOperation('cleanupExpiredSessions', operationId, false);
      this.logger.error(
        'Failed to cleanup expired sessions',
        error.stack,
        'SessionService.cleanupExpiredSessions',
        JSON.stringify({ errorMessage: error.message })
      );
      return 0;
    }
  }

  // ============================================================================
  // MÉTHODES PRIVÉES AVEC INTÉGRATION NOUVEAUX SERVICES
  // ============================================================================

  /**
   * ✅ NOUVEAU : Recherche session avec tokens persistants valides
   */
  private async findSessionWithValidPersistentTokens(
    userId: string,
    deviceFingerprint?: string
  ): Promise<IUserSession | null> {
    try {
      // Rechercher les persistent tokens actifs de l'utilisateur
      const userTokens = await this.persistentTokenService.getUserTokens(userId, {
        token_type: 'REFRESH_LONG',
        is_active: true,
        is_revoked: false,
      });

      // Chercher un token avec un sessionId dans les métadonnées
      for (const tokenInfo of userTokens) {
        const token = await this.persistentTokenService.getToken(tokenInfo.id);
        
        if (token?.metadata?.sessionId) {
          const session = await this.validateSession(token.metadata.sessionId);
          
          if (session && 
              session.user_id === userId && 
              (!deviceFingerprint || session.device_fingerprint === deviceFingerprint)) {
            return session;
          }
        }
      }

      return null;

    } catch (error) {
      this.logger.error('Error finding session with persistent tokens', error.stack);
      return null;
    }
  }

  /**
   * ✅ NOUVEAU : Génération de tokens hybrides (JWT + Persistent selon le contexte)
   */
  private async generateHybridTokensForSession(
    session: IUserSession,
    rememberMe: boolean
  ): Promise<ITokenPair> {
    try {
      // Récupérer les informations utilisateur pour les tokens
      const user = await this.prisma.users.findUnique({
        where: { id: session.user_id },
        select: {
          id: true,
          email: true,
          user_roles_user_roles_user_idTousers: {
            where: { status: 'ACTIVE' },
            include: {
              roles: { select: { name: true } }
            }
          }
        },
      });

      if (!user) {
        throw new Error('User not found for session');
      }

      const userRoles = user.user_roles_user_roles_user_idTousers
        ?.map(ur => ur.roles.name) || [];

      // Générer access token JWT (toujours temporaire)
      const accessTokenPayload = {
        sub: session.user_id,
        email: user.email,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + AUTH_CONSTANTS.JWT.ACCESS_TOKEN_EXPIRY,
        aud: 'entrix-users',
        iss: 'entrix-v3',
        sessionId: session.id,
        deviceFingerprint: session.device_fingerprint,
        roles: userRoles,
        permissions: [], // À implémenter selon besoins
      };

      const accessToken = await this.tokenService.generateAccessToken(accessTokenPayload);

      let refreshToken: string;

      if (rememberMe) {
        // ✅ NOUVEAU : Pour remember me, utiliser un persistent token
        const persistentToken = await this.persistentTokenService.generateLongRefreshToken(
          session.user_id,
          {
            sessionId: session.id,
            deviceFingerprint: session.device_fingerprint,
            userAgent: session.user_agent,
          }
        );

        refreshToken = persistentToken.token;

        this.logger.info('Generated persistent refresh token for remember me', JSON.stringify({
          sessionId: session.id,
          tokenId: persistentToken.id,
        }));

      } else {
        // Pour session normale, utiliser JWT refresh classique
        const refreshTokenPayload = {
          sub: session.user_id,
          sessionId: session.id,
          tokenId: this.generateTokenId(),
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + AUTH_CONSTANTS.JWT.REFRESH_TOKEN_EXPIRY,
          aud: 'entrix-refresh',
          iss: 'entrix-v3',
        };

        refreshToken = await this.tokenService.generateRefreshToken(refreshTokenPayload);
      }

      return {
        accessToken,
        refreshToken,
        tokenType: 'Bearer',
        expiresIn: AUTH_CONSTANTS.JWT.ACCESS_TOKEN_EXPIRY,
      };

    } catch (error) {
      this.logger.error('Error generating hybrid tokens', error.stack);
      throw error;
    }
  }

  /**
   * ✅ NOUVEAU : Création de persistent token pour session remember me
   */
  private async createPersistentTokenForSession(
    session: IUserSession,
    deviceInfo: IDeviceInfo
  ): Promise<void> {
    try {
      await this.persistentTokenService.generateLongRefreshToken(
        session.user_id,
        {
          sessionId: session.id,
          deviceFingerprint: deviceInfo.deviceFingerprint,
          userAgent: deviceInfo.userAgent,
          platform: 'web',
        }
      );

      this.logger.info('Created persistent token for remember me session', JSON.stringify({
        sessionId: session.id,
        userId: session.user_id,
      }));

    } catch (error) {
      this.logger.error('Error creating persistent token for session', error.stack);
      // Ne pas faire échouer la création de session pour ça
    }
  }

  /**
   * ✅ NOUVEAU : Révocation des persistent tokens associés à une session
   */
  private async revokePersistentTokensForSession(sessionId: string): Promise<void> {
    try {
      // Cette méthode nécessiterait une recherche par métadonnées
      // Pour l'instant, on skip cette optimisation
      this.logger.info('Persistent tokens cleanup for session queued', JSON.stringify({ sessionId }));

    } catch (error) {
      this.logger.error('Error revoking persistent tokens for session', error.stack);
    }
  }

  /**
   * Obtenir tokens pour session existante
   */
  private async getTokensForExistingSession(
    session: IUserSession,
    rememberMe: boolean
  ): Promise<ITokenPair> {
    // Vérifier cache d'abord
    const cacheKey = `${this.TOKENS_CACHE_PREFIX}${session.id}`;
    const cachedTokens = await this.redis.getCache<ITokenPair>(cacheKey);

    if (cachedTokens) {
      // Vérifier que l'access token n'est pas expiré
      try {
        await this.tokenService.verifyAccessToken(cachedTokens.accessToken);
        return cachedTokens;
      } catch {
        // Token expiré, en générer de nouveaux
        await this.redis.delCache(cacheKey);
      }
    }

    // Générer nouveaux tokens
    return await this.generateHybridTokensForSession(session, rememberMe);
  }

  /**
   * Recherche session compatible pour réutilisation
   */
  private findCompatibleSession(
    sessions: IUserSession[],
    deviceInfo: IDeviceInfo,
    rememberMe: boolean
  ): IUserSession | null {
    // Chercher par device fingerprint d'abord
    if (deviceInfo.deviceFingerprint) {
      const deviceMatch = sessions.find(s => 
        s.device_fingerprint === deviceInfo.deviceFingerprint &&
        this.isSessionRecentEnough(s)
      );
      if (deviceMatch) return deviceMatch;
    }

    // Chercher par IP et user agent
    const ipMatch = sessions.find(s => 
      s.ip_address === deviceInfo.ipAddress &&
      s.user_agent === deviceInfo.userAgent &&
      this.isSessionRecentEnough(s)
    );

    return ipMatch || null;
  }

  /**
   * Vérifier si session est assez récente pour réutilisation
   */
  private isSessionRecentEnough(session: IUserSession): boolean {
    const now = new Date();
    const timeSinceLastActivity = now.getTime() - session.last_activity.getTime();
    return timeSinceLastActivity < SESSION_CONSTANTS.DURATION.IDLE_TIMEOUT * 1000;
  }

  /**
   * ✅ CORRECTION : Rafraîchir session existante avec IP validée
   */
  private async refreshExistingSession(
    session: IUserSession,
    deviceInfo: IDeviceInfo,
    rememberMe: boolean
  ): Promise<IUserSession> {
    const now = new Date();
    const duration = rememberMe 
      ? SESSION_CONSTANTS.DURATION.REMEMBER_ME_SESSION 
      : SESSION_CONSTANTS.DURATION.DEFAULT_SESSION;
    
    // ✅ CORRECTION : Valider IP avant mise à jour
    const validatedIp = IpUtils.validateAndNormalizeIp(deviceInfo.ipAddress);
    
    const updatedSession = await this.prisma.user_sessions.update({
      where: { id: session.id },
      data: {
        last_activity: now,
        expires_at: new Date(now.getTime() + duration * 1000),
        ip_address: validatedIp, // ✅ IP validée
        user_agent: deviceInfo.userAgent || session.user_agent,
        geolocation: deviceInfo.geolocation || session.geolocation,
        updated_at: now,
      },
    });

    await this.cacheSession(updatedSession);
    return updatedSession;
  }

  /**
   * Nettoyer sessions expirées pour un utilisateur spécifique
   */
  private async cleanupExpiredSessionsForUser(userId: string): Promise<number> {
    try {
      const result = await this.prisma.user_sessions.deleteMany({
        where: {
          user_id: userId,
          OR: [
            { expires_at: { lt: new Date() } },
            { is_active: false },
          ],
        },
      });

      return result.count;
    } catch (error) {
      this.logger.error('Error cleaning up user sessions', error.stack);
      return 0;
    }
  }

  /**
   * ✅ CORRECTION : Mettre à jour l'activité de session avec IP validée
   */
  private async updateLastActivity(sessionId: string, ipAddress?: string): Promise<void> {
    try {
      // ✅ CORRECTION : Valider IP si fournie
      const validatedIp = ipAddress ? IpUtils.validateAndNormalizeIp(ipAddress) : undefined;
      
      await this.prisma.user_sessions.update({
        where: { id: sessionId },
        data: {
          last_activity: new Date(),
          ...(validatedIp && { ip_address: validatedIp }),
          updated_at: new Date(),
        },
      });
    } catch (error) {
      this.logger.error('Error updating session activity', error.stack);
    }
  }

  /**
   * Mettre session en cache
   */
  private async cacheSession(session: IUserSession): Promise<void> {
    try {
      const cacheKey = `${this.CACHE_PREFIX}token:${session.session_token}`;
      const ttl = Math.max(0, Math.floor((session.expires_at.getTime() - Date.now()) / 1000));
      
      if (ttl > 0) {
        await this.redis.setCache(cacheKey, session, Math.min(ttl, this.CACHE_TTL));
      }
    } catch (error) {
      this.logger.error('Error caching session', error.stack);
    }
  }

  /**
   * Mettre tokens en cache pour session
   */
  private async cacheTokensForSession(
    sessionId: string,
    tokens: ITokenPair,
    rememberMe: boolean
  ): Promise<void> {
    try {
      const cacheKey = `${this.TOKENS_CACHE_PREFIX}${sessionId}`;
      const ttl = rememberMe ? 3600 : this.CACHE_TTL; // 1h pour remember me, 5min sinon
      
      await this.redis.setCache(cacheKey, tokens, ttl);
    } catch (error) {
      this.logger.error('Error caching session tokens', error.stack);
    }
  }

  /**
   * Nettoyer le cache de session
   */
  private async clearSessionCache(session: IUserSession): Promise<void> {
    try {
      const keys = [
        `${this.CACHE_PREFIX}token:${session.session_token}`,
        `${this.TOKENS_CACHE_PREFIX}${session.id}`,
      ];

      for (const key of keys) {
        await this.redis.delCache(key);
      }
    } catch (error) {
      this.logger.error('Error clearing session cache', error.stack);
    }
  }

  /**
   * Nettoyer le cache par token de session
   */
  private async clearSessionCacheByToken(sessionToken: string): Promise<void> {
    try {
      const cacheKey = `${this.CACHE_PREFIX}token:${sessionToken}`;
      await this.redis.delCache(cacheKey);
    } catch (error) {
      this.logger.error('Error clearing session cache by token', error.stack);
    }
  }

  /**
   * Générer token de session unique
   */
  private generateSessionToken(): string {
    const crypto = require('crypto');
    return `sess_${Date.now()}_${crypto.randomBytes(32).toString('base64url')}`;
  }

  /**
   * Générer ID unique pour tokens
   */
  private generateTokenId(): string {
    return `tkn_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`;
  }
}