# SwaggerModule - Documentation API

## 📋 Vue d'ensemble

Le SwaggerModule fournit une documentation API automatique et interactive avec des fonctionnalités avancées :

- **Documentation OpenAPI 3.0** complète
- **Interface interactive** pour tester les endpoints
- **Authentification JWT/Cookie** intégrée
- **Validation des schémas** automatique
- **Personnalisation complète** (thème, titre, etc.)
- **Sécurité production** avec désactivation conditionnelle
- **Types TypeScript** générés automatiquement

## 🚀 Installation

```bash
npm install @nestjs/swagger swagger-ui-express
```

## ⚙️ Configuration

### Variables d'environnement

```bash
# .env
SWAGGER_ENABLED=true
SWAGGER_TITLE=Entrix API
SWAGGER_DESCRIPTION=Documentation complète de l'API Entrix
SWAGGER_VERSION=1.0.0
SWAGGER_PATH=api/docs
SWAGGER_AUTH_TYPE=bearer          # bearer, cookie, none
SWAGGER_TAGS=auth,users,events,orders,payments
```

### Configuration Avancée

```bash
# Configuration étendue
SWAGGER_CONTACT_NAME=Équipe Entrix
SWAGGER_CONTACT_EMAIL=dev@entrix.tn
SWAGGER_CONTACT_URL=https://entrix.tn/support
SWAGGER_LICENSE_NAME=MIT
SWAGGER_LICENSE_URL=https://opensource.org/licenses/MIT
SWAGGER_SERVERS=https://api.entrix.tn,https://staging-api.entrix.tn
```

## 🔧 Utilisation

### Configuration dans main.ts

```typescript
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { SwaggerService } from '@shared/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Configuration Swagger
  const configService = app.get(ConfigService);
  const swaggerConfig = configService.get('swagger');
  
  if (swaggerConfig.enabled) {
    SwaggerService.setup(app, swaggerConfig);
    console.log(`📚 Swagger UI disponible sur: http://localhost:3000/${swaggerConfig.path}`);
  }
  
  await app.listen(3000);
}
bootstrap();
```

### Configuration Conditionnelle

```typescript
// Configuration avec conditions
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Swagger uniquement en développement et staging
  if (process.env.NODE_ENV !== 'production') {
    const configService = app.get(ConfigService);
    const swaggerConfig = configService.get('swagger');
    
    SwaggerService.setup(app, {
      ...swaggerConfig,
      title: `${swaggerConfig.title} - ${process.env.NODE_ENV.toUpperCase()}`,
      description: `${swaggerConfig.description} (Environment: ${process.env.NODE_ENV})`
    });
  }
  
  await app.listen(3000);
}
```

## 🛠️ Documentation des Contrôleurs

### Contrôleur de Base

```typescript
import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { CreateUserDto, UserResponseDto } from './dto';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  
  @Get()
  @ApiOperation({ 
    summary: 'Récupérer tous les utilisateurs',
    description: 'Retourne la liste paginée de tous les utilisateurs actifs'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Liste des utilisateurs récupérée avec succès',
    type: [UserResponseDto]
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Accès refusé'
  })
  findAll() {
    return this.usersService.findAll();
  }
  
  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un utilisateur par ID' })
  @ApiParam({ 
    name: 'id', 
    description: 'ID unique de l\'utilisateur',
    example: 'user_123456'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Utilisateur trouvé',
    type: UserResponseDto
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Utilisateur non trouvé'
  })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }
  
  @Post()
  @ApiOperation({ summary: 'Créer un nouvel utilisateur' })
  @ApiResponse({ 
    status: 201, 
    description: 'Utilisateur créé avec succès',
    type: UserResponseDto
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Données invalides'
  })
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }
}
```

### Contrôleur Avancé avec Authentification

```typescript
import { 
  Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards 
} from '@nestjs/common';
import { 
  ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, 
  ApiBearerAuth, ApiSecurity, ApiHeader 
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@shared/auth';

@ApiTags('Events')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('events')
export class EventsController {
  
  @Get()
  @ApiOperation({ 
    summary: 'Rechercher des événements',
    description: 'Recherche paginée d\'événements avec filtres'
  })
  @ApiQuery({ 
    name: 'page', 
    required: false, 
    description: 'Numéro de page',
    example: 1
  })
  @ApiQuery({ 
    name: 'limit', 
    required: false, 
    description: 'Nombre d\'éléments par page',
    example: 20
  })
  @ApiQuery({ 
    name: 'category', 
    required: false, 
    description: 'Catégorie d\'événement',
    enum: ['concert', 'conference', 'sport', 'theatre']
  })
  @ApiQuery({ 
    name: 'city', 
    required: false, 
    description: 'Ville de l\'événement',
    example: 'Tunis'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Événements trouvés',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/EventResponseDto' }
        },
        total: { type: 'number', example: 150 },
        page: { type: 'number', example: 1 },
        limit: { type: 'number', example: 20 }
      }
    }
  })
  findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('category') category?: string,
    @Query('city') city?: string
  ) {
    return this.eventsService.findAll({ page, limit, category, city });
  }
  
  @Post()
  @ApiOperation({ 
    summary: 'Créer un événement',
    description: 'Crée un nouvel événement (organisateurs seulement)'
  })
  @ApiHeader({
    name: 'X-Organization-ID',
    description: 'ID de l\'organisation',
    required: true
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Événement créé avec succès'
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Permissions insuffisantes'
  })
  create(@Body() createEventDto: CreateEventDto) {
    return this.eventsService.create(createEventDto);
  }
}
```

## 📝 Documentation des DTOs

### DTO avec Validation

```typescript
import { IsString, IsEmail, IsOptional, IsEnum, IsDate, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({
    description: 'Prénom de l\'utilisateur',
    example: 'John',
    minLength: 2,
    maxLength: 50
  })
  @IsString()
  firstName: string;

  @ApiProperty({
    description: 'Nom de famille de l\'utilisateur',
    example: 'Doe',
    minLength: 2,
    maxLength: 50
  })
  @IsString()
  lastName: string;

  @ApiProperty({
    description: 'Adresse email unique',
    example: 'john.doe@example.com',
    format: 'email'
  })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({
    description: 'Numéro de téléphone',
    example: '+216 12 345 678',
    pattern: '^\\+216 [0-9]{2} [0-9]{3} [0-9]{3}$'
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({
    description: 'Date de naissance',
    example: '1990-01-15',
    type: Date
  })
  @IsDate()
  birthDate: Date;

  @ApiProperty({
    description: 'Rôle de l\'utilisateur',
    enum: ['user', 'organizer', 'admin'],
    example: 'user'
  })
  @IsEnum(['user', 'organizer', 'admin'])
  role: string;
}
```

### DTO de Réponse

```typescript
import { ApiProperty } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty({
    description: 'Identifiant unique de l\'utilisateur',
    example: 'user_123456789'
  })
  id: string;

  @ApiProperty({
    description: 'Nom complet de l\'utilisateur',
    example: 'John Doe'
  })
  fullName: string;

  @ApiProperty({
    description: 'Adresse email',
    example: 'john.doe@example.com'
  })
  email: string;

  @ApiProperty({
    description: 'Statut du compte',
    enum: ['active', 'pending', 'suspended'],
    example: 'active'
  })
  status: string;

  @ApiProperty({
    description: 'Date de création du compte',
    example: '2024-01-15T10:30:00Z'
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Date de dernière connexion',
    example: '2024-01-20T14:45:00Z',
    nullable: true
  })
  lastLoginAt: Date | null;

  @ApiProperty({
    description: 'Profil utilisateur',
    type: 'object',
    properties: {
      avatar: { type: 'string', example: 'https://example.com/avatar.jpg' },
      bio: { type: 'string', example: 'Passionné de musique' },
      preferences: {
        type: 'object',
        properties: {
          notifications: { type: 'boolean', example: true },
          theme: { type: 'string', enum: ['light', 'dark'], example: 'dark' }
        }
      }
    }
  })
  profile: {
    avatar?: string;
    bio?: string;
    preferences: {
      notifications: boolean;
      theme: 'light' | 'dark';
    };
  };
}
```

## 🔐 Sécurité et Authentification

### Configuration JWT

```typescript
// Dans SwaggerService
public static setup(app: INestApplication, config: SwaggerModuleConfig) {
  const document = SwaggerModule.createDocument(app, {
    openapi: '3.0.0',
    info: {
      title: config.title,
      description: config.description,
      version: config.version,
    },
    servers: config.servers?.map(url => ({ url })),
    components: {
      securitySchemes: {
        bearer: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Token JWT obtenu via /auth/login'
        },
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'jwt-token',
          description: 'Token JWT stocké dans un cookie'
        }
      }
    },
    security: config.authType === 'bearer' ? [{ bearer: [] }] : 
             config.authType === 'cookie' ? [{ cookieAuth: [] }] : []
  });
  
  SwaggerModule.setup(config.path, app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha'
    }
  });
}
```

### Authentification dans les Contrôleurs

```typescript
// Authentification Bearer
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('protected')
export class ProtectedController {
  
  @Get()
  @ApiOperation({ summary: 'Endpoint protégé' })
  @ApiResponse({ status: 401, description: 'Token invalide ou manquant' })
  getProtectedData() {
    return { message: 'Données protégées' };
  }
}

// Authentification par Cookie
@ApiSecurity('cookieAuth')
@UseGuards(CookieAuthGuard)
@Controller('admin')
export class AdminController {
  
  @Get()
  @ApiOperation({ summary: 'Panel administrateur' })
  @ApiResponse({ status: 403, description: 'Permissions insuffisantes' })
  getAdminData() {
    return { message: 'Données administrateur' };
  }
}
```

## 🎨 Personnalisation

### Thème et Apparence

```typescript
// Configuration avancée du thème
SwaggerModule.setup(config.path, app, document, {
  customSiteTitle: 'Entrix API Documentation',
  customfavIcon: '/favicon.ico',
  customJs: [
    'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/3.47.1/swagger-ui-standalone-preset.js',
  ],
  customCssUrl: [
    'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/3.47.1/swagger-ui.css',
  ],
  customCss: `
    .swagger-ui .topbar { display: none; }
    .swagger-ui .info { margin: 50px 0; }
    .swagger-ui .info .title { color: #2c3e50; }
    .swagger-ui .scheme-container { background: #f8f9fa; }
  `,
  swaggerOptions: {
    deepLinking: true,
    displayOperationId: false,
    defaultModelsExpandDepth: 1,
    defaultModelExpandDepth: 1,
    defaultModelRendering: 'example',
    displayRequestDuration: true,
    docExpansion: 'none',
    filter: true,
    maxDisplayedTags: 10,
    operationsSorter: 'alpha',
    showExtensions: true,
    showCommonExtensions: true,
    tagsSorter: 'alpha',
    tryItOutEnabled: true,
    requestInterceptor: (request) => {
      request.headers['X-Custom-Header'] = 'EntrixAPI';
      return request;
    },
    responseInterceptor: (response) => {
      console.log('Response:', response);
      return response;
    }
  }
});
```

### Génération de Documentation

```typescript
// Génération automatique de la documentation
@Injectable()
export class SwaggerGeneratorService {
  constructor(private readonly swaggerService: SwaggerService) {}

  async generateApiDocs(app: INestApplication) {
    const document = SwaggerModule.createDocument(app, {
      openapi: '3.0.0',
      info: {
        title: 'Entrix API',
        description: 'API complète pour la plateforme Entrix',
        version: '1.0.0',
        contact: {
          name: 'Équipe Entrix',
          email: 'dev@entrix.tn',
          url: 'https://entrix.tn'
        },
        license: {
          name: 'MIT',
          url: 'https://opensource.org/licenses/MIT'
        }
      },
      externalDocs: {
        description: 'Documentation complète',
        url: 'https://docs.entrix.tn'
      },
      tags: [
        { name: 'Auth', description: 'Authentification et autorisation' },
        { name: 'Users', description: 'Gestion des utilisateurs' },
        { name: 'Events', description: 'Gestion des événements' },
        { name: 'Orders', description: 'Gestion des commandes' },
        { name: 'Payments', description: 'Traitement des paiements' }
      ]
    });

    // Sauvegarder la documentation
    await this.saveDocumentation(document);
    
    return document;
  }

  private async saveDocumentation(document: any) {
    const fs = require('fs');
    const path = require('path');
    
    // Sauvegarder en JSON
    fs.writeFileSync(
      path.join(process.cwd(), 'docs', 'api-spec.json'),
      JSON.stringify(document, null, 2)
    );
    
    // Sauvegarder en YAML
    const yaml = require('js-yaml');
    fs.writeFileSync(
      path.join(process.cwd(), 'docs', 'api-spec.yaml'),
      yaml.dump(document)
    );
  }
}
```

## 🔧 Exemples Pratiques

### API d'Événements Complète

```typescript
@ApiTags('Events')
@Controller('events')
export class EventsController {
  
  @Get()
  @ApiOperation({
    summary: 'Rechercher des événements',
    description: `
      Recherche paginée d'événements avec filtres avancés.
      
      **Fonctionnalités:**
      - Pagination avec curseur
      - Filtres par catégorie, ville, date
      - Tri par popularité, date, prix
      - Recherche textuelle
    `
  })
  @ApiQuery({ name: 'q', required: false, description: 'Recherche textuelle' })
  @ApiQuery({ name: 'category', required: false, enum: ['concert', 'conference', 'sport'] })
  @ApiQuery({ name: 'city', required: false, example: 'Tunis' })
  @ApiQuery({ name: 'startDate', required: false, type: Date })
  @ApiQuery({ name: 'endDate', required: false, type: Date })
  @ApiQuery({ name: 'minPrice', required: false, type: Number })
  @ApiQuery({ name: 'maxPrice', required: false, type: Number })
  @ApiQuery({ name: 'sort', required: false, enum: ['date', 'price', 'popularity'] })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiResponse({
    status: 200,
    description: 'Événements trouvés',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/EventResponseDto' }
        },
        pagination: {
          type: 'object',
          properties: {
            total: { type: 'number', example: 150 },
            page: { type: 'number', example: 1 },
            limit: { type: 'number', example: 20 },
            totalPages: { type: 'number', example: 8 },
            hasNext: { type: 'boolean', example: true },
            hasPrev: { type: 'boolean', example: false }
          }
        }
      }
    }
  })
  async findAll(@Query() query: SearchEventsDto) {
    return this.eventsService.search(query);
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('organizer', 'admin')
  @ApiOperation({
    summary: 'Créer un événement',
    description: 'Crée un nouvel événement (organisateurs uniquement)'
  })
  @ApiResponse({
    status: 201,
    description: 'Événement créé avec succès',
    type: EventResponseDto
  })
  @ApiResponse({
    status: 400,
    description: 'Données invalides',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: { 
          type: 'array',
          items: { type: 'string' },
          example: ['name should not be empty', 'date must be a valid date']
        },
        error: { type: 'string', example: 'Bad Request' }
      }
    }
  })
  async create(@Body() createEventDto: CreateEventDto) {
    return this.eventsService.create(createEventDto);
  }
}
```

### API de Paiements

```typescript
@ApiTags('Payments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('payments')
export class PaymentsController {
  
  @Post('process')
  @ApiOperation({
    summary: 'Traiter un paiement',
    description: `
      Traite un paiement pour une commande.
      
      **Méthodes supportées:**
      - Carte bancaire (Visa, Mastercard)
      - Portefeuille mobile
      - Virement bancaire
      
      **Sécurité:**
      - Chiffrement TLS 1.3
      - Tokenisation des données bancaires
      - Validation 3D Secure
    `
  })
  @ApiResponse({
    status: 200,
    description: 'Paiement traité avec succès',
    schema: {
      type: 'object',
      properties: {
        paymentId: { type: 'string', example: 'pay_123456789' },
        status: { type: 'string', enum: ['completed', 'pending', 'failed'] },
        amount: { type: 'number', example: 150.00 },
        currency: { type: 'string', example: 'TND' },
        transactionId: { type: 'string', example: 'txn_987654321' },
        receiptUrl: { type: 'string', example: 'https://api.entrix.tn/receipts/123' }
      }
    }
  })
  @ApiResponse({
    status: 402,
    description: 'Paiement refusé',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 402 },
        message: { type: 'string', example: 'Insufficient funds' },
        errorCode: { type: 'string', example: 'INSUFFICIENT_FUNDS' },
        details: {
          type: 'object',
          properties: {
            cardLast4: { type: 'string', example: '4242' },
            declineCode: { type: 'string', example: 'insufficient_funds' }
          }
        }
      }
    }
  })
  async processPayment(@Body() paymentDto: ProcessPaymentDto) {
    return this.paymentsService.process(paymentDto);
  }
}
```

### Webhooks et Callbacks

```typescript
@ApiTags('Webhooks')
@Controller('webhooks')
export class WebhooksController {
  
  @Post('stripe')
  @ApiOperation({
    summary: 'Webhook Stripe',
    description: 'Endpoint pour recevoir les événements Stripe'
  })
  @ApiHeader({
    name: 'stripe-signature',
    description: 'Signature Stripe pour validation',
    required: true
  })
  @ApiResponse({
    status: 200,
    description: 'Webhook traité avec succès',
    schema: {
      type: 'object',
      properties: {
        received: { type: 'boolean', example: true },
        processed: { type: 'boolean', example: true },
        eventType: { type: 'string', example: 'payment_intent.succeeded' }
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: 'Signature invalide ou événement non supporté'
  })
  async handleStripeWebhook(
    @Body() payload: any,
    @Headers('stripe-signature') signature: string
  ) {
    return this.webhooksService.handleStripe(payload, signature);
  }
}
```

## 🚀 Déploiement et Sécurité

### Configuration Production

```typescript
// Configuration sécurisée pour la production
const swaggerConfig = {
  enabled: process.env.NODE_ENV !== 'production',
  title: 'Entrix API',
  description: 'API Documentation - Internal Use Only',
  version: process.env.API_VERSION || '1.0.0',
  path: 'internal/docs', // Chemin moins évident
  authType: 'bearer',
  servers: [process.env.API_URL]
};

// Protection par IP
if (swaggerConfig.enabled) {
  app.use('/internal/docs', (req, res, next) => {
    const allowedIPs = process.env.ALLOWED_IPS?.split(',') || ['127.0.0.1'];
    const clientIP = req.ip || req.connection.remoteAddress;
    
    if (!allowedIPs.includes(clientIP)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    next();
  });
}
```

### Sécurité Avancée

```typescript
// Middleware de sécurité pour Swagger
@Injectable()
export class SwaggerSecurityMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Vérifier l'authentification
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token || !this.isValidToken(token)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    // Vérifier les permissions
    const user = this.getUserFromToken(token);
    if (!user.roles.includes('admin') && !user.roles.includes('developer')) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    next();
  }
  
  private isValidToken(token: string): boolean {
    // Validation du token JWT
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      return !!decoded;
    } catch {
      return false;
    }
  }
}
```

### Monitoring et Analytics

```typescript
// Monitoring des accès à la documentation
@Injectable()
export class SwaggerAnalyticsService {
  constructor(private readonly logger: LoggerService) {}

  logAccess(req: Request) {
    this.logger.logApiEvent(
      req.method,
      req.url,
      200,
      0,
      req.user?.id,
      req.ip,
      req.headers['user-agent'],
      {
        section: 'swagger-docs',
        referer: req.headers.referer,
        timestamp: new Date()
      }
    );
  }

  async getUsageStats() {
    // Statistiques d'utilisation de la documentation
    return {
      totalViews: await this.getTotalViews(),
      uniqueUsers: await this.getUniqueUsers(),
      topEndpoints: await this.getTopEndpoints(),
      lastAccess: await this.getLastAccess()
    };
  }
}
```

## 🔧 Bonnes Pratiques

### 1. Organisation des Tags

```typescript
// ✅ Bon - Tags organisés par domaine
@ApiTags('Users Management')
@Controller('users')

@ApiTags('Events Management')
@Controller('events')

@ApiTags('Payments Processing')
@Controller('payments')
```

### 2. Documentation Complète

```typescript
// ✅ Bon - Documentation détaillée
@ApiOperation({
  summary: 'Créer un utilisateur',
  description: `
    Crée un nouvel utilisateur dans le système.
    
    **Prérequis:**
    - Token JWT valide
    - Permissions administrateur
    
    **Validation:**
    - Email unique
    - Mot de passe fort (8+ caractères)
    - Âge minimum 18 ans
  `
})
@ApiResponse({
  status: 201,
  description: 'Utilisateur créé avec succès',
  type: UserResponseDto
})
@ApiResponse({
  status: 409,
  description: 'Email déjà utilisé',
  schema: {
    type: 'object',
    properties: {
      statusCode: { type: 'number', example: 409 },
      message: { type: 'string', example: 'Email already exists' },
      error: { type: 'string', example: 'Conflict' }
    }
  }
})
```

### 3. Sécurité

```typescript
// ✅ Bon - Sécurité par défaut
// Désactiver en production
SWAGGER_ENABLED=false

// Chemin non évident
SWAGGER_PATH=internal/api-docs

// Protection par authentification
@ApiBearerAuth()
app.use('/internal/api-docs', authMiddleware);
```

---

## 📚 Ressources

- [OpenAPI 3.0 Specification](https://swagger.io/specification/)
- [NestJS Swagger Documentation](https://docs.nestjs.com/openapi/introduction)
- [Swagger UI Configuration](https://swagger.io/docs/open-source-tools/swagger-ui/usage/configuration/)

**Le SwaggerModule est maintenant prêt pour une utilisation professionnelle ! 📚**