import { ConfigService } from '@nestjs/config';
import { LoggerService } from '../logger/logger.service';
export interface EnhancedSendMailOptions {
    to: string | string[];
    cc?: string | string[];
    bcc?: string | string[];
    subject: string;
    template?: string;
    templatePath?: string;
    context?: any;
    html?: string;
    text?: string;
    attachments?: any[];
    replyTo?: string;
    headers?: any;
}
export interface EmailResult {
    messageId: string;
    accepted: string[];
    rejected: string[];
    pending: string[];
    response: string;
}
export declare enum EmailTemplates {
    WELCOME = "welcome",
    VERIFICATION = "verification",
    PASSWORD_RESET = "password-reset",
    AUTH_WELCOME = "auth/welcome",
    AUTH_EMAIL_VERIFICATION = "auth/email-verification",
    AUTH_PASSWORD_RESET = "auth/password-reset",
    AUTH_MFA_SETUP = "auth/mfa-setup",
    AUTH_SECURITY_ALERT = "auth/security-alert",
    AUTH_DEVICE_VERIFICATION = "auth/device-verification",
    TICKET_PURCHASE = "ticket-purchase",
    EVENT_REMINDER = "event-reminder",
    ORDER_CONFIRMATION = "order-confirmation"
}
export declare class EmailService {
    private readonly configService;
    private readonly loggerService;
    private readonly logger;
    private transporter;
    private templates;
    private config;
    private metrics;
    constructor(configService: ConfigService, loggerService: LoggerService);
    sendMail(options: EnhancedSendMailOptions): Promise<EmailResult>;
    sendMailWithCustomTemplate(to: string | string[], subject: string, templatePath: string, context?: any, options?: Partial<EnhancedSendMailOptions>): Promise<EmailResult>;
    private prepareMailData;
    private renderTemplateFromPath;
    private renderTemplate;
    sendAuthWelcomeEmail(email: string, firstName: string, verificationToken?: string): Promise<EmailResult>;
    sendAuthVerificationEmail(email: string, token: string): Promise<EmailResult>;
    sendAuthPasswordResetEmail(email: string, token: string): Promise<EmailResult>;
    sendAuthSecurityAlertEmail(email: string, alertType: string, alertData: any): Promise<EmailResult>;
    sendAuthDeviceVerificationEmail(email: string, deviceInfo: any, verificationCode: string): Promise<EmailResult>;
    private loadConfig;
    private initializeTransporter;
    private loadTemplates;
    private loadTemplatesRecursive;
    private stripHtml;
    private updateMetrics;
    testConnection(): Promise<boolean>;
    getAvailableTemplates(): string[];
    getMetrics(): {
        templateUsage: {
            [k: string]: number;
        };
        emailsSent: number;
        emailsFailed: number;
        totalSendTime: number;
        avgSendTime: number;
    };
}
