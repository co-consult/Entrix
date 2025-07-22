import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  // Créer l'application
  const app = await NestFactory.create(AppModule);

  // Configuration basique
  app.setGlobalPrefix('api/v1', {
    exclude: ['/'], // Exclure la route racine
  });

  // CORS
  app.enableCors();

  // Port
  const port = process.env.PORT || 3000;
  
  // Démarrer le serveur
  await app.listen(port);
  
  // Messages de démarrage
  console.log(`Application is running on: http://localhost:${port}`);
  console.log(`API is available at: http://localhost:${port}/api/v1`);
}

bootstrap();