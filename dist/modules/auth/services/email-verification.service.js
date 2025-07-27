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
exports.EmailVerificationService = void 0;
const common_1 = require("@nestjs/common");
const logger_service_1 = require("../../../shared/logger/logger.service");
const validation_token_service_1 = require("./validation-token.service");
let EmailVerificationService = class EmailVerificationService {
    validationTokenService;
    logger;
    constructor(validationTokenService, loggerService) {
        this.validationTokenService = validationTokenService;
        this.logger = loggerService.createChildLogger('EmailVerificationService');
    }
    async sendVerificationEmail(email, userId) {
        const operationId = this.logger.startOperation('sendVerificationEmail', { email });
        try {
            const tokenData = await this.validationTokenService.createEmailVerificationToken(email, userId, 'registration');
            this.logger.endOperation('sendVerificationEmail', operationId, true);
            return {
                success: true,
                tokenId: tokenData.id,
                expiresAt: tokenData.expires_at,
            };
        }
        catch (error) {
            this.logger.endOperation('sendVerificationEmail', operationId, false);
            this.logger.error('Failed to send verification email', error.stack, 'EmailVerificationService.sendVerificationEmail', JSON.stringify({ errorMessage: error.message, email }));
            return {
                success: false,
                tokenId: '',
                expiresAt: new Date(),
            };
        }
    }
    async verifyEmail(token) {
        const operationId = this.logger.startOperation('verifyEmail');
        try {
            const result = await this.validationTokenService.verifyEmailWithToken(token);
            this.logger.endOperation('verifyEmail', operationId, result.success);
            return {
                success: result.success,
                userId: result.user_id,
                email: result.email,
            };
        }
        catch (error) {
            this.logger.endOperation('verifyEmail', operationId, false);
            this.logger.error('Failed to verify email', error.stack, 'EmailVerificationService.verifyEmail', JSON.stringify({ errorMessage: error.message }));
            return {
                success: false,
            };
        }
    }
    async resendVerificationEmail(email) {
        const operationId = this.logger.startOperation('resendVerificationEmail', { email });
        try {
            const existingTokens = await this.validationTokenService.getEmailTokens(email, 'EMAIL_VERIFICATION');
            if (!existingTokens.length) {
                await this.validationTokenService.createEmailVerificationToken(email);
            }
            else {
                const latestToken = existingTokens[0];
                await this.validationTokenService.resendToken(latestToken.id);
            }
            this.logger.endOperation('resendVerificationEmail', operationId, true);
            return {
                success: true,
                message: 'Email de vérification renvoyé avec succès',
            };
        }
        catch (error) {
            this.logger.endOperation('resendVerificationEmail', operationId, false);
            this.logger.error('Failed to resend verification email', error.stack, 'EmailVerificationService.resendVerificationEmail', JSON.stringify({ errorMessage: error.message, email }));
            return {
                success: false,
                message: 'Échec du renvoi de l\'email de vérification',
            };
        }
    }
    async isTokenValid(token) {
        try {
            const validation = await this.validationTokenService.validateToken(token);
            return validation.isValid && validation.token?.token_type === 'EMAIL_VERIFICATION';
        }
        catch (error) {
            this.logger.error('Error checking token validity', error.stack);
            return false;
        }
    }
    async getVerificationStatus(email) {
        try {
            const activeTokens = await this.validationTokenService.getEmailTokens(email, 'EMAIL_VERIFICATION');
            const hasActiveToken = activeTokens.some(token => !token.is_used &&
                !token.is_blocked &&
                token.expires_at > new Date());
            const canResend = await this.validationTokenService.canResendToken(email, 'EMAIL_VERIFICATION');
            return {
                hasActiveToken,
                canResend,
                attemptsRemaining: hasActiveToken ?
                    activeTokens[0]?.max_attempts - activeTokens[0]?.attempt_count :
                    undefined,
            };
        }
        catch (error) {
            this.logger.error('Error getting verification status', error.stack);
            return {
                hasActiveToken: false,
                canResend: false,
            };
        }
    }
};
exports.EmailVerificationService = EmailVerificationService;
exports.EmailVerificationService = EmailVerificationService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [validation_token_service_1.ValidationTokenService,
        logger_service_1.LoggerService])
], EmailVerificationService);
//# sourceMappingURL=email-verification.service.js.map