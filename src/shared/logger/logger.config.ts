import { registerAs } from '@nestjs/config';
import * as Joi from 'joi';

/**
 * Schéma de validation de la configuration Logger
 */
export const loggerValidationSchema = Joi.object({
  LOG_LEVEL: Joi.string().valid('error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly').default('info').label('LOG_LEVEL'),
  LOG_FORMAT: Joi.string().valid('json', 'simple', 'pretty').default('json').label('LOG_FORMAT'),
  LOG_ENABLE_CONSOLE: Joi.boolean().default(true).label('LOG_ENABLE_CONSOLE'),
  LOG_ENABLE_FILE: Joi.boolean().default(false).label('LOG_ENABLE_FILE'),
  LOG_FILE_PATH: Joi.string().optional().label('LOG_FILE_PATH'),
  LOG_MAX_SIZE: Joi.string().optional().label('LOG_MAX_SIZE'),
  LOG_MAX_FILES: Joi.string().optional().label('LOG_MAX_FILES'),
});

/**
 * Configuration Logger pour @nestjs/config
 * Utilisation : ConfigModule.forRoot({ load: [loggerConfig] })
 */
export default registerAs('logger', () => ({
  level: process.env.LOG_LEVEL || 'info',
  format: process.env.LOG_FORMAT || 'json',
  enableConsole: process.env.LOG_ENABLE_CONSOLE !== 'false',
  enableFile: process.env.LOG_ENABLE_FILE === 'true',
  filePath: process.env.LOG_FILE_PATH,
  maxSize: process.env.LOG_MAX_SIZE,
  maxFiles: process.env.LOG_MAX_FILES,
})); 