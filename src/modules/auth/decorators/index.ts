// src/modules/auth/decorators/index.ts

/**
 * Index des decorators Entrix V3.0
 * Export centralisé pour faciliter les imports
 */

// Current User & Session Decorators
export {
  CurrentUser,
  CurrentUserId,
  CurrentUserEmail,
  UserRoles,
  UserPermissions,
  Public,
  RequireTrustedDevice,
  IS_PUBLIC_KEY,
  TRUST_DEVICE_KEY,
} from './current-user.decorator';

export {
  CurrentSession,
  SessionId,
  DeviceFingerprint,
  ClientInfo,
} from './current-session.decorator';

// MFA Decorators
export {
  RequireMfa,
  MfaLevel,
  RequireHighMfa,
  RequireCriticalMfa,
  REQUIRE_MFA_KEY,
  MFA_LEVEL_KEY,
} from './require-mfa.decorator';

// Audit & Logging Decorators
export {
  AuditLog,
  AuditCritical,
  AuditSecurity,
  AuditAccess,
  AUDIT_LOG_KEY,
  AUDIT_LEVEL_KEY,
} from './audit-log.decorator';

// Rate Limiting Decorators
export {
  RateLimit,
  RateLimitStrict,
  RateLimitLogin,
  RateLimitPasswordReset,
  RateLimitMfa,
  RATE_LIMIT_KEY,
} from './rate-limit.decorator';

// Roles & Permissions Decorators
export {
  Roles,
  Permissions,
  RequireAllRoles,
  RequireAllPermissions,
  AdminOnly,
  OrganizerOnly,
  SuperAdminOnly,
  ModeratorOrAdmin,
  ROLES_KEY,
  PERMISSIONS_KEY,
  REQUIRE_ALL_ROLES_KEY,
  REQUIRE_ALL_PERMISSIONS_KEY,
} from './roles.decorator';

// API Key Decorators
export {
  RequireApiKey,
  ApiKeyScopes,
  PublicApiKey,
  PartnerApiKey,
  InternalApiKey,
  API_KEY_REQUIRED_KEY,
  API_KEY_SCOPES_KEY,
} from './api-key.decorator';

// Types pour les decorators
export type {
  SessionContext,
} from './current-session.decorator';

export type {
  AuditConfig,
} from './audit-log.decorator';

export type {
  RateLimitConfig,
} from './rate-limit.decorator';