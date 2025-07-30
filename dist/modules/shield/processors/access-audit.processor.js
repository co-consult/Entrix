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
exports.AccessAuditProcessor = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../shared/prisma/prisma.service");
const logger_service_1 = require("../../../shared/logger/logger.service");
const email_service_1 = require("../../../shared/email/email.service");
const access_enums_1 = require("../types/access-enums");
let AccessAuditProcessor = class AccessAuditProcessor {
    prisma;
    emailService;
    logger;
    constructor(prisma, emailService, loggerService) {
        this.prisma = prisma;
        this.emailService = emailService;
        this.logger = loggerService.createChildLogger('AccessAuditProcessor');
    }
    async processAccessAuditEvent(job) {
        const { data } = job;
        try {
            this.logger.info('Processing access audit event', JSON.stringify({
                jobId: job.id,
                eventType: data.event_type,
                userId: data.user_id,
                resourceType: data.resource_type,
                status: data.status,
            }));
            await this.storeAuditEvent(data);
            await this.detectAnomalies(data);
            await this.updateMetrics(data);
            await this.triggerNotifications(data);
            this.logger.info('Access audit event processed successfully', JSON.stringify({
                jobId: job.id,
                eventType: data.event_type,
            }));
        }
        catch (error) {
            this.logger.logErrorEvent(error, 'AccessAuditProcessor.processAccessAuditEvent', data.user_id || 'unknown', {
                jobId: job.id,
                eventType: data.event_type,
                errorType: error.constructor.name,
            });
            throw error;
        }
    }
    async storeAuditEvent(data) {
        try {
            await this.prisma.access_control_log.create({
                data: {
                    user_id: data.user_id,
                    action: data.action,
                    status: data.status,
                    ip_address: data.ip_address,
                    user_agent: data.user_agent,
                    access_point: data.details?.access_point || null,
                    additional_data: data.details || {},
                    created_at: data.timestamp,
                }
            });
        }
        catch (error) {
            this.logger.logErrorEvent(error, 'AccessAuditProcessor.storeAuditEvent', data.user_id || 'unknown', { eventType: data.event_type });
            throw error;
        }
    }
    async detectAnomalies(data) {
        try {
            const now = new Date();
            const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
            if (data.status === access_enums_1.AccessStatus.DENIED) {
                await this.detectFailedAttemptPattern(data, oneHourAgo);
            }
            if (data.user_id) {
                await this.detectSuspiciousAccess(data, oneHourAgo);
            }
            await this.detectActivitySpikes(data, oneHourAgo);
        }
        catch (error) {
            this.logger.logErrorEvent(error, 'AccessAuditProcessor.detectAnomalies', data.user_id || 'unknown', { eventType: data.event_type });
        }
    }
    async detectFailedAttemptPattern(data, since) {
        const failedAttempts = await this.prisma.access_control_log.count({
            where: {
                ip_address: data.ip_address,
                status: access_enums_1.AccessStatus.DENIED,
                created_at: { gte: since },
            }
        });
        if (failedAttempts >= 10) {
            await this.createSecurityAlert('HIGH_FAILURE_RATE', {
                ip_address: data.ip_address,
                failed_attempts: failedAttempts,
                time_window: '1h',
                severity: 'HIGH',
                message: `${failedAttempts} tentatives d'accès échouées détectées depuis l'IP ${data.ip_address}`,
            });
        }
    }
    async detectSuspiciousAccess(data, since) {
        if (!data.user_id)
            return;
        const recentIPs = await this.prisma.access_control_log.findMany({
            where: {
                user_id: data.user_id,
                created_at: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
            },
            select: { ip_address: true },
            distinct: ['ip_address'],
        });
        const knownIPs = recentIPs.map(entry => entry.ip_address);
        if (data.ip_address && !knownIPs.includes(data.ip_address)) {
            await this.createSecurityAlert('NEW_IP_ACCESS', {
                user_id: data.user_id,
                new_ip: data.ip_address,
                known_ips: knownIPs,
                severity: 'MEDIUM',
                message: `Accès depuis une nouvelle IP (${data.ip_address}) pour l'utilisateur ${data.user_id}`,
            });
        }
        const hour = data.timestamp.getHours();
        if (hour >= 2 && hour <= 6) {
            await this.createSecurityAlert('UNUSUAL_TIME_ACCESS', {
                user_id: data.user_id,
                access_time: data.timestamp.toISOString(),
                hour,
                severity: 'LOW',
                message: `Accès à une heure inhabituelle (${hour}h) pour l'utilisateur ${data.user_id}`,
            });
        }
    }
    async detectActivitySpikes(data, since) {
        const recentActivity = await this.prisma.access_control_log.count({
            where: {
                created_at: { gte: since },
            }
        });
        if (recentActivity >= 1000) {
            await this.createSecurityAlert('HIGH_ACTIVITY_SPIKE', {
                activity_count: recentActivity,
                time_window: '1h',
                severity: 'MEDIUM',
                message: `Pic d'activité détecté: ${recentActivity} accès en 1 heure`,
            });
        }
    }
    async updateMetrics(data) {
        try {
            const metricsKey = `metrics:shield:${new Date().toISOString().substring(0, 13)}`;
        }
        catch (error) {
            this.logger.logErrorEvent(error, 'AccessAuditProcessor.updateMetrics', data.user_id || 'unknown');
        }
    }
    async triggerNotifications(data) {
        try {
            if (this.isCriticalEvent(data)) {
                await this.sendCriticalEventNotification(data);
            }
            if (this.isSecurityViolation(data)) {
                await this.sendSecurityViolationNotification(data);
            }
        }
        catch (error) {
            this.logger.logErrorEvent(error, 'AccessAuditProcessor.triggerNotifications', data.user_id || 'unknown');
        }
    }
    isCriticalEvent(data) {
        const criticalEvents = [
            access_enums_1.AuditEventType.UNAUTHORIZED_ATTEMPT,
            access_enums_1.AuditEventType.ACCESS_RIGHT_EXPIRED,
        ];
        return criticalEvents.includes(data.event_type) ||
            data.status === access_enums_1.AccessStatus.ERROR;
    }
    isSecurityViolation(data) {
        return data.event_type === access_enums_1.AuditEventType.UNAUTHORIZED_ATTEMPT &&
            data.status === access_enums_1.AccessStatus.DENIED;
    }
    async createSecurityAlert(type, details) {
        try {
            this.logger.logBusinessEvent('SECURITY_ALERT_CREATED', {
                alert_type: type,
                details,
                created_at: new Date(),
            }, 'system');
            if (details.severity === 'HIGH' || details.severity === 'CRITICAL') {
                await this.sendSecurityAlertEmail(type, details);
            }
        }
        catch (error) {
            this.logger.logErrorEvent(error, 'AccessAuditProcessor.createSecurityAlert', 'system', { alertType: type, details });
        }
    }
    async sendCriticalEventNotification(data) {
        this.logger.logBusinessEvent('CRITICAL_EVENT_NOTIFICATION_SENT', {
            event_type: data.event_type,
            user_id: data.user_id,
            resource_type: data.resource_type,
            status: data.status,
        }, data.user_id || 'system');
    }
    async sendSecurityViolationNotification(data) {
        this.logger.logBusinessEvent('SECURITY_VIOLATION_NOTIFICATION_SENT', {
            event_type: data.event_type,
            ip_address: data.ip_address,
            user_agent: data.user_agent,
            timestamp: data.timestamp,
        }, 'system');
    }
    async sendSecurityAlertEmail(type, details) {
        try {
            const adminEmails = process.env.SECURITY_ADMIN_EMAILS?.split(',') || [];
            if (adminEmails.length === 0) {
                this.logger.warn('No security admin emails configured for alerts');
                return;
            }
            for (const email of adminEmails) {
                await this.emailService.sendEmail({
                    to: email.trim(),
                    subject: `🚨 Alerte Sécurité Entrix - ${type}`,
                    template: 'security-alert',
                    data: {
                        alertType: type,
                        details,
                        timestamp: new Date().toISOString(),
                        severity: details.severity,
                        message: details.message,
                    },
                });
            }
        }
        catch (error) {
            this.logger.logErrorEvent(error, 'AccessAuditProcessor.sendSecurityAlertEmail', 'system', { alertType: type });
        }
    }
};
exports.AccessAuditProcessor = AccessAuditProcessor;
exports.AccessAuditProcessor = AccessAuditProcessor = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        email_service_1.EmailService,
        logger_service_1.LoggerService])
], AccessAuditProcessor);
//# sourceMappingURL=access-audit.processor.js.map