"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var AuthModule_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAuthModule = exports.validateAuthConfig = exports.DEFAULT_AUTH_CONFIG = exports.RiskScoringUtil = exports.SecurityUtil = exports.TokenUtil = exports.GeolocationUtil = exports.DeviceUtil = exports.CryptoUtil = exports.ERROR_CONSTANTS = exports.SECURITY_CONSTANTS = exports.MFA_CONSTANTS = exports.SESSION_CONSTANTS = exports.AUTH_CONSTANTS = exports.SuspiciousActivityException = exports.InvalidRefreshTokenException = exports.SessionExpiredException = exports.DeviceNotTrustedException = exports.InvalidMfaCodeException = exports.MfaRequiredException = exports.EmailNotVerifiedException = exports.AccountLockedException = exports.InvalidCredentialsException = exports.Permissions = exports.Roles = exports.RateLimit = exports.AuditLog = exports.RequireTrustedDevice = exports.RequireMfa = exports.Public = exports.SessionId = exports.CurrentSession = exports.CurrentUserId = exports.CurrentUser = exports.MfaVerifyDto = exports.MfaSetupDto = exports.ChangePasswordDto = exports.ResetPasswordDto = exports.ForgotPasswordDto = exports.RefreshTokenDto = exports.RegisterDto = exports.LoginDto = exports.AuthModule = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const passport_1 = require("@nestjs/passport");
const config_1 = require("@nestjs/config");
const shared_module_1 = require("../../shared/shared.module");
const users_module_1 = require("../users/users.module");
const jwt_config_1 = require("./config/jwt.config");
const session_config_1 = require("./config/session.config");
const mfa_config_1 = require("./config/mfa.config");
const security_config_1 = require("./config/security.config");
const rate_limit_config_1 = require("./config/rate-limit.config");
const auth_controller_1 = require("./controllers/auth.controller");
const session_controller_1 = require("./controllers/session.controller");
const password_controller_1 = require("./controllers/password.controller");
const mfa_controller_1 = require("./controllers/mfa.controller");
const security_controller_1 = require("./controllers/security.controller");
const auth_service_1 = require("./services/auth.service");
const token_service_1 = require("./services/token.service");
const session_service_1 = require("./services/session.service");
const password_service_1 = require("./services/password.service");
const mfa_service_1 = require("./services/mfa.service");
const security_service_1 = require("./services/security.service");
const device_service_1 = require("./services/device.service");
const email_verification_service_1 = require("./services/email-verification.service");
const jwt_strategy_1 = require("./strategies/jwt.strategy");
const jwt_refresh_strategy_1 = require("./strategies/jwt-refresh.strategy");
const local_strategy_1 = require("./strategies/local.strategy");
const jwt_auth_guard_1 = require("./guards/jwt-auth.guard");
const jwt_refresh_guard_1 = require("./guards/jwt-refresh.guard");
const mfa_required_guard_1 = require("./guards/mfa-required.guard");
const device_trusted_guard_1 = require("./guards/device-trusted.guard");
const account_status_guard_1 = require("./guards/account-status.guard");
let AuthModule = AuthModule_1 = class AuthModule {
    static forRoot() {
        return {
            module: AuthModule_1,
            providers: [],
            exports: [
                auth_service_1.AuthService,
                token_service_1.TokenService,
                session_service_1.SessionService,
                jwt_auth_guard_1.JwtAuthGuard,
            ],
        };
    }
    static forRootAsync(options) {
        return {
            module: AuthModule_1,
            imports: options.imports || [],
            providers: [
                {
                    provide: 'AUTH_MODULE_OPTIONS',
                    useFactory: options.useFactory,
                    inject: options.inject || [],
                },
            ],
            exports: [
                auth_service_1.AuthService,
                token_service_1.TokenService,
                session_service_1.SessionService,
                jwt_auth_guard_1.JwtAuthGuard,
            ],
        };
    }
    static forFeature(features) {
        const providers = [];
        if (features.enableMfa !== false) {
            providers.push(mfa_service_1.MfaService, mfa_required_guard_1.MfaRequiredGuard);
        }
        if (features.enableDeviceTrust !== false) {
            providers.push(device_service_1.DeviceService, device_trusted_guard_1.DeviceTrustedGuard);
        }
        if (features.enableRiskScoring !== false) {
            providers.push(security_service_1.SecurityService);
        }
        return {
            module: AuthModule_1,
            providers,
            exports: providers,
        };
    }
};
exports.AuthModule = AuthModule;
exports.AuthModule = AuthModule = AuthModule_1 = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule,
            shared_module_1.SharedModule,
            (0, common_1.forwardRef)(() => users_module_1.UsersModule),
            passport_1.PassportModule.register({
                defaultStrategy: 'jwt',
                property: 'user',
                session: false,
            }),
            jwt_1.JwtModule.registerAsync({
                imports: [config_1.ConfigModule],
                useFactory: jwt_config_1.getJwtConfig,
                inject: [config_1.ConfigService],
            }),
        ],
        controllers: [
            auth_controller_1.AuthController,
            session_controller_1.SessionController,
            password_controller_1.PasswordController,
            mfa_controller_1.MfaController,
            security_controller_1.SecurityController,
        ],
        providers: [
            auth_service_1.AuthService,
            token_service_1.TokenService,
            session_service_1.SessionService,
            password_service_1.PasswordService,
            mfa_service_1.MfaService,
            security_service_1.SecurityService,
            device_service_1.DeviceService,
            email_verification_service_1.EmailVerificationService,
            jwt_strategy_1.JwtStrategy,
            jwt_refresh_strategy_1.JwtRefreshStrategy,
            local_strategy_1.LocalStrategy,
            jwt_auth_guard_1.JwtAuthGuard,
            jwt_refresh_guard_1.JwtRefreshGuard,
            mfa_required_guard_1.MfaRequiredGuard,
            device_trusted_guard_1.DeviceTrustedGuard,
            account_status_guard_1.AccountStatusGuard,
            {
                provide: 'JWT_CONFIG',
                useFactory: jwt_config_1.getJwtConfig,
                inject: [config_1.ConfigService],
            },
            {
                provide: 'JWT_REFRESH_CONFIG',
                useFactory: jwt_config_1.getJwtRefreshConfig,
                inject: [config_1.ConfigService],
            },
            {
                provide: 'SESSION_CONFIG',
                useFactory: session_config_1.getSessionConfig,
                inject: [config_1.ConfigService],
            },
            {
                provide: 'MFA_CONFIG',
                useFactory: mfa_config_1.getMfaConfig,
                inject: [config_1.ConfigService],
            },
            {
                provide: 'SECURITY_CONFIG',
                useFactory: security_config_1.getSecurityConfig,
                inject: [config_1.ConfigService],
            },
            {
                provide: 'RATE_LIMIT_CONFIG',
                useFactory: rate_limit_config_1.getRateLimitConfig,
                inject: [config_1.ConfigService],
            },
            {
                provide: 'JWT_REFRESH_SERVICE',
                useFactory: (configService) => {
                    const { JwtService } = require('@nestjs/jwt');
                    return new JwtService((0, jwt_config_1.getJwtRefreshConfig)(configService));
                },
                inject: [config_1.ConfigService],
            },
        ],
        exports: [
            auth_service_1.AuthService,
            token_service_1.TokenService,
            session_service_1.SessionService,
            password_service_1.PasswordService,
            mfa_service_1.MfaService,
            security_service_1.SecurityService,
            device_service_1.DeviceService,
            email_verification_service_1.EmailVerificationService,
            jwt_auth_guard_1.JwtAuthGuard,
            jwt_refresh_guard_1.JwtRefreshGuard,
            mfa_required_guard_1.MfaRequiredGuard,
            device_trusted_guard_1.DeviceTrustedGuard,
            account_status_guard_1.AccountStatusGuard,
            jwt_strategy_1.JwtStrategy,
            jwt_refresh_strategy_1.JwtRefreshStrategy,
            local_strategy_1.LocalStrategy,
            passport_1.PassportModule,
            jwt_1.JwtModule,
        ],
    })
], AuthModule);
var dto_1 = require("./dto");
Object.defineProperty(exports, "LoginDto", { enumerable: true, get: function () { return dto_1.LoginDto; } });
Object.defineProperty(exports, "RegisterDto", { enumerable: true, get: function () { return dto_1.RegisterDto; } });
Object.defineProperty(exports, "RefreshTokenDto", { enumerable: true, get: function () { return dto_1.RefreshTokenDto; } });
Object.defineProperty(exports, "ForgotPasswordDto", { enumerable: true, get: function () { return dto_1.ForgotPasswordDto; } });
Object.defineProperty(exports, "ResetPasswordDto", { enumerable: true, get: function () { return dto_1.ResetPasswordDto; } });
Object.defineProperty(exports, "ChangePasswordDto", { enumerable: true, get: function () { return dto_1.ChangePasswordDto; } });
Object.defineProperty(exports, "MfaSetupDto", { enumerable: true, get: function () { return dto_1.MfaSetupDto; } });
Object.defineProperty(exports, "MfaVerifyDto", { enumerable: true, get: function () { return dto_1.MfaVerifyDto; } });
var decorators_1 = require("./decorators");
Object.defineProperty(exports, "CurrentUser", { enumerable: true, get: function () { return decorators_1.CurrentUser; } });
Object.defineProperty(exports, "CurrentUserId", { enumerable: true, get: function () { return decorators_1.CurrentUserId; } });
Object.defineProperty(exports, "CurrentSession", { enumerable: true, get: function () { return decorators_1.CurrentSession; } });
Object.defineProperty(exports, "SessionId", { enumerable: true, get: function () { return decorators_1.SessionId; } });
Object.defineProperty(exports, "Public", { enumerable: true, get: function () { return decorators_1.Public; } });
Object.defineProperty(exports, "RequireMfa", { enumerable: true, get: function () { return decorators_1.RequireMfa; } });
Object.defineProperty(exports, "RequireTrustedDevice", { enumerable: true, get: function () { return decorators_1.RequireTrustedDevice; } });
Object.defineProperty(exports, "AuditLog", { enumerable: true, get: function () { return decorators_1.AuditLog; } });
Object.defineProperty(exports, "RateLimit", { enumerable: true, get: function () { return decorators_1.RateLimit; } });
Object.defineProperty(exports, "Roles", { enumerable: true, get: function () { return decorators_1.Roles; } });
Object.defineProperty(exports, "Permissions", { enumerable: true, get: function () { return decorators_1.Permissions; } });
var exceptions_1 = require("./exceptions");
Object.defineProperty(exports, "InvalidCredentialsException", { enumerable: true, get: function () { return exceptions_1.InvalidCredentialsException; } });
Object.defineProperty(exports, "AccountLockedException", { enumerable: true, get: function () { return exceptions_1.AccountLockedException; } });
Object.defineProperty(exports, "EmailNotVerifiedException", { enumerable: true, get: function () { return exceptions_1.EmailNotVerifiedException; } });
Object.defineProperty(exports, "MfaRequiredException", { enumerable: true, get: function () { return exceptions_1.MfaRequiredException; } });
Object.defineProperty(exports, "InvalidMfaCodeException", { enumerable: true, get: function () { return exceptions_1.InvalidMfaCodeException; } });
Object.defineProperty(exports, "DeviceNotTrustedException", { enumerable: true, get: function () { return exceptions_1.DeviceNotTrustedException; } });
Object.defineProperty(exports, "SessionExpiredException", { enumerable: true, get: function () { return exceptions_1.SessionExpiredException; } });
Object.defineProperty(exports, "InvalidRefreshTokenException", { enumerable: true, get: function () { return exceptions_1.InvalidRefreshTokenException; } });
Object.defineProperty(exports, "SuspiciousActivityException", { enumerable: true, get: function () { return exceptions_1.SuspiciousActivityException; } });
var constants_1 = require("./constants");
Object.defineProperty(exports, "AUTH_CONSTANTS", { enumerable: true, get: function () { return constants_1.AUTH_CONSTANTS; } });
Object.defineProperty(exports, "SESSION_CONSTANTS", { enumerable: true, get: function () { return constants_1.SESSION_CONSTANTS; } });
Object.defineProperty(exports, "MFA_CONSTANTS", { enumerable: true, get: function () { return constants_1.MFA_CONSTANTS; } });
Object.defineProperty(exports, "SECURITY_CONSTANTS", { enumerable: true, get: function () { return constants_1.SECURITY_CONSTANTS; } });
Object.defineProperty(exports, "ERROR_CONSTANTS", { enumerable: true, get: function () { return constants_1.ERROR_CONSTANTS; } });
var utils_1 = require("./utils");
Object.defineProperty(exports, "CryptoUtil", { enumerable: true, get: function () { return utils_1.CryptoUtil; } });
Object.defineProperty(exports, "DeviceUtil", { enumerable: true, get: function () { return utils_1.DeviceUtil; } });
Object.defineProperty(exports, "GeolocationUtil", { enumerable: true, get: function () { return utils_1.GeolocationUtil; } });
Object.defineProperty(exports, "TokenUtil", { enumerable: true, get: function () { return utils_1.TokenUtil; } });
Object.defineProperty(exports, "SecurityUtil", { enumerable: true, get: function () { return utils_1.SecurityUtil; } });
Object.defineProperty(exports, "RiskScoringUtil", { enumerable: true, get: function () { return utils_1.RiskScoringUtil; } });
exports.DEFAULT_AUTH_CONFIG = {
    jwtSecret: process.env.JWT_SECRET || 'default-secret-change-in-production',
    jwtExpiresIn: '15m',
    jwtRefreshExpiresIn: '7d',
    sessionDuration: 24 * 60 * 60,
    maxConcurrentSessions: 10,
    mfaEnabled: true,
    mfaRequiredForOrganizers: true,
    riskScoringEnabled: true,
    deviceTrustEnabled: true,
    rateLimitingEnabled: true,
    loginAttemptsLimit: 5,
    loginAttemptsWindow: 15 * 60,
    emailVerificationRequired: false,
    auditEnabled: true,
    auditRetentionDays: 90,
};
function validateAuthConfig(config) {
    const requiredFields = [
        'jwtSecret',
        'jwtExpiresIn',
        'jwtRefreshExpiresIn',
    ];
    return requiredFields.every(field => config[field]);
}
exports.validateAuthConfig = validateAuthConfig;
function createAuthModule(config) {
    const finalConfig = { ...exports.DEFAULT_AUTH_CONFIG, ...config };
    if (!validateAuthConfig(finalConfig)) {
        throw new Error('Configuration Auth invalide - vérifiez les champs obligatoires');
    }
    return AuthModule.forRootAsync({
        imports: [config_1.ConfigModule],
        useFactory: () => finalConfig,
        inject: [config_1.ConfigService],
    });
}
exports.createAuthModule = createAuthModule;
//# sourceMappingURL=auth.module.js.map