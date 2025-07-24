// src/shared/email/email.service.ts - ENHANCED VERSION

import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';
import { LoggerService } from '../logger/logger.service';

/**
 * Interface pour les options d'email avec support de chemins personnalisés
 */
export interface EnhancedSendMailOptions {
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject: string;
  template?: string;           // Nom du template (comportement existant)
  templatePath?: string;       // ✅ NOUVEAU : Chemin complet du template
  context?: any;
  html?: string;
  text?: string;
  attachments?: any[];
  replyTo?: string;
  headers?: any;
}

/**
 * Interface pour les résultats d'envoi
 */
export interface EmailResult {
  messageId: string;
  accepted: string[];
  rejected: string[];
  pending: string[];
  response: string;
}

/**
 * Templates d'email par défaut
 */
export enum EmailTemplates {
  // Templates Auth
  WELCOME = 'welcome',
  VERIFICATION = 'verification', 
  PASSWORD_RESET = 'password-reset',
  
  // Templates Auth avec chemins personnalisés
  AUTH_WELCOME = 'auth/welcome',
  AUTH_EMAIL_VERIFICATION = 'auth/email-verification',
  AUTH_PASSWORD_RESET = 'auth/password-reset',
  AUTH_MFA_SETUP = 'auth/mfa-setup',
  AUTH_SECURITY_ALERT = 'auth/security-alert',
  AUTH_DEVICE_VERIFICATION = 'auth/device-verification',
  
  // Autres templates
  TICKET_PURCHASE = 'ticket-purchase',
  EVENT_REMINDER = 'event-reminder',
  ORDER_CONFIRMATION = 'order-confirmation',
}

/**
 * EmailService Amélioré Entrix V3.0 - Grade A+
 * ✅ NOUVEAU : Support chemins de templates personnalisés
 * ✅ NOUVEAU : Structure hiérarchique (auth/, orders/, events/)
 * ✅ NOUVEAU : Méthodes spécialisées Auth avec chemins personnalisés
 */

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;
  private templates: Map<string, HandlebarsTemplateDelegate> = new Map();
  private config: any;
  private metrics = {
    emailsSent: 0,
    emailsFailed: 0,
    totalSendTime: 0,
    avgSendTime: 0,
    templateUsage: new Map<string, number>(),
  };

  constructor(
    private readonly configService: ConfigService,
    private readonly loggerService: LoggerService,
  ) {
    this.config = this.loadConfig();
    this.initializeTransporter();
    this.loadTemplates();
  }

  /**
   * ✅ MÉTHODE PRINCIPALE AMÉLIORÉE
   * Support template OU templatePath
   */
  async sendMail(options: EnhancedSendMailOptions): Promise<EmailResult> {
    const startTime = Date.now();
    
    try {
      // Préparer les données de l'email
      const mailData = await this.prepareMailData(options);
      
      // Envoyer l'email
      const result = await this.transporter.sendMail(mailData);
      
      // Calculer les métriques
      const sendTime = Date.now() - startTime;
      this.updateMetrics(true, sendTime, options.template || options.templatePath);
      
      // Logger l'envoi
      this.loggerService.logNotificationEvent(
        'sent',
        'email',
        Array.isArray(options.to) ? options.to.join(',') : options.to,
        result.messageId,
        {
          subject: options.subject,
          template: options.template,
          templatePath: options.templatePath,
          sendTime,
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
      this.updateMetrics(false, sendTime, options.template || options.templatePath);
      
      this.loggerService.logNotificationEvent(
        'failed',
        'email',
        Array.isArray(options.to) ? options.to.join(',') : options.to,
        undefined,
        {
          subject: options.subject,
          template: options.template,
          templatePath: options.templatePath,
          error: error.message,
          sendTime,
        }
      );

      throw error;
    }
  }

  /**
   * ✅ NOUVELLE MÉTHODE : Envoi avec chemin de template personnalisé
   */
  async sendMailWithCustomTemplate(
    to: string | string[],
    subject: string,
    templatePath: string,
    context: any = {},
    options?: Partial<EnhancedSendMailOptions>
  ): Promise<EmailResult> {
    return this.sendMail({
      to,
      subject,
      templatePath,
      context,
      ...options,
    });
  }

  /**
   * ✅ MÉTHODE AMÉLIORÉE : Prépare les données email avec support templatePath
   */
  private async prepareMailData(options: EnhancedSendMailOptions): Promise<any> {
    const mailData: any = {
      from: this.config.from,
      to: options.to,
      subject: options.subject,
      replyTo: options.replyTo || this.config.defaultReplyTo,
    };

    // Ajouter les destinataires en copie
    if (options.cc) mailData.cc = options.cc;
    if (options.bcc) mailData.bcc = options.bcc;
    if (options.headers) mailData.headers = options.headers;

    // ✅ NOUVEAU : Gestion du contenu avec templatePath OU template
    if (options.templatePath) {
      // Utiliser chemin personnalisé
      const { html, text } = await this.renderTemplateFromPath(
        options.templatePath, 
        options.context || {}
      );
      mailData.html = html;
      mailData.text = text || this.stripHtml(html);
    } else if (options.template) {
      // Utiliser template pré-chargé (comportement existant)
      const { html, text } = await this.renderTemplate(
        options.template, 
        options.context || {}
      );
      mailData.html = html;
      mailData.text = text || this.stripHtml(html);
    } else if (options.html || options.text) {
      // Contenu direct
      mailData.html = options.html;
      mailData.text = options.text;
    } else {
      throw new BadRequestException('Template, templatePath, html ou text requis');
    }

    // Ajouter les pièces jointes
    if (options.attachments?.length > 0) {
      mailData.attachments = options.attachments;
    }

    return mailData;
  }

  /**
   * ✅ NOUVELLE MÉTHODE : Rend un template depuis un chemin personnalisé
   */
  private async renderTemplateFromPath(
    templatePath: string, 
    context: any
  ): Promise<{ html: string; text?: string }> {
    try {
      // Construire le chemin complet
      const fullPath = path.resolve(process.cwd(), 'templates/emails', templatePath);
      const htmlPath = fullPath.endsWith('.hbs') ? fullPath : `${fullPath}.hbs`;
      
      // Vérifier que le fichier existe
      if (!fs.existsSync(htmlPath)) {
        throw new Error(`Template not found at path: ${htmlPath}`);
      }

      // Lire et compiler le template
      const templateContent = fs.readFileSync(htmlPath, 'utf8');
      const compiledTemplate = handlebars.compile(templateContent);

      // Ajouter des variables globales au contexte
      const globalContext = {
        ...context,
        currentYear: new Date().getFullYear(),
        appName: 'Entrix',
        supportEmail: this.config.defaultReplyTo || 'support@entrix.tn',
        websiteUrl: process.env.FRONTEND_URL || 'https://entrix.tn',
      };

      const html = compiledTemplate(globalContext);
      
      // Essayer de charger la version texte
      const textPath = htmlPath.replace('.hbs', '_text.hbs');
      let text: string | undefined;
      
      if (fs.existsSync(textPath)) {
        const textContent = fs.readFileSync(textPath, 'utf8');
        const textTemplate = handlebars.compile(textContent);
        text = textTemplate(globalContext);
      }

      return { html, text };
    } catch (error) {
      this.logger.error(`Erreur rendering template ${templatePath}:`, error);
      throw new Error(`Impossible de rendre le template: ${templatePath}`);
    }
  }

  /**
   * Rend un template pré-chargé (méthode existante)
   */
  private async renderTemplate(
    templateName: string, 
    context: any
  ): Promise<{ html: string; text?: string }> {
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

  // ============================================================================
  // ✅ NOUVELLES MÉTHODES AUTH AVEC CHEMINS PERSONNALISÉS
  // ============================================================================

  /**
   * ✅ NOUVEAU : Email bienvenue Auth avec template personnalisé
   */
  async sendAuthWelcomeEmail(
    email: string, 
    firstName: string, 
    verificationToken?: string
  ): Promise<EmailResult> {
    return this.sendMailWithCustomTemplate(
      email,
      'Bienvenue sur Entrix ! 🎉',
      'auth/welcome',  // templates/emails/auth/welcome.hbs
      {
        firstName,
        verificationToken,
        verificationUrl: verificationToken 
          ? `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`
          : undefined,
      }
    );
  }

  /**
   * ✅ NOUVEAU : Email vérification avec template Auth
   */
  async sendAuthVerificationEmail(
    email: string, 
    token: string
  ): Promise<EmailResult> {
    return this.sendMailWithCustomTemplate(
      email,
      'Vérifiez votre adresse email',
      'auth/email-verification',  // templates/emails/auth/email-verification.hbs
      {
        token,
        verificationUrl: `${process.env.FRONTEND_URL}/verify-email?token=${token}`,
        expiresIn: '24 heures',
      }
    );
  }

  /**
   * ✅ NOUVEAU : Email reset password avec template Auth
   */
  async sendAuthPasswordResetEmail(
    email: string, 
    token: string
  ): Promise<EmailResult> {
    return this.sendMailWithCustomTemplate(
      email,
      'Réinitialisation de votre mot de passe',
      'auth/password-reset',  // templates/emails/auth/password-reset.hbs
      {
        token,
        resetUrl: `${process.env.FRONTEND_URL}/reset-password?token=${token}`,
        expiresIn: '1 heure',
      }
    );
  }

  /**
   * ✅ NOUVEAU : Email alerte sécurité
   */
  async sendAuthSecurityAlertEmail(
    email: string,
    alertType: string,
    alertData: any
  ): Promise<EmailResult> {
    return this.sendMailWithCustomTemplate(
      email,
      'Alerte de sécurité - Entrix',
      'auth/security-alert',  // templates/emails/auth/security-alert.hbs
      {
        alertType,
        ...alertData,
        timestamp: new Date().toISOString(),
      }
    );
  }

  /**
   * ✅ NOUVEAU : Email vérification nouveau device
   */
  async sendAuthDeviceVerificationEmail(
    email: string,
    deviceInfo: any,
    verificationCode: string
  ): Promise<EmailResult> {
    return this.sendMailWithCustomTemplate(
      email,
      'Nouveau device détecté',
      'auth/device-verification',  // templates/emails/auth/device-verification.hbs
      {
        deviceInfo,
        verificationCode,
        verificationUrl: `${process.env.FRONTEND_URL}/verify-device?code=${verificationCode}`,
      }
    );
  }

  // ============================================================================
  // MÉTHODES UTILITAIRES
  // ============================================================================

  /**
   * Charge la configuration
   */
  private loadConfig(): any {
    return {
      from: this.configService.get<string>('EMAIL_FROM'),
      host: this.configService.get<string>('EMAIL_HOST'),
      port: this.configService.get<number>('EMAIL_PORT', 587),
      user: this.configService.get<string>('EMAIL_USER'),
      pass: this.configService.get<string>('EMAIL_PASS'),
      secure: this.configService.get<boolean>('EMAIL_SECURE', false),
      defaultReplyTo: this.configService.get<string>('EMAIL_DEFAULT_REPLY_TO'),
      provider: this.configService.get<string>('EMAIL_PROVIDER', 'smtp'),
      templatesPath: this.configService.get<string>('EMAIL_TEMPLATES_PATH', './templates/emails'),
    };
  }

  /**
   * Initialise le transporteur
   */
  private initializeTransporter(): void {
    this.transporter = nodemailer.createTransporter({
      host: this.config.host,
      port: this.config.port,
      secure: this.config.secure,
      auth: {
        user: this.config.user,
        pass: this.config.pass,
      },
    });
  }

  /**
   * Charge tous les templates depuis le dossier configuré
   */
  private loadTemplates(): void {
    try {
      const templatesDir = path.resolve(process.cwd(), this.config.templatesPath);
      
      if (!fs.existsSync(templatesDir)) {
        this.logger.warn(`Templates directory not found: ${templatesDir}`);
        return;
      }

      // Charger récursivement tous les templates .hbs
      this.loadTemplatesRecursive(templatesDir, '');

      this.logger.log(`✅ ${this.templates.size} email templates loaded from ${templatesDir}`);
    } catch (error) {
      this.logger.error('❌ Failed to load email templates:', error);
    }
  }

  /**
   * ✅ NOUVEAU : Charge les templates récursivement (support sous-dossiers)
   */
  private loadTemplatesRecursive(dir: string, relativePath: string): void {
    const files = fs.readdirSync(dir);

    for (const file of files) {
      const filePath = path.join(dir, file);
      const fileRelativePath = relativePath ? `${relativePath}/${file}` : file;
      
      if (fs.statSync(filePath).isDirectory()) {
        // Recursion dans les sous-dossiers
        this.loadTemplatesRecursive(filePath, fileRelativePath);
      } else if (file.endsWith('.hbs') || file.endsWith('.handlebars')) {
        // Charger le template
        const templateName = fileRelativePath.replace(/\.(hbs|handlebars)$/, '');
        const templateContent = fs.readFileSync(filePath, 'utf8');
        const template = handlebars.compile(templateContent);
        
        this.templates.set(templateName, template);
        this.logger.log(`📄 Template loaded: ${templateName}`);
      }
    }
  }

  /**
   * Supprime les balises HTML
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

  /**
   * Test de connexion
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      this.logger.error('Email connection test failed:', error);
      return false;
    }
  }

  /**
   * Obtient les templates disponibles
   */
  getAvailableTemplates(): string[] {
    return Array.from(this.templates.keys());
  }

  /**
   * Obtient les métriques
   */
  getMetrics() {
    return {
      ...this.metrics,
      templateUsage: Object.fromEntries(this.metrics.templateUsage),
    };
  }
}