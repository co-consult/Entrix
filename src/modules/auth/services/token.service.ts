// src/modules/auth/services/token.service.ts

import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '../../../shared/logger/logger.service';
import { RedisService } from '../../../shared/redis/redis.service';
import { 
  ITokenService, 
  JwtPayload, 
  JwtRefreshPayload, 
  ITokenPair 
} from '../interfaces';
import { AUTH_CONSTANTS } from '../constants/auth.constants';
import { TokenUtil } from '../utils/token.util';
import { CryptoUtil } from '../utils/crypto.util';

/**
 * Token Service Entrix V3.0 - Grade A+
 * Gestion JWT avec rotation, blacklisting et sécurité renforcée
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
    loggerService: LoggerService,
  ) {
    this.logger = loggerService.createChildLogger('TokenService');
    this.accessTokenSecret = this.configService.get<string>('JWT_SECRET');
    this.refreshTokenSecret = this.configService.get<string>('JWT_REFRESH_SECRET', this.accessTokenSecret);
  }

  /**
   * Génère access token JWT
   * Respecte AUTH_CONSTANTS.JWT et sécurité
   */
  async generateAccessToken(payload: JwtPayload): Promise<string> {
    const operationId = this.logger.startOperation('generateAccessToken', {
      userId: payload.sub,
      sessionId: payload.sessionId,
    });

    try {
      // Valider payload avant signature
      if (!TokenUtil.validateJwtPayload(payload, 'access')) {
        throw new Error('Payload JWT invalide pour access token');
      }

      // Signer token avec secret access
      const token = this.jwtService.sign(payload, {
        secret: this.accessTokenSecret,
        expiresIn: AUTH_CONSTANTS.JWT.ACCESS_TOKEN_EXPIRY,
        issuer: 'entrix-v3',
        audience: 'entrix-users',
      });

      // Logger génération token (sans le token lui-même)
      this.logger.logBusinessEvent('ACCESS_TOKEN_GENERATED', {
        userId: payload.sub,
        sessionId: payload.sessionId,
        expiresIn: AUTH_CONSTANTS.JWT.ACCESS_TOKEN_EXPIRY,
      }, payload.sub);

      this.logger.endOperation(operationId, 'success');
      return token;

    } catch (error) {
      this.logger.endOperation(operationId, 'error', error.message);
      this.logger.error('Failed to generate access token', error.stack, {
        userId: payload.sub,
        sessionId: payload.sessionId,
      });
      throw new Error(`Erreur génération access token: ${error.message}`);
    }
  }

  /**
   * Génère refresh token JWT avec rotation
   * Rotation automatique pour sécurité renforcée
   */
  async generateRefreshToken(payload: JwtRefreshPayload): Promise<string> {
    const operationId = this.logger.startOperation('generateRefreshToken', {
      userId: payload.sub,
      sessionId: payload.sessionId,
      tokenId: payload.tokenId,
    });

    try {
      // Valider payload refresh
      if (!TokenUtil.validateJwtPayload(payload, 'refresh')) {
        throw new Error('Payload JWT invalide pour refresh token');
      }

      // Signer refresh token
      const token = this.jwtService.sign(payload, {
        secret: this.refreshTokenSecret,
        expiresIn: payload.exp - payload.iat, // Durée calculée dynamiquement
        issuer: 'entrix-v3',
        audience: 'entrix-refresh',
      });

      // Stocker mapping tokenId -> userId dans Redis pour rotation
      const tokenMappingKey = `refresh_mapping:${payload.tokenId}`;
      await this.redis.setCache(
        tokenMappingKey, 
        payload.sub, 
        AUTH_CONSTANTS.JWT.REFRESH_TOKEN_EXPIRY_REMEMBER
      );

      // Logger génération refresh token
      this.logger.logBusinessEvent('REFRESH_TOKEN_GENERATED', {
        userId: payload.sub,
        sessionId: payload.sessionId,
        tokenId: payload.tokenId,
        expiresIn: payload.exp - payload.iat,
      }, payload.sub);

      this.logger.endOperation(operationId, 'success');
      return token;

    } catch (error) {
      this.logger.endOperation(operationId, 'error', error.message);
      this.logger.error('Failed to generate refresh token', error.stack, {
        userId: payload.sub,
        sessionId: payload.sessionId,
        tokenId: payload.tokenId,
      });
      throw new Error(`Erreur génération refresh token: ${error.message}`);
    }
  }

  /**
   * Vérifie et décode access token
   * Validation complète avec blacklist checking
   */
  async verifyAccessToken(token: string): Promise<JwtPayload> {
    const operationId = this.logger.startOperation('verifyAccessToken');

    try {
      // Vérifier format token
      if (!token || typeof token !== 'string') {
        throw new Error('Token format invalide');
      }

      // Vérifier si token blacklisté AVANT vérification JWT
      const isBlacklisted = await this.isTokenBlacklisted(token);
      if (isBlacklisted) {
        throw new Error('Token révoqué');
      }

      // Vérifier signature et validité
      const payload = this.jwtService.verify<JwtPayload>(token, {
        secret: this.accessTokenSecret,
        issuer: 'entrix-v3',
        audience: 'entrix-users',
      });

      // Validation supplémentaire du payload
      if (!TokenUtil.validateJwtPayload(payload, 'access')) {
        throw new Error('Payload token invalide');
      }

      this.logger.endOperation(operationId, 'success');
      return payload;

    } catch (error) {
      this.logger.endOperation(operationId, 'error', error.message);
      
      // Logger tentative d'utilisation token invalide
      this.logger.logBusinessEvent('INVALID_TOKEN_USED', {
        error: error.message,
        tokenPrefix: token?.substring(0, 20) + '...',
      });

      throw new Error(`Token invalide: ${error.message}`);
    }
  }

  /**
   * Vérifie et décode refresh token
   * Validation avec vérification rotation
   */
  async verifyRefreshToken(token: string): Promise<JwtRefreshPayload> {
    const operationId = this.logger.startOperation('verifyRefreshToken');

    try {
      if (!token || typeof token !== 'string') {
        throw new Error('Refresh token format invalide');
      }

      // Vérifier signature refresh token
      const payload = this.jwtService.verify<JwtRefreshPayload>(token, {
        secret: this.refreshTokenSecret,
        issuer: 'entrix-v3',
        audience: 'entrix-refresh',
      });

      // Validation payload refresh
      if (!TokenUtil.validateJwtPayload(payload, 'refresh')) {
        throw new Error('Payload refresh token invalide');
      }

      // Vérifier si token déjà utilisé (rotation)
      const isUsed = await this.isRefreshTokenUsed(payload.tokenId);
      if (isUsed) {
        throw new Error('Refresh token déjà utilisé');
      }

      this.logger.endOperation(operationId, 'success');
      return payload;

    } catch (error) {
      this.logger.endOperation(operationId, 'error', error.message);
      
      this.logger.logBusinessEvent('INVALID_REFRESH_TOKEN_USED', {
        error: error.message,
      });

      throw new Error(`Refresh token invalide: ${error.message}`);
    }
  }

  /**
   * Blackliste un token (révocation)
   * Utilise Redis avec TTL automatique
   */
  async blacklistToken(token: string): Promise<void> {
    const operationId = this.logger.startOperation('blacklistToken');

    try {
      // Décoder token pour extraire infos (sans validation)
      const payload = TokenUtil.extractJwtPayload(token);
      
      if (!payload) {
        throw new Error('Token non décodable pour blacklisting');
      }

      // Calculer TTL restant
      const now = Math.floor(Date.now() / 1000);
      const ttl = Math.max(0, payload.exp - now);

      if (ttl > 0) {
        // Ajouter à blacklist avec TTL
        const blacklistKey = `blacklist:token:${payload.sessionId || 'unknown'}:${payload.iat}`;
        await this.redis.setCache(blacklistKey, 'revoked', ttl);

        // Logger révocation
        this.logger.logBusinessEvent('TOKEN_BLACKLISTED', {
          userId: payload.sub,
          sessionId: payload.sessionId,
          reason: 'manual_revocation',
          ttl,
        }, payload.sub);
      }

      this.logger.endOperation(operationId, 'success');

    } catch (error) {
      this.logger.endOperation(operationId, 'error', error.message);
      this.logger.error('Failed to blacklist token', error.stack);
      // Ne pas faire échouer - blacklisting est best effort
    }
  }

  /**
   * Vérifie si token est blacklisté
   */
  async isTokenBlacklisted(token: string): Promise<boolean> {
    try {
      // Décoder token pour construire clé blacklist
      const payload = TokenUtil.extractJwtPayload(token);
      
      if (!payload || !payload.sessionId || !payload.iat) {
        return false; // Token malformé, laisser JWT verify gérer
      }

      const blacklistKey = `blacklist:token:${payload.sessionId}:${payload.iat}`;
      const isBlacklisted = await this.redis.exists(blacklistKey);
      
      return isBlacklisted;
    } catch (error) {
      this.logger.error('Error checking token blacklist', error.stack);
      return false; // En cas d'erreur Redis, laisser passer
    }
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
   * Génère paire de tokens complète
   * Méthode helper pour login/refresh
   */
  async generateTokenPair(
    userId: string,
    email: string,
    sessionId: string,
    rememberMe: boolean = false,
    deviceFingerprint?: string,
    roles?: string[],
    permissions?: string[]
  ): Promise<ITokenPair> {
    const operationId = this.logger.startOperation('generateTokenPair', {
      userId,
      sessionId,
      rememberMe,
    });

    try {
      // Créer payloads
      const accessPayload = TokenUtil.createAccessTokenPayload(
        userId,
        email,
        sessionId,
        deviceFingerprint,
        roles,
        permissions
      );

      const refreshPayload = TokenUtil.createRefreshTokenPayload(
        userId,
        sessionId,
        rememberMe
      );

      // Générer tokens
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

      this.logger.endOperation(operationId, 'success', true);
      return tokenPair;

    } catch (error) {
      this.logger.endOperation(operationId, 'error', error.message);
      this.logger.error('Failed to generate token pair', error.stack, JSON.stringify({
        userId,
        sessionId,
      }));
      throw new Error(`Erreur génération paire tokens: ${error.message}`);
    }
  }
}