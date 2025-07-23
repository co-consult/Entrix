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
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MfaController = void 0;
/ src/modules / auth / controllers / mfa.controller.ts;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const logger_service_1 = require("../../../shared/logger/logger.service");
const mfa_service_1 = require("../services/mfa.service");
const mfa_1 = require("../dto/mfa");
const jwt_auth_guard_1 = require("../guards/jwt-auth.guard");
const current_user_decorator_1 = require("../decorators/current-user.decorator");
const audit_log_decorator_1 = require("../decorators/audit-log.decorator");
const interfaces_1 = require("../interfaces");
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
            this.logger.endOperation(operationId, 'success');
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
            this.logger.endOperation(operationId, 'error', error.message);
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
            this.logger.endOperation(operationId, 'success');
            return {
                success: true,
                data: {
                    provider: setup.provider,
                    qrCode: setup.qrCode,
                    secret: setup.secret,
                    backupCodes: setup.backupCodes,
                    setupInstructions: setup.setupInstructions || 'Configuration terminée',
                },
            };
        }
        catch (error) {
            this.logger.endOperation(operationId, 'error', error.message);
            throw error;
        }
    }
    async verifyMfa(mfaVerifyDto, user) {
        const operationId = this.logger.startOperation('POST /auth/mfa/verify', {
            userId: user.id,
            method: mfaVerifyDto.method,
        });
        try {
            const isValid = await this.mfaService.verifyMfa(mfaVerifyDto);
            if (!isValid) {
                this.logger.endOperation(operationId, 'invalid_code');
                throw new Error('Code MFA invalide');
            }
            const tokens = null;
            this.logger.endOperation(operationId, 'success');
            return {
                success: true,
                data: {
                    user,
                    tokens,
                    session: null,
                    trustedDevice: mfaVerifyDto.trustDevice ? {
                        deviceId: 'device_xxx',
                        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                    } : undefined,
                },
            };
        }
        catch (error) {
            this.logger.endOperation(operationId, 'error', error.message);
            throw error;
        }
    }
    async generateMfaChallenge(userId) {
        const operationId = this.logger.startOperation('POST /auth/mfa/challenge', {
            userId,
        });
        try {
            const challengeToken = `mfa_challenge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const availableMethods = await this.mfaService.getAvailableProviders(userId);
            this.logger.endOperation(operationId, 'success');
            return {
                success: true,
                data: {
                    challengeToken,
                    availableMethods,
                    expiresIn: 300,
                },
            };
        }
        catch (error) {
            this.logger.endOperation(operationId, 'error', error.message);
            throw error;
        }
    }
    async disableMfa(provider, userId) {
        const operationId = this.logger.startOperation('DELETE /auth/mfa/:provider', {
            userId,
            provider,
        });
        try {
            const disabled = await this.mfaService.disableMfa(userId, provider);
            if (!disabled) {
                this.logger.endOperation(operationId, 'not_found');
                return {
                    success: false,
                    error: {
                        code: 'MFA_NOT_CONFIGURED',
                        message: 'MFA non configuré pour ce provider',
                    },
                };
            }
            const remainingMethods = await this.mfaService.getAvailableProviders(userId);
            this.logger.endOperation(operationId, 'success');
            return {
                success: true,
                data: {
                    provider,
                    disabled: true,
                    remainingMethods,
                },
            };
        }
        catch (error) {
            this.logger.endOperation(operationId, 'error', error.message);
            throw error;
        }
    }
    async generateBackupCodes(userId) {
        const operationId = this.logger.startOperation('POST /auth/mfa/backup-codes', {
            userId,
        });
        try {
            const setup = await this.mfaService.setupMfa(userId, 'BACKUP_CODE');
            this.logger.endOperation(operationId, 'success');
            return {
                success: true,
                data: {
                    backupCodes: setup.backupCodes || [],
                    previousCodesRevoked: true,
                    warning: 'Conservez ces codes en lieu sûr. Ils ne seront plus affichés.',
                },
            };
        }
        catch (error) {
            this.logger.endOperation(operationId, 'error', error.message);
            throw error;
        }
    }
    getRecommendedProvider(available) {
        if (available.includes('TOTP_APP'))
            return 'TOTP_APP';
        if (available.includes('SMS_OTP'))
            return 'SMS_OTP';
        if (available.includes('EMAIL_OTP'))
            return 'EMAIL_OTP';
        return null;
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
    (0, audit_log_decorator_1.AuditCritical)('mfa_setup'),
    (0, audit_log_decorator_1.RateLimit)({ limit: 3, windowMs: 900000 }),
    (0, swagger_1.ApiOperation)({
        summary: 'Configuration MFA',
        description: 'Configure une méthode d\'authentification multifacteur'
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'MFA configuré',
        type: mfa_1.MfaSetupResponseDto
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
    __metadata("design:paramtypes", [typeof (_a = typeof mfa_1.MfaSetupDto !== "undefined" && mfa_1.MfaSetupDto) === "function" ? _a : Object, String]),
    __metadata("design:returntype", Promise)
], MfaController.prototype, "setupMfa", null);
__decorate([
    (0, common_1.Post)('verify'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, audit_log_decorator_1.RateLimitMfa)(),
    (0, audit_log_decorator_1.AuditSecurity)('mfa_verification'),
    (0, swagger_1.ApiOperation)({
        summary: 'Vérification MFA',
        description: 'Vérifie code d\'authentification multifacteur'
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Code MFA valide',
        type: mfa_1.MfaVerifyResponseDto
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
    __metadata("design:paramtypes", [typeof (_b = typeof mfa_1.MfaVerifyDto !== "undefined" && mfa_1.MfaVerifyDto) === "function" ? _b : Object, Object]),
    __metadata("design:returntype", Promise)
], MfaController.prototype, "verifyMfa", null);
__decorate([
    (0, common_1.Post)('challenge'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, audit_log_decorator_1.RateLimit)({ limit: 5, windowMs: 300000 }),
    (0, swagger_1.ApiOperation)({
        summary: 'Génération challenge MFA',
        description: 'Génère nouveau challenge pour re-authentification'
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Challenge généré',
        schema: {
            example: {
                success: true,
                data: {
                    challengeToken: 'mfa_challenge_xxx',
                    availableMethods: ['SMS_OTP', 'TOTP_APP'],
                    expiresIn: 300
                }
            }
        }
    }),
    __param(0, (0, current_user_decorator_1.CurrentUserId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MfaController.prototype, "generateMfaChallenge", null);
__decorate([
    (0, common_1.Delete)(':provider'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, audit_log_decorator_1.AuditCritical)('mfa_disable'),
    (0, swagger_1.ApiOperation)({
        summary: 'Désactivation MFA',
        description: 'Désactive MFA pour un provider spécifique'
    }),
    (0, swagger_1.ApiParam)({ name: 'provider', enum: ['SMS_OTP', 'EMAIL_OTP', 'TOTP_APP', 'BACKUP_CODE'] }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'MFA désactivé',
        schema: {
            example: {
                success: true,
                data: {
                    provider: 'SMS_OTP',
                    disabled: true,
                    remainingMethods: ['TOTP_APP']
                }
            }
        }
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'MFA non configuré pour ce provider'
    }),
    __param(0, (0, common_1.Param)('provider')),
    __param(1, (0, current_user_decorator_1.CurrentUserId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_c = typeof interfaces_1.MfaProvider !== "undefined" && interfaces_1.MfaProvider) === "function" ? _c : Object, String]),
    __metadata("design:returntype", Promise)
], MfaController.prototype, "disableMfa", null);
__decorate([
    (0, common_1.Post)('backup-codes'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, audit_log_decorator_1.AuditCritical)('mfa_backup_codes_generated'),
    (0, audit_log_decorator_1.RateLimit)({ limit: 2, windowMs: 3600000 }),
    (0, swagger_1.ApiOperation)({
        summary: 'Génération codes de récupération',
        description: 'Génère nouveaux codes de récupération MFA'
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Codes générés',
        schema: {
            example: {
                success: true,
                data: {
                    backupCodes: ['ABC12345', 'DEF67890'],
                    previousCodesRevoked: true,
                    warning: 'Conservez ces codes en lieu sûr'
                }
            }
        }
    }),
    __param(0, (0, current_user_decorator_1.CurrentUserId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MfaController.prototype, "generateBackupCodes", null);
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