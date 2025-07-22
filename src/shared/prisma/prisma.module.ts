import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import prismaConfig, { prismaValidationSchema } from './prisma.config';
import { PrismaService } from './prisma.service';

/**
 * Module Prisma global pour l'accès à la base de données
 * - Fournit PrismaService à toute l'application
 * - Intègre la configuration et la validation d'ENV
 */
@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [prismaConfig],
      validationSchema: prismaValidationSchema,
      validationOptions: {
        abortEarly: false,
      },
    }),
  ],
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}