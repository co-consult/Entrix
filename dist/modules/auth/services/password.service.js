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
let PasswordService = class PasswordService {
    prisma;
    redis;
    email;
    logger;
    RESET_TOKEN_PREFIX = 'password_reset:';
    RATE_LIMIT_PREFIX = 'password_reset_attempts:';
    constructor(prisma, redis, email, loggerService) {
        this.prisma = prisma;
        this.redis = redis;
        this.email = email;
        this.logger = loggerService.createChildLogger('PasswordService');
    }
    async hashPassword(password) {
        const operationId = this.logger.startOperation('hashPassword');
        try {
            if (!password || typeof password !== 'string') {
                throw new common_1.BadRequestException('Le mot de passe doit être une chaîne non vide');
            }
            const hash = await crypto_util_1.CryptoUtil.hashPassword(password);
            this.logger.endOperation('hashPassword', operationId, true);
            return hash;
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
            if (!password || !hash) {
                this.logger.endOperation('verifyPassword', operationId, false, undefined, { reason: 'missing_parameters' });
                return false;
            }
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
    async verifyUserPassword(userId, password) {
        const operationId = this.logger.startOperation('verifyUserPassword', { userId });
        try {
            console.log('🔍 DEBUG verifyUserPassword - Vérification pour user:', userId);
            const user = await this.prisma.users.findUnique({
                where: { id: userId },
                select: {
                    id: true,
                    password: true,
                    is_active: true,
                    email: true
                }
            });
            if (!user) {
                console.log('🔍 DEBUG verifyUserPassword - User not found:', userId);
                this.logger.endOperation('verifyUserPassword', operationId, false, undefined, { reason: 'user_not_found' });
                return false;
            }
            if (!user.is_active) {
                console.log('🔍 DEBUG verifyUserPassword - User inactive:', userId);
                this.logger.endOperation('verifyUserPassword', operationId, false, undefined, { reason: 'user_inactive' });
                return false;
            }
            console.log('🔍 DEBUG verifyUserPassword - User trouvé, vérification password');
            console.log('🔍 DEBUG verifyUserPassword - Password input length:', password.length);
            console.log('🔍 DEBUG verifyUserPassword - Hash from DB length:', user.password.length);
            const isValid = await crypto_util_1.CryptoUtil.verifyPassword(password, user.password);
            console.log('🔍 DEBUG verifyUserPassword - Résultat verification:', isValid);
            this.logger.logBusinessEvent('PASSWORD_VERIFICATION', {
                userId: user.id,
                email: user.email,
                success: isValid,
            }, user.id);
            this.logger.endOperation('verifyUserPassword', operationId, true);
            return isValid;
        }
        catch (error) {
            console.log('🔍 DEBUG verifyUserPassword - Erreur:', error.message);
            this.logger.endOperation('verifyUserPassword', operationId, false, undefined, { error: error.message });
            this.logger.error(`Error verifying password for user ${userId}:`, error);
            return false;
        }
    }
    async validatePasswordStrength(password) {
        const operationId = this.logger.startOperation('validatePasswordStrength');
        try {
            const validation = crypto_util_1.CryptoUtil.validatePasswordStrength(password);
            this.logger.endOperation('validatePasswordStrength', operationId, true);
            return {
                isValid: validation.isValid,
                score: validation.score,
                strength: validation.score >= 80 ? 'strong' : validation.score >= 50 ? 'medium' : 'weak',
                suggestions: validation.suggestions
            };
        }
        catch (error) {
            this.logger.endOperation('validatePasswordStrength', operationId, false, undefined, { error: error.message });
            this.logger.error('Password strength validation failed', error.stack);
            return {
                isValid: false,
                score: 0,
                strength: 'weak',
                suggestions: ['Erreur lors de la validation du mot de passe']
            };
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
            await this.email.sendEmail({
                to: user.email,
                subject: 'Réinitialisation de votre mot de passe - Entrix',
                template: 'password-reset',
                context: {
                    firstName: user.first_name,
                    lastName: user.last_name,
                    resetToken,
                    resetUrl: `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`,
                    expiresIn: '1 heure',
                    timestamp: new Date().toISOString(),
                },
            });
            await this.incrementResetAttempts(email);
            this.logger.logBusinessEvent('PASSWORD_RESET_REQUESTED', {
                userId: user.id,
                email: user.email,
            }, user.id);
            this.logger.endOperation('generateResetToken', operationId, true);
            return resetToken;
        }
        catch (error) {
            this.logger.endOperation('generateResetToken', operationId, false, undefined, { error: error.message });
            if (error instanceof common_1.BadRequestException) {
                throw error;
            }
            this.logger.error('Reset token generation failed', error.stack, 'PasswordService.generateResetToken');
            throw new Error('Erreur lors de la génération du token de réinitialisation');
        }
    }
    async validateResetToken(token) {
        const operationId = this.logger.startOperation('validateResetToken');
        try {
            const resetDataRaw = await this.redis.getCache(`${this.RESET_TOKEN_PREFIX}${token}`);
            if (!resetDataRaw) {
                this.logger.endOperation('validateResetToken', operationId, true);
                return null;
            }
            const resetData = resetDataRaw;
            if (!resetData.email || !resetData.token || !resetData.expiresAt) {
                this.logger.warn('Invalid reset data structure', JSON.stringify({
                    hasEmail: !!resetData.email,
                    hasToken: !!resetData.token,
                    hasExpiresAt: !!resetData.expiresAt
                }));
                this.logger.endOperation('validateResetToken', operationId, true);
                return null;
            }
            const expirationDate = new Date(resetData.expiresAt);
            if (resetData.used || expirationDate < new Date()) {
                this.logger.endOperation('validateResetToken', operationId, true);
                return null;
            }
            this.logger.endOperation('validateResetToken', operationId, true);
            return resetData;
        }
        catch (error) {
            this.logger.endOperation('validateResetToken', operationId, false, undefined, { error: error.message });
            this.logger.error('Reset token validation failed', error.stack);
            return null;
        }
    }
    async resetPassword(token, newPassword) {
        const operationId = this.logger.startOperation('resetPassword');
        try {
            const resetData = await this.validateResetToken(token);
            if (!resetData) {
                throw new common_1.BadRequestException('Token de réinitialisation invalide ou expiré');
            }
            const validation = await this.validatePasswordStrength(newPassword);
            if (!validation.isValid) {
                throw new common_1.BadRequestException(`Mot de passe trop faible: ${validation.suggestions.join(', ')}`);
            }
            const hashedPassword = await this.hashPassword(newPassword);
            const user = await this.prisma.users.update({
                where: { email: resetData.email },
                data: {
                    password: hashedPassword,
                    updated_at: new Date(),
                },
                select: { id: true, email: true }
            });
            const updatedResetData = {
                ...resetData,
                used: true,
            };
            await this.redis.setCache(`${this.RESET_TOKEN_PREFIX}${token}`, updatedResetData, 300);
            this.logger.logBusinessEvent('PASSWORD_RESET_COMPLETED', {
                userId: user.id,
                email: user.email,
            }, user.id);
            this.logger.endOperation('resetPassword', operationId, true);
            return true;
        }
        catch (error) {
            this.logger.endOperation('resetPassword', operationId, false, undefined, { error: error.message });
            if (error instanceof common_1.BadRequestException) {
                throw error;
            }
            this.logger.error('Password reset failed', error.stack);
            throw new Error('Erreur lors de la réinitialisation du mot de passe');
        }
    }
    async changePassword(userId, oldPassword, newPassword) {
        const operationId = this.logger.startOperation('changePassword', { userId });
        try {
            const isCurrentPasswordValid = await this.verifyUserPassword(userId, oldPassword);
            if (!isCurrentPasswordValid) {
                throw new common_1.BadRequestException('Mot de passe actuel incorrect');
            }
            const validation = await this.validatePasswordStrength(newPassword);
            if (!validation.isValid) {
                throw new common_1.BadRequestException(`Nouveau mot de passe trop faible: ${validation.suggestions.join(', ')}`);
            }
            const isSamePassword = await this.verifyUserPassword(userId, newPassword);
            if (isSamePassword) {
                throw new common_1.BadRequestException('Le nouveau mot de passe doit être différent de l\'ancien');
            }
            const hashedNewPassword = await this.hashPassword(newPassword);
            const user = await this.prisma.users.update({
                where: { id: userId },
                data: {
                    password: hashedNewPassword,
                    updated_at: new Date(),
                },
                select: { id: true, email: true }
            });
            this.logger.logBusinessEvent('PASSWORD_CHANGED', {
                userId: user.id,
                email: user.email,
            }, user.id);
            this.logger.endOperation('changePassword', operationId, true);
            return true;
        }
        catch (error) {
            this.logger.endOperation('changePassword', operationId, false, undefined, { error: error.message });
            if (error instanceof common_1.BadRequestException) {
                throw error;
            }
            this.logger.error('Password change failed', error.stack);
            throw new Error('Erreur lors du changement de mot de passe');
        }
    }
    async checkResetRateLimit(email) {
        const key = `${this.RATE_LIMIT_PREFIX}${email}`;
        const attemptsRaw = await this.redis.getCache(key);
        const attempts = typeof attemptsRaw === 'number' ? attemptsRaw : 0;
        const maxAttempts = 3;
        if (attempts >= maxAttempts) {
            throw new common_1.BadRequestException('Trop de tentatives de réinitialisation. Réessayez plus tard.');
        }
    }
    async incrementResetAttempts(email) {
        const key = `${this.RATE_LIMIT_PREFIX}${email}`;
        const attemptsRaw = await this.redis.getCache(key);
        const attempts = typeof attemptsRaw === 'number' ? attemptsRaw : 0;
        await this.redis.setCache(key, attempts + 1, 3600);
    }
    async verifyUserPasswordByEmail(email, password) {
        const operationId = this.logger.startOperation('verifyUserPasswordByEmail', { email });
        try {
            const user = await this.prisma.users.findUnique({
                where: { email: email.toLowerCase() },
                select: {
                    id: true,
                    email: true,
                    password: true,
                    is_active: true
                }
            });
            if (!user) {
                this.logger.warn('User not found for password verification', JSON.stringify({ email }));
                this.logger.endOperation('verifyUserPasswordByEmail', operationId, false);
                return false;
            }
            if (!user.is_active) {
                this.logger.warn('Inactive user attempted password verification', JSON.stringify({ email }));
                this.logger.endOperation('verifyUserPasswordByEmail', operationId, false);
                return false;
            }
            const isValid = await crypto_util_1.CryptoUtil.verifyPassword(password, user.password);
            this.logger.logBusinessEvent('PASSWORD_VERIFICATION', {
                userId: user.id,
                email: user.email,
                success: isValid,
            }, user.id);
            this.logger.endOperation('verifyUserPasswordByEmail', operationId, isValid);
            return isValid;
        }
        catch (error) {
            this.logger.endOperation('verifyUserPasswordByEmail', operationId, false, undefined, {
                error: error.message
            });
            this.logger.error('Password verification failed', error.stack, 'PasswordService.verifyUserPasswordByEmail', JSON.stringify({
                email,
                error: error.message,
            }));
            return false;
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