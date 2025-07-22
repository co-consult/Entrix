"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsInterceptor = void 0;
const common_1 = require("@nestjs/common");
const operators_1 = require("rxjs/operators");
const logger_service_1 = require("../../../shared/logger/logger.service");
const bullmq_service_1 = require("../../../shared/bullmq/bullmq.service");
let AnalyticsInterceptor = class AnalyticsInterceptor {
    logger;
    bullmq;
    constructor(logger, bullmq) {
        this.logger = logger;
        this.bullmq = bullmq;
    }
    intercept(context, next) {
        const request = context.switchToHttp().getRequest();
        const startTime = Date.now();
        return next.handle().pipe((0, operators_1.tap)((data) => {
            const duration = Date.now() - startTime;
            this.trackAnalyticsEvent(request, data, duration);
        }));
    }
    async trackAnalyticsEvent(request, data, duration) {
        const userId = request.user?.id;
        const path = request.path;
        const method = request.method;
        const timestamp = new Date();
        try {
            if (this.shouldTrackEvent(path, method)) {
                const analyticsEvent = this.buildAnalyticsEvent(request, data, duration, timestamp);
                if (analyticsEvent) {
                    await this.bullmq.addJob('user-analytics', 'TRACK_EVENT', analyticsEvent, {
                        priority: 3,
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
        }
        catch (error) {
            this.logger.warn('AnalyticsInterceptor: Failed to track analytics event', JSON.stringify({
                error: error.message,
                userId,
                path,
                method,
            }));
        }
    }
    shouldTrackEvent(path, method) {
        const trackableEvents = [
            { path: '/users', method: 'POST' },
            { path: '/users/', method: 'GET' },
            { path: '/users/', method: 'PUT' },
            { path: '/users/search', method: 'GET' },
            { path: '/groups', method: 'POST' },
            { path: '/groups/', method: 'GET' },
            { path: '/groups/', method: 'PUT' },
            { path: '/groups/', method: 'DELETE' },
            { path: '/groups/join', method: 'POST' },
            { path: '/groups/leave', method: 'POST' },
            { path: '/groups/invite', method: 'POST' },
            { path: '/profiles', method: 'POST' },
            { path: '/profiles/', method: 'PUT' },
            { path: '/profiles/avatar', method: 'POST' },
            { path: '/profiles/completion', method: 'GET' },
            { path: '/anonymous', method: 'POST' },
            { path: '/anonymous/convert', method: 'POST' },
            { path: '/invitations', method: 'POST' },
            { path: '/invitations/respond', method: 'POST' },
            { path: '/invitations/bulk', method: 'POST' },
        ];
        return trackableEvents.some(event => {
            if (event.path.endsWith('/')) {
                return path.includes(event.path) && method === event.method;
            }
            return path === event.path && method === event.method;
        });
    }
    buildAnalyticsEvent(request, data, duration, timestamp) {
        const userId = request.user?.id;
        const path = request.path;
        const method = request.method;
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
                    onboardingSource: request.body?.onboardingKey?.split('_')[2],
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
                    hasFilters: Object.keys(request.query || {}).length > 2,
                    resultsCount: data?.total || 0,
                },
            };
        }
        return {
            ...baseEvent,
            eventType: 'USER_ACTION',
            properties: {
                action: `${method}_${path.replace(/\//g, '_')}`,
            },
        };
    }
    determineUpdateType(body) {
        if (!body)
            return 'UNKNOWN';
        const personalFields = ['firstName', 'lastName', 'phone', 'dateOfBirth', 'gender'];
        const locationFields = ['city', 'country'];
        const preferencesFields = ['language', 'timezone', 'currency', 'preferences'];
        const privacyFields = ['notifications', 'privacy'];
        const updatedFields = Object.keys(body);
        if (updatedFields.some(field => personalFields.includes(field)))
            return 'PERSONAL_INFO';
        if (updatedFields.some(field => locationFields.includes(field)))
            return 'LOCATION';
        if (updatedFields.some(field => preferencesFields.includes(field)))
            return 'PREFERENCES';
        if (updatedFields.some(field => privacyFields.includes(field)))
            return 'PRIVACY_SETTINGS';
        return 'OTHER';
    }
};
exports.AnalyticsInterceptor = AnalyticsInterceptor;
exports.AnalyticsInterceptor = AnalyticsInterceptor = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [logger_service_1.LoggerService,
        bullmq_service_1.BullmqService])
], AnalyticsInterceptor);
//# sourceMappingURL=analytics.interceptor.js.map