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
exports.MfaController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const logger_service_1 = require("../../../shared/logger/logger.service");
const mfa_service_1 = require("../services/mfa.service");
const dto_1 = require("../dto");
const jwt_auth_guard_1 = require("../guards/jwt-auth.guard");
const current_user_decorator_1 = require("../decorators/current-user.decorator");
const decorators_1 = require("../decorators");
let MfaController = class MfaController {
    mfaService;
    logger;
    constructor(mfaService, loggerService) {
        this.mfaService = mfaService;
        this.logger = loggerService.createChildLogger('MfaController');
    }
    async getAvailableProviders(userId) {
        const operationId = this.logger.startOperation('GET /auth/mfa/providers', {
            userId,
        });
        try {
            const availableProviders = await this.mfaService.getAvailableProviders(userId);
            const configuredProviders = [];
            this.logger.endOperation('getAvailableProviders', operationId, true);
            return {
                success: true,
                data: {
                    available: availableProviders,
                    configured: configuredProviders,
                    recommended: this.getRecommendedProvider(availableProviders),
                },
            };
        }
        catch (error) {
            this.logger.endOperation('getAvailableProviders', operationId, false, undefined, { error: error.message });
            throw error;
        }
    }
    async setupMfa(mfaSetupDto, userId) {
        const operationId = this.logger.startOperation('POST /auth/mfa/setup', {
            userId,
            provider: mfaSetupDto.provider,
        });
        try {
            const setup = await this.mfaService.setupMfa(userId, mfaSetupDto.provider);
            this.logger.endOperation('setupMfa', operationId, true);
            return {
                success: true,
                data: {
                    provider: setup.provider,
                    qrCode: setup.qrCode,
                    secret: setup.secret,
                    backupCodes: setup.backupCodes,
                    setupInstructions: this.generateSetupInstructions(setup.provider),
                },
            };
        }
        catch (error) {
            this.logger.endOperation('setupMfa', operationId, false, undefined, { error: error.message });
            throw error;
        }
    }
    async verifyMfa(mfaVerifyDto, user) {
        const operationId = this.logger.startOperation('POST /auth/mfa/verify', {
            userId: user.id,
            method: mfaVerifyDto.method,
            trustDevice: mfaVerifyDto.trustDevice,
        });
        try {
            const isValid = await this.mfaService.verifyMfa(mfaVerifyDto);
            if (!isValid) {
                this.logger.endOperation('verifyMfa', operationId, false, undefined, { reason: 'invalid_code' });
                throw new Error('Code MFA invalide');
            }
            const tokens = null;
            this.logger.endOperation('verifyMfa', operationId, true);
            return {
                success: true,
                data: {
                    user,
                    tokens,
                    session: null,
                    trustedDevice: mfaVerifyDto.trustDevice ? {
                        deviceId: 'device_' + Date.now(),
                        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                    } : undefined,
                },
            };
        }
        catch (error) {
            this.logger.endOperation('verifyMfa', operationId, false, undefined, { error: error.message });
            throw error;
        }
    }
    async disableMfa(provider, userId) {
        const operationId = this.logger.startOperation('DELETE /auth/mfa/disable', {
            userId,
            provider,
        });
        try {
            const disabled = await this.mfaService.disableMfa(userId, provider);
            this.logger.endOperation('disableMfa', operationId, true);
            return {
                success: true,
                data: {
                    disabled,
                    provider,
                    message: `MFA ${provider} désactivé avec succès`,
                },
            };
        }
        catch (error) {
            this.logger.endOperation('disableMfa', operationId, false, undefined, { error: error.message });
            throw error;
        }
    }
    async getMfaStatus(userId) {
        const operationId = this.logger.startOperation('GET /auth/mfa/status', {
            userId,
        });
        try {
            const configuredProviders = [];
            const enabled = configuredProviders.length > 0;
            const requiredByPolicy = await this.mfaService.requiresMfa(userId, 50);
            this.logger.endOperation('getMfaStatus', operationId, true);
            return {
                success: true,
                data: {
                    enabled,
                    providers: configuredProviders,
                    requiredByPolicy,
                    lastUsed: undefined,
                },
            };
        }
        catch (error) {
            this.logger.endOperation('getMfaStatus', operationId, false, undefined, { error: error.message });
            throw error;
        }
    }
    async generateMfaChallenge(userId) {
        const operationId = this.logger.startOperation('POST /auth/mfa/challenge', {
            userId,
        });
        try {
            const availableProviders = await this.mfaService.getAvailableProviders(userId);
            const challenge = {
                methods: availableProviders,
                challengeToken: `mfa_challenge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                expiresIn: 300,
                instructions: 'Veuillez choisir une méthode de vérification et saisir le code reçu',
                methodsInfo: this.generateMethodsInfo(availableProviders),
            };
            this.logger.endOperation('generateMfaChallenge', operationId, true);
            return {
                success: true,
                data: challenge,
            };
        }
        catch (error) {
            this.logger.endOperation('generateMfaChallenge', operationId, false, undefined, { error: error.message });
            throw error;
        }
    }
    generateSetupInstructions(provider) {
        const instructions = {
            SMS_OTP: 'SMS configuré avec succès. Vous recevrez des codes par SMS lors des connexions.',
            EMAIL_OTP: 'Email OTP configuré. Vous recevrez des codes par email lors des connexions.',
            TOTP_APP: 'Scannez le QR code avec votre application d\'authentification (Google Authenticator, Authy, etc.).',
            BACKUP_CODE: 'Codes de récupération générés. Conservez-les en lieu sûr pour accéder à votre compte.',
        };
        return instructions[provider] || 'Configuration MFA terminée avec succès.';
    }
    getRecommendedProvider(availableProviders) {
        const priorityOrder = ['TOTP_APP', 'SMS_OTP', 'EMAIL_OTP', 'BACKUP_CODE'];
        for (const provider of priorityOrder) {
            if (availableProviders.includes(provider)) {
                return provider;
            }
        }
        return availableProviders[0] || 'TOTP_APP';
    }
    generateMethodsInfo(providers) {
        const info = {};
        providers.forEach(provider => {
            switch (provider) {
                case 'SMS_OTP':
                    info[provider] = {
                        masked_phone: '+216***45678',
                        estimated_delivery: '30 seconds',
                        cost: 'Gratuit',
                    };
                    break;
                case 'EMAIL_OTP':
                    info[provider] = {
                        masked_email: 'u***@entrix.tn',
                        estimated_delivery: '1 minute',
                        cost: 'Gratuit',
                    };
                    break;
                case 'TOTP_APP':
                    info[provider] = {
                        app_name: 'Google Authenticator',
                        setup_required: false,
                        offline_capable: true,
                    };
                    break;
                case 'BACKUP_CODE':
                    info[provider] = {
                        codes_remaining: 8,
                        single_use: true,
                        recommendation: 'À utiliser uniquement en cas d\'urgence',
                    };
                    break;
            }
        });
        return info;
    }
};
exports.MfaController = MfaController;
__decorate([
    (0, common_1.Get)('providers'),
    (0, swagger_1.ApiOperation)({
        summary: 'Providers MFA disponibles',
        description: 'Récupère liste des méthodes MFA disponibles'
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Liste providers récupérée',
        schema: {
            example: {
                success: true,
                data: {
                    available: ['SMS_OTP', 'EMAIL_OTP', 'TOTP_APP'],
                    configured: ['EMAIL_OTP'],
                    recommended: 'TOTP_APP'
                }
            }
        }
    }),
    __param(0, (0, current_user_decorator_1.CurrentUserId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MfaController.prototype, "getAvailableProviders", null);
__decorate([
    (0, common_1.Post)('setup'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, decorators_1.AuditCritical)('mfa_setup'),
    (0, decorators_1.RateLimit)({ limit: 3, windowMs: 900000 }),
    (0, swagger_1.ApiOperation)({
        summary: 'Configuration MFA',
        description: 'Configure une méthode d\'authentification multifacteur'
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'MFA configuré',
        type: dto_1.MfaSetupResponseDto
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Provider non supporté'
    }),
    (0, swagger_1.ApiResponse)({
        status: 409,
        description: 'MFA déjà configuré pour ce provider'
    }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUserId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.MfaSetupDto, String]),
    __metadata("design:returntype", Promise)
], MfaController.prototype, "setupMfa", null);
__decorate([
    (0, common_1.Post)('verify'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, decorators_1.RateLimitMfa)(),
    (0, decorators_1.AuditSecurity)('mfa_verification'),
    (0, swagger_1.ApiOperation)({
        summary: 'Vérification MFA',
        description: 'Vérifie code d\'authentification multifacteur'
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Code MFA valide',
        type: dto_1.MfaVerifyResponseDto
    }),
    (0, swagger_1.ApiResponse)({
        status: 401,
        description: 'Code MFA invalide'
    }),
    (0, swagger_1.ApiResponse)({
        status: 428,
        description: 'Challenge MFA expiré'
    }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.MfaVerifyDto, Object]),
    __metadata("design:returntype", Promise)
], MfaController.prototype, "verifyMfa", null);
__decorate([
    (0, common_1.Delete)('disable/:provider'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, decorators_1.AuditCritical)('mfa_disable'),
    (0, swagger_1.ApiOperation)({
        summary: 'Désactiver MFA',
        description: 'Désactive une méthode MFA spécifique'
    }),
    (0, swagger_1.ApiParam)({
        name: 'provider',
        enum: ['SMS_OTP', 'EMAIL_OTP', 'TOTP_APP', 'BACKUP_CODE'],
        description: 'Provider MFA à désactiver'
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'MFA désactivé'
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'Provider non configuré'
    }),
    __param(0, (0, common_1.Param)('provider')),
    __param(1, (0, current_user_decorator_1.CurrentUserId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], MfaController.prototype, "disableMfa", null);
__decorate([
    (0, common_1.Get)('status'),
    (0, swagger_1.ApiOperation)({
        summary: 'Statut MFA utilisateur',
        description: 'Récupère le statut MFA et méthodes configurées'
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Statut MFA récupéré'
    }),
    __param(0, (0, current_user_decorator_1.CurrentUserId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MfaController.prototype, "getMfaStatus", null);
__decorate([
    (0, common_1.Post)('challenge'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, decorators_1.RateLimitMfa)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Générer challenge MFA',
        description: 'Génère un nouveau challenge MFA pour authentification'
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Challenge généré',
        type: dto_1.MfaChallengeResponseDto
    }),
    __param(0, (0, current_user_decorator_1.CurrentUserId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MfaController.prototype, "generateMfaChallenge", null);
exports.MfaController = MfaController = __decorate([
    (0, swagger_1.ApiTags)('Multi-Factor Authentication'),
    (0, common_1.Controller)('auth/mfa'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true
    })),
    __metadata("design:paramtypes", [mfa_service_1.MfaService,
        logger_service_1.LoggerService])
], MfaController);
//# sourceMappingURL=mfa.controller.js.map