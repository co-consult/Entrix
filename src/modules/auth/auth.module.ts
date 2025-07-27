// src/modules/auth/auth.module.ts

import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';

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

// Controllers
import { AuthController } from './controllers/auth.controller';
import { SessionController } from './controllers/session.controller';
import { PasswordController } from './controllers/password.controller';
import { MfaController } from './controllers/mfa.controller';
import { SecurityController } from './controllers/security.controller';

// Services
import { AuthService } from './services/auth.service';
import { TokenService } from './services/token.service';
import { SessionService } from './services/session.service';
import { PasswordService } from './services/password.service'; // ✅ NOUVEAU : Service centralisé
import { MfaService } from './services/mfa.service';
import { SecurityService } from './services/security.service';
import { DeviceService } from './services/device.service';
import { EmailVerificationService } from './services/email-verification.service';

import { TrustedDevicesService } from './services/trusted-devices.service';
import { RiskAssessmentService } from './services/risk-assessment.service';


// Strategies
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { LocalStrategy } from './strategies/local.strategy';

// Guards
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { MfaRequiredGuard } from './guards/mfa-required.guard';
import { DeviceTrustedGuard } from './guards/device-trusted.guard';
import { AccountStatusGuard } from './guards/account-status.guard';

/**
 * Module Authentification Entrix V3.0 - Grade A+
 * ✅ AMÉLIORÉ : Ajout PasswordService centralisé
 * 
 * Architecture complète avec :
 * - JWT avec rotation des refresh tokens
 * - MFA adaptatif selon risk scoring
 * - Device fingerprinting et trusted devices
 * - Rate limiting intelligent
 * - Audit complet et monitoring
 * - Gestion intelligente des sessions
 * - Service centralisé pour mots de passe (résout double hashage)
 * - Intégration services partagés grade A+
 */

@Module({
  imports: [
    // Configuration globale
    ConfigModule,
    
    // Services partagés Entrix (Prisma, Redis, BullMQ, Email, Logger)
    SharedModule,
    
    // Module Users avec forwardRef pour éviter dépendance circulaire
    forwardRef(() => UsersModule),
    
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
    AuthController,         // /auth/login, /auth/register, /auth/logout
    SessionController,      // /auth/sessions, /auth/refresh
    PasswordController,     // /auth/forgot-password, /auth/reset-password, /auth/change-password
    MfaController,          // /auth/mfa/setup, /auth/mfa/verify, /auth/mfa/disable
    SecurityController,     // /auth/security-events, /auth/trusted-devices, /auth/risk-assessment
  ],

  providers: [
    // ========================
    // SERVICES CORE
    // ========================
    
    AuthService,
    TokenService,
    SessionService,
    PasswordService,        // ✅ NOUVEAU : Service centralisé pour mots de passe
    MfaService,
    SecurityService,
    DeviceService,
    EmailVerificationService,
    TrustedDevicesService,  // ← Requis par MfaRequiredGuard
    RiskAssessmentService,  // ← Requis par MfaRequiredGuard

    // ========================
    // PASSPORT STRATEGIES
    // ========================
    
    JwtStrategy,
    JwtRefreshStrategy,
    LocalStrategy,

    // ========================
    // GUARDS DE SÉCURITÉ
    // ========================
    
    JwtAuthGuard,
    JwtRefreshGuard,
    MfaRequiredGuard,
    DeviceTrustedGuard,
    AccountStatusGuard,

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
    TokenService,
    SessionService,
    PasswordService,        // ✅ NOUVEAU : Export du service centralisé
    SecurityService,
    EmailVerificationService,

    TrustedDevicesService,  // Pour usage externe
    RiskAssessmentService,  // Pour usage externe
    
    // Guards pour utilisation dans autres modules
    JwtAuthGuard,
    JwtRefreshGuard,
    MfaRequiredGuard,
    DeviceTrustedGuard,
    AccountStatusGuard,
    
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
   * ✅ NOUVEAU : Configuration dynamique du module avec features optionnelles
   * Permet de configurer les fonctionnalités selon l'environnement
   */
  static withFeatures(features: {
    enableMfa?: boolean;
    enableDeviceTrust?: boolean;
    enableRiskScoring?: boolean;
    enableRateLimit?: boolean;
    enablePasswordService?: boolean; // ✅ NOUVEAU
  }) {
    const providers = [];

    // Ajout conditionnel des providers selon features
    if (features.enableMfa !== false) {
      providers.push(MfaService, MfaRequiredGuard);
    }

    if (features.enableDeviceTrust !== false) {
      providers.push(DeviceService, DeviceTrustedGuard);
    }

    if (features.enableRiskScoring !== false) {
      providers.push(SecurityService);
    }

    if (features.enablePasswordService !== false) {
      providers.push(PasswordService); // ✅ NOUVEAU
    }

    return {
      module: AuthModule,
      providers,
      exports: providers,
    };
  }
}

/**
 * Export des types et interfaces pour utilisation externe
 */
export {
  // Interfaces principales
  IAuthService,
  IUserProfile,
  ILoginResult,
  IRegisterResult,
  ITokenPair,
  ISessionInfo,
  ISessionLoginResult, // ✅ NOUVEAU
  JwtPayload,
  JwtRefreshPayload,
} from './interfaces';

export {
  // DTOs pour validation
  LoginDto,
  RegisterDto,
  RefreshTokenDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  ChangePasswordDto,
  MfaSetupDto,
  MfaVerifyDto,
} from './dto';

export {
  // Decorators utiles
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
} from './decorators';

export {
  // Exceptions pour gestion d'erreurs
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
  // Constants pour configuration
  AUTH_CONSTANTS,
  SESSION_CONSTANTS,
  MFA_CONSTANTS,
  SECURITY_CONSTANTS,
  ERROR_CONSTANTS,
} from './constants';

export {
  // Utils pour usage externe
  CryptoUtil,
  DeviceUtil,
  GeolocationUtil,
  TokenUtil,
  SecurityUtil,
  RiskScoringUtil,
} from './utils';

/**
 * Configuration par défaut du module Auth
 */
export const DEFAULT_AUTH_CONFIG = {
  enableMfa: true,
  enableDeviceTrust: true,
  enableRiskScoring: true,
  enableRateLimit: true,
  enablePasswordService: true, // ✅ NOUVEAU
};