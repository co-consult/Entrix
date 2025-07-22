# BullMQModule - Jobs Asynchrones

## 📋 Vue d'ensemble

Le BullMQModule fournit un système complet de gestion de jobs asynchrones avec des fonctionnalités avancées :

- **Jobs prioritaires** avec niveaux configurables
- **Jobs récurrents** avec expressions CRON
- **Jobs délayés** avec timing précis
- **Retry automatique** avec backoff exponentiel
- **Métriques et monitoring** en temps réel
- **Clustering ready** avec Redis distribué
- **Workers personnalisés** pour chaque type de job

## 🚀 Installation

```bash
npm install bullmq
```

## ⚙️ Configuration

### Variables d'environnement

```bash
# .env
BULLMQ_PREFIX=bullmq             # Préfixe pour les clés Redis
BULLMQ_CONCURRENCY=5             # Nombre de jobs simultanés par worker

# Configuration Redis pour BullMQ (optionnel, hérite de REDIS_*)
BULLMQ_REDIS_HOST=localhost
BULLMQ_REDIS_PORT=6379
BULLMQ_REDIS_PASSWORD=
BULLMQ_REDIS_DB=0
BULLMQ_REDIS_TLS=false
```

### Queues Prédéfinies

```typescript
// Queues disponibles
export const QUEUE_NAMES = {
  EMAIL: 'email',
  NOTIFICATIONS: 'notifications',
  PAYMENTS: 'payments',
  REPORTS: 'reports',
} as const;

// Types de jobs par queue
export const JOB_TYPES = {
  EMAIL: {
    SEND_WELCOME: 'send-welcome',
    SEND_VERIFICATION: 'send-verification',
    SEND_PASSWORD_RESET: 'send-password-reset',
    SEND_TICKET: 'send-ticket',
    SEND_INVOICE: 'send-invoice',
    SEND_REMINDER: 'send-reminder',
  },
  NOTIFICATIONS: {
    PUSH_NOTIFICATION: 'push-notification',
    SMS_NOTIFICATION: 'sms-notification',
    IN_APP_NOTIFICATION: 'in-app-notification',
  },
  PAYMENTS: {
    PROCESS_PAYMENT: 'process-payment',
    PROCESS_REFUND: 'process-refund',
    CALCULATE_COMMISSION: 'calculate-commission',
    GENERATE_PAYOUT: 'generate-payout',
  },
  REPORTS: {
    GENERATE_SALES_REPORT: 'generate-sales-report',
    GENERATE_ATTENDANCE_REPORT: 'generate-attendance-report',
    GENERATE_FINANCIAL_REPORT: 'generate-financial-report',
    EXPORT_DATA: 'export-data',
  },
} as const;
```

## 🔧 Utilisation

### Injection de Base

```typescript
import { Injectable } from '@nestjs/common';
import { BullmqService } from '@shared/bullmq';

@Injectable()
export class NotificationService {
  constructor(private readonly bullmq: BullmqService) {}
}
```

### Jobs Simples

```typescript
// Ajouter un job basique
const job = await this.bullmq.addJob(
  'email',
  'send-welcome',
  {
    userId: '123',
    email: 'user@example.com',
    firstName: 'John'
  }
);

console.log(`Job créé avec l'ID: ${job.id}`);
```

## 🛠️ Fonctionnalités Avancées

### Jobs avec Priorité

```typescript
// Job critique (traité en premier)
await this.bullmq.addPriorityJob(
  'payments',
  'process-payment',
  {
    orderId: '123',
    amount: 50.00,
    currency: 'TND',
    paymentMethod: 'card'
  },
  'CRITICAL' // Priorité 1
);

// Job normal
await this.bullmq.addPriorityJob(
  'reports',
  'generate-report',
  { organizerId: '123' },
  'NORMAL' // Priorité 3
);

// Job de faible priorité
await this.bullmq.addPriorityJob(
  'notifications',
  'cleanup-old-notifications',
  { before: new Date() },
  'LOW' // Priorité 4
);
```

### Jobs Délayés

```typescript
// Job avec délai (30 secondes)
await this.bullmq.addDelayedJob(
  'notifications',
  'send-reminder',
  {
    userId: '123',
    eventId: '456',
    message: 'Votre événement commence bientôt'
  },
  30000 // 30 secondes
);

// Rappel pour événement (24 heures)
await this.bullmq.addDelayedJob(
  'notifications',
  'event-reminder',
  {
    eventId: '456',
    reminderType: '24h'
  },
  86400000 // 24 heures
);
```

### Jobs Récurrents

```typescript
// Job quotidien (tous les jours à 8h)
await this.bullmq.addRecurringJob(
  'reports',
  'daily-sales-report',
  {
    organizerId: '123',
    reportType: 'sales'
  },
  '0 8 * * *' // Expression CRON
);

// Job hebdomadaire (dimanche à 2h)
await this.bullmq.addRecurringJob(
  'maintenance',
  'cleanup-old-data',
  {
    retentionDays: 30
  },
  '0 2 * * 0' // Dimanche à 2h
);

// Job mensuel (1er du mois à minuit)
await this.bullmq.addRecurringJob(
  'reports',
  'monthly-financial-report',
  {
    organizerId: '123'
  },
  '0 0 1 * *' // 1er du mois à minuit
);
```

### Options de Job Avancées

```typescript
// Job avec options personnalisées
await this.bullmq.addJob(
  'email',
  'send-newsletter',
  {
    recipients: ['user1@example.com', 'user2@example.com'],
    template: 'newsletter-monthly'
  },
  {
    attempts: 5,           // 5 tentatives
    backoff: {
      type: 'exponential',
      delay: 2000,         // Délai initial 2s
    },
    delay: 60000,          // Délai de 1 minute
    removeOnComplete: 10,  // Garder 10 jobs complétés
    removeOnFail: 5,       // Garder 5 jobs échoués
  }
);
```

## 🔨 Workers Personnalisés

### Worker Simple

```typescript
// Créer un worker pour traiter les jobs
await this.bullmq.createWorker(
  'email',
  async (job) => {
    console.log(`Traitement du job: ${job.name}`, job.data);
    
    switch (job.name) {
      case 'send-welcome':
        await this.sendWelcomeEmail(job.data);
        break;
      case 'send-verification':
        await this.sendVerificationEmail(job.data);
        break;
      default:
        throw new Error(`Job type inconnu: ${job.name}`);
    }
    
    return { success: true, processedAt: new Date() };
  },
  5 // Concurrence: 5 jobs simultanés
);
```

### Worker Avancé avec Gestion d'Erreurs

```typescript
@Injectable()
export class EmailWorkerService {
  constructor(
    private readonly bullmq: BullmqService,
    private readonly email: EmailService,
    private readonly logger: LoggerService
  ) {}

  async initializeWorker() {
    await this.bullmq.createWorker(
      'email',
      async (job) => {
        const startTime = Date.now();
        
        try {
          let result;
          
          switch (job.name) {
            case 'send-welcome':
              result = await this.processWelcomeEmail(job.data);
              break;
            case 'send-verification':
              result = await this.processVerificationEmail(job.data);
              break;
            case 'send-password-reset':
              result = await this.processPasswordResetEmail(job.data);
              break;
            default:
              throw new Error(`Type de job non supporté: ${job.name}`);
          }
          
          const duration = Date.now() - startTime;
          this.logger.logJobEvent('completed', job.name, job.id, duration, result);
          
          return result;
        } catch (error) {
          const duration = Date.now() - startTime;
          this.logger.logJobEvent('failed', job.name, job.id, duration, {
            error: error.message,
            stack: error.stack
          });
          
          throw error;
        }
      },
      3 // Concurrence modérée pour les emails
    );
  }

  private async processWelcomeEmail(data: any) {
    const { userId, email, firstName } = data;
    
    const result = await this.email.sendWelcomeEmail(email, firstName);
    
    // Marquer l'utilisateur comme ayant reçu l'email de bienvenue
    await this.userService.markWelcomeEmailSent(userId);
    
    return {
      success: true,
      messageId: result.messageId,
      recipient: email
    };
  }

  private async processVerificationEmail(data: any) {
    const { userId, email, token } = data;
    
    const result = await this.email.sendVerificationEmail(email, token);
    
    return {
      success: true,
      messageId: result.messageId,
      recipient: email,
      token
    };
  }
}
```

## 🎯 Méthodes Spécialisées

### Emails

```typescript
// Email de bienvenue
await this.bullmq.sendWelcomeEmail(
  'user123',
  'user@example.com',
  'John'
);

// Email de vérification
await this.bullmq.sendVerificationEmail(
  'user123',
  'user@example.com',
  'verification-token-123'
);

// Reset de mot de passe
await this.bullmq.sendPasswordResetEmail(
  'user123',
  'user@example.com',
  'reset-token-123'
);
```

### Paiements

```typescript
// Traitement de paiement
await this.bullmq.processPayment({
  orderId: '123',
  userId: '456',
  amount: 50.00,
  currency: 'TND',
  paymentMethod: 'card',
  paymentData: {
    cardToken: 'tok_123456',
    saveCard: true
  }
});
```

### Notifications

```typescript
// Notification push
await this.bullmq.sendPushNotification({
  userId: '123',
  title: 'Nouveau message',
  body: 'Vous avez reçu un nouveau message de John',
  data: {
    type: 'message',
    messageId: '456'
  },
  badge: 1
});
```

### Rapports

```typescript
// Rapport de ventes
await this.bullmq.generateSalesReport({
  organizerId: '123',
  startDate: new Date('2025-01-01'),
  endDate: new Date('2025-01-31'),
  format: 'pdf',
  email: 'organizer@example.com'
});
```

## 📊 Monitoring et Métriques

### Statistiques par Queue

```typescript
// Statistiques d'une queue
const stats = await this.bullmq.getQueueStats('email');
console.log(stats);
/*
{
  queueName: 'email',
  waiting: 5,      // Jobs en attente
  active: 2,       // Jobs en cours
  completed: 148,  // Jobs terminés
  failed: 3,       // Jobs échoués
  delayed: 1,      // Jobs délayés
  total: 159       // Total
}
*/

// Surveiller toutes les queues
const allStats = await Promise.all([
  this.bullmq.getQueueStats('email'),
  this.bullmq.getQueueStats('notifications'),
  this.bullmq.getQueueStats('payments'),
  this.bullmq.getQueueStats('reports')
]);
```

### Métriques Globales

```typescript
// Métriques du service
const metrics = this.bullmq.getMetrics();
console.log(metrics);
/*
{
  jobsCreated: 1250,
  jobsCompleted: 1189,
  jobsFailed: 61,
  jobsActive: 12,
  jobsWaiting: 23,
  jobsDelayed: 5,
  totalProcessingTime: 1482750,
  avgProcessingTime: 1245.67,
  successRate: 95.12,
  failureRate: 4.88
}
*/

// Alertes basées sur les métriques
if (metrics.successRate < 90) {
  console.warn('Taux de succès des jobs faible');
}

if (metrics.jobsActive > 100) {
  console.warn('Nombre élevé de jobs actifs');
}
```

## 🔧 Gestion des Queues

### Contrôle des Queues

```typescript
// Pauser une queue
await this.bullmq.pauseQueue('email');
console.log('Queue email mise en pause');

// Reprendre une queue
await this.bullmq.resumeQueue('email');
console.log('Queue email reprise');

// Nettoyer les jobs terminés
await this.bullmq.cleanupQueues();
console.log('Nettoyage des queues terminé');
```

### Accès Direct aux Queues

```typescript
// Obtenir une queue pour opérations avancées
const emailQueue = this.bullmq.getQueue('email');

// Obtenir tous les jobs échoués
const failedJobs = await emailQueue.getFailed();
console.log(`${failedJobs.length} jobs échoués`);

// Relancer tous les jobs échoués
for (const job of failedJobs) {
  await job.retry();
}

// Obtenir les jobs délayés
const delayedJobs = await emailQueue.getDelayed();
console.log(`${delayedJobs.length} jobs délayés`);
```

## 🎯 Exemples Pratiques

### Service de Notification Complet

```typescript
@Injectable()
export class NotificationService {
  constructor(
    private readonly bullmq: BullmqService,
    private readonly logger: LoggerService
  ) {}

  async sendUserNotification(
    userId: string,
    type: 'email' | 'push' | 'sms',
    data: any
  ) {
    const job = await this.bullmq.addPriorityJob(
      'notifications',
      `${type}-notification`,
      {
        userId,
        type,
        data,
        timestamp: new Date()
      },
      'HIGH'
    );

    this.logger.logJobEvent('created', job.name, job.id, undefined, {
      userId,
      type,
      priority: 'HIGH'
    });

    return job;
  }

  async scheduleEventReminder(
    eventId: string,
    userId: string,
    reminderTime: Date
  ) {
    const delay = reminderTime.getTime() - Date.now();
    
    if (delay <= 0) {
      throw new Error('La date de rappel doit être dans le futur');
    }

    return this.bullmq.addDelayedJob(
      'notifications',
      'event-reminder',
      {
        eventId,
        userId,
        reminderTime,
        type: 'event'
      },
      delay
    );
  }

  async setupRecurringNotifications(organizerId: string) {
    // Rapport quotidien
    await this.bullmq.addRecurringJob(
      'reports',
      'daily-summary',
      { organizerId },
      '0 9 * * *' // 9h tous les jours
    );

    // Rapport hebdomadaire
    await this.bullmq.addRecurringJob(
      'reports',
      'weekly-summary',
      { organizerId },
      '0 9 * * 1' // 9h tous les lundis
    );

    // Nettoyage mensuel
    await this.bullmq.addRecurringJob(
      'maintenance',
      'cleanup-old-notifications',
      { organizerId },
      '0 2 1 * *' // 2h le 1er de chaque mois
    );
  }
}
```

### Service de Traitement des Commandes

```typescript
@Injectable()
export class OrderProcessingService {
  constructor(
    private readonly bullmq: BullmqService,
    private readonly logger: LoggerService
  ) {}

  async processOrder(orderData: any) {
    const orderId = orderData.id;
    
    // 1. Traitement du paiement (priorité critique)
    await this.bullmq.addPriorityJob(
      'payments',
      'process-payment',
      {
        orderId,
        amount: orderData.total,
        paymentMethod: orderData.paymentMethod
      },
      'CRITICAL'
    );

    // 2. Mise à jour de l'inventaire (priorité élevée)
    await this.bullmq.addPriorityJob(
      'inventory',
      'update-stock',
      {
        orderId,
        items: orderData.items
      },
      'HIGH'
    );

    // 3. Envoi de confirmation (priorité normale)
    await this.bullmq.addPriorityJob(
      'email',
      'send-order-confirmation',
      {
        orderId,
        userEmail: orderData.userEmail,
        items: orderData.items
      },
      'NORMAL'
    );

    // 4. Génération des tickets (délayé de 5 minutes)
    await this.bullmq.addDelayedJob(
      'tickets',
      'generate-tickets',
      {
        orderId,
        eventId: orderData.eventId,
        quantity: orderData.items.length
      },
      300000 // 5 minutes
    );

    this.logger.logBusinessEvent('ORDER_PROCESSING_STARTED', {
      orderId,
      userId: orderData.userId,
      total: orderData.total
    });
  }
}
```

## 🔧 Bonnes Pratiques

### 1. Gestion des Priorités

```typescript
// ✅ Bon - Priorités logiques
await this.bullmq.addPriorityJob('payments', 'process-payment', data, 'CRITICAL');
await this.bullmq.addPriorityJob('email', 'send-welcome', data, 'HIGH');
await this.bullmq.addPriorityJob('reports', 'generate-report', data, 'NORMAL');
await this.bullmq.addPriorityJob('cleanup', 'old-data', data, 'LOW');

// ❌ Mauvais - Tout en critique
await this.bullmq.addPriorityJob('reports', 'generate-report', data, 'CRITICAL');
```

### 2. Gestion des Erreurs

```typescript
// ✅ Bon - Worker avec gestion d'erreurs
await this.bullmq.createWorker('email', async (job) => {
  try {
    const result = await this.processEmail(job.data);
    return { success: true, result };
  } catch (error) {
    // Log l'erreur
    this.logger.error(`Job ${job.id} failed:`, error);
    
    // Différencier les erreurs temporaires des permanentes
    if (error.code === 'NETWORK_ERROR') {
      throw error; // Retry automatique
    } else {
      // Erreur permanente, ne pas retry
      return { success: false, error: error.message };
    }
  }
});
```

### 3. Monitoring

```typescript
// ✅ Bon - Monitoring régulier
setInterval(async () => {
  const metrics = this.bullmq.getMetrics();
  
  // Alertes
  if (metrics.successRate < 90) {
    this.logger.warn('Taux de succès faible', metrics);
  }
  
  if (metrics.jobsActive > 50) {
    this.logger.warn('Nombre élevé de jobs actifs', metrics);
  }
}, 60000); // Toutes les minutes
```

### 4. Nettoyage

```typescript
// ✅ Bon - Nettoyage automatique
await this.bullmq.addRecurringJob(
  'maintenance',
  'cleanup-old-jobs',
  {},
  '0 2 * * *' // 2h tous les jours
);
```

## 🐛 Troubleshooting

### Problèmes Courants

#### 1. Jobs Bloqués

```bash
Jobs stuck in active state
```

**Solutions :**
```typescript
// Vérifier les jobs actifs
const activeJobs = await this.bullmq.getQueue('email').getActive();
console.log(`${activeJobs.length} jobs actifs`);

// Forcer le nettoyage
await this.bullmq.getQueue('email').clean(0, 'active');

// Redémarrer le worker
await this.bullmq.getWorker('email').close();
await this.bullmq.createWorker('email', processor);
```

#### 2. Mémoire Redis Saturée

```bash
Redis OOM - jobs accumulating
```

**Solutions :**
```typescript
// Nettoyer les jobs terminés
await this.bullmq.cleanupQueues();

// Réduire la rétention
await this.bullmq.addJob('email', 'test', {}, {
  removeOnComplete: 5,  // Au lieu de 100
  removeOnFail: 3       // Au lieu de 50
});
```

#### 3. Workers Lents

```bash
Jobs processing slowly
```

**Solutions :**
```typescript
// Augmenter la concurrence
await this.bullmq.createWorker('email', processor, 10); // Au lieu de 5

// Optimiser le code du worker
await this.bullmq.createWorker('email', async (job) => {
  // Éviter les opérations synchrones lourdes
  const result = await this.processJobAsync(job.data);
  return result;
});
```

### Debug et Logs

```typescript
// Activer les logs détaillés
const queue = this.bullmq.getQueue('email');
queue.on('waiting', (job) => console.log('Job waiting:', job.id));
queue.on('active', (job) => console.log('Job active:', job.id));
queue.on('completed', (job) => console.log('Job completed:', job.id));
queue.on('failed', (job, err) => console.log('Job failed:', job.id, err));
```

## 🚀 Déploiement

### Configuration Production

```bash
# .env.production
BULLMQ_CONCURRENCY=10
BULLMQ_REDIS_HOST=redis.production.com
BULLMQ_REDIS_PORT=6380
BULLMQ_REDIS_PASSWORD=secure_password
BULLMQ_REDIS_TLS=true
```

### Clustering

```typescript
// Déployer plusieurs instances
// Instance 1: Workers emails
await this.bullmq.createWorker('email', emailProcessor, 5);

// Instance 2: Workers paiements
await this.bullmq.createWorker('payments', paymentProcessor, 3);

// Instance 3: Workers rapports
await this.bullmq.createWorker('reports', reportProcessor, 2);
```

### Monitoring Production

```typescript
// Endpoint de santé
@Get('health/jobs')
async jobsHealth() {
  const stats = await Promise.all([
    this.bullmq.getQueueStats('email'),
    this.bullmq.getQueueStats('notifications'),
    this.bullmq.getQueueStats('payments'),
    this.bullmq.getQueueStats('reports')
  ]);
  
  const metrics = this.bullmq.getMetrics();
  
  return {
    status: metrics.successRate > 90 ? 'healthy' : 'degraded',
    metrics,
    queues: stats,
    timestamp: new Date()
  };
}
```

---

## 📚 Ressources

- [BullMQ Documentation](https://docs.bullmq.io/)
- [Redis Documentation](https://redis.io/documentation)
- [Cron Expression Generator](https://crontab.guru/)

**Le BullMQModule est maintenant prêt pour une utilisation professionnelle ! 🚀**