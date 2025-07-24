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
    emailVerificationService;
    securityService;
    logger;
    constructor(prisma, redis, email, tokenService, sessionService, emailVerificationService, securityService, loggerService) {
        this.prisma = prisma;
        this.redis = redis;
        this.email = email;
        this.tokenService = tokenService;
        this.sessionService = sessionService;
        this.emailVerificationService = emailVerificationService;
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
            console.log('🔍 DEBUG LOGIN - Avant validateUser avec:', {
                email: loginData.email,
                passwordProvided: !!loginData.password,
                contextProvided: !!context
            });
            const user = await this.validateUser(loginData.email, loginData.password, context);
            console.log('🔍 DEBUG LOGIN - Résultat validateUser:', {
                userFound: !!user,
                userId: user?.id,
                userEmail: user?.email,
                userActive: user?.isActive,
                userRoles: user?.roles,
                userPermissions: user?.permissions
            });
            if (!user) {
                console.log('🔍 DEBUG LOGIN - validateUser a retourné null, causes possibles:');
                console.log('  1. Email inexistant en base');
                console.log('  2. Mot de passe incorrect');
                console.log('  3. Compte inactif');
                console.log('  4. Email non vérifié (si requis)');
                console.log('  5. Erreur dans le hashage/comparaison');
                await this.handleFailedLogin(loginData.email, context);
                console.log('🔍 DEBUG LOGIN - Throwing InvalidCredentialsException pour email:', loginData.email);
                throw new auth_exceptions_1.InvalidCredentialsException();
            }
            console.log('🔍 DEBUG LOGIN - User validé, continuation du processus');
            console.log('🔍 DEBUG LOGIN - Construction deviceInfo');
            const deviceInfo = device_util_1.DeviceUtil.normalizeDeviceInfo({
                userAgent: context?.userAgent || 'unknown',
                ipAddress: context?.ipAddress || 'unknown',
                deviceFingerprint: context?.deviceFingerprint || loginData.deviceFingerprint,
            });
            console.log('🔍 DEBUG LOGIN - DeviceInfo créé:', {
                userAgent: deviceInfo.userAgent,
                ipAddress: deviceInfo.ipAddress,
                deviceFingerprint: deviceInfo.deviceFingerprint,
                geolocation: deviceInfo.geolocation
            });
            console.log('🔍 DEBUG LOGIN - Évaluation du risque sécurité');
            const riskAssessment = await this.securityService.assessRisk(user.id, deviceInfo);
            console.log('🔍 DEBUG LOGIN - Risk assessment:', {
                score: riskAssessment.score,
                requiresMfa: riskAssessment.requiresMfa,
                factors: riskAssessment.factors
            });
            if (riskAssessment.requiresMfa) {
                console.log('🔍 DEBUG LOGIN - MFA requis, création challenge');
                const challengeToken = crypto_util_1.CryptoUtil.generateSecureToken(32);
                await this.redis.setCache(`mfa_challenge:${challengeToken}`, {
                    userId: user.id,
                    email: user.email,
                    deviceInfo,
                    expiresAt: new Date(Date.now() + 5 * 60 * 1000),
                }, 300);
                console.log('🔍 DEBUG LOGIN - Challenge MFA créé avec token:', challengeToken);
                this.logger.endOperation('login', operationId, false, undefined, { reason: 'mfa_required' });
                return {
                    success: false,
                    mfaRequired: {
                        methods: ['SMS_OTP', 'TOTP_APP'],
                        challengeToken,
                        expiresIn: 300,
                    },
                    meta: {
                        riskScore: riskAssessment.score,
                        requiresMfa: true,
                        ipGeolocation: deviceInfo.geolocation?.country || 'Unknown',
                    },
                };
            }
            console.log('🔍 DEBUG LOGIN - Création session');
            const session = await this.sessionService.createSession(user.id, deviceInfo, loginData.rememberMe);
            console.log('🔍 DEBUG LOGIN - Session créée:', {
                sessionId: session.id,
                userId: session.user_id,
                expiresAt: session.expires_at,
                isActive: session.is_active
            });
            console.log('🔍 DEBUG LOGIN - Génération tokens JWT');
            const tokens = await this.tokenService.generateTokenPair(user.id, user.email, session.id, loginData.rememberMe, deviceInfo.deviceFingerprint, user.roles, user.permissions);
            console.log('🔍 DEBUG LOGIN - Tokens générés:', {
                hasAccessToken: !!tokens.accessToken,
                hasRefreshToken: !!tokens.refreshToken,
                tokenType: tokens.tokenType,
                expiresIn: tokens.expiresIn
            });
            console.log('🔍 DEBUG LOGIN - Mise à jour last_login');
            await this.updateLastLogin(user.id, deviceInfo.ipAddress);
            this.logger.logBusinessEvent('LOGIN_SUCCESS', {
                userId: user.id,
                email: user.email,
                sessionId: session.id,
                riskScore: riskAssessment.score,
                ipAddress: deviceInfo.ipAddress,
                deviceFingerprint: deviceInfo.deviceFingerprint,
            }, user.id);
            console.log('🔍 DEBUG LOGIN - Login réussi pour user:', user.id);
            this.logger.endOperation('login', operationId, true);
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
            console.log('🔍 DEBUG LOGIN - Erreur capturée:', {
                errorType: error.constructor.name,
                errorMessage: error.message,
                errorStack: error.stack,
                email: loginData.email
            });
            this.logger.endOperation('login', operationId, false, undefined, { error: error.message });
            if (error instanceof auth_exceptions_1.InvalidCredentialsException ||
                error instanceof auth_exceptions_1.AccountLockedException ||
                error instanceof auth_exceptions_1.EmailNotVerifiedException) {
                console.log('🔍 DEBUG LOGIN - Erreur attendue:', error.constructor.name);
                throw error;
            }
            console.log('🔍 DEBUG LOGIN - Erreur inattendue, conversion en UnauthorizedException');
            this.logger.error('Login failed with unexpected error', error.stack, 'AuthService', JSON.stringify({
                email: loginData.email,
            }));
            throw new common_1.UnauthorizedException('Erreur lors de la connexion');
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
            const hashedPassword = await crypto_util_1.CryptoUtil.hashPassword(registerData.password);
            const verificationToken = crypto_util_1.CryptoUtil.generateSecureToken(32);
            const user = await this.prisma.users.create({
                data: {
                    email: registerData.email,
                    password: hashedPassword,
                    first_name: registerData.firstName,
                    last_name: registerData.lastName,
                    phone: registerData.phone || null,
                    is_active: true,
                    email_verified: null,
                    phone_verified: null,
                    metadata: registerData.onboardingSecret ? { onboardingSecret: registerData.onboardingSecret } : null,
                },
            });
            const verificationTokenData = await this.emailVerificationService.generateVerificationToken(user.id, user.email);
            await this.email.sendWelcomeEmail(user.email, user.first_name, verificationTokenData.token);
            let onboardingResult;
            if (registerData.onboardingSecret) {
                onboardingResult = await this.processOnboardingSecret(user.id, registerData.onboardingSecret);
            }
            const realIpAddress = this.validateAndNormalizeIp(clientInfo?.ip || 'unknown');
            const deviceInfo = device_util_1.DeviceUtil.normalizeDeviceInfo({
                userAgent: clientInfo?.userAgent || 'registration',
                ipAddress: realIpAddress,
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
            this.logger.endOperation('register', operationId, true);
            const userProfile = this.mapDbUserToProfile(user);
            return {
                success: true,
                user: userProfile,
                tokens,
                verification: {
                    emailSent: true,
                    verificationRequired: true,
                    tokenId: verificationTokenData.id,
                },
                onboarding: onboardingResult,
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
            throw new Error('Erreur lors de l\'inscription');
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
            const isPasswordValid = await crypto_util_1.CryptoUtil.verifyPassword(password, dbUser.password);
            if (!isPasswordValid) {
                this.logger.endOperation('validateUser', operationId, false, undefined, { reason: 'invalid_password' });
                return null;
            }
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
    async validatePasswordStrength(password) {
        const suggestions = [];
        if (password.length < auth_constants_1.AUTH_CONSTANTS.VALIDATION.PASSWORD_MIN_LENGTH) {
            suggestions.push(`Minimum ${auth_constants_1.AUTH_CONSTANTS.VALIDATION.PASSWORD_MIN_LENGTH} caractères`);
        }
        if (!/[a-z]/.test(password)) {
            suggestions.push('Au moins une lettre minuscule');
        }
        if (!/[A-Z]/.test(password)) {
            suggestions.push('Au moins une lettre majuscule');
        }
        if (!/\d/.test(password)) {
            suggestions.push('Au moins un chiffre');
        }
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
            suggestions.push('Au moins un caractère spécial');
        }
        if (suggestions.length > 0) {
            throw new auth_exceptions_1.WeakPasswordException(suggestions);
        }
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
    async handleFailedLogin(email, context) {
        const operationId = this.logger.startOperation('handleFailedLogin', { email });
        try {
            const ipAddress = context?.ipAddress || 'unknown';
            const key = `failed_login:${ipAddress}:${email}`;
            const attempts = await this.redis.increment(key, 900);
            this.logger.logAuthEvent('failed_login', undefined, email, ipAddress, context?.userAgent, {
                attempts,
                timestamp: new Date().toISOString(),
            });
            this.logger.endOperation('handleFailedLogin', operationId, true);
        }
        catch (error) {
            this.logger.endOperation('handleFailedLogin', operationId, false, undefined, { error: error.message });
            this.logger.error('Failed to handle failed login', error.stack, 'AuthService');
        }
    }
    async updateLastLogin(userId, ipAddress) {
        try {
            await this.prisma.users.update({
                where: { id: userId },
                data: {
                    last_login: new Date(),
                },
            });
        }
        catch (error) {
            this.logger.error('Failed to update last login', error.stack, 'AuthService', JSON.stringify({ userId }));
        }
    }
    async processOnboardingSecret(userId, secret) {
        const operationId = this.logger.startOperation('processOnboardingSecret', { userId });
        try {
            this.logger.endOperation('processOnboardingSecret', operationId, true);
            return {
                incentiveApplied: false,
                incentiveType: null,
                incentiveValue: 0,
                migratedTickets: 0,
            };
        }
        catch (error) {
            this.logger.endOperation('processOnboardingSecret', operationId, false, undefined, { error: error.message });
            this.logger.error('Failed to process onboarding secret', error.stack, 'AuthService', JSON.stringify({ userId, secret }));
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
                        sessionsRevoked: revokedCount,
                    }, session.user_id);
                }
            }
            else {
                await this.sessionService.revokeSession(sessionId);
                this.logger.logBusinessEvent('LOGOUT', { sessionId });
            }
            this.logger.endOperation('logout', operationId, true);
            return true;
        }
        catch (error) {
            this.logger.endOperation('logout', operationId, false, undefined, { error: error.message });
            this.logger.error('Logout failed', error.stack, 'AuthService', JSON.stringify({ sessionId, allDevices }));
            return false;
        }
    }
    async verifyMfa(challengeToken, code, method) {
        throw new Error('MFA verification not implemented yet');
    }
    validateAndNormalizeIp(ip) {
        const cleanedIp = ip.trim();
        if (cleanedIp === 'unknown' || cleanedIp === '' || !cleanedIp) {
            return '127.0.0.1';
        }
        if (cleanedIp.startsWith('::ffff:')) {
            const ipv4 = cleanedIp.replace('::ffff:', '');
            if (this.isValidIpv4(ipv4)) {
                return ipv4;
            }
        }
        if (this.isValidIpv4(cleanedIp)) {
            return cleanedIp;
        }
        if (this.isValidIpv6(cleanedIp)) {
            return cleanedIp;
        }
        this.logger.warn('Invalid IP address provided, using localhost', JSON.stringify({
            originalIp: ip,
            cleanedIp,
        }));
        return '127.0.0.1';
    }
    isValidIpv4(ip) {
        const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
        return ipv4Regex.test(ip);
    }
    isValidIpv6(ip) {
        const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::1$|^::$/;
        return ipv6Regex.test(ip);
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
            await this.email.sendVerificationEmail(user.email, verificationTokenData.token);
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
        logger_service_1.LoggerService])
], AuthService);
//# sourceMappingURL=auth.service.js.map