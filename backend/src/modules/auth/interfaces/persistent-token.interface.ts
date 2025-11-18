// src/modules/auth/interfaces/persistent-token.interface.ts

import { persistent_token_type } from '@prisma/client';

/**
 * Interfaces pour Persistent Tokens Entrix V3.0
 * Gestion centralisée des tokens API, refresh longue durée, accès persistants
 */

// ============================================================================
// INTERFACES CORE PERSISTENT TOKENS
// ============================================================================

/**
 * Interface Persistent Token selon schema.prisma exact
 */
export interface IPersistentToken {
  id: string;
  user_id: string;
  token_type: persistent_token_type;
  token_hash: string;
  token_prefix: string;
  name?: string | null;
  description?: string | null;
  scopes: string[];
  expires_at?: Date | null;
  last_used_at?: Date | null;
  last_used_ip?: string | null;
  usage_count: number;
  is_active: boolean;
  is_revoked: boolean;
  revoked_at?: Date | null;
  revoked_by?: string | null;
  revoked_reason?: string | null;
  device_info?: any | null;
  metadata?: any | null;
  created_at: Date;
  updated_at: Date;
}

/**
 * Interface données création Persistent Token
 */
export interface ICreatePersistentTokenData {
  user_id: string;
  token_type: persistent_token_type;
  name?: string;
  description?: string;
  scopes?: string[];
  expires_at?: Date;
  device_info?: {
    deviceFingerprint?: string;
    userAgent?: string;
    platform?: string;
    appVersion?: string;
  };
  metadata?: Record<string, any>;
}

/**
 * Interface mise à jour Persistent Token
 */
export interface IUpdatePersistentTokenData {
  name?: string;
  description?: string;
  scopes?: string[];
  expires_at?: Date | null;
  is_active?: boolean;
  metadata?: Record<string, any>;
}

/**
 * Interface token généré avec informations complètes
 */
export interface IPersistentTokenGenerated {
  id: string;
  token: string;              // Token complet en clair
  token_prefix: string;       // Préfixe visible
  token_type: persistent_token_type;
  user_id: string;
  scopes: string[];
  expires_at?: Date | null;
  created_at: Date;
}

/**
 * Interface validation token persistent
 */
export interface IPersistentTokenValidation {
  isValid: boolean;
  token?: IPersistentToken;
  userId?: string;
  scopes?: string[];
  errors?: string[];
  lastUsed?: Date;
  usageCount?: number;
}

// ============================================================================
// INTERFACES POUR API ET RESPONSES
// ============================================================================

/**
 * Interface liste tokens utilisateur pour API
 */
export interface IPersistentTokenList {
  id: string;
  name?: string;
  description?: string;
  token_type: persistent_token_type;
  token_prefix: string;
  scopes: string[];
  expires_at?: string | null;    // ISO 8601
  last_used_at?: string | null;  // ISO 8601
  usage_count: number;
  is_active: boolean;
  created_at: string;            // ISO 8601
}

/**
 * Interface statistiques tokens
 */
export interface IPersistentTokenStats {
  total: number;
  active: number;
  expired: number;
  revoked: number;
  by_type: Record<persistent_token_type, number>;
  recent_usage: {
    last_24h: number;
    last_7d: number;
    last_30d: number;
  };
}

/**
 * Interface filtres recherche tokens
 */
export interface IPersistentTokenFilters {
  user_id?: string;
  token_type?: persistent_token_type | persistent_token_type[];
  is_active?: boolean;
  is_revoked?: boolean;
  expires_before?: Date;
  expires_after?: Date;
  last_used_before?: Date;
  last_used_after?: Date;
  scopes?: string[];
  search?: string;  // Recherche dans name/description
}

/**
 * Interface paramètres pagination
 */
export interface IPersistentTokenPagination {
  page?: number;
  limit?: number;
  sort_by?: 'created_at' | 'last_used_at' | 'expires_at' | 'usage_count';
  sort_order?: 'asc' | 'desc';
}

// ============================================================================
// INTERFACE SERVICE PERSISTENT TOKENS
// ============================================================================

/**
 * Interface service de gestion des tokens persistants
 */
export interface IPersistentTokenService {
  // Création et génération
  createToken(data: ICreatePersistentTokenData): Promise<IPersistentTokenGenerated>;
  generateApiKey(userId: string, name?: string, scopes?: string[]): Promise<IPersistentTokenGenerated>;
  generateLongRefreshToken(userId: string, deviceInfo?: any): Promise<IPersistentTokenGenerated>;
  
  // Validation et vérification
  validateToken(token: string): Promise<IPersistentTokenValidation>;
  validateApiKey(token: string): Promise<IPersistentTokenValidation>;
  isTokenValid(tokenId: string): Promise<boolean>;
  
  // Gestion et mise à jour
  updateToken(tokenId: string, data: IUpdatePersistentTokenData): Promise<IPersistentToken>;
  revokeToken(tokenId: string, reason?: string, revokedBy?: string): Promise<boolean>;
  revokeAllUserTokens(userId: string, reason?: string): Promise<number>;
  
  // Récupération et liste
  getToken(tokenId: string): Promise<IPersistentToken | null>;
  getUserTokens(userId: string, filters?: IPersistentTokenFilters): Promise<IPersistentTokenList[]>;
  getTokensByType(type: persistent_token_type, filters?: IPersistentTokenFilters): Promise<IPersistentToken[]>;
  
  // Utilisation et statistiques
  recordTokenUsage(tokenId: string, ipAddress?: string): Promise<void>;
  getTokenStats(userId?: string): Promise<IPersistentTokenStats>;
  getTokenUsageHistory(tokenId: string, days?: number): Promise<any[]>;
  
  // Maintenance
  cleanupExpiredTokens(): Promise<number>;
  cleanupRevokedTokens(olderThanDays?: number): Promise<number>;
  refreshToken(tokenId: string): Promise<IPersistentTokenGenerated>;
}

// ============================================================================
// TYPES UTILITAIRES
// ============================================================================

/**
 * Type pour les scopes/permissions disponibles
 */
export type TokenScope = 
  | 'read:profile'
  | 'write:profile'
  | 'read:events'
  | 'write:events'
  | 'read:bookings'
  | 'write:bookings'
  | 'read:payments'
  | 'write:payments'
  | 'admin:users'
  | 'admin:events'
  | 'admin:system'
  | string;  // Permet scopes custom

/**
 * Type pour les préfixes de tokens
 */
export type TokenPrefix = 
  | 'ent_api_'     // API Key
  | 'ent_ref_'     // Long Refresh Token
  | 'ent_acc_'     // Long Access Token
  | 'ent_mob_'     // Mobile Session
  | 'ent_int_'     // Integration Token
  | string;

/**
 * Type pour les raisons de révocation
 */
export type RevocationReason =
  | 'USER_REQUEST'
  | 'SECURITY_BREACH'
  | 'TOKEN_COMPROMISE'
  | 'POLICY_VIOLATION'
  | 'EXPIRED_UNUSED'
  | 'ACCOUNT_DELETION'
  | 'ADMIN_ACTION'
  | string;

/**
 * Interface événements de tokens (pour audit)
 */
export interface IPersistentTokenEvent {
  type: 'CREATED' | 'USED' | 'UPDATED' | 'REVOKED' | 'EXPIRED';
  token_id: string;
  user_id: string;
  ip_address?: string;
  user_agent?: string;
  metadata?: Record<string, any>;
  timestamp: Date;
}