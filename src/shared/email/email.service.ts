import { Injectable, Logger, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';
import * as fs from 'fs';
import * as path from 'path';
import * as handlebars from 'handlebars';
import { LoggerService } from '../logger/logger.service';
import { EMAIL_CONFIG_NAMESPACE } from './email.constants';
import { EmailModuleConfig, SendMailOptions } from './email.interfaces';
import { EmailResult, EmailTemplates } from './email.types';

/**
 * Service Email centralisé pour l'envoi d'emails transactionnels
 * - Support de multiples providers (SMTP, SendGrid, etc.)
 * - Système de templates avec Handlebars
 * - Métriques et monitoring intégrés
 * - Queue system pour les envois en masse
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Transporter;
  private templates: Map<string, handlebars.TemplateDelegate> = new Map();
  private config: EmailModuleConfig;
  private metrics = {
    emailsSent: 0,
    emailsFailed: 0,
    totalSendTime: 0,
    avgSendTime: 0,
    templateUsage: new Map<string, number>(),
  };

  constructor(
    @Inject(ConfigService) private readonly configService: ConfigService,
    private readonly loggerService: LoggerService,
  ) {
    this.config = this.configService.get<EmailModuleConfig>(EMAIL_CONFIG_NAMESPACE);
    this.initializeTransporter();
    this.loadTemplates();
  }

  /**
   * Initialise le transporteur selon le provider configuré
   */
  private initializeTransporter(): void {
    try {
      switch (this.config.provider) {
        case 'smtp':
          this.transporter = nodemailer.createTransport({
            host: this.config.host,
            port: this.config.port,
            secure: this.config.secure,
            auth: {
              user: this.config.user,
              pass: this.config.pass,
            },
            pool: true,
            maxConnections: 10,
            maxMessages: 100,
            rateLimit: 10, // 10 emails per second max
          });
          break;

        case 'sendgrid':
          this.transporter = nodemailer.createTransport({
            service: 'SendGrid',
            auth: {
              user: 'apikey',
              pass: this.config.pass, // SendGrid API key
            },
          });
          break;

        case 'mailgun':
          this.transporter = nodemailer.createTransport({
            service: 'Mailgun',
            auth: {
              user: this.config.user,
              pass: this.config.pass,
            },
          });
          break;

        default:
          throw new Error(`Unsupported email provider: ${this.config.provider}`);
      }

      // Vérifier la configuration
      this.transporter.verify((error, success) => {
        if (error) {
          this.logger.error('❌ Email transporter verification failed:', error);
        } else {
          this.logger.log(`✅ Email transporter verified (${this.config.provider})`);
        }
      });
    } catch (error) {
      this.logger.error('❌ Failed to initialize email transporter:', error);
      throw error;
    }
  }

  /**
   * Charge les templates depuis le système de fichiers
   */
  private loadTemplates(): void {
    if (!this.config.templatesPath) {
      this.logger.warn('⚠️ Templates path not configured');
      return;
    }

    try {
      const templatesDir = path.resolve(this.config.templatesPath);
      
      if (!fs.existsSync(templatesDir)) {
        this.logger.warn(`⚠️ Templates directory not found: ${templatesDir}`);
        return;
      }

      const templateFiles = fs.readdirSync(templatesDir).filter(file => 
        file.endsWith('.hbs') || file.endsWith('.handlebars')
      );

      for (const file of templateFiles) {
        const templateName = path.basename(file, path.extname(file));
        const templatePath = path.join(templatesDir, file);
        const templateContent = fs.readFileSync(templatePath, 'utf8');
        const template = handlebars.compile(templateContent);
        
        this.templates.set(templateName, template);
        this.logger.log(`📄 Template loaded: ${templateName}`);
      }

      this.logger.log(`✅ ${this.templates.size} email templates loaded`);
    } catch (error) {
      this.logger.error('❌ Failed to load email templates:', error);
    }
  }

  // ============================================================================
  // MÉTHODES PRINCIPALES
  // ============================================================================

  /**
   * Envoie un email avec options complètes
   */
  async sendMail(options: SendMailOptions): Promise<EmailResult> {
    const startTime = Date.now();
    
    try {
      // Préparer les données de l'email
      const mailData = await this.prepareMailData(options);
      
      // Envoyer l'email
      const result = await this.transporter.sendMail(mailData);
      
      // Calculer les métriques
      const sendTime = Date.now() - startTime;
      this.updateMetrics(true, sendTime, options.template);
      
      // Logger l'envoi
      this.loggerService.logNotificationEvent(
        'sent',
        'email',
        Array.isArray(options.to) ? options.to.join(',') : options.to,
        result.messageId,
        {
          subject: options.subject,
          template: options.template,
          sendTime,
          provider: this.config.provider,
        }
      );

      return {
        messageId: result.messageId,
        accepted: result.accepted || [],
        rejected: result.rejected || [],
        pending: result.pending || [],
        response: result.response,
      };
    } catch (error) {
      const sendTime = Date.now() - startTime;
      this.updateMetrics(false, sendTime, options.template);
      
      this.loggerService.logNotificationEvent(
        'failed',
        'email',
        Array.isArray(options.to) ? options.to.join(',') : options.to,
        undefined,
        {
          subject: options.subject,
          template: options.template,
          error: error.message,
          sendTime,
          provider: this.config.provider,
        }
      );

      throw error;
    }
  }

  /**
   * Prépare les données de l'email
   */
  private async prepareMailData(options: SendMailOptions): Promise<any> {
    const mailData: any = {
      from: this.config.from,
      to: options.to,
      subject: options.subject,
      replyTo: options.replyTo || this.config.defaultReplyTo,
    };

    // Ajouter les destinataires en copie
    if (options.cc) {
      mailData.cc = options.cc;
    }
    if (options.bcc) {
      mailData.bcc = options.bcc;
    }

    // Gestion du contenu
    if (options.template) {
      const { html, text } = await this.renderTemplate(options.template, options.context || {});
      mailData.html = html;
      mailData.text = text || this.stripHtml(html);
    } else {
      mailData.html = options.html;
      mailData.text = options.text;
    }

    // Ajouter les pièces jointes
    if (options.attachments && options.attachments.length > 0) {
      mailData.attachments = options.attachments;
    }

    return mailData;
  }

  /**
   * Rend un template avec les données fournies
   */
  private async renderTemplate(templateName: string, context: any): Promise<{ html: string; text?: string }> {
    const template = this.templates.get(templateName);
    if (!template) {
      throw new Error(`Template not found: ${templateName}`);
    }

    // Ajouter des variables globales au contexte
    const globalContext = {
      ...context,
      currentYear: new Date().getFullYear(),
      appName: 'Entrix',
      supportEmail: this.config.defaultReplyTo || 'support@entrix.tn',
      websiteUrl: process.env.FRONTEND_URL || 'https://entrix.tn',
    };

    const html = template(globalContext);
    
    // Essayer de charger le template text associé
    const textTemplate = this.templates.get(`${templateName}_text`);
    const text = textTemplate ? textTemplate(globalContext) : undefined;

    return { html, text };
  }

  /**
   * Supprime les balises HTML pour créer une version texte
   */
  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }

  /**
   * Met à jour les métriques
   */
  private updateMetrics(success: boolean, sendTime: number, template?: string): void {
    if (success) {
      this.metrics.emailsSent++;
    } else {
      this.metrics.emailsFailed++;
    }

    this.metrics.totalSendTime += sendTime;
    this.metrics.avgSendTime = this.metrics.totalSendTime / (this.metrics.emailsSent + this.metrics.emailsFailed);

    if (template) {
      const currentUsage = this.metrics.templateUsage.get(template) || 0;
      this.metrics.templateUsage.set(template, currentUsage + 1);
    }
  }

  // ============================================================================
  // MÉTHODES SPÉCIALISÉES
  // ============================================================================

 /**
 * Envoie un email de bienvenue avec toutes les variables nécessaires
 */
async sendWelcomeEmail(email: string, firstName: string, verificationToken?: string): Promise<EmailResult> {
  // Variables pour le template welcome.hbs
  const context = {
    firstName,
    emailVerificationToken: verificationToken, // Variable utilisée dans le template
    verificationUrl: verificationToken 
      ? `${process.env.FRONTEND_URL}/${process.env.API_PREFIX}/auth/verify-email?token=${verificationToken}`
      : undefined,
    
    // Variables globales pour le footer et les liens
    appName: 'Entrix',
    supportEmail: process.env.EMAIL_SUPPORT || 'support@entrix.tn',
    currentYear: new Date().getFullYear(),
    
    // URLs des réseaux sociaux (à configurer dans .env)
    facebookUrl: process.env.FACEBOOK_URL || 'https://facebook.com/entrix',
    instagramUrl: process.env.INSTAGRAM_URL || 'https://instagram.com/entrix',
    twitterUrl: process.env.TWITTER_URL || 'https://twitter.com/entrix',
    linkedinUrl: process.env.LINKEDIN_URL || 'https://linkedin.com/company/entrix',
    
    // URL de désabonnement
    unsubscribeUrl: `${process.env.FRONTEND_URL}/unsubscribe?email=${encodeURIComponent(email)}`,
    
    // URL du site web principal
    websiteUrl: process.env.FRONTEND_URL || 'https://entrix.tn',
  };

  return this.sendMail({
    to: email,
    subject: 'Bienvenue sur Entrix ! 🎉',
    template: 'welcome',
    context,
  });
}

  /**
   * Envoie un email de vérification
   */
  async sendVerificationEmail(email: string, token: string): Promise<EmailResult> {
    return this.sendMail({
      to: email,
      subject: 'Vérifiez votre adresse email',
      template: EmailTemplates.VERIFICATION,
      context: {
        token,
        verificationUrl: `${process.env.FRONTEND_URL}/verify-email?token=${token}`,
        expiresIn: '24 heures',
      },
    });
  }

  /**
   * Envoie un email de réinitialisation de mot de passe
   */
  async sendPasswordResetEmail(email: string, token: string): Promise<EmailResult> {
    return this.sendMail({
      to: email,
      subject: 'Réinitialisation de votre mot de passe',
      template: EmailTemplates.PASSWORD_RESET,
      context: {
        token,
        resetUrl: `${process.env.FRONTEND_URL}/reset-password?token=${token}`,
        expiresIn: '1 heure',
      },
    });
  }

  /**
   * Envoie un email de confirmation d'achat de ticket
   */
  async sendTicketPurchaseEmail(
    email: string,
    ticketData: any,
    eventData: any,
    orderData: any
  ): Promise<EmailResult> {
    return this.sendMail({
      to: email,
      subject: `Votre ticket pour ${eventData.name}`,
      template: EmailTemplates.TICKET_PURCHASE,
      context: {
        ticket: ticketData,
        event: eventData,
        order: orderData,
        qrCodeUrl: `${process.env.FRONTEND_URL}/ticket/${ticketData.id}/qr`,
      },
      attachments: [
        {
          filename: `ticket-${orderData.orderNumber}.pdf`,
          path: `/tmp/tickets/${ticketData.id}.pdf`, // Généré par un autre service
          contentType: 'application/pdf',
        },
      ],
    });
  }

  /**
   * Envoie un email de rappel d'événement
   */
  async sendEventReminderEmail(
    email: string,
    eventData: any,
    reminderType: '24h' | '1h' | '30min'
  ): Promise<EmailResult> {
    const reminderMessages = {
      '24h': 'Votre événement a lieu demain',
      '1h': 'Votre événement commence dans 1 heure',
      '30min': 'Votre événement commence dans 30 minutes',
    };

    return this.sendMail({
      to: email,
      subject: `Rappel: ${eventData.name}`,
      template: EmailTemplates.EVENT_REMINDER,
      context: {
        event: eventData,
        reminderType,
        reminderMessage: reminderMessages[reminderType],
        eventUrl: `${process.env.FRONTEND_URL}/event/${eventData.id}`,
      },
    });
  }

  /**
   * Envoie un email de reçu de paiement
   */
  async sendPaymentReceiptEmail(
    email: string,
    paymentData: any,
    orderData: any
  ): Promise<EmailResult> {
    return this.sendMail({
      to: email,
      subject: `Reçu de paiement - Commande ${orderData.orderNumber}`,
      template: EmailTemplates.PAYMENT_RECEIPT,
      context: {
        payment: paymentData,
        order: orderData,
        invoiceUrl: `${process.env.FRONTEND_URL}/invoice/${orderData.id}`,
      },
    });
  }

  /**
   * Envoie un email de notification à l'organisateur
   */
  async sendOrganizerNotificationEmail(
    email: string,
    notificationType: string,
    data: any
  ): Promise<EmailResult> {
    return this.sendMail({
      to: email,
      subject: `Notification Organisateur - ${notificationType}`,
      template: 'organizer_notification',
      context: {
        notificationType,
        data,
        dashboardUrl: `${process.env.FRONTEND_URL}/dashboard`,
      },
    });
  }

  /**
   * Envoie un email de rapport de ventes
   */
  async sendSalesReportEmail(
    email: string,
    reportData: any,
    reportFile?: string
  ): Promise<EmailResult> {
    const attachments = reportFile ? [
      {
        filename: 'rapport-ventes.pdf',
        path: reportFile,
        contentType: 'application/pdf',
      },
    ] : [];

    return this.sendMail({
      to: email,
      subject: `Rapport de ventes - ${reportData.period}`,
      template: EmailTemplates.SALES_REPORT,
      context: {
        report: reportData,
        generatedAt: new Date().toLocaleString('fr-FR'),
      },
      attachments,
    });
  }

  // ============================================================================
  // MÉTHODES UTILITAIRES
  // ============================================================================

  /**
   * Teste la connexion email
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      this.logger.error('❌ Email connection test failed:', error);
      return false;
    }
  }

  /**
   * Prévisualise un template
   */
  async previewTemplate(templateName: string, context: any): Promise<string> {
    const { html } = await this.renderTemplate(templateName, context);
    return html;
  }

  /**
   * Obtient la liste des templates disponibles
   */
  getAvailableTemplates(): string[] {
    return Array.from(this.templates.keys());
  }

  /**
   * Obtient les métriques d'envoi
   */
  getMetrics() {
    const totalEmails = this.metrics.emailsSent + this.metrics.emailsFailed;
    
    return {
      ...this.metrics,
      avgSendTime: parseFloat(this.metrics.avgSendTime.toFixed(2)),
      successRate: totalEmails > 0 
        ? parseFloat(((this.metrics.emailsSent / totalEmails) * 100).toFixed(2))
        : 0,
      failureRate: totalEmails > 0 
        ? parseFloat(((this.metrics.emailsFailed / totalEmails) * 100).toFixed(2))
        : 0,
      templateUsage: Object.fromEntries(this.metrics.templateUsage),
    };
  }

  /**
   * Reset les métriques
   */
  resetMetrics(): void {
    this.metrics = {
      emailsSent: 0,
      emailsFailed: 0,
      totalSendTime: 0,
      avgSendTime: 0,
      templateUsage: new Map<string, number>(),
    };
  }

  /**
   * Obtient des informations sur le service
   */
  getServiceInfo() {
    return {
      provider: this.config.provider,
      templatesLoaded: this.templates.size,
      connectionStatus: this.transporter ? 'connected' : 'disconnected',
      metrics: this.getMetrics(),
    };
  }
}