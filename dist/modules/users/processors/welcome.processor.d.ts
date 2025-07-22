import { Job } from 'bullmq';
import { EmailService } from '../../../shared/email/email.service';
import { LoggerService } from '../../../shared/logger/logger.service';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { WelcomeJobData, OnboardingCompleteJobData } from '../queues/welcome.queue';
export declare class WelcomeProcessor {
    private readonly emailService;
    private readonly prismaService;
    private readonly logger;
    constructor(emailService: EmailService, prismaService: PrismaService, loggerService: LoggerService);
    processWelcomeEmail(job: Job<WelcomeJobData>): Promise<void>;
    processOnboardingCompleteEmail(job: Job<OnboardingCompleteJobData>): Promise<void>;
    processActivationReminder(job: Job): Promise<void>;
    private generateNextSteps;
}
