export declare const REQUIRE_MFA_KEY = "requireMfa";
export declare const MFA_LEVEL_KEY = "mfaLevel";
export declare const RequireMfa: () => import("@nestjs/common").CustomDecorator<string>;
export declare const MfaLevel: (level: 'basic' | 'high' | 'critical') => import("@nestjs/common").CustomDecorator<string>;
export declare const RequireHighMfa: () => import("@nestjs/common").CustomDecorator<string>;
export declare const RequireCriticalMfa: () => import("@nestjs/common").CustomDecorator<string>;
