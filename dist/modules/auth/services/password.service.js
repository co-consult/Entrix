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
exports.PasswordService = void 0;
const common_1 = require("@nestjs/common");
const logger_service_1 = require("../../../shared/logger/logger.service");
const prisma_service_1 = require("../../../shared/prisma/prisma.service");
const redis_service_1 = require("../../../shared/redis/redis.service");
const email_service_1 = require("../../../shared/email/email.service");
const crypto_util_1 = require("../utils/crypto.util");
const auth_constants_1 = require("../constants/auth.constants");
const security_constants_1 = require("../constants/security.constants");
const auth_exceptions_1 = require("../exceptions/auth.exceptions");
let PasswordService = class PasswordService {
    prisma;
    redis;
    email;
    logger;
    RESET_TOKEN_PREFIX = 'password_reset:';
    RESET_ATTEMPTS_PREFIX = 'reset_attempts:';
    constructor(prisma, redis, email, loggerService) {
        this.prisma = prisma;
        this.redis = redis;
        this.email = email;
        this.logger = loggerService.createChildLogger('PasswordService');
    }
    async hashPassword(password) {
        const operationId = this.logger.startOperation('hashPassword');
        try {
            const hashedPassword = await crypto_util_1.CryptoUtil.hashPassword(password);
            this.logger.endOperation('hashPassword', operationId, true);
            return hashedPassword;
        }
        catch (error) {
            this.logger.endOperation('hashPassword', operationId, false, undefined, { errorMessage: error.message });
            this.logger.error('Password hashing failed', error.stack, 'PasswordService.hashPassword');
            throw new Error('Erreur hachage mot de passe');
        }
    }
    async verifyPassword(password, hash) {
        const operationId = this.logger.startOperation('verifyPassword');
        try {
            const isValid = await crypto_util_1.CryptoUtil.verifyPassword(password, hash);
            this.logger.endOperation('verifyPassword', operationId, true);
            return isValid;
        }
        catch (error) {
            this.logger.endOperation('verifyPassword', operationId, false, undefined, { errorMessage: error.message });
            this.logger.error('Password verification failed', error.stack, 'PasswordService.verifyPassword');
            return false;
        }
    }
    async generateResetToken(email) {
        const operationId = this.logger.startOperation('generateResetToken', { email });
        try {
            const user = await this.prisma.users.findUnique({
                where: { email },
                select: {
                    id: true,
                    email: true,
                    first_name: true,
                    last_name: true,
                    is_active: true
                }
            });
            if (!user) {
                this.logger.warn('Password reset requested for non-existent email', undefined, 'PasswordService.generateResetToken', JSON.stringify({ email }));
                return 'fake-token-' + Date.now();
            }
            if (!user.is_active) {
                this.logger.warn('Password reset requested for inactive user', undefined, 'PasswordService.generateResetToken', JSON.stringify({ userId: user.id, email }));
                throw new common_1.BadRequestException('Compte utilisateur inactif');
            }
            await this.checkResetRateLimit(email);
            const resetToken = crypto_util_1.CryptoUtil.generateSecureToken(32);
            const tokenHash = crypto_util_1.CryptoUtil.sha256Hash(resetToken);
            const resetData = {
                email: user.email,
                token: tokenHash,
                expiresAt: new Date(Date.now() + auth_constants_1.AUTH_CONSTANTS.JWT.PASSWORD_RESET_TOKEN_EXPIRY * 1000),
                used: false,
            };
            await this.redis.setCache(`${this.RESET_TOKEN_PREFIX}${resetToken}`, resetData, auth_constants_1.AUTH_CONSTANTS.JWT.PASSWORD_RESET_TOKEN_EXPIRY);
            await this.email.sendPasswordResetEmail(user.email, resetToken);
            await this.incrementResetAttempts(email);
            this.logger.logSecurityEvent('PASSWORD_RESET_REQUESTED', user.id, undefined, undefined, { email, tokenGenerated: true });
            this.logger.endOperation('generateResetToken', operationId, true);
            return resetToken;
        }
        catch (error) {
            this.logger.endOperation('generateResetToken', operationId, false, undefined, {
                errorMessage: error.message,
                email
            });
            if (error instanceof common_1.BadRequestException) {
                throw error;
            }
            this.logger.error('Failed to generate reset token', error.stack, 'PasswordService.generateResetToken', JSON.stringify({ email }));
            throw new Error('Erreur génération token réinitialisation');
        }
    }
    async validateResetToken(token) {
        const operationId = this.logger.startOperation('validateResetToken');
        try {
            if (!token || typeof token !== 'string') {
                this.logger.endOperation('validateResetToken', operationId, false, undefined, { error: 'Invalid token format' });
                return null;
            }
            const resetData = await this.redis.getCache(`${this.RESET_TOKEN_PREFIX}${token}`);
            if (!resetData) {
                this.logger.warn('Reset token not found or expired', undefined, 'PasswordService.validateResetToken', JSON.stringify({ tokenPrefix: token.substring(0, 8) }));
                this.logger.endOperation('validateResetToken', operationId, false, undefined, { error: 'Token not found' });
                return null;
            }
            if (resetData.used) {
                this.logger.warn('Reset token already used', undefined, 'PasswordService.validateResetToken', JSON.stringify({ email: resetData.email }));
                this.logger.endOperation('validateResetToken', operationId, false, undefined, { error: 'Token already used' });
                return null;
            }
            if (new Date() > new Date(resetData.expiresAt)) {
                this.logger.warn('Reset token expired', undefined, 'PasswordService.validateResetToken', JSON.stringify({ email: resetData.email }));
                await this.redis.delCache(`${this.RESET_TOKEN_PREFIX}${token}`);
                this.logger.endOperation('validateResetToken', operationId, false, undefined, { error: 'Token expired' });
                return null;
            }
            this.logger.endOperation('validateResetToken', operationId, true);
            return resetData;
        }
        catch (error) {
            this.logger.endOperation('validateResetToken', operationId, false, undefined, { errorMessage: error.message });
            this.logger.error('Failed to validate reset token', error.stack, 'PasswordService.validateResetToken');
            return null;
        }
    }
    async resetPassword(token, newPassword) {
        const operationId = this.logger.startOperation('resetPassword');
        try {
            const resetData = await this.validateResetToken(token);
            if (!resetData) {
                throw new auth_exceptions_1.InvalidResetTokenException();
            }
            const passwordValidation = await this.validatePasswordStrength(newPassword);
            if (!passwordValidation.isValid) {
                throw new auth_exceptions_1.WeakPasswordException(passwordValidation.suggestions);
            }
            const user = await this.prisma.users.findUnique({
                where: { email: resetData.email },
                select: { id: true, email: true, first_name: true, last_name: true }
            });
            if (!user) {
                this.logger.error('User not found during password reset', undefined, 'PasswordService.resetPassword', JSON.stringify({ email: resetData.email }));
                throw new common_1.NotFoundException('Utilisateur introuvable');
            }
            const hashedPassword = await this.hashPassword(newPassword);
            await this.prisma.users.update({
                where: { id: user.id },
                data: {
                    password: hashedPassword,
                    updated_at: new Date()
                }
            });
            await this.redis.setCache(`${this.RESET_TOKEN_PREFIX}${token}`, { ...resetData, used: true }, 300);
            await this.redis.delCache(`${this.RESET_ATTEMPTS_PREFIX}${resetData.email}`);
            this.logger.logSecurityEvent('PASSWORD_RESET_COMPLETED', user.id, undefined, undefined, { email: user.email, tokenUsed: true });
            await this.email.sendMail({
                to: user.email,
                subject: 'Mot de passe modifié avec succès',
                template: 'password-changed',
                context: {
                    firstName: user.first_name,
                    lastName: user.last_name,
                    changedAt: new Date().toLocaleString('fr-TN'),
                    supportUrl: `${process.env.FRONTEND_URL}/support`
                }
            });
            this.logger.endOperation('resetPassword', operationId, true);
            return true;
        }
        catch (error) {
            this.logger.endOperation('resetPassword', operationId, false, undefined, { errorMessage: error.message });
            if (error instanceof auth_exceptions_1.InvalidResetTokenException ||
                error instanceof auth_exceptions_1.WeakPasswordException ||
                error instanceof common_1.NotFoundException) {
                throw error;
            }
            this.logger.error('Failed to reset password', error.stack, 'PasswordService.resetPassword');
            throw new Error('Erreur lors de la réinitialisation');
        }
    }
    async changePassword(userId, oldPassword, newPassword) {
        const operationId = this.logger.startOperation('changePassword', { userId });
        try {
            const user = await this.prisma.users.findUnique({
                where: { id: userId },
                select: {
                    id: true,
                    email: true,
                    password: true,
                    first_name: true,
                    last_name: true,
                    is_active: true
                }
            });
            if (!user) {
                throw new common_1.NotFoundException('Utilisateur introuvable');
            }
            if (!user.is_active) {
                throw new common_1.BadRequestException('Compte utilisateur inactif');
            }
            const isValidOldPassword = await this.verifyPassword(oldPassword, user.password);
            if (!isValidOldPassword) {
                this.logger.warn('Invalid old password during change', undefined, 'PasswordService.changePassword', JSON.stringify({ userId }));
                throw new common_1.BadRequestException('Ancien mot de passe incorrect');
            }
            const passwordValidation = await this.validatePasswordStrength(newPassword);
            if (!passwordValidation.isValid) {
                throw new auth_exceptions_1.WeakPasswordException(passwordValidation.suggestions);
            }
            const isSamePassword = await this.verifyPassword(newPassword, user.password);
            if (isSamePassword) {
                throw new common_1.BadRequestException('Le nouveau mot de passe doit être différent de l\'ancien');
            }
            const hashedNewPassword = await this.hashPassword(newPassword);
            await this.prisma.users.update({
                where: { id: userId },
                data: {
                    password: hashedNewPassword,
                    updated_at: new Date()
                }
            });
            this.logger.logSecurityEvent('PASSWORD_CHANGED', userId, undefined, undefined, {
                email: user.email,
                changedAt: new Date().toISOString()
            });
            await this.email.sendMail({
                to: user.email,
                subject: 'Mot de passe modifié',
                template: 'password-changed',
                context: {
                    firstName: user.first_name,
                    lastName: user.last_name,
                    changedAt: new Date().toLocaleString('fr-TN'),
                    ipAddress: 'Non disponible',
                    supportUrl: `${process.env.FRONTEND_URL}/support`
                }
            });
            this.logger.endOperation('changePassword', operationId, true);
            return true;
        }
        catch (error) {
            this.logger.endOperation('changePassword', operationId, false, undefined, { errorMessage: error.message });
            if (error instanceof common_1.NotFoundException ||
                error instanceof common_1.BadRequestException ||
                error instanceof auth_exceptions_1.WeakPasswordException) {
                throw error;
            }
            this.logger.error('Failed to change password', error.stack, 'PasswordService.changePassword', JSON.stringify({ userId }));
            throw new Error('Erreur lors du changement de mot de passe');
        }
    }
    async validatePasswordStrength(password) {
        const operationId = this.logger.startOperation('validatePasswordStrength');
        try {
            const result = crypto_util_1.CryptoUtil.validatePasswordStrength(password);
            this.logger.endOperation('validatePasswordStrength', operationId, true);
            return result;
        }
        catch (error) {
            this.logger.endOperation('validatePasswordStrength', operationId, false, undefined, { errorMessage: error.message });
            this.logger.error('Failed to validate password strength', error.stack, 'PasswordService.validatePasswordStrength');
            return {
                isValid: false,
                score: 0,
                suggestions: ['Erreur validation mot de passe']
            };
        }
    }
    async checkResetRateLimit(email) {
        const key = `${this.RESET_ATTEMPTS_PREFIX}${email}`;
        const attempts = await this.redis.get(key);
        const currentAttempts = attempts ? parseInt(attempts, 10) : 0;
        if (currentAttempts >= security_constants_1.SECURITY_CONSTANTS.RATE_LIMITS.PASSWORD_RESET.MAX_ATTEMPTS) {
            this.logger.warn('Password reset rate limit exceeded', undefined, 'PasswordService.checkResetRateLimit', JSON.stringify({ email, attempts: currentAttempts }));
            throw new common_1.BadRequestException(`Trop de tentatives de réinitialisation. Réessayez dans ${security_constants_1.SECURITY_CONSTANTS.RATE_LIMITS.PASSWORD_RESET.WINDOW_MS / (60 * 1000)} minutes.`);
        }
    }
    async incrementResetAttempts(email) {
        const key = `${this.RESET_ATTEMPTS_PREFIX}${email}`;
        await this.redis.increment(key, security_constants_1.SECURITY_CONSTANTS.RATE_LIMITS.PASSWORD_RESET.WINDOW_MS / 1000);
    }
};
exports.PasswordService = PasswordService;
exports.PasswordService = PasswordService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        redis_service_1.RedisService,
        email_service_1.EmailService,
        logger_service_1.LoggerService])
], PasswordService);
//# sourceMappingURL=password.service.js.map