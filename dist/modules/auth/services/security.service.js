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
const config_1 = require("@nestjs/config");
const redis_service_1 = require("../../../shared/redis/redis.service");
const email_service_1 = require("../../../shared/email/email.service");
const logger_service_1 = require("../../../shared/logger/logger.service");
const prisma_service_1 = require("../../../shared/prisma/prisma.service");
let SecurityService = class SecurityService {
    redis;
    email;
    logger;
    prisma;
    config;
    RATE_LIMIT_PREFIX = 'rate_limit:';
    SECURITY_EVENT_PREFIX = 'security_event:';
    FAILED_ATTEMPTS_PREFIX = 'failed_attempts:';
    ACCOUNT_LOCK_PREFIX = 'account_lock:';
    constructor(redis, email, logger, prisma, config) {
        this.redis = redis;
        this.email = email;
        this.logger = logger;
        this.prisma = prisma;
        this.config = config;
    }
    async assessLoginRisk(userId, ipAddress, userAgent, email) {
        const factors = [];
        let score = 0;
        const isUnusualLocation = await this.checkUnusualLocation(userId, ipAddress);
        if (isUnusualLocation) {
            score += 30;
            factors.push('Localisation inhabituelle');
        }
        const isUnknownDevice = await this.checkUnknownDevice(userId, userAgent);
        if (isUnknownDevice) {
            score += 25;
            factors.push('Appareil inconnu');
        }
        const failedAttempts = await this.getFailedAttempts(email);
        if (failedAttempts > 2) {
            score += 20;
            factors.push(`${failedAttempts} tentatives échouées récentes`);
        }
        const isUnusualTime = await this.checkUnusualTime(userId);
        if (isUnusualTime) {
            score += 15;
            factors.push('Heure de connexion inhabituelle');
        }
        const isSuspiciousIp = await this.checkSuspiciousIp(ipAddress);
        if (isSuspiciousIp) {
            score += 40;
            factors.push('Adresse IP suspecte');
        }
        let level;
        if (score >= 80)
            level = 'CRITICAL';
        else if (score >= 60)
            level = 'HIGH';
        else if (score >= 30)
            level = 'MEDIUM';
        else
            level = 'LOW';
        const recommendations = this.generateRecommendations(level, factors);
        return {
            score,
            level,
            factors,
            recommendations
        };
    }
    async logSecurityEvent(userId, type, description, ipAddress, userAgent, riskScore = 0, metadata) {
        const event = {
            id: this.generateEventId(),
            userId,
            type,
            description,
            ipAddress,
            userAgent,
            riskScore,
            metadata,
            createdAt: new Date()
        };
        try {
            const eventKey = `${this.SECURITY_EVENT_PREFIX}${event.id}`;
            await this.redis.setCache(eventKey, event, 30 * 24 * 60 * 60);
            const userEventsKey = `${this.SECURITY_EVENT_PREFIX}user:${userId}`;
            const userEvents = await this.redis.getCache(userEventsKey) || [];
            userEvents.unshift(event.id);
            if (userEvents.length > 100) {
                userEvents.splice(100);
            }
            await this.redis.setCache(userEventsKey, userEvents, 30 * 24 * 60 * 60);
            if (riskScore >= 80) {
                await this.handleCriticalSecurityEvent(event);
            }
            this.logger.log(`Security event logged: ${type} for user ${userId} (risk: ${riskScore})`);
        }
        catch (error) {
            this.logger.error('Failed to log security event:', error);
        }
    }
    async recordFailedAttempt(email, ipAddress) {
        const emailKey = `${this.FAILED_ATTEMPTS_PREFIX}email:${email}`;
        const ipKey = `${this.FAILED_ATTEMPTS_PREFIX}ip:${ipAddress}`;
        const emailAttempts = await this.redis.increment(emailKey, 15 * 60);
        const ipAttempts = await this.redis.increment(ipKey, 15 * 60);
        const maxAttempts = 5;
        const locked = emailAttempts >= maxAttempts || ipAttempts >= maxAttempts;
        if (locked) {
            await this.lockAccount(email, 'Too many failed login attempts');
        }
        return {
            attempts: Math.max(emailAttempts, ipAttempts),
            locked
        };
    }
    async clearFailedAttempts(email, ipAddress) {
        const emailKey = `${this.FAILED_ATTEMPTS_PREFIX}email:${email}`;
        const ipKey = `${this.FAILED_ATTEMPTS_PREFIX}ip:${ipAddress}`;
        await this.redis.del(emailKey);
        await this.redis.del(ipKey);
    }
    async isAccountLocked(email) {
        const lockKey = `${this.ACCOUNT_LOCK_PREFIX}${email}`;
        return await this.redis.exists(lockKey);
    }
    async lockAccount(email, reason) {
        const lockKey = `${this.ACCOUNT_LOCK_PREFIX}${email}`;
        const lockData = {
            email,
            reason,
            lockedAt: new Date(),
            unlockAt: new Date(Date.now() + 30 * 60 * 1000)
        };
        await this.redis.setCache(lockKey, lockData, 30 * 60);
        await this.sendAccountLockNotification(email, reason);
        this.logger.warn(`Account locked: ${email} - ${reason}`);
    }
    async unlockAccount(email) {
        const lockKey = `${this.ACCOUNT_LOCK_PREFIX}${email}`;
        await this.redis.del(lockKey);
        this.logger.log(`Account unlocked: ${email}`);
    }
    async getUserSecurityEvents(userId, limit = 20) {
        try {
            const userEventsKey = `${this.SECURITY_EVENT_PREFIX}user:${userId}`;
            const eventIds = await this.redis.getCache(userEventsKey) || [];
            const events = [];
            for (const eventId of eventIds.slice(0, limit)) {
                const eventKey = `${this.SECURITY_EVENT_PREFIX}${eventId}`;
                const event = await this.redis.getCache(eventKey);
                if (event) {
                    events.push(event);
                }
            }
            return events.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        }
        catch (error) {
            this.logger.error(`Failed to get security events for user ${userId}:`, error);
            return [];
        }
    }
    async checkUnusualLocation(userId, ipAddress) {
        return false;
    }
    async checkUnknownDevice(userId, userAgent) {
        return false;
    }
    async getFailedAttempts(email) {
        const emailKey = `${this.FAILED_ATTEMPTS_PREFIX}email:${email}`;
        const value = await this.redis.get(emailKey);
        return value ? parseInt(value, 10) : 0;
    }
    async checkUnusualTime(userId) {
        return false;
    }
    async checkSuspiciousIp(ipAddress) {
        return false;
    }
    generateRecommendations(level, factors) {
        const recommendations = [];
        if (level === 'CRITICAL' || level === 'HIGH') {
            recommendations.push('Activer la double authentification');
            recommendations.push('Vérifier l\'activité récente du compte');
        }
        if (factors.includes('Localisation inhabituelle')) {
            recommendations.push('Confirmer la localisation par email');
        }
        if (factors.includes('Appareil inconnu')) {
            recommendations.push('Vérifier l\'appareil utilisé');
        }
        return recommendations;
    }
    async handleCriticalSecurityEvent(event) {
        try {
            await this.email.sendMail({
                to: 'security@entrix.tn',
                subject: `🚨 Alerte sécurité critique - ${event.type}`,
                template: 'security-alert',
                context: {
                    event,
                    timestamp: event.createdAt.toISOString(),
                    severity: 'CRITICAL'
                }
            });
            this.logger.error(`CRITICAL SECURITY EVENT: ${event.type} for user ${event.userId}`);
        }
        catch (error) {
            this.logger.error('Failed to handle critical security event:', error);
        }
    }
    async sendAccountLockNotification(email, reason) {
        try {
            await this.email.sendMail({
                to: email,
                subject: '🔒 Votre compte a été temporairement verrouillé',
                template: 'account-locked',
                context: {
                    reason,
                    unlockTime: '30 minutes',
                    supportEmail: 'support@entrix.tn'
                }
            });
        }
        catch (error) {
            this.logger.error(`Failed to send account lock notification to ${email}:`, error);
        }
    }
    generateEventId() {
        return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
};
exports.SecurityService = SecurityService;
exports.SecurityService = SecurityService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [redis_service_1.RedisService,
        email_service_1.EmailService,
        logger_service_1.LoggerService,
        prisma_service_1.PrismaService,
        config_1.ConfigService])
], SecurityService);
//# sourceMappingURL=security.service.js.map