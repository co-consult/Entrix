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
exports.ValidationTokenController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const logger_service_1 = require("../../../shared/logger/logger.service");
const validation_token_service_1 = require("../services/validation-token.service");
const validation_token_dto_1 = require("../dto/validation-tokens/validation-token.dto");
const jwt_auth_guard_1 = require("../guards/jwt-auth.guard");
const public_decorator_1 = require("../decorators/public.decorator");
const decorators_1 = require("../decorators");
let ValidationTokenController = class ValidationTokenController {
    validationTokenService;
    logger;
    constructor(validationTokenService, loggerService) {
        this.validationTokenService = validationTokenService;
        this.logger = loggerService.createChildLogger('ValidationTokenController');
    }
    async createEmailVerification(createDto, clientInfo) {
        const operationId = this.logger.startOperation('POST /auth/validation/email-verification');
        try {
            const token = await this.validationTokenService.createEmailVerificationToken(createDto.email, undefined, createDto.verification_type);
            this.logger.endOperation('createEmailVerification', operationId, true);
            return {
                id: token.id,
                token_type: token.token_type,
                email: token.email,
                expires_at: token.expires_at.toISOString(),
                max_attempts: token.max_attempts,
                verification_url: token.verification_url,
                message: 'Un email de vérification a été envoyé. Vérifiez votre boîte de réception.',
            };
        }
        catch (error) {
            this.logger.endOperation('createEmailVerification', operationId, false);
            throw error;
        }
    }
    async verifyEmail(useTokenDto, clientInfo) {
        const operationId = this.logger.startOperation('POST /auth/validation/verify-email');
        try {
            const result = await this.validationTokenService.verifyEmailWithToken(useTokenDto.token);
            this.logger.endOperation('verifyEmail', operationId, true);
            return {
                ...result,
                email_verified: result.success,
                verified_at: result.success ? new Date().toISOString() : undefined,
                message: result.success ? 'Email vérifié avec succès !' : 'Échec de la vérification',
            };
        }
        catch (error) {
            this.logger.endOperation('verifyEmail', operationId, false);
            throw error;
        }
    }
    async createPasswordReset(createDto, clientInfo) {
        const operationId = this.logger.startOperation('POST /auth/validation/password-reset');
        try {
            const token = await this.validationTokenService.createPasswordResetToken(createDto.email);
            this.logger.endOperation('createPasswordReset', operationId, true);
            return {
                id: token.id,
                token_type: token.token_type,
                email: token.email,
                expires_at: token.expires_at.toISOString(),
                max_attempts: token.max_attempts,
                message: 'Si cette adresse email existe, vous recevrez un lien de réinitialisation.',
            };
        }
        catch (error) {
            this.logger.endOperation('createPasswordReset', operationId, false);
            return {
                id: 'security-dummy',
                token_type: 'PASSWORD_RESET',
                email: createDto.email,
                expires_at: new Date(Date.now() + 3600000).toISOString(),
                max_attempts: 3,
                message: 'Si cette adresse email existe, vous recevrez un lien de réinitialisation.',
            };
        }
    }
    async resetPassword(resetDto, clientInfo) {
        const operationId = this.logger.startOperation('POST /auth/validation/reset-password');
        try {
            if (resetDto.confirm_password && resetDto.new_password !== resetDto.confirm_password) {
                throw new Error('Password confirmation does not match');
            }
            const result = await this.validationTokenService.resetPasswordWithToken(resetDto.token, resetDto.new_password);
            this.logger.endOperation('resetPassword', operationId, true);
            return {
                ...result,
                password_updated: result.success,
                sessions_closed: result.success ? 1 : 0,
                message: result.success ?
                    'Mot de passe mis à jour avec succès. Reconnectez-vous avec votre nouveau mot de passe.' :
                    'Échec de la réinitialisation du mot de passe.',
            };
        }
        catch (error) {
            this.logger.endOperation('resetPassword', operationId, false);
            throw error;
        }
    }
    async createInvitation(inviterId, createDto) {
        const operationId = this.logger.startOperation('POST /auth/validation/invitation');
        try {
            const invitationData = {
                ...createDto,
                inviter_id: inviterId,
            };
            const token = await this.validationTokenService.createInvitationToken(createDto.email, invitationData);
            this.logger.endOperation('createInvitation', operationId, true);
            return {
                id: token.id,
                token_type: token.token_type,
                email: token.email,
                expires_at: token.expires_at.toISOString(),
                max_attempts: token.max_attempts,
                verification_url: token.verification_url,
                message: 'Invitation envoyée avec succès.',
            };
        }
        catch (error) {
            this.logger.endOperation('createInvitation', operationId, false);
            throw error;
        }
    }
    async acceptInvitation(acceptDto, clientInfo) {
        const operationId = this.logger.startOperation('POST /auth/validation/accept-invitation');
        try {
            const result = await this.validationTokenService.acceptInvitationWithToken(acceptDto.token, {
                firstName: acceptDto.firstName,
                lastName: acceptDto.lastName,
                password: acceptDto.password,
                phone: acceptDto.phone,
                terms_accepted: acceptDto.terms_accepted,
            });
            this.logger.endOperation('acceptInvitation', operationId, true);
            return {
                ...result,
                account_created: result.success && !!result.user_id,
                role_assigned: result.action_data?.role,
                permissions_granted: result.action_data?.permissions,
                message: result.success ?
                    'Invitation acceptée et compte créé avec succès !' :
                    'Échec de l\'acceptation de l\'invitation.',
            };
        }
        catch (error) {
            this.logger.endOperation('acceptInvitation', operationId, false);
            throw error;
        }
    }
    async createMagicLink(createDto, clientInfo) {
        const operationId = this.logger.startOperation('POST /auth/validation/magic-link');
        try {
            const token = await this.validationTokenService.createMagicLinkToken(createDto.email, createDto.action, {
                redirect_url: createDto.redirect_url,
                context_data: createDto.context_data,
                expires_after_use: createDto.expires_after_use,
            });
            this.logger.endOperation('createMagicLink', operationId, true);
            return {
                id: token.id,
                token_type: token.token_type,
                email: token.email,
                expires_at: token.expires_at.toISOString(),
                max_attempts: token.max_attempts,
                magic_link_url: token.magic_link_url,
                message: 'Magic link envoyé par email.',
            };
        }
        catch (error) {
            this.logger.endOperation('createMagicLink', operationId, false);
            throw error;
        }
    }
    async useMagicLink(useDto, clientInfo) {
        const operationId = this.logger.startOperation('POST /auth/validation/use-magic-link');
        try {
            const result = await this.validationTokenService.useMagicLink(useDto.token, useDto.client_info);
            this.logger.endOperation('useMagicLink', operationId, true);
            return {
                ...result,
                message: result.success ? 'Magic link utilisé avec succès !' : 'Échec d\'utilisation du magic link',
            };
        }
        catch (error) {
            this.logger.endOperation('useMagicLink', operationId, false);
            throw error;
        }
    }
    async createPhoneVerification(userId, createDto) {
        const operationId = this.logger.startOperation('POST /auth/validation/phone-verification');
        try {
            const token = await this.validationTokenService.createPhoneVerificationToken(createDto.phone, userId);
            this.logger.endOperation('createPhoneVerification', operationId, true);
            return {
                id: token.id,
                token_type: token.token_type,
                email: createDto.phone,
                expires_at: token.expires_at.toISOString(),
                max_attempts: token.max_attempts,
                message: 'Code de vérification envoyé par SMS.',
            };
        }
        catch (error) {
            this.logger.endOperation('createPhoneVerification', operationId, false);
            throw error;
        }
    }
    async verifyPhone(userId, verifyDto, clientInfo) {
        const operationId = this.logger.startOperation('POST /auth/validation/verify-phone');
        try {
            const result = await this.validationTokenService.useToken(verifyDto.code, clientInfo);
            if (result.success && result.user_id === userId) {
            }
            this.logger.endOperation('verifyPhone', operationId, true);
            return {
                ...result,
                message: result.success ? 'Téléphone vérifié avec succès !' : 'Code incorrect',
            };
        }
        catch (error) {
            this.logger.endOperation('verifyPhone', operationId, false);
            throw error;
        }
    }
    async validateToken(validateDto) {
        const operationId = this.logger.startOperation('POST /auth/validation/validate');
        try {
            const validation = await this.validationTokenService.validateToken(validateDto.token);
            this.logger.endOperation('validateToken', operationId, true);
            const response = {
                isValid: validation.isValid,
                errors: validation.errors,
                attempts_remaining: validation.attempts_remaining,
                is_blocked: validation.is_blocked,
                expires_at: validation.expires_at?.toISOString(),
                can_resend: validation.can_resend,
            };
            return response;
        }
        catch (error) {
            this.logger.endOperation('validateToken', operationId, false);
            throw error;
        }
    }
    async resendToken(resendDto, clientInfo) {
        const operationId = this.logger.startOperation('POST /auth/validation/resend');
        try {
            const existingTokens = await this.validationTokenService.getEmailTokens(resendDto.email, resendDto.token_type);
            if (!existingTokens.length) {
                throw new Error('No existing token found to resend');
            }
            const latestToken = existingTokens[0];
            const newToken = await this.validationTokenService.resendToken(latestToken.id);
            this.logger.endOperation('resendToken', operationId, true);
            return {
                id: newToken.id,
                token_type: newToken.token_type,
                email: newToken.email,
                expires_at: newToken.expires_at.toISOString(),
                max_attempts: newToken.max_attempts,
                verification_url: newToken.verification_url,
                magic_link_url: newToken.magic_link_url,
                message: 'Token renvoyé avec succès.',
            };
        }
        catch (error) {
            this.logger.endOperation('resendToken', operationId, false);
            throw error;
        }
    }
    async getMyTokens(userId, filters) {
        const operationId = this.logger.startOperation('GET /auth/validation/my-tokens');
        try {
            const tokens = await this.validationTokenService.getUserTokens(userId, filters.token_type);
            this.logger.endOperation('getMyTokens', operationId, true);
            return tokens.map(token => ({
                id: token.id,
                token_type: token.token_type,
                email: token.email,
                user_id: token.user_id,
                expires_at: token.expires_at.toISOString(),
                is_used: token.is_used,
                used_at: token.used_at?.toISOString(),
                attempt_count: token.attempt_count,
                max_attempts: token.max_attempts,
                is_blocked: token.is_blocked,
                created_at: token.created_at.toISOString(),
            }));
        }
        catch (error) {
            this.logger.endOperation('getMyTokens', operationId, false);
            throw error;
        }
    }
    async getTokenStats(userId) {
        const operationId = this.logger.startOperation('GET /auth/validation/stats');
        try {
            const stats = await this.validationTokenService.getTokenStats(userId);
            this.logger.endOperation('getTokenStats', operationId, true);
            return stats;
        }
        catch (error) {
            this.logger.endOperation('getTokenStats', operationId, false);
            throw error;
        }
    }
};
exports.ValidationTokenController = ValidationTokenController;
__decorate([
    (0, common_1.Post)('email-verification'),
    (0, public_decorator_1.Public)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, decorators_1.RateLimit)({ limit: 3, windowMs: 300000 }),
    (0, decorators_1.AuditLog)({ action: 'create_email_verification', level: 'info' }),
    (0, swagger_1.ApiOperation)({
        summary: 'Demander vérification email',
        description: 'Crée un token de vérification email et l\'envoie par email'
    }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Token de vérification créé',
        type: validation_token_dto_1.GeneratedValidationTokenResponseDto
    }),
    (0, swagger_1.ApiResponse)({ status: 429, description: 'Trop de demandes' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, decorators_1.ClientInfo)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [validation_token_dto_1.CreateEmailVerificationDto, Object]),
    __metadata("design:returntype", Promise)
], ValidationTokenController.prototype, "createEmailVerification", null);
__decorate([
    (0, common_1.Post)('verify-email'),
    (0, public_decorator_1.Public)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, decorators_1.RateLimit)({ limit: 5, windowMs: 300000 }),
    (0, decorators_1.AuditLog)({ action: 'verify_email', level: 'info' }),
    (0, swagger_1.ApiOperation)({
        summary: 'Vérifier email',
        description: 'Utilise le token reçu par email pour vérifier l\'adresse'
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Email vérifié avec succès',
        type: validation_token_dto_1.VerifyEmailResponseDto
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Token invalide ou expiré' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, decorators_1.ClientInfo)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [validation_token_dto_1.UseTokenDto, Object]),
    __metadata("design:returntype", Promise)
], ValidationTokenController.prototype, "verifyEmail", null);
__decorate([
    (0, common_1.Post)('password-reset'),
    (0, public_decorator_1.Public)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, decorators_1.RateLimit)({ limit: 3, windowMs: 3600000 }),
    (0, decorators_1.AuditLog)({ action: 'request_password_reset', level: 'warn' }),
    (0, swagger_1.ApiOperation)({
        summary: 'Demander reset mot de passe',
        description: 'Crée un token de reset et l\'envoie par email'
    }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Token de reset créé',
        type: validation_token_dto_1.GeneratedValidationTokenResponseDto
    }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, decorators_1.ClientInfo)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [validation_token_dto_1.CreatePasswordResetDto, Object]),
    __metadata("design:returntype", Promise)
], ValidationTokenController.prototype, "createPasswordReset", null);
__decorate([
    (0, common_1.Post)('reset-password'),
    (0, public_decorator_1.Public)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, decorators_1.RateLimit)({ limit: 5, windowMs: 300000 }),
    (0, decorators_1.AuditLog)({ action: 'reset_password', level: 'warn' }),
    (0, swagger_1.ApiOperation)({
        summary: 'Réinitialiser mot de passe',
        description: 'Utilise le token reçu par email pour changer le mot de passe'
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Mot de passe réinitialisé',
        type: validation_token_dto_1.PasswordResetResponseDto
    }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, decorators_1.ClientInfo)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [validation_token_dto_1.UsePasswordResetDto, Object]),
    __metadata("design:returntype", Promise)
], ValidationTokenController.prototype, "resetPassword", null);
__decorate([
    (0, common_1.Post)('invitation'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, decorators_1.RateLimit)({ limit: 10, windowMs: 3600000 }),
    (0, decorators_1.AuditLog)({ action: 'create_invitation', level: 'info' }),
    (0, swagger_1.ApiOperation)({
        summary: 'Créer invitation utilisateur',
        description: 'Crée une invitation pour un nouvel utilisateur'
    }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Invitation créée',
        type: validation_token_dto_1.GeneratedValidationTokenResponseDto
    }),
    __param(0, (0, decorators_1.CurrentUserId)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, validation_token_dto_1.CreateInvitationDto]),
    __metadata("design:returntype", Promise)
], ValidationTokenController.prototype, "createInvitation", null);
__decorate([
    (0, common_1.Post)('accept-invitation'),
    (0, public_decorator_1.Public)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, decorators_1.RateLimit)({ limit: 5, windowMs: 300000 }),
    (0, decorators_1.AuditLog)({ action: 'accept_invitation', level: 'info' }),
    (0, swagger_1.ApiOperation)({
        summary: 'Accepter invitation',
        description: 'Accepte une invitation et crée le compte utilisateur'
    }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Invitation acceptée et compte créé',
        type: validation_token_dto_1.InvitationResponseDto
    }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, decorators_1.ClientInfo)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [validation_token_dto_1.AcceptInvitationDto, Object]),
    __metadata("design:returntype", Promise)
], ValidationTokenController.prototype, "acceptInvitation", null);
__decorate([
    (0, common_1.Post)('magic-link'),
    (0, public_decorator_1.Public)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, decorators_1.RateLimit)({ limit: 5, windowMs: 300000 }),
    (0, decorators_1.AuditLog)({ action: 'create_magic_link', level: 'info' }),
    (0, swagger_1.ApiOperation)({
        summary: 'Créer magic link',
        description: 'Crée un lien magique pour connexion sans mot de passe'
    }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Magic link créé',
        type: validation_token_dto_1.GeneratedValidationTokenResponseDto
    }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, decorators_1.ClientInfo)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [validation_token_dto_1.CreateMagicLinkDto, Object]),
    __metadata("design:returntype", Promise)
], ValidationTokenController.prototype, "createMagicLink", null);
__decorate([
    (0, common_1.Post)('use-magic-link'),
    (0, public_decorator_1.Public)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, decorators_1.RateLimit)({ limit: 10, windowMs: 300000 }),
    (0, decorators_1.AuditLog)({ action: 'use_magic_link', level: 'info' }),
    (0, swagger_1.ApiOperation)({
        summary: 'Utiliser magic link',
        description: 'Utilise un magic link pour effectuer l\'action demandée'
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Magic link utilisé',
        type: validation_token_dto_1.TokenUsageResponseDto
    }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, decorators_1.ClientInfo)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [validation_token_dto_1.UseMagicLinkDto, Object]),
    __metadata("design:returntype", Promise)
], ValidationTokenController.prototype, "useMagicLink", null);
__decorate([
    (0, common_1.Post)('phone-verification'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, decorators_1.RateLimit)({ limit: 3, windowMs: 300000 }),
    (0, decorators_1.AuditLog)({ action: 'create_phone_verification', level: 'info' }),
    (0, swagger_1.ApiOperation)({
        summary: 'Demander vérification téléphone',
        description: 'Envoie un code de vérification par SMS'
    }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Code SMS envoyé',
        type: validation_token_dto_1.GeneratedValidationTokenResponseDto
    }),
    __param(0, (0, decorators_1.CurrentUserId)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, validation_token_dto_1.CreatePhoneVerificationDto]),
    __metadata("design:returntype", Promise)
], ValidationTokenController.prototype, "createPhoneVerification", null);
__decorate([
    (0, common_1.Post)('verify-phone'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, decorators_1.RateLimit)({ limit: 5, windowMs: 300000 }),
    (0, decorators_1.AuditLog)({ action: 'verify_phone', level: 'info' }),
    (0, swagger_1.ApiOperation)({
        summary: 'Vérifier téléphone',
        description: 'Vérifie le numéro de téléphone avec le code reçu'
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Téléphone vérifié',
        type: validation_token_dto_1.TokenUsageResponseDto
    }),
    __param(0, (0, decorators_1.CurrentUserId)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, decorators_1.ClientInfo)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, validation_token_dto_1.VerifyPhoneDto, Object]),
    __metadata("design:returntype", Promise)
], ValidationTokenController.prototype, "verifyPhone", null);
__decorate([
    (0, common_1.Post)('validate'),
    (0, public_decorator_1.Public)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, decorators_1.RateLimit)({ limit: 20, windowMs: 60000 }),
    (0, swagger_1.ApiOperation)({
        summary: 'Valider un token',
        description: 'Valide n\'importe quel token de validation'
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Résultat de validation',
        type: validation_token_dto_1.TokenValidationResponseDto
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [validation_token_dto_1.ValidateTokenDto]),
    __metadata("design:returntype", Promise)
], ValidationTokenController.prototype, "validateToken", null);
__decorate([
    (0, common_1.Post)('resend'),
    (0, public_decorator_1.Public)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, decorators_1.RateLimit)({ limit: 3, windowMs: 3600000 }),
    (0, decorators_1.AuditLog)({ action: 'resend_validation_token', level: 'info' }),
    (0, swagger_1.ApiOperation)({
        summary: 'Renvoyer un token',
        description: 'Renvoie un token de validation (annule l\'ancien)'
    }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Token renvoyé',
        type: validation_token_dto_1.GeneratedValidationTokenResponseDto
    }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, decorators_1.ClientInfo)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [validation_token_dto_1.ResendTokenDto, Object]),
    __metadata("design:returntype", Promise)
], ValidationTokenController.prototype, "resendToken", null);
__decorate([
    (0, common_1.Get)('my-tokens'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Mes tokens de validation',
        description: 'Liste les tokens de validation de l\'utilisateur connecté'
    }),
    (0, swagger_1.ApiQuery)({ name: 'token_type', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'is_used', type: Boolean, required: false }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Liste des tokens',
        type: [validation_token_dto_1.ValidationTokenResponseDto]
    }),
    __param(0, (0, decorators_1.CurrentUserId)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, validation_token_dto_1.ValidationTokenFiltersDto]),
    __metadata("design:returntype", Promise)
], ValidationTokenController.prototype, "getMyTokens", null);
__decorate([
    (0, common_1.Get)('stats'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Statistiques validation tokens',
        description: 'Statistiques d\'utilisation des tokens de validation'
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Statistiques',
        type: validation_token_dto_1.ValidationTokenStatsResponseDto
    }),
    __param(0, (0, decorators_1.CurrentUserId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ValidationTokenController.prototype, "getTokenStats", null);
exports.ValidationTokenController = ValidationTokenController = __decorate([
    (0, swagger_1.ApiTags)('Validation Tokens'),
    (0, common_1.Controller)('auth/validation'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true
    })),
    __metadata("design:paramtypes", [validation_token_service_1.ValidationTokenService,
        logger_service_1.LoggerService])
], ValidationTokenController);
//# sourceMappingURL=validation-token.controller.js.map