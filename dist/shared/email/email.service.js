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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var EmailService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const nodemailer = __importStar(require("nodemailer"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const handlebars = __importStar(require("handlebars"));
const logger_service_1 = require("../logger/logger.service");
const email_constants_1 = require("./email.constants");
const email_types_1 = require("./email.types");
let EmailService = EmailService_1 = class EmailService {
    configService;
    loggerService;
    logger = new common_1.Logger(EmailService_1.name);
    transporter;
    templates = new Map();
    config;
    metrics = {
        emailsSent: 0,
        emailsFailed: 0,
        totalSendTime: 0,
        avgSendTime: 0,
        templateUsage: new Map(),
    };
    constructor(configService, loggerService) {
        this.configService = configService;
        this.loggerService = loggerService;
        this.config = this.configService.get(email_constants_1.EMAIL_CONFIG_NAMESPACE);
        this.initializeTransporter();
        this.loadTemplates();
    }
    initializeTransporter() {
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
                        rateLimit: 10,
                    });
                    break;
                case 'sendgrid':
                    this.transporter = nodemailer.createTransport({
                        service: 'SendGrid',
                        auth: {
                            user: 'apikey',
                            pass: this.config.pass,
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
            this.transporter.verify((error, success) => {
                if (error) {
                    this.logger.error('❌ Email transporter verification failed:', error);
                }
                else {
                    this.logger.log(`✅ Email transporter verified (${this.config.provider})`);
                }
            });
        }
        catch (error) {
            this.logger.error('❌ Failed to initialize email transporter:', error);
            throw error;
        }
    }
    loadTemplates() {
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
            const templateFiles = fs.readdirSync(templatesDir).filter(file => file.endsWith('.hbs') || file.endsWith('.handlebars'));
            for (const file of templateFiles) {
                const templateName = path.basename(file, path.extname(file));
                const templatePath = path.join(templatesDir, file);
                const templateContent = fs.readFileSync(templatePath, 'utf8');
                const template = handlebars.compile(templateContent);
                this.templates.set(templateName, template);
                this.logger.log(`📄 Template loaded: ${templateName}`);
            }
            this.logger.log(`✅ ${this.templates.size} email templates loaded`);
        }
        catch (error) {
            this.logger.error('❌ Failed to load email templates:', error);
        }
    }
    async sendMail(options) {
        const startTime = Date.now();
        try {
            const mailData = await this.prepareMailData(options);
            const result = await this.transporter.sendMail(mailData);
            const sendTime = Date.now() - startTime;
            this.updateMetrics(true, sendTime, options.template);
            this.loggerService.logNotificationEvent('sent', 'email', Array.isArray(options.to) ? options.to.join(',') : options.to, result.messageId, {
                subject: options.subject,
                template: options.template,
                sendTime,
                provider: this.config.provider,
            });
            return {
                messageId: result.messageId,
                accepted: result.accepted || [],
                rejected: result.rejected || [],
                pending: result.pending || [],
                response: result.response,
            };
        }
        catch (error) {
            const sendTime = Date.now() - startTime;
            this.updateMetrics(false, sendTime, options.template);
            this.loggerService.logNotificationEvent('failed', 'email', Array.isArray(options.to) ? options.to.join(',') : options.to, undefined, {
                subject: options.subject,
                template: options.template,
                error: error.message,
                sendTime,
                provider: this.config.provider,
            });
            throw error;
        }
    }
    async prepareMailData(options) {
        const mailData = {
            from: this.config.from,
            to: options.to,
            subject: options.subject,
            replyTo: options.replyTo || this.config.defaultReplyTo,
        };
        if (options.cc) {
            mailData.cc = options.cc;
        }
        if (options.bcc) {
            mailData.bcc = options.bcc;
        }
        if (options.template) {
            const { html, text } = await this.renderTemplate(options.template, options.context || {});
            mailData.html = html;
            mailData.text = text || this.stripHtml(html);
        }
        else {
            mailData.html = options.html;
            mailData.text = options.text;
        }
        if (options.attachments && options.attachments.length > 0) {
            mailData.attachments = options.attachments;
        }
        return mailData;
    }
    async renderTemplate(templateName, context) {
        const template = this.templates.get(templateName);
        if (!template) {
            throw new Error(`Template not found: ${templateName}`);
        }
        const globalContext = {
            ...context,
            currentYear: new Date().getFullYear(),
            appName: 'Entrix',
            supportEmail: this.config.defaultReplyTo || 'support@entrix.tn',
            websiteUrl: process.env.FRONTEND_URL || 'https://entrix.tn',
        };
        const html = template(globalContext);
        const textTemplate = this.templates.get(`${templateName}_text`);
        const text = textTemplate ? textTemplate(globalContext) : undefined;
        return { html, text };
    }
    stripHtml(html) {
        return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    }
    updateMetrics(success, sendTime, template) {
        if (success) {
            this.metrics.emailsSent++;
        }
        else {
            this.metrics.emailsFailed++;
        }
        this.metrics.totalSendTime += sendTime;
        this.metrics.avgSendTime = this.metrics.totalSendTime / (this.metrics.emailsSent + this.metrics.emailsFailed);
        if (template) {
            const currentUsage = this.metrics.templateUsage.get(template) || 0;
            this.metrics.templateUsage.set(template, currentUsage + 1);
        }
    }
    async sendWelcomeEmail(email, firstName, verificationToken) {
        const context = {
            firstName,
            emailVerificationToken: verificationToken,
            verificationUrl: verificationToken
                ? `${process.env.FRONTEND_URL}/${process.env.API_PREFIX}/auth/verify-email?token=${verificationToken}`
                : undefined,
            appName: 'Entrix',
            supportEmail: process.env.EMAIL_SUPPORT || 'support@entrix.tn',
            currentYear: new Date().getFullYear(),
            facebookUrl: process.env.FACEBOOK_URL || 'https://facebook.com/entrix',
            instagramUrl: process.env.INSTAGRAM_URL || 'https://instagram.com/entrix',
            twitterUrl: process.env.TWITTER_URL || 'https://twitter.com/entrix',
            linkedinUrl: process.env.LINKEDIN_URL || 'https://linkedin.com/company/entrix',
            unsubscribeUrl: `${process.env.FRONTEND_URL}/unsubscribe?email=${encodeURIComponent(email)}`,
            websiteUrl: process.env.FRONTEND_URL || 'https://entrix.tn',
        };
        return this.sendMail({
            to: email,
            subject: 'Bienvenue sur Entrix ! 🎉',
            template: 'welcome',
            context,
        });
    }
    async sendVerificationEmail(email, token) {
        return this.sendMail({
            to: email,
            subject: 'Vérifiez votre adresse email',
            template: email_types_1.EmailTemplates.VERIFICATION,
            context: {
                token,
                verificationUrl: `${process.env.FRONTEND_URL}/verify-email?token=${token}`,
                expiresIn: '24 heures',
            },
        });
    }
    async sendPasswordResetEmail(email, token) {
        return this.sendMail({
            to: email,
            subject: 'Réinitialisation de votre mot de passe',
            template: email_types_1.EmailTemplates.PASSWORD_RESET,
            context: {
                token,
                resetUrl: `${process.env.FRONTEND_URL}/reset-password?token=${token}`,
                expiresIn: '1 heure',
            },
        });
    }
    async sendTicketPurchaseEmail(email, ticketData, eventData, orderData) {
        return this.sendMail({
            to: email,
            subject: `Votre ticket pour ${eventData.name}`,
            template: email_types_1.EmailTemplates.TICKET_PURCHASE,
            context: {
                ticket: ticketData,
                event: eventData,
                order: orderData,
                qrCodeUrl: `${process.env.FRONTEND_URL}/ticket/${ticketData.id}/qr`,
            },
            attachments: [
                {
                    filename: `ticket-${orderData.orderNumber}.pdf`,
                    path: `/tmp/tickets/${ticketData.id}.pdf`,
                    contentType: 'application/pdf',
                },
            ],
        });
    }
    async sendEventReminderEmail(email, eventData, reminderType) {
        const reminderMessages = {
            '24h': 'Votre événement a lieu demain',
            '1h': 'Votre événement commence dans 1 heure',
            '30min': 'Votre événement commence dans 30 minutes',
        };
        return this.sendMail({
            to: email,
            subject: `Rappel: ${eventData.name}`,
            template: email_types_1.EmailTemplates.EVENT_REMINDER,
            context: {
                event: eventData,
                reminderType,
                reminderMessage: reminderMessages[reminderType],
                eventUrl: `${process.env.FRONTEND_URL}/event/${eventData.id}`,
            },
        });
    }
    async sendPaymentReceiptEmail(email, paymentData, orderData) {
        return this.sendMail({
            to: email,
            subject: `Reçu de paiement - Commande ${orderData.orderNumber}`,
            template: email_types_1.EmailTemplates.PAYMENT_RECEIPT,
            context: {
                payment: paymentData,
                order: orderData,
                invoiceUrl: `${process.env.FRONTEND_URL}/invoice/${orderData.id}`,
            },
        });
    }
    async sendOrganizerNotificationEmail(email, notificationType, data) {
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
    async sendSalesReportEmail(email, reportData, reportFile) {
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
            template: email_types_1.EmailTemplates.SALES_REPORT,
            context: {
                report: reportData,
                generatedAt: new Date().toLocaleString('fr-FR'),
            },
            attachments,
        });
    }
    async testConnection() {
        try {
            await this.transporter.verify();
            return true;
        }
        catch (error) {
            this.logger.error('❌ Email connection test failed:', error);
            return false;
        }
    }
    async previewTemplate(templateName, context) {
        const { html } = await this.renderTemplate(templateName, context);
        return html;
    }
    getAvailableTemplates() {
        return Array.from(this.templates.keys());
    }
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
    resetMetrics() {
        this.metrics = {
            emailsSent: 0,
            emailsFailed: 0,
            totalSendTime: 0,
            avgSendTime: 0,
            templateUsage: new Map(),
        };
    }
    getServiceInfo() {
        return {
            provider: this.config.provider,
            templatesLoaded: this.templates.size,
            connectionStatus: this.transporter ? 'connected' : 'disconnected',
            metrics: this.getMetrics(),
        };
    }
};
exports.EmailService = EmailService;
exports.EmailService = EmailService = EmailService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(config_1.ConfigService)),
    __metadata("design:paramtypes", [config_1.ConfigService,
        logger_service_1.LoggerService])
], EmailService);
//# sourceMappingURL=email.service.js.map