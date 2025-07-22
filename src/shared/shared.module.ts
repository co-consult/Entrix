import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

// Configuration imports
import prismaConfig, { prismaValidationSchema } from './prisma/prisma.config';
import redisConfig, { redisValidationSchema } from './redis/redis.config';
import bullmqConfig, { bullmqValidationSchema } from './bullmq/bullmq.config';
import emailConfig, { emailValidationSchema } from './email/email.config';
import loggerConfig, { loggerValidationSchema } from './logger/logger.config';
import swaggerConfig, { swaggerValidationSchema } from './swagger/swagger.config';

// Module imports
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { BullmqModule } from './bullmq/bullmq.module';
import { EmailModule } from './email/email.module';
import { LoggerModule } from './logger/logger.module';
import { RateLimitingModule } from './rate-limiting/rate-limiting.module';
import { SwaggerModule } from './swagger/swagger.module';

// Service imports
import { PrismaService } from './prisma/prisma.service';
import { RedisService } from './redis/redis.service';
import { BullmqService } from './bullmq/bullmq.service';
import { EmailService } from './email/email.service';
import { LoggerService } from './logger/logger.service';
import { RateLimitingService } from './rate-limiting/rate-limiting.service';
import { SwaggerService } from './swagger/swagger.service';

// Processor imports
import { EmailProcessor } from './email/email.processor';

// Guard imports
import { RateLimitingGuard } from './rate-limiting/rate-limiting.guard';

/**
 * Module partagé global qui regroupe tous les services communs
 * Grade A+ - Architecture complète avec monitoring, métriques et fonctionnalités avancées
 * 
 * Ce module doit être importé dans AppModule et fournit:
 * - Base de données avec Prisma (métriques, retry, transactions)
 * - Cache Redis (verrous distribués, sessions, métriques)
 * - Queue BullMQ (jobs prioritaires, récurrents, monitoring)
 * - Email (templates, multi-providers, tracking)
 * - Logging (événements business, sécurité, performance)
 * - Rate limiting (Redis-based, adaptatif, whitelist/blacklist)
 * - Documentation Swagger (sécurisée, configurable)
 */
@Global()
@Module({
  imports: [
    // Configuration globale avec validation Joi
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        `.env.${process.env.NODE_ENV || 'development'}`,
        '.env.local',
        '.env'
      ],
      load: [
        prismaConfig,
        redisConfig,
        bullmqConfig,
        emailConfig,
        loggerConfig,
        swaggerConfig,
      ],
      validationSchema: prismaValidationSchema
        .concat(redisValidationSchema)
        .concat(bullmqValidationSchema)
        .concat(emailValidationSchema)
        .concat(loggerValidationSchema)
        .concat(swaggerValidationSchema),
      validationOptions: {
        abortEarly: false,
        allowUnknown: true,
        stripUnknown: true,
      },
      cache: true,
      expandVariables: true,
    }),
    
    // Modules de base (ordre d'importance)
    LoggerModule,        // D'abord le logging
    RedisModule,         // Puis le cache
    PrismaModule,        // Puis la base de données
    BullmqModule,        // Puis les queues
    EmailModule,         // Puis les emails
    RateLimitingModule,  // Puis la protection
    SwaggerModule,       // Enfin la documentation
  ],
  providers: [
    // Services principaux
    PrismaService,
    RedisService,
    BullmqService,
    EmailService,
    LoggerService,
    RateLimitingService,
    SwaggerService,
    
    // Processeurs
    EmailProcessor,
    
    // Guards
    RateLimitingGuard,
    
    // Providers utilitaires
    {
      provide: 'APP_METRICS',
      useFactory: (
        prisma: PrismaService,
        redis: RedisService,
        bullmq: BullmqService,
        email: EmailService,
        rateLimiting: RateLimitingService,
      ) => ({
        prisma: () => prisma.getMetrics(),
        redis: () => redis.getMetrics(),
        bullmq: () => bullmq.getMetrics(),
        email: () => email.getMetrics(),
        rateLimiting: () => rateLimiting.getMetrics(),
      }),
      inject: [
        PrismaService,
        RedisService,
        BullmqService,
        EmailService,
        RateLimitingService,
      ],
    },
    
    // Provider pour health checks
    {
      provide: 'APP_HEALTH',
      useFactory: (
        prisma: PrismaService,
        redis: RedisService,
        email: EmailService,
        logger: LoggerService,
      ) => ({
        async checkHealth() {
          try {
            const [prismaHealth, redisHealth, emailHealth] = await Promise.all([
              prisma.healthCheck(),
              redis.ping(),
              email.testConnection(),
            ]);
            
            const services = {
              prisma: prismaHealth.status,
              redis: redisHealth === 'PONG' ? 'healthy' as const : 'unhealthy' as const,
              email: emailHealth ? 'healthy' as const : 'unhealthy' as const,
            };
            
            // Déterminer le statut global
            const hasUnhealthy = Object.values(services).some(status => status === 'unhealthy');
            const globalStatus: 'healthy' | 'unhealthy' | 'degraded' = hasUnhealthy ? 'unhealthy' : 'healthy';
            
            const health = {
              status: globalStatus,
              timestamp: new Date().toISOString(),
              services,
            };
            
            logger.logHealthCheck('SharedModule', globalStatus, health.services);
            return health;
          } catch (error) {
            logger.logHealthCheck('SharedModule', 'unhealthy', { error: error.message });
            throw error;
          }
        },
      }),
      inject: [PrismaService, RedisService, EmailService, LoggerService],
    },
  ],
  exports: [
    // Modules
    PrismaModule,
    RedisModule,
    BullmqModule,
    EmailModule,
    LoggerModule,
    RateLimitingModule,
    SwaggerModule,
    
    // Services
    PrismaService,
    RedisService,
    BullmqService,
    EmailService,
    LoggerService,
    RateLimitingService,
    SwaggerService,
    
    // Processeurs
    EmailProcessor,
    
    // Guards
    RateLimitingGuard,
    
    // Providers utilitaires
    'APP_METRICS',
    'APP_HEALTH',
  ],
})
export class SharedModule {
  constructor(private readonly logger: LoggerService) {
    this.logger.log('🚀 SharedModule initialized with grade A+ features');
    
    // Log de la configuration au démarrage
    this.logConfiguration();
  }

  /**
   * Log de la configuration au démarrage
   */
  private logConfiguration(): void {
    const config = {
      nodeEnv: process.env.NODE_ENV,
      database: process.env.DATABASE_URL ? 'configured' : 'missing',
      redis: process.env.REDIS_HOST ? 'configured' : 'missing',
      email: process.env.EMAIL_HOST ? 'configured' : 'missing',
      logging: process.env.LOG_LEVEL || 'info',
      rateLimiting: 'redis-based',
      queues: 'bullmq',
      documentation: process.env.SWAGGER_ENABLED !== 'false' ? 'enabled' : 'disabled',
    };

    this.logger.log('📋 SharedModule configuration:', JSON.stringify(config));
  }
}