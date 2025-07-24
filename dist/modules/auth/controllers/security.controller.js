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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecurityController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const logger_service_1 = require("../../../shared/logger/logger.service");
const security_service_1 = require("../services/security.service");
const device_service_1 = require("../services/device.service");
const mfa_service_1 = require("../services/mfa.service");
const dto_1 = require("../dto");
const jwt_auth_guard_1 = require("../guards/jwt-auth.guard");
const decorators_1 = require("../decorators");
const decorators_2 = require("../decorators");
let SecurityController = class SecurityController {
    securityService;
    deviceService;
    mfaService;
    logger;
    constructor(securityService, deviceService, mfaService, loggerService) {
        this.securityService = securityService;
        this.deviceService = deviceService;
        this.mfaService = mfaService;
        this.logger = loggerService.createChildLogger('SecurityController');
    }
    async getSecurityEvents(query, userId) {
        const operationId = this.logger.startOperation('GET /auth/security-events', {
            userId,
            limit: query.limit,
            eventType: query.eventType,
        });
        try {
            const events = await this.securityService.getSecurityEvents(userId, query.limit || 20);
            let filteredEvents = events;
            if (query.eventType) {
                filteredEvents = events.filter(e => e.type === query.eventType);
            }
            if (query.fromDate) {
                const fromDate = new Date(query.fromDate);
                filteredEvents = filteredEvents.filter(e => e.createdAt >= fromDate);
            }
            if (query.toDate) {
                const toDate = new Date(query.toDate);
                filteredEvents = filteredEvents.filter(e => e.createdAt <= toDate);
            }
            const offset = query.offset || 0;
            const limit = query.limit || 20;
            const paginatedEvents = filteredEvents.slice(offset, offset + limit);
            this.logger.endOperation(operationId, 'success', true);
            return {
                success: true,
                data: {
                    events: paginatedEvents.map(event => ({
                        id: event.id,
                        type: event.type,
                        description: event.description,
                        ipAddress: event.ipAddress,
                        userAgent: event.userAgent,
                        location: event.location || 'Inconnue',
                        riskScore: event.riskScore,
                        createdAt: event.createdAt.toISOString(),
                        resolved: event.resolved,
                        metadata: event.metadata,
                    })),
                    pagination: {
                        total: filteredEvents.length,
                        limit,
                        offset,
                        hasMore: (offset + limit) < filteredEvents.length,
                    },
                },
            };
        }
        catch (error) {
            this.logger.endOperation(operationId, 'error', error.message);
            throw error;
        }
    }
    async verifyDevice(verifyDeviceDto, userId, deviceFingerprint, clientInfo) {
        const operationId = this.logger.startOperation('POST /auth/verify-device', {
            userId,
            deviceFingerprint: deviceFingerprint?.substring(0, 8) + '...',
        });
        try {
            const isValidCode = this.verifyDeviceCode(userId, verifyDeviceDto.verificationCode);
            if (!isValidCode) {
                this.logger.endOperation(operationId, 'invalid_code', false);
                throw new Error('Code de vérification invalide');
            }
            if (verifyDeviceDto.trustDevice && deviceFingerprint) {
                await this.deviceService.trustDevice(userId, {
                    deviceFingerprint,
                    userAgent: clientInfo.userAgent,
                    ipAddress: clientInfo.ip,
                    isMobile: this.isMobile(clientInfo.userAgent),
                });
            }
            const deviceId = `device_${Date.now()}`;
            const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
            this.logger.endOperation(operationId, 'success', true);
            return {
                success: true,
                data: {
                    deviceTrusted: !!verifyDeviceDto.trustDevice,
                    deviceId,
                    expiresAt,
                },
            };
        }
        catch (error) {
            this.logger.endOperation(operationId, 'error', error.message);
            throw error;
        }
    }
    async getTrustedDevices(userId) {
        const operationId = this.logger.startOperation('GET /auth/trusted-devices', {
            userId,
        });
        try {
            const deviceReport = await this.deviceService.getUserDeviceReport(userId);
            this.logger.endOperation(operationId, 'success', true);
            return {
                success: true,
                data: {
                    devices: deviceReport.recentDevices.map(device => ({
                        deviceFingerprint: device.device_fingerprint,
                        userAgent: device.user_agent,
                        ipAddress: device.ip_address,
                        lastUsed: device.created_at,
                        location: this.formatLocation(device.geolocation),
                        trusted: true,
                    })),
                    total: deviceReport.recentDevices.length,
                    securityScore: deviceReport.securityScore,
                },
            };
        }
        catch (error) {
            this.logger.endOperation(operationId, 'error', error.message);
            throw error;
        }
    }
    async revokeTrustedDevice(deviceId, userId) {
        const operationId = this.logger.startOperation('DELETE /auth/trusted-devices/:deviceId', {
            userId,
            deviceId: deviceId.substring(0, 8) + '...',
        });
        try {
            const revoked = await this.deviceService.revokeDeviceTrust(userId, deviceId);
            this.logger.endOperation(operationId, 'success', true);
            return {
                success: true,
                data: {
                    deviceRevoked: revoked,
                    sessionsTerminated: revoked ? 1 : 0,
                },
            };
        }
        catch (error) {
            this.logger.endOperation(operationId, 'error', error.message);
            throw error;
        }
    }
    async assessCurrentRisk(userId, deviceFingerprint, clientInfo) {
        const operationId = this.logger.startOperation('POST /auth/risk-assessment', {
            userId,
        });
        try {
            const deviceInfo = {
                deviceFingerprint,
                userAgent: clientInfo.userAgent,
                ipAddress: clientInfo.ip,
                isMobile: this.isMobile(clientInfo.userAgent),
            };
            const riskAssessment = await this.securityService.assessRisk(userId, deviceInfo);
            this.logger.endOperation(operationId, 'success', true);
            return {
                success: true,
                data: {
                    score: riskAssessment.score,
                    factors: riskAssessment.factors,
                    recommendation: riskAssessment.recommendation,
                    requiresMfa: riskAssessment.requiresMfa,
                    details: {
                        geolocation: {
                            country: 'TN',
                            city: 'Tunis',
                            suspicious: false,
                        },
                        device: {
                            fingerprint: deviceFingerprint || 'unknown',
                            trusted: await this.deviceService.isDeviceTrusted(userId, deviceFingerprint || ''),
                            lastSeen: new Date().toISOString(),
                        },
                        behavior: {
                            loginPattern: 'normal',
                            velocityScore: 0,
                        },
                    },
                },
            };
        }
        catch (error) {
            this.logger.endOperation(operationId, 'error', error.message);
            throw error;
        }
    }
    async getSecuritySummary(user, userId) {
        const operationId = this.logger.startOperation('GET /auth/security-summary', {
            userId,
        });
        try {
            const [deviceReport, recentEvents, availableMfaProviders] = await Promise.all([
                this.deviceService.getUserDeviceReport(userId),
                this.securityService.getSecurityEvents(userId, 10),
                this.mfaService?.getAvailableProviders(userId) || Promise.resolve([])
            ]);
            const securityScore = this.calculateSecurityScore({
                mfaEnabled: availableMfaProviders.length > 0,
                trustedDevices: deviceReport.trustedDevices,
                activeSessions: deviceReport.activeSessions,
                emailVerified: !!user.emailVerified,
                phoneVerified: !!user.phoneVerified,
                recentSuspiciousEvents: recentEvents.filter(e => e.riskScore > 70).length,
            });
            const recommendations = this.generateSecurityRecommendations({
                mfaEnabled: availableMfaProviders.length > 0,
                emailVerified: !!user.emailVerified,
                phoneVerified: !!user.phoneVerified,
                trustedDevices: deviceReport.trustedDevices,
            });
            this.logger.endOperation(operationId, 'success', true);
            return {
                success: true,
                data: {
                    securityScore,
                    mfaEnabled: availableMfaProviders.length > 0,
                    mfaProviders: availableMfaProviders,
                    emailVerified: !!user.emailVerified,
                    phoneVerified: !!user.phoneVerified,
                    trustedDevices: deviceReport.trustedDevices,
                    activeSessions: deviceReport.activeSessions,
                    recentEvents: recentEvents.length,
                    recommendations,
                    lastSecurityUpdate: user.updatedAt,
                },
            };
        }
        catch (error) {
            this.logger.endOperation(operationId, 'error', error.message);
            throw error;
        }
    }
    verifyDeviceCode(userId, code) {
        return /^\d{6}$/.test(code);
    }
    isMobile(userAgent) {
        return /Mobile|Android|iPhone|iPad|iPod/i.test(userAgent);
    }
    formatLocation(geolocation) {
        if (!geolocation)
            return 'Localisation inconnue';
        const parts = [];
        if (geolocation.city)
            parts.push(geolocation.city);
        if (geolocation.country)
            parts.push(geolocation.country);
        return parts.length > 0 ? parts.join(', ') : 'Localisation inconnue';
    }
    calculateSecurityScore(factors) {
        let score = 40;
        if (factors.mfaEnabled)
            score += 25;
        if (factors.emailVerified)
            score += 10;
        if (factors.phoneVerified)
            score += 10;
        if (factors.trustedDevices > 0)
            score += 10;
        if (factors.activeSessions > 5)
            score -= 5;
        if (factors.recentSuspiciousEvents > 0)
            score -= factors.recentSuspiciousEvents * 5;
        return Math.max(0, Math.min(100, score));
    }
    generateSecurityRecommendations(factors) {
        const recommendations = [];
        if (!factors.mfaEnabled) {
            recommendations.push('Activez l\'authentification à deux facteurs');
        }
        if (!factors.emailVerified) {
            recommendations.push('Vérifiez votre adresse email');
        }
        if (!factors.phoneVerified) {
            recommendations.push('Vérifiez votre numéro de téléphone');
        }
        if (factors.trustedDevices === 0) {
            recommendations.push('Marquez vos appareils personnels comme fiables');
        }
        if (factors.trustedDevices > 5) {
            recommendations.push('Révisez la liste de vos appareils de confiance');
        }
        return recommendations;
    }
};
exports.SecurityController = SecurityController;
__decorate([
    (0, common_1.Get)('security-events'),
    (0, decorators_2.AuditAccess)('security_events_access'),
    (0, swagger_1.ApiOperation)({
        summary: 'Événements de sécurité',
        description: 'Récupère historique des événements de sécurité'
    }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number }),
    (0, swagger_1.ApiQuery)({ name: 'offset', required: false, type: Number }),
    (0, swagger_1.ApiQuery)({ name: 'eventType', required: false, enum: ['LOGIN_SUCCESS', 'LOGIN_FAILED', 'LOGOUT', 'PASSWORD_CHANGE', 'MFA_SETUP', 'SUSPICIOUS_ACTIVITY'] }),
    (0, swagger_1.ApiQuery)({ name: 'fromDate', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'toDate', required: false, type: String }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Événements récupérés',
        type: dto_1.SecurityEventsResponseDto
    }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, decorators_1.CurrentUserId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.SecurityEventsQueryDto, String]),
    __metadata("design:returntype", Promise)
], SecurityController.prototype, "getSecurityEvents", null);
__decorate([
    (0, common_1.Post)('verify-device'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, decorators_2.AuditSecurity)('device_verification'),
    (0, decorators_2.RateLimit)({ limit: 5, windowMs: 300000 }),
    (0, swagger_1.ApiOperation)({
        summary: 'Vérification nouveau device',
        description: 'Vérifie et marque device comme fiable'
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Device vérifié',
        type: dto_1.TrustedDeviceResponseDto
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Code de vérification invalide'
    }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, decorators_1.CurrentUserId)()),
    __param(2, (0, decorators_1.DeviceFingerprint)()),
    __param(3, (0, decorators_1.ClientInfo)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.TrustedDeviceDto, String, String, Object]),
    __metadata("design:returntype", Promise)
], SecurityController.prototype, "verifyDevice", null);
__decorate([
    (0, common_1.Get)('trusted-devices'),
    (0, decorators_2.AuditAccess)('trusted_devices_access'),
    (0, swagger_1.ApiOperation)({
        summary: 'Devices de confiance',
        description: 'Liste des appareils marqués comme fiables'
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Liste devices récupérée',
        schema: {
            example: {
                success: true,
                data: {
                    devices: [
                        {
                            deviceId: 'device_123',
                            name: 'Mon iPhone',
                            lastUsed: '2024-01-15T10:30:00Z',
                            trusted: true,
                            location: 'Tunis, Tunisie'
                        }
                    ],
                    total: 1
                }
            }
        }
    }),
    __param(0, (0, decorators_1.CurrentUserId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SecurityController.prototype, "getTrustedDevices", null);
__decorate([
    (0, common_1.Delete)('trusted-devices/:deviceId'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, decorators_2.AuditSecurity)('device_trust_revoked'),
    (0, swagger_1.ApiOperation)({
        summary: 'Révoquer confiance device',
        description: 'Supprime device de la liste des appareils fiables'
    }),
    (0, swagger_1.ApiParam)({ name: 'deviceId', description: 'ID ou fingerprint du device' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Confiance révoquée',
        schema: {
            example: {
                success: true,
                data: {
                    deviceRevoked: true,
                    sessionsTerminated: 2
                }
            }
        }
    }),
    __param(0, (0, common_1.Param)('deviceId')),
    __param(1, (0, decorators_1.CurrentUserId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], SecurityController.prototype, "revokeTrustedDevice", null);
__decorate([
    (0, common_1.Post)('risk-assessment'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, decorators_2.AuditAccess)('risk_assessment'),
    (0, decorators_2.RateLimit)({ limit: 10, windowMs: 300000 }),
    (0, swagger_1.ApiOperation)({
        summary: 'Évaluation de risque',
        description: 'Analyse le niveau de risque de la session courante'
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Évaluation effectuée',
        schema: {
            type: 'object',
            properties: {
                success: { type: 'boolean' },
                data: { $ref: '#/components/schemas/RiskAssessmentDto' }
            }
        }
    }),
    __param(0, (0, decorators_1.CurrentUserId)()),
    __param(1, (0, decorators_1.DeviceFingerprint)()),
    __param(2, (0, decorators_1.ClientInfo)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], SecurityController.prototype, "assessCurrentRisk", null);
__decorate([
    (0, common_1.Get)('security-summary'),
    (0, decorators_2.AuditAccess)('security_summary_access'),
    (0, swagger_1.ApiOperation)({
        summary: 'Résumé sécurité',
        description: 'Vue d\'ensemble de la sécurité du compte'
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Résumé récupéré',
        schema: {
            example: {
                success: true,
                data: {
                    securityScore: 85,
                    mfaEnabled: true,
                    trustedDevices: 3,
                    activeSessions: 2,
                    recentEvents: 5,
                    recommendations: ['Enable backup codes', 'Review trusted devices']
                }
            }
        }
    }),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, decorators_1.CurrentUserId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], SecurityController.prototype, "getSecuritySummary", null);
exports.SecurityController = SecurityController = __decorate([
    (0, swagger_1.ApiTags)('Security & Audit'),
    (0, common_1.Controller)('auth'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true
    })),
    __metadata("design:paramtypes", [security_service_1.SecurityService,
        device_service_1.DeviceService,
        mfa_service_1.MfaService,
        logger_service_1.LoggerService])
], SecurityController);
//# sourceMappingURL=security.controller.js.map