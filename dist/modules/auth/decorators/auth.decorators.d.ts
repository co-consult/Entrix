export declare const CurrentUser: (...dataOrPipes: unknown[]) => ParameterDecorator;
export declare const CurrentUserId: (...dataOrPipes: unknown[]) => ParameterDecorator;
export declare const CurrentSession: (...dataOrPipes: unknown[]) => ParameterDecorator;
export declare const SessionId: (...dataOrPipes: unknown[]) => ParameterDecorator;
export declare const ClientInfo: (...dataOrPipes: unknown[]) => ParameterDecorator;
export declare const DeviceFingerprint: (...dataOrPipes: unknown[]) => ParameterDecorator;
export declare const RequireMfa: () => import("@nestjs/common").CustomDecorator<string>;
export declare const RequireTrustedDevice: () => import("@nestjs/common").CustomDecorator<string>;
export declare const Roles: (...roles: string[]) => import("@nestjs/common").CustomDecorator<string>;
export declare const Permissions: (...permissions: string[]) => import("@nestjs/common").CustomDecorator<string>;
export interface RateLimitOptions {
    limit: number;
    windowMs: number;
    skipSuccessfulRequests?: boolean;
    skipFailedRequests?: boolean;
    keyGenerator?: (req: any) => string;
}
export declare const RateLimit: (options: RateLimitOptions) => import("@nestjs/common").CustomDecorator<string>;
export interface AuditLogOptions {
    action: string;
    level: 'info' | 'warn' | 'error';
    includeRequest?: boolean;
    includeResponse?: boolean;
    sensitiveFields?: string[];
}
export declare const AuditLog: (options: AuditLogOptions) => import("@nestjs/common").CustomDecorator<string>;
export type SecurityLevel = 'low' | 'medium' | 'high' | 'critical';
export declare const SecurityLevel: (level: SecurityLevel) => import("@nestjs/common").CustomDecorator<string>;
export declare const Sensitive: (reason?: string) => import("@nestjs/common").CustomDecorator<string>;
export interface RiskScoreOptions {
    maxScore: number;
    factors?: string[];
    action?: 'allow' | 'mfa' | 'block';
}
export declare const RiskScore: (options: RiskScoreOptions) => import("@nestjs/common").CustomDecorator<string>;
export interface CacheOptions {
    ttl: number;
    key?: string;
    vary?: string[];
}
export declare const Cache: (options: CacheOptions) => import("@nestjs/common").CustomDecorator<string>;
export declare const NoCache: () => import("@nestjs/common").CustomDecorator<string>;
export interface ValidationOptions {
    groups?: string[];
    skipMissingProperties?: boolean;
    whitelist?: boolean;
    forbidNonWhitelisted?: boolean;
}
export declare const ValidateInput: (options: ValidationOptions) => import("@nestjs/common").CustomDecorator<string>;
export interface TransformOptions {
    excludeFields?: string[];
    includeFields?: string[];
    transformations?: Record<string, (value: any) => any>;
}
export declare const TransformOutput: (options: TransformOptions) => import("@nestjs/common").CustomDecorator<string>;
export interface MonitoringOptions {
    trackDuration?: boolean;
    trackMemory?: boolean;
    trackErrors?: boolean;
    sampleRate?: number;
}
export declare const Monitor: (options?: MonitoringOptions) => import("@nestjs/common").CustomDecorator<string>;
export declare const BusinessMetric: (metricName: string, data?: Record<string, any>) => import("@nestjs/common").CustomDecorator<string>;
export declare const FeatureFlag: (flagName: string, defaultValue?: boolean) => import("@nestjs/common").CustomDecorator<string>;
export declare const Experimental: (version?: string) => import("@nestjs/common").CustomDecorator<string>;
