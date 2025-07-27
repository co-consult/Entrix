// src/modules/auth/decorators/index.ts

/**
 * Index des décorateurs Auth Entrix V3.0
 * Export centralisé pour imports simplifiés
 * 
 * Usage:
 * import { Public, CurrentUserId, RateLimit } from '../decorators';
 */

// Décorateur Public
export { Public, IS_PUBLIC_KEY } from './public.decorator';

// Décorateurs d'authentification complets
export {
  // Extraction de données de requête
  CurrentUser,
  CurrentUserId,
  CurrentSession,
  SessionId,
  ClientInfo,
  DeviceFingerprint,
  
  // Configuration des endpoints
  RequireMfa,
  RequireTrustedDevice,
  Roles,
  Permissions,
  
  // Limitation et audit
  RateLimit,
  AuditLog,
  
  // Sécurité avancée
  SecurityLevel,
  Sensitive,
  RiskScore,
  
  // Cache et performance
  Cache,
  NoCache,
  
  // Validation et transformation
  ValidateInput,
  TransformOutput,
  
  // Monitoring et métriques
  Monitor,
  BusinessMetric,
  
  // Feature flags
  FeatureFlag,
  Experimental,
  
  // Types et interfaces
  RateLimitOptions,
  AuditLogOptions,
  RiskScoreOptions,
  CacheOptions,
  ValidationOptions,
  TransformOptions,
  MonitoringOptions,
} from './auth.decorators';

export * from './rate-limit.decorator';
export * from './audit-log.decorator';

// Export du décorateur RequireScopes (défini dans api-key.guard.ts)
export { RequireScopes } from '../guards/api-key.guard';
