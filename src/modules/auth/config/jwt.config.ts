// src/modules/auth/config/jwt.config.ts

import { ConfigService } from '@nestjs/config';
import { JwtModuleOptions } from '@nestjs/jwt';
/**
 * Configuration JWT pour Entrix V3.0
 * Respecte shared-usage-guide.md et standards sécurité
 * 🔧 CORRIGÉ : Suppression de expiresIn car géré via payload dans TokenService
 */

export const getJwtConfig = (configService: ConfigService): JwtModuleOptions => ({
  secret: configService.get<string>('JWT_SECRET'),
  signOptions: {
    // expiresIn: configService.get<string>('JWT_EXPIRES_IN', '15m'), // ❌ SUPPRIMÉ - géré par payload
    // issuer: 'entrix-v3',      // ❌ SUPPRIMÉ - géré par payload
    // audience: 'entrix-users', // ❌ SUPPRIMÉ - géré par payload
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
    // expiresIn: configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d'), // ❌ SUPPRIMÉ - géré par payload
    // issuer: 'entrix-v3',         // ❌ SUPPRIMÉ - géré par payload
    // audience: 'entrix-refresh',  // ❌ SUPPRIMÉ - géré par payload
  },
  verifyOptions: {
    issuer: 'entrix-v3',
    audience: 'entrix-refresh',
    clockTolerance: 60, // 1 minute de tolérance pour refresh
  },
});