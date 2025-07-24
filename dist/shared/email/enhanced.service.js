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
var EmailService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailService = exports.EmailTemplates = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const nodemailer = __importStar(require("nodemailer"));
const handlebars = __importStar(require("handlebars"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const logger_service_1 = require("../logger/logger.service");
var EmailTemplates;
(function (EmailTemplates) {
    EmailTemplates["WELCOME"] = "welcome";
    EmailTemplates["VERIFICATION"] = "verification";
    EmailTemplates["PASSWORD_RESET"] = "password-reset";
    EmailTemplates["AUTH_WELCOME"] = "auth/welcome";
    EmailTemplates["AUTH_EMAIL_VERIFICATION"] = "auth/email-verification";
    EmailTemplates["AUTH_PASSWORD_RESET"] = "auth/password-reset";
    EmailTemplates["AUTH_MFA_SETUP"] = "auth/mfa-setup";
    EmailTemplates["AUTH_SECURITY_ALERT"] = "auth/security-alert";
    EmailTemplates["AUTH_DEVICE_VERIFICATION"] = "auth/device-verification";
    EmailTemplates["TICKET_PURCHASE"] = "ticket-purchase";
    EmailTemplates["EVENT_REMINDER"] = "event-reminder";
    EmailTemplates["ORDER_CONFIRMATION"] = "order-confirmation";
})(EmailTemplates || (exports.EmailTemplates = EmailTemplates = {}));
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
        this.config = this.loadConfig();
        this.initializeTransporter();
        this.loadTemplates();
    }
    async sendMail(options) {
        const startTime = Date.now();
        try {
            const mailData = await this.prepareMailData(options);
            const result = await this.transporter.sendMail(mailData);
            const sendTime = Date.now() - startTime;
            this.updateMetrics(true, sendTime, options.template || options.templatePath);
            this.loggerService.logNotificationEvent('sent', 'email', Array.isArray(options.to) ? options.to.join(',') : options.to, result.messageId, {
                subject: options.subject,
                template: options.template,
                templatePath: options.templatePath,
                sendTime,
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
            this.updateMetrics(false, sendTime, options.template || options.templatePath);
            this.loggerService.logNotificationEvent('failed', 'email', Array.isArray(options.to) ? options.to.join(',') : options.to, undefined, {
                subject: options.subject,
                template: options.template,
                templatePath: options.templatePath,
                error: error.message,
                sendTime,
            });
            throw error;
        }
    }
    async sendMailWithCustomTemplate(to, subject, templatePath, context = {}, options) {
        return this.sendMail({
            to,
            subject,
            templatePath,
            context,
            ...options,
        });
    }
    async prepareMailData(options) {
        const mailData = {
            from: this.config.from,
            to: options.to,
            subject: options.subject,
            replyTo: options.replyTo || this.config.defaultReplyTo,
        };
        if (options.cc)
            mailData.cc = options.cc;
        if (options.bcc)
            mailData.bcc = options.bcc;
        if (options.headers)
            mailData.headers = options.headers;
        if (options.templatePath) {
            const { html, text } = await this.renderTemplateFromPath(options.templatePath, options.context || {});
            mailData.html = html;
            mailData.text = text || this.stripHtml(html);
        }
        else if (options.template) {
            const { html, text } = await this.renderTemplate(options.template, options.context || {});
            mailData.html = html;
            mailData.text = text || this.stripHtml(html);
        }
        else if (options.html || options.text) {
            mailData.html = options.html;
            mailData.text = options.text;
        }
        else {
            throw new common_1.BadRequestException('Template, templatePath, html ou text requis');
        }
        if (options.attachments?.length > 0) {
            mailData.attachments = options.attachments;
        }
        return mailData;
    }
    async renderTemplateFromPath(templatePath, context) {
        try {
            const fullPath = path.resolve(process.cwd(), 'templates/emails', templatePath);
            const htmlPath = fullPath.endsWith('.hbs') ? fullPath : `${fullPath}.hbs`;
            if (!fs.existsSync(htmlPath)) {
                throw new Error(`Template not found at path: ${htmlPath}`);
            }
            const templateContent = fs.readFileSync(htmlPath, 'utf8');
            const compiledTemplate = handlebars.compile(templateContent);
            const globalContext = {
                ...context,
                currentYear: new Date().getFullYear(),
                appName: 'Entrix',
                supportEmail: this.config.defaultReplyTo || 'support@entrix.tn',
                websiteUrl: process.env.FRONTEND_URL || 'https://entrix.tn',
            };
            const html = compiledTemplate(globalContext);
            const textPath = htmlPath.replace('.hbs', '_text.hbs');
            let text;
            if (fs.existsSync(textPath)) {
                const textContent = fs.readFileSync(textPath, 'utf8');
                const textTemplate = handlebars.compile(textContent);
                text = textTemplate(globalContext);
            }
            return { html, text };
        }
        catch (error) {
            this.logger.error(`Erreur rendering template ${templatePath}:`, error);
            throw new Error(`Impossible de rendre le template: ${templatePath}`);
        }
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
    async sendAuthWelcomeEmail(email, firstName, verificationToken) {
        return this.sendMailWithCustomTemplate(email, 'Bienvenue sur Entrix ! 🎉', 'auth/welcome', {
            firstName,
            verificationToken,
            verificationUrl: verificationToken
                ? `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`
                : undefined,
        });
    }
    async sendAuthVerificationEmail(email, token) {
        return this.sendMailWithCustomTemplate(email, 'Vérifiez votre adresse email', 'auth/email-verification', {
            token,
            verificationUrl: `${process.env.FRONTEND_URL}/verify-email?token=${token}`,
            expiresIn: '24 heures',
        });
    }
    async sendAuthPasswordResetEmail(email, token) {
        return this.sendMailWithCustomTemplate(email, 'Réinitialisation de votre mot de passe', 'auth/password-reset', {
            token,
            resetUrl: `${process.env.FRONTEND_URL}/reset-password?token=${token}`,
            expiresIn: '1 heure',
        });
    }
    async sendAuthSecurityAlertEmail(email, alertType, alertData) {
        return this.sendMailWithCustomTemplate(email, 'Alerte de sécurité - Entrix', 'auth/security-alert', {
            alertType,
            ...alertData,
            timestamp: new Date().toISOString(),
        });
    }
    async sendAuthDeviceVerificationEmail(email, deviceInfo, verificationCode) {
        return this.sendMailWithCustomTemplate(email, 'Nouveau device détecté', 'auth/device-verification', {
            deviceInfo,
            verificationCode,
            verificationUrl: `${process.env.FRONTEND_URL}/verify-device?code=${verificationCode}`,
        });
    }
    loadConfig() {
        return {
            from: this.configService.get('EMAIL_FROM'),
            host: this.configService.get('EMAIL_HOST'),
            port: this.configService.get('EMAIL_PORT', 587),
            user: this.configService.get('EMAIL_USER'),
            pass: this.configService.get('EMAIL_PASS'),
            secure: this.configService.get('EMAIL_SECURE', false),
            defaultReplyTo: this.configService.get('EMAIL_DEFAULT_REPLY_TO'),
            provider: this.configService.get('EMAIL_PROVIDER', 'smtp'),
            templatesPath: this.configService.get('EMAIL_TEMPLATES_PATH', './templates/emails'),
        };
    }
    initializeTransporter() {
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
    loadTemplates() {
        try {
            const templatesDir = path.resolve(process.cwd(), this.config.templatesPath);
            if (!fs.existsSync(templatesDir)) {
                this.logger.warn(`Templates directory not found: ${templatesDir}`);
                return;
            }
            this.loadTemplatesRecursive(templatesDir, '');
            this.logger.log(`✅ ${this.templates.size} email templates loaded from ${templatesDir}`);
        }
        catch (error) {
            this.logger.error('❌ Failed to load email templates:', error);
        }
    }
    loadTemplatesRecursive(dir, relativePath) {
        const files = fs.readdirSync(dir);
        for (const file of files) {
            const filePath = path.join(dir, file);
            const fileRelativePath = relativePath ? `${relativePath}/${file}` : file;
            if (fs.statSync(filePath).isDirectory()) {
                this.loadTemplatesRecursive(filePath, fileRelativePath);
            }
            else if (file.endsWith('.hbs') || file.endsWith('.handlebars')) {
                const templateName = fileRelativePath.replace(/\.(hbs|handlebars)$/, '');
                const templateContent = fs.readFileSync(filePath, 'utf8');
                const template = handlebars.compile(templateContent);
                this.templates.set(templateName, template);
                this.logger.log(`📄 Template loaded: ${templateName}`);
            }
        }
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
    async testConnection() {
        try {
            await this.transporter.verify();
            return true;
        }
        catch (error) {
            this.logger.error('Email connection test failed:', error);
            return false;
        }
    }
    getAvailableTemplates() {
        return Array.from(this.templates.keys());
    }
    getMetrics() {
        return {
            ...this.metrics,
            templateUsage: Object.fromEntries(this.metrics.templateUsage),
        };
    }
};
exports.EmailService = EmailService;
exports.EmailService = EmailService = EmailService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        logger_service_1.LoggerService])
], EmailService);
//# sourceMappingURL=enhanced.service.js.map