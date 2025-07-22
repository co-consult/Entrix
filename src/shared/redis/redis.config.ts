import { registerAs } from '@nestjs/config';
import * as Joi from 'joi';

/**
 * Schéma de validation de la configuration Redis
 */
export const redisValidationSchema = Joi.object({
  REDIS_HOST: Joi.string().required().label('REDIS_HOST'),
  REDIS_PORT: Joi.number().integer().min(1).max(65535).required().label('REDIS_PORT'),
  REDIS_PASSWORD: Joi.string().allow('').optional().label('REDIS_PASSWORD'),
  REDIS_DB: Joi.number().integer().min(0).default(0).label('REDIS_DB'),
  REDIS_TLS: Joi.boolean().default(false).label('REDIS_TLS'),
});

/**
 * Configuration Redis pour @nestjs/config
 * Utilisation : ConfigModule.forRoot({ load: [redisConfig] })
 */
export default registerAs('redis', () => ({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT ? Number(process.env.REDIS_PORT) : 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  db: process.env.REDIS_DB ? Number(process.env.REDIS_DB) : 0,
  tls: process.env.REDIS_TLS === 'true',
})); 