export declare const AUDIT_LOG_KEY = "auditLog";
export declare const AUDIT_LEVEL_KEY = "auditLevel";
export interface AuditConfig {
    action: string;
    level: 'info' | 'warn' | 'critical';
    includeBody?: boolean;
    includeResponse?: boolean;
    sensitiveFields?: string[];
}
export declare const AuditLog: (config: AuditConfig) => import("@nestjs/common").CustomDecorator<string>;
export declare const AuditCritical: (action: string) => import("@nestjs/common").CustomDecorator<string>;
export declare const AuditSecurity: (action: string) => import("@nestjs/common").CustomDecorator<string>;
export declare const AuditAccess: (action: string) => import("@nestjs/common").CustomDecorator<string>;
