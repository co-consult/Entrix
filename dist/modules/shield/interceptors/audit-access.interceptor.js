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
exports.AuditAccessInterceptor = void 0;
const common_1 = require("@nestjs/common");
const operators_1 = require("rxjs/operators");
const logger_service_1 = require("../../../shared/logger/logger.service");
const bullmq_service_1 = require("../../../shared/bullmq/bullmq.service");
const access_enums_1 = require("../types/access-enums");
const shield_constants_1 = require("../types/shield-constants");
let AuditAccessInterceptor = class AuditAccessInterceptor {
    bullmq;
    logger;
    CRITICAL_ROUTES = [
        '/shield/access-rights/validate',
        '/shield/roles/assign',
        '/shield/permissions/assign',
        '/shield/access-control/validate',
    ];
    ACTION_MAP = {
        'GET': 'READ',
        'POST': 'CREATE',
        'PUT': 'UPDATE',
        'PATCH': 'UPDATE',
        'DELETE': 'DELETE',
    };
    constructor(bullmq, loggerService) {
        this.bullmq = bullmq;
        this.logger = loggerService.createChildLogger('AuditAccessInterceptor');
    }
    intercept(context, next) {
        const request = context.switchToHttp().getRequest();
        const response = context.switchToHttp().getResponse();
        request.startTime = Date.now();
        const shouldAudit = this.shouldAuditRoute(request);
        if (!shouldAudit) {
            return next.handle();
        }
        const baseAuditData = this.prepareBaseAuditData(request);
        return next.handle().pipe((0, operators_1.tap)((responseData) => {
            this.auditSuccessfulRequest(request, response, responseData, baseAuditData);
        }), (0, operators_1.catchError)((error) => {
            this.auditFailedRequest(request, response, error, baseAuditData);
            throw error;
        }));
    }
    shouldAuditRoute(request) {
        if (this.CRITICAL_ROUTES.some(route => request.path.includes(route))) {
            return true;
        }
        if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
            return true;
        }
        const sensitiveKeywords = ['validate', 'check', 'permissions', 'roles', 'audit'];
        if (sensitiveKeywords.some(keyword => request.path.includes(keyword))) {
            return true;
        }
        return false;
    }
    prepareBaseAuditData(request) {
        return {
            user_id: request.user?.id || null,
            ip_address: this.extractClientIP(request),
            user_agent: request.headers['user-agent'] || null,
            path: request.path,
            method: request.method,
            action: this.ACTION_MAP[request.method] || 'UNKNOWN',
            resource_type: this.extractResourceType(request),
            resource_id: this.extractResourceId(request),
            request_body: this.sanitizeRequestBody(request.body),
            query_params: request.query,
            timestamp: new Date(),
        };
    }
    auditSuccessfulRequest(request, response, responseData, baseAuditData) {
        const endTime = Date.now();
        const duration = endTime - (request.startTime || endTime);
        const auditData = {
            ...baseAuditData,
            event_type: this.determineEventType(request, true),
            status: access_enums_1.AccessStatus.SUCCESS,
            response_status: response.statusCode,
            response_time_ms: duration,
            details: {
                success: true,
                response_size: JSON.stringify(responseData || {}).length,
                ...this.extractSpecificAuditDetails(request, responseData),
            },
        };
        this.sendToAuditQueue(auditData);
    }
    auditFailedRequest(request, response, error, baseAuditData) {
        const endTime = Date.now();
        const duration = endTime - (request.startTime || endTime);
        const auditData = {
            ...baseAuditData,
            event_type: this.determineEventType(request, false),
            status: access_enums_1.AccessStatus.DENIED,
            response_status: error.status || 500,
            response_time_ms: duration,
            details: {
                success: false,
                error_type: error.constructor.name,
                error_message: error.message,
                error_code: error.code || 'UNKNOWN_ERROR',
                stack_trace: process.env.NODE_ENV === 'development' ? error.stack : undefined,
                ...this.extractSpecificAuditDetails(request, null),
            },
        };
        this.sendToAuditQueue(auditData);
    }
    determineEventType(request, success) {
        const path = request.path.toLowerCase();
        if (path.includes('validate')) {
            return success ? access_enums_1.AuditEventType.ACCESS_GRANTED : access_enums_1.AuditEventType.ACCESS_DENIED;
        }
        if (path.includes('permission')) {
            if (request.method === 'POST' && path.includes('assign')) {
                return access_enums_1.AuditEventType.PERMISSION_GRANTED;
            }
            if (request.method === 'DELETE' && path.includes('assign')) {
                return access_enums_1.AuditEventType.PERMISSION_REVOKED;
            }
        }
        if (path.includes('role')) {
            if (request.method === 'POST' && path.includes('assign')) {
                return access_enums_1.AuditEventType.ROLE_ASSIGNED;
            }
            if (request.method === 'DELETE' && path.includes('assign')) {
                return access_enums_1.AuditEventType.ROLE_REMOVED;
            }
        }
        if (path.includes('access-right')) {
            if (request.method === 'POST') {
                return access_enums_1.AuditEventType.ACCESS_RIGHT_CREATED;
            }
            if (path.includes('validate')) {
                return success ? access_enums_1.AuditEventType.ACCESS_RIGHT_USED : access_enums_1.AuditEventType.UNAUTHORIZED_ATTEMPT;
            }
        }
        return success ? access_enums_1.AuditEventType.ACCESS_GRANTED : access_enums_1.AuditEventType.UNAUTHORIZED_ATTEMPT;
    }
    extractResourceType(request) {
        const path = request.path.toLowerCase();
        if (path.includes('access-right'))
            return access_enums_1.ResourceType.ACCESS_RIGHT;
        if (path.includes('role'))
            return access_enums_1.ResourceType.ROLE;
        if (path.includes('permission'))
            return access_enums_1.ResourceType.PERMISSION;
        if (path.includes('user'))
            return access_enums_1.ResourceType.USER;
        if (path.includes('event'))
            return access_enums_1.ResourceType.EVENT;
        if (path.includes('organizer'))
            return access_enums_1.ResourceType.ORGANIZER;
        if (path.includes('venue'))
            return access_enums_1.ResourceType.VENUE;
        if (path.includes('ticket'))
            return access_enums_1.ResourceType.TICKET;
        if (path.includes('order'))
            return access_enums_1.ResourceType.ORDER;
        if (path.includes('subscription'))
            return access_enums_1.ResourceType.SUBSCRIPTION;
        if (path.includes('group'))
            return access_enums_1.ResourceType.GROUP;
        return access_enums_1.ResourceType.ACCESS_RIGHT;
    }
    extractResourceId(request) {
        const commonIdParams = ['id', 'userId', 'roleId', 'permissionId', 'eventId', 'organizerId'];
        for (const param of commonIdParams) {
            if (request.params[param]) {
                return request.params[param];
            }
        }
        if (request.body) {
            for (const param of commonIdParams) {
                if (request.body[param]) {
                    return request.body[param];
                }
            }
        }
        return null;
    }
    extractClientIP(request) {
        return request.headers['x-forwarded-for'] ||
            request.headers['x-real-ip'] ||
            request.ip ||
            'unknown';
    }
    sanitizeRequestBody(body) {
        if (!body || typeof body !== 'object') {
            return body;
        }
        const sensitiveFields = ['password', 'secret', 'token', 'key', 'credential'];
        const sanitized = { ...body };
        for (const field of sensitiveFields) {
            if (sanitized[field]) {
                sanitized[field] = '[REDACTED]';
            }
        }
        return sanitized;
    }
    extractSpecificAuditDetails(request, responseData) {
        const details = {};
        if (request.path.includes('validate')) {
            details.access_code = request.body?.access_code ? '[PRESENT]' : '[MISSING]';
            details.action = request.body?.action;
            details.access_point = request.body?.access_point;
            if (responseData?.data) {
                details.validation_result = {
                    isValid: responseData.data.isValid,
                    status: responseData.data.status,
                    remaining_uses: responseData.data.metadata?.remaining_uses,
                };
            }
        }
        if (request.path.includes('assign')) {
            details.target_user_id = request.body?.user_id || request.params?.userId;
            details.assigned_role_id = request.body?.role_id || request.params?.roleId;
            details.assigned_permission_id = request.body?.permission_id || request.params?.permissionId;
        }
        return details;
    }
    async sendToAuditQueue(auditData) {
        try {
            await this.bullmq.addJob(shield_constants_1.SHIELD_CONSTANTS.QUEUES.ACCESS_AUDIT, shield_constants_1.SHIELD_CONSTANTS.JOBS.LOG_ACCESS_EVENT, auditData, {
                priority: shield_constants_1.SHIELD_CONSTANTS.JOB_PRIORITIES.HIGH,
                attempts: 3,
                backoff: {
                    type: 'exponential',
                    delay: 2000,
                },
            });
        }
        catch (error) {
            this.logger.logErrorEvent(error, 'AuditAccessInterceptor.sendToAuditQueue', auditData.user_id || 'unknown', { auditData });
            this.logger.logBusinessEvent('AUDIT_EVENT_FALLBACK', auditData, auditData.user_id);
        }
    }
};
exports.AuditAccessInterceptor = AuditAccessInterceptor;
exports.AuditAccessInterceptor = AuditAccessInterceptor = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [bullmq_service_1.BullmqService,
        logger_service_1.LoggerService])
], AuditAccessInterceptor);
//# sourceMappingURL=audit-access.interceptor.js.map