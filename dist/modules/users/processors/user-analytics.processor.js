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
exports.UserAnalyticsProcessor = void 0;
const bull_1 = require("@nestjs/bull");
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../shared/prisma/prisma.service");
const redis_service_1 = require("../../../shared/redis/redis.service");
const logger_service_1 = require("../../../shared/logger/logger.service");
let UserAnalyticsProcessor = class UserAnalyticsProcessor {
    prisma;
    redisService;
    logger;
    constructor(prisma, redisService, logger) {
        this.prisma = prisma;
        this.redisService = redisService;
        this.logger = logger.createChildLogger('UserAnalyticsProcessor');
    }
    async processUserActivity(job) {
        const { userId, action, resource, resourceId, metadata, timestamp, sessionId, ipAddress, userAgent, referrer } = job.data;
        this.logger.info('Processing user activity tracking', JSON.stringify({
            jobId: job.id,
            userId,
            action,
            resource,
            resourceId,
        }));
        try {
            await this.prisma.executeWithRetry(async () => {
                await this.prisma.audit_logs.create({
                    data: {
                        user_id: userId,
                        table_name: resource,
                        record_id: resourceId,
                        action: this.mapActionToAuditAction(action),
                        new_values: {
                            action,
                            resource,
                            resourceId,
                            sessionId,
                            referrer,
                            timestamp: timestamp.toISOString(),
                        },
                        ip_address: ipAddress,
                        user_agent: userAgent,
                        description: `User activity: ${action} on ${resource}`,
                        metadata: metadata || {},
                        created_at: new Date(timestamp),
                    },
                });
            }, 3, 1000);
            await this.updateRealTimeMetrics(userId, action, resource, timestamp);
            await this.updateLastActivity(userId, timestamp);
            if (this.isSignificantActivity(action, resource)) {
                await this.analyzeUsagePatterns(userId, action, resource, timestamp);
            }
            this.logger.info('User activity tracked successfully', JSON.stringify({
                userId,
                action,
                resource,
                jobId: job.id,
            }));
            if (this.isBusinessCriticalActivity(action, resource)) {
                this.logger.logBusinessEvent('USER_ACTIVITY_TRACKED', {
                    userId,
                    action,
                    resource,
                    resourceId,
                    sessionId,
                    hasMetadata: !!metadata,
                }, userId);
            }
        }
        catch (error) {
            this.logger.error('Failed to process user activity', error.stack, JSON.stringify({
                userId,
                action,
                resource,
                jobId: job.id,
            }));
            throw error;
        }
    }
    async processUserBehavior(job) {
        const { userId, eventType, sessionData, deviceData, timestamp, ...eventSpecificData } = job.data;
        this.logger.info('Processing user behavior tracking', JSON.stringify({
            jobId: job.id,
            userId,
            eventType,
            sessionId: sessionData.sessionId,
            deviceType: deviceData.type,
        }));
        try {
            await this.prisma.executeWithRetry(async () => {
                await this.prisma.audit_logs.create({
                    data: {
                        user_id: userId,
                        table_name: 'user_behavior',
                        action: 'CREATE',
                        new_values: {
                            eventType,
                            sessionId: sessionData.sessionId,
                            pageNumber: sessionData.pageNumber,
                            timeOnPage: sessionData.timeOnPage,
                            deviceType: deviceData.type,
                            browser: deviceData.browser,
                            os: deviceData.os,
                            screenSize: deviceData.screenSize,
                            eventData: eventSpecificData,
                            timestamp: timestamp.toISOString(),
                        },
                        description: `User behavior: ${eventType}`,
                        metadata: {
                            behaviorType: eventType,
                            device: deviceData,
                            session: sessionData,
                        },
                        created_at: new Date(timestamp),
                    },
                });
            }, 3, 1000);
            await this.updateBehaviorMetrics(userId, eventType, deviceData.type, timestamp);
            if (eventType === 'PAGE_VIEW') {
                await this.analyzeNavigationPatterns(userId, sessionData, timestamp);
            }
            if (eventType === 'PURCHASE' && eventSpecificData.purchaseData) {
                await this.analyzePurchaseConversion(userId, eventSpecificData.purchaseData, sessionData, timestamp);
            }
            await this.updateEngagementScore(userId, eventType, sessionData, timestamp);
            this.logger.info('User behavior tracked successfully', JSON.stringify({
                userId,
                eventType,
                sessionId: sessionData.sessionId,
                jobId: job.id,
            }));
        }
        catch (error) {
            this.logger.error('Failed to process user behavior', error.stack, JSON.stringify({
                userId,
                eventType,
                jobId: job.id,
            }));
            throw error;
        }
    }
    async processUserEngagement(job) {
        const { userId, engagementType, details, timestamp } = job.data;
        this.logger.info('Processing user engagement update', JSON.stringify({
            jobId: job.id,
            userId,
            engagementType,
        }));
        try {
            const engagementScore = await this.calculateEngagementScore(userId, engagementType, details, timestamp);
            await this.prisma.audit_logs.create({
                data: {
                    user_id: userId,
                    table_name: 'user_engagement',
                    action: 'CREATE',
                    new_values: {
                        engagementType,
                        engagementScore,
                        details,
                        timestamp: timestamp.toISOString(),
                    },
                    description: `User engagement: ${engagementType}`,
                    metadata: {
                        engagementScore,
                        engagementType,
                        details,
                    },
                    created_at: new Date(timestamp),
                },
            });
            await this.updateEngagementCache(userId, engagementType, engagementScore);
            if (engagementScore < 30) {
                await this.flagUserAtRisk(userId, engagementScore, 'LOW_ENGAGEMENT');
            }
            this.logger.info('User engagement updated successfully', JSON.stringify({
                userId,
                engagementType,
                engagementScore,
                jobId: job.id,
            }));
            this.logger.logBusinessEvent('USER_ENGAGEMENT_UPDATED', {
                userId,
                engagementType,
                engagementScore,
                details,
            }, userId);
        }
        catch (error) {
            this.logger.error('Failed to process user engagement', error.stack, JSON.stringify({
                userId,
                engagementType,
                jobId: job.id,
            }));
            throw error;
        }
    }
    async processUserRetention(job) {
        const { userId, cohortMonth, registrationDate, lastActiveDate, totalSessions, totalPurchases, totalSpent, isActive, riskScore } = job.data;
        this.logger.info('Processing user retention calculation', JSON.stringify({
            jobId: job.id,
            userId,
            cohortMonth,
            isActive,
            riskScore,
        }));
        try {
            const daysSinceRegistration = Math.floor((Date.now() - new Date(registrationDate).getTime()) / (1000 * 60 * 60 * 24));
            const daysSinceLastActive = Math.floor((Date.now() - new Date(lastActiveDate).getTime()) / (1000 * 60 * 60 * 24));
            const retentionMetrics = {
                daysSinceRegistration,
                daysSinceLastActive,
                avgSessionsPerDay: daysSinceRegistration > 0 ? totalSessions / daysSinceRegistration : 0,
                avgSpentPerSession: totalSessions > 0 ? totalSpent / totalSessions : 0,
                isAtRisk: daysSinceLastActive > 30 || (riskScore && riskScore > 70),
                lifetimeValue: totalSpent,
                sessionFrequency: totalSessions,
                purchaseFrequency: totalPurchases,
            };
            await this.prisma.audit_logs.create({
                data: {
                    user_id: userId,
                    table_name: 'user_retention',
                    action: 'UPDATE',
                    new_values: {
                        cohortMonth,
                        retentionMetrics,
                        calculatedAt: new Date().toISOString(),
                    },
                    description: `User retention calculated for cohort ${cohortMonth}`,
                    metadata: {
                        retentionMetrics,
                        cohortMonth,
                        isActive,
                        riskScore,
                    },
                    created_at: new Date(),
                },
            });
            await this.updateRetentionCache(userId, cohortMonth, retentionMetrics);
            if (retentionMetrics.isAtRisk) {
                await this.triggerRetentionActions(userId, retentionMetrics);
            }
            this.logger.info('User retention calculated successfully', JSON.stringify({
                userId,
                cohortMonth,
                isAtRisk: retentionMetrics.isAtRisk,
                jobId: job.id,
            }));
            this.logger.logBusinessEvent('USER_RETENTION_CALCULATED', {
                userId,
                cohortMonth,
                isActive,
                daysSinceRegistration,
                daysSinceLastActive,
            }, userId);
        }
        catch (error) {
            this.logger.error('Failed to process user retention', error.stack, JSON.stringify({
                userId,
                cohortMonth,
                jobId: job.id,
            }));
            throw error;
        }
    }
    mapActionToAuditAction(action) {
        const actionMap = {
            'CREATE': 'CREATE',
            'create': 'CREATE',
            'READ': 'READ',
            'UPDATE': 'UPDATE',
            'update': 'UPDATE',
            'DELETE': 'DELETE',
            'delete': 'DELETE',
            'login': 'LOGIN',
            'LOGIN': 'LOGIN',
            'logout': 'LOGOUT',
            'LOGOUT': 'LOGOUT',
            'view': 'READ',
            'click': 'READ',
            'purchase': 'CREATE',
            'search': 'READ',
            'filter': 'READ',
            'share': 'CREATE',
            'export': 'EXPORT',
            'import': 'IMPORT',
            'approve': 'APPROVE',
            'reject': 'REJECT',
            'suspend': 'SUSPEND',
            'activate': 'ACTIVATE',
        };
        return actionMap[action] || 'READ';
    }
    async updateRealTimeMetrics(userId, action, resource, timestamp) {
        try {
            const date = new Date(timestamp).toISOString().split('T')[0];
            const hour = new Date(timestamp).getHours();
            const ttl = 30 * 24 * 60 * 60;
            await this.redisService.increment(`metrics:daily:${date}:activities`, ttl);
            await this.redisService.increment(`metrics:hourly:${date}:${hour}:activities`, ttl);
            await this.redisService.increment(`metrics:user:${userId}:daily:${date}:activities`, ttl);
            await this.redisService.increment(`metrics:action:${action}:daily:${date}`, ttl);
            await this.redisService.increment(`metrics:resource:${resource}:daily:${date}`, ttl);
        }
        catch (error) {
            this.logger.error('Failed to update real-time metrics', error.stack, JSON.stringify({ userId }));
        }
    }
    async updateLastActivity(userId, timestamp) {
        try {
            await this.redisService.setCache(`user:${userId}:last_activity`, timestamp.toISOString(), 86400);
            await this.prisma.executeWithRetry(async () => {
                await this.prisma.users.update({
                    where: { id: userId },
                    data: { last_login: timestamp },
                });
            }, 2, 500);
        }
        catch (error) {
            this.logger.error('Failed to update last activity', error.stack, JSON.stringify({ userId }));
        }
    }
    isSignificantActivity(action, resource) {
        const significantActions = ['CREATE', 'UPDATE', 'DELETE', 'purchase'];
        const significantResources = ['orders', 'tickets', 'subscriptions', 'events'];
        return significantActions.includes(action) || significantResources.includes(resource);
    }
    isBusinessCriticalActivity(action, resource) {
        const criticalCombinations = [
            { action: 'purchase', resource: 'orders' },
            { action: 'CREATE', resource: 'tickets' },
            { action: 'CREATE', resource: 'subscriptions' },
            { action: 'DELETE', resource: 'users' },
        ];
        return criticalCombinations.some(combo => combo.action === action && combo.resource === resource);
    }
    async analyzeUsagePatterns(userId, action, resource, timestamp) {
        try {
            const date = new Date(timestamp).toISOString().split('T')[0];
            const hour = new Date(timestamp).getHours();
            await this.redisService.increment(`patterns:user:${userId}:hour:${hour}`, 86400);
            await this.redisService.increment(`patterns:user:${userId}:action:${action}`, 86400);
            const recentActions = await this.redisService.getCache(`patterns:user:${userId}:recent`);
            const actions = recentActions ? JSON.parse(recentActions) : [];
            actions.push({ action, resource, timestamp: timestamp.toISOString() });
            if (actions.length > 50) {
                actions.splice(0, actions.length - 50);
            }
            await this.redisService.setCache(`patterns:user:${userId}:recent`, JSON.stringify(actions), 86400);
        }
        catch (error) {
            this.logger.error('Failed to analyze usage patterns', error.stack, JSON.stringify({ userId }));
        }
    }
    async updateBehaviorMetrics(userId, eventType, deviceType, timestamp) {
        try {
            const date = new Date(timestamp).toISOString().split('T')[0];
            await this.redisService.increment(`behavior:${eventType}:daily:${date}`, 86400);
            await this.redisService.increment(`behavior:user:${userId}:${eventType}:daily:${date}`, 86400);
            await this.redisService.increment(`behavior:device:${deviceType}:daily:${date}`, 86400);
        }
        catch (error) {
            this.logger.error('Failed to update behavior metrics', error.stack, JSON.stringify({ userId }));
        }
    }
    async analyzeNavigationPatterns(userId, sessionData, timestamp) {
        try {
            const sessionKey = `navigation:${userId}:${sessionData.sessionId}`;
            const existingNavigation = await this.redisService.getCache(sessionKey);
            const navigation = existingNavigation ? JSON.parse(existingNavigation) : [];
            navigation.push({
                pageNumber: sessionData.pageNumber,
                timeOnPage: sessionData.timeOnPage,
                timestamp: timestamp.toISOString(),
            });
            await this.redisService.setCache(sessionKey, JSON.stringify(navigation), 86400);
            if (sessionData.timeOnPage && sessionData.timeOnPage < 5) {
                await this.redisService.increment(`abandons:user:${userId}:daily`, 86400);
            }
        }
        catch (error) {
            this.logger.error('Failed to analyze navigation patterns', error.stack, JSON.stringify({ userId }));
        }
    }
    async analyzePurchaseConversion(userId, purchaseData, sessionData, timestamp) {
        try {
            const conversionData = {
                orderId: purchaseData.orderId,
                amount: purchaseData.amount,
                items: purchaseData.items,
                category: purchaseData.category,
                sessionId: sessionData.sessionId,
                pageNumber: sessionData.pageNumber,
                timestamp: timestamp.toISOString(),
            };
            await this.redisService.setCache(`conversion:${userId}:${purchaseData.orderId}`, JSON.stringify(conversionData), 604800);
            const date = new Date(timestamp).toISOString().split('T')[0];
            await this.redisService.increment(`conversions:daily:${date}`, 86400);
            await this.redisService.increment(`conversions:user:${userId}:daily:${date}`, 86400);
        }
        catch (error) {
            this.logger.error('Failed to analyze purchase conversion', error.stack, JSON.stringify({ userId }));
        }
    }
    async updateEngagementScore(userId, eventType, sessionData, timestamp) {
        try {
            const baseScore = this.getBaseEngagementScore(eventType);
            const timeBonus = sessionData.timeOnPage ?
                Math.min(sessionData.timeOnPage / 60, 10) : 0;
            const totalScore = baseScore + timeBonus;
            await this.redisService.increment(`engagement:${userId}:daily`, Math.round(totalScore));
        }
        catch (error) {
            this.logger.error('Failed to update engagement score', error.stack, JSON.stringify({ userId }));
        }
    }
    getBaseEngagementScore(eventType) {
        const scores = {
            'PAGE_VIEW': 1,
            'SEARCH': 3,
            'FILTER': 2,
            'CLICK': 2,
            'PURCHASE': 10,
            'SHARE': 5,
        };
        return scores[eventType] || 1;
    }
    async calculateEngagementScore(userId, engagementType, details, timestamp) {
        try {
            const baseScores = {
                'LOGIN': 10,
                'PROFILE_UPDATE': 15,
                'PREFERENCE_CHANGE': 5,
                'SOCIAL_INTERACTION': 20,
                'SUPPORT_CONTACT': 8,
            };
            let score = baseScores[engagementType] || 5;
            const recentEngagement = await this.redisService.getCache(`engagement:${userId}:daily`);
            if (recentEngagement && typeof recentEngagement === 'string') {
                const currentScore = parseInt(recentEngagement, 10) || 0;
                score += Math.min(currentScore * 0.1, 20);
            }
            return Math.min(score, 100);
        }
        catch (error) {
            this.logger.error('Failed to calculate engagement score', error.stack, JSON.stringify({ userId }));
            return 5;
        }
    }
    async updateEngagementCache(userId, engagementType, score) {
        try {
            const date = new Date().toISOString().split('T')[0];
            await this.redisService.increment(`engagement:${userId}:${engagementType}:daily:${date}`, 1);
            await this.redisService.setCache(`engagement:${userId}:score:latest`, score.toString(), 86400);
        }
        catch (error) {
            this.logger.error('Failed to update engagement cache', error.stack, JSON.stringify({ userId }));
        }
    }
    async flagUserAtRisk(userId, score, reason) {
        try {
            const riskData = {
                userId,
                score,
                reason,
                flaggedAt: new Date().toISOString(),
            };
            await this.redisService.setCache(`risk:${userId}`, JSON.stringify(riskData), 604800);
            await this.prisma.audit_logs.create({
                data: {
                    user_id: userId,
                    table_name: 'user_risk',
                    action: 'CREATE',
                    new_values: riskData,
                    description: `User flagged as at-risk: ${reason}`,
                    metadata: { riskScore: score, reason },
                    created_at: new Date(),
                },
            });
        }
        catch (error) {
            this.logger.error('Failed to flag user at risk', error.stack, JSON.stringify({ userId }));
        }
    }
    async updateRetentionCache(userId, cohortMonth, metrics) {
        try {
            const cacheKey = `retention:${cohortMonth}:${userId}`;
            await this.redisService.setCache(cacheKey, JSON.stringify(metrics), 604800);
            if (metrics.isAtRisk) {
                await this.redisService.increment(`retention:${cohortMonth}:at_risk`, 604800);
            }
        }
        catch (error) {
            this.logger.error('Failed to update retention cache', error.stack, JSON.stringify({ userId }));
        }
    }
    async triggerRetentionActions(userId, metrics) {
        try {
            await this.redisService.setCache(`retention_action:${userId}`, JSON.stringify({
                triggeredAt: new Date().toISOString(),
                metrics,
                actionType: 'EMAIL_CAMPAIGN',
            }), 604800);
            this.logger.info('Retention actions triggered', JSON.stringify({
                userId,
                daysSinceLastActive: metrics.daysSinceLastActive,
                isAtRisk: metrics.isAtRisk,
            }));
        }
        catch (error) {
            this.logger.error('Failed to trigger retention actions', error.stack, JSON.stringify({ userId }));
        }
    }
};
exports.UserAnalyticsProcessor = UserAnalyticsProcessor;
__decorate([
    (0, bull_1.Process)('track-user-activity'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UserAnalyticsProcessor.prototype, "processUserActivity", null);
__decorate([
    (0, bull_1.Process)('track-user-behavior'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UserAnalyticsProcessor.prototype, "processUserBehavior", null);
__decorate([
    (0, bull_1.Process)('update-user-engagement'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UserAnalyticsProcessor.prototype, "processUserEngagement", null);
__decorate([
    (0, bull_1.Process)('calculate-user-retention'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UserAnalyticsProcessor.prototype, "processUserRetention", null);
exports.UserAnalyticsProcessor = UserAnalyticsProcessor = __decorate([
    (0, common_1.Injectable)(),
    (0, bull_1.Processor)('analytics'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        redis_service_1.RedisService,
        logger_service_1.LoggerService])
], UserAnalyticsProcessor);
//# sourceMappingURL=user-analytics.processor.js.map