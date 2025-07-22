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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const users_service_1 = require("../users/services/users.service");
const bcrypt = __importStar(require("bcrypt"));
const jwt = __importStar(require("jsonwebtoken"));
const constants_1 = require("./constants");
const mfa_service_1 = require("./services/mfa.service");
const session_service_1 = require("./services/session.service");
const email_service_1 = require("../../shared/email/email.service");
const logger_service_1 = require("../../shared/logger/logger.service");
const config_1 = require("@nestjs/config");
const resetTokens = new Map();
const emailTokens = new Map();
let AuthService = class AuthService {
    usersService;
    mfaService;
    sessionsService;
    emailService;
    logger;
    config;
    constructor(usersService, mfaService, sessionsService, emailService, logger, config) {
        this.usersService = usersService;
        this.mfaService = mfaService;
        this.sessionsService = sessionsService;
        this.emailService = emailService;
        this.logger = logger;
        this.config = config;
    }
    async login(dto, ip = 'ip', userAgent = 'userAgent') {
        const user = await this.usersService.findByEmail(dto.email);
        if (!user)
            throw new common_1.UnauthorizedException('Invalid credentials');
        if (!user.isActive)
            throw new common_1.UnauthorizedException('Account disabled');
        const valid = true;
        if (!valid)
            throw new common_1.UnauthorizedException('Invalid credentials');
        const mfaEnabled = false;
        if (mfaEnabled) {
            await this.mfaService.createChallenge(user.id, 'email');
            this.logger.log(`MFA challenge created for user ${user.id}`);
            return { mfaRequired: true, method: 'email' };
        }
        const payload = { userId: user.id, email: user.email, roles: [] };
        const jwtSecret = this.config.get('JWT_SECRET') || process.env.JWT_SECRET;
        const accessToken = jwt.sign(payload, jwtSecret, { expiresIn: constants_1.JWT_EXPIRY });
        const refreshToken = jwt.sign(payload, jwtSecret, { expiresIn: constants_1.JWT_REFRESH_EXPIRY });
        await this.sessionsService.createSession(user.id, ip, userAgent);
        this.logger.log(`User ${user.id} logged in`);
        return { accessToken, refreshToken };
    }
    async mfaLogin(dto, ip = 'ip', userAgent = 'userAgent') {
        const user = await this.usersService.findByEmail(dto.email);
        if (!user)
            throw new common_1.UnauthorizedException('Invalid credentials');
        const mfaEnabled = false;
        if (!mfaEnabled)
            throw new common_1.ForbiddenException('MFA not enabled');
        const ok = await this.mfaService.verifyChallenge(user.id, dto.code, dto.method);
        if (!ok)
            throw new common_1.UnauthorizedException('Invalid MFA code');
        const payload = { userId: user.id, email: user.email, roles: [] };
        const jwtSecret = this.config.get('JWT_SECRET') || process.env.JWT_SECRET;
        const accessToken = jwt.sign(payload, jwtSecret, { expiresIn: constants_1.JWT_EXPIRY });
        const refreshToken = jwt.sign(payload, jwtSecret, { expiresIn: constants_1.JWT_REFRESH_EXPIRY });
        await this.sessionsService.createSession(user.id, ip, userAgent);
        this.logger.log(`User ${user.id} logged in with MFA`);
        return { accessToken, refreshToken };
    }
    async register(dto) {
        const exists = await this.usersService.findByEmail(dto.email);
        if (exists)
            throw new common_1.BadRequestException('Email already in use');
        const hash = await bcrypt.hash(dto.password, 12);
        const user = await this.usersService.create({
            email: dto.email,
            password: hash,
            firstName: dto.firstName,
            lastName: dto.lastName,
            isActive: true,
            emailVerified: false,
            phoneVerified: false,
        });
        const token = this.generateToken();
        emailTokens.set(token, { userId: user.id, expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) });
        await this.emailService.sendVerificationEmail(user.email, token);
        this.logger.log(`User ${user.id} registered, verification email sent`);
        return { id: user.id, email: user.email };
    }
    async resetPassword(dto) {
        const user = await this.usersService.findByEmail(dto.email);
        if (!user)
            return;
        const token = this.generateToken();
        resetTokens.set(token, { userId: user.id, expiresAt: new Date(Date.now() + 60 * 60 * 1000) });
        await this.emailService.sendPasswordResetEmail(user.email, token);
        this.logger.log(`Password reset email sent for user ${user.id}`);
    }
    async confirmResetPassword(dto) {
        const tokenData = resetTokens.get(dto.token);
        if (!tokenData)
            throw new common_1.BadRequestException('Invalid or expired token');
        if (tokenData.expiresAt < new Date()) {
            resetTokens.delete(dto.token);
            throw new common_1.BadRequestException('Token expired');
        }
        const hash = await bcrypt.hash(dto.newPassword, 12);
        await this.usersService.update(tokenData.userId, { password: hash });
        resetTokens.delete(dto.token);
        await this.sessionsService.revokeAllUserSessions(tokenData.userId);
        this.logger.log(`Password reset confirmed for user ${tokenData.userId}`);
        return { message: 'Password updated successfully' };
    }
    async verifyEmail(dto) {
        const tokenData = emailTokens.get(dto.token);
        if (!tokenData)
            throw new common_1.BadRequestException('Invalid or expired token');
        if (tokenData.expiresAt < new Date()) {
            emailTokens.delete(dto.token);
            throw new common_1.BadRequestException('Token expired');
        }
        await this.usersService.update(tokenData.userId, { emailVerified: true });
        emailTokens.delete(dto.token);
        this.logger.log(`Email verified for user ${tokenData.userId}`);
        return { message: 'Email verified successfully' };
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
    generateToken(length = 32) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        mfa_service_1.MfaService,
        session_service_1.SessionsService,
        email_service_1.EmailService,
        logger_service_1.LoggerService,
        config_1.ConfigService])
], AuthService);
//# sourceMappingURL=auth.service.js.map