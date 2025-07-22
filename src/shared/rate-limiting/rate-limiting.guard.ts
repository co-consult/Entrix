import { 
  CanActivate, 
  ExecutionContext, 
  Injectable, 
  HttpException, 
  HttpStatus,
  Logger 
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request, Response } from 'express';
import { RateLimitingService } from './rate-limiting.service';
import { LoggerService } from '../logger/logger.service';
import { 
  RateLimitOptions, 
  RATE_LIMIT_HEADERS, 
  RATE_LIMIT_MESSAGES,
  DEFAULT_RATE_LIMIT,
  DEFAULT_WINDOW_MS 
} from './interfaces';

export const RATE_LIMIT_KEY = 'rate_limit_options';

/**
 * Guard de rate limiting avancé avec support Redis
 * - Gestion des headers HTTP standard
 * - Whitelist/blacklist
 * - Logging détaillé
 * - Métriques intégrées
 */
@Injectable()
export class RateLimitingGuard implements CanActivate {
  private readonly logger = new Logger(RateLimitingGuard.name);

  constructor(
    private readonly rateLimitingService: RateLimitingService,
    private readonly reflector: Reflector,
    private readonly loggerService: LoggerService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    
    // Récupérer les options depuis le décorateur
    const options: RateLimitOptions = this.reflector.get(
      RATE_LIMIT_KEY, 
      context.getHandler()
    ) || {};

    // Skip si demandé
    if (options.skip) {
      return true;
    }

    try {
      // Générer l'identifiant
      const identifier = this.generateIdentifier(request, options);
      
      // Vérifier la whitelist
      if (await this.rateLimitingService.isWhitelisted(identifier)) {
        this.setHeaders(response, {
          allowed: true,
          remaining: options.limit || DEFAULT_RATE_LIMIT,
          resetTime: Date.now() + (options.windowMs || DEFAULT_WINDOW_MS),
          totalRequests: 0,
        });
        return true;
      }

      // Vérifier la blacklist
      if (await this.rateLimitingService.isBlacklisted(identifier)) {
        this.logSecurityEvent(request, identifier, 'blacklisted');
        this.throwRateLimitException(RATE_LIMIT_MESSAGES.BLACKLISTED, 0);
      }

      // Vérifier les limites
      const result = await this.rateLimitingService.checkLimit(identifier, options);
      
      // Définir les headers HTTP
      this.setHeaders(response, result);
      
      if (!result.allowed) {
        this.logRateLimitExceeded(request, identifier, result);
        this.throwRateLimitException(
          options.message || RATE_LIMIT_MESSAGES.EXCEEDED,
          Math.ceil((result.resetTime - Date.now()) / 1000)
        );
      }

      // Log de la requête autorisée (debug level)
      this.loggerService.debug(
        `Rate limit check passed for ${identifier}`,
        JSON.stringify({
          identifier,
          remaining: result.remaining,
          totalRequests: result.totalRequests,
        })
      );

      return true;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      // En cas d'erreur système, on log et on autorise (fail-open)
      this.logger.error('Rate limiting system error:', error);
      this.loggerService.logErrorEvent(
        error,
        'RateLimitingGuard',
        this.extractUserId(request),
        {
          ip: this.getClientIp(request),
          userAgent: request.headers['user-agent'],
          url: request.url,
        }
      );

      return true;
    }
  }

  /**
   * Génère un identifiant unique pour le rate limiting
   */
  private generateIdentifier(request: Request, options: RateLimitOptions): string {
    // Utiliser le keyGenerator personnalisé si fourni
    if (options.keyGenerator) {
      return options.keyGenerator(request);
    }

    // Construire l'identifiant par défaut
    const ip = this.getClientIp(request);
    const userId = this.extractUserId(request);
    const route = this.getRoutePattern(request);

    // Priorité : user > IP > route
    if (userId) {
      return `user:${userId}:${route}`;
    }

    return `ip:${ip}:${route}`;
  }

  /**
   * Extrait l'IP du client
   */
  private getClientIp(request: Request): string {
    const forwarded = request.headers['x-forwarded-for'] as string;
    const realIp = request.headers['x-real-ip'] as string;
    
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }
    
    if (realIp) {
      return realIp;
    }
    
    return request.socket.remoteAddress || request.ip || 'unknown';
  }

  /**
   * Extrait l'ID utilisateur du token/session
   */
  private extractUserId(request: Request): string | null {
    // Essayer d'extraire depuis le JWT
    const user = (request as any).user;
    if (user && user.id) {
      return user.id;
    }

    // Essayer d'extraire depuis la session
    const session = (request as any).session;
    if (session && session.userId) {
      return session.userId;
    }

    return null;
  }

  /**
   * Obtient le pattern de route
   */
  private getRoutePattern(request: Request): string {
    const route = (request as any).route;
    if (route && route.path) {
      return `${request.method}:${route.path}`;
    }

    // Fallback sur l'URL sans query params
    const url = request.url.split('?')[0];
    return `${request.method}:${url}`;
  }

  /**
   * Définit les headers HTTP de rate limiting
   */
  private setHeaders(response: Response, result: any): void {
    response.set(RATE_LIMIT_HEADERS.limit, result.limit?.toString() || '');
    response.set(RATE_LIMIT_HEADERS.remaining, result.remaining.toString());
    response.set(RATE_LIMIT_HEADERS.reset, Math.ceil(result.resetTime / 1000).toString());
    
    if (!result.allowed) {
      const retryAfter = Math.ceil((result.resetTime - Date.now()) / 1000);
      response.set(RATE_LIMIT_HEADERS.retryAfter, retryAfter.toString());
    }
  }

  /**
   * Lance une exception HTTP avec les bonnes informations
   */
  private throwRateLimitException(message: string, retryAfter: number): never {
    throw new HttpException(
      {
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
        error: 'Too Many Requests',
        message,
        retryAfter,
      },
      HttpStatus.TOO_MANY_REQUESTS
    );
  }

  /**
   * Log un événement de dépassement de limite
   */
  private logRateLimitExceeded(request: Request, identifier: string, result: any): void {
    const ip = this.getClientIp(request);
    const userId = this.extractUserId(request);
    const userAgent = request.headers['user-agent'];
    const url = request.url;

    this.loggerService.logSecurityEvent(
      'RATE_LIMIT_EXCEEDED',
      userId,
      ip,
      userAgent,
      {
        identifier,
        url,
        method: request.method,
        remaining: result.remaining,
        totalRequests: result.totalRequests,
        resetTime: new Date(result.resetTime),
      }
    );
  }

  /**
   * Log un événement de sécurité
   */
  private logSecurityEvent(request: Request, identifier: string, eventType: string): void {
    const ip = this.getClientIp(request);
    const userId = this.extractUserId(request);
    const userAgent = request.headers['user-agent'];

    this.loggerService.logSecurityEvent(
      `RATE_LIMIT_${eventType.toUpperCase()}`,
      userId,
      ip,
      userAgent,
      {
        identifier,
        url: request.url,
        method: request.method,
      }
    );
  }
}