// src/modules/auth/exceptions/index.ts

/**
 * Index des exceptions Auth Entrix V3.0
 * Export centralisé pour imports simplifiés
 * 
 * Usage:
 * import { InvalidCredentialsException, RateLimitedException } from '../exceptions';
 */

// ========================
// EXCEPTIONS AUTHENTIFICATION
// ========================
export * from './auth.exceptions';

// ========================
// EXCEPTIONS SESSION
// ========================
export * from './session.exceptions';

// ========================
// EXCEPTIONS MFA
// ========================
export * from './mfa.exceptions';

// ========================
// EXCEPTIONS SÉCURITÉ
// ========================
export * from './security.exceptions';

// ========================
// EXCEPTION UTILITAIRE
// ========================
export * from './too-many-requests.exception';

export * from './rate-limit.exceptions';