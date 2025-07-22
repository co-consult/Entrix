import { registerAs } from '@nestjs/config';
import * as Joi from 'joi';

/**
 * Schéma de validation de la configuration Prisma
 */
export const prismaValidationSchema = Joi.object({
  DATABASE_URL: Joi.string().uri().required().label('DATABASE_URL'),
  PRISMA_LOG_LEVEL: Joi.string()
    .valid('info', 'warn', 'error', 'query')
    .default('info')
    .label('PRISMA_LOG_LEVEL'),
  PRISMA_POOL_MIN: Joi.number().integer().min(1).default(2).label('PRISMA_POOL_MIN'),
  PRISMA_POOL_MAX: Joi.number().integer().min(1).default(10).label('PRISMA_POOL_MAX'),
});

/**
 * Configuration Prisma pour @nestjs/config
 * Utilisation : ConfigModule.forRoot({ load: [prismaConfig] })
 */
export default registerAs('prisma', () => ({
  databaseUrl: process.env.DATABASE_URL,
  logLevel: process.env.PRISMA_LOG_LEVEL || 'info',
  poolMin: process.env.PRISMA_POOL_MIN ? Number(process.env.PRISMA_POOL_MIN) : 2,
  poolMax: process.env.PRISMA_POOL_MAX ? Number(process.env.PRISMA_POOL_MAX) : 10,
})); 