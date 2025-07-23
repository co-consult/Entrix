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
const logger_service_1 = require("../../../shared/logger/logger.service");
const prisma_service_1 = require("../../../shared/prisma/prisma.service");
const redis_service_1 = require("../../../shared/redis/redis.service");
const risk_scoring_util_1 = require("../utils/risk-scoring.util");
const geolocation_util_1 = require("../utils/geolocation.util");
const crypto_util_1 = require("../utils/crypto.util");
const security_constants_1 = require("../constants/security.constants");
let SecurityService = class SecurityService {
    prisma;
    redis;
    logger;
    constructor(prisma, redis, loggerService) {
        this.prisma = prisma;
        this.redis = redis;
        this.logger = loggerService.createChildLogger('SecurityService');
    }
    async assessRisk(userId, deviceInfo) {
        const operationId = this.logger.startOperation('assessRisk', {
            userId,
            ipAddress: deviceInfo.ipAddress,
        });
        try {
            const userProfile = await this.getUserBehaviorProfile(userId);
            const geoInfo = await this.analyzeGeolocation(deviceInfo.ipAddress);
            const riskAssessment = risk_scoring_util_1.RiskScoringUtil.calculateRiskScore(deviceInfo, userProfile, geoInfo);
            this.logger.logBusinessEvent('RISK_ASSESSMENT_COMPLETED', {
                userId,
                riskScore: riskAssessment.score,
                factors: Object.keys(riskAssessment.factors).filter(key => riskAssessment.factors[key]),
                recommendation: riskAssessment.recommendation,
                ipAddress: deviceInfo.ipAddress,
            }, userId);
            this.logger.endOperation(operationId, 'success');
            return riskAssessment;
        }
        catch (error) {
            this.logger.endOperation(operationId, 'error', error.message);
            this.logger.error('Risk assessment failed', error.stack, { userId });
            return {
                score: 50,
                factors: {
                    unknownDevice: true,
                    newLocation: true,
                    unusualTime: false,
                    failedAttempts: 0,
                    suspiciousIp: false,
                    multipleSessions: false,
                },
                recommendation: 'REQUIRE_MFA',
                requiresMfa: true,
            };
        }
    }
    async logSecurityEvent(event) {
        const operationId = this.logger.startOperation('logSecurityEvent', {
            type: event.type,
            userId: event.userId,
        });
        try {
            const eventId = crypto_util_1.CryptoUtil.generateUuid();
            const enrichedEvent = {
                ...event,
                id: eventId,
                createdAt: new Date(),
            };
            await this.storeSecurityEventInDb(enrichedEvent);
            await this.cacheSecurityEvent(enrichedEvent);
            await this.analyzeSecurityEvent(enrichedEvent);
            this.logger.logBusinessEvent('SECURITY_EVENT_LOGGED', {
                eventId,
                type: event.type,
                userId: event.userId,
                riskScore: event.riskScore,
                location: event.location,
            }, event.userId);
            this.logger.endOperation(operationId, 'success');
            return enrichedEvent;
        }
        catch (error) {
            this.logger.endOperation(operationId, 'error', error.message);
            this.logger.error('Failed to log security event', error.stack, {
                type: event.type,
                userId: event.userId,
            });
            throw new Error(`Erreur logging événement sécurité: ${error.message}`);
        }
    }
    async getSecurityEvents(userId, limit = 20) {
        const operationId = this.logger.startOperation('getSecurityEvents', {
            userId,
            limit,
        });
        try {
            const cachedEvents = await this.getCachedSecurityEvents(userId, limit);
            if (cachedEvents.length > 0) {
                this.logger.endOperation(operationId, 'cache_hit');
                return cachedEvents;
            }
            const events = await this.getSecurityEventsFromDb(userId, limit);
            await this.cacheUserSecurityEvents(userId, events);
            this.logger.endOperation(operationId, 'db_hit');
            return events;
        }
        catch (error) {
            this.logger.endOperation(operationId, 'error', error.message);
            this.logger.error('Failed to get security events', error.stack, { userId });
            return [];
        }
    }
    async checkSuspiciousActivity(userId) {
        const operationId = this.logger.startOperation('checkSuspiciousActivity', { userId });
        try {
            const recentEvents = await this.getRecentSecurityEvents(userId, 24);
            const suspiciousPatterns = this.analyzeSuspiciousPatterns(recentEvents);
            const suspicionScore = this.calculateSuspicionScore(suspiciousPatterns);
            const isSuspicious = suspicionScore >= security_constants_1.SECURITY_CONSTANTS.RISK_SCORING.ALERT_THRESHOLD;
            if (isSuspicious) {
                await this.logSecurityEvent({
                    type: 'SUSPICIOUS_ACTIVITY',
                    userId,
                    ipAddress: 'system',
                    userAgent: 'security_analysis',
                    location: 'System',
                    riskScore: suspicionScore,
                    description: 'Activité suspecte détectée par analyse automatique',
                    metadata: { patterns: suspiciousPatterns },
                    resolved: false,
                });
            }
            this.logger.endOperation(operationId, 'success');
            return isSuspicious;
        }
        catch (error) {
            this.logger.endOperation(operationId, 'error', error.message);
            this.logger.error('Failed to check suspicious activity', error.stack, { userId });
            return false;
        }
    }
    async blockSuspiciousIp(ip, duration) {
        const operationId = this.logger.startOperation('blockSuspiciousIp', {
            ip,
            duration,
        });
        try {
            const blockKey = `blocked_ip:${ip}`;
            const blockData = {
                ip,
                blockedAt: new Date().toISOString(),
                expiresAt: new Date(Date.now() + duration * 1000).toISOString(),
                reason: 'suspicious_activity',
            };
            await this.redis.setCache(blockKey, blockData, duration);
            this.logger.logBusinessEvent('IP_BLOCKED', {
                ip,
                duration,
                reason: 'suspicious_activity',
                expiresAt: blockData.expiresAt,
            });
            this.logger.endOperation(operationId, 'success');
        }
        catch (error) {
            this.logger.endOperation(operationId, 'error', error.message);
            this.logger.error('Failed to block suspicious IP', error.stack, { ip });
        }
    }
    async getUserBehaviorProfile(userId) {
        try {
            const profileKey = `behavior_profile:${userId}`;
            let profile = await this.redis.getCache(profileKey);
            if (!profile) {
                profile = await this.buildBehaviorProfile(userId);
                await this.redis.setCache(profileKey, profile, 3600);
            }
            return profile;
        }
        catch (error) {
            this.logger.error('Failed to get user behavior profile', error.stack, { userId });
            return {
                userId,
                commonLocations: [],
                commonDevices: [],
                typicalLoginTimes: [],
                averageSessionDuration: 3600,
                recentFailedAttempts: 0,
                activeSessions: 0,
            };
        }
    }
    async buildBehaviorProfile(userId) {
        try {
            const recentSessions = await this.prisma.user_sessions.findMany({
                where: {
                    user_id: userId,
                    created_at: {
                        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                    },
                },
                orderBy: { created_at: 'desc' },
                take: 100,
            });
            const profile = {
                userId,
                commonLocations: this.extractCommonLocations(recentSessions),
                commonDevices: this.extractCommonDevices(recentSessions),
                typicalLoginTimes: this.extractTypicalLoginTimes(recentSessions),
                averageSessionDuration: this.calculateAverageSessionDuration(recentSessions),
                recentFailedAttempts: await this.getRecentFailedAttempts(userId),
                activeSessions: await this.getActiveSessionsCount(userId),
            };
            return profile;
        }
        catch (error) {
            this.logger.error('Failed to build behavior profile', error.stack, { userId });
            throw error;
        }
    }
    async analyzeGeolocation(ipAddress) {
        try {
            return {
                country: 'TN',
                countryCode: 'TN',
                city: 'Tunis',
                region: 'Tunis',
                coordinates: [36.8065, 10.1815],
                timezone: 'Africa/Tunis',
                isp: 'Unknown ISP',
                isVpn: false,
                isTor: false,
                isDatacenter: false,
                riskScore: geolocation_util_1.GeolocationUtil.calculateGeoRiskScore({
                    countryCode: 'TN',
                    isVpn: false,
                    isTor: false,
                    isDatacenter: false,
                }),
            };
        }
        catch (error) {
            this.logger.error('Geolocation analysis failed', error.stack, { ipAddress });
            return null;
        }
    }
    extractCommonLocations(sessions) {
        const locations = sessions
            .map(s => s.geolocation?.country)
            .filter(Boolean);
        const locationCounts = locations.reduce((acc, loc) => {
            acc[loc] = (acc[loc] || 0) + 1;
            return acc;
        }, {});
        return Object.entries(locationCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 3)
            .map(([loc]) => loc);
    }
    extractCommonDevices(sessions) {
        const devices = sessions
            .map(s => s.device_fingerprint)
            .filter(Boolean);
        return [...new Set(devices)].slice(0, 3);
    }
    extractTypicalLoginTimes(sessions) {
        const hours = sessions.map(s => new Date(s.created_at).getHours());
        const hourCounts = hours.reduce((acc, hour) => {
            acc[hour] = (acc[hour] || 0) + 1;
            return acc;
        }, {});
        return Object.entries(hourCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 8)
            .map(([hour]) => parseInt(hour));
    }
    calculateAverageSessionDuration(sessions) {
        const completedSessions = sessions.filter(s => !s.is_active);
        if (completedSessions.length === 0)
            return 3600;
        const totalDuration = completedSessions.reduce((acc, session) => {
            const duration = new Date(session.updated_at).getTime() - new Date(session.created_at).getTime();
            return acc + duration;
        }, 0);
        return Math.floor(totalDuration / completedSessions.length / 1000);
    }
    async getRecentFailedAttempts(userId) {
        return 0;
    }
    async getActiveSessionsCount(userId) {
        try {
            const count = await this.prisma.user_sessions.count({
                where: {
                    user_id: userId,
                    is_active: true,
                    expires_at: { gt: new Date() },
                },
            });
            return count;
        }
        catch (error) {
            return 0;
        }
    }
    async storeSecurityEventInDb(event) {
    }
    async cacheSecurityEvent(event) {
        try {
            const eventKey = `security_event:${event.id}`;
            await this.redis.setCache(eventKey, event, 24 * 60 * 60);
        }
        catch (error) {
            this.logger.error('Failed to cache security event', error.stack);
        }
    }
    async analyzeSecurityEvent(event) {
    }
    async getCachedSecurityEvents(userId, limit) {
        return [];
    }
    async getSecurityEventsFromDb(userId, limit) {
        return [];
    }
    async cacheUserSecurityEvents(userId, events) {
    }
    async getRecentSecurityEvents(userId, hours) {
        return [];
    }
    analyzeSuspiciousPatterns(events) {
        const patterns = [];
        const failedLogins = events.filter(e => e.type === 'LOGIN_FAILED').length;
        if (failedLogins > 10)
            patterns.push('excessive_failed_logins');
        const uniqueIps = new Set(events.map(e => e.ipAddress)).size;
        if (uniqueIps > 5)
            patterns.push('multiple_ip_addresses');
        const highRiskEvents = events.filter(e => e.riskScore > 70).length;
        if (highRiskEvents > 3)
            patterns.push('high_risk_activities');
        return patterns;
    }
    calculateSuspicionScore(patterns) {
        let score = 0;
        patterns.forEach(pattern => {
            switch (pattern) {
                case 'excessive_failed_logins':
                    score += 30;
                    break;
                case 'multiple_ip_addresses':
                    score += 25;
                    break;
                case 'high_risk_activities':
                    score += 35;
                    break;
                default: score += 10;
            }
        });
        return Math.min(100, score);
    }
};
exports.SecurityService = SecurityService;
exports.SecurityService = SecurityService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        redis_service_1.RedisService,
        logger_service_1.LoggerService])
], SecurityService);
//# sourceMappingURL=security.service.js.map