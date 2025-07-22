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
exports.LoggingInterceptor = void 0;
const common_1 = require("@nestjs/common");
const operators_1 = require("rxjs/operators");
const rxjs_1 = require("rxjs");
const logger_service_1 = require("../../../shared/logger/logger.service");
let LoggingInterceptor = class LoggingInterceptor {
    logger;
    constructor(logger) {
        this.logger = logger;
    }
    intercept(context, next) {
        const request = context.switchToHttp().getRequest();
        const response = context.switchToHttp().getResponse();
        const startTime = Date.now();
        const requestInfo = {
            method: request.method,
            path: request.path,
            query: request.query,
            userId: request.user?.id,
            userAgent: request.get('user-agent'),
            ip: request.ip,
            timestamp: new Date().toISOString(),
        };
        this.logger.info('Incoming request', JSON.stringify({
            ...requestInfo,
            body: this.sanitizeBody(request.body),
        }));
        return next.handle().pipe((0, operators_1.tap)((data) => {
            const duration = Date.now() - startTime;
            const responseInfo = {
                ...requestInfo,
                statusCode: response.statusCode,
                duration,
                responseSize: this.getResponseSize(data),
            };
            this.logger.info('Request completed successfully', JSON.stringify(responseInfo));
            this.logBusinessEvents(request, data, duration);
        }), (0, operators_1.catchError)((error) => {
            const duration = Date.now() - startTime;
            const errorInfo = {
                ...requestInfo,
                statusCode: error.status || 500,
                duration,
                error: error.message,
                stack: error.stack,
            };
            this.logger.error('Request failed', error.stack, JSON.stringify(errorInfo));
            this.logBusinessErrors(request, error, duration);
            return (0, rxjs_1.throwError)(() => error);
        }));
    }
    sanitizeBody(body) {
        if (!body)
            return body;
        const sanitized = { ...body };
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
    getResponseSize(data) {
        if (!data)
            return 0;
        try {
            return JSON.stringify(data).length;
        }
        catch {
            return 0;
        }
    }
    logBusinessEvents(request, data, duration) {
        const userId = request.user?.id;
        const path = request.path;
        const method = request.method;
        try {
            if (method === 'POST' && path.includes('/users') && !path.includes('/groups')) {
                this.logger.logBusinessEvent('USER_CREATED', {
                    userId: data?.id || data?.user?.id,
                    email: data?.email || data?.user?.email,
                    registrationMethod: 'DIRECT',
                    duration,
                }, userId);
            }
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
            if (path.includes('/anonymous/convert')) {
                this.logger.logBusinessEvent('ANONYMOUS_CONVERTED', {
                    onboardingKey: request.body?.onboardingKey,
                    newUserId: data?.user?.id,
                    incentiveApplied: data?.incentiveApplied,
                    incentiveType: data?.incentiveDetails?.type,
                    duration,
                }, data?.user?.id);
            }
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
        }
        catch (error) {
            this.logger.warn('LoggingInterceptor: Failed to log business event', JSON.stringify({
                error: error.message,
                path,
                method,
                userId,
            }));
        }
    }
    logBusinessErrors(request, error, duration) {
        const userId = request.user?.id;
        const path = request.path;
        const method = request.method;
        try {
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
            if (error.status === 400 && error.message?.includes('validation')) {
                this.logger.logBusinessEvent('VALIDATION_ERROR', {
                    action: `${method} ${path}`,
                    userId: userId,
                    validationErrors: error.response?.message || error.message,
                    body: this.sanitizeBody(request.body),
                    duration,
                }, userId);
            }
        }
        catch (logError) {
            this.logger.warn('LoggingInterceptor: Failed to log business error', JSON.stringify({
                error: logError.message,
                originalError: error.message,
                path,
                method,
                userId,
            }));
        }
    }
};
exports.LoggingInterceptor = LoggingInterceptor;
exports.LoggingInterceptor = LoggingInterceptor = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [logger_service_1.LoggerService])
], LoggingInterceptor);
//# sourceMappingURL=logging.interceptor.js.map