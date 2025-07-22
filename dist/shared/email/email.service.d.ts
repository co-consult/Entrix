import { ConfigService } from '@nestjs/config';
import { LoggerService } from '../logger/logger.service';
import { SendMailOptions } from './email.interfaces';
import { EmailResult } from './email.types';
export declare class EmailService {
    private readonly configService;
    private readonly loggerService;
    private readonly logger;
    private transporter;
    private templates;
    private config;
    private metrics;
    constructor(configService: ConfigService, loggerService: LoggerService);
    private initializeTransporter;
    private loadTemplates;
    sendMail(options: SendMailOptions): Promise<EmailResult>;
    private prepareMailData;
    private renderTemplate;
    private stripHtml;
    private updateMetrics;
    sendWelcomeEmail(email: string, firstName: string, verificationToken?: string): Promise<EmailResult>;
    sendVerificationEmail(email: string, token: string): Promise<EmailResult>;
    sendPasswordResetEmail(email: string, token: string): Promise<EmailResult>;
    sendTicketPurchaseEmail(email: string, ticketData: any, eventData: any, orderData: any): Promise<EmailResult>;
    sendEventReminderEmail(email: string, eventData: any, reminderType: '24h' | '1h' | '30min'): Promise<EmailResult>;
    sendPaymentReceiptEmail(email: string, paymentData: any, orderData: any): Promise<EmailResult>;
    sendOrganizerNotificationEmail(email: string, notificationType: string, data: any): Promise<EmailResult>;
    sendSalesReportEmail(email: string, reportData: any, reportFile?: string): Promise<EmailResult>;
    testConnection(): Promise<boolean>;
    previewTemplate(templateName: string, context: any): Promise<string>;
    getAvailableTemplates(): string[];
    getMetrics(): {
        avgSendTime: number;
        successRate: number;
        failureRate: number;
        templateUsage: {
            [k: string]: number;
        };
        emailsSent: number;
        emailsFailed: number;
        totalSendTime: number;
    };
    resetMetrics(): void;
    getServiceInfo(): {
        provider: "smtp" | "sendgrid" | "mailgun";
        templatesLoaded: number;
        connectionStatus: string;
        metrics: {
            avgSendTime: number;
            successRate: number;
            failureRate: number;
            templateUsage: {
                [k: string]: number;
            };
            emailsSent: number;
            emailsFailed: number;
            totalSendTime: number;
        };
    };
}
