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
exports.ValidationTokenService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../../../shared/prisma/prisma.service");
const redis_service_1 = require("../../../shared/redis/redis.service");
const logger_service_1 = require("../../../shared/logger/logger.service");
const hashing_service_1 = require("../../../shared/hashing/hashing.service");
const bullmq_service_1 = require("../../../shared/bullmq/bullmq.service");
const validation_token_interface_1 = require("../interfaces/validation-token.interface");
let ValidationTokenService = class ValidationTokenService {
    prisma;
    redis;
    configService;
    hashingService;
    bullmq;
    logger;
    CACHE_PREFIX = 'validation_token:';
    RATE_LIMIT_PREFIX = 'validation_rate:';
    CACHE_TTL = 300;
    constructor(prisma, redis, configService, hashingService, bullmq, loggerService) {
        this.prisma = prisma;
        this.redis = redis;
        this.configService = configService;
        this.hashingService = hashingService;
        this.bullmq = bullmq;
        this.logger = loggerService.createChildLogger('ValidationTokenService');
    }
    async createEmailVerificationToken(email, userId, type = 'registration') {
        const operationId = this.logger.startOperation('createEmailVerificationToken', { email, type });
        try {
            await this.checkRateLimit(email, 'EMAIL_VERIFICATION');
            await this.revokeExistingTokens(email, 'EMAIL_VERIFICATION');
            const tokenData = {
                user_id: userId,
                email: email,
                token_type: 'EMAIL_VERIFICATION',
                expires_in_minutes: validation_token_interface_1.VALIDATION_TOKEN_DURATIONS.EMAIL_VERIFICATION,
                max_attempts: validation_token_interface_1.VALIDATION_TOKEN_ATTEMPT_LIMITS.EMAIL_VERIFICATION,
                verification_data: {
                    verification_type: type,
                },
            };
            const result = await this.createToken(tokenData);
            await this.scheduleEmailSending(result);
            this.logger.endOperation('createEmailVerificationToken', operationId, true);
            return result;
        }
        catch (error) {
            this.logger.endOperation('createEmailVerificationToken', operationId, false);
            throw error;
        }
    }
    async createPasswordResetToken(email) {
        const operationId = this.logger.startOperation('createPasswordResetToken', { email });
        try {
            await this.checkRateLimit(email, 'PASSWORD_RESET', { limit: 3, windowMinutes: 60 });
            const user = await this.prisma.users.findUnique({
                where: { email },
                select: { id: true, is_active: true, password: true },
            });
            if (!user) {
                this.logger.warn('Password reset requested for non-existent email', JSON.stringify({ email }));
                return this.createDummyToken(email, 'PASSWORD_RESET');
            }
            if (!user.is_active) {
                throw new Error('Account is inactive');
            }
            await this.revokeExistingTokens(email, 'PASSWORD_RESET');
            const tokenData = {
                user_id: user.id,
                email: email,
                token_type: 'PASSWORD_RESET',
                expires_in_minutes: validation_token_interface_1.VALIDATION_TOKEN_DURATIONS.PASSWORD_RESET,
                max_attempts: validation_token_interface_1.VALIDATION_TOKEN_ATTEMPT_LIMITS.PASSWORD_RESET,
                reset_password_data: {
                    current_password_hash: user.password,
                    requires_old_password: false,
                },
            };
            const result = await this.createToken(tokenData);
            await this.scheduleEmailSending(result);
            this.logger.endOperation('createPasswordResetToken', operationId, true);
            return result;
        }
        catch (error) {
            this.logger.endOperation('createPasswordResetToken', operationId, false);
            throw error;
        }
    }
    async createInvitationToken(email, invitationData) {
        const operationId = this.logger.startOperation('createInvitationToken', { email });
        try {
            const existingUser = await this.prisma.users.findUnique({
                where: { email },
                select: { id: true },
            });
            if (existingUser) {
                throw new Error('User with this email already exists');
            }
            await this.checkRateLimit(email, 'INVITATION_USER');
            const tokenData = {
                email: email,
                token_type: 'INVITATION_USER',
                expires_in_minutes: validation_token_interface_1.VALIDATION_TOKEN_DURATIONS.INVITATION_USER,
                max_attempts: validation_token_interface_1.VALIDATION_TOKEN_ATTEMPT_LIMITS.INVITATION_USER,
                invitation_data: {
                    inviter_id: invitationData.inviter_id,
                    inviter_name: invitationData.inviter_name,
                    organization_id: invitationData.organization_id,
                    role: invitationData.role || 'USER',
                    group_id: invitationData.group_id,
                    permissions: invitationData.permissions || [],
                    welcome_message: invitationData.welcome_message,
                },
            };
            const result = await this.createToken(tokenData);
            await this.scheduleInvitationEmail(result);
            this.logger.endOperation('createInvitationToken', operationId, true);
            return result;
        }
        catch (error) {
            this.logger.endOperation('createInvitationToken', operationId, false);
            throw error;
        }
    }
    async createMagicLinkToken(email, action, linkData) {
        const operationId = this.logger.startOperation('createMagicLinkToken', { email, action });
        try {
            await this.checkRateLimit(email, 'MAGIC_LINK_LOGIN');
            const tokenData = {
                email: email,
                token_type: action === 'login' ? 'MAGIC_LINK_LOGIN' : 'MAGIC_LINK_ACTION',
                expires_in_minutes: action === 'login'
                    ? validation_token_interface_1.VALIDATION_TOKEN_DURATIONS.MAGIC_LINK_LOGIN
                    : validation_token_interface_1.VALIDATION_TOKEN_DURATIONS.MAGIC_LINK_ACTION,
                max_attempts: action === 'login'
                    ? validation_token_interface_1.VALIDATION_TOKEN_ATTEMPT_LIMITS.MAGIC_LINK_LOGIN
                    : validation_token_interface_1.VALIDATION_TOKEN_ATTEMPT_LIMITS.MAGIC_LINK_ACTION,
                magic_link_data: {
                    action: action,
                    redirect_url: linkData?.redirect_url,
                    expires_after_use: linkData?.expires_after_use !== false,
                    one_time_use: linkData?.one_time_use !== false,
                    context_data: linkData?.context_data || {},
                },
            };
            const result = await this.createToken(tokenData);
            await this.scheduleMagicLinkEmail(result);
            this.logger.endOperation('createMagicLinkToken', operationId, true);
            return result;
        }
        catch (error) {
            this.logger.endOperation('createMagicLinkToken', operationId, false);
            throw error;
        }
    }
    async createPhoneVerificationToken(phone, userId) {
        const operationId = this.logger.startOperation('createPhoneVerificationToken', { phone });
        try {
            const shortToken = this.generateNumericToken(6);
            const tokenData = {
                user_id: userId,
                email: phone,
                token_type: 'PHONE_VERIFICATION',
                expires_in_minutes: validation_token_interface_1.VALIDATION_TOKEN_DURATIONS.PHONE_VERIFICATION,
                max_attempts: validation_token_interface_1.VALIDATION_TOKEN_ATTEMPT_LIMITS.PHONE_VERIFICATION,
            };
            const result = await this.createTokenWithCustomCode(tokenData, shortToken);
            await this.scheduleSMSSending(result, phone);
            this.logger.endOperation('createPhoneVerificationToken', operationId, true);
            return result;
        }
        catch (error) {
            this.logger.endOperation('createPhoneVerificationToken', operationId, false);
            throw error;
        }
    }
    async validateToken(token) {
        const operationId = this.logger.startOperation('validateToken');
        try {
            const tokenHash = await this.hashingService.hashPassword(token);
            const validationToken = await this.prisma.validation_tokens.findUnique({
                where: { token_hash: tokenHash },
                include: { users: { select: { id: true, is_active: true } } },
            });
            if (!validationToken) {
                return {
                    isValid: false,
                    errors: [{ code: validation_token_interface_1.ValidationTokenErrorCode.TOKEN_NOT_FOUND, message: 'Token not found' }],
                };
            }
            const errors = [];
            if (validationToken.is_used) {
                errors.push({
                    code: validation_token_interface_1.ValidationTokenErrorCode.TOKEN_USED,
                    message: 'Token has already been used'
                });
            }
            if (validationToken.expires_at < new Date()) {
                errors.push({
                    code: validation_token_interface_1.ValidationTokenErrorCode.TOKEN_EXPIRED,
                    message: 'Token has expired'
                });
            }
            if (validationToken.is_blocked) {
                errors.push({
                    code: validation_token_interface_1.ValidationTokenErrorCode.TOKEN_BLOCKED,
                    message: 'Token is blocked due to too many failed attempts'
                });
            }
            if (validationToken.user_id && !validationToken.users?.is_active) {
                errors.push({
                    code: validation_token_interface_1.ValidationTokenErrorCode.USER_NOT_FOUND,
                    message: 'Associated user account is inactive'
                });
            }
            const isValid = errors.length === 0;
            const attemptsRemaining = Math.max(0, validationToken.max_attempts - validationToken.attempt_count);
            const validation = {
                isValid,
                token: isValid ? validationToken : undefined,
                errors: errors.length > 0 ? errors : undefined,
                attempts_remaining: attemptsRemaining,
                is_blocked: validationToken.is_blocked,
                expires_at: validationToken.expires_at,
                can_resend: await this.canResendToken(validationToken.email, validationToken.token_type),
            };
            this.logger.endOperation('validateToken', operationId, true);
            return validation;
        }
        catch (error) {
            this.logger.endOperation('validateToken', operationId, false);
            this.logger.error('Failed to validate token', error.stack, 'ValidationTokenService.validateToken', JSON.stringify({ errorMessage: error.message }));
            return {
                isValid: false,
                errors: [{ code: 'INTERNAL_ERROR', message: 'Internal validation error' }],
            };
        }
    }
    async useToken(token, clientInfo) {
        const operationId = this.logger.startOperation('useToken');
        try {
            const validation = await this.validateToken(token);
            if (!validation.isValid || !validation.token) {
                return {
                    success: false,
                    errors: validation.errors || [{
                            code: validation_token_interface_1.ValidationTokenErrorCode.TOKEN_NOT_FOUND,
                            message: 'Invalid token'
                        }],
                };
            }
            const validationToken = validation.token;
            const usedToken = await this.prisma.validation_tokens.update({
                where: { id: validationToken.id },
                data: {
                    is_used: true,
                    used_at: new Date(),
                    used_ip: clientInfo?.ip_address || null,
                    updated_at: new Date(),
                },
            });
            await this.invalidateTokenCache(validationToken.id);
            const result = {
                success: true,
                token: usedToken,
                user_id: usedToken.user_id,
                email: usedToken.email,
                action_data: this.extractActionData(usedToken),
            };
            this.logger.endOperation('useToken', operationId, true);
            this.logger.info('Validation token used', JSON.stringify({
                tokenId: usedToken.id,
                type: usedToken.token_type,
                email: usedToken.email,
            }));
            return result;
        }
        catch (error) {
            this.logger.endOperation('useToken', operationId, false);
            this.logger.error('Failed to use token', error.stack, 'ValidationTokenService.useToken', JSON.stringify({ errorMessage: error.message }));
            return {
                success: false,
                errors: [{ code: 'INTERNAL_ERROR', message: 'Internal error during token usage' }],
            };
        }
    }
    async verifyEmailWithToken(token) {
        const result = await this.useToken(token);
        if (result.success && result.token?.token_type === 'EMAIL_VERIFICATION') {
            if (result.user_id) {
                await this.prisma.users.update({
                    where: { id: result.user_id },
                    data: {
                        email_verified: true,
                        updated_at: new Date(),
                    },
                });
            }
            result.next_steps = ['Email successfully verified', 'You can now access all features'];
        }
        return result;
    }
    async resetPasswordWithToken(token, newPassword) {
        const operationId = this.logger.startOperation('resetPasswordWithToken');
        try {
            const result = await this.useToken(token);
            if (result.success && result.token?.token_type === 'PASSWORD_RESET' && result.user_id) {
                const hashedPassword = await this.hashingService.hashPassword(newPassword);
                await this.prisma.users.update({
                    where: { id: result.user_id },
                    data: {
                        password: hashedPassword,
                        updated_at: new Date(),
                    },
                });
                await this.prisma.user_sessions.updateMany({
                    where: { user_id: result.user_id },
                    data: { is_active: false },
                });
                result.next_steps = [
                    'Password successfully updated',
                    'All existing sessions have been logged out for security',
                    'Please log in with your new password'
                ];
                this.logger.info('Password reset completed', JSON.stringify({
                    userId: result.user_id,
                    email: result.email,
                }));
            }
            this.logger.endOperation('resetPasswordWithToken', operationId, true);
            return result;
        }
        catch (error) {
            this.logger.endOperation('resetPasswordWithToken', operationId, false);
            throw error;
        }
    }
    async acceptInvitationWithToken(token, userData) {
        const operationId = this.logger.startOperation('acceptInvitationWithToken');
        try {
            const result = await this.useToken(token);
            if (result.success &&
                result.token?.token_type === 'INVITATION_USER' &&
                result.token.invitation_data) {
                const invitationData = result.token.invitation_data;
                if (userData && userData.password) {
                    const hashedPassword = await this.hashingService.hashPassword(userData.password);
                    const newUser = await this.prisma.users.create({
                        data: {
                            email: result.email,
                            password: hashedPassword,
                            first_name: userData.firstName || 'User',
                            last_name: userData.lastName || 'User',
                            is_active: true,
                            email_verified: true,
                        },
                    });
                    if (invitationData.role) {
                    }
                    result.user_id = newUser.id;
                    result.next_steps = [
                        'Account created successfully',
                        'You have been assigned the appropriate role',
                        'You can now log in with your credentials'
                    ];
                }
                this.logger.info('Invitation accepted', JSON.stringify({
                    email: result.email,
                    inviterId: invitationData.inviter_id,
                    role: invitationData.role,
                }));
            }
            this.logger.endOperation('acceptInvitationWithToken', operationId, true);
            return result;
        }
        catch (error) {
            this.logger.endOperation('acceptInvitationWithToken', operationId, false);
            throw error;
        }
    }
    async useMagicLink(token, clientInfo) {
        const result = await this.useToken(token, clientInfo);
        if (result.success && result.token?.magic_link_data) {
            const magicLinkData = result.token.magic_link_data;
            result.action_data = {
                action: magicLinkData.action,
                redirect_url: magicLinkData.redirect_url,
                context_data: magicLinkData.context_data,
            };
            if (magicLinkData.action === 'login' && result.user_id) {
                result.next_steps = [
                    'Magic link authentication successful',
                    'You will be automatically logged in'
                ];
            }
        }
        return result;
    }
    async recordAttempt(tokenId, success, clientInfo) {
        try {
            const token = await this.prisma.validation_tokens.findUnique({
                where: { id: tokenId },
                select: { attempt_count: true, max_attempts: true, is_blocked: true },
            });
            if (!token)
                return;
            const newAttemptCount = token.attempt_count + 1;
            const shouldBlock = !success && newAttemptCount >= token.max_attempts;
            await this.prisma.validation_tokens.update({
                where: { id: tokenId },
                data: {
                    attempt_count: newAttemptCount,
                    is_blocked: shouldBlock || token.is_blocked,
                    blocked_at: shouldBlock ? new Date() : undefined,
                    updated_at: new Date(),
                },
            });
            if (shouldBlock) {
                this.logger.warn('Token blocked due to max attempts', JSON.stringify({
                    tokenId,
                    attempts: newAttemptCount,
                }));
            }
        }
        catch (error) {
            this.logger.error('Error recording token attempt', error.stack);
        }
    }
    async blockToken(tokenId, reason) {
        try {
            await this.prisma.validation_tokens.update({
                where: { id: tokenId },
                data: {
                    is_blocked: true,
                    blocked_at: new Date(),
                    metadata: { block_reason: reason },
                    updated_at: new Date(),
                },
            });
            await this.invalidateTokenCache(tokenId);
            return true;
        }
        catch (error) {
            this.logger.error('Error blocking token', error.stack);
            return false;
        }
    }
    async unblockToken(tokenId) {
        try {
            await this.prisma.validation_tokens.update({
                where: { id: tokenId },
                data: {
                    is_blocked: false,
                    blocked_at: null,
                    attempt_count: 0,
                    updated_at: new Date(),
                },
            });
            await this.invalidateTokenCache(tokenId);
            return true;
        }
        catch (error) {
            this.logger.error('Error unblocking token', error.stack);
            return false;
        }
    }
    async getToken(tokenId) {
        try {
            return await this.prisma.validation_tokens.findUnique({
                where: { id: tokenId },
            });
        }
        catch (error) {
            this.logger.error('Error getting token', error.stack);
            return null;
        }
    }
    async getTokenByHash(tokenHash) {
        try {
            return await this.prisma.validation_tokens.findUnique({
                where: { token_hash: tokenHash },
            });
        }
        catch (error) {
            this.logger.error('Error getting token by hash', error.stack);
            return null;
        }
    }
    async getUserTokens(userId, type) {
        try {
            const whereClause = { user_id: userId };
            if (type)
                whereClause.token_type = type;
            return await this.prisma.validation_tokens.findMany({
                where: whereClause,
                orderBy: { created_at: 'desc' },
            });
        }
        catch (error) {
            this.logger.error('Error getting user tokens', error.stack);
            return [];
        }
    }
    async getEmailTokens(email, type) {
        try {
            const whereClause = { email };
            if (type)
                whereClause.token_type = type;
            return await this.prisma.validation_tokens.findMany({
                where: whereClause,
                orderBy: { created_at: 'desc' },
            });
        }
        catch (error) {
            this.logger.error('Error getting email tokens', error.stack);
            return [];
        }
    }
    async resendToken(originalTokenId) {
        const operationId = this.logger.startOperation('resendToken', { originalTokenId });
        try {
            const originalToken = await this.prisma.validation_tokens.findUnique({
                where: { id: originalTokenId },
            });
            if (!originalToken) {
                throw new Error('Original token not found');
            }
            const canResend = await this.canResendToken(originalToken.email, originalToken.token_type);
            if (!canResend) {
                throw new Error('Cannot resend token due to rate limiting');
            }
            await this.revokeToken(originalTokenId);
            const tokenData = {
                user_id: originalToken.user_id,
                email: originalToken.email,
                token_type: originalToken.token_type,
                expires_in_minutes: validation_token_interface_1.VALIDATION_TOKEN_DURATIONS[originalToken.token_type],
                max_attempts: validation_token_interface_1.VALIDATION_TOKEN_ATTEMPT_LIMITS[originalToken.token_type],
                verification_data: originalToken.verification_data,
                reset_password_data: originalToken.reset_password_data,
                invitation_data: originalToken.invitation_data,
                magic_link_data: originalToken.magic_link_data,
            };
            const newToken = await this.createToken(tokenData);
            this.logger.endOperation('resendToken', operationId, true);
            return newToken;
        }
        catch (error) {
            this.logger.endOperation('resendToken', operationId, false);
            throw error;
        }
    }
    async extendTokenExpiry(tokenId, additionalMinutes) {
        const operationId = this.logger.startOperation('extendTokenExpiry', { tokenId, additionalMinutes });
        try {
            const token = await this.prisma.validation_tokens.findUnique({
                where: { id: tokenId },
                select: { expires_at: true, is_used: true, is_blocked: true },
            });
            if (!token) {
                this.logger.endOperation('extendTokenExpiry', operationId, false);
                return false;
            }
            if (token.is_used || token.is_blocked) {
                this.logger.endOperation('extendTokenExpiry', operationId, false);
                return false;
            }
            const newExpiryDate = new Date(token.expires_at.getTime() + additionalMinutes * 60 * 1000);
            await this.prisma.validation_tokens.update({
                where: { id: tokenId },
                data: {
                    expires_at: newExpiryDate,
                    updated_at: new Date(),
                },
            });
            await this.invalidateTokenCache(tokenId);
            this.logger.endOperation('extendTokenExpiry', operationId, true);
            this.logger.info('Token expiry extended', JSON.stringify({
                tokenId,
                additionalMinutes,
                newExpiryDate: newExpiryDate.toISOString(),
            }));
            return true;
        }
        catch (error) {
            this.logger.endOperation('extendTokenExpiry', operationId, false);
            this.logger.error('Failed to extend token expiry', error.stack, 'ValidationTokenService.extendTokenExpiry', JSON.stringify({ errorMessage: error.message, tokenId }));
            return false;
        }
    }
    async revokeToken(tokenId) {
        try {
            await this.prisma.validation_tokens.update({
                where: { id: tokenId },
                data: {
                    is_used: true,
                    used_at: new Date(),
                    updated_at: new Date(),
                },
            });
            await this.invalidateTokenCache(tokenId);
            return true;
        }
        catch (error) {
            this.logger.error('Error revoking token', error.stack);
            return false;
        }
    }
    async revokeUserTokens(userId, type) {
        try {
            const whereClause = {
                user_id: userId,
                is_used: false
            };
            if (type)
                whereClause.token_type = type;
            const result = await this.prisma.validation_tokens.updateMany({
                where: whereClause,
                data: {
                    is_used: true,
                    used_at: new Date(),
                    updated_at: new Date(),
                },
            });
            return result.count;
        }
        catch (error) {
            this.logger.error('Error revoking user tokens', error.stack);
            return 0;
        }
    }
    async getTokenStats(userId) {
        try {
            const whereClause = userId ? { user_id: userId } : {};
            const [total, active, used, expired, blocked, byType] = await Promise.all([
                this.prisma.validation_tokens.count({ where: whereClause }),
                this.prisma.validation_tokens.count({
                    where: {
                        ...whereClause,
                        is_used: false,
                        is_blocked: false,
                        expires_at: { gt: new Date() }
                    }
                }),
                this.prisma.validation_tokens.count({
                    where: { ...whereClause, is_used: true }
                }),
                this.prisma.validation_tokens.count({
                    where: {
                        ...whereClause,
                        expires_at: { lt: new Date() }
                    }
                }),
                this.prisma.validation_tokens.count({
                    where: { ...whereClause, is_blocked: true }
                }),
                this.getTokenCountByType(userId),
            ]);
            const successRate = total > 0 ? (used / total) * 100 : 0;
            const recentActivity = await this.getRecentTokenActivity(userId);
            return {
                total,
                active,
                used,
                expired,
                blocked,
                by_type: byType,
                success_rate: Math.round(successRate * 100) / 100,
                average_usage_time: 0,
                recent_activity: recentActivity,
            };
        }
        catch (error) {
            this.logger.error('Error getting token stats', error.stack);
            return {
                total: 0,
                active: 0,
                used: 0,
                expired: 0,
                blocked: 0,
                by_type: {},
                success_rate: 0,
                average_usage_time: 0,
                recent_activity: { last_24h: 0, last_7d: 0, last_30d: 0 },
            };
        }
    }
    async getTokenUsageHistory(tokenId) {
        const operationId = this.logger.startOperation('getTokenUsageHistory', { tokenId });
        try {
            const token = await this.prisma.validation_tokens.findUnique({
                where: { id: tokenId },
                select: {
                    id: true,
                    token_type: true,
                    email: true,
                    attempt_count: true,
                    is_used: true,
                    used_at: true,
                    used_ip: true,
                    is_blocked: true,
                    blocked_at: true,
                    created_at: true,
                    expires_at: true,
                },
            });
            if (!token) {
                this.logger.endOperation('getTokenUsageHistory', operationId, false);
                return [];
            }
            const history = [];
            history.push({
                timestamp: token.created_at.toISOString(),
                action: 'token_created',
                token_type: token.token_type,
                email: token.email,
                ip_address: null,
            });
            for (let i = 1; i <= token.attempt_count; i++) {
                history.push({
                    timestamp: token.created_at.toISOString(),
                    action: 'token_attempt',
                    attempt_number: i,
                    ip_address: null,
                });
            }
            if (token.is_blocked && token.blocked_at) {
                history.push({
                    timestamp: token.blocked_at.toISOString(),
                    action: 'token_blocked',
                    reason: 'max_attempts_exceeded',
                    ip_address: null,
                });
            }
            if (token.is_used && token.used_at) {
                history.push({
                    timestamp: token.used_at.toISOString(),
                    action: 'token_used_successfully',
                    ip_address: token.used_ip,
                });
            }
            if (token.expires_at < new Date()) {
                history.push({
                    timestamp: token.expires_at.toISOString(),
                    action: 'token_expired',
                    ip_address: null,
                });
            }
            this.logger.endOperation('getTokenUsageHistory', operationId, true);
            return history.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        }
        catch (error) {
            this.logger.endOperation('getTokenUsageHistory', operationId, false);
            this.logger.error('Failed to get token usage history', error.stack, 'ValidationTokenService.getTokenUsageHistory', JSON.stringify({ errorMessage: error.message, tokenId }));
            return [];
        }
    }
    async cleanupExpiredTokens() {
        const operationId = this.logger.startOperation('cleanupExpiredTokens');
        try {
            const result = await this.prisma.validation_tokens.deleteMany({
                where: {
                    expires_at: { lt: new Date() },
                },
            });
            this.logger.endOperation('cleanupExpiredTokens', operationId, true);
            this.logger.info('Expired validation tokens cleaned up', JSON.stringify({
                count: result.count,
            }));
            return result.count;
        }
        catch (error) {
            this.logger.endOperation('cleanupExpiredTokens', operationId, false);
            this.logger.error('Failed to cleanup expired tokens', error.stack, 'ValidationTokenService.cleanupExpiredTokens', JSON.stringify({ errorMessage: error.message }));
            return 0;
        }
    }
    async cleanupUsedTokens(olderThanDays = 30) {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
            const result = await this.prisma.validation_tokens.deleteMany({
                where: {
                    is_used: true,
                    used_at: { lt: cutoffDate },
                },
            });
            this.logger.info('Used validation tokens cleaned up', JSON.stringify({
                count: result.count,
                olderThanDays,
            }));
            return result.count;
        }
        catch (error) {
            this.logger.error('Error cleaning up used tokens', error.stack);
            return 0;
        }
    }
    async cleanupBlockedTokens(olderThanDays = 7) {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
            const result = await this.prisma.validation_tokens.deleteMany({
                where: {
                    is_blocked: true,
                    blocked_at: { lt: cutoffDate },
                },
            });
            this.logger.info('Blocked validation tokens cleaned up', JSON.stringify({
                count: result.count,
                olderThanDays,
            }));
            return result.count;
        }
        catch (error) {
            this.logger.error('Error cleaning up blocked tokens', error.stack);
            return 0;
        }
    }
    generateVerificationUrl(token, baseUrl) {
        const base = baseUrl || this.configService.get('FRONTEND_URL', 'http://localhost:3000');
        return `${base}/verify-email?token=${token}`;
    }
    generateMagicLinkUrl(token, baseUrl) {
        const base = baseUrl || this.configService.get('FRONTEND_URL', 'http://localhost:3000');
        return `${base}/magic-link?token=${token}`;
    }
    async canResendToken(email, type) {
        try {
            const rateLimitKey = `${this.RATE_LIMIT_PREFIX}${email}:${type}`;
            const count = await this.redis.getCache(rateLimitKey) || 0;
            return count < 3;
        }
        catch (error) {
            this.logger.error('Error checking resend rate limit', error.stack);
            return false;
        }
    }
    async createToken(data) {
        const { token, tokenHash } = await this.generateTokenData();
        const expiresAt = new Date(Date.now() + (data.expires_in_minutes || 60) * 60 * 1000);
        const validationToken = await this.prisma.validation_tokens.create({
            data: {
                user_id: data.user_id || null,
                email: data.email,
                token_type: data.token_type,
                token_hash: tokenHash,
                token_plain: data.token_type === 'PHONE_VERIFICATION' ? token : null,
                expires_at: expiresAt,
                max_attempts: data.max_attempts || 3,
                reset_password_data: data.reset_password_data || null,
                invitation_data: data.invitation_data || null,
                verification_data: data.verification_data || null,
                magic_link_data: data.magic_link_data || null,
                client_info: data.client_info || null,
                metadata: data.metadata || null,
            },
        });
        return {
            id: validationToken.id,
            token: token,
            token_type: data.token_type,
            email: data.email,
            user_id: data.user_id,
            expires_at: expiresAt,
            max_attempts: validationToken.max_attempts,
            verification_url: this.generateVerificationUrl(token),
            magic_link_url: data.token_type.includes('MAGIC_LINK') ? this.generateMagicLinkUrl(token) : undefined,
            created_at: validationToken.created_at,
        };
    }
    async createTokenWithCustomCode(data, customToken) {
        const tokenHash = await this.hashingService.hashPassword(customToken);
        const expiresAt = new Date(Date.now() + (data.expires_in_minutes || 60) * 60 * 1000);
        const validationToken = await this.prisma.validation_tokens.create({
            data: {
                user_id: data.user_id || null,
                email: data.email,
                token_type: data.token_type,
                token_hash: tokenHash,
                token_plain: customToken,
                expires_at: expiresAt,
                max_attempts: data.max_attempts || 3,
                client_info: data.client_info || null,
                metadata: data.metadata || null,
            },
        });
        return {
            id: validationToken.id,
            token: customToken,
            token_type: data.token_type,
            email: data.email,
            user_id: data.user_id,
            expires_at: expiresAt,
            max_attempts: validationToken.max_attempts,
            created_at: validationToken.created_at,
        };
    }
    async generateTokenData() {
        const crypto = require('crypto');
        const token = crypto.randomBytes(32).toString('base64url');
        const tokenHash = await this.hashingService.hashPassword(token);
        return { token, tokenHash };
    }
    generateNumericToken(length) {
        const digits = '0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += digits.charAt(Math.floor(Math.random() * digits.length));
        }
        return result;
    }
    async createDummyToken(email, type) {
        const { token } = await this.generateTokenData();
        return {
            id: 'dummy-' + Date.now(),
            token: token,
            token_type: type,
            email: email,
            expires_at: new Date(Date.now() + 60 * 60 * 1000),
            max_attempts: 3,
            created_at: new Date(),
        };
    }
    async checkRateLimit(email, type, options) {
        const limit = options?.limit || 5;
        const windowMinutes = options?.windowMinutes || 60;
        const rateLimitKey = `${this.RATE_LIMIT_PREFIX}${email}:${type}`;
        const count = await this.redis.getCache(rateLimitKey) || 0;
        if (count >= limit) {
            throw new Error(`Rate limit exceeded for ${type}. Try again later.`);
        }
        await this.redis.setCache(rateLimitKey, count + 1, windowMinutes * 60);
    }
    async revokeExistingTokens(email, type) {
        await this.prisma.validation_tokens.updateMany({
            where: {
                email,
                token_type: type,
                is_used: false,
            },
            data: {
                is_used: true,
                used_at: new Date(),
                updated_at: new Date(),
            },
        });
    }
    extractActionData(token) {
        switch (token.token_type) {
            case 'EMAIL_VERIFICATION':
                return token.verification_data || {};
            case 'PASSWORD_RESET':
                return {
                    requires_old_password: token.reset_password_data?.requires_old_password || false
                };
            case 'INVITATION_USER':
            case 'INVITATION_GROUP':
                return token.invitation_data || {};
            case 'MAGIC_LINK_LOGIN':
            case 'MAGIC_LINK_ACTION':
                return token.magic_link_data || {};
            default:
                return {};
        }
    }
    async scheduleEmailSending(token) {
        try {
            await this.bullmq.addJob('email', 'send_verification_email', {
                email: token.email,
                token: token.token,
                type: token.token_type,
                verification_url: token.verification_url,
                expires_at: token.expires_at,
            });
        }
        catch (error) {
            this.logger.error('Error scheduling email', error.stack);
        }
    }
    async scheduleInvitationEmail(token) {
        try {
            await this.bullmq.addJob('email', 'send_invitation_email', {
                email: token.email,
                token: token.token,
                verification_url: token.verification_url,
                expires_at: token.expires_at,
            });
        }
        catch (error) {
            this.logger.error('Error scheduling invitation email', error.stack);
        }
    }
    async scheduleMagicLinkEmail(token) {
        try {
            await this.bullmq.addJob('EMAIL_QUEUE', 'send_magic_link_email', {
                email: token.email,
                token: token.token,
                magic_link_url: token.magic_link_url,
                expires_at: token.expires_at,
            });
        }
        catch (error) {
            this.logger.error('Error scheduling magic link email', error.stack);
        }
    }
    async scheduleSMSSending(token, phone) {
        try {
            await this.bullmq.addJob('sms', 'send_verification_sms', {
                phone: phone,
                code: token.token,
                expires_at: token.expires_at,
            });
        }
        catch (error) {
            this.logger.error('Error scheduling SMS', error.stack);
        }
    }
    async getTokenCountByType(userId) {
        const whereClause = userId ? { user_id: userId } : {};
        const counts = await this.prisma.validation_tokens.groupBy({
            by: ['token_type'],
            where: whereClause,
            _count: { id: true },
        });
        const result = {};
        counts.forEach(count => {
            result[count.token_type] = count._count.id;
        });
        return result;
    }
    async getRecentTokenActivity(userId) {
        const now = new Date();
        const whereClause = userId ? { user_id: userId } : {};
        const [last24h, last7d, last30d] = await Promise.all([
            this.prisma.validation_tokens.count({
                where: {
                    ...whereClause,
                    created_at: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
                },
            }),
            this.prisma.validation_tokens.count({
                where: {
                    ...whereClause,
                    created_at: { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) },
                },
            }),
            this.prisma.validation_tokens.count({
                where: {
                    ...whereClause,
                    created_at: { gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) },
                },
            }),
        ]);
        return { last_24h: last24h, last_7d: last7d, last_30d: last30d };
    }
    async invalidateTokenCache(tokenId) {
        try {
            const cacheKey = `${this.CACHE_PREFIX}${tokenId}`;
            await this.redis.delCache(cacheKey);
        }
        catch (error) {
            this.logger.error('Error invalidating token cache', error.stack);
        }
    }
};
exports.ValidationTokenService = ValidationTokenService;
exports.ValidationTokenService = ValidationTokenService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        redis_service_1.RedisService,
        config_1.ConfigService,
        hashing_service_1.HashingService,
        bullmq_service_1.BullmqService,
        logger_service_1.LoggerService])
], ValidationTokenService);
//# sourceMappingURL=validation-token.service.js.map