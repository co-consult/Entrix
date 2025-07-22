import { Job } from 'bull';
import { EmailService } from './email.service';
export declare class EmailProcessor {
    private emailService;
    constructor(emailService: EmailService);
    handleWelcomeEmail(job: Job<{
        userId: string;
        email: string;
        firstName: string;
    }>): Promise<{
        success: boolean;
    }>;
    handleVerificationEmail(job: Job<{
        userId: string;
        email: string;
        token: string;
    }>): Promise<{
        success: boolean;
    }>;
    handlePasswordResetEmail(job: Job<{
        email: string;
        token: string;
    }>): Promise<{
        success: boolean;
    }>;
    handleTicketEmail(job: Job<{
        orderId: string;
        userId: string;
        email: string;
    }>): Promise<{
        success: boolean;
    }>;
    handleInvoiceEmail(job: Job<{
        orderId: string;
        email: string;
    }>): Promise<{
        success: boolean;
    }>;
    handleReminderEmail(job: Job<{
        eventId: string;
        userId: string;
        email: string;
    }>): Promise<{
        success: boolean;
    }>;
    onFailed(job: Job, error: Error): Promise<void>;
    onCompleted(job: Job, result: any): Promise<void>;
}
