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
const jwt_auth_guard_1 = require("../guards/jwt-auth.guard");
const current_user_decorator_1 = require("../decorators/current-user.decorator");
const mfa_service_1 = require("../services/mfa.service");
const logger_service_1 = require("../../../shared/logger/logger.service");
const mfa_setup_dto_1 = require("../dto/mfa/mfa-setup.dto");
const mfa_verify_dto_1 = require("../dto/mfa/mfa-verify.dto");
const mfa_management_dto_1 = require("../dto/mfa/mfa-management.dto");
let MfaController = class MfaController {
    mfaService;
    logger;
    constructor(mfaService, loggerService) {
        this.mfaService = mfaService;
        this.logger = loggerService.createChildLogger('MfaController');
    }
    async getAvailableProviders(user) {
        const operationId = this.logger.startOperation('GET /auth/mfa/providers', {
            userId: user.id
        });
        try {
            const availableProviders = await this.mfaService.getAvailableProviders(user.id);
            const configuredMethods = await this.mfaService.getConfiguredMethods(user.id);
            const providersInfo = availableProviders.map(provider => ({
                provider,
                isConfigured: configuredMethods.includes(provider),
                name: this.getProviderDisplayName(provider),
                description: this.getProviderDescription(provider),
                setupTime: this.getProviderSetupTime(provider),
                isRecommended: this.isProviderRecommended(provider, availableProviders)
            }));
            this.logger.endOperation('getAvailableProviders', operationId, true);
            return {
                success: true,
                data: {
                    providers: providersInfo,
                    recommendedProvider: this.getRecommendedProvider(availableProviders),
                    hasMfaConfigured: configuredMethods.length > 0,
                    methodsInfo: this.generateMethodsInfo(availableProviders, user)
                }
            };
        }
        catch (error) {
            this.logger.endOperation('getAvailableProviders', operationId, false);
            this.logger.error('Failed to get providers', error.stack, 'MfaController.getAvailableProviders', JSON.stringify({
                userId: user.id,
                error: error.message
            }));
            throw error;
        }
    }
    async getMfaStatus(user) {
        const operationId = this.logger.startOperation('GET /auth/mfa/status', {
            userId: user.id
        });
        try {
            const configuredMethods = await this.mfaService.getConfiguredMethods(user.id);
            const trustedDevicesCount = await this.mfaService.getTrustedDevicesCount(user.id);
            const backupCodesCount = await this.mfaService.getBackupCodesCount(user.id);
            const lastUsedDate = await this.mfaService.getLastUsedDate(user.id);
            this.logger.endOperation('getMfaStatus', operationId, true);
            return {
                success: true,
                data: {
                    isEnabled: configuredMethods.length > 0,
                    configuredMethods,
                    primaryMethod: await this.mfaService.getPrimaryMethod(user.id),
                    trustedDevicesCount,
                    backupCodesRemaining: backupCodesCount,
                    lastUsed: lastUsedDate?.toISOString(),
                    securityScore: this.calculateSecurityScore(configuredMethods, trustedDevicesCount)
                }
            };
        }
        catch (error) {
            this.logger.endOperation('getMfaStatus', operationId, false);
            throw error;
        }
    }
    async setupMfa(mfaSetupDto, user) {
        const operationId = this.logger.startOperation('POST /auth/mfa/setup', {
            userId: user.id,
            provider: mfaSetupDto.provider
        });
        try {
            const setup = await this.mfaService.setupMfa(user.id, mfaSetupDto.provider);
            this.logger.endOperation('setupMfa', operationId, true);
            return {
                success: true,
                data: {
                    provider: setup.provider,
                    qrCode: setup.qrCode,
                    secret: setup.secret,
                    backupCodes: setup.backupCodes,
                    setupInstructions: this.getSetupInstructions(setup.provider)
                }
            };
        }
        catch (error) {
            this.logger.endOperation('setupMfa', operationId, false);
            this.logger.error('MFA setup failed', error.stack, 'MfaController.setupMfa', JSON.stringify({
                userId: user.id,
                provider: mfaSetupDto.provider,
                error: error.message
            }));
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
                throw new common_1.BadRequestException('Code MFA invalide');
            }
            const tokens = await this.generatePostMfaTokens(user.id);
            const session = await this.getSessionInfo(user.id);
            this.logger.endOperation('verifyMfa', operationId, true);
            return {
                success: true,
                data: {
                    user,
                    tokens,
                    session,
                    trustedDevice: mfaVerifyDto.trustDevice ? {
                        deviceId: 'generated-device-id',
                        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
                    } : undefined
                }
            };
        }
        catch (error) {
            this.logger.endOperation('verifyMfa', operationId, false);
            throw error;
        }
    }
    async toggleMfa(provider, toggleDto, user) {
        const operationId = this.logger.startOperation('PUT /auth/mfa/:provider/toggle', {
            userId: user.id,
            provider,
            enable: toggleDto.enable
        });
        try {
            if (toggleDto.enable) {
                await this.mfaService.enableMfa(user.id, provider);
            }
            else {
                await this.mfaService.disableMfa(user.id, provider);
            }
            this.logger.endOperation('toggleMfa', operationId, true);
            return {
                success: true,
                message: `MFA ${provider} ${toggleDto.enable ? 'activé' : 'désactivé'} avec succès`,
                data: {
                    provider,
                    isEnabled: toggleDto.enable
                }
            };
        }
        catch (error) {
            this.logger.endOperation('toggleMfa', operationId, false);
            throw error;
        }
    }
    async deleteMfa(provider, disableDto, user) {
        const operationId = this.logger.startOperation('DELETE /auth/mfa/:provider', {
            userId: user.id,
            provider
        });
        try {
            if (disableDto.confirmationCode) {
                const isValid = await this.mfaService.verifyMfa({
                    challengeToken: disableDto.challengeToken,
                    method: provider,
                    code: disableDto.confirmationCode,
                    trustDevice: false
                });
                if (!isValid) {
                    throw new common_1.BadRequestException('Code de confirmation invalide');
                }
            }
            const success = await this.mfaService.disableMfa(user.id, provider);
            if (!success) {
                throw new common_1.NotFoundException('Méthode MFA non configurée');
            }
            this.logger.endOperation('deleteMfa', operationId, true);
            return {
                success: true,
                message: `Méthode MFA ${provider} supprimée avec succès`,
                data: {
                    provider,
                    deletedAt: new Date().toISOString()
                }
            };
        }
        catch (error) {
            this.logger.endOperation('deleteMfa', operationId, false);
            throw error;
        }
    }
    async regenerateBackupCodes(regenerateDto, user) {
        const operationId = this.logger.startOperation('POST /auth/mfa/backup-codes/regenerate', {
            userId: user.id
        });
        try {
            const isValid = await this.mfaService.verifyMfa({
                challengeToken: regenerateDto.challengeToken,
                method: regenerateDto.verificationMethod,
                code: regenerateDto.verificationCode,
                trustDevice: false
            });
            if (!isValid) {
                throw new common_1.BadRequestException('Vérification MFA requise pour régénérer les codes');
            }
            const newCodes = await this.mfaService.regenerateBackupCodes(user.id);
            this.logger.endOperation('regenerateBackupCodes', operationId, true);
            return {
                success: true,
                message: 'Codes de récupération régénérés avec succès',
                data: {
                    backupCodes: newCodes,
                    generatedAt: new Date().toISOString(),
                    warning: 'Conservez ces codes en lieu sûr. Les anciens codes ne sont plus valides.'
                }
            };
        }
        catch (error) {
            this.logger.endOperation('regenerateBackupCodes', operationId, false);
            throw error;
        }
    }
    async getTrustedDevices(user) {
        const operationId = this.logger.startOperation('GET /auth/mfa/trusted-devices', {
            userId: user.id
        });
        try {
            const devices = await this.mfaService.getTrustedDevices(user.id);
            this.logger.endOperation('getTrustedDevices', operationId, true);
            return {
                success: true,
                data: {
                    devices: devices.map(device => ({
                        id: device.id,
                        deviceName: device.deviceName || 'Appareil inconnu',
                        trustedAt: device.trustedAt,
                        lastSeenAt: device.lastSeenAt,
                        expiresAt: device.expiresAt,
                        ipAddress: device.ipAddress,
                        isCurrent: device.deviceFingerprint === this.getCurrentDeviceFingerprint(),
                        isActive: device.isActive
                    })),
                    totalCount: devices.length
                }
            };
        }
        catch (error) {
            this.logger.endOperation('getTrustedDevices', operationId, false);
            throw error;
        }
    }
    async removeTrustedDevice(deviceId, user) {
        const operationId = this.logger.startOperation('DELETE /auth/mfa/trusted-devices/:deviceId', {
            userId: user.id,
            deviceId
        });
        try {
            const success = await this.mfaService.removeTrustedDevice(user.id, deviceId);
            if (!success) {
                throw new common_1.NotFoundException('Appareil de confiance non trouvé');
            }
            this.logger.endOperation('removeTrustedDevice', operationId, true);
            return {
                success: true,
                message: 'Appareil de confiance supprimé avec succès',
                data: {
                    deviceId,
                    removedAt: new Date().toISOString()
                }
            };
        }
        catch (error) {
            this.logger.endOperation('removeTrustedDevice', operationId, false);
            throw error;
        }
    }
    getProviderDisplayName(provider) {
        const names = {
            'SMS_OTP': 'SMS',
            'EMAIL_OTP': 'Email',
            'TOTP_APP': 'Authenticator App',
            'BACKUP_CODE': 'Codes de récupération'
        };
        return names[provider] || provider;
    }
    getProviderDescription(provider) {
        const descriptions = {
            'SMS_OTP': 'Recevez des codes à 6 chiffres par SMS',
            'EMAIL_OTP': 'Recevez des codes à 6 chiffres par email',
            'TOTP_APP': 'Utilisez Google Authenticator, Authy ou similaire',
            'BACKUP_CODE': 'Codes à usage unique pour accès d\'urgence'
        };
        return descriptions[provider] || '';
    }
    getProviderSetupTime(provider) {
        const times = {
            'SMS_OTP': 2,
            'EMAIL_OTP': 1,
            'TOTP_APP': 5,
            'BACKUP_CODE': 1
        };
        return times[provider] || 2;
    }
    isProviderRecommended(provider, available) {
        const recommended = this.getRecommendedProvider(available);
        return provider === recommended;
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
    getSetupInstructions(provider) {
        const instructions = {
            'SMS_OTP': 'Vous recevrez des codes par SMS lors des connexions.',
            'EMAIL_OTP': 'Vous recevrez des codes par email lors des connexions.',
            'TOTP_APP': 'Scannez le QR code avec votre application d\'authentification.',
            'BACKUP_CODE': 'Conservez ces codes en lieu sûr pour accéder à votre compte.'
        };
        return instructions[provider] || 'Configuration MFA terminée avec succès.';
    }
    calculateSecurityScore(methods, trustedDevices) {
        let score = 0;
        score += methods.length * 25;
        if (methods.includes('TOTP_APP'))
            score += 20;
        if (methods.includes('SMS_OTP'))
            score += 15;
        if (methods.includes('BACKUP_CODE'))
            score += 10;
        if (trustedDevices > 3)
            score -= 10;
        return Math.min(100, Math.max(0, score));
    }
    generateMethodsInfo(providers, user) {
        const info = {};
        providers.forEach(provider => {
            switch (provider) {
                case 'SMS_OTP':
                    info[provider] = {
                        masked_phone: this.maskPhone(user.phone),
                        estimated_delivery: '30 seconds',
                        cost: 'Gratuit',
                    };
                    break;
                case 'EMAIL_OTP':
                    info[provider] = {
                        masked_email: this.maskEmail(user.email),
                        estimated_delivery: '1 minute',
                        cost: 'Gratuit',
                    };
                    break;
                case 'TOTP_APP':
                    info[provider] = {
                        app_name: 'Google Authenticator',
                        setup_required: true,
                        offline_capable: true,
                    };
                    break;
                case 'BACKUP_CODE':
                    info[provider] = {
                        codes_remaining: 0,
                        single_use: true,
                        recommendation: 'À utiliser uniquement en cas d\'urgence',
                    };
                    break;
            }
        });
        return info;
    }
    maskPhone(phone) {
        if (!phone)
            return '+216***45678';
        if (phone.length < 8)
            return phone;
        return phone.slice(0, 4) + '***' + phone.slice(-4);
    }
    maskEmail(email) {
        const [local, domain] = email.split('@');
        const maskedLocal = local.length > 2
            ? local[0] + '***' + local.slice(-1)
            : local;
        return `${maskedLocal}@${domain}`;
    }
    async generatePostMfaTokens(userId) {
        return null;
    }
    async getSessionInfo(userId) {
        return null;
    }
    getCurrentDeviceFingerprint() {
        return '';
    }
};
exports.MfaController = MfaController;
__decorate([
    (0, common_1.Get)('providers'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Providers MFA disponibles',
        description: 'Retourne la liste des méthodes MFA supportées et leur statut'
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Providers MFA avec détails',
        type: mfa_management_dto_1.MfaProvidersResponseDto
    }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MfaController.prototype, "getAvailableProviders", null);
__decorate([
    (0, common_1.Get)('status'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Statut MFA utilisateur',
        description: 'Retourne le statut détaillé de la configuration MFA'
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Statut MFA détaillé',
        type: mfa_management_dto_1.MfaStatusResponseDto
    }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MfaController.prototype, "getMfaStatus", null);
__decorate([
    (0, common_1.Post)('setup'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Configuration MFA',
        description: 'Démarre la configuration d\'une méthode MFA'
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Configuration MFA initiée',
        type: mfa_setup_dto_1.MfaSetupResponseDto
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Données invalides'
    }),
    (0, swagger_1.ApiResponse)({
        status: 409,
        description: 'Méthode déjà configurée'
    }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [mfa_setup_dto_1.MfaSetupDto, Object]),
    __metadata("design:returntype", Promise)
], MfaController.prototype, "setupMfa", null);
__decorate([
    (0, common_1.Post)('verify'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Vérification MFA',
        description: 'Vérifie un code d\'authentification multifacteur'
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Code MFA valide',
        type: mfa_verify_dto_1.MfaVerifyResponseDto
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
    __metadata("design:paramtypes", [mfa_verify_dto_1.MfaVerifyDto, Object]),
    __metadata("design:returntype", Promise)
], MfaController.prototype, "verifyMfa", null);
__decorate([
    (0, common_1.Put)(':provider/toggle'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiParam)({
        name: 'provider',
        enum: ['SMS_OTP', 'EMAIL_OTP', 'TOTP_APP', 'BACKUP_CODE'],
        description: 'Provider MFA à modifier'
    }),
    (0, swagger_1.ApiOperation)({
        summary: 'Activer/Désactiver MFA',
        description: 'Bascule l\'état d\'activation d\'une méthode MFA'
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Méthode MFA modifiée'
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'Méthode non configurée'
    }),
    __param(0, (0, common_1.Param)('provider')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, mfa_management_dto_1.MfaToggleDto, Object]),
    __metadata("design:returntype", Promise)
], MfaController.prototype, "toggleMfa", null);
__decorate([
    (0, common_1.Delete)(':provider'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiParam)({
        name: 'provider',
        enum: ['SMS_OTP', 'EMAIL_OTP', 'TOTP_APP', 'BACKUP_CODE'],
        description: 'Provider MFA à supprimer'
    }),
    (0, swagger_1.ApiOperation)({
        summary: 'Supprimer méthode MFA',
        description: 'Supprime complètement une méthode MFA et ses données'
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Méthode MFA supprimée'
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'Méthode non trouvée'
    }),
    __param(0, (0, common_1.Param)('provider')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, mfa_management_dto_1.MfaDisableDto, Object]),
    __metadata("design:returntype", Promise)
], MfaController.prototype, "deleteMfa", null);
__decorate([
    (0, common_1.Post)('backup-codes/regenerate'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Régénérer codes de récupération',
        description: 'Génère de nouveaux codes de récupération (invalide les anciens)'
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Nouveaux codes générés'
    }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [mfa_management_dto_1.MfaRegenerateBackupCodesDto, Object]),
    __metadata("design:returntype", Promise)
], MfaController.prototype, "regenerateBackupCodes", null);
__decorate([
    (0, common_1.Get)('trusted-devices'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Appareils de confiance',
        description: 'Liste des appareils marqués comme fiables'
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Liste des appareils de confiance'
    }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MfaController.prototype, "getTrustedDevices", null);
__decorate([
    (0, common_1.Delete)('trusted-devices/:deviceId'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiParam)({
        name: 'deviceId',
        description: 'ID de l\'appareil à supprimer'
    }),
    (0, swagger_1.ApiOperation)({
        summary: 'Supprimer appareil de confiance',
        description: 'Révoque la confiance d\'un appareil'
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Appareil supprimé'
    }),
    __param(0, (0, common_1.Param)('deviceId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], MfaController.prototype, "removeTrustedDevice", null);
exports.MfaController = MfaController = __decorate([
    (0, swagger_1.ApiTags)('Auth - Multi-Factor Authentication'),
    (0, common_1.Controller)('auth/mfa'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [mfa_service_1.MfaService,
        logger_service_1.LoggerService])
], MfaController);
//# sourceMappingURL=mfa.controller.js.map