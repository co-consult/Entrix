// src/modules/users/interceptors/logging.interceptor.ts

import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
  } from '@nestjs/common';
  import { Observable } from 'rxjs';
  import { tap, catchError } from 'rxjs/operators';
  import { throwError } from 'rxjs';
  import { LoggerService } from '../../../shared/logger/logger.service';
  
  @Injectable()
  export class LoggingInterceptor implements NestInterceptor {
    constructor(private readonly logger: LoggerService) {}
  
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
      const request = context.switchToHttp().getRequest();
      const response = context.switchToHttp().getResponse();
      const startTime = Date.now();
  
      // Informations de base de la requête
      const requestInfo = {
        method: request.method,
        path: request.path,
        query: request.query,
        userId: request.user?.id,
        userAgent: request.get('user-agent'),
        ip: request.ip,
        timestamp: new Date().toISOString(),
      };
  
      // Logger le début de la requête
      this.logger.info('Incoming request', JSON.stringify({
        ...requestInfo,
        body: this.sanitizeBody(request.body),
      }));
  
      return next.handle().pipe(
        tap((data) => {
          const duration = Date.now() - startTime;
          const responseInfo = {
            ...requestInfo,
            statusCode: response.statusCode,
            duration,
            responseSize: this.getResponseSize(data),
          };
  
          // Logger la réponse réussie
          this.logger.info('Request completed successfully', JSON.stringify(responseInfo));
  
          // Logger les événements métier spécifiques
          this.logBusinessEvents(request, data, duration);
        }),
        catchError((error) => {
          const duration = Date.now() - startTime;
          const errorInfo = {
            ...requestInfo,
            statusCode: error.status || 500,
            duration,
            error: error.message,
            stack: error.stack,
          };
  
          // Logger l'erreur
          this.logger.error('Request failed', error.stack, JSON.stringify(errorInfo));
  
          // Logger les erreurs métier spécifiques
          this.logBusinessErrors(request, error, duration);
  
          return throwError(() => error);
        }),
      );
    }
  
    private sanitizeBody(body: any): any {
      if (!body) return body;
  
      // Créer une copie pour éviter de modifier l'original
      const sanitized = { ...body };
  
      // Masquer les champs sensibles
      const sensitiveFields = [
        'password',
        'passwordConfirm',
        'currentPassword',
        'newPassword',
        'token',
        'refreshToken',
        'accessToken',
        'secret',
        'key',
      ];
  
      sensitiveFields.forEach(field => {
        if (sanitized[field]) {
          sanitized[field] = '***MASKED***';
        }
      });
  
      return sanitized;
    }
  
    private getResponseSize(data: any): number {
      if (!data) return 0;
      
      try {
        return JSON.stringify(data).length;
      } catch {
        return 0;
      }
    }
  
    private logBusinessEvents(request: any, data: any, duration: number): void {
      const userId = request.user?.id;
      const path = request.path;
      const method = request.method;
  
      try {
        // Événements de création d'utilisateur
        if (method === 'POST' && path.includes('/users') && !path.includes('/groups')) {
          this.logger.logBusinessEvent('USER_CREATED', {
            userId: data?.id || data?.user?.id,
            email: data?.email || data?.user?.email,
            registrationMethod: 'DIRECT',
            duration,
          }, userId);
        }
  
        // Événements de groupe
        if (path.includes('/groups')) {
          if (method === 'POST' && !path.includes('/invite') && !path.includes('/join')) {
            this.logger.logBusinessEvent('GROUP_CREATED', {
              groupId: data?.id || data?.group?.id,
              groupName: data?.name || data?.group?.name,
              groupType: data?.type || data?.group?.type,
              createdBy: userId,
              duration,
            }, userId);
          }
  
          if (method === 'POST' && path.includes('/invite')) {
            this.logger.logBusinessEvent('GROUP_INVITATION_SENT', {
              groupId: request.params?.groupId,
              invitedEmail: request.body?.email || request.body?.invitedEmail,
              invitedUserId: request.body?.userId || request.body?.invitedUserId,
              invitedBy: userId,
              duration,
            }, userId);
          }
  
          if (method === 'POST' && path.includes('/join')) {
            this.logger.logBusinessEvent('GROUP_JOINED', {
              groupId: request.params?.groupId,
              userId: userId,
              joinMethod: 'DIRECT',
              duration,
            }, userId);
          }
        }
  
        // Événements de profil
        if (path.includes('/profiles')) {
          if (method === 'POST') {
            this.logger.logBusinessEvent('PROFILE_CREATED', {
              userId: data?.userId || userId,
              completionPercentage: data?.completionPercentage || 0,
              duration,
            }, userId);
          }
  
          if (method === 'PUT' || method === 'PATCH') {
            this.logger.logBusinessEvent('PROFILE_UPDATED', {
              userId: userId,
              fieldsUpdated: Object.keys(request.body || {}),
              duration,
            }, userId);
          }
        }
  
        // Événements de conversion anonyme
        if (path.includes('/anonymous/convert')) {
          this.logger.logBusinessEvent('ANONYMOUS_CONVERTED', {
            onboardingKey: request.body?.onboardingKey,
            newUserId: data?.user?.id,
            incentiveApplied: data?.incentiveApplied,
            incentiveType: data?.incentiveDetails?.type,
            duration,
          }, data?.user?.id);
        }
  
        // Événements d'invitation
        if (path.includes('/invitations')) {
          if (method === 'POST' && path.includes('/respond')) {
            this.logger.logBusinessEvent('INVITATION_RESPONDED', {
              invitationId: request.params?.invitationId,
              response: request.body?.response,
              userId: userId,
              duration,
            }, userId);
          }
        }
      } catch (error) {
        this.logger.warn('LoggingInterceptor: Failed to log business event', JSON.stringify({
          error: error.message,
          path,
          method,
          userId,
        }));
      }
    }
  
    private logBusinessErrors(request: any, error: any, duration: number): void {
      const userId = request.user?.id;
      const path = request.path;
      const method = request.method;
  
      try {
        // Logger les erreurs métier importantes
        if (error.status >= 400 && error.status < 500) {
          this.logger.logBusinessEvent('USER_ACTION_FAILED', {
            action: `${method} ${path}`,
            userId: userId,
            errorType: error.constructor.name,
            errorMessage: error.message,
            statusCode: error.status,
            duration,
          }, userId);
        }
  
        // Erreurs de sécurité
        if (error.status === 403 || error.status === 401) {
          this.logger.logBusinessEvent('SECURITY_VIOLATION', {
            action: `${method} ${path}`,
            userId: userId,
            violationType: error.status === 401 ? 'UNAUTHORIZED' : 'FORBIDDEN',
            userAgent: request.get('user-agent'),
            ip: request.ip,
            duration,
          }, userId);
        }
  
        // Erreurs de validation
        if (error.status === 400 && error.message?.includes('validation')) {
          this.logger.logBusinessEvent('VALIDATION_ERROR', {
            action: `${method} ${path}`,
            userId: userId,
            validationErrors: error.response?.message || error.message,
            body: this.sanitizeBody(request.body),
            duration,
          }, userId);
        }
      } catch (logError) {
        this.logger.warn('LoggingInterceptor: Failed to log business error', JSON.stringify({
          error: logError.message,
          originalError: error.message,
          path,
          method,
          userId,
        }));
      }
    }
  }