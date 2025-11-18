import { registerAs } from '@nestjs/config';
import * as Joi from 'joi';

/**
 * Schéma de validation de la configuration BullMQ
 */
export const bullmqValidationSchema = Joi.object({
  BULLMQ_PREFIX: Joi.string().default('bullmq').label('BULLMQ_PREFIX'),
  BULLMQ_CONCURRENCY: Joi.number().integer().min(1).default(5).label('BULLMQ_CONCURRENCY'),
  BULLMQ_REDIS_HOST: Joi.string().optional().label('BULLMQ_REDIS_HOST'),
  BULLMQ_REDIS_PORT: Joi.number().integer().min(1).max(65535).optional().label('BULLMQ_REDIS_PORT'),
  BULLMQ_REDIS_PASSWORD: Joi.string().allow('').optional().label('BULLMQ_REDIS_PASSWORD'),
  BULLMQ_REDIS_DB: Joi.number().integer().min(0).optional().label('BULLMQ_REDIS_DB'),
  BULLMQ_REDIS_TLS: Joi.boolean().optional().label('BULLMQ_REDIS_TLS'),
});

/**
 * Configuration BullMQ pour @nestjs/config
 * Utilisation : ConfigModule.forRoot({ load: [bullmqConfig] })
 */
export default registerAs('bullmq', () => ({
  prefix: process.env.BULLMQ_PREFIX || 'bullmq',
  concurrency: process.env.BULLMQ_CONCURRENCY ? Number(process.env.BULLMQ_CONCURRENCY) : 5,
  redis: {
    host: process.env.BULLMQ_REDIS_HOST || process.env.REDIS_HOST,
    port: process.env.BULLMQ_REDIS_PORT ? Number(process.env.BULLMQ_REDIS_PORT) : (process.env.REDIS_PORT ? Number(process.env.REDIS_PORT) : 6379),
    password: process.env.BULLMQ_REDIS_PASSWORD || process.env.REDIS_PASSWORD || undefined,
    db: process.env.BULLMQ_REDIS_DB ? Number(process.env.BULLMQ_REDIS_DB) : (process.env.REDIS_DB ? Number(process.env.REDIS_DB) : 0),
    tls: process.env.BULLMQ_REDIS_TLS === 'true' || process.env.REDIS_TLS === 'true',
  },
})); 