// src/modules/auth/services/token.service.ts
/**
 * Service de gestion des tokens JWT
 * 
 * Responsabilités :
 * - Génération et validation des access tokens
 * - Génération et validation des refresh tokens
 * - Gestion des tokens temporaires (reset, verify)
 * - Révocation et blacklist des tokens
 * - Cache des tokens révoqués
 * 
 * Sécurité :
 * - Signatures JWT avec clés secrètes
 * - Durées de vie configurables
 * - Révocation immédiate possible
 * - Blacklist Redis pour performance
 * 
 * @author Entrix Development Team
 * @version 1.0.0
 */

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';

// Services partagés (chemins corrigés)
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { RedisService } from '../../../shared/redis/redis.service';
import { LoggerService } from '../../../shared/logger/logger.service';

// Types et interfaces
import { ITokenService } from '../../../common/interfaces/auth.interface';
import { 
  JwtPayload, 
  RefreshTokenPayload, 
  TokenPair, 
  TokenValidationResult 
} from '../../../common/types/auth.types';
import { User } from '../../../common/types/user.types';

@Injectable()
export class TokenService implements ITokenService {
  private readonly logger: LoggerService;
  private readonly accessTokenExpiry: string;
  private readonly refreshTokenExpiry: string;
  private readonly issuer: string;
  private readonly audience: string;

  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly config: ConfigService,
    logger: LoggerService,
  ) {
    this.logger = logger.createChildLogger('TokenService');
    this.accessTokenExpiry = this.config.get<string>('JWT_ACCESS_EXPIRES_IN', '15m');
    this.refreshTokenExpiry = this.config.get<string>('JWT_REFRESH_EXPIRES_IN', '7d');
    this.issuer = this.config.get<string>('JWT_ISSUER', 'entrix.tn');
    this.audience = this.config.get<string>('JWT_AUDIENCE', 'entrix-app');
  }

  /**
   * Génération d'un access token
   */
  async generateAccessToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): Promise<string> {
    this.logger.log(`Génération access token pour utilisateur: ${payload.sub}`);

    try {
      const jwtPayload: Omit<JwtPayload, 'iat' | 'exp'> = {
        sub: payload.sub,
        email: payload.email,
        roles: payload.roles,
        permissions: payload.permissions,
        type: 'access',
        sessionId: payload.sessionId,
        securityLevel: payload.securityLevel,
        mfaVerified: payload.mfaVerified,
      };

      const token = this.jwtService.sign(jwtPayload, {
        expiresIn: this.accessTokenExpiry,
        issuer: this.issuer,
        audience: this.audience,
      });

      this.logger.log(`Access token généré avec succès pour: ${payload.sub}`);
      return token;

    } catch (error) {
      this.logger.error(`Erreur génération access token pour ${payload.sub}:`, error);
      throw new UnauthorizedException('Impossible de générer le token d\'accès');
    }
  }

  /**
   * Génération d'un refresh token
   */
  async generateRefreshToken(payload: Omit<RefreshTokenPayload, 'iat' | 'exp'>): Promise<string> {
    this.logger.log(`Génération refresh token pour utilisateur: ${payload.sub}`);

    try {
      const jwtPayload: Omit<RefreshTokenPayload, 'iat' | 'exp'> = {
        sub: payload.sub,
        type: 'refresh',
        sessionId: payload.sessionId,
        tokenVersion: payload.tokenVersion,
      };

      const token = this.jwtService.sign(jwtPayload, {
        expiresIn: this.refreshTokenExpiry,
        issuer: this.issuer,
        audience: this.audience,
      });

      // Mettre en cache pour validation rapide
      const ttl = this.parseExpiryToSeconds(this.refreshTokenExpiry);
      await this.redis.set(`refresh_token:${payload.sub}:${payload.sessionId}`, token, ttl);

      this.logger.log(`Refresh token généré avec succès pour: ${payload.sub}`);
      return token;

    } catch (error) {
      this.logger.error(`Erreur génération refresh token pour ${payload.sub}:`, error);
      throw new UnauthorizedException('Impossible de générer le token de rafraîchissement');
    }
  }

  /**
   * Génération d'une paire de tokens
   */
  async generateTokenPair(user: User, sessionId: string): Promise<TokenPair> {
    this.logger.log(`Génération paire de tokens pour: ${user.id}`);

    try {
      // Récupérer les rôles et permissions de l'utilisateur avec requête séparée
      const userRoles = await this.prisma.user_roles.findMany({
        where: { 
          user_id: user.id,
          status: 'ACTIVE' 
        },
        include: {
          roles: {
            select: {
              code: true,
              name: true,
              level: true,
              permissions: true,
            }
          }
        }
      });

      // Vérifier que l'utilisateur existe toujours
      const userExists = await this.prisma.users.findUnique({
        where: { id: user.id }
      });

      if (!userExists) {
        throw new UnauthorizedException('Utilisateur non trouvé');
      }

      // Extraire rôles et permissions
      const roles = userRoles.map(ur => ur.roles.code);
      const permissions = this.extractPermissions(userRoles);

      // Générer access token
      const accessToken = await this.generateAccessToken({
        sub: user.id,
        email: user.email,
        roles,
        permissions,
        type: 'access',
        sessionId,
        securityLevel: 'INFO', // Par défaut
        mfaVerified: false, // À définir selon le contexte
      });

      // Générer refresh token
      const refreshToken = await this.generateRefreshToken({
        sub: user.id,
        type: 'refresh',
        sessionId,
        tokenVersion: 1, // Incrémenté à chaque renouvellement
      });

      // Calculer les durées d'expiration
      const accessExpiresIn = this.parseExpiryToSeconds(this.accessTokenExpiry);
      const refreshExpiresIn = this.parseExpiryToSeconds(this.refreshTokenExpiry);

      return {
        accessToken,
        refreshToken,
        tokenType: 'Bearer',
        expiresIn: accessExpiresIn,
        refreshExpiresIn,
      };

    } catch (error) {
      this.logger.error(`Erreur génération paire de tokens pour ${user.id}:`, error);
      throw error;
    }
  }

  /**
   * Validation d'un token
   */
  async validateToken(token: string, type: 'access' | 'refresh'): Promise<TokenValidationResult> {
    try {
      // Vérifier si le token est révoqué
      const isRevoked = await this.isTokenRevoked(token);
      if (isRevoked) {
        return {
          valid: false,
          reason: 'Token révoqué',
          revoked: true,
        };
      }

      // Vérifier et décoder le token JWT
      const payload = this.jwtService.verify(token) as JwtPayload | RefreshTokenPayload;

      // Vérifier le type de token
      if (payload.type !== type) {
        return {
          valid: false,
          reason: `Type de token incorrect. Attendu: ${type}, reçu: ${payload.type}`,
        };
      }

      // Vérifier l'expiration
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp <= now) {
        return {
          valid: false,
          reason: 'Token expiré',
          expired: true,
        };
      }

      // Validation supplémentaire pour refresh tokens
      if (type === 'refresh') {
        const refreshPayload = payload as RefreshTokenPayload;
        const cachedToken = await this.redis.get(`refresh_token:${refreshPayload.sub}:${refreshPayload.sessionId}`);
        
        if (!cachedToken || cachedToken !== token) {
          return {
            valid: false,
            reason: 'Refresh token non trouvé ou invalide',
          };
        }
      }

      return {
        valid: true,
        payload,
      };

    } catch (error) {
      this.logger.warn(`Token invalide: ${error.message}`);
      return {
        valid: false,
        reason: error.message,
      };
    }
  }

  /**
   * Décodage d'un token sans validation
   */
  decodeToken(token: string): JwtPayload | RefreshTokenPayload | null {
    try {
      return this.jwtService.decode(token) as JwtPayload | RefreshTokenPayload;
    } catch (error) {
      this.logger.warn(`Erreur décodage token: ${error.message}`);
      return null;
    }
  }

  /**
   * Révocation d'un token
   */
  async revokeToken(token: string): Promise<void> {
    this.logger.log('Révocation d\'un token');

    try {
      const decoded = this.decodeToken(token);
      if (!decoded) {
        this.logger.warn('Tentative révocation d\'un token invalide');
        return;
      }

      // Ajouter à la blacklist Redis avec TTL basé sur l'expiration
      const ttl = Math.max(0, decoded.exp - Math.floor(Date.now() / 1000));
      if (ttl > 0) {
        await this.redis.set(`revoked_token:${this.hashToken(token)}`, '1', ttl);
      }

      // Si c'est un refresh token, supprimer du cache
      if (decoded.type === 'refresh') {
        const refreshPayload = decoded as RefreshTokenPayload;
        await this.redis.del(`refresh_token:${refreshPayload.sub}:${refreshPayload.sessionId}`);
      }

      this.logger.log(`Token révoqué avec succès pour utilisateur: ${decoded.sub}`);

    } catch (error) {
      this.logger.error('Erreur révocation token:', error);
      throw new UnauthorizedException('Impossible de révoquer le token');
    }
  }

  /**
   * Révocation de tous les tokens d'un utilisateur
   */
  async revokeAllTokens(userId: string): Promise<void> {
    this.logger.log(`Révocation de tous les tokens pour: ${userId}`);

    try {
      // Récupérer toutes les sessions actives
      const sessions = await this.prisma.user_sessions.findMany({
        where: { 
          user_id: userId, 
          is_active: true 
        },
        select: { id: true }
      });

      // Supprimer tous les refresh tokens en cache
      const deletePromises = sessions.map(session => 
        this.redis.del(`refresh_token:${userId}:${session.id}`)
      );
      await Promise.all(deletePromises);

      // Ajouter l'utilisateur à une blacklist temporaire
      await this.redis.set(`user_tokens_revoked:${userId}`, Date.now().toString(), 3600); // 1 heure

      this.logger.log(`Tous les tokens révoqués pour: ${userId}`);

    } catch (error) {
      this.logger.error(`Erreur révocation tous tokens pour ${userId}:`, error);
      throw new UnauthorizedException('Impossible de révoquer tous les tokens');
    }
  }

  /**
   * Vérification si un token est révoqué
   */
  async isTokenRevoked(token: string): Promise<boolean> {
    try {
      // Vérifier dans la blacklist individuelle
      const tokenHash = this.hashToken(token);
      const isBlacklisted = await this.redis.get(`revoked_token:${tokenHash}`);
      
      if (isBlacklisted) {
        return true;
      }

      // Vérifier si tous les tokens de l'utilisateur sont révoqués
      const decoded = this.decodeToken(token);
      if (decoded) {
        const userRevoked = await this.redis.get(`user_tokens_revoked:${decoded.sub}`);
        if (userRevoked) {
          const revokedAt = parseInt(userRevoked);
          const tokenIssuedAt = decoded.iat * 1000; // Convertir en millisecondes
          
          // Si le token a été émis avant la révocation générale
          if (tokenIssuedAt < revokedAt) {
            return true;
          }
        }
      }

      return false;

    } catch (error) {
      this.logger.error('Erreur vérification révocation token:', error);
      return false;
    }
  }

  /**
   * Génération d'un token temporaire
   */
  async generateTemporaryToken(userId: string, type: string, expiresIn: number = 3600): Promise<string> {
    this.logger.log(`Génération token temporaire ${type} pour: ${userId}`);

    try {
      const payload = {
        sub: userId,
        type: `temp_${type}`,
        purpose: type,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + expiresIn,
      };

      const token = this.jwtService.sign(payload, {
        expiresIn: `${expiresIn}s`,
        issuer: this.issuer,
        audience: this.audience,
      });

      // Mettre en cache pour validation
      await this.redis.set(`temp_token:${type}:${userId}`, token, expiresIn);

      return token;

    } catch (error) {
      this.logger.error(`Erreur génération token temporaire ${type} pour ${userId}:`, error);
      throw new UnauthorizedException('Impossible de générer le token temporaire');
    }
  }

  /**
   * Validation d'un token temporaire
   */
  async validateTemporaryToken(token: string, type: string): Promise<{ userId: string; valid: boolean }> {
    try {
      const payload = this.jwtService.verify(token) as any;
      
      if (payload.type !== `temp_${type}` || payload.purpose !== type) {
        return { userId: '', valid: false };
      }

      // Vérifier en cache
      const cachedToken = await this.redis.get(`temp_token:${type}:${payload.sub}`);
      if (!cachedToken || cachedToken !== token) {
        return { userId: '', valid: false };
      }

      // Supprimer le token après utilisation (usage unique)
      await this.redis.del(`temp_token:${type}:${payload.sub}`);

      return { userId: payload.sub, valid: true };

    } catch (error) {
      this.logger.warn(`Token temporaire invalide: ${error.message}`);
      return { userId: '', valid: false };
    }
  }

  // === MÉTHODES PRIVÉES ===

  /**
   * Hasher un token pour stockage sécurisé
   */
  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Convertir une durée string en secondes
   */
  private parseExpiryToSeconds(expiry: string): number {
    const match = expiry.match(/^(\d+)([smhdw])$/);
    if (!match) {
      throw new Error(`Format d'expiration invalide: ${expiry}`);
    }

    const value = parseInt(match[1]);
    const unit = match[2];

    switch (unit) {
      case 's': return value;
      case 'm': return value * 60;
      case 'h': return value * 3600;
      case 'd': return value * 86400;
      case 'w': return value * 604800;
      default: throw new Error(`Unité de temps non supportée: ${unit}`);
    }
  }

  /**
   * Extraire les permissions des rôles utilisateur
   */
  private extractPermissions(userRoles: any[]): string[] {
    const permissions = new Set<string>();

    for (const userRole of userRoles) {
      const rolePermissions = userRole.roles.permissions;
      if (rolePermissions) {
        // Si permissions est un array JSON
        if (Array.isArray(rolePermissions)) {
          rolePermissions.forEach(permission => permissions.add(permission));
        } 
        // Si permissions est un objet JSON
        else if (typeof rolePermissions === 'object') {
          Object.values(rolePermissions).forEach(permission => {
            if (typeof permission === 'string') {
              permissions.add(permission);
            }
          });
        }
      }
    }

    return Array.from(permissions);
  }

  /**
   * Nettoyer les tokens expirés du cache (méthode utilitaire)
   */
  async cleanupExpiredTokens(): Promise<void> {
    this.logger.log('Nettoyage des tokens expirés du cache');
    
    try {
      // Cette méthode peut être appelée par un CRON job
      // Pour l'instant, Redis s'occupe automatiquement de l'expiration avec TTL
      this.logger.log('Nettoyage automatique par TTL Redis');
      
    } catch (error) {
      this.logger.error('Erreur nettoyage tokens expirés:', error);
    }
  }
}