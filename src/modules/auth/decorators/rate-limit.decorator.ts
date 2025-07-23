// src/modules/auth/decorators/rate-limit.decorator.ts

import { SetMetadata } from '@nestjs/common';

/**
 * Decorators rate limiting Entrix V3.0
 * Protection contre abus et brute force
 */

// Clé metadata pour rate limiting
export const RATE_LIMIT_KEY = 'rateLimit';

// Interface configuration rate limit
export interface RateLimitConfig {
  limit: number;
  windowMs: number;
  keyGenerator?: string; // 'ip' | 'user' | 'session'
  skipSuccessful?: boolean;
  skipFailed?: boolean;
  blockDuration?: number;
}

/**
 * Decorator @RateLimit() - Configuration rate limiting personnalisée
 * Usage: @RateLimit({ limit: 5, windowMs: 900000 })
 */
export const RateLimit = (config: RateLimitConfig) => SetMetadata(RATE_LIMIT_KEY, config);

/**
 * Decorator @RateLimitStrict() - Rate limiting strict (5/15min)
 * Usage: @RateLimitStrict()
 */
export const RateLimitStrict = () =>
  SetMetadata(RATE_LIMIT_KEY, {
    limit: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
    keyGenerator: 'ip',
    blockDuration: 15 * 60, // 15 minutes
  } as RateLimitConfig);

/**
 * Decorator @RateLimitLogin() - Rate limiting pour login
 * Usage: @RateLimitLogin()
 */
export const RateLimitLogin = () =>
  SetMetadata(RATE_LIMIT_KEY, {
    limit: 5,
    windowMs: 15 * 60 * 1000,
    keyGenerator: 'ip',
    skipSuccessful: true,
    blockDuration: 15 * 60,
  } as RateLimitConfig);

/**
 * Decorator @RateLimitPasswordReset() - Rate limiting reset password
 * Usage: @RateLimitPasswordReset()
 */
export const RateLimitPasswordReset = () =>
  SetMetadata(RATE_LIMIT_KEY, {
    limit: 3,
    windowMs: 60 * 60 * 1000, // 1 heure
    keyGenerator: 'ip',
    blockDuration: 60 * 60, // 1 heure
  } as RateLimitConfig);

/**
 * Decorator @RateLimitMfa() - Rate limiting MFA
 * Usage: @RateLimitMfa()
 */
export const RateLimitMfa = () =>
  SetMetadata(RATE_LIMIT_KEY, {
    limit: 5,
    windowMs: 5 * 60 * 1000, // 5 minutes
    keyGenerator: 'user',
    skipSuccessful: true,
    blockDuration: 5 * 60, // 5 minutes
  } as RateLimitConfig);