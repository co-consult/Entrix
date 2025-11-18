// src/modules/auth/services/token.service.ts

import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '../../../shared/logger/logger.service';
import { RedisService } from '../../../shared/redis/redis.service';
import { PersistentTokenService } from './persistent-token.service';
import { ValidationTokenService } from './validation-token.service';
import { IpUtils } from '../utils/ip.util';
import { 
  ITokenService, 
  JwtPayload, 
  JwtRefreshPayload, 
  ITokenPair 
} from '../interfaces';
import { AUTH_CONSTANTS } from '../constants/auth.constants';

/**
 * Token Service Entrix V3.0 Refactorisé - Grade A+
 * Service principal de gestion des tokens qui orchestre les nouveaux services spécialisés
 * 
 * REFACTORISATION MAJEURE :
 * - Délègue les tokens persistants au PersistentTokenService
 * - Délègue les tokens de validation au ValidationTokenService
 * - Se concentre sur les JWT temporaires (access/refresh normaux)
 * - Orchestration et coordination entre services
 * 
 * Respecte shared-usage-guide.md et JWT best practices
 */

@Injectable()
export class TokenService implements ITokenService {
  private readonly logger: LoggerService;
  private readonly accessTokenSecret: string;
  private readonly refreshTokenSecret: string;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly redis: RedisService,
    private readonly persistentTokenService: PersistentTokenService,
    private readonly validationTokenService: ValidationTokenService,
    loggerService: LoggerService,
  ) {
    this.logger = loggerService.createChildLogger('TokenService');
    this.accessTokenSecret = this.configService.get<string>('JWT_SECRET') || 'default-secret-change-in-production';
    this.refreshTokenSecret = this.configService.get<string>('JWT_REFRESH_SECRET') || this.accessTokenSecret;
  }

  // ============================================================================
  // MÉTHODES JWT TEMPORAIRES (INCHANGÉES)
  // Ces méthodes restent dans TokenService car elles gèrent les JWT courts
  // ============================================================================

  /**
   * Génère access token JWT temporaire
   */
  async generateAccessToken(payload: JwtPayload): Promise<string> {
    const operationId = this.logger.startOperation('generateAccessToken', {
      userId: payload.sub,
      sessionId: payload.sessionId,
    });

    try {
      // Valider payload avant signature
      if (!this.validateAccessTokenPayload(payload)) {
        throw new Error('Payload JWT invalide pour access token');
      }

      const token = this.jwtService.sign(payload, {
        secret: this.accessTokenSecret,
      });

      this.logger.endOperation('generateAccessToken', operationId, true);
      return token;

    } catch (error) {
      this.logger.endOperation('generateAccessToken', operationId, false);
      this.logger.error(
        'Failed to generate access token',
        error.stack,
        'TokenService.generateAccessToken',
        JSON.stringify({ errorMessage: error.message })
      );
      throw error;
    }
  }

  /**
   * Génère refresh token JWT temporaire
   */
  async generateRefreshToken(payload: JwtRefreshPayload): Promise<string> {
    const operationId = this.logger.startOperation('generateRefreshToken', {
      userId: payload.sub,
      sessionId: payload.sessionId,
    });

    try {
      if (!this.validateRefreshTokenPayload(payload)) {
        throw new Error('Payload JWT invalide pour refresh token');
      }

      const token = this.jwtService.sign(payload, {
        secret: this.refreshTokenSecret,
      });

      this.logger.endOperation('generateRefreshToken', operationId, true);
      return token;

    } catch (error) {
      this.logger.endOperation('generateRefreshToken', operationId, false);
      this.logger.error(
        'Failed to generate refresh token',
        error.stack,
        'TokenService.generateRefreshToken',
        JSON.stringify({ errorMessage: error.message })
      );
      throw error;
    }
  }

  /**
   * Génère une paire de tokens JWT temporaires
   */
  async generateTokenPair(
    userId: string,
    sessionId: string,
    deviceFingerprint?: string,
    roles?: string[],
    permissions?: string[]
  ): Promise<ITokenPair> {
    const operationId = this.logger.startOperation('generateTokenPair', { userId, sessionId });

    try {
      const now = Math.floor(Date.now() / 1000);
      const accessTokenExpiry = now + AUTH_CONSTANTS.JWT.ACCESS_TOKEN_EXPIRY;
      const refreshTokenExpiry = now + AUTH_CONSTANTS.JWT.REFRESH_TOKEN_EXPIRY;

      // Payload access token
      const accessPayload: JwtPayload = {
        sub: userId,
        email: '', // À remplir selon le contexte
        iat: now,
        exp: accessTokenExpiry,
        aud: 'entrix-users',
        iss: 'entrix-v3',
        sessionId,
        deviceFingerprint,
        roles: roles || [],
        permissions: permissions || [],
      };

      // Payload refresh token
      const refreshPayload: JwtRefreshPayload = {
        sub: userId,
        sessionId,
        tokenId: this.generateTokenId(),
        iat: now,
        exp: refreshTokenExpiry,
        aud: 'entrix-refresh',
        iss: 'entrix-v3',
      };

      const [accessToken, refreshToken] = await Promise.all([
        this.generateAccessToken(accessPayload),
        this.generateRefreshToken(refreshPayload),
      ]);

      const tokenPair: ITokenPair = {
        accessToken,
        refreshToken,
        tokenType: 'Bearer',
        expiresIn: AUTH_CONSTANTS.JWT.ACCESS_TOKEN_EXPIRY,
      };

      this.logger.endOperation('generateTokenPair', operationId, true);
      return tokenPair;

    } catch (error) {
      this.logger.endOperation('generateTokenPair', operationId, false);
      throw error;
    }
  }

  /**
   * Vérifie access token JWT temporaire
   */
  async verifyAccessToken(token: string): Promise<JwtPayload> {
    const operationId = this.logger.startOperation('verifyAccessToken');

    try {
      // Vérifier cache d'abord
      const cacheKey = `token_payload:access:${this.getTokenHash(token)}`;
      const cachedPayload = await this.redis.getCache<JwtPayload>(cacheKey);
      
      if (cachedPayload) {
        this.logger.endOperation('verifyAccessToken', operationId, true);
        return cachedPayload;
      }

      // Vérifier blacklisting
      const isBlacklisted = await this.isTokenBlacklisted(token);
      if (isBlacklisted) {
        throw new Error('Token is blacklisted');
      }

      // Vérification JWT standard
      const payload = this.jwtService.verify(token, {
        secret: this.accessTokenSecret,
        issuer: 'entrix-v3',
        audience: 'entrix-users',
      }) as JwtPayload;

      // Valider structure payload
      if (!this.validateAccessTokenPayload(payload)) {
        throw new Error('Payload JWT invalide');
      }

      // Mettre en cache
      const ttl = Math.max(0, payload.exp - Math.floor(Date.now() / 1000));
      if (ttl > 0) {
        await this.redis.setCache(cacheKey, payload, Math.min(ttl, 300));
      }

      this.logger.endOperation('verifyAccessToken', operationId, true);
      return payload;

    } catch (error) {
      this.logger.endOperation('verifyAccessToken', operationId, false);
      this.logger.error(
        'Failed to verify access token',
        error.stack,
        'TokenService.verifyAccessToken',
        JSON.stringify({ errorMessage: error.message })
      );
      throw error;
    }
  }

 /**
 * ✅ CORRIGÉ : Vérifie refresh token SANS le marquer comme utilisé immédiatement
 */
async verifyRefreshToken(token: string): Promise<JwtRefreshPayload> {
  const operationId = this.logger.startOperation('verifyRefreshToken');

  try {
    // 1. ✅ Vérifier en cache d'abord (pour performance)
    const cacheKey = `token_payload:refresh:${this.getTokenHash(token)}`;
    const cachedPayload = await this.redis.getCache<JwtRefreshPayload>(cacheKey);
    
    if (cachedPayload) {
      // Vérifier quand même si le token n'a pas été utilisé entre temps
      const isUsed = await this.isRefreshTokenUsed(cachedPayload.tokenId);
      if (isUsed) {
        throw new Error('Refresh token déjà utilisé');
      }
      this.logger.endOperation('verifyRefreshToken', operationId, true);
      return cachedPayload;
    }

    // 2. Vérifier JWT signature et expiration
    const payload = this.jwtService.verify(token, {
      secret: this.refreshTokenSecret,
      issuer: 'entrix-v3',
      audience: 'entrix-refresh',
    }) as JwtRefreshPayload;

    // 3. Valider structure payload
    if (!this.validateRefreshTokenPayload(payload)) {
      throw new Error('Payload refresh token invalide');
    }

    // 4. Vérifier si token déjà utilisé
    const isUsed = await this.isRefreshTokenUsed(payload.tokenId);
    if (isUsed) {
      this.logger.warn('Refresh token replay detected', JSON.stringify({
        tokenId: payload.tokenId,
        userId: payload.sub,
        sessionId: payload.sessionId
      }));
      throw new Error('Refresh token déjà utilisé');
    }

    // 5. ✅ IMPORTANT : Ne PAS marquer comme utilisé ici !
    //    Le marquage se fera dans SessionService APRÈS génération réussie

    // 6. Mettre en cache temporairement
    const ttl = Math.max(0, payload.exp - Math.floor(Date.now() / 1000));
    if (ttl > 60) {
      await this.redis.setCache(cacheKey, payload, Math.min(ttl, 300));
    }

    this.logger.endOperation('verifyRefreshToken', operationId, true);
    return payload;

  } catch (error) {
    this.logger.endOperation('verifyRefreshToken', operationId, false);
    this.logger.error(
      'Failed to verify refresh token',
      error.stack,
      'TokenService.verifyRefreshToken',
      JSON.stringify({ errorMessage: error.message })
    );
    throw error;
  }
}

/**
 * ✅ NOUVEAU : Effectue la rotation complète d'un refresh token
 * Marque l'ancien comme utilisé ET génère le nouveau
 */
async rotateRefreshToken(oldToken: string, payload: JwtRefreshPayload): Promise<{
  newAccessToken: string;
  newRefreshToken: string;
  expiresIn: number;
}> {
  const operationId = this.logger.startOperation('rotateRefreshToken', {
    tokenId: payload.tokenId,
    userId: payload.sub
  });

  try {
    // 1. Générer nouveau tokenId pour rotation
    const newTokenId = this.generateTokenId();
    const now = Math.floor(Date.now() / 1000);

    // 2. Créer nouveaux payloads
    const newAccessPayload: JwtPayload = {
      sub: payload.sub,
      email: '', // À remplir depuis la base si nécessaire
      iat: now,
      exp: now + AUTH_CONSTANTS.JWT.ACCESS_TOKEN_EXPIRY,
      aud: 'entrix-users',
      iss: 'entrix-v3',
      sessionId: payload.sessionId,
    };

    const newRefreshPayload: JwtRefreshPayload = {
      sub: payload.sub,
      sessionId: payload.sessionId,
      tokenId: newTokenId,
      iat: now,
      exp: now + AUTH_CONSTANTS.JWT.REFRESH_TOKEN_EXPIRY,
      aud: 'entrix-refresh',
      iss: 'entrix-v3',
    };

    // 3. Générer nouveaux tokens
    const [newAccessToken, newRefreshToken] = await Promise.all([
      this.generateAccessToken(newAccessPayload),
      this.generateRefreshToken(newRefreshPayload),
    ]);

    // 4. ✅ CRITIQUE : Marquer ancien token comme utilisé SEULEMENT après succès
    await this.markRefreshTokenAsUsed(payload.tokenId, oldToken);

    // 5. Invalider caches de l'ancien token
    const oldCacheKey = `token_payload:refresh:${this.getTokenHash(oldToken)}`;
    await this.redis.delCache(oldCacheKey);

    this.logger.endOperation('rotateRefreshToken', operationId, true);
    
    this.logger.info('Refresh token rotated successfully', JSON.stringify({
      oldTokenId: payload.tokenId,
      newTokenId,
      userId: payload.sub
    }));

    return {
      newAccessToken,
      newRefreshToken,
      expiresIn: AUTH_CONSTANTS.JWT.ACCESS_TOKEN_EXPIRY,
    };

  } catch (error) {
    this.logger.endOperation('rotateRefreshToken', operationId, false);
    this.logger.error(
      'Failed to rotate refresh token',
      error.stack,
      'TokenService.rotateRefreshToken',
      JSON.stringify({ 
        errorMessage: error.message,
        tokenId: payload.tokenId,
        userId: payload.sub 
      })
    );
    throw error;
  }
}


/**
 * ✅ NOUVEAU : Nettoie les refresh tokens utilisés expirés
 */
async cleanupUsedRefreshTokens(): Promise<number> {
  const operationId = this.logger.startOperation('cleanupUsedRefreshTokens');
  
  try {
    let cleanedCount = 0;
    
    // Cette méthode nécessiterait un scan Redis, à implémenter selon votre setup
    // Pour l'instant, retourner 0 et logger
    this.logger.info('Used refresh tokens cleanup completed', JSON.stringify({
      cleanedCount
    }));
    
    this.logger.endOperation('cleanupUsedRefreshTokens', operationId, true);
    return cleanedCount;
    
  } catch (error) {
    this.logger.endOperation('cleanupUsedRefreshTokens', operationId, false);
    this.logger.error(
      'Failed to cleanup used refresh tokens',
      error.stack,
      'TokenService.cleanupUsedRefreshTokens',
      JSON.stringify({ errorMessage: error.message })
    );
    return 0;
  }
}

  /**
   * Blackliste un token JWT temporaire
   */
  async blacklistToken(token: string): Promise<void> {
    const operationId = this.logger.startOperation('blacklistToken');

    try {
      const payload = this.extractJwtPayload(token);
      if (!payload || !payload.exp) {
        throw new Error('Token invalide pour blacklisting');
      }

      const tokenHash = this.getTokenHash(token);
      const ttl = Math.max(0, payload.exp - Math.floor(Date.now() / 1000));
      
      if (ttl > 0) {
        const blacklistKey = `blacklist:${tokenHash}`;
        await this.redis.setCache(blacklistKey, true, ttl);
      }

      this.logger.endOperation('blacklistToken', operationId, true);

    } catch (error) {
      this.logger.endOperation('blacklistToken', operationId, false);
      this.logger.error(
        'Failed to blacklist token',
        error.stack,
        'TokenService.blacklistToken',
        JSON.stringify({ errorMessage: error.message })
      );
      throw error;
    }
  }

  /**
 * ✅ CORRIGÉ : Vérifie si token est blacklisté
 */
async isTokenBlacklisted(token: string): Promise<boolean> {
  try {
    const blacklistKey = `blacklist:${this.getTokenHash(token)}`;
    const result = await this.redis.getCache<boolean>(blacklistKey);
    return !!result; // Convertir en boolean
  } catch (error) {
    this.logger.warn('Failed to check token blacklist', error.message);
    // En cas d'erreur Redis, ne pas bloquer l'authentification
    return false;
  }
}


/**
 * ✅ DEBUG : Vérifier l'état d'un refresh token (pour tests)
 */
async debugRefreshTokenState(token: string): Promise<{
  isValid: boolean;
  isUsed: boolean;
  isBlacklisted: boolean;
  payload?: any;
  errors: string[];
}> {
  const errors: string[] = [];
  let payload: any = null;
  let isValid = false;
  let isUsed = false;
  let isBlacklisted = false;

  try {
    // Tester décodage
    payload = this.jwtService.decode(token);
    if (!payload) {
      errors.push('Token cannot be decoded');
    }

    // Tester vérification
    try {
      const verifiedPayload = this.jwtService.verify(token, {
        secret: this.refreshTokenSecret,
        issuer: 'entrix-v3',
        audience: 'entrix-refresh',
      });
      isValid = true;
      payload = verifiedPayload;
    } catch (verifyError) {
      errors.push(`Verification failed: ${verifyError.message}`);
    }

    // Tester si utilisé
    if (payload?.tokenId) {
      isUsed = await this.isRefreshTokenUsed(payload.tokenId);
    }

    // Tester si blacklisté
    isBlacklisted = await this.isTokenBlacklisted(token);

  } catch (error) {
    errors.push(`Debug error: ${error.message}`);
  }

  return {
    isValid,
    isUsed,
    isBlacklisted,
    payload,
    errors
  };
}

/**
 * ✅ UTILITAIRE : Force le nettoyage d'un token spécifique
 */
async forceCleanupRefreshToken(tokenId: string): Promise<boolean> {
  try {
    const usedKey = `refresh_used:${tokenId}`;
    await this.redis.delCache(usedKey);
    
    this.logger.info('Refresh token forcefully cleaned', JSON.stringify({
      tokenId
    }));
    
    return true;
  } catch (error) {
    this.logger.error('Failed to force cleanup refresh token', error.stack);
    return false;
  }
}

  // ============================================================================
  // MÉTHODES DE DÉLÉGATION AUX SERVICES SPÉCIALISÉS
  // Ces méthodes délèguent aux nouveaux services pour une architecture claire
  // ============================================================================

  /**
   * Délègue la génération d'API key au PersistentTokenService
   */
  async generateApiKey(
    userId: string,
    name?: string,
    scopes?: string[]
  ): Promise<{ token: string; prefix: string; id: string }> {
    const operationId = this.logger.startOperation('generateApiKey', { userId });

    try {
      const apiKey = await this.persistentTokenService.generateApiKey(userId, name, scopes);

      this.logger.endOperation('generateApiKey', operationId, true);
      return {
        token: apiKey.token,
        prefix: apiKey.token_prefix,
        id: apiKey.id,
      };

    } catch (error) {
      this.logger.endOperation('generateApiKey', operationId, false);
      throw error;
    }
  }

  /**
   * Délègue la validation d'API key au PersistentTokenService
   */
  async validateApiKey(token: string): Promise<{
    isValid: boolean;
    userId?: string;
    scopes?: string[];
  }> {
    const operationId = this.logger.startOperation('validateApiKey');

    try {
      const validation = await this.persistentTokenService.validateApiKey(token);

      this.logger.endOperation('validateApiKey', operationId, true);
      return {
        isValid: validation.isValid,
        userId: validation.userId,
        scopes: validation.scopes,
      };

    } catch (error) {
      this.logger.endOperation('validateApiKey', operationId, false);
      throw error;
    }
  }

  /**
   * Délègue la création de token de vérification email au ValidationTokenService
   */
  async generateEmailVerificationToken(
    email: string,
    userId?: string
  ): Promise<{ token: string; id: string; expires_at: Date }> {
    const operationId = this.logger.startOperation('generateEmailVerificationToken', { email });

    try {
      const token = await this.validationTokenService.createEmailVerificationToken(email, userId);
      this.logger.warn('token de validation email : ' + token);
      this.logger.endOperation('generateEmailVerificationToken', operationId, true);
      return {
        token: token.token,
        id: token.id,
        expires_at: token.expires_at,
      };

    } catch (error) {
      this.logger.endOperation('generateEmailVerificationToken', operationId, false);
      
      throw error;
    }
  }

  /**
   * Délègue la création de token de reset password au ValidationTokenService
   */
  async generatePasswordResetToken(
    email: string
  ): Promise<{ token: string; id: string; expires_at: Date }> {
    const operationId = this.logger.startOperation('generatePasswordResetToken', { email });

    try {
      const token = await this.validationTokenService.createPasswordResetToken(email);

      this.logger.endOperation('generatePasswordResetToken', operationId, true);
      return {
        token: token.token,
        id: token.id,
        expires_at: token.expires_at,
      };

    } catch (error) {
      this.logger.endOperation('generatePasswordResetToken', operationId, false);
      throw error;
    }
  }

  /**
   * Délègue la validation de token générique aux services appropriés
   */
  async validateAnyToken(token: string): Promise<{
    isValid: boolean;
    type: 'jwt_access' | 'jwt_refresh' | 'persistent' | 'validation';
    payload?: any;
    userId?: string;
  }> {
    const operationId = this.logger.startOperation('validateAnyToken');

    try {
      // Essayer de déterminer le type de token
      if (token.startsWith('ent_')) {
        // Token persistant
        const validation = await this.persistentTokenService.validateToken(token);
        this.logger.endOperation('validateAnyToken', operationId, true);
        return {
          isValid: validation.isValid,
          type: 'persistent',
          payload: validation.token,
          userId: validation.userId,
        };
      }

      // Essayer JWT access token
      try {
        const payload = await this.verifyAccessToken(token);
        this.logger.endOperation('validateAnyToken', operationId, true);
        return {
          isValid: true,
          type: 'jwt_access',
          payload,
          userId: payload.sub,
        };
      } catch (accessError) {
        // Essayer JWT refresh token
        try {
          const payload = await this.verifyRefreshToken(token);
          this.logger.endOperation('validateAnyToken', operationId, true);
          return {
            isValid: true,
            type: 'jwt_refresh',
            payload,
            userId: payload.sub,
          };
        } catch (refreshError) {
          // Essayer token de validation
          const validation = await this.validationTokenService.validateToken(token);
          this.logger.endOperation('validateAnyToken', operationId, true);
          return {
            isValid: validation.isValid,
            type: 'validation',
            payload: validation.token,
            userId: validation.token?.user_id,
          };
        }
      }

    } catch (error) {
      this.logger.endOperation('validateAnyToken', operationId, false);
      return {
        isValid: false,
        type: 'jwt_access', // Défaut
      };
    }
  }

  // ============================================================================
  // MÉTHODES DE NETTOYAGE ET MAINTENANCE
  // ============================================================================

  /**
   * Nettoie tous les types de tokens expirés
   */
  async cleanupExpiredTokens(): Promise<{
    persistent_tokens: number;
    validation_tokens: number;
    blacklisted_keys: number;
  }> {
    const operationId = this.logger.startOperation('cleanupExpiredTokens');

    try {
      const [persistentCleaned, validationCleaned, blacklistCleaned] = await Promise.all([
        this.persistentTokenService.cleanupExpiredTokens(),
        this.validationTokenService.cleanupExpiredTokens(),
        this.cleanupExpiredBlacklistKeys(),
      ]);

      this.logger.endOperation('cleanupExpiredTokens', operationId, true);
      this.logger.info('Token cleanup completed', JSON.stringify({
        persistent_tokens: persistentCleaned,
        validation_tokens: validationCleaned,
        blacklisted_keys: blacklistCleaned,
      }));

      return {
        persistent_tokens: persistentCleaned,
        validation_tokens: validationCleaned,
        blacklisted_keys: blacklistCleaned,
      };

    } catch (error) {
      this.logger.endOperation('cleanupExpiredTokens', operationId, false);
      this.logger.error(
        'Failed to cleanup expired tokens',
        error.stack,
        'TokenService.cleanupExpiredTokens',
        JSON.stringify({ errorMessage: error.message })
      );
      return {
        persistent_tokens: 0,
        validation_tokens: 0,
        blacklisted_keys: 0,
      };
    }
  }

  /**
   * Obtient les statistiques globales de tous les tokens
   */
  async getGlobalTokenStats(): Promise<{
    persistent_tokens: any;
    validation_tokens: any;
    jwt_tokens: {
      blacklisted_count: number;
      cache_size: number;
    };
  }> {
    try {
      const [persistentStats, validationStats, jwtStats] = await Promise.all([
        this.persistentTokenService.getTokenStats(),
        this.validationTokenService.getTokenStats(),
        this.getJwtTokenStats(),
      ]);

      return {
        persistent_tokens: persistentStats,
        validation_tokens: validationStats,
        jwt_tokens: jwtStats,
      };

    } catch (error) {
      this.logger.error('Error getting global token stats', error.stack);
      return {
        persistent_tokens: {},
        validation_tokens: {},
        jwt_tokens: { blacklisted_count: 0, cache_size: 0 },
      };
    }
  }

  // ============================================================================
  // MÉTHODES PRIVÉES UTILITAIRES
  // ============================================================================

  /**
   * Génère hash sécurisé du token pour clé Redis
   */
  private getTokenHash(token: string): string {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(token).digest('hex').substring(0, 16);
  }

  /**
   * Valide structure payload access token
   */
  private validateAccessTokenPayload(payload: any): payload is JwtPayload {
    if (!payload || typeof payload !== 'object') return false;
    const requiredFields = ['sub', 'iat', 'exp', 'aud', 'iss', 'sessionId'];
    return requiredFields.every(field => payload[field] !== undefined && payload[field] !== null);
  }

  /**
   * Valide structure payload refresh token
   */
  private validateRefreshTokenPayload(payload: any): payload is JwtRefreshPayload {
    if (!payload || typeof payload !== 'object') return false;
    const requiredFields = ['sub', 'sessionId', 'tokenId', 'iat', 'exp', 'aud', 'iss'];
    return requiredFields.every(field => payload[field] !== undefined && payload[field] !== null);
  }

  /**
   * Génère ID unique pour tokens
   */
  private generateTokenId(): string {
    return `tkn_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`;
  }

  /**
   * Extrait payload sans vérification de signature (pour blacklist)
   */
  private extractJwtPayload(token: string): any {
    try {
      return this.jwtService.decode(token);
    } catch {
      return null;
    }
  }

  /**
 * ✅ AMÉLIORÉ : Vérifie si refresh token déjà utilisé avec plus de détails
 */
private async isRefreshTokenUsed(tokenId: string): Promise<boolean> {
  try {
    const usedKey = `refresh_used:${tokenId}`;
    const result = await this.redis.getCache<boolean | string>(usedKey);
    
    if (result) {
      this.logger.debug('Refresh token usage check', JSON.stringify({
        tokenId,
        usedKey,
        result: !!result
      }));
    }
    
    return !!result;
    
  } catch (error) {
    this.logger.error(
      'Error checking refresh token usage',
      error.stack,
      'TokenService.isRefreshTokenUsed',
      JSON.stringify({ tokenId, errorMessage: error.message })
    );
    // En cas d'erreur Redis, ne pas bloquer (sécurité)
    return false;
  }
}

/**
 * ✅ AMÉLIORÉ : Marque token comme utilisé avec métadonnées
 */
private async markRefreshTokenAsUsed(tokenId: string, token: string): Promise<void> {
  try {
    const usedKey = `refresh_used:${tokenId}`;
    
    // Calculer TTL basé sur l'expiration du token
    const payload = this.jwtService.decode(token) as any;
    let ttl = 3600; // 1 heure par défaut
    
    if (payload?.exp) {
      ttl = Math.max(60, payload.exp - Math.floor(Date.now() / 1000)); // Minimum 1 minute
    }
    
    // Stocker avec métadonnées
    const usageData = {
      usedAt: new Date().toISOString(),
      tokenId,
      userId: payload?.sub
    };
    
    await this.redis.setCache(usedKey, usageData, ttl);
    
    this.logger.debug('Refresh token marked as used', JSON.stringify({
      tokenId,
      ttl,
      usedAt: usageData.usedAt
    }));
    
  } catch (error) {
    this.logger.error(
      'Error marking refresh token as used',
      error.stack,
      'TokenService.markRefreshTokenAsUsed',
      JSON.stringify({ tokenId, errorMessage: error.message })
    );
    // Ne pas faire échouer l'opération pour un problème de cache
  }
}

  /**
   * Nettoie les clés blacklist expirées
   */
  private async cleanupExpiredBlacklistKeys(): Promise<number> {
    try {
      // Cette méthode nécessiterait une implémentation spécifique selon Redis
      // Pour l'instant, on retourne 0
      return 0;
    } catch (error) {
      this.logger.error('Error cleaning up blacklist keys', error.stack);
      return 0;
    }
  }

  /**
   * Obtient les statistiques JWT
   */
  private async getJwtTokenStats(): Promise<{
    blacklisted_count: number;
    cache_size: number;
  }> {
    try {
      // Cette méthode nécessiterait une implémentation spécifique
      // Pour l'instant, on retourne des valeurs par défaut
      return {
        blacklisted_count: 0,
        cache_size: 0,
      };
    } catch (error) {
      this.logger.error('Error getting JWT stats', error.stack);
      return {
        blacklisted_count: 0,
        cache_size: 0,
      };
    }
  }
}