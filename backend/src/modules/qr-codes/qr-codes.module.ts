// src/modules/qr-codes/qr-codes.module.ts

import { Module } from '@nestjs/common';
import { QRCodesController } from './controllers/qr-codes.controller';
import { QRCodesService } from './services/qr-codes.service';
import { PrismaModule } from '../../shared/prisma/prisma.module';
import { LoggerModule } from '../../shared/logger/logger.module';

@Module({
  imports: [PrismaModule, LoggerModule],
  controllers: [QRCodesController],
  providers: [QRCodesService],
  exports: [QRCodesService],
})
export class QRCodesModule {} 