// Crypto polyfill for @nestjs/schedule
import { webcrypto } from 'crypto';
if (!global.crypto) {
  global.crypto = webcrypto as any;
}

// Additional polyfill for older Node.js versions
if (typeof global.crypto === 'undefined') {
  const { randomBytes, createHash } = require('crypto');
  global.crypto = {
    getRandomValues: (arr: any) => {
      const bytes = randomBytes(arr.length);
      arr.set(bytes);
      return arr;
    },
    subtle: {
      digest: async (algorithm: string, data: any) => {
        const hash = createHash(algorithm.toLowerCase().replace('-', ''));
        hash.update(Buffer.from(data));
        return hash.digest();
      }
    }
  } as any;
}

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  // Créer l'application
  const app = await NestFactory.create(AppModule);

  // Configuration basique
  app.setGlobalPrefix('api/v1', {
    exclude: ['/'], // Exclure la route racine
  });

  // CORS - Configure with environment variable for production
  const corsOrigin = process.env.CORS_ORIGIN || process.env.FRONTEND_URL || '*';
  app.enableCors({
    origin: corsOrigin === '*' ? true : corsOrigin.split(',').map(o => o.trim()),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['Content-Range', 'X-Total-Count'],
  });

  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }));

  // Port
  const port = process.env.PORT || 3000;
  
  // Démarrer le serveur
  await app.listen(port);
  
  // Messages de démarrage
  console.log(`Application is running on: http://localhost:${port}`);
  console.log(`API is available at: http://localhost:${port}/api/v1`);
}

bootstrap();