// src/modules/auth/interfaces/authenticated-request.interface.ts

import { Request } from 'express';
import { IUserProfile } from './user.interface';

/**
 * Interface pour les requêtes authentifiées Entrix V3.0
 * Étend Request d'Express avec les propriétés ajoutées par l'authentification
 */
export interface AuthenticatedRequest extends Request {
  user: IUserProfile;
  mfaContext?: {
    hasMfaConfigured: boolean;
    configuredMethods: string[];
    isDeviceTrusted: boolean;
    trustedDevicesCount: number;
    deviceFingerprint?: string;
    ipAddress?: string;
    userAgent?: string;
  };
  sessionId?: string;
  deviceFingerprint?: string;
}

/**
 * Interface pour les requêtes avec utilisateur optionnel
 */
export interface OptionalAuthRequest extends Request {
  user?: IUserProfile;
}

/**
 * Type guard pour vérifier si une requête est authentifiée
 */
export function isAuthenticatedRequest(req: Request): req is AuthenticatedRequest {
  return req.user !== undefined;
}