// src/modules/auth/interfaces/session.interface.ts

/**
 * Interfaces de gestion des sessions Entrix V3.0
 * ✅ AMÉLIORÉ : Support des sessions intelligentes avec réutilisation
 * Respecte schema.prisma user_sessions
 */

// Interface session selon schema.prisma exact (inchangée)
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

// Interface informations session pour API (améliorée)
export interface ISessionInfo {
  sessionId: string;
  expiresAt: string; // ISO 8601
  deviceInfo: IDeviceInfo;
  isActive: boolean;
  lastActivity: string;
  isReused?: boolean; // ✅ NOUVEAU : Indique si session réutilisée
  sessionType?: 'reused' | 'refreshed' | 'new'; // ✅ NOUVEAU : Type de session
}

// Interface Device Info (inchangée, déjà correcte)
export interface IDeviceInfo {
  deviceId?: string;
  userAgent: string;
  browser?: string;
  os?: string;
  isMobile: boolean;
  ipAddress: string;
  deviceFingerprint?: string;
  geolocation?: {
    country: string;
    city: string;
    coordinates?: [number, number];
  };
}

// Interface paire de tokens (inchangée)
export interface ITokenPair {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresIn: number; // secondes
}

// ✅ NOUVELLES INTERFACES pour gestion intelligente des sessions

/**
 * Interface pour résultat de gestion de session lors du login
 */
export interface ISessionLoginResult {
  session: IUserSession;
  tokens: ITokenPair;
  type: 'reused' | 'refreshed' | 'new';
  isReused: boolean;
}

/**
 * Interface pour compatibilité de session
 */
export interface ISessionCompatibility {
  session: IUserSession;
  score: number; // Score de compatibilité 0-100
  factors: {
    deviceFingerprint: boolean;
    ipAddress: boolean;
    userAgent: boolean;
    recentActivity: boolean;
  };
}

/**
 * Interface pour stratégie de gestion de session
 */
export interface ISessionStrategy {
  reuseThresholdMinutes: number; // Seuil pour réutiliser une session (ex: 60 min)
  maxConcurrentSessions: number; // Nombre max de sessions simultanées
  preferDeviceFingerprint: boolean; // Priorité au device fingerprint
  allowIpBasedMatching: boolean; // Autoriser matching par IP
}

// Interface service de session (améliorée)
export interface ISessionService {
  // Méthodes existantes (inchangées)
  createSession(userId: string, deviceInfo: IDeviceInfo, rememberMe?: boolean): Promise<IUserSession>;
  validateSession(sessionToken: string): Promise<IUserSession | null>;
  refreshSession(refreshToken: string): Promise<ITokenPair>;
  revokeSession(sessionId: string): Promise<boolean>;
  revokeAllUserSessions(userId: string): Promise<number>;
  getUserActiveSessions(userId: string): Promise<IUserSession[]>;
  cleanupExpiredSessions(): Promise<number>;
  
  // ✅ NOUVELLES MÉTHODES pour gestion intelligente
  handleUserLogin(userId: string, deviceInfo: IDeviceInfo, rememberMe?: boolean): Promise<ISessionLoginResult>;
  findCompatibleSession(sessions: IUserSession[], deviceInfo: IDeviceInfo, rememberMe: boolean): Promise<IUserSession | null>;
  refreshExistingSession(session: IUserSession, deviceInfo: IDeviceInfo, rememberMe: boolean): Promise<IUserSession>;
  cleanupExpiredSessionsForUser(userId: string): Promise<number>;
}