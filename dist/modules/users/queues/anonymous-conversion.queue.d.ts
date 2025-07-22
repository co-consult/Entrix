import { BullmqService } from '../../../shared/bullmq/bullmq.service';
import { LoggerService } from '../../../shared/logger/logger.service';
import { IncentiveType } from '../types/enums';
export interface ConversionInviteJobData {
    anonymousUserId: string;
    guestName: string;
    guestEmail: string;
    guestPhone?: string;
    onboardingKey: string;
    incentive: {
        type: IncentiveType;
        value: number;
        description: string;
    };
    purchaseContext?: {
        ticketIds?: string[];
        subscriptionIds?: string[];
        orderTotal?: number;
        eventName?: string;
    };
    campaignData?: {
        campaignId: string;
        campaignName: string;
        source: string;
    };
    expiresAt: Date;
    conversionUrl: string;
}
export interface ConversionReminderJobData {
    anonymousUserId: string;
    onboardingKey: string;
    reminderNumber: 1 | 2 | 3;
    originalData: ConversionInviteJobData;
    daysUntilExpiry: number;
}
export interface ConversionSuccessJobData {
    convertedUserId: string;
    originalAnonymousId: string;
    userEmail: string;
    userName: string;
    incentiveApplied: {
        type: IncentiveType;
        value: number;
        description: string;
    };
    migrationSummary: {
        ticketsMigrated: number;
        subscriptionsMigrated: number;
        ordersMigrated: number;
    };
    conversionTime: number;
    campaignData?: {
        campaignId: string;
        source: string;
    };
}
export interface ConversionAnalyticsJobData {
    anonymousUserId?: string;
    convertedUserId?: string;
    eventType: 'ANONYMOUS_CREATED' | 'INVITATION_SENT' | 'REMINDER_SENT' | 'CONVERSION_SUCCESSFUL' | 'CONVERSION_FAILED' | 'INVITATION_EXPIRED';
    campaignId?: string;
    incentiveType?: IncentiveType;
    conversionTime?: number;
    failureReason?: string;
    metadata?: Record<string, any>;
}
export declare class AnonymousConversionQueue {
    private readonly bullmq;
    private readonly logger;
    constructor(bullmq: BullmqService, logger: LoggerService);
    sendConversionInvite(data: ConversionInviteJobData): Promise<void>;
    private scheduleConversionReminders;
    sendConversionReminder(data: ConversionReminderJobData): Promise<void>;
    sendConversionSuccess(data: ConversionSuccessJobData): Promise<void>;
    processConversionExpiry(anonymousUserId: string, onboardingKey: string): Promise<void>;
    trackConversionEvent(data: ConversionAnalyticsJobData): Promise<void>;
    cancelConversionReminders(anonymousUserId: string): Promise<void>;
}
