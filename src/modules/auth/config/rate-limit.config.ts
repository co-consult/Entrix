// src/modules/auth/config/rate-limit.config.ts

import { ConfigService } from '@nestjs/config';
import { SECURITY_CONSTANTS } from '../constants/security.constants';

/**
 * Configuration Rate Limiting Entrix V3.0
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
}

export const getRateLimitConfig = (configService: ConfigService): RateLimitConfig => ({
  login: {
    windowMs: configService.get<number>('RATE_LIMIT_LOGIN_WINDOW', SECURITY_CONSTANTS.RATE_LIMITS.LOGIN_ATTEMPTS.WINDOW_MS),
    maxAttempts: configService.get<number>('RATE_LIMIT_LOGIN_MAX', SECURITY_CONSTANTS.RATE_LIMITS.LOGIN_ATTEMPTS.MAX_ATTEMPTS),
    blockDuration: configService.get<number>('RATE_LIMIT_LOGIN_BLOCK', SECURITY_CONSTANTS.RATE_LIMITS.LOGIN_ATTEMPTS.BLOCK_DURATION),
  },
  passwordReset: {
    windowMs: configService.get<number>('RATE_LIMIT_RESET_WINDOW', SECURITY_CONSTANTS.RATE_LIMITS.PASSWORD_RESET.WINDOW_MS),
    maxAttempts: configService.get<number>('RATE_LIMIT_RESET_MAX', SECURITY_CONSTANTS.RATE_LIMITS.PASSWORD_RESET.MAX_ATTEMPTS),
    blockDuration: configService.get<number>('RATE_LIMIT_RESET_BLOCK', SECURITY_CONSTANTS.RATE_LIMITS.PASSWORD_RESET.BLOCK_DURATION),
  },
  mfaVerify: {
    windowMs: configService.get<number>('RATE_LIMIT_MFA_WINDOW', SECURITY_CONSTANTS.RATE_LIMITS.MFA_VERIFY.WINDOW_MS),
    maxAttempts: configService.get<number>('RATE_LIMIT_MFA_MAX', SECURITY_CONSTANTS.RATE_LIMITS.MFA_VERIFY.MAX_ATTEMPTS),
    blockDuration: configService.get<number>('RATE_LIMIT_MFA_BLOCK', SECURITY_CONSTANTS.RATE_LIMITS.MFA_VERIFY.BLOCK_DURATION),
  },
  registration: {
    windowMs: configService.get<number>('RATE_LIMIT_REGISTER_WINDOW', SECURITY_CONSTANTS.RATE_LIMITS.REGISTRATION.WINDOW_MS),
    maxAttempts: configService.get<number>('RATE_LIMIT_REGISTER_MAX', SECURITY_CONSTANTS.RATE_LIMITS.REGISTRATION.MAX_ATTEMPTS),
    blockDuration: configService.get<number>('RATE_LIMIT_REGISTER_BLOCK', SECURITY_CONSTANTS.RATE_LIMITS.REGISTRATION.BLOCK_DURATION),
  },
});