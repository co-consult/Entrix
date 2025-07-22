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
const redis_service_1 = require("../../shared/redis/redis.service");
const email_service_1 = require("../../shared/email/email.service");
const logger_service_1 = require("../../shared/logger/logger.service");
function generateCode(length = 6) {
    return Array.from({ length }, () => Math.floor(Math.random() * 10)).join('');
}
let MfaService = class MfaService {
    redis;
    email;
    logger;
    MFA_PREFIX = 'mfa:';
    MFA_EXPIRY = 600;
    constructor(redis, email, logger) {
        this.redis = redis;
        this.email = email;
        this.logger = logger;
    }
    async createChallenge(userId, method) {
        const code = generateCode();
        const expiresAt = new Date(Date.now() + this.MFA_EXPIRY * 1000);
        const challenge = {
            userId,
            method,
            code,
            expiresAt,
            verified: false,
            attempts: 0,
            maxAttempts: 3
        };
        const key = `${this.MFA_PREFIX}${userId}:${method}`;
        await this.redis.setCache(key, challenge, this.MFA_EXPIRY);
        if (method === 'email') {
            await this.sendEmailCode(userId, code);
        }
        else if (method === 'sms') {
            await this.sendSmsCode(userId, code);
        }
        this.logger.log(`MFA challenge created for user ${userId} via ${method}`);
        return challenge;
    }
    async verifyChallenge(userId, code, method) {
        const key = `${this.MFA_PREFIX}${userId}:${method}`;
        const challenge = await this.redis.getCache(key);
        if (!challenge) {
            this.logger.warn(`No MFA challenge found for user ${userId} method ${method}`);
            return false;
        }
        if (challenge.verified) {
            this.logger.warn(`MFA challenge already verified for user ${userId}`);
            return false;
        }
        if (challenge.expiresAt < new Date()) {
            await this.redis.del(key);
            this.logger.warn(`MFA challenge expired for user ${userId}`);
            return false;
        }
        challenge.attempts++;
        if (challenge.attempts > challenge.maxAttempts) {
            await this.redis.del(key);
            this.logger.warn(`Max MFA attempts exceeded for user ${userId}`);
            return false;
        }
        if (challenge.code !== code) {
            await this.redis.setCache(key, challenge, this.MFA_EXPIRY);
            this.logger.warn(`Invalid MFA code for user ${userId} (attempt ${challenge.attempts})`);
            return false;
        }
        challenge.verified = true;
        await this.redis.setCache(key, challenge, this.MFA_EXPIRY);
        this.logger.log(`MFA challenge verified for user ${userId}`);
        return true;
    }
    async invalidateChallenge(userId, method) {
        const key = `${this.MFA_PREFIX}${userId}:${method}`;
        await this.redis.del(key);
        this.logger.log(`MFA challenge invalidated for user ${userId} method ${method}`);
    }
    async getChallenge(userId, method) {
        const key = `${this.MFA_PREFIX}${userId}:${method}`;
        return await this.redis.getCache(key);
    }
    async sendEmailCode(userId, code) {
        try {
            await this.email.sendMail({
                to: 'user@example.com',
                subject: 'Code de vérification MFA',
                template: 'mfa-code',
                context: {
                    code,
                    expiryMinutes: 10
                }
            });
            this.logger.log(`MFA email code sent to user ${userId}`);
        }
        catch (error) {
            this.logger.error(`Failed to send MFA email code to user ${userId}:`, error);
            throw error;
        }
    }
    async sendSmsCode(userId, code) {
        try {
            this.logger.log(`MFA SMS code would be sent to user ${userId}: ${code}`);
        }
        catch (error) {
            this.logger.error(`Failed to send MFA SMS code to user ${userId}:`, error);
            throw error;
        }
    }
    async isUserMfaEnabled(userId) {
        return false;
    }
    async getUserMfaMethods(userId) {
        return ['email'];
    }
    async setupTotp(userId) {
        return {
            secret: 'TEMP_SECRET',
            qrCode: 'data:image/png;base64,...'
        };
    }
    async enableMfa(userId, method) {
        this.logger.log(`MFA enabled for user ${userId} with method ${method}`);
    }
    async disableMfa(userId) {
        this.logger.log(`MFA disabled for user ${userId}`);
    }
    async cleanupExpiredChallenges() {
        return 0;
    }
};
exports.MfaService = MfaService;
exports.MfaService = MfaService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [redis_service_1.RedisService,
        email_service_1.EmailService,
        logger_service_1.LoggerService])
], MfaService);
//# sourceMappingURL=mfa.service.js.map