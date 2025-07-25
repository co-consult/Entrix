// src/modules/auth/interfaces/session.interface.ts

/**
 * Interfaces de gestion des sessions Entrix V3.0
 * ✅ CORRIGÉ : Types sessionType strictement typés
 * Respecte schema.prisma user_sessions
 */

// ✅ NOUVEAU : Type strict pour sessionType défini ici pour éviter imports circulaires
export type SessionType = 'reused' | 'refreshed' | 'new';

// Interface session selon schema.prisma exact
export interface IUserSession {
  id: string;
  session_token: string;
  user_id: string;
  ip_address: string; // type INET dans Prisma
  user_agent: string | null;
  device_fingerprint: string | null;
  geolocation: any | null; // JSONB dans Prisma
  is_active: boolean;
  last_activity: Date;
  expires_at: Date;
  created_at: Date;
  updated_at: Date;
}

// Interface informations session pour API
export interface ISessionInfo {
  sessionId: string;
  expiresAt: string; // ISO 8601
  deviceInfo: IDeviceInfo;
  isActive: boolean;
  lastActivity: string;
  isReused?: boolean;
  sessionType?: SessionType; // ✅ CORRIGÉ : Type strict
}

// ✅ CORRIGÉ : Interface Device Info avec deviceFingerprint
// Respecte schema.prisma user_sessions.device_fingerprint
export interface IDeviceInfo {
  deviceId?: string;
  userAgent: string;
  browser?: string;
  os?: string;
  isMobile: boolean;
  ipAddress: string;
  deviceFingerprint?: string; // ✅ AJOUTÉ : Champ manquant selon schema.prisma
  geolocation?: {
    country: string;
    city: string;
    coordinates?: [number, number];
  };
}

// Interface paire de tokens
export interface ITokenPair {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresIn: number; // secondes
}

// ✅ INTERFACE : Résultat de gestion de login session avec types stricts
export interface ISessionLoginResult {
  session: IUserSession;
  tokens: ITokenPair;
  type: SessionType; // ✅ CORRIGÉ : Type strict
  isReused: boolean;
  tokensReused?: boolean; // Indique si tokens ont été réutilisés
}

// Interface service de session
export interface ISessionService {
  createSession(userId: string, deviceInfo: IDeviceInfo, rememberMe?: boolean): Promise<IUserSession>;
  validateSession(sessionToken: string): Promise<IUserSession | null>;
  refreshSession(refreshToken: string): Promise<ITokenPair>;
  revokeSession(sessionId: string): Promise<boolean>;
  revokeAllUserSessions(userId: string): Promise<number>;
  getUserActiveSessions(userId: string): Promise<IUserSession[]>;
  cleanupExpiredSessions(): Promise<number>;
  handleUserLogin(userId: string, deviceInfo: IDeviceInfo, rememberMe?: boolean): Promise<ISessionLoginResult>;
}