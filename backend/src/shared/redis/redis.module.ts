import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import redisConfig, { redisValidationSchema } from './redis.config';
import { RedisService } from './redis.service';

/**
 * Module Redis global pour l'accès au cache et pub/sub
 * - Fournit RedisService à toute l'application
 * - Intègre la configuration et la validation d'ENV
 */
@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [redisConfig],
      validationSchema: redisValidationSchema,
      validationOptions: {
        abortEarly: false,
      },
    }),
  ],
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {} 
