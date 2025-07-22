# Module Shared ENtrix - Guide Développeur

## 🏗️ Vue d'ensemble

Le module Shared ENtrix fournit un ensemble de services centralisés et optimisés pour votre application NestJS. Ce module de **grade A+** offre une architecture robuste, des métriques intégrées et une gestion avancée des erreurs.

### Services Inclus

- **PrismaService** - ORM avec retry automatique et métriques
- **RedisService** - Cache distribué avec verrous et sessions
- **BullmqService** - Files d'attente avec priorités et monitoring
- **EmailService** - Emails transactionnels avec templates
- **LoggerService** - Logging structuré avec événements business
- **RateLimitingService** - Protection API avec Redis
- **SwaggerService** - Documentation automatique

---

## 📦 Installation

### 1. Installation des dépendances

```bash
npm install @nestjs/common @nestjs/config @nestjs/core
npm install prisma @prisma/client
npm install ioredis bullmq
npm install nodemailer handlebars
npm install winston winston-daily-rotate-file
npm install joi
```

### 2. Configuration environnement

Créez un fichier `.env` avec les variables suivantes :

```env
# Base de données
DATABASE_URL="postgresql://user:password@localhost:5432/entrix_db"
PRISMA_LOG_LEVEL=info

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
REDIS_TLS=false

# Email
EMAIL_FROM=noreply@entrix.tn
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_SECURE=false
EMAIL_PROVIDER=smtp
EMAIL_TEMPLATES_PATH=./templates/emails

# Logging
LOG_LEVEL=info
LOG_FORMAT=json
LOG_ENABLE_CONSOLE=true
LOG_ENABLE_FILE=true
LOG_FILE_PATH=./logs/entrix-%DATE%.log

# BullMQ
BULLMQ_PREFIX=bullmq
BULLMQ_CONCURRENCY=5

# Swagger
SWAGGER_ENABLED=true
SWAGGER_TITLE=Entrix API
SWAGGER_VERSION=1.0
SWAGGER_PATH=api/docs
```

### 3. Intégration dans votre application

```typescript
// app.module.ts
import { Module } from '@nestjs/common';
import { SharedModule } from './shared/shared.module';

@Module({
  imports: [
    SharedModule, // Importer le module shared
    // ... autres modules
  ],
})
export class AppModule {}
```

---

## 🗄️ PrismaService

### Méthodes Principales

#### Opérations de base

```typescript
import { PrismaService } from '@shared/prisma';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  // Opération simple
  async findUser(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: { profile: true }
    });
  }

  // Opération avec pagination
  async getUsers(page: number = 1, limit: number = 10) {
    return this.prisma.paginate(
      this.prisma.user,
      {
        where: { active: true },
        orderBy: { createdAt: 'desc' }
      },
      page,
      limit
    );
  }

  // Pagination avec curseur
  async getUsersCursor(cursor?: string, limit: number = 10) {
    return this.prisma.cursorPaginate(
      this.prisma.user,
      {
        where: { active: true },
        orderBy: { createdAt: 'desc' }
      },
      cursor,
      limit
    );
  }
}
```

#### Opérations avec retry

```typescript
// Opération avec retry automatique
async updateUserWithRetry(id: string, data: any) {
  return this.prisma.executeWithRetry(
    () => this.prisma.user.update({ where: { id }, data }),
    3,    // 3 tentatives
    1000  // 1 seconde de délai
  );
}

// Transaction avec retry
async createUserWithProfile(userData: any, profileData: any) {
  return this.prisma.transactionWithRetry(async (tx) => {
    const user = await tx.user.create({
      data: userData
    });
    
    const profile = await tx.userProfile.create({
      data: {
        ...profileData,
        userId: user.id
      }
    });
    
    return { user, profile };
  });
}
```

#### Opérations batch

```typescript
// Opérations en batch
async createMultipleUsers(usersData: any[]) {
  const operations = usersData.map(userData => 
    () => this.prisma.user.create({ data: userData })
  );
  
  return this.prisma.batchOperation(operations, 5); // Batch de 5
}
```

#### Queries raw avec métriques

```typescript
// Query raw avec métriques
async getUserStats() {
  return this.prisma.queryRawWithMetrics`
    SELECT 
      COUNT(*) as total,
      COUNT(CASE WHEN active = true THEN 1 END) as active
    FROM users
  `;
}

// Query unsafe avec métriques
async getUsersByCity(city: string) {
  return this.prisma.queryRawUnsafeWithMetrics(
    'SELECT * FROM users WHERE city = $1',
    city
  );
}
```

#### Health check et métriques

```typescript
// Health check
async checkDatabaseHealth() {
  return this.prisma.healthCheck();
}

// Métriques
async getDatabaseMetrics() {
  return this.prisma.getMetrics();
}
```

---

## 🔄 RedisService

### Méthodes Principales

#### Opérations de base

```typescript
import { RedisService } from '@shared/redis';

@Injectable()
export class CacheService {
  constructor(private redis: RedisService) {}

  // Opérations string simples
  async cacheData(key: string, value: string, ttl: number = 3600) {
    await this.redis.set(key, value, ttl);
  }

  async getCachedData(key: string) {
    return this.redis.get(key);
  }

  // Opérations avec objets (JSON)
  async cacheObject<T>(key: string, obj: T, ttl: number = 3600) {
    await this.redis.setCache(key, obj, ttl);
  }

  async getCachedObject<T>(key: string): Promise<T | null> {
    return this.redis.getCache<T>(key);
  }
}
```

#### Verrous distribués

```typescript
// Acquisition manuelle de verrou
async processWithLock(userId: string) {
  const lockKey = `user:${userId}`;
  const lockAcquired = await this.redis.acquireLock(lockKey, 30); // 30 secondes
  
  if (!lockAcquired) {
    throw new Error('Resource is locked');
  }
  
  try {
    // Opération critique
    await this.performCriticalOperation(userId);
  } finally {
    await this.redis.releaseLock(lockKey);
  }
}

// Verrou automatique avec callback
async processWithAutoLock(userId: string) {
  return this.redis.withLock(`user:${userId}`, async () => {
    // Opération critique - le verrou est automatiquement géré
    return await this.performCriticalOperation(userId);
  }, 30); // 30 secondes de timeout
}
```

#### Gestion des sessions

```typescript
// Sessions utilisateur
async createUserSession(sessionId: string, userData: any) {
  await this.redis.setSession(sessionId, userData, 86400); // 24h
}

async getUserSession(sessionId: string) {
  return this.redis.getSession(sessionId);
}

async destroyUserSession(sessionId: string) {
  await this.redis.delSession(sessionId);
}
```

#### Compteurs et opérations avancées

```typescript
// Compteur avec TTL
async incrementCounter(key: string, ttl: number = 3600) {
  return this.redis.increment(key, ttl);
}

// Vérification d'existence
async keyExists(key: string) {
  return this.redis.exists(key);
}

// Définir expiration
async setExpiration(key: string, ttl: number) {
  return this.redis.expire(key, ttl);
}

// Recherche par pattern
async findKeys(pattern: string) {
  return this.redis.keys(pattern);
}

// Nettoyage
async cleanupExpired() {
  return this.redis.cleanup('cache:expired:*');
}
```

#### Métriques et monitoring

```typescript
// Métriques Redis
async getRedisMetrics() {
  return this.redis.getMetrics();
}

// Test de connexion
async testRedisConnection() {
  const ping = await this.redis.ping();
  return ping === 'PONG';
}

// Informations serveur
async getRedisInfo() {
  return this.redis.info();
}
```

---

## 📬 BullmqService

### Méthodes Principales

#### Création de jobs

```typescript
import { BullmqService } from '@shared/bullmq';
import { QUEUE_NAMES, JOB_TYPES } from '@shared/bullmq/bullmq.constants';

@Injectable()
export class TaskService {
  constructor(private bullmq: BullmqService) {}

  // Job simple
  async addSimpleJob(data: any) {
    return this.bullmq.addJob(QUEUE_NAMES.EMAIL, 'send-email', data);
  }

  // Job avec priorité
  async addPriorityJob(data: any) {
    return this.bullmq.addPriorityJob(
      QUEUE_NAMES.EMAIL,
      JOB_TYPES.EMAIL.SEND_WELCOME,
      data,
      'HIGH'
    );
  }

  // Job délayé
  async addDelayedJob(data: any, delayMs: number) {
    return this.bullmq.addDelayedJob(
      QUEUE_NAMES.EMAIL,
      JOB_TYPES.EMAIL.SEND_REMINDER,
      data,
      delayMs
    );
  }

  // Job récurrent
  async addRecurringJob(data: any) {
    return this.bullmq.addRecurringJob(
      QUEUE_NAMES.REPORTS,
      JOB_TYPES.REPORTS.GENERATE_SALES_REPORT,
      data,
      '0 8 * * *' // Tous les jours à 8h
    );
  }
}
```

#### Méthodes spécialisées

```typescript
// Emails
async sendWelcomeEmail(userId: string, email: string, firstName: string) {
  return this.bullmq.sendWelcomeEmail(userId, email, firstName);
}

async sendVerificationEmail(userId: string, email: string, token: string) {
  return this.bullmq.sendVerificationEmail(userId, email, token);
}

async sendPasswordResetEmail(userId: string, email: string, token: string) {
  return this.bullmq.sendPasswordResetEmail(userId, email, token);
}

// Paiements
async processPayment(paymentData: any) {
  return this.bullmq.processPayment(paymentData);
}

// Notifications
async sendPushNotification(notificationData: any) {
  return this.bullmq.sendPushNotification(notificationData);
}

// Rapports
async generateSalesReport(reportData: any) {
  return this.bullmq.generateSalesReport(reportData);
}
```

#### Gestion des workers

```typescript
// Créer un worker personnalisé
async createEmailWorker() {
  return this.bullmq.createWorker(
    QUEUE_NAMES.EMAIL,
    async (job) => {
      const { type, data } = job.data;
      
      switch (type) {
        case 'welcome':
          return await this.processWelcomeEmail(data);
        case 'verification':
          return await this.processVerificationEmail(data);
        default:
          throw new Error(`Unknown job type: ${type}`);
      }
    },
    5 // Concurrence
  );
}
```

#### Monitoring et gestion

```typescript
// Statistiques d'une queue
async getQueueStats(queueName: string) {
  return this.bullmq.getQueueStats(queueName);
}

// Métriques globales
async getBullmqMetrics() {
  return this.bullmq.getMetrics();
}

// Gestion des queues
async pauseEmailQueue() {
  await this.bullmq.pauseQueue(QUEUE_NAMES.EMAIL);
}

async resumeEmailQueue() {
  await this.bullmq.resumeQueue(QUEUE_NAMES.EMAIL);
}

// Nettoyage
async cleanupQueues() {
  await this.bullmq.cleanupQueues();
}
```

---

## 📧 EmailService

### Méthodes Principales

#### Envoi d'emails

```typescript
import { EmailService } from '@shared/email';

@Injectable()
export class NotificationService {
  constructor(private email: EmailService) {}

  // Email avec template
  async sendWelcomeEmail(email: string, firstName: string) {
    return this.email.sendWelcomeEmail(email, firstName);
  }

  // Email personnalisé
  async sendCustomEmail(to: string, subject: string, templateData: any) {
    return this.email.sendMail({
      to,
      subject,
      template: 'custom-notification',
      context: templateData
    });
  }

  // Email avec pièce jointe
  async sendInvoiceEmail(to: string, invoiceData: any, pdfPath: string) {
    return this.email.sendMail({
      to,
      subject: `Facture ${invoiceData.number}`,
      template: 'invoice',
      context: invoiceData,
      attachments: [
        {
          filename: 'facture.pdf',
          path: pdfPath,
          contentType: 'application/pdf'
        }
      ]
    });
  }
}
```

#### Méthodes spécialisées

```typescript
// Emails d'authentification
async sendVerificationEmail(email: string, token: string) {
  return this.email.sendVerificationEmail(email, token);
}

async sendPasswordResetEmail(email: string, token: string) {
  return this.email.sendPasswordResetEmail(email, token);
}

// Emails événements
async sendTicketEmail(email: string, ticketData: any, eventData: any, orderData: any) {
  return this.email.sendTicketPurchaseEmail(email, ticketData, eventData, orderData);
}

async sendEventReminder(email: string, eventData: any, reminderType: '24h' | '1h' | '30min') {
  return this.email.sendEventReminderEmail(email, eventData, reminderType);
}

// Emails paiement
async sendPaymentReceipt(email: string, paymentData: any, orderData: any) {
  return this.email.sendPaymentReceiptEmail(email, paymentData, orderData);
}

// Emails organisateur
async sendOrganizerNotification(email: string, type: string, data: any) {
  return this.email.sendOrganizerNotificationEmail(email, type, data);
}
```

#### Utilitaires

```typescript
// Test de connexion
async testEmailConnection() {
  return this.email.testConnection();
}

// Prévisualisation template
async previewEmailTemplate(templateName: string, context: any) {
  return this.email.previewTemplate(templateName, context);
}

// Templates disponibles
async getAvailableTemplates() {
  return this.email.getAvailableTemplates();
}

// Métriques
async getEmailMetrics() {
  return this.email.getMetrics();
}

// Informations service
async getEmailServiceInfo() {
  return this.email.getServiceInfo();
}
```

---

## 📊 LoggerService

### Méthodes Principales

#### Logging de base

```typescript
import { LoggerService } from '@shared/logger';

@Injectable()
export class UserService {
  private logger: LoggerService;

  constructor(logger: LoggerService) {
    this.logger = logger.createChildLogger('UserService');
  }

  async createUser(userData: any) {
    this.logger.info('Creating new user', { email: userData.email });
    
    try {
      const user = await this.userRepository.create(userData);
      this.logger.info('User created successfully', { userId: user.id });
      return user;
    } catch (error) {
      this.logger.error('Failed to create user', error.stack, { userData });
      throw error;
    }
  }
}
```

#### Logging business

```typescript
// Événements business
async processOrder(orderData: any) {
  const orderId = generateOrderId();
  
  this.logger.logBusinessEvent('ORDER_CREATED', {
    orderId,
    amount: orderData.amount,
    currency: 'TND',
    items: orderData.items.length
  }, orderData.userId, orderData.organizerId);
  
  // ... traitement
  
  this.logger.logBusinessEvent('ORDER_PROCESSED', {
    orderId,
    status: 'completed',
    processingTime: Date.now() - startTime
  }, orderData.userId, orderData.organizerId);
}

// Événements de paiement
async processPayment(paymentData: any) {
  this.logger.logPaymentEvent(
    paymentData.orderId,
    paymentData.amount,
    'TND',
    'processing',
    'stripe',
    { transactionId: paymentData.transactionId }
  );
  
  // ... traitement paiement
  
  this.logger.logPaymentEvent(
    paymentData.orderId,
    paymentData.amount,
    'TND',
    'completed',
    'stripe',
    { transactionId: paymentData.transactionId }
  );
}
```

#### Logging sécurité

```typescript
// Événements de sécurité
async handleSuspiciousActivity(req: Request, userId: string) {
  this.logger.logSecurityEvent(
    'SUSPICIOUS_ACTIVITY_DETECTED',
    userId,
    req.ip,
    req.headers['user-agent'],
    {
      endpoint: req.url,
      method: req.method,
      headers: req.headers
    }
  );
}

// Événements d'authentification
async handleLogin(userId: string, email: string, req: Request) {
  this.logger.logAuthEvent(
    'login',
    userId,
    email,
    req.ip,
    req.headers['user-agent']
  );
}

async handleFailedLogin(email: string, req: Request) {
  this.logger.logAuthEvent(
    'failed_login',
    undefined,
    email,
    req.ip,
    req.headers['user-agent'],
    { reason: 'invalid_credentials' }
  );
}
```

#### Logging performance

```typescript
// Monitoring de performance
async performExpensiveOperation() {
  const startTime = Date.now();
  
  try {
    const result = await this.expensiveOperation();
    
    this.logger.logPerformanceEvent(
      'expensive_operation',
      Date.now() - startTime,
      { resultSize: result.length }
    );
    
    return result;
  } catch (error) {
    this.logger.logPerformanceEvent(
      'expensive_operation_failed',
      Date.now() - startTime,
      { error: error.message }
    );
    throw error;
  }
}

// Suivi d'opération
async complexOperation() {
  const operationId = this.logger.startOperation('complex_operation', {
    initiator: 'user_123'
  });
  
  try {
    const result = await this.performComplexLogic();
    
    this.logger.endOperation(
      'complex_operation',
      operationId,
      true,
      Date.now() - startTime,
      { resultCount: result.length }
    );
    
    return result;
  } catch (error) {
    this.logger.endOperation(
      'complex_operation',
      operationId,
      false,
      Date.now() - startTime,
      { error: error.message }
    );
    throw error;
  }
}
```

#### Logging spécialisé

```typescript
// Événements API
async logApiRequest(req: Request, res: Response, duration: number) {
  this.logger.logApiEvent(
    req.method,
    req.url,
    res.statusCode,
    duration,
    req.user?.id,
    req.ip,
    req.headers['user-agent']
  );
}

// Événements de cache
async logCacheOperation(operation: string, key: string, ttl?: number) {
  this.logger.logCacheEvent(operation, key, ttl);
}

// Événements de job
async logJobProcessing(jobType: string, jobId: string, duration?: number) {
  this.logger.logJobEvent('processing', jobType, jobId, duration);
}

// Événements de notification
async logNotificationSent(type: string, recipient: string, notificationId?: string) {
  this.logger.logNotificationEvent('sent', type, recipient, notificationId);
}

// Logging structuré
async logCustomEvent(data: any) {
  this.logger.logStructured('info', 'Custom event occurred', {
    eventType: 'custom',
    data,
    timestamp: new Date().toISOString()
  });
}

// Métriques
async logComponentMetrics(component: string, metrics: any) {
  this.logger.logMetrics(component, metrics);
}

// Health checks
async logHealthStatus(component: string, status: 'healthy' | 'unhealthy' | 'degraded', details?: any) {
  this.logger.logHealthCheck(component, status, details);
}
```

---

## 🛡️ RateLimitingService

### Méthodes Principales

#### Vérification de limites

```typescript
import { RateLimitingService } from '@shared/rate-limiting';

@Injectable()
export class ApiService {
  constructor(private rateLimiting: RateLimitingService) {}

  // Vérification par IP
  async checkIpLimit(ip: string) {
    return this.rateLimiting.checkIpLimit(ip, {
      limit: 100,
      windowMs: 60000, // 1 minute
      algorithm: 'sliding_window'
    });
  }

  // Vérification par utilisateur
  async checkUserLimit(userId: string) {
    return this.rateLimiting.checkUserLimit(userId, {
      limit: 1000,
      windowMs: 3600000, // 1 heure
      algorithm: 'token_bucket'
    });
  }

  // Vérification par route
  async checkRouteLimit(ip: string, route: string) {
    return this.rateLimiting.checkRouteLimit(ip, route, {
      limit: 50,
      windowMs: 60000
    });
  }

  // Vérification globale
  async checkGlobalLimit() {
    return this.rateLimiting.checkGlobalLimit({
      limit: 10000,
      windowMs: 60000
    });
  }
}
```

#### Rate limiting adaptatif

```typescript
// Rate limiting basé sur la charge
async checkAdaptiveLimit(identifier: string, loadFactor: number) {
  return this.rateLimiting.checkAdaptiveLimit(
    identifier,
    100, // limite de base
    60000, // fenêtre d'1 minute
    loadFactor // facteur de charge (0.5 = charge faible, 2.0 = charge élevée)
  );
}
```

#### Gestion whitelist/blacklist

```typescript
// Whitelist
async addToWhitelist(identifier: string, duration?: number) {
  await this.rateLimiting.addToWhitelist(identifier, duration);
}

async removeFromWhitelist(identifier: string) {
  await this.rateLimiting.removeFromWhitelist(identifier);
}

async isWhitelisted(identifier: string) {
  return this.rateLimiting.isWhitelisted(identifier);
}

// Blacklist
async addToBlacklist(identifier: string, duration: number = 3600) {
  await this.rateLimiting.addToBlacklist(identifier, duration);
}

async isBlacklisted(identifier: string) {
  return this.rateLimiting.isBlacklisted(identifier);
}
```

#### Gestion et monitoring

```typescript
// Reset manuel
async resetUserLimit(userId: string) {
  await this.rateLimiting.resetLimit(`user:${userId}`);
}

// Statistiques
async getRateLimitStats(identifier?: string) {
  return this.rateLimiting.getStats(identifier);
}

// Métriques
async getRateLimitMetrics() {
  return this.rateLimiting.getMetrics();
}

// Nettoyage
async cleanupExpiredLimits() {
  return this.rateLimiting.cleanup();
}
```

---

## 🔒 Utilisation des Guards

### RateLimitingGuard

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { RateLimitingGuard, RateLimit } from '@shared/rate-limiting';

@Controller('api')
@UseGuards(RateLimitingGuard)
export class ApiController {
  
  // Limite par défaut
  @Get('data')
  getData() {
    return { message: 'Data retrieved' };
  }

  // Limite personnalisée
  @Get('sensitive')
  @RateLimit({
    limit: 10,
    windowMs: 60000, // 1 minute
    algorithm: 'sliding_window'
  })
  getSensitiveData() {
    return { message: 'Sensitive data' };
  }

  // Limite stricte pour l'authentification
  @Get('auth')
  @RateLimit({
    limit: 5,
    windowMs: 300000, // 5 minutes
    algorithm: 'fixed_window'
  })
  authenticate() {
    return { message: 'Authentication endpoint' };
  }
}
```

---

## 📋 Métriques et Monitoring

### Utilisation des métriques globales

```typescript
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class MonitoringService {
  constructor(
    @Inject('APP_METRICS') private metrics: any,
    @Inject('APP_HEALTH') private health: any
  ) {}

  // Récupération de toutes les métriques
  async getAllMetrics() {
    return {
      prisma: this.metrics.prisma(),
      redis: this.metrics.redis(),
      bullmq: this.metrics.bullmq(),
      email: this.metrics.email(),
      rateLimiting: this.metrics.rateLimiting(),
      timestamp: new Date().toISOString()
    };
  }

  // Health check global
  async checkSystemHealth() {
    return this.health.checkHealth();
  }
}
```

### Endpoint de monitoring

```typescript
@Controller('monitoring')
export class MonitoringController {
  constructor(private monitoring: MonitoringService) {}

  @Get('metrics')
  async getMetrics() {
    return this.monitoring.getAllMetrics();
  }

  @Get('health')
  async getHealth() {
    return this.monitoring.checkSystemHealth();
  }
}
```

---

## 🚀 Exemples d'Usage Complets

### Service utilisateur complet

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@shared/prisma';
import { RedisService } from '@shared/redis';
import { BullmqService } from '@shared/bullmq';
import { EmailService } from '@shared/email';
import { LoggerService } from '@shared/logger';

@Injectable()
export class UserService {
  private logger: LoggerService;

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private bullmq: BullmqService,
    private email: EmailService,
    logger: LoggerService
  ) {
    this.logger = logger.createChildLogger('UserService');
  }

  async createUser(userData: any) {
    const operationId = this.logger.startOperation('create_user', { email: userData.email });
    
    try {
      // Vérifier le cache
      const existingUser = await this.redis.getCache<any>(`user:email:${userData.email}`);
      if (existingUser) {
        throw new Error('User already exists');
      }

      // Créer l'utilisateur avec transaction
      const result = await this.prisma.transactionWithRetry(async (tx) => {
        const user = await tx.user.create({
          data: {
            email: userData.email,
            firstName: userData.firstName,
            lastName: userData.lastName,
            hashedPassword: userData.hashedPassword
          }
        });

        const profile = await tx.userProfile.create({
          data: {
            userId: user.id,
            bio: userData.bio || ''
          }
        });

        return { user, profile };
      });

      // Mettre en cache
      await this.redis.setCache(`user:${result.user.id}`, result.user, 3600);
      await this.redis.setCache(`user:email:${result.user.email}`, result.user, 3600);

      // Envoyer l'email de bienvenue (asynchrone)
      await this.bullmq.sendWelcomeEmail(
        result.user.id,
        result.user.email,
        result.user.firstName
      );

      // Logger l'événement business
      this.logger.logBusinessEvent('USER_CREATED', {
        userId: result.user.id,
        email: result.user.email,
        hasProfile: !!result.profile
      });

      this.logger.endOperation('create_user', operationId, true);
      return result;

    } catch (error) {
      this.logger.logErrorEvent(error, 'UserService', undefined, { userData });
      this.logger.endOperation('create_user', operationId, false);
      throw error;
    }
  }

  async getUserById(id: string) {
    // Essayer le cache d'abord
    const cachedUser = await this.redis.getCache<any>(`user:${id}`);
    if (cachedUser) {
      this.logger.logCacheEvent('hit', `user:${id}`);
      return cachedUser;
    }

    this.logger.logCacheEvent('miss', `user:${id}`);

    // Récupérer depuis la base
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { profile: true }
    });

    if (user) {
      // Mettre en cache
      await this.redis.setCache(`user:${id}`, user, 3600);
      this.logger.logCacheEvent('set', `user:${id}`, 3600);
    }

    return user;
  }
}
```

### Contrôleur avec rate limiting

```typescript
import { Controller, Post, Get, Body, Param, UseGuards, Req } from '@nestjs/common';
import { RateLimitingGuard, RateLimit } from '@shared/rate-limiting';
import { LoggerService } from '@shared/logger';

@Controller('users')
@UseGuards(RateLimitingGuard)
export class UsersController {
  private logger: LoggerService;

  constructor(
    private userService: UserService,
    logger: LoggerService
  ) {
    this.logger = logger.createChildLogger('UsersController');
  }

  @Post()
  @RateLimit({
    limit: 5,
    windowMs: 300000, // 5 minutes
    algorithm: 'sliding_window'
  })
  async createUser(@Body() userData: any, @Req() req: any) {
    const startTime = Date.now();
    
    try {
      const user = await this.userService.createUser(userData);
      
      this.logger.logApiEvent(
        'POST',
        '/users',
        201,
        Date.now() - startTime,
        undefined,
        req.ip,
        req.headers['user-agent']
      );
      
      return user;
    } catch (error) {
      this.logger.logApiEvent(
        'POST',
        '/users',
        400,
        Date.now() - startTime,
        undefined,
        req.ip,
        req.headers['user-agent']
      );
      throw error;
    }
  }

  @Get(':id')
  @RateLimit({
    limit: 100,
    windowMs: 60000, // 1 minute
    algorithm: 'token_bucket'
  })
  async getUser(@Param('id') id: string) {
    return this.userService.getUserById(id);
  }
}
```

---

## 🔧 Configuration Avancée

### Configuration par environnement

```typescript
// config/database.config.ts
export default () => ({
  database: {
    url: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production',
    pool: {
      min: parseInt(process.env.DB_POOL_MIN) || 2,
      max: parseInt(process.env.DB_POOL_MAX) || 10
    }
  }
});
```

### Middleware de logging

```typescript
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { LoggerService } from '@shared/logger';

@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  private logger: LoggerService;

  constructor(logger: LoggerService) {
    this.logger = logger.createChildLogger('HTTP');
  }

  use(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      
      this.logger.logApiEvent(
        req.method,
        req.originalUrl,
        res.statusCode,
        duration,
        req.user?.id,
        req.ip,
        req.headers['user-agent']
      );
    });

    next();
  }
}
```

---

## 🐛 Troubleshooting

### Problèmes courants et solutions

#### 1. Erreurs de connexion Prisma

```typescript
// Test de connexion
async testDatabaseConnection() {
  try {
    const health = await this.prisma.healthCheck();
    console.log('Database health:', health);
  } catch (error) {
    console.error('Database connection failed:', error);
  }
}
```

#### 2. Problèmes Redis

```typescript
// Diagnostic Redis
async diagnosisRedis() {
  try {
    const ping = await this.redis.ping();
    const info = await this.redis.info();
    const metrics = this.redis.getMetrics();
    
    console.log('Redis ping:', ping);
    console.log('Redis metrics:', metrics);
  } catch (error) {
    console.error('Redis diagnosis failed:', error);
  }
}
```

#### 3. Problèmes BullMQ

```typescript
// Diagnostic BullMQ
async diagnosisBullMQ() {
  try {
    const emailStats = await this.bullmq.getQueueStats('email');
    const metrics = this.bullmq.getMetrics();
    
    console.log('Email queue stats:', emailStats);
    console.log('BullMQ metrics:', metrics);
  } catch (error) {
    console.error('BullMQ diagnosis failed:', error);
  }
}
```

#### 4. Problèmes d'email

```typescript
// Test email
async testEmail() {
  try {
    const connectionOk = await this.email.testConnection();
    const templates = this.email.getAvailableTemplates();
    const metrics = this.email.getMetrics();
    
    console.log('Email connection:', connectionOk);
    console.log('Available templates:', templates);
    console.log('Email metrics:', metrics);
  } catch (error) {
    console.error('Email test failed:', error);
  }
}
```

---

## 📚 Bonnes Pratiques

### 1. Gestion des erreurs

```typescript
// Toujours wrapper dans try-catch
async safeOperation() {
  try {
    return await this.riskyOperation();
  } catch (error) {
    this.logger.logErrorEvent(error, 'SafeOperation');
    throw new BadRequestException('Operation failed');
  }
}
```

### 2. Utilisation du cache

```typescript
// Pattern Cache-Aside
async getCachedData(key: string) {
  // 1. Essayer le cache
  const cached = await this.redis.getCache(key);
  if (cached) return cached;
  
  // 2. Récupérer depuis la source
  const data = await this.fetchFromSource(key);
  
  // 3. Mettre en cache
  await this.redis.setCache(key, data, 3600);
  
  return data;
}
```

### 3. Logging structuré

```typescript
// Logger les événements business importants
this.logger.logBusinessEvent('ORDER_PROCESSED', {
  orderId: order.id,
  amount: order.total,
  currency: 'TND',
  items: order.items.length,
  paymentMethod: order.paymentMethod
}, order.userId, order.organizerId);
```

### 4. Monitoring proactif

```typescript
// Vérifier régulièrement la santé des services
@Cron('0 */5 * * * *') // Toutes les 5 minutes
async healthCheck() {
  const health = await this.health.checkHealth();
  
  if (health.status !== 'healthy') {
    this.logger.logHealthCheck('SystemHealth', 'unhealthy', health.services);
    // Alerter l'équipe ops
  }
}
```

---

## 🔄 Migration et Mise à Jour

### Mise à jour des services

```bash
# Vérifier les versions
npm outdated

# Mettre à jour BullMQ
npm install bullmq@latest

# Mettre à jour Prisma
npm install prisma@latest @prisma/client@latest
```

### Script de migration

```typescript
// scripts/migrate-shared-module.ts
import { PrismaService } from '@shared/prisma';
import { RedisService } from '@shared/redis';

async function migrateSharedModule() {
  const prisma = new PrismaService();
  const redis = new RedisService();
  
  try {
    // Migrer les données
    await prisma.$queryRaw`/* Migration SQL */`;
    
    // Nettoyer le cache
    await redis.cleanup('old:*');
    
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
  }
}
```

---

## 📖 API Reference

### Types et Interfaces

```typescript
// Types principaux
import {
  // Prisma
  PrismaService,
  
  // Redis
  RedisService,
  
  // BullMQ
  BullmqService,
  QUEUE_NAMES,
  JOB_TYPES,
  JOB_PRIORITIES,
  
  // Email
  EmailService,
  EmailTemplates,
  
  // Logger
  LoggerService,
  
  // Rate Limiting
  RateLimitingService,
  RateLimitingGuard,
  RateLimit,
  
  // Utilitaires
  'APP_METRICS',
  'APP_HEALTH'
} from '@shared';
```

---

## 🎯 Conclusion

Ce module Shared de **grade A+** vous fournit une architecture robuste et scalable pour votre application ENtrix. Chaque service est optimisé pour la performance, la fiabilité et la maintenabilité.

### Points clés à retenir :

- **Utilisez les métriques** pour monitorer les performances
- **Loggez les événements business** pour le tracking
- **Gérez les erreurs** avec retry et logging
- **Utilisez le cache** pour optimiser les performances
- **Protégez vos APIs** avec le rate limiting

### Support

Pour toute question ou problème, consultez les logs structurés et les métriques disponibles. L'architecture est conçue pour être self-diagnostic et faciliter le troubleshooting.

**Bonne utilisation ! 🚀**