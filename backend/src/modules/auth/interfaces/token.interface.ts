// src/modules/auth/interfaces/token.interface.ts

/**
 * Interfaces de gestion des tokens Entrix V3.0
 */
import { JwtPayload, JwtRefreshPayload } from './auth.interfaces';
import { IUserProfile } from './user.interface';
import { IUserSession, IDeviceInfo } from './session.interface'; 

// Interface service de tokens
export interface ITokenService {
  generateAccessToken(payload: JwtPayload): Promise<string>;
  generateRefreshToken(payload: JwtRefreshPayload): Promise<string>;
  verifyAccessToken(token: string): Promise<JwtPayload>;
  verifyRefreshToken(token: string): Promise<JwtRefreshPayload>;
  blacklistToken(token: string): Promise<void>;
  isTokenBlacklisted(token: string): Promise<boolean>;
}

// Interface contexte de token
export interface ITokenContext {
  user: IUserProfile;
  session: IUserSession;
  deviceInfo: IDeviceInfo;
  permissions: string[];
  roles: string[];
}