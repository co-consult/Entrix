import { BullmqService } from '../../../shared/bullmq/bullmq.service';
import { LoggerService } from '../../../shared/logger/logger.service';
export interface WelcomeJobData {
    userId: string;
    email: string;
    firstName: string;
    lastName: string;
    registrationSource?: string;
    metadata?: Record<string, any>;
}
export interface OnboardingCompleteJobData {
    userId: string;
    email: string;
    firstName: string;
    completionPercentage: number;
    incentiveApplied?: {
        type: string;
        value: number;
        description: string;
    };
    conversionData?: {
        fromAnonymous: boolean;
        originalOnboardingKey?: string;
    };
}
export declare class WelcomeQueue {
    private readonly bullmq;
    private readonly logger;
    constructor(bullmq: BullmqService, logger: LoggerService);
    sendWelcomeEmail(data: WelcomeJobData, delay?: number): Promise<void>;
    sendOnboardingCompleteEmail(data: OnboardingCompleteJobData): Promise<void>;
    scheduleActivationReminder(userId: string, email: string, firstName: string, reminderNumber: 1 | 2 | 3): Promise<void>;
    scheduleTipsEmail(userId: string, email: string, firstName: string): Promise<void>;
    cancelWelcomeJobs(userId: string): Promise<void>;
}
