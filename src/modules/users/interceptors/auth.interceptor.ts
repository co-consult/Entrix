// src/modules/users/interceptors/auth.interceptor.ts

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { LoggerService } from '../../../shared/logger/logger.service';
import { RedisService } from '../../../shared/redis/redis.service';

@Injectable()
export class AuthInterceptor implements NestInterceptor {
  private readonly logger: LoggerService;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    loggerService: LoggerService,
  ) {
    this.logger = loggerService.createChildLogger('AuthInterceptor');
  }

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const user = request.user;

    // Enrichir les données utilisateur si connecté et pas déjà enrichies
    if (user && user.id && !user.enriched) {
      try {
        await this.enrichUserData(request);
      } catch (error) {
        this.logger.logErrorEvent(
          error,
          'AuthInterceptor.enrichUserData',
          user.id,
          JSON.stringify({
            path: request.path,
            method: request.method,
            errorMessage: error.message,
          })
        );
      }
    }

    // Tracker l'activité utilisateur si connecté
    if (user && user.id) {
      this.trackUserActivity(request);
    }

    const startTime = Date.now();

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - startTime;
        
        // Logger la requête authentifiée
        if (user && user.id) {
          this.logAuthenticatedRequest(request, response, duration);
        }
      }),
    );
  }

  /**
   * Enrichit les données utilisateur avec les informations du profil seulement
   */
  private async enrichUserData(request: any): Promise<void> {
    const user = request.user;
    const cacheKey = `user:enriched:${user.id}`;
    
    try {
      // Vérifier le cache Redis d'abord
      const cachedUser = await this.redis.getCache<Record<string, any>>(cacheKey);
      if (cachedUser && typeof cachedUser === 'object') {
        request.user = {
          ...user,
          ...cachedUser,
          enriched: true,
        };
        this.logger.logCacheEvent('hit', cacheKey);
        return;
      }

      this.logger.logCacheEvent('miss', cacheKey);

      // Récupérer les données enrichies depuis la base de données
      const enrichedUser = await this.prisma.users.findUnique({
        where: { id: user.id },
        select: {
          id: true,
          email: true,
          first_name: true,
          last_name: true,
          avatar: true,
          is_active: true,
          email_verified: true,
          phone_verified: true,
          last_login: true,
          created_at: true,
          updated_at: true,
          // Profil utilisateur (relation 1:1 directe)
          user_profiles: {
            select: {
              city: true,
              country: true,
              language: true,
              preferences: true,
              date_of_birth: true,
              gender: true,
              timezone: true,
            },
          },
        },
      });

      if (!enrichedUser) {
        this.logger.logErrorEvent(
          new Error('User not found during enrichment'),
          'AuthInterceptor.enrichUserData',
          user.id,
          JSON.stringify({ userId: user.id })
        );
        return;
      }

      // Transformer les données pour l'objet user enrichi
      const enrichedData = {
        // Données de base
        firstName: enrichedUser.first_name,
        lastName: enrichedUser.last_name,
        isActive: enrichedUser.is_active,
        emailVerified: enrichedUser.email_verified,
        phoneVerified: enrichedUser.phone_verified,
        lastLogin: enrichedUser.last_login,
        createdAt: enrichedUser.created_at,
        updatedAt: enrichedUser.updated_at,
        
        // Profil (prendre le premier s'il existe, relation 1:1)
        profile: enrichedUser.user_profiles?.[0] || null,
      };

      // Enrichir l'objet user dans la requête
      request.user = {
        ...user,
        ...enrichedData,
        enriched: true,
      };

      // Mettre en cache pour 5 minutes
      await this.redis.setCache(cacheKey, enrichedData, 300);
      this.logger.logCacheEvent('set', cacheKey, 300);

      // Logger le succès de l'enrichissement
      this.logger.logBusinessEvent(
        'USER_DATA_ENRICHED',
        JSON.stringify({
          userId: user.id,
          hasProfile: !!enrichedData.profile,
        }),
        user.id
      );

    } catch (error) {
      this.logger.logErrorEvent(
        error,
        'AuthInterceptor.enrichUserData',
        user.id,
        JSON.stringify({
          errorMessage: error.message,
          stack: error.stack,
        })
      );
      throw error;
    }
  }

  /**
   * Tracker l'activité de l'utilisateur connecté
   */
  private async trackUserActivity(request: any): Promise<void> {
    const user = request.user;
    
    try {
      // Mettre à jour la dernière connexion de l'utilisateur (async, sans bloquer)
      this.prisma.users.update({
        where: { id: user.id },
        data: { 
          last_login: new Date(),
        },
      }).catch(error => {
        this.logger.logErrorEvent(
          error,
          'AuthInterceptor.updateUserActivity',
          user.id,
          JSON.stringify({
            path: request.path,
            method: request.method,
            errorMessage: error.message,
          })
        );
      });

      // Logger l'activité utilisateur pour analytics
      this.logger.logBusinessEvent(
        'USER_ACTIVITY_TRACKED',
        JSON.stringify({
          action: 'API_REQUEST',
          method: request.method,
          path: request.path,
          userAgent: request.get('user-agent'),
          ip: request.ip,
        }),
        user.id
      );

      // Mettre à jour le cache d'activité utilisateur
      const activityData = {
        lastActivity: new Date(),
        lastPath: request.path,
        lastMethod: request.method,
        lastUserAgent: request.get('user-agent'),
        lastIp: request.ip || request.connection?.remoteAddress,
      };
      
      const activityCacheKey = `user:activity:${user.id}`;
      await this.redis.setCache(activityCacheKey, activityData, 3600); // 1 heure

    } catch (error) {
      this.logger.logErrorEvent(
        error,
        'AuthInterceptor.trackUserActivity',
        user.id,
        JSON.stringify({
          path: request.path,
          method: request.method,
          errorMessage: error.message,
        })
      );
    }
  }

  /**
   * Logger les requêtes authentifiées pour audit et monitoring
   */
  private logAuthenticatedRequest(request: any, response: any, duration: number): void {
    const user = request.user;
    
    try {
      const requestData = {
        userId: user.id,
        method: request.method,
        path: request.path,
        statusCode: response.statusCode,
        duration,
        userAgent: request.get('user-agent'),
        ip: request.ip,
      };

      // Déterminer le niveau de log selon le code de statut
      const isError = response.statusCode >= 400;
      const isWarning = response.statusCode >= 300;
      
      if (isError) {
        this.logger.logErrorEvent(
          new Error(`HTTP ${response.statusCode} on ${request.method} ${request.path}`),
          'AuthInterceptor.authenticatedRequest',
          user.id,
          JSON.stringify(requestData)
        );
      } else if (isWarning) {
        this.logger.warn('Authenticated request redirect', JSON.stringify(requestData));
      } else {
        this.logger.info('Authenticated request completed', JSON.stringify(requestData));
      }

      // Logger les événements de sécurité pour certaines actions sensibles
      this.logSecurityEvents(request, response, user);

    } catch (error) {
      this.logger.logErrorEvent(
        error,
        'AuthInterceptor.logAuthenticatedRequest',
        user.id,
        JSON.stringify({ errorMessage: error.message })
      );
    }
  }

  /**
   * Logger les événements de sécurité pour les actions sensibles
   */
  private logSecurityEvents(request: any, response: any, user: any): void {
    const sensitiveEndpoints = [
      '/auth/login',
      '/auth/logout',
      '/auth/change-password',
      '/users/profile',
      '/users/privacy',
      '/groups/create',
      '/groups/delete',
      '/admin',
    ];

    const isSensitive = sensitiveEndpoints.some(endpoint => 
      request.path.includes(endpoint)
    );

    if (isSensitive) {
      this.logger.logSecurityEvent(
        'SENSITIVE_ENDPOINT_ACCESS',
        user.id,
        request.ip,
        request.get('user-agent'),
        JSON.stringify({
          endpoint: request.path,
          method: request.method,
          statusCode: response.statusCode,
          timestamp: new Date().toISOString(),
        })
      );
    }

    // Logger les échecs d'authentification
    if (response.statusCode === 401) {
      this.logger.logSecurityEvent(
        'AUTHENTICATION_FAILURE',
        user.id,
        request.ip,
        request.get('user-agent'),
        JSON.stringify({
          endpoint: request.path,
          method: request.method,
          reason: 'Invalid or expired token',
        })
      );
    }

    // Logger les accès refusés
    if (response.statusCode === 403) {
      this.logger.logSecurityEvent(
        'ACCESS_DENIED',
        user.id,
        request.ip,
        request.get('user-agent'),
        JSON.stringify({
          endpoint: request.path,
          method: request.method,
          reason: 'Insufficient permissions',
        })
      );
    }
  }
}