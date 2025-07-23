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
const security_util_1 = require("../utils/security.util");
const auth_constants_1 = require("../constants/auth.constants");
const auth_exceptions_1 = require("../exceptions/auth.exceptions");
let PasswordService = class PasswordService {
    prisma;
    redis;
    email;
    logger;
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
            this.logger.endOperation(operationId, 'success');
            return hashedPassword;
        }
        catch (error) {
            this.logger.endOperation(operationId, 'error', error.message);
            this.logger.error('Password hashing failed', error.stack);
            throw new Error('Erreur hachage mot de passe');
        }
    }
    async verifyPassword(password, hash) {
        const operationId = this.logger.startOperation('verifyPassword');
        try {
            const isValid = await crypto_util_1.CryptoUtil.verifyPassword(password, hash);
            this.logger.endOperation(operationId, 'success');
            return isValid;
        }
        catch (error) {
            this.logger.endOperation(operationId, 'error', error.message);
            this.logger.error('Password verification failed', error.stack);
            return false;
        }
    }
    async generateResetToken(email) {
        const operationId = this.logger.startOperation('generateResetToken', { email });
        try {
            const user = await this.prisma.users.findUnique({
                where: { email: email.toLowerCase() },
                select: {
                    id: true,
                    email: true,
                    first_name: true,
                    is_active: true
                },
            });
            if (!user) {
                this.logger.warn('Password reset requested for non-existent email', JSON.stringify({ email }));
                const fakeToken = crypto_util_1.CryptoUtil.generateSecureToken(32);
                this.logger.endOperation(operationId, 'fake_token');
                return fakeToken;
            }
            if (!user.is_active) {
                this.logger.warn('Password reset requested for inactive account', JSON.stringify({
                    userId: user.id,
                    email
                }));
                throw new Error('Compte désactivé');
            }
            await this.checkResetRateLimit(email);
            await this.revokeExistingResetTokens(user.id);
            const resetToken = crypto_util_1.CryptoUtil.generateSecureToken(32);
            const expiresAt = new Date(Date.now() + auth_constants_1.AUTH_CONSTANTS.JWT.PASSWORD_RESET_TOKEN_EXPIRY * 1000);
            const resetData = {
                email: user.email,
                token: resetToken,
                expiresAt,
                used: false,
            };
            const resetKey = `password_reset:${resetToken}`;
            await this.redis.setCache(resetKey, resetData, auth_constants_1.AUTH_CONSTANTS.JWT.PASSWORD_RESET_TOKEN_EXPIRY);
            await this.sendResetEmail(user, resetToken);
            this.logger.logBusinessEvent('PASSWORD_RESET_TOKEN_GENERATED', {
                userId: user.id,
                email: user.email,
                expiresAt: expiresAt.toISOString(),
            }, user.id);
            this.logger.endOperation(operationId, 'success');
            return resetToken;
        }
        catch (error) {
            this.logger.endOperation(operationId, 'error', error.message);
            this.logger.error('Failed to generate reset token', error.stack, { email });
            throw new Error(`Erreur génération token reset: ${error.message}`);
        }
    }
    async validateResetToken(token) {
        const operationId = this.logger.startOperation('validateResetToken');
        try {
            const resetKey = `password_reset:${token}`;
            const resetData = await this.redis.getCache(resetKey);
            if (!resetData) {
                this.logger.warn('Invalid or expired reset token used', JSON.stringify({
                    tokenPrefix: token.substring(0, 8) + '...'
                }));
                this.logger.endOperation(operationId, 'token_not_found');
                return null;
            }
            if (new Date() > resetData.expiresAt) {
                await this.redis.deleteCache(resetKey);
                this.logger.warn('Expired reset token used', JSON.stringify({
                    email: resetData.email
                }));
                this.logger.endOperation(operationId, 'token_expired');
                return null;
            }
            if (resetData.used) {
                this.logger.warn('Already used reset token attempted', JSON.stringify({
                    email: resetData.email
                }));
                this.logger.endOperation(operationId, 'token_used');
                return null;
            }
            this.logger.endOperation(operationId, 'success');
            return resetData;
        }
        catch (error) {
            this.logger.endOperation(operationId, 'error', error.message);
            this.logger.error('Reset token validation failed', error.stack);
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
            const passwordValidation = security_util_1.SecurityUtil.validatePassword(newPassword);
            if (!passwordValidation.isValid) {
                throw new auth_exceptions_1.WeakPasswordException(passwordValidation.errors);
            }
            const user = await this.prisma.users.findUnique({
                where: { email: resetData.email },
                select: { id: true, email: true, password: true },
            });
            if (!user) {
                throw new auth_exceptions_1.InvalidResetTokenException();
            }
            const isSamePassword = await this.verifyPassword(newPassword, user.password);
            if (isSamePassword) {
                throw new Error('Le nouveau mot de passe doit être différent de l\'ancien');
            }
            const hashedPassword = await this.hashPassword(newPassword);
            await this.prisma.users.update({
                where: { id: user.id },
                data: {
                    password: hashedPassword,
                    updated_at: new Date(),
                },
            });
            const resetKey = `password_reset:${token}`;
            await this.redis.setCache(resetKey, { ...resetData, used: true }, 300);
            await this.revokeAllUserSessions(user.id);
            this.logger.logBusinessEvent('PASSWORD_RESET_COMPLETED', {
                userId: user.id,
                email: user.email,
                sessionsRevoked: true,
            }, user.id);
            await this.sendResetConfirmationEmail(user);
            this.logger.endOperation(operationId, 'success');
            return true;
        }
        catch (error) {
            this.logger.endOperation(operationId, 'error', error.message);
            if (error instanceof auth_exceptions_1.InvalidResetTokenException ||
                error instanceof auth_exceptions_1.WeakPasswordException) {
                throw error;
            }
            this.logger.error('Password reset failed', error.stack);
            throw new Error(`Erreur réinitialisation: ${error.message}`);
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
                    is_active: true
                },
            });
            if (!user || !user.is_active) {
                throw new Error('Utilisateur introuvable ou inactif');
            }
            const isOldPasswordValid = await this.verifyPassword(oldPassword, user.password);
            if (!isOldPasswordValid) {
                this.logger.warn('Invalid old password in change attempt', JSON.stringify({ userId }));
                throw new Error('Mot de passe actuel incorrect');
            }
            const passwordValidation = security_util_1.SecurityUtil.validatePassword(newPassword);
            if (!passwordValidation.isValid) {
                throw new auth_exceptions_1.WeakPasswordException(passwordValidation.errors);
            }
            const isSamePassword = await this.verifyPassword(newPassword, user.password);
            if (isSamePassword) {
                throw new Error('Le nouveau mot de passe doit être différent de l\'actuel');
            }
            const hashedPassword = await this.hashPassword(newPassword);
            await this.prisma.users.update({
                where: { id: userId },
                data: {
                    password: hashedPassword,
                    updated_at: new Date(),
                },
            });
            this.logger.logBusinessEvent('PASSWORD_CHANGED', {
                userId: user.id,
                email: user.email,
                strength: passwordValidation.strength,
            }, user.id);
            await this.sendPasswordChangedEmail(user);
            this.logger.endOperation(operationId, 'success');
            return true;
        }
        catch (error) {
            this.logger.endOperation(operationId, 'error', error.message);
            if (error instanceof auth_exceptions_1.WeakPasswordException) {
                throw error;
            }
            this.logger.error('Password change failed', error.stack, { userId });
            throw new Error(`Erreur changement mot de passe: ${error.message}`);
        }
    }
    async validatePasswordStrength(password) {
        return security_util_1.SecurityUtil.validatePassword(password);
    }
    async checkResetRateLimit(email) {
        const rateLimitKey = `reset_rate_limit:${email}`;
        const attempts = await this.redis.getCache(rateLimitKey) || 0;
        if (attempts >= 3) {
            throw new Error('Trop de demandes de réinitialisation. Réessayez dans 1 heure.');
        }
        await this.redis.setCache(rateLimitKey, attempts + 1, 3600);
    }
    async revokeExistingResetTokens(userId) {
        try {
            const pattern = `password_reset:*`;
        }
        catch (error) {
            this.logger.warn('Failed to revoke existing reset tokens', JSON.stringify({
                userId,
                error: error.message
            }));
        }
    }
    async revokeAllUserSessions(userId) {
        try {
            await this.prisma.user_sessions.updateMany({
                where: {
                    user_id: userId,
                    is_active: true,
                },
                data: {
                    is_active: false,
                    updated_at: new Date(),
                },
            });
        }
        catch (error) {
            this.logger.error('Failed to revoke user sessions after password reset', error.stack, JSON.stringify({ userId }));
        }
    }
    async sendResetEmail(user, resetToken) {
        try {
            await this.email.sendPasswordResetEmail(user.email, JSON.stringify({
                firstName: user.first_name,
                resetLink: `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`,
                verificationCode: resetToken.substring(0, 8).toUpperCase(),
                expiryDuration: '1 heure',
                requestDate: new Date().toLocaleString('fr-FR'),
                ipAddress: 'unknown',
                location: 'Tunisie',
                deviceInfo: 'Navigateur web',
            }));
        }
        catch (error) {
            this.logger.error('Failed to send reset email', error.stack, JSON.stringify({
                userId: user.id
            }));
        }
    }
    async sendResetConfirmationEmail(user) {
        try {
            this.logger.info('Password reset confirmation email sent', JSON.stringify({
                userId: user.id
            }));
        }
        catch (error) {
            this.logger.error('Failed to send reset confirmation email', error.stack, JSON.stringify({
                userId: user.id
            }));
        }
    }
    async sendPasswordChangedEmail(user) {
        try {
            this.logger.info('Password changed notification email sent', JSON.stringify({
                userId: user.id
            }));
        }
        catch (error) {
            this.logger.error('Failed to send password changed email', error.stack, JSON.stringify({
                userId: user.id
            }));
        }
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