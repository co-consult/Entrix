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
let MfaService = class MfaService {
    prisma;
    redis;
    email;
    config;
    logger;
    encryptionKey;
    issuerName;
    constructor(prisma, redis, email, config, logger) {
        this.prisma = prisma;
        this.redis = redis;
        this.email = email;
        this.config = config;
        this.logger = logger.createChildLogger('MfaService');
        this.encryptionKey = this.config.get('MFA_ENCRYPTION_KEY') || crypto.randomBytes(32).toString('hex');
        this.issuerName = this.config.get('MFA_ISSUER_NAME', 'Entrix');
    }
    async enableMfa(userId, method, config) {
        this.logger.log(`Activation MFA ${method} pour utilisateur: ${userId}`);
        try {
            const user = await this.prisma.users.findUnique({
                where: { id: userId },
                select: {
                    id: true,
                    email: true,
                    phone: true,
                    first_name: true,
                    last_name: true,
                },
            });
            if (!user) {
                throw new common_1.BadRequestException('Utilisateur non trouvé');
            }
            let mfaConfig;
            switch (method) {
                case 'TOTP':
                    mfaConfig = await this.enableTotpMfa(userId, config);
                    break;
                case 'SMS':
                    if (!user.phone && !config.phoneNumber) {
                        throw new common_1.BadRequestException('Numéro de téléphone requis pour SMS MFA');
                    }
                    mfaConfig = await this.enableSmsMfa(userId, config.phoneNumber || user.phone);
                    break;
                case 'EMAIL':
                    mfaConfig = await this.enableEmailMfa(userId, config.backupEmail || user.email);
                    break;
                default:
                    throw new common_1.BadRequestException(`Méthode MFA non supportée: ${method}`);
            }
            this.logger.log(`MFA ${method} activé avec succès pour: ${userId}`);
            return mfaConfig;
        }
        catch (error) {
            this.logger.error(`Erreur activation MFA ${method} pour ${userId}:`, error);
            throw error;
        }
    }
    async disableMfa(userId, method) {
        this.logger.log(`Désactivation MFA pour utilisateur: ${userId}, méthode: ${method || 'toutes'}`);
        try {
            const whereClause = { user_id: userId };
            if (method) {
                whereClause.method = method;
            }
            await this.prisma.mfa_tokens.updateMany({
                where: whereClause,
                data: {
                    is_used: true,
                    used_at: new Date(),
                },
            });
            const cacheKey = method ? `mfa:${userId}:${method}` : `mfa:${userId}:*`;
            if (method) {
                await this.redis.del(cacheKey);
            }
            else {
                const methods = ['TOTP', 'SMS', 'EMAIL', 'APP_PUSH', 'HARDWARE_TOKEN', 'BIOMETRIC', 'BACKUP_CODES'];
                const deletePromises = methods.map(m => this.redis.del(`mfa:${userId}:${m}`));
                await Promise.all(deletePromises);
            }
            this.logger.log(`MFA désactivé pour: ${userId}`);
        }
        catch (error) {
            this.logger.error(`Erreur désactivation MFA pour ${userId}:`, error);
            throw new common_1.BadRequestException('Impossible de désactiver MFA');
        }
    }
    async generateMfaToken(userId, method) {
        this.logger.log(`Génération token MFA ${method} pour: ${userId}`);
        try {
            await this.checkMfaRateLimit(userId, method);
            let token;
            let secret;
            const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
            switch (method) {
                case 'TOTP':
                    throw new common_1.BadRequestException('TOTP ne génère pas de tokens, utilisez verifyTotp()');
                case 'SMS':
                case 'EMAIL':
                    token = this.generateNumericToken(6);
                    break;
                default:
                    token = this.generateAlphanumericToken(8);
            }
            const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
            const mfaToken = await this.prisma.mfa_tokens.create({
                data: {
                    user_id: userId,
                    method,
                    token_hash: tokenHash,
                    secret: secret ? this.encrypt(secret) : undefined,
                    expires_at: expiresAt,
                    is_used: false,
                },
            });
            if (method === 'SMS') {
                await this.sendSmsToken(userId, token);
            }
            else if (method === 'EMAIL') {
                await this.sendEmailToken(userId, token);
            }
            return this.mapToMfaToken(mfaToken, token);
        }
        catch (error) {
            this.logger.error(`Erreur génération token MFA ${method} pour ${userId}:`, error);
            throw error;
        }
    }
    async verifyMfaToken(userId, method, token) {
        this.logger.log(`Vérification token MFA ${method} pour: ${userId}`);
        try {
            if (method === 'TOTP') {
                return this.verifyTotp(userId, token);
            }
            const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
            const mfaToken = await this.prisma.mfa_tokens.findFirst({
                where: {
                    user_id: userId,
                    method,
                    token_hash: tokenHash,
                    is_used: false,
                    expires_at: { gt: new Date() },
                },
            });
            if (!mfaToken) {
                this.logger.warn(`Token MFA invalide ou expiré pour ${userId}, méthode: ${method}`);
                return false;
            }
            await this.prisma.mfa_tokens.update({
                where: { id: mfaToken.id },
                data: {
                    is_used: true,
                    used_at: new Date(),
                },
            });
            this.logger.log(`Token MFA vérifié avec succès pour: ${userId}`);
            return true;
        }
        catch (error) {
            this.logger.error(`Erreur vérification token MFA ${method} pour ${userId}:`, error);
            return false;
        }
    }
    async setupTotp(userId) {
        this.logger.log(`Configuration TOTP pour: ${userId}`);
        try {
            const user = await this.prisma.users.findUnique({
                where: { id: userId },
                select: { email: true, first_name: true, last_name: true },
            });
            if (!user) {
                throw new common_1.BadRequestException('Utilisateur non trouvé');
            }
            const secret = speakeasy.generateSecret({
                name: `${user.first_name} ${user.last_name}`,
                account: user.email,
                issuer: this.issuerName,
                length: 32,
            });
            const qrCodeUrl = speakeasy.otpauthURL({
                secret: secret.ascii,
                label: user.email,
                issuer: this.issuerName,
                encoding: 'ascii',
            });
            const qrCode = await qrcode.toDataURL(qrCodeUrl);
            const backupCodes = this.generateBackupCodesArray();
            await this.prisma.mfa_tokens.create({
                data: {
                    user_id: userId,
                    method: 'TOTP',
                    token_hash: 'temp_setup',
                    secret: this.encrypt(secret.base32),
                    expires_at: new Date(Date.now() + 10 * 60 * 1000),
                    is_used: false,
                    metadata: JSON.stringify({
                        backupCodes: backupCodes.map(code => crypto.createHash('sha256').update(code).digest('hex')),
                        setupComplete: false,
                    }),
                },
            });
            return {
                secret: secret.base32,
                qrCode,
                backupCodes,
            };
        }
        catch (error) {
            this.logger.error(`Erreur configuration TOTP pour ${userId}:`, error);
            throw new common_1.BadRequestException('Impossible de configurer TOTP');
        }
    }
    async verifyTotp(userId, token) {
        try {
            const mfaConfig = await this.prisma.mfa_tokens.findFirst({
                where: {
                    user_id: userId,
                    method: 'TOTP',
                    is_used: false,
                },
                orderBy: { created_at: 'desc' },
            });
            if (!mfaConfig || !mfaConfig.secret) {
                return false;
            }
            const secret = this.decrypt(mfaConfig.secret);
            const verified = speakeasy.totp.verify({
                secret,
                token,
                encoding: 'base32',
                window: 2,
            });
            if (verified) {
                if (mfaConfig.token_hash === 'temp_setup') {
                    await this.prisma.mfa_tokens.update({
                        where: { id: mfaConfig.id },
                        data: {
                            token_hash: crypto.createHash('sha256').update(userId + 'totp_active').digest('hex'),
                            metadata: JSON.stringify({
                                ...JSON.parse(String(mfaConfig.metadata || '{}')),
                                setupComplete: true,
                                activatedAt: new Date().toISOString(),
                            }),
                        },
                    });
                }
                this.logger.log(`TOTP vérifié avec succès pour: ${userId}`);
            }
            return verified;
        }
        catch (error) {
            this.logger.error(`Erreur vérification TOTP pour ${userId}:`, error);
            return false;
        }
    }
    async generateBackupCodes(userId) {
        this.logger.log(`Génération codes de secours pour: ${userId}`);
        try {
            const backupCodes = this.generateBackupCodesArray();
            await this.prisma.mfa_tokens.create({
                data: {
                    user_id: userId,
                    method: 'BACKUP_CODES',
                    token_hash: 'backup_codes',
                    expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
                    is_used: false,
                    metadata: JSON.stringify({
                        codes: backupCodes.map(code => crypto.createHash('sha256').update(code).digest('hex')),
                        generatedAt: new Date().toISOString(),
                    }),
                },
            });
            return backupCodes;
        }
        catch (error) {
            this.logger.error(`Erreur génération codes de secours pour ${userId}:`, error);
            throw new common_1.BadRequestException('Impossible de générer les codes de secours');
        }
    }
    async useBackupCode(userId, code) {
        this.logger.log(`Utilisation code de secours pour: ${userId}`);
        try {
            const codeHash = crypto.createHash('sha256').update(code).digest('hex');
            const backupCodesRecord = await this.prisma.mfa_tokens.findFirst({
                where: {
                    user_id: userId,
                    method: 'BACKUP_CODES',
                    is_used: false,
                },
                orderBy: { created_at: 'desc' },
            });
            if (!backupCodesRecord?.metadata) {
                return false;
            }
            const metadata = JSON.parse(String(backupCodesRecord.metadata));
            const codes = metadata.codes || [];
            if (!codes.includes(codeHash)) {
                return false;
            }
            const updatedCodes = codes.filter(c => c !== codeHash);
            await this.prisma.mfa_tokens.update({
                where: { id: backupCodesRecord.id },
                data: {
                    metadata: JSON.stringify({
                        ...metadata,
                        codes: updatedCodes,
                        lastUsed: new Date().toISOString(),
                    }),
                },
            });
            this.logger.log(`Code de secours utilisé avec succès pour: ${userId}`);
            return true;
        }
        catch (error) {
            this.logger.error(`Erreur utilisation code de secours pour ${userId}:`, error);
            return false;
        }
    }
    async getUserMfaConfig(userId) {
        try {
            const mfaTokens = await this.prisma.mfa_tokens.findMany({
                where: {
                    user_id: userId,
                    is_used: false,
                    expires_at: { gt: new Date() },
                },
            });
            if (mfaTokens.length === 0) {
                return null;
            }
            const totpConfig = mfaTokens.find(t => t.method === 'TOTP');
            const activeConfig = totpConfig || mfaTokens[0];
            return {
                method: activeConfig.method,
                enabled: true,
                secret: activeConfig.secret ? this.decrypt(activeConfig.secret) : undefined,
            };
        }
        catch (error) {
            this.logger.error(`Erreur récupération config MFA pour ${userId}:`, error);
            return null;
        }
    }
    async isMfaRequired(userId, context) {
        try {
            const mfaConfig = await this.getUserMfaConfig(userId);
            return mfaConfig !== null;
        }
        catch (error) {
            this.logger.error(`Erreur vérification MFA requis pour ${userId}:`, error);
            return false;
        }
    }
    async sendSmsCode(userId, phoneNumber) {
        this.logger.log(`Envoi code SMS pour: ${userId}`);
        this.logger.warn(`SMS MFA non implémenté. Code à envoyer au ${phoneNumber}`);
    }
    async sendEmailCode(userId, email) {
        this.logger.log(`Envoi code email pour: ${userId}`);
    }
    async enableTotpMfa(userId, config) {
        const setupResult = await this.setupTotp(userId);
        return {
            method: 'TOTP',
            enabled: true,
            secret: setupResult.secret,
            qrCodeUrl: setupResult.qrCode,
            backupCodes: setupResult.backupCodes,
        };
    }
    async enableSmsMfa(userId, phoneNumber) {
        return {
            method: 'SMS',
            enabled: true,
            phoneNumber,
        };
    }
    async enableEmailMfa(userId, email) {
        return {
            method: 'EMAIL',
            enabled: true,
            backupEmail: email,
        };
    }
    generateNumericToken(length) {
        let token = '';
        for (let i = 0; i < length; i++) {
            token += Math.floor(Math.random() * 10);
        }
        return token;
    }
    generateAlphanumericToken(length) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let token = '';
        for (let i = 0; i < length; i++) {
            token += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return token;
    }
    generateBackupCodesArray() {
        const codes = [];
        for (let i = 0; i < 10; i++) {
            codes.push(this.generateAlphanumericToken(8));
        }
        return codes;
    }
    encrypt(text) {
        const cipher = crypto.createCipher('aes-256-cbc', this.encryptionKey);
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        return encrypted;
    }
    decrypt(encryptedText) {
        const decipher = crypto.createDecipher('aes-256-cbc', this.encryptionKey);
        let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }
    async checkMfaRateLimit(userId, method) {
        const key = `mfa_rate_limit:${userId}:${method}`;
        const attempts = await this.redis.get(key);
        if (attempts && parseInt(attempts) >= 5) {
            throw new common_1.BadRequestException('Trop de tentatives MFA, réessayez dans 15 minutes');
        }
        await this.redis.set(key, (parseInt(attempts || '0') + 1).toString(), 900);
    }
    async sendSmsToken(userId, token) {
        this.logger.log(`Code SMS ${token} à envoyer pour utilisateur ${userId}`);
    }
    async sendEmailToken(userId, token) {
        try {
            const user = await this.prisma.users.findUnique({
                where: { id: userId },
                select: { email: true, first_name: true },
            });
            if (user) {
                await this.email.sendMail({
                    to: user.email,
                    subject: 'Code de vérification Entrix',
                    template: 'mfa-code',
                    context: {
                        firstName: user.first_name,
                        code: token,
                        expiresIn: '5 minutes',
                    },
                });
            }
        }
        catch (error) {
            this.logger.error('Erreur envoi email MFA:', error);
        }
    }
    mapToMfaToken(dbToken, plainToken) {
        return {
            id: dbToken.id,
            userId: dbToken.user_id,
            method: dbToken.method,
            tokenHash: dbToken.token_hash,
            secret: dbToken.secret,
            expiresAt: dbToken.expires_at,
            isUsed: dbToken.is_used,
            metadata: dbToken.metadata ? JSON.parse(String(dbToken.metadata)) : undefined,
        };
    }
    async createChallenge(userId, method) {
        this.logger.log(`Création d'un challenge MFA ${method} pour l'utilisateur: ${userId}`);
        try {
            await this.checkMfaRateLimit(userId, method);
            let challengeId;
            const expiresIn = 300;
            switch (method) {
                case 'email':
                    challengeId = await this.createEmailChallenge(userId);
                    break;
                case 'sms':
                    challengeId = await this.createSmsChallenge(userId);
                    break;
                case 'totp':
                    challengeId = `totp_${userId}_${Date.now()}`;
                    break;
                default:
                    throw new common_1.BadRequestException(`Méthode MFA non supportée: ${method}`);
            }
            return {
                challengeId,
                expiresIn,
            };
        }
        catch (error) {
            this.logger.error(`Erreur création challenge MFA ${method} pour ${userId}:`, error);
            throw error;
        }
    }
    async verifyChallenge(userId, code, method) {
        this.logger.log(`Vérification challenge MFA ${method} pour l'utilisateur: ${userId}`);
        try {
            switch (method) {
                case 'email':
                    return await this.verifyEmailChallenge(userId, code);
                case 'sms':
                    return await this.verifySmsChallenge(userId, code);
                case 'totp':
                    return await this.verifyTotp(userId, code);
                default:
                    throw new common_1.BadRequestException(`Méthode MFA non supportée: ${method}`);
            }
        }
        catch (error) {
            this.logger.error(`Erreur vérification challenge MFA ${method} pour ${userId}:`, error);
            return false;
        }
    }
    async createEmailChallenge(userId) {
        const mfaToken = await this.generateMfaToken(userId, 'EMAIL');
        const user = await this.prisma.users.findUnique({
            where: { id: userId },
            select: { email: true, first_name: true }
        });
        if (!user) {
            throw new common_1.BadRequestException('Utilisateur non trouvé');
        }
        const token = this.generateNumericToken(6);
        await this.email.sendMail({
            to: user.email,
            subject: 'Code de vérification Entrix',
            template: 'mfa-email',
            context: {
                firstName: user.first_name,
                code: token,
                expiresIn: '5 minutes'
            }
        });
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
        await this.redis.set(`mfa:email:${userId}`, tokenHash, 300);
        return mfaToken.id;
    }
    async createSmsChallenge(userId) {
        const mfaToken = await this.generateMfaToken(userId, 'SMS');
        const user = await this.prisma.users.findUnique({
            where: { id: userId },
            select: { phone: true, first_name: true }
        });
        if (!user || !user.phone) {
            throw new common_1.BadRequestException('Numéro de téléphone non configuré');
        }
        const token = this.generateNumericToken(6);
        this.logger.log(`SMS MFA code for ${userId}: ${token} (not sent - SMS provider not configured)`);
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
        await this.redis.set(`mfa:sms:${userId}`, tokenHash, 300);
        return mfaToken.id;
    }
    async verifyEmailChallenge(userId, code) {
        const storedTokenHash = await this.redis.get(`mfa:email:${userId}`);
        if (!storedTokenHash) {
            return false;
        }
        const providedTokenHash = crypto.createHash('sha256').update(code).digest('hex');
        if (storedTokenHash === providedTokenHash) {
            await this.redis.del(`mfa:email:${userId}`);
            return true;
        }
        return false;
    }
    async verifySmsChallenge(userId, code) {
        const storedTokenHash = await this.redis.get(`mfa:sms:${userId}`);
        if (!storedTokenHash) {
            return false;
        }
        const providedTokenHash = crypto.createHash('sha256').update(code).digest('hex');
        if (storedTokenHash === providedTokenHash) {
            await this.redis.del(`mfa:sms:${userId}`);
            return true;
        }
        return false;
    }
};
exports.MfaService = MfaService;
exports.MfaService = MfaService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        redis_service_1.RedisService,
        email_service_1.EmailService,
        config_1.ConfigService,
        logger_service_1.LoggerService])
], MfaService);
//# sourceMappingURL=mfa.service.js.map