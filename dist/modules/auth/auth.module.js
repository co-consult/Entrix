"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var AuthModule_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RiskScoringUtil = exports.SecurityUtil = exports.TokenUtil = exports.GeolocationUtil = exports.DeviceUtil = exports.CryptoUtil = exports.VALIDATION_TOKEN_ATTEMPT_LIMITS = exports.VALIDATION_TOKEN_DURATIONS = exports.ERROR_CONSTANTS = exports.SECURITY_CONSTANTS = exports.MFA_CONSTANTS = exports.SESSION_CONSTANTS = exports.AUTH_CONSTANTS = exports.SuspiciousActivityException = exports.InvalidRefreshTokenException = exports.SessionExpiredException = exports.DeviceNotTrustedException = exports.InvalidMfaCodeException = exports.MfaRequiredException = exports.EmailNotVerifiedException = exports.AccountLockedException = exports.InvalidCredentialsException = exports.RequireScopes = exports.Permissions = exports.Roles = exports.RateLimit = exports.AuditLog = exports.RequireTrustedDevice = exports.RequireMfa = exports.Public = exports.SessionId = exports.CurrentSession = exports.CurrentUserId = exports.CurrentUser = exports.ValidationTokenResponseDto = exports.CreateInvitationDto = exports.CreatePasswordResetDto = exports.CreateEmailVerificationDto = exports.PersistentTokenResponseDto = exports.GenerateApiKeyDto = exports.CreatePersistentTokenDto = exports.MfaVerifyDto = exports.MfaSetupDto = exports.ChangePasswordDto = exports.ResetPasswordDto = exports.ForgotPasswordDto = exports.RefreshTokenDto = exports.RegisterDto = exports.LoginDto = exports.AuthModule = void 0;
exports.DEFAULT_AUTH_CONFIG = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const passport_1 = require("@nestjs/passport");
const config_1 = require("@nestjs/config");
const schedule_1 = require("@nestjs/schedule");
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
const persistent_token_controller_1 = require("./controllers/persistent-token.controller");
const validation_token_controller_1 = require("./controllers/validation-token.controller");
const auth_service_1 = require("./services/auth.service");
const token_service_1 = require("./services/token.service");
const session_service_1 = require("./services/session.service");
const password_service_1 = require("./services/password.service");
const mfa_service_1 = require("./services/mfa.service");
const security_service_1 = require("./services/security.service");
const device_service_1 = require("./services/device.service");
const email_verification_service_1 = require("./services/email-verification.service");
const trusted_devices_service_1 = require("./services/trusted-devices.service");
const risk_assessment_service_1 = require("./services/risk-assessment.service");
const persistent_token_service_1 = require("./services/persistent-token.service");
const validation_token_service_1 = require("./services/validation-token.service");
const token_maintenance_service_1 = require("./services/token-maintenance.service");
const jwt_strategy_1 = require("./strategies/jwt.strategy");
const jwt_refresh_strategy_1 = require("./strategies/jwt-refresh.strategy");
const local_strategy_1 = require("./strategies/local.strategy");
const jwt_auth_guard_1 = require("./guards/jwt-auth.guard");
const jwt_refresh_guard_1 = require("./guards/jwt-refresh.guard");
const mfa_required_guard_1 = require("./guards/mfa-required.guard");
const device_trusted_guard_1 = require("./guards/device-trusted.guard");
const account_status_guard_1 = require("./guards/account-status.guard");
const api_key_guard_1 = require("./guards/api-key.guard");
let AuthModule = AuthModule_1 = class AuthModule {
    static withFeatures(features) {
        const providers = [];
        const controllers = [];
        const exports = [];
        if (features.enableMfa !== false) {
            providers.push(mfa_service_1.MfaService, mfa_required_guard_1.MfaRequiredGuard);
            controllers.push(mfa_controller_1.MfaController);
        }
        if (features.enableDeviceTrust !== false) {
            providers.push(device_service_1.DeviceService, device_trusted_guard_1.DeviceTrustedGuard);
        }
        if (features.enableRiskScoring !== false) {
            providers.push(security_service_1.SecurityService);
            controllers.push(security_controller_1.SecurityController);
        }
        if (features.enablePasswordService !== false) {
            providers.push(password_service_1.PasswordService);
            controllers.push(password_controller_1.PasswordController);
        }
        if (features.enablePersistentTokens !== false) {
            providers.push(persistent_token_service_1.PersistentTokenService);
            controllers.push(persistent_token_controller_1.PersistentTokenController);
            exports.push(persistent_token_service_1.PersistentTokenService);
        }
        if (features.enableValidationTokens !== false) {
            providers.push(validation_token_service_1.ValidationTokenService);
            controllers.push(validation_token_controller_1.ValidationTokenController);
            exports.push(validation_token_service_1.ValidationTokenService);
        }
        if (features.enableTokenMaintenance !== false) {
            providers.push(token_maintenance_service_1.TokenMaintenanceService);
            exports.push(token_maintenance_service_1.TokenMaintenanceService);
        }
        if (features.enableApiKeyAuth !== false) {
            providers.push(api_key_guard_1.ApiKeyGuard);
            exports.push(api_key_guard_1.ApiKeyGuard);
        }
        return {
            module: AuthModule_1,
            providers,
            controllers,
            exports,
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
            schedule_1.ScheduleModule.forRoot(),
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
            persistent_token_controller_1.PersistentTokenController,
            validation_token_controller_1.ValidationTokenController,
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
            trusted_devices_service_1.TrustedDevicesService,
            risk_assessment_service_1.RiskAssessmentService,
            persistent_token_service_1.PersistentTokenService,
            validation_token_service_1.ValidationTokenService,
            token_maintenance_service_1.TokenMaintenanceService,
            jwt_strategy_1.JwtStrategy,
            jwt_refresh_strategy_1.JwtRefreshStrategy,
            local_strategy_1.LocalStrategy,
            jwt_auth_guard_1.JwtAuthGuard,
            jwt_refresh_guard_1.JwtRefreshGuard,
            mfa_required_guard_1.MfaRequiredGuard,
            device_trusted_guard_1.DeviceTrustedGuard,
            account_status_guard_1.AccountStatusGuard,
            api_key_guard_1.ApiKeyGuard,
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
                    return jwt_1.JwtModule.registerAsync({
                        useFactory: jwt_config_1.getJwtRefreshConfig,
                        inject: [config_1.ConfigService],
                    });
                },
                inject: [config_1.ConfigService],
            },
        ],
        exports: [
            auth_service_1.AuthService,
            token_service_1.TokenService,
            session_service_1.SessionService,
            password_service_1.PasswordService,
            security_service_1.SecurityService,
            email_verification_service_1.EmailVerificationService,
            trusted_devices_service_1.TrustedDevicesService,
            risk_assessment_service_1.RiskAssessmentService,
            persistent_token_service_1.PersistentTokenService,
            validation_token_service_1.ValidationTokenService,
            token_maintenance_service_1.TokenMaintenanceService,
            jwt_auth_guard_1.JwtAuthGuard,
            jwt_refresh_guard_1.JwtRefreshGuard,
            mfa_required_guard_1.MfaRequiredGuard,
            device_trusted_guard_1.DeviceTrustedGuard,
            account_status_guard_1.AccountStatusGuard,
            api_key_guard_1.ApiKeyGuard,
            jwt_strategy_1.JwtStrategy,
            jwt_refresh_strategy_1.JwtRefreshStrategy,
            'JWT_CONFIG',
            'SESSION_CONFIG',
            'SECURITY_CONFIG',
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
Object.defineProperty(exports, "CreatePersistentTokenDto", { enumerable: true, get: function () { return dto_1.CreatePersistentTokenDto; } });
Object.defineProperty(exports, "GenerateApiKeyDto", { enumerable: true, get: function () { return dto_1.GenerateApiKeyDto; } });
Object.defineProperty(exports, "PersistentTokenResponseDto", { enumerable: true, get: function () { return dto_1.PersistentTokenResponseDto; } });
Object.defineProperty(exports, "CreateEmailVerificationDto", { enumerable: true, get: function () { return dto_1.CreateEmailVerificationDto; } });
Object.defineProperty(exports, "CreatePasswordResetDto", { enumerable: true, get: function () { return dto_1.CreatePasswordResetDto; } });
Object.defineProperty(exports, "CreateInvitationDto", { enumerable: true, get: function () { return dto_1.CreateInvitationDto; } });
Object.defineProperty(exports, "ValidationTokenResponseDto", { enumerable: true, get: function () { return dto_1.ValidationTokenResponseDto; } });
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
Object.defineProperty(exports, "RequireScopes", { enumerable: true, get: function () { return decorators_1.RequireScopes; } });
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
var interfaces_1 = require("./interfaces");
Object.defineProperty(exports, "VALIDATION_TOKEN_DURATIONS", { enumerable: true, get: function () { return interfaces_1.VALIDATION_TOKEN_DURATIONS; } });
Object.defineProperty(exports, "VALIDATION_TOKEN_ATTEMPT_LIMITS", { enumerable: true, get: function () { return interfaces_1.VALIDATION_TOKEN_ATTEMPT_LIMITS; } });
var utils_1 = require("./utils");
Object.defineProperty(exports, "CryptoUtil", { enumerable: true, get: function () { return utils_1.CryptoUtil; } });
Object.defineProperty(exports, "DeviceUtil", { enumerable: true, get: function () { return utils_1.DeviceUtil; } });
Object.defineProperty(exports, "GeolocationUtil", { enumerable: true, get: function () { return utils_1.GeolocationUtil; } });
Object.defineProperty(exports, "TokenUtil", { enumerable: true, get: function () { return utils_1.TokenUtil; } });
Object.defineProperty(exports, "SecurityUtil", { enumerable: true, get: function () { return utils_1.SecurityUtil; } });
Object.defineProperty(exports, "RiskScoringUtil", { enumerable: true, get: function () { return utils_1.RiskScoringUtil; } });
exports.DEFAULT_AUTH_CONFIG = {
    enableMfa: true,
    enableDeviceTrust: true,
    enableRiskScoring: true,
    enableRateLimit: true,
    enablePasswordService: true,
    enablePersistentTokens: true,
    enableValidationTokens: true,
    enableTokenMaintenance: true,
    enableApiKeyAuth: true,
};
//# sourceMappingURL=auth.module.js.map