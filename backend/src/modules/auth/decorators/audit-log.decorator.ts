// src/modules/auth/decorators/audit-log.decorator.ts

import { SetMetadata } from '@nestjs/common';

/**
 * Decorators audit et logging Entrix V3.0
 * Traçabilité actions sensibles
 */

// Clé metadata pour audit
export const AUDIT_LOG_KEY = 'auditLog';

// Clé metadata pour niveau audit
export const AUDIT_LEVEL_KEY = 'auditLevel';

// Interface configuration audit
export interface AuditConfig {
  action: string;
  level: 'info' | 'warn' | 'critical';
  includeBody?: boolean;
  includeResponse?: boolean;
  sensitiveFields?: string[];
}

/**
 * Decorator @AuditLog() - Active audit logging
 * Usage: @AuditLog({ action: 'password_change', level: 'critical' })
 */
export const AuditLog = (config: AuditConfig) => SetMetadata(AUDIT_LOG_KEY, config);

/**
 * Decorator @AuditCritical() - Audit critique (actions sensibles)
 * Usage: @AuditCritical('password_reset')
 */
export const AuditCritical = (action: string) => 
  SetMetadata(AUDIT_LOG_KEY, { 
    action, 
    level: 'critical', 
    includeBody: true,
    includeResponse: false,
    sensitiveFields: ['password', 'token', 'code']
  } as AuditConfig);

/**
 * Decorator @AuditSecurity() - Audit sécurité
 * Usage: @AuditSecurity('mfa_setup')
 */
export const AuditSecurity = (action: string) =>
  SetMetadata(AUDIT_LOG_KEY, {
    action,
    level: 'warn',
    includeBody: false,
    includeResponse: false,
  } as AuditConfig);

/**
 * Decorator @AuditAccess() - Audit accès
 * Usage: @AuditAccess('sensitive_data_access')
 */
export const AuditAccess = (action: string) =>
  SetMetadata(AUDIT_LOG_KEY, {
    action,
    level: 'info',
    includeBody: false,
    includeResponse: false,
  } as AuditConfig);