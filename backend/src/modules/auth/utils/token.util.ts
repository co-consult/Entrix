// src/modules/auth/utils/token.util.ts

import { JwtPayload, JwtRefreshPayload } from '../interfaces/auth.interfaces';
import { CryptoUtil } from './crypto.util';
import { AUTH_CONSTANTS } from '../constants/auth.constants';

/**
 * Utilitaires gestion tokens Entrix V3.0
 */

export class TokenUtil {
  /**
   * Crée payload JWT access token
   */
  static createAccessTokenPayload(
    userId: string,
    email: string,
    sessionId: string,
    deviceFingerprint?: string,
    roles?: string[],
    permissions?: string[]
  ): JwtPayload {
    const now = Math.floor(Date.now() / 1000);
    
    return {
      sub: userId,
      email,
      iat: now,
      exp: now + AUTH_CONSTANTS.JWT.ACCESS_TOKEN_EXPIRY,
      aud: 'entrix-users',
      iss: 'entrix-v3',
      sessionId,
      deviceFingerprint,
      roles: roles || [],
      permissions: permissions || [],
    };
  }

  /**
   * Crée payload JWT refresh token
   */
  static createRefreshTokenPayload(
    userId: string,
    sessionId: string,
    rememberMe: boolean = false
  ): JwtRefreshPayload {
    const now = Math.floor(Date.now() / 1000);
    const expiryDuration = rememberMe 
      ? AUTH_CONSTANTS.JWT.REFRESH_TOKEN_EXPIRY_REMEMBER 
      : AUTH_CONSTANTS.JWT.REFRESH_TOKEN_EXPIRY;
    
    return {
      sub: userId,
      sessionId,
      tokenId: CryptoUtil.generateUuid(), // Pour rotation
      iat: now,
      exp: now + expiryDuration,
      aud: 'entrix-refresh',
      iss: 'entrix-v3',
    };
  }

  /**
   * Valide structure payload JWT
   */
  static validateJwtPayload(payload: any, type: 'access' | 'refresh'): boolean {
    if (!payload || typeof payload !== 'object') return false;

    // Champs obligatoires communs
    const requiredFields = ['sub', 'iat', 'exp', 'aud', 'iss'];
    for (const field of requiredFields) {
      if (!payload[field]) return false;
    }

    // Validation spécifique au type
    if (type === 'access') {
      return !!(payload.email && payload.sessionId);
    } else if (type === 'refresh') {
      return !!(payload.sessionId && payload.tokenId);
    }

    return false;
  }

  /**
   * Extrait informations utilisateur du token
   */
  static extractUserInfo(payload: JwtPayload): {
    userId: string;
    email: string;
    sessionId: string;
    roles: string[];
    permissions: string[];
  } {
    return {
      userId: payload.sub,
      email: payload.email,
      sessionId: payload.sessionId,
      roles: payload.roles || [],
      permissions: payload.permissions || [],
    };
  }

  /**
   * Vérifie si token expire bientôt
   */
  static isTokenExpiringSoon(payload: JwtPayload, thresholdMinutes: number = 5): boolean {
    const now = Math.floor(Date.now() / 1000);
    const timeUntilExpiry = payload.exp - now;
    return timeUntilExpiry <= (thresholdMinutes * 60);
  }

  /**
   * Génère identifiant unique pour session
   */
  static generateSessionId(): string {
    return `sess_${Date.now()}_${CryptoUtil.generateSecureToken(16)}`;
  }

  /**
   * Génère clé de blacklist Redis
   */
  static generateBlacklistKey(tokenId: string): string {
    return `blacklist:token:${tokenId}`;
  }

  /**
   * Calcule temps restant avant expiration
   */
  static getTimeUntilExpiry(payload: JwtPayload | JwtRefreshPayload): number {
    const now = Math.floor(Date.now() / 1000);
    return Math.max(0, payload.exp - now);
  }

  /**
   * Formate token pour en-tête Authorization
   */
  static formatAuthorizationHeader(token: string): string {
    return `Bearer ${token}`;
  }

  /**
   * Extrait token de l'en-tête Authorization
   */
  static extractTokenFromHeader(authHeader?: string): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.substring(7);
  }
}