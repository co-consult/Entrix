// src/modules/zones/zones.module.ts

import { Module } from '@nestjs/common';
import { ZonesController } from './controllers/zones.controller';
import { ZonesService } from './services/zones.service';
import { MappingsService } from './services/mappings.service';
import { PrismaModule } from '../../shared/prisma/prisma.module';
import { LoggerModule } from '../../shared/logger/logger.module';

@Module({
  imports: [PrismaModule, LoggerModule],
  controllers: [ZonesController],
  providers: [ZonesService, MappingsService],
  exports: [ZonesService, MappingsService],
})
export class ZonesModule {}

