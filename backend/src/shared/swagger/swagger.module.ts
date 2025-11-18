import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import swaggerConfig, { swaggerValidationSchema } from './swagger.config';
import { SwaggerService } from './swagger.service';

/**
 * Module Swagger global pour la documentation API centralisée
 * - Fournit SwaggerService à toute l'application
 * - Intègre la configuration et la validation d'ENV
 */
@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [swaggerConfig],
      validationSchema: swaggerValidationSchema,
      validationOptions: {
        abortEarly: false,
      },
    }),
  ],
  providers: [SwaggerService],
  exports: [SwaggerService],
})
export class SwaggerModule {} 