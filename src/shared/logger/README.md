# LoggerModule - Logging Centralisé

## 📋 Vue d'ensemble

Le LoggerModule fournit un système de logging centralisé et structuré avec des fonctionnalités avancées :

- **Logging structuré** avec Winston
- **Événements business** spécialisés
- **Logging sécurisé** et d'audit
- **Monitoring de performance** intégré
- **Formats multiples** (JSON, pretty, simple)
- **Rotation automatique** des fichiers
- **Child loggers** pour les modules
- **Prêt pour la production** avec métriques

## 🚀 Installation

```bash
npm install winston winston-daily-rotate-file
npm install @types/winston --save-dev
```

## ⚙️ Configuration

### Variables d'environnement

```bash
# .env
LOG_LEVEL=info                    # error, warn, info, debug, verbose, silly
LOG_FORMAT=json                   # json, simple, pretty
LOG_ENABLE_CONSOLE=true           # Logs dans la console
LOG_ENABLE_FILE=false            # Logs dans des fichiers
LOG_FILE_PATH=./logs/entrix-%DATE%.log
LOG_MAX_SIZE=10m                 # Taille max par fichier
LOG_MAX_FILES=30d                # Rétention des fichiers
```

### Niveaux de Log

```typescript
// Ordre de priorité (du plus critique au moins critique)
error   // Erreurs critiques
warn    // Avertissements
info    // Informations générales
http    // Requêtes HTTP
verbose // Informations détaillées
debug   // Debug
silly   // Très détaillé
```

## 🔧 Utilisation

### Injection de Base

```typescript
import { Injectable } from '@nestjs/common';
import { LoggerService } from '@shared/logger';

@Injectable()
export class UserService {
  private readonly logger: LoggerService;

  constructor(logger: LoggerService) {
    this.logger = logger.createChildLogger('UserService');
  }
}
```

### Logging Standard

```typescript
// Logs basiques
this.logger.log('Utilisateur créé avec succès');
this.logger.info('Traitement démarré');
this.logger.warn('Quota utilisateur bientôt atteint');
this.logger.error('Erreur de validation', error.stack);
this.logger.debug('Debug info', { userId: '123', action: 'login' });
this.logger.verbose('Détails de configuration', config);
```

## 🛠️ Événements Business

### Événements Génériques

```typescript
// Événement business générique
this.logger.logBusinessEvent(
  'USER_REGISTERED',
  {
    userId: '123',
    email: 'user@example.com',
    registrationMethod: 'email',
    referrer: 'google'
  },
  'user-123',      // userId (optionnel)
  'org-456'        // organizerId (optionnel)
);

// Événement avec contexte complet
this.logger.logBusinessEvent(
  'ORDER_PROCESSED',
  {
    orderId: 'order-789',
    amount: 150.00,
    currency: 'TND',
    items: [
      { name: 'Ticket VIP', price: 120.00 },
      { name: 'Frais service', price: 30.00 }
    ],
    paymentMethod: 'card'
  },
  'user-123',
  'org-456',
  {
    ipAddress: '192.168.1.1',
    userAgent: 'Mozilla/5.0...',
    sessionId: 'session-abc123'
  }
);
```

### Événements de Paiement

```typescript
// Événement de paiement
this.logger.logPaymentEvent(
  'order-123',
  50.00,
  'TND',
  'completed',
  'stripe',
  {
    cardLast4: '4242',
    transactionId: 'txn_123456',
    processingTime: 1245
  }
);

// Différents statuts de paiement
this.logger.logPaymentEvent('order-123', 50.00, 'TND', 'initiated', 'stripe');
this.logger.logPaymentEvent('order-123', 50.00, 'TND', 'processing', 'stripe');
this.logger.logPaymentEvent('order-123', 50.00, 'TND', 'failed', 'stripe');
this.logger.logPaymentEvent('order-123', 50.00, 'TND', 'refunded', 'stripe');
```

## 🔒 Événements de Sécurité

### Événements Génériques

```typescript
// Événement de sécurité
this.logger.logSecurityEvent(
  'SUSPICIOUS_LOGIN_ATTEMPT',
  'user-123',
  '192.168.1.1',
  'Mozilla/5.0...',
  {
    attempts: 5,
    timeWindow: '5 minutes',
    location: 'Tunisia',
    reason: 'multiple_failed_passwords'
  }
);

// Événements de sécurité courants
this.logger.logSecurityEvent('ACCOUNT_LOCKED', userId, ip);
this.logger.logSecurityEvent('PERMISSION_DENIED', userId, ip);
this.logger.logSecurityEvent('UNUSUAL_ACTIVITY', userId, ip);
```

### Événements d'Authentification

```typescript
// Connexion réussie
this.logger.logAuthEvent(
  'login',
  'user-123',
  'user@example.com',
  '192.168.1.1',
  'Mozilla/5.0...',
  {
    loginMethod: 'email',
    twoFactorUsed: false,
    sessionId: 'session-abc123'
  }
);

// Différents événements d'auth
this.logger.logAuthEvent('logout', userId, email, ip);
this.logger.logAuthEvent('register', userId, email, ip);
this.logger.logAuthEvent('password_reset', userId, email, ip);
this.logger.logAuthEvent('email_verification', userId, email, ip);
this.logger.logAuthEvent('failed_login', undefined, email, ip);
```

## 📊 Monitoring de Performance

### Opérations Mesurées

```typescript
// Mesurer une opération
async processUserOrder(orderData: any) {
  const operationId = this.logger.startOperation('processUserOrder', {
    orderId: orderData.id,
    userId: orderData.userId,
    amount: orderData.total
  });

  try {
    // Traitement de la commande
    const order = await this.createOrder(orderData);
    await this.processPayment(order);
    await this.sendConfirmation(order);

    // Fin de l'opération (succès)
    this.logger.endOperation(
      'processUserOrder',
      operationId,
      true,  // succès
      Date.now() - startTime,
      { orderId: order.id, status: 'completed' }
    );

    return order;
  } catch (error) {
    // Fin de l'opération (échec)
    this.logger.endOperation(
      'processUserOrder',
      operationId,
      false, // échec
      Date.now() - startTime,
      { error: error.message }
    );
    throw error;
  }
}
```

### Événements de Performance

```typescript
// Performance d'une opération
this.logger.logPerformanceEvent(
  'database_query',
  1245, // durée en ms
  {
    query: 'SELECT * FROM users WHERE active = true',
    resultCount: 150,
    cached: false
  }
);

// Performance API
this.logger.logPerformanceEvent(
  'api_call',
  2340,
  {
    endpoint: '/api/users',
    method: 'GET',
    statusCode: 200,
    responseSize: 1024
  }
);
```

## 🌐 Monitoring API

### Événements API

```typescript
// Log d'une requête API
this.logger.logApiEvent(
  'POST',
  '/api/orders',
  201,
  1245,
  'user-123',
  '192.168.1.1',
  'Mozilla/5.0...',
  {
    requestSize: 512,
    responseSize: 1024,
    orderItems: 3
  }
);

// Log d'erreur API
this.logger.logApiEvent(
  'POST',
  '/api/orders',
  400,
  234,
  'user-123',
  '192.168.1.1',
  'Mozilla/5.0...',
  {
    errorCode: 'INVALID_PAYMENT_METHOD',
    validationErrors: ['amount must be positive']
  }
);
```

## 🔧 Événements Spécialisés

### Cache Events

```typescript
// Événements de cache
this.logger.logCacheEvent('hit', 'user:123', 3600);
this.logger.logCacheEvent('miss', 'user:456');
this.logger.logCacheEvent('set', 'user:789', 7200);
this.logger.logCacheEvent('del', 'user:123');
this.logger.logCacheEvent('expire', 'session:abc123');
```

### Job Events

```typescript
// Événements de jobs
this.logger.logJobEvent('created', 'send-email', 'job-123');
this.logger.logJobEvent('processing', 'send-email', 'job-123');
this.logger.logJobEvent('completed', 'send-email', 'job-123', 1500);
this.logger.logJobEvent('failed', 'send-email', 'job-123', 2000, {
  error: 'SMTP connection failed',
  attempts: 3
});
this.logger.logJobEvent('retry', 'send-email', 'job-123', 500, {
  attempt: 2,
  nextRetry: new Date(Date.now() + 5000)
});
```

### Webhook Events

```typescript
// Événements de webhook
this.logger.logWebhookEvent(
  'received',
  'stripe',
  'payment_intent.succeeded',
  'evt_123456',
  {
    paymentIntentId: 'pi_123456',
    amount: 5000,
    currency: 'tnd'
  }
);

this.logger.logWebhookEvent(
  'processed',
  'stripe',
  'payment_intent.succeeded',
  'evt_123456',
  {
    orderId: 'order-789',
    processingTime: 145
  }
);
```

### Notification Events

```typescript
// Événements de notification
this.logger.logNotificationEvent(
  'sent',
  'email',
  'user@example.com',
  'notification-123',
  {
    subject: 'Bienvenue sur Entrix',
    template: 'welcome',
    provider: 'smtp'
  }
);

this.logger.logNotificationEvent(
  'delivered',
  'push',
  'user-123',
  'notification-456',
  {
    title: 'Nouveau message',
    platform: 'ios'
  }
);

this.logger.logNotificationEvent(
  'opened',
  'email',
  'user@example.com',
  'notification-123',
  {
    openedAt: new Date(),
    userAgent: 'Mozilla/5.0...'
  }
);
```

## 📋 Logging Structuré

### Logs Personnalisés

```typescript
// Log avec structure personnalisée
this.logger.logStructured('info', 'User profile updated', {
  userId: '123',
  action: 'profile_update',
  changes: {
    firstName: { from: 'John', to: 'Jane' },
    email: { from: 'john@example.com', to: 'jane@example.com' }
  },
  timestamp: new Date(),
  ipAddress: '192.168.1.1'
});

// Log de données complexes
this.logger.logStructured('debug', 'Payment processing details', {
  payment: {
    id: 'payment-123',
    amount: 50.00,
    currency: 'TND',
    method: 'card'
  },
  user: {
    id: 'user-456',
    email: 'user@example.com',
    country: 'TN'
  },
  context: {
    userAgent: 'Mozilla/5.0...',
    sessionId: 'session-abc123',
    correlationId: 'corr-789'
  }
});
```

### Métriques et Health Checks

```typescript
// Log de métriques
this.logger.logMetrics('DatabasePool', {
  activeConnections: 5,
  totalConnections: 10,
  avgResponseTime: 45.2,
  queriesPerSecond: 125,
  errorRate: 0.02
});

// Log de health check
this.logger.logHealthCheck('PaymentService', 'healthy', {
  connectionsActive: 3,
  lastHeartbeat: new Date(),
  responseTime: 234,
  uptime: 86400
});

// Log de health check dégradé
this.logger.logHealthCheck('EmailService', 'degraded', {
  smtpConnections: 1,
  queueLength: 150,
  avgDeliveryTime: 5000,
  errorRate: 0.05
});
```

## 🎯 Exemples Pratiques

### Service avec Logging Complet

```typescript
@Injectable()
export class OrderService {
  private readonly logger: LoggerService;

  constructor(logger: LoggerService) {
    this.logger = logger.createChildLogger('OrderService');
  }

  async createOrder(orderData: CreateOrderDto, userId: string): Promise<Order> {
    const operationId = this.logger.startOperation('createOrder', {
      userId,
      amount: orderData.total,
      eventId: orderData.eventId
    });

    try {
      // Log de début
      this.logger.info('Création de commande démarrée', {
        userId,
        eventId: orderData.eventId,
        amount: orderData.total
      });

      // Validation
      await this.validateOrder(orderData);

      // Création de la commande
      const order = await this.prisma.order.create({
        data: {
          userId,
          eventId: orderData.eventId,
          total: orderData.total,
          status: 'pending'
        }
      });

      // Log business event
      this.logger.logBusinessEvent('ORDER_CREATED', {
        orderId: order.id,
        userId,
        eventId: orderData.eventId,
        amount: orderData.total,
        currency: 'TND'
      }, userId);

      // Fin de l'opération
      this.logger.endOperation('createOrder', operationId, true, undefined, {
        orderId: order.id,
        status: 'created'
      });

      return order;
    } catch (error) {
      // Log d'erreur
      this.logger.logErrorEvent(error, 'OrderService', userId, {
        orderData,
        operationId
      });

      // Fin de l'opération en échec
      this.logger.endOperation('createOrder', operationId, false, undefined, {
        error: error.message
      });

      throw error;
    }
  }

  async processPayment(orderId: string, paymentData: any): Promise<void> {
    const order = await this.getOrder(orderId);
    
    try {
      // Log de début de paiement
      this.logger.logPaymentEvent(
        orderId,
        order.total,
        'TND',
        'initiated',
        paymentData.provider
      );

      // Traitement du paiement
      const result = await this.paymentProvider.process(paymentData);

      // Log de succès
      this.logger.logPaymentEvent(
        orderId,
        order.total,
        'TND',
        'completed',
        paymentData.provider,
        {
          transactionId: result.transactionId,
          processingTime: result.processingTime
        }
      );

    } catch (error) {
      // Log d'échec de paiement
      this.logger.logPaymentEvent(
        orderId,
        order.total,
        'TND',
        'failed',
        paymentData.provider,
        {
          errorCode: error.code,
          errorMessage: error.message
        }
      );

      throw error;
    }
  }
}
```

### Middleware de Logging API

```typescript
@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  constructor(private readonly logger: LoggerService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();
    
    // Log de la requête entrante
    this.logger.debug('Incoming request', {
      method: req.method,
      url: req.url,
      userAgent: req.headers['user-agent'],
      ip: req.ip,
      userId: req.user?.id
    });

    // Intercept la réponse
    const originalSend = res.send;
    res.send = function(data) {
      const duration = Date.now() - startTime;
      
      // Log de la réponse
      this.logger.logApiEvent(
        req.method,
        req.url,
        res.statusCode,
        duration,
        req.user?.id,
        req.ip,
        req.headers['user-agent'],
        {
          requestSize: req.headers['content-length'],
          responseSize: data?.length
        }
      );

      return originalSend.call(this, data);
    }.bind(this);

    next();
  }
}
```

### Service de Monitoring

```typescript
@Injectable()
export class MonitoringService {
  constructor(private readonly logger: LoggerService) {
    this.startPeriodicMonitoring();
  }

  private startPeriodicMonitoring() {
    // Métriques système toutes les minutes
    setInterval(() => {
      this.logSystemMetrics();
    }, 60000);

    // Health checks toutes les 30 secondes
    setInterval(() => {
      this.performHealthChecks();
    }, 30000);
  }

  private logSystemMetrics() {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    this.logger.logMetrics('System', {
      memory: {
        rss: memoryUsage.rss,
        heapUsed: memoryUsage.heapUsed,
        heapTotal: memoryUsage.heapTotal,
        external: memoryUsage.external
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system
      },
      uptime: process.uptime()
    });
  }

  private async performHealthChecks() {
    try {
      // Check database
      await this.prisma.user.findFirst();
      this.logger.logHealthCheck('Database', 'healthy');

      // Check Redis
      await this.redis.ping();
      this.logger.logHealthCheck('Redis', 'healthy');

      // Check email service
      const emailHealthy = await this.email.testConnection();
      this.logger.logHealthCheck('Email', emailHealthy ? 'healthy' : 'unhealthy');

    } catch (error) {
      this.logger.logHealthCheck('System', 'unhealthy', {
        error: error.message
      });
    }
  }
}
```

## 🔧 Bonnes Pratiques

### 1. Contexte et Corrélation

```typescript
// ✅ Bon - Avec contexte et corrélation
class OrderService {
  async processOrder(orderData: any, correlationId: string) {
    const context = {
      correlationId,
      orderId: orderData.id,
      userId: orderData.userId
    };

    this.logger.info('Processing order', context);
    
    try {
      const result = await this.processPayment(orderData);
      this.logger.info('Order processed successfully', { ...context, result });
    } catch (error) {
      this.logger.error('Order processing failed', error.stack, 'OrderService', context);
    }
  }
}
```

### 2. Niveaux de Log Appropriés

```typescript
// ✅ Bon - Niveaux appropriés
this.logger.error('Payment failed', error.stack); // Erreurs critiques
this.logger.warn('User quota exceeded', { userId }); // Avertissements
this.logger.info('Order created', { orderId }); // Événements importants
this.logger.debug('Cache hit', { key }); // Debug uniquement
```

### 3. Données Sensibles

```typescript
// ✅ Bon - Masquer les données sensibles
const sanitizedUser = {
  id: user.id,
  email: user.email.replace(/(.{3}).+@/, '$1***@'),
  // Ne pas logger: password, tokens, données bancaires
};

this.logger.logBusinessEvent('USER_LOGIN', sanitizedUser);
```

### 4. Performance

```typescript
// ✅ Bon - Éviter les logs coûteux
if (this.logger.isDebugEnabled()) {
  this.logger.debug('Heavy computation result', heavyComputation());
}

// Ou utiliser lazy evaluation
this.logger.debug('User data', () => JSON.stringify(userData));
```

## 🚀 Déploiement

### Configuration Production

```bash
# .env.production
LOG_LEVEL=info
LOG_FORMAT=json
LOG_ENABLE_CONSOLE=false
LOG_ENABLE_FILE=true
LOG_FILE_PATH=/var/log/entrix/app-%DATE%.log
LOG_MAX_SIZE=50m
LOG_MAX_FILES=30d
```

### Intégration avec ELK Stack

```bash
# Logstash configuration
input {
  file {
    path => "/var/log/entrix/app-*.log"
    codec => "json"
    type => "entrix-app"
  }
}

filter {
  if [type] == "entrix-app" {
    date {
      match => [ "timestamp", "ISO8601" ]
    }
    
    if [context] == "BusinessEvent" {
      mutate {
        add_tag => ["business"]
      }
    }
  }
}

output {
  elasticsearch {
    hosts => ["elasticsearch:9200"]
    index => "entrix-logs-%{+YYYY.MM.dd}"
  }
}
```

### Monitoring et Alertes

```typescript
// Endpoint de métriques
@Get('metrics/logs')
async getLogMetrics() {
  return {
    logCounts: {
      error: await this.getLogCount('error'),
      warn: await this.getLogCount('warn'),
      info: await this.getLogCount('info')
    },
    businessEvents: await this.getBusinessEventCounts(),
    performanceMetrics: await this.getPerformanceMetrics()
  };
}
```

---

## 📚 Ressources

- [Winston Documentation](https://github.com/winstonjs/winston)
- [Structured Logging Best Practices](https://www.honeycomb.io/blog/structured-logging-and-your-team)
- [ELK Stack Documentation](https://www.elastic.co/elk-stack)

**Le LoggerModule est maintenant prêt pour une utilisation professionnelle ! 📊**