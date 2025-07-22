import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import bullmqConfig, { bullmqValidationSchema } from './bullmq.config';
import { BullmqService } from './bullmq.service';

/**
 * Module BullMQ global pour la gestion des jobs et files asynchrones
 * - Fournit BullmqService à toute l'application
 * - Intègre la configuration et la validation d'ENV
 */
@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [bullmqConfig],
      validationSchema: bullmqValidationSchema,
      validationOptions: {
        abortEarly: false,
      },
    }),
  ],
  providers: [BullmqService],
  exports: [BullmqService],
})
export class BullmqModule {} 
