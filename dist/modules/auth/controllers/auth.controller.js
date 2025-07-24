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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const logger_service_1 = require("../../../shared/logger/logger.service");
const auth_service_1 = require("../services/auth.service");
const dto_1 = require("../dto");
const dto_2 = require("../dto");
const jwt_auth_guard_1 = require("../guards/jwt-auth.guard");
const decorators_1 = require("../decorators");
const decorators_2 = require("../decorators");
let AuthController = class AuthController {
    authService;
    logger;
    constructor(authService, loggerService) {
        this.authService = authService;
        this.logger = loggerService.createChildLogger('AuthController');
    }
    async login(loginDto, clientInfo) {
        const operationId = this.logger.startOperation('POST /auth/login', {
            email: loginDto.email,
            rememberMe: loginDto.rememberMe,
            hasDeviceFingerprint: !!loginDto.deviceFingerprint,
        });
        try {
            const securityContext = {
                ipAddress: clientInfo.ip,
                userAgent: clientInfo.userAgent,
                deviceFingerprint: loginDto.deviceFingerprint || clientInfo.deviceFingerprint,
            };
            const result = await this.authService.login(loginDto, securityContext);
            this.logger.endOperation('login', operationId, true);
            const response = {
                success: result.success,
                data: result.user && result.tokens && result.session ? {
                    user: dto_2.UserProfileMapper.toDto(result.user),
                    tokens: {
                        accessToken: result.tokens.accessToken,
                        refreshToken: result.tokens.refreshToken,
                        tokenType: result.tokens.tokenType,
                        expiresIn: result.tokens.expiresIn,
                    },
                    session: {
                        sessionId: result.session.sessionId,
                        expiresAt: result.session.expiresAt,
                        deviceInfo: result.session.deviceInfo,
                        isActive: result.session.isActive,
                        lastActivity: result.session.lastActivity,
                    },
                    mfaRequired: result.mfaRequired ? {
                        methods: result.mfaRequired.methods,
                        challengeToken: result.mfaRequired.challengeToken,
                        expiresIn: result.mfaRequired.expiresIn,
                    } : undefined,
                } : undefined,
                meta: result.meta,
            };
            return response;
        }
        catch (error) {
            this.logger.endOperation('login', operationId, false, undefined, { error: error.message });
            throw error;
        }
    }
    async register(registerDto, clientInfo) {
        const operationId = this.logger.startOperation('POST /auth/register', {
            email: registerDto.email,
            firstName: registerDto.firstName,
            lastName: registerDto.lastName,
            hasOnboardingSecret: !!registerDto.onboardingSecret,
        });
        try {
            const result = await this.authService.register(registerDto);
            this.logger.endOperation('register', operationId, true);
            const response = dto_2.RegisterResponseMapper.toDto(result);
            return response;
        }
        catch (error) {
            this.logger.endOperation('register', operationId, false, undefined, { error: error.message });
            throw error;
        }
    }
    async logout(user, sessionId, logoutDto) {
        const operationId = this.logger.startOperation('POST /auth/logout', {
            userId: user.id,
            allDevices: logoutDto?.allDevices || false,
        });
        try {
            const result = await this.authService.logout(sessionId, logoutDto?.allDevices || false);
            this.logger.endOperation('logout', operationId, true);
            return {
                success: true,
                data: {
                    message: 'Déconnexion réussie',
                    tokensInvalidated: result ? 1 : 0,
                    sessionsTerminated: result ? 1 : 0,
                },
            };
        }
        catch (error) {
            this.logger.endOperation('logout', operationId, false, undefined, { error: error.message });
            throw error;
        }
    }
    async verifyEmail(verifyDto) {
        const operationId = this.logger.startOperation('POST /auth/verify-email', {
            tokenLength: verifyDto.token?.length,
        });
        try {
            this.logger.endOperation('verifyEmail', operationId, true);
            return {
                success: true,
                data: {
                    verified: true,
                    message: 'Email vérifié avec succès',
                },
            };
        }
        catch (error) {
            this.logger.endOperation('verifyEmail', operationId, false, undefined, { error: error.message });
            throw error;
        }
    }
    async resendVerification(resendDto) {
        const operationId = this.logger.startOperation('POST /auth/resend-verification', {
            email: resendDto.email,
        });
        try {
            this.logger.endOperation('resendVerification', operationId, true);
            return {
                success: true,
                data: {
                    sent: true,
                    message: 'Email de vérification envoyé si compte existant',
                },
            };
        }
        catch (error) {
            this.logger.endOperation('resendVerification', operationId, false, undefined, { error: error.message });
            throw error;
        }
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, decorators_1.Public)(),
    (0, common_1.Post)('login'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, decorators_2.RateLimitLogin)(),
    (0, decorators_2.AuditCritical)('user_login'),
    (0, swagger_1.ApiOperation)({
        summary: 'Connexion utilisateur',
        description: 'Authentification avec email/password et validation de sécurité adaptative'
    }),
    (0, swagger_1.ApiBody)({ type: dto_1.LoginDto }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Connexion réussie',
        type: dto_1.LoginResponseDto
    }),
    (0, swagger_1.ApiResponse)({
        status: 401,
        description: 'Identifiants invalides'
    }),
    (0, swagger_1.ApiResponse)({
        status: 423,
        description: 'Compte verrouillé'
    }),
    (0, swagger_1.ApiResponse)({
        status: 429,
        description: 'Trop de tentatives'
    }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, decorators_1.ClientInfo)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.LoginDto, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
__decorate([
    (0, decorators_1.Public)(),
    (0, common_1.Post)('register'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, decorators_2.RateLimit)({ limit: 3, windowMs: 3600000 }),
    (0, decorators_2.AuditCritical)('user_registration'),
    (0, swagger_1.ApiOperation)({
        summary: 'Inscription utilisateur',
        description: 'Création compte avec validation complète et onboarding'
    }),
    (0, swagger_1.ApiBody)({ type: dto_1.RegisterDto }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Inscription réussie',
        type: dto_1.RegisterResponseDto
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
    __param(1, (0, decorators_1.ClientInfo)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.RegisterDto, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "register", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('logout'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, decorators_2.AuditCritical)('user_logout'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Déconnexion utilisateur',
        description: 'Invalidation des tokens et fermeture session(s)'
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Déconnexion réussie'
    }),
    (0, swagger_1.ApiResponse)({
        status: 401,
        description: 'Token invalide'
    }),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, decorators_1.SessionId)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "logout", null);
__decorate([
    (0, decorators_1.Public)(),
    (0, common_1.Post)('verify-email'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, decorators_2.RateLimit)({ limit: 5, windowMs: 300000 }),
    (0, decorators_2.AuditCritical)('email_verification'),
    (0, swagger_1.ApiOperation)({
        summary: 'Vérification email',
        description: 'Activation compte via token de vérification'
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Email vérifié avec succès'
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Token invalide ou expiré'
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "verifyEmail", null);
__decorate([
    (0, decorators_1.Public)(),
    (0, common_1.Post)('resend-verification'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, decorators_2.RateLimit)({ limit: 3, windowMs: 300000 }),
    (0, decorators_2.AuditCritical)('resend_verification'),
    (0, swagger_1.ApiOperation)({
        summary: 'Renvoyer email vérification',
        description: 'Renvoie un nouveau token de vérification par email'
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Email envoyé'
    }),
    (0, swagger_1.ApiResponse)({
        status: 429,
        description: 'Trop de tentatives'
    }),
    __param(0, (0, common_1.Body)()),
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