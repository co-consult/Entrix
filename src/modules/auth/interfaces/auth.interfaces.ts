// src/modules/auth/interfaces/auth.interface.ts

import { MfaProvider } from '../constants/auth.constants';
import { IUserProfile, ILoginRequest, IRegisterRequest } from './user.interface';
import { ISessionInfo, ITokenPair } from './session.interface';
import { IMfaChallenge } from './mfa.interface';


/**
 * Interfaces d'authentification Entrix V3.0
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
  };
}

// Interface register result
export interface IRegisterResult {
  success: boolean;
  user?: IUserProfile;
  tokens?: ITokenPair;
  verification?: {
    emailSent: boolean;
    verificationRequired: boolean;
  };
  onboarding?: {
    incentiveApplied: boolean;
    incentiveType: string;
    incentiveValue: number;
    migratedTickets: number;
  };
}

// Interface service d'authentification
export interface IAuthService {
  login(loginData: ILoginRequest): Promise<ILoginResult>;
  register(registerData: IRegisterRequest): Promise<IRegisterResult>;
  logout(sessionId: string, allDevices?: boolean): Promise<boolean>;
  validateUser(email: string, password: string): Promise<IUserProfile | null>;
  verifyMfa(challengeToken: string, code: string, method: MfaProvider): Promise<ILoginResult>;
}











