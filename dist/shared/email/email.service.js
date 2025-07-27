"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const nodemailer = __importStar(require("nodemailer"));
const logger_service_1 = require("../logger/logger.service");
const redis_service_1 = require("../redis/redis.service");
let EmailService = class EmailService {
    config;
    redis;
    logger;
    primaryTransporter;
    fallbackTransporter;
    isEnabled;
    metrics;
    constructor(config, redis, loggerService) {
        this.config = config;
        this.redis = redis;
        this.logger = loggerService.createChildLogger('EmailService');
        this.isEnabled = this.config.get('EMAIL_ENABLED', true);
        this.metrics = {
            sent: 0,
            failed: 0,
            queued: 0,
            successRate: 0,
            averageDeliveryTime: 0,
            errors: {}
        };
        if (this.isEnabled) {
            this.setupTransporters();
        }
    }
    setupTransporters() {
        try {
            this.primaryTransporter = nodemailer.createTransporter({
                host: this.config.get('SMTP_HOST'),
                port: this.config.get('SMTP_PORT', 587),
                secure: this.config.get('SMTP_SECURE', false),
                auth: {
                    user: this.config.get('SMTP_USER'),
                    pass: this.config.get('SMTP_PASSWORD'),
                },
                pool: true,
                maxConnections: 5,
                maxMessages: 100,
                rateDelta: 1000,
                rateLimit: 5,
                connectionTimeout: 10000,
                greetingTimeout: 5000,
                socketTimeout: 10000,
            });
            const fallbackHost = this.config.get('SMTP_FALLBACK_HOST');
            if (fallbackHost) {
                this.fallbackTransporter = nodemailer.createTransporter({
                    host: fallbackHost,
                    port: this.config.get('SMTP_FALLBACK_PORT', 587),
                    secure: this.config.get('SMTP_FALLBACK_SECURE', false),
                    auth: {
                        user: this.config.get('SMTP_FALLBACK_USER'),
                        pass: this.config.get('SMTP_FALLBACK_PASSWORD'),
                    },
                    pool: true,
                    maxConnections: 3,
                    maxMessages: 50,
                });
            }
            this.logger.info('Email transporters configured successfully');
        }
        catch (error) {
            this.logger.error('Failed to setup email transporters', error.stack);
            this.isEnabled = false;
        }
    }
    async sendEmail(options, blocking = false) {
        if (!blocking) {
            setImmediate(() => this.processSendEmail(options));
            return { success: true, provider: 'queued' };
        }
        return this.processSendEmail(options);
    }
    async processSendEmail(options) {
        if (!this.isEnabled) {
            this.logger.warn('Email service disabled, skipping email send');
            this.metrics.failed++;
            return { success: false, error: 'Email service disabled' };
        }
        const operationId = this.logger.startOperation('sendEmail', {
            to: this.maskEmail(Array.isArray(options.to) ? options.to[0] : options.to),
            subject: options.subject,
            template: options.template
        });
        const startTime = Date.now();
        const maxRetries = options.retryAttempts || 3;
        let lastError = '';
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const canSend = await this.checkRateLimit(options.to);
                if (!canSend) {
                    throw new Error('Rate limit exceeded for recipient');
                }
                const result = await this.attemptSend(options, attempt);
                if (result.success) {
                    this.metrics.sent++;
                    this.metrics.averageDeliveryTime = (this.metrics.averageDeliveryTime + (Date.now() - startTime)) / 2;
                    this.metrics.lastSent = new Date();
                    this.updateSuccessRate();
                    this.logger.endOperation('sendEmail', operationId, true, undefined, {
                        attempt,
                        provider: result.provider,
                        messageId: result.messageId,
                        deliveryTime: Date.now() - startTime
                    });
                    return result;
                }
                lastError = result.error || 'Unknown error';
                if (attempt < maxRetries) {
                    const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
                    this.logger.warn(`Email send failed, retrying in ${delay}ms`, JSON.stringify({
                        attempt,
                        error: lastError,
                        nextAttemptIn: delay
                    }));
                    await this.sleep(delay);
                }
            }
            catch (error) {
                lastError = error.message || 'Unknown error';
                this.logger.warn(`Email send attempt ${attempt} failed`, JSON.stringify({
                    attempt,
                    error: lastError
                }));
            }
        }
        this.metrics.failed++;
        this.metrics.errors[lastError] = (this.metrics.errors[lastError] || 0) + 1;
        this.updateSuccessRate();
        this.logger.endOperation('sendEmail', operationId, false, undefined, {
            maxRetries,
            lastError,
            totalTime: Date.now() - startTime
        });
        if (this.isTemporaryError(lastError)) {
            await this.queueForRetry(options);
        }
        return {
            success: false,
            error: lastError,
            retryCount: maxRetries
        };
    }
    async sendWelcomeEmail(userEmail, userFirstName, verificationUrl) {
        return this.sendEmail({
            to: userEmail,
            subject: 'Bienvenue au Club Sportif Sfaxien ! 🏆',
            template: 'welcome',
            context: {
                firstName: userFirstName,
                verificationUrl
            },
            priority: 'normal',
            retryAttempts: 2
        }, false);
    }
    async sendVerificationEmail(userEmail, verificationToken) {
        const verificationUrl = `${this.config.get('FRONTEND_URL')}/verify-email?token=${verificationToken}`;
        return this.sendEmail({
            to: userEmail,
            subject: 'Entrix - Vérifiez votre adresse email',
            template: 'email-verification',
            context: {
                verificationUrl,
                verificationToken
            },
            priority: 'high',
            retryAttempts: 3
        }, false);
    }
    async testConnection() {
        if (!this.isEnabled) {
            return false;
        }
        try {
            await this.primaryTransporter.verify();
            return true;
        }
        catch (error) {
            this.logger.error('Email connection test failed', error.stack);
            return false;
        }
    }
    getMetrics() {
        return { ...this.metrics };
    }
    updateSuccessRate() {
        const total = this.metrics.sent + this.metrics.failed;
        this.metrics.successRate = total > 0 ? (this.metrics.sent / total) * 100 : 0;
    }
    async attemptSend(options, attempt) {
        const transporters = [
            { transporter: this.primaryTransporter, name: 'primary' },
            ...(this.fallbackTransporter ? [{ transporter: this.fallbackTransporter, name: 'fallback' }] : [])
        ];
        for (const { transporter, name } of transporters) {
            try {
                const mailOptions = await this.buildMailOptions(options);
                const result = await transporter.sendMail(mailOptions);
                return {
                    success: true,
                    messageId: result.messageId,
                    provider: name
                };
            }
            catch (error) {
                this.logger.warn(`${name} transporter failed`, JSON.stringify({
                    error: error.message,
                    attempt
                }));
                if (name === 'fallback' || !this.fallbackTransporter) {
                    throw error;
                }
            }
        }
        throw new Error('All transporters failed');
    }
    async buildMailOptions(options) {
        const fromEmail = this.config.get('EMAIL_FROM');
        const fromName = this.config.get('EMAIL_FROM_NAME', 'Club Sportif Sfaxien');
        let htmlContent = options.html;
        let textContent = options.text;
        if (options.template) {
            const templateResult = await this.renderTemplate(options.template, options.context || {});
            htmlContent = templateResult.html;
            textContent = templateResult.text;
        }
        return {
            from: `"${fromName}" <${fromEmail}>`,
            to: options.to,
            subject: options.subject,
            html: htmlContent,
            text: textContent,
            attachments: options.attachments,
            priority: options.priority || 'normal',
            headers: {
                'X-Mailer': 'Entrix-V3',
                'X-Priority': options.priority === 'high' ? '1' : '3'
            }
        };
    }
    async renderTemplate(templateName, context) {
        if (templateName === 'email-verification') {
            const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Vérifiez votre email - Club Sportif Sfaxien</title>
          <style>
            .container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
            .header { background: #000000; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px; background: #f9f9f9; }
            .footer { background: #333; color: white; padding: 15px; text-align: center; font-size: 12px; }
            .button { background: #000000; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🏆 Club Sportif Sfaxien</h1>
              <h2>Vérification de votre email</h2>
            </div>
            
            <div class="content">
              <p>Merci de vous être inscrit sur la plateforme du Club Sportif Sfaxien !</p>
              
              <p>Pour finaliser votre inscription et activer votre compte, veuillez cliquer sur le lien ci-dessous :</p>
              
              <p style="text-align: center; margin: 30px 0;">
                <a href="${context.verificationUrl}" class="button">Vérifier mon email</a>
              </p>
              
              <p>Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :</p>
              <p style="word-break: break-all; background: #f0f0f0; padding: 10px; border-radius: 4px;">
                ${context.verificationUrl}
              </p>
              
              <p><strong>Ce lien expire dans 24 heures.</strong></p>
              
              <p>Si vous n'avez pas créé de compte, ignorez cet email.</p>
              
              <p><strong>Allez CSS ! 🖤🤍</strong></p>
            </div>
            
            <div class="footer">
              <p>© 2025 Club Sportif Sfaxien. Tous droits réservés.</p>
              <p>Sfax, Tunisie | www.css.tn</p>
            </div>
          </div>
        </body>
        </html>
      `;
            const text = `
        Vérification de votre email - Club Sportif Sfaxien
        
        Merci de vous être inscrit !
        
        Pour activer votre compte, cliquez sur ce lien : ${context.verificationUrl}
        
        Ce lien expire dans 24 heures.
        
        Si vous n'avez pas créé de compte, ignorez cet email.
        
        Allez CSS !
        
        Club Sportif Sfaxien
        www.css.tn
      `;
            return { html, text };
        }
        if (templateName === 'mfa-code') {
            const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Code de vérification - Entrix</title>
          <style>
            .container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
            .header { background: #1a365d; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px; background: #f7fafc; }
            .code { 
              font-size: 32px; 
              font-weight: bold; 
              color: #1a365d; 
              text-align: center; 
              background: white; 
              padding: 20px; 
              border-radius: 8px; 
              letter-spacing: 8px;
              margin: 20px 0;
            }
            .warning { 
              background: #fed7d7; 
              color: #9b2c2c; 
              padding: 15px; 
              border-radius: 4px; 
              margin: 20px 0; 
            }
            .footer { color: #718096; font-size: 12px; text-align: center; padding: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Entrix</h1>
              <p>Code de vérification</p>
            </div>
            
            <div class="content">
              ${context.firstName ? `<p>Bonjour ${context.firstName},</p>` : '<p>Bonjour,</p>'}
              
              <p>Votre code de vérification pour accéder à votre compte Entrix :</p>
              
              <div class="code">${context.code}</div>
              
              <p><strong>Ce code expire dans ${context.expirationMinutes} minutes.</strong></p>
              
              <div class="warning">
                <strong>⚠️ Important :</strong><br>
                • Ne partagez jamais ce code avec qui que ce soit<br>
                • Entrix ne vous demandera jamais ce code par téléphone<br>
                • Si vous n'avez pas demandé ce code, ignorez cet email
              </div>
              
              <p>Si vous avez des questions, contactez notre support à <a href="mailto:support@entrix.tn">support@entrix.tn</a></p>
            </div>
            
            <div class="footer">
              <p>© ${new Date().getFullYear()} Entrix. Tous droits réservés.</p>
              <p>Cet email a été envoyé depuis une adresse non surveillée. Ne répondez pas à cet email.</p>
            </div>
          </div>
        </body>
        </html>
      `;
            const text = `
        Entrix - Code de vérification
        
        ${context.firstName ? `Bonjour ${context.firstName},` : 'Bonjour,'}
        
        Votre code de vérification : ${context.code}
        
        Ce code expire dans ${context.expirationMinutes} minutes.
        
        Ne partagez jamais ce code avec qui que ce soit.
        
        Support : support@entrix.tn
      `;
            return { html, text };
        }
        if (templateName === 'welcome') {
            const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Bienvenue au Club Sportif Sfaxien</title>
          <style>
            .container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
            .header { background: #000000; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px; background: #f9f9f9; }
            .footer { background: #333; color: white; padding: 15px; text-align: center; font-size: 12px; }
            .button { background: #000000; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🏆 Club Sportif Sfaxien</h1>
              <h2>Bienvenue ${context.firstName || 'Supporter'} !</h2>
            </div>
            
            <div class="content">
              <p>Félicitations ! Votre compte a été créé avec succès.</p>
              
              <p>Vous faites maintenant partie de la grande famille du Club Sportif Sfaxien, le club le plus titré de Tunisie.</p>
              
              ${context.verificationUrl ? `
                <p>Pour finaliser votre inscription, veuillez vérifier votre adresse email :</p>
                <p style="text-align: center;">
                  <a href="${context.verificationUrl}" class="button">Vérifier mon email</a>
                </p>
              ` : ''}
              
              <p>Vous pouvez maintenant :</p>
              <ul>
                <li>Suivre l'actualité du club</li>
                <li>Acheter vos billets en ligne</li>
                <li>Accéder aux contenus exclusifs</li>
                <li>Participer à la communauté des supporters</li>
              </ul>
              
              <p>Si vous avez des questions, n'hésitez pas à nous contacter à <a href="mailto:support@css.tn">support@css.tn</a></p>
              
              <p><strong>Allez CSS ! 🖤🤍</strong></p>
            </div>
            
            <div class="footer">
              <p>© 2025 Club Sportif Sfaxien. Tous droits réservés.</p>
              <p>Sfax, Tunisie | www.css.tn</p>
            </div>
          </div>
        </body>
        </html>
      `;
            const text = `
        Bienvenue au Club Sportif Sfaxien !
        
        Félicitations ${context.firstName || 'Supporter'} !
        
        Votre compte a été créé avec succès. Vous faites maintenant partie de la grande famille du CSS.
        
        ${context.verificationUrl ? `Vérifiez votre email : ${context.verificationUrl}` : ''}
        
        Allez CSS !
        
        Club Sportif Sfaxien
        support@css.tn
      `;
            return { html, text };
        }
        return {
            html: `<h1>Email depuis Entrix</h1><p>${context.message || 'Aucun contenu'}</p>`,
            text: context.message || 'Aucun contenu'
        };
    }
    async checkRateLimit(recipient) {
        try {
            const email = Array.isArray(recipient) ? recipient[0] : recipient;
            const key = `email_rate_limit:${email}`;
            const count = await this.redis.getCache(key) || 0;
            const maxEmails = this.config.get('EMAIL_RATE_LIMIT_MAX', 10);
            const windowMinutes = this.config.get('EMAIL_RATE_LIMIT_WINDOW', 60);
            if (count >= maxEmails) {
                return false;
            }
            await this.redis.setCache(key, count + 1, windowMinutes * 60);
            return true;
        }
        catch (error) {
            this.logger.error('Rate limit check failed', error.stack);
            return true;
        }
    }
    isTemporaryError(error) {
        const temporaryErrorCodes = [
            '421', '450', '451', '452', '454',
            'ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND',
            'rate limit', 'quota exceeded', 'temporarily'
        ];
        return temporaryErrorCodes.some(code => error.toLowerCase().includes(code.toLowerCase()));
    }
    async queueForRetry(options) {
        try {
            const retryJob = {
                ...options,
                retryAttempts: 1,
                scheduledFor: Date.now() + (30 * 60 * 1000)
            };
            await this.redis.setCache(`email_retry:${Date.now()}`, retryJob, 24 * 60 * 60);
            this.metrics.queued++;
            this.logger.info('Email queued for retry', JSON.stringify({
                to: this.maskEmail(Array.isArray(options.to) ? options.to[0] : options.to),
                retryIn: '30 minutes'
            }));
        }
        catch (error) {
            this.logger.error('Failed to queue email for retry', error.stack);
        }
    }
    async processRetryQueue() {
        try {
            const retryKeys = await this.redis.keys('email_retry:*');
            const now = Date.now();
            for (const key of retryKeys) {
                const retryJob = await this.redis.getCache(key);
                if (retryJob && retryJob.scheduledFor <= now) {
                    this.logger.info('Processing retry email', JSON.stringify({ key }));
                    await this.processSendEmail(retryJob);
                    await this.redis.delCache(key);
                    this.metrics.queued = Math.max(0, this.metrics.queued - 1);
                }
            }
        }
        catch (error) {
            this.logger.error('Failed to process retry queue', error.stack);
        }
    }
    async healthCheck() {
        if (!this.isEnabled) {
            return { status: 'disabled', details: { reason: 'Email service disabled' } };
        }
        try {
            await this.primaryTransporter.verify();
            return {
                status: 'healthy',
                details: {
                    primary: 'connected',
                    fallback: this.fallbackTransporter ? 'available' : 'not_configured',
                    metrics: this.metrics
                }
            };
        }
        catch (error) {
            return {
                status: 'unhealthy',
                details: {
                    error: error.message,
                    primary: 'failed',
                    metrics: this.metrics
                }
            };
        }
    }
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    maskEmail(email) {
        if (!email.includes('@'))
            return email;
        const [local, domain] = email.split('@');
        const maskedLocal = local.length > 2
            ? local[0] + '***' + local.slice(-1)
            : local;
        return `${maskedLocal}@${domain}`;
    }
};
exports.EmailService = EmailService;
exports.EmailService = EmailService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        redis_service_1.RedisService,
        logger_service_1.LoggerService])
], EmailService);
//# sourceMappingURL=email.service.js.map