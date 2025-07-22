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
exports.AuthInterceptor = void 0;
const common_1 = require("@nestjs/common");
const operators_1 = require("rxjs/operators");
const prisma_service_1 = require("../../../shared/prisma/prisma.service");
const logger_service_1 = require("../../../shared/logger/logger.service");
const redis_service_1 = require("../../../shared/redis/redis.service");
let AuthInterceptor = class AuthInterceptor {
    prisma;
    redis;
    logger;
    constructor(prisma, redis, loggerService) {
        this.prisma = prisma;
        this.redis = redis;
        this.logger = loggerService.createChildLogger('AuthInterceptor');
    }
    async intercept(context, next) {
        const request = context.switchToHttp().getRequest();
        const response = context.switchToHttp().getResponse();
        const user = request.user;
        if (user && user.id && !user.enriched) {
            try {
                await this.enrichUserData(request);
            }
            catch (error) {
                this.logger.logErrorEvent(error, 'AuthInterceptor.enrichUserData', user.id, JSON.stringify({
                    path: request.path,
                    method: request.method,
                    errorMessage: error.message,
                }));
            }
        }
        if (user && user.id) {
            this.trackUserActivity(request);
        }
        const startTime = Date.now();
        return next.handle().pipe((0, operators_1.tap)(() => {
            const duration = Date.now() - startTime;
            if (user && user.id) {
                this.logAuthenticatedRequest(request, response, duration);
            }
        }));
    }
    async enrichUserData(request) {
        const user = request.user;
        const cacheKey = `user:enriched:${user.id}`;
        try {
            const cachedUser = await this.redis.getCache(cacheKey);
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
                this.logger.logErrorEvent(new Error('User not found during enrichment'), 'AuthInterceptor.enrichUserData', user.id, JSON.stringify({ userId: user.id }));
                return;
            }
            const enrichedData = {
                firstName: enrichedUser.first_name,
                lastName: enrichedUser.last_name,
                isActive: enrichedUser.is_active,
                emailVerified: enrichedUser.email_verified,
                phoneVerified: enrichedUser.phone_verified,
                lastLogin: enrichedUser.last_login,
                createdAt: enrichedUser.created_at,
                updatedAt: enrichedUser.updated_at,
                profile: enrichedUser.user_profiles?.[0] || null,
            };
            request.user = {
                ...user,
                ...enrichedData,
                enriched: true,
            };
            await this.redis.setCache(cacheKey, enrichedData, 300);
            this.logger.logCacheEvent('set', cacheKey, 300);
            this.logger.logBusinessEvent('USER_DATA_ENRICHED', JSON.stringify({
                userId: user.id,
                hasProfile: !!enrichedData.profile,
            }), user.id);
        }
        catch (error) {
            this.logger.logErrorEvent(error, 'AuthInterceptor.enrichUserData', user.id, JSON.stringify({
                errorMessage: error.message,
                stack: error.stack,
            }));
            throw error;
        }
    }
    async trackUserActivity(request) {
        const user = request.user;
        try {
            this.prisma.users.update({
                where: { id: user.id },
                data: {
                    last_login: new Date(),
                },
            }).catch(error => {
                this.logger.logErrorEvent(error, 'AuthInterceptor.updateUserActivity', user.id, JSON.stringify({
                    path: request.path,
                    method: request.method,
                    errorMessage: error.message,
                }));
            });
            this.logger.logBusinessEvent('USER_ACTIVITY_TRACKED', JSON.stringify({
                action: 'API_REQUEST',
                method: request.method,
                path: request.path,
                userAgent: request.get('user-agent'),
                ip: request.ip,
            }), user.id);
            const activityData = {
                lastActivity: new Date(),
                lastPath: request.path,
                lastMethod: request.method,
                lastUserAgent: request.get('user-agent'),
                lastIp: request.ip || request.connection?.remoteAddress,
            };
            const activityCacheKey = `user:activity:${user.id}`;
            await this.redis.setCache(activityCacheKey, activityData, 3600);
        }
        catch (error) {
            this.logger.logErrorEvent(error, 'AuthInterceptor.trackUserActivity', user.id, JSON.stringify({
                path: request.path,
                method: request.method,
                errorMessage: error.message,
            }));
        }
    }
    logAuthenticatedRequest(request, response, duration) {
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
            const isError = response.statusCode >= 400;
            const isWarning = response.statusCode >= 300;
            if (isError) {
                this.logger.logErrorEvent(new Error(`HTTP ${response.statusCode} on ${request.method} ${request.path}`), 'AuthInterceptor.authenticatedRequest', user.id, JSON.stringify(requestData));
            }
            else if (isWarning) {
                this.logger.warn('Authenticated request redirect', JSON.stringify(requestData));
            }
            else {
                this.logger.info('Authenticated request completed', JSON.stringify(requestData));
            }
            this.logSecurityEvents(request, response, user);
        }
        catch (error) {
            this.logger.logErrorEvent(error, 'AuthInterceptor.logAuthenticatedRequest', user.id, JSON.stringify({ errorMessage: error.message }));
        }
    }
    logSecurityEvents(request, response, user) {
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
        const isSensitive = sensitiveEndpoints.some(endpoint => request.path.includes(endpoint));
        if (isSensitive) {
            this.logger.logSecurityEvent('SENSITIVE_ENDPOINT_ACCESS', user.id, request.ip, request.get('user-agent'), JSON.stringify({
                endpoint: request.path,
                method: request.method,
                statusCode: response.statusCode,
                timestamp: new Date().toISOString(),
            }));
        }
        if (response.statusCode === 401) {
            this.logger.logSecurityEvent('AUTHENTICATION_FAILURE', user.id, request.ip, request.get('user-agent'), JSON.stringify({
                endpoint: request.path,
                method: request.method,
                reason: 'Invalid or expired token',
            }));
        }
        if (response.statusCode === 403) {
            this.logger.logSecurityEvent('ACCESS_DENIED', user.id, request.ip, request.get('user-agent'), JSON.stringify({
                endpoint: request.path,
                method: request.method,
                reason: 'Insufficient permissions',
            }));
        }
    }
};
exports.AuthInterceptor = AuthInterceptor;
exports.AuthInterceptor = AuthInterceptor = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        redis_service_1.RedisService,
        logger_service_1.LoggerService])
], AuthInterceptor);
//# sourceMappingURL=auth.interceptor.js.map