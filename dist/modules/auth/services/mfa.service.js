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
exports.MfaService = void 0;
const common_1 = require("@nestjs/common");
const logger_service_1 = require("../../../shared/logger/logger.service");
const prisma_service_1 = require("../../../shared/prisma/prisma.service");
const redis_service_1 = require("../../../shared/redis/redis.service");
const email_service_1 = require("../../../shared/email/email.service");
const crypto_util_1 = require("../utils/crypto.util");
const mfa_constants_1 = require("../constants/mfa.constants");
const mfa_exceptions_1 = require("../exceptions/mfa.exceptions");
let MfaService = class MfaService {
    prisma;
    redis;
    email;
    logger;
    constructor(prisma, redis, email, loggerService) {
        this.prisma = prisma;
        this.redis = redis;
        this.email = email;
        this.logger = loggerService.createChildLogger('MfaService');
    }
    async setupMfa(userId, provider) {
        const operationId = this.logger.startOperation('setupMfa', {
            userId,
            provider,
        });
        try {
            if (!this.isSupportedProvider(provider)) {
                throw new mfa_exceptions_1.UnsupportedMfaProviderException(provider);
            }
            const user = await this.getUserForMfa(userId);
            if (!user) {
                throw new Error('Utilisateur introuvable ou inactif');
            }
            const existingMfa = await this.getUserMfaConfig(userId, provider);
            if (existingMfa) {
                throw new mfa_exceptions_1.MfaAlreadySetupException(provider);
            }
            const mfaSetup = await this.generateMfaSetup(userId, provider, user);
            await this.storePendingMfaSetup(userId, provider, mfaSetup);
            this.logger.logBusinessEvent('MFA_SETUP_INITIATED', {
                userId,
                provider,
                email: user.email,
            }, userId);
            this.logger.endOperation(operationId, 'success');
            return mfaSetup;
        }
        catch (error) {
            this.logger.endOperation(operationId, 'error', error.message);
            if (error instanceof mfa_exceptions_1.UnsupportedMfaProviderException ||
                error instanceof mfa_exceptions_1.MfaAlreadySetupException) {
                throw error;
            }
            this.logger.error('MFA setup failed', error.stack, { userId, provider });
            throw new Error(`Erreur configuration MFA: ${error.message}`);
        }
    }
    async verifyMfa(verification) {
        const operationId = this.logger.startOperation('verifyMfa', {
            method: verification.method,
            challengeToken: verification.challengeToken.substring(0, 8) + '...',
        });
        try {
            const challengeData = await this.validateChallengeToken(verification.challengeToken);
            if (!challengeData) {
                throw new mfa_exceptions_1.MfaChallengeExpiredException();
            }
            await this.checkMfaRateLimit(challengeData.userId, verification.method);
            const isValidCode = await this.verifyMfaCode(challengeData.userId, verification.method, verification.code);
            if (!isValidCode) {
                await this.incrementMfaFailureCount(challengeData.userId, verification.method);
                throw new mfa_exceptions_1.InvalidMfaCodeException();
            }
            await this.markChallengeAsUsed(verification.challengeToken);
            if (verification.trustDevice && challengeData.deviceFingerprint) {
                await this.trustDevice(challengeData.userId, challengeData.deviceFingerprint);
            }
            this.logger.logBusinessEvent('MFA_VERIFICATION_SUCCESS', {
                userId: challengeData.userId,
                method: verification.method,
                deviceTrusted: !!verification.trustDevice,
            }, challengeData.userId);
            this.logger.endOperation(operationId, 'success');
            return true;
        }
        catch (error) {
            this.logger.endOperation(operationId, 'error', error.message);
            if (error instanceof mfa_exceptions_1.MfaChallengeExpiredException ||
                error instanceof mfa_exceptions_1.InvalidMfaCodeException) {
                throw error;
            }
            this.logger.error('MFA verification failed', error.stack);
            throw new Error(`Erreur vérification MFA: ${error.message}`);
        }
    }
    async disableMfa(userId, provider) {
        const operationId = this.logger.startOperation('disableMfa', {
            userId,
            provider,
        });
        try {
            const mfaConfig = await this.getUserMfaConfig(userId, provider);
            if (!mfaConfig) {
                this.logger.endOperation(operationId, 'not_found');
                return false;
            }
            await this.removeMfaConfig(userId, provider);
            if (provider === 'BACKUP_CODE') {
                await this.revokeBackupCodes(userId);
            }
            this.logger.logBusinessEvent('MFA_DISABLED', {
                userId,
                provider,
            }, userId);
            this.logger.endOperation(operationId, 'success');
            return true;
        }
        catch (error) {
            this.logger.endOperation(operationId, 'error', error.message);
            this.logger.error('MFA disable failed', error.stack, { userId, provider });
            return false;
        }
    }
    async getAvailableProviders(userId) {
        const operationId = this.logger.startOperation('getAvailableProviders', { userId });
        try {
            const user = await this.getUserForMfa(userId);
            if (!user) {
                return [];
            }
            const availableProviders = [];
            if (user.phone_verified) {
                availableProviders.push('SMS_OTP');
            }
            if (user.email_verified) {
                availableProviders.push('EMAIL_OTP');
            }
            availableProviders.push('TOTP_APP');
            const hasTotpSetup = await this.getUserMfaConfig(userId, 'TOTP_APP');
            if (hasTotpSetup) {
                availableProviders.push('BACKUP_CODE');
            }
            this.logger.endOperation(operationId, 'success');
            return availableProviders;
        }
        catch (error) {
            this.logger.endOperation(operationId, 'error', error.message);
            this.logger.error('Failed to get available MFA providers', error.stack, { userId });
            return [];
        }
    }
    async requiresMfa(userId, riskScore) {
        const operationId = this.logger.startOperation('requiresMfa', {
            userId,
            riskScore,
        });
        try {
            const userRoles = await this.getUserRoles(userId);
            const isOrganizer = userRoles.some(role => role.includes('organizer'));
            if (isOrganizer) {
                this.logger.endOperation(operationId, 'organizer_required');
                return true;
            }
            const requiresMfaByRisk = riskScore >= 40;
            const availableProviders = await this.getAvailableProviders(userId);
            const hasMfaSetup = availableProviders.length > 0;
            const required = requiresMfaByRisk && hasMfaSetup;
            this.logger.endOperation(operationId, 'success');
            return required;
        }
        catch (error) {
            this.logger.endOperation(operationId, 'error', error.message);
            this.logger.error('Failed to determine MFA requirement', error.stack, { userId });
            return false;
        }
    }
    isSupportedProvider(provider) {
        return Object.keys(mfa_constants_1.MFA_CONSTANTS.PROVIDERS).includes(provider);
    }
    async getUserForMfa(userId) {
        try {
            return await this.prisma.users.findUnique({
                where: { id: userId },
                select: {
                    id: true,
                    email: true,
                    phone: true,
                    first_name: true,
                    last_name: true,
                    is_active: true,
                    email_verified: true,
                    phone_verified: true,
                },
            });
        }
        catch (error) {
            this.logger.error('Failed to get user for MFA', error.stack, { userId });
            return null;
        }
    }
    async getUserMfaConfig(userId, provider) {
        try {
            const cacheKey = `mfa_config:${userId}:${provider}`;
            const config = await this.redis.getCache(cacheKey);
            return config;
        }
        catch (error) {
            this.logger.error('Failed to get user MFA config', error.stack, { userId, provider });
            return null;
        }
    }
    async generateMfaSetup(userId, provider, user) {
        switch (provider) {
            case 'SMS_OTP':
                return {
                    provider,
                    setupInstructions: `Un code sera envoyé au ${this.maskPhone(user.phone)}`,
                };
            case 'EMAIL_OTP':
                return {
                    provider,
                    setupInstructions: `Un code sera envoyé à ${this.maskEmail(user.email)}`,
                };
            case 'TOTP_APP':
                const secret = crypto_util_1.CryptoUtil.generateSecureToken(16);
                const qrCodeData = this.generateTotpQrCode(user.email, secret);
                return {
                    provider,
                    secret,
                    qrCode: qrCodeData,
                    setupInstructions: 'Scannez le QR code avec votre app d\'authentification',
                };
            case 'BACKUP_CODE':
                const backupCodes = crypto_util_1.CryptoUtil.generateBackupCodes(mfa_constants_1.MFA_CONSTANTS.BACKUP_CODES.COUNT, mfa_constants_1.MFA_CONSTANTS.BACKUP_CODES.LENGTH);
                return {
                    provider,
                    backupCodes,
                    setupInstructions: 'Conservez ces codes en lieu sûr',
                };
            default:
                throw new mfa_exceptions_1.UnsupportedMfaProviderException(provider);
        }
    }
    async storePendingMfaSetup(userId, provider, setup) {
        try {
            const pendingKey = `mfa_pending:${userId}:${provider}`;
            await this.redis.setCache(pendingKey, setup, 3600);
        }
        catch (error) {
            this.logger.error('Failed to store pending MFA setup', error.stack, { userId, provider });
        }
    }
    async validateChallengeToken(challengeToken) {
        try {
            const challengeKey = `mfa_challenge:${challengeToken}`;
            const challengeData = await this.redis.getCache(challengeKey);
            return challengeData;
        }
        catch (error) {
            this.logger.error('Failed to validate challenge token', error.stack);
            return null;
        }
    }
    async checkMfaRateLimit(userId, method) {
        const rateLimitKey = `mfa_rate_limit:${userId}:${method}`;
        const attempts = await this.redis.getCache(rateLimitKey) || 0;
        if (attempts >= 5) {
            throw new Error('Trop de tentatives MFA. Réessayez dans 5 minutes.');
        }
        await this.redis.setCache(rateLimitKey, attempts + 1, 300);
    }
    async verifyMfaCode(userId, method, code) {
        switch (method) {
            case 'SMS_OTP':
            case 'EMAIL_OTP':
                return this.verifyOtpCode(userId, method, code);
            case 'TOTP_APP':
                return this.verifyTotpCode(userId, code);
            case 'BACKUP_CODE':
                return this.verifyBackupCode(userId, code);
            default:
                return false;
        }
    }
    async verifyOtpCode(userId, method, code) {
        try {
            const otpKey = `mfa_otp:${userId}:${method}`;
            const storedCode = await this.redis.getCache(otpKey);
            if (storedCode === code) {
                await this.redis.deleteCache(otpKey);
                return true;
            }
            return false;
        }
        catch (error) {
            this.logger.error('OTP verification failed', error.stack);
            return false;
        }
    }
    async verifyTotpCode(userId, code) {
        try {
            return code.length === 6 && /^\d+$/.test(code);
        }
        catch (error) {
            this.logger.error('TOTP verification failed', error.stack);
            return false;
        }
    }
    async verifyBackupCode(userId, code) {
        try {
            const backupCodesKey = `mfa_backup_codes:${userId}`;
            const backupCodes = await this.redis.getCache(backupCodesKey) || [];
            const codeIndex = backupCodes.indexOf(code);
            if (codeIndex !== -1) {
                backupCodes.splice(codeIndex, 1);
                await this.redis.setCache(backupCodesKey, backupCodes, 0);
                return true;
            }
            return false;
        }
        catch (error) {
            this.logger.error('Backup code verification failed', error.stack);
            return false;
        }
    }
    async incrementMfaFailureCount(userId, method) {
        const failureKey = `mfa_failures:${userId}:${method}`;
        const failures = await this.redis.getCache(failureKey) || 0;
        await this.redis.setCache(failureKey, failures + 1, 300);
    }
    async markChallengeAsUsed(challengeToken) {
        const challengeKey = `mfa_challenge:${challengeToken}`;
        await this.redis.deleteCache(challengeKey);
    }
    async trustDevice(userId, deviceFingerprint) {
        try {
            const trustKey = `trusted_device:${userId}:${deviceFingerprint}`;
            const trustData = {
                userId,
                deviceFingerprint,
                trustedAt: new Date().toISOString(),
                expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            };
            await this.redis.setCache(trustKey, trustData, 30 * 24 * 60 * 60);
        }
        catch (error) {
            this.logger.error('Failed to trust device', error.stack, { userId });
        }
    }
    async removeMfaConfig(userId, provider) {
        const configKey = `mfa_config:${userId}:${provider}`;
        await this.redis.deleteCache(configKey);
    }
    async revokeBackupCodes(userId) {
        const backupCodesKey = `mfa_backup_codes:${userId}`;
        await this.redis.deleteCache(backupCodesKey);
    }
    async getUserRoles(userId) {
        try {
            return [];
        }
        catch (error) {
            this.logger.error('Failed to get user roles', error.stack, { userId });
            return [];
        }
    }
    maskPhone(phone) {
        if (!phone || phone.length < 4)
            return phone;
        return phone.slice(0, 3) + '*'.repeat(phone.length - 6) + phone.slice(-3);
    }
    maskEmail(email) {
        const [local, domain] = email.split('@');
        if (local.length <= 2)
            return `${local[0]}*@${domain}`;
        return `${local[0]}${'*'.repeat(local.length - 2)}${local[local.length - 1]}@${domain}`;
    }
    generateTotpQrCode(email, secret) {
        const issuer = mfa_constants_1.MFA_CONSTANTS.TOTP.ISSUER;
        const otpauth = `otpauth://totp/${issuer}:${email}?secret=${secret}&issuer=${issuer}`;
        return `data:image/svg+xml;base64,${Buffer.from(`<svg>QR Code for ${otpauth}</svg>`).toString('base64')}`;
    }
};
exports.MfaService = MfaService;
exports.MfaService = MfaService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        redis_service_1.RedisService,
        email_service_1.EmailService,
        logger_service_1.LoggerService])
], MfaService);
//# sourceMappingURL=mfa.service.js.map