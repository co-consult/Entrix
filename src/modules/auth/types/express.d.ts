// src/types/express.d.ts

import { IUserProfile } from '../modules/auth/interfaces/user.interface';

/**
 * Extension globale de Express Request pour TypeScript
 * Ajoute les propriétés ajoutées par l'authentification Entrix V3.0
 */
declare global {
  namespace Express {
    interface Request {
      user?: IUserProfile;
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
  }
}

export {};