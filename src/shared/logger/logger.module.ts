import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import loggerConfig, { loggerValidationSchema } from './logger.config';
import { LoggerService } from './logger.service';

/**
 * Module Logger global pour la centralisation des logs applicatifs et techniques
 * - Fournit LoggerService à toute l'application
 * - Intègre la configuration et la validation d'ENV
 */
@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [loggerConfig],
      validationSchema: loggerValidationSchema,
      validationOptions: {
        abortEarly: false,
      },
    }),
  ],
  providers: [LoggerService],
  exports: [LoggerService],
})
export class LoggerModule {}
