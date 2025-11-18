/**
 * Type des authentifications supportées pour Swagger
 */
export type SwaggerAuthType = 'bearer' | 'cookie';

/**
 * Interface de configuration Swagger chargée via @nestjs/config
 */
export interface SwaggerModuleConfig {
  enabled: boolean;
  title: string;
  description?: string;
  version: string;
  path: string;
  authType?: SwaggerAuthType;
  tags?: string[];
} 