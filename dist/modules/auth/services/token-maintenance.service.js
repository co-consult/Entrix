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
exports.TokenMaintenanceService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const logger_service_1 = require("../../../shared/logger/logger.service");
const persistent_token_service_1 = require("./persistent-token.service");
const validation_token_service_1 = require("./validation-token.service");
const token_service_1 = require("./token.service");
const redis_service_1 = require("../../../shared/redis/redis.service");
const bullmq_service_1 = require("../../../shared/bullmq/bullmq.service");
let TokenMaintenanceService = class TokenMaintenanceService {
    persistentTokenService;
    validationTokenService;
    tokenService;
    redis;
    bullmq;
    logger;
    constructor(persistentTokenService, validationTokenService, tokenService, redis, bullmq, loggerService) {
        this.persistentTokenService = persistentTokenService;
        this.validationTokenService = validationTokenService;
        this.tokenService = tokenService;
        this.redis = redis;
        this.bullmq = bullmq;
        this.logger = loggerService.createChildLogger('TokenMaintenanceService');
    }
    async dailyTokenCleanup() {
        const operationId = this.logger.startOperation('dailyTokenCleanup');
        try {
            this.logger.info('Starting daily token cleanup...');
            const results = await this.tokenService.cleanupExpiredTokens();
            const totalCleaned = results.persistent_tokens + results.validation_tokens + results.blacklisted_keys;
            this.logger.info('Daily token cleanup completed', JSON.stringify({
                persistent_tokens_cleaned: results.persistent_tokens,
                validation_tokens_cleaned: results.validation_tokens,
                blacklisted_keys_cleaned: results.blacklisted_keys,
                total_cleaned: totalCleaned,
                duration_ms: Date.now(),
            }));
            if (totalCleaned > 1000) {
                await this.scheduleCleanupReport(results, 'daily');
            }
            this.logger.endOperation('dailyTokenCleanup', operationId, true);
        }
        catch (error) {
            this.logger.endOperation('dailyTokenCleanup', operationId, false);
            this.logger.error('Daily token cleanup failed', error.stack, 'TokenMaintenanceService.dailyTokenCleanup', JSON.stringify({ errorMessage: error.message }));
            await this.scheduleMaintenanceAlert('daily_cleanup_failed', error.message);
        }
    }
    async weeklyDeepCleanup() {
        const operationId = this.logger.startOperation('weeklyDeepCleanup');
        try {
            this.logger.info('Starting weekly deep cleanup...');
            const results = await Promise.all([
                this.tokenService.cleanupExpiredTokens(),
                this.validationTokenService.cleanupUsedTokens(30),
                this.validationTokenService.cleanupBlockedTokens(7),
                this.persistentTokenService.cleanupRevokedTokens(90),
                this.cleanupRedisCache(),
            ]);
            const summary = {
                expired_tokens: results[0],
                used_validation_tokens: results[1],
                blocked_validation_tokens: results[2],
                revoked_persistent_tokens: results[3],
                cache_keys_cleaned: results[4],
            };
            this.logger.info('Weekly deep cleanup completed', JSON.stringify(summary));
            await this.scheduleCleanupReport(summary, 'weekly');
            this.logger.endOperation('weeklyDeepCleanup', operationId, true);
        }
        catch (error) {
            this.logger.endOperation('weeklyDeepCleanup', operationId, false);
            this.logger.error('Weekly deep cleanup failed', error.stack, 'TokenMaintenanceService.weeklyDeepCleanup', JSON.stringify({ errorMessage: error.message }));
            await this.scheduleMaintenanceAlert('weekly_cleanup_failed', error.message);
        }
    }
    async hourlyCacheOptimization() {
        const operationId = this.logger.startOperation('hourlyCacheOptimization');
        try {
            const optimized = await this.optimizeTokenCache();
            if (optimized > 0) {
                this.logger.info('Token cache optimized', JSON.stringify({
                    keys_optimized: optimized,
                }));
            }
            this.logger.endOperation('hourlyCacheOptimization', operationId, true);
        }
        catch (error) {
            this.logger.endOperation('hourlyCacheOptimization', operationId, false);
            this.logger.error('Cache optimization failed', error.stack);
        }
    }
    async tokenHealthMonitoring() {
        const operationId = this.logger.startOperation('tokenHealthMonitoring');
        try {
            const healthReport = await this.generateHealthReport();
            await this.checkHealthAlerts(healthReport);
            this.logger.info('Token health check completed', JSON.stringify({
                health_score: healthReport.overall_health_score,
                alerts_triggered: healthReport.alerts?.length || 0,
            }));
            this.logger.endOperation('tokenHealthMonitoring', operationId, true);
        }
        catch (error) {
            this.logger.endOperation('tokenHealthMonitoring', operationId, false);
            this.logger.error('Health monitoring failed', error.stack);
        }
    }
    async cleanupRedisCache() {
        try {
            let cleanedCount = 0;
            const patterns = [
                'token_payload:access:*',
                'token_payload:refresh:*',
                'persistent_token:*',
                'validation_token:*',
                'blacklist:*',
            ];
            for (const pattern of patterns) {
                try {
                    const keys = await this.scanRedisKeys(pattern);
                    for (const key of keys) {
                        const ttl = await this.getKeyTTL(key);
                        if (ttl <= 0) {
                            await this.redis.delCache(key);
                            cleanedCount++;
                        }
                    }
                }
                catch (patternError) {
                    this.logger.warn(`Failed to clean pattern ${pattern}`, patternError.message);
                }
            }
            return cleanedCount;
        }
        catch (error) {
            this.logger.error('Redis cache cleanup failed', error.stack);
            return 0;
        }
    }
    async optimizeTokenCache() {
        try {
            let optimizedCount = 0;
            const cachePatterns = [
                'token_payload:access:*',
                'token_payload:refresh:*',
            ];
            for (const pattern of cachePatterns) {
                try {
                    const keys = await this.scanRedisKeys(pattern);
                    for (const key of keys) {
                        const ttl = await this.getKeyTTL(key);
                        if (ttl > 3600) {
                            await this.setKeyExpiry(key, 300);
                            optimizedCount++;
                        }
                    }
                }
                catch (patternError) {
                    this.logger.warn(`Failed to optimize pattern ${pattern}`, patternError.message);
                }
            }
            return optimizedCount;
        }
        catch (error) {
            this.logger.error('Cache optimization failed', error.stack);
            return 0;
        }
    }
    async generateHealthReport() {
        try {
            const [persistentStats, validationStats, jwtStats, cacheMetrics] = await Promise.all([
                this.persistentTokenService.getTokenStats(),
                this.validationTokenService.getTokenStats(),
                this.tokenService.getGlobalTokenStats(),
                this.getCacheMetrics(),
            ]);
            const alerts = this.analyzeHealthMetrics({
                persistent: persistentStats,
                validation: validationStats,
                jwt: jwtStats.jwt_tokens,
                cache: cacheMetrics,
            });
            const healthScore = this.calculateHealthScore({
                persistent: persistentStats,
                validation: validationStats,
                cache: cacheMetrics,
                alertCount: alerts.length,
            });
            return {
                timestamp: new Date().toISOString(),
                overall_health_score: healthScore,
                persistent_tokens: persistentStats,
                validation_tokens: validationStats,
                jwt_metrics: jwtStats.jwt_tokens,
                cache_metrics: cacheMetrics,
                alerts: alerts.length > 0 ? alerts : undefined,
            };
        }
        catch (error) {
            this.logger.error('Failed to generate health report', error.stack);
            return {
                timestamp: new Date().toISOString(),
                overall_health_score: 0,
                persistent_tokens: {},
                validation_tokens: {},
                jwt_metrics: {},
                cache_metrics: {},
                alerts: [{
                        level: 'critical',
                        message: 'Health report generation failed',
                        metric: 'system',
                        value: 0,
                        threshold: 1,
                    }],
            };
        }
    }
    async checkHealthAlerts(healthReport) {
        if (!healthReport.alerts || healthReport.alerts.length === 0) {
            return;
        }
        const criticalAlerts = healthReport.alerts.filter(alert => alert.level === 'critical');
        const errorAlerts = healthReport.alerts.filter(alert => alert.level === 'error');
        for (const alert of criticalAlerts) {
            await this.scheduleMaintenanceAlert('critical_threshold', alert.message, alert);
        }
        if (errorAlerts.length > 0) {
            await this.scheduleMaintenanceAlert('error_thresholds', `${errorAlerts.length} error threshold(s) exceeded`, { alerts: errorAlerts });
        }
        if (healthReport.overall_health_score < 30) {
            await this.scheduleMaintenanceAlert('low_health_score', `System health score is critically low: ${healthReport.overall_health_score}%`, { health_score: healthReport.overall_health_score });
        }
    }
    analyzeHealthMetrics(metrics) {
        const alerts = [];
        if (metrics.persistent.total > 10000) {
            alerts.push({
                level: 'warning',
                message: 'High number of persistent tokens',
                metric: 'persistent_tokens_total',
                value: metrics.persistent.total,
                threshold: 10000,
            });
        }
        if (metrics.persistent.expired > metrics.persistent.total * 0.3) {
            alerts.push({
                level: 'error',
                message: 'High percentage of expired persistent tokens',
                metric: 'persistent_tokens_expired_ratio',
                value: metrics.persistent.expired / metrics.persistent.total,
                threshold: 0.3,
            });
        }
        if (metrics.validation.blocked > 100) {
            alerts.push({
                level: 'warning',
                message: 'High number of blocked validation tokens',
                metric: 'validation_tokens_blocked',
                value: metrics.validation.blocked,
                threshold: 100,
            });
        }
        if (metrics.validation.success_rate < 70) {
            alerts.push({
                level: 'error',
                message: 'Low validation token success rate',
                metric: 'validation_success_rate',
                value: metrics.validation.success_rate,
                threshold: 70,
            });
        }
        if (metrics.cache.memory_usage > 80) {
            alerts.push({
                level: 'critical',
                message: 'High cache memory usage',
                metric: 'cache_memory_usage',
                value: metrics.cache.memory_usage,
                threshold: 80,
            });
        }
        return alerts;
    }
    calculateHealthScore(metrics) {
        let score = 100;
        if (metrics.persistent.expired > metrics.persistent.total * 0.2) {
            score -= 15;
        }
        if (metrics.validation.success_rate < 80) {
            score -= 20;
        }
        if (metrics.cache.memory_usage > 70) {
            score -= 10;
        }
        if (metrics.alertCount > 5) {
            score -= metrics.alertCount * 3;
        }
        return Math.max(0, Math.min(100, score));
    }
    async getCacheMetrics() {
        try {
            return {
                total_keys: 0,
                memory_usage: 0,
                hit_rate: 0,
            };
        }
        catch (error) {
            this.logger.error('Failed to get cache metrics', error.stack);
            return {
                total_keys: 0,
                memory_usage: 0,
                hit_rate: 0,
            };
        }
    }
    async scheduleCleanupReport(results, type) {
        try {
            await this.bullmq.addJob('MAINTENANCE_QUEUE', 'cleanup_report', {
                type,
                results,
                timestamp: new Date().toISOString(),
            });
        }
        catch (error) {
            this.logger.error('Failed to schedule cleanup report', error.stack);
        }
    }
    async scheduleMaintenanceAlert(alertType, message, data) {
        try {
            await this.bullmq.addJob('ALERTS_QUEUE', 'maintenance_alert', {
                alert_type: alertType,
                message,
                data,
                timestamp: new Date().toISOString(),
                severity: this.getAlertSeverity(alertType),
            });
        }
        catch (error) {
            this.logger.error('Failed to schedule maintenance alert', error.stack);
        }
    }
    getAlertSeverity(alertType) {
        const severityMap = {
            'daily_cleanup_failed': 'medium',
            'weekly_cleanup_failed': 'high',
            'critical_threshold': 'critical',
            'error_thresholds': 'high',
            'low_health_score': 'critical',
        };
        return severityMap[alertType] || 'medium';
    }
    async forceCleanup(type = 'daily') {
        const operationId = this.logger.startOperation(`forceCleanup:${type}`);
        try {
            let results;
            switch (type) {
                case 'daily':
                    results = await this.tokenService.cleanupExpiredTokens();
                    break;
                case 'weekly':
                    results = await this.weeklyDeepCleanup();
                    break;
                case 'full':
                    results = await Promise.all([
                        this.tokenService.cleanupExpiredTokens(),
                        this.weeklyDeepCleanup(),
                        this.cleanupRedisCache(),
                    ]);
                    break;
            }
            this.logger.endOperation(`forceCleanup:${type}`, operationId, true);
            return results;
        }
        catch (error) {
            this.logger.endOperation(`forceCleanup:${type}`, operationId, false);
            throw error;
        }
    }
    async getHealthReport() {
        return await this.generateHealthReport();
    }
    async forceOptimization() {
        return await this.optimizeTokenCache();
    }
    async scanRedisKeys(pattern) {
        try {
            const keys = [];
            if (typeof this.redis.scanKeys === 'function') {
                return await this.redis.scanKeys(pattern);
            }
            this.logger.warn(`Redis scanKeys not available for pattern: ${pattern}`);
            return keys;
        }
        catch (error) {
            this.logger.error(`Error scanning Redis keys for pattern ${pattern}`, error.stack);
            return [];
        }
    }
    async getKeyTTL(key) {
        try {
            if (typeof this.redis.getTTL === 'function') {
                return await this.redis.getTTL(key);
            }
            const value = await this.redis.getCache(key);
            return value ? 3600 : -1;
        }
        catch (error) {
            this.logger.error(`Error getting TTL for key ${key}`, error.stack);
            return -1;
        }
    }
    async setKeyExpiry(key, seconds) {
        try {
            if (typeof this.redis.expire === 'function') {
                await this.redis.expire(key, seconds);
                return true;
            }
            const value = await this.redis.getCache(key);
            if (value) {
                await this.redis.setCache(key, value, seconds);
                return true;
            }
            return false;
        }
        catch (error) {
            this.logger.error(`Error setting expiry for key ${key}`, error.stack);
            return false;
        }
    }
};
exports.TokenMaintenanceService = TokenMaintenanceService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_DAY_AT_2AM),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TokenMaintenanceService.prototype, "dailyTokenCleanup", null);
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_WEEK),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TokenMaintenanceService.prototype, "weeklyDeepCleanup", null);
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_HOUR),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TokenMaintenanceService.prototype, "hourlyCacheOptimization", null);
__decorate([
    (0, schedule_1.Cron)('*/30 * * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TokenMaintenanceService.prototype, "tokenHealthMonitoring", null);
exports.TokenMaintenanceService = TokenMaintenanceService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [persistent_token_service_1.PersistentTokenService,
        validation_token_service_1.ValidationTokenService,
        token_service_1.TokenService,
        redis_service_1.RedisService,
        bullmq_service_1.BullmqService,
        logger_service_1.LoggerService])
], TokenMaintenanceService);
//# sourceMappingURL=token-maintenance.service.js.map