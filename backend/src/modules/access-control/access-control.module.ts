import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { AccessControlController } from './controllers/access-control.controller';
import { AccessControlService } from './services/access-control.service';
import { PrismaModule } from '../../shared/prisma/prisma.module';
import { LoggerModule } from '../../shared/logger/logger.module';

@Module({
  imports: [
    PrismaModule,
    LoggerModule,
    JwtModule,
    ConfigModule
  ],
  controllers: [AccessControlController],
  providers: [AccessControlService],
  exports: [AccessControlService]
})
export class AccessControlModule {}
