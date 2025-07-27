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
const email_verification_service_1 = require("./email-verification.service");
const password_service_1 = require("./password.service");
const device_util_1 = require("../utils/device.util");
const mfa_service_1 = require("./mfa.service");
const auth_exceptions_1 = require("../exceptions/auth.exceptions");
const security_constants_1 = require("../constants/security.constants");
let AuthService = class AuthService {
    prisma;
    redis;
    email;
    tokenService;
    sessionService;
    emailVerificationService;
    securityService;
    passwordService;
    mfaService;
    logger;
    constructor(prisma, redis, email, tokenService, sessionService, emailVerificationService, securityService, passwordService, mfaService, loggerService) {
        this.prisma = prisma;
        this.redis = redis;
        this.email = email;
        this.tokenService = tokenService;
        this.sessionService = sessionService;
        this.emailVerificationService = emailVerificationService;
        this.securityService = securityService;
        this.passwordService = passwordService;
        this.mfaService = mfaService;
        this.logger = loggerService.createChildLogger('AuthService');
    }
    async login(loginData, context) {
        const operationId = this.logger.startOperation('login', {
            email: loginData.email,
            rememberMe: loginData.rememberMe,
            hasDeviceFingerprint: !!loginData.deviceFingerprint,
        });
        try {
            console.log('🔍 DEBUG LOGIN - Données d\'entrée:', {
                email: loginData.email,
                hasPassword: !!loginData.password,
                passwordLength: loginData.password?.length,
                rememberMe: loginData.rememberMe,
                deviceFingerprint: loginData.deviceFingerprint,
                context: {
                    ipAddress: context?.ipAddress,
                    userAgent: context?.userAgent,
                    deviceFingerprint: context?.deviceFingerprint,
                }
            });
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
            console.log('🔍 DEBUG LOGIN - User validé, ID:', user.id);
            const deviceInfo = device_util_1.DeviceUtil.normalizeDeviceInfo({
                userAgent: context?.userAgent || 'unknown',
                ipAddress: context?.ipAddress || 'unknown',
                deviceFingerprint: context?.deviceFingerprint || loginData.deviceFingerprint,
            });
            const riskAssessment = await this.securityService.assessRisk(user.id, deviceInfo);
            console.log('🔍 DEBUG LOGIN - Risk assessment:', {
                score: riskAssessment.score,
                requiresMfa: riskAssessment.requiresMfa,
                factors: riskAssessment.factors
            });
            const requiresMfa = await this.isMfaRequired(user.id, riskAssessment.score);
            if (requiresMfa) {
                console.log('🔍 DEBUG LOGIN - MFA requis, génération challenge via MfaService');
                const mfaChallenge = await this.generateMfaChallenge(user.id, user.email, deviceInfo);
                this.logger.logBusinessEvent('LOGIN_MFA_REQUIRED', {
                    userId: user.id,
                    email: user.email,
                    riskScore: riskAssessment.score,
                    factors: riskAssessment.factors,
                    mfaMethods: mfaChallenge.methods,
                }, user.id);
                this.logger.endOperation('login', operationId, true);
                return {
                    success: false,
                    mfaRequired: mfaChallenge,
                    meta: {
                        riskScore: riskAssessment.score,
                        requiresMfa: true,
                        ipGeolocation: deviceInfo.geolocation?.country || 'unknown',
                    }
                };
            }
            console.log('🔍 DEBUG LOGIN - Pas de MFA requis, gestion session intelligente');
            const sessionResult = await this.sessionService.handleUserLogin(user.id, deviceInfo, loginData.rememberMe || false);
            console.log('🔍 DEBUG LOGIN - Session result:', {
                sessionId: sessionResult.session.id,
                type: sessionResult.type,
                isReused: sessionResult.isReused,
                tokensReused: sessionResult.tokensReused,
            });
            await this.handleSuccessfulLogin(user.id, user.email, deviceInfo, sessionResult);
            const loginResult = {
                success: true,
                user: this.mapDbUserToProfile(user),
                tokens: sessionResult.tokens,
                session: {
                    sessionId: sessionResult.session.id,
                    expiresAt: sessionResult.session.expires_at.toISOString(),
                    deviceInfo,
                    isActive: sessionResult.session.is_active,
                    lastActivity: sessionResult.session.last_activity.toISOString(),
                    isReused: sessionResult.isReused,
                    sessionType: sessionResult.type,
                },
                meta: {
                    riskScore: riskAssessment.score,
                    requiresMfa: false,
                    ipGeolocation: deviceInfo.geolocation?.country || 'unknown',
                    sessionType: sessionResult.type,
                    wasSessionReused: sessionResult.isReused,
                    tokensReused: sessionResult.tokensReused,
                }
            };
            this.logger.logBusinessEvent('LOGIN_SUCCESS', {
                userId: user.id,
                email: user.email,
                sessionId: sessionResult.session.id,
                sessionType: sessionResult.type,
                sessionReused: sessionResult.isReused,
                tokensReused: sessionResult.tokensReused,
                riskScore: riskAssessment.score,
            }, user.id);
            this.logger.endOperation('login', operationId, true);
            return loginResult;
        }
        catch (error) {
            this.logger.logErrorEvent(error, 'AuthService.login', undefined, JSON.stringify({
                email: loginData.email,
                context: {
                    ipAddress: context?.ipAddress,
                    userAgent: context?.userAgent,
                }
            }));
            this.logger.endOperation('login', operationId, false);
            if (error instanceof auth_exceptions_1.InvalidCredentialsException ||
                error instanceof auth_exceptions_1.AccountLockedException ||
                error instanceof auth_exceptions_1.EmailNotVerifiedException) {
                throw error;
            }
            this.logger.error('Authentication failed with unexpected error', error.stack, 'AuthService.login', JSON.stringify({
                email: loginData.email,
                context: {
                    ipAddress: context?.ipAddress,
                    userAgent: context?.userAgent,
                }
            }));
            throw new common_1.InternalServerErrorException('Authentication failed');
        }
    }
    async register(registerData, clientInfo) {
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
            await this.checkEmailExists(registerData.email);
            await this.validatePasswordStrength(registerData.password);
            await this.checkRegistrationRateLimit(clientInfo?.ip);
            const hashedPassword = await this.passwordService.hashPassword(registerData.password);
            const user = await this.prisma.users.create({
                data: {
                    email: registerData.email,
                    password: hashedPassword,
                    first_name: registerData.firstName,
                    last_name: registerData.lastName,
                    phone: registerData.phone || null,
                    is_active: true,
                    email_verified: false,
                    phone_verified: false,
                    last_login: null,
                    metadata: {
                        termsAccepted: registerData.termsAccepted,
                        marketingConsent: registerData.marketingConsent || false,
                        dateOfBirth: registerData.dateOfBirth || null,
                        registrationIp: clientInfo?.ip,
                        registrationUserAgent: clientInfo?.userAgent,
                    },
                },
            });
            const userProfile = this.mapDbUserToProfile(user);
            const verificationTokenData = await this.emailVerificationService.generateVerificationToken(user.id, user.email);
            this.email.sendWelcomeEmail(user.email, user.first_name, verificationTokenData.token).catch(error => {
                this.logger.error('Failed to send welcome email', error.stack, 'AuthService.register', JSON.stringify({
                    userId: user.id,
                    email: user.email
                }));
            });
            let onboardingResult;
            if (registerData.onboardingSecret) {
                onboardingResult = await this.processOnboardingSecret(user.id, registerData.onboardingSecret);
            }
            let tokens = null;
            let sessionInfo = null;
            if (clientInfo) {
                console.log('🔍 DEBUG REGISTER - Création session automatique post-inscription');
                const deviceInfo = device_util_1.DeviceUtil.normalizeDeviceInfo({
                    userAgent: clientInfo.userAgent,
                    ipAddress: this.validateAndNormalizeIp(clientInfo.ip),
                });
                const session = await this.sessionService.createSession(user.id, deviceInfo, false);
                tokens = await this.tokenService.generateTokenPair(user.id, user.email, session.id, false, deviceInfo.deviceFingerprint, userProfile.roles || [], userProfile.permissions || []);
                sessionInfo = {
                    sessionId: session.id,
                    expiresAt: session.expires_at.toISOString(),
                    deviceInfo,
                    isActive: session.is_active,
                    lastActivity: session.last_activity.toISOString(),
                };
                console.log('🔍 DEBUG REGISTER - Session et tokens créés:', {
                    sessionId: session.id,
                    hasTokens: !!tokens,
                });
            }
            this.logger.logBusinessEvent('USER_REGISTERED', {
                userId: user.id,
                email: user.email,
                firstName: user.first_name,
                lastName: user.last_name,
                hasOnboardingSecret: !!registerData.onboardingSecret,
                onboardingApplied: !!onboardingResult?.incentiveApplied,
                hasAutoSession: !!sessionInfo,
            }, user.id);
            this.logger.endOperation('register', operationId, true);
            return {
                success: true,
                user: userProfile,
                tokens,
                session: sessionInfo,
                verification: {
                    emailSent: true,
                    verificationRequired: true,
                    tokenId: verificationTokenData.id,
                },
                onboarding: onboardingResult,
                message: tokens
                    ? 'Compte créé avec succès. Vous êtes connecté automatiquement. Vérifiez votre email.'
                    : 'Compte créé avec succès. Vérifiez votre email pour activer votre compte.',
            };
        }
        catch (error) {
            this.logger.endOperation('register', operationId, false, undefined, { error: error.message });
            if (error instanceof auth_exceptions_1.EmailAlreadyExistsException ||
                error instanceof auth_exceptions_1.WeakPasswordException) {
                throw error;
            }
            this.logger.error('Registration failed with unexpected error', error.stack, 'AuthService', JSON.stringify({
                email: registerData.email,
            }));
            throw new common_1.InternalServerErrorException('Erreur lors de l\'inscription');
        }
    }
    async handleSuccessfulLogin(userId, email, deviceInfo, sessionResult) {
        try {
            await Promise.all([
                this.prisma.users.update({
                    where: { id: userId },
                    data: {
                        last_login: new Date(),
                    },
                }),
                this.prisma.login_attempts.create({
                    data: {
                        email: email,
                        user_id: userId,
                        ip_address: deviceInfo.ipAddress,
                        user_agent: deviceInfo.userAgent,
                        success: true,
                        failure_reason: null,
                        is_suspicious: false,
                        geolocation: deviceInfo.geolocation,
                        metadata: {
                            sessionId: sessionResult.session.id,
                            sessionType: sessionResult.type,
                            sessionReused: sessionResult.isReused,
                            tokensReused: sessionResult.tokensReused,
                            deviceFingerprint: deviceInfo.deviceFingerprint,
                        },
                    }
                })
            ]);
        }
        catch (error) {
            this.logger.warn('Failed to handle successful login', JSON.stringify({
                userId,
                email,
                sessionId: sessionResult.session.id,
                error: error.message,
            }));
        }
    }
    async validateUser(email, password, context) {
        const operationId = this.logger.startOperation('validateUser', { email });
        try {
            const dbUser = await this.prisma.users.findUnique({
                where: { email },
                include: {
                    user_roles_user_roles_user_idTousers: {
                        where: { status: 'ACTIVE' },
                        include: {
                            roles: {
                                select: {
                                    id: true,
                                    name: true,
                                    code: true,
                                    level: true,
                                    is_active: true
                                }
                            }
                        }
                    }
                }
            });
            if (!dbUser) {
                this.logger.endOperation('validateUser', operationId, false, undefined, { reason: 'user_not_found' });
                return null;
            }
            if (!dbUser.is_active) {
                this.logger.warn('Login attempt on inactive account', JSON.stringify({ email }));
                throw new auth_exceptions_1.AccountLockedException();
            }
            const emailVerificationRequired = process.env.EMAIL_VERIFICATION_REQUIRED === 'true';
            if (emailVerificationRequired && !dbUser.email_verified) {
                throw new auth_exceptions_1.EmailNotVerifiedException();
            }
            console.log('🔍 DEBUG validateUser - Vérification password avec PasswordService pour:', email);
            const isPasswordValid = await this.passwordService.verifyUserPasswordByEmail(email, password);
            if (!isPasswordValid) {
                console.log('🔍 DEBUG validateUser - Password invalide pour:', email);
                this.logger.endOperation('validateUser', operationId, false, undefined, { reason: 'invalid_password' });
                return null;
            }
            console.log('🔍 DEBUG validateUser - Password valide pour:', email);
            const user = this.mapDbUserToProfile(dbUser);
            user.roles = dbUser.user_roles_user_roles_user_idTousers
                ?.filter(ur => ur.status === 'ACTIVE')
                .map(ur => ur.roles.name) || [];
            user.permissions = [];
            this.logger.endOperation('validateUser', operationId, true);
            return user;
        }
        catch (error) {
            this.logger.endOperation('validateUser', operationId, false, undefined, { error: error.message });
            if (error instanceof auth_exceptions_1.AccountLockedException || error instanceof auth_exceptions_1.EmailNotVerifiedException) {
                throw error;
            }
            this.logger.error('User validation failed', error.stack, JSON.stringify({ email }));
            return null;
        }
    }
    async logout(sessionId, allDevices) {
        const operationId = this.logger.startOperation('logout', { sessionId, allDevices });
        try {
            if (allDevices) {
                const session = await this.sessionService.validateSession(sessionId);
                if (session) {
                    const revokedCount = await this.sessionService.revokeAllUserSessions(session.user_id);
                    this.logger.logBusinessEvent('LOGOUT_ALL_DEVICES', {
                        userId: session.user_id,
                        revokedSessions: revokedCount,
                    }, session.user_id);
                    this.logger.endOperation('logout', operationId, true);
                    return revokedCount > 0;
                }
            }
            else {
                const success = await this.sessionService.revokeSession(sessionId);
                if (success) {
                    this.logger.logBusinessEvent('LOGOUT', { sessionId });
                }
                this.logger.endOperation('logout', operationId, success);
                return success;
            }
            this.logger.endOperation('logout', operationId, false);
            return false;
        }
        catch (error) {
            this.logger.endOperation('logout', operationId, false, undefined, { error: error.message });
            this.logger.error('Logout failed', error.stack, 'AuthService');
            return false;
        }
    }
    async refreshTokens(refreshToken) {
        return await this.sessionService.refreshSession(refreshToken);
    }
    async verifyMfa(challengeToken, code, method) {
        const operationId = this.logger.startOperation('verifyMfa', { challengeToken, method });
        try {
            const verification = {
                challengeToken,
                code,
                method,
                trustDevice: false
            };
            const isMfaValid = await this.mfaService.verifyMfa(verification);
            if (!isMfaValid) {
                throw new common_1.UnauthorizedException('Code MFA invalide');
            }
            const challenge = await this.redis.getCache(`mfa_challenge:${challengeToken}`);
            if (!challenge || new Date(challenge.expiresAt) < new Date()) {
                throw new common_1.UnauthorizedException('Challenge MFA expiré ou invalide');
            }
            const user = await this.getUserProfile(challenge.userId);
            if (!user) {
                throw new common_1.UnauthorizedException('Utilisateur introuvable');
            }
            const deviceInfo = {
                userAgent: challenge.deviceInfo?.userAgent || 'unknown',
                ipAddress: challenge.deviceInfo?.ipAddress || 'unknown',
                deviceFingerprint: challenge.deviceFingerprint,
                isMobile: challenge.deviceInfo?.isMobile || false,
                geolocation: challenge.deviceInfo?.geolocation
            };
            const sessionResult = await this.sessionService.handleUserLogin(user.id, deviceInfo, false);
            this.logger.logBusinessEvent('MFA_VERIFICATION_SUCCESS', {
                userId: user.id,
                email: user.email,
                method,
                sessionId: sessionResult.session.id,
                sessionType: sessionResult.type,
            }, user.id);
            this.logger.endOperation('verifyMfa', operationId, true);
            return {
                success: true,
                user: this.mapDbUserToProfile(user),
                tokens: sessionResult.tokens,
                session: {
                    sessionId: sessionResult.session.id,
                    expiresAt: sessionResult.session.expires_at.toISOString(),
                    deviceInfo,
                    isActive: sessionResult.session.is_active,
                    lastActivity: sessionResult.session.last_activity.toISOString(),
                    sessionType: sessionResult.type,
                },
                meta: {
                    riskScore: 0,
                    requiresMfa: false,
                    ipGeolocation: deviceInfo.geolocation?.country || 'unknown',
                    sessionType: sessionResult.type,
                    wasSessionReused: sessionResult.isReused,
                    tokensReused: sessionResult.tokensReused,
                },
            };
        }
        catch (error) {
            this.logger.logErrorEvent(error, 'AuthService.verifyMfa', undefined, JSON.stringify({ challengeToken: challengeToken.substring(0, 8) + '...', method }));
            this.logger.endOperation('verifyMfa', operationId, false);
            throw error;
        }
    }
    async verifyEmail(token) {
        const operationId = this.logger.startOperation('verifyEmail', {
            tokenLength: token?.length,
        });
        try {
            const result = await this.emailVerificationService.verifyEmailToken(token);
            this.logger.endOperation('verifyEmail', operationId, result.success, undefined, {
                verified: result.verified,
                userId: result.userId,
            });
            return result;
        }
        catch (error) {
            this.logger.endOperation('verifyEmail', operationId, false, undefined, {
                error: error.message,
            });
            this.logger.error('Email verification failed with unexpected error', error.stack, 'AuthService.verifyEmail', JSON.stringify({
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
    async resendVerificationEmail(userId) {
        const operationId = this.logger.startOperation('resendVerificationEmail', { userId });
        try {
            const user = await this.prisma.users.findUnique({
                where: { id: userId },
                select: {
                    id: true,
                    email: true,
                    email_verified: true,
                    first_name: true,
                    is_active: true,
                },
            });
            if (!user) {
                this.logger.endOperation('resendVerificationEmail', operationId, false, undefined, {
                    reason: 'user_not_found',
                });
                return {
                    success: false,
                    message: 'Utilisateur introuvable',
                };
            }
            if (user.email_verified) {
                this.logger.endOperation('resendVerificationEmail', operationId, false, undefined, {
                    reason: 'already_verified',
                });
                return {
                    success: false,
                    message: 'Email déjà vérifié',
                };
            }
            if (!user.is_active) {
                this.logger.endOperation('resendVerificationEmail', operationId, false, undefined, {
                    reason: 'user_inactive',
                });
                return {
                    success: false,
                    message: 'Compte utilisateur inactif',
                };
            }
            const verificationTokenData = await this.emailVerificationService.generateVerificationToken(user.id, user.email);
            this.email.sendVerificationEmail(user.email, verificationTokenData.token).catch(error => {
                this.logger.error('Failed to send verification email', error.stack, 'AuthService.resendVerificationEmail', JSON.stringify({
                    userId: user.id,
                    email: user.email
                }));
            });
            this.logger.logBusinessEvent('EMAIL_VERIFICATION_RESENT', {
                userId: user.id,
                email: user.email,
                tokenId: verificationTokenData.id,
            }, user.id);
            this.logger.endOperation('resendVerificationEmail', operationId, true);
            return {
                success: true,
                message: 'Email de vérification renvoyé',
                tokenId: verificationTokenData.id,
            };
        }
        catch (error) {
            this.logger.endOperation('resendVerificationEmail', operationId, false, undefined, {
                error: error.message,
            });
            this.logger.error('Failed to resend verification email', error.stack, 'AuthService.resendVerificationEmail', JSON.stringify({ userId }));
            return {
                success: false,
                message: 'Erreur lors de l\'envoi de l\'email de vérification',
            };
        }
    }
    async getVerificationStatus(userId) {
        const operationId = this.logger.startOperation('getVerificationStatus', {
            userId,
        });
        try {
            const dbUser = await this.prisma.users.findUnique({
                where: { id: userId },
                select: {
                    email_verified: true,
                    is_active: true,
                    email: true,
                },
            });
            if (!dbUser) {
                this.logger.warn('User not found for verification status', JSON.stringify({
                    userId,
                }));
                throw new common_1.NotFoundException('Utilisateur introuvable');
            }
            const emailVerified = !!dbUser.email_verified;
            const canResend = !emailVerified && dbUser.is_active;
            this.logger.logBusinessEvent('VERIFICATION_STATUS_CHECKED', {
                userId,
                emailVerified,
                canResend,
            }, userId);
            this.logger.endOperation('getVerificationStatus', operationId, true);
            return {
                emailVerified,
                canResend,
            };
        }
        catch (error) {
            this.logger.endOperation('getVerificationStatus', operationId, false, undefined, {
                error: error.message,
            });
            if (error instanceof common_1.NotFoundException) {
                throw error;
            }
            this.logger.error('Failed to get verification status', error.stack, 'AuthService.getVerificationStatus', JSON.stringify({ userId }));
            throw new common_1.InternalServerErrorException('Erreur lors de la récupération du statut de vérification');
        }
    }
    async validatePasswordStrength(password) {
        const validation = await this.passwordService.validatePasswordStrength(password);
        if (!validation.isValid) {
            throw new auth_exceptions_1.WeakPasswordException(validation.suggestions);
        }
    }
    async checkEmailExists(email) {
        const existingUser = await this.prisma.users.findUnique({
            where: { email },
            select: { id: true }
        });
        if (existingUser) {
            throw new auth_exceptions_1.EmailAlreadyExistsException();
        }
    }
    async checkRegistrationRateLimit(ip) {
        if (!ip)
            return;
        const key = `registration_attempts:${ip}`;
        const attempts = await this.redis.getCache(key);
        const currentAttempts = attempts ? parseInt(String(attempts), 10) : 0;
        if (currentAttempts >= security_constants_1.SECURITY_CONSTANTS.RATE_LIMITS.REGISTRATION.MAX_ATTEMPTS) {
            throw new Error('Trop de tentatives d\'inscription depuis cette IP');
        }
        await this.redis.setCache(key, currentAttempts + 1, 3600);
    }
    async handleFailedLogin(email, context) {
        this.logger.logBusinessEvent('LOGIN_FAILED', {
            email,
            ipAddress: context?.ipAddress,
            userAgent: context?.userAgent,
            reason: 'invalid_credentials',
        });
        const key = `login_attempts:${email}`;
        const attempts = await this.redis.getCache(key);
        const currentAttempts = attempts ? parseInt(String(attempts), 10) : 0;
        await this.redis.setCache(key, currentAttempts + 1, 3600);
    }
    async updateLastLogin(userId, ipAddress) {
        await this.prisma.users.update({
            where: { id: userId },
            data: {
                last_login: new Date(),
                metadata: {
                    lastLoginIp: ipAddress,
                }
            },
        });
    }
    validateAndNormalizeIp(ip) {
        if (!ip || ip === 'unknown') {
            return '127.0.0.1';
        }
        const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
        const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
        if (ipv4Regex.test(ip) || ipv6Regex.test(ip)) {
            return ip;
        }
        return '127.0.0.1';
    }
    async processOnboardingSecret(userId, secret) {
        return {
            incentiveApplied: false,
            incentiveType: 'none',
            incentiveValue: 0,
            migratedTickets: 0,
        };
    }
    async getUserProfile(userId) {
        const dbUser = await this.prisma.users.findUnique({
            where: { id: userId },
            include: {
                user_roles_user_roles_user_idTousers: {
                    where: { status: 'ACTIVE' },
                    include: {
                        roles: {
                            select: {
                                id: true,
                                name: true,
                                code: true,
                                level: true,
                                is_active: true
                            }
                        }
                    }
                }
            }
        });
        if (!dbUser)
            return null;
        const user = this.mapDbUserToProfile(dbUser);
        user.roles = dbUser.user_roles_user_roles_user_idTousers
            ?.filter(ur => ur.status === 'ACTIVE')
            .map(ur => ur.roles.name) || [];
        user.permissions = [];
        return user;
    }
    mapDbUserToProfile(dbUser) {
        return {
            id: dbUser.id,
            email: dbUser.email,
            firstName: dbUser.first_name,
            lastName: dbUser.last_name,
            phone: dbUser.phone,
            avatar: dbUser.avatar,
            isActive: dbUser.is_active,
            emailVerified: dbUser.email_verified,
            phoneVerified: dbUser.phone_verified,
            lastLogin: dbUser.last_login,
            metadata: dbUser.metadata,
            createdAt: dbUser.created_at,
            updatedAt: dbUser.updated_at,
            roles: [],
            permissions: [],
        };
    }
    async generateMfaChallenge(userId, email, deviceInfo) {
        try {
            const availableMethods = await this.mfaService.getAvailableProviders(userId);
            return await this.mfaService.generateMfaChallenge(userId, availableMethods, deviceInfo.deviceFingerprint);
        }
        catch (error) {
            this.logger.logErrorEvent(error, 'AuthService.generateMfaChallenge', userId, JSON.stringify({ email, deviceInfo: { ipAddress: deviceInfo.ipAddress } }));
            throw error;
        }
    }
    async isMfaRequired(userId, riskScore) {
        try {
            return await this.mfaService.requiresMfa(userId, riskScore);
        }
        catch (error) {
            this.logger.warn('Erreur vérification MFA requis', JSON.stringify({
                userId,
                riskScore,
                error: error.message,
            }));
            return true;
        }
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
        email_verification_service_1.EmailVerificationService,
        security_service_1.SecurityService,
        password_service_1.PasswordService,
        mfa_service_1.MfaService,
        logger_service_1.LoggerService])
], AuthService);
//# sourceMappingURL=auth.service.js.map