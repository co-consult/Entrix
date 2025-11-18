// src/modules/auth/guards/api-key.guard.ts

import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { LoggerService } from '../../../shared/logger/logger.service';
import { PersistentTokenService } from '../services/persistent-token.service';
import { Public } from '../decorators/public.decorator';

/**
 * API Key Guard Entrix V3.0 - Grade A+
 * Guard pour valider les API keys (persistent tokens de type API_KEY)
 * Permet l'authentification via API key en alternative aux JWT
 */

@Injectable()
export class ApiKeyGuard implements CanActivate {
  private readonly logger: LoggerService;

  constructor(
    private readonly persistentTokenService: PersistentTokenService,
    private readonly reflector: Reflector,
    loggerService: LoggerService,
  ) {
    this.logger = loggerService.createChildLogger('ApiKeyGuard');
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const operationId = this.logger.startOperation('apiKeyGuard', {
      path: request.url,
      method: request.method,
    });

    try {
      // Vérifier si l'endpoint est marqué comme public
      const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
        context.getHandler(),
        context.getClass(),
      ]);

      if (isPublic) {
        this.logger.endOperation('apiKeyGuard', operationId, true);
        return true;
      }

      // Extraire l'API key depuis l'en-tête
      const apiKey = this.extractApiKey(request);

      if (!apiKey) {
        this.logger.endOperation('apiKeyGuard', operationId, false);
        this.logger.warn('API key missing', JSON.stringify({
          path: request.url,
          method: request.method,
          headers: this.sanitizeHeaders(request.headers),
        }));
        throw new UnauthorizedException('API key required');
      }

      // Valider l'API key
      const validation = await this.persistentTokenService.validateApiKey(apiKey);

      if (!validation.isValid) {
        this.logger.endOperation('apiKeyGuard', operationId, false);
        this.logger.warn('Invalid API key used', JSON.stringify({
          path: request.url,
          method: request.method,
          apiKeyPrefix: apiKey.substring(0, 12) + '...',
          errors: validation.errors,
        }));
        throw new UnauthorizedException('Invalid API key');
      }

      // Ajouter les informations d'authentification à la requête
      request.user = {
        id: validation.userId,
        authType: 'api_key',
        scopes: validation.scopes || [],
        tokenId: validation.token?.id,
      };

      // Vérifier les scopes requis si spécifiés
      const requiredScopes = this.reflector.get<string[]>('scopes', context.getHandler());
      if (requiredScopes && !this.hasRequiredScopes(validation.scopes || [], requiredScopes)) {
        this.logger.endOperation('apiKeyGuard', operationId, false);
        this.logger.warn('Insufficient API key scopes', JSON.stringify({
          path: request.url,
          method: request.method,
          requiredScopes,
          availableScopes: validation.scopes,
        }));
        throw new UnauthorizedException('Insufficient permissions');
      }

      this.logger.endOperation('apiKeyGuard', operationId, true);
      this.logger.info('API key authentication successful', JSON.stringify({
        userId: validation.userId,
        scopes: validation.scopes,
        path: request.url,
      }));

      return true;

    } catch (error) {
      this.logger.endOperation('apiKeyGuard', operationId, false);
      
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      this.logger.error(
        'API key guard error',
        error.stack,
        'ApiKeyGuard.canActivate',
        JSON.stringify({ 
          errorMessage: error.message,
          path: request.url,
          method: request.method,
        })
      );
      
      throw new UnauthorizedException('Authentication failed');
    }
  }

  /**
   * Extrait l'API key depuis les en-têtes
   */
  private extractApiKey(request: any): string | null {
    // Méthode 1 : Authorization Bearer
    const authHeader = request.headers?.authorization;
    if (authHeader?.startsWith('Bearer ent_api_')) {
      return authHeader.substring(7); // Remove "Bearer "
    }

    // Méthode 2 : En-tête X-API-Key
    const apiKeyHeader = request.headers?.['x-api-key'];
    if (apiKeyHeader?.startsWith('ent_api_')) {
      return apiKeyHeader;
    }

    // Méthode 3 : Query parameter (moins sécurisé, pour debug)
    const apiKeyQuery = request.query?.api_key;
    if (apiKeyQuery?.startsWith('ent_api_')) {
      return apiKeyQuery;
    }

    return null;
  }

  /**
   * Vérifie si les scopes requis sont présents
   */
  private hasRequiredScopes(userScopes: string[], requiredScopes: string[]): boolean {
    // Vérifier si l'utilisateur a tous les scopes requis
    return requiredScopes.every(requiredScope => {
      // Support des wildcards
      if (requiredScope.endsWith('*')) {
        const prefix = requiredScope.slice(0, -1);
        return userScopes.some(userScope => userScope.startsWith(prefix));
      }
      
      return userScopes.includes(requiredScope);
    });
  }

  /**
   * Sanitise les en-têtes pour le logging (retire les tokens sensibles)
   */
  private sanitizeHeaders(headers: any): any {
    const sanitized = { ...headers };
    
    if (sanitized.authorization) {
      sanitized.authorization = sanitized.authorization.substring(0, 20) + '...';
    }
    
    if (sanitized['x-api-key']) {
      sanitized['x-api-key'] = sanitized['x-api-key'].substring(0, 12) + '...';
    }

    return sanitized;
  }
}

// ============================================================================
// DECORATOR POUR SPÉCIFIER LES SCOPES REQUIS
// ============================================================================

import { SetMetadata } from '@nestjs/common';

export const RequireScopes = (...scopes: string[]) => SetMetadata('scopes', scopes);

/**
 * Usage examples:
 * 
 * @RequireScopes('read:events', 'write:bookings')
 * @UseGuards(ApiKeyGuard)
 * async createBooking() { ... }
 * 
 * @RequireScopes('admin:*') // Wildcard pour tous les scopes admin
 * @UseGuards(ApiKeyGuard)
 * async adminAction() { ... }
 */