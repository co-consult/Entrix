import { Module, Global, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import notificationsConfig, { notificationsValidationSchema } from './notifications.config';
import { NotificationsService } from './notifications.service';
import { EmailModule } from '../email/email.module';
import { LoggerModule } from '../logger/logger.module';

/**
 * Module Notifications global pour l'orchestration multi-canaux
 * - Fournit NotificationsService à toute l'application
 * - Intègre la configuration et la validation d'ENV
 * - Dépend de EmailModule et LoggerModule
 */
@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [notificationsConfig],
      validationSchema: notificationsValidationSchema,
      validationOptions: {
        abortEarly: false,
      },
    }),
    forwardRef(() => EmailModule),
    forwardRef(() => LoggerModule),
  ],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {} 