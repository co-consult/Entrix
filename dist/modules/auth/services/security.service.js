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
exports.SecurityService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const logger_service_1 = require("../../../shared/logger/logger.service");
const prisma_service_1 = require("../../../shared/prisma/prisma.service");
const redis_service_1 = require("../../../shared/redis/redis.service");
const email_service_1 = require("../../../shared/email/email.service");
const security_constants_1 = require("../constants/security.constants");
let SecurityService = class SecurityService {
    prisma;
    redis;
    email;
    logger;
    CACHE_TTL = {
        SECURITY_EVENT: 3600,
        SECURITY_EVENTS_LIST: 1800,
        SUSPICIOUS_CHECK: 300,
        DEVICE_CHECK: 7200,
        FAILED_ATTEMPTS: 900,
    };
    TIMEFRAMES = {
        SUSPICIOUS_ACTIVITY_WINDOW: 24 * 60 * 60 * 1000,
        LOCATION_HISTORY: 30 * 24 * 60 * 60 * 1000,
        FAILED_ATTEMPTS_WINDOW: 15 * 60 * 1000,
    };
    SUSPICION_WEIGHTS = {
        'FAILED_LOGIN': 10,
        'SUSPICIOUS_ACTIVITY': 20,
        'MULTIPLE_SESSIONS': 5,
        'UNKNOWN_DEVICE': 15,
    };
    constructor(prisma, redis, email, loggerService) {
        this.prisma = prisma;
        this.redis = redis;
        this.email = email;
        this.logger = loggerService.createChildLogger('SecurityService');
    }
    async assessRisk(userId, deviceInfo) {
        const operationId = this.logger.startOperation('assessRisk', { userId });
        try {
            this.logger.info('Starting risk assessment', JSON.stringify({
                userId,
                ipAddress: deviceInfo.ipAddress,
                hasDeviceFingerprint: !!deviceInfo.deviceFingerprint,
            }));
            let riskScore = 0;
            const factors = {
                unknownDevice: false,
                newLocation: false,
                unusualTime: false,
                failedAttempts: 0,
                suspiciousIp: false,
                multipleSessions: false,
            };
            const knownDevice = await this.checkKnownDevice(userId, deviceInfo);
            if (!knownDevice) {
                factors.unknownDevice = true;
                riskScore += security_constants_1.SECURITY_CONSTANTS.RISK_SCORING.UNKNOWN_DEVICE;
                this.logger.warn('Unknown device detected', JSON.stringify({ userId, deviceFingerprint: deviceInfo.deviceFingerprint }));
            }
            const locationRisk = await this.analyzeLocation(userId, deviceInfo.ipAddress);
            if (locationRisk.isNewLocation) {
                factors.newLocation = true;
                riskScore += security_constants_1.SECURITY_CONSTANTS.RISK_SCORING.NEW_LOCATION;
            }
            const timeRisk = this.analyzeConnectionTime();
            if (timeRisk.isUnusual) {
                factors.unusualTime = true;
                riskScore += security_constants_1.SECURITY_CONSTANTS.RISK_SCORING.UNUSUAL_TIME;
            }
            const failedAttempts = await this.getRecentFailedAttempts(userId);
            factors.failedAttempts = failedAttempts;
            riskScore += failedAttempts * (security_constants_1.SECURITY_CONSTANTS.RISK_SCORING.FAILED_ATTEMPTS / 10);
            const isSuspiciousIp = await this.checkSuspiciousIp(deviceInfo.ipAddress);
            if (isSuspiciousIp) {
                factors.suspiciousIp = true;
                riskScore += security_constants_1.SECURITY_CONSTANTS.RISK_SCORING.TOR_IP;
            }
            const activeSessions = await this.getUserActiveSessions(userId);
            if (activeSessions > security_constants_1.SECURITY_CONSTANTS.SUSPICIOUS_PATTERNS.MULTIPLE_IP_SESSIONS) {
                factors.multipleSessions = true;
                riskScore += security_constants_1.SECURITY_CONSTANTS.RISK_SCORING.MULTIPLE_SESSIONS;
            }
            const recommendation = this.determineRecommendation(riskScore);
            const requiresMfa = riskScore >= security_constants_1.SECURITY_CONSTANTS.RISK_SCORING.REQUIRE_MFA_THRESHOLD;
            const assessment = {
                score: Math.min(riskScore, 100),
                factors,
                recommendation,
                requiresMfa,
            };
            this.logger.logSecurityEvent('RISK_ASSESSMENT', userId, deviceInfo.ipAddress, deviceInfo.userAgent, JSON.stringify({
                riskScore: assessment.score,
                factors: assessment.factors,
                recommendation: assessment.recommendation,
                requiresMfa: assessment.requiresMfa,
            }));
            this.logger.endOperation('assessRisk', operationId, true, Date.now() - parseInt(operationId.split('_')[1]));
            return assessment;
        }
        catch (error) {
            this.logger.error('Risk assessment failed', error.stack, JSON.stringify({ userId }));
            this.logger.endOperation('assessRisk', operationId, false, Date.now() - parseInt(operationId.split('_')[1]));
            throw new common_1.BadRequestException('Erreur lors de l\'évaluation du risque');
        }
    }
    async logSecurityEvent(event) {
        const operationId = this.logger.startOperation('logSecurityEvent', { type: event.type });
        try {
            const securityEvent = await this.prisma.security_events.create({
                data: {
                    event_type: event.type,
                    target_user_id: event.userId,
                    ip_address: event.ipAddress,
                    description: event.description,
                    event_data: event.metadata || null,
                    metadata: { userAgent: event.userAgent, location: event.location },
                    severity: this.getSecurityLevel(event.type),
                    status: 'OPEN',
                    created_at: new Date(),
                },
            });
            await this.redis.setCache(`security_event:${securityEvent.id}`, securityEvent, this.CACHE_TTL.SECURITY_EVENT);
            this.logger.logSecurityEvent(event.type, event.userId, event.ipAddress, event.userAgent, JSON.stringify({ eventId: securityEvent.id, description: event.description }));
            this.logger.endOperation('logSecurityEvent', operationId, true);
            return {
                id: securityEvent.id,
                type: securityEvent.event_type,
                userId: securityEvent.target_user_id,
                ipAddress: securityEvent.ip_address,
                userAgent: event.userAgent,
                location: event.location,
                riskScore: event.riskScore,
                description: securityEvent.description,
                metadata: securityEvent.metadata,
                resolved: securityEvent.status !== 'OPEN',
                createdAt: securityEvent.created_at,
            };
        }
        catch (error) {
            this.logger.error('Failed to log security event', error.stack, JSON.stringify({
                eventType: event.type,
                userId: event.userId
            }));
            this.logger.endOperation('logSecurityEvent', operationId, false);
            throw new common_1.BadRequestException('Erreur lors de l\'enregistrement de l\'événement de sécurité');
        }
    }
    async getSecurityEvents(userId, limit = 20) {
        const operationId = this.logger.startOperation('getSecurityEvents', { userId });
        try {
            const cacheKey = `security_events:${userId}:${limit}`;
            const cachedEvents = await this.redis.getCache(cacheKey);
            if (cachedEvents) {
                this.logger.logCacheEvent('hit', cacheKey);
                this.logger.endOperation('getSecurityEvents', operationId, true);
                return cachedEvents;
            }
            const events = await this.prisma.security_events.findMany({
                where: { target_user_id: userId },
                orderBy: { created_at: 'desc' },
                take: limit,
            });
            const securityEvents = events.map(event => ({
                id: event.id,
                type: event.event_type,
                userId: event.target_user_id,
                ipAddress: event.ip_address,
                userAgent: event.metadata?.userAgent || '',
                location: event.metadata?.location,
                riskScore: 0,
                description: event.description,
                metadata: event.metadata,
                resolved: event.status !== 'OPEN',
                createdAt: event.created_at,
            }));
            await this.redis.setCache(cacheKey, securityEvents, this.CACHE_TTL.SECURITY_EVENTS_LIST);
            this.logger.logCacheEvent('set', cacheKey, this.CACHE_TTL.SECURITY_EVENTS_LIST);
            this.logger.endOperation('getSecurityEvents', operationId, true);
            return securityEvents;
        }
        catch (error) {
            this.logger.error('Failed to get security events', error.stack, JSON.stringify({ userId }));
            this.logger.endOperation('getSecurityEvents', operationId, false);
            throw new common_1.BadRequestException('Erreur lors de la récupération des événements de sécurité');
        }
    }
    async checkSuspiciousActivity(userId) {
        const operationId = this.logger.startOperation('checkSuspiciousActivity', { userId });
        try {
            const cacheKey = `suspicious_activity:${userId}`;
            const cachedResult = await this.redis.getCache(cacheKey);
            if (cachedResult !== null) {
                this.logger.endOperation('checkSuspiciousActivity', operationId, true);
                return cachedResult;
            }
            const recentEvents = await this.prisma.security_events.findMany({
                where: {
                    target_user_id: userId,
                    created_at: {
                        gte: new Date(Date.now() - this.TIMEFRAMES.SUSPICIOUS_ACTIVITY_WINDOW),
                    },
                    event_type: {
                        in: ['FAILED_LOGIN', 'SUSPICIOUS_ACTIVITY', 'MULTIPLE_SESSIONS', 'UNKNOWN_DEVICE'],
                    },
                },
            });
            const suspiciousScore = recentEvents.reduce((score, event) => {
                return score + (this.SUSPICION_WEIGHTS[event.event_type] || 0);
            }, 0);
            const isSuspicious = suspiciousScore >= security_constants_1.SECURITY_CONSTANTS.RISK_SCORING.ALERT_THRESHOLD;
            await this.redis.setCache(cacheKey, isSuspicious, this.CACHE_TTL.SUSPICIOUS_CHECK);
            if (isSuspicious) {
                this.logger.warn('Suspicious activity detected', JSON.stringify({
                    userId,
                    suspiciousScore,
                    eventsCount: recentEvents.length,
                }));
                await this.sendSecurityAlert(userId, 'SUSPICIOUS_ACTIVITY_DETECTED', {
                    score: suspiciousScore,
                    eventsCount: recentEvents.length,
                });
            }
            this.logger.endOperation('checkSuspiciousActivity', operationId, true);
            return isSuspicious;
        }
        catch (error) {
            this.logger.error('Failed to check suspicious activity', error.stack, JSON.stringify({ userId }));
            this.logger.endOperation('checkSuspiciousActivity', operationId, false);
            return false;
        }
    }
    async blockSuspiciousIp(ip, duration) {
        const operationId = this.logger.startOperation('blockSuspiciousIp', { ip });
        try {
            const blockKey = `blocked_ip:${ip}`;
            await this.redis.setCache(blockKey, {
                blockedAt: new Date().toISOString(),
                duration,
                reason: 'SUSPICIOUS_ACTIVITY',
            }, duration);
            this.logger.logSecurityEvent('IP_BLOCKED', undefined, ip, undefined, JSON.stringify({ duration, reason: 'SUSPICIOUS_ACTIVITY' }));
            this.logger.warn('IP blocked for suspicious activity', JSON.stringify({ ip, duration }));
            this.logger.endOperation('blockSuspiciousIp', operationId, true);
        }
        catch (error) {
            this.logger.error('Failed to block IP', error.stack, JSON.stringify({ ip }));
            this.logger.endOperation('blockSuspiciousIp', operationId, false);
            throw new common_1.BadRequestException('Erreur lors du blocage de l\'adresse IP');
        }
    }
    async checkKnownDevice(userId, deviceInfo) {
        try {
            if (!deviceInfo.deviceFingerprint) {
                return false;
            }
            const cacheKey = `known_device:${userId}:${deviceInfo.deviceFingerprint}`;
            const cachedResult = await this.redis.getCache(cacheKey);
            if (cachedResult !== null) {
                return cachedResult;
            }
            const existingSession = await this.prisma.user_sessions.findFirst({
                where: {
                    user_id: userId,
                    device_fingerprint: deviceInfo.deviceFingerprint,
                    is_active: true,
                },
                select: { id: true },
            });
            const isKnown = !!existingSession;
            await this.redis.setCache(cacheKey, isKnown, this.CACHE_TTL.DEVICE_CHECK);
            return isKnown;
        }
        catch (error) {
            this.logger.error('Failed to check known device', error.stack, JSON.stringify({ userId }));
            return false;
        }
    }
    async analyzeLocation(userId, ipAddress) {
        try {
            const recentSessions = await this.prisma.user_sessions.findMany({
                where: {
                    user_id: userId,
                    created_at: {
                        gte: new Date(Date.now() - this.TIMEFRAMES.LOCATION_HISTORY),
                    },
                },
                select: { geolocation: true, ip_address: true },
            });
            const currentLocationHash = this.hashIpForLocation(ipAddress);
            const knownLocations = recentSessions
                .map(session => this.hashIpForLocation(session.ip_address))
                .filter(Boolean);
            const isNewLocation = !knownLocations.includes(currentLocationHash);
            return { isNewLocation };
        }
        catch (error) {
            this.logger.error('Failed to analyze location', error.stack, JSON.stringify({ userId }));
            return { isNewLocation: false };
        }
    }
    analyzeConnectionTime() {
        const now = new Date();
        const hour = now.getHours();
        const isUnusual = hour >= 2 && hour <= 6;
        return { isUnusual };
    }
    async getRecentFailedAttempts(userId) {
        try {
            const cacheKey = `failed_attempts:${userId}`;
            const cachedCount = await this.redis.getCache(cacheKey);
            if (cachedCount !== null) {
                return cachedCount;
            }
            const count = await this.prisma.security_events.count({
                where: {
                    target_user_id: userId,
                    event_type: 'FAILED_LOGIN',
                    created_at: {
                        gte: new Date(Date.now() - this.TIMEFRAMES.FAILED_ATTEMPTS_WINDOW),
                    },
                },
            });
            await this.redis.setCache(cacheKey, count, this.CACHE_TTL.FAILED_ATTEMPTS);
            return count;
        }
        catch (error) {
            this.logger.error('Failed to get recent failed attempts', error.stack, JSON.stringify({ userId }));
            return 0;
        }
    }
    async checkSuspiciousIp(ipAddress) {
        try {
            const blockKey = `blocked_ip:${ipAddress}`;
            const blockedInfo = await this.redis.getCache(blockKey);
            return !!blockedInfo;
        }
        catch (error) {
            this.logger.error('Failed to check suspicious IP', error.stack, JSON.stringify({ ipAddress }));
            return false;
        }
    }
    async getUserActiveSessions(userId) {
        try {
            const count = await this.prisma.user_sessions.count({
                where: {
                    user_id: userId,
                    is_active: true,
                    expires_at: {
                        gt: new Date(),
                    },
                },
            });
            return count;
        }
        catch (error) {
            this.logger.error('Failed to get active sessions count', error.stack, JSON.stringify({ userId }));
            return 0;
        }
    }
    determineRecommendation(riskScore) {
        if (riskScore >= security_constants_1.SECURITY_CONSTANTS.RISK_SCORING.BLOCK_THRESHOLD) {
            return 'BLOCK';
        }
        else if (riskScore >= security_constants_1.SECURITY_CONSTANTS.RISK_SCORING.REQUIRE_MFA_THRESHOLD) {
            return 'REQUIRE_MFA';
        }
        else if (riskScore >= security_constants_1.SECURITY_CONSTANTS.RISK_SCORING.ALERT_THRESHOLD) {
            return 'ALERT';
        }
        else {
            return 'ALLOW';
        }
    }
    hashIpForLocation(ipAddress) {
        return ipAddress.split('.').slice(0, 3).join('.');
    }
    getSecurityLevel(eventType) {
        const criticalEvents = ['ACCOUNT_LOCKED', 'SUSPICIOUS_ACTIVITY', 'DEVICE_REVOKED'];
        const highRiskEvents = ['LOGIN_FAILED', 'MFA_DISABLED', 'SESSION_EXPIRED'];
        const standardEvents = ['LOGIN_SUCCESS', 'LOGOUT', 'PASSWORD_CHANGE', 'MFA_SETUP', 'DEVICE_TRUSTED'];
        if (criticalEvents.includes(eventType)) {
            return client_1.security_level.HIGH;
        }
        else if (highRiskEvents.includes(eventType)) {
            return client_1.security_level.STANDARD;
        }
        else if (standardEvents.includes(eventType)) {
            return client_1.security_level.LOW;
        }
        else {
            return client_1.security_level.STANDARD;
        }
    }
    async sendSecurityAlert(userId, alertType, metadata) {
        try {
            const user = await this.prisma.users.findUnique({
                where: { id: userId },
                select: { email: true, first_name: true, last_name: true },
            });
            if (!user) {
                this.logger.warn('User not found for security alert', JSON.stringify({ userId }));
                return;
            }
            await this.email.sendMail({
                to: user.email,
                subject: 'Alerte de sécurité - Entrix',
                template: 'security-alert',
                context: {
                    firstName: user.first_name,
                    lastName: user.last_name,
                    alertType,
                    metadata,
                    timestamp: new Date().toISOString(),
                },
            });
            this.logger.logNotificationEvent('sent', 'email', user.email, undefined, JSON.stringify({ alertType, userId }));
        }
        catch (error) {
            this.logger.error('Failed to send security alert', error.stack, JSON.stringify({ userId, alertType }));
        }
    }
};
exports.SecurityService = SecurityService;
exports.SecurityService = SecurityService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        redis_service_1.RedisService,
        email_service_1.EmailService,
        logger_service_1.LoggerService])
], SecurityService);
//# sourceMappingURL=security.service.js.map