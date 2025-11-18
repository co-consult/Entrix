// src/modules/auth/config/rate-limit.config.ts

import { ConfigService } from '@nestjs/config';
import { SECURITY_CONSTANTS } from '../constants/security.constants';

/**
 * Configuration Rate Limiting Entrix V3.0
 * ✅ MISE À JOUR : Utilise les nouvelles constantes SECURITY_CONSTANTS.RATE_LIMITS
 * Respecte shared-usage-guide.md et sécurité
 */

export interface RateLimitConfig {
  login: {
    windowMs: number;
    maxAttempts: number;
    blockDuration: number;
  };
  passwordReset: {
    windowMs: number;
    maxAttempts: number;
    blockDuration: number;
  };
  mfaVerify: {
    windowMs: number;
    maxAttempts: number;
    blockDuration: number;
  };
  registration: {
    windowMs: number;
    maxAttempts: number;
    blockDuration: number;
  };
  emailVerification: {
    windowMs: number;
    maxAttempts: number;
    blockDuration: number;
  };
  validationTokens: {
    windowMs: number;
    maxAttempts: number;
    blockDuration: number;
  };
  apiCalls: {
    windowMs: number;
    maxAttempts: number;
    blockDuration: number;
  };
  apiKeyGeneration: {
    windowMs: number;
    maxAttempts: number;
    blockDuration: number;
  };
  magicLink: {
    windowMs: number;
    maxAttempts: number;
    blockDuration: number;
  };
}

export const getRateLimitConfig = (configService: ConfigService): RateLimitConfig => ({
  // ✅ Connexion - Mise à jour avec nouvelles constantes
  login: {
    windowMs: configService.get<number>('RATE_LIMIT_LOGIN_WINDOW', SECURITY_CONSTANTS.RATE_LIMITS.LOGIN.WINDOW_MS),
    maxAttempts: configService.get<number>('RATE_LIMIT_LOGIN_MAX', SECURITY_CONSTANTS.RATE_LIMITS.LOGIN.MAX_ATTEMPTS),
    blockDuration: configService.get<number>('RATE_LIMIT_LOGIN_BLOCK', SECURITY_CONSTANTS.RATE_LIMITS.LOGIN.BLOCK_DURATION_MS),
  },

  // ✅ Reset password - Mise à jour avec nouvelles constantes
  passwordReset: {
    windowMs: configService.get<number>('RATE_LIMIT_RESET_WINDOW', SECURITY_CONSTANTS.RATE_LIMITS.PASSWORD_RESET.WINDOW_MS),
    maxAttempts: configService.get<number>('RATE_LIMIT_RESET_MAX', SECURITY_CONSTANTS.RATE_LIMITS.PASSWORD_RESET.MAX_ATTEMPTS),
    blockDuration: configService.get<number>('RATE_LIMIT_RESET_BLOCK', SECURITY_CONSTANTS.RATE_LIMITS.PASSWORD_RESET.BLOCK_DURATION_MS),
  },

  // ✅ MFA Verification - Mise à jour avec nouvelles constantes
  mfaVerify: {
    windowMs: configService.get<number>('RATE_LIMIT_MFA_WINDOW', SECURITY_CONSTANTS.RATE_LIMITS.MFA_VERIFICATION.WINDOW_MS),
    maxAttempts: configService.get<number>('RATE_LIMIT_MFA_MAX', SECURITY_CONSTANTS.RATE_LIMITS.MFA_VERIFICATION.MAX_ATTEMPTS),
    blockDuration: configService.get<number>('RATE_LIMIT_MFA_BLOCK', SECURITY_CONSTANTS.RATE_LIMITS.MFA_VERIFICATION.BLOCK_DURATION_MS),
  },

  // ✅ Inscription - Mise à jour avec nouvelles constantes
  registration: {
    windowMs: configService.get<number>('RATE_LIMIT_REGISTER_WINDOW', SECURITY_CONSTANTS.RATE_LIMITS.REGISTRATION.WINDOW_MS),
    maxAttempts: configService.get<number>('RATE_LIMIT_REGISTER_MAX', SECURITY_CONSTANTS.RATE_LIMITS.REGISTRATION.MAX_ATTEMPTS),
    blockDuration: configService.get<number>('RATE_LIMIT_REGISTER_BLOCK', SECURITY_CONSTANTS.RATE_LIMITS.REGISTRATION.BLOCK_DURATION_MS),
  },

  // ✅ NOUVEAU : Email Verification
  emailVerification: {
    windowMs: configService.get<number>('RATE_LIMIT_EMAIL_VERIFY_WINDOW', SECURITY_CONSTANTS.RATE_LIMITS.EMAIL_VERIFICATION.WINDOW_MS),
    maxAttempts: configService.get<number>('RATE_LIMIT_EMAIL_VERIFY_MAX', SECURITY_CONSTANTS.RATE_LIMITS.EMAIL_VERIFICATION.MAX_ATTEMPTS),
    blockDuration: configService.get<number>('RATE_LIMIT_EMAIL_VERIFY_BLOCK', SECURITY_CONSTANTS.RATE_LIMITS.EMAIL_VERIFICATION.BLOCK_DURATION_MS),
  },

  // ✅ NOUVEAU : Validation Tokens (reset, invitations, magic links)
  validationTokens: {
    windowMs: configService.get<number>('RATE_LIMIT_VALIDATION_WINDOW', SECURITY_CONSTANTS.RATE_LIMITS.VALIDATION_TOKENS.WINDOW_MS),
    maxAttempts: configService.get<number>('RATE_LIMIT_VALIDATION_MAX', SECURITY_CONSTANTS.RATE_LIMITS.VALIDATION_TOKENS.MAX_ATTEMPTS),
    blockDuration: configService.get<number>('RATE_LIMIT_VALIDATION_BLOCK', SECURITY_CONSTANTS.RATE_LIMITS.VALIDATION_TOKENS.BLOCK_DURATION_MS),
  },

  // ✅ NOUVEAU : API Calls génériques
  apiCalls: {
    windowMs: configService.get<number>('RATE_LIMIT_API_WINDOW', SECURITY_CONSTANTS.RATE_LIMITS.API_CALLS.WINDOW_MS),
    maxAttempts: configService.get<number>('RATE_LIMIT_API_MAX', SECURITY_CONSTANTS.RATE_LIMITS.API_CALLS.MAX_ATTEMPTS),
    blockDuration: configService.get<number>('RATE_LIMIT_API_BLOCK', SECURITY_CONSTANTS.RATE_LIMITS.API_CALLS.BLOCK_DURATION_MS),
  },

  // ✅ NOUVEAU : API Key Generation
  apiKeyGeneration: {
    windowMs: configService.get<number>('RATE_LIMIT_API_KEY_GEN_WINDOW', SECURITY_CONSTANTS.RATE_LIMITS.API_KEY_GENERATION.WINDOW_MS),
    maxAttempts: configService.get<number>('RATE_LIMIT_API_KEY_GEN_MAX', SECURITY_CONSTANTS.RATE_LIMITS.API_KEY_GENERATION.MAX_ATTEMPTS),
    blockDuration: configService.get<number>('RATE_LIMIT_API_KEY_GEN_BLOCK', SECURITY_CONSTANTS.RATE_LIMITS.API_KEY_GENERATION.BLOCK_DURATION_MS),
  },

  // ✅ NOUVEAU : Magic Links
  magicLink: {
    windowMs: configService.get<number>('RATE_LIMIT_MAGIC_LINK_WINDOW', SECURITY_CONSTANTS.RATE_LIMITS.MAGIC_LINK.WINDOW_MS),
    maxAttempts: configService.get<number>('RATE_LIMIT_MAGIC_LINK_MAX', SECURITY_CONSTANTS.RATE_LIMITS.MAGIC_LINK.MAX_ATTEMPTS),
    blockDuration: configService.get<number>('RATE_LIMIT_MAGIC_LINK_BLOCK', SECURITY_CONSTANTS.RATE_LIMITS.MAGIC_LINK.BLOCK_DURATION_MS),
  },
});

/**
 * ✅ NOUVEAU : Helper pour obtenir la config rate limit par type d'endpoint
 */
export const getRateLimitForEndpoint = (
  endpoint: keyof RateLimitConfig,
  configService: ConfigService
): { windowMs: number; maxAttempts: number; blockDuration: number } => {
  const config = getRateLimitConfig(configService);
  return config[endpoint];
};

/**
 * ✅ NOUVEAU : Types pour les endpoints rate limited
 */
export type RateLimitEndpoint = 
  | 'login'
  | 'passwordReset'
  | 'mfaVerify'
  | 'registration'
  | 'emailVerification'
  | 'validationTokens'
  | 'apiCalls'
  | 'apiKeyGeneration'
  | 'magicLink';

/**
 * ✅ NOUVEAU : Configuration simplifiée pour décorateur @RateLimit
 */
export const RATE_LIMIT_PRESETS = {
  // Authentification critique
  CRITICAL_AUTH: {
    limit: SECURITY_CONSTANTS.RATE_LIMITS.LOGIN.MAX_ATTEMPTS,
    windowMs: SECURITY_CONSTANTS.RATE_LIMITS.LOGIN.WINDOW_MS,
  },

  // Actions sensibles
  SENSITIVE_ACTION: {
    limit: SECURITY_CONSTANTS.RATE_LIMITS.PASSWORD_RESET.MAX_ATTEMPTS,
    windowMs: SECURITY_CONSTANTS.RATE_LIMITS.PASSWORD_RESET.WINDOW_MS,
  },

  // API normale
  NORMAL_API: {
    limit: SECURITY_CONSTANTS.RATE_LIMITS.API_CALLS.MAX_ATTEMPTS,
    windowMs: SECURITY_CONSTANTS.RATE_LIMITS.API_CALLS.WINDOW_MS,
  },

  // Validation de tokens
  TOKEN_VALIDATION: {
    limit: SECURITY_CONSTANTS.RATE_LIMITS.VALIDATION_TOKENS.MAX_ATTEMPTS,
    windowMs: SECURITY_CONSTANTS.RATE_LIMITS.VALIDATION_TOKENS.WINDOW_MS,
  },

  // Génération de clés API
  API_KEY_CREATION: {
    limit: SECURITY_CONSTANTS.RATE_LIMITS.API_KEY_GENERATION.MAX_ATTEMPTS,
    windowMs: SECURITY_CONSTANTS.RATE_LIMITS.API_KEY_GENERATION.WINDOW_MS,
  },
} as const;