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
exports.RiskAssessmentService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../../../shared/prisma/prisma.service");
const redis_service_1 = require("../../../shared/redis/redis.service");
const logger_service_1 = require("../../../shared/logger/logger.service");
let RiskAssessmentService = class RiskAssessmentService {
    prisma;
    redis;
    config;
    logger;
    constructor(prisma, redis, config, loggerService) {
        this.prisma = prisma;
        this.redis = redis;
        this.config = config;
        this.logger = loggerService.createChildLogger('RiskAssessmentService');
    }
    async assessLoginRisk(userId, context) {
        const operationId = this.logger.startOperation('assessLoginRisk', {
            userId,
            hasDeviceFingerprint: !!context.deviceFingerprint
        });
        try {
            const riskFactors = await Promise.all([
                this.checkNewDevice(userId, context.deviceFingerprint),
                this.checkNewLocation(userId, context.ipAddress),
                this.checkSuspiciousActivity(userId, context.ipAddress),
                this.checkTimeOfAccess(),
                this.checkMultipleFailures(userId),
                this.checkVelocityRisk(userId, context.ipAddress),
                this.checkUserBehaviorAnomaly(userId, context)
            ]);
            const riskScore = this.calculateRiskScore(riskFactors);
            this.logger.endOperation('assessLoginRisk', operationId, true, undefined, {
                riskScore,
                factors: riskFactors.map((factor, index) => ({
                    [`factor${index}`]: factor
                }))
            });
            await this.storeRiskAssessment(userId, riskScore, riskFactors, context);
            return riskScore;
        }
        catch (error) {
            this.logger.endOperation('assessLoginRisk', operationId, false);
            this.logger.error('Risk assessment failed', error.stack, 'RiskAssessmentService.assessLoginRisk', JSON.stringify({
                userId,
                error: error.message
            }));
            return 75;
        }
    }
    async generateRiskAssessment(userId, context) {
        const operationId = this.logger.startOperation('generateRiskAssessment', { userId });
        try {
            const riskScore = await this.assessLoginRisk(userId, context);
            const factors = {
                newDevice: await this.checkNewDevice(userId, context.deviceFingerprint),
                newLocation: await this.checkNewLocation(userId, context.ipAddress),
                suspiciousActivity: await this.checkSuspiciousActivity(userId, context.ipAddress),
                timeOfAccess: await this.checkTimeOfAccess(),
                multipleFailures: await this.checkMultipleFailures(userId)
            };
            const recommendedMethods = await this.getRecommendedMethods(userId, riskScore);
            const requireMfa = riskScore > await this.getMfaThreshold(userId);
            this.logger.endOperation('generateRiskAssessment', operationId, true);
            return {
                riskScore,
                factors,
                recommendedMethods,
                requireMfa
            };
        }
        catch (error) {
            this.logger.endOperation('generateRiskAssessment', operationId, false);
            throw error;
        }
    }
    async updateUserRiskProfile(userId, action, context) {
        try {
            const profileKey = `user_risk_profile:${userId}`;
            const profile = await this.redis.getCache(profileKey) || {
                successfulLogins: 0,
                failedLogins: 0,
                mfaSuccesses: 0,
                mfaFailures: 0,
                knownIps: [],
                knownDevices: [],
                lastActivity: null,
                riskEvents: []
            };
            switch (action) {
                case 'LOGIN_SUCCESS':
                    profile.successfulLogins++;
                    break;
                case 'LOGIN_FAIL':
                    profile.failedLogins++;
                    break;
                case 'MFA_SUCCESS':
                    profile.mfaSuccesses++;
                    break;
                case 'MFA_FAIL':
                    profile.mfaFailures++;
                    break;
            }
            if (context.ipAddress && !profile.knownIps.includes(context.ipAddress)) {
                profile.knownIps.push(context.ipAddress);
                if (profile.knownIps.length > 10) {
                    profile.knownIps = profile.knownIps.slice(-10);
                }
            }
            if (context.deviceFingerprint && !profile.knownDevices.includes(context.deviceFingerprint)) {
                profile.knownDevices.push(context.deviceFingerprint);
                if (profile.knownDevices.length > 5) {
                    profile.knownDevices = profile.knownDevices.slice(-5);
                }
            }
            profile.lastActivity = new Date().toISOString();
            await this.redis.setCache(profileKey, profile, 90 * 24 * 60 * 60);
        }
        catch (error) {
            this.logger.error('Failed to update user risk profile', error.stack);
        }
    }
    async checkNewDevice(userId, deviceFingerprint) {
        if (!deviceFingerprint)
            return true;
        try {
            const knownDevice = await this.prisma.user_sessions.findFirst({
                where: {
                    user_id: userId,
                    device_fingerprint: deviceFingerprint
                },
                select: { id: true }
            });
            return !knownDevice;
        }
        catch {
            return true;
        }
    }
    async checkNewLocation(userId, ipAddress) {
        if (!ipAddress)
            return true;
        try {
            const recentLogin = await this.prisma.login_attempts.findFirst({
                where: {
                    user_id: userId,
                    ip_address: ipAddress,
                    success: true,
                    created_at: {
                        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                    }
                },
                select: { id: true }
            });
            return !recentLogin;
        }
        catch {
            return true;
        }
    }
    async checkSuspiciousActivity(userId, ipAddress) {
        if (!ipAddress)
            return false;
        try {
            const failedAttempts = await this.prisma.login_attempts.count({
                where: {
                    ip_address: ipAddress,
                    success: false,
                    created_at: {
                        gte: new Date(Date.now() - 60 * 60 * 1000)
                    }
                }
            });
            const suspiciousEvents = await this.prisma.security_events.count({
                where: {
                    ip_address: ipAddress,
                    severity: {
                        in: ['HIGH', 'MAXIMUM']
                    },
                    created_at: {
                        gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
                    }
                }
            });
            return failedAttempts > 3 || suspiciousEvents > 0;
        }
        catch {
            return false;
        }
    }
    async checkTimeOfAccess() {
        const now = new Date();
        const hour = now.getHours();
        return hour >= 2 && hour <= 6;
    }
    async checkMultipleFailures(userId) {
        try {
            const recentFailures = await this.prisma.login_attempts.count({
                where: {
                    user_id: userId,
                    success: false,
                    created_at: {
                        gte: new Date(Date.now() - 15 * 60 * 1000)
                    }
                }
            });
            return recentFailures >= 3;
        }
        catch {
            return false;
        }
    }
    async checkVelocityRisk(userId, ipAddress) {
        try {
            if (!ipAddress)
                return false;
            const recentAttempts = await this.prisma.login_attempts.count({
                where: {
                    ip_address: ipAddress,
                    created_at: {
                        gte: new Date(Date.now() - 5 * 60 * 1000)
                    }
                }
            });
            return recentAttempts > 5;
        }
        catch {
            return false;
        }
    }
    async checkUserBehaviorAnomaly(userId, context) {
        try {
            const profileKey = `user_risk_profile:${userId}`;
            const profile = await this.redis.getCache(profileKey);
            if (!profile)
                return false;
            const unknownIp = context.ipAddress && !profile.knownIps.includes(context.ipAddress);
            const unknownDevice = context.deviceFingerprint && !profile.knownDevices.includes(context.deviceFingerprint);
            const totalAttempts = profile.successfulLogins + profile.failedLogins;
            const failureRate = totalAttempts > 0 ? profile.failedLogins / totalAttempts : 0;
            return (unknownIp && unknownDevice) || failureRate > 0.3;
        }
        catch {
            return false;
        }
    }
    calculateRiskScore(factors) {
        const weights = [
            25,
            20,
            30,
            10,
            15,
            20,
            25
        ];
        let score = 0;
        factors.forEach((factor, index) => {
            if (factor && weights[index]) {
                score += weights[index];
            }
        });
        return Math.min(100, score);
    }
    async getMfaThreshold(userId) {
        try {
            const userRoles = await this.prisma.user_roles.findMany({
                where: {
                    user_id: userId,
                    status: 'ACTIVE'
                },
                include: {
                    roles: {
                        select: {
                            code: true
                        }
                    }
                }
            });
            const hasAdminRole = userRoles.some(ur => ['ADMIN', 'SUPER_ADMIN', 'ORGANIZER'].includes(ur.roles.code));
            return hasAdminRole ? 30 : 50;
        }
        catch {
            return 50;
        }
    }
    async getRecommendedMethods(userId, riskScore) {
        try {
            const availableMethods = await this.getConfiguredMethods(userId);
            if (riskScore >= 80) {
                return availableMethods.filter(m => ['TOTP_APP', 'SMS_OTP'].includes(m));
            }
            else if (riskScore >= 60) {
                return availableMethods.includes('TOTP_APP')
                    ? ['TOTP_APP']
                    : availableMethods.slice(0, 1);
            }
            else {
                return availableMethods.slice(0, 1);
            }
        }
        catch {
            return ['EMAIL_OTP'];
        }
    }
    async getConfiguredMethods(userId) {
        try {
            const settings = await this.prisma.user_mfa_settings.findMany({
                where: {
                    user_id: userId,
                    is_enabled: true
                },
                select: {
                    method: true
                }
            });
            return settings.map(s => this.mapMethodToProvider(s.method));
        }
        catch {
            return ['EMAIL_OTP'];
        }
    }
    async storeRiskAssessment(userId, riskScore, factors, context) {
        try {
            const assessmentKey = `risk_assessment:${userId}:${Date.now()}`;
            const assessment = {
                userId,
                riskScore,
                factors: {
                    newDevice: factors[0],
                    newLocation: factors[1],
                    suspiciousActivity: factors[2],
                    timeOfAccess: factors[3],
                    multipleFailures: factors[4],
                    velocityRisk: factors[5],
                    behaviorAnomaly: factors[6]
                },
                context,
                timestamp: new Date().toISOString()
            };
            await this.redis.setCache(assessmentKey, assessment, 7 * 24 * 60 * 60);
        }
        catch (error) {
            this.logger.error('Failed to store risk assessment', error.stack);
        }
    }
    mapMethodToProvider(method) {
        const mapping = {
            'SMS': 'SMS_OTP',
            'EMAIL': 'EMAIL_OTP',
            'TOTP': 'TOTP_APP',
            'BACKUP_CODES': 'BACKUP_CODE'
        };
        return mapping[method] || 'EMAIL_OTP';
    }
    async getRiskStatistics() {
        try {
            const assessmentKeys = await this.redis.keys('risk_assessment:*');
            const recentKeys = assessmentKeys.filter(key => {
                const timestamp = parseInt(key.split(':')[2]);
                return Date.now() - timestamp < 24 * 60 * 60 * 1000;
            });
            const assessments = await Promise.all(recentKeys.map(key => this.redis.getCache(key)));
            const validAssessments = assessments.filter(Boolean);
            if (validAssessments.length === 0) {
                return {
                    averageRiskScore: 0,
                    highRiskUsers: 0,
                    totalAssessments: 0,
                    riskDistribution: {}
                };
            }
            const riskScores = validAssessments.map(a => a.riskScore);
            const averageRiskScore = riskScores.reduce((sum, score) => sum + score, 0) / riskScores.length;
            const highRiskUsers = riskScores.filter(score => score >= 70).length;
            const riskDistribution = {
                'Low (0-30)': riskScores.filter(s => s < 30).length,
                'Medium (30-60)': riskScores.filter(s => s >= 30 && s < 60).length,
                'High (60-80)': riskScores.filter(s => s >= 60 && s < 80).length,
                'Critical (80+)': riskScores.filter(s => s >= 80).length
            };
            return {
                averageRiskScore: Math.round(averageRiskScore),
                highRiskUsers,
                totalAssessments: validAssessments.length,
                riskDistribution
            };
        }
        catch (error) {
            this.logger.error('Failed to get risk statistics', error.stack);
            return {
                averageRiskScore: 0,
                highRiskUsers: 0,
                totalAssessments: 0,
                riskDistribution: {}
            };
        }
    }
};
exports.RiskAssessmentService = RiskAssessmentService;
exports.RiskAssessmentService = RiskAssessmentService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        redis_service_1.RedisService,
        config_1.ConfigService,
        logger_service_1.LoggerService])
], RiskAssessmentService);
//# sourceMappingURL=risk-assessment.service.js.map