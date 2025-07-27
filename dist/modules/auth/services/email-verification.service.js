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
exports.EmailVerificationService = void 0;
const common_1 = require("@nestjs/common");
const logger_service_1 = require("../../../shared/logger/logger.service");
const prisma_service_1 = require("../../../shared/prisma/prisma.service");
const redis_service_1 = require("../../../shared/redis/redis.service");
const email_service_1 = require("../../../shared/email/email.service");
const crypto_util_1 = require("../utils/crypto.util");
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcrypt"));
let EmailVerificationService = class EmailVerificationService {
    prisma;
    redis;
    email;
    logger;
    TOKEN_EXPIRY = 24 * 60 * 60;
    CACHE_PREFIX = 'email_verification:';
    USE_REDIS_CACHE = true;
    constructor(prisma, redis, email, loggerService) {
        this.prisma = prisma;
        this.redis = redis;
        this.email = email;
        this.logger = loggerService.createChildLogger('EmailVerificationService');
    }
    async generateVerificationToken(userId, email) {
        const operationId = this.logger.startOperation('generateVerificationToken', {
            userId,
            email,
        });
        try {
            const token = crypto_util_1.CryptoUtil.generateSecureToken(32);
            const tokenHash = await bcrypt.hash(token, 10);
            const expiresAt = new Date(Date.now() + this.TOKEN_EXPIRY * 1000);
            await this.cleanupOldTokens(userId);
            const dbToken = await this.prisma.mfa_tokens.create({
                data: {
                    user_id: userId,
                    method: client_1.mfa_method.EMAIL,
                    token_hash: tokenHash,
                    expires_at: expiresAt,
                    is_used: false,
                    metadata: {
                        email,
                        tokenType: 'EMAIL_VERIFICATION',
                        purpose: 'account_verification',
                    },
                },
            });
            if (this.USE_REDIS_CACHE) {
                try {
                    const cacheData = {
                        id: dbToken.id,
                        userId,
                        email,
                        expiresAt: expiresAt.toISOString(),
                    };
                    await this.redis.setCache(`${this.CACHE_PREFIX}${token}`, cacheData, this.TOKEN_EXPIRY);
                }
                catch (cacheError) {
                    this.logger.warn('Failed to cache email verification token', JSON.stringify({
                        userId,
                        error: cacheError.message,
                    }));
                }
            }
            this.logger.logBusinessEvent('EMAIL_VERIFICATION_TOKEN_GENERATED', {
                userId,
                email,
                tokenId: dbToken.id,
                expiresAt: expiresAt.toISOString(),
            }, userId);
            this.logger.endOperation('generateVerificationToken', operationId, true);
            return {
                id: dbToken.id,
                token,
                userId,
                email,
                expiresAt,
            };
        }
        catch (error) {
            this.logger.endOperation('generateVerificationToken', operationId, false, undefined, {
                error: error.message,
            });
            this.logger.error('Failed to generate email verification token', error.stack, 'EmailVerificationService.generateVerificationToken', JSON.stringify({ userId, email }));
            throw error;
        }
    }
    async verifyEmailToken(token) {
        const operationId = this.logger.startOperation('verifyEmailToken', {
            tokenLength: token?.length,
        });
        try {
            this.logger.info('Email verification attempt started', JSON.stringify({
                tokenPrefix: token?.substring(0, 8),
            }));
            if (!token || typeof token !== 'string' || token.length < 10) {
                this.logger.warn('Invalid token format for email verification');
                this.logger.endOperation('verifyEmailToken', operationId, false, undefined, {
                    reason: 'invalid_token_format',
                });
                return {
                    success: false,
                    verified: false,
                    message: 'Token de vérification invalide',
                };
            }
            let verificationData = null;
            if (this.USE_REDIS_CACHE) {
                try {
                    verificationData = await this.redis.getCache(`${this.CACHE_PREFIX}${token}`);
                }
                catch (cacheError) {
                    this.logger.warn('Redis cache error, falling back to database', JSON.stringify({
                        error: cacheError.message,
                    }));
                }
            }
            if (!verificationData) {
                const dbTokens = await this.prisma.mfa_tokens.findMany({
                    where: {
                        method: client_1.mfa_method.EMAIL,
                        is_used: false,
                        expires_at: { gt: new Date() },
                    },
                    include: {
                        users: {
                            select: {
                                id: true,
                                email: true,
                                email_verified: true,
                                is_active: true,
                                first_name: true,
                                last_name: true,
                            }
                        }
                    }
                });
                let matchedToken = null;
                for (const dbToken of dbTokens) {
                    const isMatch = await bcrypt.compare(token, dbToken.token_hash);
                    if (isMatch) {
                        matchedToken = dbToken;
                        break;
                    }
                }
                if (!matchedToken) {
                    this.logger.warn('Email verification token not found or expired', JSON.stringify({
                        tokenPrefix: token.substring(0, 8),
                    }));
                    this.logger.endOperation('verifyEmailToken', operationId, false, undefined, {
                        reason: 'token_not_found',
                    });
                    return {
                        success: false,
                        verified: false,
                        message: 'Token de vérification expiré ou invalide',
                    };
                }
                verificationData = {
                    id: matchedToken.id,
                    userId: matchedToken.user_id,
                    email: matchedToken.metadata?.email || matchedToken.users.email,
                    expiresAt: matchedToken.expires_at.toISOString(),
                };
            }
            const expiresAt = new Date(verificationData.expiresAt);
            const now = new Date();
            if (now > expiresAt) {
                this.logger.warn('Email verification token expired', JSON.stringify({
                    userId: verificationData.userId,
                    email: verificationData.email,
                    expiresAt: verificationData.expiresAt,
                }));
                await this.markTokenAsUsed(verificationData.id, token);
                this.logger.endOperation('verifyEmailToken', operationId, false, undefined, {
                    reason: 'token_expired',
                });
                return {
                    success: false,
                    verified: false,
                    message: 'Token de vérification expiré',
                };
            }
            const user = await this.prisma.users.findUnique({
                where: { id: verificationData.userId },
                select: {
                    id: true,
                    email: true,
                    email_verified: true,
                    is_active: true,
                    first_name: true,
                    last_name: true,
                }
            });
            if (!user) {
                this.logger.warn('User not found for email verification', JSON.stringify({
                    userId: verificationData.userId,
                    email: verificationData.email,
                }));
                await this.markTokenAsUsed(verificationData.id, token);
                this.logger.endOperation('verifyEmailToken', operationId, false, undefined, {
                    reason: 'user_not_found',
                });
                return {
                    success: false,
                    verified: false,
                    message: 'Utilisateur introuvable',
                };
            }
            if (user.email !== verificationData.email) {
                this.logger.warn('Email mismatch in verification token', JSON.stringify({
                    userId: user.id,
                    userEmail: user.email,
                    tokenEmail: verificationData.email,
                }));
                await this.markTokenAsUsed(verificationData.id, token);
                this.logger.endOperation('verifyEmailToken', operationId, false, undefined, {
                    reason: 'email_mismatch',
                });
                return {
                    success: false,
                    verified: false,
                    message: 'Token de vérification invalide',
                };
            }
            if (user.email_verified) {
                this.logger.info('Email already verified', JSON.stringify({
                    userId: user.id,
                    email: user.email,
                    verifiedAt: user.email_verified,
                }));
                await this.markTokenAsUsed(verificationData.id, token);
                this.logger.endOperation('verifyEmailToken', operationId, true, undefined, {
                    reason: 'already_verified',
                });
                return {
                    success: true,
                    verified: true,
                    message: 'Email déjà vérifié',
                    userId: user.id,
                };
            }
            const updatedUser = await this.prisma.users.update({
                where: { id: user.id },
                data: {
                    email_verified: true,
                },
                select: {
                    id: true,
                    email: true,
                    email_verified: true,
                    first_name: true,
                    last_name: true,
                }
            });
            await this.markTokenAsUsed(verificationData.id, token);
            this.logger.logBusinessEvent('EMAIL_VERIFIED', {
                userId: user.id,
                email: user.email,
                verifiedAt: updatedUser.email_verified,
                firstName: user.first_name,
                lastName: user.last_name,
            }, user.id);
            try {
                await this.email.sendEmail({
                    to: user.email,
                    subject: 'Email vérifié avec succès ! ✅',
                    template: 'email-verified',
                    context: {
                        firstName: user.first_name,
                        verifiedAt: updatedUser.email_verified,
                    },
                });
            }
            catch (emailError) {
                this.logger.warn('Failed to send email verification confirmation', JSON.stringify({
                    userId: user.id,
                    email: user.email,
                    error: emailError.message,
                }));
            }
            this.logger.endOperation('verifyEmailToken', operationId, true);
            return {
                success: true,
                verified: true,
                message: 'Email vérifié avec succès',
                userId: user.id,
            };
        }
        catch (error) {
            this.logger.endOperation('verifyEmailToken', operationId, false, undefined, {
                error: error.message,
            });
            this.logger.error('Email verification failed with unexpected error', error.stack, 'EmailVerificationService.verifyEmailToken', JSON.stringify({
                tokenPrefix: token?.substring(0, 8),
                error: error.message,
            }));
            return {
                success: false,
                verified: false,
                message: 'Erreur lors de la vérification de l\'email',
            };
        }
    }
    async markTokenAsUsed(tokenId, token) {
        try {
            await this.prisma.mfa_tokens.update({
                where: { id: tokenId },
                data: {
                    is_used: true,
                    used_at: new Date(),
                },
            });
            if (this.USE_REDIS_CACHE) {
                await this.redis.delCache(`${this.CACHE_PREFIX}${token}`);
            }
        }
        catch (error) {
            this.logger.error('Failed to mark token as used', error.stack, 'EmailVerificationService.markTokenAsUsed', JSON.stringify({ tokenId, tokenPrefix: token?.substring(0, 8) }));
        }
    }
    async cleanupOldTokens(userId) {
        try {
            await this.prisma.mfa_tokens.updateMany({
                where: {
                    user_id: userId,
                    method: client_1.mfa_method.EMAIL,
                    is_used: false,
                    metadata: {
                        path: ['tokenType'],
                        equals: 'EMAIL_VERIFICATION',
                    },
                },
                data: {
                    is_used: true,
                    used_at: new Date(),
                },
            });
        }
        catch (error) {
            this.logger.warn('Failed to cleanup old verification tokens', JSON.stringify({
                userId,
                error: error.message,
            }));
        }
    }
    async getVerificationStats() {
        const [totalTokens, activeTokens, expiredTokens, usedTokens] = await Promise.all([
            this.prisma.mfa_tokens.count({
                where: {
                    method: client_1.mfa_method.EMAIL,
                    metadata: {
                        path: ['tokenType'],
                        equals: 'EMAIL_VERIFICATION',
                    },
                },
            }),
            this.prisma.mfa_tokens.count({
                where: {
                    method: client_1.mfa_method.EMAIL,
                    is_used: false,
                    expires_at: { gt: new Date() },
                    metadata: {
                        path: ['tokenType'],
                        equals: 'EMAIL_VERIFICATION',
                    },
                },
            }),
            this.prisma.mfa_tokens.count({
                where: {
                    method: client_1.mfa_method.EMAIL,
                    expires_at: { lt: new Date() },
                    metadata: {
                        path: ['tokenType'],
                        equals: 'EMAIL_VERIFICATION',
                    },
                },
            }),
            this.prisma.mfa_tokens.count({
                where: {
                    method: client_1.mfa_method.EMAIL,
                    is_used: true,
                    metadata: {
                        path: ['tokenType'],
                        equals: 'EMAIL_VERIFICATION',
                    },
                },
            }),
        ]);
        return {
            totalTokens,
            activeTokens,
            expiredTokens,
            usedTokens,
        };
    }
};
exports.EmailVerificationService = EmailVerificationService;
exports.EmailVerificationService = EmailVerificationService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        redis_service_1.RedisService,
        email_service_1.EmailService,
        logger_service_1.LoggerService])
], EmailVerificationService);
//# sourceMappingURL=email-verification.service.js.map