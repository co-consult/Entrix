// src/modules/users/interceptors/analytics.interceptor.ts

import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
  } from '@nestjs/common';
  import { Observable } from 'rxjs';
  import { tap } from 'rxjs/operators';
  import { LoggerService } from '../../../shared/logger/logger.service';
  import { BullmqService } from '../../../shared/bullmq/bullmq.service';
  
  @Injectable()
  export class AnalyticsInterceptor implements NestInterceptor {
    constructor(
      private readonly logger: LoggerService,
      private readonly bullmq: BullmqService,
    ) {}
  
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
      const request = context.switchToHttp().getRequest();
      const startTime = Date.now();
  
      return next.handle().pipe(
        tap((data) => {
          const duration = Date.now() - startTime;
          
          // Envoyer les événements analytics en arrière-plan
          this.trackAnalyticsEvent(request, data, duration);
        }),
      );
    }
  
    private async trackAnalyticsEvent(request: any, data: any, duration: number): Promise<void> {
      const userId = request.user?.id;
      const path = request.path;
      const method = request.method;
      const timestamp = new Date();
  
      try {
        // Événements analytics pour les utilisateurs
        if (this.shouldTrackEvent(path, method)) {
          const analyticsEvent = this.buildAnalyticsEvent(request, data, duration, timestamp);
          
          if (analyticsEvent) {
            // Envoyer l'événement dans la queue analytics (non-bloquant)
            await this.bullmq.addJob('user-analytics', 'TRACK_EVENT', analyticsEvent, {
              priority: 3, // Priorité normale pour analytics
              attempts: 3,
              backoff: {
                type: 'exponential',
                delay: 2000,
              },
            });
  
            this.logger.info('Analytics event queued', JSON.stringify({
              eventType: analyticsEvent.eventType,
              userId: analyticsEvent.userId,
              path: analyticsEvent.path,
              duration,
            }));
          }
        }
      } catch (error) {
        this.logger.warn('AnalyticsInterceptor: Failed to track analytics event', JSON.stringify({
          error: error.message,
          userId,
          path,
          method,
        }));
      }
    }
  
    private shouldTrackEvent(path: string, method: string): boolean {
      // Événements à tracker
      const trackableEvents = [
        // Gestion utilisateurs
        { path: '/users', method: 'POST' }, // Création utilisateur
        { path: '/users/', method: 'GET' }, // Consultation profil
        { path: '/users/', method: 'PUT' }, // Mise à jour profil
        { path: '/users/search', method: 'GET' }, // Recherche utilisateurs
        
        // Gestion groupes
        { path: '/groups', method: 'POST' }, // Création groupe
        { path: '/groups/', method: 'GET' }, // Consultation groupe
        { path: '/groups/', method: 'PUT' }, // Mise à jour groupe
        { path: '/groups/', method: 'DELETE' }, // Suppression groupe
        { path: '/groups/join', method: 'POST' }, // Rejoindre groupe
        { path: '/groups/leave', method: 'POST' }, // Quitter groupe
        { path: '/groups/invite', method: 'POST' }, // Inviter membres
        
        // Gestion profils
        { path: '/profiles', method: 'POST' }, // Création profil
        { path: '/profiles/', method: 'PUT' }, // Mise à jour profil
        { path: '/profiles/avatar', method: 'POST' }, // Upload avatar
        { path: '/profiles/completion', method: 'GET' }, // Vérification complétion
        
        // Conversion anonyme
        { path: '/anonymous', method: 'POST' }, // Création utilisateur anonyme
        { path: '/anonymous/convert', method: 'POST' }, // Conversion
        
        // Invitations
        { path: '/invitations', method: 'POST' }, // Envoi invitation
        { path: '/invitations/respond', method: 'POST' }, // Réponse invitation
        { path: '/invitations/bulk', method: 'POST' }, // Invitations en masse
      ];
  
      return trackableEvents.some(event => {
        if (event.path.endsWith('/')) {
          return path.includes(event.path) && method === event.method;
        }
        return path === event.path && method === event.method;
      });
    }
  
    private buildAnalyticsEvent(request: any, data: any, duration: number, timestamp: Date): any {
      const userId = request.user?.id;
      const path = request.path;
      const method = request.method;
  
      // Événement de base
      const baseEvent = {
        userId,
        anonymousId: request.anonymousUser?.id,
        sessionId: request.sessionId,
        timestamp: timestamp.toISOString(),
        duration,
        path,
        method,
        userAgent: request.get('user-agent'),
        ip: request.ip,
        referer: request.get('referer'),
      };
  
      // Construire l'événement spécifique selon le type d'action
      if (method === 'POST' && path === '/users') {
        return {
          ...baseEvent,
          eventType: 'USER_REGISTERED',
          properties: {
            registrationMethod: 'DIRECT',
            emailVerified: data?.emailVerified || false,
            hasProfile: !!data?.profile,
            source: request.body?.metadata?.source || 'web',
          },
        };
      }
  
      if (method === 'POST' && path.includes('/groups') && !path.includes('/invite')) {
        return {
          ...baseEvent,
          eventType: 'GROUP_CREATED',
          properties: {
            groupType: data?.type || request.body?.type,
            isPrivate: data?.settings?.isPrivate || request.body?.settings?.isPrivate,
            maxMembers: data?.settings?.maxMembers || request.body?.settings?.maxMembers,
            initialInvites: request.body?.initialInvites?.length || 0,
          },
        };
      }
  
      if (method === 'POST' && path.includes('/groups') && path.includes('/join')) {
        return {
          ...baseEvent,
          eventType: 'GROUP_JOINED',
          properties: {
            groupId: request.params?.groupId,
            joinMethod: 'DIRECT',
            groupType: request.group?.type,
          },
        };
      }
  
      if (method === 'POST' && path.includes('/groups') && path.includes('/invite')) {
        return {
          ...baseEvent,
          eventType: 'GROUP_INVITATION_SENT',
          properties: {
            groupId: request.params?.groupId,
            invitationType: Array.isArray(request.body?.invitations) ? 'BULK' : 'SINGLE',
            inviteCount: Array.isArray(request.body?.invitations) ? 
              request.body.invitations.length : 1,
            hasPersonalMessage: !!request.body?.message,
          },
        };
      }
  
      if (method === 'POST' && path.includes('/profiles')) {
        return {
          ...baseEvent,
          eventType: 'PROFILE_CREATED',
          properties: {
            hasAvatar: !!data?.avatar,
            country: data?.country || request.body?.country,
            language: data?.language || request.body?.language,
            completionPercentage: data?.completionPercentage || 0,
          },
        };
      }
  
      if (method === 'PUT' && path.includes('/profiles')) {
        return {
          ...baseEvent,
          eventType: 'PROFILE_UPDATED',
          properties: {
            fieldsUpdated: Object.keys(request.body || {}),
            updateType: this.determineUpdateType(request.body),
          },
        };
      }
  
      if (method === 'POST' && path.includes('/profiles/avatar')) {
        return {
          ...baseEvent,
          eventType: 'AVATAR_UPLOADED',
          properties: {
            fileSize: data?.fileSize,
            format: data?.mimeType,
            hasExistingAvatar: !!request.user?.avatar,
          },
        };
      }
  
      if (method === 'POST' && path.includes('/anonymous/convert')) {
        return {
          ...baseEvent,
          eventType: 'ANONYMOUS_CONVERTED',
          properties: {
            incentiveType: data?.incentiveDetails?.type,
            incentiveValue: data?.incentiveDetails?.value,
            incentiveApplied: data?.incentiveApplied,
            migrationSummary: data?.migrationSummary,
            onboardingSource: request.body?.onboardingKey?.split('_')[2], // Extract source from key
          },
        };
      }
  
      if (method === 'POST' && path.includes('/invitations/respond')) {
        return {
          ...baseEvent,
          eventType: 'INVITATION_RESPONDED',
          properties: {
            response: request.body?.response,
            invitationType: data?.invitation?.type,
            hasMessage: !!request.body?.message,
            hasReason: !!request.body?.reason,
          },
        };
      }
  
      if (method === 'GET' && path.includes('/users/search')) {
        return {
          ...baseEvent,
          eventType: 'USER_SEARCH',
          properties: {
            query: request.query?.query,
            hasFilters: Object.keys(request.query || {}).length > 2, // Exclut page et limit
            resultsCount: data?.total || 0,
          },
        };
      }
  
      // Événement générique si aucun type spécifique trouvé
      return {
        ...baseEvent,
        eventType: 'USER_ACTION',
        properties: {
          action: `${method}_${path.replace(/\//g, '_')}`,
        },
      };
    }
  
    private determineUpdateType(body: any): string {
      if (!body) return 'UNKNOWN';
  
      const personalFields = ['firstName', 'lastName', 'phone', 'dateOfBirth', 'gender'];
      const locationFields = ['city', 'country'];
      const preferencesFields = ['language', 'timezone', 'currency', 'preferences'];
      const privacyFields = ['notifications', 'privacy'];
  
      const updatedFields = Object.keys(body);
  
      if (updatedFields.some(field => personalFields.includes(field))) return 'PERSONAL_INFO';
      if (updatedFields.some(field => locationFields.includes(field))) return 'LOCATION';
      if (updatedFields.some(field => preferencesFields.includes(field))) return 'PREFERENCES';
      if (updatedFields.some(field => privacyFields.includes(field))) return 'PRIVACY_SETTINGS';
  
      return 'OTHER';
    }
  } 