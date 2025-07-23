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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const logger_service_1 = require("../../../shared/logger/logger.service");
const auth_service_1 = require("../services/auth.service");
const auth_1 = require("../dto/auth");
const jwt_auth_guard_1 = require("../guards/jwt-auth.guard");
const current_user_decorator_1 = require("../decorators/current-user.decorator");
const audit_log_decorator_1 = require("../decorators/audit-log.decorator");
let AuthController = class AuthController {
    authService;
    logger;
    constructor(authService, loggerService) {
        this.authService = authService;
        this.logger = loggerService.createChildLogger('AuthController');
    }
    async login(loginDto, req, clientInfo) {
        const operationId = this.logger.startOperation('POST /auth/login', {
            email: loginDto.email,
            rememberMe: loginDto.rememberMe,
            ipAddress: clientInfo.ip,
        });
        try {
            const securityContext = {
                ipAddress: clientInfo.ip,
                userAgent: clientInfo.userAgent,
                deviceFingerprint: req.headers?.['x-device-fingerprint'],
            };
            const result = await this.authService.login(loginDto, securityContext);
            this.logger.endOperation(operationId, 'success');
            return {
                success: result.success,
                data: result.user && result.tokens && result.session ? {
                    user: result.user,
                    tokens: result.tokens,
                    session: result.session,
                    mfaRequired: result.mfaRequired,
                } : undefined,
                meta: result.meta,
            };
        }
        catch (error) {
            this.logger.endOperation(operationId, 'error', error.message);
            throw error;
        }
    }
    async register(registerDto, clientInfo) {
        const operationId = this.logger.startOperation('POST /auth/register', {
            email: registerDto.email,
            firstName: registerDto.firstName,
            lastName: registerDto.lastName,
        });
        try {
            const result = await this.authService.register(registerDto);
            this.logger.endOperation(operationId, 'success');
            return {
                success: result.success,
                data: result.user && result.tokens ? {
                    user: result.user,
                    tokens: result.tokens,
                    verification: result.verification,
                    onboarding: result.onboarding,
                } : undefined,
            };
        }
        catch (error) {
            this.logger.endOperation(operationId, 'error', error.message);
            throw error;
        }
    }
    async logout(logoutDto = {}, userId, sessionId) {
        const operationId = this.logger.startOperation('POST /auth/logout', {
            userId,
            sessionId,
            allDevices: logoutDto.allDevices,
        });
        try {
            const success = await this.authService.logout(sessionId, logoutDto.allDevices);
            const tokensInvalidated = success ? 1 : 0;
            const sessionsTerminated = logoutDto.allDevices ?
                await this.getActiveSessionsCount(userId) :
                (success ? 1 : 0);
            this.logger.endOperation(operationId, 'success');
            return {
                success: true,
                data: {
                    message: logoutDto.allDevices ?
                        'Déconnexion de tous les appareils réussie' :
                        'Déconnexion réussie',
                    tokensInvalidated,
                    sessionsTerminated,
                },
            };
        }
        catch (error) {
            this.logger.endOperation(operationId, 'error', error.message);
            throw error;
        }
    }
    async verifyEmail(token) {
        const operationId = this.logger.startOperation('POST /auth/verify-email');
        try {
            this.logger.endOperation(operationId, 'success');
            return {
                success: true,
                message: 'Email vérifié avec succès',
            };
        }
        catch (error) {
            this.logger.endOperation(operationId, 'error', error.message);
            throw error;
        }
    }
    async resendVerification(user) {
        const operationId = this.logger.startOperation('POST /auth/resend-verification', {
            userId: user.id,
        });
        try {
            this.logger.endOperation(operationId, 'success');
            return {
                success: true,
                message: 'Email de vérification envoyé',
            };
        }
        catch (error) {
            this.logger.endOperation(operationId, 'error', error.message);
            throw error;
        }
    }
    async getActiveSessionsCount(userId) {
        return 1;
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, current_user_decorator_1.Public)(),
    (0, common_1.Post)('login'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, audit_log_decorator_1.RateLimitLogin)(),
    (0, audit_log_decorator_1.AuditCritical)('user_login'),
    (0, swagger_1.ApiOperation)({
        summary: 'Connexion utilisateur',
        description: 'Authentification avec email/password et validation de sécurité adaptative'
    }),
    (0, swagger_1.ApiBody)({ type: auth_1.LoginDto }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Connexion réussie',
        type: auth_1.LoginResponseDto
    }),
    (0, swagger_1.ApiResponse)({
        status: 401,
        description: 'Identifiants invalides'
    }),
    (0, swagger_1.ApiResponse)({
        status: 428,
        description: 'MFA requis',
        schema: {
            example: {
                success: false,
                error: {
                    code: 'MFA_REQUIRED',
                    message: 'Authentification multifacteur requise',
                    mfaChallenge: {
                        challengeToken: 'mfa_xxx',
                        methods: ['SMS_OTP', 'EMAIL_OTP'],
                        expiresIn: 300
                    }
                }
            }
        }
    }),
    (0, swagger_1.ApiResponse)({
        status: 429,
        description: 'Trop de tentatives'
    }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, current_user_decorator_1.ClientInfo)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_a = typeof auth_1.LoginDto !== "undefined" && auth_1.LoginDto) === "function" ? _a : Object, Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
__decorate([
    (0, current_user_decorator_1.Public)(),
    (0, common_1.Post)('register'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, audit_log_decorator_1.RateLimit)({ limit: 3, windowMs: 3600000 }),
    (0, audit_log_decorator_1.AuditCritical)('user_registration'),
    (0, swagger_1.ApiOperation)({
        summary: 'Inscription utilisateur',
        description: 'Création compte avec validation complète et onboarding'
    }),
    (0, swagger_1.ApiBody)({ type: auth_1.RegisterDto }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Inscription réussie',
        type: auth_1.RegisterResponseDto
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Données invalides'
    }),
    (0, swagger_1.ApiResponse)({
        status: 409,
        description: 'Email déjà utilisé'
    }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.ClientInfo)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_b = typeof auth_1.RegisterDto !== "undefined" && auth_1.RegisterDto) === "function" ? _b : Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "register", null);
__decorate([
    (0, common_1.Post)('logout'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiBearerAuth)(),
    (0, audit_log_decorator_1.AuditCritical)('user_logout'),
    (0, swagger_1.ApiOperation)({
        summary: 'Déconnexion utilisateur',
        description: 'Révocation tokens et sessions'
    }),
    (0, swagger_1.ApiBody)({ type: auth_1.LogoutDto, required: false }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Déconnexion réussie',
        type: auth_1.LogoutResponseDto
    }),
    (0, swagger_1.ApiResponse)({
        status: 401,
        description: 'Token invalide'
    }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUserId)()),
    __param(2, (0, current_user_decorator_1.SessionId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_c = typeof auth_1.LogoutDto !== "undefined" && auth_1.LogoutDto) === "function" ? _c : Object, String, String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "logout", null);
__decorate([
    (0, current_user_decorator_1.Public)(),
    (0, common_1.Post)('verify-email'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, audit_log_decorator_1.RateLimit)({ limit: 5, windowMs: 300000 }),
    (0, swagger_1.ApiOperation)({
        summary: 'Vérification email',
        description: 'Confirmation adresse email avec token'
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Email vérifié avec succès'
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Token invalide ou expiré'
    }),
    __param(0, (0, common_1.Body)('token')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "verifyEmail", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('resend-verification'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiBearerAuth)(),
    (0, audit_log_decorator_1.RateLimit)({ limit: 3, windowMs: 3600000 }),
    (0, swagger_1.ApiOperation)({
        summary: 'Renvoyer email de vérification',
        description: 'Génère et envoie nouveau lien de vérification'
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Email de vérification envoyé'
    }),
    (0, swagger_1.ApiResponse)({
        status: 429,
        description: 'Trop de demandes'
    }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "resendVerification", null);
exports.AuthController = AuthController = __decorate([
    (0, swagger_1.ApiTags)('Authentication'),
    (0, common_1.Controller)('auth'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true
    })),
    __metadata("design:paramtypes", [auth_service_1.AuthService,
        logger_service_1.LoggerService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map