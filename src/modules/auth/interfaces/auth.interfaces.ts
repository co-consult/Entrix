// src/modules/auth/interfaces/auth.interfaces.ts

import { MfaProvider } from '../constants/auth.constants';
import { IUserProfile, ILoginRequest, IRegisterRequest } from './user.interface';
import { ISessionInfo, ITokenPair } from './session.interface';
import { IMfaChallenge } from './mfa.interface';

/**
 * Interfaces d'authentification Entrix V3.0
 * ✅ AMÉLIORÉ : Support sessions intelligentes et inscription avec session auto
 * Respecte schema.prisma et api_specs_auth_session.md
 */

// Interface JWT Payload selon spécifications (inchangée)
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

// Interface JWT Refresh Payload (inchangée)
export interface JwtRefreshPayload {
  sub: string; // user_id
  sessionId: string;
  tokenId: string; // pour rotation
  iat: number;
  exp: number;
  aud: string;
  iss: string;
}

// ✅ AMÉLIORÉ : Interface résultat login avec gestion sessions intelligentes
export interface ILoginResult {
  success: boolean;
  user?: IUserProfile;
  tokens?: ITokenPair;
  session?: ISessionInfo; // ✅ Maintenant avec isReused et sessionType
  mfaRequired?: IMfaChallenge;
  meta?: {
    riskScore: number;
    requiresMfa: boolean;
    ipGeolocation: string;
    sessionType?: 'reused' | 'refreshed' | 'new'; // ✅ NOUVEAU : Type de session
    wasSessionReused?: boolean; // ✅ NOUVEAU : Session réutilisée
  };
}

// ✅ AMÉLIORÉ : Interface register result avec session automatique
export interface IRegisterResult {
  success: boolean;
  user?: IUserProfile;
  tokens?: ITokenPair; // ✅ NOUVEAU : Tokens si session auto-créée
  session?: ISessionInfo; // ✅ NOUVEAU : Session si auto-créée
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
  message?: string; // ✅ NOUVEAU : Message informatif
}

// Interface verification status (améliorée)
export interface IVerificationStatus {
  emailVerified: boolean;
  verifiedAt?: string;
  canResend: boolean;
}

// ✅ AMÉLIORÉ : Interface service d'authentification avec nouvelles méthodes
export interface IAuthService {
  // Méthodes existantes (signatures conservées mais comportement amélioré)
  login(loginData: ILoginRequest, context?: {
    ipAddress: string;
    userAgent: string;
    deviceFingerprint?: string;
  }): Promise<ILoginResult>;
  
  register(registerData: IRegisterRequest, clientInfo?: { // ✅ AMÉLIORÉ : Paramètre clientInfo ajouté
    ip: string; 
    userAgent: string 
  }): Promise<IRegisterResult>;
  
  logout(sessionId: string, allDevices?: boolean): Promise<boolean>;
  
  validateUser(
    email: string, 
    password: string, 
    context?: {
      ipAddress: string;
      userAgent: string;
      deviceFingerprint?: string;
    }
  ): Promise<IUserProfile | null>;
  
  verifyMfa(
    challengeToken: string, 
    code: string, 
    method: MfaProvider
  ): Promise<ILoginResult>;
  
  // ✅ NOUVELLES MÉTHODES pour fonctionnalités avancées (signatures corrigées)
  refreshTokens(refreshToken: string): Promise<ITokenPair>;
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
}