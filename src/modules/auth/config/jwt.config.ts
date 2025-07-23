// src/modules/auth/config/jwt.config.ts

import { ConfigService } from '@nestjs/config';
import { JwtModuleOptions } from '@nestjs/jwt';
import { AUTH_CONSTANTS } from '../constants/auth.constants';

/**
 * Configuration JWT pour Entrix V3.0
 * Respecte shared-usage-guide.md et standards sécurité
 */

export const getJwtConfig = (configService: ConfigService): JwtModuleOptions => ({
  secret: configService.get<string>('JWT_SECRET'),
  signOptions: {
    expiresIn: configService.get<string>('JWT_EXPIRES_IN', '15m'),
    issuer: 'entrix-v3',
    audience: 'entrix-users',
  },
  verifyOptions: {
    issuer: 'entrix-v3',
    audience: 'entrix-users',
    clockTolerance: 30, // 30 secondes de tolérance
  },
});

export const getJwtRefreshConfig = (configService: ConfigService): JwtModuleOptions => ({
  secret: configService.get<string>('JWT_REFRESH_SECRET', configService.get<string>('JWT_SECRET')),
  signOptions: {
    expiresIn: configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d'),
    issuer: 'entrix-v3',
    audience: 'entrix-refresh',
  },
  verifyOptions: {
    issuer: 'entrix-v3',
    audience: 'entrix-refresh',
    clockTolerance: 60, // 1 minute de tolérance pour refresh
  },
});







