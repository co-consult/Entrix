export type SwaggerAuthType = 'bearer' | 'cookie';
export interface SwaggerModuleConfig {
    enabled: boolean;
    title: string;
    description?: string;
    version: string;
    path: string;
    authType?: SwaggerAuthType;
    tags?: string[];
}
