import { BullmqService } from '../../../shared/bullmq/bullmq.service';
import { LoggerService } from '../../../shared/logger/logger.service';
import { BusinessEventType } from '../types/enums';
export interface UserEventJobData {
    userId: string;
    eventType: BusinessEventType;
    eventData: Record<string, any>;
    timestamp: Date;
    sessionId?: string;
    ipAddress?: string;
    userAgent?: string;
    metadata?: Record<string, any>;
}
export interface UserBehaviorJobData {
    userId: string;
    behaviorType: 'PAGE_VIEW' | 'BUTTON_CLICK' | 'FORM_SUBMISSION' | 'SEARCH' | 'FILTER_APPLIED';
    page?: string;
    element?: string;
    searchQuery?: string;
    filters?: Record<string, any>;
    duration?: number;
    timestamp: Date;
    sessionId: string;
    metadata?: Record<string, any>;
}
export interface UserEngagementJobData {
    userId: string;
    engagementType: 'EMAIL_OPENED' | 'EMAIL_CLICKED' | 'NOTIFICATION_VIEWED' | 'FEATURE_USED' | 'GOAL_COMPLETED';
    source: string;
    campaignId?: string;
    goalType?: string;
    value?: number;
    timestamp: Date;
    metadata?: Record<string, any>;
}
export interface GroupAnalyticsJobData {
    groupId: string;
    eventType: 'GROUP_CREATED' | 'MEMBER_ADDED' | 'MEMBER_REMOVED' | 'PURCHASE_MADE' | 'ROLE_CHANGED';
    userId?: string;
    memberCount?: number;
    purchaseAmount?: number;
    oldRole?: string;
    newRole?: string;
    timestamp: Date;
    metadata?: Record<string, any>;
}
export interface ConversionFunnelJobData {
    userId?: string;
    anonymousId?: string;
    funnelStep: 'ANONYMOUS_CREATED' | 'EMAIL_SENT' | 'EMAIL_OPENED' | 'LINK_CLICKED' | 'FORM_STARTED' | 'FORM_COMPLETED' | 'ACCOUNT_CREATED';
    funnelName: string;
    stepValue?: number;
    timestamp: Date;
    source?: string;
    campaignId?: string;
    metadata?: Record<string, any>;
}
export interface SegmentationJobData {
    userId: string;
    segmentType: 'DEMOGRAPHIC' | 'BEHAVIORAL' | 'ENGAGEMENT' | 'VALUE';
    segmentName: string;
    segmentValue: string | number;
    previousValue?: string | number;
    timestamp: Date;
    metadata?: Record<string, any>;
}
export declare class UserAnalyticsQueue {
    private readonly bullmq;
    private readonly logger;
    constructor(bullmq: BullmqService, logger: LoggerService);
    trackUserEvent(data: UserEventJobData): Promise<void>;
    trackUserBehavior(data: UserBehaviorJobData): Promise<void>;
    trackUserEngagement(data: UserEngagementJobData): Promise<void>;
    trackGroupAnalytics(data: GroupAnalyticsJobData): Promise<void>;
    trackConversionFunnel(data: ConversionFunnelJobData): Promise<void>;
    updateUserSegmentation(data: SegmentationJobData): Promise<void>;
    calculateUserMetrics(userId: string, force?: boolean): Promise<void>;
    generateUserReport(userId: string, reportType: 'DAILY' | 'WEEKLY' | 'MONTHLY', notifyEmail?: string): Promise<void>;
    cleanupOldAnalytics(retentionDays?: number): Promise<void>;
    syncExternalAnalytics(service: 'GOOGLE_ANALYTICS' | 'MIXPANEL' | 'AMPLITUDE', dataType: 'USERS' | 'EVENTS' | 'CONVERSIONS', batchSize?: number): Promise<void>;
}
