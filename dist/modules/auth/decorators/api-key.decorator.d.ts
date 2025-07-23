export declare const API_KEY_REQUIRED_KEY = "apiKeyRequired";
export declare const API_KEY_SCOPES_KEY = "apiKeyScopes";
export declare const RequireApiKey: () => import("@nestjs/common").CustomDecorator<string>;
export declare const ApiKeyScopes: (...scopes: string[]) => import("@nestjs/common").CustomDecorator<string>;
export declare const PublicApiKey: () => import("@nestjs/common").CustomDecorator<string>;
export declare const PartnerApiKey: () => import("@nestjs/common").CustomDecorator<string>;
export declare const InternalApiKey: () => import("@nestjs/common").CustomDecorator<string>;
