// src/modules/venues/venues.module.ts

import { Module } from '@nestjs/common';
import { VenuesController } from './controllers/venues.controller';
import { VenuesService } from './services/venues.service';
import { PrismaModule } from '../../shared/prisma/prisma.module';
import { LoggerModule } from '../../shared/logger/logger.module';

@Module({
  imports: [PrismaModule, LoggerModule],
  controllers: [VenuesController],
  providers: [VenuesService],
  exports: [VenuesService],
})
export class VenuesModule {}

