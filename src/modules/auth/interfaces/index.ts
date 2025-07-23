// src/modules/auth/interfaces/index.ts

/**
 * Index des interfaces Auth Entrix V3.0
 * Export centralisé pour imports simplifiés
 * 
 * Usage:
 * import { IAuthService, IUserProfile, JwtPayload } from '../interfaces';
 */

// Interfaces d'authentification
export * from './auth.interfaces';

// Interfaces de session
export * from './session.interface';

// Interfaces de tokens JWT
export * from './token.interface';

// Interfaces Multi-Factor Authentication
export * from './mfa.interface';

// Interfaces de sécurité et risk scoring
export * from './security.interface';

// Interfaces de gestion des mots de passe
export * from './password.interface';

// Interfaces utilisateur
export * from './user.interface';