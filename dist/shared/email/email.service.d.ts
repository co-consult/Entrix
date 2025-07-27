import { ConfigService } from '@nestjs/config';
import { LoggerService } from '../logger/logger.service';
import { RedisService } from '../redis/redis.service';
interface EmailOptions {
    to: string | string[];
    subject: string;
    html?: string;
    text?: string;
    template?: string;
    context?: any;
    attachments?: any[];
    priority?: 'high' | 'normal' | 'low';
    retryAttempts?: number;
}
interface EmailResult {
    success: boolean;
    messageId?: string;
    error?: string;
    provider?: string;
    retryCount?: number;
}
interface EmailMetrics {
    sent: number;
    failed: number;
    queued: number;
    successRate: number;
    averageDeliveryTime: number;
    lastSent?: Date;
    errors: Record<string, number>;
}
export declare class EmailService {
    private readonly config;
    private readonly redis;
    private readonly logger;
    private primaryTransporter;
    private fallbackTransporter?;
    private isEnabled;
    private metrics;
    constructor(config: ConfigService, redis: RedisService, loggerService: LoggerService);
    private setupTransporters;
    sendEmail(options: EmailOptions, blocking?: boolean): Promise<EmailResult>;
    private processSendEmail;
    sendWelcomeEmail(userEmail: string, userFirstName: string, verificationUrl?: string): Promise<EmailResult>;
    sendVerificationEmail(userEmail: string, verificationToken: string): Promise<EmailResult>;
    testConnection(): Promise<boolean>;
    getMetrics(): EmailMetrics;
    private updateSuccessRate;
    private attemptSend;
    private buildMailOptions;
    private renderTemplate;
    private checkRateLimit;
    private isTemporaryError;
    private queueForRetry;
    processRetryQueue(): Promise<void>;
    healthCheck(): Promise<{
        status: string;
        details: any;
    }>;
    private sleep;
    private maskEmail;
}
export {};
