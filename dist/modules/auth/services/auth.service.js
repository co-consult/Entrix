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
const user_interface_1 = require("../interfaces/user.interface");
const token_service_1 = require("./token.service");
const session_service_1 = require("./session.service");
const security_service_1 = require("./security.service");
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
    logger;
    constructor(prisma, redis, email, tokenService, sessionService, securityService, loggerService) {
        this.prisma = prisma;
        this.redis = redis;
        this.email = email;
        this.tokenService = tokenService;
        this.sessionService = sessionService;
        this.securityService = securityService;
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
            await this.validateUserSecurity(user);
            const deviceInfo = device_util_1.DeviceUtil.normalizeDeviceInfo({
                userAgent: context?.userAgent || '',
                ipAddress: context?.ipAddress || '',
                deviceFingerprint: context?.deviceFingerprint || loginData.deviceFingerprint,
            });
            const riskAssessment = await this.securityService.assessRisk(user.id, deviceInfo);
            if (riskAssessment.requiresMfa) {
                const mfaChallenge = await this.initiateMfaChallenge(user.id, riskAssessment);
                return {
                    success: false,
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
            this.logger.error('Login failed with unexpected error', error.stack, JSON.stringify({
                email: loginData.email,
            }));
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
            await this.validatePasswordStrength(registerData.password);
            const createUserData = user_interface_1.UserMapper.fromRegisterRequest(registerData);
            const dbData = user_interface_1.UserMapper.toDb(createUserData);
            const hashedPassword = await crypto_util_1.CryptoUtil.hashPassword(registerData.password);
            const createdUser = await this.prisma.users.create({
                data: {
                    ...dbData,
                    password: hashedPassword,
                },
            });
            const user = user_interface_1.UserMapper.fromDb(createdUser);
            const verificationToken = await this.generateEmailVerificationToken(user.email);
            await this.email.sendWelcomeEmail(user.email, {
                firstName: user.firstName,
                lastName: user.lastName,
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
                firstName: user.firstName,
                lastName: user.lastName,
                hasOnboardingSecret: !!registerData.onboardingSecret,
                onboardingApplied: !!onboardingResult?.incentiveApplied,
            }, user.id);
            this.logger.endOperation(operationId, 'success');
            return {
                success: true,
                user,
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
            const dbUser = await this.prisma.users.findUnique({
                where: { email },
                include: {
                    user_roles: {
                        include: {
                            roles: {
                                include: {
                                    role_permissions: {
                                        include: {
                                            permissions: true
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
            });
            if (!dbUser) {
                this.logger.endOperation(operationId, 'user_not_found');
                return null;
            }
            const isValidPassword = await crypto_util_1.CryptoUtil.verifyPassword(password, dbUser.password);
            if (!isValidPassword) {
                this.logger.endOperation(operationId, 'invalid_password');
                return null;
            }
            const user = user_interface_1.UserMapper.fromDb(dbUser);
            user.roles = dbUser.user_roles
                ?.filter(ur => ur.status === 'ACTIVE')
                .map(ur => ur.roles.name) || [];
            user.permissions = dbUser.user_roles
                ?.filter(ur => ur.status === 'ACTIVE')
                .flatMap(ur => ur.roles.role_permissions
                ?.filter(rp => rp.status === 'ACTIVE')
                .map(rp => rp.permissions.name) || []) || [];
            this.logger.endOperation(operationId, 'success');
            return user;
        }
        catch (error) {
            this.logger.endOperation(operationId, 'error', error.message);
            return null;
        }
    }
    async logout(sessionId, allDevices) {
        return true;
    }
    async verifyMfa(challengeToken, code, method) {
        return { success: true };
    }
    async validateUserSecurity(user) {
        if (!user.isActive) {
            throw new auth_exceptions_1.AccountLockedException();
        }
    }
    async updateLastLogin(userId, ipAddress) {
        await this.prisma.users.update({
            where: { id: userId },
            data: {
                last_login: new Date(),
                metadata: {
                    lastLoginIp: ipAddress,
                    lastLoginAt: new Date().toISOString(),
                }
            },
        });
    }
    async validatePasswordStrength(password) {
        if (password.length < auth_constants_1.AUTH_CONSTANTS.VALIDATION.PASSWORD_MIN_LENGTH) {
            throw new auth_exceptions_1.WeakPasswordException('Mot de passe trop court');
        }
        if (!auth_constants_1.AUTH_CONSTANTS.VALIDATION.PASSWORD_REGEX.test(password)) {
            throw new auth_exceptions_1.WeakPasswordException('Mot de passe trop faible');
        }
    }
    async handleFailedLogin(email, context) {
    }
    async initiateMfaChallenge(userId, riskAssessment) {
        return {
            methods: ['SMS_OTP', 'EMAIL_OTP'],
            challengeToken: 'temp-token',
            expiresIn: 300,
        };
    }
    async processOnboardingSecret(userId, secret) {
        return {
            incentiveApplied: false,
            incentiveType: '',
            incentiveValue: 0,
            migratedTickets: 0,
        };
    }
    async generateEmailVerificationToken(email) {
        return 'verification-token';
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
        logger_service_1.LoggerService])
], AuthService);
//# sourceMappingURL=auth.service.js.map