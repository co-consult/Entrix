import { registerAs } from '@nestjs/config';
import * as Joi from 'joi';

/**
 * Schéma de validation de la configuration Swagger
 */
export const swaggerValidationSchema = Joi.object({
  SWAGGER_ENABLED: Joi.boolean().default(true).label('SWAGGER_ENABLED'),
  SWAGGER_TITLE: Joi.string().default('Entrix API').label('SWAGGER_TITLE'),
  SWAGGER_DESCRIPTION: Joi.string().optional().label('SWAGGER_DESCRIPTION'),
  SWAGGER_VERSION: Joi.string().default('1.0').label('SWAGGER_VERSION'),
  SWAGGER_PATH: Joi.string().default('api/docs').label('SWAGGER_PATH'),
  SWAGGER_AUTH_TYPE: Joi.string().valid('bearer', 'cookie').optional().label('SWAGGER_AUTH_TYPE'),
  SWAGGER_TAGS: Joi.string().optional().label('SWAGGER_TAGS'),
});

/**
 * Configuration Swagger pour @nestjs/config
 * Utilisation : ConfigModule.forRoot({ load: [swaggerConfig] })
 */
export default registerAs('swagger', () => ({
  enabled: process.env.SWAGGER_ENABLED !== 'false',
  title: process.env.SWAGGER_TITLE || 'Entrix API',
  description: process.env.SWAGGER_DESCRIPTION,
  version: process.env.SWAGGER_VERSION || '1.0',
  path: process.env.SWAGGER_PATH || 'api/docs',
  authType: process.env.SWAGGER_AUTH_TYPE,
  tags: process.env.SWAGGER_TAGS ? process.env.SWAGGER_TAGS.split(',') : [],
})); 