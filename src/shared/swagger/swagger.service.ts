import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { SwaggerModuleConfig } from './swagger.interfaces';

/**
 * Service utilitaire pour initialiser et configurer Swagger dans l'application NestJS
 */
export class SwaggerService {
  /**
   * Initialise Swagger dans l'application NestJS avec la configuration fournie
   * @param app INestApplication
   * @param config SwaggerModuleConfig
   */
  static setup(app: INestApplication, config: SwaggerModuleConfig) {
    if (!config.enabled) {
      return;
    }
    const builder = new DocumentBuilder()
      .setTitle(config.title)
      .setVersion(config.version);
    if (config.description) {
      builder.setDescription(config.description);
    }
    if (config.authType === 'bearer') {
      builder.addBearerAuth();
    } else if (config.authType === 'cookie') {
      builder.addCookieAuth('access_token');
    }
    if (config.tags && config.tags.length) {
      config.tags.forEach(tag => builder.addTag(tag));
    }
    const document = SwaggerModule.createDocument(app, builder.build());
    SwaggerModule.setup(config.path, app, document, {
      swaggerOptions: {
        persistAuthorization: true,
      },
      customSiteTitle: config.title,
    });
  }
} 