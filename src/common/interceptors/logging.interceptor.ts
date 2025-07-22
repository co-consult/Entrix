 import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { LoggerService } from '../../shared/logger/logger.service';

/**
 * Intercepteur pour logger toutes les requêtes HTTP
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private logger: LoggerService) {
    this.logger.setContext('HTTP');
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const { method, url, body, headers } = request;
    const userAgent = headers['user-agent'] || '';
    const ip = request.ip || request.connection.remoteAddress;
    const userId = request.user?.id;

    const now = Date.now();

    // Log de la requête entrante
    this.logger.debug(
      `Incoming Request: ${method} ${url} - IP: ${ip} - User: ${userId || 'anonymous'}`,
    );

    // Log du body pour les méthodes POST/PUT/PATCH (sauf mots de passe)
    if (['POST', 'PUT', 'PATCH'].includes(method) && body) {
      const sanitizedBody = this.sanitizeBody(body);
      this.logger.debug(`Request Body: ${JSON.stringify(sanitizedBody)}`);
    }

    return next.handle().pipe(
      tap({
        next: (data) => {
          const responseTime = Date.now() - now;
          const { statusCode } = response;

          // Log de la réponse
          this.logger.log(method, url, statusCode, responseTime, userId);

          // Log des réponses lentes
          if (responseTime > 1000) {
            this.logger.warn(
              `Slow request detected: ${method} ${url} took ${responseTime}ms`,
            );
          }
        },
        error: (error) => {
          const responseTime = Date.now() - now;
          const statusCode = error.status || 500;

          // Log de l'erreur
          this.logger.log(method, url, statusCode, responseTime, userId);
          this.logger.error(
            `Request failed: ${method} ${url} - Status: ${statusCode} - ${error.message}`,
            error.stack,
          );
        },
      }),
    );
  }

  /**
   * Supprime les informations sensibles du body avant de les logger
   */
  private sanitizeBody(body: any): any {
    const sensitiveFields = ['password', 'token', 'secret', 'creditCard', 'cvv'];
    const sanitized = { ...body };

    sensitiveFields.forEach((field) => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    });

    return sanitized;
  }
}
