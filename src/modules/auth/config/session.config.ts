// src/modules/auth/config/session.config.ts

import { ConfigService } from '@nestjs/config';
import { SESSION_CONSTANTS } from '../constants/session.constants';

/**
 * Configuration des sessions Entrix V3.0
 * Respecte schema.prisma user_sessions
 */

export interface SessionConfig {
  defaultDuration: number;
  rememberMeDuration: number;
  idleTimeout: number;
  maxConcurrentSessions: number;
  cleanupInterval: number;
  redis: {
    keyPrefix: string;
    ttl: number;
  };
}

export const getSessionConfig = (configService: ConfigService): SessionConfig => ({
  defaultDuration: configService.get<number>('SESSION_DURATION', SESSION_CONSTANTS.DURATION.DEFAULT_SESSION),
  rememberMeDuration: configService.get<number>('SESSION_REMEMBER_DURATION', SESSION_CONSTANTS.DURATION.REMEMBER_ME_SESSION),
  idleTimeout: configService.get<number>('SESSION_IDLE_TIMEOUT', SESSION_CONSTANTS.DURATION.IDLE_TIMEOUT),
  maxConcurrentSessions: configService.get<number>('MAX_CONCURRENT_SESSIONS', SESSION_CONSTANTS.LIMITS.MAX_CONCURRENT_SESSIONS),
  cleanupInterval: configService.get<number>('SESSION_CLEANUP_INTERVAL', SESSION_CONSTANTS.DURATION.CLEANUP_INTERVAL),
  redis: {
    keyPrefix: SESSION_CONSTANTS.REDIS_KEYS.SESSION_PREFIX,
    ttl: configService.get<number>('SESSION_REDIS_TTL', SESSION_CONSTANTS.DURATION.DEFAULT_SESSION),
  },
});