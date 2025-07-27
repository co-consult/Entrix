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
const config_1 = require("@nestjs/config");
const logger_service_1 = require("../../../shared/logger/logger.service");
const prisma_service_1 = require("../../../shared/prisma/prisma.service");
const redis_service_1 = require("../../../shared/redis/redis.service");
const bullmq_service_1 = require("../../../shared/bullmq/bullmq.service");
const validation_token_service_1 = require("./validation-token.service");
const crypto_util_1 = require("../utils/crypto.util");
const auth_constants_1 = require("../constants/auth.constants");
let PasswordService = class PasswordService {
    prisma;
    redis;
    configService;
    bullmq;
    validationTokenService;
    logger;
    RATE_LIMIT_PREFIX = 'password_attempts:';
    RESET_RATE_LIMIT_PREFIX = 'password_reset_rate:';
    CACHE_PREFIX = 'password_policy:';
    SECURITY_EVENT_PREFIX = 'password_security:';
    MAX_LOGIN_ATTEMPTS = 5;
    RESET_REQUESTS_PER_HOUR = 3;
    PASSWORD_CHANGE_COOLDOWN = 300;
    BREACH_CHECK_CACHE_TTL = 3600;
    constructor(prisma, redis, configService, bullmq, validationTokenService, loggerService) {
        this.prisma = prisma;
        this.redis = redis;
        this.configService = configService;
        this.bullmq = bullmq;
        this.validationTokenService = validationTokenService;
        this.logger = loggerService.createChildLogger('PasswordService');
    }
    async hashPassword(password) {
        const operationId = this.logger.startOperation('hashPassword');
        try {
            if (!password || typeof password !== 'string') {
                throw new common_1.BadRequestException('Le mot de passe doit être une chaîne non vide');
            }
            const validation = await this.validatePasswordStrength(password);
            if (!validation.isValid) {
                throw new common_1.BadRequestException(`Mot de passe trop faible : ${validation.suggestions.join(', ')}`);
            }
            const hash = await crypto_util_1.CryptoUtil.hashPassword(password);
            this.logger.endOperation('hashPassword', operationId, true);
            this.logger.info('Password hashed successfully', JSON.stringify({
                passwordLength: password.length,
                strengthScore: validation.score,
            }));
            return hash;
        }
        catch (error) {
            this.logger.endOperation('hashPassword', operationId, false);
            this.logger.error('Password hashing failed', error.stack, 'PasswordService.hashPassword', JSON.stringify({ errorMessage: error.message }));
            if (error instanceof common_1.BadRequestException) {
                throw error;
            }
            throw new Error('Erreur lors du hachage du mot de passe');
        }
    }
    async verifyPassword(password, hash) {
        const operationId = this.logger.startOperation('verifyPassword');
        try {
            if (!password || !hash) {
                this.logger.endOperation('verifyPassword', operationId, false);
                return false;
            }
            const isValid = await crypto_util_1.CryptoUtil.verifyPassword(password, hash);
            this.logger.endOperation('verifyPassword', operationId, true);
            return isValid;
        }
        catch (error) {
            this.logger.endOperation('verifyPassword', operationId, false);
            this.logger.error('Password verification failed', error.stack);
            return false;
        }
    }
    async verifyUserPassword(userId, password) {
        const operationId = this.logger.startOperation('verifyUserPassword', { userId });
        try {
            await this.checkLoginRateLimit(userId);
            const user = await this.prisma.users.findUnique({
                where: { id: userId },
                select: {
                    id: true,
                    email: true,
                    password: true,
                    is_active: true,
                    last_login: true
                }
            });
            if (!user) {
                await this.recordFailedAttempt(userId, 'user_not_found');
                this.logger.endOperation('verifyUserPassword', operationId, false);
                return false;
            }
            if (!user.is_active) {
                await this.recordFailedAttempt(userId, 'user_inactive');
                this.logger.endOperation('verifyUserPassword', operationId, false);
                return false;
            }
            const isValid = await crypto_util_1.CryptoUtil.verifyPassword(password, user.password);
            if (isValid) {
                await this.recordSuccessfulAttempt(userId);
                await this.checkPasswordRehash(userId, password, user.password);
                this.logger.logBusinessEvent('PASSWORD_VERIFICATION_SUCCESS', {
                    userId: user.id,
                    email: user.email,
                    lastLogin: user.last_login,
                }, user.id);
            }
            else {
                await this.recordFailedAttempt(userId, 'invalid_password');
                this.logger.logBusinessEvent('PASSWORD_VERIFICATION_FAILED', {
                    userId: user.id,
                    email: user.email,
                }, user.id);
            }
            this.logger.endOperation('verifyUserPassword', operationId, isValid);
            return isValid;
        }
        catch (error) {
            this.logger.endOperation('verifyUserPassword', operationId, false);
            this.logger.error('Error verifying user password', error.stack, 'PasswordService.verifyUserPassword', JSON.stringify({ userId, errorMessage: error.message }));
            await this.recordFailedAttempt(userId, 'system_error');
            return false;
        }
    }
    async verifyUserPasswordByEmail(email, password) {
        const operationId = this.logger.startOperation('verifyUserPasswordByEmail', { email });
        try {
            await this.checkEmailRateLimit(email);
            const user = await this.prisma.users.findUnique({
                where: { email: email.toLowerCase() },
                select: {
                    id: true,
                    email: true,
                    password: true,
                    is_active: true,
                    email_verified: true
                }
            });
            if (!user) {
                await this.recordFailedAttemptByEmail(email, 'user_not_found');
                this.logger.endOperation('verifyUserPasswordByEmail', operationId, false);
                return false;
            }
            if (!user.is_active) {
                await this.recordFailedAttemptByEmail(email, 'user_inactive');
                this.logger.endOperation('verifyUserPasswordByEmail', operationId, false);
                return false;
            }
            const isValid = await this.verifyUserPassword(user.id, password);
            this.logger.endOperation('verifyUserPasswordByEmail', operationId, isValid);
            return isValid;
        }
        catch (error) {
            this.logger.endOperation('verifyUserPasswordByEmail', operationId, false);
            this.logger.error('Error verifying user password by email', error.stack, 'PasswordService.verifyUserPasswordByEmail', JSON.stringify({ email, errorMessage: error.message }));
            await this.recordFailedAttemptByEmail(email, 'system_error');
            return false;
        }
    }
    async validatePasswordStrength(password) {
        const operationId = this.logger.startOperation('validatePasswordStrength');
        try {
            const basicValidation = crypto_util_1.CryptoUtil.validatePasswordStrength(password);
            const additionalChecks = await this.performAdditionalPasswordChecks(password);
            const finalScore = Math.min(100, basicValidation.score + additionalChecks.bonusPoints);
            const allSuggestions = [...basicValidation.suggestions, ...additionalChecks.suggestions];
            const validation = {
                isValid: finalScore >= auth_constants_1.AUTH_CONSTANTS.PASSWORD.MIN_STRENGTH_SCORE,
                score: finalScore,
                strength: this.getPasswordStrengthLevel(finalScore),
                suggestions: allSuggestions,
            };
            this.logger.endOperation('validatePasswordStrength', operationId, true);
            return validation;
        }
        catch (error) {
            this.logger.endOperation('validatePasswordStrength', operationId, false);
            this.logger.error('Password validation failed', error.stack);
            return {
                isValid: false,
                score: 0,
                strength: 'weak',
                suggestions: ['Erreur lors de la validation du mot de passe'],
            };
        }
    }
    async generateResetToken(email) {
        const operationId = this.logger.startOperation('generateResetToken', { email });
        try {
            await this.checkResetRateLimit(email);
            const user = await this.prisma.users.findUnique({
                where: { email: email.toLowerCase() },
                select: { id: true, is_active: true, email: true }
            });
            if (!user) {
                this.logger.warn('Password reset requested for non-existent email', JSON.stringify({ email }));
                throw new common_1.NotFoundException('Si cette adresse email existe, vous recevrez un lien de réinitialisation');
            }
            if (!user.is_active) {
                throw new common_1.ForbiddenException('Compte inactif');
            }
            const resetToken = await this.validationTokenService.createPasswordResetToken(email);
            await this.recordResetRequest(email, user.id);
            this.logger.endOperation('generateResetToken', operationId, true);
            this.logger.info('Password reset token generated', JSON.stringify({
                userId: user.id,
                email: user.email,
                tokenId: resetToken.id,
            }));
            return resetToken.token;
        }
        catch (error) {
            this.logger.endOperation('generateResetToken', operationId, false);
            if (error instanceof common_1.NotFoundException || error instanceof common_1.ForbiddenException) {
                throw error;
            }
            this.logger.error('Failed to generate reset token', error.stack, 'PasswordService.generateResetToken', JSON.stringify({ email, errorMessage: error.message }));
            throw new Error('Erreur lors de la génération du token de réinitialisation');
        }
    }
    async validateResetToken(token) {
        const operationId = this.logger.startOperation('validateResetToken');
        try {
            const validation = await this.validationTokenService.validateToken(token);
            if (!validation.isValid || !validation.token) {
                this.logger.endOperation('validateResetToken', operationId, false);
                return null;
            }
            if (validation.token.token_type !== 'PASSWORD_RESET') {
                this.logger.endOperation('validateResetToken', operationId, false);
                return null;
            }
            this.logger.endOperation('validateResetToken', operationId, true);
            return {
                id: validation.token.id,
                email: validation.token.email,
                user_id: validation.token.user_id,
                expires_at: validation.token.expires_at,
                attempt_count: validation.token.attempt_count,
                max_attempts: validation.token.max_attempts,
            };
        }
        catch (error) {
            this.logger.endOperation('validateResetToken', operationId, false);
            this.logger.error('Reset token validation failed', error.stack);
            return null;
        }
    }
    async resetPassword(token, newPassword) {
        const operationId = this.logger.startOperation('resetPassword');
        try {
            const passwordValidation = await this.validatePasswordStrength(newPassword);
            if (!passwordValidation.isValid) {
                throw new common_1.BadRequestException(`Mot de passe trop faible : ${passwordValidation.suggestions.join(', ')}`);
            }
            const result = await this.validationTokenService.resetPasswordWithToken(token, newPassword);
            if (!result.success) {
                this.logger.endOperation('resetPassword', operationId, false);
                return false;
            }
            if (result.user_id) {
                await this.recordPasswordReset(result.user_id, result.email);
                await this.scheduleSecurityNotification(result.user_id, 'password_reset_completed', {
                    email: result.email,
                    timestamp: new Date().toISOString(),
                });
            }
            this.logger.endOperation('resetPassword', operationId, true);
            this.logger.info('Password reset completed', JSON.stringify({
                userId: result.user_id,
                email: result.email,
            }));
            return true;
        }
        catch (error) {
            this.logger.endOperation('resetPassword', operationId, false);
            if (error instanceof common_1.BadRequestException) {
                throw error;
            }
            this.logger.error('Password reset failed', error.stack, 'PasswordService.resetPassword', JSON.stringify({ errorMessage: error.message }));
            throw new Error('Erreur lors de la réinitialisation du mot de passe');
        }
    }
    async changePassword(userId, oldPassword, newPassword) {
        const operationId = this.logger.startOperation('changePassword', { userId });
        try {
            await this.checkPasswordChangeCooldown(userId);
            const isOldPasswordValid = await this.verifyUserPassword(userId, oldPassword);
            if (!isOldPasswordValid) {
                throw new common_1.BadRequestException('Mot de passe actuel incorrect');
            }
            const passwordValidation = await this.validatePasswordStrength(newPassword);
            if (!passwordValidation.isValid) {
                throw new common_1.BadRequestException(`Nouveau mot de passe trop faible : ${passwordValidation.suggestions.join(', ')}`);
            }
            const isSamePassword = await crypto_util_1.CryptoUtil.verifyPassword(newPassword, await this.getUserPasswordHash(userId));
            if (isSamePassword) {
                throw new common_1.BadRequestException('Le nouveau mot de passe doit être différent de l\'ancien');
            }
            const newPasswordHash = await crypto_util_1.CryptoUtil.hashPassword(newPassword);
            await this.prisma.users.update({
                where: { id: userId },
                data: {
                    password: newPasswordHash,
                    updated_at: new Date(),
                },
            });
            await this.revokeAllUserSessions(userId);
            await this.recordPasswordChange(userId);
            await this.scheduleSecurityNotification(userId, 'password_changed', {
                timestamp: new Date().toISOString(),
            });
            await this.setPasswordChangeCooldown(userId);
            this.logger.endOperation('changePassword', operationId, true);
            this.logger.info('Password changed successfully', JSON.stringify({ userId }));
            return true;
        }
        catch (error) {
            this.logger.endOperation('changePassword', operationId, false);
            if (error instanceof common_1.BadRequestException) {
                throw error;
            }
            this.logger.error('Password change failed', error.stack, 'PasswordService.changePassword', JSON.stringify({ userId, errorMessage: error.message }));
            throw new Error('Erreur lors du changement de mot de passe');
        }
    }
    async checkLoginRateLimit(userId) {
        const key = `${this.RATE_LIMIT_PREFIX}login:${userId}`;
        const attempts = await this.redis.getCache(key) || 0;
        if (attempts >= this.MAX_LOGIN_ATTEMPTS) {
            this.logger.warn('Login rate limit exceeded', JSON.stringify({ userId, attempts }));
            throw new common_1.ForbiddenException('Trop de tentatives de connexion. Réessayez plus tard.');
        }
    }
    async checkEmailRateLimit(email) {
        const key = `${this.RATE_LIMIT_PREFIX}email:${crypto_util_1.CryptoUtil.sha256Hash(email)}`;
        const attempts = await this.redis.getCache(key) || 0;
        if (attempts >= this.MAX_LOGIN_ATTEMPTS) {
            this.logger.warn('Email rate limit exceeded', JSON.stringify({ email }));
            throw new common_1.ForbiddenException('Trop de tentatives pour cette adresse email. Réessayez plus tard.');
        }
    }
    async checkResetRateLimit(email) {
        const key = `${this.RESET_RATE_LIMIT_PREFIX}${crypto_util_1.CryptoUtil.sha256Hash(email)}`;
        const requests = await this.redis.getCache(key) || 0;
        if (requests >= this.RESET_REQUESTS_PER_HOUR) {
            this.logger.warn('Reset rate limit exceeded', JSON.stringify({ email }));
            throw new common_1.ForbiddenException('Trop de demandes de réinitialisation. Réessayez dans une heure.');
        }
        await this.redis.setCache(key, requests + 1, 3600);
    }
    async checkPasswordChangeCooldown(userId) {
        const key = `${this.RATE_LIMIT_PREFIX}change:${userId}`;
        const lastChange = await this.redis.getCache(key);
        if (lastChange) {
            const timeLeft = Math.ceil((lastChange - Date.now()) / 1000);
            if (timeLeft > 0) {
                throw new common_1.ForbiddenException(`Vous devez attendre ${timeLeft} secondes avant de pouvoir changer votre mot de passe à nouveau.`);
            }
        }
    }
    async recordFailedAttempt(userId, reason) {
        try {
            const key = `${this.RATE_LIMIT_PREFIX}login:${userId}`;
            const attempts = await this.redis.getCache(key) || 0;
            await this.redis.setCache(key, attempts + 1, 3600);
            this.logger.logSecurityEvent('FAILED_PASSWORD_ATTEMPT', JSON.stringify({
                userId,
                reason,
                attemptCount: attempts + 1,
            }), userId);
        }
        catch (error) {
            this.logger.error('Error recording failed attempt', error.stack);
        }
    }
    async recordFailedAttemptByEmail(email, reason) {
        try {
            const key = `${this.RATE_LIMIT_PREFIX}email:${crypto_util_1.CryptoUtil.sha256Hash(email)}`;
            const attempts = await this.redis.getCache(key) || 0;
            await this.redis.setCache(key, attempts + 1, 3600);
            this.logger.logSecurityEvent('FAILED_EMAIL_PASSWORD_ATTEMPT', JSON.stringify({
                email,
                reason,
                attemptCount: attempts + 1,
            }));
        }
        catch (error) {
            this.logger.error('Error recording failed attempt by email', error.stack);
        }
    }
    async recordSuccessfulAttempt(userId) {
        try {
            const loginKey = `${this.RATE_LIMIT_PREFIX}login:${userId}`;
            await this.redis.delCache(loginKey);
            this.logger.logSecurityEvent('SUCCESSFUL_PASSWORD_VERIFICATION', JSON.stringify({
                userId,
            }), userId);
        }
        catch (error) {
            this.logger.error('Error recording successful attempt', error.stack);
        }
    }
    async performAdditionalPasswordChecks(password) {
        let bonusPoints = 0;
        const suggestions = [];
        const isCompromised = await this.checkPasswordBreach(password);
        if (isCompromised) {
            bonusPoints -= 20;
            suggestions.push('Ce mot de passe a été trouvé dans des bases de données compromises');
        }
        else {
            bonusPoints += 5;
        }
        if (password.length >= 20) {
            bonusPoints += 10;
        }
        const charSets = [
            /[a-z]/, /[A-Z]/, /[0-9]/, /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/
        ];
        const uniqueCharSets = charSets.filter(regex => regex.test(password)).length;
        if (uniqueCharSets === 4) {
            bonusPoints += 5;
        }
        return { bonusPoints, suggestions };
    }
    async checkPasswordBreach(password) {
        try {
            const passwordHash = crypto_util_1.CryptoUtil.sha256Hash(password);
            const cacheKey = `${this.CACHE_PREFIX}breach:${passwordHash}`;
            const cached = await this.redis.getCache(cacheKey);
            if (cached !== null) {
                return cached;
            }
            const commonPasswords = [
                'password', '123456', 'password123', 'admin', 'qwerty',
                'letmein', 'welcome', 'monkey', '1234567890'
            ];
            const isCompromised = commonPasswords.some(common => password.toLowerCase().includes(common.toLowerCase()));
            await this.redis.setCache(cacheKey, isCompromised, this.BREACH_CHECK_CACHE_TTL);
            return isCompromised;
        }
        catch (error) {
            this.logger.error('Error checking password breach', error.stack);
            return false;
        }
    }
    getPasswordStrengthLevel(score) {
        if (score >= 80)
            return 'strong';
        if (score >= 60)
            return 'medium';
        return 'weak';
    }
    async checkPasswordRehash(userId, password, currentHash) {
        try {
            const hashInfo = currentHash.split('$');
            if (hashInfo.length >= 3) {
                const rounds = parseInt(hashInfo[2]);
                const targetRounds = 12;
                if (rounds < targetRounds) {
                    const newHash = await crypto_util_1.CryptoUtil.hashPassword(password);
                    await this.prisma.users.update({
                        where: { id: userId },
                        data: { password: newHash },
                    });
                    this.logger.info('Password rehashed for improved security', JSON.stringify({ userId }));
                }
            }
        }
        catch (error) {
            this.logger.error('Error checking password rehash', error.stack);
        }
    }
    async getUserPasswordHash(userId) {
        const user = await this.prisma.users.findUnique({
            where: { id: userId },
            select: { password: true },
        });
        if (!user) {
            throw new common_1.NotFoundException('Utilisateur non trouvé');
        }
        return user.password;
    }
    async revokeAllUserSessions(userId) {
        try {
            await this.prisma.user_sessions.updateMany({
                where: { user_id: userId },
                data: { is_active: false },
            });
            this.logger.info('All user sessions revoked', JSON.stringify({ userId }));
        }
        catch (error) {
            this.logger.error('Error revoking user sessions', error.stack);
        }
    }
    async setPasswordChangeCooldown(userId) {
        try {
            const key = `${this.RATE_LIMIT_PREFIX}change:${userId}`;
            const cooldownEnd = Date.now() + (this.PASSWORD_CHANGE_COOLDOWN * 1000);
            await this.redis.setCache(key, cooldownEnd, this.PASSWORD_CHANGE_COOLDOWN);
        }
        catch (error) {
            this.logger.error('Error setting password change cooldown', error.stack);
        }
    }
    async recordResetRequest(email, userId) {
        try {
            this.logger.logSecurityEvent('PASSWORD_RESET_REQUESTED', JSON.stringify({
                email,
                userId,
                timestamp: new Date().toISOString(),
            }), userId);
        }
        catch (error) {
            this.logger.error('Error recording reset request', error.stack);
        }
    }
    async recordPasswordReset(userId, email) {
        try {
            this.logger.logSecurityEvent('PASSWORD_RESET_COMPLETED', JSON.stringify({
                userId,
                email,
                timestamp: new Date().toISOString(),
            }), userId);
        }
        catch (error) {
            this.logger.error('Error recording password reset', error.stack);
        }
    }
    async recordPasswordChange(userId) {
        try {
            this.logger.logSecurityEvent('PASSWORD_CHANGED', JSON.stringify({
                userId,
                timestamp: new Date().toISOString(),
            }), userId);
        }
        catch (error) {
            this.logger.error('Error recording password change', error.stack);
        }
    }
    async scheduleSecurityNotification(userId, type, data) {
        try {
            await this.bullmq.addJob('SECURITY_NOTIFICATIONS', 'send_security_alert', {
                userId,
                type,
                data,
                timestamp: new Date().toISOString(),
            });
        }
        catch (error) {
            this.logger.error('Error scheduling security notification', error.stack);
        }
    }
};
exports.PasswordService = PasswordService;
exports.PasswordService = PasswordService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        redis_service_1.RedisService,
        config_1.ConfigService,
        bullmq_service_1.BullmqService,
        validation_token_service_1.ValidationTokenService,
        logger_service_1.LoggerService])
], PasswordService);
//# sourceMappingURL=password.service.js.map