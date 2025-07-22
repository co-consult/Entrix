import { ConfigService } from '@nestjs/config';
import { EmailService } from '../email/email.service';
import { LoggerService } from '../logger/logger.service';
import { NotificationOptions } from './notifications.interfaces';
export declare class NotificationsService {
    private readonly configService;
    private readonly emailService;
    private readonly appLogger;
    private readonly logger;
    private readonly config;
    constructor(configService: ConfigService, emailService: EmailService, appLogger: LoggerService);
    sendNotification(options: NotificationOptions): Promise<void>;
}
