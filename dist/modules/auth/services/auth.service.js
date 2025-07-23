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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const logger_service_1 = require("../../../shared/logger/logger.service");
const prisma_service_1 = require("../../../shared/prisma/prisma.service");
const redis_service_1 = require("../../../shared/redis/redis.service");
const email_service_1 = require("../../../shared/email/email.service");
const token_service_1 = require("./token.service");
const session_service_1 = require("./session.service");
const security_service_1 = require("./security.service");
const users_service_1 = require("../../users/services/users.service");
const crypto_util_1 = require("../utils/crypto.util");
const device_util_1 = require("../utils/device.util");
const auth_exceptions_1 = require("../exceptions/auth.exceptions");
const auth_constants_1 = require("../constants/auth.constants");
let AuthService = class AuthService {
    prisma;
    redis;
    email;
    tokenService;
    sessionService;
    securityService;
    usersService;
    logger;
    constructor(prisma, redis, email, tokenService, sessionService, securityService, usersService, loggerService) {
        this.prisma = prisma;
        this.redis = redis;
        this.email = email;
        this.tokenService = tokenService;
        this.sessionService = sessionService;
        this.securityService = securityService;
        this.usersService = usersService;
        this.logger = loggerService.createChildLogger('AuthService');
    }
    async login(loginData, context) {
        const operationId = this.logger.startOperation('login', {
            email: loginData.email,
            rememberMe: loginData.rememberMe,
            hasDeviceFingerprint: !!loginData.deviceFingerprint,
        });
        try {
            this.logger.info('Login attempt started', JSON.stringify({
                email: loginData.email,
                ipAddress: context?.ipAddress,
                hasDeviceFingerprint: !!context?.deviceFingerprint,
            }));
            const user = await this.validateUser(loginData.email, loginData.password, context);
            if (!user) {
                await this.handleFailedLogin(loginData.email, context);
                throw new auth_exceptions_1.InvalidCredentialsException();
            }
            const deviceInfo = device_util_1.DeviceUtil.normalizeDeviceInfo({
                userAgent: context?.userAgent || '',
                ipAddress: context?.ipAddress || 'unknown',
                deviceFingerprint: context?.deviceFingerprint || loginData.deviceFingerprint,
            });
            const riskAssessment = await this.securityService.assessRisk(user.id, deviceInfo);
            const requiresMfa = riskAssessment.requiresMfa ||
                riskAssessment.score >= auth_constants_1.AUTH_CONSTANTS.SECURITY.RISK_SCORE_THRESHOLD;
            if (requiresMfa) {
                const mfaChallenge = await this.generateMfaChallenge(user.id, deviceInfo);
                this.logger.logBusinessEvent('LOGIN_MFA_REQUIRED', {
                    userId: user.id,
                    email: user.email,
                    riskScore: riskAssessment.score,
                    ipAddress: deviceInfo.ipAddress,
                }, user.id);
                this.logger.endOperation(operationId, 'mfa_required');
                return {
                    success: true,
                    mfaRequired: mfaChallenge,
                    meta: {
                        riskScore: riskAssessment.score,
                        requiresMfa: true,
                        ipGeolocation: deviceInfo.geolocation?.country || 'Unknown',
                    },
                };
            }
            const session = await this.sessionService.createSession(user.id, deviceInfo, loginData.rememberMe);
            const tokens = await this.tokenService.generateTokenPair(user.id, user.email, session.id, loginData.rememberMe, deviceInfo.deviceFingerprint, user.roles, user.permissions);
            await this.updateLastLogin(user.id, deviceInfo.ipAddress);
            this.logger.logBusinessEvent('LOGIN_SUCCESS', {
                userId: user.id,
                email: user.email,
                sessionId: session.id,
                riskScore: riskAssessment.score,
                ipAddress: deviceInfo.ipAddress,
                deviceFingerprint: deviceInfo.deviceFingerprint,
            }, user.id);
            this.logger.endOperation(operationId, 'success');
            return {
                success: true,
                user,
                tokens,
                session: {
                    sessionId: session.id,
                    expiresAt: session.expires_at.toISOString(),
                    deviceInfo,
                    isActive: session.is_active,
                    lastActivity: session.last_activity.toISOString(),
                },
                meta: {
                    riskScore: riskAssessment.score,
                    requiresMfa: false,
                    ipGeolocation: deviceInfo.geolocation?.country || 'Unknown',
                },
            };
        }
        catch (error) {
            this.logger.endOperation(operationId, 'error', error.message);
            if (error instanceof auth_exceptions_1.InvalidCredentialsException ||
                error instanceof auth_exceptions_1.AccountLockedException ||
                error instanceof auth_exceptions_1.EmailNotVerifiedException) {
                throw error;
            }
            this.logger.error('Login failed with unexpected error', error.stack, {
                email: loginData.email,
            });
            throw new common_1.UnauthorizedException('Erreur lors de la connexion');
        }
    }
    async register(registerData) {
        const operationId = this.logger.startOperation('register', {
            email: registerData.email,
            firstName: registerData.firstName,
            lastName: registerData.lastName,
        });
        try {
            this.logger.info('Registration attempt started', JSON.stringify({
                email: registerData.email,
                firstName: registerData.firstName,
                lastName: registerData.lastName,
                hasOnboardingSecret: !!registerData.onboardingSecret,
            }));
            const existingUser = await this.prisma.users.findUnique({
                where: { email: registerData.email },
                select: { id: true },
            });
            if (existingUser) {
                this.logger.warn('Registration with existing email', JSON.stringify({
                    email: registerData.email,
                }));
                throw new auth_exceptions_1.EmailAlreadyExistsException();
            }
            const passwordValidation = crypto_util_1.CryptoUtil.validatePasswordStrength(registerData.password);
            if (!passwordValidation.isValid) {
                throw new auth_exceptions_1.WeakPasswordException(passwordValidation.suggestions);
            }
            const hashedPassword = await crypto_util_1.CryptoUtil.hashPassword(registerData.password);
            const userData = {
                email: registerData.email,
                password: hashedPassword,
                first_name: registerData.firstName,
                last_name: registerData.lastName,
                phone: registerData.phone || null,
                is_active: true,
                email_verified: null,
                phone_verified: null,
                last_login: null,
                metadata: {
                    registrationIp: 'unknown',
                    marketingConsent: registerData.marketingConsent || false,
                    termsAcceptedAt: new Date().toISOString(),
                    onboardingSecret: registerData.onboardingSecret,
                },
            };
            const user = await this.prisma.users.create({
                data: userData,
                select: {
                    id: true,
                    email: true,
                    first_name: true,
                    last_name: true,
                    phone: true,
                    avatar: true,
                    is_active: true,
                    email_verified: true,
                    phone_verified: true,
                    last_login: true,
                    metadata: true,
                    created_at: true,
                    updated_at: true,
                },
            });
            const verificationToken = await this.generateEmailVerificationToken(user.id);
            await this.email.sendWelcomeEmail(user.email, {
                firstName: user.first_name,
                lastName: user.last_name,
                verificationLink: `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`,
                emailVerificationRequired: true,
            });
            let onboardingResult;
            if (registerData.onboardingSecret) {
                onboardingResult = await this.processOnboardingSecret(user.id, registerData.onboardingSecret);
            }
            const deviceInfo = device_util_1.DeviceUtil.normalizeDeviceInfo({
                userAgent: 'registration',
                ipAddress: 'unknown',
            });
            const session = await this.sessionService.createSession(user.id, deviceInfo);
            const tokens = await this.tokenService.generateTokenPair(user.id, user.email, session.id);
            this.logger.logBusinessEvent('USER_REGISTERED', {
                userId: user.id,
                email: user.email,
                firstName: user.first_name,
                lastName: user.last_name,
                hasOnboardingSecret: !!registerData.onboardingSecret,
                onboardingApplied: !!onboardingResult?.incentiveApplied,
            }, user.id);
            this.logger.endOperation(operationId, 'success');
            const userProfile = {
                id: user.id,
                email: user.email,
                first_name: user.first_name,
                last_name: user.last_name,
                phone: user.phone,
                avatar: user.avatar,
                is_active: user.is_active,
                email_verified: user.email_verified,
                phone_verified: user.phone_verified,
                last_login: user.last_login,
                metadata: user.metadata,
                created_at: user.created_at,
                updated_at: user.updated_at,
                roles: [],
                permissions: [],
            };
            return {
                success: true,
                user: userProfile,
                tokens,
                verification: {
                    emailSent: true,
                    verificationRequired: true,
                },
                onboarding: onboardingResult,
            };
        }
        catch (error) {
            this.logger.endOperation(operationId, 'error', error.message);
            if (error instanceof auth_exceptions_1.EmailAlreadyExistsException ||
                error instanceof auth_exceptions_1.WeakPasswordException) {
                throw error;
            }
            this.logger.error('Registration failed with unexpected error', error.stack, {
                email: registerData.email,
            });
            throw new Error('Erreur lors de l\'inscription');
        }
    }
    async validateUser(email, password, context) {
        const operationId = this.logger.startOperation('validateUser', { email });
        try {
            const user = await this.prisma.users.findUnique({
                where: { email: email.toLowerCase() },
                select: {
                    id: true,
                    email: true,
                    password: true,
                    first_name: true,
                    last_name: true,
                    phone: true,
                    avatar: true,
                    is_active: true,
                    email_verified: true,
                    phone_verified: true,
                    last_login: true,
                    metadata: true,
                    created_at: true,
                    updated_at: true,
                },
            });
            if (!user) {
                this.logger.warn('User not found during validation', JSON.stringify({ email }));
                return null;
            }
            const isPasswordValid = await crypto_util_1.CryptoUtil.verifyPassword(password, user.password);
            if (!isPasswordValid) {
                this.logger.warn('Invalid password during validation', JSON.stringify({
                    userId: user.id,
                    email
                }));
                return null;
            }
            if (!user.is_active) {
                this.logger.warn('Inactive account login attempt', JSON.stringify({
                    userId: user.id,
                    email
                }));
                throw new auth_exceptions_1.AccountLockedException();
            }
            const requireEmailVerification = this.shouldRequireEmailVerification(user);
            if (requireEmailVerification && !user.email_verified) {
                this.logger.warn('Unverified email login attempt', JSON.stringify({
                    userId: user.id,
                    email
                }));
                throw new auth_exceptions_1.EmailNotVerifiedException();
            }
            this.logger.endOperation(operationId, 'success');
            const { password: _, ...userProfile } = user;
            return {
                ...userProfile,
                roles: [],
                permissions: [],
            };
        }
        catch (error) {
            this.logger.endOperation(operationId, 'error', error.message);
            if (error instanceof auth_exceptions_1.AccountLockedException ||
                error instanceof auth_exceptions_1.EmailNotVerifiedException) {
                throw error;
            }
            this.logger.error('User validation failed', error.stack, { email });
            return null;
        }
    }
    async logout(sessionId, allDevices = false) {
        const operationId = this.logger.startOperation('logout', {
            sessionId,
            allDevices
        });
        try {
            if (allDevices) {
                const session = await this.prisma.user_sessions.findUnique({
                    where: { id: sessionId },
                    select: { user_id: true },
                });
                if (session) {
                    const revokedSessions = await this.sessionService.revokeAllUserSessions(session.user_id);
                    this.logger.logBusinessEvent('LOGOUT_ALL_DEVICES', {
                        userId: session.user_id,
                        sessionsRevoked: revokedSessions,
                    }, session.user_id);
                    this.logger.endOperation(operationId, 'success');
                    return true;
                }
            }
            else {
                const revoked = await this.sessionService.revokeSession(sessionId);
                if (revoked) {
                    this.logger.logBusinessEvent('LOGOUT_SINGLE_DEVICE', {
                        sessionId,
                    });
                }
                this.logger.endOperation(operationId, 'success');
                return revoked;
            }
            this.logger.endOperation(operationId, 'session_not_found');
            return false;
        }
        catch (error) {
            this.logger.endOperation(operationId, 'error', error.message);
            this.logger.error('Logout failed', error.stack, { sessionId });
            return false;
        }
    }
    async handleFailedLogin(email, context) {
        this.logger.logBusinessEvent('LOGIN_FAILED', {
            email,
            ipAddress: context?.ipAddress,
            userAgent: context?.userAgent,
        });
    }
    async updateLastLogin(userId, ipAddress) {
        try {
            await this.prisma.users.update({
                where: { id: userId },
                data: {
                    last_login: new Date(),
                    updated_at: new Date(),
                },
            });
        }
        catch (error) {
            this.logger.warn('Failed to update last login', JSON.stringify({ userId, error: error.message }));
        }
    }
    async generateMfaChallenge(userId, deviceInfo) {
        return {
            methods: ['SMS_OTP', 'EMAIL_OTP', 'TOTP_APP'],
            challengeToken: `mfa_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            expiresIn: 300,
        };
    }
    async generateEmailVerificationToken(userId) {
        const token = crypto_util_1.CryptoUtil.generateSecureToken(32);
        const verificationKey = `email_verification:${token}`;
        await this.redis.setCache(verificationKey, userId, 24 * 60 * 60);
        return token;
    }
    async processOnboardingSecret(userId, secret) {
        return {
            incentiveApplied: true,
            incentiveType: 'discount',
            incentiveValue: 10,
            migratedTickets: 0,
        };
    }
    shouldRequireEmailVerification(user) {
        return false;
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        redis_service_1.RedisService,
        email_service_1.EmailService,
        token_service_1.TokenService,
        session_service_1.SessionService,
        security_service_1.SecurityService,
        users_service_1.UsersService,
        logger_service_1.LoggerService])
], AuthService);
//# sourceMappingURL=auth.service.js.map