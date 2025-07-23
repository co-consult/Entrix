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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const users_service_1 = require("../users/services/users.service");
const hashing_service_1 = require("../../shared/hashing/hashing.service");
const jwt = __importStar(require("jsonwebtoken"));
const constants_1 = require("./constants");
const mfa_service_1 = require("./services/mfa.service");
const session_service_1 = require("./services/session.service");
const email_service_1 = require("../../shared/email/email.service");
const logger_service_1 = require("../../shared/logger/logger.service");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../../shared/prisma/prisma.service");
const client_1 = require("@prisma/client");
var TokenType;
(function (TokenType) {
    TokenType["EMAIL_VERIFICATION"] = "email_verification";
    TokenType["PASSWORD_RESET"] = "password_reset";
})(TokenType || (TokenType = {}));
let AuthService = class AuthService {
    usersService;
    mfaService;
    sessionsService;
    emailService;
    logger;
    config;
    prisma;
    hashingService;
    constructor(usersService, mfaService, sessionsService, emailService, logger, config, prisma, hashingService) {
        this.usersService = usersService;
        this.mfaService = mfaService;
        this.sessionsService = sessionsService;
        this.emailService = emailService;
        this.logger = logger;
        this.config = config;
        this.prisma = prisma;
        this.hashingService = hashingService;
    }
    async login(dto, ip = 'ip', userAgent = 'userAgent') {
        const user = await this.usersService.findByEmail(dto.email);
        if (!user)
            throw new common_1.UnauthorizedException('Invalid credentials');
        if (!user.isActive)
            throw new common_1.UnauthorizedException('Account disabled');
        const isValidPassword = await this.usersService.verifyPasswordByEmail(dto.email, dto.password);
        if (!isValidPassword)
            throw new common_1.UnauthorizedException('Invalid credentials');
        if (!user.emailVerified) {
            throw new common_1.ForbiddenException('Email not verified');
        }
        const jwtSecret = this.config.get('JWT_SECRET') || process.env.JWT_SECRET;
        const payload = {
            userId: user.id,
            email: user.email,
            roles: [],
            sessionId: this.generateSessionId()
        };
        const accessToken = jwt.sign(payload, jwtSecret, { expiresIn: constants_1.JWT_EXPIRY });
        const refreshToken = jwt.sign(payload, jwtSecret, { expiresIn: constants_1.JWT_REFRESH_EXPIRY });
        const session = await this.sessionsService.createSession(user.id, ip, userAgent);
        this.logger.log(`User ${user.id} logged in successfully`);
        return {
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
            },
            session: { id: session.id }
        };
    }
    async mfaLogin(dto) {
        const user = await this.usersService.findByEmail(dto.email);
        if (!user)
            throw new common_1.UnauthorizedException('Invalid credentials');
        const isValidMfa = await this.mfaService.verifyChallenge(user.id, dto.code, dto.method);
        if (!isValidMfa)
            throw new common_1.UnauthorizedException('Invalid MFA code');
        const jwtSecret = this.config.get('JWT_SECRET') || process.env.JWT_SECRET;
        const payload = { userId: user.id, email: user.email, roles: [] };
        const accessToken = jwt.sign(payload, jwtSecret, { expiresIn: constants_1.JWT_EXPIRY });
        const refreshToken = jwt.sign(payload, jwtSecret, { expiresIn: constants_1.JWT_REFRESH_EXPIRY });
        this.logger.log(`User ${user.id} logged in with MFA`);
        return { accessToken, refreshToken };
    }
    async register(dto) {
        console.log('🔍 DEBUG - Password:', dto.password);
        const user = await this.usersService.create({
            email: dto.email,
            password: dto.password,
            firstName: dto.firstName,
            lastName: dto.lastName,
            isActive: true,
            emailVerified: false,
            phoneVerified: false,
        });
        const token = await this.createVerificationToken(user.id, dto.email, TokenType.EMAIL_VERIFICATION);
        try {
            await this.emailService.sendVerificationEmail(user.email, token);
            this.logger.log(`Verification email sent for user ${user.id}`);
        }
        catch (error) {
            this.logger.error(`Failed to send verification email for user ${user.id}:`, error);
        }
        this.logger.log(`User ${user.id} registered successfully`);
        return {
            id: user.id,
            email: user.email,
            message: 'Account created successfully. Please verify your email to activate your account.'
        };
    }
    async resetPassword(dto) {
        const user = await this.usersService.findByEmail(dto.email);
        if (!user) {
            this.logger.warn(`Password reset attempted for non-existent email: ${dto.email}`);
            return { message: 'If the email exists, a reset link has been sent.' };
        }
        const token = await this.createVerificationToken(user.id, user.email, TokenType.PASSWORD_RESET);
        try {
            await this.emailService.sendPasswordResetEmail(user.email, token);
            this.logger.log(`Password reset email sent for user ${user.id}`);
        }
        catch (error) {
            this.logger.error(`Failed to send password reset email for user ${user.id}:`, error);
            throw new common_1.BadRequestException('Failed to send reset email');
        }
        return { message: 'If the email exists, a reset link has been sent.' };
    }
    async confirmResetPassword(dto) {
        const tokenData = await this.verifyAndConsumeToken(dto.token, TokenType.PASSWORD_RESET);
        const hash = await this.hashingService.hashPassword(dto.newPassword);
        await this.usersService.update(tokenData.userId, { password: hash });
        await this.sessionsService.revokeAllUserSessions(tokenData.userId);
        await this.invalidateUserTokens(tokenData.userId, TokenType.PASSWORD_RESET);
        this.logger.log(`Password reset confirmed for user ${tokenData.userId}`);
        return { message: 'Password updated successfully. Please log in with your new password.' };
    }
    async verifyEmail(dto) {
        const tokenData = await this.verifyAndConsumeToken(dto.token, TokenType.EMAIL_VERIFICATION);
        await this.usersService.update(tokenData.userId, {
            emailVerified: true
        });
        await this.invalidateUserTokens(tokenData.userId, TokenType.EMAIL_VERIFICATION);
        this.logger.log(`Email verified successfully for user ${tokenData.userId}`);
        return {
            message: 'Email verified successfully. Your account is now active.',
            verified: true
        };
    }
    async resendVerificationEmail(email) {
        const user = await this.usersService.findByEmail(email);
        if (!user) {
            throw new common_1.BadRequestException('User not found');
        }
        if (user.emailVerified) {
            throw new common_1.BadRequestException('Email already verified');
        }
        await this.invalidateUserTokens(user.id, TokenType.EMAIL_VERIFICATION);
        const token = await this.createVerificationToken(user.id, user.email, TokenType.EMAIL_VERIFICATION);
        try {
            await this.emailService.sendVerificationEmail(user.email, token);
            this.logger.log(`Verification email resent for user ${user.id}`);
        }
        catch (error) {
            this.logger.error(`Failed to resend verification email for user ${user.id}:`, error);
            throw new common_1.BadRequestException('Failed to send verification email');
        }
        return { message: 'Verification email sent successfully.' };
    }
    async logout(sessionId) {
        await this.sessionsService.revokeSession(sessionId);
        this.logger.log(`Session ${sessionId} logged out`);
        return { message: 'Logged out successfully' };
    }
    async refreshToken(refreshToken) {
        try {
            const jwtSecret = this.config.get('JWT_SECRET') || process.env.JWT_SECRET;
            const payload = jwt.verify(refreshToken, jwtSecret);
            const user = await this.usersService.findById(payload.userId);
            if (!user || !user.isActive) {
                throw new common_1.UnauthorizedException('Invalid token');
            }
            const newPayload = { userId: user.id, email: user.email, roles: [] };
            const accessToken = jwt.sign(newPayload, jwtSecret, { expiresIn: constants_1.JWT_EXPIRY });
            return { accessToken };
        }
        catch (error) {
            throw new common_1.UnauthorizedException('Invalid refresh token');
        }
    }
    async createVerificationToken(userId, email, type) {
        const token = this.generateToken(64);
        const tokenHash = await this.hashingService.hashToken(token);
        const expirationHours = type === TokenType.EMAIL_VERIFICATION ? 24 : 1;
        const expiresAt = new Date(Date.now() + expirationHours * 60 * 60 * 1000);
        await this.prisma.mfa_tokens.create({
            data: {
                user_id: userId,
                method: client_1.mfa_method.EMAIL,
                token_hash: tokenHash,
                expires_at: expiresAt,
                is_used: false,
                metadata: {
                    type,
                    email,
                    tokenType: type,
                    createdFor: 'auth_verification'
                }
            }
        });
        this.logger.log(`Token created for user ${userId}, type: ${type}, expires: ${expiresAt.toISOString()}`);
        return token;
    }
    async verifyAndConsumeToken(token, expectedType) {
        const tokenRecord = await this.prisma.mfa_tokens.findFirst({
            where: {
                method: client_1.mfa_method.EMAIL,
                token_hash: token,
                is_used: false,
                expires_at: {
                    gt: new Date()
                },
                metadata: {
                    path: ['type'],
                    equals: expectedType
                }
            }
        });
        if (!tokenRecord) {
            throw new common_1.BadRequestException('Invalid or expired token');
        }
        await this.prisma.mfa_tokens.update({
            where: { id: tokenRecord.id },
            data: {
                is_used: true,
                used_at: new Date()
            }
        });
        const metadata = tokenRecord.metadata;
        return {
            userId: tokenRecord.user_id,
            email: metadata.email
        };
    }
    async invalidateUserTokens(userId, type) {
        await this.prisma.mfa_tokens.updateMany({
            where: {
                user_id: userId,
                method: client_1.mfa_method.EMAIL,
                is_used: false,
                metadata: {
                    path: ['type'],
                    equals: type
                }
            },
            data: {
                is_used: true,
                used_at: new Date()
            }
        });
        this.logger.log(`Invalidated ${type} tokens for user ${userId}`);
    }
    async cleanupExpiredTokens() {
        const result = await this.prisma.mfa_tokens.deleteMany({
            where: {
                method: client_1.mfa_method.EMAIL,
                expires_at: {
                    lt: new Date()
                }
            }
        });
        if (result.count > 0) {
            this.logger.log(`Cleaned up ${result.count} expired email tokens`);
        }
        return result.count;
    }
    generateToken(length = 32) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }
    generateSessionId() {
        return `sess_${Date.now()}_${this.generateToken(16)}`;
    }
    async getTokenStats() {
        const [active, expired, used, byType] = await Promise.all([
            this.prisma.mfa_tokens.count({
                where: {
                    method: client_1.mfa_method.EMAIL,
                    is_used: false,
                    expires_at: { gt: new Date() }
                }
            }),
            this.prisma.mfa_tokens.count({
                where: {
                    method: client_1.mfa_method.EMAIL,
                    expires_at: { lt: new Date() }
                }
            }),
            this.prisma.mfa_tokens.count({
                where: {
                    method: client_1.mfa_method.EMAIL,
                    is_used: true
                }
            }),
            this.prisma.mfa_tokens.findMany({
                where: { method: client_1.mfa_method.EMAIL },
                select: { metadata: true }
            })
        ]);
        const typeCount = {};
        byType.forEach(token => {
            const metadata = token.metadata;
            const type = metadata?.type || metadata?.tokenType || 'unknown';
            typeCount[type] = (typeCount[type] || 0) + 1;
        });
        return {
            active,
            expired,
            used,
            byType: typeCount
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        mfa_service_1.MfaService, typeof (_a = typeof session_service_1.SessionsService !== "undefined" && session_service_1.SessionsService) === "function" ? _a : Object, email_service_1.EmailService,
        logger_service_1.LoggerService,
        config_1.ConfigService,
        prisma_service_1.PrismaService,
        hashing_service_1.HashingService])
], AuthService);
//# sourceMappingURL=auth.service.js.map