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
exports.PasswordController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const logger_service_1 = require("../../../shared/logger/logger.service");
const password_service_1 = require("../services/password.service");
const password_1 = require("../dto/password");
const jwt_auth_guard_1 = require("../guards/jwt-auth.guard");
const current_user_decorator_1 = require("../decorators/current-user.decorator");
const audit_log_decorator_1 = require("../decorators/audit-log.decorator");
let PasswordController = class PasswordController {
    passwordService;
    logger;
    constructor(passwordService, loggerService) {
        this.passwordService = passwordService;
        this.logger = loggerService.createChildLogger('PasswordController');
    }
    async forgotPassword(forgotPasswordDto) {
        const operationId = this.logger.startOperation('POST /auth/forgot-password', {
            email: forgotPasswordDto.email,
        });
        try {
            const token = await this.passwordService.generateResetToken(forgotPasswordDto.email);
            this.logger.endOperation(operationId, 'success');
            return {
                success: true,
                data: {
                    emailSent: true,
                    resetTokenSent: true,
                    expiresIn: 3600,
                },
                message: 'Email de réinitialisation envoyé si compte existant',
            };
        }
        catch (error) {
            this.logger.endOperation(operationId, 'error', error.message);
            throw error;
        }
    }
    async resetPassword(resetPasswordDto) {
        const operationId = this.logger.startOperation('POST /auth/reset-password');
        try {
            if (resetPasswordDto.newPassword !== resetPasswordDto.confirmPassword) {
                throw new Error('Les mots de passe ne correspondent pas');
            }
            const success = await this.passwordService.resetPassword(resetPasswordDto.token, resetPasswordDto.newPassword);
            this.logger.endOperation(operationId, 'success');
            return {
                success: true,
                data: {
                    passwordReset: success,
                    autoLogin: false,
                },
                message: 'Mot de passe réinitialisé avec succès',
            };
        }
        catch (error) {
            this.logger.endOperation(operationId, 'error', error.message);
            throw error;
        }
    }
    async changePassword(changePasswordDto, userId) {
        const operationId = this.logger.startOperation('PUT /auth/change-password', {
            userId,
        });
        try {
            if (changePasswordDto.newPassword !== changePasswordDto.confirmPassword) {
                throw new Error('Les mots de passe ne correspondent pas');
            }
            const success = await this.passwordService.changePassword(userId, changePasswordDto.currentPassword, changePasswordDto.newPassword);
            this.logger.endOperation(operationId, 'success');
            return {
                success: true,
                data: {
                    passwordChanged: success,
                    securityEventLogged: true,
                },
                message: 'Mot de passe modifié avec succès',
            };
        }
        catch (error) {
            this.logger.endOperation(operationId, 'error', error.message);
            throw error;
        }
    }
    async validatePassword(password) {
        const operationId = this.logger.startOperation('POST /auth/validate-password');
        try {
            const validation = await this.passwordService.validatePasswordStrength(password);
            this.logger.endOperation(operationId, 'success');
            return {
                success: true,
                data: validation,
            };
        }
        catch (error) {
            this.logger.endOperation(operationId, 'error', error.message);
            throw error;
        }
    }
};
exports.PasswordController = PasswordController;
__decorate([
    (0, current_user_decorator_1.Public)(),
    (0, common_1.Post)('forgot-password'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, audit_log_decorator_1.RateLimitPasswordReset)(),
    (0, audit_log_decorator_1.AuditCritical)('password_reset_request'),
    (0, swagger_1.ApiOperation)({
        summary: 'Demande réinitialisation mot de passe',
        description: 'Génère token de réinitialisation et envoie email'
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Email de réinitialisation envoyé',
        type: password_1.ForgotPasswordResponseDto
    }),
    (0, swagger_1.ApiResponse)({
        status: 429,
        description: 'Trop de demandes'
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_a = typeof password_1.ForgotPasswordDto !== "undefined" && password_1.ForgotPasswordDto) === "function" ? _a : Object]),
    __metadata("design:returntype", Promise)
], PasswordController.prototype, "forgotPassword", null);
__decorate([
    (0, current_user_decorator_1.Public)(),
    (0, common_1.Post)('reset-password'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, audit_log_decorator_1.RateLimit)({ limit: 5, windowMs: 300000 }),
    (0, audit_log_decorator_1.AuditCritical)('password_reset_complete'),
    (0, swagger_1.ApiOperation)({
        summary: 'Réinitialisation mot de passe',
        description: 'Confirme nouveau mot de passe avec token'
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Mot de passe réinitialisé',
        type: password_1.ResetPasswordResponseDto
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Token invalide ou mot de passe faible'
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_b = typeof password_1.ResetPasswordDto !== "undefined" && password_1.ResetPasswordDto) === "function" ? _b : Object]),
    __metadata("design:returntype", Promise)
], PasswordController.prototype, "resetPassword", null);
__decorate([
    (0, common_1.Put)('change-password'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiBearerAuth)(),
    (0, audit_log_decorator_1.RateLimit)({ limit: 3, windowMs: 3600000 }),
    (0, audit_log_decorator_1.AuditCritical)('password_change'),
    (0, swagger_1.ApiOperation)({
        summary: 'Changement mot de passe',
        description: 'Modifie mot de passe pour utilisateur connecté'
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Mot de passe modifié',
        type: password_1.ChangePasswordResponseDto
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Mot de passe actuel incorrect ou nouveau mot de passe faible'
    }),
    (0, swagger_1.ApiResponse)({
        status: 401,
        description: 'Authentification requise'
    }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUserId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_c = typeof password_1.ChangePasswordDto !== "undefined" && password_1.ChangePasswordDto) === "function" ? _c : Object, String]),
    __metadata("design:returntype", Promise)
], PasswordController.prototype, "changePassword", null);
__decorate([
    (0, current_user_decorator_1.Public)(),
    (0, common_1.Post)('validate-password'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, audit_log_decorator_1.RateLimit)({ limit: 10, windowMs: 60000 }),
    (0, swagger_1.ApiOperation)({
        summary: 'Validation force mot de passe',
        description: 'Vérifie si mot de passe respecte critères sécurité'
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Validation effectuée',
        schema: {
            example: {
                isValid: true,
                score: 85,
                strength: 'strong',
                suggestions: []
            }
        }
    }),
    __param(0, (0, common_1.Body)('password')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PasswordController.prototype, "validatePassword", null);
exports.PasswordController = PasswordController = __decorate([
    (0, swagger_1.ApiTags)('Password Management'),
    (0, common_1.Controller)('auth'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true
    })),
    __metadata("design:paramtypes", [password_service_1.PasswordService,
        logger_service_1.LoggerService])
], PasswordController);
//# sourceMappingURL=password.controller.js.map