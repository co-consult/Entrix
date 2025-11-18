// src/modules/auth/auth.module.ts

import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';

// Services partagés Entrix V3.0
import { SharedModule } from '../../shared/shared.module';

// Modules externes
import { UsersModule } from '../users/users.module';

// Configuration
import { getJwtConfig, getJwtRefreshConfig } from './config/jwt.config';
import { getSessionConfig } from './config/session.config';
import { getMfaConfig } from './config/mfa.config';
import { getSecurityConfig } from './config/security.config';
import { getRateLimitConfig } from './config/rate-limit.config';

// Controllers existants
import { AuthController } from './controllers/auth.controller';
import { SessionController } from './controllers/session.controller';
import { PasswordController } from './controllers/password.controller';
import { MfaController } from './controllers/mfa.controller';
import { SecurityController } from './controllers/security.controller';

// ✅ NOUVEAUX CONTROLLERS
import { PersistentTokenController } from './controllers/persistent-token.controller';
import { ValidationTokenController } from './controllers/validation-token.controller';
import { MobileAuthController } from './controllers/mobile-auth.controller';

// Services existants
import { AuthService } from './services/auth.service';
import { TokenService } from './services/token.service'; // ✅ REFACTORISÉ
import { SessionService } from './services/session.service';
import { PasswordService } from './services/password.service';
import { MfaService } from './services/mfa.service';
import { SecurityService } from './services/security.service';
import { DeviceService } from './services/device.service';
import { EmailVerificationService } from './services/email-verification.service';
import { TrustedDevicesService } from './services/trusted-devices.service';
import { RiskAssessmentService } from './services/risk-assessment.service';

// ✅ NOUVEAUX SERVICES
import { PersistentTokenService } from './services/persistent-token.service';
import { ValidationTokenService } from './services/validation-token.service';
import { TokenMaintenanceService } from './services/token-maintenance.service';

// Strategies
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { LocalStrategy } from './strategies/local.strategy';

// Guards existants
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { MfaRequiredGuard } from './guards/mfa-required.guard';
import { DeviceTrustedGuard } from './guards/device-trusted.guard';
import { AccountStatusGuard } from './guards/account-status.guard';

// ✅ NOUVEAUX GUARDS
import { ApiKeyGuard } from './guards/api-key.guard';

/**
 * Module Authentification Entrix V3.0 REFACTORISÉ - Grade A+
 * 
 * ✅ NOUVELLES FONCTIONNALITÉS :
 * - Persistent Tokens (API keys, refresh longue durée, tokens d'intégration)
 * - Validation Tokens (email verification, password reset, invitations, magic links)
 * - Token Maintenance automatique avec cron jobs
 * - API Key authentication avec scopes
 * - Architecture modulaire avec services spécialisés
 * 
 * Architecture complète avec :
 * - JWT avec rotation des refresh tokens (existant)
 * - MFA adaptatif selon risk scoring (existant)
 * - Device fingerprinting et trusted devices (existant)
 * - Rate limiting intelligent (existant)
 * - Audit complet et monitoring (existant)
 * - Gestion intelligente des sessions (existant)
 * - Service centralisé pour mots de passe (existant)
 * - ✅ NOUVEAU : Gestion centralisée des tokens persistants
 * - ✅ NOUVEAU : Gestion centralisée des tokens de validation
 * - ✅ NOUVEAU : Maintenance automatique des tokens
 * - ✅ NOUVEAU : Authentication par API key
 */

@Module({
  imports: [
    // Configuration globale
    ConfigModule,
    
    // Services partagés Entrix (Prisma, Redis, BullMQ, Email, Logger)
    SharedModule,
    
    // Module Users avec forwardRef pour éviter dépendance circulaire
    forwardRef(() => UsersModule),
    
    // ✅ NOUVEAU : Module Schedule pour les tâches CRON de maintenance
    ScheduleModule.forRoot(),
    
    // Configuration Passport
    PassportModule.register({
      defaultStrategy: 'jwt',
      property: 'user',
      session: false, // Stateless JWT
    }),
    
    // Configuration JWT principale (Access Tokens)
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: getJwtConfig,
      inject: [ConfigService],
    }),
  ],

  controllers: [
    // Controllers existants
    AuthController,         // /auth/login, /auth/register, /auth/logout
    SessionController,      // /auth/sessions, /auth/refresh
    PasswordController,     // /auth/forgot-password, /auth/reset-password, /auth/change-password
    MfaController,          // /auth/mfa/setup, /auth/mfa/verify, /auth/mfa/disable
    SecurityController,     // /auth/security-events, /auth/trusted-devices, /auth/risk-assessment
    
    // ✅ NOUVEAUX CONTROLLERS
    PersistentTokenController,    // /auth/tokens - Gestion API keys et tokens persistants
    ValidationTokenController,    // /auth/validation - Gestion tokens de validation
    MobileAuthController,         // /mobile/auth - Endpoints optimisés pour mobile
  ],

  providers: [
    // ========================
    // SERVICES CORE EXISTANTS
    // ========================
    
    AuthService,
    TokenService,                 // ✅ REFACTORISÉ : Orchestre les nouveaux services
    SessionService,
    PasswordService,
    MfaService,
    SecurityService,
    DeviceService,
    EmailVerificationService,
    TrustedDevicesService,
    RiskAssessmentService,

    // ========================
    // ✅ NOUVEAUX SERVICES TOKENS
    // ========================
    
    PersistentTokenService,       // Service des tokens persistants (API keys, etc.)
    ValidationTokenService,       // Service des tokens de validation (email, reset, etc.)
    TokenMaintenanceService,      // Service de maintenance automatique des tokens

    // ========================
    // PASSPORT STRATEGIES
    // ========================
    
    JwtStrategy,
    JwtRefreshStrategy,
    LocalStrategy,

    // ========================
    // GUARDS DE SÉCURITÉ
    // ========================
    
    // Guards existants
    JwtAuthGuard,
    JwtRefreshGuard,
    MfaRequiredGuard,
    DeviceTrustedGuard,
    AccountStatusGuard,

    // ✅ NOUVEAUX GUARDS
    ApiKeyGuard,                  // Guard pour authentication par API key

    // ========================
    // CONFIGURATIONS
    // ========================
    
    // Configuration JWT
    {
      provide: 'JWT_CONFIG',
      useFactory: getJwtConfig,
      inject: [ConfigService],
    },
    
    // Configuration JWT Refresh
    {
      provide: 'JWT_REFRESH_CONFIG',
      useFactory: getJwtRefreshConfig,
      inject: [ConfigService],
    },
    
    // Configuration sessions
    {
      provide: 'SESSION_CONFIG',
      useFactory: getSessionConfig,
      inject: [ConfigService],
    },
    
    // Configuration MFA
    {
      provide: 'MFA_CONFIG',
      useFactory: getMfaConfig,
      inject: [ConfigService],
    },
    
    // Configuration sécurité
    {
      provide: 'SECURITY_CONFIG',
      useFactory: getSecurityConfig,
      inject: [ConfigService],
    },
    
    // Configuration rate limiting
    {
      provide: 'RATE_LIMIT_CONFIG',
      useFactory: getRateLimitConfig,
      inject: [ConfigService],
    },

    // ========================
    // PROVIDERS UTILITAIRES
    // ========================
    
    // JWT Service additionnel pour refresh tokens
    {
      provide: 'JWT_REFRESH_SERVICE',
      useFactory: (configService: ConfigService) => {
        return JwtModule.registerAsync({
          useFactory: getJwtRefreshConfig,
          inject: [ConfigService],
        });
      },
      inject: [ConfigService],
    },
  ],

  exports: [
    // Services principaux pour utilisation externe
    AuthService,
    TokenService,                 // ✅ REFACTORISÉ
    SessionService,
    PasswordService,
    SecurityService,
    EmailVerificationService,
    TrustedDevicesService,
    RiskAssessmentService,
    
    // ✅ NOUVEAUX SERVICES EXPORTÉS
    PersistentTokenService,       // Pour usage dans autres modules
    ValidationTokenService,       // Pour usage dans autres modules
    TokenMaintenanceService,      // Pour administration/monitoring
    
    // Guards pour utilisation dans autres modules
    JwtAuthGuard,
    JwtRefreshGuard,
    MfaRequiredGuard,
    DeviceTrustedGuard,
    AccountStatusGuard,
    
    // ✅ NOUVEAUX GUARDS EXPORTÉS
    ApiKeyGuard,                  // Pour authentication API dans autres modules
    
    // Strategies pour configuration avancée
    JwtStrategy,
    JwtRefreshStrategy,
    
    // Configuration pour modules externes
    'JWT_CONFIG',
    'SESSION_CONFIG',
    'SECURITY_CONFIG',
  ],
})
export class AuthModule {
  /**
   * ✅ AMÉLIORÉ : Configuration dynamique du module avec features optionnelles
   * Permet de configurer les fonctionnalités selon l'environnement
   */
  static withFeatures(features: {
    enableMfa?: boolean;
    enableDeviceTrust?: boolean;
    enableRiskScoring?: boolean;
    enableRateLimit?: boolean;
    enablePasswordService?: boolean;
    enablePersistentTokens?: boolean;        // ✅ NOUVEAU
    enableValidationTokens?: boolean;        // ✅ NOUVEAU
    enableTokenMaintenance?: boolean;        // ✅ NOUVEAU
    enableApiKeyAuth?: boolean;              // ✅ NOUVEAU
  }) {
    const providers = [];
    const controllers = [];
    const exports = [];

    // Ajout conditionnel des providers selon features
    if (features.enableMfa !== false) {
      providers.push(MfaService, MfaRequiredGuard);
      controllers.push(MfaController);
    }

    if (features.enableDeviceTrust !== false) {
      providers.push(DeviceService, DeviceTrustedGuard);
    }

    if (features.enableRiskScoring !== false) {
      providers.push(SecurityService);
      controllers.push(SecurityController);
    }

    if (features.enablePasswordService !== false) {
      providers.push(PasswordService);
      controllers.push(PasswordController);
    }

    // ✅ NOUVELLES FEATURES
    if (features.enablePersistentTokens !== false) {
      providers.push(PersistentTokenService);
      controllers.push(PersistentTokenController);
      exports.push(PersistentTokenService);
    }

    if (features.enableValidationTokens !== false) {
      providers.push(ValidationTokenService);
      controllers.push(ValidationTokenController);
      exports.push(ValidationTokenService);
    }

    if (features.enableTokenMaintenance !== false) {
      providers.push(TokenMaintenanceService);
      exports.push(TokenMaintenanceService);
    }

    if (features.enableApiKeyAuth !== false) {
      providers.push(ApiKeyGuard);
      exports.push(ApiKeyGuard);
    }

    return {
      module: AuthModule,
      providers,
      controllers,
      exports,
    };
  }
}

/**
 * Export des types et interfaces pour utilisation externe
 */
export {
  // Interfaces principales existantes
  IAuthService,
  IUserProfile,
  ILoginResult,
  IRegisterResult,
  ITokenPair,
  ISessionInfo,
  ISessionLoginResult,
  JwtPayload,
  JwtRefreshPayload,
  
  // ✅ NOUVELLES INTERFACES EXPORTÉES
  IPersistentToken,
  IPersistentTokenService,
  IPersistentTokenValidation,
  IValidationToken,
  IValidationTokenService,
  IValidationTokenValidation,
} from './interfaces';

export {
  // DTOs pour validation existants
  LoginDto,
  RegisterDto,
  RefreshTokenDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  ChangePasswordDto,
  MfaSetupDto,
  MfaVerifyDto,
  
  // ✅ NOUVEAUX DTOS EXPORTÉS
  CreatePersistentTokenDto,
  GenerateApiKeyDto,
  PersistentTokenResponseDto,
  CreateEmailVerificationDto,
  CreatePasswordResetDto,
  CreateInvitationDto,
  ValidationTokenResponseDto,
} from './dto';

export {
  // Decorators utiles existants
  CurrentUser,
  CurrentUserId,
  CurrentSession,
  SessionId,
  Public,
  RequireMfa,
  RequireTrustedDevice,
  AuditLog,
  RateLimit,
  Roles,
  Permissions,
  
  // ✅ NOUVEAUX DECORATORS EXPORTÉS
  RequireScopes,              // Pour spécifier les scopes requis pour API keys
} from './decorators';

export {
  // Exceptions pour gestion d'erreurs existantes
  InvalidCredentialsException,
  AccountLockedException,
  EmailNotVerifiedException,
  MfaRequiredException,
  InvalidMfaCodeException,
  DeviceNotTrustedException,
  SessionExpiredException,
  InvalidRefreshTokenException,
  SuspiciousActivityException,
} from './exceptions';

export {
  // Constants pour configuration existantes
  AUTH_CONSTANTS,
  SESSION_CONSTANTS,
  MFA_CONSTANTS,
  SECURITY_CONSTANTS,
  ERROR_CONSTANTS,
} from './constants';

export {
  // ✅ NOUVELLES CONSTANTES EXPORTÉES
  VALIDATION_TOKEN_DURATIONS,
  VALIDATION_TOKEN_ATTEMPT_LIMITS,
} from './interfaces';

export {
  // Utils pour usage externe existants
  CryptoUtil,
  DeviceUtil,
  GeolocationUtil,
  TokenUtil,
  SecurityUtil,
  RiskScoringUtil,
} from './utils';

/**
 * Configuration par défaut du module Auth
 * ✅ AMÉLIORÉE avec nouvelles features
 */
export const DEFAULT_AUTH_CONFIG = {
  enableMfa: true,
  enableDeviceTrust: true,
  enableRiskScoring: true,
  enableRateLimit: true,
  enablePasswordService: true,
  enablePersistentTokens: true,        // ✅ NOUVEAU
  enableValidationTokens: true,        // ✅ NOUVEAU
  enableTokenMaintenance: true,        // ✅ NOUVEAU
  enableApiKeyAuth: true,              // ✅ NOUVEAU
};