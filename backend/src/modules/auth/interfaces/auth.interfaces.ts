// src/modules/auth/interfaces/auth.interfaces.ts

import { MfaProvider } from '../constants/auth.constants';
import { IUserProfile, ILoginRequest, IRegisterRequest } from './user.interface';
import { ISessionInfo, ITokenPair, SessionType } from './session.interface'; // ✅ IMPORT SessionType
import { IMfaChallenge } from './mfa.interface';

/**
 * Interfaces d'authentification Entrix V3.0
 * ✅ CORRIGÉ : Types sessionType strictement typés
 * Respecte schema.prisma et api_specs_auth_session.md
 */

// Interface JWT Payload selon spécifications
export interface JwtPayload {
  sub: string; // user_id
  email: string;
  iat: number; // issued at
  exp: number; // expiration
  aud: string; // audience
  iss: string; // issuer
  sessionId: string;
  deviceFingerprint?: string;
  roles?: string[];
  permissions?: string[];
}

// Interface JWT Refresh Payload
export interface JwtRefreshPayload {
  sub: string; // user_id
  sessionId: string;
  tokenId: string; // pour rotation
  iat: number;
  exp: number;
  aud: string;
  iss: string;
}

// Interface résultat login selon api_specs_auth_session.md
// ✅ CORRIGÉ : sessionType strictement typé
export interface ILoginResult {
  success: boolean;
  user?: IUserProfile;
  tokens?: ITokenPair;
  session?: ISessionInfo;
  mfaRequired?: IMfaChallenge;
  meta?: {
    riskScore: number;
    requiresMfa: boolean;
    ipGeolocation: string;
    sessionType?: SessionType; // ✅ CORRIGÉ : Type strict importé
    wasSessionReused?: boolean;
    tokensReused?: boolean;
  };
}

// Interface register result
// ✅ CORRIGÉ : Utilise IUserProfile harmonisé + session automatique
export interface IRegisterResult {
  success: boolean;
  user?: IUserProfile;
  tokens?: ITokenPair;
  session?: any; // Session info si créée automatiquement
  verification?: {
    emailSent: boolean;
    verificationRequired: boolean;
    tokenId: string;
  };
  onboarding?: {
    incentiveApplied: boolean;
    incentiveType: string;
    incentiveValue: number;
    migratedTickets: number;
  };
  message?: string;
}

export interface IVerificationStatus {
  emailVerified: boolean;
  verifiedAt?: string;
  canResend: boolean;
}

// Interface service d'authentification
// ✅ CORRIGÉ : Toutes les méthodes utilisent interfaces harmonisées
export interface IAuthService {
  login(loginData: ILoginRequest, context?: {
    ipAddress: string;
    userAgent: string;
    deviceFingerprint?: string;
  }): Promise<ILoginResult>;
  
  register(registerData: IRegisterRequest, clientInfo?: {
    ip: string;
    userAgent: string;
  }): Promise<IRegisterResult>;
  
  logout(sessionId: string, allDevices?: boolean): Promise<boolean>;
  
  validateUser(
    email: string, 
    password: string, 
    context?: {
      ipAddress?: string;
      userAgent?: string;
      deviceFingerprint?: string;
    }
  ): Promise<IUserProfile | null>;
  
  verifyMfa(
    challengeToken: string, 
    code: string, 
    method: MfaProvider
  ): Promise<ILoginResult>;

  verifyEmail(token: string): Promise<{
    success: boolean;
    verified: boolean;
    message: string;
    userId?: string;
  }>;

  resendVerificationEmail(userId: string): Promise<{
    success: boolean;
    message: string;
    tokenId?: string;
  }>;

  getVerificationStatus(userId: string): Promise<{
    emailVerified: boolean;
    verifiedAt?: string;
    canResend: boolean;
  }>;

  refreshTokens(refreshToken: string): Promise<ITokenPair>;
}