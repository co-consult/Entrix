// src/modules/auth/strategies/refresh.strategy.ts
/**
 * Stratégie Refresh Token pour Passport
 * 
 * Responsabilités :
 * - Validation des refresh tokens JWT
 * - Vérification de l'existence en cache Redis
 * - Validation de la session associée
 * - Préparation pour renouvellement des tokens
 * 
 * @author Entrix Development Team
 * @version 1.0.0
 */

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

// Services partagés (chemins corrigés)
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { RedisService } from '../../../shared/redis/redis.service';
import { LoggerService } from '../../../shared/logger/logger.service';

// Services du module auth
import { TokenService } from '../services/token.service';
import { SessionsService } from '../services/session.service';

// Types
import { RefreshTokenPayload, AuthUser } from '../../../common/types/auth.types';

@Injectable()
export class RefreshStrategy extends PassportStrategy(Strategy, 'refresh') {
  private readonly logger: LoggerService;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly tokenService: TokenService,
    private readonly sessionService: SessionsService,
    private readonly config: ConfigService,
    logger: LoggerService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromBodyField('refreshToken'), // Depuis le body
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET'),
      issuer: config.get<string>('JWT_ISSUER', 'entrix.tn'),
      audience: config.get<string>('JWT_AUDIENCE', 'entrix-app'),
      passReqToCallback: true,
    });

    this.logger = logger;
  }

  /**
   * Validation du refresh token
   */
  async validate(req: any, payload: RefreshTokenPayload): Promise<AuthUser> {
    this.logger.log(`Validation refresh token pour utilisateur: ${payload.sub}`);

    try {
      // 1. Vérifier le type de token
      if (payload.type !== 'refresh') {
        this.logger.warn(`Type de token incorrect: ${payload.type} pour ${payload.sub}`);
        throw new UnauthorizedException('Type de token invalide');
      }

      // 2. Extraire le refresh token de la requête
      const refreshToken = req.body?.refreshToken;
      if (!refreshToken) {
        throw new UnauthorizedException('Refresh token manquant');
      }

      // 3. Vérifier si le token est révoqué
      const isRevoked = await this.tokenService.isTokenRevoked(refreshToken);
      if (isRevoked) {
        this.logger.warn(`Refresh token révoqué utilisé par: ${payload.sub}`);
        throw new UnauthorizedException('Refresh token révoqué');
      }

      // 4. Vérifier que le token existe en cache Redis
      const cachedToken = await this.redis.get(`refresh_token:${payload.sub}:${payload.sessionId}`);
      if (!cachedToken || cachedToken !== refreshToken) {
        this.logger.warn(`Refresh token non trouvé en cache pour: ${payload.sub}`);
        throw new UnauthorizedException('Refresh token invalide ou expiré');
      }

      // 5. Vérifier que l'utilisateur existe et est actif
      const user = await this.prisma.users.findFirst({
        where: { 
          id: payload.sub,
          is_active: true,
        },
      });

      if (!user) {
        this.logger.warn(`Utilisateur introuvable ou inactif: ${payload.sub}`);
        throw new UnauthorizedException('Utilisateur introuvable ou inactif');
      }

      // 6. Vérifier que la session existe et est valide
      const session = await this.sessionService.getSession(payload.sessionId);
      if (!session || new Date(session.expiresAt) <= new Date()) {
        this.logger.warn(`Session invalide ou expirée: ${payload.sessionId}`);
        throw new UnauthorizedException('Session expirée ou invalide');
      }

      // 7. Récupérer les rôles actifs
      const userRoles = await this.prisma.user_roles.findMany({
        where: { 
          user_id: payload.sub,
          status: 'ACTIVE',
        },
        include: {
          roles: {
            select: {
              id: true,
              code: true,
              name: true,
              level: true,
              permissions: true,
            }
          }
        }
      });

      // 8. Construire l'objet AuthUser
      const authUser: AuthUser = {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        avatar: user.avatar,
        isActive: user.is_active,
        emailVerified: user.email_verified,
        phoneVerified: user.phone_verified,
        roles: userRoles.map(ur => ({
          id: ur.roles.id,
          code: ur.roles.code,
          name: ur.roles.name,
          level: ur.roles.level,
          assignedAt: ur.assigned_at,
          validUntil: ur.valid_until,
          status: ur.status,
        })),
        permissions: this.extractPermissions(userRoles),
        lastLogin: user.last_login,
      };

      // 9. Ajouter les informations du contexte
      req.refreshContext = {
        sessionId: payload.sessionId,
        tokenVersion: payload.tokenVersion,
        originalToken: refreshToken,
      };

      this.logger.log(`Refresh token validé avec succès pour: ${payload.sub}`);
      return authUser;

    } catch (error) {
      this.logger.error(`Erreur validation refresh token pour ${payload.sub}:`, error);
      
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      
      throw new UnauthorizedException('Refresh token invalide');
    }
  }

  /**
   * Extraire les permissions depuis les rôles
   */
  private extractPermissions(userRoles: any[]): string[] {
    const permissions = new Set<string>();

    for (const userRole of userRoles) {
      const rolePermissions = userRole.roles.permissions;
      if (rolePermissions) {
        if (Array.isArray(rolePermissions)) {
          rolePermissions.forEach(permission => permissions.add(permission));
        } else if (typeof rolePermissions === 'object') {
          this.flattenPermissions(rolePermissions, permissions);
        }
      }
    }

    return Array.from(permissions);
  }

  /**
   * Aplatir les permissions depuis un objet JSONB
   */
  private flattenPermissions(obj: any, permissionsSet: Set<string>): void {
    for (const value of Object.values(obj)) {
      if (Array.isArray(value)) {
        value.forEach(permission => {
          if (typeof permission === 'string') {
            permissionsSet.add(permission);
          }
        });
      } else if (typeof value === 'string') {
        permissionsSet.add(value);
      } else if (typeof value === 'object' && value !== null) {
        this.flattenPermissions(value, permissionsSet);
      }
    }
  }
}