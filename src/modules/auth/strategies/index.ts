
// src/modules/auth/strategies/index.ts

/**
 * Index des strategies Auth Entrix V3.0
 * Export centralisé pour imports simplifiés
 * 
 * Usage:
 * import { JwtStrategy, LocalStrategy } from '../strategies';
 */

// ========================
// STRATEGIES JWT
// ========================
export * from './jwt.strategy';
export * from './jwt-refresh.strategy';

// ========================
// STRATEGIES LOCALES
// ========================
export * from './local.strategy';