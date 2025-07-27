import { ConfigService } from '@nestjs/config';
import { IEmailProvider } from '../interfaces/mfa.interface';
import { EmailService } from '../../../shared/email/email.service';
import { LoggerService } from '../../../shared/logger/logger.service';
export declare class EmailProvider implements IEmailProvider {
    private readonly config;
    private readonly emailService;
    private readonly logger;
    constructor(config: ConfigService, emailService: EmailService, loggerService: LoggerService);
    sendEmail(email: string, subject: string, content: string): Promise<boolean>;
    generateCode(): string;
    generateEmailContent(code: string, userFirstName?: string): string;
    generateEmailSubject(): string;
    private maskEmail;
    private extractCodeFromContent;
    isEnabled(): boolean;
    validateEmail(email: string): boolean;
}
