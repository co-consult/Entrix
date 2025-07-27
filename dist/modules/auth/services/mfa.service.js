"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MfaService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const speakeasy = __importStar(require("speakeasy"));
const qrcode = __importStar(require("qrcode"));
const crypto = __importStar(require("crypto"));
const prisma_service_1 = require("../../../shared/prisma/prisma.service");
const redis_service_1 = require("../../../shared/redis/redis.service");
const logger_service_1 = require("../../../shared/logger/logger.service");
const email_service_1 = require("../../../shared/email/email.service");
const mfa_constants_1 = require("../constants/mfa.constants");
const client_1 = require("@prisma/client");
const mfa_exceptions_1 = require("../exceptions/mfa.exceptions");
const auth_exceptions_1 = require("../exceptions/auth.exceptions");
let MfaService = class MfaService {
    prisma;
    redis;
    config;
    emailService;
    logger;
    MAX_ATTEMPTS = 3;
    RATE_LIMIT_WINDOW = 5 * 60;
    constructor(prisma, redis, config, emailService, loggerService) {
        this.prisma = prisma;
        this.redis = redis;
        this.config = config;
        this.emailService = emailService;
        this.logger = loggerService.createChildLogger('MfaService');
    }
    async setupMfa(userId, provider) {
        const operationId = this.logger.startOperation('setupMfa', { userId, provider });
        try {
            const user = await this.prisma.users.findUnique({
                where: { id: userId },
                select: {
                    id: true,
                    email: true,
                    phone: true,
                    first_name: true,
                    last_name: true,
                    is_active: true,
                    email_verified: true
                }
            });
            if (!user) {
                throw new common_1.BadRequestException('Utilisateur introuvable');
            }
            if (!user.is_active) {
                throw new common_1.BadRequestException('Compte utilisateur inactif');
            }
            const emailVerificationRequired = this.config.get('EMAIL_VERIFICATION_REQUIRED', true);
            if (emailVerificationRequired && !user.email_verified) {
                throw new common_1.BadRequestException('Email non vérifié - vérification requise avant MFA');
            }
            this.logger.info('MFA Setup validation', JSON.stringify({
                userId,
                provider,
                emailVerificationRequired,
                userEmailVerified: !!user.email_verified,
                canProceed: !emailVerificationRequired || !!user.email_verified
            }));
            const existingConfig = await this.prisma.user_mfa_settings.findUnique({
                where: {
                    user_id_method: {
                        user_id: userId,
                        method: this.mapProviderToMethod(provider)
                    }
                }
            });
            if (existingConfig?.is_enabled) {
                throw new mfa_exceptions_1.MfaAlreadyConfiguredException(provider);
            }
            let mfaSetup;
            switch (provider) {
                case 'TOTP_APP':
                    mfaSetup = await this.setupTotpApp(userId, user.email);
                    break;
                case 'SMS_OTP':
                    if (!user.phone) {
                        throw new common_1.BadRequestException('Numéro de téléphone requis pour SMS OTP');
                    }
                    mfaSetup = await this.setupSmsOtp(userId, user.phone);
                    break;
                case 'EMAIL_OTP':
                    mfaSetup = await this.setupEmailOtp(userId, user.email);
                    break;
                case 'BACKUP_CODE':
                    mfaSetup = await this.setupBackupCodes(userId);
                    break;
                default:
                    throw new common_1.BadRequestException(`Provider MFA non supporté: ${provider}`);
            }
            await this.logSecurityEvent('MFA_SETUP_INITIATED', userId, {
                provider,
                setupCompleted: false
            });
            this.logger.endOperation('setupMfa', operationId, true);
            return mfaSetup;
        }
        catch (error) {
            this.logger.endOperation('setupMfa', operationId, false);
            this.logger.error('MFA setup failed', error.stack, 'MfaService.setupMfa', JSON.stringify({
                userId,
                provider,
                error: error.message
            }));
            throw error;
        }
    }
    async verifyMfa(verification) {
        const operationId = this.logger.startOperation('verifyMfa', {
            method: verification.method,
            hasChallengeToken: !!verification.challengeToken
        });
        try {
            const challengeData = await this.validateChallengeToken(verification.challengeToken);
            if (!challengeData) {
                throw new mfa_exceptions_1.MfaChallengeExpiredException();
            }
            const { userId } = challengeData;
            await this.checkRateLimit(userId, verification.method);
            const mfaConfig = await this.prisma.user_mfa_settings.findUnique({
                where: {
                    user_id_method: {
                        user_id: userId,
                        method: this.mapProviderToMethod(verification.method)
                    }
                }
            });
            if (!mfaConfig?.is_enabled) {
                throw new mfa_exceptions_1.MfaNotConfiguredException(verification.method);
            }
            let isValid = false;
            switch (verification.method) {
                case 'TOTP_APP':
                    isValid = await this.verifyTotpCode(userId, verification.code);
                    break;
                case 'SMS_OTP':
                    isValid = await this.verifySmsCode(userId, verification.code);
                    break;
                case 'EMAIL_OTP':
                    isValid = await this.verifyEmailCode(userId, verification.code);
                    break;
                case 'BACKUP_CODE':
                    isValid = await this.verifyBackupCode(userId, verification.code);
                    break;
                default:
                    throw new common_1.BadRequestException(`Méthode MFA non supportée: ${verification.method}`);
            }
            if (!isValid) {
                await this.incrementFailedAttempts(userId, verification.method);
                await this.logSecurityEvent('MFA_VERIFICATION_FAILED', userId, {
                    method: verification.method,
                    reason: 'invalid_code'
                });
                throw new auth_exceptions_1.InvalidMfaCodeException();
            }
            await this.updateLastUsed(userId, verification.method);
            if (verification.trustDevice && challengeData.deviceFingerprint) {
                await this.trustDevice(userId, challengeData.deviceFingerprint);
            }
            await this.redis.delCache(`mfa_challenge:${verification.challengeToken}`);
            await this.logSecurityEvent('MFA_VERIFICATION_SUCCESS', userId, {
                method: verification.method,
                deviceTrusted: !!verification.trustDevice
            });
            this.logger.endOperation('verifyMfa', operationId, true);
            return true;
        }
        catch (error) {
            this.logger.endOperation('verifyMfa', operationId, false);
            this.logger.error('MFA verification failed', error.stack, 'MfaService.verifyMfa', JSON.stringify({
                method: verification.method,
                error: error.message
            }));
            throw error;
        }
    }
    async disableMfa(userId, provider) {
        const operationId = this.logger.startOperation('disableMfa', { userId, provider });
        try {
            const method = this.mapProviderToMethod(provider);
            const updated = await this.prisma.user_mfa_settings.updateMany({
                where: {
                    user_id: userId,
                    method: method,
                    is_enabled: true
                },
                data: {
                    is_enabled: false,
                    disabled_at: new Date(),
                    updated_at: new Date()
                }
            });
            if (updated.count === 0) {
                throw new mfa_exceptions_1.MfaNotConfiguredException(provider);
            }
            switch (provider) {
                case 'TOTP_APP':
                    await this.redis.delCache(`mfa_totp_secret:${userId}`);
                    break;
                case 'BACKUP_CODE':
                    await this.redis.delCache(`mfa_backup_codes:${userId}`);
                    break;
            }
            await this.prisma.mfa_tokens.updateMany({
                where: {
                    user_id: userId,
                    method: method,
                    is_used: false
                },
                data: {
                    is_used: true,
                    used_at: new Date()
                }
            });
            await this.logSecurityEvent('MFA_DISABLED', userId, { provider });
            this.logger.endOperation('disableMfa', operationId, true);
            return true;
        }
        catch (error) {
            this.logger.endOperation('disableMfa', operationId, false);
            throw error;
        }
    }
    async getAvailableProviders(userId) {
        try {
            const user = await this.prisma.users.findUnique({
                where: { id: userId },
                select: { phone: true, email_verified: true }
            });
            if (!user) {
                return [];
            }
            const providers = [];
            if (user.email_verified) {
                providers.push('EMAIL_OTP');
            }
            providers.push('TOTP_APP');
            if (user.phone) {
                providers.push('SMS_OTP');
            }
            providers.push('BACKUP_CODE');
            return providers;
        }
        catch (error) {
            this.logger.error('Failed to get available providers', error.stack);
            return ['EMAIL_OTP'];
        }
    }
    async requiresMfa(userId, riskScore) {
        try {
            const hasMfaConfigured = await this.userHasMfaConfigured(userId);
            if (!hasMfaConfigured) {
                return riskScore > 50;
            }
            return riskScore > 30;
        }
        catch (error) {
            this.logger.error('Failed to check MFA requirement', error.stack);
            return true;
        }
    }
    async generateMfaChallenge(userId, availableMethods, deviceFingerprint) {
        try {
            const configuredMethods = await this.getConfiguredMethodsPrivate(userId);
            const methods = availableMethods.filter(method => configuredMethods.includes(method));
            if (methods.length === 0) {
                throw new mfa_exceptions_1.MfaNotConfiguredException('Aucune méthode MFA configurée');
            }
            const challengeToken = crypto.randomBytes(32).toString('hex');
            const expiresIn = mfa_constants_1.MFA_CONSTANTS.PROVIDERS.EMAIL_OTP.validity_duration;
            const challengeData = {
                userId,
                methods,
                deviceFingerprint,
                createdAt: Date.now()
            };
            await this.redis.setCache(`mfa_challenge:${challengeToken}`, challengeData, expiresIn);
            return {
                methods,
                challengeToken,
                expiresIn
            };
        }
        catch (error) {
            this.logger.error('Failed to generate MFA challenge', error.stack);
            throw error;
        }
    }
    async setupTotpApp(userId, email) {
        const secret = speakeasy.generateSecret({
            name: `Entrix (${email})`,
            issuer: mfa_constants_1.MFA_CONSTANTS.TOTP.ISSUER,
            length: mfa_constants_1.MFA_CONSTANTS.TOTP.SECRET_LENGTH
        });
        await this.redis.setCache(`mfa_totp_temp:${userId}`, secret.base32, 900);
        const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url || '');
        return {
            provider: 'TOTP_APP',
            secret: secret.base32,
            qrCode: qrCodeUrl
        };
    }
    async setupSmsOtp(userId, phone) {
        await this.prisma.user_mfa_settings.upsert({
            where: {
                user_id_method: {
                    user_id: userId,
                    method: 'SMS'
                }
            },
            update: {
                is_enabled: true,
                backup_phone: phone,
                enabled_at: new Date(),
                updated_at: new Date()
            },
            create: {
                user_id: userId,
                method: 'SMS',
                is_enabled: true,
                backup_phone: phone,
                enabled_at: new Date()
            }
        });
        return {
            provider: 'SMS_OTP'
        };
    }
    async setupEmailOtp(userId, email) {
        await this.prisma.user_mfa_settings.upsert({
            where: {
                user_id_method: {
                    user_id: userId,
                    method: 'EMAIL'
                }
            },
            update: {
                is_enabled: true,
                enabled_at: new Date(),
                updated_at: new Date()
            },
            create: {
                user_id: userId,
                method: 'EMAIL',
                is_enabled: true,
                enabled_at: new Date()
            }
        });
        return {
            provider: 'EMAIL_OTP'
        };
    }
    async setupBackupCodes(userId) {
        const codes = this.generateBackupCodes();
        await this.redis.setCache(`mfa_backup_codes:${userId}`, codes, 0);
        await this.prisma.user_mfa_settings.upsert({
            where: {
                user_id_method: {
                    user_id: userId,
                    method: 'BACKUP_CODES'
                }
            },
            update: {
                is_enabled: true,
                backup_codes_count: codes.length,
                enabled_at: new Date(),
                updated_at: new Date()
            },
            create: {
                user_id: userId,
                method: 'BACKUP_CODES',
                is_enabled: true,
                backup_codes_count: codes.length,
                enabled_at: new Date()
            }
        });
        return {
            provider: 'BACKUP_CODE',
            backupCodes: codes
        };
    }
    async verifyTotpCode(userId, code) {
        let secret = await this.redis.getCache(`mfa_totp_secret:${userId}`);
        if (!secret) {
            secret = await this.redis.getCache(`mfa_totp_temp:${userId}`);
            if (!secret) {
                return false;
            }
        }
        const verified = speakeasy.totp.verify({
            secret,
            encoding: 'base32',
            token: code,
            window: mfa_constants_1.MFA_CONSTANTS.TOTP.WINDOW,
            step: mfa_constants_1.MFA_CONSTANTS.TOTP.STEP
        });
        if (verified) {
            const tempSecret = await this.redis.getCache(`mfa_totp_temp:${userId}`);
            if (tempSecret) {
                await this.confirmTotpSetup(userId, tempSecret);
                await this.redis.delCache(`mfa_totp_temp:${userId}`);
            }
        }
        return verified;
    }
    async verifySmsCode(userId, code) {
        const storedToken = await this.prisma.mfa_tokens.findFirst({
            where: {
                user_id: userId,
                method: 'SMS',
                is_used: false,
                expires_at: {
                    gt: new Date()
                }
            },
            orderBy: {
                created_at: 'desc'
            }
        });
        if (!storedToken) {
            return false;
        }
        const codeHash = this.hashCode(code);
        const isValid = storedToken.token_hash === codeHash;
        if (isValid) {
            await this.prisma.mfa_tokens.update({
                where: { id: storedToken.id },
                data: {
                    is_used: true,
                    used_at: new Date()
                }
            });
        }
        return isValid;
    }
    async verifyEmailCode(userId, code) {
        const storedToken = await this.prisma.mfa_tokens.findFirst({
            where: {
                user_id: userId,
                method: 'EMAIL',
                is_used: false,
                expires_at: {
                    gt: new Date()
                }
            },
            orderBy: {
                created_at: 'desc'
            }
        });
        if (!storedToken) {
            return false;
        }
        const codeHash = this.hashCode(code);
        const isValid = storedToken.token_hash === codeHash;
        if (isValid) {
            await this.prisma.mfa_tokens.update({
                where: { id: storedToken.id },
                data: {
                    is_used: true,
                    used_at: new Date()
                }
            });
        }
        return isValid;
    }
    async verifyBackupCode(userId, code) {
        const storedCodes = await this.redis.getCache(`mfa_backup_codes:${userId}`);
        if (!storedCodes || !storedCodes.includes(code.toUpperCase())) {
            return false;
        }
        const remainingCodes = storedCodes.filter(c => c !== code.toUpperCase());
        await this.redis.setCache(`mfa_backup_codes:${userId}`, remainingCodes, 0);
        await this.prisma.user_mfa_settings.updateMany({
            where: {
                user_id: userId,
                method: 'BACKUP_CODES'
            },
            data: {
                backup_codes_count: remainingCodes.length
            }
        });
        return true;
    }
    async confirmTotpSetup(userId, secret) {
        await this.redis.setCache(`mfa_totp_secret:${userId}`, secret, 0);
        await this.prisma.user_mfa_settings.upsert({
            where: {
                user_id_method: {
                    user_id: userId,
                    method: 'TOTP'
                }
            },
            update: {
                is_enabled: true,
                totp_secret: secret,
                enabled_at: new Date(),
                updated_at: new Date()
            },
            create: {
                user_id: userId,
                method: 'TOTP',
                is_enabled: true,
                totp_secret: secret,
                enabled_at: new Date()
            }
        });
    }
    generateBackupCodes() {
        const codes = [];
        for (let i = 0; i < mfa_constants_1.MFA_CONSTANTS.BACKUP_CODES.COUNT; i++) {
            const code = crypto.randomBytes(mfa_constants_1.MFA_CONSTANTS.BACKUP_CODES.LENGTH / 2)
                .toString('hex')
                .toUpperCase();
            codes.push(code);
        }
        return codes;
    }
    hashCode(code) {
        return crypto.createHash('sha256').update(code).digest('hex');
    }
    async validateChallengeToken(challengeToken) {
        if (!challengeToken) {
            return null;
        }
        const data = await this.redis.getCache(`mfa_challenge:${challengeToken}`);
        if (data?.userId && data?.methods) {
            return data;
        }
        return null;
    }
    async checkRateLimit(userId, method) {
        const rateLimitKey = `mfa_attempts:${userId}:${method}`;
        const attempts = await this.redis.getCache(rateLimitKey) || 0;
        if (attempts >= this.MAX_ATTEMPTS) {
            throw new common_1.BadRequestException('Trop de tentatives MFA. Réessayez dans 5 minutes.');
        }
    }
    async incrementFailedAttempts(userId, method) {
        const rateLimitKey = `mfa_attempts:${userId}:${method}`;
        const current = await this.redis.getCache(rateLimitKey) || 0;
        await this.redis.setCache(rateLimitKey, current + 1, this.RATE_LIMIT_WINDOW);
    }
    async updateLastUsed(userId, provider) {
        await this.prisma.user_mfa_settings.updateMany({
            where: {
                user_id: userId,
                method: this.mapProviderToMethod(provider)
            },
            data: {
                last_used_at: new Date()
            }
        });
    }
    async enableMfa(userId, provider) {
        const operationId = this.logger.startOperation('enableMfa', { userId, provider });
        try {
            const result = await this.prisma.user_mfa_settings.updateMany({
                where: {
                    user_id: userId,
                    method: this.mapProviderToMethod(provider)
                },
                data: {
                    is_enabled: true,
                    enabled_at: new Date(),
                    updated_at: new Date()
                }
            });
            this.logger.endOperation('enableMfa', operationId, true);
            return result.count > 0;
        }
        catch (error) {
            this.logger.endOperation('enableMfa', operationId, false);
            throw error;
        }
    }
    async regenerateBackupCodes(userId) {
        const operationId = this.logger.startOperation('regenerateBackupCodes', { userId });
        try {
            const newCodes = this.generateBackupCodes();
            await this.redis.setCache(`mfa_backup_codes:${userId}`, newCodes, 0);
            await this.prisma.user_mfa_settings.updateMany({
                where: {
                    user_id: userId,
                    method: 'BACKUP_CODES'
                },
                data: {
                    backup_codes_count: newCodes.length,
                    updated_at: new Date()
                }
            });
            this.logger.endOperation('regenerateBackupCodes', operationId, true);
            return newCodes;
        }
        catch (error) {
            this.logger.endOperation('regenerateBackupCodes', operationId, false);
            throw error;
        }
    }
    async getTrustedDevicesCount(userId) {
        try {
            return await this.prisma.user_trusted_devices.count({
                where: {
                    user_id: userId,
                    is_active: true,
                    expires_at: {
                        gt: new Date()
                    }
                }
            });
        }
        catch (error) {
            this.logger.error('Failed to count trusted devices', error.stack);
            return 0;
        }
    }
    async getPrimaryMethod(userId) {
        try {
            const primarySetting = await this.prisma.user_mfa_settings.findFirst({
                where: {
                    user_id: userId,
                    is_enabled: true,
                    is_primary: true
                },
                select: {
                    method: true
                }
            });
            return primarySetting ? this.mapMethodToProvider(primarySetting.method) : null;
        }
        catch (error) {
            this.logger.error('Failed to get primary method', error.stack);
            return null;
        }
    }
    async getLastUsedDate(userId) {
        try {
            const lastUsed = await this.prisma.user_mfa_settings.findFirst({
                where: {
                    user_id: userId,
                    is_enabled: true,
                    last_used_at: {
                        not: null
                    }
                },
                select: {
                    last_used_at: true
                },
                orderBy: {
                    last_used_at: 'desc'
                }
            });
            return lastUsed?.last_used_at || null;
        }
        catch (error) {
            this.logger.error('Failed to get last used date', error.stack);
            return null;
        }
    }
    async getTrustedDevices(userId) {
        try {
            const devices = await this.prisma.user_trusted_devices.findMany({
                where: {
                    user_id: userId,
                    is_active: true
                },
                orderBy: {
                    last_seen_at: 'desc'
                }
            });
            return devices;
        }
        catch (error) {
            this.logger.error('Failed to get trusted devices', error.stack);
            return [];
        }
    }
    async removeTrustedDevice(userId, deviceId) {
        const operationId = this.logger.startOperation('removeTrustedDevice', { userId, deviceId });
        try {
            const result = await this.prisma.user_trusted_devices.updateMany({
                where: {
                    id: deviceId,
                    user_id: userId
                },
                data: {
                    is_active: false
                }
            });
            const success = result.count > 0;
            this.logger.endOperation('removeTrustedDevice', operationId, success);
            return success;
        }
        catch (error) {
            this.logger.endOperation('removeTrustedDevice', operationId, false);
            throw error;
        }
    }
    async getBackupCodesCount(userId) {
        try {
            const codes = await this.redis.getCache(`mfa_backup_codes:${userId}`);
            return codes ? codes.length : 0;
        }
        catch (error) {
            this.logger.error('Failed to get backup codes count', error.stack);
            return 0;
        }
    }
    async getMfaStats(userId) {
        const operationId = this.logger.startOperation('getMfaStats', { userId });
        try {
            const [totalVerifications, successfulVerifications] = await Promise.all([
                this.prisma.mfa_tokens.count({
                    where: {
                        user_id: userId,
                        created_at: {
                            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                        }
                    }
                }),
                this.prisma.mfa_tokens.count({
                    where: {
                        user_id: userId,
                        is_used: true,
                        created_at: {
                            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                        }
                    }
                })
            ]);
            const failedVerifications = totalVerifications - successfulVerifications;
            const lastSuccessful = await this.prisma.user_mfa_settings.findFirst({
                where: {
                    user_id: userId,
                    last_used_at: { not: null }
                },
                select: { last_used_at: true },
                orderBy: { last_used_at: 'desc' }
            });
            const methodUsage = await this.prisma.user_mfa_settings.findMany({
                where: {
                    user_id: userId,
                    is_enabled: true
                },
                select: { method: true }
            });
            const methodUsageStats = {
                'SMS_OTP': 0,
                'EMAIL_OTP': 0,
                'TOTP_APP': 0,
                'BACKUP_CODE': 0
            };
            methodUsage.forEach(usage => {
                const provider = this.mapMethodToProvider(usage.method);
                methodUsageStats[provider] = 1;
            });
            const mostUsedMethod = Object.entries(methodUsageStats)
                .reduce((a, b) => methodUsageStats[a[0]] > methodUsageStats[b[0]] ? a : b)[0];
            const trustedDevicesHistory = {
                added: await this.prisma.user_trusted_devices.count({
                    where: {
                        user_id: userId,
                        created_at: {
                            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                        }
                    }
                }),
                removed: 0,
                expired: await this.prisma.user_trusted_devices.count({
                    where: {
                        user_id: userId,
                        expires_at: {
                            lt: new Date()
                        }
                    }
                })
            };
            this.logger.endOperation('getMfaStats', operationId, true);
            return {
                totalVerifications,
                successfulVerifications,
                failedVerifications,
                lastSuccessfulVerification: lastSuccessful?.last_used_at || undefined,
                mostUsedMethod,
                methodUsageStats,
                trustedDevicesHistory
            };
        }
        catch (error) {
            this.logger.endOperation('getMfaStats', operationId, false);
            this.logger.error('Failed to get MFA stats', error.stack);
            return {
                totalVerifications: 0,
                successfulVerifications: 0,
                failedVerifications: 0,
                mostUsedMethod: 'EMAIL_OTP',
                methodUsageStats: {
                    'SMS_OTP': 0,
                    'EMAIL_OTP': 0,
                    'TOTP_APP': 0,
                    'BACKUP_CODE': 0
                },
                trustedDevicesHistory: {
                    added: 0,
                    removed: 0,
                    expired: 0
                }
            };
        }
    }
    async sendEmailCode(userId) {
        const operationId = this.logger.startOperation('sendEmailCode', { userId });
        try {
            const user = await this.prisma.users.findUnique({
                where: { id: userId },
                select: {
                    email: true,
                    first_name: true,
                    email_verified: true
                }
            });
            if (!user || !user.email_verified) {
                throw new common_1.BadRequestException('Email utilisateur non vérifié');
            }
            const code = crypto.randomInt(100000, 999999).toString();
            const hashedCode = this.hashCode(code);
            await this.prisma.mfa_tokens.create({
                data: {
                    user_id: userId,
                    method: 'EMAIL',
                    token_hash: hashedCode,
                    expires_at: new Date(Date.now() + 10 * 60 * 1000),
                    metadata: {
                        email: user.email
                    }
                }
            });
            const result = await this.emailService.sendEmail({
                to: user.email,
                subject: 'Entrix - Code de vérification MFA',
                template: 'mfa-code',
                context: {
                    firstName: user.first_name,
                    code,
                    expirationMinutes: 10
                }
            }, true);
            const success = result.success;
            this.logger.endOperation('sendEmailCode', operationId, success);
            return true;
        }
        catch (error) {
            this.logger.endOperation('sendEmailCode', operationId, false);
            this.logger.error('Failed to send email code', error.stack);
            throw error;
        }
    }
    async cleanupExpiredTokens() {
        const operationId = this.logger.startOperation('cleanupExpiredTokens');
        try {
            const result = await this.prisma.mfa_tokens.deleteMany({
                where: {
                    expires_at: {
                        lt: new Date()
                    }
                }
            });
            this.logger.endOperation('cleanupExpiredTokens', operationId, true, undefined, {
                deletedCount: result.count
            });
            return result.count;
        }
        catch (error) {
            this.logger.endOperation('cleanupExpiredTokens', operationId, false);
            this.logger.error('Failed to cleanup expired tokens', error.stack);
            return 0;
        }
    }
    async cleanupExpiredTrustedDevices() {
        const operationId = this.logger.startOperation('cleanupExpiredTrustedDevices');
        try {
            const result = await this.prisma.user_trusted_devices.updateMany({
                where: {
                    expires_at: {
                        lt: new Date()
                    },
                    is_active: true
                },
                data: {
                    is_active: false
                }
            });
            this.logger.endOperation('cleanupExpiredTrustedDevices', operationId, true, undefined, {
                deactivatedCount: result.count
            });
            return result.count;
        }
        catch (error) {
            this.logger.endOperation('cleanupExpiredTrustedDevices', operationId, false);
            this.logger.error('Failed to cleanup expired trusted devices', error.stack);
            return 0;
        }
    }
    async trustDevice(userId, deviceFingerprint) {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);
        await this.prisma.user_trusted_devices.upsert({
            where: {
                user_id_device_fingerprint: {
                    user_id: userId,
                    device_fingerprint: deviceFingerprint
                }
            },
            update: {
                trusted_at: new Date(),
                expires_at: expiresAt,
                last_seen_at: new Date(),
                is_active: true
            },
            create: {
                user_id: userId,
                device_fingerprint: deviceFingerprint,
                expires_at: expiresAt,
                is_active: true
            }
        });
    }
    async userHasMfaConfigured(userId) {
        const count = await this.prisma.user_mfa_settings.count({
            where: {
                user_id: userId,
                is_enabled: true
            }
        });
        return count > 0;
    }
    async getConfiguredMethods(userId) {
        try {
            const settings = await this.prisma.user_mfa_settings.findMany({
                where: {
                    user_id: userId,
                    is_enabled: true
                },
                select: {
                    method: true
                }
            });
            return settings.map(s => this.mapMethodToProvider(s.method));
        }
        catch (error) {
            this.logger.error('Failed to get configured methods', error.stack);
            return [];
        }
    }
    async getConfiguredMethodsPrivate(userId) {
        return this.getConfiguredMethods(userId);
    }
    mapProviderToMethod(provider) {
        const mapping = {
            'SMS_OTP': 'SMS',
            'EMAIL_OTP': 'EMAIL',
            'TOTP_APP': 'TOTP',
            'BACKUP_CODE': 'BACKUP_CODES'
        };
        return mapping[provider];
    }
    mapMethodToProvider(method) {
        const mapping = {
            'SMS': 'SMS_OTP',
            'EMAIL': 'EMAIL_OTP',
            'TOTP': 'TOTP_APP',
            'BACKUP_CODES': 'BACKUP_CODE'
        };
        return mapping[method] || 'EMAIL_OTP';
    }
    async logSecurityEvent(eventType, userId, metadata) {
        try {
            await this.prisma.security_events.create({
                data: {
                    event_type: eventType,
                    severity: client_1.security_level.STANDARD,
                    target_user_id: userId,
                    description: `MFA event: ${eventType}`,
                    event_data: metadata,
                    status: 'OPEN'
                }
            });
        }
        catch (error) {
            this.logger.error('Failed to log security event', error.stack);
        }
    }
};
exports.MfaService = MfaService;
exports.MfaService = MfaService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        redis_service_1.RedisService,
        config_1.ConfigService,
        email_service_1.EmailService,
        logger_service_1.LoggerService])
], MfaService);
//# sourceMappingURL=mfa.service.js.map