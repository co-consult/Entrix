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
const logger_service_1 = require("../../../shared/logger/logger.service");
const prisma_service_1 = require("../../../shared/prisma/prisma.service");
const redis_service_1 = require("../../../shared/redis/redis.service");
const email_service_1 = require("../../../shared/email/email.service");
const auth_constants_1 = require("../constants/auth.constants");
const mfa_exceptions_1 = require("../exceptions/mfa.exceptions");
const auth_exceptions_1 = require("../exceptions/auth.exceptions");
const too_many_requests_exception_1 = require("../exceptions/too-many-requests.exception");
const crypto = __importStar(require("crypto"));
const speakeasy = __importStar(require("speakeasy"));
const qrcode = __importStar(require("qrcode"));
let MfaService = class MfaService {
    prisma;
    redis;
    email;
    logger;
    MFA_CODE_LENGTH = 6;
    OTP_EXPIRY = 300;
    CHALLENGE_EXPIRY = 300;
    MAX_ATTEMPTS = 5;
    RATE_LIMIT_WINDOW = 300;
    constructor(prisma, redis, email, loggerService) {
        this.prisma = prisma;
        this.redis = redis;
        this.email = email;
        this.logger = loggerService.createChildLogger('MfaService');
    }
    async setupMfa(userId, provider) {
        const operationId = this.logger.startOperation('setupMfa', { userId, provider });
        try {
            this.logger.info('Setting up MFA for user', JSON.stringify({
                userId,
                provider
            }));
            const user = await this.prisma.users.findUnique({
                where: { id: userId },
                select: {
                    id: true,
                    email: true,
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
            if (!user.email_verified) {
                throw new common_1.BadRequestException('Email non vérifié - vérification requise avant MFA');
            }
            let mfaSetup;
            switch (provider) {
                case 'TOTP_APP':
                    mfaSetup = await this.setupTotpApp(userId, user.email);
                    break;
                case 'SMS_OTP':
                    mfaSetup = await this.setupSmsOtp(userId);
                    break;
                case 'EMAIL_OTP':
                    mfaSetup = await this.setupEmailOtp(userId);
                    break;
                default:
                    throw new common_1.BadRequestException(`Provider MFA non supporté: ${provider}`);
            }
            const backupCodes = this.generateBackupCodes();
            await this.storeBackupCodes(userId, backupCodes);
            this.logger.logSecurityEvent('MFA_SETUP_INITIATED', userId, undefined, undefined, {
                provider,
                setupCompleted: false
            });
            this.logger.endOperation('setupMfa', operationId, true);
            return {
                ...mfaSetup,
                backupCodes
            };
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
            const isCodeValid = await this.verifyMfaCode(userId, verification.method, verification.code);
            if (!isCodeValid) {
                await this.handleFailedMfaAttempt(userId, verification.method);
                const currentAttempts = await this.redis.getCache(`mfa_attempts:${userId}:${verification.method}`) || 0;
                const attemptsRemaining = Math.max(0, this.MAX_ATTEMPTS - currentAttempts);
                throw new auth_exceptions_1.InvalidMfaCodeException(attemptsRemaining);
            }
            await this.markChallengeAsUsed(verification.challengeToken);
            if (verification.trustDevice && challengeData.deviceFingerprint) {
                await this.trustDevice(userId, challengeData.deviceFingerprint);
            }
            this.logger.logSecurityEvent('MFA_VERIFICATION_SUCCESS', userId, undefined, undefined, {
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
            switch (provider) {
                case 'TOTP_APP':
                    await this.redis.delCache(`mfa_totp_secret:${userId}`);
                    break;
                case 'SMS_OTP':
                    await this.redis.delCache(`mfa_sms_enabled:${userId}`);
                    break;
                case 'EMAIL_OTP':
                    await this.redis.delCache(`mfa_email_enabled:${userId}`);
                    break;
            }
            await this.redis.delCache(`mfa_backup_codes:${userId}`);
            await this.cleanupUserChallenges(userId);
            this.logger.logSecurityEvent('MFA_DISABLED', userId, undefined, undefined, {
                provider,
                disabledAt: new Date().toISOString()
            });
            this.logger.endOperation('disableMfa', operationId, true);
            return true;
        }
        catch (error) {
            this.logger.endOperation('disableMfa', operationId, false);
            this.logger.error('MFA disable failed', error.stack, 'MfaService.disableMfa', JSON.stringify({
                userId,
                provider,
                error: error.message
            }));
            throw error;
        }
    }
    async getAvailableProviders(userId) {
        const operationId = this.logger.startOperation('getAvailableProviders', { userId });
        try {
            const user = await this.prisma.users.findUnique({
                where: { id: userId },
                select: {
                    phone: true,
                    email: true,
                    email_verified: true,
                    phone_verified: true
                }
            });
            if (!user) {
                throw new common_1.BadRequestException('Utilisateur introuvable');
            }
            const providers = [];
            providers.push('TOTP_APP');
            if (user.email_verified) {
                providers.push('EMAIL_OTP');
            }
            if (user.phone && user.phone_verified) {
                providers.push('SMS_OTP');
            }
            this.logger.endOperation('getAvailableProviders', operationId, true);
            return providers;
        }
        catch (error) {
            this.logger.endOperation('getAvailableProviders', operationId, false);
            this.logger.error('Get available providers failed', error.stack, 'MfaService.getAvailableProviders');
            throw error;
        }
    }
    async requiresMfa(userId, riskScore) {
        const operationId = this.logger.startOperation('requiresMfa', { userId, riskScore });
        try {
            const mfaEnabled = process.env.MFA_ENABLED !== 'false';
            const forceDisabled = process.env.MFA_FORCE_DISABLED === 'true';
            if (!mfaEnabled || forceDisabled) {
                this.logger.endOperation('requiresMfa', operationId, true);
                return false;
            }
            const hasMfaConfigured = await this.userHasMfaConfigured(userId);
            if (!hasMfaConfigured) {
                this.logger.endOperation('requiresMfa', operationId, true);
                return false;
            }
            const requiresMfa = riskScore >= auth_constants_1.AUTH_CONSTANTS.RISK_LEVELS.MEDIUM.min;
            this.logger.endOperation('requiresMfa', operationId, true);
            return requiresMfa;
        }
        catch (error) {
            this.logger.endOperation('requiresMfa', operationId, false);
            this.logger.error('Requires MFA check failed', error.stack, 'MfaService.requiresMfa');
            return true;
        }
    }
    async generateMfaChallenge(userId, availableMethods, deviceFingerprint) {
        const operationId = this.logger.startOperation('generateMfaChallenge', {
            userId,
            methodsCount: availableMethods.length
        });
        try {
            const challengeToken = crypto.randomBytes(32).toString('hex');
            const challengeData = {
                userId,
                methods: availableMethods,
                deviceFingerprint,
                createdAt: new Date().toISOString(),
                expiresAt: new Date(Date.now() + this.CHALLENGE_EXPIRY * 1000).toISOString()
            };
            await this.redis.setCache(`mfa_challenge:${challengeToken}`, challengeData, this.CHALLENGE_EXPIRY);
            await this.sendOtpCodes(userId, availableMethods);
            this.logger.endOperation('generateMfaChallenge', operationId, true);
            return {
                methods: availableMethods,
                challengeToken,
                expiresIn: this.CHALLENGE_EXPIRY
            };
        }
        catch (error) {
            this.logger.endOperation('generateMfaChallenge', operationId, false);
            this.logger.error('Generate MFA challenge failed', error.stack, 'MfaService.generateMfaChallenge');
            throw error;
        }
    }
    async setupTotpApp(userId, email) {
        const secret = speakeasy.generateSecret({
            name: `Entrix (${email})`,
            issuer: 'Entrix V3.0',
            length: 32
        });
        await this.redis.setCache(`mfa_totp_temp:${userId}`, secret.base32, 900);
        const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url || '');
        return {
            provider: 'TOTP_APP',
            secret: secret.base32,
            qrCode: qrCodeUrl
        };
    }
    async setupSmsOtp(userId) {
        await this.redis.setCache(`mfa_sms_enabled:${userId}`, true, 0);
        return {
            provider: 'SMS_OTP'
        };
    }
    async setupEmailOtp(userId) {
        await this.redis.setCache(`mfa_email_enabled:${userId}`, true, 0);
        return {
            provider: 'EMAIL_OTP'
        };
    }
    generateBackupCodes() {
        const codes = [];
        for (let i = 0; i < 10; i++) {
            const code = crypto.randomBytes(4).toString('hex').toUpperCase();
            codes.push(code);
        }
        return codes;
    }
    async storeBackupCodes(userId, codes) {
        await this.redis.setCache(`mfa_backup_codes:${userId}`, codes, 0);
    }
    async validateChallengeToken(challengeToken) {
        if (!challengeToken) {
            return null;
        }
        const data = await this.redis.getCache(`mfa_challenge:${challengeToken}`);
        if (data && data.userId && data.methods) {
            return data;
        }
        return null;
    }
    async checkRateLimit(userId, method) {
        const rateLimitKey = `mfa_attempts:${userId}:${method}`;
        const attempts = await this.redis.getCache(rateLimitKey) || 0;
        if (attempts >= this.MAX_ATTEMPTS) {
            throw new too_many_requests_exception_1.TooManyRequestsException('Trop de tentatives MFA. Réessayez dans 5 minutes.');
        }
        await this.redis.setCache(rateLimitKey, attempts + 1, this.RATE_LIMIT_WINDOW);
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
                await this.redis.delCache(otpKey);
                return true;
            }
            return false;
        }
        catch (error) {
            this.logger.error('OTP verification failed', error.stack, 'MfaService.verifyOtpCode');
            return false;
        }
    }
    async verifyTotpCode(userId, code) {
        try {
            const secret = await this.redis.getCache(`mfa_totp_secret:${userId}`) ||
                await this.redis.getCache(`mfa_totp_temp:${userId}`);
            if (!secret) {
                return false;
            }
            const isValid = speakeasy.totp.verify({
                secret,
                encoding: 'base32',
                token: code,
                window: 1
            });
            if (isValid) {
                const tempSecret = await this.redis.getCache(`mfa_totp_temp:${userId}`);
                if (tempSecret) {
                    await this.redis.setCache(`mfa_totp_secret:${userId}`, tempSecret, 0);
                    await this.redis.delCache(`mfa_totp_temp:${userId}`);
                }
            }
            return isValid;
        }
        catch (error) {
            this.logger.error('TOTP verification failed', error.stack, 'MfaService.verifyTotpCode');
            return false;
        }
    }
    async verifyBackupCode(userId, code) {
        try {
            const backupCodesKey = `mfa_backup_codes:${userId}`;
            const backupCodes = await this.redis.getCache(backupCodesKey) || [];
            const codeIndex = backupCodes.indexOf(code.toUpperCase());
            if (codeIndex !== -1) {
                backupCodes.splice(codeIndex, 1);
                await this.redis.setCache(backupCodesKey, backupCodes, 0);
                return true;
            }
            return false;
        }
        catch (error) {
            this.logger.error('Backup code verification failed', error.stack, 'MfaService.verifyBackupCode');
            return false;
        }
    }
    async handleFailedMfaAttempt(userId, method) {
        try {
            const failureKey = `mfa_failures:${userId}:${method}`;
            const failures = await this.redis.getCache(failureKey) || 0;
            await this.redis.setCache(failureKey, failures + 1, 300);
            this.logger.logSecurityEvent('MFA_VERIFICATION_FAILED', userId, undefined, undefined, {
                method,
                failureCount: failures + 1
            });
        }
        catch (error) {
            this.logger.error('Handle failed MFA attempt error', error.stack, 'MfaService.handleFailedMfaAttempt');
        }
    }
    async markChallengeAsUsed(challengeToken) {
        try {
            const challengeKey = `mfa_challenge:${challengeToken}`;
            await this.redis.delCache(challengeKey);
        }
        catch (error) {
            this.logger.error('Mark challenge as used failed', error.stack, 'MfaService.markChallengeAsUsed');
        }
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
            this.logger.error('Trust device failed', error.stack, 'MfaService.trustDevice');
        }
    }
    async userHasMfaConfigured(userId) {
        try {
            const totpSecret = await this.redis.getCache(`mfa_totp_secret:${userId}`);
            const smsEnabled = await this.redis.getCache(`mfa_sms_enabled:${userId}`);
            const emailEnabled = await this.redis.getCache(`mfa_email_enabled:${userId}`);
            return !!(totpSecret || smsEnabled || emailEnabled);
        }
        catch (error) {
            this.logger.error('Check MFA configured failed', error.stack, 'MfaService.userHasMfaConfigured');
            return false;
        }
    }
    async sendOtpCodes(userId, methods) {
        try {
            for (const method of methods) {
                if (method === 'SMS_OTP') {
                    await this.sendSmsOtp(userId);
                }
                else if (method === 'EMAIL_OTP') {
                    await this.sendEmailOtp(userId);
                }
            }
        }
        catch (error) {
            this.logger.error('Send OTP codes failed', error.stack, 'MfaService.sendOtpCodes');
        }
    }
    async sendSmsOtp(userId) {
        try {
            const code = crypto.randomInt(100000, 999999).toString();
            await this.redis.setCache(`mfa_otp:${userId}:SMS_OTP`, code, this.OTP_EXPIRY);
            const user = await this.prisma.users.findUnique({
                where: { id: userId },
                select: { phone: true, first_name: true }
            });
            if (user?.phone) {
                this.logger.info('SMS OTP sent', JSON.stringify({
                    userId,
                    phone: user.phone.substring(0, 3) + '***'
                }));
            }
        }
        catch (error) {
            this.logger.error('Send SMS OTP failed', error.stack, 'MfaService.sendSmsOtp');
        }
    }
    async sendEmailOtp(userId) {
        try {
            const code = crypto.randomInt(100000, 999999).toString();
            await this.redis.setCache(`mfa_otp:${userId}:EMAIL_OTP`, code, this.OTP_EXPIRY);
            const user = await this.prisma.users.findUnique({
                where: { id: userId },
                select: { email: true, first_name: true }
            });
            if (user?.email) {
                await this.email.sendMail({
                    to: user.email,
                    subject: 'Code de vérification Entrix',
                    template: 'mfa-code',
                    context: {
                        firstName: user.first_name,
                        code,
                        expiresIn: Math.floor(this.OTP_EXPIRY / 60)
                    }
                });
                this.logger.info('Email OTP sent', JSON.stringify({
                    userId,
                    email: user.email.substring(0, 3) + '***@***'
                }));
            }
        }
        catch (error) {
            this.logger.error('Send Email OTP failed', error.stack, 'MfaService.sendEmailOtp');
        }
    }
    async cleanupUserChallenges(userId) {
        try {
            const pattern = `mfa_challenge:*`;
            const keys = await this.redis.keys(pattern);
            for (const key of keys) {
                const challengeData = await this.redis.getCache(key);
                if (challengeData && challengeData.userId === userId) {
                    await this.redis.delCache(key);
                }
            }
        }
        catch (error) {
            this.logger.error('Cleanup user challenges failed', error.stack, 'MfaService.cleanupUserChallenges');
        }
    }
    async generateChallengeForAuth(userId, email, deviceInfo) {
        const operationId = this.logger.startOperation('generateChallengeForAuth', { userId });
        try {
            const availableMethods = await this.getUserAvailableMethods(userId);
            const challenge = await this.generateMfaChallenge(userId, availableMethods, deviceInfo.deviceFingerprint);
            this.logger.logBusinessEvent('MFA_CHALLENGE_FOR_AUTH', {
                userId,
                email,
                methods: availableMethods,
                deviceFingerprint: deviceInfo.deviceFingerprint,
            }, userId);
            this.logger.endOperation('generateChallengeForAuth', operationId, true);
            return challenge;
        }
        catch (error) {
            this.logger.logErrorEvent(error, 'MfaService.generateChallengeForAuth', userId, JSON.stringify({ email, deviceInfo: { ipAddress: deviceInfo.ipAddress } }));
            this.logger.endOperation('generateChallengeForAuth', operationId, false);
            throw error;
        }
    }
    async getUserAvailableMethods(userId) {
        const methods = [];
        try {
            const hasMfaConfigured = await this.userHasMfaConfigured(userId);
            if (!hasMfaConfigured) {
                methods.push('EMAIL_OTP');
                return methods;
            }
            const [totpSecret, smsEnabled, emailEnabled] = await Promise.all([
                this.redis.getCache(`mfa_totp_secret:${userId}`),
                this.redis.getCache(`mfa_sms_enabled:${userId}`),
                this.redis.getCache(`mfa_email_enabled:${userId}`)
            ]);
            if (totpSecret)
                methods.push('TOTP_APP');
            if (smsEnabled)
                methods.push('SMS_OTP');
            if (emailEnabled)
                methods.push('EMAIL_OTP');
            if (methods.length === 0) {
                methods.push('EMAIL_OTP');
            }
        }
        catch (error) {
            this.logger.warn('Erreur getUserAvailableMethods', JSON.stringify({
                userId,
                error: error.message,
            }));
            methods.push('EMAIL_OTP');
        }
        return methods;
    }
    async isMfaRequiredForRisk(userId, riskScore) {
        return await this.requiresMfa(userId, riskScore);
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