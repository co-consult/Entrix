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
import { PasswordService } from './services/password.service';
import { MfaService } from './services/mfa.service';
import { SecurityService } from './services/security.service';
import { DeviceService } from './services/device.service';
import { EmailVerificationService } from './services/email-verification.service';

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
 * ✅ CORRIGÉ : Providers et exports cohérents pour éviter UnknownExportException
 * 
 * Architecture complète avec :
 * - JWT avec rotation des refresh tokens
 * - MFA adaptatif selon risk scoring
 * - Device fingerprinting et trusted devices
 * - Rate limiting intelligent
 * - Audit complet et monitoring
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
    PasswordService,
    MfaService,
    SecurityService,
    DeviceService,
    EmailVerificationService,

    // ========================
    // PASSPORT STRATEGIES
    // ========================
    
    JwtStrategy,
    JwtRefreshStrategy,
    LocalStrategy,

    // ========================
    // GUARDS DE SÉCURITÉ
    // ========================
    // ✅ CORRIGÉ : Guards déclarés comme providers simples pour permettre export
    
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
        const { JwtService } = require('@nestjs/jwt');
        return new JwtService(getJwtRefreshConfig(configService));
      },
      inject: [ConfigService],
    },
  ],

  exports: [
    // ========================
    // SERVICES EXPORTÉS
    // ========================
    
    AuthService,
    TokenService,
    SessionService,
    PasswordService,
    MfaService,
    SecurityService,
    DeviceService,
    EmailVerificationService,
    
    // ========================
    // GUARDS EXPORTÉS
    // ========================
    // ✅ CORRIGÉ : Maintenant tous les guards peuvent être exportés car ils sont dans providers
    
    JwtAuthGuard,
    JwtRefreshGuard,
    MfaRequiredGuard,
    DeviceTrustedGuard,
    AccountStatusGuard,
    
    // ========================
    // STRATEGIES EXPORTÉS
    // ========================
    
    JwtStrategy,
    JwtRefreshStrategy,
    LocalStrategy,
    
    // ========================
    // MODULES RÉEXPORTÉS
    // ========================
    
    // Réexport PassportModule pour utilisation dans autres modules
    PassportModule,
    
    // Réexport JwtModule pour utilisation externe si nécessaire
    JwtModule,
  ],
})
export class AuthModule {
  /**
   * Configuration statique du module
   * Méthode appelée lors de l'initialisation
   */
  static forRoot() {
    return {
      module: AuthModule,
      providers: [
        // Providers additionnels pour configuration root
      ],
      exports: [
        AuthService,
        TokenService,
        SessionService,
        JwtAuthGuard,
      ],
    };
  }

  /**
   * Configuration asynchrone avec options
   * Pour utilisation dans d'autres modules avec config custom
   */
  static forRootAsync(options: {
    imports?: any[];
    useFactory?: (...args: any[]) => any;
    inject?: any[];
  }) {
    return {
      module: AuthModule,
      imports: options.imports || [],
      providers: [
        {
          provide: 'AUTH_MODULE_OPTIONS',
          useFactory: options.useFactory,
          inject: options.inject || [],
        },
        // Autres providers conditionnels
      ],
      exports: [
        AuthService,
        TokenService,
        SessionService,
        JwtAuthGuard,
      ],
    };
  }

  /**
   * Configuration pour features spécifiques
   * Permet d'activer/désactiver certaines fonctionnalités
   */
  static forFeature(features: {
    enableMfa?: boolean;
    enableDeviceTrust?: boolean;
    enableRiskScoring?: boolean;
    enableRateLimit?: boolean;
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

    return {
      module: AuthModule,
      providers,
      exports: providers,
    };
  }
}

/**
 * Export des types et interfaces pour utilisation externe
 * Permet aux autres modules d'utiliser les types auth sans importer le module complet
 */
export {
  // Interfaces principales
  IAuthService,
  IUserProfile,
  ILoginResult,
  IRegisterResult,
  ITokenPair,
  ISessionInfo,
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
 * Utilisée si aucune configuration spécifique fournie
 */
export const DEFAULT_AUTH_CONFIG = {
  // JWT
  jwtSecret: process.env.JWT_SECRET || 'default-secret-change-in-production',
  jwtExpiresIn: '15m',
  jwtRefreshExpiresIn: '7d',
  
  // Sessions
  sessionDuration: 24 * 60 * 60, // 24 heures
  maxConcurrentSessions: 10,
  
  // MFA
  mfaEnabled: true,
  mfaRequiredForOrganizers: true,
  
  // Sécurité
  riskScoringEnabled: true,
  deviceTrustEnabled: true,
  
  // Rate Limiting
  rateLimitingEnabled: true,
  loginAttemptsLimit: 5,
  loginAttemptsWindow: 15 * 60, // 15 minutes
  
  // Email
  emailVerificationRequired: false,
  
  // Audit
  auditEnabled: true,
  auditRetentionDays: 90,
};

/**
 * Helper pour validation configuration
 */
export function validateAuthConfig(config: any): boolean {
  const requiredFields = [
    'jwtSecret',
    'jwtExpiresIn',
    'jwtRefreshExpiresIn',
  ];

  return requiredFields.every(field => config[field]);
}

/**
 * Factory pour création module Auth avec configuration validée
 */
export function createAuthModule(config?: Partial<typeof DEFAULT_AUTH_CONFIG>) {
  const finalConfig = { ...DEFAULT_AUTH_CONFIG, ...config };
  
  if (!validateAuthConfig(finalConfig)) {
    throw new Error('Configuration Auth invalide - vérifiez les champs obligatoires');
  }

  return AuthModule.forRootAsync({
    imports: [ConfigModule],
    useFactory: () => finalConfig,
    inject: [ConfigService],
  });
}