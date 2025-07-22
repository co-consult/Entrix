# EmailModule - Service d'Emails

## 📋 Vue d'ensemble

L'EmailModule fournit un service complet d'envoi d'emails transactionnels avec des fonctionnalités avancées :

- **Multi-providers** : SMTP, SendGrid, Mailgun
- **Système de templates** avec Handlebars
- **Métriques et tracking** intégrés
- **Pièces jointes** et emails HTML/texte
- **Méthodes spécialisées** pour tous les types d'emails
- **Gestion d'erreurs** et retry automatique
- **Prévisualisation** et test des templates

## 🚀 Installation

```bash
npm install nodemailer handlebars
npm install @types/nodemailer --save-dev
```

## ⚙️ Configuration

### Variables d'environnement

```bash
# .env
EMAIL_FROM=noreply@entrix.tn
EMAIL_HOST=smtp.entrix.tn
EMAIL_PORT=587
EMAIL_USER=utilisateur
EMAIL_PASS=motdepasse
EMAIL_SECURE=false
EMAIL_DEFAULT_REPLY_TO=support@entrix.tn
EMAIL_PROVIDER=smtp                    # smtp, sendgrid, mailgun
EMAIL_TEMPLATES_PATH=./templates/emails
```

### Configuration par Provider

#### SMTP

```bash
EMAIL_PROVIDER=smtp
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

#### SendGrid

```bash
EMAIL_PROVIDER=sendgrid
EMAIL_USER=apikey
EMAIL_PASS=SG.xxxxx-your-sendgrid-api-key
```

#### Mailgun

```bash
EMAIL_PROVIDER=mailgun
EMAIL_USER=postmaster@your-domain.mailgun.org
EMAIL_PASS=your-mailgun-api-key
```

### Structure des Templates

```
templates/
├── emails/
│   ├── welcome.hbs
│   ├── welcome_text.hbs
│   ├── verification.hbs
│   ├── password-reset.hbs
│   ├── ticket-purchase.hbs
│   ├── event-reminder.hbs
│   └── base.hbs
└── partials/
    ├── header.hbs
    └── footer.hbs
```

## 🔧 Utilisation

### Injection de Base

```typescript
import { Injectable } from '@nestjs/common';
import { EmailService } from '@shared/email';

@Injectable()
export class AuthService {
  constructor(private readonly email: EmailService) {}
}
```

### Envoi d'Email Simple

```typescript
// Email HTML basique
await this.email.sendMail({
  to: 'user@example.com',
  subject: 'Bienvenue sur Entrix',
  html: '<h1>Bienvenue !</h1><p>Merci de vous être inscrit.</p>',
  text: 'Bienvenue ! Merci de vous être inscrit.'
});

// Email avec template
await this.email.sendMail({
  to: 'user@example.com',
  subject: 'Bienvenue sur Entrix',
  template: 'welcome',
  context: {
    firstName: 'John',
    verificationUrl: 'https://entrix.tn/verify?token=abc123'
  }
});
```

## 🛠️ Fonctionnalités Avancées

### Emails avec Templates

```typescript
// Template welcome.hbs
/*
<!DOCTYPE html>
<html>
<head>
  <title>Bienvenue sur {{appName}}</title>
</head>
<body>
  <h1>Bienvenue {{firstName}} !</h1>
  <p>Merci de vous être inscrit sur {{appName}}.</p>
  
  {{#if verificationToken}}
    <p>
      <a href="{{verificationUrl}}">Vérifier votre email</a>
    </p>
  {{/if}}
  
  <p>
    Cordialement,<br>
    L'équipe {{appName}}
  </p>
</body>
</html>
*/

// Utilisation
await this.email.sendMail({
  to: 'user@example.com',
  subject: 'Bienvenue sur Entrix',
  template: 'welcome',
  context: {
    firstName: 'John',
    verificationToken: 'abc123',
    verificationUrl: 'https://entrix.tn/verify?token=abc123'
  }
});
```

### Emails avec Pièces Jointes

```typescript
// Pièce jointe simple
await this.email.sendMail({
  to: 'user@example.com',
  subject: 'Votre facture',
  template: 'invoice',
  context: { orderNumber: '12345' },
  attachments: [
    {
      filename: 'facture-12345.pdf',
      path: '/tmp/invoices/facture-12345.pdf',
      contentType: 'application/pdf'
    }
  ]
});

// Pièce jointe depuis un buffer
const pdfBuffer = await this.generateInvoicePDF(orderData);
await this.email.sendMail({
  to: 'user@example.com',
  subject: 'Votre facture',
  template: 'invoice',
  context: { orderData },
  attachments: [
    {
      filename: 'facture.pdf',
      content: pdfBuffer,
      contentType: 'application/pdf'
    }
  ]
});
```

### Emails Multiples

```typescript
// Destinataires multiples
await this.email.sendMail({
  to: ['user1@example.com', 'user2@example.com'],
  cc: ['manager@entrix.tn'],
  bcc: ['admin@entrix.tn'],
  subject: 'Mise à jour importante',
  template: 'announcement',
  context: {
    announcement: 'Nouvelle fonctionnalité disponible'
  }
});
```

## 🎯 Méthodes Spécialisées

### Authentification

```typescript
// Email de bienvenue
await this.email.sendWelcomeEmail(
  'user@example.com',
  'John',
  'verification-token-123' // Optionnel
);

// Email de vérification
await this.email.sendVerificationEmail(
  'user@example.com',
  'verification-token-123'
);

// Reset de mot de passe
await this.email.sendPasswordResetEmail(
  'user@example.com',
  'reset-token-123'
);
```

### Événements

```typescript
// Confirmation d'achat de ticket
await this.email.sendTicketPurchaseEmail(
  'user@example.com',
  {
    id: 'ticket-123',
    type: 'VIP',
    seat: 'A12'
  },
  {
    id: 'event-456',
    name: 'Concert de Jazz',
    date: new Date('2025-03-15'),
    venue: 'Opéra de Tunis'
  },
  {
    id: 'order-789',
    orderNumber: 'ENT-2025-001',
    total: 120.00
  }
);

// Rappel d'événement
await this.email.sendEventReminderEmail(
  'user@example.com',
  {
    id: 'event-456',
    name: 'Concert de Jazz',
    date: new Date('2025-03-15'),
    venue: 'Opéra de Tunis'
  },
  '24h' // ou '1h', '30min'
);
```

### Paiements

```typescript
// Reçu de paiement
await this.email.sendPaymentReceiptEmail(
  'user@example.com',
  {
    id: 'payment-123',
    amount: 120.00,
    currency: 'TND',
    method: 'card',
    status: 'completed'
  },
  {
    id: 'order-789',
    orderNumber: 'ENT-2025-001',
    items: [
      { name: 'Ticket VIP', price: 100.00 },
      { name: 'Frais de service', price: 20.00 }
    ]
  }
);
```

### Organisateurs

```typescript
// Notification organisateur
await this.email.sendOrganizerNotificationEmail(
  'organizer@example.com',
  'Nouvelle vente',
  {
    eventName: 'Concert de Jazz',
    ticketsSold: 5,
    revenue: 500.00,
    date: new Date()
  }
);

// Rapport de ventes
await this.email.sendSalesReportEmail(
  'organizer@example.com',
  {
    period: 'Janvier 2025',
    totalSales: 15000.00,
    ticketsSold: 150,
    events: 5
  },
  '/tmp/reports/sales-jan-2025.pdf' // Fichier PDF
);
```

## 📊 Monitoring et Métriques

### Métriques Détaillées

```typescript
// Récupérer les métriques
const metrics = this.email.getMetrics();
console.log(metrics);
/*
{
  emailsSent: 1250,
  emailsFailed: 23,
  totalSendTime: 1482750,
  avgSendTime: 1245.67,
  successRate: 98.16,
  failureRate: 1.84,
  templateUsage: {
    'welcome': 450,
    'verification': 300,
    'password-reset': 125,
    'ticket-purchase': 200
  }
}
*/

// Analyser les performances
if (metrics.successRate < 95) {
  console.warn('Taux de succès email faible');
}

if (metrics.avgSendTime > 3000) {
  console.warn('Temps d\'envoi élevé');
}
```

### Tests et Validation

```typescript
// Tester la connexion
const isConnected = await this.email.testConnection();
console.log('Email service connected:', isConnected);

// Informations sur le service
const info = this.email.getServiceInfo();
console.log(info);
/*
{
  provider: 'smtp',
  templatesLoaded: 8,
  connectionStatus: 'connected',
  metrics: { ... }
}
*/
```

### Gestion des Templates

```typescript
// Lister les templates disponibles
const templates = this.email.getAvailableTemplates();
console.log('Templates disponibles:', templates);

// Prévisualiser un template
const preview = await this.email.previewTemplate('welcome', {
  firstName: 'John',
  verificationToken: 'preview-token'
});
console.log('Preview HTML:', preview);
```

## 🎯 Exemples Pratiques

### Service d'Authentification

```typescript
@Injectable()
export class AuthEmailService {
  constructor(
    private readonly email: EmailService,
    private readonly logger: LoggerService
  ) {}

  async sendCompleteWelcomeFlow(user: User, verificationToken: string) {
    try {
      // 1. Email de bienvenue avec vérification
      await this.email.sendWelcomeEmail(
        user.email,
        user.firstName,
        verificationToken
      );

      // 2. Programmer un rappel de vérification (24h)
      await this.scheduleVerificationReminder(user.email, verificationToken);

      this.logger.logBusinessEvent('WELCOME_EMAIL_SENT', {
        userId: user.id,
        email: user.email
      });

    } catch (error) {
      this.logger.logErrorEvent(error, 'AuthEmailService', user.id);
      throw error;
    }
  }

  private async scheduleVerificationReminder(email: string, token: string) {
    // Utiliser BullMQ pour programmer l'envoi
    await this.bullmq.addDelayedJob(
      'email',
      'send-verification-reminder',
      { email, token },
      86400000 // 24h
    );
  }

  async resendVerificationEmail(email: string, token: string) {
    await this.email.sendVerificationEmail(email, token);
    
    this.logger.logBusinessEvent('VERIFICATION_EMAIL_RESENT', {
      email,
      timestamp: new Date()
    });
  }
}
```

### Service de Notifications d'Événements

```typescript
@Injectable()
export class EventEmailService {
  constructor(
    private readonly email: EmailService,
    private readonly bullmq: BullmqService
  ) {}

  async sendTicketPurchaseConfirmation(
    order: Order,
    event: Event,
    tickets: Ticket[]
  ) {
    for (const ticket of tickets) {
      await this.email.sendTicketPurchaseEmail(
        ticket.email,
        ticket,
        event,
        order
      );
    }

    // Programmer les rappels
    await this.scheduleEventReminders(event, tickets);
  }

  private async scheduleEventReminders(event: Event, tickets: Ticket[]) {
    const eventDate = new Date(event.date);
    const now = new Date();

    // Rappel 24h avant
    const reminder24h = new Date(eventDate.getTime() - 24 * 60 * 60 * 1000);
    if (reminder24h > now) {
      await this.scheduleReminder(tickets, event, reminder24h, '24h');
    }

    // Rappel 1h avant
    const reminder1h = new Date(eventDate.getTime() - 60 * 60 * 1000);
    if (reminder1h > now) {
      await this.scheduleReminder(tickets, event, reminder1h, '1h');
    }
  }

  private async scheduleReminder(
    tickets: Ticket[],
    event: Event,
    reminderTime: Date,
    type: string
  ) {
    const delay = reminderTime.getTime() - Date.now();

    for (const ticket of tickets) {
      await this.bullmq.addDelayedJob(
        'email',
        'send-event-reminder',
        {
          email: ticket.email,
          event,
          reminderType: type
        },
        delay
      );
    }
  }
}
```

### Service de Rapports

```typescript
@Injectable()
export class ReportEmailService {
  constructor(
    private readonly email: EmailService,
    private readonly reportGenerator: ReportGenerator
  ) {}

  async sendDailySalesReport(organizerId: string) {
    const organizer = await this.getOrganizer(organizerId);
    const reportData = await this.generateDailySalesData(organizerId);
    
    // Générer le PDF
    const pdfPath = await this.reportGenerator.generateSalesReport(reportData);

    await this.email.sendSalesReportEmail(
      organizer.email,
      reportData,
      pdfPath
    );

    // Nettoyer le fichier temporaire
    await this.cleanupTempFile(pdfPath);
  }

  async sendCustomReport(
    organizerId: string,
    reportType: string,
    filters: any
  ) {
    const organizer = await this.getOrganizer(organizerId);
    const reportData = await this.generateCustomReport(reportType, filters);

    await this.email.sendMail({
      to: organizer.email,
      subject: `Rapport ${reportType} - ${new Date().toLocaleDateString()}`,
      template: 'custom-report',
      context: {
        organizerName: organizer.name,
        reportType,
        reportData,
        generatedAt: new Date()
      }
    });
  }
}
```

## 🔧 Bonnes Pratiques

### 1. Gestion des Erreurs

```typescript
// ✅ Bon - Gestion complète des erreurs
async sendEmail(to: string, subject: string, template: string, context: any) {
  try {
    const result = await this.email.sendMail({
      to,
      subject,
      template,
      context
    });
    
    this.logger.logNotificationEvent('sent', 'email', to, result.messageId);
    return result;
  } catch (error) {
    this.logger.logNotificationEvent('failed', 'email', to, undefined, {
      error: error.message,
      template,
      subject
    });
    
    // Différencier les erreurs
    if (error.code === 'ENOTFOUND') {
      throw new ServiceUnavailableException('Service email temporairement indisponible');
    } else if (error.responseCode === 550) {
      throw new BadRequestException('Adresse email invalide');
    } else {
      throw new InternalServerErrorException('Erreur d\'envoi d\'email');
    }
  }
}
```

### 2. Optimisation des Templates

```typescript
// ✅ Bon - Templates réutilisables
// base.hbs
/*
<!DOCTYPE html>
<html>
<head>
  <title>{{title}} - {{appName}}</title>
  <style>
    body { font-family: Arial, sans-serif; }
    .container { max-width: 600px; margin: 0 auto; }
  </style>
</head>
<body>
  <div class="container">
    {{> header}}
    {{{body}}}
    {{> footer}}
  </div>
</body>
</html>
*/

// welcome.hbs
/*
{{#> base title="Bienvenue"}}
  <h1>Bienvenue {{firstName}} !</h1>
  <p>Merci de vous être inscrit sur {{appName}}.</p>
{{/base}}
*/
```

### 3. Validation des Données

```typescript
// ✅ Bon - Validation avant envoi
async sendWelcomeEmail(email: string, firstName: string, token?: string) {
  // Validation
  if (!email || !this.isValidEmail(email)) {
    throw new BadRequestException('Adresse email invalide');
  }
  
  if (!firstName || firstName.trim().length === 0) {
    throw new BadRequestException('Prénom requis');
  }

  return this.email.sendWelcomeEmail(email, firstName, token);
}

private isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
```

### 4. Rate Limiting

```typescript
// ✅ Bon - Limitation des envois
async sendEmail(to: string, template: string, context: any) {
  // Vérifier le rate limiting
  const canSend = await this.checkRateLimit(to);
  if (!canSend) {
    throw new TooManyRequestsException('Limite d\'envois atteinte');
  }

  return this.email.sendMail({ to, template, context });
}

private async checkRateLimit(email: string): Promise<boolean> {
  const key = `email_rate_limit:${email}`;
  const count = await this.redis.increment(key, 3600); // 1 heure
  return count <= 10; // Max 10 emails par heure
}
```

## 🐛 Troubleshooting

### Problèmes Courants

#### 1. Échec d'Authentification

```bash
Error: Invalid login: 535-5.7.8 Username and Password not accepted
```

**Solutions :**
```typescript
// Vérifier les credentials
const connected = await this.email.testConnection();
console.log('Email connection:', connected);

// Pour Gmail, utiliser un mot de passe d'application
// EMAIL_USER=your-email@gmail.com
// EMAIL_PASS=your-app-password (pas votre mot de passe normal)
```

#### 2. Templates Non Trouvés

```bash
Error: Template not found: welcome
```

**Solutions :**
```typescript
// Vérifier le chemin des templates
console.log('Templates path:', process.env.EMAIL_TEMPLATES_PATH);

// Lister les templates chargés
const templates = this.email.getAvailableTemplates();
console.log('Available templates:', templates);

// Vérifier que le fichier existe
const fs = require('fs');
const templatePath = './templates/emails/welcome.hbs';
console.log('Template exists:', fs.existsSync(templatePath));
```

#### 3. Emails en Spam

```bash
Emails going to spam folder
```

**Solutions :**
```typescript
// Configurer SPF, DKIM, DMARC
// Utiliser un domaine vérifié
// Éviter les mots-clés spam

// Configurer les headers
await this.email.sendMail({
  to: 'user@example.com',
  subject: 'Bienvenue',
  template: 'welcome',
  context: { firstName: 'John' },
  headers: {
    'X-Priority': '3',
    'X-MSMail-Priority': 'Normal'
  }
});
```

#### 4. Erreurs de Timeout

```bash
Error: Connection timeout
```

**Solutions :**
```bash
# Augmenter les timeouts
EMAIL_TIMEOUT=10000

# Ou utiliser un pool de connexions
EMAIL_POOL=true
EMAIL_MAX_CONNECTIONS=5
```

### Debug et Logs

```typescript
// Activer les logs détaillés
const transporter = nodemailer.createTransporter({
  // ... config
  debug: true,
  logger: true
});

// Logs personnalisés
await this.email.sendMail({
  to: 'user@example.com',
  subject: 'Test',
  text: 'Test email'
}).then(result => {
  console.log('Email sent:', result.messageId);
}).catch(error => {
  console.error('Email failed:', error);
});
```

## 🚀 Déploiement

### Configuration Production

```bash
# .env.production
EMAIL_PROVIDER=sendgrid
EMAIL_USER=apikey
EMAIL_PASS=SG.xxxxx-your-production-key
EMAIL_FROM=noreply@entrix.tn
EMAIL_DEFAULT_REPLY_TO=support@entrix.tn
EMAIL_TEMPLATES_PATH=/app/templates/emails
```

### Sécurité

```typescript
// Validation stricte en production
if (process.env.NODE_ENV === 'production') {
  // Vérifier les domaines autorisés
  const allowedDomains = ['entrix.tn', 'gmail.com', 'yahoo.com'];
  const emailDomain = email.split('@')[1];
  
  if (!allowedDomains.includes(emailDomain)) {
    throw new BadRequestException('Domaine email non autorisé');
  }
}
```

### Monitoring Production

```typescript
// Endpoint de santé
@Get('health/email')
async emailHealth() {
  try {
    const connected = await this.email.testConnection();
    const metrics = this.email.getMetrics();
    
    return {
      status: connected ? 'healthy' : 'unhealthy',
      metrics,
      templatesLoaded: this.email.getAvailableTemplates().length,
      timestamp: new Date()
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date()
    };
  }
}
```

---

## 📚 Ressources

- [Nodemailer Documentation](https://nodemailer.com/about/)
- [Handlebars Documentation](https://handlebarsjs.com/)
- [SendGrid Documentation](https://docs.sendgrid.com/)
- [Mailgun Documentation](https://documentation.mailgun.com/)

**L'EmailModule est maintenant prêt pour une utilisation professionnelle ! 📧**